"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Filter, 
  Search, 
  TrendingUp, 
  Clock, 
  Star, 
  Trophy,
  Crown,
  ImageIcon,
  Video,
  ExternalLink,
  Loader2,
  CheckCircle,
  X
} from "lucide-react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { formatEther } from "viem"

// Contract addresses
const VOTING_CONTRACT_ADDRESS = "0x..." // New voting contract needed
const BANDIT_KIDZ_NFT_ADDRESS = "0x45bc8a938e487fde4f31a7e051c2b63627f6f966"

// Voting contract ABI
const VOTING_ABI = [
  {
    "inputs": [{"name": "generationId", "type": "string"}],
    "name": "upvoteGeneration",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "generationId", "type": "string"}],
    "name": "getVoteCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getUserStakedNFTCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

interface Generation {
  id: string
  type: 'image' | 'video'
  prompt: string
  result: string[]
  walletAddress: string
  paymentMethod: string
  transactionHash?: string
  upvotes: number
  hasVoted: boolean
  isCreator: boolean
  createdAt: string
  leaderboardRank?: number
  weeklyRank?: number
  userStakedNFTs: number
}

interface WeeklyContest {
  id: string
  title: string
  description: string
  prize: string
  startDate: string
  endDate: string
  isActive: boolean
}

interface GenerationThreadProps {
  initialGenerations?: Generation[]
  weeklyContest?: WeeklyContest
}

type FilterState = {
  timeframe: 'all' | 'today' | 'week' | 'month'
  type: 'all' | 'image' | 'video'
  sortBy: 'newest' | 'trending' | 'top'
  stakedOnly: boolean
}

export function GenerationThread({ initialGenerations = [], weeklyContest }: GenerationThreadProps) {
  const { address, isConnected } = useAccount()
  const [generations, setGenerations] = useState<Generation[]>(initialGenerations)
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterState>({
    timeframe: 'all',
    type: 'all',
    sortBy: 'newest',
    stakedOnly: false
  })

  // Wagmi hooks
  const { data: hash, writeContract, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Check if user has staked NFTs for voting eligibility
  const { data: stakedNFTCount } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: VOTING_ABI,
    functionName: 'getUserStakedNFTCount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  })

  const canVote = isConnected && stakedNFTCount && Number(stakedNFTCount) > 0

  // Load generations from API
  useEffect(() => {
    loadGenerations()
  }, [filters])

  const loadGenerations = async () => {
    setIsLoading(true)
    try {
      // This would call your API endpoint to get generation data
      // For now, using mock data
      const response = await fetch('/api/generations?' + new URLSearchParams({
        timeframe: filters.timeframe,
        type: filters.type,
        sortBy: filters.sortBy,
        stakedOnly: filters.stakedOnly.toString()
      }))
      
      if (response.ok) {
        const data = await response.json()
        setGenerations(data.generations || initialGenerations)
      }
    } catch (error) {
      console.error('Failed to load generations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpvote = async (generationId: string) => {
    if (!canVote || isPending) return

    try {
      writeContract({
        address: VOTING_CONTRACT_ADDRESS as `0x${string}`,
        abi: VOTING_ABI,
        functionName: 'upvoteGeneration',
        args: [generationId],
      })
    } catch (error) {
      console.error('Vote failed:', error)
    }
  }

  const handleShare = async (generation: Generation) => {
    if (navigator.share) {
      await navigator.share({
        title: `Check out this AI generation!`,
        text: generation.prompt,
        url: `${window.location.origin}/generation/${generation.id}`
      })
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(`${window.location.origin}/generation/${generation.id}`)
    }
  }

  // Filter generations based on search and filters
  const filteredGenerations = generations.filter(generation => {
    // Search filter
    if (searchQuery && !generation.prompt.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Timeframe filter
    if (filters.timeframe !== 'all') {
      const now = new Date()
      const createdAt = new Date(generation.createdAt)
      
      switch (filters.timeframe) {
        case 'today':
          if (now.getDate() !== createdAt.getDate()) return false
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          if (createdAt < weekAgo) return false
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          if (createdAt < monthAgo) return false
          break
      }
    }

    // Type filter
    if (filters.type !== 'all' && generation.type !== filters.type) {
      return false
    }

    // Staked only filter
    if (filters.stakedOnly && generation.userStakedNFTs === 0) {
      return false
    }

    return true
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'trending':
        // Simple trending algorithm: upvotes per hour since creation
        const hoursA = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60)
        const hoursB = (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60)
        const trendingA = a.upvotes / Math.max(hoursA, 1)
        const trendingB = b.upvotes / Math.max(hoursB, 1)
        return trendingB - trendingA
      case 'top':
        return b.upvotes - a.upvotes
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const created = new Date(dateString)
    const diffMs = now.getTime() - created.getTime()
    
    const minutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const getRankBadge = (rank?: number) => {
    if (!rank) return null
    
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-400" />
    if (rank <= 3) return <Trophy className="h-4 w-4 text-orange-400" />
    if (rank <= 10) return <Star className="h-4 w-4 text-blue-400" />
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Generation Thread
            </h1>
            <p className="text-gray-400 mt-2">Community showcase • Vote • Compete • Earn rewards</p>
          </div>
          
          {!canVote && isConnected && (
            <Card className="bg-red-900/20 border-red-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <X className="h-4 w-4" />
                  <span>Voting requires a staked BanditKidz NFT</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Weekly Contest Banner */}
        {weeklyContest?.isActive && (
          <Card className="mb-6 bg-gradient-to-r from-purple-900/30 via-blue-900/30 to-indigo-900/30 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    {weeklyContest.title}
                  </h2>
                  <p className="text-gray-300 mb-2">
                    Prize Pool: <span className="font-bold text-yellow-400">{weeklyContest.prize}</span>
                  </p>
                  <p className="text-sm text-gray-400">
                    Ends {new Date(weeklyContest.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="border-yellow-400 text-yellow-400 mb-2">
                    LIVE CONTEST
                  </Badge>
                  <div className="text-sm text-gray-400">
                    Vote for your favorites!
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="mb-6 bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="flex items-center gap-2 flex-1 min-w-64">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search generations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-900/50 border-gray-600"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <select
                  value={filters.timeframe}
                  onChange={(e) => setFilters(prev => ({ ...prev, timeframe: e.target.value as any }))}
                  className="bg-gray-900/50 border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>

                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                  className="bg-gray-900/50 border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                </select>

                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="bg-gray-900/50 border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="trending">Trending</option>
                  <option value="top">Top Voted</option>
                </select>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.stakedOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, stakedOnly: e.target.checked }))}
                    className="rounded"
                  />
                  Staked NFT holders only
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generation Grid */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="bg-gray-700 h-48 rounded"></div>
                    <div className="bg-gray-700 h-4 rounded w-3/4"></div>
                    <div className="bg-gray-700 h-4 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredGenerations.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No generations found. Try adjusting your filters.
            </div>
          ) : (
            filteredGenerations.map((generation) => (
              <Card key={generation.id} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
                <CardContent className="p-0">
                  {/* Media */}
                  <div className="relative aspect-square bg-gray-900 rounded-t-lg overflow-hidden">
                    {generation.type === 'image' ? (
                      <img
                        src={generation.result[0]}
                        alt={generation.prompt}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setSelectedGeneration(generation)}
                      />
                    ) : (
                      <video
                        src={generation.result[0]}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setSelectedGeneration(generation)}
                        controls={false}
                        muted
                        loop
                        autoPlay
                      />
                    )}
                    
                    {/* Type Badge */}
                    <Badge className="absolute top-3 left-3" variant="outline">
                      {generation.type === 'image' ? (
                        <><ImageIcon className="h-3 w-3 mr-1" /> Image</>
                      ) : (
                        <><Video className="h-3 w-3 mr-1" /> Video</>
                      )}
                    </Badge>

                    {/* Rank Badge */}
                    {generation.weeklyRank && (
                      <Badge className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-orange-500">
                        #{generation.weeklyRank} This Week
                      </Badge>
                    )}
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Prompt */}
                    <p className="text-sm line-clamp-2">{generation.prompt}</p>

                    {/* Creator Info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${generation.walletAddress}`} />
                        <AvatarFallback>{generation.walletAddress.slice(2, 4).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {generation.walletAddress.slice(0, 6)}...{generation.walletAddress.slice(-4)}
                          </span>
                          {getRankBadge(generation.leaderboardRank)}
                          {generation.userStakedNFTs > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {generation.userStakedNFTs} NFTs
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTimeAgo(generation.createdAt)} • Paid with {generation.paymentMethod}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={generation.hasVoted ? "default" : "outline"}
                          onClick={() => handleUpvote(generation.id)}
                          disabled={!canVote || generation.hasVoted || generation.isCreator || isPending}
                          className={generation.hasVoted ? "bg-red-500 hover:bg-red-600" : ""}
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Heart className={`h-4 w-4 ${generation.hasVoted ? 'fill-white' : ''}`} />
                          )}
                          <span className="ml-1">{generation.upvotes}</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShare(generation)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {generation.transactionHash && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`https://sonicscan.org/tx/${generation.transactionHash}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Transaction Status */}
                    {hash && generation.id === selectedGeneration?.id && (
                      <div className="text-sm space-y-2">
                        <div className="flex items-center gap-2">
                          {isConfirming ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                              <span className="text-orange-400">Confirming vote...</span>
                            </>
                          ) : isConfirmed ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              <span className="text-green-400">Vote confirmed!</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 text-yellow-400" />
                              <span className="text-yellow-400">Vote pending...</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Full Screen Modal */}
        <Dialog open={!!selectedGeneration} onOpenChange={() => setSelectedGeneration(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedGeneration?.type === 'image' ? (
                  <ImageIcon className="h-5 w-5" />
                ) : (
                  <Video className="h-5 w-5" />
                )}
                Generation Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedGeneration && (
              <div className="space-y-4">
                {/* Large Media */}
                <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                  {selectedGeneration.type === 'image' ? (
                    <img
                      src={selectedGeneration.result[0]}
                      alt={selectedGeneration.prompt}
                      className="w-full max-h-96 object-contain"
                    />
                  ) : (
                    <video
                      src={selectedGeneration.result[0]}
                      className="w-full max-h-96 object-contain"
                      controls
                    />
                  )}
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium mb-1">Prompt</h3>
                    <p className="text-gray-300">{selectedGeneration.prompt}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Creator:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span>{selectedGeneration.walletAddress}</span>
                        {getRankBadge(selectedGeneration.leaderboardRank)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Created:</span>
                      <div className="mt-1">{new Date(selectedGeneration.createdAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Payment:</span>
                      <div className="mt-1">{selectedGeneration.paymentMethod}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Upvotes:</span>
                      <div className="mt-1 flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {selectedGeneration.upvotes}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}