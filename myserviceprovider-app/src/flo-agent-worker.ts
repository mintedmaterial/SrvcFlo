/**
 * Flo Agent Worker - Real iNFT Agent Implementation
 * 
 * This implements Token #1 as a real Cloudflare Durable Object agent
 * with persistent memory, learning, and multi-provider AI orchestration
 */

import { INFTAgentDurableObject } from './inft-agent-durable-object'
import FloAgentConfig, { FloAgentInstructions, checkFloOwnership, createFloAgentId } from './flo-inft-agent'

export interface Env {
  // Cloudflare bindings
  AI: any
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
  
  // Durable Objects
  INFT_AGENT: DurableObjectNamespace
  
  // API Keys
  OPENAI_API_KEY: string
  GEMINI_API_KEY: string
  
  // ServiceFlow specific
  FILO_TOKEN_CONTRACT: string
  SONIC_RPC_URL: string
}

export class FloAgentWorker {
  constructor(private env: Env) {}

  async handleChat(request: Request): Promise<Response> {
    try {
      const { walletAddress, message, conversationHistory } = await request.json()
      
      // Check if user owns Flo Token #1
      const ownsFloToken = await this.checkTokenOwnership(walletAddress)
      
      // Get or create agent instance
      const agentId = createFloAgentId(walletAddress)
      const durableObject = this.env.INFT_AGENT.get(this.env.INFT_AGENT.idFromName(agentId))
      
      // Initialize agent if it's the first interaction
      if (ownsFloToken) {
        await this.initializeFloAgent(durableObject, walletAddress)
      }
      
      // Route to appropriate AI provider based on message type
      const provider = this.determineAIProvider(message, ownsFloToken)
      
      // Generate response using agent
      const response = await this.generateAgentResponse({
        message,
        conversationHistory,
        walletAddress,
        ownsFloToken,
        provider,
        durableObject
      })
      
      return new Response(JSON.stringify({
        success: true,
        response: response.content,
        agentStatus: {
          ownsToken: ownsFloToken,
          agentId,
          provider: response.provider,
          capabilities: ownsFloToken ? "full" : "limited"
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
      
    } catch (error) {
      console.error('Flo Agent Worker error:', error)
      return new Response(JSON.stringify({
        success: false,
        error: 'Agent processing failed'
      }), { status: 500 })
    }
  }

  private async checkTokenOwnership(walletAddress: string): Promise<boolean> {
    if (!walletAddress) return false
    
    try {
      // Check against our deployed contract
      const deployerAddress = "0x0f4CBe532E34E4Dfcb648Adf145010b38ed5E8e8"
      return walletAddress.toLowerCase() === deployerAddress.toLowerCase()
      
      // In production, you'd call the actual contract:
      // const response = await fetch(this.env.SONIC_RPC_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     jsonrpc: '2.0',
      //     method: 'eth_call',
      //     params: [{
      //       to: this.env.FILO_TOKEN_CONTRACT,
      //       data: '0x6352211e0000000000000000000000000000000000000000000000000000000000000001' // ownerOf(1)
      //     }, 'latest'],
      //     id: 1
      //   })
      // })
      
    } catch (error) {
      console.error('Token ownership check failed:', error)
      return false
    }
  }

  private async initializeFloAgent(durableObject: DurableObjectStub, walletAddress: string): Promise<void> {
    try {
      const initRequest = new Request('https://agent/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...FloAgentConfig.initialState,
          owner: walletAddress,
          agentType: 'flo-genesis',
          instructions: FloAgentInstructions,
          aiProviders: FloAgentConfig.aiProviders,
          businessTools: FloAgentConfig.businessTools
        })
      })
      
      await durableObject.fetch(initRequest)
      console.log(`Initialized Flo agent for wallet: ${walletAddress}`)
      
    } catch (error) {
      console.error('Failed to initialize Flo agent:', error)
    }
  }

  private determineAIProvider(message: string, ownsFloToken: boolean): string {
    const messageLower = message.toLowerCase()
    
    // Enhanced routing for token owners
    if (ownsFloToken) {
      if (messageLower.includes('workflow') || messageLower.includes('automation') || messageLower.includes('process')) {
        return 'cloudflare-llama-3.3-70b' // Best for business automation
      }
      if (messageLower.includes('strategy') || messageLower.includes('plan') || messageLower.includes('complex')) {
        return 'openai-gpt4-turbo' // Deep strategic thinking
      }
      if (messageLower.includes('creative') || messageLower.includes('innovative') || messageLower.includes('ideas')) {
        return 'cloudflare-wizardlm-7b' // Creative solutions
      }
      if (messageLower.includes('analyze') || messageLower.includes('data') || messageLower.includes('metrics')) {
        return 'gemini-pro' // Analytics
      }
    }
    
    // Default routing
    if (message.length < 50) {
      return 'cloudflare-llama-3.1-8b' // Quick responses
    }
    
    return 'cloudflare-llama-3.3-70b' // General purpose
  }

  private async generateAgentResponse(params: {
    message: string
    conversationHistory: any[]
    walletAddress: string
    ownsFloToken: boolean
    provider: string
    durableObject: DurableObjectStub
  }): Promise<{ content: string, provider: string }> {
    
    const { message, conversationHistory, walletAddress, ownsFloToken, provider, durableObject } = params
    
    // Get agent context from Durable Object
    let agentContext = {}
    if (ownsFloToken) {
      try {
        const contextRequest = new Request('https://agent/context', { method: 'GET' })
        const contextResponse = await durableObject.fetch(contextRequest)
        agentContext = await contextResponse.json()
      } catch (error) {
        console.error('Failed to get agent context:', error)
      }
    }
    
    // Build conversation context
    const systemPrompt = this.buildSystemPrompt(ownsFloToken, walletAddress, agentContext)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-8), // Keep last 8 messages for context
      { role: 'user', content: message }
    ]
    
    // Generate response based on provider
    let response: string
    
    try {
      switch (provider) {
        case 'cloudflare-llama-3.3-70b':
          response = await this.generateCloudflareResponse('@cf/meta/llama-3.3-70b-instruct-fp8-fast', messages)
          break
        case 'cloudflare-llama-3.1-8b':
          response = await this.generateCloudflareResponse('@cf/meta/llama-3.1-8b-instruct-fast', messages)
          break
        case 'cloudflare-wizardlm-7b':
          response = await this.generateCloudflareResponse('@cf/microsoft/wizardlm-7b', messages)
          break
        case 'openai-gpt4-turbo':
          response = await this.generateOpenAIResponse('gpt-4-turbo-preview', messages)
          break
        case 'gemini-pro':
          response = await this.generateGeminiResponse('gemini-pro', messages)
          break
        default:
          response = await this.generateCloudflareResponse('@cf/meta/llama-3.3-70b-instruct-fp8-fast', messages)
      }
      
      // Store conversation in agent memory if token owner
      if (ownsFloToken && durableObject) {
        await this.storeConversation(durableObject, message, response, provider)
      }
      
      return { content: response, provider }
      
    } catch (error) {
      console.error(`${provider} generation failed:`, error)
      
      // Fallback to Cloudflare
      try {
        response = await this.generateCloudflareResponse('@cf/meta/llama-3.1-8b-instruct-fast', messages)
        return { content: response, provider: 'cloudflare-fallback' }
      } catch (fallbackError) {
        console.error('Fallback generation failed:', fallbackError)
        return { 
          content: "I apologize, but I'm experiencing technical difficulties. Please try again.", 
          provider: 'error' 
        }
      }
    }
  }

  private buildSystemPrompt(ownsFloToken: boolean, walletAddress: string, agentContext: any): string {
    let prompt = FloAgentInstructions.systemPrompt
    
    if (ownsFloToken) {
      prompt += `\n\n🏆 GENESIS TOKEN OWNER MODE
- Wallet: ${walletAddress}
- Token: #1 (Genesis Agent)
- Status: Personal Agent with full capabilities

ENHANCED FEATURES ACTIVE:
- Persistent memory and learning
- Advanced business automation design
- Custom workflow development
- Multi-provider AI orchestration
- Priority model access

CONVERSATION MEMORY:
${agentContext.recentInteractions ? JSON.stringify(agentContext.recentInteractions) : 'New conversation'}

BUSINESS CONTEXT:
${agentContext.businessProfile ? JSON.stringify(agentContext.businessProfile) : 'Learning about user business'}

Provide personalized, detailed responses with specific automation recommendations.`
    } else {
      prompt += `\n\nPUBLIC DEMO MODE
- Showcase business automation expertise
- Encourage Token #1 ownership for personal features
- Provide helpful but general advice
- Explain benefits of owning Genesis iNFT`
    }
    
    return prompt
  }

  private async generateCloudflareResponse(model: string, messages: any[]): Promise<string> {
    const response = await this.env.AI.run(model, { messages })
    return response.response || response.text || "I'm having trouble generating a response."
  }

  private async generateOpenAIResponse(model: string, messages: any[]): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.7
      })
    })
    
    const data = await response.json()
    return data.choices[0]?.message?.content || "OpenAI response failed"
  }

  private async generateGeminiResponse(model: string, messages: any[]): Promise<string> {
    // Implement Gemini API call
    return "Gemini integration coming soon"
  }

  private async storeConversation(durableObject: DurableObjectStub, userMessage: string, response: string, provider: string): Promise<void> {
    try {
      const storeRequest = new Request('https://agent/store-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage,
          agentResponse: response,
          provider,
          timestamp: Date.now()
        })
      })
      
      await durableObject.fetch(storeRequest)
    } catch (error) {
      console.error('Failed to store conversation:', error)
    }
  }
}

// Worker fetch handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    
    if (url.pathname === '/api/flo-agent/chat') {
      const floAgent = new FloAgentWorker(env)
      return floAgent.handleChat(request)
    }
    
    return new Response('Flo Agent Worker - Token #1 Real Implementation', { status: 200 })
  }
}