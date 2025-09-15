"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type Agent } from "@/lib/agent-client"
import { useChat } from "@/hooks/use-chat"
import { ChatMessage } from "./chat-message"
import { BackgroundPaths } from "@/components/ui/background-paths"
import { Send, Loader2, MessageCircle, Bot } from "lucide-react"

interface AgentChatInterfaceProps {
  agent: Agent
}

export function AgentChatInterface({ agent }: AgentChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { messages, isLoading, sendMessage, messagesEndRef } = useChat(agent)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    await sendMessage(inputValue)
    setInputValue("")
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Background Effects */}
      <BackgroundPaths className="opacity-10" />

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md">
              <div className="relative">
                <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  Chat with {agent.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {agent.description}
                </p>
                <div className="flex justify-center">
                  <MessageCircle className="h-4 w-4 text-muted-foreground/50" />
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Ask me anything! Try:</p>
                <div className="space-y-1">
                  <code className="text-xs bg-muted px-2 py-1 rounded block">
                    "What can you help me with?"
                  </code>
                  <code className="text-xs bg-muted px-2 py-1 rounded block">
                    "Tell me about your capabilities"
                  </code>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                agent={agent}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 bg-card/50 backdrop-blur-sm rounded-lg px-4 py-3 border">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {agent.name} is thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-card/50 backdrop-blur-sm p-4 relative z-10">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${agent.name}...`}
              disabled={isLoading}
              className="bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50"
            />
          </div>
          <Button 
            type="submit" 
            disabled={!inputValue.trim() || isLoading}
            className="shrink-0"
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Press Enter to send</span>
            <span>Shift+Enter for new line</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              agent.status === 'online' ? 'bg-emerald-500' : 
              agent.status === 'busy' ? 'bg-yellow-500' : 'bg-slate-500'
            }`} />
            <span className="capitalize">{agent.status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}