"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { 
  Bot, 
  Eye, 
  TrendingUp, 
  Image as ImageIcon, 
  Users, 
  Wallet,
  Shield,
  Zap,
  ArrowRight,
  Sparkles
} from "lucide-react"

import { isAuthorizedAdmin, isAuthorizedAdminSync } from '@/lib/auth-config'

export default function AdminAccess() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuthorization = async () => {
      if (isConnected && address) {
        try {
          // First check sync version for immediate feedback
          const syncAuthorized = isAuthorizedAdminSync(address)
          
          if (syncAuthorized) {
            setIsAuthorized(true)
            setLoading(false)
            // Auto-redirect authorized users to dashboard
            setTimeout(() => {
              router.push('/admin/dashboard')
            }, 2000)
            return
          }

          // Then check async version for NFT-based access
          const asyncAuthorized = await isAuthorizedAdmin(address)
          setIsAuthorized(asyncAuthorized)
          
          if (asyncAuthorized) {
            // Auto-redirect authorized users to dashboard
            setTimeout(() => {
              router.push('/admin/dashboard')
            }, 2000)
          }
        } catch (error) {
          console.error('Authorization check failed:', error)
          setIsAuthorized(false)
        }
      }
      setLoading(false)
    }

    checkAuthorization()
  }, [address, isConnected, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-400 text-lg">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden pt-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full">
            <Card className="bg-gray-900/90 border-green-500/30 shadow-2xl shadow-green-500/20 backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Shield className="h-16 w-16 text-green-500" />
                    <Zap className="h-6 w-6 text-green-400 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-white">
                  iNFT Agent Access
                </CardTitle>
                <p className="text-green-400 text-sm mt-2">
                  Connect wallet to access your AI agents
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-300 mb-4">
                    Connect your authorized wallet to manage your intelligent NFT agents
                  </p>
                  
                  <div className="flex justify-center">
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-black font-semibold px-8 py-3"
                    >
                      <Wallet className="h-5 w-5 mr-2" />
                      Connect Wallet
                    </Button>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-sm font-semibold text-green-400 mb-3">Available iNFT Agents:</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center text-gray-300">
                      <ImageIcon className="h-3 w-3 text-green-500 mr-2" />
                      Image Generation
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Eye className="h-3 w-3 text-green-500 mr-2" />
                      NFT Watcher
                    </div>
                    <div className="flex items-center text-gray-300">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-2" />
                      Pair Monitor
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Users className="h-3 w-3 text-green-500 mr-2" />
                      Social Agent
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full">
            <Card className="bg-gray-900/90 border-red-500/30 shadow-2xl shadow-red-500/20 backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <CardTitle className="text-2xl font-bold text-white">
                  Access Denied
                </CardTitle>
                <p className="text-red-400 text-sm mt-2">
                  Wallet not authorized for agent management
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <p className="text-gray-300 text-sm text-center">
                    Connected wallet: 
                  </p>
                  <p className="text-red-400 text-xs font-mono text-center mt-1 break-all">
                    {address}
                  </p>
                </div>

                <div className="bg-gray-900/40 border border-gray-600/30 rounded-lg p-4">
                  <h4 className="text-gray-300 text-sm font-semibold mb-2">Access Requirements:</h4>
                  <ul className="text-gray-400 text-xs space-y-1">
                    <li>• Hold any NFT from contract: <span className="text-blue-400 font-mono">0x45bC...f966</span></li>
                    <li>• Or be an authorized wallet address</li>
                    <li>• Team access available with specific Token IDs</li>
                  </ul>
                </div>

                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/')}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Return to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Authorized user - show loading before redirect
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full">
          <Card className="bg-gray-900/90 border-green-500/30 shadow-2xl shadow-green-500/20 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <div className="relative mx-auto mb-4">
                <Bot className="h-16 w-16 text-green-500" />
                <Sparkles className="h-6 w-6 text-green-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Access Granted
              </CardTitle>
              <p className="text-green-400 text-sm mt-2">
                Choose your access level
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-4">
                  Authorized Wallet
                </Badge>
                
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
                  <p className="text-gray-300 text-sm text-center">
                    Welcome back
                  </p>
                  <p className="text-green-400 text-xs font-mono text-center mt-1">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-black font-semibold"
                    onClick={() => router.push('/admin/dashboard')}
                  >
                    <Bot className="h-5 w-5 mr-2" />
                    User Agent Dashboard
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    onClick={() => {
                      // Open agent UI in new tab for development, or redirect for production
                      if (process.env.NODE_ENV === 'development') {
                        window.open('http://localhost:3000', '_blank')
                      } else {
                        window.open('https://app.srvcflo.com', '_blank')
                      }
                    }}
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Team Backend Agents
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}