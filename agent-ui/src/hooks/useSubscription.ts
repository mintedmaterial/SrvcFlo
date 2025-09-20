'use client';

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

interface Subscription {
  tokenId: string;
  tier: 'BANDIT_KIDZ' | 'BASIC' | 'STANDARD' | 'PREMIUM' | 'UNLIMITED';
  expiresAt: string;
  promptsUsed: number;
  promptsLimit: number;
  isActive: boolean;
  expired: boolean;
  renewalCount: number;
  isBanditKidzHolder: boolean;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  isBanditKidzHolder: boolean;
  checkSubscription: (address: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  mintSubscription: (tier: string, userData: any) => Promise<boolean>;
  renewSubscription: (tokenId: string) => Promise<boolean>;
  upgradeSubscription: (tokenId: string, newTier: string) => Promise<boolean>;
  cancelSubscription: (tokenId: string, reason: string) => Promise<boolean>;
  requestAccess: (reason: string) => Promise<boolean>;
}

// Contract addresses (these would come from environment variables)
const SUBSCRIPTION_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_ADDRESS || '';
const BANDIT_KIDZ_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_BANDIT_KIDZ_CONTRACT_ADDRESS || '';
const SONIC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SONIC_TOKEN_ADDRESS || '';

// Subscription contract ABI (simplified)
const SUBSCRIPTION_ABI = [
  'function getUserSubscription(address user) view returns (uint256 tokenId, uint8 tier, uint256 expiresAt, uint256 promptsUsed, uint256 promptsLimit, bool isActive, bool expired, uint256 renewalCount)',
  'function isBanditKidzHolder(address user) view returns (bool)',
  'function mintFreeSubscription() external',
  'function mintSubscription(uint8 tier) external',
  'function renewSubscription(uint256 tokenId) external',
  'function upgradeSubscription(uint256 tokenId, uint8 newTier) external',
  'function cancelSubscription(uint256 tokenId, string reason) external',
  'function requestAccess(string reason) external',
  'function calculateSonicPrice(uint256 usdPrice, bool isBanditHolder) view returns (uint256)',
  'event SubscriptionMinted(address indexed user, uint256 indexed tokenId, uint8 tier, uint256 expiresAt)',
  'event SubscriptionRenewed(uint256 indexed tokenId, uint256 newExpiresAt, uint256 payment)',
  'event AccessRequested(address indexed user, string reason)'
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)'
];

const tierMap = ['BANDIT_KIDZ', 'BASIC', 'STANDARD', 'PREMIUM', 'UNLIMITED'] as const;

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBanditKidzHolder, setIsBanditKidzHolder] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>('');

  // Get provider and signer
  const getProvider = useCallback(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    // Fallback to JSON RPC provider
    return new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SONIC_RPC_URL || 'https://rpc.soniclabs.com');
  }, []);

  const getSigner = useCallback(async () => {
    const provider = getProvider();
    if (provider instanceof ethers.BrowserProvider) {
      return await provider.getSigner();
    }
    throw new Error('No wallet connected');
  }, [getProvider]);

  // Check subscription status for an address
  const checkSubscription = useCallback(async (address: string) => {
    if (!address) return;

    setIsLoading(true);
    setError(null);
    setCurrentAddress(address);

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(SUBSCRIPTION_CONTRACT_ADDRESS, SUBSCRIPTION_ABI, provider);

      // Check Bandit Kidz NFT ownership
      const isBanditHolder = await contract.isBanditKidzHolder(address);
      setIsBanditKidzHolder(isBanditHolder);

      // Get subscription details
      const result = await contract.getUserSubscription(address);

      if (result.tokenId.toString() === '0') {
        setSubscription(null);
      } else {
        const sub: Subscription = {
          tokenId: result.tokenId.toString(),
          tier: tierMap[Number(result.tier)],
          expiresAt: new Date(Number(result.expiresAt) * 1000).toISOString(),
          promptsUsed: Number(result.promptsUsed),
          promptsLimit: Number(result.promptsLimit),
          isActive: result.isActive,
          expired: result.expired,
          renewalCount: Number(result.renewalCount),
          isBanditKidzHolder: isBanditHolder
        };
        setSubscription(sub);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to check subscription');
    } finally {
      setIsLoading(false);
    }
  }, [getProvider]);

  // Refresh current subscription
  const refreshSubscription = useCallback(async () => {
    if (currentAddress) {
      await checkSubscription(currentAddress);
    }
  }, [currentAddress, checkSubscription]);

  // Mint new subscription
  const mintSubscription = useCallback(async (tier: string, userData: any): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(SUBSCRIPTION_CONTRACT_ADDRESS, SUBSCRIPTION_ABI, signer);
      const tokenContract = new ethers.Contract(SONIC_TOKEN_ADDRESS, ERC20_ABI, signer);

      // Handle free subscription for Bandit Kidz holders
      if (tier === 'BANDIT_KIDZ' && isBanditKidzHolder) {
        const tx = await contract.mintFreeSubscription();
        await tx.wait();
        await refreshSubscription();
        return true;
      }

      // Get tier index
      const tierIndex = tierMap.indexOf(tier as any);
      if (tierIndex === -1) throw new Error('Invalid tier');

      // Calculate required SONIC amount
      const tierPrices = [0, 10, 100, 200, 300]; // USD prices
      const usdPrice = ethers.parseUnits(tierPrices[tierIndex].toString(), 8); // 8 decimals for USD
      const sonicAmount = await contract.calculateSonicPrice(usdPrice, isBanditKidzHolder);

      // Check SONIC balance
      const balance = await tokenContract.balanceOf(await signer.getAddress());
      if (balance < sonicAmount) {
        throw new Error('Insufficient SONIC token balance');
      }

      // Approve SONIC spending
      const allowance = await tokenContract.allowance(await signer.getAddress(), SUBSCRIPTION_CONTRACT_ADDRESS);
      if (allowance < sonicAmount) {
        const approveTx = await tokenContract.approve(SUBSCRIPTION_CONTRACT_ADDRESS, sonicAmount);
        await approveTx.wait();
      }

      // Mint subscription
      const tx = await contract.mintSubscription(tierIndex);
      await tx.wait();

      await refreshSubscription();
      return true;
    } catch (err) {
      console.error('Error minting subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to mint subscription');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getSigner, isBanditKidzHolder, refreshSubscription]);

  // Trigger subscription task
  const triggerSubscriptionTask = useCallback(async (action: string, payload: any): Promise<string | null> => {
    try {
      const response = await fetch('/api/subscription/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.taskId;
    } catch (error) {
      console.error('Error triggering subscription task:', error);
      return null;
    }
  }, []);

  // Renew subscription
  const renewSubscription = useCallback(async (tokenId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(SUBSCRIPTION_CONTRACT_ADDRESS, SUBSCRIPTION_ABI, signer);
      const tokenContract = new ethers.Contract(SONIC_TOKEN_ADDRESS, ERC20_ABI, signer);

      // For non-free subscriptions, handle payment
      let sonicAmount = ethers.parseEther('0');
      if (subscription && subscription.tier !== 'BANDIT_KIDZ') {
        const tierPrices = [0, 10, 100, 200, 300];
        const tierIndex = tierMap.indexOf(subscription.tier);
        const usdPrice = ethers.parseUnits(tierPrices[tierIndex].toString(), 8);
        sonicAmount = await contract.calculateSonicPrice(usdPrice, subscription.isBanditKidzHolder);

        // Check and approve SONIC
        const balance = await tokenContract.balanceOf(await signer.getAddress());
        if (balance < sonicAmount) {
          throw new Error('Insufficient SONIC token balance');
        }

        const allowance = await tokenContract.allowance(await signer.getAddress(), SUBSCRIPTION_CONTRACT_ADDRESS);
        if (allowance < sonicAmount) {
          const approveTx = await tokenContract.approve(SUBSCRIPTION_CONTRACT_ADDRESS, sonicAmount);
          await approveTx.wait();
        }
      }

      const tx = await contract.renewSubscription(tokenId);
      await tx.wait();

      // Trigger backend renewal processing
      await triggerSubscriptionTask('process-renewal', {
        tokenId,
        userAddress: await signer.getAddress(),
        tier: subscription?.tier || 'BASIC',
        paymentMethod: 'sonic',
        amount: Number(ethers.formatEther(sonicAmount))
      });

      await refreshSubscription();
      return true;
    } catch (err) {
      console.error('Error renewing subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to renew subscription');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getSigner, subscription, refreshSubscription, triggerSubscriptionTask]);

  // Upgrade subscription
  const upgradeSubscription = useCallback(async (tokenId: string, newTier: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(SUBSCRIPTION_CONTRACT_ADDRESS, SUBSCRIPTION_ABI, signer);
      const tokenContract = new ethers.Contract(SONIC_TOKEN_ADDRESS, ERC20_ABI, signer);

      const newTierIndex = tierMap.indexOf(newTier as any);
      if (newTierIndex === -1) throw new Error('Invalid tier');

      // Calculate price difference
      const tierPrices = [0, 10, 100, 200, 300];
      const currentTierIndex = subscription ? tierMap.indexOf(subscription.tier) : 0;
      const priceDiff = tierPrices[newTierIndex] - tierPrices[currentTierIndex];

      if (priceDiff > 0) {
        const usdPriceDiff = ethers.parseUnits(priceDiff.toString(), 8);
        const sonicAmount = await contract.calculateSonicPrice(usdPriceDiff, subscription?.isBanditKidzHolder || false);

        // Check and approve SONIC
        const balance = await tokenContract.balanceOf(await signer.getAddress());
        if (balance < sonicAmount) {
          throw new Error('Insufficient SONIC token balance for upgrade');
        }

        const allowance = await tokenContract.allowance(await signer.getAddress(), SUBSCRIPTION_CONTRACT_ADDRESS);
        if (allowance < sonicAmount) {
          const approveTx = await tokenContract.approve(SUBSCRIPTION_CONTRACT_ADDRESS, sonicAmount);
          await approveTx.wait();
        }
      }

      const tx = await contract.upgradeSubscription(tokenId, newTierIndex);
      await tx.wait();

      await refreshSubscription();
      return true;
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to upgrade subscription');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getSigner, subscription, refreshSubscription]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (tokenId: string, reason: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(SUBSCRIPTION_CONTRACT_ADDRESS, SUBSCRIPTION_ABI, signer);

      const tx = await contract.cancelSubscription(tokenId, reason);
      await tx.wait();

      // Trigger backend cancellation processing
      await triggerSubscriptionTask('process-expired', {
        subscription: {
          tokenId,
          userAddress: await signer.getAddress(),
          tier: subscription?.tier || 'BASIC',
          expiresAt: subscription?.expiresAt || new Date().toISOString(),
          promptsUsed: subscription?.promptsUsed || 0,
          promptsLimit: subscription?.promptsLimit || 50,
          isActive: false,
          expired: true,
          renewalCount: subscription?.renewalCount || 0,
          isBanditKidzHolder: subscription?.isBanditKidzHolder || false
        }
      });

      await refreshSubscription();
      return true;
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getSigner, refreshSubscription, triggerSubscriptionTask, subscription]);

  // Request access for non-NFT holders
  const requestAccess = useCallback(async (reason: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(SUBSCRIPTION_CONTRACT_ADDRESS, SUBSCRIPTION_ABI, signer);

      const tx = await contract.requestAccess(reason);
      await tx.wait();

      return true;
    } catch (err) {
      console.error('Error requesting access:', err);
      setError(err instanceof Error ? err.message : 'Failed to request access');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getSigner]);

  // Listen for subscription events
  useEffect(() => {
    if (!currentAddress) return;

    const provider = getProvider();
    const contract = new ethers.Contract(SUBSCRIPTION_CONTRACT_ADDRESS, SUBSCRIPTION_ABI, provider);

    const handleSubscriptionMinted = (user: string, tokenId: any, tier: any, expiresAt: any) => {
      if (user.toLowerCase() === currentAddress.toLowerCase()) {
        refreshSubscription();
      }
    };

    const handleSubscriptionRenewed = (tokenId: any, newExpiresAt: any) => {
      if (subscription && subscription.tokenId === tokenId.toString()) {
        refreshSubscription();
      }
    };

    // Set up event listeners
    contract.on('SubscriptionMinted', handleSubscriptionMinted);
    contract.on('SubscriptionRenewed', handleSubscriptionRenewed);

    return () => {
      contract.off('SubscriptionMinted', handleSubscriptionMinted);
      contract.off('SubscriptionRenewed', handleSubscriptionRenewed);
    };
  }, [currentAddress, subscription, refreshSubscription, getProvider]);

  return {
    subscription,
    isLoading,
    error,
    isBanditKidzHolder,
    checkSubscription,
    refreshSubscription,
    mintSubscription,
    renewSubscription,
    upgradeSubscription,
    cancelSubscription,
    requestAccess
  };
}