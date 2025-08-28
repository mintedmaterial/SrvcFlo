// Enhanced ServiceFlow AI Worker with Creem.io Integration
// Webhook URL: https://srvcflo.com/api/creem/webhook

interface Env {
  AI: any;
  DB: D1Database;
  ASSETS: Fetcher;
  
  // Creem.io credentials
  CREEM_API_KEY: string;
  CREEM_WEBHOOK_SECRET: string;
  
  // KIE.AI credentials
  KIE_AI_API_KEY: string;
  KIE_AI_MERCHANT_ID: string; // KIE.AI's Creem merchant ID
  
  // Other existing env vars
  STRIPE_SECRET_KEY: string;
  ADMIN_API_KEY: string;
}

// Credit packages with Creem.io product IDs
const CREDIT_PACKAGES = {
  'starter': {
    price_usd: 5,
    credits_fiat: 750,
    credits_crypto: 900,
    creem_product_id: 'prod_5gilhen0tIN6Aljqs7ZVIU', // Your existing product
    stripe_price_id: 'price_1RpJFA2M1Cr3qWQa3zukLMg8'
  },
  'standard': {
    price_usd: 50,
    credits_fiat: 8000,
    credits_crypto: 9600,
    creem_product_id: '', // Create this in Creem.io
    stripe_price_id: 'price_1RpJFA2M1Cr3qWQa7MRRqmir'
  },
  'premium': {
    price_usd: 500,
    credits_fiat: 100000,
    credits_crypto: 120000,
    creem_product_id: '', // Create this in Creem.io
    stripe_price_id: 'price_1RpJFB2M1Cr3qWQarr5ScHRW'
  },
  'enterprise': {
    price_usd: 1250,
    credits_fiat: 265000,
    credits_crypto: 318000,
    creem_product_id: '', // Create this in Creem.io
    stripe_price_id: 'price_1RpJFB2M1Cr3qWQaa5Z2B5Xl'
  }
};

// KIE.AI generation costs (what we pay them)
const KIE_AI_COSTS = {
  'image_gpt4o': 0.006,  // $0.006 per image
  'video_veo3': 0.10,    // $0.10 per video
  'image_basic': 0.002,  // $0.002 per basic image (free tier)
  'video_basic': 0.05,   // $0.05 per basic video (free tier)
};

class CreemPaymentService {
  private apiKey: string;
  private baseUrl = 'https://api.creem.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Create checkout for credit purchase
  async createCheckout(productId: string, customerEmail?: string, metadata?: any) {
    try {
      const response = await fetch(`${this.baseUrl}/checkouts`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: productId,
          customer_email: customerEmail,
          metadata: {
            source: 'serviceflow_ai',
            ...metadata
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Creem API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Creem checkout creation failed:', error);
      throw error;
    }
  }

  // Pay KIE.AI for generation
  async payKieAI(amount: number, metadata: any) {
    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'USD',
          recipient_merchant_id: process.env.KIE_AI_MERCHANT_ID,
          description: `AI Generation - ${metadata.type}`,
          metadata: {
            task_id: metadata.taskId,
            user_id: metadata.userId,
            generation_type: metadata.type,
            prompt: metadata.prompt?.substring(0, 100)
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Creem payment failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('KIE.AI payment failed:', error);
      throw error;
    }
  }

  // Verify webhook signature
  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    // Implement Creem.io webhook verification
    // This will depend on Creem.io's specific signature method
    // Usually HMAC SHA256
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      switch (true) {
        // Creem.io webhook handler
        case path === '/api/creem/webhook' && method === 'POST':
          return addCORSHeaders(await handleCreemWebhook(request, env), corsHeaders);

        // Credit purchase via Creem.io
        case path === '/api/credits/creem/checkout' && method === 'POST':
          return addCORSHeaders(await handleCreemCheckout(request, env), corsHeaders);

        // Free tier generation
        case path === '/api/generate/free/image' && method === 'POST':
          return addCORSHeaders(await handleFreeGeneration(request, env, 'image'), corsHeaders);

        case path === '/api/generate/free/video' && method === 'POST':
          return addCORSHeaders(await handleFreeGeneration(request, env, 'video'), corsHeaders);

        // Paid generation (existing endpoints)
        case path === '/api/generate/image' && method === 'POST':
          return addCORSHeaders(await handlePaidGeneration(request, env, 'image'), corsHeaders);

        case path === '/api/generate/video' && method === 'POST':
          return addCORSHeaders(await handlePaidGeneration(request, env, 'video'), corsHeaders);

        // Existing endpoints...
        case path === '/api/credits/packages' && method === 'GET':
          return addCORSHeaders(await handleCreditPackages(request, env), corsHeaders);

        case path === '/api/credits/balance' && method === 'GET':
          return addCORSHeaders(await handleCreditBalance(request, env), corsHeaders);

        default:
          const assetResponse = await env.ASSETS.fetch(request);
          if (assetResponse.status === 404) {
            const indexRequest = new Request(new URL('/', request.url), request);
            return env.ASSETS.fetch(indexRequest);
          }
          return assetResponse;
      }
    } catch (error) {
      console.error('Request handling error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};

// Creem.io webhook handler
async function handleCreemWebhook(request: Request, env: Env): Promise<Response> {
  try {
    const signature = request.headers.get('x-creem-signature') || '';
    const payload = await request.text();
    
    const creem = new CreemPaymentService(env.CREEM_API_KEY);
    const isValid = creem.verifyWebhook(payload, signature, env.CREEM_WEBHOOK_SECRET);
    
    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(payload);
    console.log('Creem webhook received:', event.type);

    switch (event.type) {
      case 'checkout.completed':
        await handleCheckoutCompleted(event.data, env);
        break;
      
      case 'payment.completed':
        await handlePaymentCompleted(event.data, env);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.data, env);
        break;
    }

    return new Response('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
}

// Handle credit purchase checkout
async function handleCreemCheckout(request: Request, env: Env): Promise<Response> {
  try {
    const { packageId, userEmail, walletAddress } = await request.json();
    
    const packageData = CREDIT_PACKAGES[packageId];
    if (!packageData || !packageData.creem_product_id) {
      return new Response(JSON.stringify({ 
        error: 'Invalid package or Creem product not configured' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const creem = new CreemPaymentService(env.CREEM_API_KEY);
    const checkout = await creem.createCheckout(
      packageData.creem_product_id,
      userEmail,
      {
        package_id: packageId,
        user_email: userEmail,
        wallet_address: walletAddress,
        credits: packageData.credits_crypto // Crypto gets bonus
      }
    );

    return new Response(JSON.stringify({
      success: true,
      checkout_url: checkout.checkout_url,
      checkout_id: checkout.id
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Creem checkout error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create checkout',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle paid generation with Creem payment to KIE.AI
async function handlePaidGeneration(request: Request, env: Env, type: 'image' | 'video'): Promise<Response> {
  try {
    const { prompt, userEmail, walletAddress, model = 'premium' } = await request.json();
    
    if (!prompt || (!userEmail && !walletAddress)) {
      return new Response(JSON.stringify({ 
        error: 'Prompt and user identification required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check user credits
    const creditCheck = await env.DB.prepare(`
      SELECT credits FROM user_credits 
      WHERE ${userEmail ? 'email = ?' : 'wallet_address = ?'}
    `).bind(userEmail || walletAddress).first();
    
    const userCredits = creditCheck?.credits || 0;
    const requiredCredits = calculateRequiredCredits(type, model);
    
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

    // Deduct credits immediately (we take payment upfront)
    await env.DB.prepare(`
      UPDATE user_credits 
      SET credits = credits - ?, updated_at = datetime('now')
      WHERE ${userEmail ? 'email = ?' : 'wallet_address = ?'}
    `).bind(requiredCredits, userEmail || walletAddress).run();

    const taskId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store generation request
    await env.DB.prepare(`
      INSERT INTO generation_history (
        task_id, user_email, user_wallet, generation_type, prompt, 
        status, credits_used, created_at
      ) VALUES (?, ?, ?, ?, ?, 'processing', ?, datetime('now'))
    `).bind(taskId, userEmail, walletAddress, type, prompt, requiredCredits).run();

    // Pay KIE.AI via Creem.io
    const kieAiCost = KIE_AI_COSTS[`${type}_${model}`] || KIE_AI_COSTS[`${type}_gpt4o`];
    const creem = new CreemPaymentService(env.CREEM_API_KEY);
    
    try {
      const payment = await creem.payKieAI(kieAiCost, {
        taskId,
        userId: userEmail || walletAddress,
        type,
        prompt
      });

      console.log(`Paid KIE.AI $${kieAiCost} for ${type} generation:`, payment.id);
      
      // Update generation with payment ID
      await env.DB.prepare(`
        UPDATE generation_history 
        SET creem_payment_id = ?, kie_ai_cost = ?
        WHERE task_id = ?
      `).bind(payment.id, kieAiCost, taskId).run();

    } catch (paymentError) {
      console.error('KIE.AI payment failed:', paymentError);
      
      // Refund credits since payment failed
      await env.DB.prepare(`
        UPDATE user_credits 
        SET credits = credits + ?
        WHERE ${userEmail ? 'email = ?' : 'wallet_address = ?'}
      `).bind(requiredCredits, userEmail || walletAddress).run();
      
      return new Response(JSON.stringify({ 
        error: 'Payment to AI provider failed. Credits refunded.',
        details: paymentError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Now call KIE.AI for generation
    const kieResult = await callKieAI(prompt, type, model, env);
    
    if (kieResult.success) {
      // Poll for completion in background
      ctx.waitUntil(pollKieAIStatus(env, taskId, kieResult.taskId));
    } else {
      // Update status to failed
      await env.DB.prepare(`
        UPDATE generation_history 
        SET status = 'failed'
        WHERE task_id = ?
      `).bind(taskId).run();
    }

    return new Response(JSON.stringify({
      success: true,
      taskId: taskId,
      message: `${type} generation started`,
      creditsUsed: requiredCredits,
      estimatedTime: type === 'image' ? '10-30 seconds' : '30-90 seconds'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Paid generation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Generation failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle free tier generation (no payment to KIE.AI)
async function handleFreeGeneration(request: Request, env: Env, type: 'image' | 'video'): Promise<Response> {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const { prompt } = await request.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check free tier quota
    const quotaCheck = await checkFreeQuota(ip, type, env);
    if (!quotaCheck.allowed) {
      return new Response(JSON.stringify({
        error: 'Daily limit reached',
        message: `Free users can generate ${quotaCheck.limit} ${type}s per ${quotaCheck.period}`,
        used: quotaCheck.used,
        limit: quotaCheck.limit,
        resetTime: quotaCheck.resetTime,
        upgradeUrl: 'https://srvcflo.com/generation#pricing'
      }), { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const taskId = `free_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store generation (no payment, uses basic model)
    await env.DB.prepare(`
      INSERT INTO generation_history (
        task_id, user_ip, user_type, generation_type, prompt, prompt_visible,
        status, credits_used, model_used, created_at
      ) VALUES (?, ?, 'free', ?, ?, false, 'processing', 0, 'basic', datetime('now'))
    `).bind(taskId, ip, type, prompt).run();

    // Increment quota
    await incrementFreeQuota(ip, type, env);

    // Call basic model (cheaper/faster)
    const result = await callBasicModel(prompt, type, env);
    
    if (result.success) {
      // Update with result
      await env.DB.prepare(`
        UPDATE generation_history 
        SET status = 'completed', result_urls = ?, completed_at = datetime('now')
        WHERE task_id = ?
      `).bind(JSON.stringify(result.urls), taskId).run();
    }

    return new Response(JSON.stringify({
      success: true,
      taskId: taskId,
      result: result.urls,
      message: `Free ${type} generated! Upgrade for premium models.`,
      upgradeUrl: 'https://srvcflo.com/generation#pricing'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Free generation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Free generation failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Webhook event handlers
async function handleCheckoutCompleted(data: any, env: Env) {
  console.log('Checkout completed:', data);
  
  const { customer_email, metadata } = data;
  const { package_id, credits, wallet_address } = metadata;
  
  // Add credits to user account
  if (customer_email || wallet_address) {
    await env.DB.prepare(`
      INSERT OR REPLACE INTO user_credits (
        email, wallet_address, credits, auth_method, updated_at
      ) VALUES (
        ?, ?, 
        COALESCE((SELECT credits FROM user_credits WHERE ${customer_email ? 'email = ?' : 'wallet_address = ?'}), 0) + ?, 
        ?, datetime('now')
      )
    `).bind(
      customer_email, 
      wallet_address, 
      customer_email || wallet_address,
      parseInt(credits), 
      customer_email ? 'email' : 'wallet'
    ).run();

    // Record purchase
    await env.DB.prepare(`
      INSERT INTO purchase_history (
        user_email, user_wallet, package_id, payment_method, 
        credits_purchased, creem_checkout_id, status, created_at
      ) VALUES (?, ?, ?, 'creem', ?, ?, 'completed', datetime('now'))
    `).bind(
      customer_email, wallet_address, package_id, 
      credits, data.id
    ).run();
  }
}

async function handlePaymentCompleted(data: any, env: Env) {
  console.log('Payment to KIE.AI completed:', data);
  // Payment to KIE.AI successful - generation should proceed
}

async function handlePaymentFailed(data: any, env: Env) {
  console.log('Payment to KIE.AI failed:', data);
  
  // Find the generation task and refund credits
  const generation = await env.DB.prepare(`
    SELECT * FROM generation_history WHERE creem_payment_id = ?
  `).bind(data.id).first();
  
  if (generation) {
    // Refund credits
    await env.DB.prepare(`
      UPDATE user_credits 
      SET credits = credits + ?
      WHERE ${generation.user_email ? 'email = ?' : 'wallet_address = ?'}
    `).bind(
      generation.credits_used, 
      generation.user_email || generation.user_wallet
    ).run();
    
    // Mark generation as failed
    await env.DB.prepare(`
      UPDATE generation_history 
      SET status = 'failed'
      WHERE id = ?
    `).bind(generation.id).run();
  }
}

// Helper functions
function calculateRequiredCredits(type: string, model: string): number {
  // Based on your 33% markup pricing
  const baseCredits = {
    'image_premium': 1,  // ~$0.006 cost
    'video_premium': 15, // ~$0.10 cost
  };
  
  return baseCredits[`${type}_${model}`] || baseCredits[`${type}_premium`];
}

async function checkFreeQuota(ip: string, type: 'image' | 'video', env: Env) {
  const period = type === 'image' ? 'day' : 'week';
  const limit = type === 'image' ? 5 : 1;
  
  if (period === 'day') {
    const today = new Date().toISOString().split('T')[0];
    const result = await env.DB.prepare(`
      SELECT images_used FROM daily_quotas 
      WHERE ip_address = ? AND date = ?
    `).bind(ip, today).first();
    
    const used = result?.images_used || 0;
    return {
      allowed: used < limit,
      used,
      limit,
      period,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  } else {
    // Weekly check for videos
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const result = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM generation_history 
      WHERE user_ip = ? AND generation_type = 'video' 
      AND created_at >= ? AND user_type = 'free'
    `).bind(ip, weekStart.toISOString()).first();
    
    const used = result?.count || 0;
    const nextWeek = new Date(weekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return {
      allowed: used < limit,
      used,
      limit,
      period,
      resetTime: nextWeek.toISOString()
    };
  }
}

async function incrementFreeQuota(ip: string, type: 'image' | 'video', env: Env) {
  if (type === 'image') {
    const today = new Date().toISOString().split('T')[0];
    await env.DB.prepare(`
      INSERT INTO daily_quotas (ip_address, date, images_used)
      VALUES (?, ?, 1)
      ON CONFLICT(ip_address, date) 
      DO UPDATE SET images_used = images_used + 1
    `).bind(ip, today).run();
  }
  // Videos are tracked in generation_history table
}

async function callKieAI(prompt: string, type: string, model: string, env: Env) {
  // Implementation for calling KIE.AI premium models
  const endpoint = type === 'image' ? 
    'https://api.kie.ai/api/v1/gpt4o-image/generate' :
    'https://api.kie.ai/api/v1/veo/generate';
    
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.KIE_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        model: type === 'image' ? 'gpt-4o' : 'veo3'
      })
    });
    
    const data = await response.json();
    return {
      success: response.ok,
      taskId: data.data?.taskId,
      message: data.message
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function callBasicModel(prompt: string, type: string, env: Env) {
  // Implementation for basic/free models - IMAGES ONLY
  try {
    if (type === 'image') {
      const response = await env.AI.run('@cf/lykon/dreamshaper-8-lcm', {
        prompt: prompt
      });
      
      return {
        success: true,
        urls: [URL.createObjectURL(response)]
      };
    } else {
      // NO FREE VIDEO GENERATION - videos require paid credits
      throw new Error('Video generation requires paid credits. Upgrade to generate videos!');
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function addCORSHeaders(response: Response, corsHeaders: any): Response {
  const existingHeaders = Object.fromEntries(response.headers.entries());
  return new Response(response.body, {
    status: response.status,
    headers: { ...existingHeaders, ...corsHeaders },
  });
}