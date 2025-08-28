'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useWeb3Auth } from '@/components/Web3AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreditPackageCard } from '@/components/CreditPackageCard';
import { AgentMintingCard } from '@/components/AgentMintingCard';
import { GenerationInterface } from '@/components/GenerationInterface';
import { UserDashboard } from '@/components/UserDashboard';
import { 
  Bot, 
  Wallet, 
  Shield, 
  Activity,
  User,
  LogOut,
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';
import { ExtendedUser } from '@/lib/auth0-config';

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

export function AuthenticatedServiceFlow() {
  const { user, isLoading } = useUser();
  const { 
    isWalletConnected, 
    walletAddress, 
    chainId, 
    provider,
    isWeb3Verified,
    web3Claims,
    connectWallet,
    disconnectWallet,
    linkWalletToAuth0,
    refreshUserData,
    isAuthenticating
  } = useWeb3Auth();
  
  const { toast } = useToast();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userAgents, setUserAgents] = useState<UserAgent[]>([]);
  const [loading, setLoading] = useState(false);

  const extendedUser = user as ExtendedUser;

  // Load user data when wallet is connected and verified
  useEffect(() => {
    if (isWeb3Verified && walletAddress) {
      loadUserData();
    }
  }, [isWeb3Verified, walletAddress]);

  const loadUserData = async () => {
    if (!walletAddress) return;

    setLoading(true);
    try {
      // Load from Cloudflare Worker
      const statsResponse = await fetch(`${CLOUDFLARE_WORKER_URL}/api/user-stats`, {
        headers: {
          'X-User-Address': walletAddress,
        },
      });
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setUserStats({
          userAddress: walletAddress,
          creditBalances: stats.creditBalances || {},
          totalGenerations: stats.totalGenerations || 0,
          freeGenerationsToday: stats.freeGenerationsToday || 0,
          canUseFreeGeneration: stats.canUseFreeGeneration || true,
          agentCount: 0,
          totalRevenue: 0,
          floaiBalance: extendedUser?.floaiBalance || 0,
          sTokenBalance: extendedUser?.sTokenBalance || 0
        });
      }

      // Load user agents (placeholder for now)
      setUserAgents([]);

      // Refresh Auth0 user data
      await refreshUserData();

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
    if (!walletAddress || !provider) return;

    try {
      setLoading(true);
      
      const signer = await provider.getSigner();
      
      if (paymentType === 's_tokens') {
        const prices = [5, 50, 200, 1500];
        const priceInEth = ethers.parseEther(prices[packageId].toString());
        
        const tx = await signer.sendTransaction({
          to: process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS,
          value: priceInEth,
          data: ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [packageId])
        });
        
        await tx.wait();
        
        const response = await fetch(`${CLOUDFLARE_WORKER_URL}/api/purchase-credits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAddress: walletAddress,
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
          await loadUserData();
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
    if (!walletAddress || !provider) return;

    try {
      setLoading(true);
      
      const signer = await provider.getSigner();
      const message = JSON.stringify(config);
      const signature = await signer.signMessage(message);
      
      let paymentTx = '';
      if (paymentType === 's_tokens') {
        const tx = await signer.sendTransaction({
          to: process.env.NEXT_PUBLIC_AGENT_FACTORY_ADDRESS,
          value: ethers.parseEther('50'),
        });
        await tx.wait();
        paymentTx = tx.hash;
      }
      
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/api/mint-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentConfig: config,
          ownerAddress: walletAddress,
          signature,
          paymentTx
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Agent Minted!",
          description: `Successfully minted ${config.name} agent`,
        });
        await loadUserData();
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
    if (!walletAddress) throw new Error('Wallet not connected');

    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/api/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenId: request.agentId,
        prompt: request.prompt,
        agentType: request.agentType,
        userAddress: walletAddress,
        creditPackageId: 0,
        ...request
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Generation failed');
    }

    const result = await response.json();
    await loadUserData();
    return result;
  };

  const handleWithdrawRevenue = async (agentId: number) => {
    toast({
      title: "Withdrawal Initiated",
      description: `Withdrawing revenue for agent #${agentId}`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading ServiceFlow AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-center justify-center">
        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-700 max-w-md">
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-gray-300 mb-6">Please sign in to access ServiceFlow AI</p>
            <Button asChild className="w-full bg-purple-500 hover:bg-purple-600">
              <a href="/api/auth/login">Sign In with Auth0</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ServiceFlow AI</h1>
              <p className="text-sm text-gray-400">
                {user.email} • {isWeb3Verified ? 'Web3 Verified' : 'Web3 Not Linked'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Wallet Connection Status */}
            {isWalletConnected ? (
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-green-500">
                  <Wallet className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
                {isWeb3Verified && (
                  <Badge variant="default" className="bg-blue-500">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            ) : (
              <Button onClick={connectWallet} disabled={isAuthenticating} size="sm">
                {isAuthenticating ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4" />
                    <span>Connect Wallet</span>
                  </div>
                )}
              </Button>
            )}

            {/* Actions */}
            <Button
              onClick={loadUserData}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <Button asChild variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <a href="/api/auth/logout">
                <LogOut className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Wallet Connection Warning */}
        {!isWalletConnected && (
          <Card className="bg-yellow-900/50 border-yellow-500/50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Wallet className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-yellow-200 font-medium">Wallet Not Connected</p>
                  <p className="text-yellow-300 text-sm">
                    Connect your wallet to access all ServiceFlow AI features
                  </p>
                </div>
                <Button onClick={connectWallet} disabled={isAuthenticating} size="sm">
                  Connect Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Web3 Verification */}
        {isWalletConnected && !isWeb3Verified && (
          <Card className="bg-blue-900/50 border-blue-500/50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <LinkIcon className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-blue-200 font-medium">Link Wallet to Account</p>
                  <p className="text-blue-300 text-sm">
                    Verify your wallet ownership to enable full functionality
                  </p>
                </div>
                <Button onClick={linkWalletToAuth0} disabled={isAuthenticating} size="sm">
                  {isAuthenticating ? 'Verifying...' : 'Verify Wallet'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Interface */}
        {isWeb3Verified && walletAddress ? (
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
                  onRefreshStats={loadUserData}
                  onWithdrawRevenue={handleWithdrawRevenue}
                  loading={loading}
                />
              )}
            </TabsContent>

            <TabsContent value="credits">
              <CreditPackageCard
                userAddress={walletAddress}
                onPurchase={handlePurchaseCredits}
                loading={loading}
                userCredits={userStats?.creditBalances}
              />
            </TabsContent>

            <TabsContent value="mint">
              <AgentMintingCard
                userAddress={walletAddress}
                onMint={handleMintAgent}
                loading={loading}
                userFLOAIBalance={userStats?.floaiBalance || 0}
                userSBalance={userStats?.sTokenBalance || 0}
              />
            </TabsContent>

            <TabsContent value="generate">
              <GenerationInterface
                userAddress={walletAddress}
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
                  onRefreshStats={loadUserData}
                  onWithdrawRevenue={handleWithdrawRevenue}
                  loading={loading}
                />
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Complete Setup Required</h3>
            <p className="text-gray-400">
              Connect and verify your wallet to start using ServiceFlow AI
            </p>
          </div>
        )}
      </div>
    </div>
  );
}