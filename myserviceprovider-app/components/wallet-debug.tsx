"use client"

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function WalletDebug() {
  const { address, isConnected, isConnecting, chainId, chain } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Wallet Connection Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Connection Status</h3>
          <div className="space-y-1 text-sm">
            <div>Connected: <span className="font-mono">{isConnected ? '✅ Yes' : '❌ No'}</span></div>
            <div>Connecting: <span className="font-mono">{isConnecting ? '⏳ Yes' : '✅ No'}</span></div>
            <div>Address: <span className="font-mono">{address || 'Not connected'}</span></div>
            <div>Chain ID: <span className="font-mono">{chainId || 'Unknown'}</span></div>
            <div>Chain Name: <span className="font-mono">{chain?.name || 'Unknown'}</span></div>
          </div>
        </div>

        {/* Available Connectors */}
        <div className="space-y-2">
          <h3 className="font-bold">Available Connectors</h3>
          {connectors.map((connector) => (
            <div key={connector.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">{connector.name}</div>
                <div className="text-sm text-gray-600">ID: {connector.id}</div>
                <div className="text-xs text-gray-500">
                  Ready: {connector.ready ? '✅' : '❌'}
                </div>
              </div>
              <Button
                onClick={() => connect({ connector })}
                disabled={!connector.ready || isConnecting}
                variant="outline"
                size="sm"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          ))}
        </div>

        {/* Disconnect Button */}
        {isConnected && (
          <Button onClick={() => disconnect()} variant="destructive" className="w-full">
            Disconnect Wallet
          </Button>
        )}

        {/* Browser Wallet Detection */}
        <div className="bg-yellow-50 p-4 rounded">
          <h3 className="font-bold mb-2">Browser Wallet Detection</h3>
          <div className="space-y-1 text-sm">
            <div>window.ethereum: <span className="font-mono">{typeof window !== 'undefined' && window.ethereum ? '✅ Detected' : '❌ Not found'}</span></div>
            <div>MetaMask: <span className="font-mono">{typeof window !== 'undefined' && window.ethereum?.isMetaMask ? '✅ Detected' : '❌ Not found'}</span></div>
            {typeof window !== 'undefined' && window.ethereum && (
              <div>Chain ID from wallet: <span className="font-mono">{window.ethereum.chainId || 'Unknown'}</span></div>
            )}
          </div>
        </div>

        {/* Manual Network Switch Test */}
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-bold mb-2">Manual Network Operations</h3>
          <div className="space-y-2">
            <Button
              onClick={async () => {
                try {
                  await window.ethereum?.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xdf36' }], // 57054 in hex (Sonic Testnet)
                  });
                } catch (error) {
                  console.error('Switch network error:', error);
                  // Try to add the network if it doesn't exist
                  try {
                    await window.ethereum?.request({
                      method: 'wallet_addEthereumChain',
                      params: [{
                        chainId: '0xdf36',
                        chainName: 'Sonic Blaze Testnet',
                        nativeCurrency: {
                          name: 'Sonic',
                          symbol: 'S',
                          decimals: 18,
                        },
                        rpcUrls: ['https://rpc.blaze.soniclabs.com'],
                        blockExplorerUrls: ['https://testnet.sonicscan.org'],
                      }],
                    });
                  } catch (addError) {
                    console.error('Add network error:', addError);
                  }
                }
              }}
              size="sm"
              variant="outline"
            >
              Switch to Sonic Testnet
            </Button>
            
            <Button
              onClick={async () => {
                try {
                  await window.ethereum?.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x92' }], // 146 in hex (Sonic Mainnet)
                  });
                } catch (error) {
                  console.error('Switch network error:', error);
                  // Try to add the network if it doesn't exist
                  try {
                    await window.ethereum?.request({
                      method: 'wallet_addEthereumChain',
                      params: [{
                        chainId: '0x92',
                        chainName: 'Sonic',
                        nativeCurrency: {
                          name: 'Sonic',
                          symbol: 'S',
                          decimals: 18,
                        },
                        rpcUrls: ['https://rpc.soniclabs.com'],
                        blockExplorerUrls: ['https://sonicscan.org'],
                      }],
                    });
                  } catch (addError) {
                    console.error('Add network error:', addError);
                  }
                }
              }}
              size="sm"
              variant="outline"
            >
              Switch to Sonic Mainnet
            </Button>
          </div>
        </div>

        {/* Console Log Helper */}
        <div className="text-xs text-gray-500 p-2 border rounded">
          💡 Check your browser console (F12) for detailed connection logs and errors.
        </div>
      </CardContent>
    </Card>
  )
}