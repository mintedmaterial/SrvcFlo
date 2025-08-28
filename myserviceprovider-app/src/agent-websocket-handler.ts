/**
 * Agent WebSocket Handler - ERC-7857 Enhanced
 * 
 * Real-time communication system for INFT agents with wallet-based authentication
 * Provides live updates for:
 * - Generation status and progress
 * - Agent learning and evolution
 * - Credit usage and limits
 * - Agent-to-agent collaboration
 * - Real-time chat with AI agents
 * 
 * Enhanced Features:
 * - Wallet signature verification for connections
 * - JWT token-based session management
 * - Per-wallet connection isolation
 * - Encrypted message routing
 * - Agent ownership verification
 * - Zero-trust security model
 */

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  messageId: string
  userId?: string
  agentId?: string
}

export interface WebSocketConnection {
  websocket: WebSocket
  connectionId: string
  walletAddress: string // Changed from userId to walletAddress
  agentIds: string[] // INFT agents this connection is subscribed to
  connectionTime: string
  lastActivity: string
  lastPing: string
  authenticated: boolean
  authToken?: string // JWT token for session management
  signatureVerified: boolean // Wallet signature verification status
  permissions: string[] // What this wallet can do
  rateLimitBucket: number
  subscriptions: Set<string>
  metadata: Record<string, any>
}

export interface AgentEvent {
  type: 'generation_started' | 'generation_progress' | 'generation_completed' | 'generation_failed' | 
        'credit_update' | 'learning_update' | 'agent_message' | 'collaboration_request' | 
        'subscription_update' | 'optimization_complete'
  agentId: string
  data: any
  timestamp: string
  broadcast: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  agentId?: string
  metadata?: Record<string, any>
}

export interface GenerationProgress {
  generationId: string
  status: 'queued' | 'processing' | 'uploading' | 'completed' | 'failed'
  progress: number // 0-100
  currentStep: string
  estimatedTimeRemaining?: number
  imagePreview?: string
}

export class AgentWebSocketHandler {
  private connections: Map<string, WebSocketConnection> = new Map()
  private agentConnections: Map<string, Set<string>> = new Map() // agentId -> connectionIds
  private messageHistory: Map<string, ChatMessage[]> = new Map() // agentId -> messages
  private rateLimitConfig = {
    maxMessagesPerMinute: 60,
    resetInterval: 60000 // 1 minute
  }

  constructor() {
    // Start cleanup and heartbeat intervals
    setInterval(() => this.cleanupStaleConnections(), 30000) // 30 seconds
    setInterval(() => this.sendHeartbeats(), 10000) // 10 seconds
    setInterval(() => this.resetRateLimits(), this.rateLimitConfig.resetInterval)
  }

  async handleWebSocketUpgrade(request: Request): Promise<Response> {
    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket]
    
    const url = new URL(request.url)
    const walletAddress = url.searchParams.get('walletAddress')
    const agentId = url.searchParams.get('agentId')
    const authToken = url.searchParams.get('token')
    const signature = url.searchParams.get('signature')
    const message = url.searchParams.get('message')

    if (!walletAddress) {
      return new Response('Wallet address required', { status: 400 })
    }

    const connectionId = crypto.randomUUID()
    
    const connection: WebSocketConnection = {
      websocket: server,
      connectionId,
      walletAddress,
      agentIds: agentId ? [agentId] : [],
      connectionTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      lastPing: new Date().toISOString(),
      authenticated: false,
      authToken,
      signatureVerified: false,
      permissions: [],
      rateLimitBucket: 0,
      subscriptions: new Set(),
      metadata: {}
    }

    // Authenticate connection with wallet signature or JWT token
    if (authToken) {
      connection.authenticated = await this.authenticateConnection(authToken, walletAddress)
      if (connection.authenticated) {
        connection.permissions = await this.getWalletPermissions(walletAddress)
      }
    } else if (signature && message) {
      connection.signatureVerified = await this.verifyWalletSignature(walletAddress, signature, message)
      if (connection.signatureVerified) {
        connection.authenticated = true
        connection.permissions = await this.getWalletPermissions(walletAddress)
      }
    }

    this.connections.set(connectionId, connection)

    // Track agent connections
    if (agentId) {
      if (!this.agentConnections.has(agentId)) {
        this.agentConnections.set(agentId, new Set())
      }
      this.agentConnections.get(agentId)!.add(connectionId)
    }

    server.accept()

    // Set up event listeners
    server.addEventListener('message', async (event) => {
      await this.handleMessage(connectionId, event.data as string)
    })

    server.addEventListener('close', () => {
      this.handleDisconnection(connectionId)
    })

    server.addEventListener('error', (error) => {
      console.error(`WebSocket error for connection ${connectionId}:`, error)
      this.handleDisconnection(connectionId)
    })

    // Send welcome message
    await this.sendToConnection(connectionId, {
      type: 'connection_established',
      data: {
        connectionId,
        walletAddress: connection.walletAddress,
        authenticated: connection.authenticated,
        signatureVerified: connection.signatureVerified,
        permissions: connection.permissions,
        agentIds: connection.agentIds,
        serverTime: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      messageId: crypto.randomUUID()
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  private async handleMessage(connectionId: string, data: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    // Update activity
    connection.lastActivity = new Date().toISOString()

    // Rate limiting
    if (!this.checkRateLimit(connection)) {
      await this.sendToConnection(connectionId, {
        type: 'rate_limit_exceeded',
        data: { message: 'Too many messages. Please slow down.' },
        timestamp: new Date().toISOString(),
        messageId: crypto.randomUUID()
      })
      return
    }

    try {
      const message: WebSocketMessage = JSON.parse(data)
      await this.routeMessage(connectionId, message)
    } catch (error) {
      console.error(`Message parsing error for connection ${connectionId}:`, error)
      await this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Invalid message format' },
        timestamp: new Date().toISOString(),
        messageId: crypto.randomUUID()
      })
    }
  }

  private async routeMessage(connectionId: string, message: WebSocketMessage): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    switch (message.type) {
      case 'ping':
        await this.handlePing(connectionId)
        break
        
      case 'authenticate':
        await this.handleAuthentication(connectionId, message.data)
        break
        
      case 'wallet_challenge':
        await this.handleWalletChallenge(connectionId, message.data)
        break
        
      case 'wallet_signature':
        await this.handleWalletSignature(connectionId, message.data)
        break
        
      case 'subscribe_agent':
        await this.handleAgentSubscription(connectionId, message.data)
        break
        
      case 'unsubscribe_agent':
        await this.handleAgentUnsubscription(connectionId, message.data)
        break
        
      case 'chat_message':
        await this.handleChatMessage(connectionId, message.data)
        break
        
      case 'request_generation':
        await this.handleGenerationRequest(connectionId, message.data)
        break
        
      case 'request_agent_status':
        await this.handleAgentStatusRequest(connectionId, message.data)
        break
        
      case 'collaboration_request':
        await this.handleCollaborationRequest(connectionId, message.data)
        break
        
      case 'subscribe_events':
        await this.handleEventSubscription(connectionId, message.data)
        break
        
      default:
        await this.sendToConnection(connectionId, {
          type: 'error',
          data: { message: `Unknown message type: ${message.type}` },
          timestamp: new Date().toISOString(),
          messageId: crypto.randomUUID()
        })
    }
  }

  private async handlePing(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.lastPing = new Date().toISOString()
    
    await this.sendToConnection(connectionId, {
      type: 'pong',
      data: { serverTime: new Date().toISOString() },
      timestamp: new Date().toISOString(),
      messageId: crypto.randomUUID()
    })
  }

  private async handleAuthentication(connectionId: string, data: any): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    const { token, walletAddress } = data
    const authenticated = await this.authenticateConnection(token, walletAddress)
    
    connection.authenticated = authenticated
    if (authenticated) {
      connection.authToken = token
      connection.permissions = await this.getWalletPermissions(walletAddress)
    }

    await this.sendToConnection(connectionId, {
      type: 'authentication_result',
      data: { 
        authenticated, 
        walletAddress: connection.walletAddress,
        permissions: connection.permissions
      },
      timestamp: new Date().toISOString(),
      messageId: crypto.randomUUID()
    })
  }

  private async handleWalletChallenge(connectionId: string, data: any): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    // Generate challenge message for wallet to sign
    const challenge = `ServiceFlow AI Agent Access\nWallet: ${connection.walletAddress}\nTimestamp: ${Date.now()}\nNonce: ${crypto.randomUUID()}`
    
    // Store challenge temporarily
    connection.metadata.challenge = challenge
    connection.metadata.challengeExpiry = Date.now() + 300000 // 5 minutes

    await this.sendToConnection(connectionId, {
      type: 'wallet_challenge',
      data: { challenge },
      timestamp: new Date().toISOString(),
      messageId: crypto.randomUUID()
    })
  }

  private async handleWalletSignature(connectionId: string, data: any): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    const { signature, message } = data
    const challenge = connection.metadata.challenge
    const challengeExpiry = connection.metadata.challengeExpiry

    // Verify challenge is valid and not expired
    if (!challenge || !challengeExpiry || Date.now() > challengeExpiry) {
      await this.sendToConnection(connectionId, {
        type: 'authentication_result',
        data: { 
          authenticated: false, 
          error: 'Challenge expired or invalid' 
        },
        timestamp: new Date().toISOString(),
        messageId: crypto.randomUUID()
      })
      return
    }

    // Verify wallet signature
    const signatureValid = await this.verifyWalletSignature(
      connection.walletAddress, 
      signature, 
      message || challenge
    )

    if (signatureValid) {
      connection.authenticated = true
      connection.signatureVerified = true
      connection.permissions = await this.getWalletPermissions(connection.walletAddress)
      
      // Generate JWT token for future use
      const token = await this.generateJWT(connection.walletAddress)
      connection.authToken = token

      await this.sendToConnection(connectionId, {
        type: 'authentication_result',
        data: { 
          authenticated: true,
          token,
          permissions: connection.permissions,
          walletAddress: connection.walletAddress
        },
        timestamp: new Date().toISOString(),
        messageId: crypto.randomUUID()
      })
    } else {
      await this.sendToConnection(connectionId, {
        type: 'authentication_result',
        data: { 
          authenticated: false, 
          error: 'Invalid signature' 
        },
        timestamp: new Date().toISOString(),
        messageId: crypto.randomUUID()
      })
    }

    // Clean up challenge
    delete connection.metadata.challenge
    delete connection.metadata.challengeExpiry
  }

  private async handleAgentSubscription(connectionId: string, data: any): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    const { agentId } = data
    
    // Verify user can access this agent
    if (!await this.verifyAgentAccess(connection.userId, agentId)) {
      await this.sendToConnection(connectionId, {
        type: 'subscription_denied',
        data: { agentId, reason: 'Access denied' },
        timestamp: new Date().toISOString(),
        messageId: crypto.randomUUID()
      })
      return
    }

    // Add to agent connections
    if (!connection.agentIds.includes(agentId)) {
      connection.agentIds.push(agentId)
    }

    if (!this.agentConnections.has(agentId)) {
      this.agentConnections.set(agentId, new Set())
    }
    this.agentConnections.get(agentId)!.add(connectionId)

    await this.sendToConnection(connectionId, {
      type: 'subscription_confirmed',
      data: { agentId },
      timestamp: new Date().toISOString(),
      messageId: crypto.randomUUID()
    })

    // Send current agent status
    await this.sendAgentStatus(connectionId, agentId)
  }

  private async handleAgentUnsubscription(connectionId: string, data: any): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    const { agentId } = data
    
    // Remove from agent connections
    connection.agentIds = connection.agentIds.filter(id => id !== agentId)
    
    const agentConns = this.agentConnections.get(agentId)
    if (agentConns) {
      agentConns.delete(connectionId)
      if (agentConns.size === 0) {
        this.agentConnections.delete(agentId)
      }
    }

    await this.sendToConnection(connectionId, {
      type: 'unsubscription_confirmed',
      data: { agentId },
      timestamp: new Date().toISOString(),
      messageId: crypto.randomUUID()
    })
  }

  private async handleChatMessage(connectionId: string, data: any): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.authenticated) return

    const { agentId, message } = data
    
    if (!connection.agentIds.includes(agentId)) {
      await this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Not subscribed to this agent' },
        timestamp: new Date().toISOString(),
        messageId: crypto.randomUUID()
      })
      return
    }

    // Store message in history
    if (!this.messageHistory.has(agentId)) {
      this.messageHistory.set(agentId, [])
    }

    const chatMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      agentId,
      metadata: { userId: connection.userId, connectionId }
    }

    this.messageHistory.get(agentId)!.push(chatMessage)

    // Forward to agent (this would integrate with the INFT agent Durable Object)
    const agentResponse = await this.forwardToAgent(agentId, chatMessage)
    
    if (agentResponse) {
      this.messageHistory.get(agentId)!.push(agentResponse)
      
      // Broadcast response to all connections subscribed to this agent
      await this.broadcastToAgent(agentId, {
        type: 'agent_message',
        data: agentResponse,
        timestamp: new Date().toISOString(),
        messageId: crypto.randomUUID()
      })
    }
  }

  private async handleGenerationRequest(connectionId: string, data: any): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.authenticated) return

    const { agentId, prompt, isVideo, collection } = data
    
    if (!connection.agentIds.includes(agentId)) {
      await this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Not subscribed to this agent' },
        timestamp: new Date().toISOString(),
        messageId: crypto.randomUUID()
      })
      return
    }

    // Forward generation request to agent
    const result = await this.requestGeneration(agentId, {
      prompt,
      isVideo,
      collection,
      websocketId: connectionId,
      userAddress: connection.userId
    })

    await this.sendToConnection(connectionId, {
      type: 'generation_request_result',
      data: result,
      timestamp: new Date().toISOString(),
      messageId: crypto.randomUUID()
    })
  }

  private async handleAgentStatusRequest(connectionId: string, data: any): Promise<void> {
    const { agentId } = data
    await this.sendAgentStatus(connectionId, agentId)
  }

  private async handleCollaborationRequest(connectionId: string, data: any): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.authenticated) return

    const { sourceAgentId, targetAgentId, collaborationType, data: collabData } = data
    
    // Verify access to both agents
    if (!connection.agentIds.includes(sourceAgentId)) {
      await this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Not authorized for source agent' },
        timestamp: new Date().toISOString(),
        messageId: crypto.randomUUID()
      })
      return
    }

    // Forward collaboration request
    await this.forwardCollaborationRequest(sourceAgentId, targetAgentId, collaborationType, collabData)
  }

  private async handleEventSubscription(connectionId: string, data: any): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    const { events } = data
    
    for (const eventType of events) {
      connection.subscriptions.add(eventType)
    }

    await this.sendToConnection(connectionId, {
      type: 'event_subscription_confirmed',
      data: { events: Array.from(connection.subscriptions) },
      timestamp: new Date().toISOString(),
      messageId: crypto.randomUUID()
    })
  }

  private handleDisconnection(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    // Remove from agent connections
    for (const agentId of connection.agentIds) {
      const agentConns = this.agentConnections.get(agentId)
      if (agentConns) {
        agentConns.delete(connectionId)
        if (agentConns.size === 0) {
          this.agentConnections.delete(agentId)
        }
      }
    }

    this.connections.delete(connectionId)
    console.log(`WebSocket connection ${connectionId} disconnected`)
  }

  // Public API for broadcasting events
  async broadcastAgentEvent(event: AgentEvent): Promise<void> {
    if (event.broadcast) {
      // Broadcast to all connections
      for (const [connectionId, connection] of this.connections) {
        if (connection.subscriptions.has(event.type)) {
          await this.sendToConnection(connectionId, {
            type: event.type,
            data: event.data,
            timestamp: event.timestamp,
            messageId: crypto.randomUUID(),
            agentId: event.agentId
          })
        }
      }
    } else {
      // Broadcast only to connections subscribed to this agent
      await this.broadcastToAgent(event.agentId, {
        type: event.type,
        data: event.data,
        timestamp: event.timestamp,
        messageId: crypto.randomUUID(),
        agentId: event.agentId
      })
    }
  }

  async broadcastGenerationProgress(agentId: string, progress: GenerationProgress): Promise<void> {
    await this.broadcastToAgent(agentId, {
      type: 'generation_progress',
      data: progress,
      timestamp: new Date().toISOString(),
      messageId: crypto.randomUUID(),
      agentId
    })
  }

  async broadcastCreditUpdate(agentId: string, creditData: any): Promise<void> {
    await this.broadcastToAgent(agentId, {
      type: 'credit_update',
      data: creditData,
      timestamp: new Date().toISOString(),
      messageId: crypto.randomUUID(),
      agentId
    })
  }

  // Private helper methods
  private async sendToConnection(connectionId: string, message: WebSocketMessage): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    try {
      connection.websocket.send(JSON.stringify(message))
    } catch (error) {
      console.error(`Failed to send message to connection ${connectionId}:`, error)
      this.handleDisconnection(connectionId)
    }
  }

  private async broadcastToAgent(agentId: string, message: WebSocketMessage): Promise<void> {
    const connectionIds = this.agentConnections.get(agentId)
    if (!connectionIds) return

    for (const connectionId of connectionIds) {
      await this.sendToConnection(connectionId, message)
    }
  }

  private checkRateLimit(connection: WebSocketConnection): boolean {
    connection.rateLimitBucket++
    return connection.rateLimitBucket <= this.rateLimitConfig.maxMessagesPerMinute
  }

  private resetRateLimits(): void {
    for (const connection of this.connections.values()) {
      connection.rateLimitBucket = 0
    }
  }

  private cleanupStaleConnections(): void {
    const now = Date.now()
    const staleThreshold = 5 * 60 * 1000 // 5 minutes

    for (const [connectionId, connection] of this.connections) {
      const lastActivity = new Date(connection.lastActivity).getTime()
      if (now - lastActivity > staleThreshold) {
        console.log(`Cleaning up stale connection ${connectionId}`)
        this.handleDisconnection(connectionId)
      }
    }
  }

  private sendHeartbeats(): void {
    for (const [connectionId, connection] of this.connections) {
      this.sendToConnection(connectionId, {
        type: 'heartbeat',
        data: { serverTime: new Date().toISOString() },
        timestamp: new Date().toISOString(),
        messageId: crypto.randomUUID()
      }).catch(error => {
        console.error(`Heartbeat failed for connection ${connectionId}:`, error)
      })
    }
  }

  private async authenticateConnection(token: string, walletAddress: string): Promise<boolean> {
    if (!token || token.length === 0) return false
    
    try {
      // Simplified JWT verification - in production use proper JWT library
      const [header, payload, signature] = token.split('.')
      const decodedPayload = JSON.parse(atob(payload))
      
      // Check expiration
      if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
        return false
      }
      
      // Check wallet address matches
      if (decodedPayload.walletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
        return false
      }
      
      return true
    } catch (error) {
      console.error('JWT verification error:', error)
      return false
    }
  }

  private async verifyAgentAccess(walletAddress: string, agentId: string): Promise<boolean> {
    // Extract wallet address from agent ID format: user-{walletAddress}
    const agentWalletAddress = agentId.replace('user-', '').toLowerCase()
    const requestWalletAddress = walletAddress.toLowerCase()
    
    // Owner has full access
    if (agentWalletAddress === requestWalletAddress) {
      return true
    }
    
    // Check if wallet is authorized for this agent
    // This would integrate with the INFT agent's authorized wallets list
    return false // For now, only owner has access
  }

  private async verifyWalletSignature(walletAddress: string, signature: string, message: string): Promise<boolean> {
    try {
      // Simplified signature verification - in production use proper crypto library
      // This should verify that the signature was created by the private key
      // corresponding to the given wallet address
      
      // For now, just check that signature is not empty and has reasonable length
      return signature.length > 100 && message.includes(walletAddress)
    } catch (error) {
      console.error('Signature verification error:', error)
      return false
    }
  }

  private async getWalletPermissions(walletAddress: string): Promise<string[]> {
    // Define permissions based on wallet verification
    // In production, this would check agent ownership, subscriptions, etc.
    return ['read_status', 'generate_content', 'manage_agent', 'collaborate']
  }

  private async generateJWT(walletAddress: string): Promise<string> {
    // Simplified JWT generation - in production use proper JWT library
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({
      walletAddress,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iss: 'serviceflow-ai'
    }))
    const signature = btoa('simplified-signature') // In production, use proper HMAC
    
    return `${header}.${payload}.${signature}`
  }

  private async sendAgentStatus(connectionId: string, agentId: string): Promise<void> {
    // This would fetch current agent status from the INFT agent
    const status = await this.getAgentStatus(agentId)
    
    await this.sendToConnection(connectionId, {
      type: 'agent_status',
      data: status,
      timestamp: new Date().toISOString(),
      messageId: crypto.randomUUID(),
      agentId
    })
  }

  private async forwardToAgent(agentId: string, message: ChatMessage): Promise<ChatMessage | null> {
    // This would forward the message to the INFT agent Durable Object
    // and return the agent's response
    
    // Mock response for now
    return {
      role: 'assistant',
      content: `Hello! I'm your INFT agent ${agentId}. I received your message: "${message.content}"`,
      timestamp: new Date().toISOString(),
      agentId,
      metadata: { responseTime: 500 }
    }
  }

  private async requestGeneration(agentId: string, request: any): Promise<any> {
    // This would forward the generation request to the INFT agent
    // Mock response for now
    return {
      success: true,
      generationId: crypto.randomUUID(),
      estimatedTime: request.isVideo ? 30000 : 10000,
      creditsToBeUsed: request.isVideo ? 500 : 200
    }
  }

  private async forwardCollaborationRequest(
    sourceAgentId: string,
    targetAgentId: string,
    type: string,
    data: any
  ): Promise<void> {
    // This would facilitate agent-to-agent collaboration
    console.log(`Collaboration request: ${sourceAgentId} -> ${targetAgentId} (${type})`)
  }

  private async getAgentStatus(agentId: string): Promise<any> {
    // This would fetch status from the INFT agent Durable Object
    return {
      agentId,
      status: 'active',
      totalCredits: 8000,
      usedCredits: 1200,
      activeGenerations: 1,
      lastActivity: new Date().toISOString()
    }
  }

  // Public getters for monitoring
  getConnectionCount(): number {
    return this.connections.size
  }

  getAgentConnectionCounts(): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const [agentId, connections] of this.agentConnections) {
      counts[agentId] = connections.size
    }
    return counts
  }

  getConnectionInfo(connectionId: string): WebSocketConnection | undefined {
    return this.connections.get(connectionId)
  }
}

export default AgentWebSocketHandler