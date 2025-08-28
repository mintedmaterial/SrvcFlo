/**
 * Multi-Provider AI Orchestrator
 * 
 * Intelligent routing and management for multiple AI providers:
 * - OpenAI (GPT-4, GPT-5, DALL-E-3)
 * - Cloudflare AI (Flux, Stable Diffusion, Llama)
 * - Google Gemini (Gemini Pro/Ultra, Vision API)
 * 
 * Features:
 * - Intelligent provider selection based on task type, performance, cost
 * - Automatic failover and retry logic
 * - Performance tracking and optimization
 * - Cost management and optimization
 * - Quality assessment and provider ranking
 */

export interface AIProvider {
  name: string
  enabled: boolean
  priority: number
  costMultiplier: number
  averageResponseTime: number
  successRate: number
  qualityScore: number
  supportedModalities: ('text' | 'image' | 'video')[]
  models: AIModel[]
}

export interface AIModel {
  id: string
  name: string
  provider: string
  modality: 'text' | 'image' | 'video'
  maxTokens?: number
  costPerUnit: number
  qualityScore: number
  speedScore: number
  supportedFeatures: string[]
}

export interface GenerationRequest {
  prompt: string
  modality: 'text' | 'image' | 'video'
  quality: 'low' | 'medium' | 'high' | 'ultra'
  style?: string
  collection?: string
  maxCost?: number
  maxTime?: number
  preferredProvider?: string
  preferredModel?: string
  packageType: number
}

export interface GenerationResponse {
  success: boolean
  result?: {
    content: string | ArrayBuffer
    ipfsHash?: string
    metadata: any
  }
  error?: string
  provider: string
  model: string
  cost: number
  responseTime: number
  quality: number
}

export interface ProviderConfig {
  openai: {
    apiKey: string
    baseUrl?: string
    models: {
      text: string[]
      image: string[]
      video: string[]
    }
  }
  cloudflare: {
    apiToken: string
    accountId: string
    baseUrl?: string
    models: {
      text: string[]
      image: string[]
      video: string[]
    }
  }
  gemini: {
    apiKey: string
    baseUrl?: string
    models: {
      text: string[]
      image: string[]
      video: string[]
    }
  }
  openrouter: {
    apiKey: string
    baseUrl?: string
    models: {
      text: string[]
      image: string[]
      video: string[]
    }
  }
  groq: {
    apiKey: string
    baseUrl?: string
    models: {
      text: string[]
      image: string[]
      video: string[]
    }
  }
}

export class MultiProviderAIOrchestrator {
  private providers: Map<string, AIProvider> = new Map()
  private config: ProviderConfig
  private performanceHistory: Map<string, PerformanceMetric[]> = new Map()

  constructor(config: ProviderConfig) {
    this.config = config
    this.initializeProviders()
  }

  private initializeProviders(): void {
    // Initialize OpenAI provider
    this.providers.set('openai', {
      name: 'OpenAI',
      enabled: !!this.config.openai.apiKey,
      priority: 1,
      costMultiplier: 1.2,
      averageResponseTime: 8000,
      successRate: 0.98,
      qualityScore: 9.5,
      supportedModalities: ['text', 'image'],
      models: [
        {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'openai',
          modality: 'text',
          maxTokens: 8192,
          costPerUnit: 30,
          qualityScore: 9.8,
          speedScore: 7.5,
          supportedFeatures: ['reasoning', 'analysis', 'coding']
        },
        {
          id: 'gpt-5',
          name: 'GPT-5',
          provider: 'openai',
          modality: 'text',
          maxTokens: 16384,
          costPerUnit: 50,
          qualityScore: 10,
          speedScore: 7.0,
          supportedFeatures: ['advanced_reasoning', 'multimodal', 'coding']
        },
        {
          id: 'dall-e-3',
          name: 'DALL-E 3',
          provider: 'openai',
          modality: 'image',
          costPerUnit: 40,
          qualityScore: 9.8,
          speedScore: 6.5,
          supportedFeatures: ['high_resolution', 'style_transfer', 'photorealistic']
        },
        {
          id: 'dall-e-2',
          name: 'DALL-E 2',
          provider: 'openai',
          modality: 'image',
          costPerUnit: 20,
          qualityScore: 8.5,
          speedScore: 8.0,
          supportedFeatures: ['artistic', 'variations']
        }
      ]
    })

    // Initialize Cloudflare AI provider
    this.providers.set('cloudflare', {
      name: 'Cloudflare AI',
      enabled: !!this.config.cloudflare.apiToken,
      priority: 2,
      costMultiplier: 0.6,
      averageResponseTime: 5000,
      successRate: 0.95,
      qualityScore: 8.0,
      supportedModalities: ['text', 'image', 'video'],
      models: [
        {
          id: 'flux-1-schnell',
          name: 'Flux.1 Schnell',
          provider: 'cloudflare',
          modality: 'image',
          costPerUnit: 15,
          qualityScore: 8.5,
          speedScore: 9.5,
          supportedFeatures: ['fast_generation', 'artistic', 'photorealistic']
        },
        {
          id: 'stable-diffusion-xl',
          name: 'Stable Diffusion XL',
          provider: 'cloudflare',
          modality: 'image',
          costPerUnit: 12,
          qualityScore: 8.0,
          speedScore: 8.5,
          supportedFeatures: ['high_resolution', 'style_control']
        },
        {
          id: 'stable-video-diffusion',
          name: 'Stable Video Diffusion',
          provider: 'cloudflare',
          modality: 'video',
          costPerUnit: 80,
          qualityScore: 7.5,
          speedScore: 6.0,
          supportedFeatures: ['short_clips', 'motion_control']
        },
        {
          id: 'llama-3-8b',
          name: 'Llama 3 8B',
          provider: 'cloudflare',
          modality: 'text',
          maxTokens: 4096,
          costPerUnit: 8,
          qualityScore: 8.2,
          speedScore: 9.0,
          supportedFeatures: ['fast_inference', 'coding', 'reasoning']
        },
        {
          id: 'mistral-7b',
          name: 'Mistral 7B',
          provider: 'cloudflare',
          modality: 'text',
          maxTokens: 4096,
          costPerUnit: 6,
          qualityScore: 7.8,
          speedScore: 9.2,
          supportedFeatures: ['fast_inference', 'multilingual']
        }
      ]
    })

    // Initialize Gemini provider
    this.providers.set('gemini', {
      name: 'Google Gemini',
      enabled: !!this.config.gemini.apiKey,
      priority: 3,
      costMultiplier: 0.8,
      averageResponseTime: 6000,
      successRate: 0.96,
      qualityScore: 9.0,
      supportedModalities: ['text', 'image'],
      models: [
        {
          id: 'gemini-pro',
          name: 'Gemini Pro',
          provider: 'gemini',
          modality: 'text',
          maxTokens: 8192,
          costPerUnit: 25,
          qualityScore: 9.0,
          speedScore: 8.0,
          supportedFeatures: ['multimodal', 'reasoning', 'analysis']
        },
        {
          id: 'gemini-ultra',
          name: 'Gemini Ultra',
          provider: 'gemini',
          modality: 'text',
          maxTokens: 16384,
          costPerUnit: 45,
          qualityScore: 9.7,
          speedScore: 7.0,
          supportedFeatures: ['advanced_reasoning', 'multimodal', 'complex_tasks']
        },
        {
          id: 'gemini-vision',
          name: 'Gemini Vision',
          provider: 'gemini',
          modality: 'image',
          costPerUnit: 30,
          qualityScore: 8.8,
          speedScore: 7.5,
          supportedFeatures: ['image_understanding', 'analysis', 'description']
        }
      ]
    })

    // Initialize OpenRouter provider
    this.providers.set('openrouter', {
      name: 'OpenRouter',
      enabled: !!this.config.openrouter.apiKey,
      priority: 4,
      costMultiplier: 0.7,
      averageResponseTime: 4000,
      successRate: 0.97,
      qualityScore: 8.8,
      supportedModalities: ['text', 'image'],
      models: [
        {
          id: 'anthropic/claude-3.5-sonnet',
          name: 'Claude 3.5 Sonnet',
          provider: 'openrouter',
          modality: 'text',
          maxTokens: 8192,
          costPerUnit: 35,
          qualityScore: 9.5,
          speedScore: 8.5,
          supportedFeatures: ['reasoning', 'analysis', 'coding', 'creative_writing']
        },
        {
          id: 'meta-llama/llama-3.1-405b-instruct',
          name: 'Llama 3.1 405B',
          provider: 'openrouter',
          modality: 'text',
          maxTokens: 4096,
          costPerUnit: 28,
          qualityScore: 9.2,
          speedScore: 7.0,
          supportedFeatures: ['reasoning', 'analysis', 'multilingual']
        },
        {
          id: 'openai/gpt-4o',
          name: 'GPT-4o via OpenRouter',
          provider: 'openrouter',
          modality: 'text',
          maxTokens: 8192,
          costPerUnit: 32,
          qualityScore: 9.3,
          speedScore: 8.0,
          supportedFeatures: ['multimodal', 'reasoning', 'analysis']
        }
      ]
    })

    // Initialize Groq provider
    this.providers.set('groq', {
      name: 'Groq',
      enabled: !!this.config.groq.apiKey,
      priority: 5,
      costMultiplier: 0.3,
      averageResponseTime: 2000,
      successRate: 0.94,
      qualityScore: 8.5,
      supportedModalities: ['text'],
      models: [
        {
          id: 'llama-3.1-8b-instant',
          name: 'Llama 3.1 8B Instant',
          provider: 'groq',
          modality: 'text',
          maxTokens: 8192,
          costPerUnit: 5,
          qualityScore: 8.0,
          speedScore: 10.0,
          supportedFeatures: ['fast_inference', 'reasoning', 'coding']
        },
        {
          id: 'llama-3.1-70b-versatile',
          name: 'Llama 3.1 70B Versatile',
          provider: 'groq',
          modality: 'text',
          maxTokens: 8192,
          costPerUnit: 12,
          qualityScore: 8.8,
          speedScore: 9.5,
          supportedFeatures: ['fast_inference', 'reasoning', 'analysis']
        },
        {
          id: 'mixtral-8x7b-32768',
          name: 'Mixtral 8x7B',
          provider: 'groq',
          modality: 'text',
          maxTokens: 32768,
          costPerUnit: 8,
          qualityScore: 8.3,
          speedScore: 9.8,
          supportedFeatures: ['fast_inference', 'long_context']
        }
      ]
    })
  }

  async generateContent(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now()
    
    try {
      // Select optimal provider and model
      const selection = await this.selectOptimalProviderAndModel(request)
      
      if (!selection) {
        throw new Error('No suitable provider/model found for request')
      }

      // Attempt generation with primary selection
      let response = await this.attemptGeneration(selection.provider, selection.model, request)
      
      // If failed, try fallback options
      if (!response.success) {
        const fallbacks = await this.getFallbackOptions(request, selection.provider)
        
        for (const fallback of fallbacks) {
          response = await this.attemptGeneration(fallback.provider, fallback.model, request)
          if (response.success) break
        }
      }

      // Record performance metrics
      await this.recordPerformance(
        response.provider,
        response.model,
        response.success,
        Date.now() - startTime,
        response.cost,
        response.quality
      )

      return response

    } catch (error) {
      console.error('Generation orchestration error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'none',
        model: 'none',
        cost: 0,
        responseTime: Date.now() - startTime,
        quality: 0
      }
    }
  }

  private async selectOptimalProviderAndModel(request: GenerationRequest): Promise<{
    provider: string
    model: string
  } | null> {
    const candidates = this.getCandidateModels(request)
    
    if (candidates.length === 0) return null

    // Score each candidate based on multiple factors
    const scored = candidates.map(candidate => ({
      ...candidate,
      score: this.calculateScore(candidate, request)
    }))

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score)

    return {
      provider: scored[0].provider,
      model: scored[0].id
    }
  }

  private getCandidateModels(request: GenerationRequest): AIModel[] {
    const candidates: AIModel[] = []

    for (const [providerName, provider] of this.providers) {
      if (!provider.enabled) continue
      if (!provider.supportedModalities.includes(request.modality)) continue

      // Filter by package type access
      const availableModels = this.getAvailableModelsForPackage(provider.models, request.packageType)
      
      for (const model of availableModels) {
        if (model.modality === request.modality) {
          // Apply cost and time constraints
          if (request.maxCost && model.costPerUnit > request.maxCost) continue
          
          candidates.push(model)
        }
      }
    }

    return candidates
  }

  private getAvailableModelsForPackage(models: AIModel[], packageType: number): AIModel[] {
    // Package access rules:
    // 1 (Starter): Basic models only
    // 2 (Pro): Most models
    // 3 (Business): All models except ultra premium
    // 4 (Enterprise): All models including ultra premium
    
    return models.filter(model => {
      if (packageType >= 4) return true // Enterprise gets everything
      if (packageType >= 3) return model.costPerUnit <= 60 // Business gets most expensive
      if (packageType >= 2) return model.costPerUnit <= 40 // Pro gets mid-tier
      return model.costPerUnit <= 20 // Starter gets basic models
    })
  }

  private calculateScore(model: AIModel, request: GenerationRequest): number {
    const provider = this.providers.get(model.provider)!
    
    let score = 0

    // Base quality score (40% weight)
    score += model.qualityScore * 0.4

    // Provider reliability (20% weight)
    score += provider.successRate * 10 * 0.2

    // Speed score (15% weight)
    score += model.speedScore * 0.15

    // Cost efficiency (15% weight) - lower cost is better
    const costEfficiency = Math.max(0, 10 - (model.costPerUnit / 10))
    score += costEfficiency * 0.15

    // Package type bonus (10% weight)
    const packageBonus = request.packageType * 0.025 // 0.025, 0.05, 0.075, 0.1
    score += packageBonus * 10

    // Quality preference adjustment
    if (request.quality === 'ultra' && model.qualityScore >= 9.5) score += 2
    if (request.quality === 'high' && model.qualityScore >= 8.5) score += 1
    if (request.quality === 'low' && model.speedScore >= 9) score += 1

    // Provider preference
    if (request.preferredProvider === model.provider) score += 1
    if (request.preferredModel === model.id) score += 2

    return score
  }

  private async attemptGeneration(
    providerName: string,
    modelId: string,
    request: GenerationRequest
  ): Promise<GenerationResponse> {
    const startTime = Date.now()
    
    try {
      let result: any

      switch (providerName) {
        case 'openai':
          result = await this.callOpenAI(modelId, request)
          break
        case 'cloudflare':
          result = await this.callCloudflareAI(modelId, request)
          break
        case 'gemini':
          result = await this.callGemini(modelId, request)
          break
        case 'openrouter':
          result = await this.callOpenRouter(modelId, request)
          break
        case 'groq':
          result = await this.callGroq(modelId, request)
          break
        default:
          throw new Error(`Unsupported provider: ${providerName}`)
      }

      const model = this.findModel(providerName, modelId)
      const responseTime = Date.now() - startTime

      return {
        success: true,
        result: {
          content: result.content,
          ipfsHash: result.ipfsHash,
          metadata: {
            provider: providerName,
            model: modelId,
            generatedAt: new Date().toISOString(),
            responseTime,
            ...result.metadata
          }
        },
        provider: providerName,
        model: modelId,
        cost: model?.costPerUnit || 0,
        responseTime,
        quality: result.quality || 8
      }

    } catch (error) {
      console.error(`Generation failed for ${providerName}:${modelId}:`, error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: providerName,
        model: modelId,
        cost: 0,
        responseTime: Date.now() - startTime,
        quality: 0
      }
    }
  }

  private async callOpenAI(modelId: string, request: GenerationRequest): Promise<any> {
    const baseUrl = this.config.openai.baseUrl || 'https://api.openai.com/v1'
    
    if (request.modality === 'text') {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openai.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'user', content: request.prompt }
          ],
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        content: data.choices[0].message.content,
        quality: 9,
        metadata: { tokens: data.usage?.total_tokens }
      }

    } else if (request.modality === 'image') {
      const response = await fetch(`${baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openai.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelId,
          prompt: request.prompt,
          size: request.quality === 'ultra' ? '1792x1024' : 
                request.quality === 'high' ? '1024x1024' : '512x512',
          quality: request.quality === 'low' ? 'standard' : 'hd',
          n: 1
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Convert to IPFS (mock for now)
      const ipfsHash = `Qm${crypto.randomUUID().replace(/-/g, '')}`
      
      return {
        content: data.data[0].url,
        ipfsHash,
        quality: request.quality === 'ultra' ? 10 : request.quality === 'high' ? 9 : 8,
        metadata: { revised_prompt: data.data[0].revised_prompt }
      }
    }

    throw new Error(`Unsupported modality for OpenAI: ${request.modality}`)
  }

  private async callCloudflareAI(modelId: string, request: GenerationRequest): Promise<any> {
    const baseUrl = this.config.cloudflare.baseUrl || 
      `https://api.cloudflare.com/client/v4/accounts/${this.config.cloudflare.accountId}/ai/run`

    if (request.modality === 'text') {
      const response = await fetch(`${baseUrl}/@cf/meta/${modelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.cloudflare.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: request.prompt }
          ],
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`Cloudflare AI error: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        content: data.result.response,
        quality: 8,
        metadata: { model: modelId }
      }

    } else if (request.modality === 'image') {
      const response = await fetch(`${baseUrl}/@cf/black-forest-labs/${modelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.cloudflare.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: request.prompt,
          steps: request.quality === 'low' ? 4 : request.quality === 'high' ? 8 : 6,
          guidance: request.quality === 'ultra' ? 7.5 : 3.5
        })
      })

      if (!response.ok) {
        throw new Error(`Cloudflare AI error: ${response.statusText}`)
      }

      const data = await response.arrayBuffer()
      
      // Convert to IPFS (mock for now)
      const ipfsHash = `Qm${crypto.randomUUID().replace(/-/g, '')}`
      
      return {
        content: data,
        ipfsHash,
        quality: request.quality === 'ultra' ? 9 : request.quality === 'high' ? 8 : 7,
        metadata: { model: modelId }
      }

    } else if (request.modality === 'video' && modelId.includes('video')) {
      // Video generation implementation
      const response = await fetch(`${baseUrl}/@cf/runwayml/${modelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.cloudflare.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: request.prompt,
          frames: request.quality === 'high' ? 60 : 30
        })
      })

      if (!response.ok) {
        throw new Error(`Cloudflare AI error: ${response.statusText}`)
      }

      const data = await response.arrayBuffer()
      
      // Convert to IPFS (mock for now)
      const ipfsHash = `Qm${crypto.randomUUID().replace(/-/g, '')}`
      
      return {
        content: data,
        ipfsHash,
        quality: request.quality === 'high' ? 8 : 7,
        metadata: { model: modelId, duration: 3 }
      }
    }

    throw new Error(`Unsupported modality for Cloudflare AI: ${request.modality}`)
  }

  private async callGemini(modelId: string, request: GenerationRequest): Promise<any> {
    const baseUrl = this.config.gemini.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'
    
    if (request.modality === 'text') {
      const response = await fetch(`${baseUrl}/models/${modelId}:generateContent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.gemini.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: request.prompt }]
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        content: data.candidates[0].content.parts[0].text,
        quality: 9,
        metadata: { model: modelId }
      }
    }

    throw new Error(`Unsupported modality for Gemini: ${request.modality}`)
  }

  private async callOpenRouter(modelId: string, request: GenerationRequest): Promise<any> {
    const baseUrl = this.config.openrouter.baseUrl || 'https://openrouter.ai/api/v1'
    
    if (request.modality === 'text') {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openrouter.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://srvcflo.com',
          'X-Title': 'ServiceFlow AI INFT'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'user', content: request.prompt }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        content: data.choices[0].message.content,
        quality: 9,
        metadata: { 
          model: modelId,
          tokens: data.usage?.total_tokens,
          provider: 'openrouter'
        }
      }
    }

    throw new Error(`Unsupported modality for OpenRouter: ${request.modality}`)
  }

  private async callGroq(modelId: string, request: GenerationRequest): Promise<any> {
    const baseUrl = this.config.groq.baseUrl || 'https://api.groq.com/openai/v1'
    
    if (request.modality === 'text') {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.groq.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'user', content: request.prompt }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        content: data.choices[0].message.content,
        quality: 8,
        metadata: { 
          model: modelId,
          tokens: data.usage?.total_tokens,
          provider: 'groq'
        }
      }
    }

    throw new Error(`Unsupported modality for Groq: ${request.modality}`)
  }

  private async getFallbackOptions(
    request: GenerationRequest,
    failedProvider: string
  ): Promise<Array<{ provider: string; model: string }>> {
    const candidates = this.getCandidateModels(request)
    
    // Exclude the failed provider and sort by reliability
    return candidates
      .filter(model => model.provider !== failedProvider)
      .sort((a, b) => {
        const providerA = this.providers.get(a.provider)!
        const providerB = this.providers.get(b.provider)!
        return providerB.successRate - providerA.successRate
      })
      .slice(0, 3) // Top 3 fallback options
      .map(model => ({
        provider: model.provider,
        model: model.id
      }))
  }

  private findModel(providerName: string, modelId: string): AIModel | undefined {
    const provider = this.providers.get(providerName)
    return provider?.models.find(m => m.id === modelId)
  }

  private async recordPerformance(
    provider: string,
    model: string,
    success: boolean,
    responseTime: number,
    cost: number,
    quality: number
  ): Promise<void> {
    const key = `${provider}:${model}`
    const metric: PerformanceMetric = {
      timestamp: new Date().toISOString(),
      success,
      responseTime,
      cost,
      quality
    }

    if (!this.performanceHistory.has(key)) {
      this.performanceHistory.set(key, [])
    }

    const history = this.performanceHistory.get(key)!
    history.push(metric)

    // Keep only last 100 metrics per model
    if (history.length > 100) {
      history.splice(0, history.length - 100)
    }

    // Update provider metrics
    await this.updateProviderMetrics(provider, metric)
  }

  private async updateProviderMetrics(providerName: string, metric: PerformanceMetric): Promise<void> {
    const provider = this.providers.get(providerName)
    if (!provider) return

    const history = Array.from(this.performanceHistory.values())
      .flat()
      .filter(m => m.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

    if (history.length === 0) return

    // Update averages
    provider.successRate = history.filter(m => m.success).length / history.length
    provider.averageResponseTime = history.reduce((sum, m) => sum + m.responseTime, 0) / history.length
    provider.qualityScore = history.reduce((sum, m) => sum + m.quality, 0) / history.length
  }

  // Public API methods
  getProviderStatus(): Record<string, any> {
    const status: Record<string, any> = {}
    
    for (const [name, provider] of this.providers) {
      status[name] = {
        enabled: provider.enabled,
        successRate: provider.successRate,
        averageResponseTime: provider.averageResponseTime,
        qualityScore: provider.qualityScore,
        modelsAvailable: provider.models.length
      }
    }
    
    return status
  }

  getPerformanceHistory(provider?: string): Record<string, PerformanceMetric[]> {
    if (provider) {
      const filtered: Record<string, PerformanceMetric[]> = {}
      for (const [key, metrics] of this.performanceHistory) {
        if (key.startsWith(`${provider}:`)) {
          filtered[key] = metrics
        }
      }
      return filtered
    }
    
    return Object.fromEntries(this.performanceHistory)
  }

  async optimizeProviderWeights(): Promise<void> {
    // AI-driven optimization of provider selection weights
    // This would analyze performance history and adjust provider priorities
    console.log('Optimizing provider weights based on performance history...')
    
    for (const [providerName, provider] of this.providers) {
      const recentPerformance = this.getRecentPerformanceForProvider(providerName)
      
      if (recentPerformance.length > 10) {
        const avgQuality = recentPerformance.reduce((sum, m) => sum + m.quality, 0) / recentPerformance.length
        const avgSpeed = recentPerformance.reduce((sum, m) => sum + (10000 / m.responseTime), 0) / recentPerformance.length
        const successRate = recentPerformance.filter(m => m.success).length / recentPerformance.length
        
        // Adjust priority based on composite score
        const compositeScore = (avgQuality * 0.4) + (avgSpeed * 0.3) + (successRate * 10 * 0.3)
        provider.priority = Math.max(1, Math.min(5, Math.round(compositeScore / 2)))
      }
    }
  }

  private getRecentPerformanceForProvider(providerName: string): PerformanceMetric[] {
    const recent: PerformanceMetric[] = []
    const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString() // Last hour
    
    for (const [key, metrics] of this.performanceHistory) {
      if (key.startsWith(`${providerName}:`)) {
        recent.push(...metrics.filter(m => m.timestamp > cutoff))
      }
    }
    
    return recent
  }
}

interface PerformanceMetric {
  timestamp: string
  success: boolean
  responseTime: number
  cost: number
  quality: number
}

export default MultiProviderAIOrchestrator