'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bot, Image, Video, MessageSquare, TrendingUp, Eye } from 'lucide-react';

interface AgentConfig {
  name: string;
  agentType: 'image' | 'video' | 'social' | 'nft_watcher' | 'token_analyst';
  instructions: string;
  tools: string[];
  connections: string[];
  floaiPerOperation: number;
  creditPackageId: number;
}

const AGENT_TYPES = [
  {
    id: 'image',
    name: 'Image Generator',
    icon: <Image className="h-5 w-5" />,
    description: 'AI agent specialized in creating stunning images from text prompts',
    tools: ['DALL-E', 'Stable Diffusion', 'Midjourney API', 'Flux'],
    baseOperationCost: 100
  },
  {
    id: 'video',
    name: 'Video Creator',
    icon: <Video className="h-5 w-5" />,
    description: 'AI agent for generating and editing video content',
    tools: ['RunwayML', 'Pika Labs', 'Stable Video', 'Custom Models'],
    baseOperationCost: 250
  },
  {
    id: 'social',
    name: 'Social Media Manager',
    icon: <MessageSquare className="h-5 w-5" />,
    description: 'AI agent for creating and managing social media content',
    tools: ['GPT-4', 'Claude', 'Content Scheduler', 'Analytics'],
    baseOperationCost: 50
  },
  {
    id: 'nft_watcher',
    name: 'NFT Market Watcher',
    icon: <Eye className="h-5 w-5" />,
    description: 'AI agent for monitoring and analyzing NFT markets',
    tools: ['OpenSea API', 'Blur API', 'On-chain Analytics', 'Price Alerts'],
    baseOperationCost: 75
  },
  {
    id: 'token_analyst',
    name: 'Token Analyst',
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'AI agent for cryptocurrency and token analysis',
    tools: ['CoinGecko API', 'DeFiLlama', 'On-chain Data', 'Technical Analysis'],
    baseOperationCost: 100
  }
];

const CREDIT_PACKAGES = [
  { id: 0, name: 'Starter', tier: 'Basic models only' },
  { id: 1, name: 'Creator', tier: 'All models + premium features' },
  { id: 2, name: 'Professional', tier: 'Advanced models + integrations' },
  { id: 3, name: 'Enterprise', tier: 'Custom models + white-label' }
];

interface AgentMintingCardProps {
  userAddress?: string;
  onMint: (config: AgentConfig, paymentType: 'floai' | 's_tokens') => Promise<void>;
  loading?: boolean;
  userFLOAIBalance?: number;
  userSBalance?: number;
}

export function AgentMintingCard({ 
  userAddress, 
  onMint, 
  loading,
  userFLOAIBalance = 0,
  userSBalance = 0 
}: AgentMintingCardProps) {
  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    agentType: 'image',
    instructions: '',
    tools: [],
    connections: [],
    floaiPerOperation: 100,
    creditPackageId: 0
  });
  
  const [paymentType, setPaymentType] = useState<'floai' | 's_tokens'>('s_tokens');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  const selectedAgentType = AGENT_TYPES.find(type => type.id === config.agentType);
  const mintCostS = 50; // 50 S tokens
  const mintCostFLOAI = 5000; // 5000 FLOAI tokens

  const canAffordMint = paymentType === 's_tokens' 
    ? userSBalance >= mintCostS 
    : userFLOAIBalance >= mintCostFLOAI;

  const handleToolToggle = (tool: string) => {
    const newTools = selectedTools.includes(tool)
      ? selectedTools.filter(t => t !== tool)
      : [...selectedTools, tool];
    
    setSelectedTools(newTools);
    setConfig(prev => ({ ...prev, tools: newTools }));
  };

  const handleMint = async () => {
    if (!userAddress || !config.name || !config.instructions) return;
    
    const finalConfig = {
      ...config,
      tools: selectedTools,
      floaiPerOperation: selectedAgentType?.baseOperationCost || 100
    };
    
    await onMint(finalConfig, paymentType);
  };

  const isFormValid = config.name && config.instructions && selectedTools.length > 0;

  return (
    <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border-indigo-500/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Bot className="h-6 w-6 text-purple-400" />
          <span>Mint ServiceFlow iNFT Agent</span>
        </CardTitle>
        <CardDescription className="text-gray-300">
          Create your own AI agent NFT with specialized capabilities and earn revenue from usage
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Agent Basic Info */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-gray-200">Agent Name</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My AI Assistant"
              className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div>
            <Label htmlFor="agentType" className="text-gray-200">Agent Type</Label>
            <Select 
              value={config.agentType} 
              onValueChange={(value: any) => {
                setConfig(prev => ({ ...prev, agentType: value }));
                setSelectedTools([]); // Reset tools when type changes
              }}
            >
              <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                <SelectValue placeholder="Select agent type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {AGENT_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id} className="text-white hover:bg-gray-700">
                    <div className="flex items-center space-x-2">
                      {type.icon}
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-xs text-gray-400">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="instructions" className="text-gray-200">Instructions & Behavior</Label>
            <Textarea
              id="instructions"
              value={config.instructions}
              onChange={(e) => setConfig(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Describe how your agent should behave, its personality, and specific instructions..."
              rows={4}
              className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Tools Selection */}
        {selectedAgentType && (
          <div>
            <Label className="text-gray-200">Available Tools</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {selectedAgentType.tools.map((tool) => (
                <Button
                  key={tool}
                  variant={selectedTools.includes(tool) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToolToggle(tool)}
                  className={`${
                    selectedTools.includes(tool)
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {tool}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Credit Package Selection */}
        <div>
          <Label className="text-gray-200">Credit Package Tier</Label>
          <Select 
            value={config.creditPackageId.toString()} 
            onValueChange={(value) => setConfig(prev => ({ ...prev, creditPackageId: parseInt(value) }))}
          >
            <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
              <SelectValue placeholder="Select credit package" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {CREDIT_PACKAGES.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id.toString()} className="text-white hover:bg-gray-700">
                  <div>
                    <div className="font-medium">{pkg.name}</div>
                    <div className="text-xs text-gray-400">{pkg.tier}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Method Selection */}
        <div>
          <Label className="text-gray-200">Payment Method</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Card 
              className={`cursor-pointer transition-all ${
                paymentType === 's_tokens' 
                  ? 'ring-2 ring-purple-500 bg-purple-500/20' 
                  : 'bg-gray-800/50 hover:bg-gray-700/50'
              }`}
              onClick={() => setPaymentType('s_tokens')}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{mintCostS}</div>
                <div className="text-sm text-gray-300">S Tokens</div>
                <Badge variant={userSBalance >= mintCostS ? "default" : "destructive"} className="mt-2">
                  Balance: {userSBalance.toFixed(2)}
                </Badge>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${
                paymentType === 'floai' 
                  ? 'ring-2 ring-purple-500 bg-purple-500/20' 
                  : 'bg-gray-800/50 hover:bg-gray-700/50'
              }`}
              onClick={() => setPaymentType('floai')}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{mintCostFLOAI.toLocaleString()}</div>
                <div className="text-sm text-gray-300">FLOAI</div>
                <Badge variant={userFLOAIBalance >= mintCostFLOAI ? "default" : "destructive"} className="mt-2">
                  Balance: {userFLOAIBalance.toLocaleString()}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Agent Revenue Info */}
        {selectedAgentType && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <h4 className="text-green-400 font-medium mb-2">Revenue Potential</h4>
            <p className="text-sm text-gray-300">
              Base cost per operation: {selectedAgentType.baseOperationCost} FLOAI tokens
            </p>
            <p className="text-xs text-gray-400 mt-1">
              You'll earn revenue when users pay to use your agent for generations
            </p>
          </div>
        )}

        {/* Mint Button */}
        <Button
          onClick={handleMint}
          disabled={!userAddress || !isFormValid || !canAffordMint || loading}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          size="lg"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Minting Agent...</span>
            </div>
          ) : !userAddress ? (
            'Connect Wallet to Mint'
          ) : !canAffordMint ? (
            `Insufficient ${paymentType === 's_tokens' ? 'S Tokens' : 'FLOAI'}`
          ) : (
            `Mint Agent with ${paymentType === 's_tokens' ? 'S Tokens' : 'FLOAI'}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}