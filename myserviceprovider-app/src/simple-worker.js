// Simple Cloudflare Worker with MCP support
import { handleWaitlistAPI, handleBlogAPI } from './worker.js';

// Simple MCP tool: General ServiceFlow AI assistance
async function handleGeneralAssistance(message, context = '', env) {
  try {
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content: `You are the ServiceFlow AI assistant. Help visitors learn about ServiceFlow AI.

Key information:
- AI automation platform for service businesses (contractors, salons, repair services, etc.)
- Provides 24/7 customer service, smart scheduling, lead qualification
- Over 500 businesses on waitlist
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

// Simple MCP request handler
async function handleMCPRequest(request, env) {
  try {
    const body = await request.json();
    
    // Handle tool calls
    if (body.method === 'tools/call') {
      const { name, arguments: args } = body.params;
      
      if (name === 'general_assistance') {
        const result = await handleGeneralAssistance(args.message, args.context, env);
        
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
              name: 'general_assistance',
              description: 'Get general information about ServiceFlow AI',
              inputSchema: {
                type: 'object',
                properties: {
                  message: { type: 'string', description: 'User message' },
                  context: { type: 'string', description: 'Additional context' }
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
            name: 'ServiceFlow AI MCP Server',
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

// Chat API using Cloudflare AI
async function handleChatAPI(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await request.json();
    const { message, user_id, context } = data;
    
    if (!message) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Message is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use our MCP general assistance function
    const responseText = await handleGeneralAssistance(message, context || '', env);

    return new Response(JSON.stringify({
      success: true,
      response: responseText,
      agent_used: 'ServiceFlow AI (Cloudflare AI)',
      user_id: user_id || 'anonymous',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return new Response(JSON.stringify({
      success: true,
      response: "Hi! I'm the ServiceFlow AI assistant. I help service businesses learn about AI automation. We provide 24/7 customer service, smart scheduling, and lead qualification. Join our waitlist to be among the first to access our platform!",
      agent_used: "Fallback Handler",
      user_id: user_id || 'anonymous',
      timestamp: new Date().toISOString(),
      note: 'System temporarily unavailable'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function addCORSHeaders(response) {
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS
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

    // MCP endpoints
    if (url.pathname.startsWith('/mcp')) {
      const response = await handleMCPRequest(request, env);
      return addCORSHeaders(response);
    }

    // SSE endpoint (simple wrapper)
    if (url.pathname.startsWith('/sse')) {
      if (request.method === 'POST') {
        const response = await handleMCPRequest(request, env);
        const result = await response.json();
        
        return new Response(`data: ${JSON.stringify(result)}\n\n`, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
      return new Response('SSE endpoint - POST required', { status: 400 });
    }

    // Chat API
    if (url.pathname.startsWith('/api/chat')) {
      const response = await handleChatAPI(request, env);
      return addCORSHeaders(response);
    }

    // Waitlist API (import from existing worker)
    if (url.pathname.startsWith('/api/waitlist')) {
      const response = await handleWaitlistAPI(request, env);
      return addCORSHeaders(response);
    }

    // Blog API (import from existing worker)
    if (url.pathname.startsWith('/api/blog')) {
      const response = await handleBlogAPI(request, env);
      return addCORSHeaders(response);
    }

    // Serve static assets
    const assetResponse = await env.ASSETS.fetch(request);
    
    if (assetResponse.status === 404) {
      const indexRequest = new Request(new URL('/', request.url), request);
      return env.ASSETS.fetch(indexRequest);
    }
    
    return assetResponse;
  },
};