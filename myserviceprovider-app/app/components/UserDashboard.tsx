'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  CreditCard, 
  TrendingUp, 
  Wallet, 
  Image, 
  Video, 
  MessageSquare,
  Eye,
  Sparkles,
  DollarSign,
  Activity
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

const CREDIT_PACKAGE_NAMES = {
  0: 'Starter',
  1: 'Creator', 
  2: 'Professional',
  3: 'Enterprise'
};

const AGENT_TYPE_ICONS = {
  image: <Image className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  social: <MessageSquare className="h-4 w-4" />,
  nft_watcher: <Eye className="h-4 w-4" />,
  token_analyst: <TrendingUp className="h-4 w-4" />
};

const AGENT_TYPE_COLORS = {
  image: 'from-blue-500/20 to-cyan-500/20 border-blue-500/50',
  video: 'from-purple-500/20 to-pink-500/20 border-purple-500/50',
  social: 'from-green-500/20 to-emerald-500/20 border-green-500/50',
  nft_watcher: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/50',
  token_analyst: 'from-red-500/20 to-rose-500/20 border-red-500/50'
};

interface UserDashboardProps {
  userStats: UserStats;
  userAgents: UserAgent[];
  onRefreshStats: () => Promise<void>;
  onWithdrawRevenue: (agentId: number) => Promise<void>;
  loading?: boolean;
}

export function UserDashboard({ 
  userStats, 
  userAgents, 
  onRefreshStats, 
  onWithdrawRevenue,
  loading 
}: UserDashboardProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawingAgent, setWithdrawingAgent] = useState<number | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshStats();
    } finally {
      setRefreshing(false);
    }
  };

  const handleWithdraw = async (agentId: number) => {
    setWithdrawingAgent(agentId);
    try {
      await onWithdrawRevenue(agentId);
    } finally {
      setWithdrawingAgent(null);
    }
  };

  const totalCredits = Object.values(userStats.creditBalances).reduce((sum, credits) => sum + credits, 0);
  const totalAgentRevenue = userAgents.reduce((sum, agent) => sum + agent.totalRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 backdrop-blur-sm border-blue-500/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Total Credits</p>
                <p className="text-2xl font-bold text-white">{totalCredits.toLocaleString()}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-sm border-purple-500/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">My Agents</p>
                <p className="text-2xl font-bold text-white">{userAgents.length}</p>
              </div>
              <Bot className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-sm border-green-500/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Total Generations</p>
                <p className="text-2xl font-bold text-white">{userStats.totalGenerations}</p>
              </div>
              <Activity className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 backdrop-blur-sm border-yellow-500/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{totalAgentRevenue} FLOAI</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
          <TabsTrigger value="overview" className="text-white data-[state=active]:bg-purple-500">
            Overview
          </TabsTrigger>
          <TabsTrigger value="agents" className="text-white data-[state=active]:bg-purple-500">
            My Agents
          </TabsTrigger>
          <TabsTrigger value="credits" className="text-white data-[state=active]:bg-purple-500">
            Credits & Wallets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Free Generations */}
          <Card className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 backdrop-blur-sm border-cyan-500/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <span>Free Generations Today</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-white">{3 - userStats.freeGenerationsToday}/3</p>
                  <p className="text-sm text-gray-300">Free generations remaining</p>
                </div>
                <Badge variant={userStats.canUseFreeGeneration ? "default" : "destructive"}>
                  {userStats.canUseFreeGeneration ? 'Available' : 'Used Up'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 backdrop-blur-sm border-gray-600/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Account Overview</CardTitle>
              <Button 
                onClick={handleRefresh}
                disabled={refreshing}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {refreshing ? (
                  <div className="w-4 h-4 border-2 border-gray-300/30 border-t-gray-300 rounded-full animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white mb-3">Wallet Balances</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">FLOAI:</span>
                      <span className="text-white font-medium">{userStats.floaiBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">S Tokens:</span>
                      <span className="text-white font-medium">{userStats.sTokenBalance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-3">Generation Stats</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Generations:</span>
                      <span className="text-white font-medium">{userStats.totalGenerations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Active Agents:</span>
                      <span className="text-white font-medium">{userAgents.filter(a => a.isActive).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          {userAgents.length === 0 ? (
            <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 backdrop-blur-sm border-gray-600/50">
              <CardContent className="p-8 text-center">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-white mb-2">No Agents Yet</h3>
                <p className="text-gray-400 mb-4">
                  Mint your first AI agent to start generating content and earning revenue
                </p>
                <Button className="bg-purple-500 hover:bg-purple-600">
                  Mint Your First Agent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userAgents.map((agent) => (
                <Card 
                  key={agent.tokenId}
                  className={`bg-gradient-to-br ${AGENT_TYPE_COLORS[agent.agentType]} backdrop-blur-sm`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      {AGENT_TYPE_ICONS[agent.agentType]}
                      <span>{agent.name}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-gray-300 border-gray-500">
                        #{agent.tokenId}
                      </Badge>
                      <Badge variant={agent.isActive ? "default" : "secondary"}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Type:</span>
                        <div className="text-white font-medium capitalize">{agent.agentType}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Package:</span>
                        <div className="text-white font-medium">
                          {CREDIT_PACKAGE_NAMES[agent.creditPackageId]}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Generations:</span>
                        <div className="text-white font-medium">{agent.generationCount}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Revenue:</span>
                        <div className="text-green-400 font-medium">{agent.totalRevenue} FLOAI</div>
                      </div>
                    </div>
                    
                    {agent.totalRevenue > 0 && (
                      <Button
                        onClick={() => handleWithdraw(agent.tokenId)}
                        disabled={withdrawingAgent === agent.tokenId}
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {withdrawingAgent === agent.tokenId ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Withdrawing...</span>
                          </div>
                        ) : (
                          'Withdraw Revenue'
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="credits" className="space-y-6">
          {/* Credit Balances */}
          <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border-indigo-500/50">
            <CardHeader>
              <CardTitle className="text-white">Credit Balances</CardTitle>
              <CardDescription className="text-gray-300">
                Your current credit balances across all packages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(CREDIT_PACKAGE_NAMES).map(([packageId, name]) => (
                  <div key={packageId} className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <h4 className="font-medium text-white mb-2">{name}</h4>
                    <p className="text-2xl font-bold text-purple-400">
                      {userStats.creditBalances[parseInt(packageId)] || 0}
                    </p>
                    <p className="text-xs text-gray-400">credits</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Wallet Information */}
          <Card className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-sm border-green-500/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Wallet className="h-5 w-5 text-green-400" />
                <span>Wallet Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white mb-3">Token Balances</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-300">FLOAI Tokens</span>
                      <span className="text-white font-medium">{userStats.floaiBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-300">S Tokens</span>
                      <span className="text-white font-medium">{userStats.sTokenBalance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-3">Wallet Address</h4>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Connected Address:</p>
                    <p className="text-white font-mono text-sm break-all">
                      {userStats.userAddress}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}