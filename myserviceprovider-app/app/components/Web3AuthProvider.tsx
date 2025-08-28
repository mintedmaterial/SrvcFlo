'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useToast } from '@/hooks/use-toast';
import { ExtendedUser, Web3Claims } from '@/lib/auth0-config';

interface Web3AuthContextType {
  // Wallet connection
  isWalletConnected: boolean;
  walletAddress: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  
  // Auth0 + Web3 state
  isAuthenticating: boolean;
  isWeb3Verified: boolean;
  
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signWeb3Message: () => Promise<void>;
  linkWalletToAuth0: () => Promise<void>;
  
  // User data
  web3Claims: Web3Claims | null;
  refreshUserData: () => Promise<void>;
}

const Web3AuthContext = createContext<Web3AuthContextType | undefined>(undefined);

interface Web3AuthProviderProps {
  children: ReactNode;
}

export function Web3AuthProvider({ children }: Web3AuthProviderProps) {
  const { user, isLoading } = useUser();
  const { toast } = useToast();
  
  // Wallet state
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  
  // Auth state
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isWeb3Verified, setIsWeb3Verified] = useState(false);
  const [web3Claims, setWeb3Claims] = useState<Web3Claims | null>(null);

  // Check for existing wallet connection on mount
  useEffect(() => {
    checkWalletConnection();
    setupWalletEventListeners();
  }, []);

  // Update Web3 verification status when user changes
  useEffect(() => {
    if (user && !isLoading) {
      const extendedUser = user as ExtendedUser;
      if (extendedUser.web3) {
        setWeb3Claims(extendedUser.web3);
        setIsWeb3Verified(!!extendedUser.web3.walletAddress);
      }
    }
  }, [user, isLoading]);

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const address = accounts[0].address;
          const network = await provider.getNetwork();
          
          setProvider(provider);
          setWalletAddress(address);
          setChainId(Number(network.chainId));
          setIsWalletConnected(true);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const setupWalletEventListeners = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
      
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
          window.ethereum.removeListener('disconnect', handleDisconnect);
        }
      };
    }
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setWalletAddress(accounts[0]);
      // Re-verify with new account
      if (user) {
        await signWeb3Message();
      }
    }
  };

  const handleChainChanged = async (chainId: string) => {
    const newChainId = parseInt(chainId, 16);
    setChainId(newChainId);
    
    // Check if we're on Sonic testnet (146) or mainnet (148)
    if (newChainId !== 146 && newChainId !== 148) {
      toast({
        title: "Unsupported Network",
        description: "Please switch to Sonic Testnet (146) or Mainnet (148)",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "No Wallet Found",
        description: "Please install MetaMask or another Ethereum wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAuthenticating(true);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      
      setProvider(provider);
      setWalletAddress(address);
      setChainId(Number(network.chainId));
      setIsWalletConnected(true);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });

      // If user is logged in to Auth0, link the wallet
      if (user) {
        await linkWalletToAuth0();
      }
      
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setWalletAddress(null);
    setChainId(null);
    setIsWalletConnected(false);
    setIsWeb3Verified(false);
    setWeb3Claims(null);
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const signWeb3Message = async () => {
    if (!provider || !walletAddress || !user) {
      throw new Error('Wallet not connected or user not logged in');
    }

    try {
      setIsAuthenticating(true);
      
      const signer = await provider.getSigner();
      const timestamp = Date.now();
      const nonce = Math.random().toString(36).substring(7);
      
      // Create SIWE-style message
      const message = `ServiceFlow AI wants you to sign in with your Ethereum account:
${walletAddress}

I accept the ServiceFlow AI Terms of Service: https://srvcflo.com/terms

URI: ${window.location.origin}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${new Date(timestamp).toISOString()}`;

      const signature = await signer.signMessage(message);
      
      // Store Web3 claims in Auth0
      const response = await fetch('/api/auth/web3/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
          chainId,
          timestamp,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setWeb3Claims(result.web3Claims);
        setIsWeb3Verified(true);
        
        toast({
          title: "Web3 Verification Complete",
          description: "Your wallet has been successfully verified and linked",
        });
      } else {
        throw new Error('Web3 verification failed');
      }
      
    } catch (error: any) {
      console.error('Error signing Web3 message:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify Web3 signature",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const linkWalletToAuth0 = async () => {
    if (!user || !walletAddress) {
      return;
    }

    try {
      await signWeb3Message();
    } catch (error) {
      console.error('Error linking wallet to Auth0:', error);
    }
  };

  const refreshUserData = async () => {
    if (!user || !walletAddress) {
      return;
    }

    try {
      const response = await fetch('/api/auth/user/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        // Update user data in Auth0 session
        // This would typically trigger a re-fetch of the user object
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const value: Web3AuthContextType = {
    // Wallet connection
    isWalletConnected,
    walletAddress,
    chainId,
    provider,
    
    // Auth state
    isAuthenticating,
    isWeb3Verified,
    
    // Actions
    connectWallet,
    disconnectWallet,
    signWeb3Message,
    linkWalletToAuth0,
    
    // User data
    web3Claims,
    refreshUserData,
  };

  return (
    <Web3AuthContext.Provider value={value}>
      {children}
    </Web3AuthContext.Provider>
  );
}

export function useWeb3Auth() {
  const context = useContext(Web3AuthContext);
  if (context === undefined) {
    throw new Error('useWeb3Auth must be used within a Web3AuthProvider');
  }
  return context;
}