"use client";

import { useEffect, useState, useCallback } from "react";
import { useGelatoAuth } from "./useGelatoAuth";
import { NFTVerificationService } from "../src/utils/nft-verification";

export interface AdminUser {
  walletAddress: string;
  isAdmin: boolean;
  isHolder: boolean;
  adminTokenId?: number;
  ownedTokens?: number[];
  accessLevel: 'none' | 'holder' | 'admin';
}

export interface AdminAuthState {
  user: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  isVerifying: boolean;
}

export function useAdminAuth() {
  const { user: gelatoUser, isLoading: gelatoLoading } = useGelatoAuth();
  const [adminState, setAdminState] = useState<AdminAuthState>({
    user: null,
    isLoading: true,
    error: null,
    isVerifying: false,
  });

  const nftVerifier = new NFTVerificationService(146); // Sonic mainnet

  // Verify admin status when wallet connects
  const verifyAdminStatus = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;
    
    setAdminState(prev => ({ ...prev, isVerifying: true, error: null }));
    
    try {
      const verification = await nftVerifier.verifyAdminStatus(walletAddress);
      
      const accessLevel = verification.isAdmin ? 'admin' : 
                         verification.isHolder ? 'holder' : 'none';
      
      const adminUser: AdminUser = {
        walletAddress: walletAddress.toLowerCase(),
        isAdmin: verification.isAdmin,
        isHolder: verification.isHolder,
        adminTokenId: verification.adminTokenId,
        ownedTokens: verification.ownedTokens,
        accessLevel,
      };
      
      setAdminState({
        user: adminUser,
        isLoading: false,
        error: verification.error || null,
        isVerifying: false,
      });
      
      // Store admin status in localStorage for quick access
      localStorage.setItem('admin_status', JSON.stringify({
        walletAddress: walletAddress.toLowerCase(),
        isAdmin: verification.isAdmin,
        adminTokenId: verification.adminTokenId,
        timestamp: Date.now(),
      }));
      
    } catch (error) {
      console.error('Admin verification failed:', error);
      setAdminState({
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Verification failed',
        isVerifying: false,
      });
    }
  }, []);

  // Effect to verify when wallet connects
  useEffect(() => {
    if (gelatoUser?.walletAddress && gelatoUser.isAuthenticated) {
      // Check localStorage first for cached admin status
      const cachedStatus = localStorage.getItem('admin_status');
      
      if (cachedStatus) {
        try {
          const parsed = JSON.parse(cachedStatus);
          const isExpired = Date.now() - parsed.timestamp > 5 * 60 * 1000; // 5 minutes
          
          if (!isExpired && parsed.walletAddress === gelatoUser.walletAddress.toLowerCase()) {
            // Use cached status temporarily
            setAdminState({
              user: {
                walletAddress: parsed.walletAddress,
                isAdmin: parsed.isAdmin,
                isHolder: parsed.isAdmin, // Assume holder if admin
                adminTokenId: parsed.adminTokenId,
                accessLevel: parsed.isAdmin ? 'admin' : 'holder',
              },
              isLoading: false,
              error: null,
              isVerifying: false,
            });
            
            // Still verify in background
            verifyAdminStatus(gelatoUser.walletAddress);
            return;
          }
        } catch (error) {
          console.warn('Failed to parse cached admin status:', error);
        }
      }
      
      // No valid cache, verify immediately
      verifyAdminStatus(gelatoUser.walletAddress);
    } else if (!gelatoLoading && !gelatoUser?.isAuthenticated) {
      // User not authenticated
      setAdminState({
        user: null,
        isLoading: false,
        error: null,
        isVerifying: false,
      });
    }
  }, [gelatoUser, gelatoLoading, verifyAdminStatus]);

  // Manual refresh function
  const refreshAdminStatus = useCallback(() => {
    if (gelatoUser?.walletAddress) {
      verifyAdminStatus(gelatoUser.walletAddress);
    }
  }, [gelatoUser?.walletAddress, verifyAdminStatus]);

  // Check specific permission
  const hasPermission = useCallback((requiredLevel: 'holder' | 'admin') => {
    if (!adminState.user) return false;
    
    if (requiredLevel === 'admin') {
      return adminState.user.isAdmin;
    } else if (requiredLevel === 'holder') {
      return adminState.user.isHolder || adminState.user.isAdmin;
    }
    
    return false;
  }, [adminState.user]);

  // Get Gelato smart wallet capabilities for admin operations
  const getSmartWalletCapabilities = useCallback(async () => {
    if (!adminState.user?.isAdmin) return null;
    
    try {
      const response = await fetch(`https://api.gelato.digital/smartwallet?apiKey=TsgwMBO13xkB_0duYbpzoK4dMuAdUG4iAIxKSL1yyuo_`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'wallet_getCapabilities',
          params: [{
            chainIds: [146, 57054] // Sonic mainnet and testnet
          }]
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.result;
      }
    } catch (error) {
      console.error('Failed to get smart wallet capabilities:', error);
    }
    
    return null;
  }, [adminState.user?.isAdmin]);

  // Prepare admin calls for smart wallet execution
  const prepareAdminCalls = useCallback(async (calls: Array<{
    to: string;
    data?: string;
    value?: string;
  }>) => {
    if (!adminState.user?.isAdmin || !gelatoUser?.walletAddress) {
      throw new Error('Admin access required');
    }
    
    try {
      const response = await fetch(`https://api.gelato.digital/smartwallet?apiKey=TsgwMBO13xkB_0duYbpzoK4dMuAdUG4iAIxKSL1yyuo_`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'wallet_prepareCalls',
          params: [{
            from: gelatoUser.walletAddress,
            chainId: 146,
            calls: calls.map(call => ({
              to: call.to,
              data: call.data || '0x',
              value: call.value || '0'
            })),
            capabilities: {
              wallet: {
                encoding: 'erc4337'
              }
            }
          }]
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.result;
      } else {
        throw new Error(`Failed to prepare calls: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to prepare admin calls:', error);
      throw error;
    }
  }, [adminState.user?.isAdmin, gelatoUser?.walletAddress]);

  return {
    ...adminState,
    isLoading: adminState.isLoading || gelatoLoading,
    refreshAdminStatus,
    hasPermission,
    getSmartWalletCapabilities,
    prepareAdminCalls,
    // Convenience properties
    isAdmin: adminState.user?.isAdmin || false,
    isHolder: adminState.user?.isHolder || false,
    adminTokenId: adminState.user?.adminTokenId,
    ownedTokens: adminState.user?.ownedTokens || [],
  };
}