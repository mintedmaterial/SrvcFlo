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
      
      // FLO tokenomics pricing ranges (from new-tokenomics.md)
      const floPrice = 1.00 // FLO pegged to ~$1 USD
      
      // Create pricing data structure with FLO token ranges
      const calculatedData = {
        network: network,
        networkDisplay: network === 'mainnet' ? 'Sonic Mainnet' : 'Sonic Testnet',
        pricing: {
          image: {
            service: 'Image Generation',
            targetUSD: 'Variable by complexity',
            targetFormatted: 'Based on prompt complexity',
            options: [
              {
                token: 'FLO',
                tokenName: 'FLO Simple',
                amount: 0.25,
                amountFormatted: '0.25 FLO',
                amountDecimals: (0.25 * 1e18).toString(),
                pricePerToken: floPrice,
                summary: '$0.25 (~0.25 FLO) - Simple images'
              },
              {
                token: 'FLO',
                tokenName: 'FLO Standard',
                amount: 0.5,
                amountFormatted: '0.5 FLO',
                amountDecimals: (0.5 * 1e18).toString(),
                pricePerToken: floPrice,
                summary: '$0.50 (~0.5 FLO) - Standard quality'
              },
              {
                token: 'FLO',
                tokenName: 'FLO Premium',
                amount: 1.0,
                amountFormatted: '1.0 FLO',
                amountDecimals: (1.0 * 1e18).toString(),
                pricePerToken: floPrice,
                summary: '$1.00 (~1.0 FLO) - Premium quality'
              },
              {
                token: 'S',
                tokenName: 'Sonic Token',
                amount: Math.round((1.0 / sonicPrice) * 100) / 100,
                amountFormatted: `${Math.round((1.0 / sonicPrice) * 100) / 100} S`,
                amountDecimals: (Math.round((1.0 / sonicPrice) * 100) / 100 * 1e18).toString(),
                pricePerToken: sonicPrice,
                summary: `~$1.00 (~${Math.round((1.0 / sonicPrice) * 100) / 100} S) - Pay with Sonic`
              }
            ]
          },
          video: {
            service: 'Video Generation',
            targetUSD: 'Variable by length & quality',
            targetFormatted: 'Based on duration and quality',
            options: [
              {
                token: 'FLO',
                tokenName: 'FLO Short',
                amount: 1.0,
                amountFormatted: '1.0 FLO',
                amountDecimals: (1.0 * 1e18).toString(),
                pricePerToken: floPrice,
                summary: '$1.00 (~1.0 FLO) - Short videos (5s)'
              },
              {
                token: 'FLO',
                tokenName: 'FLO Standard',
                amount: 2.0,
                amountFormatted: '2.0 FLO',
                amountDecimals: (2.0 * 1e18).toString(),
                pricePerToken: floPrice,
                summary: '$2.00 (~2.0 FLO) - Standard videos (10s)'
              },
              {
                token: 'FLO',
                tokenName: 'FLO Long',
                amount: 4.0,
                amountFormatted: '4.0 FLO',
                amountDecimals: (4.0 * 1e18).toString(),
                pricePerToken: floPrice,
                summary: '$4.00 (~4.0 FLO) - Long videos (20s)'
              },
              {
                token: 'S',
                tokenName: 'Sonic Token',
                amount: Math.round((2.0 / sonicPrice) * 100) / 100,
                amountFormatted: `${Math.round((2.0 / sonicPrice) * 100) / 100} S`,
                amountDecimals: (Math.round((2.0 / sonicPrice) * 100) / 100 * 1e18).toString(),
                pricePerToken: sonicPrice,
                summary: `~$2.00 (~${Math.round((2.0 / sonicPrice) * 100) / 100} S) - Pay with Sonic`
              }
            ]
          }
        },
        timestamp: Date.now(),
        cacheDuration: '5 minutes'
      }

      setPriceData(calculatedData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch pricing data:', error)
      
      // Fallback static data
      const fallbackData = {
        network: network,
        networkDisplay: network === 'mainnet' ? 'Sonic Mainnet' : 'Sonic Testnet',
        pricing: {
          image: {
            service: 'Image Generation',
            targetUSD: 'Variable by complexity',
            targetFormatted: 'Based on prompt complexity',
            options: [
              {
                token: 'FLO',
                tokenName: 'FLO Simple',
                amount: 0.25,
                amountFormatted: '0.25 FLO',
                amountDecimals: (0.25 * 1e18).toString(),
                pricePerToken: 1.0,
                summary: '$0.25 (~0.25 FLO) - Simple images'
              },
              {
                token: 'S',
                tokenName: 'Sonic Token',
                amount: 3.28,
                amountFormatted: '3.28 S',
                amountDecimals: (3.28 * 1e18).toString(),
                pricePerToken: 0.305,
                summary: '~$1.00 (~3.28 S) - Pay with Sonic'
              }
            ]
          },
          video: {
            service: 'Video Generation',
            targetUSD: 'Variable by length & quality',
            targetFormatted: 'Based on duration and quality',
            options: [
              {
                token: 'FLO',
                tokenName: 'FLO Standard',
                amount: 2.0,
                amountFormatted: '2.0 FLO',
                amountDecimals: (2.0 * 1e18).toString(),
                pricePerToken: 1.0,
                summary: '$2.00 (~2.0 FLO) - Standard videos'
              },
              {
                token: 'S',
                tokenName: 'Sonic Token',
                amount: 6.56,
                amountFormatted: '6.56 S',
                amountDecimals: (6.56 * 1e18).toString(),
                pricePerToken: 0.305,
                summary: '~$2.00 (~6.56 S) - Pay with Sonic'
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
    fetchPriceData()
    
    // Update prices every 5 minutes
    const interval = setInterval(fetchPriceData, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [network])

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <Card className="bg-gray-900/90 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
              <span className="text-gray-400">Loading prices...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!priceData) return null

  if (compact) {
    return (
      <div className={`w-full ${className}`}>
        <Card className="bg-gray-900/90 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-blue-400 border-blue-500">
                  {priceData.networkDisplay}
                </Badge>
                <span className="text-gray-400">|</span>
                <div className="flex items-center space-x-1">
                  <ImageIcon className="h-3 w-3 text-green-400" />
                  <span className="text-gray-300">from {priceData.pricing.image.options[0].amountFormatted}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Video className="h-3 w-3 text-purple-400" />
                  <span className="text-gray-300">from {priceData.pricing.video.options[0].amountFormatted}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchPriceData}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      <Card className="bg-gray-900/90 border-gray-700 shadow-xl">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-500">
                  Live Pricing • {priceData.networkDisplay}
                </Badge>
                <Badge variant="outline" className="text-green-400 border-green-500">
                  ● Online
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                {lastUpdate && (
                  <span className="text-xs text-gray-500">
                    Updated {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={fetchPriceData}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Pricing Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Image Generation */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">{priceData.pricing.image.service}</h3>
                </div>
                <div className="space-y-2">
                  {priceData.pricing.image.options.slice(0, 2).map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          option.token === 'FLO' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          {option.token}
                        </div>
                        <span className="text-gray-300 text-sm">{option.tokenName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{option.amountFormatted}</div>
                        <div className="text-xs text-gray-400">
                          ${(option.amount * option.pricePerToken).toFixed(2)} USD
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video Generation */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Video className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">{priceData.pricing.video.service}</h3>
                </div>
                <div className="space-y-2">
                  {priceData.pricing.video.options.slice(0, 2).map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          option.token === 'FLO' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          {option.token}
                        </div>
                        <span className="text-gray-300 text-sm">{option.tokenName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{option.amountFormatted}</div>
                        <div className="text-xs text-gray-400">
                          ${(option.amount * option.pricePerToken).toFixed(2)} USD
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
              {!isConnected ? (
                <Button
                  onClick={handleConnectWallet}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet to Start
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleBuyCredits}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Buy Credits
                  </Button>
                  <Button
                    onClick={handleBuyFLOAI}
                    variant="outline"
                    className="flex-1 border-blue-500 text-blue-400 hover:bg-blue-600/10"
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    Get FLO Tokens
                  </Button>
                </>
              )}
            </div>

            {/* Footer Info */}
            <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-800">
              Prices update every {priceData.cacheDuration} • Powered by Sonic blockchain • Real-time token prices
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}