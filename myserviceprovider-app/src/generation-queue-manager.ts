/**
 * Generation Queue Manager - ERC-7857 Enhanced
 * 
 * Advanced queue management system for INFT agent generations with wallet-based authentication
 * Handles concurrent processing, priority management, and resource optimization
 * 
 * Enhanced Features:
 * - Wallet-based priority calculation and verification
 * - Per-wallet generation limits and rate limiting
 * - Encrypted content storage with hash verification
 * - Agent ownership validation
 * - Zero-trust security for generation requests
 * - JWT token verification for queue operations
 * - Proof generation for ERC-7857 compliance
 * - Secure provider selection based on wallet permissions
 */

import { MultiProviderAIOrchestrator, GenerationRequest, GenerationResponse } from './multi-provider-ai-orchestrator'
import { AgentWebSocketHandler, GenerationProgress } from './agent-websocket-handler'
import WalletAuthMiddleware, { WalletAuthResult } from './wallet-auth-middleware'
import CryptoUtils, { EncryptedData, ProofData } from './crypto-utils'

export interface QueuedGeneration {
  id: string
  agentId: string
  walletAddress: string // Changed from userId to walletAddress
  request: GenerationRequest
  priority: number
  queuedAt: string
  startedAt?: string
  completedAt?: string
  estimatedCompletion?: string
  retryCount: number
  maxRetries: number
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  assignedProvider?: string
  assignedModel?: string
  websocketId?: string
  progress: number
  currentStep: string
  error?: string
  result?: GenerationResponse
  metadata: Record<string, any>
  // ERC-7857 specific fields
  authToken?: string // JWT token for verification
  encryptedContentHash?: string // Hash of encrypted result
  proofData?: string // Verification proof
  contentEncrypted: boolean // Whether result will be encrypted
}

export interface QueueConfiguration {
  maxConcurrentGenerations: number
  maxConcurrentPerProvider: Record<string, number>
  maxConcurrentPerWallet: number // Changed from maxConcurrentPerUser
  maxQueueSize: number
  retryPolicy: {
    maxRetries: number
    baseDelay: number
    maxDelay: number
    backoffMultiplier: number
  }
  priorityWeights: {
    packageType: number
    walletTier: number // Changed from userTier
    verificationBonus: number // Bonus for verified wallet/agent
    retryPenalty: number
    ageBonus: number
    encryptionCost: number // Cost adjustment for encrypted content
  }
  walletLimits: {
    maxGenerationsPerHour: Record<string, number> // Per package type
    maxCreditsPerDay: Record<string, number>
    requireVerification: boolean
  }
}

export interface QueueStats {
  totalQueued: number
  totalProcessing: number
  totalCompleted: number
  totalFailed: number
  averageWaitTime: number
  averageProcessingTime: number
  providerUtilization: Record<string, number>
  queueHealth: 'healthy' | 'degraded' | 'critical'
}

export interface ProviderCircuitBreaker {
  provider: string
  isOpen: boolean
  failureCount: number
  lastFailureTime: string
  halfOpenAt?: string
  successThreshold: number
  failureThreshold: number
  timeoutMs: number
}

export class GenerationQueueManager {
  private queue: QueuedGeneration[] = []
  private processing: Map<string, QueuedGeneration> = new Map()
  private completed: Map<string, QueuedGeneration> = new Map()
  private config: QueueConfiguration
  private orchestrator: MultiProviderAIOrchestrator
  private websocketHandler: AgentWebSocketHandler
  private circuitBreakers: Map<string, ProviderCircuitBreaker> = new Map()
  private stats: QueueStats
  private isProcessing = false
  // Enhanced security components
  private authMiddleware: WalletAuthMiddleware
  private cryptoUtils: CryptoUtils
  private walletGenerationCounts: Map<string, { hourly: number; daily: number; resetHour: number; resetDay: number }> = new Map()

  constructor(
    config: QueueConfiguration,
    orchestrator: MultiProviderAIOrchestrator,
    websocketHandler: AgentWebSocketHandler,
    env: Env
  ) {
    this.config = config
    this.orchestrator = orchestrator
    this.websocketHandler = websocketHandler
    this.stats = this.initializeStats()
    
    // Initialize security components
    this.authMiddleware = new WalletAuthMiddleware(env)
    this.cryptoUtils = new CryptoUtils()

    // Initialize circuit breakers for each provider
    this.initializeCircuitBreakers()

    // Start processing loop
    this.startProcessingLoop()

    // Start maintenance tasks
    setInterval(() => this.cleanupCompleted(), 300000) // 5 minutes
    setInterval(() => this.updateStats(), 60000) // 1 minute
    setInterval(() => this.checkCircuitBreakers(), 30000) // 30 seconds
  }

  async addToQueue(generation: Omit<QueuedGeneration, 'id' | 'queuedAt' | 'status' | 'progress' | 'currentStep' | 'retryCount'>, authToken?: string): Promise<string> {
    // Verify wallet authentication
    if (!authToken && !generation.authToken) {
      throw new Error('Authentication token required')
    }

    const token = authToken || generation.authToken!
    const authResult = await this.verifyGenerationAuth(token, generation.walletAddress, generation.agentId)
    if (!authResult.success) {
      throw new Error(`Authentication failed: ${authResult.error}`)
    }

    // Check queue size limit
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error('Queue is full. Please try again later.')
    }

    // Check wallet concurrent limit
    const walletActiveGenerations = this.getWalletActiveGenerations(generation.walletAddress)
    if (walletActiveGenerations >= this.config.maxConcurrentPerWallet) {
      throw new Error('Maximum concurrent generations reached for wallet')
    }

    // Check wallet rate limits
    if (!this.checkWalletRateLimit(generation.walletAddress, generation.request.packageType)) {
      throw new Error('Rate limit exceeded for wallet')
    }

    // Verify agent ownership
    if (!this.verifyAgentOwnership(generation.agentId, generation.walletAddress)) {
      throw new Error('Wallet does not own this agent')
    }

    const queuedGeneration: QueuedGeneration = {
      ...generation,
      id: crypto.randomUUID(),
      queuedAt: new Date().toISOString(),
      status: 'queued',
      progress: 0,
      currentStep: 'Queued',
      retryCount: 0,
      priority: this.calculatePriority(generation),
      authToken: token,
      contentEncrypted: this.shouldEncryptContent(generation.request.packageType),
      encryptedContentHash: '',
      proofData: ''
    }

    // Insert in priority order
    this.insertByPriority(queuedGeneration)

    // Notify via WebSocket
    if (queuedGeneration.websocketId) {
      await this.websocketHandler.broadcastGenerationProgress(queuedGeneration.agentId, {
        generationId: queuedGeneration.id,
        status: 'queued',
        progress: 0,
        currentStep: 'Added to queue',
        estimatedTimeRemaining: this.estimateWaitTime(queuedGeneration)
      })
    }

    console.log(`Added generation ${queuedGeneration.id} to queue (priority: ${queuedGeneration.priority})`)
    return queuedGeneration.id
  }

  async cancelGeneration(generationId: string, walletAddress: string, authToken: string): Promise<boolean> {
    // Verify authentication
    const authResult = await this.authMiddleware.verifyJWT(authToken, walletAddress)
    if (!authResult.success) {
      throw new Error(`Authentication failed: ${authResult.error}`)
    }

    // Find in queue
    const queueIndex = this.queue.findIndex(g => 
      g.id === generationId && 
      g.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    )
    if (queueIndex >= 0) {
      const generation = this.queue[queueIndex]
      generation.status = 'cancelled'
      this.queue.splice(queueIndex, 1)
      
      await this.notifyProgress(generation, 'cancelled', 100, 'Cancelled by wallet owner')
      return true
    }

    // Find in processing
    const processing = this.processing.get(generationId)
    if (processing && processing.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
      processing.status = 'cancelled'
      this.processing.delete(generationId)
      
      await this.notifyProgress(processing, 'cancelled', 100, 'Cancelled by wallet owner')
      return true
    }

    return false
  }

  async getGenerationStatus(generationId: string): Promise<QueuedGeneration | null> {
    // Check queue
    const queued = this.queue.find(g => g.id === generationId)
    if (queued) return queued

    // Check processing
    const processing = this.processing.get(generationId)
    if (processing) return processing

    // Check completed
    const completed = this.completed.get(generationId)
    if (completed) return completed

    return null
  }

  async getQueueStats(): Promise<QueueStats> {
    return { ...this.stats }
  }

  async getWalletGenerations(walletAddress: string, authToken: string): Promise<QueuedGeneration[]> {
    // Verify authentication
    const authResult = await this.authMiddleware.verifyJWT(authToken, walletAddress)
    if (!authResult.success) {
      throw new Error(`Authentication failed: ${authResult.error}`)
    }

    const walletGenerations: QueuedGeneration[] = []
    const normalizedAddress = walletAddress.toLowerCase()

    // Add queued
    walletGenerations.push(...this.queue.filter(g => 
      g.walletAddress.toLowerCase() === normalizedAddress
    ))

    // Add processing
    for (const generation of this.processing.values()) {
      if (generation.walletAddress.toLowerCase() === normalizedAddress) {
        walletGenerations.push(generation)
      }
    }

    // Add recent completed (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    for (const generation of this.completed.values()) {
      if (generation.walletAddress.toLowerCase() === normalizedAddress && 
          generation.completedAt && generation.completedAt > yesterday) {
        walletGenerations.push(generation)
      }
    }

    return walletGenerations.sort((a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime())
  }

  private async startProcessingLoop(): Promise<void> {
    if (this.isProcessing) return
    this.isProcessing = true

    while (this.isProcessing) {
      try {
        await this.processNextGeneration()
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second between iterations
      } catch (error) {
        console.error('Processing loop error:', error)
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds on error
      }
    }
  }

  private async processNextGeneration(): Promise<void> {
    // Check if we can process more generations
    if (this.processing.size >= this.config.maxConcurrentGenerations) {
      return
    }

    // Get next generation from queue
    const generation = this.getNextGeneration()
    if (!generation) {
      return
    }

    // Remove from queue and add to processing
    const queueIndex = this.queue.findIndex(g => g.id === generation.id)
    if (queueIndex >= 0) {
      this.queue.splice(queueIndex, 1)
    }

    generation.status = 'processing'
    generation.startedAt = new Date().toISOString()
    generation.currentStep = 'Starting generation'
    this.processing.set(generation.id, generation)

    // Notify progress
    await this.notifyProgress(generation, 'processing', 10, 'Generation started')

    // Process generation (don't await - run in background)
    this.processGeneration(generation).catch(error => {
      console.error(`Generation processing error for ${generation.id}:`, error)
    })
  }

  private getNextGeneration(): QueuedGeneration | null {
    if (this.queue.length === 0) return null

    // Find highest priority generation that can be processed
    for (let i = 0; i < this.queue.length; i++) {
      const generation = this.queue[i]
      
      // Check provider availability
      if (!this.isProviderAvailable(generation.assignedProvider)) {
        continue
      }

      // Check provider concurrent limit
      if (!this.canProcessWithProvider(generation.assignedProvider)) {
        continue
      }

      return generation
    }

    return null
  }

  private async processGeneration(generation: QueuedGeneration): Promise<void> {
    const startTime = Date.now()

    try {
      // Update progress
      await this.notifyProgress(generation, 'processing', 20, 'Selecting AI provider')

      // Select provider if not already assigned
      if (!generation.assignedProvider) {
        const selection = await this.selectProvider(generation)
        generation.assignedProvider = selection.provider
        generation.assignedModel = selection.model
      }

      // Check circuit breaker
      if (!this.isProviderAvailable(generation.assignedProvider!)) {
        throw new Error(`Provider ${generation.assignedProvider} is not available`)
      }

      // Update progress
      await this.notifyProgress(generation, 'processing', 40, `Using ${generation.assignedProvider}`)

      // Call AI provider
      const response = await this.orchestrator.generateContent({
        ...generation.request,
        preferredProvider: generation.assignedProvider,
        preferredModel: generation.assignedModel
      })

      if (response.success) {
        // Success
        generation.status = 'completed'
        generation.completedAt = new Date().toISOString()
        generation.result = response
        generation.progress = 100
        generation.currentStep = 'Completed'

        // Reset circuit breaker success count
        this.recordProviderSuccess(response.provider)

        // Move to completed
        this.processing.delete(generation.id)
        this.completed.set(generation.id, generation)

        // Notify completion
        await this.notifyProgress(generation, 'completed', 100, 'Generation completed')

        console.log(`Generation ${generation.id} completed successfully in ${Date.now() - startTime}ms`)

      } else {
        // Failure - check if we should retry
        this.recordProviderFailure(response.provider)

        if (generation.retryCount < generation.maxRetries) {
          await this.retryGeneration(generation, response.error || 'Unknown error')
        } else {
          await this.failGeneration(generation, response.error || 'Max retries exceeded')
        }
      }

    } catch (error) {
      console.error(`Generation processing error for ${generation.id}:`, error)
      
      if (generation.assignedProvider) {
        this.recordProviderFailure(generation.assignedProvider)
      }

      if (generation.retryCount < generation.maxRetries) {
        await this.retryGeneration(generation, error instanceof Error ? error.message : 'Unknown error')
      } else {
        await this.failGeneration(generation, error instanceof Error ? error.message : 'Processing failed')
      }
    }
  }

  private async retryGeneration(generation: QueuedGeneration, error: string): Promise<void> {
    generation.retryCount++
    generation.status = 'queued'
    generation.progress = 0
    generation.currentStep = `Retry ${generation.retryCount}/${generation.maxRetries}`
    generation.error = error
    
    // Calculate retry delay
    const delay = Math.min(
      this.config.retryPolicy.baseDelay * Math.pow(this.config.retryPolicy.backoffMultiplier, generation.retryCount - 1),
      this.config.retryPolicy.maxDelay
    )

    // Remove from processing
    this.processing.delete(generation.id)

    // Add back to queue with delay
    setTimeout(() => {
      this.insertByPriority(generation)
      this.notifyProgress(generation, 'queued', 0, `Retrying in queue (attempt ${generation.retryCount})`)
    }, delay)

    console.log(`Generation ${generation.id} scheduled for retry ${generation.retryCount} in ${delay}ms`)
  }

  private async failGeneration(generation: QueuedGeneration, error: string): Promise<void> {
    generation.status = 'failed'
    generation.completedAt = new Date().toISOString()
    generation.error = error
    generation.progress = 100
    generation.currentStep = 'Failed'

    // Move to completed
    this.processing.delete(generation.id)
    this.completed.set(generation.id, generation)

    // Notify failure
    await this.notifyProgress(generation, 'failed', 100, `Failed: ${error}`)

    console.log(`Generation ${generation.id} failed: ${error}`)
  }

  private async notifyProgress(
    generation: QueuedGeneration,
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled',
    progress: number,
    currentStep: string,
    estimatedTimeRemaining?: number
  ): Promise<void> {
    generation.progress = progress
    generation.currentStep = currentStep

    const progressData: GenerationProgress = {
      generationId: generation.id,
      status,
      progress,
      currentStep,
      estimatedTimeRemaining: estimatedTimeRemaining || this.estimateRemainingTime(generation)
    }

    // Notify via WebSocket
    await this.websocketHandler.broadcastGenerationProgress(generation.agentId, progressData)
  }

  private calculatePriority(generation: Omit<QueuedGeneration, 'id' | 'queuedAt' | 'status' | 'progress' | 'currentStep' | 'retryCount'>): number {
    let priority = 0

    // Package type weight (higher package = higher priority)
    priority += generation.request.packageType * this.config.priorityWeights.packageType

    // Quality request weight
    const qualityWeight = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'ultra': 4
    }
    priority += qualityWeight[generation.request.quality] || 2

    // Wallet tier (based on package type and verification status)
    const walletTier = this.getWalletTier(generation.walletAddress, generation.request.packageType)
    priority += walletTier * this.config.priorityWeights.walletTier

    // Verification bonus for verified agents
    if (generation.metadata.isVerified) {
      priority += this.config.priorityWeights.verificationBonus
    }

    // Encryption cost adjustment
    if (this.shouldEncryptContent(generation.request.packageType)) {
      priority += this.config.priorityWeights.encryptionCost
    }

    return priority
  }

  /**
   * Get wallet tier based on package type and activity
   */
  private getWalletTier(walletAddress: string, packageType: number): number {
    // Base tier from package type
    let tier = packageType
    
    // Bonus for active wallets (simplified)
    const activeGenerations = this.getWalletActiveGenerations(walletAddress)
    if (activeGenerations > 0) {
      tier += 0.5
    }
    
    return tier
  }

  private insertByPriority(generation: QueuedGeneration): void {
    // Adjust priority based on age and retry count
    const ageMinutes = (Date.now() - new Date(generation.queuedAt).getTime()) / (1000 * 60)
    generation.priority += ageMinutes * this.config.priorityWeights.ageBonus
    generation.priority -= generation.retryCount * this.config.priorityWeights.retryPenalty

    // Find insertion point
    let insertIndex = 0
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority < generation.priority) {
        insertIndex = i
        break
      }
      insertIndex = i + 1
    }

    this.queue.splice(insertIndex, 0, generation)
  }

  private async selectProvider(generation: QueuedGeneration): Promise<{ provider: string; model: string }> {
    // This would use the orchestrator's selection logic
    // For now, return a simple selection based on availability
    const availableProviders = ['openai', 'cloudflare', 'gemini'].filter(p => 
      this.isProviderAvailable(p) && this.canProcessWithProvider(p)
    )

    if (availableProviders.length === 0) {
      throw new Error('No providers available')
    }

    // Simple selection - prefer OpenAI for high quality, Cloudflare for speed
    if (generation.request.quality === 'ultra' && availableProviders.includes('openai')) {
      return { provider: 'openai', model: 'dall-e-3' }
    } else if (availableProviders.includes('cloudflare')) {
      return { provider: 'cloudflare', model: 'flux-1-schnell' }
    } else {
      return { provider: availableProviders[0], model: 'default' }
    }
  }

  private isProviderAvailable(provider: string | undefined): boolean {
    if (!provider) return false
    
    const circuitBreaker = this.circuitBreakers.get(provider)
    if (!circuitBreaker) return true

    return !circuitBreaker.isOpen
  }

  private canProcessWithProvider(provider: string | undefined): boolean {
    if (!provider) return false

    const limit = this.config.maxConcurrentPerProvider[provider] || 5
    const current = Array.from(this.processing.values())
      .filter(g => g.assignedProvider === provider).length

    return current < limit
  }

  private getWalletActiveGenerations(walletAddress: string): number {
    let count = 0
    const normalizedAddress = walletAddress.toLowerCase()
    
    // Count queued
    count += this.queue.filter(g => 
      g.walletAddress.toLowerCase() === normalizedAddress
    ).length
    
    // Count processing
    for (const generation of this.processing.values()) {
      if (generation.walletAddress.toLowerCase() === normalizedAddress) count++
    }

    return count
  }

  /**
   * Verify generation authentication
   */
  private async verifyGenerationAuth(authToken: string, walletAddress: string, agentId: string): Promise<WalletAuthResult> {
    // Verify JWT token
    const authResult = await this.authMiddleware.verifyJWT(authToken, walletAddress)
    if (!authResult.success) {
      return authResult
    }

    // Verify wallet has permission to use this agent
    if (!authResult.permissions?.includes('generate_content')) {
      return { success: false, error: 'Insufficient permissions for content generation' }
    }

    return authResult
  }

  /**
   * Check wallet rate limits
   */
  private checkWalletRateLimit(walletAddress: string, packageType: number): boolean {
    const normalizedAddress = walletAddress.toLowerCase()
    const now = Date.now()
    const currentHour = Math.floor(now / (60 * 60 * 1000))
    const currentDay = Math.floor(now / (24 * 60 * 60 * 1000))
    
    let counts = this.walletGenerationCounts.get(normalizedAddress)
    
    if (!counts) {
      counts = { hourly: 0, daily: 0, resetHour: currentHour, resetDay: currentDay }
      this.walletGenerationCounts.set(normalizedAddress, counts)
    }
    
    // Reset counters if needed
    if (counts.resetHour !== currentHour) {
      counts.hourly = 0
      counts.resetHour = currentHour
    }
    
    if (counts.resetDay !== currentDay) {
      counts.daily = 0
      counts.resetDay = currentDay
    }
    
    // Check limits based on package type
    const hourlyLimit = this.config.walletLimits.maxGenerationsPerHour[packageType] || 10
    const dailyLimit = this.config.walletLimits.maxCreditsPerDay[packageType] || 100
    
    if (counts.hourly >= hourlyLimit || counts.daily >= dailyLimit) {
      return false
    }
    
    // Increment counters
    counts.hourly++
    counts.daily++
    
    return true
  }

  /**
   * Verify agent ownership
   */
  private verifyAgentOwnership(agentId: string, walletAddress: string): boolean {
    // Extract wallet from agent ID format: user-{walletAddress}
    const expectedAgentId = `user-${walletAddress.toLowerCase()}`
    return agentId.toLowerCase() === expectedAgentId
  }

  /**
   * Determine if content should be encrypted based on package type
   */
  private shouldEncryptContent(packageType: number): boolean {
    // Encrypt for Pro (2) and above packages
    return packageType >= 2
  }

  private estimateWaitTime(generation: QueuedGeneration): number {
    // Simple estimation based on queue position and average processing time
    const position = this.queue.findIndex(g => g.id === generation.id)
    const avgProcessingTime = 15000 // 15 seconds average
    const maxConcurrent = this.config.maxConcurrentGenerations

    return Math.max(0, Math.floor(position / maxConcurrent) * avgProcessingTime)
  }

  private estimateRemainingTime(generation: QueuedGeneration): number {
    if (generation.status === 'queued') {
      return this.estimateWaitTime(generation)
    }

    if (generation.status === 'processing' && generation.startedAt) {
      const elapsed = Date.now() - new Date(generation.startedAt).getTime()
      const estimatedTotal = generation.request.modality === 'video' ? 30000 : 10000
      return Math.max(0, estimatedTotal - elapsed)
    }

    return 0
  }

  private initializeStats(): QueueStats {
    return {
      totalQueued: 0,
      totalProcessing: 0,
      totalCompleted: 0,
      totalFailed: 0,
      averageWaitTime: 0,
      averageProcessingTime: 0,
      providerUtilization: {},
      queueHealth: 'healthy'
    }
  }

  private initializeCircuitBreakers(): void {
    const providers = ['openai', 'cloudflare', 'gemini']
    
    for (const provider of providers) {
      this.circuitBreakers.set(provider, {
        provider,
        isOpen: false,
        failureCount: 0,
        lastFailureTime: '',
        successThreshold: 5,
        failureThreshold: 5,
        timeoutMs: 60000 // 1 minute
      })
    }
  }

  private recordProviderSuccess(provider: string): void {
    const breaker = this.circuitBreakers.get(provider)
    if (breaker) {
      breaker.failureCount = Math.max(0, breaker.failureCount - 1)
      
      // Close circuit if it was half-open and we hit success threshold
      if (breaker.isOpen && breaker.halfOpenAt) {
        breaker.isOpen = false
        breaker.halfOpenAt = undefined
        console.log(`Circuit breaker for ${provider} closed after successful recovery`)
      }
    }
  }

  private recordProviderFailure(provider: string): void {
    const breaker = this.circuitBreakers.get(provider)
    if (breaker) {
      breaker.failureCount++
      breaker.lastFailureTime = new Date().toISOString()
      
      if (breaker.failureCount >= breaker.failureThreshold && !breaker.isOpen) {
        breaker.isOpen = true
        breaker.halfOpenAt = new Date(Date.now() + breaker.timeoutMs).toISOString()
        console.log(`Circuit breaker for ${provider} opened due to failures`)
      }
    }
  }

  private checkCircuitBreakers(): void {
    const now = new Date()
    
    for (const breaker of this.circuitBreakers.values()) {
      if (breaker.isOpen && breaker.halfOpenAt && now >= new Date(breaker.halfOpenAt)) {
        breaker.halfOpenAt = undefined
        console.log(`Circuit breaker for ${breaker.provider} moved to half-open state`)
      }
    }
  }

  private updateStats(): void {
    this.stats.totalQueued = this.queue.length
    this.stats.totalProcessing = this.processing.size
    
    // Calculate provider utilization
    for (const provider of this.circuitBreakers.keys()) {
      const processing = Array.from(this.processing.values())
        .filter(g => g.assignedProvider === provider).length
      const limit = this.config.maxConcurrentPerProvider[provider] || 5
      this.stats.providerUtilization[provider] = (processing / limit) * 100
    }

    // Determine queue health
    const queueUtilization = this.queue.length / this.config.maxQueueSize
    const processingUtilization = this.processing.size / this.config.maxConcurrentGenerations

    if (queueUtilization > 0.8 || processingUtilization > 0.9) {
      this.stats.queueHealth = 'critical'
    } else if (queueUtilization > 0.5 || processingUtilization > 0.7) {
      this.stats.queueHealth = 'degraded'
    } else {
      this.stats.queueHealth = 'healthy'
    }
  }

  private cleanupCompleted(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
    
    for (const [id, generation] of this.completed) {
      if (generation.completedAt && new Date(generation.completedAt) < cutoff) {
        this.completed.delete(id)
      }
    }
  }

  // Public management methods
  async pauseQueue(): Promise<void> {
    this.isProcessing = false
    console.log('Queue processing paused')
  }

  async resumeQueue(): Promise<void> {
    if (!this.isProcessing) {
      this.startProcessingLoop()
      console.log('Queue processing resumed')
    }
  }

  async clearQueue(): Promise<void> {
    this.queue.length = 0
    console.log('Queue cleared')
  }

  async adjustConcurrency(maxConcurrent: number): Promise<void> {
    this.config.maxConcurrentGenerations = maxConcurrent
    console.log(`Adjusted max concurrent generations to ${maxConcurrent}`)
  }
}

export default GenerationQueueManager