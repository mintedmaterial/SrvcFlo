"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Building2, 
  Wallet, 
  PiggyBank, 
  Banknote, 
  Clock, 
  TrendingUp, 
  Shield, 
  Gift, 
  Coins,
  CreditCard,
  Safe,
  Timer,
  AlertTriangle,
  CheckCircle,
  User,
  Sparkles
} from "lucide-react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { formatEther } from "viem"

import { getNetworkConfig, isTestnet } from "@/lib/network-config"

// Contract addresses and ABIs (same as previous implementation)
const getContractAddresses = (chainId: number) => {
  const config = getNetworkConfig(chainId)
  if (!config) {
    throw new Error(`Unsupported network: ${chainId}`)
  }
  
  const nftAddress = isTestnet(chainId) 
    ? config.contracts.nft
    : "0x45bC8A938E487FdE4F31A7E051c2b63627F6f966"
    
  return {
    NFT_ADDRESS: nftAddress,
    STAKING_CONTRACT_ADDRESS: config.contracts.staking,
    PAYMENT_CONTRACT_ADDRESS: config.contracts.payment
  }
}

// Same ABIs as before...
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
  }
] as const

const NFT_ABI = [
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
  lockPeriods: { period: number; bonus: number }[]
}

export function CryptoBankStaking() {
  const [stakingStats, setStakingStats] = useState<StakingStats | null>(null)
  const [selectedNFTs, setSelectedNFTs] = useState<number[]>([])
  const [userNFTs, setUserNFTs] = useState<number[]>([])
  const [selectedLockPeriod, setSelectedLockPeriod] = useState<number>(0)
  const [activeView, setActiveView] = useState<"lobby" | "deposit" | "withdraw">("lobby")
  const [isLoading, setIsLoading] = useState(false)

  const { address, isConnected, chainId } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  const contractAddresses = chainId ? getContractAddresses(chainId) : null

  // Read contract data (same as before)
  const { data: stakedNFTs } = useReadContract({
    address: contractAddresses?.STAKING_CONTRACT_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'getUserStakedTokens',
    args: address ? [address] : undefined,
    query: { enabled: !!contractAddresses?.STAKING_CONTRACT_ADDRESS && !!address }
  })

  const { data: pendingRewards } = useReadContract({
    address: contractAddresses?.STAKING_CONTRACT_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'getUserPendingRewards',
    args: address ? [address] : undefined,
    query: { enabled: !!contractAddresses?.STAKING_CONTRACT_ADDRESS && !!address }
  })

  const { data: lockPeriodsData } = useReadContract({
    address: contractAddresses?.STAKING_CONTRACT_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'getLockPeriodsAndBonuses',
    query: { enabled: !!contractAddresses?.STAKING_CONTRACT_ADDRESS }
  })

  useEffect(() => {
    if (isConnected && address) {
      fetchUserNFTs()
      fetchStakingStats()
    }
  }, [isConnected, address])

  useEffect(() => {
    if (isConfirmed) {
      fetchStakingStats()
      setSelectedNFTs([])
    }
  }, [isConfirmed])

  const fetchUserNFTs = async () => {
    if (!address) return
    try {
      const mockNFTs = [1, 2, 3, 4, 5]
      setUserNFTs(mockNFTs)
    } catch (error) {
      console.error('Error fetching user NFTs:', error)
    }
  }

  const fetchStakingStats = async () => {
    if (!address) return

    try {
      setIsLoading(true)
      
      const lockPeriods = lockPeriodsData ? 
        (lockPeriodsData[0] as bigint[]).map((period, index) => ({
          period: Number(period),
          bonus: Number((lockPeriodsData[1] as bigint[])[index]) / 100
        })) : []

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

      const stats: StakingStats = {
        stakedNFTs: (stakedNFTs as bigint[])?.map(id => Number(id)) || [],
        totalStaked: (stakedNFTs as bigint[])?.length || 0,
        pendingRewards: rewards,
        lockPeriods: lockPeriods
      }

      setStakingStats(stats)
    } catch (error) {
      console.error('Error fetching staking stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStakeNFTs = async () => {
    if (!selectedNFTs.length || !contractAddresses) return

    try {
      writeContract({
        address: contractAddresses.NFT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'setApprovalForAll',
        args: [contractAddresses.STAKING_CONTRACT_ADDRESS as `0x${string}`, true],
      })

      setTimeout(() => {
        if (selectedNFTs.length === 1) {
          writeContract({
            address: contractAddresses.STAKING_CONTRACT_ADDRESS as `0x${string}`,
            abi: STAKING_ABI,
            functionName: 'stake',
            args: [BigInt(selectedNFTs[0]), BigInt(selectedLockPeriod)],
          })
        } else {
          writeContract({
            address: contractAddresses.STAKING_CONTRACT_ADDRESS as `0x${string}`,
            abi: STAKING_ABI,
            functionName: 'stakeBatch',
            args: [selectedNFTs.map(BigInt), BigInt(selectedLockPeriod)],
          })
        }
      }, 2000)
      
    } catch (error) {
      console.error('Staking error:', error)
    }
  }

  const handleUnstakeNFTs = async () => {
    if (!selectedNFTs.length || !contractAddresses) return

    try {
      writeContract({
        address: contractAddresses.STAKING_CONTRACT_ADDRESS as `0x${string}`,
        abi: STAKING_ABI,
        functionName: 'unstake',
        args: [BigInt(selectedNFTs[0])],
      })
    } catch (error) {
      console.error('Unstaking error:', error)
    }
  }

  const handleClaimRewards = async () => {
    if (!contractAddresses) return
    
    try {
      const distributionIds = [BigInt(0), BigInt(1), BigInt(2)] // Mock IDs
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

  const getLockPeriodDisplay = (seconds: number) => {
    if (seconds === 0) return "No Lock"
    const days = seconds / (24 * 60 * 60)
    return `${days} Days`
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-orange-500 to-blue-900 rounded-full w-16 h-16 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-orange-500 to-blue-900 bg-clip-text text-transparent">
              Sonic Crypto Bank
            </CardTitle>
            <p className="text-gray-400">Connect your wallet to access banking services</p>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Bank Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-blue-900 rounded-full">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-blue-900 bg-clip-text text-transparent">
              Sonic Crypto Bank
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Premium banking services for your BanditKidz NFTs</p>
        </div>

        {/* Bank Lobby / Navigation */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card 
            className={`cursor-pointer transition-all ${activeView === "lobby" ? "bg-gray-700/50 border-orange-500" : "bg-gray-800/50 border-gray-700 hover:border-orange-400"}`}
            onClick={() => setActiveView("lobby")}
          >
            <CardContent className="p-6 text-center">
              <User className="h-12 w-12 mx-auto mb-3 text-orange-400" />
              <h3 className="font-semibold mb-2">Account Overview</h3>
              <p className="text-sm text-gray-400">View your portfolio</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${activeView === "deposit" ? "bg-gray-700/50 border-blue-500" : "bg-gray-800/50 border-gray-700 hover:border-blue-400"}`}
            onClick={() => setActiveView("deposit")}
          >
            <CardContent className="p-6 text-center">
              <PiggyBank className="h-12 w-12 mx-auto mb-3 text-blue-400" />
              <h3 className="font-semibold mb-2">Deposit Teller</h3>
              <p className="text-sm text-gray-400">Stake your NFTs</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${activeView === "withdraw" ? "bg-gray-700/50 border-blue-900" : "bg-gray-800/50 border-gray-700 hover:border-blue-600"}`}
            onClick={() => setActiveView("withdraw")}
          >
            <CardContent className="p-6 text-center">
              <Banknote className="h-12 w-12 mx-auto mb-3 text-blue-800" />
              <h3 className="font-semibold mb-2">Withdrawal Teller</h3>
              <p className="text-sm text-gray-400">Claim your rewards</p>
            </CardContent>
          </Card>
        </div>

        {/* Account Overview */}
        {activeView === "lobby" && (
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-yellow-400" />
                  Account Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Safe className="h-5 w-5 text-orange-400" />
                      <span className="text-sm font-medium">Deposited Assets</span>
                    </div>
                    <div className="text-2xl font-bold">{stakingStats?.totalStaked || 0}</div>
                    <div className="text-sm text-gray-400">BanditKidz NFTs</div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                      <span className="text-sm font-medium">Earning Interest</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {stakingStats?.pendingRewards.reduce((sum, reward) => sum + parseFloat(reward.amount), 0).toFixed(4) || "0.0000"}
                    </div>
                    <div className="text-sm text-gray-400">Pending Rewards</div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-blue-300" />
                      <span className="text-sm font-medium">Account Status</span>
                    </div>
                    <div className="text-lg font-bold text-orange-400">Premium</div>
                    <div className="text-sm text-gray-400">NFT Holder Benefits</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Your Deposits */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                  Your Deposits
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stakingStats?.stakedNFTs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <PiggyBank className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No assets currently deposited</p>
                    <p className="text-sm">Visit the Deposit Teller to start earning</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stakingStats?.stakedNFTs.map((tokenId) => (
                      <div key={tokenId} className="bg-gray-700/30 rounded-lg p-3 text-center">
                        <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mb-2 flex items-center justify-center">
                          <span className="text-white font-bold">#{tokenId}</span>
                        </div>
                        <div className="text-sm font-medium">BanditKid #{tokenId}</div>
                        <div className="text-xs text-green-400">🔒 Earning Interest</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Deposit Teller */}
        {activeView === "deposit" && (
          <Card className="bg-gray-800/50 border-blue-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-6 w-6 text-blue-400" />
                Deposit Teller - Stake Your NFTs
              </CardTitle>
              <p className="text-gray-400">Welcome! I'll help you deposit your BanditKidz NFTs for interest earnings.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Term Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Timer className="h-5 w-5 text-yellow-400" />
                  Choose Your Term Deposit
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {stakingStats?.lockPeriods.map((lockOption, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedLockPeriod(lockOption.period)}
                      className={`
                        p-4 rounded-lg border transition-all
                        ${selectedLockPeriod === lockOption.period
                          ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                          : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                        }
                      `}
                    >
                      <div className="font-medium">{getLockPeriodDisplay(lockOption.period)}</div>
                      <div className="text-2xl font-bold text-blue-400">{lockOption.bonus}%</div>
                      <div className="text-xs text-gray-400">Interest Rate</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* NFT Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                  Select Assets to Deposit
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {userNFTs.filter(tokenId => !stakingStats?.stakedNFTs.includes(tokenId)).map((tokenId) => {
                    const isSelected = selectedNFTs.includes(tokenId)
                    return (
                      <div
                        key={tokenId}
                        onClick={() => {
                          setSelectedNFTs(prev => 
                            isSelected 
                              ? prev.filter(id => id !== tokenId)
                              : [...prev, tokenId]
                          )
                        }}
                        className={`
                          cursor-pointer aspect-square rounded-lg border-2 transition-all
                          ${isSelected 
                            ? 'border-orange-500 bg-orange-500/20' 
                            : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                          }
                        `}
                      >
                        <div className="h-full flex flex-col items-center justify-center p-2">
                          <div className="text-lg font-bold">#{tokenId}</div>
                          <div className="text-xs text-gray-400">BanditKid</div>
                          {isSelected && <CheckCircle className="h-4 w-4 text-orange-400 mt-1" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Deposit Summary */}
              {selectedNFTs.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Deposit Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Assets to deposit:</span>
                      <span className="font-medium">{selectedNFTs.length} NFTs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Term length:</span>
                      <span className="font-medium">{getLockPeriodDisplay(selectedLockPeriod)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest rate:</span>
                      <span className="font-medium text-blue-400">
                        {stakingStats?.lockPeriods.find(p => p.period === selectedLockPeriod)?.bonus || 100}%
                      </span>
                    </div>
                    {selectedLockPeriod > 0 && (
                      <div className="flex items-center gap-2 text-orange-400 text-xs mt-2">
                        <AlertTriangle className="h-3 w-3" />
                        Early withdrawal penalty: 10% of earned interest
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleStakeNFTs}
                disabled={!selectedNFTs.length || isPending || isConfirming}
                className="w-full bg-gradient-to-r from-orange-500 to-blue-900 hover:from-orange-600 hover:to-blue-800 text-white font-semibold py-3"
              >
                {isPending || isConfirming ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Processing Deposit...
                  </>
                ) : (
                  <>
                    <PiggyBank className="h-4 w-4 mr-2" />
                    Complete Deposit ({selectedNFTs.length} NFTs)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Withdrawal Teller */}
        {activeView === "withdraw" && (
          <Card className="bg-gray-800/50 border-blue-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-6 w-6 text-blue-800" />
                Withdrawal Teller - Claim Your Rewards
              </CardTitle>
              <p className="text-gray-400">Hello! I can help you withdraw your earned interest and manage your deposits.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Available Rewards */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-blue-800" />
                  Available for Withdrawal
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {stakingStats?.pendingRewards.map((reward, index) => (
                    <div key={index} className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-400">{reward.token} Interest</div>
                          <div className="text-2xl font-bold">{reward.amount}</div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-blue-900 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{reward.token}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Claim Button */}
              <Button
                onClick={handleClaimRewards}
                disabled={isPending || isConfirming || !stakingStats?.pendingRewards.some(r => Number(r.amount) > 0)}
                className="w-full bg-gradient-to-r from-orange-500 to-blue-900 hover:from-orange-600 hover:to-blue-800 text-white font-semibold py-3"
              >
                {isPending || isConfirming ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Processing Withdrawal...
                  </>
                ) : (
                  <>
                    <Banknote className="h-4 w-4 mr-2" />
                    Withdraw All Interest
                  </>
                )}
              </Button>

              {/* Manage Deposits */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Safe className="h-5 w-5 text-yellow-400" />
                  Manage Your Deposits
                </h3>
                {stakingStats?.stakedNFTs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Safe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No active deposits</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {stakingStats?.stakedNFTs.map((tokenId) => (
                      <div key={tokenId} className="bg-gray-700/30 rounded-lg p-3">
                        <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mb-2 flex items-center justify-center">
                          <span className="text-white font-bold">#{tokenId}</span>
                        </div>
                        <div className="text-sm font-medium mb-2">BanditKid #{tokenId}</div>
                        <Button
                          onClick={() => {
                            setSelectedNFTs([tokenId])
                            handleUnstakeNFTs()
                          }}
                          size="sm"
                          variant="outline"
                          className="w-full text-xs border-gray-600 hover:bg-gray-700"
                        >
                          Withdraw Deposit
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}