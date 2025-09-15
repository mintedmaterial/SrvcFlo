'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlaygroundStore } from '@/lib/store'

// Simple chat interface following AI SDK pattern
const ChatArea = () => {
  const { messages, setMessages, selectedAgent } = usePlaygroundStore()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !selectedAgent) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      parts: [{ type: 'text', text }]
    }

    setMessages([...messages, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agent_name: selectedAgent,
          channel_context: {}
        })
      })

      if (response.ok) {
        const data = await response.json()

        // Add the AI response to messages
        if (data.response) {
          const aiMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            parts: [{ type: 'text', text: data.response }]
          }
          setMessages([...messages, userMessage, aiMessage])
        } else if (data.error) {
          const errorMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            parts: [{ type: 'text', text: `Error: ${data.error}` }]
          }
          setMessages([...messages, userMessage, errorMessage])
        }
      } else {
        // Add error message
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          parts: [{ type: 'text', text: 'Sorry, I encountered an error. Please try again.' }]
        }
        setMessages([...messages, userMessage, errorMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        parts: [{ type: 'text', text: 'Connection error. Please check that the backend is running.' }]
      }
      setMessages([...messages, userMessage, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
    setInput('')
  }

  return (
    <main className="relative flex flex-grow flex-col h-full">
      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <Card className="mx-auto max-w-2xl">
            <CardHeader>
              <CardTitle className="text-center">ServiceFlow AI Agent Chat</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              <p>Welcome! Start chatting with your AI agents.</p>
              {selectedAgent && (
                <p className="text-sm mt-2">
                  Currently selected: <span className="font-medium text-foreground">{selectedAgent}</span>
                </p>
              )}
              <p className="text-xs mt-2 opacity-70">Backend connection: {process.env.NEXT_PUBLIC_AGENT_ENDPOINT || 'http://localhost:7777'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <CardContent className="p-3">
                    <div className="text-sm font-medium mb-1">
                      {message.role === 'user' ? 'You' : 'AI Agent'}
                    </div>
                    {message.parts.map((part: any, i: number) => {
                      switch (part.type) {
                        case 'text':
                          return (
                            <div key={`${message.id}-${i}`} className="whitespace-pre-wrap">
                              {part.text}
                            </div>
                          )
                        default:
                          return (
                            <pre key={`${message.id}-${i}`} className="text-xs overflow-auto">
                              {JSON.stringify(part, null, 2)}
                            </pre>
                          )
                      }
                    })}
                  </CardContent>
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="max-w-[80%] bg-muted">
                  <CardContent className="p-3">
                    <div className="text-sm font-medium mb-1">AI Agent</div>
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Thinking...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 w-full bg-background border-t p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message to the AI agent..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </main>
  )
}

export default ChatArea