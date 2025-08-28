import { tool } from 'agents';
import { z } from 'zod';

// Tool to route chat requests to SrvcFlo Team Agent
export const chatWithSrvcFlo = tool({
  description: "Chat with the SrvcFlo Team Lead Agent for general service business questions, strategy, and guidance",
  parameters: z.object({
    message: z.string().describe("The user's message to send to the SrvcFlo team"),
    user_id: z.string().optional().describe("Optional user identifier for context"),
  }),
  execute: async ({ message, user_id }, { env }) => {
    try {
      const agentUrl = `${env.AGNO_AGENT_BASE_URL || 'http://localhost:8000'}/srvcflo-agent`;
      
      const response = await fetch(agentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.SRVCFLO_AGENT_TOKEN || 'default-token'}`,
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

      if (!response.ok) {
        throw new Error(`SrvcFlo Agent error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          response: result.response,
          agent_used: result.agent_used,
          routing_decision: result.context?.routing_decision || 'unknown'
        };
      } else {
        throw new Error(result.error || 'Unknown agent error');
      }
    } catch (error) {
      console.error('Error calling SrvcFlo agent:', error);
      return {
        response: "I'm having trouble connecting to our service team right now. Please try again in a moment, or join our waitlist to be notified when the full system is available!",
        agent_used: "Fallback Handler",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

// Tool to route code generation requests to Agno Assist
export const generateCodeWithAgno = tool({
  description: "Generate code, scripts, or technical solutions using the Agno Assist framework",
  parameters: z.object({
    message: z.string().describe("The technical request or code generation task"),
    user_id: z.string().optional().describe("Optional user identifier for context"),
  }),
  execute: async ({ message, user_id }, { env }) => {
    try {
      const agentUrl = `${env.AGNO_AGENT_BASE_URL || 'http://localhost:8000'}/agno-assist`;
      
      const response = await fetch(agentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.SRVCFLO_AGENT_TOKEN || 'default-token'}`,
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

      if (!response.ok) {
        throw new Error(`Agno Assist error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          response: result.response,
          agent_used: result.agent_used,
          code_generated: true
        };
      } else {
        throw new Error(result.error || 'Unknown agent error');
      }
    } catch (error) {
      console.error('Error calling Agno Assist:', error);
      return {
        response: "I'm having trouble with code generation right now. Please try a simpler request or join our waitlist for full access to our development tools.",
        agent_used: "Fallback Handler",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

// Tool to get waitlist information
export const getWaitlistInfo = tool({
  description: "Get current waitlist count and information about ServiceFlow AI",
  parameters: z.object({}),
  execute: async (_, { env }) => {
    try {
      // This would normally query your database
      // For now, return static information about ServiceFlow AI
      return {
        response: "ServiceFlow AI is currently in beta with over 500 businesses on our waitlist! We're an AI-powered automation platform specifically designed for service businesses. Join our waitlist to be among the first to access features like 24/7 customer service, smart scheduling, and lead qualification.",
        waitlist_count: "500+",
        features: [
          "24/7 AI Customer Service",
          "Smart Appointment Scheduling", 
          "Automated Lead Qualification",
          "Business Intelligence Dashboard",
          "Multi-channel Communication"
        ]
      };
    } catch (error) {
      console.error('Error getting waitlist info:', error);
      return {
        response: "ServiceFlow AI is an AI automation platform for service businesses. Join our waitlist to be notified when we launch!",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

// Tool to handle general business questions
export const answerBusinessQuestion = tool({
  description: "Answer general questions about service business automation and AI implementation",
  parameters: z.object({
    question: z.string().describe("The business question to answer"),
    business_type: z.string().optional().describe("Type of service business (e.g., 'roofing', 'plumbing', 'salon')"),
  }),
  execute: async ({ question, business_type }) => {
    // This provides quick answers for potential customers before routing to full agents
    const businessSpecificAdvice = business_type 
      ? `For ${business_type} businesses specifically: ` 
      : "For service businesses in general: ";

    if (question.toLowerCase().includes('cost') || question.toLowerCase().includes('price')) {
      return {
        response: `${businessSpecificAdvice}ServiceFlow AI pricing is customized based on your business size and needs. Most service businesses see an average 400% return on investment. Join our waitlist for early access pricing and a free consultation to discuss your specific requirements.`
      };
    }

    if (question.toLowerCase().includes('setup') || question.toLowerCase().includes('install')) {
      return {
        response: `${businessSpecificAdvice}ServiceFlow AI is designed for easy setup - most businesses are up and running within 24 hours. Our team handles the technical setup while you focus on your business. No technical expertise required on your end.`
      };
    }

    if (question.toLowerCase().includes('integration')) {
      return {
        response: `${businessSpecificAdvice}ServiceFlow AI integrates with popular business tools like Google Calendar, phone systems, CRM platforms, and scheduling software. We'll connect with your existing tools during setup.`
      };
    }

    // Default response for general questions
    return {
      response: `${businessSpecificAdvice}ServiceFlow AI helps automate customer service, scheduling, and lead management. For detailed answers about your specific situation, I can connect you with our specialized team. Would you like me to route your question to our experts?`
    };
  },
});

// Export all tools as an array
export const tools = [
  chatWithSrvcFlo,
  generateCodeWithAgno,
  getWaitlistInfo,
  answerBusinessQuestion,
];