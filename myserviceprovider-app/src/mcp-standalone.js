// Enhanced MCP Standalone with Web3, AI, and Blockchain Integration
// ServiceFlow AI Worker with Cloudflare Zero Trust Authentication, R2 Storage, and Sonic Blockchain

// Import Stripe for payment processing
import Stripe from 'stripe';

// Import INFT Agent Durable Object for compatibility
import { INFTAgentDurableObject } from './inft-agent-durable-object.js';
export { INFTAgentDurableObject };

// OpenOcean API Configuration for Real-time Token Pricing
const OPENOCEAN_PRO_BASE_URL = 'https://open-api-pro.openocean.finance';

// Web3 and Blockchain utilities
const SONIC_MAINNET_CHAIN_ID = 146; // Sonic mainnet
const SONIC_TESTNET_CHAIN_ID = 57054; // Sonic testnet
const SUPPORTED_CHAINS = {
  1: 'Ethereum Mainnet',
  137: 'Polygon',
  8453: 'Base',
  146: 'Sonic Mainnet',
  57054: 'Sonic Testnet',
  56: 'BNB Chain'
};

// Token addresses on Sonic (official addresses from Sonic docs)
const SONIC_TOKENS = {
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

// R2 bucket configuration
const R2_BUCKETS = {
  AI_CONTENT: 'serviceflow-ai-content',
  USER_UPLOADS: 'serviceflow-user-uploads',
  NFT_METADATA: 'serviceflow-nft-metadata'
};

// R2 Storage utilities
async function uploadToR2(env, bucketName, key, data, contentType = 'application/octet-stream', metadata = {}) {
  try {
    const bucket = env[bucketName];
    if (!bucket) {
      throw new Error(`R2 bucket ${bucketName} not configured`);
    }

    await bucket.put(key, data, {
      httpMetadata: {
        contentType: contentType,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        ...metadata
      }
    });

    // Return public URL for the uploaded file
    const publicUrl = `https://pub-${env.CLOUDFLARE_ACCOUNT_HASH}.r2.dev/${bucketName}/${key}`;
    return { success: true, url: publicUrl, key };
  } catch (error) {
    console.error('R2 upload error:', error);
    return { success: false, error: error.message };
  }
}

// Security utilities for input validation and rate limiting
function validatePriceParams(amount, targetUSD = null) {
  const numAmount = parseFloat(amount);
  
  // Validate amount parameter
  if (isNaN(numAmount) || numAmount <= 0 || numAmount > 1000000) {
    throw new Error('Invalid amount: must be a positive number less than 1,000,000');
  }
  
  // Validate targetUSD if provided
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

function sanitizeCacheKey(network, token, amount) {
  // Sanitize inputs and create safe cache key
  validateTokenAndNetwork(network, token);
  const { numAmount } = validatePriceParams(amount);
  
  // Round amount to prevent cache key proliferation
  const roundedAmount = Math.round(numAmount * 1000) / 1000;
  return `price_${network}_${token}_${roundedAmount}`;
}

async function checkRateLimit(env, clientIP) {
  if (!env.PRICE_CACHE) return false;
  
  const currentMinute = Math.floor(Date.now() / 60000);
  const rateLimitKey = `rate_limit_${clientIP}_${currentMinute}`;
  
  const currentUsage = parseInt(await env.PRICE_CACHE.get(rateLimitKey) || '0');
  
  // Allow 30 requests per minute per IP
  if (currentUsage >= 30) {
    return true; // Rate limited
  }
  
  // Increment usage
  await env.PRICE_CACHE.put(rateLimitKey, (currentUsage + 1).toString(), { expirationTtl: 60 });
  return false; // Not rate limited
}

function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For') || 
         request.headers.get('X-Real-IP') || 
         'unknown';
}

// Price calculation utilities using DexScreener API
async function getTokenPrice(env, network, token, amount = 1) {
  validateTokenAndNetwork(network, token);
  const { numAmount } = validatePriceParams(amount);
  const isTestnet = network === 'testnet';
  const chainId = isTestnet ? SONIC_TESTNET_CHAIN_ID : SONIC_MAINNET_CHAIN_ID;
  const tokens = isTestnet ? SONIC_TOKENS.testnet : SONIC_TOKENS.mainnet;
  const cacheKey = sanitizeCacheKey(network, token, numAmount);

  // Always try to get from KV first
  if (env.PRICE_CACHE) {
    const cached = await env.PRICE_CACHE.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      if ((Date.now() - data.timestamp) < 180000) {
        return data;
      }
    }
  }

  // Fetch fresh price from DexScreener API
  try {
    const tokenAddress = tokens[token];
    if (!tokenAddress) throw new Error(`Unsupported token: ${token}`);
    
    // DexScreener token-pairs API URL for Sonic network
    const chainName = 'sonic'; // Sonic chain identifier
    const dexscreenerUrl = `https://api.dexscreener.com/token-pairs/v1/${chainName}/${tokenAddress}`;
    const response = await fetch(dexscreenerUrl, {
      headers: {
        'User-Agent': 'ServiceFlow-AI/1.0',
        'Accept': '*/*'
      }
    });
    
    if (!response.ok) throw new Error(`DexScreener API error: ${response.status}`);
    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) throw new Error('No trading pairs found');
    
    // Find the best pair (highest liquidity and volume)
    const bestPair = data.pairs
      .filter(pair => pair.priceUsd && parseFloat(pair.priceUsd) > 0)
      .sort((a, b) => {
        const liquidityA = parseFloat(a.liquidity?.usd || '0');
        const liquidityB = parseFloat(b.liquidity?.usd || '0');
        const volumeA = parseFloat(a.volume?.h24 || '0');
        const volumeB = parseFloat(b.volume?.h24 || '0');
        
        // Prioritize by liquidity first, then volume
        if (liquidityA !== liquidityB) return liquidityB - liquidityA;
        return volumeB - volumeA;
      })[0];
    
    if (!bestPair || !bestPair.priceUsd) throw new Error('No valid price data found');
    
    const pricePerToken = parseFloat(bestPair.priceUsd);
    const totalUSD = pricePerToken * numAmount;
    
    const result = {
      network,
      token,
      amount: parseFloat(amount),
      priceUSD: pricePerToken,
      totalUSD: totalUSD,
      timestamp: Date.now(),
      source: 'dexscreener',
      pair: bestPair.pairAddress,
      liquidity: bestPair.liquidity?.usd || 0,
      volume24h: bestPair.volume?.h24 || 0,
      dex: bestPair.dexId || 'unknown'
    };
    
    if (env.PRICE_CACHE) {
      await env.PRICE_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 180 });
    }
    return result;
  } catch (error) {
    console.error('DexScreener price fetch error:', error);
    // Try backup with CoinGecko or other API if available
    try {
      // Backup: Try CoinGecko API for wS token
      if (token === 'wS') {
        const coinGeckoUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=wrapped-sonic&vs_currencies=usd';
        const cgResponse = await fetch(coinGeckoUrl);
        if (cgResponse.ok) {
          const cgData = await cgResponse.json();
          const price = cgData['wrapped-sonic']?.usd;
          if (price) {
            const result = {
              network,
              token,
              amount: parseFloat(amount),
              priceUSD: price,
              totalUSD: price * numAmount,
              timestamp: Date.now(),
              source: 'coingecko'
            };
            if (env.PRICE_CACHE) {
              await env.PRICE_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
            }
            return result;
          }
        }
      }
    } catch (backupError) {
      console.error('Backup price API also failed:', backupError);
    }
    
    throw new Error(`Unable to fetch price for ${token} on ${network}: ${error.message}`);
  }
}
export async function scheduled(event, env, ctx) {
  // Refresh wS price for mainnet and testnet
  for (const network of ['mainnet', 'testnet']) {
    try {
      await getTokenPrice(env, network, 'wS', 1);
    } catch (err) {
      console.error(`Scheduled price refresh failed for ${network}:`, err);
    }
  }
}

// Calculate how many tokens needed for a target USD amount
async function calculateTokensForUSD(env, network, token, targetUSD) {
  // Validate inputs first
  validateTokenAndNetwork(network, token);
  const { numTargetUSD } = validatePriceParams(1, targetUSD);
  
  const cacheKey = `calc_${network}_${token}_${numTargetUSD}`;
  
  if (env.PRICE_CACHE) {
    const cached = await env.PRICE_CACHE.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      if ((Date.now() - data.timestamp) < 30000) { // 30 second cache
        return data;
      }
    }
  }

  try {
    // Get current price per token
    const priceData = await getTokenPrice(env, network, token, 1);
    const pricePerToken = priceData.priceUSD;
    const tokensNeeded = numTargetUSD / pricePerToken;

    // Calculate with proper decimals for smart contract
    const decimals = token === 'USDC' ? 6 : 18;
    const tokensNeededDecimals = Math.ceil(tokensNeeded * Math.pow(10, decimals));

    const result = {
      network,
      token,
      targetUSD: numTargetUSD,
      pricePerToken,
      tokensNeeded,
      tokensNeededDecimals: tokensNeededDecimals.toString(),
      decimals,
      timestamp: Date.now()
    };

    // Cache the result
    if (env.PRICE_CACHE) {
      await env.PRICE_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 60 });
    }

    return result;

  } catch (error) {
    console.error('Token calculation error:', error);
    throw error;
  }
}

async function getFromR2(env, bucketName, key) {
  try {
    const bucket = env[bucketName];
    if (!bucket) {
      throw new Error(`R2 bucket ${bucketName} not configured`);
    }

    const object = await bucket.get(key);
    if (!object) {
      return { success: false, error: 'Object not found' };
    }

    return { 
      success: true, 
      data: await object.arrayBuffer(),
      metadata: object.customMetadata,
      httpMetadata: object.httpMetadata
    };
  } catch (error) {
    console.error('R2 get error:', error);
    return { success: false, error: error.message };
  }
}

async function deleteFromR2(env, bucketName, key) {
  try {
    const bucket = env[bucketName]; 
    if (!bucket) {
      throw new Error(`R2 bucket ${bucketName} not configured`);
    }

    await bucket.delete(key);
    return { success: true };
  } catch (error) {
    console.error('R2 delete error:', error);
    return { success: false, error: error.message };
  }
}

// Web3 and Blockchain utilities
async function validateWalletAddress(address) {
  // Basic Ethereum address validation
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address);
}

async function logBlockchainTransaction(env, userId, chainId, txHash, contractAddress, action, metadata = {}) {
  try {
    await env.DB.prepare(`
      INSERT INTO blockchain_transactions (
        user_id, chain_id, tx_hash, contract_address, action, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(userId, chainId, txHash, contractAddress, action, JSON.stringify(metadata)).run();
    
    return { success: true };
  } catch (error) {
    console.error('Error logging blockchain transaction:', error);
    return { success: false, error: error.message };
  }
}

async function getThirdwebContractEvents(env, contractAddress, chainId) {
  try {
    // This would integrate with Thirdweb SDK or direct RPC calls
    // For now, return mock structure
    return {
      success: true,
      events: [],
      contractAddress,
      chainId
    };
  } catch (error) {
    console.error('Error fetching contract events:', error);
    return { success: false, error: error.message };
  }
}

// AI Generation with R2 Storage
async function generateAndStoreAIContent(env, prompt, type = 'image', userId, walletAddress = null) {
  try {
    const taskId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let aiResult;

    // Use appropriate Cloudflare AI model based on type
    if (type === 'image') {
      // Try multiple models for better results
      const models = [
        '@cf/black-forest-labs/flux-1-schnell',
        '@cf/bytedance/stable-diffusion-xl-lightning',
        '@cf/lykon/dreamshaper-8-lcm'
      ];

      for (const model of models) {
        try {
          aiResult = await env.AI.run(model, { prompt });
          if (aiResult) break;
        } catch (modelError) {
          console.log(`Model ${model} failed, trying next:`, modelError.message);
        }
      }
    } else if (type === 'video') {
      // Video generation would use external API or future Cloudflare models
      aiResult = await generateVideoContent(env, prompt);
    }

    if (!aiResult) {
      throw new Error('All AI models failed to generate content');
    }

    // Convert AI result to buffer for R2 storage
    let contentBuffer;
    let contentType = 'image/jpeg';
    let fileExtension = 'jpg';

    if (aiResult instanceof ReadableStream) {
      const reader = aiResult.getReader();
      const chunks = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }
      
      contentBuffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        contentBuffer.set(chunk, offset);
        offset += chunk.length;
      }
    } else if (aiResult instanceof ArrayBuffer) {
      contentBuffer = new Uint8Array(aiResult);
    }

    if (type === 'video') {
      contentType = 'video/mp4';
      fileExtension = 'mp4';
    }

    // Generate unique key for R2 storage
    const r2Key = `generated/${type}s/${userId}/${taskId}.${fileExtension}`;
    
    // Upload to R2
    const uploadResult = await uploadToR2(
      env, 
      'AI_CONTENT', 
      r2Key, 
      contentBuffer, 
      contentType,
      {
        prompt,
        type,
        userId,
        walletAddress,
        generatedAt: new Date().toISOString()
      }
    );

    if (!uploadResult.success) {
      throw new Error(`R2 upload failed: ${uploadResult.error}`);
    }

    // Store generation record in database
    await env.DB.prepare(`
      INSERT INTO ai_generations (
        task_id, user_id, wallet_address, generation_type, prompt, 
        r2_key, public_url, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now'))
    `).bind(
      taskId, userId, walletAddress, type, prompt, 
      r2Key, uploadResult.url
    ).run();

    return {
      success: true,
      taskId,
      url: uploadResult.url,
      type,
      prompt
    };

  } catch (error) {
    console.error('AI generation and storage error:', error);
    return { success: false, error: error.message };
  }
}

async function generateVideoContent(env, prompt) {
  // This would integrate with external video generation APIs
  // For now, return a mock video buffer or URL
  return null;
}

// Authentication helper functions
async function verifyCloudflareAccess(request, env) {
  const accessJwt = request.headers.get('cf-access-jwt-assertion');
  const userEmail = request.headers.get('cf-access-authenticated-user-email');
  
  if (!accessJwt || !userEmail) {
    return null;
  }

  // Get user from database
  try {
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND status = "active"'
    ).bind(userEmail).first();
    
    return user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin: user.role === 'admin' || user.role === 'master_admin',
      isMasterAdmin: user.role === 'master_admin'
    } : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

async function verifySessionToken(token, env) {
  if (!token) return null;
  
  try {
    const session = await env.DB.prepare(`
      SELECT s.*, u.email, u.name, u.role, u.status 
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now') AND u.status = 'active'
    `).bind(token).first();
    
    if (session) {
      // Update last accessed
      await env.DB.prepare(
        'UPDATE user_sessions SET last_accessed = datetime("now") WHERE id = ?'
      ).bind(session.id).run();
      
      return {
        id: session.user_id,
        email: session.email,
        name: session.name,
        role: session.role,
        isAdmin: session.role === 'admin' || session.role === 'master_admin',
        isMasterAdmin: session.role === 'master_admin'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

async function getUserPermissions(userId, env) {
  try {
    const permissions = await env.DB.prepare(`
      SELECT permission 
      FROM user_permissions 
      WHERE user_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).bind(userId).all();
    
    return permissions.results.map(p => p.permission);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }
}

async function logAgentAccess(userId, agentType, action, query, env, requiresApproval = false) {
  try {
    const result = await env.DB.prepare(`
      INSERT INTO agent_access_logs (user_id, agent_type, action, query, requires_approval)
      VALUES (?, ?, ?, ?, ?)
    `).bind(userId, agentType, action, query, requiresApproval).run();
    
    return result.meta.last_row_id;
  } catch (error) {
    console.error('Error logging agent access:', error);
    return null;
  }
}

// Human in the Loop functionality
async function requiresApproval(agentType, action, user) {
  // Define actions that require approval
  const sensitiveActions = {
    'google': ['send_email', 'create_event', 'delete_event'],
    'srvcflo': ['business_strategy', 'competitive_analysis'],
    'x': ['post_tweet', 'send_dm'],
    'agno': ['deploy_code', 'system_changes']
  };
  
  const sensitive = sensitiveActions[agentType] || [];
  return sensitive.some(s => action.toLowerCase().includes(s));
}

async function createApprovalRequest(userId, agentType, actionType, requestDetails, env) {
  try {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    const result = await env.DB.prepare(`
      INSERT INTO approval_requests (user_id, agent_type, action_type, request_details, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      userId, 
      agentType, 
      actionType, 
      JSON.stringify(requestDetails), 
      expiresAt.toISOString()
    ).run();
    
    return result.meta.last_row_id;
  } catch (error) {
    console.error('Error creating approval request:', error);
    return null;
  }
}

async function checkApprovalStatus(requestId, env) {
  try {
    const request = await env.DB.prepare(
      'SELECT * FROM approval_requests WHERE id = ?'
    ).bind(requestId).first();
    
    if (!request) return null;
    
    // Check if expired
    if (new Date(request.expires_at) < new Date()) {
      await env.DB.prepare(
        'UPDATE approval_requests SET status = "expired" WHERE id = ?'
      ).bind(requestId).run();
      return { status: 'expired' };
    }
    
    return request;
  } catch (error) {
    console.error('Error checking approval status:', error);
    return null;
  }
}

// Enhanced backend agent calling with auth context
async function callServiceFlowAgent(message, userId, userRole, context = {}, requiresHumanApproval = false) {
  try {
    // Check if action requires approval
    if (requiresHumanApproval && userRole !== 'admin') {
      const requestId = await createApprovalRequest(
        userId, 
        'srvcflo', 
        'sensitive_action', 
        { message, context },
        // env would need to be passed in
      );
      
      if (requestId) {
        return {
          type: 'approval_required',
          requestId: requestId,
          message: 'This action requires admin approval. Please check your approval queue.',
          action: message
        };
      }
    }

    const response = await fetch('http://localhost:8000/srvcflo-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SRVCFLO_AGENT_TOKEN || 'default-token'}`
      },
      body: JSON.stringify({
        message: message,
        user_id: userId,
        context: {
          ...context,
          user_role: userRole,
          requires_approval: requiresHumanApproval
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        type: 'success',
        response: data.response,
        agent_used: data.agent_used
      };
    } else {
      throw new Error(data.error || 'Agent request failed');
    }
  } catch (error) {
    console.error('ServiceFlow Agent call error:', error);
    return {
      type: 'error',
      error: error.message,
      fallback: await handleGeneralAssistance(message, context)
    };
  }
}

// General ServiceFlow AI assistance using Cloudflare AI
async function handleGeneralAssistance(message, context = '', env) {
  try {
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content: `You are the ServiceFlow AI assistant. Help visitors learn about ServiceFlow AI.

Key information:
- AI automation platform for service businesses (contractors, salons, repair services, etc.)
- Provides 24/7 customer service, smart scheduling, lead qualification, business intelligence
- Over 500 businesses on waitlist
- Average 400% ROI for customers
- Pricing: Starter ($200/month), Professional ($600/month), Enterprise ($1000/month)

Keep responses focused on helping potential customers understand ServiceFlow AI.
${context ? `\nContext: ${context}` : ''}`
        },
        {
          role: 'user',
          content: message
        }
      ]
    });

    return response.response || "Hi! I'm the ServiceFlow AI assistant. I help service businesses learn about AI automation. How can I help you today?";
  } catch (error) {
    console.error('Cloudflare AI error:', error);
    return "Hi! I'm the ServiceFlow AI assistant. I help service businesses learn about AI automation. We provide 24/7 customer service, smart scheduling, and lead qualification. How can I help you today?";
  }
}

// CORS helper function
function addCORSHeaders(response, corsHeaders) {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

// Route protection middleware
function requireAuth(requiredRole = 'user') {
  return async function(request, env, user) {
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (requiredRole === 'admin' && user.role !== 'admin' && user.role !== 'master_admin') {
      return new Response(JSON.stringify({
        error: 'Admin access required',
        message: 'You need admin privileges to access this resource'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return null; // Continue processing
  };
}

// Permission check middleware
async function requirePermission(permission) {
  return async function(request, env, user) {
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Authentication required'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const permissions = await getUserPermissions(user.id, env);
    if (!permissions.includes(permission)) {
      return new Response(JSON.stringify({
        error: 'Insufficient permissions',
        message: `This action requires the '${permission}' permission`
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    return null; // Continue processing
  };
}

// Enhanced main request handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers (restricted to specific origins)
    const origin = request.headers.get('Origin');
    const allowedOrigins = [
      'https://srvcflo.com',
      'https://www.srvcflo.com',
      'https://serviceflow-ai.pages.dev', // Cloudflare Pages preview
      'http://localhost:3000', // Development
      'http://localhost:3001'  // Development
    ];
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'https://srvcflo.com',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, cf-access-jwt-assertion',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true'
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Get user authentication context
      let user = null;
      
      // Try Cloudflare Access first
      user = await verifyCloudflareAccess(request, env);
      
      // Fallback to session token
      if (!user) {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          user = await verifySessionToken(token, env);
        }
      }

      // Route handling with authentication
      switch (true) {
        // Public routes (no authentication required)
        case path === '/' && method === 'GET':
          // Serve static assets for home page - let it fall through to default case
          if (env.ASSETS) {
            try {
              const assetRequest = new Request(new URL('/index.html', url.origin).toString(), request);
              const response = await env.ASSETS.fetch(assetRequest);
              if (response.ok) {
                return addCORSHeaders(response, corsHeaders);
              }
            } catch (error) {
              console.error('Error serving home page:', error);
            }
          }
          // Fallback to JSON response if ASSETS not available
          return addCORSHeaders(await handleHomePage(request, env), corsHeaders);

        case path === '/generate' && method === 'GET':
          // For SPA routing, serve index.html for /generate route
          if (env.ASSETS) {
            try {
              const assetRequest = new Request(new URL('/index.html', url.origin).toString(), request);
              const response = await env.ASSETS.fetch(assetRequest);
              if (response.ok) {
                return addCORSHeaders(response, corsHeaders);
              }
            } catch (error) {
              console.error('Error serving generate page:', error);
            }
          }
          // Fallback to JSON response if ASSETS not available
          return addCORSHeaders(await handleGeneratePage(request, env), corsHeaders);
        // Admin routes - serve SPA for all admin paths
        case (path === '/admin' || path.startsWith('/admin/')) && method === 'GET':
          // For SPA routing, serve index.html for all admin routes
          if (env.ASSETS) {
            try {
              const assetRequest = new Request(new URL('/index.html', url.origin).toString(), request);
              const response = await env.ASSETS.fetch(assetRequest);
              if (response.ok) {
                return addCORSHeaders(response, corsHeaders);
              }
            } catch (error) {
              console.error('Error serving admin page:', error);
            }
          }
          // Fallback to JSON response if ASSETS not available  
          return addCORSHeaders(new Response(JSON.stringify({
            error: 'Admin page not available',
            message: 'Static assets not configured'
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }), corsHeaders);
        // Dashboard routes - serve SPA for all dashboard paths
        case (path === '/dashboard' || path.startsWith('/dashboard/')) && method === 'GET':
          // For SPA routing, serve index.html for all dashboard routes
          if (env.ASSETS) {
            try {
              const assetRequest = new Request(new URL('/index.html', url.origin).toString(), request);
              const response = await env.ASSETS.fetch(assetRequest);
              if (response.ok) {
                return addCORSHeaders(response, corsHeaders);
              }
            } catch (error) {
              console.error('Error serving dashboard page:', error);
            }
          }
          // Fallback to JSON response if ASSETS not available
          return addCORSHeaders(new Response(JSON.stringify({
            error: 'Dashboard page not available', 
            message: 'Static assets not configured'
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }), corsHeaders);

        case path === '/api/waitlist' && method === 'POST':
          return handleWaitlistSignup(request, env);

        case path === '/api/chat' && method === 'POST':
          return addCORSHeaders(await handlePublicChat(request, env), corsHeaders);

        case path === '/api/banking-chat' && method === 'POST':
          return addCORSHeaders(await handleBankingChatAPI(request, env), corsHeaders);

        case path.startsWith('/mcp/banking') && method === 'POST':
          return addCORSHeaders(await handleBankingMCPRequest(request, env), corsHeaders);

        case path.startsWith('/blog') && method === 'GET':
          return handleBlogRequest(request, env);

        // Price API routes (public - no authentication required)
        case path === '/api/price/quote' && method === 'GET':
          return addCORSHeaders(await handlePriceQuote(request, env), corsHeaders);

        case path === '/api/price/calculate' && method === 'GET':
          return addCORSHeaders(await handlePriceCalculate(request, env), corsHeaders);

        case path === '/api/price/swap-amount' && method === 'GET':
          return addCORSHeaders(await handleSwapAmount(request, env), corsHeaders);

        // Admin routes (require admin authentication)
        case path.startsWith('/dashboard') && method === 'GET':
        case path.startsWith('/api/admin'):
        case path.startsWith('/mcp'):
        case path.startsWith('/agent-builder'):
          const adminCheck = await requireAuth('admin')(request, env, user);
          if (adminCheck) return adminCheck;
          
          return handleAdminRoute(request, env, user);

        // Agent routes (require user authentication and permissions)
        case path.startsWith('/api/agents/'):
          const userCheck = await requireAuth('user')(request, env, user);
          if (userCheck) return userCheck;
          
          return handleAgentRoute(request, env, user);

        // Premium routes (require premium permissions)
        case path.startsWith('/portal'):
        case path.startsWith('/api/premium'):
          const premiumCheck = await requirePermission('premium_features')(request, env, user);
          if (premiumCheck) return premiumCheck;
          
          return handlePremiumRoute(request, env, user);

        // Authentication routes
        case path === '/api/auth/login' && method === 'POST':
          return addCORSHeaders(await handleLogin(request, env), corsHeaders);

        case path === '/api/auth/logout' && method === 'POST':
          return addCORSHeaders(await handleLogout(request, env, user), corsHeaders);

        case path === '/api/auth/user' && method === 'GET':
          return addCORSHeaders(await handleUserInfo(request, env, user), corsHeaders);

        case path === '/api/auth/quick-login' && method === 'GET':
          return handleQuickLogin(request, env);

        case path === '/api/auth/register' && method === 'POST':
          return addCORSHeaders(await handleUserRegistration(request, env), corsHeaders);

        // AI Generation Credit System Routes
        case path === '/api/credits/packages' && method === 'GET':
          return addCORSHeaders(await handleCreditPackages(request, env), corsHeaders);

        case path === '/api/credits/checkout' && method === 'POST':
          return addCORSHeaders(await handleStripeCheckout(request, env), corsHeaders);
          
        case path === '/api/credits/creem/checkout' && method === 'POST':
          return addCORSHeaders(await handleCreemCheckout(request, env), corsHeaders);
          
        case path === '/api/creem/webhook' && method === 'POST':
          return await handleCreemWebhook(request, env);

        case path === '/api/credits/mock-success' && method === 'GET':
          return handleMockSuccess(request, env);

        case path === '/api/credits/stripe-success' && method === 'GET':
          return handleStripeSuccess(request, env);

        case path === '/api/credits/stripe-webhook' && method === 'POST':
          return handleStripeWebhook(request, env);

        case path === '/api/credits/balance' && method === 'GET':
          return addCORSHeaders(await handleCreditBalance(request, env), corsHeaders);

        // AI Generation Routes
        case path === '/api/generate/image' && method === 'POST':
          return addCORSHeaders(await handleImageGeneration(request, env), corsHeaders);

        case path === '/api/generate/image/free' && method === 'POST':
          return addCORSHeaders(await handleFreeImageGeneration(request, env), corsHeaders);

        case path === '/api/generate/video' && method === 'POST':
          return addCORSHeaders(await handleVideoGeneration(request, env), corsHeaders);

        case path.startsWith('/api/generate/status/') && method === 'GET':
          const taskId = path.split('/').pop();
          return addCORSHeaders(await handleTaskStatus(request, env, taskId), corsHeaders);

        case path === '/api/generate/history' && method === 'GET':
          return addCORSHeaders(await handleGenerationHistory(request, env), corsHeaders);

        // Web3 and Blockchain Routes
        case path === '/api/web3/wallet/connect' && method === 'POST':
          return addCORSHeaders(await handleWalletConnect(request, env), corsHeaders);

        case path === '/api/web3/contract/events' && method === 'GET':
          return addCORSHeaders(await handleContractEvents(request, env), corsHeaders);

        case path === '/api/web3/nft/stake' && method === 'POST':
          return addCORSHeaders(await handleNFTStake(request, env), corsHeaders);

        case path === '/api/web3/sonic/payment' && method === 'POST':
          return addCORSHeaders(await handleSonicPayment(request, env), corsHeaders);

        case path === '/api/web3/transactions' && method === 'GET':
          return addCORSHeaders(await handleWeb3Transactions(request, env), corsHeaders);

        // Enhanced AI Generation with R2 Storage
        case path === '/api/generate/ai/enhanced' && method === 'POST':
          return addCORSHeaders(await handleEnhancedAIGeneration(request, env), corsHeaders);

        case path === '/api/generate/ai/r2-status' && method === 'GET':
          return addCORSHeaders(await handleR2StorageStatus(request, env), corsHeaders);

        // R2 Storage Management Routes
        case path === '/api/storage/upload' && method === 'POST':
          const uploadAuth = await requireAuth('user')(request, env, user);
          if (uploadAuth) return uploadAuth;
          return addCORSHeaders(await handleR2Upload(request, env, user), corsHeaders);

        case path.startsWith('/api/storage/') && method === 'GET':
          return addCORSHeaders(await handleR2Download(request, env), corsHeaders);

        case path.startsWith('/api/storage/') && method === 'DELETE':
          const deleteAuth = await requireAuth('user')(request, env, user);
          if (deleteAuth) return deleteAuth;
          return addCORSHeaders(await handleR2Delete(request, env, user), corsHeaders);

        // Admin KIE.AI Credits Route
        case path === '/api/admin/kie-credits' && method === 'GET':
          const creditsCheck = await requireAuth('admin')(request, env, user);
          if (creditsCheck) return creditsCheck;
          
          return addCORSHeaders(await handleKieAICredits(request, env), corsHeaders);

        // Human in the Loop approval routes
        case path === '/api/approvals' && method === 'GET':
          const approvalListCheck = await requireAuth('admin')(request, env, user);
          if (approvalListCheck) return approvalListCheck;
          
          return handleApprovalsList(request, env, user);

        case path.startsWith('/api/approvals/') && method === 'POST':
          const approvalCheck = await requireAuth('admin')(request, env, user);
          if (approvalCheck) return approvalCheck;
          
          return handleApprovalAction(request, env, user);

        // Sonic Price API
        case path === '/api/price/sonic-price' && method === 'GET':
          return handleSonicPrice(request, env);

        // User Stats API  
        case path === '/api/user/stats' && method === 'POST':
          return handleUserStats(request, env);

        // User Generations API
        case path === '/api/user/generations' && method === 'POST':
          return handleUserGenerations(request, env);

        // Cloudflare Free Generation API
        case path === '/api/generate/cloudflare-free' && method === 'POST':
          return handleCloudFlareFreeGeneration(request, env);

        // Credit-based Generation V2 API
        case path === '/api/generate/credit-based-v2' && method === 'POST':
          return handleCreditBasedGenerationV2(request, env);

        default:
          // Serve static assets for all non-API routes
          if (env.ASSETS) {
            try {
              // Try to get the asset from the static directory
              let assetRequest = new Request(url.toString(), request);
              let response = await env.ASSETS.fetch(assetRequest);
              
              // If the asset is not found and it's not an API route, serve index.html for SPA routing
              if (response.status === 404 && !path.startsWith('/api/')) {
                assetRequest = new Request(new URL('/', url.origin).toString(), request);
                response = await env.ASSETS.fetch(assetRequest);
              }
              
              // Add CORS headers to static assets
              if (response.ok) {
                const newResponse = new Response(response.body, {
                  status: response.status,
                  statusText: response.statusText,
                  headers: {
                    ...Object.fromEntries(response.headers.entries()),
                    ...corsHeaders
                  }
                });
                return newResponse;
              }
            } catch (error) {
              console.error('Asset serving error:', error);
            }
          }
          
          return new Response('Not Found', { 
            status: 404,
            headers: corsHeaders
          });
      }

    } catch (error) {
      console.error('Request handling error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};

// Route handlers
async function handleHomePage(request, env) {
  return new Response(JSON.stringify({
    message: 'Welcome to ServiceFlow AI',
    status: 'active',
    features: ['24/7 Customer Service', 'Smart Scheduling', 'Lead Qualification', 'Business Intelligence']
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleGeneratePage(request, env) {
  return new Response(JSON.stringify({
    message: 'ServiceFlow AI Generation Page',
    status: 'active',
    features: ['Image Generation', 'Video Generation', 'Free Tier Available'],
    endpoints: {
      freeImageGeneration: '/api/generate/image/free',
      paidImageGeneration: '/api/generate/image',
      videoGeneration: '/api/generate/video',
      creditPackages: '/api/credits/packages'
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleWaitlistSignup(request, env) {
  const data = await request.json();
  const { email, business_name, business_type } = data;

  try {
    // Insert into waitlist
    await env.DB.prepare(`
      INSERT INTO waitlist (email, business_name, business_type, status, created_at)
      VALUES (?, ?, ?, 'pending', datetime('now'))
    `).bind(email, business_name, business_type).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully added to waitlist'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to add to waitlist',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePublicChat(request, env) {
  const data = await request.json();
  const { message } = data;

  const response = await handleGeneralAssistance(message, '', env);
  
  return new Response(JSON.stringify({
    response: response,
    type: 'public_chat'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleAdminRoute(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Log admin access
  await logAgentAccess(user.id, 'admin', `admin_route_${path}`, path, env);

  if (path.startsWith('/api/admin/agents')) {
    return handleAgentManagement(request, env, user);
  }

  if (path.startsWith('/mcp')) {
    return handleMCPRequest(request, env, user);
  }

  return new Response(JSON.stringify({
    message: 'Admin dashboard access granted',
    user: user.name,
    permissions: await getUserPermissions(user.id, env)
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleAgentRoute(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;
  const agentType = path.split('/')[3]; // /api/agents/{type}

  // Check if user has permission for this agent type
  const permissions = await getUserPermissions(user.id, env);
  const requiredPermission = `${agentType}_agent`;
  
  if (!permissions.includes(requiredPermission)) {
    return new Response(JSON.stringify({
      error: 'Agent access denied',
      message: `You need the '${requiredPermission}' permission to use this agent`
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await request.json();
  const { message, context = {} } = data;

  // Log agent access
  await logAgentAccess(user.id, agentType, 'chat', message, env);

  // Check if requires approval
  const needsApproval = await requiresApproval(agentType, message, user);
  
  const response = await callServiceFlowAgent(
    message, 
    user.id, 
    user.role, 
    context, 
    needsApproval
  );

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleApprovalsList(request, env, user) {
  try {
    const pendingApprovals = await env.DB.prepare(`
      SELECT ar.*, u.name as user_name, u.email as user_email
      FROM approval_requests ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.status = 'pending' AND ar.expires_at > datetime('now')
      ORDER BY ar.created_at DESC
    `).all();

    return new Response(JSON.stringify({
      approvals: pendingApprovals.results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch approvals',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleApprovalAction(request, env, user) {
  const url = new URL(request.url);
  const requestId = url.pathname.split('/')[3];
  const data = await request.json();
  const { action, reason } = data; // 'approved' or 'rejected'

  try {
    await env.DB.prepare(`
      UPDATE approval_requests 
      SET status = ?, admin_id = ?, reason = ?, resolved_at = datetime('now')
      WHERE id = ?
    `).bind(action, user.id, reason, requestId).run();

    return new Response(JSON.stringify({
      success: true,
      message: `Request ${action} successfully`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to process approval',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Authentication route handlers
async function handleLogin(request, env) {
  const data = await request.json();
  const { email, password } = data;

  try {
    // Development accounts
    const devAccounts = {
      'serviceflowagi@gmail.com': {
        id: 1,
        email: 'serviceflowagi@gmail.com',
        name: 'ServiceFlow Master Admin',
        role: 'master_admin',
        status: 'active'
      },
      'dev-admin@serviceflow.local': {
        id: 2,
        email: 'dev-admin@serviceflow.local',
        name: 'Development Admin',
        role: 'admin',
        status: 'active'
      }
    };

    // Check development accounts first
    let user = devAccounts[email.toLowerCase()];
    
    if (!user) {
      // Try database lookup (with error handling)
      try {
        if (env.DB) {
          user = await env.DB.prepare(
            'SELECT * FROM users WHERE email = ? AND status = "active"'
          ).bind(email).first();
        }
      } catch (dbError) {
        console.log('Database not available, using dev accounts only');
      }
    }

    if (!user) {
      return new Response(JSON.stringify({
        error: 'Invalid credentials',
        message: 'User not found. Try: serviceflowagi@gmail.com or dev-admin@serviceflow.local'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For development, any password works (in production this would use proper OAuth)
    // Create session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Try to store session in database (optional)
    try {
      if (env.DB) {
        await env.DB.prepare(`
          INSERT INTO user_sessions (user_id, token, expires_at, ip_address, created_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `).bind(user.id, sessionToken, expiresAt.toISOString(), 'development').run();

        // Update last login
        await env.DB.prepare(
          'UPDATE users SET last_login = datetime("now") WHERE id = ?'
        ).bind(user.id).run();
      }
    } catch (dbError) {
      console.log('Session storage failed, continuing without database');
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.role === 'admin' || user.role === 'master_admin',
        isMasterAdmin: user.role === 'master_admin'
      },
      token: sessionToken,
      expiresAt: expiresAt.toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Login failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleLogout(request, env, user) {
  if (!user) {
    return new Response(JSON.stringify({
      error: 'Not logged in'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Delete the session
      await env.DB.prepare(
        'DELETE FROM user_sessions WHERE token = ?'
      ).bind(token).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Logged out successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Logout failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleUserInfo(request, env, user) {
  if (!user) {
    return new Response(JSON.stringify({
      error: 'Not authenticated',
      message: 'Please log in to view user information'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get fresh user data from database
    const freshUser = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ? AND status = "active"'
    ).bind(user.id).first();

    if (!freshUser) {
      return new Response(JSON.stringify({
        error: 'User not found',
        message: 'User account may have been deactivated'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user permissions
    const permissions = await getUserPermissions(freshUser.id, env);

    return new Response(JSON.stringify({
      user: {
        id: freshUser.id,
        email: freshUser.email,
        name: freshUser.name,
        role: freshUser.role,
        status: freshUser.status,
        isAdmin: freshUser.role === 'admin' || freshUser.role === 'master_admin',
        isMasterAdmin: freshUser.role === 'master_admin',
        lastLogin: freshUser.last_login,
        createdAt: freshUser.created_at
      },
      permissions: permissions,
      authenticated: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to get user info',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Missing admin function
async function handleAgentManagement(request, env, user) {
  return new Response(JSON.stringify({
    message: 'Agent management endpoint',
    user: user.name,
    role: user.role,
    agents: ['Google Agent', 'X Agent', 'ServiceFlow Agent', 'Agno Agent']
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Credit packages with both Stripe and Creem.io pricing
const CREDIT_PACKAGES = {
  'starter': { 
    price_usd: 5, 
    credits_fiat: 750, 
    credits_crypto: 900, // 20% bonus for crypto
    stripe_price_id: 'pending_creation',
    creem_product_id: 'prod_5gilhen0tIN6Aljqs7ZVIU'
  },
  'standard': { 
    price_usd: 50, 
    credits_fiat: 8000, 
    credits_crypto: 9600,
    stripe_price_id: 'pending_creation',
    creem_product_id: 'prod_cW5aw4nswIxTCKRlj07w7' // Will be updated when Creem products are created
  },
  'premium': { 
    price_usd: 500, 
    credits_fiat: 100000, 
    credits_crypto: 120000,
    stripe_price_id: 'pending_creation',
    creem_product_id: 'prod_7HJvDnYoCRdFWKwps4re0D' // Will be updated when Creem products are created
  },
  'enterprise': { 
    price_usd: 1250, 
    credits_fiat: 265000, 
    credits_crypto: 318000,
    stripe_price_id: 'pending_creation',
    creem_product_id: 'prod_DlnzRCjqKptRylMDmqzj5' // Will be updated when Creem products are created
  }
};

// Generation costs in credits (KIE.AI cost + 10% markup)
const GENERATION_COSTS = {
  // Video costs based on model and aspect ratio
  'video_veo3_16:9': Math.ceil(400 * 1.1),     // 440 credits (400 + 10%)
  'video_veo3_9:16': Math.ceil(430 * 1.1),     // 473 credits (430 + 10%)
  'video_veo3_fast_16:9': Math.ceil(80 * 1.1), // 88 credits (80 + 10%)
  'video_veo3_fast_9:16': Math.ceil(110 * 1.1), // 121 credits (110 + 10%)
  
  // Image costs based on number of variants
  'image_1': Math.ceil(6 * 1.1),  // 7 credits (6 + 10%)
  'image_2': Math.ceil(7 * 1.1),  // 8 credits (7 + 10%)
  'image_4': Math.ceil(8 * 1.1),  // 9 credits (8 + 10%)
  
  // Legacy fallback (will be removed)
  'video': 440,
  'image': 7
};

// Credit package purchase endpoints
async function handleCreditPackages(request, env) {
  return new Response(JSON.stringify({
    packages: CREDIT_PACKAGES,
    costs: GENERATION_COSTS
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Stripe checkout session creation
async function handleStripeCheckout(request, env) {
  try {
    const { packageId, userEmail } = await request.json();
    
    const packageData = CREDIT_PACKAGES[packageId];
    if (!packageData) {
      return new Response(JSON.stringify({ error: 'Invalid package' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if we have Stripe configured
    if (!env.STRIPE_SECRET_KEY) {
      // Fallback to mock for development
      const sessionId = 'mock_session_' + Date.now();
      return new Response(JSON.stringify({ 
        sessionId: sessionId,
        url: `${new URL(request.url).origin}/api/credits/mock-success?session=${sessionId}&package=${packageId}&email=${userEmail}`
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create real Stripe checkout session
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: packageData.stripe_price_id, // We'll need to create these in Stripe
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: userEmail,
      success_url: `${new URL(request.url).origin}/api/credits/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(request.url).origin}/generate?payment=cancelled`,
      metadata: {
        packageId: packageId,
        userEmail: userEmail,
        credits: packageData.credits_fiat.toString()
      }
    });
    
    return new Response(JSON.stringify({ 
      sessionId: session.id,
      url: session.url
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return new Response(JSON.stringify({ 
      error: 'Payment processing failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stripe success handler
async function handleStripeSuccess(request, env) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    
    if (!sessionId || !env.STRIPE_SECRET_KEY) {
      return new Response('Invalid session', { status: 400 });
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      return new Response(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #1e293b, #0f172a); color: white;">
            <div style="max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 16px;">
              <h1 style="color: #f97316;">🎉 Payment Successful!</h1>
              <p style="font-size: 18px;">Your credits will be added to your account shortly.</p>
              <p style="color: #94a3b8;">Session ID: ${sessionId}</p>
              <a href="/generate" style="display: inline-block; margin-top: 20px; background: linear-gradient(135deg, #f97316, #dc2626); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to AI Generation</a>
            </div>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    } else {
      return new Response('Payment not completed', { status: 400 });
    }
  } catch (error) {
    console.error('Stripe success handler error:', error);
    return new Response('Error processing payment confirmation', { status: 500 });
  }
}

// Stripe webhook handler for payment completion
async function handleStripeWebhook(request, env) {
  try {
    if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) {
      return new Response('Webhook not configured', { status: 400 });
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response('Invalid signature', { status: 400 });
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      if (session.payment_status === 'paid') {
        const { packageId, userEmail, credits } = session.metadata;
        
        // Add credits to user account
        await env.DB.prepare(`
          INSERT OR REPLACE INTO user_credits (email, credits, auth_method, updated_at)
          VALUES (?, COALESCE((SELECT credits FROM user_credits WHERE email = ?), 0) + ?, 'email', datetime('now'))
        `).bind(userEmail, userEmail, parseInt(credits)).run();

        // Record purchase in history
        await env.DB.prepare(`
          INSERT INTO purchase_history (user_email, package_id, payment_method, amount_usd, credits_purchased, stripe_session_id, status, created_at)
          VALUES (?, ?, 'stripe', ?, ?, ?, 'completed', datetime('now'))
        `).bind(
          userEmail, 
          packageId, 
          session.amount_total / 100, // Convert from cents
          credits, 
          session.id
        ).run();
        
        console.log(`Credits added: ${credits} credits to ${userEmail}`);
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
}

// Mock success handler for development
async function handleMockSuccess(request, env) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session');
    const packageId = url.searchParams.get('package');
    const userEmail = url.searchParams.get('email');
    
    const packageData = CREDIT_PACKAGES[packageId];
    if (!packageData || !userEmail) {
      return new Response('Invalid parameters', { status: 400 });
    }

    // Add credits to user account
    await env.DB.prepare(`
      INSERT OR REPLACE INTO user_credits (email, credits, auth_method, updated_at)
      VALUES (?, COALESCE((SELECT credits FROM user_credits WHERE email = ?), 0) + ?, 'email', datetime('now'))
    `).bind(userEmail, userEmail, packageData.credits_fiat).run();

    // Record purchase
    await env.DB.prepare(`
      INSERT INTO purchase_history (user_email, package_id, payment_method, amount_usd, credits_purchased, stripe_session_id, status, created_at)
      VALUES (?, ?, 'stripe', ?, ?, ?, 'completed', datetime('now'))
    `).bind(userEmail, packageId, packageData.price_usd, packageData.credits_fiat, sessionId).run();
    
    return new Response(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>✅ Payment Successful!</h1>
          <p>Added ${packageData.credits_fiat} credits to your account.</p>
          <a href="/generate" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to AI Generation</a>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Mock success error:', error);
    return new Response('Error processing payment', { status: 500 });
  }
}

// Creem.io checkout session creation
async function handleCreemCheckout(request, env) {
  try {
    const { packageId, userEmail, walletAddress, preferCrypto = true } = await request.json();
    
    const packageData = CREDIT_PACKAGES[packageId];
    if (!packageData) {
      return new Response(JSON.stringify({ error: 'Invalid package' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!packageData.creem_product_id || packageData.creem_product_id === 'pending_creation') {
      return new Response(JSON.stringify({ 
        error: 'Creem.io product not yet configured for this package',
        fallback: 'Please use Stripe checkout instead'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create Creem.io checkout session
    const checkout = await createCreemCheckout(
      packageData.creem_product_id,
      userEmail,
      {
        package_id: packageId,
        user_email: userEmail,
        wallet_address: walletAddress,
        credits: preferCrypto ? packageData.credits_crypto : packageData.credits_fiat,
        bonus_type: preferCrypto ? 'crypto_bonus' : 'standard'
      },
      env
    );

    return new Response(JSON.stringify({
      success: true,
      checkout_url: checkout.checkout_url,
      checkout_id: checkout.id,
      credits: preferCrypto ? packageData.credits_crypto : packageData.credits_fiat,
      bonus: preferCrypto ? '20% crypto bonus applied!' : null
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Creem checkout error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create Creem checkout',
      details: error.message,
      fallback: 'Please try Stripe checkout instead'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to create Creem.io checkout
async function createCreemCheckout(productId, customerEmail, metadata, env) {
  try {
    const response = await fetch('https://api.creem.io/v1/checkouts', {
      method: 'POST',
      headers: {
        'x-api-key': env.CREEM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: productId,
        metadata: {
          source: 'serviceflow_ai',
          user_email: customerEmail,
          ...metadata
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Creem API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Creem checkout creation failed:', error);
    throw error;
  }
}

// Creem.io webhook handler
async function handleCreemWebhook(request, env) {
  try {
    console.log('🔔 Creem webhook received');
    
    // Get the raw body for signature verification
    const rawBody = await request.text();
    
    // TODO: Implement signature verification when webhook secret is provided
    // const signature = request.headers.get('x-creem-signature');
    // if (!verifyCreemSignature(rawBody, signature, env.CREEM_WEBHOOK_SECRET)) {
    //   return new Response('Invalid signature', { status: 401 });
    // }
    
    const event = JSON.parse(rawBody);
    console.log(`📦 Event type: ${event.eventType}`, event.id);
    
    switch (event.eventType) {
      case 'checkout.completed':
        await handleCreemCheckoutCompleted(event, env);
        break;
        
      case 'subscription.paid':
        await handleCreemSubscriptionPaid(event, env);
        break;
        
      case 'subscription.canceled':
        await handleCreemSubscriptionCanceled(event, env);
        break;
        
      case 'refund.created':
        await handleCreemRefund(event, env);
        break;
        
      default:
        console.log(`⚠️ Unhandled Creem event type: ${event.eventType}`);
    }

    return new Response('OK', { status: 200 });
    
  } catch (error) {
    console.error('❌ Creem webhook error:', error);
    return new Response(`Webhook processing failed: ${error.message}`, { 
      status: 500 
    });
  }
}

// Handle Creem checkout completed event
async function handleCreemCheckoutCompleted(event, env) {
  try {
    const checkout = event.object;
    const customer = checkout.customer;
    const order = checkout.order;
    const metadata = checkout.metadata || {};
    
    console.log(`💳 Checkout completed for ${customer.email}`);
    
    // Extract credit information from metadata
    const packageId = metadata.package_id;
    const credits = parseInt(metadata.credits) || 0;
    const userEmail = metadata.user_email || customer.email;
    const walletAddress = metadata.wallet_address;
    const bonusType = metadata.bonus_type;
    
    if (!credits) {
      console.error('❌ No credits found in checkout metadata');
      return;
    }
    
    // Add credits to user account
    const identifier = userEmail || walletAddress;
    const identifierType = userEmail ? 'email' : 'wallet_address';
    
    if (identifier) {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO user_credits (
          email, wallet_address, credits, auth_method, updated_at
        ) VALUES (
          ?, ?, 
          COALESCE((SELECT credits FROM user_credits WHERE ${identifierType} = ?), 0) + ?, 
          ?, datetime('now')
        )
      `).bind(
        userEmail, 
        walletAddress,
        identifier,
        credits, 
        identifierType === 'email' ? 'email' : 'wallet'
      ).run();

      // Record purchase in history
      await env.DB.prepare(`
        INSERT INTO purchase_history (
          user_email, user_wallet, package_id, payment_method, 
          amount_usd, credits_purchased, creem_checkout_id, 
          status, created_at
        ) VALUES (?, ?, ?, 'creem', ?, ?, ?, 'completed', datetime('now'))
      `).bind(
        userEmail, 
        walletAddress, 
        packageId,
        order.amount / 100, // Convert from cents
        credits, 
        checkout.id
      ).run();
      
      console.log(`✅ Added ${credits} credits to ${identifier} (${bonusType || 'standard'})`);
    }
    
  } catch (error) {
    console.error('❌ Error handling Creem checkout:', error);
    throw error;
  }
}

// Handle Creem subscription paid event  
async function handleCreemSubscriptionPaid(event, env) {
  console.log('💰 Creem subscription payment received:', event.object.id);
  // For recurring subscriptions, you might want to add credits on each payment
  // This depends on your business model
}

// Handle Creem subscription canceled event
async function handleCreemSubscriptionCanceled(event, env) {
  console.log('🚫 Creem subscription canceled:', event.object.id);
  // Handle subscription cancellation logic here
}

// Handle Creem refund event
async function handleCreemRefund(event, env) {
  try {
    const refund = event.object;
    const subscription = refund.subscription;
    const customer = refund.customer;
    
    console.log(`💸 Refund created for ${customer.email}: ${refund.refund_amount}`);
    
    // You might want to deduct credits or handle refund logic here
    // This depends on your refund policy
    
  } catch (error) {
    console.error('❌ Error handling Creem refund:', error);
  }
}

// Credit balance check
async function handleCreditBalance(request, env) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('email');
    const walletAddress = url.searchParams.get('wallet');
    
    if (!userEmail && !walletAddress) {
      return new Response(JSON.stringify({ error: 'Email or wallet required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    let result;
    if (userEmail) {
      result = await env.DB.prepare(
        'SELECT credits FROM user_credits WHERE email = ?'
      ).bind(userEmail).first();
    } else {
      result = await env.DB.prepare(
        'SELECT credits FROM user_credits WHERE wallet_address = ?'
      ).bind(walletAddress).first();
    }
    
    const credits = result?.credits || 0;
    
    return new Response(JSON.stringify({ credits }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch balance' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Image generation handler
async function handleImageGeneration(request, env) {
  try {
    const { prompt, userEmail, model = 'gpt-4o' } = await request.json();
    
    if (!prompt || !userEmail) {
      return new Response(JSON.stringify({ error: 'Prompt and email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check user credits
    const creditCheck = await env.DB.prepare(
      'SELECT credits FROM user_credits WHERE email = ?'
    ).bind(userEmail).first();
    
    const userCredits = creditCheck?.credits || 0;
    const requiredCredits = GENERATION_COSTS.image;
    
    if (userCredits < requiredCredits) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits',
        required: requiredCredits,
        available: userCredits
      }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Deduct credits
    await env.DB.prepare(`
      UPDATE user_credits 
      SET credits = credits - ?, updated_at = datetime('now')
      WHERE email = ?
    `).bind(requiredCredits, userEmail).run();
    
    // Generate image using KIE.AI API
    const taskId = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Store generation request
    await env.DB.prepare(`
      INSERT INTO generation_history (task_id, user_email, generation_type, prompt, status, credits_used, created_at)
      VALUES (?, ?, 'image', ?, 'processing', ?, datetime('now'))
    `).bind(taskId, userEmail, prompt, requiredCredits).run();
    
    // For development: Use mock image generation to avoid using KIE.AI credits
    // TODO: Replace with real KIE.AI API call when payment system is ready
    const isProduction = env.ENVIRONMENT === 'production';
    
    if (isProduction && env.KIE_AI_API_KEY) {
      // Production: Call real KIE.AI 4o Image API
      try {
        const kieResponse = await fetch('https://api.kie.ai/api/v1/gpt4o-image/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.KIE_AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: prompt,
            size: '1:1',
            nVariants: 1,
            isEnhance: false,
            enableFallback: true,
            fallbackModel: 'FLUX_MAX'
          })
        });
        
        const kieData = await kieResponse.json();
        
        if (kieResponse.ok && kieData.code === 200 && kieData.data?.taskId) {
          await env.DB.prepare(`
            UPDATE generation_history 
            SET provider_task_id = ?
            WHERE task_id = ?
          `).bind(kieData.data.taskId, taskId).run();
          
          setTimeout(async () => {
            await pollKieImageStatus(env, taskId, kieData.data.taskId);
          }, 10000);
        } else {
          throw new Error('KIE.AI API failed');
        }
      } catch (error) {
        console.error('KIE.AI API error:', error);
        await env.DB.prepare(`
          UPDATE generation_history 
          SET status = 'failed', completed_at = datetime('now')
          WHERE task_id = ?
        `).bind(taskId).run();
      }
    } else {
      // Development: Use mock generation to preserve credits
      console.log('🚀 Development mode: Using mock image generation');
      
      setTimeout(async () => {
        try {
          const mockImageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}&text=${encodeURIComponent(prompt.substring(0, 20))}`;
          
          await env.DB.prepare(`
            UPDATE generation_history 
            SET status = 'completed', result_urls = ?, completed_at = datetime('now')
            WHERE task_id = ?
          `).bind(JSON.stringify([mockImageUrl]), taskId).run();
        } catch (error) {
          console.error('Error updating mock generation:', error);
        }
      }, 8000); // Simulate 8 second generation time
    }
    
    return new Response(JSON.stringify({
      success: true,
      taskId: taskId,
      message: 'Image generation started',
      estimatedTime: '10-30 seconds'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Image generation error:', error);
    return new Response(JSON.stringify({ error: 'Generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Video generation handler
async function handleVideoGeneration(request, env) {
  try {
    const { prompt, userEmail, model = 'veo3', aspectRatio = '16:9' } = await request.json();
    
    if (!prompt || !userEmail) {
      return new Response(JSON.stringify({ error: 'Prompt and email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check user credits
    const creditCheck = await env.DB.prepare(
      'SELECT credits FROM user_credits WHERE email = ?'
    ).bind(userEmail).first();
    
    const userCredits = creditCheck?.credits || 0;
    const requiredCredits = GENERATION_COSTS.video;
    
    if (userCredits < requiredCredits) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits',
        required: requiredCredits,
        available: userCredits
      }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Deduct credits
    await env.DB.prepare(`
      UPDATE user_credits 
      SET credits = credits - ?, updated_at = datetime('now')
      WHERE email = ?
    `).bind(requiredCredits, userEmail).run();
    
    // Generate video using KIE.AI API
    const taskId = 'vid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Store generation request
    await env.DB.prepare(`
      INSERT INTO generation_history (task_id, user_email, generation_type, prompt, status, credits_used, created_at)
      VALUES (?, ?, 'video', ?, 'processing', ?, datetime('now'))
    `).bind(taskId, userEmail, prompt, requiredCredits).run();
    
    // For development: Use mock video generation to avoid using KIE.AI credits
    // TODO: Replace with real KIE.AI API call when payment system is ready
    const isProduction = env.ENVIRONMENT === 'production';
    
    if (isProduction && env.KIE_AI_API_KEY) {
      // Production: Call real KIE.AI Veo3 API
      try {
        const kieResponse = await fetch('https://api.kie.ai/api/v1/veo/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.KIE_AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: prompt,
            model: model || 'veo3',
            aspectRatio: aspectRatio || '16:9'
          })
        });
        
        const kieData = await kieResponse.json();
        
        if (kieResponse.ok && kieData.code === 200 && kieData.data?.taskId) {
          await env.DB.prepare(`
            UPDATE generation_history 
            SET provider_task_id = ?
            WHERE task_id = ?
          `).bind(kieData.data.taskId, taskId).run();
          
          setTimeout(async () => {
            await pollKieVideoStatus(env, taskId, kieData.data.taskId);
          }, 30000);
        } else {
          throw new Error('KIE.AI API failed');
        }
      } catch (error) {
        console.error('KIE.AI API error:', error);
        await env.DB.prepare(`
          UPDATE generation_history 
          SET status = 'failed', completed_at = datetime('now')
          WHERE task_id = ?
        `).bind(taskId).run();
      }
    } else {
      // Development: Use mock video generation to preserve credits
      console.log('🚀 Development mode: Using mock video generation');
      
      setTimeout(async () => {
        try {
          const mockVideoUrl = `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4?prompt=${encodeURIComponent(prompt.substring(0, 20))}`;
          
          await env.DB.prepare(`
            UPDATE generation_history 
            SET status = 'completed', result_urls = ?, completed_at = datetime('now')
            WHERE task_id = ?
          `).bind(JSON.stringify([mockVideoUrl]), taskId).run();
        } catch (error) {
          console.error('Error updating mock generation:', error);
        }
      }, 15000); // Simulate 15 second generation time
    }
    
    return new Response(JSON.stringify({
      success: true,
      taskId: taskId,
      message: 'Video generation started',
      estimatedTime: '30-60 seconds'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Video generation error:', error);
    return new Response(JSON.stringify({ error: 'Generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Task status checker
async function handleTaskStatus(request, env, taskId) {
  if (!taskId) {
    return new Response(JSON.stringify({ error: 'Task ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const result = await env.DB.prepare(
      'SELECT * FROM generation_history WHERE task_id = ?'
    ).bind(taskId).first();
    
    if (!result) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const taskData = {
      id: result.task_id,
      status: result.status,
      type: result.generation_type,
      prompt: result.prompt,
      createdAt: result.created_at,
      completedAt: result.completed_at,
      creditsUsed: result.credits_used,
      result: result.result_urls ? JSON.parse(result.result_urls) : null
    };
    
    return new Response(JSON.stringify(taskData), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching task status:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Generation history
async function handleGenerationHistory(request, env) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('email');
    
    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const results = await env.DB.prepare(`
      SELECT task_id, generation_type, prompt, status, result_urls, credits_used, created_at, completed_at
      FROM generation_history 
      WHERE user_email = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).bind(userEmail).all();
    
    const generations = results.results.map(row => ({
      id: row.task_id,
      type: row.generation_type,
      prompt: row.prompt,
      status: row.status,
      result: row.result_urls ? JSON.parse(row.result_urls) : null,
      creditsUsed: row.credits_used,
      createdAt: row.created_at,
      completedAt: row.completed_at
    }));
    
    return new Response(JSON.stringify({ generations }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching generation history:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch history' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Blog request handler
async function handleBlogRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Simple blog content handler
  return new Response(JSON.stringify({
    message: 'ServiceFlow AI Blog',
    path: path,
    content: 'Blog content would be served here'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Premium route handler
async function handlePremiumRoute(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  return new Response(JSON.stringify({
    message: 'Premium features access',
    user: user.name,
    path: path,
    features: ['Advanced Analytics', 'Priority Support', 'Custom Integrations']
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// MCP request handler
async function handleMCPRequest(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Log MCP access
  await logAgentAccess(user.id, 'mcp', `mcp_access_${path}`, path, env);
  
  return new Response(JSON.stringify({
    message: 'MCP (Model Context Protocol) endpoint',
    user: user.name,
    path: path,
    available_tools: ['file_operations', 'database_queries', 'agent_coordination']
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// KIE.AI Image Status Polling
async function pollKieImageStatus(env, taskId, kieTaskId, attempts = 0) {
  const maxAttempts = 20; // Max 20 attempts (about 10 minutes)
  
  try {
    const response = await fetch(`https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId=${kieTaskId}`, {
      headers: {
        'Authorization': `Bearer ${env.KIE_AI_API_KEY}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.code === 200) {
      const status = data.data.status;
      
      if (status === 'SUCCESS') {
        // Update with successful result
        const resultUrls = data.data.response?.resultUrls || [];
        await env.DB.prepare(`
          UPDATE generation_history 
          SET status = 'completed', result_urls = ?, completed_at = datetime('now')
          WHERE task_id = ?
        `).bind(JSON.stringify(resultUrls), taskId).run();
      } else if (status === 'CREATE_TASK_FAILED' || status === 'GENERATE_FAILED') {
        // Update with failed status
        await env.DB.prepare(`
          UPDATE generation_history 
          SET status = 'failed', completed_at = datetime('now')
          WHERE task_id = ?
        `).bind(taskId).run();
      } else if (status === 'GENERATING' && attempts < maxAttempts) {
        // Still generating, try again in 30 seconds
        setTimeout(async () => {
          await pollKieImageStatus(env, taskId, kieTaskId, attempts + 1);
        }, 30000);
      } else {
        // Timeout or unknown status
        await env.DB.prepare(`
          UPDATE generation_history 
          SET status = 'failed', completed_at = datetime('now')
          WHERE task_id = ?
        `).bind(taskId).run();
      }
    }
  } catch (error) {
    console.error('Error polling KIE.AI image status:', error);
    if (attempts < maxAttempts) {
      setTimeout(async () => {
        await pollKieImageStatus(env, taskId, kieTaskId, attempts + 1);
      }, 30000);
    }
  }
}

// KIE.AI Video Status Polling
async function pollKieVideoStatus(env, taskId, kieTaskId, attempts = 0) {
  const maxAttempts = 20; // Max 20 attempts (about 10 minutes)
  
  try {
    const response = await fetch(`https://api.kie.ai/api/v1/veo/record-info?taskId=${kieTaskId}`, {
      headers: {
        'Authorization': `Bearer ${env.KIE_AI_API_KEY}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.code === 200) {
      const successFlag = data.data.successFlag;
      
      if (successFlag === 1) {
        // Success - extract video URLs
        const resultUrls = JSON.parse(data.data.response?.resultUrls || '[]');
        await env.DB.prepare(`
          UPDATE generation_history 
          SET status = 'completed', result_urls = ?, completed_at = datetime('now')
          WHERE task_id = ?
        `).bind(JSON.stringify(resultUrls), taskId).run();
      } else if (successFlag === 2 || successFlag === 3) {
        // Failed
        await env.DB.prepare(`
          UPDATE generation_history 
          SET status = 'failed', completed_at = datetime('now')
          WHERE task_id = ?
        `).bind(taskId).run();
      } else if (successFlag === 0 && attempts < maxAttempts) {
        // Still generating, try again in 30 seconds
        setTimeout(async () => {
          await pollKieVideoStatus(env, taskId, kieTaskId, attempts + 1);
        }, 30000);
      } else {
        // Timeout or unknown status
        await env.DB.prepare(`
          UPDATE generation_history 
          SET status = 'failed', completed_at = datetime('now')
          WHERE task_id = ?
        `).bind(taskId).run();
      }
    }
  } catch (error) {
    console.error('Error polling KIE.AI video status:', error);
    if (attempts < maxAttempts) {
      setTimeout(async () => {
        await pollKieVideoStatus(env, taskId, kieTaskId, attempts + 1);
      }, 30000);
    }
  }
}

// KIE.AI API Credits checker
async function handleKieAICredits(request, env) {
  const isProduction = env.ENVIRONMENT === 'production';
  
  if (!isProduction) {
    // Development mode - don't test actual API to preserve credits
    return new Response(JSON.stringify({
      success: true,
      provider: 'KIE.AI',
      mode: 'Development',
      status: 'Mock Generation Active',
      apiKeyPresent: !!env.KIE_AI_API_KEY,
      note: '🚀 Development mode: Using mock responses to preserve KIE.AI credits until payment system is ready.',
      dashboard: 'https://kie.ai/api-key',
      realGenerationCosts: {
        image: '~$0.02 per generation',
        video: '~$0.10 per generation'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Production mode - test actual API connection
  try {
    if (!env.KIE_AI_API_KEY) {
      return new Response(JSON.stringify({
        success: false,
        provider: 'KIE.AI',
        error: 'No API key configured',
        message: 'KIE_AI_API_KEY environment variable not set'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Test API key validity with minimal request
    const testResponse = await fetch('https://api.kie.ai/api/v1/gpt4o-image/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.KIE_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: "test",
        size: "1:1"
      })
    });
    
    const isValidKey = testResponse.status !== 401;
    
    return new Response(JSON.stringify({
      success: true,
      provider: 'KIE.AI',
      mode: 'Production',
      apiKeyValid: isValidKey,
      status: isValidKey ? 'Connected & Ready' : 'Invalid API Key',
      note: 'Production mode: Real KIE.AI API calls active. Monitor usage at dashboard.',
      dashboard: 'https://kie.ai/api-key'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('KIE.AI connection test error:', error);
    return new Response(JSON.stringify({
      success: false,
      provider: 'KIE.AI',
      mode: 'Production',
      error: 'Failed to connect to KIE.AI',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// User registration for regular accounts
async function handleUserRegistration(request, env) {
  try {
    const { email, name, loginMethod = 'email' } = await request.json();
    
    if (!email || !name) {
      return new Response(JSON.stringify({ error: 'Email and name required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user already exists
    let existingUser = null;
    try {
      if (env.DB) {
        existingUser = await env.DB.prepare(
          'SELECT * FROM users WHERE email = ?'
        ).bind(email).first();
      }
    } catch (dbError) {
      console.log('DB lookup failed, proceeding with registration');
    }

    if (existingUser) {
      // User exists, create session
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      try {
        if (env.DB) {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO user_sessions (user_id, token, expires_at, created_at)
            VALUES (?, ?, ?, datetime('now'))
          `).bind(existingUser.id, sessionToken, expiresAt.toISOString()).run();
        }
      } catch (sessionError) {
        console.log('Session creation failed, using temp token');
      }

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role || 'user'
        },
        token: sessionToken,
        message: 'Welcome back!'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create new regular user
    const userId = Date.now(); // Simple ID generation
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      name: name,
      role: 'user', // Regular user, not admin
      status: 'active',
      login_method: loginMethod,
      created_at: new Date().toISOString()
    };

    try {
      if (env.DB) {
        await env.DB.prepare(`
          INSERT INTO users (id, email, name, role, status, login_method, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          userId, 
          newUser.email, 
          newUser.name, 
          newUser.role, 
          newUser.status, 
          newUser.login_method, 
          newUser.created_at
        ).run();
        
        // Initialize user credits (give some free credits for new users)
        await env.DB.prepare(`
          INSERT OR REPLACE INTO user_credits (email, credits, updated_at)
          VALUES (?, 100, datetime('now'))
        `).bind(newUser.email).run();
      }
    } catch (dbError) {
      console.log('DB user creation failed, using temp account');
    }

    // Create session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    try {
      if (env.DB) {
        await env.DB.prepare(`
          INSERT INTO user_sessions (user_id, token, expires_at, created_at)
          VALUES (?, ?, ?, datetime('now'))
        `).bind(userId, sessionToken, expiresAt.toISOString()).run();
      }
    } catch (sessionError) {
      console.log('Session creation failed, using temp token');
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      },
      token: sessionToken,
      message: 'Account created successfully! You have 100 free credits to get started.'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('User registration error:', error);
    return new Response(JSON.stringify({ error: 'Registration failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Free image generation using Cloudflare AI
async function handleFreeImageGeneration(request, env) {
  try {
    const { prompt, userEmail } = await request.json();
    
    if (!prompt || !userEmail) {
      return new Response(JSON.stringify({ error: 'Prompt and email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // No credit check for free generation
    const taskId = 'free_img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Store generation request (skip if table doesn't exist)
    try {
      await env.DB.prepare(`
        INSERT INTO generation_history (task_id, user_email, generation_type, prompt, status, credits_used, created_at)
        VALUES (?, ?, 'image_free', ?, 'processing', 0, datetime('now'))
      `).bind(taskId, userEmail, prompt).run();
    } catch (dbError) {
      console.log('DB table not found, skipping history storage');
    }
    
    try {
      // Use Cloudflare AI text-to-image model (free)
      const aiResponse = await env.AI.run('@cf/bytedance/stable-diffusion-xl-lightning', {
        prompt: prompt
      });
      
      if (aiResponse) {
        // Cloudflare AI returns a ReadableStream for images
        let imageBuffer;
        if (aiResponse instanceof ReadableStream) {
          const reader = aiResponse.getReader();
          const chunks = [];
          let done = false;
          
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) chunks.push(value);
          }
          
          imageBuffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
          let offset = 0;
          for (const chunk of chunks) {
            imageBuffer.set(chunk, offset);
            offset += chunk.length;
          }
        } else if (aiResponse instanceof ArrayBuffer) {
          imageBuffer = new Uint8Array(aiResponse);
        } else {
          throw new Error('Unexpected response format from Cloudflare AI');
        }
        
        // Convert to base64
        const base64 = btoa(String.fromCharCode(...imageBuffer));
        const imageUrl = `data:image/jpeg;base64,${base64}`;
        
        try {
          await env.DB.prepare(`
            UPDATE generation_history 
            SET status = 'completed', result_urls = ?, completed_at = datetime('now')
            WHERE task_id = ?
          `).bind(JSON.stringify([imageUrl]), taskId).run();
        } catch (dbError) {
          console.log('DB update skipped');
        }
        
        return new Response(JSON.stringify({
          success: true,
          taskId: taskId,
          message: 'Free image generation completed',
          result: [imageUrl],
          tier: 'free'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        throw new Error('Cloudflare AI generation failed');
      }
    } catch (aiError) {
      console.error('Cloudflare AI error:', aiError);
      
      // Fallback to mock for free tier
      const mockImageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}&text=${encodeURIComponent(prompt.substring(0, 20))}`;
      
      try {
        await env.DB.prepare(`
          UPDATE generation_history 
          SET status = 'completed', result_urls = ?, completed_at = datetime('now')
          WHERE task_id = ?
        `).bind(JSON.stringify([mockImageUrl]), taskId).run();
      } catch (dbError) {
        console.log('DB update skipped');
      }
      
      return new Response(JSON.stringify({
        success: true,
        taskId: taskId,
        message: 'Free image generation completed (mock)',
        result: [mockImageUrl],
        tier: 'free'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Free image generation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Free generation failed',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Quick login for development
async function handleQuickLogin(request, env) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  
  if (!email) {
    return new Response('Email parameter required: /api/auth/quick-login?email=serviceflowagi@gmail.com', { status: 400 });
  }

  const devAccounts = {
    'serviceflowagi@gmail.com': {
      id: 1,
      email: 'serviceflowagi@gmail.com',
      name: 'ServiceFlow Master Admin',
      role: 'master_admin',
      status: 'active'
    },
    'dev-admin@serviceflow.local': {
      id: 2,
      email: 'dev-admin@serviceflow.local',
      name: 'Development Admin',
      role: 'admin',
      status: 'active'
    }
  };

  const user = devAccounts[email.toLowerCase()];
  if (!user) {
    return new Response('Invalid email. Use: serviceflowagi@gmail.com or dev-admin@serviceflow.local', { status: 400 });
  }

  // Create session token
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return new Response(`
    <html>
      <head><title>Quick Login</title></head>
      <body style="font-family: Arial; padding: 50px; background: #1a1a1a; color: white;">
        <h1>🔐 Development Login</h1>
        <p>Logged in as: <strong>${user.name}</strong></p>
        <p>Role: <strong>${user.role}</strong></p>
        <p>Email: <strong>${user.email}</strong></p>
        
        <script>
          localStorage.setItem('auth_token', '${sessionToken}');
          localStorage.setItem('user_info', JSON.stringify(${JSON.stringify({
            ...user,
            isAdmin: user.role === 'admin' || user.role === 'master_admin',
            isMasterAdmin: user.role === 'master_admin'
          })}));
          
          setTimeout(() => {
            window.location.href = '/generate';
          }, 2000);
        </script>
        
        <p>Redirecting to AI Generation page...</p>
        <p><a href="/generate" style="color: #4A90E2;">Click here if not redirected</a></p>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Web3 and Blockchain Route Handlers

async function handleWalletConnect(request, env) {
  try {
    const { walletAddress, chainId, signature, message } = await request.json();
    
    if (!walletAddress || !await validateWalletAddress(walletAddress)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid wallet address' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify signature if provided (for wallet ownership proof)
    if (signature && message) {
      // In production, verify the signature using Web3 libraries
      console.log('Signature verification would happen here');
    }

    // Check if wallet is already connected to a user
    let existingUser = await env.DB.prepare(
      'SELECT * FROM users WHERE wallet_address = ?'
    ).bind(walletAddress).first();

    if (existingUser) {
      // Update last login
      await env.DB.prepare(
        'UPDATE users SET last_login = datetime("now") WHERE id = ?'
      ).bind(existingUser.id).run();

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          walletAddress: existingUser.wallet_address,
          chainId: chainId || SONIC_CHAIN_ID
        },
        isNewUser: false
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create new user with wallet
    const userId = 'user_' + Date.now();
    await env.DB.prepare(`
      INSERT INTO users (
        id, wallet_address, name, status, role, auth_provider, 
        preferred_chain_id, created_at
      ) VALUES (?, ?, ?, 'active', 'user', 'wallet', ?, datetime('now'))
    `).bind(
      userId, 
      walletAddress, 
      `User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      chainId || SONIC_CHAIN_ID
    ).run();

    // Initialize with some free credits
    await env.DB.prepare(`
      INSERT INTO user_credits (email, wallet_address, credits, auth_method, updated_at)
      VALUES (NULL, ?, 50, 'wallet', datetime('now'))
    `).bind(walletAddress).run();

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userId,
        walletAddress,
        name: `User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        chainId: chainId || SONIC_CHAIN_ID,
        credits: 50
      },
      isNewUser: true,
      message: 'Wallet connected successfully! You have 50 free credits to start.'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Wallet connect error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to connect wallet',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleContractEvents(request, env) {
  try {
    const url = new URL(request.url);
    const contractAddress = url.searchParams.get('contract');
    const chainId = url.searchParams.get('chainId') || SONIC_CHAIN_ID;
    const limit = parseInt(url.searchParams.get('limit')) || 50;

    if (!contractAddress || !await validateWalletAddress(contractAddress)) {
      return new Response(JSON.stringify({ 
        error: 'Valid contract address required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get contract events from database
    const events = await env.DB.prepare(`
      SELECT * FROM blockchain_transactions 
      WHERE contract_address = ? AND chain_id = ?
      ORDER BY created_at DESC 
      LIMIT ?
    `).bind(contractAddress, chainId, limit).all();

    // Also fetch from Thirdweb if available
    const thirdwebEvents = await getThirdwebContractEvents(env, contractAddress, chainId);

    return new Response(JSON.stringify({
      success: true,
      contractAddress,
      chainId,
      events: events.results || [],
      thirdwebEvents: thirdwebEvents.events || [],
      supported: SUPPORTED_CHAINS[chainId] || 'Unknown Chain'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Contract events error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch contract events',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleNFTStake(request, env) {
  try {
    const { walletAddress, tokenId, contractAddress, chainId, txHash } = await request.json();
    
    if (!walletAddress || !await validateWalletAddress(walletAddress)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid wallet address' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user by wallet
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE wallet_address = ?'
    ).bind(walletAddress).first();

    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'User not found. Please connect wallet first.' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log the staking transaction
    await logBlockchainTransaction(
      env, 
      user.id, 
      chainId || SONIC_CHAIN_ID, 
      txHash, 
      contractAddress, 
      'nft_stake',
      { tokenId, walletAddress }
    );

    // Record NFT stake in database
    await env.DB.prepare(`
      INSERT INTO nft_stakes (
        user_id, wallet_address, contract_address, token_id, 
        chain_id, tx_hash, status, staked_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'))
    `).bind(
      user.id, walletAddress, contractAddress, tokenId,
      chainId || SONIC_CHAIN_ID, txHash
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'NFT staked successfully',
      stake: {
        tokenId,
        contractAddress,
        chainId: chainId || SONIC_CHAIN_ID,
        txHash,
        stakedAt: new Date().toISOString()
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('NFT stake error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to stake NFT',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleSonicPayment(request, env) {
  try {
    const { walletAddress, amount, recipient, txHash, serviceType } = await request.json();
    
    if (!walletAddress || !await validateWalletAddress(walletAddress)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid wallet address' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user by wallet
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE wallet_address = ?'
    ).bind(walletAddress).first();

    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'User not found. Please connect wallet first.' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log the payment transaction on Sonic
    await logBlockchainTransaction(
      env, 
      user.id, 
      SONIC_CHAIN_ID, 
      txHash, 
      recipient, 
      'sonic_payment',
      { amount, serviceType, walletAddress }
    );

    // Record payment in database
    await env.DB.prepare(`
      INSERT INTO sonic_payments (
        user_id, wallet_address, recipient_address, amount, 
        service_type, tx_hash, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'completed', datetime('now'))
    `).bind(
      user.id, walletAddress, recipient, amount, serviceType, txHash
    ).run();

    // If payment is for credits, add them to user account
    if (serviceType === 'credits') {
      const creditsToAdd = Math.floor(parseFloat(amount) * 100); // 1 token = 100 credits
      
      await env.DB.prepare(`
        UPDATE user_credits 
        SET credits = credits + ?, updated_at = datetime('now')
        WHERE wallet_address = ?
      `).bind(creditsToAdd, walletAddress).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Sonic payment processed successfully',
      payment: {
        amount,
        recipient,
        serviceType,
        txHash,
        chainId: SONIC_CHAIN_ID,
        creditsAdded: serviceType === 'credits' ? Math.floor(parseFloat(amount) * 100) : 0
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Sonic payment error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process Sonic payment',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleWeb3Transactions(request, env) {
  try {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('wallet');
    const chainId = url.searchParams.get('chainId');
    const limit = parseInt(url.searchParams.get('limit')) || 50;

    if (!walletAddress || !await validateWalletAddress(walletAddress)) {
      return new Response(JSON.stringify({ 
        error: 'Valid wallet address required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user by wallet
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE wallet_address = ?'
    ).bind(walletAddress).first();

    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'User not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build query based on filters
    let query = `
      SELECT * FROM blockchain_transactions 
      WHERE user_id = ?
    `;
    let params = [user.id];

    if (chainId) {
      query += ' AND chain_id = ?';
      params.push(chainId);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const transactions = await env.DB.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({
      success: true,
      walletAddress,
      transactions: transactions.results || [],
      user: {
        id: user.id,
        name: user.name,
        walletAddress: user.wallet_address
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Web3 transactions error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch Web3 transactions',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Enhanced AI Generation Handlers

async function handleEnhancedAIGeneration(request, env) {
  try {
    const { prompt, type = 'image', walletAddress, userEmail } = await request.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ 
        error: 'Prompt is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user by wallet or email
    let user;
    if (walletAddress) {
      if (!await validateWalletAddress(walletAddress)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid wallet address' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      user = await env.DB.prepare(
        'SELECT * FROM users WHERE wallet_address = ?'
      ).bind(walletAddress).first();
    } else if (userEmail) {
      user = await env.DB.prepare(
        'SELECT * FROM users WHERE email = ?'
      ).bind(userEmail).first();
    }

    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'User not found. Please connect wallet or login first.' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check user credits
    const creditCheck = await env.DB.prepare(`
      SELECT credits FROM user_credits 
      WHERE ${walletAddress ? 'wallet_address = ?' : 'email = ?'}
    `).bind(walletAddress || userEmail).first();
    
    const userCredits = creditCheck?.credits || 0;
    const requiredCredits = type === 'image' ? 10 : 50; // Higher quality costs more
    
    if (userCredits < requiredCredits) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits',
        required: requiredCredits,
        available: userCredits
      }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Deduct credits
    await env.DB.prepare(`
      UPDATE user_credits 
      SET credits = credits - ?, updated_at = datetime('now')
      WHERE ${walletAddress ? 'wallet_address = ?' : 'email = ?'}
    `).bind(requiredCredits, walletAddress || userEmail).run();

    // Generate and store AI content
    const result = await generateAndStoreAIContent(
      env, 
      prompt, 
      type, 
      user.id, 
      walletAddress
    );

    if (!result.success) {
      // Refund credits on failure
      await env.DB.prepare(`
        UPDATE user_credits 
        SET credits = credits + ?, updated_at = datetime('now')
        WHERE ${walletAddress ? 'wallet_address = ?' : 'email = ?'}
      `).bind(requiredCredits, walletAddress || userEmail).run();

      return new Response(JSON.stringify({ 
        error: 'AI generation failed',
        details: result.error
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      generation: result,
      creditsUsed: requiredCredits,
      remainingCredits: userCredits - requiredCredits
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Enhanced AI generation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Enhanced AI generation failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleR2StorageStatus(request, env) {
  try {
    // Check R2 bucket connectivity
    const buckets = ['AI_CONTENT', 'USER_UPLOADS', 'NFT_METADATA'];
    const bucketStatus = {};

    for (const bucketName of buckets) {
      try {
        const bucket = env[bucketName];
        if (bucket) {
          // Try to list objects (limited) to test connectivity
          await bucket.list({ limit: 1 });
          bucketStatus[bucketName] = 'connected';
        } else {
          bucketStatus[bucketName] = 'not_configured';
        }
      } catch (error) {
        bucketStatus[bucketName] = 'error: ' + error.message;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      r2Status: bucketStatus,
      publicUrlBase: `https://pub-${env.CLOUDFLARE_ACCOUNT_HASH}.r2.dev/`,
      buckets: R2_BUCKETS
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('R2 storage status error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to check R2 storage status',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// R2 Storage Management Handlers

async function handleR2Upload(request, env, user) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const bucketName = formData.get('bucket') || 'USER_UPLOADS';
    const isPublic = formData.get('public') === 'true';

    if (!file) {
      return new Response(JSON.stringify({ 
        error: 'No file provided' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique key
    const fileExtension = file.name.split('.').pop();
    const uniqueKey = `uploads/${user.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

    // Upload to R2
    const uploadResult = await uploadToR2(
      env,
      bucketName,
      uniqueKey,
      await file.arrayBuffer(),
      file.type,
      {
        originalName: file.name,
        userId: user.id,
        isPublic: isPublic.toString()
      }
    );

    if (uploadResult.success) {
      // Log upload in database
      await env.DB.prepare(`
        INSERT INTO file_uploads (
          user_id, r2_key, original_name, content_type, 
          bucket_name, public_url, is_public, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        user.id, uniqueKey, file.name, file.type,
        bucketName, uploadResult.url, isPublic
      ).run();
    }

    return new Response(JSON.stringify(uploadResult), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('R2 upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'File upload failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleR2Download(request, env) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const bucketName = pathParts[3]; // /api/storage/{bucket}/...
    const key = pathParts.slice(4).join('/'); // Remaining path

    if (!bucketName || !key) {
      return new Response(JSON.stringify({ 
        error: 'Bucket name and key required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await getFromR2(env, bucketName, key);
    
    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: result.error 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(result.data, {
      headers: {
        'Content-Type': result.httpMetadata.contentType || 'application/octet-stream',
        'Cache-Control': result.httpMetadata.cacheControl || 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('R2 download error:', error);
    return new Response(JSON.stringify({ 
      error: 'File download failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleR2Delete(request, env, user) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const bucketName = pathParts[3]; // /api/storage/{bucket}/...
    const key = pathParts.slice(4).join('/'); // Remaining path

    if (!bucketName || !key) {
      return new Response(JSON.stringify({ 
        error: 'Bucket name and key required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user owns this file (security check)
    const fileRecord = await env.DB.prepare(
      'SELECT * FROM file_uploads WHERE user_id = ? AND r2_key = ? AND bucket_name = ?'
    ).bind(user.id, key, bucketName).first();

    if (!fileRecord && user.role !== 'admin') {
      return new Response(JSON.stringify({ 
        error: 'File not found or access denied' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await deleteFromR2(env, bucketName, key);
    
    if (result.success && fileRecord) {
      // Remove from database
      await env.DB.prepare(
        'DELETE FROM file_uploads WHERE id = ?'
      ).bind(fileRecord.id).run();
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('R2 delete error:', error);
    return new Response(JSON.stringify({ 
      error: 'File deletion failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Price API Handler Functions
async function handlePriceQuote(request, env) {
  try {
    // Check rate limiting first
    const clientIP = getClientIP(request);
    const isRateLimited = await checkRateLimit(env, clientIP);
    
    if (isRateLimited) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again in a minute.',
        retryAfter: 60
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      });
    }

    const url = new URL(request.url);
    const network = url.searchParams.get('network') || 'mainnet';
    const token = url.searchParams.get('token') || 'wS';
    const amount = url.searchParams.get('amount') || '1';

    // DexScreener API doesn't require API key, proceed with pricing

    const result = await getTokenPrice(env, network, token, amount);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Price quote error:', error);
    
    // Return user-friendly error messages
    let errorMessage = 'Unable to fetch current price. Please try again.';
    let statusCode = 500;
    
    if (error.message.includes('Invalid')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes('OpenOcean')) {
      errorMessage = 'Price service temporarily unavailable. Please try again.';
      statusCode = 503;
    }
    
    return new Response(JSON.stringify({
      error: 'Price fetch failed',
      message: errorMessage
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePriceCalculate(request, env) {
  try {
    // Check rate limiting first
    const clientIP = getClientIP(request);
    const isRateLimited = await checkRateLimit(env, clientIP);
    
    if (isRateLimited) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again in a minute.',
        retryAfter: 60
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      });
    }

    const url = new URL(request.url);
    const network = url.searchParams.get('network') || 'mainnet';
    const token = url.searchParams.get('token') || 'wS';
    const targetUSD = url.searchParams.get('targetUSD') || '1';

    // DexScreener API doesn't require API key, proceed with pricing

    const result = await calculateTokensForUSD(env, network, token, targetUSD);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Price calculation error:', error);
    
    // Return user-friendly error messages
    let errorMessage = 'Unable to calculate token amount. Please try again.';
    let statusCode = 500;
    
    if (error.message.includes('Invalid')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes('OpenOcean')) {
      errorMessage = 'Price service temporarily unavailable. Please try again.';
      statusCode = 503;
    }
    
    return new Response(JSON.stringify({
      error: 'Calculation failed',
      message: errorMessage
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleSwapAmount(request, env) {
  try {
    // Check rate limiting first
    const clientIP = getClientIP(request);
    const isRateLimited = await checkRateLimit(env, clientIP);
    
    if (isRateLimited) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again in a minute.',
        retryAfter: 60
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      });
    }

    const url = new URL(request.url);
    const network = url.searchParams.get('network') || 'mainnet';
    const promptType = url.searchParams.get('type') || 'image'; // image, video
    const complexity = url.searchParams.get('complexity') || 'standard'; // simple, standard, complex
    
    // Validate network
    validateTokenAndNetwork(network, 'wS'); // Just validate network part

    // FLO token requirements per prompt type (FLO pegged to ~$1 USD)
    const floPrice = 1.00; // FLO target price $1.00
    
    // Base FLO costs for different generation types
    const floRequirements = {
      image: {
        simple: 0.25,      // Simple image generation: 0.25 FLO
        standard: 0.50,    // Standard image generation: 0.50 FLO  
        complex: 1.00,     // Complex image generation: 1.00 FLO
        premium: 2.00      // Premium image generation: 2.00 FLO
      },
      video: {
        simple: 2.00,      // Simple video generation: 2.00 FLO
        standard: 4.00,    // Standard video generation: 4.00 FLO
        complex: 8.00,     // Complex video generation: 8.00 FLO
        premium: 15.00     // Premium video generation: 15.00 FLO
      },
      // AI workflow steps (from tokenomics)
      workflow: {
        step: 0.01         // Each AI workflow step: 0.01 FLO
      }
    };
    
    let result = {
      network,
      promptType,
      complexity,
      tokenomics: 'FLO-based',
      floTokenPrice: floPrice,
      timestamp: Date.now()
    };

    if (promptType === 'image') {
      const requiredFLO = floRequirements.image[complexity] || floRequirements.image.standard;
      result.pricing = {
        type: 'Image Generation',
        complexity,
        requiredFLO,
        requiredUSD: requiredFLO * floPrice,
        description: `${complexity} image generation requires ${requiredFLO} FLO tokens (~$${(requiredFLO * floPrice).toFixed(2)} USD)`
      };
    } else if (promptType === 'video') {
      const requiredFLO = floRequirements.video[complexity] || floRequirements.video.standard;
      result.pricing = {
        type: 'Video Generation',
        complexity,
        requiredFLO,
        requiredUSD: requiredFLO * floPrice,
        description: `${complexity} video generation requires ${requiredFLO} FLO tokens (~$${(requiredFLO * floPrice).toFixed(2)} USD)`
      };
    } else if (promptType === 'workflow') {
      const steps = parseInt(url.searchParams.get('steps')) || 1;
      const requiredFLO = floRequirements.workflow.step * steps;
      result.pricing = {
        type: 'AI Workflow Execution',
        steps,
        requiredFLO,
        requiredUSD: requiredFLO * floPrice,
        description: `${steps} workflow steps require ${requiredFLO} FLO tokens (~$${(requiredFLO * floPrice).toFixed(2)} USD)`
      };
    }

    // Add all available options for reference
    result.availableOptions = {
      imageGeneration: floRequirements.image,
      videoGeneration: floRequirements.video,
      workflowExecution: floRequirements.workflow
    };

    // Add conversion info for Sonic tokens if requested
    const includeTokenConversion = url.searchParams.get('includeTokens') === 'true';
    if (includeTokenConversion) {
      try {
        // Get current FLO price in terms of wS and S tokens
        const floToWS = await getTokenPrice(env, network, 'wS', 1);
        const floToS = await getTokenPrice(env, network, 'S', 1);
        
        result.tokenConversion = {
          floToSonicTokens: {
            wS: {
              pricePerFLO: floToWS.priceUSD ? (1 / floToWS.priceUSD) : 'N/A',
              source: floToWS.source
            },
            S: {
              pricePerFLO: floToS.priceUSD ? (1 / floToS.priceUSD) : 'N/A', 
              source: floToS.source
            }
          }
        };
      } catch (error) {
        result.tokenConversion = { error: 'Unable to fetch Sonic token prices' };
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Swap amount calculation error:', error);
    
    // Return user-friendly error messages
    let errorMessage = 'Unable to calculate swap amounts. Please try again.';
    let statusCode = 500;
    
    if (error.message.includes('Invalid')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes('OpenOcean')) {
      errorMessage = 'Price service temporarily unavailable. Please try again.';
      statusCode = 503;
    }
    
    return new Response(JSON.stringify({
      error: 'Swap calculation failed',
      message: errorMessage
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Crypto Bank AI Chat Functions
async function handleBankingAssistance(message, context = '', userAddress = '', env) {
  try {
    const bankingPrompt = `You are an AI bank teller at Sonic Crypto Bank, specializing in BanditKidz NFT staking services.

Your personality:
- Professional but friendly banking service  
- Use banking terminology: "deposits", "interest rates", "withdrawals", "account"
- Excited about crypto and NFTs
- Knowledgeable about Sonic blockchain

Services you offer:
1. DEPOSIT SERVICES (Staking):
   - Help users stake their BanditKidz NFTs
   - Explain lock periods and interest rates:
     * No Lock: 100% base rate
     * 30 Days: 115% rate (+15% bonus)
     * 60 Days: 135% rate (+35% bonus)
     * 90 Days: 160% rate (+60% bonus) 
     * 120 Days: 190% rate (+90% bonus)
     * 365 Days: 250% rate (+150% bonus)
   - Warn about 10% early withdrawal penalty

2. WITHDRAWAL SERVICES (Rewards):
   - Help users claim earned interest/rewards
   - Assist with unstaking NFTs
   - Explain withdrawal processes

3. ACCOUNT MANAGEMENT:
   - Show current deposits (staked NFTs)
   - Display earning interest (pending rewards)
   - Provide account status and benefits

Always be helpful, use banking language, and guide users through the staking process step by step.
${context ? `\nAccount Context: ${context}` : ''}
${userAddress ? `\nAccount Holder: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : ''}`;

    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content: bankingPrompt
        },
        {
          role: 'user',
          content: message
        }
      ]
    });

    return response.response || "Welcome to Sonic Crypto Bank! I'm your AI teller, here to help you with BanditKidz NFT staking services. How can I assist you with your banking needs today?";
  } catch (error) {
    console.error('Cloudflare AI error:', error);
    return "Welcome to Sonic Crypto Bank! I'm your AI teller, here to help you with BanditKidz NFT staking services. We offer competitive interest rates on NFT deposits with flexible lock periods. How can I assist you today?";
  }
}

async function handleBankingMCPRequest(request, env) {
  try {
    const body = await request.json();
    
    // Handle tool calls
    if (body.method === 'tools/call') {
      const { name, arguments: args } = body.params;
      
      if (name === 'banking_assistance') {
        const result = await handleBankingAssistance(
          args.message, 
          args.context, 
          args.userAddress, 
          env
        );
        
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            content: [
              {
                type: "text",
                text: result
              }
            ]
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        error: { code: -32601, message: 'Tool not found' }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Handle tool list
    if (body.method === 'tools/list') {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          tools: [
            {
              name: 'banking_assistance',
              description: 'Get help with BanditKidz NFT staking and banking services',
              inputSchema: {
                type: 'object',
                properties: {
                  message: { type: 'string', description: 'User message about staking/banking' },
                  context: { type: 'string', description: 'Account context (staked NFTs, rewards, etc.)' },
                  userAddress: { type: 'string', description: 'User wallet address' }
                },
                required: ['message']
              }
            }
          ]
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle initialize
    if (body.method === 'initialize') {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'Sonic Crypto Bank AI Teller',
            version: '1.0.0'
          }
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: body.id,
      error: { code: -32601, message: 'Method not found' }
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('MCP request error:', error);
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32603, message: 'Internal error' }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleBankingChatAPI(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await request.json();
    const { message, user_address, context, banking_context } = data;
    
    if (!message) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Message is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prepare context for banking AI
    let fullContext = context || '';
    if (banking_context) {
      fullContext += `\nAccount Status: ${banking_context.stakedNFTs?.length || 0} NFTs deposited, ${banking_context.pendingRewards?.length || 0} pending rewards`;
    }

    const responseText = await handleBankingAssistance(message, fullContext, user_address, env);

    // Analyze intent for UI actions
    const intent = analyzeBankingIntent(responseText, message);

    return new Response(JSON.stringify({
      success: true,
      response: responseText,
      intent: intent,
      agent_used: 'Sonic Crypto Bank AI Teller',
      user_address: user_address || 'anonymous',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Banking Chat API error:', error);
    
    return new Response(JSON.stringify({
      success: true,
      response: "Welcome to Sonic Crypto Bank! I'm your AI teller here to help with BanditKidz NFT staking. We offer competitive interest rates with flexible lock periods. How can I assist you today?",
      agent_used: "Banking Fallback Handler",
      user_address: user_address || 'anonymous',
      timestamp: new Date().toISOString(),
      note: 'System temporarily unavailable'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function analyzeBankingIntent(assistantResponse, userMessage) {
  const response = assistantResponse.toLowerCase();
  const message = userMessage.toLowerCase();

  const intents = {
    wantsToStake: /stake|deposit|lock|earn interest|put.*nft/i.test(message),
    wantsToUnstake: /unstake|withdraw.*nft|get.*nft.*back|unlock/i.test(message),
    wantsToClaim: /claim|withdraw.*reward|cash out|get.*interest|collect.*earning/i.test(message),
    askingAboutRates: /rate|interest|bonus|percent|lock period|term/i.test(message),
    checkingAccount: /balance|account|status|what.*have|how much|my.*nft/i.test(message)
  };

  let primaryIntent = 'general';
  const suggestedActions = [];

  if (intents.wantsToStake) {
    primaryIntent = 'stake';
    suggestedActions.push({ action: 'openDeposit', label: 'Visit Deposit Teller' });
  } else if (intents.wantsToClaim) {
    primaryIntent = 'claim';
    suggestedActions.push({ action: 'openWithdraw', label: 'Visit Withdrawal Teller' });
  } else if (intents.checkingAccount) {
    primaryIntent = 'account';
    suggestedActions.push({ action: 'showAccount', label: 'View Account Overview' });
  }

  return {
    primary: primaryIntent,
    confidence: 0.8,
    suggestedActions: suggestedActions
  };
}

// Missing API Handler Functions

// Sonic Price API Handler
async function handleSonicPrice(request, env) {
  try {
    // Cache configuration
    const CACHE_TTL = 30000; // 30 seconds
    const cacheKey = 'sonic-price-cache';
    
    // Try to get from KV cache first
    let cachedPrice = null;
    if (env.SERVICEFLOW_KV) {
      try {
        const cached = await env.SERVICEFLOW_KV.get(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          if ((Date.now() - data.timestamp) < CACHE_TTL) {
            return addCORSHeaders(new Response(JSON.stringify({
              symbol: 'S',
              name: 'Sonic',
              price: data.price,
              source: 'cache',
              timestamp: data.timestamp,
              display: {
                priceFormatted: `$${data.price.toFixed(6)}`,
                network: 'Sonic Mainnet'
              }
            }), { headers: { 'Content-Type': 'application/json' } }), corsHeaders);
          }
        }
      } catch (cacheError) {
        console.warn('Cache read error:', cacheError);
      }
    }

    // Fetch from DexScreener
    const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com/latest/dex';
    const SONIC_CHAIN_ID = 'sonic';
    const SONIC_WS_PAIR = '0xb1bc4b830fcba2184b92e15b9133c41160518038';

    try {
      const response = await fetch(`${DEXSCREENER_BASE_URL}/pairs/${SONIC_CHAIN_ID}/${SONIC_WS_PAIR}`, {
        headers: { 'User-Agent': 'ServiceFlow-AI/1.0' }
      });

      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status}`);
      }

      const data = await response.json();
      const pair = data.pairs?.[0];

      if (!pair || !pair.priceUsd) {
        throw new Error('Invalid pair data from DexScreener');
      }

      const price = parseFloat(pair.priceUsd);
      
      // Update cache
      if (env.SERVICEFLOW_KV) {
        try {
          await env.SERVICEFLOW_KV.put(cacheKey, JSON.stringify({
            price,
            timestamp: Date.now()
          }), { expirationTtl: 300 }); // 5 minute expiration
        } catch (cacheError) {
          console.warn('Cache write error:', cacheError);
        }
      }

      return addCORSHeaders(new Response(JSON.stringify({
        symbol: 'S',
        name: 'Sonic',
        price,
        priceChange24h: parseFloat(pair.priceChange?.h24) || 0,
        volume24h: parseFloat(pair.volume?.h24) || 0,
        liquidity: parseFloat(pair.liquidity?.usd) || 0,
        pairAddress: SONIC_WS_PAIR,
        dexId: pair.dexId,
        source: 'dexscreener',
        timestamp: Date.now(),
        display: {
          priceFormatted: `$${price.toFixed(6)}`,
          change24hFormatted: `${(parseFloat(pair.priceChange?.h24) || 0).toFixed(2)}%`,
          volume24hFormatted: `$${(parseFloat(pair.volume?.h24) || 0).toLocaleString()}`,
          liquidityFormatted: `$${(parseFloat(pair.liquidity?.usd) || 0).toLocaleString()}`,
          network: 'Sonic Mainnet'
        }
      }), { headers: { 'Content-Type': 'application/json' } }), corsHeaders);

    } catch (dexError) {
      console.error('DexScreener error:', dexError);
      
      // Fallback price
      const fallbackPrice = 0.305;
      
      return addCORSHeaders(new Response(JSON.stringify({
        symbol: 'S',
        name: 'Sonic',
        price: fallbackPrice,
        source: 'fallback',
        timestamp: Date.now(),
        error: 'External APIs unavailable',
        display: {
          priceFormatted: `$${fallbackPrice.toFixed(6)}`,
          network: 'Sonic Mainnet'
        }
      }), { headers: { 'Content-Type': 'application/json' } }), corsHeaders);
    }

  } catch (error) {
    console.error('Sonic price API error:', error);
    
    return addCORSHeaders(new Response(JSON.stringify({
      error: 'Failed to fetch Sonic price',
      message: error.message,
      price: 0.305,
      source: 'emergency_fallback',
      timestamp: Date.now()
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' }
    }), corsHeaders);
  }
}

// User Stats API Handler
async function handleUserStats(request, env) {
  try {
    const body = await request.json();
    const { userAddress } = body;

    if (!userAddress) {
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: 'User address required'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), corsHeaders);
    }

    // Mock user stats for now
    const mockStats = {
      success: true,
      stats: {
        totalGenerationsCreated: 5,
        totalUpvotesReceived: 12,
        leaderboardPoints: 150,
        weeklyRank: 42,
        globalRank: 1337,
        canVote: true,
        freeGenerationsUsedToday: 2,
        freeGenerationsRemaining: 1,
        creditsBalance: 5
      }
    };

    return addCORSHeaders(new Response(JSON.stringify(mockStats), {
      headers: { 'Content-Type': 'application/json' }
    }), corsHeaders);

  } catch (error) {
    console.error('User stats API error:', error);
    return addCORSHeaders(new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), corsHeaders);
  }
}

// User Generations API Handler  
async function handleUserGenerations(request, env) {
  try {
    const body = await request.json();
    const { userAddress } = body;

    if (!userAddress) {
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: 'User address required'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), corsHeaders);
    }

    // Mock generation history
    const mockGenerations = {
      success: true,
      generations: [
        {
          id: 'gen_1',
          prompt: 'A futuristic city with flying cars',
          imageUrl: 'https://via.placeholder.com/512x512?text=Future+City',
          model: 'flux-1-schnell',
          creditsUsed: 1,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          upvotes: 3,
          status: 'completed'
        },
        {
          id: 'gen_2', 
          prompt: 'Abstract colorful geometric patterns',
          imageUrl: 'https://via.placeholder.com/512x512?text=Abstract+Art',
          model: 'flux-1-schnell',
          creditsUsed: 1,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          upvotes: 7,
          status: 'completed'
        }
      ],
      total: 2
    };

    return addCORSHeaders(new Response(JSON.stringify(mockGenerations), {
      headers: { 'Content-Type': 'application/json' }
    }), corsHeaders);

  } catch (error) {
    console.error('User generations API error:', error);
    return addCORSHeaders(new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), corsHeaders);
  }
}

// Cloudflare Free Generation API Handler
async function handleCloudFlareFreeGeneration(request, env) {
  try {
    const body = await request.json();
    const { prompt, userAddress, model = 'cloudflare-free' } = body;

    if (!prompt) {
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: 'Prompt is required'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), corsHeaders);
    }

    // For now return a demo image since we need proper Cloudflare AI setup
    return addCORSHeaders(new Response(JSON.stringify({
      success: true,
      imageUrl: `https://via.placeholder.com/1024x1024/1f2937/f59e0b?text=Demo+Image`,
      model: 'demo-fallback',
      creditsUsed: 0,
      generatedAt: new Date().toISOString(),
      isDemo: true,
      prompt: prompt
    }), {
      headers: { 'Content-Type': 'application/json' }
    }), corsHeaders);

  } catch (error) {
    console.error('Free generation error:', error);
    
    return addCORSHeaders(new Response(JSON.stringify({
      success: false,
      error: error.message || 'Free generation failed'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), corsHeaders);
  }
}

// Credit-based Generation V2 API Handler
async function handleCreditBasedGenerationV2(request, env) {
  try {
    const body = await request.json();
    const { prompt, userAddress, model = 'flux-1-schnell', credits = 1 } = body;

    if (!prompt) {
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: 'Prompt is required'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), corsHeaders);
    }

    if (!userAddress) {
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: 'User address is required'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), corsHeaders);
    }

    // For now return a demo image
    return addCORSHeaders(new Response(JSON.stringify({
      success: true,
      imageUrl: `https://via.placeholder.com/1024x1024/059669/ffffff?text=Credit+Generated`,
      model: model,
      creditsUsed: credits,
      generatedAt: new Date().toISOString(),
      isDemo: true,
      prompt: prompt,
      userAddress: userAddress
    }), {
      headers: { 'Content-Type': 'application/json' }
    }), corsHeaders);

  } catch (error) {
    console.error('Credit-based generation error:', error);
    
    return addCORSHeaders(new Response(JSON.stringify({
      success: false,
      error: error.message || 'Credit-based generation failed'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), corsHeaders);
  }
}

// File completed properly