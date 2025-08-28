"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Trophy, Zap, Clock, Star, Gift, TrendingUp, Users, Crown, CheckCircle, Loader2, ExternalLink } from "lucide-react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { formatEther, parseEther } from "viem"

import { getNetworkConfig, isTestnet } from "@/lib/network-config"

// Contract addresses - will be selected based on the connected network
const getContractAddresses = (chainId: number) => {
  const config = getNetworkConfig(chainId)
  if (!config) {
    throw new Error(`Unsupported network: ${chainId}`)
  }
  
  // For testnet, use TestNFT contract
  const nftAddress = isTestnet(chainId) 
    ? config.contracts.nft // Use TestNFT on testnet
    : "0x45bC8A938E487FdE4F31A7E051c2b63627F6f966" // Mainnet BanditKidz (corrected case)
    
  return {
    NFT_ADDRESS: nftAddress,
    STAKING_CONTRACT_ADDRESS: config.contracts.staking, // This should point to SrvcfloStaking
    PAYMENT_CONTRACT_ADDRESS: config.contracts.payment
  }
}

// Updated ABIs for SrvcfloStaking contract
const STAKING_ABI = [
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}, {"name": "lockPeriod", "type": "uint256"}],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenIds", "type": "uint256[]"}, {"name": "lockPeriod", "type": "uint256"}],
    "name": "stakeBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "unstake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenIds", "type": "uint256[]"}],
    "name": "unstakeBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "distributionIds", "type": "uint256[]"}],
    "name": "claimRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getUserStakedTokens",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getUserPendingRewards",
    "outputs": [{"name": "amounts", "type": "uint256[]"}, {"name": "tokens", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLockPeriodsAndBonuses",
    "outputs": [{"name": "periods", "type": "uint256[]"}, {"name": "bonuses", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "getStakeInfo",
    "outputs": [
      {"name": "stakeInfo", "type": "tuple", "components": [
        {"name": "staker", "type": "address"},
        {"name": "stakedAt", "type": "uint256"},
        {"name": "unstakedAt", "type": "uint256"},
        {"name": "lockPeriod", "type": "uint256"},
        {"name": "lockEndTime", "type": "uint256"},
        {"name": "bonusMultiplier", "type": "uint256"},
        {"name": "earlyUnstake", "type": "bool"},
        {"name": "lastClaimedDistribution", "type": "uint256"}
      ]},
      {"name": "isLocked", "type": "bool"},
      {"name": "timeUntilUnlock", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "isTokenStaked",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDistributionCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

const NFT_ABI = [
  {
    "inputs": [{"name": "to", "type": "address"}, {"name": "tokenId", "type": "uint256"}],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable", 
    "type": "function"
  },
  {
    "inputs": [{"name": "operator", "type": "address"}, {"name": "approved", "type": "bool"}],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

interface StakingStats {
  stakedNFTs: number[]
  totalStaked: number
  pendingRewards: { token: string; amount: string }[]
  leaderboardRank: number
  lockPeriods: { period: number; bonus: number }[]
}

interface StakeInfo {
  staker: string
  stakedAt: number
  unstakedAt: number
  lockPeriod: number
  lockEndTime: number
  bonusMultiplier: number
  earlyUnstake: boolean
  lastClaimedDistribution: number
  isLocked: boolean
  timeUntilUnlock: number
}

interface LeaderboardEntry {
  address: string
  stakedCount: number
  totalUpvotes: number
  leaderboardPoints: number
  rank: number
}

export function NFTStaking() {
  const [stakingStats, setStakingStats] = useState<StakingStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [selectedNFTs, setSelectedNFTs] = useState<number[]>([])
  const [userNFTs, setUserNFTs] = useState<number[]>([])
  const [selectedLockPeriod, setSelectedLockPeriod] = useState<number>(0) // 0 = no lock
  const [stakeInfos, setStakeInfos] = useState<Map<number, StakeInfo>>(new Map())
  const [activeTab, setActiveTab] = useState("stake")
  const [isLoading, setIsLoading] = useState(false)

  const { address, isConnected, chainId } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  // Get contract addresses based on current network
  const contractAddresses = chainId ? getContractAddresses(chainId) : null

  // Read staked NFTs
  const { data: stakedNFTs } = useReadContract({
    address: contractAddresses?.STAKING_CONTRACT_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'getUserStakedTokens',
    args: address ? [address] : undefined,
    query: { enabled: !!contractAddresses?.STAKING_CONTRACT_ADDRESS && !!address }
  })

  // Read pending rewards
  const { data: pendingRewards } = useReadContract({
    address: contractAddresses?.STAKING_CONTRACT_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'getUserPendingRewards',
    args: address ? [address] : undefined,
    query: { enabled: !!contractAddresses?.STAKING_CONTRACT_ADDRESS && !!address }
  })

  // Read lock periods and bonuses
  const { data: lockPeriodsData } = useReadContract({
    address: contractAddresses?.STAKING_CONTRACT_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'getLockPeriodsAndBonuses',
    query: { enabled: !!contractAddresses?.STAKING_CONTRACT_ADDRESS }
  })

  // Read distribution count
  const { data: distributionCount } = useReadContract({
    address: contractAddresses?.STAKING_CONTRACT_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'getDistributionCount',
    query: { enabled: !!contractAddresses?.STAKING_CONTRACT_ADDRESS }
  })

  useEffect(() => {
    if (isConnected && address) {
      fetchUserNFTs()
      fetchStakingStats()
      fetchLeaderboard()
    }
  }, [isConnected, address])

  useEffect(() => {
    if (isConfirmed) {
      fetchStakingStats()
      fetchLeaderboard()
      setSelectedNFTs([])
    }
  }, [isConfirmed])

  const fetchUserNFTs = async () => {
    if (!address) return
    
    try {
      // In a real implementation, you'd query the NFT contract or use a service like Alchemy
      // For now, using mock data
      const mockNFTs = [1, 2, 3, 4, 5] // User's owned NFT token IDs
      setUserNFTs(mockNFTs)
    } catch (error) {
      console.error('Error fetching user NFTs:', error)
    }
  }

  const fetchStakingStats = async () => {
    if (!address) return

    try {
      setIsLoading(true)
      
      // Process lock periods data
      const lockPeriods = lockPeriodsData ? 
        (lockPeriodsData[0] as bigint[]).map((period, index) => ({
          period: Number(period),
          bonus: Number((lockPeriodsData[1] as bigint[])[index]) / 100 // Convert from basis points to percentage
        })) : []

      // Process pending rewards
      const rewards = pendingRewards ? 
        (pendingRewards[0] as bigint[]).map((amount, index) => {
          const tokenAddress = (pendingRewards[1] as string[])[index]
          const tokenSymbol = tokenAddress === '0x0000000000000000000000000000000000000000' ? 'ETH' : 
                             tokenAddress.toLowerCase().includes('usdc') ? 'USDC' : 'S'
          return {
            token: tokenSymbol,
            amount: formatEther(amount)
          }
        }) : []

      // Combine on-chain data
      const stats: StakingStats = {
        stakedNFTs: (stakedNFTs as bigint[])?.map(id => Number(id)) || [],
        totalStaked: (stakedNFTs as bigint[])?.length || 0,
        pendingRewards: rewards,
        leaderboardRank: 0,
        lockPeriods: lockPeriods
      }

      setStakingStats(stats)

      // Fetch detailed stake info for each staked NFT
      if (stakedNFTs && contractAddresses) {
        const stakeInfoMap = new Map<number, StakeInfo>()
        for (const tokenIdBig of stakedNFTs as bigint[]) {
          const tokenId = Number(tokenIdBig)
          try {
            // This would need to be implemented with individual read calls or batch reads
            // For now, we'll set placeholder data
            stakeInfoMap.set(tokenId, {
              staker: address,
              stakedAt: Date.now() / 1000,
              unstakedAt: 0,
              lockPeriod: 0,
              lockEndTime: 0,
              bonusMultiplier: 10000,
              earlyUnstake: false,
              lastClaimedDistribution: 0,
              isLocked: false,
              timeUntilUnlock: 0
            })
          } catch (error) {
            console.error('Error fetching stake info for token', tokenId, error)
          }
        }
        setStakeInfos(stakeInfoMap)
      }
    } catch (error) {
      console.error('Error fetching staking stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      // This would come from your backend API that tracks upvotes and staking
      const response = await fetch('/api/leaderboard')
      const data = await response.json()
      setLeaderboard(data.leaderboard || [])
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      // Mock data for development
      setLeaderboard([
        { address: "0x1234...5678", stakedCount: 15, totalUpvotes: 245, leaderboardPoints: 1250, rank: 1 },
        { address: "0x2345...6789", stakedCount: 12, totalUpvotes: 198, leaderboardPoints: 1080, rank: 2 },
        { address: "0x3456...7890", stakedCount: 8, totalUpvotes: 156, leaderboardPoints: 890, rank: 3 },
      ])
    }
  }

  const handleStakeNFTs = async () => {
    if (!selectedNFTs.length || !contractAddresses) return

    try {
      // First approve the staking contract to transfer the NFTs
      writeContract({
        address: contractAddresses.NFT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'setApprovalForAll',
        args: [contractAddresses.STAKING_CONTRACT_ADDRESS as `0x${string}`, true],
      })

      // After approval is confirmed, stake the NFTs with the selected lock period
      // This would be a second transaction after the approval
      setTimeout(() => {
        if (selectedNFTs.length === 1) {
          // Single stake
          writeContract({
            address: contractAddresses.STAKING_CONTRACT_ADDRESS as `0x${string}`,
            abi: STAKING_ABI,
            functionName: 'stake',
            args: [BigInt(selectedNFTs[0]), BigInt(selectedLockPeriod)],
          })
        } else {
          // Batch stake
          writeContract({
            address: contractAddresses.STAKING_CONTRACT_ADDRESS as `0x${string}`,
            abi: STAKING_ABI,
            functionName: 'stakeBatch',
            args: [selectedNFTs.map(BigInt), BigInt(selectedLockPeriod)],
          })
        }
      }, 2000) // Wait for approval confirmation
      
    } catch (error) {
      console.error('Staking error:', error)
    }
  }

  const handleUnstakeNFTs = async () => {
    if (!selectedNFTs.length || !contractAddresses) return

    try {
      if (selectedNFTs.length === 1) {
        // Single unstake
        writeContract({
          address: contractAddresses.STAKING_CONTRACT_ADDRESS as `0x${string}`,
          abi: STAKING_ABI,
          functionName: 'unstake',
          args: [BigInt(selectedNFTs[0])],
        })
      } else {
        // Batch unstake
        writeContract({
          address: contractAddresses.STAKING_CONTRACT_ADDRESS as `0x${string}`,
          abi: STAKING_ABI,
          functionName: 'unstakeBatch',
          args: [selectedNFTs.map(BigInt)],
        })
      }
    } catch (error) {
      console.error('Unstaking error:', error)
    }
  }

  const handleClaimRewards = async () => {
    if (!contractAddresses || !distributionCount) return
    
    try {
      // Create array of all available distribution IDs to claim
      const distributionIds = Array.from(
        { length: Number(distributionCount) }, 
        (_, i) => BigInt(i)
      )
      
      writeContract({
        address: contractAddresses.STAKING_CONTRACT_ADDRESS as `0x${string}`,
        abi: STAKING_ABI,
        functionName: 'claimRewards',
        args: [distributionIds],
      })
    } catch (error) {
      console.error('Claim rewards error:', error)
    }
  }

  const formatTimeRemaining = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700 max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Connect Wallet
            </CardTitle>
            <p className="text-gray-400">Connect your wallet to access staking and leaderboards</p>
          </CardHeader>
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
              BanditKidz Staking
            </h1>
            <p className="text-gray-400 mt-2">Stake your NFTs • Earn rewards • Climb the leaderboard</p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <div>
                    <div className="text-sm font-medium">Rank #{stakingStats?.leaderboardRank || '--'}</div>
                    <div className="text-xs text-gray-400">Leaderboard</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple-400" />
                  <div>
                    <div className="text-sm font-medium">{stakingStats?.totalStaked || 0}</div>
                    <div className="text-xs text-gray-400">NFTs Staked</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-800/50 border-gray-700">
            <TabsTrigger value="stake" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Stake NFTs
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Claim Rewards
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Staking Tab */}
          <TabsContent value="stake" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Staking Interface */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Manage Staking
                  </CardTitle>
                  <p className="text-sm text-gray-400">
                    Stake your BanditKidz NFTs to earn rewards and participate in the leaderboard
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Lock Period Selection */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Lock Period (Optional)</h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {stakingStats?.lockPeriods.map((lockOption, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedLockPeriod(lockOption.period)}
                          className={`
                            p-3 rounded-lg border text-sm transition-all
                            ${selectedLockPeriod === lockOption.period
                              ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                              : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                            }
                          `}
                        >
                          <div className="font-medium">
                            {lockOption.period === 0 ? 'No Lock' : `${lockOption.period / (24 * 60 * 60)} Days`}
                          </div>
                          <div className="text-xs text-gray-400">
                            {lockOption.bonus}% rewards
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* NFT Selection */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Your NFTs</h3>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                      {userNFTs.map((tokenId) => {
                        const isStaked = stakingStats?.stakedNFTs.includes(tokenId)
                        const isSelected = selectedNFTs.includes(tokenId)
                        
                        return (
                          <div
                            key={tokenId}
                            onClick={() => {
                              if (isStaked) return // Can't select staked NFTs for staking
                              setSelectedNFTs(prev => 
                                isSelected 
                                  ? prev.filter(id => id !== tokenId)
                                  : [...prev, tokenId]
                              )
                            }}
                            className={`
                              relative aspect-square rounded-lg border-2 cursor-pointer transition-all
                              ${isStaked 
                                ? 'border-green-500 bg-green-500/20' 
                                : isSelected 
                                  ? 'border-orange-500 bg-orange-500/20' 
                                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                              }
                            `}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-bold">#{tokenId}</span>
                            </div>
                            {isStaked && (
                              <div className="absolute top-1 right-1">
                                <CheckCircle className="h-3 w-3 text-green-400" />
                              </div>
                            )}
                            {isSelected && !isStaked && (
                              <div className="absolute top-1 right-1">
                                <div className="h-3 w-3 rounded-full bg-orange-400" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleStakeNFTs}
                      disabled={!selectedNFTs.length || isPending || isConfirming}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      {isPending || isConfirming ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Staking...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Stake Selected ({selectedNFTs.length})
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleUnstakeNFTs}
                      disabled={!selectedNFTs.length || isPending || isConfirming}
                      variant="outline"
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      {isPending || isConfirming ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Unstaking...
                        </>
                      ) : (
                        <>
                          Unstake Selected ({selectedNFTs.length})
                        </>
                      )}
                    </Button>
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
                        href={chainId && isTestnet(chainId) 
                          ? `https://testnet.sonicscan.org/tx/${hash}`
                          : `https://sonicscan.org/tx/${hash}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                      >
                        View on {chainId && isTestnet(chainId) ? 'Testnet ' : ''}Sonicscan <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Staking Stats */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Staking Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Staking */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Currently Staked</span>
                      <span className="font-medium">{stakingStats?.totalStaked || 0} NFTs</span>
                    </div>
                    <Progress value={Math.min(100, (stakingStats?.totalStaked || 0) * 10)} className="h-2" />
                  </div>

                  {/* Selected Lock Period Info */}
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-medium">Selected Lock Period</span>
                    </div>
                    <div className="text-lg font-bold text-orange-400">
                      {selectedLockPeriod === 0 ? 'No Lock' : `${selectedLockPeriod / (24 * 60 * 60)} Days`}
                    </div>
                    <div className="text-sm text-gray-400">
                      {stakingStats?.lockPeriods.find(p => p.period === selectedLockPeriod)?.bonus || 100}% reward multiplier
                    </div>
                  </div>

                  {/* Staking Benefits */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Staking Benefits</h4>
                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        Periodic reward distributions (ETH & ERC20)
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        Leaderboard participation eligibility
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        Voting power in generation contests
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                        Lock bonuses: Up to 150% extra rewards (365 days)
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        Early unstake penalty: 10% of pending rewards
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Claim Rewards
                </CardTitle>
                <p className="text-sm text-gray-400">
                  Claim your earned rewards from staking participation
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pending Rewards */}
                <div className="grid md:grid-cols-2 gap-4">
                  {stakingStats?.pendingRewards.map((reward, index) => (
                    <div key={index} className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-400">{reward.token} Rewards</div>
                          <div className="text-xl font-bold">{reward.amount}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                          <span className="text-sm font-bold">{reward.token}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Claim Button */}
                <Button
                  onClick={handleClaimRewards}
                  disabled={isPending || isConfirming || !stakingStats?.pendingRewards.some(r => Number(r.amount) > 0)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      Claim All Rewards
                    </>
                  )}
                </Button>

                {/* Reward History */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Recent Claims</h3>
                  <div className="space-y-2">
                    {/* This would come from transaction history */}
                    <div className="flex items-center justify-between text-sm py-2 border-b border-gray-700">
                      <span className="text-gray-400">Jan 15, 2025</span>
                      <span>+12.5 S, +5.2 USDC</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-2 border-b border-gray-700">
                      <span className="text-gray-400">Dec 15, 2024</span>
                      <span>+8.3 S, +3.1 USDC</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Community Leaderboard
                </CardTitle>
                <p className="text-sm text-gray-400">
                  Top creators ranked by upvotes, staking participation, and community engagement
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.address}
                      className={`
                        flex items-center gap-4 p-4 rounded-lg border
                        ${index < 3 
                          ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30' 
                          : 'bg-gray-700/30 border-gray-600'
                        }
                      `}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-10 h-10">
                        {index === 0 && <Crown className="h-6 w-6 text-yellow-400" />}
                        {index === 1 && <Trophy className="h-6 w-6 text-gray-300" />}
                        {index === 2 && <Trophy className="h-6 w-6 text-orange-400" />}
                        {index > 2 && (
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                            <span className="text-sm font-bold">#{entry.rank}</span>
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="font-medium">{entry.address}</div>
                        <div className="text-sm text-gray-400">
                          {entry.stakedCount} NFTs staked • {entry.totalUpvotes} upvotes
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <div className="font-bold text-lg">{entry.leaderboardPoints.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">points</div>
                      </div>

                      {/* Badge */}
                      {index < 3 && (
                        <Badge variant="outline" className={
                          index === 0 ? 'border-yellow-400 text-yellow-400' :
                          index === 1 ? 'border-gray-300 text-gray-300' :
                          'border-orange-400 text-orange-400'
                        }>
                          {index === 0 ? '🥇 Champion' : index === 1 ? '🥈 Elite' : '🥉 Rising Star'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Leaderboard Info */}
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    How Points Are Calculated
                  </h4>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>• 10 points per upvote received on your generations</div>
                    <div>• 5 points per NFT staked (monthly bonus)</div>
                    <div>• 25 points for top 3 most upvoted generation each week</div>
                    <div>• 2x multiplier for BanditKidz NFT holders</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}