"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type Agent } from "@/lib/agent-client"
import { type ConnectionStatus } from "@/hooks/use-agents"
import { RefreshCw, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"

interface HeaderProps {
  selectedAgent?: Agent
  connectionStatus: ConnectionStatus
  onRefresh: () => void
  isAdmin: boolean
}

export function Header({ selectedAgent, connectionStatus, onRefresh, isAdmin }: HeaderProps) {
  const getConnectionStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return 'text-emerald-400 bg-emerald-500/20'
      case 'connecting':
        return 'text-yellow-400 bg-yellow-500/20'
      case 'disconnected':
      case 'error':
        return 'text-red-400 bg-red-500/20'
      default:
        return 'text-slate-400 bg-slate-500/20'
    }
  }

  const getConnectionIcon = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-3 w-3" />
      case 'connecting':
        return <RefreshCw className="h-3 w-3 animate-spin" />
      default:
        return <WifiOff className="h-3 w-3" />
    }
  }

  return (
    <header className="w-full border-b bg-card/50 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-lg font-semibold">
              {selectedAgent ? selectedAgent.name : 'ServiceFlow AI Agent UI'}
            </h1>
            {selectedAgent && (
              <p className="text-sm text-muted-foreground">
                {selectedAgent.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Badge className={`${getConnectionStatusColor(connectionStatus)} border-0`}>
            {getConnectionIcon(connectionStatus)}
            <span className="ml-1.5 capitalize">{connectionStatus}</span>
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={connectionStatus === 'connecting'}
            className="h-8"
          >
            <RefreshCw className={`h-4 w-4 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <nav className="mt-4 flex gap-6">
        <Link href="/dashboard" className="text-sm">Agent Dashboard</Link>
        <Link href="/market" className="text-sm">Market</Link>
        <Link href="/perps" className="text-sm">Perps</Link>
        <Link href="/nfts" className="text-sm">NFTs</Link>
        <Link href="/social" className="text-sm">Social</Link>
        <Link href="/blog" className="text-sm">Blog</Link>
        {isAdmin && <Link href="/agent-logs" className="text-sm">Agent Logs</Link>}
      </nav>
    </header>
  )
}