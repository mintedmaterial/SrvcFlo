/**
 * NFT Verification Utilities
 * Verifies Bandit Kidz NFT ownership for admin access
 */

import { createPublicClient, http, getContract } from 'viem';
import { sonicMainnet, sonicTestnet } from '../lib/wagmi-config';

// Bandit Kidz NFT Contract
const BANDIT_KIDZ_CONTRACT = '0x45bC8A938E487FdE4F31A7E051c2b63627F6f966';

// Admin token IDs for team member verification
const ADMIN_TOKEN_IDS = [
  143, // Your token ID
  // Add other admin token IDs here
  1, 2, 3, 4, 5, // Example additional admin IDs
];

// ERC-721 ABI for NFT verification
const ERC721_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' }
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface NFTVerificationResult {
  isAdmin: boolean;
  isHolder: boolean;
  adminTokenId?: number;
  ownedTokens?: number[];
  error?: string;
}

export class NFTVerificationService {
  private client: any;
  private contract: any;
  
  constructor(chainId: number = 146) {
    const chain = chainId === 146 ? sonicMainnet : sonicTestnet;
    
    this.client = createPublicClient({
      chain,
      transport: http(process.env.NEXT_PUBLIC_DRPC_HTTP_URL),
    });
    
    this.contract = getContract({
      address: BANDIT_KIDZ_CONTRACT as `0x${string}`,
      abi: ERC721_ABI,
      client: this.client,
    });
  }

  /**
   * Verify if wallet address is an admin (holds specific admin token IDs)
   */
  async verifyAdminStatus(walletAddress: string): Promise<NFTVerificationResult> {
    try {
      const address = walletAddress.toLowerCase() as `0x${string}`;
      
      // Check each admin token ID
      for (const tokenId of ADMIN_TOKEN_IDS) {
        try {
          const owner = await this.contract.read.ownerOf([BigInt(tokenId)]);
          
          if (owner.toLowerCase() === address) {
            return {
              isAdmin: true,
              isHolder: true,
              adminTokenId: tokenId,
            };
          }
        } catch (error) {
          // Token might not exist or other error, continue checking
          console.warn(`Error checking token ID ${tokenId}:`, error);
        }
      }
      
      // Not an admin, but check if they hold any Bandit Kidz NFTs
      const balance = await this.contract.read.balanceOf([address]);
      
      if (balance > 0n) {
        // Get all owned tokens (optional, for display purposes)
        const ownedTokens: number[] = [];
        try {
          for (let i = 0; i < Number(balance); i++) {
            const tokenId = await this.contract.read.tokenOfOwnerByIndex([address, BigInt(i)]);
            ownedTokens.push(Number(tokenId));
          }
        } catch (error) {
          console.warn('Error fetching owned tokens:', error);
        }
        
        return {
          isAdmin: false,
          isHolder: true,
          ownedTokens,
        };
      }
      
      return {
        isAdmin: false,
        isHolder: false,
      };
      
    } catch (error) {
      console.error('NFT verification error:', error);
      return {
        isAdmin: false,
        isHolder: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Verify specific token ownership
   */
  async verifyTokenOwnership(walletAddress: string, tokenId: number): Promise<boolean> {
    try {
      const owner = await this.contract.read.ownerOf([BigInt(tokenId)]);
      return owner.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      console.error(`Error verifying token ${tokenId}:`, error);
      return false;
    }
  }

  /**
   * Get all tokens owned by a wallet
   */
  async getOwnedTokens(walletAddress: string): Promise<number[]> {
    try {
      const address = walletAddress as `0x${string}`;
      const balance = await this.contract.read.balanceOf([address]);
      const tokens: number[] = [];
      
      for (let i = 0; i < Number(balance); i++) {
        try {
          const tokenId = await this.contract.read.tokenOfOwnerByIndex([address, BigInt(i)]);
          tokens.push(Number(tokenId));
        } catch (error) {
          console.warn(`Error getting token at index ${i}:`, error);
        }
      }
      
      return tokens;
    } catch (error) {
      console.error('Error getting owned tokens:', error);
      return [];
    }
  }

  /**
   * Batch verify multiple wallet addresses
   */
  async batchVerifyAdminStatus(walletAddresses: string[]): Promise<Record<string, NFTVerificationResult>> {
    const results: Record<string, NFTVerificationResult> = {};
    
    for (const address of walletAddresses) {
      results[address.toLowerCase()] = await this.verifyAdminStatus(address);
    }
    
    return results;
  }

  /**
   * Check if token ID is in admin list
   */
  static isAdminTokenId(tokenId: number): boolean {
    return ADMIN_TOKEN_IDS.includes(tokenId);
  }

  /**
   * Get all admin token IDs
   */
  static getAdminTokenIds(): number[] {
    return [...ADMIN_TOKEN_IDS];
  }
  
  /**
   * Add new admin token ID (for runtime management)
   */
  static addAdminTokenId(tokenId: number): void {
    if (!ADMIN_TOKEN_IDS.includes(tokenId)) {
      ADMIN_TOKEN_IDS.push(tokenId);
    }
  }
}

export { BANDIT_KIDZ_CONTRACT, ADMIN_TOKEN_IDS };