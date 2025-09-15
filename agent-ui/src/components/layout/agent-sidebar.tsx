"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type Agent } from "@/lib/agent-client"
import { type ConnectionStatus } from "@/hooks/use-agents"
import { formatTimeAgo } from "@/lib/utils"
import { BackgroundPaths } from "@/components/ui/background-paths"
import { 
  Bot, 
  FileText, 
  Globe, 
  Users, 
  Server, 
  Database, 
  Code, 
  Sparkles, 
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle
} from "lucide-react"

interface AgentSidebarProps {
  agents: Agent[]
  selectedAgentId: string | null
  onSelectAgent: (agentId: string) => void
  connectionStatus: ConnectionStatus
  onRefresh: () => void
}

const getAgentIcon = (type?: string) => {
  switch (type) {
    case 'content':
      return FileText
    case 'productivity':
      return Globe
    case 'social':
      return Users
    case 'infrastructure':
      return Server
    case 'specialist':
      return Database
    case 'analyst':
      return Code
    default:
      return Bot
  }
}

const getAgentTypeColor = (type?: string) => {
  switch (type) {
    case 'content':
      return 'text-blue-400 bg-blue-500/20'
    case 'productivity':
      return 'text-green-400 bg-green-500/20'
    case 'social':
      return 'text-purple-400 bg-purple-500/20'
    case 'infrastructure':
      return 'text-orange-400 bg-orange-500/20'
    case 'specialist':
      return 'text-yellow-400 bg-yellow-500/20'
    case 'analyst':
      return 'text-pink-400 bg-pink-500/20'
    default:
      return 'text-slate-400 bg-slate-500/20'
  }
}

const getStatusColor = (status: Agent['status']) => {
  switch (status) {
    case 'online':
      return 'bg-emerald-500'
    case 'busy':
      return 'bg-yellow-500'
    case 'error':
      return 'bg-red-500'
    default:
      return 'bg-slate-500'
  }
}

const getConnectionStatusInfo = (status: ConnectionStatus) => {
  switch (status) {
    case 'connected':
      return { icon: Wifi, text: 'Connected to Playground', color: 'text-emerald-400' }
    case 'connecting':
      return { icon: RefreshCw, text: 'Connecting...', color: 'text-yellow-400' }
    case 'disconnected':
      return { icon: WifiOff, text: 'Disconnected', color: 'text-slate-400' }
    case 'error':
      return { icon: AlertTriangle, text: 'Connection Error', color: 'text-red-400' }
    default:
      return { icon: WifiOff, text: 'Unknown', color: 'text-slate-400' }
  }
}

export function AgentSidebar({
  agents,
  selectedAgentId,
  onSelectAgent,
  connectionStatus,
  onRefresh,
}: AgentSidebarProps) {
  const connectionInfo = getConnectionStatusInfo(connectionStatus)
  const ConnectionIcon = connectionInfo.icon

  return (
    <div className="flex flex-col h-full relative">
      {/* Background Effects */}
      <BackgroundPaths className="opacity-20" />
      
      {/* Header */}
      <div className="relative z-10 p-4 border-b bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <div>
              <h2 className="font-semibold text-sm">ServiceFlow AI</h2>
              <p className="text-xs text-muted-foreground">Agent Control</p>
            </div>
          </div>
          <Sparkles className="h-4 w-4 text-primary ml-auto" />
        </div>
        
        {/* Connection Status */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ConnectionIcon className={`h-3 w-3 ${connectionInfo.color} ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
            <span className={`text-xs ${connectionInfo.color}`}>
              {connectionInfo.text}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={connectionStatus === 'connecting'}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Agents Count */}
        <div className="mt-2">
          <Badge variant="secondary" className="text-xs">
            {agents.length} Agents Available
          </Badge>
        </div>
      </div>

      {/* Agents List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 relative z-10">
        {agents.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-center">
            <div className="space-y-2">
              <Bot className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No agents available
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                className="text-xs h-7"
              >
                Refresh
              </Button>
            </div>
          </div>
        ) : (
          agents.map((agent) => {
            const AgentIcon = getAgentIcon(agent.type)
            const isSelected = selectedAgentId === agent.id

            return (
              <button
                key={agent.id}
                onClick={() => onSelectAgent(agent.id)}
                className={`
                  w-full p-3 rounded-lg text-left transition-all duration-200
                  ${isSelected 
                    ? 'bg-primary/20 border-primary/50 border' 
                    : 'bg-card/50 border-transparent border hover:bg-card/80 hover:border-border'
                  }
                  backdrop-blur-sm group
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className={`p-2 rounded-lg ${getAgentTypeColor(agent.type)}`}>
                      <AgentIcon className="h-4 w-4" />
                    </div>
                    {/* Status indicator */}
                    <div 
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(agent.status)}`}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium text-sm truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {agent.name}
                      </h3>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {agent.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className={`text-xs h-5 px-1.5 ${getAgentTypeColor(agent.type)} border-0`}
                      >
                        {agent.type || 'general'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(agent.lastActive)}
                      </span>
                    </div>

                    {/* Capabilities */}
                    {agent.capabilities && agent.capabilities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {agent.capabilities.slice(0, 2).map((capability) => (
                          <Badge
                            key={capability}
                            variant="secondary"
                            className="text-xs h-4 px-1"
                          >
                            {capability}
                          </Badge>
                        ))}
                        {agent.capabilities.length > 2 && (
                          <Badge
                            variant="secondary"
                            className="text-xs h-4 px-1"
                          >
                            +{agent.capabilities.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 p-4 border-t bg-card/30 backdrop-blur-sm">
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            Playground Server
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            localhost:7777
          </p>
        </div>
      </div>
    </div>
  )
}