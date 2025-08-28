// Simple MCP implementation for Cloudflare Workers
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

// MCP Tool Response format
interface MCPToolResponse {
  content: Array<{
    type: "text" | "image";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
}

// General ServiceFlow AI assistance using Cloudflare AI
async function generalAssistance(message: string, context: string = '', env: Env): Promise<MCPToolResponse> {
  try {
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content: `You are the ServiceFlow AI assistant for the public landing page. Help visitors learn about ServiceFlow AI.

Key information about ServiceFlow AI:
- AI automation platform for service businesses (contractors, salons, repair services, etc.)
- Provides 24/7 customer service, smart scheduling, lead qualification, business intelligence
- Over 500 businesses on waitlist
- Average 400% ROI for customers
- Pricing: Starter ($200/month), Professional ($600/month), Enterprise ($1000/month)
- Easy 24-hour setup process

IMPORTANT: You can only provide general information about ServiceFlow AI. You cannot:
- Access admin tools or backend systems
- Generate content or code
- Access specialized business tools
- Route to backend agents

Keep responses focused on helping potential customers understand the value of ServiceFlow AI for their service business.
${context ? `\nUser context: ${context}` : ''}`
        },
        {
          role: 'user',
          content: message
        }
      ]
    });

    return {
      content: [
        {
          type: "text",
          text: response.response || "I'm the ServiceFlow AI assistant. I help service businesses learn about AI automation. We provide 24/7 customer service, smart scheduling, and lead qualification for contractors, salons, repair services, and more. Join our waitlist to be among the first to access our platform! How can I help you today?"
        }
      ]
    };
  } catch (error) {
    console.error('Cloudflare AI error:', error);
    return {
      content: [
        {
          type: "text", 
          text: "I'm the ServiceFlow AI assistant. I help service businesses learn about AI automation. We provide 24/7 customer service, smart scheduling, and lead qualification for contractors, salons, repair services, and more. Join our waitlist to be among the first to access our platform! How can I help you today?"
        }
      ]
    };
  }
}

// Route to backend agents (admin only)
async function routeToBackendAgent(
  message: string, 
  agentType: 'srvcflo' | 'agno', 
  adminApiKey: string, 
  userId: string = 'mcp-agent',
  env: Env
): Promise<MCPToolResponse> {
  // Verify admin access
  if (!adminApiKey || adminApiKey !== env.ADMIN_API_KEY) {
    return {
      content: [
        {
          type: "text",
          text: "🔒 Access denied. This tool requires valid admin credentials. Backend agent routing is only available to site administrators."
        }
      ]
    };
  }

  try {
    const baseUrl = env.AGNO_AGENT_BASE_URL || 'http://localhost:8000';
    const endpoint = agentType === 'srvcflo' ? '/srvcflo-agent' : '/agno-assist';
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.SRVCFLO_AGENT_TOKEN || 'default-token'}`,
      },
      body: JSON.stringify({
        message,
        user_id: userId,
        context: { 
          source: 'cloudflare_mcp', 
          timestamp: new Date().toISOString()
        }
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return {
          content: [
            {
              type: "text",
              text: `${result.response}\n\n[🔧 Admin Tool - Handled by: ${agentType === 'srvcflo' ? 'ServiceFlow Strategy Team' : 'Technical Implementation Team'}]`
            }
          ]
        };
      }
    }

    throw new Error(`Backend agent ${agentType} unavailable`);
  } catch (error) {
    console.error(`Backend agent ${agentType} error:`, error);
    
    // Fallback to Cloudflare AI with specialized context
    const specializedContext = agentType === 'srvcflo' 
      ? "Focus on business strategy, growth planning, competitive analysis, and marketing automation for service businesses."
      : "Focus on technical implementation, API integrations, code solutions, and development guidance.";

    try {
      const fallbackResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          {
            role: 'system',
            content: `You are a ServiceFlow AI specialist. ${specializedContext} Provide detailed, actionable advice for service business owners.`
          },
          {
            role: 'user',
            content: message
          }
        ]
      });

      return {
        content: [
          {
            type: "text",
            text: `${fallbackResponse.response}\n\n[🔧 Admin Tool - Note: Backend agents temporarily unavailable, using AI specialist mode]`
          }
        ]
      };
    } catch (fallbackError) {
      return {
        content: [
          {
            type: "text",
            text: "I apologize, but our specialized agents are currently unavailable. Please try again later or contact support for immediate assistance."
          }
        ]
      };
    }
  }
}

// Admin functions
async function adminFunctions(
  adminFunction: 'waitlist_stats' | 'user_analytics' | 'system_status',
  apiKey: string,
  env: Env
): Promise<MCPToolResponse> {
  // Verify admin access
  if (!apiKey || apiKey !== env.ADMIN_API_KEY) {
    return {
      content: [
        {
          type: "text",
          text: "Access denied. Valid admin credentials required."
        }
      ]
    };
  }

  try {
    switch (adminFunction) {
      case 'waitlist_stats':
        const [total, pending, businessTypes] = await Promise.all([
          env.DB.prepare('SELECT COUNT(*) as count FROM waitlist').first(),
          env.DB.prepare('SELECT COUNT(*) as count FROM waitlist WHERE status = ?').bind('pending').first(),
          env.DB.prepare('SELECT business_type, COUNT(*) as count FROM waitlist GROUP BY business_type ORDER BY count DESC LIMIT 10').all()
        ]);

        const stats = {
          total: total?.count || 0,
          pending: pending?.count || 0,
          businessTypes: businessTypes?.results || []
        };

        return {
          content: [
            {
              type: "text",
              text: `Waitlist Statistics:\n${JSON.stringify(stats, null, 2)}`
            }
          ]
        };
        
      case 'user_analytics':
        return {
          content: [
            {
              type: "text", 
              text: `User Analytics:\n${JSON.stringify({
                activeConnections: 1,
                timestamp: new Date().toISOString()
              }, null, 2)}`
            }
          ]
        };
        
      case 'system_status':
        const cloudflareAIStatus = await testCloudflareAI(env);
        const backendAgentStatus = await testBackendAgents(env);
        const dbStatus = await testDatabase(env);
        
        const systemStatus = {
          cloudflareAI: cloudflareAIStatus,
          backendAgents: backendAgentStatus,
          database: dbStatus,
          timestamp: new Date().toISOString()
        };

        return {
          content: [
            {
              type: "text",
              text: `System Status:\n${JSON.stringify(systemStatus, null, 2)}`
            }
          ]
        };
        
      default:
        return {
          content: [
            {
              type: "text",
              text: "Unknown admin function requested."
            }
          ]
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Admin function error: ${error.message}`
        }
      ]
    };
  }
}

// Helper functions
async function testCloudflareAI(env: Env): Promise<string> {
  try {
    await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'user', content: 'test' }]
    });
    return 'operational';
  } catch (error) {
    return 'error';
  }
}

async function testBackendAgents(env: Env): Promise<string> {
  try {
    const baseUrl = env.AGNO_AGENT_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${baseUrl}/health`, { method: 'GET' });
    return response.ok ? 'operational' : 'error';
  } catch (error) {
    return 'unavailable';
  }
}

async function testDatabase(env: Env): Promise<string> {
  try {
    await env.DB.prepare('SELECT 1').first();
    return 'operational';
  } catch (error) {
    return 'error';
  }
}

// Smart routing function
async function smartRouteRequest(
  message: string, 
  userType: 'visitor' | 'waitlist' | 'admin' = 'visitor',
  adminApiKey?: string,
  env: Env
): Promise<MCPToolResponse> {
  const lowerMessage = message.toLowerCase();
  
  // Check for admin patterns
  if (lowerMessage.includes('admin') || lowerMessage.includes('dashboard') || lowerMessage.includes('analytics') || lowerMessage.includes('backend') || lowerMessage.includes('agent')) {
    if (!adminApiKey || adminApiKey !== env.ADMIN_API_KEY) {
      return {
        content: [
          {
            type: "text",
            text: "🔒 This appears to be an admin-related request. Advanced tools and backend agent access are only available to site administrators. For general questions about ServiceFlow AI, I'm happy to help!"
          }
        ]
      };
    }
    
    return {
      content: [
        {
          type: "text",
          text: "🔧 Admin access confirmed. Available tools:\n- Backend agent routing (SrvcFlo/Agno)\n- System management functions\n- Waitlist analytics\n\nWhat would you like to do?"
        }
      ]
    };
  }
  
  // Check for technical patterns (admin only)
  if (lowerMessage.includes('code') || lowerMessage.includes('api') || lowerMessage.includes('integration') || lowerMessage.includes('technical')) {
    if (!adminApiKey || adminApiKey !== env.ADMIN_API_KEY) {
      return {
        content: [
          {
            type: "text",
            text: "I can provide general information about ServiceFlow AI's technical capabilities, but detailed technical support and code generation tools are only available to site administrators. ServiceFlow AI offers API integrations, webhook support, and technical documentation for our customers. Would you like to learn more about our platform's capabilities?"
          }
        ]
      };
    }
    
    return await routeToBackendAgent(message, 'agno', adminApiKey, `smart_route_admin_${Date.now()}`, env);
  }
  
  // Check for business strategy patterns (admin only)
  if (lowerMessage.includes('strategy') || lowerMessage.includes('business plan') || lowerMessage.includes('competition') || lowerMessage.includes('marketing') || lowerMessage.includes('growth')) {
    if (!adminApiKey || adminApiKey !== env.ADMIN_API_KEY) {
      return {
        content: [
          {
            type: "text",
            text: "I can share general information about how ServiceFlow AI helps with business growth and automation strategies. Our platform helps service businesses with lead generation, customer service automation, and scheduling optimization. For detailed business strategy consulting, our professional services are available to customers. Would you like to learn more about joining our waitlist?"
          }
        ]
      };
    }
    
    return await routeToBackendAgent(message, 'srvcflo', adminApiKey, `smart_route_admin_${Date.now()}`, env);
  }
  
  // Default to general assistance
  return await generalAssistance(message, '', env);
}

// Handle MCP tool calls
async function handleMCPToolCall(toolName: string, parameters: any, env: Env): Promise<MCPToolResponse> {
  switch (toolName) {
    case 'general_assistance':
      return await generalAssistance(parameters.message, parameters.context || '', env);
      
    case 'route_to_backend_agent':
      return await routeToBackendAgent(
        parameters.message,
        parameters.agent_type,
        parameters.admin_api_key,
        parameters.user_id,
        env
      );
      
    case 'admin_functions':
      return await adminFunctions(
        parameters.function,
        parameters.api_key,
        env
      );
      
    case 'smart_route_request':
      return await smartRouteRequest(
        parameters.message,
        parameters.user_type,
        parameters.admin_api_key,
        env
      );
      
    default:
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${toolName}`
          }
        ]
      };
  }
}

// Handle MCP requests (both SSE and HTTP)
async function handleMCPRequest(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    
    if (body.method === 'tools/call') {
      const { name, arguments: args } = body.params;
      const result = await handleMCPToolCall(name, args, env);
      
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        result
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (body.method === 'tools/list') {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          tools: [
            {
              name: 'general_assistance',
              description: 'Provide general information about ServiceFlow AI',
              inputSchema: {
                type: 'object',
                properties: {
                  message: { type: 'string', description: 'User message' },
                  context: { type: 'string', description: 'Additional context' }
                },
                required: ['message']
              }
            },
            {
              name: 'route_to_backend_agent',
              description: 'Route to backend agents (admin only)',
              inputSchema: {
                type: 'object',
                properties: {
                  message: { type: 'string', description: 'User message' },
                  agent_type: { type: 'string', enum: ['srvcflo', 'agno'] },
                  admin_api_key: { type: 'string', description: 'Admin API key' },
                  user_id: { type: 'string', description: 'User ID' }
                },
                required: ['message', 'agent_type', 'admin_api_key']
              }
            },
            {
              name: 'admin_functions',
              description: 'Admin system functions',
              inputSchema: {
                type: 'object',
                properties: {
                  function: { type: 'string', enum: ['waitlist_stats', 'user_analytics', 'system_status'] },
                  api_key: { type: 'string', description: 'Admin API key' }
                },
                required: ['function', 'api_key']
              }
            },
            {
              name: 'smart_route_request',
              description: 'Smart routing for user requests',
              inputSchema: {
                type: 'object',
                properties: {
                  message: { type: 'string', description: 'User message' },
                  user_type: { type: 'string', enum: ['visitor', 'waitlist', 'admin'] },
                  admin_api_key: { type: 'string', description: 'Admin API key' }
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
          capabilities: {
            tools: {}
          },
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
      error: {
        code: -32601,
        message: 'Method not found'
      }
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('MCP request error:', error);
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error'
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export { 
  handleMCPRequest, 
  generalAssistance, 
  routeToBackendAgent, 
  adminFunctions, 
  smartRouteRequest 
};