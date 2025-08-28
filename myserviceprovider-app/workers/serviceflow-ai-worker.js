// ServiceFlow AI Cloudflare Worker - Integrated Payment & Generation System
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    
    // CORS handling
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Address',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      let response;
      
      switch (pathname) {
        case '/api/mint-agent':
          response = await handleMintAgent(request, env);
          break;
        case '/api/generate-content':
          response = await handleGenerateContent(request, env);
          break;
        case '/api/purchase-credits':
          response = await handlePurchaseCredits(request, env);
          break;
        case '/api/verify-payment':
          response = await handleVerifyPayment(request, env);
          break;
        case '/api/user-stats':
          response = await handleUserStats(request, env);
          break;
        case '/api/auth/token':
          response = await handleAuth0Token(request, env);
          break;
        case '/api/agent/revenue':
          response = await handleAgentRevenue(request, env);
          break;
        default:
          response = new Response('Not Found', { status: 404 });
      }
      
      // Add CORS headers to response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};

// Handle agent minting with encryption
async function handleMintAgent(request, env) {
  const data = await request.json();
  const { agentConfig, ownerAddress, signature, paymentTx } = data;
  
  // Verify payment first
  const paymentValid = await verifyPayment({
    transactionHash: paymentTx,
    userAddress: ownerAddress,
    paymentType: 'agent_mint',
    verified: false
  }, env);
  
  if (!paymentValid) {
    return new Response(JSON.stringify({ 
      error: 'Payment verification failed. Please ensure your transaction is confirmed.' 
    }), { status: 402 });
  }
  
  // Verify signature
  const isValidSignature = await verifySignature(agentConfig, signature, ownerAddress);
  if (!isValidSignature) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
  }
  
  // Generate encryption key for this agent
  const encryptionKey = randomBytes(32);
  const iv = randomBytes(16);
  
  // Encrypt agent configuration
  const cipher = createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encrypted = cipher.update(JSON.stringify(agentConfig), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Create metadata hash
  const metadataHash = createHash('sha256').update(encrypted).digest('hex');
  
  // Store encrypted metadata in R2
  const metadataKey = `agents/${Date.now()}-${metadataHash}`;
  await env.METADATA_BUCKET.put(metadataKey, encrypted);
  
  // Store encryption key and metadata mapping in KV
  await env.AGENT_KV.put(`key:${metadataHash}`, encryptionKey.toString('hex'));
  await env.AGENT_KV.put(`metadata:${metadataHash}`, metadataKey);
  await env.AGENT_KV.put(`owner:${metadataHash}`, ownerAddress);
  
  const metadataURI = `https://${env.ACCOUNT_ID}.r2.cloudflarestorage.com/srvcflo-metadata/${metadataKey}`;
  
  return new Response(JSON.stringify({
    success: true,
    metadataURI,
    metadataHash: `0x${metadataHash}`,
    encryptionKey: encryptionKey.toString('hex')
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle content generation with credit verification
async function handleGenerateContent(request, env) {
  const data = await request.json();
  const { tokenId, prompt, agentType, userAddress, creditPackageId } = data;
  
  // Get agent configuration
  const agentConfig = await getAgentConfig(tokenId, env);
  if (!agentConfig) {
    return new Response(JSON.stringify({ error: 'Agent not found' }), { status: 404 });
  }
  
  // Verify user owns the agent or has credits
  const hasAccess = await verifyAgentAccess(tokenId, userAddress, env);
  if (!hasAccess) {
    return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
  }
  
  // Check if user has sufficient credits
  const creditsNeeded = agentType === 'image' ? 200 : 500;
  const hasCredits = await verifyCredits(userAddress, creditsNeeded, creditPackageId, env);
  
  if (!hasCredits.valid) {
    return new Response(JSON.stringify({ 
      error: 'Insufficient credits',
      required: creditsNeeded,
      available: hasCredits.available,
      packageId: creditPackageId
    }), { status: 402 });
  }
  
  // Generate content based on agent type and package tier
  let generatedContent;
  const packageTier = await getCreditPackageTier(creditPackageId, env);
  
  try {
    switch (agentType) {
      case 'image':
        generatedContent = await generateImage(prompt, agentConfig, packageTier, env);
        break;
      case 'video':
        generatedContent = await generateVideo(prompt, agentConfig, packageTier, env);
        break;
      case 'social':
        generatedContent = await generateSocialPost(prompt, agentConfig, packageTier, env);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Unsupported agent type' }), { status: 400 });
    }
    
    if (!generatedContent.success) {
      return new Response(JSON.stringify({ 
        error: generatedContent.error 
      }), { status: 500 });
    }
    
  } catch (error) {
    console.error('Generation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Generation failed: ' + error.message 
    }), { status: 500 });
  }
  
  // Store generated content in R2
  const contentKey = `generated/${tokenId}/${Date.now()}-${randomBytes(8).toString('hex')}`;
  await env.CONTENT_BUCKET.put(contentKey, generatedContent.data);
  
  // Burn credits
  await burnCredits(userAddress, creditsNeeded, creditPackageId, env);
  
  // Update usage statistics
  await updateAgentUsage(tokenId, creditsNeeded, agentType, env);
  
  // Store generation record in D1
  await logGeneration(tokenId, userAddress, agentType, creditsNeeded, contentKey, env);
  
  return new Response(JSON.stringify({
    success: true,
    contentURI: `https://${env.ACCOUNT_ID}.r2.cloudflarestorage.com/srvcflo-generated-content/${contentKey}`,
    generatedContent: generatedContent.metadata,
    creditsUsed: creditsNeeded,
    modelUsed: generatedContent.modelUsed
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle credit purchases
async function handlePurchaseCredits(request, env) {
  const data = await request.json();
  const { userAddress, packageId, paymentTx, paymentType } = data;
  
  // Verify payment
  const paymentValid = await verifyPayment({
    transactionHash: paymentTx,
    userAddress,
    paymentType: 'credit_purchase',
    verified: false
  }, env);
  
  if (!paymentValid) {
    return new Response(JSON.stringify({ 
      error: 'Payment verification failed' 
    }), { status: 402 });
  }
  
  // Get package details
  const packageInfo = await getCreditPackageInfo(packageId);
  if (!packageInfo) {
    return new Response(JSON.stringify({ 
      error: 'Invalid package ID' 
    }), { status: 400 });
  }
  
  // Add credits to user's balance
  const currentCredits = await env.AGENT_KV.get(`credits:${userAddress}:${packageId}`) || '0';
  const newCredits = parseInt(currentCredits) + packageInfo.credits;
  await env.AGENT_KV.put(`credits:${userAddress}:${packageId}`, newCredits.toString());
  
  // Store purchase record
  await env.ANALYTICS_DB.prepare(
    'INSERT INTO credit_purchases (user_address, package_id, credits_purchased, payment_tx, timestamp) VALUES (?, ?, ?, ?, ?)'
  ).bind(userAddress, packageId, packageInfo.credits, paymentTx, new Date().toISOString()).run();
  
  return new Response(JSON.stringify({
    success: true,
    creditsAdded: packageInfo.credits,
    totalCredits: newCredits,
    packageId
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Generate image with model fallback based on package tier
async function generateImage(prompt, agentConfig, packageTier, env) {
  const models = getAvailableModels('image', packageTier);
  
  for (const model of models) {
    try {
      console.log(`Trying image generation with ${model}`);
      
      let result;
      
      if (model.startsWith('@cf/')) {
        // Cloudflare AI model
        result = await env.AI.run(model, {
          prompt,
          width: 1024,
          height: 1024,
          steps: packageTier === 'starter' ? 4 : 8,
        });
      } else {
        // External API models (OpenAI, etc.)
        result = await callExternalModel(model, prompt, env);
      }
      
      if (result && (result.image || result.data)) {
        return {
          success: true,
          data: result.image || result.data,
          metadata: {
            prompt,
            model,
            timestamp: Date.now(),
            dimensions: { width: 1024, height: 1024 }
          },
          modelUsed: model
        };
      }
      
    } catch (error) {
      console.error(`Model ${model} failed:`, error);
      continue;
    }
  }
  
  return {
    success: false,
    error: "All available models failed to generate"
  };
}

// Generate video (placeholder - enhanced when Cloudflare supports video)
async function generateVideo(prompt, agentConfig, packageTier, env) {
  // For now, return a placeholder since Cloudflare video generation is not available
  return {
    success: false,
    error: "Video generation not yet available in Cloudflare AI. Please check back soon."
  };
}

// Generate social media content
async function generateSocialPost(prompt, agentConfig, packageTier, env) {
  try {
    // Use text generation model for social content
    const result = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        {
          role: 'system',
          content: `You are a ${agentConfig.systemPrompt || 'professional social media content creator'}. Create engaging social media content based on the user's request. Keep it concise and engaging.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 280 // Twitter limit
    });
    
    if (result && result.response) {
      return {
        success: true,
        data: result.response,
        metadata: {
          prompt,
          model: '@cf/meta/llama-2-7b-chat-int8',
          timestamp: Date.now(),
          characterCount: result.response.length
        },
        modelUsed: '@cf/meta/llama-2-7b-chat-int8'
      };
    }
    
    throw new Error('No response from text generation model');
    
  } catch (error) {
    return {
      success: false,
      error: `Social content generation failed: ${error.message}`
    };
  }
}

// Get available models based on package tier
function getAvailableModels(type, packageTier) {
  const models = {
    image: {
      starter: [
        '@cf/black-forest-labs/flux-1-schnell',
        '@cf/bytedance/stable-diffusion-xl-lightning'
      ],
      creator: [
        '@cf/black-forest-labs/flux-1-schnell',
        '@cf/bytedance/stable-diffusion-xl-lightning',
        'dall-e-2',
        'stable-diffusion-xl'
      ],
      professional: [
        '@cf/black-forest-labs/flux-1-schnell',
        '@cf/bytedance/stable-diffusion-xl-lightning',
        'dall-e-2',
        'dall-e-3',
        'stable-diffusion-xl',
        'flux-dev'
      ],
      enterprise: [
        '@cf/black-forest-labs/flux-1-schnell',
        '@cf/bytedance/stable-diffusion-xl-lightning',
        'dall-e-2',
        'dall-e-3',
        'stable-diffusion-xl',
        'flux-dev',
        'custom-fine-tuned'
      ]
    }
  };
  
  return models[type]?.[packageTier] || models[type]?.starter || [];
}

// Verify payment on Sonic blockchain
async function verifyPayment(payment, env) {
  try {
    if (payment.paymentType === 'free') {
      return true;
    }
    
    if (!payment.transactionHash) {
      return false;
    }
    
    // Check with Sonic blockchain
    const response = await fetch(`${env.SONIC_RPC_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [payment.transactionHash],
        id: 1
      })
    });
    
    const result = await response.json();
    
    if (!result.result || result.result.status !== '0x1') {
      return false;
    }
    
    // Verify transaction was to our contract
    const validContracts = [
      env.CREDIT_CONTRACT_ADDRESS,
      env.AGENT_FACTORY_ADDRESS,
      env.PAYMENT_PROCESSOR_ADDRESS
    ].filter(Boolean);
    
    return validContracts.includes(result.result.to?.toLowerCase());
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
}

// Verify user has sufficient credits
async function verifyCredits(userAddress, creditsNeeded, packageId, env) {
  try {
    const currentCredits = await env.AGENT_KV.get(`credits:${userAddress}:${packageId}`) || '0';
    const available = parseInt(currentCredits);
    
    return {
      valid: available >= creditsNeeded,
      available,
      needed: creditsNeeded
    };
  } catch (error) {
    console.error('Credit verification error:', error);
    return { valid: false, available: 0, needed: creditsNeeded };
  }
}

// Burn credits after successful generation
async function burnCredits(userAddress, creditsUsed, packageId, env) {
  const currentCredits = await env.AGENT_KV.get(`credits:${userAddress}:${packageId}`) || '0';
  const newCredits = Math.max(0, parseInt(currentCredits) - creditsUsed);
  await env.AGENT_KV.put(`credits:${userAddress}:${packageId}`, newCredits.toString());
}

// Get credit package information
function getCreditPackageInfo(packageId) {
  const packages = {
    0: { name: 'Starter', credits: 750, price: 5 },
    1: { name: 'Creator', credits: 8000, price: 50 },
    2: { name: 'Professional', credits: 50000, price: 200 },
    3: { name: 'Enterprise', credits: 500000, price: 1500 }
  };
  
  return packages[packageId];
}

// Get credit package tier name
async function getCreditPackageTier(packageId, env) {
  const tiers = {
    0: 'starter',
    1: 'creator', 
    2: 'professional',
    3: 'enterprise'
  };
  
  return tiers[packageId] || 'starter';
}

// Utility functions
async function verifySignature(message, signature, address) {
  // Implement Web3 signature verification
  // This would use a crypto library to verify the signature
  return true; // Simplified for now
}

async function verifyAgentAccess(tokenId, userAddress, env) {
  // Check if user owns the agent or has access
  const agentOwner = await env.AGENT_KV.get(`agent:${tokenId}:owner`);
  return agentOwner === userAddress;
}

async function getAgentConfig(tokenId, env) {
  const configData = await env.AGENT_KV.get(`config:${tokenId}`);
  return configData ? JSON.parse(configData) : null;
}

async function updateAgentUsage(tokenId, creditsUsed, operation, env) {
  const currentUsage = await env.AGENT_KV.get(`usage:${tokenId}`) || '0';
  const newUsage = parseInt(currentUsage) + creditsUsed;
  await env.AGENT_KV.put(`usage:${tokenId}`, newUsage.toString());
}

async function logGeneration(tokenId, userAddress, type, credits, contentKey, env) {
  await env.ANALYTICS_DB.prepare(
    'INSERT INTO generations (token_id, user_address, type, credits_used, content_key, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(tokenId, userAddress, type, credits, contentKey, new Date().toISOString()).run();
}

// Handle Auth0 token request
async function handleAuth0Token(request, env) {
  const tokenResponse = await fetch(`https://${env.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.AUTH0_CLIENT_ID,
      client_secret: env.AUTH0_CLIENT_SECRET,
      audience: `https://${env.AUTH0_DOMAIN}/api/v2/`,
      grant_type: 'client_credentials'
    })
  });
  
  const tokenData = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    return new Response(JSON.stringify({ error: 'Auth0 token request failed' }), { 
      status: 401 
    });
  }
  
  return new Response(JSON.stringify(tokenData), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle user statistics
async function handleUserStats(request, env) {
  const userAddress = request.headers.get('X-User-Address');
  if (!userAddress) {
    return new Response(JSON.stringify({ error: 'User address required' }), { status: 400 });
  }
  
  // Get credit balances for all packages
  const creditBalances = {};
  for (let i = 0; i < 4; i++) {
    const balance = await env.AGENT_KV.get(`credits:${userAddress}:${i}`) || '0';
    creditBalances[i] = parseInt(balance);
  }
  
  // Get generation stats
  const totalGenerations = await env.ANALYTICS_DB.prepare(
    'SELECT COUNT(*) as count FROM generations WHERE user_address = ?'
  ).bind(userAddress).first();
  
  return new Response(JSON.stringify({
    userAddress,
    creditBalances,
    totalGenerations: totalGenerations?.count || 0,
    freeGenerationsToday: 3, // Placeholder
    canUseFreeGeneration: true
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}