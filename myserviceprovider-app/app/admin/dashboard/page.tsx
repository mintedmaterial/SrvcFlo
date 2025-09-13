"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import { 
  Bot,
  Image as ImageIcon,
  Eye,
  TrendingUp,
  Users,
  MessageCircle,
  Zap,
  Settings,
  PlusCircle,
  Activity,
  BarChart3,
  Wallet,
  Sparkles,
  Monitor,
  Camera,
  Coins,
  ChevronRight,
  ExternalLink,
  RefreshCw
} from "lucide-react"

interface iNFTAgent {
  id: string
  tokenId: number
  type: 'image' | 'nft-watcher' | 'pair-monitor' | 'social'
  name: string
  image: string
  status: 'active' | 'inactive' | 'minting'
  lastActive: Date
  usageCount: number
  earnings: number
}

interface AgentStats {
  totalAgents: number
  activeAgents: number
  totalGenerations: number
  totalEarnings: number
}

const AGENT_TYPES = {
  image: {
    name: 'Image Generation Agent',
    icon: ImageIcon,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'AI-powered image generation with custom prompts'
  },
  'nft-watcher': {
    name: 'NFT Watcher Agent', 
    icon: Eye,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Monitor PaintSwap collections and marketplace activity'
  },
  'pair-monitor': {
    name: 'Pair Monitor Agent',
    icon: TrendingUp,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    description: 'Real-time DexScreener pair monitoring and alerts'
  },
  social: {
    name: 'Social Media Agent',
    icon: Users,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    description: 'Automated social media management and posting'
  }
}

export default function iNFTAgentDashboard() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  
  // State management
  const [agents, setAgents] = useState<iNFTAgent[]>([
    {
      id: '1',
      tokenId: 1001,
      type: 'image',
      name: 'CyberGen Alpha',
      image: '/api/placeholder/150/150',
      status: 'active',
      lastActive: new Date(),
      usageCount: 45,
      earnings: 12.5
    },
    {
      id: '2', 
      tokenId: 1002,
      type: 'pair-monitor',
      name: 'SonicWatch Pro',
      image: '/api/placeholder/150/150',
      status: 'active', 
      lastActive: new Date(Date.now() - 30000),
      usageCount: 128,
      earnings: 8.75
    }
  ])
  
  const [stats, setStats] = useState<AgentStats>({
    totalAgents: 2,
    activeAgents: 2,
    totalGenerations: 173,
    totalEarnings: 21.25
  })
  
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Check authorization
  useEffect(() => {
    if (!isConnected) {
      router.push('/admin')
    }
  }, [isConnected, router])

  const handleMintAgent = (type: keyof typeof AGENT_TYPES) => {
    setLoading(true)
    // Simulate minting process
    setTimeout(() => {
      const newAgent: iNFTAgent = {
        id: (Date.now()).toString(),
        tokenId: 1000 + agents.length + 1,
        type,
        name: `${AGENT_TYPES[type].name} #${agents.length + 1}`,
        image: '/api/placeholder/150/150',
        status: 'minting',
        lastActive: new Date(),
        usageCount: 0,
        earnings: 0
      }
      
      setAgents([...agents, newAgent])
      setStats(prev => ({ ...prev, totalAgents: prev.totalAgents + 1 }))
      setLoading(false)
    }, 3000)
  }

  const handleChatWithAgent = (agentId: string, message: string) => {
    console.log(`Chat with agent ${agentId}: ${message}`)
    setChatMessage('')
    // Implement actual chat functionality
  }

  if (!isConnected) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-green-400">Connecting...</div>
    </div>
  }

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      {/* Cyberpunk background effects */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2300ff41" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-gray-800/50 backdrop-blur-sm bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bot className="h-8 w-8 text-green-500" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent">
                    iNFT AGENT DASHBOARD
                  </h1>
                  <p className="text-gray-400 text-sm">Intelligent NFT Agent Management System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Wallet className="h-3 w-3 mr-1" />
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList className="bg-gray-900/50 border border-gray-700 backdrop-blur-sm">
            <TabsTrigger value="agents" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Bot className="h-4 w-4 mr-2" />
              My Agents
            </TabsTrigger>
            <TabsTrigger value="mint" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <PlusCircle className="h-4 w-4 mr-2" />
              Mint Agent
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              <MessageCircle className="h-4 w-4 mr-2" />
              Agent Chat
            </TabsTrigger>
          </TabsList>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-900/50 border-green-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 text-sm font-medium">Total Agents</p>
                    <p className="text-2xl font-bold text-white">{stats.totalAgents}</p>
                  </div>
                  <Bot className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-blue-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 text-sm font-medium">Active Now</p>
                    <p className="text-2xl font-bold text-white">{stats.activeAgents}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-purple-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 text-sm font-medium">Total Usage</p>
                    <p className="text-2xl font-bold text-white">{stats.totalGenerations}</p>
                  </div>
                  <Zap className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-yellow-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">Total Earnings</p>
                    <p className="text-2xl font-bold text-white">${stats.totalEarnings}</p>
                  </div>
                  <Coins className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => {
                const AgentIcon = AGENT_TYPES[agent.type].icon
                return (
                  <Card 
                    key={agent.id} 
                    className={`bg-gray-900/50 ${AGENT_TYPES[agent.type].borderColor} backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer`}
                    onClick={() => setSelectedAgent(agent.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge className={`${AGENT_TYPES[agent.type].bgColor} ${AGENT_TYPES[agent.type].color} border-0`}>
                          <AgentIcon className="h-3 w-3 mr-1" />
                          #{agent.tokenId}
                        </Badge>
                        <Badge 
                          className={`${
                            agent.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                            agent.status === 'minting' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          } border-0`}
                        >
                          {agent.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-3 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 flex items-center justify-center">
                          <AgentIcon className={`h-12 w-12 ${AGENT_TYPES[agent.type].color}`} />
                        </div>
                        <h3 className="font-semibold text-white">{agent.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {AGENT_TYPES[agent.type].description}
                        </p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Usage:</span>
                          <span className="text-white">{agent.usageCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Earnings:</span>
                          <span className="text-green-400">${agent.earnings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Active:</span>
                          <span className="text-white text-xs">
                            {agent.lastActive.toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-black"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Navigate to agent interface
                          }}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Chat
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-800"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Open settings
                          }}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Mint Agent Tab */}
          <TabsContent value="mint" className="space-y-6">
            <Card className="bg-gray-900/50 border-green-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <PlusCircle className="h-5 w-5 text-green-500 mr-2" />
                  Mint New iNFT Agent
                </CardTitle>
                <p className="text-gray-400">Create a new intelligent NFT agent with specialized capabilities</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(AGENT_TYPES).map(([type, config]) => {
                    const Icon = config.icon
                    return (
                      <Card 
                        key={type}
                        className={`${config.bgColor} ${config.borderColor} cursor-pointer hover:scale-105 transition-transform`}
                        onClick={() => handleMintAgent(type as keyof typeof AGENT_TYPES)}
                      >
                        <CardContent className="p-6 text-center space-y-4">
                          <div className="flex justify-center">
                            <div className={`p-4 rounded-full ${config.bgColor}`}>
                              <Icon className={`h-8 w-8 ${config.color}`} />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white mb-2">{config.name}</h3>
                            <p className="text-gray-400 text-sm">{config.description}</p>
                          </div>
                          <Button 
                            className={`w-full bg-green-600 hover:bg-green-700 text-black ${loading ? 'opacity-50' : ''}`}
                            disabled={loading}
                          >
                            {loading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                            ) : (
                              <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            Mint Agent
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold mb-2">Minting Process:</h4>
                  <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                    <li>Select agent type and provide custom prompt</li>
                    <li>Generate unique AI artwork using your prompt</li>
                    <li>Deploy agent smart contract with your artwork</li>
                    <li>Mint iNFT with embedded agent capabilities</li>
                    <li>Start earning from agent usage and interactions</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-purple-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Agent Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agents.map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            agent.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                          }`}></div>
                          <span className="text-white">{agent.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400">${agent.earnings}</div>
                          <div className="text-xs text-gray-400">{agent.usageCount} uses</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-yellow-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Agent Earnings (95%)</span>
                      <span className="text-green-400">${(stats.totalEarnings * 0.95).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Platform Fee (5%)</span>
                      <span className="text-yellow-400">${(stats.totalEarnings * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-700 pt-2">
                      <div className="flex justify-between items-center font-semibold">
                        <span className="text-white">Total Revenue</span>
                        <span className="text-green-400">${stats.totalEarnings}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Agent Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <Card className="bg-gray-900/50 border-green-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageCircle className="h-5 w-5 text-green-500 mr-2" />
                  Agent Communication Hub
                </CardTitle>
                <p className="text-gray-400">Interact with your iNFT agents directly</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {agents.filter(agent => agent.status === 'active').map((agent) => {
                    const AgentIcon = AGENT_TYPES[agent.type].icon
                    return (
                      <Button
                        key={agent.id}
                        variant="outline"
                        className={`h-auto p-4 ${AGENT_TYPES[agent.type].borderColor} hover:bg-gray-800`}
                        onClick={() => setSelectedAgent(agent.id)}
                      >
                        <div className="text-center">
                          <AgentIcon className={`h-6 w-6 mx-auto mb-2 ${AGENT_TYPES[agent.type].color}`} />
                          <div className="text-sm font-medium text-white">{agent.name}</div>
                          <div className="text-xs text-gray-400">#{agent.tokenId}</div>
                        </div>
                      </Button>
                    )
                  })}
                </div>

                {selectedAgent && (
                  <div className="border-t border-gray-700 pt-4">
                    <div className="bg-gray-800/50 rounded-lg p-4 mb-4 min-h-[200px]">
                      <div className="text-green-400 text-sm mb-2">
                        Agent #{agents.find(a => a.id === selectedAgent)?.tokenId} Response:
                      </div>
                      <div className="text-gray-300">
                        Ready to assist! What would you like me to help you with?
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type your message to the agent..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && chatMessage.trim()) {
                            handleChatWithAgent(selectedAgent, chatMessage)
                          }
                        }}
                      />
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-black"
                        onClick={() => chatMessage.trim() && handleChatWithAgent(selectedAgent, chatMessage)}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}