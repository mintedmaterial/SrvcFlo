import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

interface Env {
  AI: any; // Cloudflare AI binding
  DB: D1Database;
  PORTAL_DB: D1Database;
  ASSETS: Fetcher;
  
  // Environment variables
  AGNO_AGENT_BASE_URL?: string;
  SRVCFLO_AGENT_TOKEN?: string;
  ADMIN_API_KEY?: string;
}

interface State {
  userType: 'visitor' | 'waitlist' | 'admin';
  conversationHistory: Array<{role: string, content: string, timestamp: string}>;
  routingPreference: 'auto' | 'general' | 'technical' | 'business';
}

interface AuthContext {
  userId?: string;
  apiKey?: string;
  permissions?: string[];
  isAdmin?: boolean;
}

export class ServiceFlowMCP extends McpAgent<Env, State, AuthContext> {
  server = new McpServer({
    name: "ServiceFlow AI",
    version: "1.0.0",
  });

  initialState: State = {
    userType: 'visitor',
    conversationHistory: [],
    routingPreference: 'auto'
  };

  async init() {
    // Tool: General ServiceFlow AI assistance (Public - Landing Page)
    this.server.tool(
      "general_assistance",
      "Provide general information about ServiceFlow AI and service business automation (Public access)",
      {
        message: z.string().describe("User's question or request"),
        context: z.string().optional().describe("Additional context about the user's business or situation")
      },
      async ({ message, context }) => {
        try {
          // Use Cloudflare Workers AI for general assistance
          const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
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

          // Update conversation history
          this.setState({
            ...this.state,
            conversationHistory: [
              ...this.state.conversationHistory,
              { role: 'user', content: message, timestamp: new Date().toISOString() },
              { role: 'assistant', content: response.response, timestamp: new Date().toISOString() }
            ].slice(-10) // Keep last 10 messages
          });

          return {
            content: [
              {
                type: "text",
                text: response.response
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
    );

    // Tool: Route to backend agents (ADMIN ONLY)
    this.server.tool(
      "route_to_backend_agent",
      "Route complex requests to specialized backend agents (ADMIN ACCESS REQUIRED)",
      {
        message: z.string().describe("User's request that needs specialized handling"),
        agent_type: z.enum(['srvcflo', 'agno']).describe("Type of agent to route to"),
        admin_api_key: z.string().describe("Admin API key for authentication"),
        user_id: z.string().optional().describe("User identifier for tracking")
      },
      async ({ message, agent_type, admin_api_key, user_id }) => {
        // Verify admin access first
        if (!admin_api_key || admin_api_key !== this.env.ADMIN_API_KEY) {
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
          const baseUrl = this.env.AGNO_AGENT_BASE_URL || 'http://localhost:8000';
          const endpoint = agent_type === 'srvcflo' ? '/srvcflo-agent' : '/agno-assist';
          
          const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.env.SRVCFLO_AGENT_TOKEN || 'default-token'}`,
            },
            body: JSON.stringify({
              message,
              user_id: user_id || 'mcp-agent',
              context: { 
                source: 'cloudflare_mcp', 
                timestamp: new Date().toISOString(),
                conversation_history: this.state.conversationHistory.slice(-3)
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
                    text: `${result.response}\n\n[🔧 Admin Tool - Handled by: ${agent_type === 'srvcflo' ? 'ServiceFlow Strategy Team' : 'Technical Implementation Team'}]`
                  }
                ]
              };
            }
          }

          throw new Error(`Backend agent ${agent_type} unavailable`);
        } catch (error) {
          console.error(`Backend agent ${agent_type} error:`, error);
          
          // Fallback to Cloudflare AI with specialized context
          const specializedContext = agent_type === 'srvcflo' 
            ? "Focus on business strategy, growth planning, competitive analysis, and marketing automation for service businesses."
            : "Focus on technical implementation, API integrations, code solutions, and development guidance.";

          try {
            const fallbackResponse = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
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
    );

    // Tool: Admin functions (requires authentication)
    this.server.tool(
      "admin_functions",
      "Access admin tools for business management and analytics (requires authentication)",
      {
        function: z.enum(['waitlist_stats', 'user_analytics', 'system_status']).describe("Admin function to execute"),
        api_key: z.string().describe("Admin API key for authentication")
      },
      async ({ function: adminFunction, api_key }) => {
        // Verify admin access
        if (!api_key || api_key !== this.env.ADMIN_API_KEY) {
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
              const stats = await this.getWaitlistStats();
              return {
                content: [
                  {
                    type: "text",
                    text: `Waitlist Statistics:\n${JSON.stringify(stats, null, 2)}`
                  }
                ]
              };
              
            case 'user_analytics':
              const analytics = await this.getUserAnalytics();
              return {
                content: [
                  {
                    type: "text", 
                    text: `User Analytics:\n${JSON.stringify(analytics, null, 2)}`
                  }
                ]
              };
              
            case 'system_status':
              const status = await this.getSystemStatus();
              return {
                content: [
                  {
                    type: "text",
                    text: `System Status:\n${JSON.stringify(status, null, 2)}`
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
    );

    // Tool: Smart routing decision (Public + Admin)
    this.server.tool(
      "smart_route_request", 
      "Automatically determine the best way to handle a user request",
      {
        message: z.string().describe("User's message"),
        user_type: z.enum(['visitor', 'waitlist', 'admin']).optional().describe("Type of user making the request"),
        admin_api_key: z.string().optional().describe("Admin API key if user has admin access")
      },
      async ({ message, user_type = 'visitor', admin_api_key }) => {
        // Determine routing based on message content
        const lowerMessage = message.toLowerCase();
        
        // Check for admin patterns
        if (lowerMessage.includes('admin') || lowerMessage.includes('dashboard') || lowerMessage.includes('analytics') || lowerMessage.includes('backend') || lowerMessage.includes('agent')) {
          if (!admin_api_key || admin_api_key !== this.env.ADMIN_API_KEY) {
            return {
              content: [
                {
                  type: "text",
                  text: "🔒 This appears to be an admin-related request. Advanced tools and backend agent access are only available to site administrators. For general questions about ServiceFlow AI, I'm happy to help!"
                }
              ]
            };
          }
          
          // Admin authenticated - provide admin guidance
          return {
            content: [
              {
                type: "text",
                text: "🔧 Admin access confirmed. You can use the following tools:\n- `route_to_backend_agent` for SrvcFlo or Agno agents\n- `admin_functions` for system management\n\nWhat would you like to do?"
              }
            ]
          };
        }
        
        // Check for technical patterns (admin only)
        if (lowerMessage.includes('code') || lowerMessage.includes('api') || lowerMessage.includes('integration') || lowerMessage.includes('technical')) {
          if (!admin_api_key || admin_api_key !== this.env.ADMIN_API_KEY) {
            return {
              content: [
                {
                  type: "text",
                  text: "I can provide general information about ServiceFlow AI's technical capabilities, but detailed technical support and code generation tools are only available to site administrators. ServiceFlow AI offers API integrations, webhook support, and technical documentation for our customers. Would you like to learn more about our platform's capabilities?"
                }
              ]
            };
          }
          
          // Admin can access backend agents
          try {
            return await this.server.callTool('route_to_backend_agent', {
              message,
              agent_type: 'agno',
              admin_api_key,
              user_id: `smart_route_admin_${Date.now()}`
            });
          } catch (error) {
            return await this.server.callTool('general_assistance', { message });
          }
        }
        
        // Check for business strategy patterns (admin only)
        if (lowerMessage.includes('strategy') || lowerMessage.includes('business plan') || lowerMessage.includes('competition') || lowerMessage.includes('marketing') || lowerMessage.includes('growth')) {
          if (!admin_api_key || admin_api_key !== this.env.ADMIN_API_KEY) {
            return {
              content: [
                {
                  type: "text",
                  text: "I can share general information about how ServiceFlow AI helps with business growth and automation strategies. Our platform helps service businesses with lead generation, customer service automation, and scheduling optimization. For detailed business strategy consulting, our professional services are available to customers. Would you like to learn more about joining our waitlist?"
                }
              ]
            };
          }
          
          // Admin can access backend agents
          try {
            return await this.server.callTool('route_to_backend_agent', {
              message,
              agent_type: 'srvcflo',
              admin_api_key,
              user_id: `smart_route_admin_${Date.now()}`
            });
          } catch (error) {
            return await this.server.callTool('general_assistance', { message });
          }
        }
        
        // Default to general assistance for all users
        return await this.server.callTool('general_assistance', { message });
      }
    );
  }

  // Helper methods for admin functions
  private async getWaitlistStats() {
    const [total, pending, businessTypes] = await Promise.all([
      this.env.DB.prepare('SELECT COUNT(*) as count FROM waitlist').first(),
      this.env.DB.prepare('SELECT COUNT(*) as count FROM waitlist WHERE status = ?').bind('pending').first(),
      this.env.DB.prepare('SELECT business_type, COUNT(*) as count FROM waitlist GROUP BY business_type ORDER BY count DESC LIMIT 10').all()
    ]);

    return {
      total: total?.count || 0,
      pending: pending?.count || 0,
      businessTypes: businessTypes?.results || []
    };
  }

  private async getUserAnalytics() {
    // Return MCP session analytics
    return {
      activeConnections: 1, // This would be tracked in a real implementation
      conversationLength: this.state.conversationHistory.length,
      userType: this.state.userType,
      routingPreference: this.state.routingPreference
    };
  }

  private async getSystemStatus() {
    const cloudflareAIStatus = await this.testCloudflareAI();
    const backendAgentStatus = await this.testBackendAgents();
    
    return {
      cloudflareAI: cloudflareAIStatus,
      backendAgents: backendAgentStatus,
      database: await this.testDatabase(),
      timestamp: new Date().toISOString()
    };
  }

  private async testCloudflareAI(): Promise<string> {
    try {
      await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [{ role: 'user', content: 'test' }]
      });
      return 'operational';
    } catch (error) {
      return 'error';
    }
  }

  private async testBackendAgents(): Promise<string> {
    try {
      const baseUrl = this.env.AGNO_AGENT_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/health`, { method: 'GET' });
      return response.ok ? 'operational' : 'error';
    } catch (error) {
      return 'unavailable';
    }
  }

  private async testDatabase(): Promise<string> {
    try {
      await this.env.DB.prepare('SELECT 1').first();
      return 'operational';
    } catch (error) {
      return 'error';
    }
  }

  onStateUpdate(state: State) {
    console.log('ServiceFlow MCP state update:', state);
  }
}