"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Trophy, Clock, ImageIcon, Video, ExternalLink, Loader2 } from "lucide-react"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import NavigationMenu from "@/components/navigation-menu"
import { ClientOnlyWrapper } from "@/components/client-only-wrapper"

interface ThreadGeneration {
  id: string
  type: 'image' | 'video'
  prompt: string
  result: string[]
  createdAt: string
  walletAddress: string
  paymentMethod: 'S' | 'USDC' | 'credits' | 'free'
  transactionHash?: string
  upvotes: number
  downvotes: number
  userVote?: 'up' | 'down' | null
  leaderboardPoints: number
}

const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-400" />
      <p className="text-gray-400">Loading community thread...</p>
    </div>
  </div>
);

function ThreadPageContent() {
  const [generations, setGenerations] = useState<ThreadGeneration[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'recent' | 'upvotes' | 'points'>('upvotes')
  
  const { address } = useAccount()
  const router = useRouter()

  useEffect(() => {
    fetchThreadGenerations()
  }, [sortBy])

  const fetchThreadGenerations = async () => {
    try {
      setLoading(true)
      // This would fetch from your API that reads contract events
      const response = await fetch(`/api/thread/generations?sort=${sortBy}`)
      const data = await response.json()
      
      if (data.success) {
        setGenerations(data.generations || [])
      }
    } catch (error) {
      console.error('Error fetching thread generations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (generationId: string, voteType: 'up' | 'down') => {
    if (!address) {
      alert('Please connect your wallet to vote')
      return
    }

    try {
      const response = await fetch('/api/thread/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId,
          voteType,
          voterAddress: address
        })
      })

      const data = await response.json()
      if (data.success) {
        // Update local state
        setGenerations(prev => prev.map(gen => 
          gen.id === generationId 
            ? {
                ...gen,
                upvotes: data.newUpvotes,
                downvotes: data.newDownvotes,
                userVote: voteType,
                leaderboardPoints: data.newPoints
              }
            : gen
        ))
      }
    } catch (error) {
      console.error('Voting failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <NavigationMenu />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Generation Thread
            </h1>
            <p className="text-gray-400 mt-2">Community creations • Vote • Compete • Earn rewards</p>
          </div>
          
          <Button
            onClick={() => router.push('/generate')}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            Create Generation
          </Button>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={sortBy === 'upvotes' ? 'default' : 'outline'}
            onClick={() => setSortBy('upvotes')}
            size="sm"
          >
            <Trophy className="h-4 w-4 mr-1" />
            Top Voted
          </Button>
          <Button
            variant={sortBy === 'points' ? 'default' : 'outline'}
            onClick={() => setSortBy('points')}
            size="sm"
          >
            Leaderboard Points
          </Button>
          <Button
            variant={sortBy === 'recent' ? 'default' : 'outline'}
            onClick={() => setSortBy('recent')}
            size="sm"
          >
            <Clock className="h-4 w-4 mr-1" />
            Recent
          </Button>
        </div>

        {/* Thread Content */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400">Loading generations...</div>
            </div>
          ) : generations.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="text-center py-12">
                <div className="text-gray-400 mb-4">No generations in thread yet</div>
                <Button
                  onClick={() => router.push('/generate')}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  Be the first to create!
                </Button>
              </CardContent>
            </Card>
          ) : (
            generations.map((gen, index) => (
              <Card key={gen.id} className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Voting Panel */}
                    <div className="flex flex-col items-center gap-2 min-w-[60px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(gen.id, 'up')}
                        className={`p-2 ${gen.userVote === 'up' ? 'text-green-400' : 'text-gray-400 hover:text-green-400'}`}
                      >
                        <ArrowUp className="h-5 w-5" />
                      </Button>
                      
                      <div className="text-center">
                        <div className="font-bold text-lg">{gen.upvotes - gen.downvotes}</div>
                        <div className="text-xs text-gray-500">votes</div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(gen.id, 'down')}
                        className={`p-2 ${gen.userVote === 'down' ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
                      >
                        <ArrowDown className="h-5 w-5" />
                      </Button>
                      
                      <div className="text-center mt-2">
                        <div className="text-xs text-purple-400 font-medium">{gen.leaderboardPoints}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium">
                              {gen.walletAddress.slice(0, 6)}...{gen.walletAddress.slice(-4)}
                            </div>
                            <div className="text-sm text-gray-400 flex items-center gap-2">
                              <span>{new Date(gen.createdAt).toLocaleString()}</span>
                              <Badge variant="outline" className="text-xs">
                                {gen.type === 'image' ? <ImageIcon className="h-3 w-3 mr-1" /> : <Video className="h-3 w-3 mr-1" />}
                                {gen.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Paid with {gen.paymentMethod}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-300">{gen.prompt}</p>
                      </div>

                      {/* Generated Content */}
                      <div className="bg-gray-900/50 rounded-lg overflow-hidden mb-4">
                        {gen.type === 'image' ? (
                          <img 
                            src={gen.result[0]} 
                            alt="Generated content" 
                            className="w-full max-w-md mx-auto"
                          />
                        ) : (
                          <video 
                            src={gen.result[0]} 
                            controls 
                            className="w-full max-w-md mx-auto"
                          />
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-4">
                          <span>↑ {gen.upvotes} upvotes</span>
                          <span>↓ {gen.downvotes} downvotes</span>
                          <span className="text-purple-400">{gen.leaderboardPoints} points</span>
                        </div>
                        
                        {gen.transactionHash && (
                          <a
                            href={`https://sonicscan.org/tx/${gen.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            View TX <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function ThreadPage() {
  return (
    <ClientOnlyWrapper fallback={<LoadingFallback />}>
      <ThreadPageContent />
    </ClientOnlyWrapper>
  );
}