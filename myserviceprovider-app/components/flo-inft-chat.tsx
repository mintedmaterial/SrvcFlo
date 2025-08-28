"use client"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Crown, Sparkles, Wallet } from "lucide-react"
import { useState, useEffect } from "react"
import { useAccount, useReadContract } from "wagmi"

// ERC-7857 Contract ABI (minimal for ownership check)
const ERC7857_ABI = [
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "getINFTMetadata", 
    "outputs": [
      {"name": "encryptedMetadataHash", "type": "string"},
      {"name": "proofHash", "type": "bytes32"},
      {"name": "packageTokenId", "type": "uint256"},
      {"name": "creator", "type": "address"},
      {"name": "createdAt", "type": "uint256"},
      {"name": "lastVerified", "type": "uint256"},
      {"name": "isVerified", "type": "bool"},
      {"name": "contentType", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

const ERC7857_CONTRACT = "0x5D2258896b74e972115b7CB189137c4f9F1446d4"
const SONIC_CHAIN_ID = 146

interface FloINFTChatProps {
  className?: string
}

export function FloINFTChat({ className }: FloINFTChatProps) {
  const { address, isConnected } = useAccount()
  const [ownsFloINFT, setOwnsFloINFT] = useState(false)
  const [agentType, setAgentType] = useState<'public' | 'personal'>('public')
  const [loading, setLoading] = useState(true)

  // Check if user owns Flo iNFT (Token #1)
  const { data: tokenOwner } = useReadContract({
    address: ERC7857_CONTRACT as `0x${string}`,
    abi: ERC7857_ABI,
    functionName: 'ownerOf',
    args: [1], // Token #1 (Flo)
    chainId: SONIC_CHAIN_ID,
  })

  // Get Flo iNFT metadata
  const { data: floMetadata } = useReadContract({
    address: ERC7857_CONTRACT as `0x${string}`,
    abi: ERC7857_ABI,
    functionName: 'getINFTMetadata',
    args: [1],
    chainId: SONIC_CHAIN_ID,
  })

  useEffect(() => {
    if (isConnected && address && tokenOwner) {
      const owns = tokenOwner.toLowerCase() === address.toLowerCase()
      setOwnsFloINFT(owns)
      setAgentType(owns ? 'personal' : 'public')
    } else {
      setOwnsFloINFT(false)
      setAgentType('public')
    }
    setLoading(false)
  }, [isConnected, address, tokenOwner])

  const getInitialMessage = () => {
    if (!isConnected) {
      return {
        id: "1",
        role: "assistant" as const,
        content: `🤖 **Hi! I'm Flo, ServiceFlow AI's flagship agent.**

I'm currently in public mode. To unlock my full potential and access personalized features, please connect your wallet.

🔗 **Connect your wallet to:**
• Access personalized agent features
• If you own my iNFT (Token #1), chat with your personal Flo agent
• Get customized business automation recommendations
• Track your generated content and workflows

**What I can help you with in public mode:**
• General information about ServiceFlow AI
• Business automation advice
• AI generation examples
• Platform features overview

Ready to connect and see what I can really do? 🚀`
      }
    }

    if (ownsFloINFT) {
      return {
        id: "1", 
        role: "assistant" as const,
        content: `👑 **Welcome back, my owner!** 

I'm your personal Flo agent - Token #1 from our ERC-7857 Verifiable iNFT collection on Sonic blockchain!

✨ **Personal Agent Features Active:**
• Customized responses based on your business needs
• Priority access to new AI models and features
• Personalized workflow recommendations
• Advanced generation capabilities
• Direct integration with your iNFT package benefits

🎨 **Your iNFT Benefits:**
• Genesis Agent status (you own the first official Flo!)
• Enhanced AI generation credits
• Exclusive access to premium features
• Voting rights on platform updates

As your personal agent, I remember our conversations and can provide tailored business automation solutions. What would you like to work on today?

🔗 **Your iNFT**: [View on Sonic Explorer](https://sonicscan.org/token/${ERC7857_CONTRACT}/1)`
      }
    }

    return {
      id: "1",
      role: "assistant" as const,
      content: `🤖 **Hi! I'm Flo, ServiceFlow AI's flagship agent.**

I can see you're connected with wallet \`${address?.slice(0,6)}...${address?.slice(-4)}\`, but you don't currently own my iNFT.

💡 **Want to unlock personal agent features?**
• Own my Genesis iNFT (Token #1) for personalized interactions
• Get advanced business automation recommendations
• Access premium AI generation features

**What I can help you with right now:**
• Business process automation advice
• AI image/video generation guidance  
• ServiceFlow platform features
• General service business optimization

🛒 **Interested in owning my iNFT?** Contact our team about acquiring Token #1 for the full personal agent experience!

What would you like to explore today?`
    }
  }

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/inft/chat",
    body: {
      walletAddress: address,
      ownsFloINFT,
      agentType,
      inftContract: ERC7857_CONTRACT,
      tokenId: ownsFloINFT ? 1 : undefined
    },
    initialMessages: [getInitialMessage()],
  })

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Sparkles className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading Flo agent...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src="https://api.srvcflo.com/brand/Flo.PNG" alt="Flo" />
              <AvatarFallback>
                <Bot className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                Flo - ServiceFlow AI Agent
                {ownsFloINFT && (
                  <Crown className="h-4 w-4 text-yellow-500 inline-block ml-2" />
                )}
              </CardTitle>
              <div className="flex gap-2 mt-1">
                {ownsFloINFT ? (
                  <Badge variant="default" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Personal Agent (Token #1 Owner)
                  </Badge>
                ) : isConnected ? (
                  <Badge variant="secondary" className="text-xs">
                    <Wallet className="h-3 w-3 mr-1" />
                    Connected - Public Mode
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Public Mode - Connect Wallet
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {ownsFloINFT && (
            <div className="text-right text-sm text-muted-foreground">
              <div>Genesis iNFT #1</div>
              <div className="text-xs">Sonic Blockchain</div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="h-96 overflow-y-auto space-y-4 p-4 border rounded-lg bg-muted/50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <Avatar className="h-8 w-8">
                {message.role === "user" ? (
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src="https://api.srvcflo.com/brand/Flo.PNG" alt="Flo" />
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-background border"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                {message.role === "assistant" && ownsFloINFT && (
                  <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    <Crown className="h-3 w-3 mr-1" />
                    Personal Agent Response
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://api.srvcflo.com/brand/Flo.PNG" alt="Flo" />
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-background border rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Flo is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={
              ownsFloINFT 
                ? "Chat with your personal Flo agent..." 
                : isConnected 
                ? "Ask Flo anything..."
                : "Connect wallet for personalized features..."
            }
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {ownsFloINFT && floMetadata && (
          <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
            <strong>Your Flo iNFT:</strong> Verified ✓ | 
            Last Updated: {new Date(Number(floMetadata[5]) * 1000).toLocaleDateString()} |
            <a 
              href={`https://sonicscan.org/token/${ERC7857_CONTRACT}/1`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline ml-1"
            >
              View on Explorer →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}