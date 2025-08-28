"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coins, Plus, ExternalLink } from "lucide-react"
import { toast } from "react-hot-toast"
import { useAccount, useChainId } from "wagmi"
import { SONIC_TESTNET_CHAIN_ID } from "@/lib/network-config"

interface TokenInfo {
  address: string
  symbol: string
  decimals: number
  name: string
}

const TESTNET_TOKENS: TokenInfo[] = [
  {
    address: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
    symbol: 'wS',
    decimals: 18,
    name: 'Wrapped Sonic'
  },
  {
    address: '0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin'
  },
  {
    address: '0xc777Fa50186362fe0EF9CCD579b6385cE7CB49f1',
    symbol: 'SSStt',
    decimals: 18,
    name: 'Sonic Speed and Scalability Test Token'
  },
  {
    address: '0xAF93888cbD250300470A1618206e036E11470149',
    symbol: 'CORAL',
    decimals: 18,
    name: 'Coral Token'
  }
]

export function AddTokensButton() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  
  const isOnTestnet = chainId === SONIC_TESTNET_CHAIN_ID
  
  const addTokenToWallet = async (token: TokenInfo) => {
    if (!window.ethereum) {
      toast.error('MetaMask not detected')
      return
    }
    
    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: token.address,
            symbol: token.symbol,
            decimals: token.decimals,
            image: '', // Optional token logo
          },
        },
      })
      
      if (wasAdded) {
        toast.success(`${token.symbol} added to wallet!`)
      } else {
        toast.error(`Failed to add ${token.symbol}`)
      }
    } catch (error) {
      console.error('Error adding token:', error)
      toast.error(`Error adding ${token.symbol}: ${error.message}`)
    }
  }
  
  const addAllTokens = async () => {
    toast.loading('Adding all testnet tokens...', { id: 'add-all' })
    
    try {
      for (const token of TESTNET_TOKENS) {
        await addTokenToWallet(token)
        // Small delay between additions
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      toast.success('All tokens added!', { id: 'add-all' })
    } catch (error) {
      toast.error('Error adding tokens', { id: 'add-all' })
    }
  }
  
  if (!isConnected) {
    return null
  }
  
  if (!isOnTestnet) {
    return (
      <Card className="bg-yellow-900/20 border-yellow-600">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-yellow-400">
            <Coins className="h-4 w-4" />
            <span className="text-sm">Switch to Sonic Testnet to add test tokens</span>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Coins className="h-4 w-4" />
          Add Testnet Tokens
          <Badge variant="outline" className="text-xs">Sonic Testnet</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-gray-400 mb-3">
          Add these tokens to your wallet to see balances and make payments:
        </div>
        
        <Button
          onClick={addAllTokens}
          variant="outline"
          size="sm"
          className="w-full border-blue-600 text-blue-400 hover:bg-blue-900/20"
        >
          <Plus className="h-3 w-3 mr-2" />
          Add All Tokens
        </Button>
        
        <div className="grid grid-cols-2 gap-2">
          {TESTNET_TOKENS.map((token) => (
            <Button
              key={token.symbol}
              onClick={() => addTokenToWallet(token)}
              variant="ghost"
              size="sm"
              className="h-auto p-2 flex flex-col items-center text-xs hover:bg-gray-700/50"
            >
              <span className="font-medium">{token.symbol}</span>
              <span className="text-gray-500 text-xs">{token.name}</span>
            </Button>
          ))}
        </div>
        
        <div className="pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Need testnet tokens?</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={() => window.open('https://testnet.sonicscan.org/', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Faucet
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Declare global ethereum object for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: any) => Promise<any>
    }
  }
}