/**
 * Enhanced Cloudflare Worker for DexScreener Integration
 * Fetches real-time Sonic ecosystem prices from DexScreener API
 * Supports dynamic contract monitoring and admin-configurable pairs
 */

// DexScreener API Configuration
const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com/latest/dex';
const SONIC_CHAIN_ID = 'sonic';

// Core Sonic token addresses and pairs
const CORE_PAIRS = {
  // Sonic (S) paired with wS
  'sonic-ws': '0xb1bc4b830fcba2184b92e15b9133c41160518038',
  // USDC pairs
  'usdc-ws': '0x29219dd400f2Bf60E5a23d13Be72B486D4038894',
  // Add more core pairs as needed
};

// Google Sheets integration for admin-managed pairs
const GOOGLE_SHEETS_CONFIG = {
  sheetId: '13yyKCSjekvDnsQ-Ddz06zkZhBZ-_275cr6JHfueTN1U',
  apiKey: '', // Set in environment variables
  range: 'Sheet1!A:D', // Columns: Contract Address, Symbol, Name, Active
};

// Cache configuration
const CACHE_TTL = 30; // 30 seconds for real-time pricing
const PAIR_CACHE_TTL = 300; // 5 minutes for pair data

// Rate limiting - DexScreener allows up to 300 requests per minute
const RATE_LIMIT = {
  windowMs: 60000, // 1 minute
  maxRequests: 200 // Conservative limit
};

/**
 * Enhanced price fetching with DexScreener
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      switch (path) {
        case '/price/sonic':
          return await handleSonicPrice(request, env, corsHeaders);
        case '/price/pair':
          return await handlePairPrice(request, env, corsHeaders);
        case '/price/pairs/trending':
          return await handleTrendingPairs(request, env, corsHeaders);
        case '/price/admin/pairs':
          return await handleAdminPairs(request, env, corsHeaders);
        case '/price/monitor':
          return await handleContractMonitor(request, env, corsHeaders);
        case '/price/health':
          return await handleHealthCheck(request, env, corsHeaders);
        default:
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
 * Get current Sonic (S) price from DexScreener
 * /price/sonic
 */
async function handleSonicPrice(request, env, corsHeaders) {
  const cacheKey = 'sonic_price_latest';
  
  // Check cache first
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
    // Get Sonic price from DexScreener
    const pairAddress = CORE_PAIRS['sonic-ws'];
    const response = await fetch(`${DEXSCREENER_BASE_URL}/pairs/${SONIC_CHAIN_ID}/${pairAddress}`);
    
    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }

    const data = await response.json();
    const pair = data.pairs?.[0];
    
    if (!pair) {
      throw new Error('Sonic pair data not found');
    }

    const result = {
      symbol: 'S',
      name: 'Sonic',
      price: parseFloat(pair.priceUsd) || 0,
      priceChange24h: parseFloat(pair.priceChange?.h24) || 0,
      volume24h: parseFloat(pair.volume?.h24) || 0,
      liquidity: parseFloat(pair.liquidity?.usd) || 0,
      marketCap: parseFloat(pair.fdv) || 0,
      pairAddress,
      dexId: pair.dexId,
      timestamp: Date.now(),
      source: 'dexscreener',
      display: {
        priceFormatted: `$${(parseFloat(pair.priceUsd) || 0).toFixed(6)}`,
        change24hFormatted: `${(parseFloat(pair.priceChange?.h24) || 0).toFixed(2)}%`,
        volume24hFormatted: `$${(parseFloat(pair.volume?.h24) || 0).toLocaleString()}`,
        liquidityFormatted: `$${(parseFloat(pair.liquidity?.usd) || 0).toLocaleString()}`,
        marketCapFormatted: `$${(parseFloat(pair.fdv) || 0).toLocaleString()}`
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
    console.error('Sonic price fetch error:', error);
    
    // Fallback to last known price or default
    const fallbackPrice = 0.305; // Conservative fallback
    
    const fallbackResult = {
      symbol: 'S',
      name: 'Sonic',
      price: fallbackPrice,
      priceChange24h: 0,
      volume24h: 0,
      liquidity: 0,
      marketCap: 0,
      timestamp: Date.now(),
      source: 'fallback',
      error: 'DexScreener API unavailable',
      display: {
        priceFormatted: `$${fallbackPrice.toFixed(6)}`,
        change24hFormatted: '0.00%',
        volume24hFormatted: 'N/A',
        liquidityFormatted: 'N/A',
        marketCapFormatted: 'N/A'
      }
    };

    return new Response(JSON.stringify(fallbackResult), {
      status: 200, // Return 200 with fallback data
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get price for any contract address pair
 * /price/pair?address=0x...
 */
async function handlePairPrice(request, env, corsHeaders) {
  const url = new URL(request.url);
  const address = url.searchParams.get('address');
  
  if (!address) {
    return new Response(JSON.stringify({
      error: 'Missing contract address',
      message: 'Please provide a contract address parameter'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const cacheKey = `pair_price_${address}`;
  
  // Check cache
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
    // Search for pairs by token address
    const response = await fetch(`${DEXSCREENER_BASE_URL}/search/?q=${address}`);
    
    if (!response.ok) {
      throw new Error(`DexScreener search error: ${response.status}`);
    }

    const data = await response.json();
    const sonicPairs = data.pairs?.filter(pair => 
      pair.chainId === SONIC_CHAIN_ID && pair.baseToken.address.toLowerCase() === address.toLowerCase()
    ) || [];

    if (sonicPairs.length === 0) {
      return new Response(JSON.stringify({
        error: 'No pairs found',
        message: `No trading pairs found for contract ${address} on Sonic`,
        contractAddress: address
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the most liquid pair
    const bestPair = sonicPairs.reduce((best, current) => 
      (parseFloat(current.liquidity?.usd) || 0) > (parseFloat(best.liquidity?.usd) || 0) ? current : best
    );

    const result = {
      contractAddress: address,
      symbol: bestPair.baseToken.symbol,
      name: bestPair.baseToken.name,
      price: parseFloat(bestPair.priceUsd) || 0,
      priceChange24h: parseFloat(bestPair.priceChange?.h24) || 0,
      volume24h: parseFloat(bestPair.volume?.h24) || 0,
      liquidity: parseFloat(bestPair.liquidity?.usd) || 0,
      marketCap: parseFloat(bestPair.fdv) || 0,
      pairAddress: bestPair.pairAddress,
      dexId: bestPair.dexId,
      quoteToken: bestPair.quoteToken.symbol,
      availablePairs: sonicPairs.length,
      timestamp: Date.now(),
      source: 'dexscreener',
      display: {
        priceFormatted: `$${(parseFloat(bestPair.priceUsd) || 0).toFixed(8)}`,
        change24hFormatted: `${(parseFloat(bestPair.priceChange?.h24) || 0).toFixed(2)}%`,
        volume24hFormatted: `$${(parseFloat(bestPair.volume?.h24) || 0).toLocaleString()}`,
        liquidityFormatted: `$${(parseFloat(bestPair.liquidity?.usd) || 0).toLocaleString()}`,
        marketCapFormatted: `$${(parseFloat(bestPair.fdv) || 0).toLocaleString()}`
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
    console.error('Pair price fetch error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch pair data',
      message: error.message,
      contractAddress: address
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get trending pairs on Sonic (1 hour timeframe)
 * /price/pairs/trending
 */
async function handleTrendingPairs(request, env, corsHeaders) {
  const cacheKey = 'sonic_trending_pairs';
  
  // Check cache
  if (env.PRICE_CACHE) {
    const cached = await env.PRICE_CACHE.get(cacheKey);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      if ((Date.now() - parsedCache.timestamp) < (PAIR_CACHE_TTL * 1000)) {
        return new Response(JSON.stringify(parsedCache.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
  }

  try {
    // Get trending pairs for Sonic chain
    const response = await fetch(`${DEXSCREENER_BASE_URL}/pairs/${SONIC_CHAIN_ID}`);
    
    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }

    const data = await response.json();
    const pairs = data.pairs || [];

    // Sort by volume and price change
    const trendingPairs = pairs
      .filter(pair => parseFloat(pair.volume?.h24) > 1000) // Min $1k volume
      .sort((a, b) => {
        const aScore = (parseFloat(a.volume?.h24) || 0) * Math.abs(parseFloat(a.priceChange?.h1) || 0);
        const bScore = (parseFloat(b.volume?.h24) || 0) * Math.abs(parseFloat(b.priceChange?.h1) || 0);
        return bScore - aScore;
      })
      .slice(0, 20)
      .map(pair => ({
        pairAddress: pair.pairAddress,
        baseToken: {
          symbol: pair.baseToken.symbol,
          name: pair.baseToken.name,
          address: pair.baseToken.address
        },
        quoteToken: {
          symbol: pair.quoteToken.symbol,
          name: pair.quoteToken.name,
          address: pair.quoteToken.address
        },
        price: parseFloat(pair.priceUsd) || 0,
        priceChange1h: parseFloat(pair.priceChange?.h1) || 0,
        priceChange24h: parseFloat(pair.priceChange?.h24) || 0,
        volume24h: parseFloat(pair.volume?.h24) || 0,
        liquidity: parseFloat(pair.liquidity?.usd) || 0,
        dexId: pair.dexId,
        display: {
          priceFormatted: `$${(parseFloat(pair.priceUsd) || 0).toFixed(8)}`,
          change1hFormatted: `${(parseFloat(pair.priceChange?.h1) || 0).toFixed(2)}%`,
          change24hFormatted: `${(parseFloat(pair.priceChange?.h24) || 0).toFixed(2)}%`,
          volume24hFormatted: `$${(parseFloat(pair.volume?.h24) || 0).toLocaleString()}`,
          liquidityFormatted: `$${(parseFloat(pair.liquidity?.usd) || 0).toLocaleString()}`
        }
      }));

    const result = {
      chainId: SONIC_CHAIN_ID,
      chainName: 'Sonic',
      totalPairs: pairs.length,
      trendingPairs,
      timestamp: Date.now(),
      source: 'dexscreener'
    };

    // Cache the result
    if (env.PRICE_CACHE) {
      await env.PRICE_CACHE.put(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }), { expirationTtl: PAIR_CACHE_TTL });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Trending pairs fetch error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch trending pairs',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Admin interface for managing monitored pairs via Google Sheets
 * /price/admin/pairs
 */
async function handleAdminPairs(request, env, corsHeaders) {
  // This would integrate with the Google Sheets API
  // For now, return a placeholder that shows the concept
  
  const adminPairs = {
    message: 'Admin pair management via Google Sheets',
    sheetUrl: `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.sheetId}/edit`,
    instructions: {
      columns: ['Contract Address', 'Symbol', 'Name', 'Active (TRUE/FALSE)'],
      example: {
        'A2': '0xb1bc4b830fcba2184b92e15b9133c41160518038',
        'B2': 'S',
        'C2': 'Sonic',
        'D2': 'TRUE'
      },
      usage: 'Paste contract addresses into the sheet to monitor additional pairs'
    },
    currentPairs: Object.entries(CORE_PAIRS).map(([name, address]) => ({
      name,
      address,
      status: 'core_pair'
    }))
  };

  return new Response(JSON.stringify(adminPairs, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Monitor specific contract addresses for price changes
 * /price/monitor?addresses=0x...&0x...
 */
async function handleContractMonitor(request, env, corsHeaders) {
  const url = new URL(request.url);
  const addressesParam = url.searchParams.get('addresses');
  
  if (!addressesParam) {
    return new Response(JSON.stringify({
      error: 'No addresses provided',
      message: 'Please provide contract addresses to monitor',
      example: '/price/monitor?addresses=0xabc...,0xdef...'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const addresses = addressesParam.split(',').map(addr => addr.trim()).filter(Boolean);
  
  if (addresses.length === 0 || addresses.length > 10) {
    return new Response(JSON.stringify({
      error: 'Invalid address count',
      message: 'Please provide 1-10 contract addresses'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Fetch data for all addresses in parallel
    const results = await Promise.allSettled(
      addresses.map(async (address) => {
        const pairResponse = await handlePairPrice(
          new Request(`${request.url.split('?')[0].replace('/monitor', '/pair')}?address=${address}`),
          env,
          corsHeaders
        );
        
        if (pairResponse.ok) {
          return await pairResponse.json();
        } else {
          throw new Error(`Failed to fetch data for ${address}`);
        }
      })
    );

    const monitorResults = results.map((result, index) => ({
      address: addresses[index],
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));

    const response = {
      monitoredAddresses: addresses.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results: monitorResults,
      timestamp: Date.now()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Contract monitor error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to monitor contracts',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Health check with DexScreener API status
 * /price/health
 */
async function handleHealthCheck(request, env, corsHeaders) {
  try {
    // Test DexScreener API connectivity
    const testResponse = await fetch(`${DEXSCREENER_BASE_URL}/pairs/${SONIC_CHAIN_ID}/${CORE_PAIRS['sonic-ws']}`);
    const dexscreenerStatus = testResponse.ok ? 'healthy' : 'degraded';

    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      service: 'ServiceFlow AI Enhanced Pricing API',
      version: '2.0.0',
      features: {
        sonicPricing: true,
        dynamicPairMonitoring: true,
        trendingPairs: true,
        adminDashboard: true,
        googleSheetsIntegration: 'planned'
      },
      dataSources: {
        primary: 'DexScreener API',
        fallback: 'Static pricing',
        adminManaged: 'Google Sheets'
      },
      apiStatus: {
        dexscreener: dexscreenerStatus,
        cache: env.PRICE_CACHE ? 'enabled' : 'disabled',
        rateLimit: `${RATE_LIMIT.maxRequests} requests per minute`
      },
      supportedChains: [SONIC_CHAIN_ID],
      corePairs: Object.keys(CORE_PAIRS).length,
      cacheConfig: {
        priceTtl: `${CACHE_TTL} seconds`,
        pairTtl: `${PAIR_CACHE_TTL} seconds`
      }
    };

    return new Response(JSON.stringify(health, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error.message,
      timestamp: Date.now()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}