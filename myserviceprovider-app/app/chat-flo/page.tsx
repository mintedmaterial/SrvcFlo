"use client"
import { FloINFTChat } from "@/components/flo-inft-chat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Sparkles, Wallet } from "lucide-react"

export default function ChatFloPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <img 
              src="https://api.srvcflo.com/brand/Flo.PNG" 
              alt="Flo"
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h1 className="text-4xl font-bold">Chat with Flo</h1>
              <p className="text-muted-foreground">ServiceFlow AI's Genesis Agent</p>
            </div>
          </div>
          
          <div className="flex justify-center gap-2">
            <Badge variant="default">
              <Crown className="h-3 w-3 mr-1" />
              ERC-7857 Verifiable iNFT
            </Badge>
            <Badge variant="secondary">
              <Sparkles className="h-3 w-3 mr-1" />
              Token #1 - Genesis Agent
            </Badge>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                Public Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>General ServiceFlow AI information and business automation advice.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Connected Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>Wallet connected. Enhanced features with personalized recommendations.</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-yellow-700 dark:text-yellow-300">
                <Crown className="h-5 w-5 mr-2" />
                iNFT Owner Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>Own Token #1 for personal agent features, priority access, and enhanced capabilities.</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Interface */}
        <FloINFTChat className="w-full" />

        {/* iNFT Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="h-5 w-5 mr-2" />
              About Flo's iNFT (Token #1)
            </CardTitle>
            <CardDescription>
              First official ServiceFlow AI agent as a Verifiable Intelligent NFT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Token Details</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>Token ID:</strong> #1 (Genesis Agent)</li>
                  <li>• <strong>Contract:</strong> 0x5D25...46d4</li>
                  <li>• <strong>Standard:</strong> ERC-7857 Verifiable iNFT</li>
                  <li>• <strong>Blockchain:</strong> Sonic Mainnet</li>
                  <li>• <strong>Status:</strong> Verified ✓</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Owner Benefits</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Personal agent with memory</li>
                  <li>• Enhanced AI generation credits</li>
                  <li>• Priority access to new features</li>
                  <li>• Advanced workflow customization</li>
                  <li>• Voting rights on platform updates</li>
                </ul>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>How it works:</strong> When you connect the wallet that owns Flo's iNFT (Token #1), 
                the chat interface automatically detects your ownership and unlocks personal agent features. 
                Flo becomes YOUR personal AI assistant with enhanced capabilities and memory.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}