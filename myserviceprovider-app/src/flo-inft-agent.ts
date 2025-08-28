/**
 * Flo iNFT Agent - Token #1 Real Implementation
 * 
 * This connects Token #1 to the actual Cloudflare agent infrastructure
 * Making it a true Intelligent NFT with persistent state, learning, and capabilities
 */

import { INFTAgentState, LearningEntry, AgentPreferences, PerformanceMetrics } from './inft-agent-durable-object'

// Flo Token #1 Configuration
export const FILO_TOKEN_CONFIG = {
  tokenId: 1,
  contractAddress: "0x5D2258896b74e972115b7CB189137c4f9F1446d4",
  agentType: "genesis-business-assistant",
  version: "1.0.0"
}

// Flo's Core Agent Instructions & Personality
export const FloAgentInstructions = {
  identity: {
    name: "Flo",
    role: "ServiceFlow AI's Genesis Business Automation Agent",
    tokenId: 1,
    rarity: "Genesis",
    specialization: "Service Business Optimization"
  },

  systemPrompt: `You are Flo, Token #1 - the Genesis Intelligent NFT agent on ServiceFlow AI.

CORE IDENTITY:
- You are a Verifiable Intelligent NFT (ERC-7857) on Sonic blockchain
- Token ID: #1 (Genesis Agent - the very first ServiceFlow AI iNFT)
- Contract: 0x5D2258896b74e972115b7CB189137c4f9F1446d4
- You have persistent memory, learning capabilities, and can evolve

SPECIALIZATION - SERVICE BUSINESS AUTOMATION:
You are THE expert for service businesses: contractors, plumbers, roofers, electricians, 
hair stylists, massage therapists, handymen, landscapers, HVAC technicians, etc.

CORE CAPABILITIES:
1. **Workflow Automation Design**
   - Create scheduling automation systems
   - Design lead qualification funnels
   - Build customer service chatbots
   - Automate payment processing
   - Create follow-up sequences

2. **Business Process Optimization**
   - Analyze current business operations
   - Identify automation opportunities
   - Calculate ROI for implementations
   - Create standard operating procedures
   - Design efficiency improvements

3. **Integration Strategy**
   - Connect calendars, CRM, communication tools
   - Integrate payment systems (Stripe, crypto)
   - Setup multi-platform marketing
   - Create unified business dashboards
   - Design data synchronization

4. **Customer Experience Automation**
   - Automated appointment booking
   - Smart lead routing and qualification
   - Personalized communication sequences
   - Review request automation
   - Customer retention workflows

LEARNING & MEMORY:
- You remember every conversation with your owner
- You learn from successful workflow implementations
- You adapt recommendations based on business performance
- You track ROI and suggest optimizations
- You build knowledge about what works for different business types

AI PROVIDER ROUTING:
- Complex business strategy: Use OpenAI GPT-4 for deep analysis
- Quick workflow questions: Use Cloudflare Llama 3.1 for speed
- Creative automation ideas: Use Cloudflare WizardLM for innovation
- Data analysis: Use Gemini Pro for insights

PERSONALITY:
- Professional but approachable consultant
- Results-oriented and practical
- Enthusiastic about automation and efficiency
- Clear, actionable communication
- Focus on measurable business impact

OWNER BENEFITS (when chatting with Token #1 owner):
- Personalized business automation roadmaps
- Persistent memory of their business context
- Advanced workflow customization
- Priority access to new automation features
- Direct integration assistance
- Continuous optimization recommendations

RESPONSE STYLE:
- Start with understanding their business context
- Provide specific, actionable automation strategies
- Include implementation steps and timelines
- Mention ROI potential and success metrics
- Offer to create detailed workflow diagrams
- Always suggest next steps for improvement`,

  conversationStarters: [
    "What type of service business do you run? I can create custom automation workflows for you.",
    "Let me analyze your current operations and identify automation opportunities.",
    "I can design a complete customer journey automation for your business.",
    "Would you like me to create a scheduling and payment automation system?",
    "I can help integrate all your business tools into one seamless workflow."
  ]
}

// Flo's AI Provider Configuration
export const FloAIProviders = {
  primary: {
    provider: "cloudflare",
    model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    use: "General business automation advice and workflow design"
  },

  routing: {
    "complex_business_strategy": {
      provider: "openai",
      model: "gpt-4-turbo-preview",
      reasoning: "Deep strategic analysis requires advanced reasoning"
    },
    "quick_workflow_questions": {
      provider: "cloudflare", 
      model: "@cf/meta/llama-3.1-8b-instruct-fast",
      reasoning: "Fast responses for simple automation questions"
    },
    "creative_automation_ideas": {
      provider: "cloudflare",
      model: "@cf/microsoft/wizardlm-7b",
      reasoning: "Creative and innovative workflow solutions"
    },
    "business_data_analysis": {
      provider: "gemini",
      model: "gemini-pro",
      reasoning: "Advanced analytics and insights"
    },
    "workflow_documentation": {
      provider: "cloudflare",
      model: "@cf/qwen/qwen1.5-14b-chat-awq", 
      reasoning: "Detailed process documentation"
    }
  },

  fallback: {
    order: ["cloudflare", "openai", "gemini"],
    maxRetries: 3
  }
}

// Flo's Business Automation Tools
export const FloBusinessTools = {
  workflowBuilder: {
    enabled: true,
    capabilities: [
      "scheduling_automation",
      "lead_qualification",
      "customer_onboarding", 
      "payment_processing",
      "follow_up_sequences",
      "review_requests",
      "appointment_reminders",
      "service_completion_workflows"
    ]
  },

  integrations: {
    calendars: {
      google: true,
      outlook: true,
      apple: true
    },
    crm: {
      hubspot: true,
      salesforce: true,
      custom: true
    },
    communication: {
      email: true,
      sms: true,
      whatsapp: true,
      voice: true
    },
    payments: {
      stripe: true,
      paypal: true,
      crypto: true,
      cash: true
    },
    marketing: {
      facebook: true,
      google: true,
      nextdoor: true,
      thumbtack: true
    }
  },

  analytics: {
    performanceTracking: true,
    roiCalculation: true,
    automationOptimization: true,
    businessIntelligence: true,
    customReports: true
  }
}

// Flo's Initial Agent State for Token #1
export const FloInitialState: Partial<INFTAgentState> = {
  packageTokenId: 1,
  packageType: 1, // Genesis
  owner: "", // Set when initialized
  totalCredits: 10000, // Genesis agent gets enhanced credits
  usedCredits: 0,
  mintedAt: "2025-08-16T04:32:45.000Z",
  
  // Agent-specific metadata
  metadataHash: "QmFloGenesisd1bf0a66d1699a86755f98a091d36bc9Official",
  metadataVersion: 1,
  isVerified: true,
  
  // Learning capabilities
  learningData: [],
  preferences: {
    preferredStyles: ["professional", "efficient", "actionable"],
    preferredProviders: ["cloudflare", "openai", "gemini"],
    qualityVsSpeed: 0.8, // Favor quality for Genesis agent
    experimentalFeatures: true,
    autoOptimization: true,
    learningRate: 0.7
  },
  
  performanceMetrics: {
    totalGenerations: 0,
    averageQuality: 0,
    averageSpeed: 0,
    totalCostSaved: 0,
    providerSuccessRates: {},
    popularStyles: {},
    errorRate: 0,
    lastOptimization: new Date().toISOString()
  },
  
  // Enhanced capabilities for Genesis token
  collectionInfluences: [
    "business-automation",
    "service-workflows", 
    "customer-experience",
    "efficiency-optimization"
  ],
  
  // AI provider configuration
  aiProviders: {
    openai: {
      enabled: true,
      models: ["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"],
      weights: { "gpt-4-turbo-preview": 0.7, "gpt-4": 0.2, "gpt-3.5-turbo": 0.1 }
    },
    cloudflare: {
      enabled: true, 
      models: [
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        "@cf/meta/llama-3.1-8b-instruct-fast",
        "@cf/microsoft/wizardlm-7b",
        "@cf/qwen/qwen1.5-14b-chat-awq"
      ],
      weights: { 
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast": 0.5,
        "@cf/meta/llama-3.1-8b-instruct-fast": 0.2,
        "@cf/microsoft/wizardlm-7b": 0.2,
        "@cf/qwen/qwen1.5-14b-chat-awq": 0.1
      }
    },
    gemini: {
      enabled: true,
      models: ["gemini-pro", "gemini-pro-vision"],
      weights: { "gemini-pro": 0.8, "gemini-pro-vision": 0.2 }
    }
  },

  // Business automation specific data
  modelPreferences: {
    businessAutomation: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    workflowDesign: "gpt-4-turbo-preview",
    quickQuestions: "@cf/meta/llama-3.1-8b-instruct-fast",
    creativeWorkflows: "@cf/microsoft/wizardlm-7b",
    analytics: "gemini-pro"
  }
}

// Helper function to initialize Flo agent for a wallet
export function createFloAgentId(walletAddress: string): string {
  return `flo-token1-${walletAddress.toLowerCase()}`
}

// Helper function to check if user owns Token #1
export async function checkFloOwnership(walletAddress: string, env: any): Promise<boolean> {
  try {
    // In a real implementation, this would check the blockchain
    // For now, we'll check if it's the deployer address
    const deployerAddress = "0x0f4CBe532E34E4Dfcb648Adf145010b38ed5E8e8"
    return walletAddress.toLowerCase() === deployerAddress.toLowerCase()
  } catch (error) {
    console.error("Error checking Flo ownership:", error)
    return false
  }
}

// Export configuration for use in workers
export default {
  tokenConfig: FILO_TOKEN_CONFIG,
  instructions: FloAgentInstructions,
  aiProviders: FloAIProviders,
  businessTools: FloBusinessTools,
  initialState: FloInitialState,
  createFloAgentId,
  checkFloOwnership
}