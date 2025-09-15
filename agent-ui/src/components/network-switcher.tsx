"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Network, CheckCircle, AlertCircle, Zap } from "lucide-react"
import { useAccount, useSwitchChain } from "wagmi"
import { toast } from "react-hot-toast"
import {
  SONIC_TESTNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  getNetworkConfig,
  getNetworkDisplayName,
  isTestnet,
  isMainnet,
  isSonicNetwork
} from "@/lib/network-config"

export function NetworkSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { chainId, isConnected } = useAccount()
  const { switchChain, isPending } = useSwitchChain()

  const currentNetworkConfig = chainId ? getNetworkConfig(chainId) : null
  const isCurrentNetworkSupported = chainId ? isSonicNetwork(chainId) : false

  const networks = [
    {
      chainId: SONIC_TESTNET_CHAIN_ID,
      name: 'Sonic Testnet',
      description: 'Development and testing environment',
      status: 'active',
      icon: '🧪',
      features: ['SSStt Token', 'CORAL Token', 'Free Testing', 'All Features'],
      rpcUrl: 'https://rpc.blaze.soniclabs.com',
      explorer: 'https://testnet.sonicscan.org'
    },
    {
      chainId: SONIC_MAINNET_CHAIN_ID,
      name: 'Sonic Mainnet',
      description: 'Production environment (contracts needed)',
      status: 'pending',
      icon: '🚀',
      features: ['Production Ready', 'Real Transactions', 'S Token', 'USDC'],
      rpcUrl: 'https://rpc.soniclabs.com',
      explorer: 'https://sonicscan.org'
    }
  ]

  const handleSwitchNetwork = async (targetChainId: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (chainId === targetChainId) {
      toast.success('Already connected to this network')
      setIsOpen(false)
      return
    }

    try {
      await switchChain({ chainId: targetChainId })
      toast.success(`Switched to ${getNetworkDisplayName(targetChainId)}`)
      setIsOpen(false)
    } catch (error) {
      console.error('Network switch failed:', error)
      toast.error('Failed to switch network')
    }
  }

  const getCurrentNetworkStatus = () => {
    if (!isConnected) return { status: 'disconnected', message: 'Wallet not connected' }
    if (!isCurrentNetworkSupported) return { status: 'unsupported', message: 'Unsupported network' }
    if (isTestnet(chainId!)) return { status: 'testnet', message: 'Sonic Testnet' }
    if (isMainnet(chainId!)) return { status: 'mainnet', message: 'Sonic Mainnet' }
    return { status: 'unknown', message: 'Unknown network' }
  }

  const networkStatus = getCurrentNetworkStatus()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`
            flex items-center gap-2 border-gray-600 text-sm
            ${networkStatus.status === 'testnet' ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' :
              networkStatus.status === 'mainnet' ? 'border-green-500/50 bg-green-500/10 text-green-400' :
              networkStatus.status === 'unsupported' ? 'border-red-500/50 bg-red-500/10 text-red-400' :
              'border-gray-600 text-gray-400'}
          `}
        >
          <Network className="h-4 w-4" />
          {isConnected ? (
            <>
              {networkStatus.status === 'testnet' && '🧪'}
              {networkStatus.status === 'mainnet' && '🚀'}
              {networkStatus.status === 'unsupported' && '⚠️'}
              {networkStatus.status === 'disconnected' && '🔌'}
              <span className="hidden sm:inline">{networkStatus.message}</span>
            </>
          ) : (
            <span>Select Network</span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Select Network
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose between Sonic Testnet for development or Mainnet for production use
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {networks.map((network) => {
            const isCurrentNetwork = chainId === network.chainId
            const networkConfig = getNetworkConfig(network.chainId)
            const hasContracts = networkConfig && networkConfig.contracts.payment
            
            return (
              <Card
                key={network.chainId}
                className={`
                  bg-gray-800/50 border-gray-700 cursor-pointer transition-all
                  ${isCurrentNetwork ? 'border-blue-500/50 bg-blue-500/10' : 'hover:border-gray-600'}
                  ${!hasContracts && network.chainId === SONIC_MAINNET_CHAIN_ID ? 'opacity-60' : ''}
                `}
                onClick={() => handleSwitchNetwork(network.chainId)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{network.icon}</span>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {network.name}
                          {isCurrentNetwork && (
                            <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                              Current
                            </Badge>
                          )}
                          {network.status === 'pending' && (
                            <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                              Pending Deployment
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-gray-400">{network.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {hasContracts ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Features</div>
                      <div className="space-y-1">
                        {network.features.map((feature, index) => (
                          <div key={index} className="text-xs text-gray-300 flex items-center gap-1">
                            <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Contract Status</div>
                      <div className="text-xs">
                        {hasContracts ? (
                          <span className="text-green-400">✓ Deployed</span>
                        ) : (
                          <span className="text-yellow-400">⏳ Pending</span>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-2 mb-1">Chain ID</div>
                      <div className="text-xs font-mono text-gray-300">{network.chainId}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      <a 
                        href={network.explorer} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 mr-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Block Explorer ↗
                      </a>
                    </div>
                    
                    <Button
                      size="sm"
                      disabled={isPending || !hasContracts && network.chainId === SONIC_MAINNET_CHAIN_ID}
                      className={`
                        ${isCurrentNetwork ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}
                        ${!hasContracts && network.chainId === SONIC_MAINNET_CHAIN_ID ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSwitchNetwork(network.chainId)
                      }}
                    >
                      {isPending ? (
                        <>
                          <Zap className="h-3 w-3 mr-1 animate-spin" />
                          Switching...
                        </>
                      ) : isCurrentNetwork ? (
                        'Connected'
                      ) : !hasContracts && network.chainId === SONIC_MAINNET_CHAIN_ID ? (
                        'Deploy Needed'
                      ) : (
                        'Switch Network'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">
            <strong>Network Information:</strong>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>• Testnet: Free testing environment with test tokens</div>
            <div>• Mainnet: Production environment with real value transactions</div>
            <div>• Always verify contract addresses before interacting</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}