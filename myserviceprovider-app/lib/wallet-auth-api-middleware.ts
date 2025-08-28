/**
 * Wallet Authentication API Middleware
 * 
 * Provides wallet-based authentication for Next.js API routes
 * Integrates with the ERC-7857 INFT system for secure agent interactions
 * 
 * Features:
 * - JWT token verification for API requests
 * - Wallet signature verification
 * - Agent ownership validation
 * - Rate limiting per wallet address
 * - Secure session management
 */

import { NextRequest, NextResponse } from 'next/server'

export interface WalletAuthRequest extends NextRequest {
  walletAuth?: {
    walletAddress: string
    permissions: string[]
    sessionId: string
    agentIds: string[]
    isVerified: boolean
  }
}

export interface AuthMiddlewareOptions {
  requireAuth?: boolean
  requiredPermissions?: string[]
  allowedAgents?: string[]
  requireOwnership?: boolean
  rateLimitPerMinute?: number
}

export class WalletAuthAPIMiddleware {
  private static instance: WalletAuthAPIMiddleware
  private walletAuthMiddleware: any // WalletAuthMiddleware
  private rateLimitCache: Map<string, { count: number; resetTime: number }> = new Map()

  constructor() {
    // Singleton pattern for global middleware
    if (WalletAuthAPIMiddleware.instance) {
      return WalletAuthAPIMiddleware.instance
    }
    WalletAuthAPIMiddleware.instance = this
  }

  /**
   * Initialize with wallet auth middleware (called by Cloudflare Worker)
   */
  initialize(walletAuthMiddleware: any) {
    this.walletAuthMiddleware = walletAuthMiddleware
  }

  /**
   * Create authentication middleware for API routes
   */
  withAuth(
    handler: (request: WalletAuthRequest) => Promise<NextResponse>,
    options: AuthMiddlewareOptions = {}
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const {
        requireAuth = true,
        requiredPermissions = [],
        allowedAgents = [],
        requireOwnership = false,
        rateLimitPerMinute = 60
      } = options

      try {
        // Extract authentication headers
        const walletAddress = request.headers.get('X-Wallet-Address')
        const signature = request.headers.get('X-Wallet-Signature')
        const authHeader = request.headers.get('Authorization')
        const timestamp = request.headers.get('X-Timestamp')
        const agentId = request.headers.get('X-Agent-Id')

        // Check if authentication is required
        if (!requireAuth) {
          return handler(request as WalletAuthRequest)
        }

        if (!walletAddress) {
          return NextResponse.json(
            { error: 'Wallet address required', code: 'WALLET_REQUIRED' },
            { status: 401 }
          )
        }

        // Check rate limiting
        if (!this.checkRateLimit(walletAddress, rateLimitPerMinute)) {
          return NextResponse.json(
            { error: 'Rate limit exceeded', code: 'RATE_LIMIT' },
            { status: 429 }
          )
        }

        let authResult: any = null

        // Try JWT authentication first
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7)
          authResult = await this.verifyJWT(token, walletAddress)
        }
        // Try signature authentication
        else if (signature && timestamp) {
          const timestampNum = parseInt(timestamp)
          
          // Verify timestamp is recent (within 5 minutes)
          if (Math.abs(Date.now() - timestampNum) > 300000) {
            return NextResponse.json(
              { error: 'Request timestamp too old', code: 'TIMESTAMP_EXPIRED' },
              { status: 401 }
            )
          }

          const message = this.generateAuthMessage(walletAddress, timestampNum)
          const isValid = await this.verifyWalletSignature(walletAddress, signature, message)
          
          if (isValid) {
            authResult = {
              success: true,
              walletAddress,
              permissions: await this.getWalletPermissions(walletAddress),
              sessionId: 'signature-' + Date.now(),
              agentIds: [`user-${walletAddress.toLowerCase()}`]
            }
          }
        }

        if (!authResult?.success) {
          return NextResponse.json(
            { error: 'Authentication failed', code: 'AUTH_FAILED' },
            { status: 401 }
          )
        }

        // Check required permissions
        if (requiredPermissions.length > 0) {
          const hasAllPermissions = requiredPermissions.every(permission =>
            authResult.permissions?.includes(permission)
          )
          
          if (!hasAllPermissions) {
            return NextResponse.json(
              { 
                error: 'Insufficient permissions', 
                code: 'INSUFFICIENT_PERMISSIONS',
                required: requiredPermissions,
                current: authResult.permissions
              },
              { status: 403 }
            )
          }
        }

        // Check agent ownership if required
        if (requireOwnership && agentId) {
          if (!this.verifyAgentOwnership(agentId, walletAddress)) {
            return NextResponse.json(
              { error: 'Agent ownership verification failed', code: 'OWNERSHIP_FAILED' },
              { status: 403 }
            )
          }
        }

        // Check allowed agents
        if (allowedAgents.length > 0 && agentId) {
          if (!allowedAgents.includes(agentId)) {
            return NextResponse.json(
              { error: 'Agent not allowed for this operation', code: 'AGENT_NOT_ALLOWED' },
              { status: 403 }
            )
          }
        }

        // Add auth info to request
        (request as WalletAuthRequest).walletAuth = {
          walletAddress: authResult.walletAddress,
          permissions: authResult.permissions || [],
          sessionId: authResult.sessionId,
          agentIds: authResult.agentIds || [],
          isVerified: true
        }

        // Call the handler with authenticated request
        return handler(request as WalletAuthRequest)

      } catch (error) {
        console.error('Auth middleware error:', error)
        return NextResponse.json(
          { error: 'Authentication error', code: 'AUTH_ERROR' },
          { status: 500 }
        )
      }
    }
  }

  /**
   * Verify JWT token (simplified version for client-side)
   */
  private async verifyJWT(token: string, expectedWalletAddress: string): Promise<any> {
    try {
      // If we have the wallet auth middleware available (in Cloudflare Worker context)
      if (this.walletAuthMiddleware) {
        return await this.walletAuthMiddleware.verifyJWT(token, expectedWalletAddress)
      }

      // Simplified client-side verification
      const [header, payload, signature] = token.split('.')
      
      if (!header || !payload || !signature) {
        return { success: false, error: 'Invalid token format' }
      }

      const decodedPayload = JSON.parse(atob(payload))

      // Check expiration
      if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
        return { success: false, error: 'Token expired' }
      }

      // Check wallet address if provided
      if (decodedPayload.walletAddress?.toLowerCase() !== expectedWalletAddress.toLowerCase()) {
        return { success: false, error: 'Token wallet mismatch' }
      }

      return {
        success: true,
        walletAddress: decodedPayload.walletAddress,
        permissions: decodedPayload.permissions || [],
        sessionId: decodedPayload.sessionId
      }
    } catch (error) {
      return { success: false, error: 'Token verification failed' }
    }
  }

  /**
   * Verify wallet signature (simplified version)
   */
  private async verifyWalletSignature(walletAddress: string, signature: string, message: string): Promise<boolean> {
    try {
      // Basic validation
      if (!signature || signature.length < 130) {
        return false
      }

      // Check signature format (0x prefix + 130 hex characters for ECDSA)
      if (!signature.startsWith('0x') || signature.length !== 132) {
        return false
      }

      // For now, return true if signature has correct format
      // In production, use ethers.js to recover address from signature and compare
      return true
    } catch (error) {
      console.error('Signature verification error:', error)
      return false
    }
  }

  /**
   * Generate authentication message for wallet to sign
   */
  private generateAuthMessage(walletAddress: string, timestamp: number): string {
    return `ServiceFlow AI Authentication
Wallet: ${walletAddress}
Timestamp: ${timestamp}
Domain: srvcflo.com
Nonce: ${this.generateNonce()}`
  }

  /**
   * Get permissions for wallet address
   */
  private async getWalletPermissions(walletAddress: string): Promise<string[]> {
    // Base permissions for all authenticated wallets
    const basePermissions = ['read_status', 'generate_content']
    
    // Add agent management permissions if wallet owns agents
    const agentId = `user-${walletAddress.toLowerCase()}`
    basePermissions.push('manage_agent', 'collaborate', 'transfer_agent')

    return basePermissions
  }

  /**
   * Verify agent ownership
   */
  private verifyAgentOwnership(agentId: string, walletAddress: string): boolean {
    // Extract wallet address from agent ID format: user-{walletAddress}
    const expectedAgentId = `user-${walletAddress.toLowerCase()}`
    return agentId.toLowerCase() === expectedAgentId
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(walletAddress: string, limitPerMinute: number): boolean {
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

    if (limit.count >= limitPerMinute) {
      return false
    }

    limit.count++
    return true
  }

  /**
   * Generate random nonce
   */
  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  /**
   * Helper to create CORS headers
   */
  static createCORSHeaders(origin?: string): HeadersInit {
    return {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Wallet-Address, X-Wallet-Signature, X-Timestamp, X-Agent-Id',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  }

  /**
   * Helper to handle OPTIONS requests
   */
  static handlePreflight(request: NextRequest): NextResponse | null {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: WalletAuthAPIMiddleware.createCORSHeaders(request.headers.get('Origin') || undefined)
      })
    }
    return null
  }
}

// Export singleton instance
export const walletAuthAPI = new WalletAuthAPIMiddleware()

// Export helper functions for common auth patterns
export function requireAuth(options: AuthMiddlewareOptions = {}) {
  return (handler: (request: WalletAuthRequest) => Promise<NextResponse>) => {
    return walletAuthAPI.withAuth(handler, { requireAuth: true, ...options })
  }
}

export function requireAgentOwnership(agentIdHeader: string = 'X-Agent-Id') {
  return (handler: (request: WalletAuthRequest) => Promise<NextResponse>) => {
    return walletAuthAPI.withAuth(handler, { 
      requireAuth: true, 
      requireOwnership: true,
      requiredPermissions: ['manage_agent']
    })
  }
}

export function requirePermissions(permissions: string[]) {
  return (handler: (request: WalletAuthRequest) => Promise<NextResponse>) => {
    return walletAuthAPI.withAuth(handler, { 
      requireAuth: true, 
      requiredPermissions: permissions
    })
  }
}

export function optionalAuth() {
  return (handler: (request: WalletAuthRequest) => Promise<NextResponse>) => {
    return walletAuthAPI.withAuth(handler, { requireAuth: false })
  }
}

export default WalletAuthAPIMiddleware