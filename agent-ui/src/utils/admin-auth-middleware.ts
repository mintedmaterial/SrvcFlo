/**
 * Admin Authentication Middleware for ServiceFlow AI Agent UI
 * Verifies admin access based on Bandit Kidz NFT ownership
 */

import React, { useState, useCallback, useEffect } from 'react'
import { createPublicClient, http } from 'viem'
import { sonic } from 'viem/chains'

// Bandit Kidz NFT Contract
const BANDIT_KIDZ_CONTRACT = '0x45bC8A938E487FdE4F31A7E051c2b63627F6f966'
const ADMIN_TOKEN_IDS = [143, 1, 2, 3, 4, 5]

// Sonic network client
const sonicClient = createPublicClient({
  chain: sonic,
  transport: http(process.env.NEXT_PUBLIC_DRPC_HTTP_URL || 'https://lb.drpc.org/sonic/Av0tqtt4908GitCEzvNhURHIfJgThf0R8Id1qhnKxixj')
})

// ERC-721 ABI for ownerOf function
const ERC721_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export interface AdminVerificationResult {
  isAdmin: boolean
  isHolder: boolean
  adminTokenId?: number
  ownedAdminTokens: number[]
  walletAddress: string
  verifiedAt: Date
  error?: string
}

/**
 * Verify if a wallet address owns any admin tokens
 */
export async function verifyAdminStatus(walletAddress: string): Promise<AdminVerificationResult> {
  const result: AdminVerificationResult = {
    isAdmin: false,
    isHolder: false,
    ownedAdminTokens: [],
    walletAddress: walletAddress.toLowerCase(),
    verifiedAt: new Date()
  }

  try {
    // Check each admin token ID
    for (const tokenId of ADMIN_TOKEN_IDS) {
      try {
        const owner = await sonicClient.readContract({
          address: BANDIT_KIDZ_CONTRACT as `0x${string}`,
          abi: ERC721_ABI,
          functionName: 'ownerOf',
          args: [BigInt(tokenId)]
        })

        if (owner.toLowerCase() === walletAddress.toLowerCase()) {
          result.ownedAdminTokens.push(tokenId)
          if (!result.adminTokenId) {
            result.adminTokenId = tokenId
          }
        }
      } catch (tokenError) {
        console.warn(`Error checking token ${tokenId}:`, tokenError)
        // Continue checking other tokens
      }
    }

    result.isAdmin = result.ownedAdminTokens.length > 0
    result.isHolder = result.ownedAdminTokens.length > 0

    return result
  } catch (error) {
    console.error('Error verifying admin status:', error)
    result.error = error instanceof Error ? error.message : 'Unknown verification error'
    return result
  }
}

/**
 * Verify ownership of a specific token ID
 */
export async function verifyTokenOwnership(walletAddress: string, tokenId: number): Promise<boolean> {
  try {
    const owner = await sonicClient.readContract({
      address: BANDIT_KIDZ_CONTRACT as `0x${string}`,
      abi: ERC721_ABI,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)]
    })

    return owner.toLowerCase() === walletAddress.toLowerCase()
  } catch (error) {
    console.error(`Error verifying token ${tokenId} ownership:`, error)
    return false
  }
}

/**
 * Middleware function for Next.js API routes to verify admin access
 */
export function withAdminAuth(handler: any) {
  return async (req: any, res: any) => {
    const { walletAddress } = req.query || req.body || {}

    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Wallet address required for admin verification',
        code: 'WALLET_ADDRESS_REQUIRED'
      })
    }

    try {
      const verification = await verifyAdminStatus(walletAddress)
      
      if (!verification.isAdmin) {
        return res.status(403).json({ 
          error: 'Admin access required. Must own Bandit Kidz admin NFT.',
          code: 'ADMIN_ACCESS_REQUIRED',
          contract: BANDIT_KIDZ_CONTRACT,
          adminTokenIds: ADMIN_TOKEN_IDS
        })
      }

      // Add verification result to request for handler to use
      req.adminVerification = verification
      
      return handler(req, res)
    } catch (error) {
      console.error('Admin verification error:', error)
      return res.status(500).json({ 
        error: 'Admin verification failed',
        code: 'VERIFICATION_ERROR'
      })
    }
  }
}

/**
 * Hook for React components to verify admin access
 */
export function useAdminVerification(walletAddress: string | undefined) {
  const [verification, setVerification] = useState<AdminVerificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verifyAdmin = useCallback(async () => {
    if (!walletAddress) {
      setVerification(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await verifyAdminStatus(walletAddress)
      setVerification(result)
      
      if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed'
      setError(errorMessage)
      setVerification({
        isAdmin: false,
        isHolder: false,
        ownedAdminTokens: [],
        walletAddress: walletAddress.toLowerCase(),
        verifiedAt: new Date(),
        error: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    verifyAdmin()
  }, [verifyAdmin])

  return {
    verification,
    loading,
    error,
    refetch: verifyAdmin,
    isAdmin: verification?.isAdmin || false,
    isHolder: verification?.isHolder || false,
    adminTokenId: verification?.adminTokenId
  }
}

/**
 * Component wrapper that requires admin access
 */
export function withAdminAccess<T extends {}>(Component: React.ComponentType<T>) {
  return function AdminProtectedComponent(props: T & { walletAddress?: string }) {
    const { verification, loading, error, isAdmin } = useAdminVerification(props.walletAddress)

    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Verifying admin access...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-red-500">
            <h3 className="font-semibold">Verification Error</h3>
            <p>{error}</p>
          </div>
        </div>
      )
    }

    if (!isAdmin) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 text-center">
            <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
            <p className="mb-4">
              You must own a Bandit Kidz admin NFT to access ServiceFlow agents.
            </p>
            <div className="text-sm text-gray-600">
              <p><strong>Contract:</strong> {BANDIT_KIDZ_CONTRACT}</p>
              <p><strong>Admin Token IDs:</strong> {ADMIN_TOKEN_IDS.join(', ')}</p>
              {props.walletAddress && (
                <p><strong>Wallet:</strong> {props.walletAddress}</p>
              )}
            </div>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}

// Export constants for use in other parts of the application
export const ADMIN_CONFIG = {
  CONTRACT_ADDRESS: BANDIT_KIDZ_CONTRACT,
  ADMIN_TOKEN_IDS,
  NETWORK: 'Sonic',
  CHAIN_ID: 146
}