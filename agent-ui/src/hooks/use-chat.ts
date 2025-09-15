import { useState, useCallback, useRef, useEffect } from 'react'
import { agentClient, type Agent, type ChatMessage } from '@/lib/agent-client'
import { generateId } from '@/lib/utils'

export function useChat(agent: Agent) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    const userMessage: ChatMessage = {
      id: generateId(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
      status: 'sent',
      agentId: agent.id,
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    // Create placeholder assistant message
    const assistantMessage: ChatMessage = {
      id: generateId(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      status: 'sending',
      agentId: agent.id,
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await agentClient.sendMessage(agent.id, content)
      
      // Update the assistant message with the response
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? {
              ...msg,
              content: response.content,
              status: 'sent' as const,
              timestamp: response.timestamp,
            }
          : msg
      ))
    } catch (err) {
      console.error('Failed to send message:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      
      // Update the assistant message with error
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? {
              ...msg,
              content: `Error: ${errorMessage}`,
              status: 'error' as const,
            }
          : msg
      ))
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [agent.id])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const resendMessage = useCallback(async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId)
    if (messageIndex === -1) return

    const message = messages[messageIndex]
    if (message.role !== 'user') return

    // Remove the failed message and any subsequent messages
    setMessages(prev => prev.slice(0, messageIndex))
    
    // Resend the message
    await sendMessage(message.content)
  }, [messages, sendMessage])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    resendMessage,
    messagesEndRef,
  }
}