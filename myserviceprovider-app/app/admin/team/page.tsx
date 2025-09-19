"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import { 
  Bot,
  MessageCircle,
  Settings,
  Activity,
  Database,
  Code,
  Globe,
  Users,
  Terminal,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Monitor,
  Server,
  Cpu,
  Zap,
  FileText,
  Eye,
  Download,
  Upload
} from "lucide-react"

import { isAuthorizedTeamMember } from '@/lib/auth-config'

interface TeamAgent {
  id: string
  name: string
  type: 'content' | 'facebook' | 'google' | 'cloudflare' | 'data_scraper' | 'building_code' | 'srvcflo_team'
  status: 'running' | 'stopped' | 'error' | 'starting'
  description: string
  lastActive: Date
  endpoint?: string
  logs: string[]
  config: Record<string, any>
}

interface AgentCommand {
  agent_id: string
  command: string
  parameters?: Record<string, any>
}

interface ChatMessage {
  id: string
  agent: string
  message: string
  response?: string
  timestamp: Date
  status: 'sending' | 'completed' | 'error'
}

const AGENT_TYPES = {
  content: {
    name: 'Content Agent',
    icon: FileText,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'Autonomous content creation and social media management'
  },
  facebook: {
    name: 'Facebook Agent',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    borderColor: 'border-blue-600/30',
    description: 'Facebook Pages management and posting automation'
  },
  google: {
    name: 'Google Agent',
    icon: Globe,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    description: 'Gmail and Google Calendar operations management'
  },
  cloudflare: {
    name: 'Cloudflare Agent',
    icon: Server,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description: 'Cloudflare Workers and deployment management'
  },
  data_scraper: {
    name: 'Data Scraper Agent',
    icon: Database,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Web scraping and data collection automation'
  },
  building_code: {
    name: 'Building Code Agent',
    icon: Code,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    description: 'Code generation and development assistance'
  },
  srvcflo_team: {
    name: 'ServiceFlow Team Agent',
    icon: Bot,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    description: 'Team coordination and workflow management'
  }
}

export default function TeamAdminDashboard() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  
  const [agents, setAgents] = useState<TeamAgent[]>([
    {
      id: 'content_agent',
      name: 'Content Agent',
      type: 'content',
      status: 'running',
      description: 'Managing X (Twitter) posts and blog content',
      lastActive: new Date(),
      endpoint: 'http://localhost:8001/content',
      logs: [
        '[2025-08-28 17:20:15] Agent started successfully',
        '[2025-08-28 17:20:16] Connected to X API',
        '[2025-08-28 17:20:17] Connected to OpenAI',
        '[2025-08-28 17:20:18] Ready for content generation'
      ],
      config: {
        posting_schedule: '4-5 times daily',
        rate_limit: 'enabled',
        auto_engage: true
      }
    },
    {
      id: 'facebook_agent',
      name: 'Facebook Agent',
      type: 'facebook',
      status: 'stopped',
      description: 'Facebook Pages management and analytics',
      lastActive: new Date(Date.now() - 300000),
      endpoint: 'http://localhost:8002/facebook',
      logs: [
        '[2025-08-28 17:15:30] Agent stopped by user',
        '[2025-08-28 17:15:29] Disconnected from Facebook API',
        '[2025-08-28 17:15:28] Saved session state'
      ],
      config: {
        page_management: true,
        analytics_enabled: true,
        auto_comment: false
      }
    },
    {
      id: 'google_agent',
      name: 'Google Agent',
      type: 'google',
      status: 'running',
      description: 'Gmail and Calendar automation',
      lastActive: new Date(Date.now() - 60000),
      endpoint: 'http://localhost:8003/google',
      logs: [
        '[2025-08-28 17:19:00] Processing email queue',
        '[2025-08-28 17:18:45] Calendar sync completed',
        '[2025-08-28 17:18:30] 3 emails sent successfully'
      ],
      config: {
        email_automation: true,
        calendar_sync: true,
        timezone: 'UTC'
      }
    }
  ])
  
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [commandInput, setCommandInput] = useState('')
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Check team authorization
  useEffect(() => {
    if (isConnected && address) {
      const authorized = isAuthorizedTeamMember(address)
      setIsAuthorized(authorized)
      
      if (!authorized) {
        router.push('/admin')
      }
    } else {
      router.push('/admin')
    }
  }, [address, isConnected, router])

  const executeAgentCommand = async (agentId: string, command: string, parameters?: Record<string, any>) => {
    try {
      const agent = agents.find(a => a.id === agentId)
      if (!agent || !agent.endpoint) {
        throw new Error('Agent not found or no endpoint available')
      }

      const response = await fetch(`${agent.endpoint}/${command}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('team_auth_token')}` // Team auth token
        },
        body: JSON.stringify({ parameters })
      })

      if (!response.ok) {
        throw new Error(`Command failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Update agent logs
      setAgents(prev => prev.map(a => 
        a.id === agentId 
          ? { 
              ...a, 
              logs: [
                `[${new Date().toLocaleString()}] Command executed: ${command}`,
                ...a.logs.slice(0, 9) // Keep last 10 logs
              ],
              lastActive: new Date()
            }
          : a
      ))

      return result
    } catch (error) {
      console.error('Agent command error:', error)
      throw error
    }
  }

  const sendChatMessage = async (agentId: string, message: string) => {
    const messageId = Date.now().toString()
    const newMessage: ChatMessage = {
      id: messageId,
      agent: agentId,
      message,
      timestamp: new Date(),
      status: 'sending'
    }

    setChatMessages(prev => [...prev, newMessage])
    setChatInput('')

    try {
      const result = await executeAgentCommand(agentId, 'chat', { message })
      
      setChatMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              response: result.response || 'Command executed successfully',
              status: 'completed' 
            }
          : msg
      ))
    } catch (error) {
      setChatMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              status: 'error' 
            }
          : msg
      ))
    }
  }

  const startAgent = async (agentId: string) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, status: 'starting' as const } : a
    ))

    try {
      await executeAgentCommand(agentId, 'start')
      setAgents(prev => prev.map(a => 
        a.id === agentId ? { ...a, status: 'running' as const } : a
      ))
    } catch (error) {
      setAgents(prev => prev.map(a => 
        a.id === agentId ? { ...a, status: 'error' as const } : a
      ))
    }
  }

  const stopAgent = async (agentId: string) => {
    try {
      await executeAgentCommand(agentId, 'stop')
      setAgents(prev => prev.map(a => 
        a.id === agentId ? { ...a, status: 'stopped' as const } : a
      ))
    } catch (error) {
      console.error('Failed to stop agent:', error)
    }
  }

  const restartAgent = async (agentId: string) => {
    await stopAgent(agentId)
    setTimeout(() => startAgent(agentId), 2000)
  }

  if (!isConnected || !isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-400 text-lg">Verifying team access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
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
                    TEAM AGENT CONTROL CENTER
                  </h1>
                  <p className="text-gray-400 text-sm">ServiceFlow AI Backend Agent Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Users className="h-3 w-3 mr-1" />
                Team Access
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </Badge>
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
              Backend Agents
            </TabsTrigger>
            <TabsTrigger value="monitor" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Monitor className="h-4 w-4 mr-2" />
              System Monitor
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              <MessageCircle className="h-4 w-4 mr-2" />
              Agent Chat
            </TabsTrigger>
            <TabsTrigger value="commands" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              <Terminal className="h-4 w-4 mr-2" />
              Commands
            </TabsTrigger>
          </TabsList>

          {/* Backend Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => {
                const AgentIcon = AGENT_TYPES[agent.type].icon
                return (
                  <Card 
                    key={agent.id} 
                    className={`bg-gray-900/50 ${AGENT_TYPES[agent.type].borderColor} backdrop-blur-sm`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge className={`${AGENT_TYPES[agent.type].bgColor} ${AGENT_TYPES[agent.type].color} border-0`}>
                          <AgentIcon className="h-3 w-3 mr-1" />
                          {agent.type}
                        </Badge>
                        <Badge 
                          className={`${
                            agent.status === 'running' ? 'bg-green-500/20 text-green-400' : 
                            agent.status === 'starting' ? 'bg-yellow-500/20 text-yellow-400' :
                            agent.status === 'error' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          } border-0`}
                        >
                          {agent.status === 'running' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {agent.status === 'starting' && <Clock className="h-3 w-3 mr-1" />}
                          {agent.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {agent.status === 'stopped' && <Pause className="h-3 w-3 mr-1" />}
                          {agent.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-white">{agent.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {agent.description}
                        </p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className={`
                            ${agent.status === 'running' ? 'text-green-400' : ''}
                            ${agent.status === 'error' ? 'text-red-400' : ''}
                            ${agent.status === 'stopped' ? 'text-gray-400' : ''}
                            ${agent.status === 'starting' ? 'text-yellow-400' : ''}
                          `}>
                            {agent.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Active:</span>
                          <span className="text-white text-xs">
                            {agent.lastActive.toLocaleTimeString()}
                          </span>
                        </div>
                        {agent.endpoint && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Endpoint:</span>
                            <span className="text-blue-400 text-xs font-mono">
                              {agent.endpoint.replace('http://localhost:', ':')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        {agent.status === 'stopped' || agent.status === 'error' ? (
                          <Button 
                            size="sm" 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-black"
                            onClick={() => startAgent(agent.id)}
                            disabled={agent.status === 'starting'}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="flex-1"
                            onClick={() => stopAgent(agent.id)}
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Stop
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-800"
                          onClick={() => restartAgent(agent.id)}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-800"
                          onClick={() => setSelectedAgent(agent.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Agent Details Modal */}
            {selectedAgent && (
              <Card className="bg-gray-900/50 border-green-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>Agent Details - {agents.find(a => a.id === selectedAgent)?.name}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedAgent(null)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Close
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const agent = agents.find(a => a.id === selectedAgent)
                    if (!agent) return null
                    
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-green-400 font-semibold mb-2">Configuration</h4>
                            <div className="bg-gray-800/50 rounded-lg p-3 text-sm">
                              {Object.entries(agent.config).map(([key, value]) => (
                                <div key={key} className="flex justify-between mb-1">
                                  <span className="text-gray-400">{key}:</span>
                                  <span className="text-white">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-blue-400 font-semibold mb-2">Recent Logs</h4>
                            <div className="bg-gray-800/50 rounded-lg p-3 text-xs font-mono max-h-40 overflow-y-auto">
                              {agent.logs.map((log, index) => (
                                <div key={index} className="text-gray-300 mb-1">
                                  {log}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Agent Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <Card className="bg-gray-900/50 border-purple-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageCircle className="h-5 w-5 text-purple-500 mr-2" />
                  Team Agent Chat Interface
                </CardTitle>
                <p className="text-gray-400">Direct communication with backend agents</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Agent Selection */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {agents.filter(agent => agent.status === 'running').map((agent) => {
                    const AgentIcon = AGENT_TYPES[agent.type].icon
                    return (
                      <Button
                        key={agent.id}
                        variant={selectedAgent === agent.id ? "default" : "outline"}
                        className={`h-auto p-3 ${AGENT_TYPES[agent.type].borderColor} ${
                          selectedAgent === agent.id 
                            ? `${AGENT_TYPES[agent.type].bgColor} ${AGENT_TYPES[agent.type].color}` 
                            : 'hover:bg-gray-800'
                        }`}
                        onClick={() => setSelectedAgent(agent.id)}
                      >
                        <div className="text-center">
                          <AgentIcon className={`h-5 w-5 mx-auto mb-1 ${AGENT_TYPES[agent.type].color}`} />
                          <div className="text-xs font-medium">{agent.name}</div>
                        </div>
                      </Button>
                    )
                  })}
                </div>

                {/* Chat Messages */}
                {selectedAgent && (
                  <div className="space-y-4">
                    <div className="bg-gray-800/50 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                      {chatMessages
                        .filter(msg => msg.agent === selectedAgent)
                        .map((message) => (
                          <div key={message.id} className="mb-4">
                            <div className="flex items-start space-x-3">
                              <div className="bg-blue-600 rounded-full p-2">
                                <Users className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="bg-blue-600/20 rounded-lg p-3 text-white">
                                  {message.message}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {message.timestamp.toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                            
                            {message.response && (
                              <div className="flex items-start space-x-3 mt-3 ml-12">
                                <div className="bg-green-600 rounded-full p-2">
                                  <Bot className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className={`rounded-lg p-3 ${
                                    message.status === 'error' 
                                      ? 'bg-red-600/20 text-red-300' 
                                      : 'bg-green-600/20 text-green-300'
                                  }`}>
                                    {message.response}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    Agent Response • {message.status}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>

                    {/* Chat Input */}
                    <div className="flex space-x-2">
                      <Input
                        placeholder={`Send command to ${agents.find(a => a.id === selectedAgent)?.name}...`}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && chatInput.trim() && selectedAgent) {
                            sendChatMessage(selectedAgent, chatInput)
                          }
                        }}
                      />
                      <Button 
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => {
                          if (chatInput.trim() && selectedAgent) {
                            sendChatMessage(selectedAgent, chatInput)
                          }
                        }}
                        disabled={!chatInput.trim() || !selectedAgent}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commands Tab */}
          <TabsContent value="commands" className="space-y-6">
            <Card className="bg-gray-900/50 border-yellow-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Terminal className="h-5 w-5 text-yellow-500 mr-2" />
                  Agent Command Console
                </CardTitle>
                <p className="text-gray-400">Execute direct commands on backend agents</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Select Agent</label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
                      value={selectedAgent || ''}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                    >
                      <option value="">Choose agent...</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({agent.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Command</label>
                    <Input
                      placeholder="e.g., status, restart, config_update"
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>
                
                <Button 
                  className="bg-yellow-600 hover:bg-yellow-700 text-black"
                  onClick={() => {
                    if (selectedAgent && commandInput.trim()) {
                      executeAgentCommand(selectedAgent, commandInput)
                        .then(() => setCommandInput(''))
                        .catch(console.error)
                    }
                  }}
                  disabled={!selectedAgent || !commandInput.trim()}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Execute Command
                </Button>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-yellow-400 font-semibold mb-2">Available Commands:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <div className="text-gray-300">• start</div>
                    <div className="text-gray-300">• stop</div>
                    <div className="text-gray-300">• restart</div>
                    <div className="text-gray-300">• status</div>
                    <div className="text-gray-300">• config</div>
                    <div className="text-gray-300">• logs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Monitor Tab */}
          <TabsContent value="monitor" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-900/50 border-green-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-400 text-sm font-medium">Active Agents</p>
                      <p className="text-2xl font-bold text-white">
                        {agents.filter(a => a.status === 'running').length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-red-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-400 text-sm font-medium">Stopped Agents</p>
                      <p className="text-2xl font-bold text-white">
                        {agents.filter(a => a.status === 'stopped' || a.status === 'error').length}
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-blue-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-400 text-sm font-medium">Total Agents</p>
                      <p className="text-2xl font-bold text-white">{agents.length}</p>
                    </div>
                    <Bot className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900/50 border-purple-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          agent.status === 'running' ? 'bg-green-500' : 
                          agent.status === 'error' ? 'bg-red-500' :
                          agent.status === 'starting' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-white">{agent.name}</span>
                        <span className="text-xs text-gray-400">({agent.type})</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm ${
                          agent.status === 'running' ? 'text-green-400' : 
                          agent.status === 'error' ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {agent.status}
                        </div>
                        <div className="text-xs text-gray-400">
                          {agent.lastActive.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}