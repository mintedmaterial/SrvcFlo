/**
 * Cloudflare Worker for Real-time Token Pricing
 * Fetches live prices from OpenOcean API to calculate dynamic token amounts
 * For $1 USDC equivalent in S/wS tokens based on current market price
 */

const OPENOCEAN_PRO_BASE_URL = 'https://open-api-pro.openocean.finance';

// Sonic Network Configuration
const SONIC_CHAIN_ID = '146'; // Sonic mainnet
const SONIC_TESTNET_CHAIN_ID = '57054'; // Sonic testnet

// Token addresses on Sonic
const TOKENS = {
  mainnet: {
    USDC: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894',
    wS: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
    S: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' // Native S token
  },
  testnet: {
    USDC: '0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6',
    wS: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
    S: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
  }
};

// Cache configuration
const CACHE_TTL = 30; // 30 seconds cache for prices (within 3 RPS limit)

// Security utilities
function validatePriceParams(amount, targetUSD = null) {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount) || numAmount <= 0 || numAmount > 1000000) {
    throw new Error('Invalid amount: must be a positive number less than 1,000,000');
  }
  
  if (targetUSD !== null) {
    const numTargetUSD = parseFloat(targetUSD);
    if (isNaN(numTargetUSD) || numTargetUSD <= 0 || numTargetUSD > 10000) {
      throw new Error('Invalid targetUSD: must be a positive number less than 10,000');
    }
    return { numAmount, numTargetUSD };
  }
  
  return { numAmount };
}

function validateTokenAndNetwork(network, token) {
  const allowedNetworks = ['mainnet', 'testnet'];
  const allowedTokens = ['S', 'wS', 'USDC'];
  
  if (!allowedNetworks.includes(network)) {
    throw new Error(`Invalid network: must be one of ${allowedNetworks.join(', ')}`);
  }
  
  if (!allowedTokens.includes(token)) {
    throw new Error(`Invalid token: must be one of ${allowedTokens.join(', ')}`);
  }
}

async function checkRateLimit(env, clientIP) {
  if (!env.PRICE_CACHE) return false;
  
  const currentMinute = Math.floor(Date.now() / 60000);
  const rateLimitKey = `rate_limit_${clientIP}_${currentMinute}`;
  
  const currentUsage = parseInt(await env.PRICE_CACHE.get(rateLimitKey) || '0');
  
  if (currentUsage >= 30) {
    return true; // Rate limited
  }
  
  await env.PRICE_CACHE.put(rateLimitKey, (currentUsage + 1).toString(), { expirationTtl: 60 });
  return false; // Not rate limited
}

function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For') || 
         request.headers.get('X-Real-IP') || 
         'unknown';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Secure CORS headers
    const origin = request.headers.get('Origin');
    const allowedOrigins = [
      'https://srvcflo.com',
      'https://www.srvcflo.com',
      'https://serviceflow-ai.pages.dev',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'https://srvcflo.com',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Check for required environment variables
    if (!env.OPENOCEAN_API_KEY) {
      return new Response(JSON.stringify({
        error: 'Service unavailable',
        message: 'Pricing service is temporarily unavailable'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      if (path === '/price/quote') {
        return await handlePriceQuote(request, env, corsHeaders);
      } else if (path === '/price/calculate') {
        return await handlePriceCalculate(request, env, corsHeaders);
      } else if (path === '/price/swap-amount') {
        return await handleSwapAmount(request, env, corsHeaders);
      } else if (path === '/price/health') {
        return await handleHealthCheck(request, env, corsHeaders);
      } else if (path === '/price/docs' || path === '/') {
        return await handleApiDocs(request, env, corsHeaders);
      } else {
        return new Response('Not Found', { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Get real-time token price quote from OpenOcean
 * /price/quote?network=mainnet&token=wS&amount=1
 */
async function handlePriceQuote(request, env, corsHeaders) {
  const url = new URL(request.url);
  const network = url.searchParams.get('network') || 'mainnet';
  const token = url.searchParams.get('token') || 'wS';
  const amount = url.searchParams.get('amount') || '1';

  const isTestnet = network === 'testnet';
  const chainId = isTestnet ? SONIC_TESTNET_CHAIN_ID : SONIC_CHAIN_ID;
  const tokens = isTestnet ? TOKENS.testnet : TOKENS.mainnet;

  // Rate limiting
  const clientIP = getClientIP(request);
  const isRateLimited = await checkRateLimit(env, clientIP);
  
  if (isRateLimited) {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again in a minute.',
      retryAfter: 60
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Input validation
  try {
    validateTokenAndNetwork(network, token);
    validatePriceParams(amount);
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Invalid input',
      message: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Sanitize cache key
  const roundedAmount = Math.round(parseFloat(amount) * 1000) / 1000;
  const cacheKey = `quote_${network}_${token}_${roundedAmount}`;
  
  if (env.PRICE_CACHE) {
    const cached = await env.PRICE_CACHE.get(cacheKey);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      if ((Date.now() - parsedCache.timestamp) < (CACHE_TTL * 1000)) {
        return new Response(JSON.stringify(parsedCache.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
  }

  try {
    const tokenAddress = tokens[token];
    if (!tokenAddress) {
      throw new Error(`Unsupported token: ${token}`);
    }

    // Convert amount to decimals (18 for S/wS, 6 for USDC)
    const decimals = token === 'USDC' ? 6 : 18;
    const amountDecimals = (parseFloat(amount) * Math.pow(10, decimals)).toString();

    // Get quote from OpenOcean: how much USDC for the given token amount
    const quoteUrl = `${OPENOCEAN_PRO_BASE_URL}/v4/${chainId}/quote` +
      `?inTokenAddress=${tokenAddress}` +
      `&outTokenAddress=${tokens.USDC}` +
      `&amountDecimals=${amountDecimals}` +
      `&gasPriceDecimals=1000000000` +
      `&slippage=1`;

    const response = await fetch(quoteUrl, {
      headers: {
        'apikey': env.OPENOCEAN_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenOcean API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== 200) {
      throw new Error(`OpenOcean API error: ${data.message || 'Unknown error'}`);
    }

    // Calculate USD value
    const outAmount = parseFloat(data.data.outAmount) / Math.pow(10, 6); // USDC has 6 decimals
    const inAmount = parseFloat(data.data.inAmount) / Math.pow(10, decimals);
    const pricePerToken = outAmount / inAmount; // USD per token

    const result = {
      network,
      token,
      amount: parseFloat(amount),
      priceUSD: pricePerToken,
      totalUSD: outAmount,
      timestamp: Date.now(),
      source: 'openocean',
      // User-friendly formatting
      display: {
        token: token === 'wS' ? 'Wrapped Sonic' : token === 'S' ? 'Sonic' : token,
        priceFormatted: `$${pricePerToken.toFixed(6)}`,
        totalFormatted: `$${outAmount.toFixed(2)}`,
        amountFormatted: `${parseFloat(amount).toLocaleString()} ${token}`,
        network: network === 'mainnet' ? 'Sonic Mainnet' : 'Sonic Testnet'
      }
    };

    // Cache the result
    if (env.PRICE_CACHE) {
      await env.PRICE_CACHE.put(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }), { expirationTtl: CACHE_TTL });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Price quote error:', error);
    
    // User-friendly error messages
    let userMessage = 'Unable to fetch current token price. Please try again.';
    if (error.message.includes('OpenOcean API error')) {
      userMessage = 'Pricing service is temporarily unavailable. Please try again in a moment.';
    } else if (error.message.includes('Unsupported token')) {
      userMessage = `${token} is not supported on ${network === 'mainnet' ? 'Sonic Mainnet' : 'Sonic Testnet'}.`;
    }
    
    return new Response(JSON.stringify({
      error: 'PRICE_FETCH_FAILED',
      message: userMessage,
      details: {
        network: network === 'mainnet' ? 'Sonic Mainnet' : 'Sonic Testnet',
        token: token === 'wS' ? 'Wrapped Sonic' : token === 'S' ? 'Sonic' : token,
        supportedTokens: ['S', 'wS', 'USDC']
      },
      timestamp: Date.now()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Calculate token amount needed for $1 USD equivalent
 * /price/calculate?network=mainnet&token=wS&targetUSD=1
 */
async function handlePriceCalculate(request, env, corsHeaders) {
  const url = new URL(request.url);
  const network = url.searchParams.get('network') || 'mainnet';
  const token = url.searchParams.get('token') || 'wS';
  const targetUSD = parseFloat(url.searchParams.get('targetUSD') || '1');

  // Rate limiting
  const clientIP = getClientIP(request);
  const isRateLimited = await checkRateLimit(env, clientIP);
  
  if (isRateLimited) {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again in a minute.',
      retryAfter: 60
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Input validation
  try {
    validateTokenAndNetwork(network, token);
    validatePriceParams('1', targetUSD.toString());
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Invalid input',
      message: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Sanitize cache key
  const roundedTargetUSD = Math.round(targetUSD * 100) / 100;
  const cacheKey = `calculate_${network}_${token}_${roundedTargetUSD}`;
  
  if (env.PRICE_CACHE) {
    const cached = await env.PRICE_CACHE.get(cacheKey);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      if ((Date.now() - parsedCache.timestamp) < (CACHE_TTL * 1000)) {
        return new Response(JSON.stringify(parsedCache.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
  }

  try {
    // First get current price per token
    const priceResponse = await handlePriceQuote(
      new Request(`${request.url.split('?')[0].replace('/calculate', '/quote')}?network=${network}&token=${token}&amount=1`),
      env,
      corsHeaders
    );
    
    const priceData = await priceResponse.json();
    
    if (priceData.error) {
      throw new Error(priceData.message);
    }

    const pricePerToken = priceData.priceUSD;
    const tokensNeeded = targetUSD / pricePerToken;

    // Calculate with proper decimals for smart contract
    const decimals = token === 'USDC' ? 6 : 18;
    const tokensNeededDecimals = Math.ceil(tokensNeeded * Math.pow(10, decimals));

    const result = {
      network,
      token,
      targetUSD,
      pricePerToken,
      tokensNeeded,
      tokensNeededDecimals: tokensNeededDecimals.toString(),
      decimals,
      timestamp: Date.now(),
      // User-friendly formatting
      display: {
        token: token === 'wS' ? 'Wrapped Sonic' : token === 'S' ? 'Sonic' : token,
        targetFormatted: `$${targetUSD.toFixed(2)}`,
        priceFormatted: `$${pricePerToken.toFixed(6)}`,
        tokensFormatted: `${tokensNeeded.toLocaleString(undefined, {maximumFractionDigits: 6})} ${token}`,
        network: network === 'mainnet' ? 'Sonic Mainnet' : 'Sonic Testnet',
        summary: `${tokensNeeded.toLocaleString(undefined, {maximumFractionDigits: 6})} ${token} ≈ $${targetUSD.toFixed(2)}`
      }
    };

    // Cache the result
    if (env.PRICE_CACHE) {
      await env.PRICE_CACHE.put(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }), { expirationTtl: CACHE_TTL });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Price calculation error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to calculate token amount',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get swap amounts for multiple tokens at once
 * /price/swap-amount?network=mainnet&imagePrice=1&videoPrice=2
 */
async function handleSwapAmount(request, env, corsHeaders) {
  const url = new URL(request.url);
  const network = url.searchParams.get('network') || 'mainnet';
  const imagePrice = parseFloat(url.searchParams.get('imagePrice') || '1');
  const videoPrice = parseFloat(url.searchParams.get('videoPrice') || '2');

  // Rate limiting
  const clientIP = getClientIP(request);
  const isRateLimited = await checkRateLimit(env, clientIP);
  
  if (isRateLimited) {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again in a minute.',
      retryAfter: 60
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Input validation
  try {
    validateTokenAndNetwork(network, 'wS'); // Validate network format
    validatePriceParams('1', imagePrice.toString());
    validatePriceParams('1', videoPrice.toString());
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Invalid input',
      message: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get token amounts for both S and wS for both image and video pricing
    const calculations = await Promise.all([
      // Image generation costs
      handlePriceCalculate(
        new Request(`${request.url.split('?')[0].replace('/swap-amount', '/calculate')}?network=${network}&token=wS&targetUSD=${imagePrice}`),
        env,
        corsHeaders
      ),
      handlePriceCalculate(
        new Request(`${request.url.split('?')[0].replace('/swap-amount', '/calculate')}?network=${network}&token=S&targetUSD=${imagePrice}`),
        env,
        corsHeaders
      ),
      // Video generation costs
      handlePriceCalculate(
        new Request(`${request.url.split('?')[0].replace('/swap-amount', '/calculate')}?network=${network}&token=wS&targetUSD=${videoPrice}`),
        env,
        corsHeaders
      ),
      handlePriceCalculate(
        new Request(`${request.url.split('?')[0].replace('/swap-amount', '/calculate')}?network=${network}&token=S&targetUSD=${videoPrice}`),
        env,
        corsHeaders
      )
    ]);

    const [imageWS, imageS, videoWS, videoS] = await Promise.all(
      calculations.map(resp => resp.json())
    );

    const result = {
      network,
      networkDisplay: network === 'mainnet' ? 'Sonic Mainnet' : 'Sonic Testnet',
      pricing: {
        image: {
          service: 'Image Generation',
          targetUSD: imagePrice,
          targetFormatted: `$${imagePrice.toFixed(2)}`,
          options: [
            {
              token: 'wS',
              tokenName: 'Wrapped Sonic',
              amount: imageWS.tokensNeeded,
              amountFormatted: `${imageWS.tokensNeeded.toLocaleString(undefined, {maximumFractionDigits: 4})} wS`,
              amountDecimals: imageWS.tokensNeededDecimals,
              pricePerToken: imageWS.pricePerToken,
              summary: `${imageWS.tokensNeeded.toLocaleString(undefined, {maximumFractionDigits: 4})} wS ≈ $${imagePrice.toFixed(2)}`
            },
            {
              token: 'S',
              tokenName: 'Sonic',
              amount: imageS.tokensNeeded,
              amountFormatted: `${imageS.tokensNeeded.toLocaleString(undefined, {maximumFractionDigits: 4})} S`,
              amountDecimals: imageS.tokensNeededDecimals,
              pricePerToken: imageS.pricePerToken,
              summary: `${imageS.tokensNeeded.toLocaleString(undefined, {maximumFractionDigits: 4})} S ≈ $${imagePrice.toFixed(2)}`
            }
          ]
        },
        video: {
          service: 'Video Generation',
          targetUSD: videoPrice,
          targetFormatted: `$${videoPrice.toFixed(2)}`,
          options: [
            {
              token: 'wS',
              tokenName: 'Wrapped Sonic',
              amount: videoWS.tokensNeeded,
              amountFormatted: `${videoWS.tokensNeeded.toLocaleString(undefined, {maximumFractionDigits: 4})} wS`,
              amountDecimals: videoWS.tokensNeededDecimals,
              pricePerToken: videoWS.pricePerToken,
              summary: `${videoWS.tokensNeeded.toLocaleString(undefined, {maximumFractionDigits: 4})} wS ≈ $${videoPrice.toFixed(2)}`
            },
            {
              token: 'S',
              tokenName: 'Sonic',
              amount: videoS.tokensNeeded,
              amountFormatted: `${videoS.tokensNeeded.toLocaleString(undefined, {maximumFractionDigits: 4})} S`,
              amountDecimals: videoS.tokensNeededDecimals,
              pricePerToken: videoS.pricePerToken,
              summary: `${videoS.tokensNeeded.toLocaleString(undefined, {maximumFractionDigits: 4})} S ≈ $${videoPrice.toFixed(2)}`
            }
          ]
        }
      },
      timestamp: Date.now(),
      cacheDuration: '30 seconds'
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Swap amount calculation error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to calculate swap amounts',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Health check endpoint
 * /price/health
 */
async function handleHealthCheck(request, env, corsHeaders) {
  const health = {
    status: 'healthy',
    timestamp: Date.now(),
    service: 'ServiceFlow AI Pricing API',
    version: '1.0.0',
    network: {
      mainnet: {
        chainId: SONIC_CHAIN_ID,
        supported: true
      },
      testnet: {
        chainId: SONIC_TESTNET_CHAIN_ID, 
        supported: true
      }
    },
    supportedTokens: ['S', 'wS', 'USDC'],
    services: ['Image Generation ($1)', 'Video Generation ($2)'],
    cacheStatus: {
      enabled: env.PRICE_CACHE ? true : false,
      ttl: `${CACHE_TTL} seconds`
    },
    dataSource: 'OpenOcean Pro API'
  };

  return new Response(JSON.stringify(health, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * API documentation endpoint
 * /price/docs or /
 */
async function handleApiDocs(request, env, corsHeaders) {
  const docs = {
    name: 'ServiceFlow AI Pricing API',
    description: 'Real-time token pricing for Sonic blockchain payments',
    version: '1.0.0',
    baseUrl: new URL(request.url).origin,
    endpoints: {
      health: {
        path: '/price/health',
        method: 'GET',
        description: 'API health status and configuration',
        example: `${new URL(request.url).origin}/price/health`
      },
      quote: {
        path: '/price/quote',
        method: 'GET',
        description: 'Get current token price in USD',
        parameters: {
          network: 'mainnet | testnet (default: mainnet)',
          token: 'S | wS | USDC (default: wS)',
          amount: 'number (default: 1)'
        },
        example: `${new URL(request.url).origin}/price/quote?network=testnet&token=wS&amount=100`
      },
      calculate: {
        path: '/price/calculate',
        method: 'GET',
        description: 'Calculate tokens needed for target USD amount',
        parameters: {
          network: 'mainnet | testnet (default: mainnet)',
          token: 'S | wS | USDC (default: wS)',
          targetUSD: 'number (default: 1)'
        },
        example: `${new URL(request.url).origin}/price/calculate?network=testnet&token=S&targetUSD=5`
      },
      swapAmount: {
        path: '/price/swap-amount',
        method: 'GET',
        description: 'Get pricing for image and video generation services',
        parameters: {
          network: 'mainnet | testnet (default: mainnet)',
          imagePrice: 'number in USD (default: 1)',
          videoPrice: 'number in USD (default: 2)'
        },
        example: `${new URL(request.url).origin}/price/swap-amount?network=testnet&imagePrice=1&videoPrice=2`
      }
    },
    supportedNetworks: {
      mainnet: {
        name: 'Sonic Mainnet',
        chainId: SONIC_CHAIN_ID
      },
      testnet: {
        name: 'Sonic Testnet',
        chainId: SONIC_TESTNET_CHAIN_ID
      }
    }
  };

  return new Response(JSON.stringify(docs, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}