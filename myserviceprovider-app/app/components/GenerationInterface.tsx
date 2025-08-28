'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Image, Video, MessageSquare, Sparkles, Zap, Download, Eye } from 'lucide-react';

interface UserAgent {
  tokenId: number;
  name: string;
  agentType: 'image' | 'video' | 'social' | 'nft_watcher' | 'token_analyst';
  creditPackageId: number;
  generationCount: number;
  totalRevenue: number;
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

interface GenerationResult {
  success: boolean;
  contentURI?: string;
  generatedContent?: any;
  creditsUsed?: number;
  modelUsed?: string;
  error?: string;
}

const GENERATION_COSTS = {
  image: 200,
  video: 500,
  social: 50
};

const AGENT_TYPE_ICONS = {
  image: <Image className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  social: <MessageSquare className="h-5 w-5" />,
  nft_watcher: <Eye className="h-5 w-5" />,
  token_analyst: <Sparkles className="h-5 w-5" />
};

interface GenerationInterfaceProps {
  userAddress?: string;
  userAgents: UserAgent[];
  userCredits: { [packageId: number]: number };
  onGenerate: (request: GenerationRequest) => Promise<GenerationResult>;
  loading?: boolean;
}

export function GenerationInterface({ 
  userAddress, 
  userAgents, 
  userCredits, 
  onGenerate, 
  loading 
}: GenerationInterfaceProps) {
  const [selectedAgent, setSelectedAgent] = useState<UserAgent | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generationSettings, setGenerationSettings] = useState({
    width: 1024,
    height: 1024,
    steps: 4,
    duration: 3
  });
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter agents that can generate content
  const generativeAgents = userAgents.filter(agent => 
    ['image', 'video', 'social'].includes(agent.agentType)
  );

  const selectedAgentCredits = selectedAgent 
    ? userCredits[selectedAgent.creditPackageId] || 0 
    : 0;

  const requiredCredits = selectedAgent 
    ? GENERATION_COSTS[selectedAgent.agentType] 
    : 0;

  const canGenerate = selectedAgent && 
    prompt.trim() && 
    selectedAgentCredits >= requiredCredits;

  const handleGenerate = async () => {
    if (!selectedAgent || !canGenerate) return;

    setIsGenerating(true);
    setGenerationResult(null);

    try {
      const request: GenerationRequest = {
        agentId: selectedAgent.tokenId,
        prompt: prompt.trim(),
        agentType: selectedAgent.agentType,
        ...(selectedAgent.agentType === 'image' && {
          width: generationSettings.width,
          height: generationSettings.height,
          steps: generationSettings.steps
        }),
        ...(selectedAgent.agentType === 'video' && {
          duration: generationSettings.duration
        })
      };

      const result = await onGenerate(request);
      setGenerationResult(result);

      if (result.success) {
        setPrompt(''); // Clear prompt on success
      }
    } catch (error: any) {
      setGenerationResult({
        success: false,
        error: error.message || 'Generation failed'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!userAddress) {
    return (
      <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm border-gray-700">
        <CardContent className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Zap className="h-12 w-12 mx-auto mb-2" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">
            Connect your wallet to start generating content with your AI agents
          </p>
        </CardContent>
      </Card>
    );
  }

  if (generativeAgents.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-sm border-purple-500/50">
        <CardContent className="p-8 text-center">
          <div className="text-purple-400 mb-4">
            <Sparkles className="h-12 w-12 mx-auto mb-2" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Generative Agents</h3>
          <p className="text-gray-300 mb-4">
            You need to mint an Image, Video, or Social Media agent to start generating content
          </p>
          <Button className="bg-purple-500 hover:bg-purple-600">
            Mint Your First Agent
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Selection */}
      <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border-indigo-500/50">
        <CardHeader>
          <CardTitle className="text-white">Select Agent for Generation</CardTitle>
          <CardDescription className="text-gray-300">
            Choose which AI agent to use for content generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generativeAgents.map((agent) => (
              <Card
                key={agent.tokenId}
                className={`cursor-pointer transition-all ${
                  selectedAgent?.tokenId === agent.tokenId
                    ? 'ring-2 ring-purple-500 bg-purple-500/20'
                    : 'bg-gray-800/50 hover:bg-gray-700/50'
                }`}
                onClick={() => setSelectedAgent(agent)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-purple-400">
                      {AGENT_TYPE_ICONS[agent.agentType]}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{agent.name}</h4>
                      <p className="text-xs text-gray-400 capitalize">
                        {agent.agentType} Agent
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Credits Available:</span>
                      <Badge variant={userCredits[agent.creditPackageId] >= GENERATION_COSTS[agent.agentType] ? "default" : "destructive"}>
                        {userCredits[agent.creditPackageId] || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Generations:</span>
                      <span className="text-white">{agent.generationCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Revenue:</span>
                      <span className="text-green-400">{agent.totalRevenue} FLOAI</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generation Interface */}
      {selectedAgent && (
        <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-sm border-purple-500/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              {AGENT_TYPE_ICONS[selectedAgent.agentType]}
              <span>Generate with {selectedAgent.name}</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Cost: {requiredCredits} credits per generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prompt Input */}
            <div>
              <Label htmlFor="prompt" className="text-gray-200">Prompt</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Describe what you want to ${selectedAgent.agentType === 'social' ? 'write about' : 'generate'}...`}
                rows={3}
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            {/* Generation Settings */}
            {selectedAgent.agentType === 'image' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-200">Width</Label>
                  <Input
                    type="number"
                    value={generationSettings.width}
                    onChange={(e) => setGenerationSettings(prev => ({ 
                      ...prev, 
                      width: parseInt(e.target.value) || 1024 
                    }))}
                    min={256}
                    max={2048}
                    step={64}
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Height</Label>
                  <Input
                    type="number"
                    value={generationSettings.height}
                    onChange={(e) => setGenerationSettings(prev => ({ 
                      ...prev, 
                      height: parseInt(e.target.value) || 1024 
                    }))}
                    min={256}
                    max={2048}
                    step={64}
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Steps: {generationSettings.steps}</Label>
                  <Slider
                    value={[generationSettings.steps]}
                    onValueChange={([value]) => setGenerationSettings(prev => ({ 
                      ...prev, 
                      steps: value 
                    }))}
                    min={1}
                    max={8}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {selectedAgent.agentType === 'video' && (
              <div>
                <Label className="text-gray-200">Duration: {generationSettings.duration} seconds</Label>
                <Slider
                  value={[generationSettings.duration]}
                  onValueChange={([value]) => setGenerationSettings(prev => ({ 
                    ...prev, 
                    duration: value 
                  }))}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>
            )}

            {/* Credit Balance Warning */}
            {selectedAgentCredits < requiredCredits && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-300">
                  Insufficient credits. You need {requiredCredits} credits but only have {selectedAgentCredits}.
                </p>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              size="lg"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </div>
              ) : (
                `Generate ${selectedAgent.agentType} (${requiredCredits} credits)`
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generation Result */}
      {generationResult && (
        <Card className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-sm border-green-500/50">
          <CardHeader>
            <CardTitle className="text-white">
              {generationResult.success ? 'Generation Complete!' : 'Generation Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generationResult.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Credits Used:</span>
                    <div className="text-white font-medium">{generationResult.creditsUsed}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Model Used:</span>
                    <div className="text-white font-medium">{generationResult.modelUsed}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Content URI:</span>
                    <div className="text-blue-400 text-xs break-all">{generationResult.contentURI}</div>
                  </div>
                  <div>
                    <Button size="sm" className="w-full" asChild>
                      <a href={generationResult.contentURI} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
                
                {selectedAgent?.agentType === 'image' && generationResult.contentURI && (
                  <div className="mt-4">
                    <img 
                      src={generationResult.contentURI} 
                      alt="Generated content"
                      className="max-w-full h-auto rounded-lg border border-gray-600"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-300">
                Error: {generationResult.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}