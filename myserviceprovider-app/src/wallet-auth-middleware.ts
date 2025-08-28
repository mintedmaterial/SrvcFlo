/**
 * Wallet Authentication Middleware for ERC-7857 INFT System
 * 
 * Provides JWT token generation and verification for wallet-based authentication
 * Each wallet address represents a unique user in the system
 * 
 * Features:
 * - Wallet signature verification
 * - JWT token generation and validation
 * - Session management in D1 database
 * - Rate limiting per wallet address
 * - Agent ownership verification
 */

export interface WalletAuthResult {
  success: boolean
  walletAddress?: string
  permissions?: string[]
  error?: string
  sessionId?: string
}

export interface WalletSession {
  sessionId: string
  walletAddress: string
  createdAt: string
  lastActivity: string
  expiresAt: string
  permissions: string[]
  agentIds: string[]
  metadata: Record<string, any>
}

export interface JWTPayload {
  walletAddress: string
  sessionId: string
  permissions: string[]
  iat: number
  exp: number
  iss: string
}

export interface SignatureVerificationRequest {
  walletAddress: string
  signature: string
  message: string
  timestamp: number
}

export class WalletAuthMiddleware {
  private jwtSecret: string
  private sessionCache: Map<string, WalletSession> = new Map()
  private rateLimitCache: Map<string, { count: number; resetTime: number }> = new Map()
  
  constructor(
    private env: Env,
    jwtSecret?: string
  ) {
    this.jwtSecret = jwtSecret || 'serviceflow-jwt-secret-' + env.CLOUDFLARE_ACCOUNT_ID
  }

  /**
   * Verify wallet authentication from request headers
   */
  async verifyRequest(request: Request): Promise<WalletAuthResult> {
    const walletAddress = request.headers.get('X-Wallet-Address')
    const signature = request.headers.get('X-Wallet-Signature')
    const authHeader = request.headers.get('Authorization')
    const timestamp = request.headers.get('X-Timestamp')

    if (!walletAddress) {
      return { success: false, error: 'Wallet address required' }
    }

    // Check rate limiting
    if (!this.checkRateLimit(walletAddress)) {
      return { success: false, error: 'Rate limit exceeded' }
    }

    // Try JWT authentication first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      return await this.verifyJWT(token, walletAddress)
    }

    // Try signature authentication
    if (signature && timestamp) {
      const timestampNum = parseInt(timestamp)
      
      // Verify timestamp is recent (within 5 minutes)
      if (Math.abs(Date.now() - timestampNum) > 300000) {
        return { success: false, error: 'Request timestamp too old' }
      }

      const message = this.generateAuthMessage(walletAddress, timestampNum)
      const isValid = await this.verifyWalletSignature(walletAddress, signature, message)
      
      if (isValid) {
        // Create new session
        const session = await this.createSession(walletAddress)
        const token = await this.generateJWT(session)
        
        return {
          success: true,
          walletAddress,
          permissions: session.permissions,
          sessionId: session.sessionId
        }
      } else {
        return { success: false, error: 'Invalid wallet signature' }
      }
    }

    return { success: false, error: 'Authentication required' }
  }

  /**
   * Generate authentication message for wallet to sign
   */
  generateAuthMessage(walletAddress: string, timestamp: number): string {
    return `ServiceFlow AI Authentication
Wallet: ${walletAddress}
Timestamp: ${timestamp}
Domain: srvcflo.com
Nonce: ${this.generateNonce()}`
  }

  /**
   * Verify wallet signature (simplified - use proper crypto library in production)
   */
  async verifyWalletSignature(walletAddress: string, signature: string, message: string): Promise<boolean> {
    try {
      // This is a simplified implementation
      // In production, use ethers.js or similar to verify ECDSA signature
      
      // Basic validation
      if (!signature || signature.length < 130) {
        return false
      }

      // Check signature format (0x prefix + 130 hex characters for ECDSA)
      if (!signature.startsWith('0x') || signature.length !== 132) {
        return false
      }

      // For now, return true if signature has correct format
      // In production, recover address from signature and compare with walletAddress
      return true
    } catch (error) {
      console.error('Signature verification error:', error)
      return false
    }
  }

  /**
   * Generate JWT token for authenticated wallet
   */
  async generateJWT(session: WalletSession): Promise<string> {
    const payload: JWTPayload = {
      walletAddress: session.walletAddress,
      sessionId: session.sessionId,
      permissions: session.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(new Date(session.expiresAt).getTime() / 1000),
      iss: 'serviceflow-ai'
    }

    // Simple JWT generation (use proper library in production)
    const header = this.base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload))
    
    const signature = await this.signJWT(`${header}.${encodedPayload}`)
    
    return `${header}.${encodedPayload}.${signature}`
  }

  /**
   * Verify JWT token
   */
  async verifyJWT(token: string, expectedWalletAddress?: string): Promise<WalletAuthResult> {
    try {
      const [headerB64, payloadB64, signatureB64] = token.split('.')
      
      if (!headerB64 || !payloadB64 || !signatureB64) {
        return { success: false, error: 'Invalid token format' }
      }

      // Verify signature
      const expectedSignature = await this.signJWT(`${headerB64}.${payloadB64}`)
      if (expectedSignature !== signatureB64) {
        return { success: false, error: 'Invalid token signature' }
      }

      const payload: JWTPayload = JSON.parse(this.base64UrlDecode(payloadB64))

      // Check expiration
      if (payload.exp < Date.now() / 1000) {
        return { success: false, error: 'Token expired' }
      }

      // Check wallet address if provided
      if (expectedWalletAddress && payload.walletAddress.toLowerCase() !== expectedWalletAddress.toLowerCase()) {
        return { success: false, error: 'Token wallet mismatch' }
      }

      // Verify session still exists
      const session = await this.getSession(payload.sessionId)
      if (!session) {
        return { success: false, error: 'Session not found' }
      }

      // Update last activity
      await this.updateSessionActivity(payload.sessionId)

      return {
        success: true,
        walletAddress: payload.walletAddress,
        permissions: payload.permissions,
        sessionId: payload.sessionId
      }
    } catch (error) {
      console.error('JWT verification error:', error)
      return { success: false, error: 'Token verification failed' }
    }
  }

  /**
   * Create new session for wallet
   */
  async createSession(walletAddress: string): Promise<WalletSession> {
    const sessionId = crypto.randomUUID()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours

    const session: WalletSession = {
      sessionId,
      walletAddress: walletAddress.toLowerCase(),
      createdAt: now.toISOString(),
      lastActivity: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      permissions: await this.getWalletPermissions(walletAddress),
      agentIds: await this.getWalletAgentIds(walletAddress),
      metadata: {}
    }

    // Store in cache
    this.sessionCache.set(sessionId, session)

    // Store in D1 database
    await this.saveSessionToDatabase(session)

    return session
  }

  /**
   * Get session from cache or database
   */
  async getSession(sessionId: string): Promise<WalletSession | null> {
    // Check cache first
    if (this.sessionCache.has(sessionId)) {
      return this.sessionCache.get(sessionId)!
    }

    // Load from database
    try {
      const result = await this.env.DB.prepare(
        'SELECT * FROM wallet_sessions WHERE session_id = ?'
      ).bind(sessionId).first()

      if (result) {
        const session: WalletSession = {
          sessionId: result.session_id,
          walletAddress: result.wallet_address,
          createdAt: result.created_at,
          lastActivity: result.last_activity,
          expiresAt: result.expires_at,
          permissions: JSON.parse(result.permissions),
          agentIds: JSON.parse(result.agent_ids),
          metadata: JSON.parse(result.metadata || '{}')
        }

        // Cache it
        this.sessionCache.set(sessionId, session)
        return session
      }
    } catch (error) {
      console.error('Database session lookup error:', error)
    }

    return null
  }

  /**
   * Update session last activity
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = this.sessionCache.get(sessionId)
    if (session) {
      session.lastActivity = new Date().toISOString()
      
      // Update database
      try {
        await this.env.DB.prepare(
          'UPDATE wallet_sessions SET last_activity = ? WHERE session_id = ?'
        ).bind(session.lastActivity, sessionId).run()
      } catch (error) {
        console.error('Session activity update error:', error)
      }
    }
  }

  /**
   * Get permissions for wallet address
   */
  async getWalletPermissions(walletAddress: string): Promise<string[]> {
    // Base permissions for all authenticated wallets
    const basePermissions = ['read_status', 'generate_content']
    
    // Check if wallet owns any agents
    const agentIds = await this.getWalletAgentIds(walletAddress)
    if (agentIds.length > 0) {
      basePermissions.push('manage_agent', 'collaborate', 'transfer_agent')
    }

    return basePermissions
  }

  /**
   * Get agent IDs owned by wallet
   */
  async getWalletAgentIds(walletAddress: string): Promise<string[]> {
    // Return agent ID in the format user-{walletAddress}
    return [`user-${walletAddress.toLowerCase()}`]
  }

  /**
   * Save session to D1 database
   */
  async saveSessionToDatabase(session: WalletSession): Promise<void> {
    try {
      await this.env.DB.prepare(`
        INSERT OR REPLACE INTO wallet_sessions 
        (session_id, wallet_address, created_at, last_activity, expires_at, permissions, agent_ids, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        session.sessionId,
        session.walletAddress,
        session.createdAt,
        session.lastActivity,
        session.expiresAt,
        JSON.stringify(session.permissions),
        JSON.stringify(session.agentIds),
        JSON.stringify(session.metadata)
      ).run()
    } catch (error) {
      console.error('Session save error:', error)
    }
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(walletAddress: string): boolean {
    const now = Date.now()
    const key = walletAddress.toLowerCase()
    const limit = this.rateLimitCache.get(key)

    if (!limit || now > limit.resetTime) {
      // Reset or create new limit
      this.rateLimitCache.set(key, {
        count: 1,
        resetTime: now + 60000 // 1 minute window
      })
      return true
    }

    if (limit.count >= 100) { // 100 requests per minute
      return false
    }

    limit.count++
    return true
  }

  /**
   * Generate random nonce
   */
  private generateNonce(): string {
    return crypto.randomUUID().replace(/-/g, '')
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(str: string): string {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  /**
   * Base64 URL decode
   */
  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/')
    while (str.length % 4) {
      str += '='
    }
    return atob(str)
  }

  /**
   * Sign JWT using HMAC
   */
  private async signJWT(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
    return this.base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)))
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date().toISOString()
    
    // Clean cache
    for (const [sessionId, session] of this.sessionCache) {
      if (session.expiresAt < now) {
        this.sessionCache.delete(sessionId)
      }
    }

    // Clean database
    try {
      await this.env.DB.prepare(
        'DELETE FROM wallet_sessions WHERE expires_at < ?'
      ).bind(now).run()
    } catch (error) {
      console.error('Session cleanup error:', error)
    }
  }

  /**
   * Initialize database tables
   */
  async initializeDatabase(): Promise<void> {
    try {
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS wallet_sessions (
          session_id TEXT PRIMARY KEY,
          wallet_address TEXT NOT NULL,
          created_at TEXT NOT NULL,
          last_activity TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          permissions TEXT NOT NULL,
          agent_ids TEXT NOT NULL,
          metadata TEXT DEFAULT '{}'
        )
      `).run()

      await this.env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_wallet_sessions_address 
        ON wallet_sessions(wallet_address)
      `).run()

      await this.env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_wallet_sessions_expires 
        ON wallet_sessions(expires_at)
      `).run()
    } catch (error) {
      console.error('Database initialization error:', error)
    }
  }
}

export default WalletAuthMiddleware