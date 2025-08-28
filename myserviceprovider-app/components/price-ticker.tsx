"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImageIcon, Video, RefreshCw, Wallet, CreditCard, Coins } from "lucide-react"
import { useAccount } from "wagmi"

interface PriceOption {
  token: string
  tokenName: string
  amount: number
  amountFormatted: string
  amountDecimals: string
  pricePerToken: number
  summary: string
}

interface PricingData {
  image: {
    service: string
    targetUSD: number
    targetFormatted: string
    options: PriceOption[]
  }
  video: {
    service: string
    targetUSD: number
    targetFormatted: string
    options: PriceOption[]
  }
}

interface PriceData {
  network: string
  networkDisplay: string
  pricing: PricingData
  timestamp: number
  cacheDuration: string
}

interface PriceTickerProps {
  network?: 'mainnet' | 'testnet'
  className?: string
  compact?: boolean
}

export function PriceTicker({ network = 'mainnet', className = '', compact = false }: PriceTickerProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const { address, isConnected } = useAccount()

  const handleBuyCredits = () => {
    window.location.href = '/credits'
  }

  const handleBuyFLOAI = () => {
    window.location.href = '/floai'
  }

  const handleConnectWallet = () => {
    // This will be handled by the wallet connection button
    console.log('Connect wallet clicked')
  }

  const fetchPriceData = async () => {
    try {
      setLoading(true)
      
      // First try to get live Sonic price from DexScreener
      const sonicPriceResponse = await fetch('/api/price/sonic-price')
      let sonicPrice = 0.305 // Fallback price
      
      if (sonicPriceResponse.ok) {
        const sonicData = await sonicPriceResponse.json()
        sonicPrice = sonicData.price || 0.305
        console.log('Live Sonic price:', sonicPrice)
      }
      
      // Calculate FLOAI amounts needed for image/video generation
      const imageUSD = 1 // $1 for image
      const videoUSD = 2 // $2 for video
      
      // Calculate required tokens based on live price
      const imageTokens = imageUSD / sonicPrice
      const videoTokens = videoUSD / sonicPrice
      
      // Create pricing data structure compatible with existing component
      const calculatedData = {
        network: network,
        networkDisplay: network === 'mainnet' ? 'Sonic Mainnet' : 'Sonic Testnet',
        pricing: {
          image: {
            service: 'Image Generation',
            targetUSD: imageUSD,
            targetFormatted: `$${imageUSD.toFixed(2)}`,
            options: [
              {
                token: 'S',
                tokenName: 'Sonic',
                amount: imageTokens,
                amountFormatted: `${imageTokens.toFixed(4)} S`,
                amountDecimals: (imageTokens * 1e18).toString(),
                pricePerToken: sonicPrice,
                summary: `${imageTokens.toFixed(4)} S ≈ $${imageUSD.toFixed(2)}`
              },
              {
                token: 'FLOAI',
                tokenName: 'FLOAI',
                amount: 50, // Fixed FLOAI cost per image
                amountFormatted: '50 FLOAI',
                amountDecimals: (50 * 1e18).toString(),
                pricePerToken: imageUSD / 50, // $1 / 50 FLOAI = $0.02 per FLOAI
                summary: '50 FLOAI ≈ $1.00'
              }
            ]
          },
          video: {
            service: 'Video Generation',
            targetUSD: videoUSD,
            targetFormatted: `$${videoUSD.toFixed(2)}`,
            options: [
              {
                token: 'S',
                tokenName: 'Sonic',
                amount: videoTokens,
                amountFormatted: `${videoTokens.toFixed(4)} S`,
                amountDecimals: (videoTokens * 1e18).toString(),
                pricePerToken: sonicPrice,
                summary: `${videoTokens.toFixed(4)} S ≈ $${videoUSD.toFixed(2)}`
              },
              {
                token: 'FLOAI',
                tokenName: 'FLOAI',
                amount: 100, // Fixed FLOAI cost per video
                amountFormatted: '100 FLOAI',
                amountDecimals: (100 * 1e18).toString(),
                pricePerToken: videoUSD / 100, // $2 / 100 FLOAI = $0.02 per FLOAI
                summary: '100 FLOAI ≈ $2.00'
              }
            ]
          }
        },
        timestamp: Date.now(),
        cacheDuration: '30 seconds'
      }
      
      console.log('Calculated pricing data:', calculatedData)
      setPriceData(calculatedData)
      setLastUpdate(new Date())
      
    } catch (error) {
      console.error('Error fetching price data:', error)
      
      // Fallback to static pricing
      const fallbackData = {
        network: network,
        networkDisplay: network === 'mainnet' ? 'Sonic Mainnet' : 'Sonic Testnet',
        pricing: {
          image: {
            service: 'Image Generation',
            targetUSD: 1,
            targetFormatted: '$1.00',
            options: [
              {
                token: 'S',
                tokenName: 'Sonic',
                amount: 3.28,
                amountFormatted: '3.28 S',
                amountDecimals: (3.28 * 1e18).toString(),
                pricePerToken: 0.305,
                summary: '3.28 S ≈ $1.00'
              },
              {
                token: 'FLOAI',
                tokenName: 'FLOAI',
                amount: 50,
                amountFormatted: '50 FLOAI',
                amountDecimals: (50 * 1e18).toString(),
                pricePerToken: 0.02,
                summary: '50 FLOAI ≈ $1.00'
              }
            ]
          },
          video: {
            service: 'Video Generation',
            targetUSD: 2,
            targetFormatted: '$2.00',
            options: [
              {
                token: 'S',
                tokenName: 'Sonic',
                amount: 6.56,
                amountFormatted: '6.56 S',
                amountDecimals: (6.56 * 1e18).toString(),
                pricePerToken: 0.305,
                summary: '6.56 S ≈ $2.00'
              },
              {
                token: 'FLOAI',
                tokenName: 'FLOAI',
                amount: 100,
                amountFormatted: '100 FLOAI',
                amountDecimals: (100 * 1e18).toString(),
                pricePerToken: 0.02,
                summary: '100 FLOAI ≈ $2.00'
              }
            ]
          }
        },
        timestamp: Date.now(),
        cacheDuration: 'fallback'
      }
      
      setPriceData(fallbackData)
      setLastUpdate(new Date())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchPriceData()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchPriceData, 30000)
    
    return () => clearInterval(interval)
  }, [network])

  if (loading && !priceData) {
    return (
      <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
            <div className="text-gray-400">Loading prices...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!priceData) {
    return (
      <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center text-gray-400">
            Price data unavailable
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">
              Image: {priceData.pricing.image.options?.[0]?.amountFormatted || 'N/A'}
            </div>
            <div className="text-sm text-gray-300">
              Video: {priceData.pricing.video.options?.[0]?.amountFormatted || 'N/A'}
            </div>
            <Badge variant="outline" className="text-xs">
              {priceData.networkDisplay}
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
          <h3 className="text-lg font-semibold text-white mb-1">
            INFT Agent Generation Pricing
            {loading && <RefreshCw className="inline h-4 w-4 animate-spin ml-2" />}
          </h3>
          <p className="text-sm text-gray-400">AI generation via personal INFT agents • Use FLOAI tokens or S tokens for generation</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Generation */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-xl font-bold text-orange-400 mb-2">
              <ImageIcon className="h-5 w-5" />
              Image Generation
            </div>
            <div className="text-lg text-white mb-3">{priceData.pricing.image.targetFormatted}</div>
            <div className="space-y-2">
              {priceData.pricing.image.options?.map((option, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-300">{option.tokenName}:</span>
                  <span className="text-orange-400 font-mono">{option.amountFormatted}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Video Generation */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-xl font-bold text-purple-400 mb-2">
              <Video className="h-5 w-5" />
              Video Generation
            </div>
            <div className="text-lg text-white mb-3">{priceData.pricing.video.targetFormatted}</div>
            <div className="space-y-2">
              {priceData.pricing.video.options?.map((option, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-300">{option.tokenName}:</span>
                  <span className="text-purple-400 font-mono">{option.amountFormatted}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Credit Purchase Section */}
        <div className="text-center mt-6 pt-4 border-t border-gray-700">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-white mb-2">Ready to Generate?</h4>
            <p className="text-sm text-gray-400">Mint your personal INFT agent and get FLOAI tokens for AI generation</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isConnected ? (
              <>
                <Button 
                  onClick={handleBuyFLOAI}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Get FLOAI
                </Button>
                <Button 
                  onClick={() => window.location.href = '/generate'}
                  variant="outline" 
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Start Generating
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleConnectWallet}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet & Create Agent
              </Button>
            )}
          </div>
          {isConnected && address && (
            <div className="mt-3 text-xs text-gray-500">
              Connected: {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span>Network: {priceData.networkDisplay}</span>
            <span>•</span>
            <span>Updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'N/A'}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Powered by{' '}
              <a 
                href="https://dexscreener.com/sonic" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                DexScreener
              </a>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}