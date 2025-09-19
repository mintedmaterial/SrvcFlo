"use client";

import { useEffect, useState, useCallback } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

export interface GelatoUser {
  userId: string;
  walletAddress?: string;
  email?: string;
  isAuthenticated: boolean;
  smartWalletAddress?: string;
  authMethod?: "wallet" | "email" | "social";
}

export interface GelatoAuthState {
  user: GelatoUser | null;
  isLoading: boolean;
  error: string | null;
}

export function useGelatoAuth() {
  const { user, primaryWallet, setShowAuthFlow, isAuthenticated } = useDynamicContext();
  const [authState, setAuthState] = useState<GelatoAuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  // Initialize auth state based on Dynamic context
  useEffect(() => {
    try {
      if (isAuthenticated && user && primaryWallet) {
        const gelatoUser: GelatoUser = {
          userId: user.userId,
          walletAddress: primaryWallet.address,
          email: user.email,
          isAuthenticated: true,
          authMethod: user.email ? "email" : "wallet",
        };

        setAuthState({
          user: gelatoUser,
          isLoading: false,
          error: null,
        });
      } else if (!isAuthenticated) {
        setAuthState({
          user: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      setAuthState({
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : "Authentication error",
      });
    }
  }, [user, primaryWallet, isAuthenticated]);

  // Login function
  const login = useCallback(() => {
    setShowAuthFlow(true);
  }, [setShowAuthFlow]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Dynamic logout will trigger the useEffect above to update state
      if (primaryWallet) {
        await primaryWallet.disconnect();
      }
      setAuthState({
        user: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Logout error",
      }));
    }
  }, [primaryWallet]);

  // Get wallet balance
  const getBalance = useCallback(async (): Promise<string | null> => {
    if (!primaryWallet) return null;
    
    try {
      const balance = await primaryWallet.connector.getBalance();
      return balance;
    } catch (error) {
      console.error("Error getting balance:", error);
      return null;
    }
  }, [primaryWallet]);

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!primaryWallet) return null;
    
    try {
      const signature = await primaryWallet.connector.signMessage(message);
      return signature;
    } catch (error) {
      console.error("Error signing message:", error);
      return null;
    }
  }, [primaryWallet]);

  // Switch network
  const switchNetwork = useCallback(async (chainId: number): Promise<boolean> => {
    if (!primaryWallet) return false;
    
    try {
      await primaryWallet.connector.switchChain({ chainId });
      return true;
    } catch (error) {
      console.error("Error switching network:", error);
      return false;
    }
  }, [primaryWallet]);

  return {
    ...authState,
    login,
    logout,
    getBalance,
    signMessage,
    switchNetwork,
    primaryWallet,
  };
}