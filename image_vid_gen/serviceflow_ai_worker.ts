// Enhanced ServiceFlow AI Worker with AI Generation capabilities
// Integrates Kie.ai for video/image generation with Stripe and crypto payments

interface Env {
  AI: any; // Cloudflare AI binding
  DB: D1Database;
  PORTAL_DB: D1Database;
  ASSETS: Fetcher;
  GENERATION_TASKS: DurableObjectNamespace; // For task management
  
  // Environment variables
  AGNO_AGENT_BASE_URL?: string;
  SRVCFLO_AGENT_TOKEN?: string;
  ADMIN_API_KEY?: string;
  OPENAI_API_KEY?: string;
  KIE_AI_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}

// Credit packages with both fiat and crypto pricing
const CREDIT_PACKAGES = {
  'starter': { 
    price_usd: 5, 
    credits_fiat: 750, 
    credits_crypto: 900, // 20% bonus for crypto
    stripe_price_id: 'price_starter_5usd'
  },
  'standard': { 
    price_usd: 50, 
    credits_fiat: 8000, 
    credits_crypto: 9600,
    stripe_price_id: 'price_standard_50usd'
  },
  'premium': { 
    price_usd: 500, 
    credits_fiat: 100000, 
    credits_crypto: 120000,
    stripe_price_id: 'price_premium_500usd'
  },
  'enterprise': { 
    price_usd: 1250, 
    credits_fiat: 265000, 
    credits_crypto: 318000,
    stripe_price_id: 'price_enterprise_1250usd'
  }
};

// Generation costs in credits
const GENERATION_COSTS = {
  'video': 120, // User cost (provider cost 100 + markup)
  'image': 60   // User cost (provider cost 50 + markup)
};

// Durable Object for managing generation tasks
export class GenerationTask {
  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/status') {
      const taskData = await this.state.storage.get('taskData');
      return new Response(JSON.stringify(taskData || { status: 'unknown' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.pathname === '/create' && request.method === 'POST') {
      const data = await request.json();
      await this.createTask(data);
      return new Response(JSON.stringify({ success: true }));
    }
    
    return new Response('Not found', { status: 404 });
  }

  async createTask(data: any) {
    const taskData = {
      id: data.taskId,
      userId: data.userId,
      type: data.type,
      prompt: data.prompt,
      status: 'pending',
      createdAt: new Date().toISOString(),
      result: null,
      error: null
    };
    
    await this.state.storage.put('taskData', taskData);
    
    // Set alarm to check status in 30 seconds
    await this.state.storage.setAlarm(Date.now() + 30000);
  }

  async alarm() {
    const taskData = await this.state.storage.get('taskData');
    if (!taskData || taskData.status !== 'pending') return;

    try {
      // Check task status with Kie.ai
      const statusResponse = await fetch(`https://api.kie.ai/api/v1/veo/record-info?taskId=${taskData.id}`, {
        headers: {
          'Authorization': `Bearer ${this.env.KIE_AI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const statusData = await statusResponse.json();
      
      if (statusData.code === 200) {
        const status = statusData.data.status;
        
        if (status === 1) { // Completed
          taskData.status = 'completed';
          taskData.result = JSON.parse(statusData.data.resultUrls);
        } else if (status === 2 || status === 3) { // Failed
          taskData.status = 'failed';
          taskData.error = statusData.msg || 'Generation failed';
          
          // Refund credits on failure
          await this.refundCredits(taskData.userId, taskData.type);
        } else {
          // Still processing, check again in 30 seconds
          await this.state.storage.setAlarm(Date.now() + 30000);
        }
        
        await this.state.storage.put('taskData', taskData);
      }
    } catch (error) {
      console.error('Error checking task status:', error);
      // Set alarm to retry
      await this.state.storage.setAlarm(Date.now() + 60000);
    }
  }

  async refundCredits(userId: string, type: string) {
    const credits = GENERATION_COSTS[type as keyof typeof GENERATION_COSTS];
    if (credits) {
      // In a real implementation, you'd update the user's credit balance
      console.log(`Refunding ${credits} credits to user ${userId}`);
    }
  }
}

// Main worker handler
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
      // Credit package purchase endpoints
      if (path === '/api/credits/packages' && method === 'GET') {
        return addCORSHeaders(new Response(JSON.stringify({
          packages: CREDIT_PACKAGES,
          costs: GENERATION_COSTS
        }), {
          headers: { 'Content-Type': 'application/json' }
        }), corsHeaders);
      }

      // Stripe checkout session creation
      if (path === '/api/credits/checkout' && method === 'POST') {
        return addCORSHeaders(await handleStripeCheckout(request, env), corsHeaders);
      }

      // Stripe webhook handler
      if (path === '/api/stripe/webhook' && method === 'POST') {
        return await handleStripeWebhook(request, env);
      }

      // Credit balance check
      if (path === '/api/credits/balance' && method === 'GET') {
        return addCORSHeaders(await handleCreditBalance(request, env), corsHeaders);
      }

      // Image generation endpoint
      if (path === '/api/generate/image' && method === 'POST') {
        return addCORSHeaders(await handleImageGeneration(request, env), corsHeaders);
      }

      // Video generation endpoint  
      if (path === '/api/generate/video' && method === 'POST') {
        return addCORSHeaders(await handleVideoGeneration(request, env), corsHeaders);
      }

      // Task status endpoint
      if (path.startsWith('/api/generate/status/') && method === 'GET') {
        const taskId = path.split('/').pop();
        return addCORSHeaders(await handleTaskStatus(taskId, env), corsHeaders);
      }

      // User's generation history
      if (path === '/api/generate/history' && method === 'GET') {
        return addCORSHeaders(await handleGenerationHistory(request, env), corsHeaders);
      }

      // Existing ServiceFlow AI endpoints
      if (path.startsWith('/api/waitlist')) {
        const response = await handleWaitlistAPI(request, env);
        return addCORSHeaders(response, corsHeaders);
      }

      if (path.startsWith('/api/chat')) {
        const response = await handleChatAPI(request, env);
        return addCORSHeaders(response, corsHeaders);
      }

      if (path.startsWith('/api/blog')) {
        const response = await handleBlogAPI(request, env);
        return addCORSHeaders(response, corsHeaders);
      }

      // Serve static assets
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status === 404) {
        const indexRequest = new Request(new URL('/', request.url), request);
        return env.ASSETS.fetch(indexRequest);
      }
      return assetResponse;

    } catch (error) {
      console.error('Request handling error:', error);
      return addCORSHeaders(new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }), corsHeaders);
    }
  },
};

// Stripe checkout session creation
async function handleStripeCheckout(request: Request, env: Env): Promise<Response> {
  try {
    const { packageId, userEmail } = await request.json();
    
    const packageData = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES];
    if (!packageData) {
      return new Response(JSON.stringify({ error: 'Invalid package' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const stripe = require('stripe')(env.STRIPE_SECRET_KEY);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `ServiceFlow AI Credits - ${packageData.credits_fiat} credits`,
            description: 'AI Image and Video Generation Credits'
          },
          unit_amount: packageData.price_usd * 100, // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${new URL(request.url).origin}/generate?success=true`,
      cancel_url: `${new URL(request.url).origin}/generate?cancelled=true`,
      customer_email: userEmail,
      metadata: {
        packageId: packageId,
        credits: packageData.credits_fiat.toString(),
        userEmail: userEmail
      },
    });

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return new Response(JSON.stringify({ error: 'Payment processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stripe webhook handler
async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');
    
    const stripe = require('stripe')(env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.metadata.userEmail;
      const credits = parseInt(session.metadata.credits);
      
      // Add credits to user account
      await env.DB.prepare(`
        INSERT OR REPLACE INTO user_credits (email, credits, updated_at)
        VALUES (?, COALESCE((SELECT credits FROM user_credits WHERE email = ?), 0) + ?, datetime('now'))
      `).bind(userEmail, userEmail, credits).run();
      
      console.log(`Added ${credits} credits to user ${userEmail}`);
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return new Response('Webhook error', { status: 400 });
  }
}

// Credit balance check
async function handleCreditBalance(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('email');
    
    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await env.DB.prepare(
      'SELECT credits FROM user_credits WHERE email = ?'
    ).bind(userEmail).first();
    
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
async function handleImageGeneration(request: Request, env: Env): Promise<Response> {
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
    
    // Call Kie.ai API for image generation
    const response = await fetch('https://api.kie.ai/api/v1/gpt4o-image/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.KIE_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        model: model,
        callBackUrl: `${new URL(request.url).origin}/api/generate/callback`
      })
    });
    
    const result = await response.json();
    
    if (result.code === 200) {
      const taskId = result.data.taskId;
      
      // Create Durable Object for task management
      const id = env.GENERATION_TASKS.idFromName(taskId);
      const taskObject = env.GENERATION_TASKS.get(id);
      
      await taskObject.fetch(new Request(`${new URL(request.url).origin}/create`, {
        method: 'POST',
        body: JSON.stringify({
          taskId,
          userId: userEmail,
          type: 'image',
          prompt
        })
      }));
      
      return new Response(JSON.stringify({
        success: true,
        taskId: taskId,
        message: 'Image generation started'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Refund credits on failure
      await env.DB.prepare(`
        UPDATE user_credits 
        SET credits = credits + ?, updated_at = datetime('now')
        WHERE email = ?
      `).bind(requiredCredits, userEmail).run();
      
      throw new Error(result.msg || 'Generation failed');
    }
  } catch (error) {
    console.error('Image generation error:', error);
    return new Response(JSON.stringify({ error: 'Generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Video generation handler
async function handleVideoGeneration(request: Request, env: Env): Promise<Response> {
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
    
    // Call Kie.ai API for video generation
    const response = await fetch('https://api.kie.ai/api/v1/veo/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.KIE_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        model: model,
        aspectRatio: aspectRatio,
        callBackUrl: `${new URL(request.url).origin}/api/generate/callback`
      })
    });
    
    const result = await response.json();
    
    if (result.code === 200) {
      const taskId = result.data.taskId;
      
      // Create Durable Object for task management
      const id = env.GENERATION_TASKS.idFromName(taskId);
      const taskObject = env.GENERATION_TASKS.get(id);
      
      await taskObject.fetch(new Request(`${new URL(request.url).origin}/create`, {
        method: 'POST',
        body: JSON.stringify({
          taskId,
          userId: userEmail,
          type: 'video',
          prompt
        })
      }));
      
      return new Response(JSON.stringify({
        success: true,
        taskId: taskId,
        message: 'Video generation started'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Refund credits on failure
      await env.DB.prepare(`
        UPDATE user_credits 
        SET credits = credits + ?, updated_at = datetime('now')
        WHERE email = ?
      `).bind(requiredCredits, userEmail).run();
      
      throw new Error(result.msg || 'Generation failed');
    }
  } catch (error) {
    console.error('Video generation error:', error);
    return new Response(JSON.stringify({ error: 'Generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Task status checker
async function handleTaskStatus(taskId: string | undefined, env: Env): Promise<Response> {
  if (!taskId) {
    return new Response(JSON.stringify({ error: 'Task ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const id = env.GENERATION_TASKS.idFromName(taskId);
    const taskObject = env.GENERATION_TASKS.get(id);
    
    const response = await taskObject.fetch(new Request(`${new URL('http://example.com').origin}/status`));
    const taskData = await response.json();
    
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
async function handleGenerationHistory(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('email');
    
    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // This would require additional database setup to track generation history
    // For now, return empty array
    return new Response(JSON.stringify({ generations: [] }), {
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

// Utility function to add CORS headers
function addCORSHeaders(response: Response, corsHeaders: Record<string, string>): Response {
  const existingHeaders = Object.fromEntries(response.headers.entries());
  return new Response(response.body, {
    status: response.status,
    headers: { ...existingHeaders, ...corsHeaders },
  });
}

// Placeholder functions for existing functionality
async function handleWaitlistAPI(request: Request, env: Env): Promise<Response> {
  // Your existing waitlist implementation
  return new Response(JSON.stringify({ message: 'Waitlist API' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleChatAPI(request: Request, env: Env): Promise<Response> {
  // Your existing chat implementation  
  return new Response(JSON.stringify({ message: 'Chat API' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleBlogAPI(request: Request, env: Env): Promise<Response> {
  // Your existing blog implementation
  return new Response(JSON.stringify({ message: 'Blog API' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}