"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown } from "lucide-react"
import { useAccount } from "wagmi"

interface SwapWidgetProps {
  className?: string
  defaultFromToken?: string
  defaultToToken?: string
}

export function OpenOceanSwapWidget({ 
  className = '', 
  defaultFromToken = 'wS',
  defaultToToken = 'USDC'
}: SwapWidgetProps) {
  const { address, chainId } = useAccount()

  // Sonic mainnet focused (with referral fee configured)
  const WIDGET_URL = process.env.NEXT_PUBLIC_WIDGET_URL // e.g. 'https://widget.openocean.finance?p=xxxx'
  
  const isMainnet = chainId === 146
  const isCorrectNetwork = isMainnet // Only show for Sonic mainnet


  return (
    <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-blue-400" />
            Token Swap
          </div>
          <Badge variant="outline" className="text-xs">
            Powered by OpenOcean
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-400">
          Swap tokens with referral rewards on Sonic Mainnet
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Status */}
        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
          <div>
            <div className="text-sm font-medium">
              {isMainnet ? 'Sonic Mainnet' : 'Switch to Sonic Mainnet'}
            </div>
            <div className="text-xs text-gray-400">
              Chain ID: {chainId || 'Not connected'} {isCorrectNetwork ? '✅' : '⚠️'}
            </div>
          </div>
          <Badge variant={isCorrectNetwork ? 'default' : 'destructive'} className="text-xs">
            {isCorrectNetwork ? 'Ready' : 'Wrong Network'}
          </Badge>
        </div>

        {/* OpenOcean Widget Iframe */}
        {isCorrectNetwork && (
          <div className="border border-gray-600 rounded-lg overflow-hidden">
            <iframe
              src={WIDGET_URL}
              width="100%"
              height="600"
              style={{ border: 'none', borderRadius: '8px' }}
              title="OpenOcean Swap Widget"
              allow="clipboard-read; clipboard-write"
            />
          </div>
        )}


        {/* Widget Features */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Best rates across all Sonic DEXs</p>
          <p>• Gas-optimized routing with MEV protection</p>
          <p>• Referral rewards for Srvcflo AI (0.75% fee)</p>
          <p>• Supports wS ↔ USDC.e swaps</p>
        </div>

        {/* Connected Wallet Info */}
        {address && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="text-xs text-green-400 mb-1">Wallet Connected</div>
            <div className="text-xs text-gray-300 font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          </div>
        )}

        {!address && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="text-xs text-yellow-400">
              Connect your wallet for the best experience
            </div>
          </div>
        )}

        {!isCorrectNetwork && chainId && (
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="text-xs text-orange-400">
              Please switch to Sonic Mainnet (Chain ID: 146) to use the swap widget
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
