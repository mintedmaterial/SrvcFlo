"use client"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, ImageIcon } from "lucide-react"

interface CustomerData {
  name: string
  email: string
  phone: string
  address: string
  projectDescription: string
}

interface ChatBotProps {
  customerData: CustomerData | null
}

export function ChatBot({ customerData }: ChatBotProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content: `🚀 Welcome to ServiceFlow AI! I'm your intelligent assistant, here to help you discover how our platform can transform your service business.

🎨 **LIVE NOW - AI Generation:**
• Image Generation - $1 USDC or $S token per image
• Video Generation - $2 USDC or $S token per video
• Powered by Sonic blockchain for lightning-fast payments

🔥 **Coming Soon:**
• Agent Launchpad - Build custom AI agents for YOUR business
• Workflow Builder - Automate scheduling, leads, and customer service
• Revenue sharing with crypto bonuses (20% extra value!)

💡 **Perfect for:** Contractors, Plumbers, Roofers, Hair Stylists, Handymen, and all service businesses looking to scale with AI.

Ready to see our AI generation in action? Try asking about image creation, or let me know about your business - I'd love to show you how ServiceFlow AI can help you grow! 

What would you like to explore first?`,
      },
    ],
  })

  return (
    <div className="flex flex-col h-[600px]">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <Avatar className="bg-blue-600">
                <AvatarFallback>
                  <Bot className="h-4 w-4 text-white" />
                </AvatarFallback>
              </Avatar>
            )}

            <Card
              className={`max-w-[80%] ${
                message.role === "user" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
              }`}
            >
              <CardContent className="p-3">
                <div className={`whitespace-pre-wrap text-sm ${
                  message.role === "assistant" ? "text-gray-900 dark:text-gray-100" : ""
                }`}>{message.content}</div>
              </CardContent>
            </Card>

            {message.role === "user" && (
              <Avatar className="bg-gray-600">
                <AvatarFallback>
                  <User className="h-4 w-4 text-white" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <Avatar className="bg-blue-600">
              <AvatarFallback>
                <Bot className="h-4 w-4 text-white animate-pulse" />
              </AvatarFallback>
            </Avatar>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
              <CardContent className="p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex space-x-2 mt-4">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about AI generation, pricing, or how ServiceFlow can help your business..."
          className="flex-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => handleInputChange({ target: { value: "How does AI image generation work?" } } as any)}
        >
          <ImageIcon className="h-3 w-3 mr-1" />
          AI Generation
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => handleInputChange({ target: { value: "What are your pricing plans?" } } as any)}
        >
          Pricing
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => handleInputChange({ target: { value: "Tell me about the Agent Launchpad" } } as any)}
        >
          Agent Builder
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => handleInputChange({ target: { value: "How can ServiceFlow help my business?" } } as any)}
        >
          Business Benefits
        </Button>
      </div>
    </div>
  )
}
