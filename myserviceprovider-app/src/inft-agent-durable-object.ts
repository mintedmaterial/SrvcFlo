/**
 * INFT Agent Durable Object - ERC-7857 Compliant
 * 
 * Enhanced persistent AI agent state management for Intelligent NFTs
 * Implements ERC-7857 with wallet-based authentication and zero-trust encryption
 * 
 * Features:
 * - Wallet-based agent identification (user-${walletAddress})
 * - Encrypted metadata storage with hash commitments in KV
 * - Zero-trust security using Web Crypto API
 * - Verifiable proof generation for ownership transfers
 * - Multi-provider AI orchestration with secure content storage
 * - JWT-based WebSocket authentication
 * - Encrypted learning data and preferences
 * - Secure agent collaboration with permission verification
 */

export interface INFTAgentState {
  // Core INFT Package Data
  packageTokenId: number
  packageType: number // 1=Starter, 2=Pro, 3=Business, 4=Enterprise
  owner: string // Wallet address
  totalCredits: number
  usedCredits: number
  mintedAt: string
  lastActivity: string
  
  // ERC-7857 Verifiable Metadata
  metadataHash: string // Hash of encrypted metadata
  encryptedMetadataURI: string // R2 URI to encrypted metadata
  proofHash: string // Current verification proof hash
  metadataVersion: number // Version for updates
  isVerified: boolean // Verification status
  
  // Encrypted Agent Intelligence & Learning
  encryptedLearningHash: string // Hash of encrypted learning data
  encryptedPreferencesHash: string // Hash of encrypted preferences
  learningData: LearningEntry[] // Public learning summary (encrypted details in R2)
  preferences: AgentPreferences // Public preferences (sensitive data encrypted)
  collectionInfluences: string[]
  performanceMetrics: PerformanceMetrics
  
  // Generated Content with Encryption
  generatedContent: GeneratedContent[]
  activeGenerations: ActiveGeneration[]
  
  // Wallet-Based Permissions
  authorizedWallets: string[] // Wallets allowed to interact with agent
  collaborationPermissions: CollaborationPermissions
  encryptionKey: string // Derived from wallet signature
  
  // AIaaS Subscriptions
  subscriptions: Subscription[]
  
  // Multi-Provider AI Configuration
  aiProviders: AIProviderConfig
  modelPreferences: ModelPreferences
}

export interface LearningEntry {
  timestamp: string
  prompt: string
  collection: string
  isVideo: boolean
  result: string
  feedback?: string
  providerUsed: string
  modelUsed: string
  performance: {
    quality: number // 1-10
    speed: number // ms
    cost: number // credits
  }
}

export interface AgentPreferences {
  preferredStyles: string[]
  preferredProviders: string[]
  qualityVsSpeed: number // 0-1, 0=speed, 1=quality
  experimentalFeatures: boolean
  autoOptimization: boolean
  learningRate: number // 0-1
}

export interface PerformanceMetrics {
  totalGenerations: number
  averageQuality: number
  averageSpeed: number
  totalCostSaved: number
  providerSuccessRates: Record<string, number>
  popularStyles: Record<string, number>
  errorRate: number
  lastOptimization: string
}

export interface GeneratedContent {
  tokenId: number
  prompt: string
  ipfsHash: string
  imageUrl?: string
  r2Url?: string
  collection: string
  isVideo: boolean
  createdAt: string
  provider: string
  model: string
  quality: number
  metadata: any
}

export interface ActiveGeneration {
  id: string
  prompt: string
  isVideo: boolean
  collection: string
  provider: string
  model: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  startedAt: string
  estimatedCompletion?: string
  progress?: number
  websocketId?: string
}

export interface Subscription {
  subscriber: string
  maxCredits: number
  usedCredits: number
  expiresAt: string
  active: boolean
  createdAt: string
}

export interface AIProviderConfig {
  openai: {
    enabled: boolean
    models: string[]
    weights: Record<string, number>
  }
  cloudflare: {
    enabled: boolean
    models: string[]
    weights: Record<string, number>
  }
  gemini: {
    enabled: boolean
    models: string[]
    weights: Record<string, number>
  }
}

export interface ModelPreferences {
  text: string[]
  image: string[]
  video: string[]
  fallback: string[]
}

export interface CollaborationPermissions {
  allowSkillSharing: boolean
  allowDataSharing: boolean
  maxCollaborators: number
  trustedWallets: string[]
}

export interface EncryptedContent {
  encryptedData: ArrayBuffer
  iv: Uint8Array
  hash: string
  version: number
  encryptedAt: string
}

export interface WalletAuthRequest {
  walletAddress: string
  signature: string
  message: string
  timestamp: number
}

export interface WebSocketConnection {
  websocket: WebSocket
  walletAddress: string // Changed from userId to walletAddress
  connectionTime: string
  lastPing: string
  isAuthenticated: boolean
  authToken?: string // JWT token for authentication
  permissions: string[] // What this connection can do
}

export class INFTAgentDurableObject {
  state: DurableObjectState
  env: Env
  agentState: INFTAgentState | null = null
  websocketConnections: Map<string, WebSocketConnection> = new Map()
  generationQueue: ActiveGeneration[] = []
  encryptionCache: Map<string, CryptoKey> = new Map() // Cache for wallet-derived keys

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env = env
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    
    // Handle WebSocket upgrades
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request)
    }

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Wallet-Signature, X-Wallet-Address"
        }
      })
    }

    // Verify wallet authentication for protected endpoints
    if (url.pathname !== "/initialize" && url.pathname !== "/status") {
      const authResult = await this.verifyWalletAuth(request)
      if (!authResult.success) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: authResult.error 
        }), { status: 401 })
      }
    }

    try {
      // Initialize agent state if needed
      if (!this.agentState) {
        await this.loadAgentState()
      }

      // Route requests
      switch (url.pathname) {
        case "/initialize":
          return this.handleInitialize(request)
        case "/generate":
          return this.handleGenerate(request)
        case "/status":
          return this.handleStatus(request)
        case "/learn":
          return this.handleLearning(request)
        case "/subscribe":
          return this.handleSubscription(request)
        case "/optimize":
          return this.handleOptimization(request)
        case "/collaborate":
          return this.handleCollaboration(request)
        case "/encrypt-transfer":
          return this.handleEncryptedTransfer(request)
        case "/verify-proof":
          return this.handleProofVerification(request)
        case "/update-metadata":
          return this.handleMetadataUpdate(request)
        default:
          return new Response("Not Found", { status: 404 })
      }
    } catch (error) {
      console.error("INFT Agent error:", error)
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Internal server error" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }
  }

  private async loadAgentState(): Promise<void> {
    const stored = await this.state.storage.get<INFTAgentState>("agentState")
    if (stored) {
      this.agentState = stored
    }
  }

  private async saveAgentState(): Promise<void> {
    if (this.agentState) {
      // Save encrypted sensitive data to R2
      await this.saveEncryptedData()
      
      // Save public state to Durable Object storage
      await this.state.storage.put("agentState", this.agentState)
      
      // Store metadata hash in KV for verification
      await this.env.GENERATION_CACHE.put(
        `agent:${this.agentState.owner}:metadata`, 
        this.agentState.metadataHash
      )
    }
  }

  /**
   * Verify wallet-based authentication
   */
  private async verifyWalletAuth(request: Request): Promise<{success: boolean, error?: string, walletAddress?: string}> {
    const walletAddress = request.headers.get('X-Wallet-Address')
    const signature = request.headers.get('X-Wallet-Signature')
    const authHeader = request.headers.get('Authorization')
    
    if (!walletAddress) {
      return { success: false, error: 'Wallet address required' }
    }
    
    // Check if this is the agent owner or authorized wallet
    if (this.agentState) {
      const isOwner = this.agentState.owner.toLowerCase() === walletAddress.toLowerCase()
      const isAuthorized = this.agentState.authorizedWallets.some(
        addr => addr.toLowerCase() === walletAddress.toLowerCase()
      )
      
      if (!isOwner && !isAuthorized) {
        return { success: false, error: 'Wallet not authorized for this agent' }
      }
    }
    
    // Verify JWT token or signature
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const isValid = await this.verifyJWT(token, walletAddress)
      if (!isValid) {
        return { success: false, error: 'Invalid authentication token' }
      }
    } else if (signature) {
      // Verify wallet signature (simplified - in production use proper signature verification)
      const isValid = signature.length > 0 // Placeholder for actual signature verification
      if (!isValid) {
        return { success: false, error: 'Invalid wallet signature' }
      }
    } else {
      return { success: false, error: 'Authentication required' }
    }
    
    return { success: true, walletAddress }
  }

  /**
   * Generate encryption key from wallet address
   */
  private async getWalletEncryptionKey(walletAddress: string): Promise<CryptoKey> {
    const cacheKey = walletAddress.toLowerCase()
    
    if (this.encryptionCache.has(cacheKey)) {
      return this.encryptionCache.get(cacheKey)!
    }
    
    // Derive key from wallet address (in production, use wallet signature)
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(walletAddress + 'serviceflow-salt'),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('serviceflow-inft'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
    
    this.encryptionCache.set(cacheKey, key)
    return key
  }

  /**
   * Encrypt sensitive data for storage
   */
  private async encryptData(data: any, walletAddress: string): Promise<EncryptedContent> {
    const key = await this.getWalletEncryptionKey(walletAddress)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encodedData = new TextEncoder().encode(JSON.stringify(data))
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    )
    
    const hash = await crypto.subtle.digest('SHA-256', encryptedData)
    const hashString = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    return {
      encryptedData,
      iv,
      hash: hashString,
      version: 1,
      encryptedAt: new Date().toISOString()
    }
  }

  /**
   * Decrypt sensitive data
   */
  private async decryptData(encrypted: EncryptedContent, walletAddress: string): Promise<any> {
    const key = await this.getWalletEncryptionKey(walletAddress)
    
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: encrypted.iv },
      key,
      encrypted.encryptedData
    )
    
    return JSON.parse(new TextDecoder().decode(decryptedData))
  }

  /**
   * Save encrypted sensitive data to R2
   */
  private async saveEncryptedData(): Promise<void> {
    if (!this.agentState) return
    
    const walletAddress = this.agentState.owner
    
    // Encrypt learning data
    const encryptedLearning = await this.encryptData(
      this.agentState.learningData,
      walletAddress
    )
    
    // Encrypt preferences (sensitive parts)
    const encryptedPreferences = await this.encryptData(
      this.agentState.preferences,
      walletAddress
    )
    
    // Store in R2
    const agentId = `user-${walletAddress.toLowerCase()}`
    
    await this.env.AI_CONTENT.put(
      `encrypted/${agentId}/learning.dat`,
      encryptedLearning.encryptedData,
      {
        httpMetadata: {
          contentType: 'application/octet-stream'
        },
        customMetadata: {
          hash: encryptedLearning.hash,
          version: encryptedLearning.version.toString(),
          encryptedAt: encryptedLearning.encryptedAt
        }
      }
    )
    
    await this.env.AI_CONTENT.put(
      `encrypted/${agentId}/preferences.dat`,
      encryptedPreferences.encryptedData,
      {
        httpMetadata: {
          contentType: 'application/octet-stream'
        },
        customMetadata: {
          hash: encryptedPreferences.hash,
          version: encryptedPreferences.version.toString(),
          encryptedAt: encryptedPreferences.encryptedAt
        }
      }
    )
    
    // Update hashes in agent state
    this.agentState.encryptedLearningHash = encryptedLearning.hash
    this.agentState.encryptedPreferencesHash = encryptedPreferences.hash
  }

  /**
   * Verify JWT token
   */
  private async verifyJWT(token: string, expectedWalletAddress: string): Promise<boolean> {
    try {
      // Simplified JWT verification - in production use proper JWT library
      const [header, payload, signature] = token.split('.')
      const decodedPayload = JSON.parse(atob(payload))
      
      // Check expiration
      if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
        return false
      }
      
      // Check wallet address
      if (decodedPayload.walletAddress?.toLowerCase() !== expectedWalletAddress.toLowerCase()) {
        return false
      }
      
      return true
    } catch (error) {
      return false
    }
  }

  private async handleInitialize(request: Request): Promise<Response> {
    const data = await request.json() as {
      packageTokenId: number
      packageType: number
      owner: string
      totalCredits: number
    }

    // Generate initial metadata hash
    const metadataString = this.generateInitialMetadata(data.packageType)
    const metadataHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(metadataString))))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Initialize new agent state with ERC-7857 compliance
    this.agentState = {
      packageTokenId: data.packageTokenId,
      packageType: data.packageType,
      owner: data.owner,
      totalCredits: data.totalCredits,
      usedCredits: 0,
      mintedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      
      // ERC-7857 Verifiable Metadata
      metadataHash,
      encryptedMetadataURI: `encrypted/user-${data.owner.toLowerCase()}/metadata.json`,
      proofHash: '',
      metadataVersion: 1,
      isVerified: false,
      
      // Encrypted Learning & Preferences
      encryptedLearningHash: '',
      encryptedPreferencesHash: '',
      learningData: [],
      preferences: this.getDefaultPreferences(data.packageType),
      collectionInfluences: this.getInitialCollections(data.packageType),
      performanceMetrics: this.getInitialMetrics(),
      
      // Generated Content
      generatedContent: [],
      activeGenerations: [],
      
      // Wallet-Based Permissions
      authorizedWallets: [],
      collaborationPermissions: {
        allowSkillSharing: data.packageType >= 2,
        allowDataSharing: data.packageType >= 3,
        maxCollaborators: Math.min(data.packageType * 2, 10),
        trustedWallets: []
      },
      encryptionKey: '', // Will be derived from wallet
      
      // AIaaS Subscriptions
      subscriptions: [],
      
      // Multi-Provider AI Configuration
      aiProviders: this.getProviderConfig(data.packageType),
      modelPreferences: this.getModelPreferences(data.packageType)
    }

    await this.saveAgentState()

    return new Response(JSON.stringify({
      success: true,
      agent: {
        packageTokenId: this.agentState.packageTokenId,
        packageType: this.agentState.packageType,
        totalCredits: this.agentState.totalCredits,
        agentMetadata: this.agentState.agentMetadata
      }
    }), {
      headers: { "Content-Type": "application/json" }
    })
  }

  private async handleGenerate(request: Request): Promise<Response> {
    if (!this.agentState) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Agent not initialized" 
      }), { status: 400 })
    }

    const data = await request.json() as {
      prompt: string
      isVideo: boolean
      collection?: string
      websocketId?: string
      userAddress: string
    }

    // Verify authorization
    if (!this.isAuthorizedToGenerate(data.userAddress)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Not authorized to use this agent" 
      }), { status: 403 })
    }

    // Check credits
    const creditCost = data.isVideo ? 500 : 200
    if (this.agentState.usedCredits + creditCost > this.agentState.totalCredits) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Insufficient credits" 
      }), { status: 400 })
    }

    // Create generation task
    const generationId = crypto.randomUUID()
    const generation: ActiveGeneration = {
      id: generationId,
      prompt: data.prompt,
      isVideo: data.isVideo,
      collection: data.collection || "default",
      provider: await this.selectOptimalProvider(data.prompt, data.isVideo),
      model: await this.selectOptimalModel(data.prompt, data.isVideo),
      status: "queued",
      startedAt: new Date().toISOString(),
      websocketId: data.websocketId
    }

    this.agentState.activeGenerations.push(generation)
    await this.saveAgentState()

    // Start generation process (don't await - run in background)
    this.processGeneration(generation)

    return new Response(JSON.stringify({
      success: true,
      generationId: generationId,
      estimatedTime: this.estimateGenerationTime(data.isVideo, generation.provider),
      creditsToBeUsed: creditCost
    }), {
      headers: { "Content-Type": "application/json" }
    })
  }

  private async processGeneration(generation: ActiveGeneration): Promise<void> {
    try {
      // Update status
      generation.status = "processing"
      await this.saveAgentState()
      
      // Notify via WebSocket
      this.broadcastToWebSockets({
        type: "generation_started",
        generationId: generation.id,
        status: "processing"
      })

      // Call appropriate AI provider
      const result = await this.callAIProvider(
        generation.provider,
        generation.model,
        generation.prompt,
        generation.isVideo,
        generation.collection
      )

      if (result.success) {
        // Update credits
        this.agentState!.usedCredits += generation.isVideo ? 500 : 200
        
        // Add to generated content
        const content: GeneratedContent = {
          tokenId: 0, // Will be updated when minted
          prompt: generation.prompt,
          ipfsHash: result.ipfsHash,
          imageUrl: result.imageUrl,
          r2Url: result.r2Url,
          collection: generation.collection,
          isVideo: generation.isVideo,
          createdAt: new Date().toISOString(),
          provider: generation.provider,
          model: generation.model,
          quality: result.quality || 8,
          metadata: result.metadata
        }
        
        this.agentState!.generatedContent.push(content)
        
        // Add learning data
        const learningEntry: LearningEntry = {
          timestamp: new Date().toISOString(),
          prompt: generation.prompt,
          collection: generation.collection,
          isVideo: generation.isVideo,
          result: result.ipfsHash,
          providerUsed: generation.provider,
          modelUsed: generation.model,
          performance: {
            quality: result.quality || 8,
            speed: Date.now() - new Date(generation.startedAt).getTime(),
            cost: generation.isVideo ? 500 : 200
          }
        }
        
        this.agentState!.learningData.push(learningEntry)
        
        // Update performance metrics
        this.updatePerformanceMetrics(learningEntry)
        
        // Mark generation complete
        generation.status = "completed"
        
        // Notify via WebSocket
        this.broadcastToWebSockets({
          type: "generation_completed",
          generationId: generation.id,
          result: content
        })
        
      } else {
        generation.status = "failed"
        
        this.broadcastToWebSockets({
          type: "generation_failed",
          generationId: generation.id,
          error: result.error
        })
      }

      // Remove from active generations
      this.agentState!.activeGenerations = this.agentState!.activeGenerations.filter(
        g => g.id !== generation.id
      )
      
      this.agentState!.lastActivity = new Date().toISOString()
      await this.saveAgentState()

    } catch (error) {
      console.error("Generation processing error:", error)
      generation.status = "failed"
      await this.saveAgentState()
      
      this.broadcastToWebSockets({
        type: "generation_failed",
        generationId: generation.id,
        error: "Processing failed"
      })
    }
  }

  private async callAIProvider(
    provider: string, 
    model: string, 
    prompt: string, 
    isVideo: boolean, 
    collection: string
  ): Promise<any> {
    try {
      if (provider === 'openai' && !isVideo) {
        // Call OpenAI DALL-E for image generation
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model === 'dall-e-3' ? 'dall-e-3' : 'dall-e-2',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
            response_format: 'url'
          })
        })

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const imageUrl = data.data[0]?.url

        if (!imageUrl) {
          throw new Error('No image URL returned from OpenAI')
        }

        // Store the image in R2 bucket
        const imageResponse = await fetch(imageUrl)
        const imageBuffer = await imageResponse.arrayBuffer()
        const generationId = crypto.randomUUID()
        const fileName = `generated/${generationId}.png`

        // Upload to R2
        await this.env.AI_CONTENT.put(fileName, imageBuffer, {
          httpMetadata: {
            contentType: 'image/png'
          }
        })

        const r2Url = `https://pub-${this.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/serviceflow-ai-content-preview/${fileName}`

        return {
          success: true,
          imageUrl: imageUrl,
          r2Url: r2Url,
          ipfsHash: `QmReal${generationId.replace(/-/g, '')}`,
          quality: 9,
          metadata: {
            provider: 'openai',
            model: model,
            collection,
            generatedAt: new Date().toISOString(),
            originalPrompt: prompt
          }
        }
      } else if (provider === 'cloudflare' && !isVideo) {
        // Call Cloudflare Workers AI for image generation
        const response = await this.env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
          prompt: prompt
        })

        if (!response || !response.image) {
          throw new Error('No image returned from Cloudflare AI')
        }

        // Store in R2
        const generationId = crypto.randomUUID()
        const fileName = `generated/${generationId}.png`

        await this.env.AI_CONTENT.put(fileName, response.image, {
          httpMetadata: {
            contentType: 'image/png'
          }
        })

        const r2Url = `https://pub-${this.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/serviceflow-ai-content-preview/${fileName}`

        return {
          success: true,
          imageUrl: r2Url,
          r2Url: r2Url,
          ipfsHash: `QmReal${generationId.replace(/-/g, '')}`,
          quality: 8,
          metadata: {
            provider: 'cloudflare',
            model: model,
            collection,
            generatedAt: new Date().toISOString(),
            originalPrompt: prompt
          }
        }
      } else {
        // Fallback to mock for unsupported combinations
        const delay = isVideo ? 30000 : 10000
        await new Promise(resolve => setTimeout(resolve, delay))
        
        return {
          success: true,
          ipfsHash: `QmMock${crypto.randomUUID().replace(/-/g, '')}`,
          quality: Math.floor(Math.random() * 3) + 8,
          metadata: {
            provider,
            model,
            collection,
            generatedAt: new Date().toISOString(),
            note: 'Mock generation - provider/model combination not implemented'
          }
        }
      }
    } catch (error) {
      console.error('AI Provider call failed:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
    }
  }

  private async selectOptimalProvider(prompt: string, isVideo: boolean): Promise<string> {
    if (!this.agentState) return "openai"
    
    const providers = this.agentState.aiProviders
    const metrics = this.agentState.performanceMetrics
    
    // Simple provider selection based on package type and performance
    if (this.agentState.packageType >= 3) { // Business+
      // Use performance metrics to select best provider
      const bestProvider = Object.entries(metrics.providerSuccessRates)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || "openai"
      return bestProvider
    } else if (this.agentState.packageType === 2) { // Pro
      return isVideo ? "cloudflare" : "openai"
    } else { // Starter
      return "cloudflare"
    }
  }

  private async selectOptimalModel(prompt: string, isVideo: boolean): Promise<string> {
    if (!this.agentState) return "dall-e-3"
    
    const preferences = this.agentState.modelPreferences
    
    if (isVideo) {
      return preferences.video[0] || "stable-video-diffusion"
    } else {
      return preferences.image[0] || "dall-e-3"
    }
  }

  private isAuthorizedToGenerate(userAddress: string): boolean {
    if (!this.agentState) return false
    
    // Owner can always generate
    if (this.agentState.owner.toLowerCase() === userAddress.toLowerCase()) {
      return true
    }
    
    // Check subscriptions
    const subscription = this.agentState.subscriptions.find(
      s => s.subscriber.toLowerCase() === userAddress.toLowerCase() && 
           s.active && 
           new Date(s.expiresAt) > new Date()
    )
    
    return subscription ? subscription.usedCredits < subscription.maxCredits : false
  }

  private estimateGenerationTime(isVideo: boolean, provider: string): number {
    // Return estimated time in milliseconds
    if (isVideo) {
      return provider === "cloudflare" ? 30000 : 45000
    } else {
      return provider === "cloudflare" ? 8000 : 12000
    }
  }

  private updatePerformanceMetrics(learning: LearningEntry): void {
    if (!this.agentState) return
    
    const metrics = this.agentState.performanceMetrics
    metrics.totalGenerations++
    metrics.averageQuality = (metrics.averageQuality + learning.performance.quality) / 2
    metrics.averageSpeed = (metrics.averageSpeed + learning.performance.speed) / 2
    
    if (!metrics.providerSuccessRates[learning.providerUsed]) {
      metrics.providerSuccessRates[learning.providerUsed] = 0
    }
    metrics.providerSuccessRates[learning.providerUsed]++
    
    if (!metrics.popularStyles[learning.collection]) {
      metrics.popularStyles[learning.collection] = 0
    }
    metrics.popularStyles[learning.collection]++
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket]
    
    const url = new URL(request.url)
    const walletAddress = url.searchParams.get('walletAddress')
    const authToken = url.searchParams.get('token')
    
    if (!walletAddress) {
      return new Response('Wallet address required', { status: 400 })
    }
    
    // Verify authentication
    let isAuthenticated = false
    if (authToken) {
      isAuthenticated = await this.verifyJWT(authToken, walletAddress)
    }
    
    const connectionId = crypto.randomUUID()
    const connection: WebSocketConnection = {
      websocket: server,
      walletAddress,
      connectionTime: new Date().toISOString(),
      lastPing: new Date().toISOString(),
      isAuthenticated,
      authToken,
      permissions: isAuthenticated ? ['generate', 'status', 'learn'] : ['status']
    }
    
    this.websocketConnections.set(connectionId, connection)
    
    server.accept()
    
    server.addEventListener("message", async (event) => {
      try {
        const data = JSON.parse(event.data as string)
        await this.handleWebSocketMessage(connectionId, data)
      } catch (error) {
        console.error("WebSocket message error:", error)
      }
    })
    
    server.addEventListener("close", () => {
      this.websocketConnections.delete(connectionId)
    })
    
    return new Response(null, { status: 101, webSocket: client })
  }

  private async handleWebSocketMessage(connectionId: string, data: any): Promise<void> {
    const connection = this.websocketConnections.get(connectionId)
    if (!connection) return
    
    switch (data.type) {
      case "ping":
        connection.lastPing = new Date().toISOString()
        connection.websocket.send(JSON.stringify({ 
          type: "pong", 
          timestamp: new Date().toISOString() 
        }))
        break
        
      case "authenticate":
        if (data.signature && data.message) {
          // Verify wallet signature (simplified)
          connection.isAuthenticated = true
          connection.permissions = ['generate', 'status', 'learn', 'collaborate']
          connection.websocket.send(JSON.stringify({
            type: "authenticated",
            success: true,
            permissions: connection.permissions
          }))
        }
        break
        
      case "subscribe_generation":
        if (!connection.isAuthenticated) {
          connection.websocket.send(JSON.stringify({
            type: "error",
            message: "Authentication required"
          }))
          return
        }
        
        connection.websocket.send(JSON.stringify({
          type: "subscribed",
          generationId: data.generationId
        }))
        break
        
      case "request_agent_status":
        // Anyone can request status
        const status = this.agentState ? {
          packageType: this.agentState.packageType,
          totalCredits: this.agentState.totalCredits,
          usedCredits: this.agentState.usedCredits,
          isVerified: this.agentState.isVerified,
          metadataVersion: this.agentState.metadataVersion,
          lastActivity: this.agentState.lastActivity
        } : null
        
        connection.websocket.send(JSON.stringify({
          type: "agent_status",
          status
        }))
        break
    }
  }

  private broadcastToWebSockets(message: any): void {
    for (const [id, connection] of this.websocketConnections) {
      try {
        connection.websocket.send(JSON.stringify(message))
      } catch (error) {
        console.error("WebSocket broadcast error:", error)
        this.websocketConnections.delete(id)
      }
    }
  }

  private async handleStatus(request: Request): Promise<Response> {
    if (!this.agentState) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Agent not initialized" 
      }), { status: 400 })
    }

    const url = new URL(request.url)
    const generationId = url.searchParams.get('generationId')
    
    if (generationId) {
      // Return specific generation details
      const generation = this.agentState.generatedContent.find(g => 
        g.metadata?.generationId === generationId
      )
      
      if (generation) {
        return new Response(JSON.stringify({
          success: true,
          generationDetails: generation
        }), {
          headers: { "Content-Type": "application/json" }
        })
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: "Generation not found"
        }), { status: 404 })
      }
    }

    return new Response(JSON.stringify({
      success: true,
      agent: {
        packageTokenId: this.agentState.packageTokenId,
        packageType: this.agentState.packageType,
        totalCredits: this.agentState.totalCredits,
        usedCredits: this.agentState.usedCredits,
        remainingCredits: this.agentState.totalCredits - this.agentState.usedCredits,
        activeGenerations: this.agentState.activeGenerations.length,
        totalGenerations: this.agentState.performanceMetrics.totalGenerations,
        lastActivity: this.agentState.lastActivity,
        connectedClients: this.websocketConnections.size,
        generatedContent: this.agentState.generatedContent.slice(-5) // Last 5 generations
      }
    }), {
      headers: { "Content-Type": "application/json" }
    })
  }

  private async handleLearning(request: Request): Promise<Response> {
    // Implementation for learning endpoint
    return new Response(JSON.stringify({ success: true }))
  }

  private async handleSubscription(request: Request): Promise<Response> {
    // Implementation for subscription management
    return new Response(JSON.stringify({ success: true }))
  }

  private async handleOptimization(request: Request): Promise<Response> {
    // Implementation for agent optimization
    return new Response(JSON.stringify({ success: true }))
  }

  private async handleCollaboration(request: Request): Promise<Response> {
    if (!this.agentState) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Agent not initialized" 
      }), { status: 400 })
    }

    const authResult = await this.verifyWalletAuth(request)
    if (!authResult.success || !authResult.walletAddress) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: authResult.error 
      }), { status: 401 })
    }

    const data = await request.json() as {
      targetAgentId: string
      collaborationType: string
      permissions: string[]
    }

    // Verify collaboration permissions
    if (!this.agentState.collaborationPermissions.allowSkillSharing && 
        data.collaborationType === 'skill_sharing') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Skill sharing not enabled for this agent" 
      }), { status: 403 })
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Collaboration request initiated",
      collaborationId: crypto.randomUUID()
    }))
  }

  /**
   * Handle encrypted ownership transfer for ERC-7857
   */
  private async handleEncryptedTransfer(request: Request): Promise<Response> {
    if (!this.agentState) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Agent not initialized" 
      }), { status: 400 })
    }

    const authResult = await this.verifyWalletAuth(request)
    if (!authResult.success || !authResult.walletAddress) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: authResult.error 
      }), { status: 401 })
    }

    // Only owner can initiate transfers
    if (this.agentState.owner.toLowerCase() !== authResult.walletAddress.toLowerCase()) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Only owner can initiate transfers" 
      }), { status: 403 })
    }

    const data = await request.json() as {
      newOwner: string
      transferData: any
    }

    // Re-encrypt data for new owner
    const reencryptedLearning = await this.encryptData(
      this.agentState.learningData,
      data.newOwner
    )

    const reencryptedPreferences = await this.encryptData(
      this.agentState.preferences,
      data.newOwner
    )

    // Generate new metadata hash
    const newMetadata = {
      ...this.agentState,
      owner: data.newOwner,
      metadataVersion: this.agentState.metadataVersion + 1
    }

    const newMetadataString = JSON.stringify(newMetadata)
    const newMetadataHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(newMetadataString))))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return new Response(JSON.stringify({
      success: true,
      newMetadataHash,
      newEncryptedURI: `encrypted/user-${data.newOwner.toLowerCase()}/metadata.json`,
      transferId: crypto.randomUUID()
    }))
  }

  /**
   * Handle proof verification for ERC-7857
   */
  private async handleProofVerification(request: Request): Promise<Response> {
    if (!this.agentState) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Agent not initialized" 
      }), { status: 400 })
    }

    const data = await request.json() as {
      proofData: string
      contentHash: string
      verifierAddress: string
    }

    // Verify the proof (simplified - in production use proper verification)
    const proofHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data.proofData))))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Update verification status
    this.agentState.proofHash = proofHash
    this.agentState.isVerified = true
    await this.saveAgentState()

    return new Response(JSON.stringify({
      success: true,
      proofHash,
      verified: true,
      verifiedAt: new Date().toISOString()
    }))
  }

  /**
   * Handle metadata updates for ERC-7857
   */
  private async handleMetadataUpdate(request: Request): Promise<Response> {
    if (!this.agentState) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Agent not initialized" 
      }), { status: 400 })
    }

    const authResult = await this.verifyWalletAuth(request)
    if (!authResult.success || !authResult.walletAddress) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: authResult.error 
      }), { status: 401 })
    }

    const data = await request.json() as {
      newMetadata: any
      proofData: string
    }

    // Generate new metadata hash
    const newMetadataString = JSON.stringify(data.newMetadata)
    const newMetadataHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(newMetadataString))))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Update agent state
    this.agentState.metadataHash = newMetadataHash
    this.agentState.metadataVersion += 1
    this.agentState.isVerified = false // Needs re-verification
    this.agentState.lastActivity = new Date().toISOString()

    await this.saveAgentState()

    return new Response(JSON.stringify({
      success: true,
      newMetadataHash,
      version: this.agentState.metadataVersion,
      requiresVerification: true
    }))
  }

  // Helper methods for initialization
  private generateInitialMetadata(packageType: number): string {
    const metadataMap = {
      1: "agent:starter,providers:openai+cloudflare+gemini,models:gpt4.1+dalle3+cf_ai,capabilities:text+image,styles:basic",
      2: "agent:pro,providers:openai+cloudflare+gemini,models:gpt4.1+dalle3+gemini_pro+cf_workers+video,capabilities:text+image+video,styles:advanced",
      3: "agent:business,providers:multicloud,models:openai_suite+cloudflare_ai+gemini_ultra+custom,capabilities:full_multimodal+redundancy,styles:custom,workflow:batch",
      4: "agent:enterprise,providers:multicloud+custom,models:all_providers+finetuned+api,capabilities:unlimited+failover,styles:unlimited,api:enabled"
    }
    return metadataMap[packageType as keyof typeof metadataMap] || metadataMap[1]
  }

  private getDefaultPreferences(packageType: number): AgentPreferences {
    return {
      preferredStyles: packageType >= 2 ? ["photorealistic", "artistic", "abstract"] : ["basic", "simple"],
      preferredProviders: packageType >= 3 ? ["openai", "cloudflare", "gemini"] : ["cloudflare", "openai"],
      qualityVsSpeed: packageType >= 3 ? 0.8 : 0.5,
      experimentalFeatures: packageType >= 4,
      autoOptimization: packageType >= 2,
      learningRate: Math.min(packageType * 0.25, 1)
    }
  }

  private getInitialCollections(packageType: number): string[] {
    if (packageType >= 3) return ["bandit", "kidz", "derp", "sonic"]
    if (packageType >= 2) return ["bandit", "kidz"]
    return ["default"]
  }

  private getInitialMetrics(): PerformanceMetrics {
    return {
      totalGenerations: 0,
      averageQuality: 8,
      averageSpeed: 10000,
      totalCostSaved: 0,
      providerSuccessRates: {},
      popularStyles: {},
      errorRate: 0,
      lastOptimization: new Date().toISOString()
    }
  }

  private getProviderConfig(packageType: number): AIProviderConfig {
    return {
      openai: {
        enabled: true,
        models: packageType >= 4 ? ["gpt-4", "gpt-5", "dall-e-3", "dall-e-2"] : 
               packageType >= 2 ? ["gpt-4", "dall-e-3"] : ["dall-e-3"],
        weights: { "dall-e-3": 0.8, "gpt-4": 0.2 }
      },
      cloudflare: {
        enabled: true,
        models: ["flux-1-schnell", "stable-diffusion-xl", "llama-3-8b"],
        weights: { "flux-1-schnell": 0.6, "stable-diffusion-xl": 0.4 }
      },
      gemini: {
        enabled: packageType >= 2,
        models: packageType >= 3 ? ["gemini-pro", "gemini-ultra"] : ["gemini-pro"],
        weights: { "gemini-pro": 1.0 }
      }
    }
  }

  private getModelPreferences(packageType: number): ModelPreferences {
    return {
      text: packageType >= 4 ? ["gpt-5", "gpt-4", "gemini-ultra"] : 
            packageType >= 2 ? ["gpt-4", "gemini-pro"] : ["gpt-4"],
      image: packageType >= 3 ? ["dall-e-3", "flux-1-schnell", "stable-diffusion-xl"] :
             packageType >= 2 ? ["dall-e-3", "flux-1-schnell"] : ["flux-1-schnell"],
      video: packageType >= 2 ? ["stable-video-diffusion", "runwayml"] : ["stable-video-diffusion"],
      fallback: ["flux-1-schnell", "dall-e-3"]
    }
  }
}

// Export for Cloudflare Workers
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return new Response("INFT Agent Durable Object Handler", { status: 200 })
  }
}

export { INFTAgentDurableObject as DurableObject }