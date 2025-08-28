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

// Authorized wallet addresses for admin access
const AUTHORIZED_ADMINS = [
  '0x742d35cc6569c2c0ba0000000000000000000000', // Replace with actual admin addresses
  '0x8ba1f109551bd432803012645hdjddjjdj',
  // Add more authorized wallet addresses here
]

export default function AdminAccess() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isConnected && address) {
      // Check if connected wallet is authorized
      const authorized = AUTHORIZED_ADMINS.some(
        adminAddress => adminAddress.toLowerCase() === address.toLowerCase()
      )
      setIsAuthorized(authorized)
      
      if (authorized) {
        // Auto-redirect authorized users to dashboard
        setTimeout(() => {
          router.push('/admin/dashboard')
        }, 2000)
      }
    }
    setLoading(false)
  }, [address, isConnected, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-400 text-lg">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Cyberpunk background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2300ff41" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
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
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Cyberpunk background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ff0041" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

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
      {/* Cyberpunk background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2300ff41" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

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
                Initializing iNFT agent dashboard...
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

                <div className="flex items-center justify-center text-green-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mr-3"></div>
                  <span>Loading agent dashboard</span>
                  <ArrowRight className="h-4 w-4 ml-2 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}