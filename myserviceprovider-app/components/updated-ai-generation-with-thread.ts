// components/ai-generation.tsx (Updated version)
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ImageIcon, Video, Wallet, Clock, CheckCircle, Loader2, Zap, LogIn, User, ExternalLink, Trophy, Star } from "lucide-react"
import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser } from "@web3auth/modal/react"
import { useAccount, useBalance, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther, formatEther, parseUnits } from "viem"
import { useRouter } from "next/navigation"

// Contract addresses and configurations
const SONIC_CHAIN_ID = 146
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT
const VOTING_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VOTING_CONTRACT
const S_TOKEN_ADDRESS = "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38"
const USDC_ADDRESS = "0x29219dd400f2Bf60E5a23d13Be72B486D4038894"

// Contract ABIs
const CONTRACT_ABI = [
  {
    "inputs": [{"name": "prompt", "type": "string"}, {"name": "generationType", "type": "string"}],
    "name": "payWithS",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "prompt", "type": "string"}, {"name": "generationType", "type": "string"}],
    "name": "payWithUSDC", 
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "prompt", "type": "string"}, {"name": "generationType", "type": "string"}],
    "name": "useCredits",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getUserStats",
    "outputs": [{"name": "generations", "type": "uint256"}, {"name": "credits", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

const VOTING_ABI = [
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "canVote",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

interface GenerationItem {
  id: string
  type: 'image' | 'video'
  prompt: string
  status: 'processing' | 'completed' | 'failed'
  result?: string[]
  createdAt: string
  walletAddress: string
  paymentMethod: 'S' | 'USDC' | 'credits' | 'free'
  transactionHash?: string
  submittedToThread: boolean
}

interface UserStats {
  totalGenerations: number
  totalUpvotes: number
  leaderboardPoints: number
  weeklyRank?: number
  globalRank?: number
  canVote: boolean
}

export function AIGeneration() {
  const [generations, setGenerations] = useState<GenerationItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [generationType, setGenerationType] = useState<'image' | 'video'>('image')
  const [userCredits, setUserCredits] = useState(0)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [latestGeneration, setLatestGeneration] = useState<GenerationItem | null>(null)
  
  const router = useRouter()
  
  // Web3Auth hooks
  const { connect, isConnected: isWeb3AuthConnected, loading: connectLoading } = useWeb3AuthConnect()
  const { disconnect } = useWeb3AuthDisconnect()
  const { userInfo } = useWeb3AuthUser()
  
  // Wagmi hooks
  const { address, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  
  // Token balances
  const { data: sBalance } = useBalance({
    address: address,
    token: S_TOKEN_ADDRESS as `0x${string}`,
  })
  
  const { data: usdcBalance } = useBalance({
    address: address,
    token: USDC_ADDRESS as `0x${string}`,
  })
  
  // Contract interactions
  const { writeContract, data: hash, isPending: isContractPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (isConnected && address) {
      fetchUserStats()
      fetchGenerationHistory()
    }
  }, [isConnected, address])

  useEffect(() => {
    if (isConfirmed && hash) {
      // Transaction confirmed, refresh data
      fetchUserStats()
      fetchGenerationHistory()
      setIsGenerating(false)
    }
  }, [isConfirmed, hash])

  const fetchUserStats = async () => {
    if (!address) return
    
    try {
      // Fetch from your API that combines contract data
      const response = await fetch('/api/user/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address })
      })
      
      const data = await response.json()
      if (data.success) {
        setUserStats({
          totalGenerations: data.stats.totalGenerationsCreated,
          totalUpvotes: data.stats.totalUpvotesReceived,
          leaderboardPoints: data.stats.leaderboardPoints,
          canVote: data.stats.canVote,
          weeklyRank: data.stats.weeklyRank,
          globalRank: data.stats.globalRank
        })
      }
      
      // Also get credits from payment contract
      // This would come from contract read
      setUserCredits(5) // Placeholder
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const fetchGenerationHistory = async () => {
    if (!address) return
    
    try {
      // Fetch user's generation history
      const response = await fetch('/api/user/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address })
      })
      
      const data = await response.json()
      if (data.success) {
        setGenerations(data.generations || [])
      }
    } catch (error) {
      console.error('Error fetching generation history:', error)
    }
  }

  const handleConnect = async () => {
    try {
      await connect()
      
      // Switch to Sonic network if not already on it
      if (isConnected) {
        try {
          await switchChain({ chainId: SONIC_CHAIN_ID })
        } catch (error) {
          console.error('Failed to switch to Sonic network:', error)
        }
      }
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Disconnect failed:', error)
    }
  }

  const submitGenerationToContract = async (generationData: {
    id: string
    prompt: string
    resultUrl: string
    paymentTx?: string
  }) => {
    try {
      const response = await fetch('/api/generations/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
        },
        body: JSON.stringify({
          generationId: generationData.id,
          creator: address,
          prompt: generationData.prompt,
          resultUrl: generationData.resultUrl,
          type: generationType,
          paymentMethod: generationData.paymentTx ? 'crypto' : 'free',
          transactionHash: generationData.paymentTx
        })
      })

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Error submitting to contract:', error)
      return false
    }
  }

  const handlePayWithS = async () => {
    if (!prompt.trim() || !address) return
    
    setIsGenerating(true)
    
    try {
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'payWithS',
        args: [prompt, generationType],
      })
      
    } catch (error) {
      console.error('Payment with S failed:', error)
      setIsGenerating(false)
    }
  }

  const handlePayWithUSDC = async () => {
    if (!prompt.trim() || !address) return
    
    setIsGenerating(true)
    
    try {
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'payWithUSDC',
        args: [prompt, generationType],
      })
      
    } catch (error) {
      console.error('Payment with USDC failed:', error)
      setIsGenerating(false)
    }
  }

  const handleUseCredits = async () => {
    if (!prompt.trim() || !address || userCredits === 0) return
    
    setIsGenerating(true)
    
    try {
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'useCredits',
        args: [prompt, generationType],
      })
      
    } catch (error) {
      console.error('Credit usage failed:', error)
      setIsGenerating(false)
    }
  }

  const handleFreeGeneration = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    
    try {
      // Call MCP generation API
      const response = await fetch('/api/mcp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: generationType,
          prompt,
          paymentType: 'free',
          userAddress: address || 'anonymous'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const generationId = `gen_${Date.now()}_${Math.random().toString(36).slice(2)}`
        const resultUrl = data.imageData ? `data:image/png;base64,${data.imageData}` : data.videoUrl
        
        // Create generation record
        const newGeneration: GenerationItem = {
          id: generationId,
          type: generationType,
          prompt,
          status: 'completed',
          result: [resultUrl],
          createdAt: new Date().toISOString(),
          walletAddress: address || 'anonymous',
          paymentMethod: 'free',
          submittedToThread: false
        }
        
        // Add to local state
        setGenerations(prev => [newGeneration, ...prev])
        setLatestGeneration(newGeneration)
        
        // If user is connected, submit to voting contract for thread
        if (address) {
          const submitted = await submitGenerationToContract({
            id: generationId,
            prompt,
            resultUrl
          })
          
          if (submitted) {
            setGenerations(prev => 
              prev.map(gen => 
                gen.id === generationId 
                  ? { ...gen, submittedToThread: true }
                  : gen
              )
            )
          }
        }
        
        setPrompt("")
        setShowSuccessDialog(true)
      } else {
        throw new Error(data.error || 'Generation failed')
      }
    } catch (error) {
      console.error('Free generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle successful paid generation
  useEffect(() => {
    if (isConfirmed && hash) {
      handlePaidGenerationSuccess()
    }
  }, [isConfirmed, hash])

  const handlePaidGenerationSuccess = async () => {
    if (!prompt || !address) return

    try {
      // Call MCP generation API with payment confirmation
      const response = await fetch('/api/mcp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: generationType,
          prompt,
          paymentTx: hash,
          userAddress: address,
          paymentType: 'crypto'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const generationId = `gen_${Date.now()}_${Math.random().toString(36).slice(2)}`
        const resultUrl = data.imageData ? `data:image/png;base64,${data.imageData}` : data.videoUrl
        
        const newGeneration: GenerationItem = {
          id: generationId,
          type: generationType,
          prompt,
          status: 'completed',
          result: [resultUrl],
          createdAt: new Date().toISOString(),
          walletAddress: address,
          paymentMethod: 'S', // Determine based on which payment method was used
          transactionHash: hash,
          submittedToThread: false
        }
        
        setGenerations(prev => [newGeneration, ...prev])
        setLatestGeneration(newGeneration)
        
        // Submit to voting contract
        const submitted = await submitGenerationToContract({
          id: generationId,
          prompt,
          resultUrl,
          paymentTx: hash
        })
        
        if (submitted) {
          newGeneration.submittedToThread = true
        }
        
        setPrompt("")
        setShowSuccessDialog(true)
      }
    } catch (error) {
      console.error('Paid generation processing failed:', error)
    }
  }

  if (!isWeb3AuthConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700 max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Connect Your Wallet
            </CardTitle>
            <p className="text-gray-400">Connect your wallet to start generating AI content</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleConnect}
              disabled={connectLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {connectLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </>
              )}
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">Or try free generation without wallet</p>
              <Button
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                onClick={() => {
                  setGenerations([])
                }}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Try Free Generation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              AI Generation Studio
            </h1>
            <p className="text-gray-400 mt-2">Create • Share • Compete • Earn rewards</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* User Stats */}
            {userStats && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      <div className="text-xs">
                        <div className="font-medium">#{userStats.globalRank || '--'}</div>
                        <div className="text-gray-400">Global</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-purple-400" />
                      <div className="text-xs">
                        <div className="font-medium">{userStats.leaderboardPoints}</div>
                        <div className="text-gray-400">Points</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Wallet Info */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-green-400" />
                  <div>
                    <div className="text-sm font-medium">
                      {userInfo?.name || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                    </div>
                    <div className="text-xs text-gray-400">
                      {userStats?.canVote ? 'Can vote' : 'Need NFT to vote'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDisconnect}
                    className="h-6 px-2 text-xs text-red-400 hover:text-red-300"
                  >
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => router.push('/thread')}
            variant="outline"
            className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
          >
            <Trophy className="h-4 w-4 mr-2" />
            View Generation Thread
          </Button>
          <Button
            onClick={() => router.push('/staking')}
            variant="outline"
            className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
          >
            <Star className="h-4 w-4 mr-2" />
            Stake NFTs
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Generation Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Create Content
                </CardTitle>
                <p className="text-sm text-gray-400">
                  Generate AI content and submit to the community thread
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={generationType === 'image' ? 'default' : 'outline'}
                    onClick={() => setGenerationType('image')}
                    className="w-full"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Image
                  </Button>
                  <Button
                    variant={generationType === 'video' ? 'default' : 'outline'}
                    onClick={() => setGenerationType('video')}
                    className="w-full"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Video
                  </Button>
                </div>

                {/* Prompt Input */}
                <div>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Describe the ${generationType} you want to generate...`}
                    rows={4}
                    className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Payment Options */}
                <div className="space-y-3">
                  {/* Free Generation */}
                  <Button
                    onClick={handleFreeGeneration}
                    disabled={isGenerating || !prompt.trim()}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Free Generation (HuggingFace)
                      </>
                    )}
                  </Button>

                  {/* Credits */}
                  {userCredits > 0 && (
                    <Button
                      onClick={handleUseCredits}
                      disabled={isGenerating || !prompt.trim() || isContractPending}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Use Credits (1 credit)
                    </Button>
                  )}

                  {/* Paid Options */}
                  <Button
                    onClick={handlePayWithS}
                    disabled={isGenerating || !prompt.trim() || isContractPending}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    🏆 Pay with 3 S • Premium Quality
                  </Button>

                  <Button
                    onClick={handlePayWithUSDC}
                    disabled={isGenerating || !prompt.trim() || isContractPending}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  >
                    💳 Pay with 1 USDC • Premium Quality
                  </Button>
                </div>

                {/* Balance Display */}
                <div className="pt-4 border-t border-gray-700">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Credits:</span>
                      <span>{userCredits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">S Balance:</span>
                      <span>{sBalance ? `${formatEther(sBalance.value)} S` : '0 S'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">USDC Balance:</span>
                      <span>{usdcBalance ? `${formatEther(usdcBalance.value)} USDC` : '0 USDC'}</span>
                    </div>
                  </div>
                </div>

                {/* Transaction Status */}
                {hash && (
                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      {isConfirming ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                          <span className="text-orange-400">Confirming transaction...</span>
                        </>
                      ) : isConfirmed ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span className="text-green-400">Transaction confirmed!</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-yellow-400" />
                          <span className="text-yellow-400">Transaction pending...</span>
                        </>
                      )}
                    </div>
                    <a
                      href={`https://sonicscan.org/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                    >
                      View on Sonicscan <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Your Generations */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Your Generations</CardTitle>
                <p className="text-sm text-gray-400">
                  Your AI creations • {address ? 'Auto-submitted to thread' : 'Connect wallet to submit to thread'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {generations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No generations yet. Create your first one!
                    </div>
                  ) : (
                    generations.map((gen) => (
                      <div key={gen.id} className="bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                              {gen.walletAddress?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {gen.walletAddress?.slice(0, 6)}...{gen.walletAddress?.slice(-4)}
                              </div>
                              <div className="text-xs text-gray-400 flex items-center gap-2">
                                Paid with {gen.paymentMethod}
                                {gen.submittedToThread && (
                                  <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                                    In Thread
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {gen.type === 'image' ? <ImageIcon className="h-3 w-3 mr-1" /> : <Video className="h-3 w-3 mr-1" />}
                              {gen.type}
                            </Badge>
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          </div>
                        </div>
                        
                        <div className="text-sm mb-3">{gen.prompt}</div>
                        
                        {gen.status === 'completed' && gen.result && (
                          <div className="bg-gray-800 rounded-lg p-2">
                            {gen.type === 'image' ? (
                              <img src={gen.result[0]} alt="Generated" className="w-full rounded" />
                            ) : (
                              <video src={gen.result[0]} controls className="w-full rounded" />
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                          <span>{new Date(gen.createdAt).toLocaleString()}</span>
                          <div className="flex items-center gap-2">
                            {gen.transactionHash && (
                              <a
                                href={`https://sonicscan.org/tx/${gen.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                              >
                                TX <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {gen.submittedToThread && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/thread?highlight=${gen.id}`)}
                                className="h-6 px-2 text-xs"
                              >
                                View in Thread
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                Generation Complete!
              </DialogTitle>
              <DialogDescription>
                Your AI generation has been created successfully
                {latestGeneration?.submittedToThread && ' and submitted to the community thread for voting!'}
              </DialogDescription>
            </DialogHeader>
            
            {latestGeneration && (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-2">
                  {latestGeneration.type === 'image' ? (
                    <img src={latestGeneration.result?.[0]} alt="Generated" className="w-full rounded" />
                  ) : (
                    <video src={latestGeneration.result?.[0]} controls className="w-full rounded" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-400">Prompt:</span>
                    <p className="text-sm">{latestGeneration.prompt}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Type:</span> {latestGeneration.type}
                    </div>
                    <div>
                      <span className="text-gray-400">Payment:</span> {latestGeneration.paymentMethod}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {latestGeneration.submittedToThread && (
                    <Button
                      onClick={() => {
                        setShowSuccessDialog(false)
                        router.push(`/thread?highlight=${latestGeneration.id}`)
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      View in Thread
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowSuccessDialog(false)}
                    className="border-gray-600"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}