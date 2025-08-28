import { ServiceFlowMCP } from './mcp-agent';

interface Env {
  AI: any; // Cloudflare AI binding
  DB: D1Database;
  PORTAL_DB: D1Database;
  ASSETS: Fetcher;
  
  // Environment variables
  AGNO_AGENT_BASE_URL?: string;
  SRVCFLO_AGENT_TOKEN?: string;
  ADMIN_API_KEY?: string;
  OPENAI_API_KEY?: string;
}

// Handle traditional API routes (waitlist, blog, portal)
async function handleWaitlistAPI(request: Request, env: Env) {
  const url = new URL(request.url);
  
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { 
        businessName, 
        ownerName, 
        email, 
        phone, 
        businessType, 
        currentChallenges, 
        interestedPackage, 
        estimatedRevenue,
        utmSource,
        utmMedium,
        utmCampaign
      } = body;

      // Input validation
      if (!businessName || !ownerName || !email || !businessType) {
        return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid email format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if email already exists
      const existingEntry = await env.DB.prepare('SELECT id FROM waitlist WHERE email = ?')
        .bind(email)
        .first();
      
      if (existingEntry) {
        return new Response(JSON.stringify({ success: false, error: 'Email already registered on waitlist' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get client info
      const ipAddress = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const referrer = request.headers.get('referer') || null;

      // Calculate priority score
      let priority = 1;
      if (interestedPackage === 'enterprise') priority = 5;
      else if (interestedPackage === 'professional') priority = 4;
      else if (interestedPackage === 'starter') priority = 3;
      
      if (estimatedRevenue) {
        const revenue = parseInt(estimatedRevenue.replace(/[^0-9]/g, ''));
        if (revenue > 100000) priority = Math.min(priority + 2, 5);
        else if (revenue > 50000) priority = Math.min(priority + 1, 5);
      }

      const now = new Date().toISOString();
      
      // Generate API key for portal access
      const apiKey = `sfa_${crypto.randomUUID().replace(/-/g, '')}`;
      
      // Insert waitlist entry
      const result = await env.DB.prepare(`
        INSERT INTO waitlist (
          business_name, owner_name, email, phone, business_type, 
          current_challenges, interested_package, estimated_revenue,
          signup_date, source, status, notified, created_at, updated_at,
          ip_address, user_agent, referrer, utm_source, utm_medium, utm_campaign, priority, api_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        businessName, ownerName, email, phone || null, businessType,
        currentChallenges || null, interestedPackage || null, estimatedRevenue || null,
        now, 'landing_page', 'pending', 0, now, now,
        ipAddress, userAgent, referrer, utmSource || null, utmMedium || null, utmCampaign || null, priority, apiKey
      ).run();
      
      // Get current position in waitlist
      const position = await env.DB.prepare('SELECT COUNT(*) as count FROM waitlist WHERE created_at <= ?')
        .bind(now)
        .first();

      return new Response(JSON.stringify({
        success: true,
        waitlistId: result.meta.last_row_id,
        position: position.count,
        apiKey: apiKey,
        message: 'Successfully added to waitlist',
        portalUrl: `https://${new URL(request.url).hostname}/portal?key=${apiKey}`
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error adding to waitlist:', error);
      return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  if (request.method === 'GET') {
    try {
      const { searchParams } = new URL(request.url);
      const adminKey = searchParams.get('admin_key');

      // Public endpoint - just return count
      if (!adminKey) {
        const count = await env.DB.prepare('SELECT COUNT(*) as count FROM waitlist').first();
        return new Response(JSON.stringify({ success: true, count: count.count }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Admin endpoint - return detailed stats
      if (adminKey !== env.ADMIN_API_KEY) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid admin key' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get statistics
      const [total, pending, businessTypes, recentSignups] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM waitlist').first(),
        env.DB.prepare('SELECT COUNT(*) as count FROM waitlist WHERE status = ?').bind('pending').first(),
        env.DB.prepare('SELECT business_type, COUNT(*) as count FROM waitlist GROUP BY business_type ORDER BY count DESC').all(),
        env.DB.prepare('SELECT * FROM waitlist ORDER BY created_at DESC LIMIT 10').all()
      ]);

      return new Response(JSON.stringify({
        success: true,
        stats: {
          total: total.count,
          pending: pending.count,
          businessTypes: businessTypes.results.map(row => ({ _id: row.business_type, count: row.count })),
          recentSignups: recentSignups.results
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching waitlist stats:', error);
      return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle legacy chat API for backwards compatibility
async function handleLegacyChatAPI(request: Request, env: Env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await request.json();
    const { message, user_id, context, intent } = data;
    
    if (!message) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Message is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create a ServiceFlow MCP instance for handling the request
    const mcpAgent = new ServiceFlowMCP();
    mcpAgent.env = env;

    // Use smart routing to handle the request (landing page = general assistance only)
    const result = await mcpAgent.server.callTool('general_assistance', {
      message,
      context: context || ''
    });

    const responseText = result.content?.[0]?.text || 'I apologize, but I encountered an error processing your request.';

    return new Response(JSON.stringify({
      success: true,
      response: responseText,
      agent_used: 'ServiceFlow MCP Agent',
      user_id: user_id || 'anonymous',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Legacy chat API error:', error);
    
    // Fallback response
    return new Response(JSON.stringify({
      success: true,
      response: "Hi! I'm the ServiceFlow AI assistant. I can help you learn about our automation platform for service businesses. We provide 24/7 customer service, smart scheduling, and lead qualification. How can I help you today?",
      agent_used: "Fallback Handler",
      user_id: user_id || 'anonymous',
      timestamp: new Date().toISOString(),
      note: 'System temporarily unavailable'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Blog API handler (simplified for brevity)
async function handleBlogAPI(request: Request, env: Env) {
  if (request.method === 'GET') {
    const mockPosts = [
      {
        id: "1",
        title: "How AI Automation Saved Johnson Roofing $50,000 in Missed Calls",
        slug: "ai-automation-saved-johnson-roofing-50k",
        excerpt: "Discover how Johnson Roofing transformed their emergency call handling with AI and never missed another 3 AM customer again.",
        content: "# AI Automation Success Story\n\nJohnson Roofing implemented ServiceFlow AI and saw immediate results...",
        author: "SrvcFlo AI",
        category: "Success Stories",
        tags: ["AI Automation", "Roofing", "Emergency Calls", "ROI"],
        created_at: new Date(Date.now() - 86400000).toISOString(),
        views: 1250,
        featured_image_prompt: "Professional roofer using smartphone with AI interface at night"
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      posts: mockPosts,
      total: mockPosts.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // MCP endpoints - support both SSE and Streamable HTTP
    if (url.pathname.startsWith('/mcp')) {
      try {
        return ServiceFlowMCP.serve('/mcp').fetch(request, env, ctx);
      } catch (error) {
        console.error('MCP Streamable HTTP error:', error);
        return new Response('MCP service unavailable', { status: 503 });
      }
    }

    if (url.pathname.startsWith('/sse')) {
      try {
        return ServiceFlowMCP.serveSSE('/sse').fetch(request, env, ctx);
      } catch (error) {
        console.error('MCP SSE error:', error);
        return new Response('SSE service unavailable', { status: 503 });
      }
    }

    // Traditional API routes
    if (url.pathname.startsWith('/api/waitlist')) {
      const response = await handleWaitlistAPI(request, env);
      return addCORSHeaders(response);
    }

    if (url.pathname.startsWith('/api/chat')) {
      const response = await handleLegacyChatAPI(request, env);
      return addCORSHeaders(response);
    }

    if (url.pathname.startsWith('/api/blog')) {
      const response = await handleBlogAPI(request, env);
      return addCORSHeaders(response);
    }

    // Serve static assets
    const assetResponse = await env.ASSETS.fetch(request);
    
    // If asset not found, serve index.html for client-side routing
    if (assetResponse.status === 404) {
      const indexRequest = new Request(new URL('/', request.url), request);
      return env.ASSETS.fetch(indexRequest);
    }
    
    return assetResponse;
  },
};

function addCORSHeaders(response: Response): Response {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  const existingHeaders = Object.fromEntries(response.headers.entries());
  
  return new Response(response.body, {
    status: response.status,
    headers: { ...existingHeaders, ...corsHeaders },
  });
}