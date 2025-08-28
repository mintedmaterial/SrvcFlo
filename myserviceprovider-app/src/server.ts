import { Agent } from "agents";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export class ServiceFlowAgent extends Agent {
  async onRequest(request) {
    try {
      const { message, user_id, context } = await request.json();
      
      if (!message) {
        return Response.json({ 
          success: false, 
          error: 'Message is required' 
        }, { status: 400 });
      }

      // Determine routing based on message content
      const shouldRouteToSrvcFlo = message.toLowerCase().includes('strategy') || 
                                  message.toLowerCase().includes('business plan') ||
                                  message.toLowerCase().includes('competition') ||
                                  message.toLowerCase().includes('marketing') ||
                                  message.toLowerCase().includes('growth');
      
      const shouldRouteToAgno = message.toLowerCase().includes('code') ||
                               message.toLowerCase().includes('script') ||
                               message.toLowerCase().includes('technical') ||
                               message.toLowerCase().includes('api') ||
                               message.toLowerCase().includes('integration');

      // Route to backend agents if needed
      if (shouldRouteToSrvcFlo) {
        try {
          const response = await this.callBackendAgent('srvcflo-agent', message, user_id);
          if (response) {
            return Response.json({
              success: true,
              response: response.response,
              agent_used: response.agent_used || 'SrvcFlo Team',
              user_id: user_id || 'anonymous',
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('SrvcFlo agent error:', error);
        }
      }

      if (shouldRouteToAgno) {
        try {
          const response = await this.callBackendAgent('agno-assist', message, user_id);
          if (response) {
            return Response.json({
              success: true,
              response: response.response,
              agent_used: response.agent_used || 'Agno Assist',
              user_id: user_id || 'anonymous',
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Agno Assist error:', error);
        }
      }

      // Handle with AI for general questions
      const { text } = await generateText({
        model: openai("gpt-4o-mini", {
          apiKey: this.env.OPENAI_API_KEY,
        }),
        system: this.getSystemPrompt(),
        prompt: message,
        maxTokens: 500,
        temperature: 0.7,
      });

      return Response.json({
        success: true,
        response: text,
        agent_used: 'ServiceFlow AI Assistant',
        user_id: user_id || 'anonymous',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('ServiceFlow Agent error:', error);
      
      return Response.json({
        success: true,
        response: "I'm experiencing technical difficulties right now. ServiceFlow AI is an automation platform for service businesses that provides 24/7 customer service, smart scheduling, and lead qualification. Join our waitlist to be among the first to access our full platform!",
        agent_used: "Fallback Handler",
        user_id: 'anonymous',
        timestamp: new Date().toISOString(),
        note: 'System temporarily unavailable'
      });
    }
  }

  async callBackendAgent(agentType, message, user_id) {
    const baseUrl = this.env.AGNO_AGENT_BASE_URL || 'http://localhost:8000';
    const url = `${baseUrl}/${agentType}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.env.SRVCFLO_AGENT_TOKEN || 'default-token'}`,
        },
        body: JSON.stringify({
          message,
          user_id: user_id || 'cloudflare-agent',
          context: { 
            source: 'cloudflare_frontend', 
            timestamp: new Date().toISOString() 
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result;
        }
      }
    } catch (error) {
      console.error(`Backend agent ${agentType} error:`, error);
    }
    
    return null;
  }

  getSystemPrompt() {
    return `You are the ServiceFlow AI assistant, a helpful AI agent for service businesses.

Your role is to:
1. Help potential customers learn about ServiceFlow AI automation platform
2. Answer questions about service business automation and AI implementation  
3. Provide helpful information about our waitlist and features

Key information about ServiceFlow AI:
- We're an AI automation platform specifically for service businesses (contractors, salons, repair services, etc.)
- We provide 24/7 customer service, smart scheduling, lead qualification, and business intelligence
- Over 500 businesses are currently on our waitlist
- Average 400% ROI for our customers
- Easy 24-hour setup process

For pricing questions: We offer starter packages from $200/month, professional suites at $600/month, and enterprise solutions at $1000/month.

For waitlist questions: We currently have over 500 businesses waiting for early access to our platform.

Always be helpful, professional, and focus on how AI can transform service businesses.`;
  }
}