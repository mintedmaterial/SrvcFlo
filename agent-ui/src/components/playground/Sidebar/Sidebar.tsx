'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { usePlaygroundStore } from '@/lib/store'

// Available agents based on playground.py
const AVAILABLE_AGENTS = [
  { id: 'content_creation_agent', name: 'Content Creation Agent', icon: '✍️', description: 'Social media and blog content creation' },
  { id: 'auditooor_agent', name: 'Auditooor', icon: '🛡️', description: 'Smart contract auditing and security' },
  { id: 'ecosystem_analyst_agent', name: 'Sonic Ecosystem Analyst', icon: '🌊', description: 'Real-time Sonic DeFi analysis' },
  { id: 'dalle_agent', name: 'DALLE AI Generator', icon: '🎨', description: 'AI image generation' },
  { id: 'smart_contract_agent', name: 'Smart Contract Analyst', icon: '📋', description: 'Smart contract analysis' },
  { id: 'research_coordinator', name: 'Research Coordinator', icon: '🔍', description: 'Market research and analysis' },
  { id: 'nft_analyst_agent', name: 'NFT Market Analyst', icon: '🖼️', description: 'NFT market trends and analysis' },
  { id: 'discord_agent', name: 'Discord Community Manager', icon: '💬', description: 'Community management' },
  { id: 'facebook_agent', name: 'Facebook Page Manager', icon: '📘', description: 'Facebook page management' },
  { id: 'google_agent', name: 'Google Services Manager', icon: '🔍', description: 'Gmail and Calendar management' },
]

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(AVAILABLE_AGENTS[0].id)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const { messages, setMessages, setSelectedAgent: setStoreAgent } = usePlaygroundStore()

  const handleNewChat = () => {
    setMessages([])
  }

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId)
    setStoreAgent?.(agentId)
    console.log(`🤖 Selected agent: ${agentId}`)
  }

  // Check connection to playground server
  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus('connecting')
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'ping',
            agent_name: selectedAgent,
            channel_context: {}
          })
        })

        if (response.ok) {
          setConnectionStatus('connected')
        } else {
          setConnectionStatus('disconnected')
        }
      } catch (error) {
        setConnectionStatus('disconnected')
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 10000) // Check every 10 seconds
    
    return () => clearInterval(interval)
  }, [selectedAgent])

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'disconnected': return 'bg-red-500'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected'
      case 'connecting': return 'Connecting...'
      case 'disconnected': return 'Disconnected'
    }
  }

  return (
    <motion.aside
      className="relative flex h-screen shrink-0 grow-0 flex-col overflow-hidden bg-card/50 backdrop-blur-sm border-r px-2 py-3"
      initial={{ width: '16rem' }}
      animate={{ width: isCollapsed ? '2.5rem' : '16rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-2 top-2 z-10 p-1 hover:bg-accent rounded"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        type="button"
        whileTap={{ scale: 0.95 }}
      >
        <Icon
          type={isCollapsed ? 'chevron-right' : 'chevron-left'}
          size="xs"
        />
      </motion.button>

      <motion.div
        className="w-60 space-y-5"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -20 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="pt-6">
          <h2 className="text-lg font-semibold">ServiceFlow AI</h2>
          <p className="text-sm text-muted-foreground">Agent UI</p>
        </div>

        {/* New Chat Button */}
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Icon type="add" size="sm" />
          New Chat
        </Button>

        {/* Agent Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Active Agent</h3>
          <div className="space-y-2">
            {AVAILABLE_AGENTS.slice(0, 5).map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleAgentSelect(agent.id)}
                className={`w-full text-left p-2 rounded-md text-xs transition-colors ${
                  selectedAgent === agent.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{agent.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{agent.name}</div>
                    <div className="text-xs opacity-70 truncate">{agent.description}</div>
                  </div>
                </div>
              </button>
            ))}
            
            {AVAILABLE_AGENTS.length > 5 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Show {AVAILABLE_AGENTS.length - 5} more agents...
                </summary>
                <div className="mt-2 space-y-2">
                  {AVAILABLE_AGENTS.slice(5).map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleAgentSelect(agent.id)}
                      className={`w-full text-left p-2 rounded-md text-xs transition-colors ${
                        selectedAgent === agent.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{agent.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{agent.name}</div>
                          <div className="text-xs opacity-70 truncate">{agent.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Connection</h3>
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${getStatusColor()}`}></div>
              <span>{getStatusText()}</span>
            </div>
            <div className="mt-1 opacity-70">localhost:7777</div>
          </div>
        </div>

        {/* Chat Count */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Current Session</h3>
          <div className="text-xs text-muted-foreground">
            {messages.length} messages with {AVAILABLE_AGENTS.find(a => a.id === selectedAgent)?.name}
          </div>
        </div>

        {/* TODO: Add agent/team selector */}
        {/* TODO: Add session history */}
      </motion.div>
    </motion.aside>
  )
}

export default Sidebar