'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CreditPackageCard } from '@/components/CreditPackageCard';
import { AgentMintingCard } from '@/components/AgentMintingCard';
import { GenerationInterface } from '@/components/GenerationInterface';
import { UserDashboard } from '@/components/UserDashboard';
import { 
  Bot, 
  Wallet, 
  CreditCard, 
  Sparkles, 
  Activity,
  Shield,
  Zap
} from 'lucide-react';

interface UserStats {
  userAddress: string;
  creditBalances: { [packageId: number]: number };
  totalGenerations: number;
  freeGenerationsToday: number;
  canUseFreeGeneration: boolean;
  agentCount: number;
  totalRevenue: number;
  floaiBalance: number;
  sTokenBalance: number;
}

interface UserAgent {
  tokenId: number;
  name: string;
  agentType: 'image' | 'video' | 'social' | 'nft_watcher' | 'token_analyst';
  creditPackageId: number;
  generationCount: number;
  totalRevenue: number;
  isActive: boolean;
  creator: string;
}

interface AgentConfig {
  name: string;
  agentType: 'image' | 'video' | 'social' | 'nft_watcher' | 'token_analyst';
  instructions: string;
  tools: string[];
  connections: string[];
  floaiPerOperation: number;
  creditPackageId: number;
}

interface GenerationRequest {
  agentId: number;
  prompt: string;
  agentType: 'image' | 'video' | 'social';
  width?: number;
  height?: number;
  steps?: number;
  duration?: number;
}

const CLOUDFLARE_WORKER_URL = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL || 'https://your-worker.your-subdomain.workers.dev';

export default function ServiceFlowPage() {
  const [userAddress, setUserAddress] = useState<string>('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userAgents, setUserAgents] = useState<UserAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const { toast } = useToast();

  // Initialize wallet connection
  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const address = accounts[0].address;
          setUserAddress(address);
          setProvider(provider);
          await loadUserData(address);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
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

    setConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setUserAddress(address);
      setProvider(provider);
      await loadUserData(address);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const loadUserData = async (address: string) => {
    setLoading(true);
    try {
      // Load user stats from Cloudflare Worker
      const statsResponse = await fetch(`${CLOUDFLARE_WORKER_URL}/api/user-stats`, {
        headers: {
          'X-User-Address': address,
        },
      });
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setUserStats({
          userAddress: address,
          creditBalances: stats.creditBalances || {},
          totalGenerations: stats.totalGenerations || 0,
          freeGenerationsToday: stats.freeGenerationsToday || 0,
          canUseFreeGeneration: stats.canUseFreeGeneration || true,
          agentCount: 0,
          totalRevenue: 0,
          floaiBalance: 0,
          sTokenBalance: 0
        });
      }

      // TODO: Load user agents from smart contract
      // For now, using placeholder data
      setUserAgents([]);

    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Data Load Failed",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = async (packageId: number, paymentType: 'usdc' | 's_tokens') => {
    if (!userAddress || !provider) return;

    try {
      setLoading(true);
      
      // Create transaction for credit purchase
      const signer = await provider.getSigner();
      
      if (paymentType === 's_tokens') {
        // Calculate price in S tokens
        const prices = [5, 50, 200, 1500]; // S token prices
        const priceInEth = ethers.parseEther(prices[packageId].toString());
        
        // Send S tokens to smart contract
        const tx = await signer.sendTransaction({
          to: process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS,
          value: priceInEth,
          data: ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [packageId])
        });
        
        await tx.wait();
        
        // Verify payment with Cloudflare Worker
        const response = await fetch(`${CLOUDFLARE_WORKER_URL}/api/purchase-credits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAddress,
            packageId,
            paymentTx: tx.hash,
            paymentType: 'credit_purchase'
          }),
        });
        
        if (response.ok) {
          toast({
            title: "Credits Purchased!",
            description: `Successfully purchased credit package with S tokens`,
          });
          await loadUserData(userAddress);
        } else {
          throw new Error('Payment verification failed');
        }
      }
      
    } catch (error: any) {
      console.error('Error purchasing credits:', error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase credits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMintAgent = async (config: AgentConfig, paymentType: 'floai' | 's_tokens') => {
    if (!userAddress || !provider) return;

    try {
      setLoading(true);
      
      // Sign agent configuration
      const signer = await provider.getSigner();
      const message = JSON.stringify(config);
      const signature = await signer.signMessage(message);
      
      // Create payment transaction
      let paymentTx = '';
      if (paymentType === 's_tokens') {
        const tx = await signer.sendTransaction({
          to: process.env.NEXT_PUBLIC_AGENT_FACTORY_ADDRESS,
          value: ethers.parseEther('50'), // 50 S tokens
        });
        await tx.wait();
        paymentTx = tx.hash;
      }
      
      // Call Cloudflare Worker to mint agent
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/api/mint-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentConfig: config,
          ownerAddress: userAddress,
          signature,
          paymentTx
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Agent Minted!",
          description: `Successfully minted ${config.name} agent`,
        });
        await loadUserData(userAddress);
      } else {
        throw new Error('Agent minting failed');
      }
      
    } catch (error: any) {
      console.error('Error minting agent:', error);
      toast({
        title: "Minting Failed",
        description: error.message || "Failed to mint agent",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (request: GenerationRequest) => {
    if (!userAddress) throw new Error('Wallet not connected');

    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/api/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenId: request.agentId,
        prompt: request.prompt,
        agentType: request.agentType,
        userAddress,
        creditPackageId: 0, // Use appropriate package ID
        ...request
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Generation failed');
    }

    const result = await response.json();
    
    // Refresh user data after generation
    await loadUserData(userAddress);
    
    return result;
  };

  const handleWithdrawRevenue = async (agentId: number) => {
    // TODO: Implement revenue withdrawal from smart contract
    toast({
      title: "Withdrawal Initiated",
      description: `Withdrawing revenue for agent #${agentId}`,
    });
  };

  if (!userAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Section */}
            <div className="mb-12">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Bot className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
                ServiceFlow AI
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Create, own, and monetize AI agents with iNFT technology. 
                Generate content, earn revenue, and build the future of AI on Sonic blockchain.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 p-6 rounded-xl border border-blue-500/50">
                <CreditCard className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Credit Packages</h3>
                <p className="text-gray-300">
                  Purchase credits to power your AI generations with flexible pricing tiers
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-6 rounded-xl border border-purple-500/50">
                <Bot className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">AI Agent NFTs</h3>
                <p className="text-gray-300">
                  Mint unique AI agents as NFTs and earn revenue from their usage
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 p-6 rounded-xl border border-green-500/50">
                <Zap className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Generate Content</h3>
                <p className="text-gray-300">
                  Create images, videos, and social content with cutting-edge AI models
                </p>
              </div>
            </div>

            {/* Connect Wallet */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-600/50">
              <Wallet className="h-16 w-16 text-purple-400 mx-auto mb-6" />
              
              <h2 className="text-3xl font-bold text-white mb-4">
                Connect Your Wallet to Get Started
              </h2>
              
              <p className="text-gray-300 mb-8 max-w-md mx-auto">
                Connect your Ethereum wallet to access ServiceFlow AI's features and start creating with AI agents
              </p>
              
              <Button
                onClick={connectWallet}
                disabled={connecting}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg"
              >
                {connecting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5" />
                    <span>Connect Wallet</span>
                  </div>
                )}
              </Button>
              
              <div className="flex items-center justify-center space-x-4 mt-6 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Activity className="h-4 w-4" />
                  <span>Sonic Blockchain</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ServiceFlow AI</h1>
              <p className="text-sm text-gray-400">
                Connected: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => loadUserData(userAddress)}
            disabled={loading}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Main Interface */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800/50">
            <TabsTrigger value="dashboard" className="text-white data-[state=active]:bg-purple-500">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="credits" className="text-white data-[state=active]:bg-purple-500">
              Credits
            </TabsTrigger>
            <TabsTrigger value="mint" className="text-white data-[state=active]:bg-purple-500">
              Mint Agent
            </TabsTrigger>
            <TabsTrigger value="generate" className="text-white data-[state=active]:bg-purple-500">
              Generate
            </TabsTrigger>
            <TabsTrigger value="agents" className="text-white data-[state=active]:bg-purple-500">
              My Agents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            {userStats && (
              <UserDashboard
                userStats={userStats}
                userAgents={userAgents}
                onRefreshStats={() => loadUserData(userAddress)}
                onWithdrawRevenue={handleWithdrawRevenue}
                loading={loading}
              />
            )}
          </TabsContent>

          <TabsContent value="credits">
            <CreditPackageCard
              userAddress={userAddress}
              onPurchase={handlePurchaseCredits}
              loading={loading}
              userCredits={userStats?.creditBalances}
            />
          </TabsContent>

          <TabsContent value="mint">
            <AgentMintingCard
              userAddress={userAddress}
              onMint={handleMintAgent}
              loading={loading}
              userFLOAIBalance={userStats?.floaiBalance || 0}
              userSBalance={userStats?.sTokenBalance || 0}
            />
          </TabsContent>

          <TabsContent value="generate">
            <GenerationInterface
              userAddress={userAddress}
              userAgents={userAgents}
              userCredits={userStats?.creditBalances || {}}
              onGenerate={handleGenerate}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="agents">
            {userStats && (
              <UserDashboard
                userStats={userStats}
                userAgents={userAgents}
                onRefreshStats={() => loadUserData(userAddress)}
                onWithdrawRevenue={handleWithdrawRevenue}
                loading={loading}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}