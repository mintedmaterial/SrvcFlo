"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Loader2, Send, AlertCircle, Info } from "lucide-react"
import { getChatMessages, addChatMessage } from "@/lib/supabase/chat-service"

type Message = {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
  dataFetched?: any
}

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: "Welcome to you're Sonic AI Quant ANON. How can I help you with your quantitative analysis today?",
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [supabaseAvailable, setSupabaseAvailable] = useState(true)

  // Load chat messages on component mount
  useEffect(() => {
    loadChatMessages()
  }, [])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadChatMessages = async () => {
    try {
      const chatMessages = await getChatMessages()

      if (chatMessages.length > 0) {
        setMessages([
          {
            role: "system",
            content: "Welcome to you're Sonic AI Quant ANON. How can I help you with your quantitative analysis today?",
            timestamp: Date.now(),
          },
          ...chatMessages,
        ])
      }
    } catch (error) {
      console.error("Error loading chat messages:", error)
      setSupabaseAvailable(false)
    }
  }

  const saveMessageToSupabase = async (message: Message) => {
    if (!supabaseAvailable) return

    try {
      await addChatMessage(message)
    } catch (error) {
      console.error("Error saving message to Supabase:", error)
      setSupabaseAvailable(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      // Try to save user message to Supabase, but continue even if it fails
      try {
        if (supabaseAvailable) {
          await saveMessageToSupabase(userMessage)
        }
      } catch (error) {
        console.error("Error saving user message to Supabase:", error)
        setSupabaseAvailable(false)
        // Continue with the API call even if Supabase fails
      }

      // Prepare the chat history for the API request
      const apiMessages = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }))

      // Add the current user message
      apiMessages.push({
        role: "user",
        content: input,
      })

      // Call the Hyperbolic API
      const response = await fetch("https://api.hyperbolic.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtaW50ZWRtYXRlcmlhbEBnbWFpbC5jb20iLCJpYXQiOjE3MzkyNDk1MjB9.xJ1XappCYhgn9vxsanE2Ov4-z3t-WO4hkRz2Yr12HXg",
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: "deepseek-ai/DeepSeek-V3-0324",
          max_tokens: 512,
          temperature: 0.1,
          top_p: 0.9,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorText = errorData?.error || (await response.text()) || response.statusText
        throw new Error(`Error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      // Extract the assistant's response from the API response
      const assistantContent = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that request."

      // Add assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: assistantContent,
        timestamp: Date.now(),
      }

      // Try to save assistant message to Supabase, but continue even if it fails
      try {
        if (supabaseAvailable) {
          await saveMessageToSupabase(assistantMessage)
        }
      } catch (error) {
        console.error("Error saving assistant message to Supabase:", error)
        setSupabaseAvailable(false)
        // Continue even if Supabase fails
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error("Error communicating with agent:", err)
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)

      // Add error message
      const systemMessage: Message = {
        role: "system",
        content: `Error: ${errorMessage}`,
        timestamp: Date.now(),
      }

      // Try to save system message to Supabase, but continue even if it fails
      try {
        if (supabaseAvailable) {
          await saveMessageToSupabase(systemMessage)
        }
      } catch (error) {
        console.error("Error saving system message to Supabase:", error)
        setSupabaseAvailable(false)
      }

      setMessages((prev) => [...prev, systemMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[70vh]">
      {!supabaseAvailable && (
        <div className="bg-amber-900/20 text-amber-400 p-3 mb-4 flex items-start rounded-md border border-amber-800">
          <Info className="h-5 w-5 mr-2 mt-0.5" />
          <div>
            <p className="text-sm">Supabase connection is unavailable. Chat history will not be saved.</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 border border-sonic-gray rounded-md mb-4 bg-sonic-dark">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <Card
              className={`p-3 max-w-[80%] ${
                message.role === "user"
                  ? "bg-sonic-gold text-sonic-dark"
                  : message.role === "system"
                    ? "bg-sonic-gray text-white"
                    : "bg-sonic-gray text-white"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>

              {message.dataFetched && (
                <div className="mt-2 text-xs border-t pt-2 border-sonic-dark">
                  <div className="font-semibold">Data fetched:</div>
                  <div className="overflow-x-auto text-xs mt-1 max-h-[200px] overflow-y-auto">
                    {message.dataFetched.error ? (
                      <div className="text-red-400">Error: {message.dataFetched.error}</div>
                    ) : (
                      <pre>{JSON.stringify(message.dataFetched, null, 2)}</pre>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs opacity-70 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</div>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="bg-red-900/20 text-red-400 p-2 rounded-md mb-4 flex items-center border border-red-800">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Sonic AI Quant something..."
          disabled={isLoading}
          className="flex-1 sonic-input"
        />
        <Button type="submit" disabled={isLoading} className="bg-sonic-gold text-sonic-dark hover:bg-opacity-90">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}