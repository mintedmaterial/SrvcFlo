"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Video, Coins, Crown } from "lucide-react"
import { MODEL_COSTS } from "@/lib/credit-system-config"
import { CREDIT_PACKAGES } from "@/lib/credit-system-config"

interface CreditPricingTickerProps {
  network?: 'mainnet' | 'testnet'
  className?: string
  compact?: boolean
}

export function CreditPricingTicker({ network = 'testnet', className = '', compact = false }: CreditPricingTickerProps) {
  
  // Get image/video costs
  const imageCost = MODEL_COSTS.find((m: any) => m.type === 'image' && m.quality !== 'free')?.credits ?? 200
  const videoCost = MODEL_COSTS.find((m: any) => m.type === 'video')?.credits ?? 500

  if (compact) {
    return (
      <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">
              <Coins className="inline h-4 w-4 mr-1" />
              Credit System Active
            </div>
            <Badge variant="outline" className="text-xs">
              {network === 'mainnet' ? 'Sonic Mainnet' : 'Sonic Testnet'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
      <CardContent className="p-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center justify-center gap-2">
            <Coins className="h-5 w-5 text-yellow-400" />
            Credit System Pricing
          </h3>
          <p className="text-sm text-gray-400">AI generation costs in credits • Dev wallets have unlimited access</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Generation - Primary Focus */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-xl font-bold text-orange-400 mb-2">
              <ImageIcon className="h-5 w-5" />
              Image Generation
            </div>
            <div className="text-lg text-white mb-3">{imageCost} Credits Per Image</div>
            <div className="space-y-2">
              <div className="p-3 bg-gradient-to-r from-orange-900/30 to-yellow-900/30 border border-orange-600/30 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">INFT AI Models:</span>
                  <span className="text-orange-400 font-mono font-bold">200 credits</span>
                </div>
                <div className="text-xs text-gray-400">
                  OpenAI GPT-4.1/5, DALL-E-3, Cloudflare AI, Gemini Pro
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-gray-800/50 p-2 rounded">
                <strong>Package Examples:</strong><br/>
                {CREDIT_PACKAGES.map((pkg: any) => (
                  <div key={pkg.id}>
                    • {pkg.name} ({pkg.usdcCredits} credits): ~{Math.floor(pkg.usdcCredits / imageCost)} images
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Video Generation - Coming Soon */}
          <div className="text-center opacity-75">
            <div className="flex items-center justify-center gap-2 text-xl font-bold text-purple-400 mb-2">
              <Video className="h-5 w-5" />
              Video Generation
            </div>
            <div className="text-lg text-white mb-3">{videoCost} Credits Per Video</div>
            <div className="space-y-2">
              <div className="p-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-600/30 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">INFT Video Models:</span>
                  <span className="text-purple-400 font-mono font-bold">500 credits</span>
                </div>
                <div className="text-xs text-gray-400">
                  Gemini Video, Cloudflare AI Video, OpenAI Video
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-gray-800/50 p-2 rounded">
                <strong>Package Examples:</strong><br/>
                {CREDIT_PACKAGES.map((pkg: any) => (
                  <div key={pkg.id}>
                    • {pkg.name} ({pkg.usdcCredits} credits): ~{Math.floor(pkg.usdcCredits / videoCost)} videos
                  </div>
                ))}
              </div>
              <div className="inline-flex items-center gap-1 text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
                <span>🚧</span> Video testing in progress
              </div>
            </div>
          </div>
        </div>

        {/* Dev Wallet Notice */}
        <div className="mt-6 p-3 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-600/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-300 mb-1">
            <Crown className="h-4 w-4" />
            <span className="font-semibold text-sm">Developer Access</span>
          </div>
          <p className="text-xs text-yellow-400/80">
            App owner wallets have unlimited credits and premium model access for testing and development.
          </p>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span>Network: {network === 'mainnet' ? 'Sonic Mainnet' : 'Sonic Testnet'}</span>
            <span>•</span>
            <span>Credit System Active</span>
            <span>•</span>
            <span>Purchase credits to generate premium content</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}