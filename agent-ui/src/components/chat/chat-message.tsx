"use client"

import { type ChatMessage, type Agent } from "@/lib/agent-client"
import { formatMessageTime } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  Bot, 
  User, 
  Copy, 
  RotateCcw, 
  Check, 
  AlertCircle,
  Clock
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ChatMessageProps {
  message: ChatMessage
  agent: Agent
  onResend?: (messageId: string) => void
}

export function ChatMessage({ message, agent, onResend }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const hasError = message.status === 'error'

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      toast.success("Message copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy message")
    }
  }

  const handleResend = () => {
    if (onResend && isUser) {
      onResend(message.id)
    }
  }

  return (
    <div className={cn(
      "group flex gap-3 message-enter",
      isUser ? "justify-end" : "justify-start"
    )}>
      {/* Avatar */}
      {!isUser && (
        <div className="shrink-0">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        "max-w-[80%] space-y-2",
        isUser && "order-first"
      )}>
        {/* Message Header */}
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          isUser ? "justify-end" : "justify-start"
        )}>
          <span className="font-medium">
            {isUser ? "You" : agent.name}
          </span>
          <span>•</span>
          <span>{formatMessageTime(message.timestamp)}</span>
          
          {/* Status Indicators */}
          {message.status === 'sending' && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 animate-pulse" />
              <span>Sending</span>
            </div>
          )}
          
          {hasError && (
            <div className="flex items-center gap-1 text-red-400">
              <AlertCircle className="h-3 w-3" />
              <span>Error</span>
            </div>
          )}
        </div>

        {/* Message Bubble */}
        <div className={cn(
          "relative rounded-lg px-4 py-3 text-sm backdrop-blur-sm border",
          isUser 
            ? "bg-primary text-primary-foreground border-primary/20" 
            : hasError
              ? "bg-red-500/10 text-red-300 border-red-500/20"
              : "bg-card/80 text-foreground border-border/50"
        )}>
          {/* Message Text */}
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>

          {/* Message Actions */}
          <div className={cn(
            "absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isUser ? "-left-12" : "-right-12"
          )}>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-6 w-6 p-0 bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              
              {hasError && isUser && onResend && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  className="h-6 w-6 p-0 bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Agent Type Badge */}
        {!isUser && agent.type && (
          <div className="flex justify-start">
            <Badge variant="secondary" className="text-xs h-5">
              {agent.type}
            </Badge>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="shrink-0">
          <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center">
            <User className="h-4 w-4 text-secondary-foreground" />
          </div>
        </div>
      )}
    </div>
  )
}