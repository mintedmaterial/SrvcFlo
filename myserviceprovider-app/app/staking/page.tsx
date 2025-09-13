"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Coins, 
  TrendingUp, 
  Lock, 
  Unlock,
  Calendar,
  Trophy,
  Star,
  Zap,
  Gift,
  ChevronRight
} from "lucide-react"

const stakingPools = [
  {
    id: 1,
    name: "BanditKidz Genesis",
    contract: "0x45bC8A938E487FdE4F31A7E051c2b63627F6f966",
    totalStaked: 1234,
    totalSupply: 5000,
    apy: 25.5,
    lockPeriod: "30 days",
    rewards: "S + Revenue Share",
    tier: "Premium",
    color: "from-purple-600 to-blue-600"
  },
  {
    id: 2,
    name: "ServiceFlow Founders",
    contract: "0xFounders...Contract",
    totalStaked: 567,
    totalSupply: 1000,
    apy: 45.2,
    lockPeriod: "90 days", 
    rewards: "S + Platform Access",
    tier: "Elite",
    color: "from-yellow-500 to-orange-600"
  },
  {
    id: 3,
    name: "AI Genesis Collection",
    contract: "0xAIGen...Contract",
    totalStaked: 890,
    totalSupply: 2500,
    apy: 18.7,
    lockPeriod: "14 days",
    rewards: "S Token",
    tier: "Standard",
    color: "from-green-500 to-teal-600"
  }
]

const userStats = {
  totalStaked: 5,
  totalRewards: 1247.85,
  weeklyEarnings: 86.42,
  portfolioValue: 15640.25
}

export default function StakingPage() {
  const [selectedPool, setSelectedPool] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-black pt-20 pb-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            NFT Staking Rewards
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Stake your NFTs to earn S tokens and revenue sharing rewards. 
            Lock your assets for higher yields and exclusive benefits.
          </p>
        </div>

        {/* User Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Staked</p>
                  <p className="text-2xl font-bold text-white">{userStats.totalStaked}</p>
                  <p className="text-purple-400 text-sm">NFTs</p>
                </div>
                <Lock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Rewards</p>
                  <p className="text-2xl font-bold text-white">{userStats.totalRewards.toFixed(2)}</p>
                  <p className="text-green-400 text-sm">S Tokens</p>
                </div>
                <Gift className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Weekly Earnings</p>
                  <p className="text-2xl font-bold text-white">{userStats.weeklyEarnings.toFixed(2)}</p>
                  <p className="text-blue-400 text-sm">S/week</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Portfolio Value</p>
                  <p className="text-2xl font-bold text-white">${userStats.portfolioValue.toLocaleString()}</p>
                  <p className="text-yellow-400 text-sm">USD</p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staking Pools */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Available Staking Pools</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {stakingPools.map((pool) => (
              <Card 
                key={pool.id} 
                className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedPool(pool.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg text-white">{pool.name}</CardTitle>
                    <Badge className={`bg-gradient-to-r ${pool.color} text-white border-none`}>
                      {pool.tier}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 font-mono">{pool.contract}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Pool Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">APY</p>
                      <p className="text-2xl font-bold text-green-400">{pool.apy}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Lock Period</p>
                      <p className="text-sm text-white font-medium">{pool.lockPeriod}</p>
                    </div>
                  </div>

                  {/* Pool Utilization */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-gray-400 text-sm">Pool Utilization</p>
                      <p className="text-sm text-gray-300">
                        {pool.totalStaked}/{pool.totalSupply}
                      </p>
                    </div>
                    <Progress 
                      value={(pool.totalStaked / pool.totalSupply) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Rewards */}
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Reward Token</p>
                    <div className="flex items-center space-x-2">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-white">{pool.rewards}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className={`w-full bg-gradient-to-r ${pool.color} hover:opacity-90 text-white`}
                  >
                    Stake NFTs
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Active Stakes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Your Active Stakes</h2>
          
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Lock className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Active Stakes</h3>
                <p className="text-gray-400 mb-6">
                  Connect your wallet and stake your NFTs to start earning rewards
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Connect Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Sharing Info */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Star className="h-12 w-12 text-purple-400" />
                    <Zap className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Revenue Sharing Program
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto mb-6">
                  BanditKidz NFT holders receive 25% of platform revenue through our staking rewards. 
                  The more you stake, the more you earn from our AI generation services.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-2">25%</div>
                    <div className="text-sm text-gray-400">Revenue Share</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 mb-2">50%</div>
                    <div className="text-sm text-gray-400">Dev & Operations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-2">25%</div>
                    <div className="text-sm text-gray-400">Treasury & Growth</div>
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