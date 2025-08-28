"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Coins, Trophy, Star, Lock, Unlock, Plus, ExternalLink, Loader2, MessageCircle, Send, Building2, Vault, TrendingUp, ChevronDown, Banknote, CreditCard, Gift } from "lucide-react"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import NavigationMenu from "@/components/navigation-menu"
import { ClientOnlyWrapper } from "@/components/client-only-wrapper"
import { OpenOceanSwapWidget } from "@/components/openocean-swap-widget"

// Supported NFT Collections for the Bank
const NFT_COLLECTIONS = [
  {
    name: "BanditKidz Official",
    address: "0x45bC8A938E487FdE4F31A7E051c2b63627F6f966",
    network: "mainnet",
    verified: true,
    rewardMultiplier: 1.0
  },
  {
    name: "BanditKidz Testnet",
    address: "0x742d35Cc6634C0532925a3b8D42DE12A3AdE0E4c",
    network: "testnet", 
    verified: true,
    rewardMultiplier: 1.0
  }
]

const STAKING_CONTRACT_ADDRESS = "" // SrvcfloStaking contract (to be deployed)

interface StakedNFT {
  tokenId: string
  stakingStartTime: number
  pointsEarned: number
  canWithdraw: boolean
  lockPeriod: number
  lockEndTime: number
  bonusMultiplier: number
  isLocked: boolean
}

interface NFTData {
  tokenId: string
  name: string
  image: string
  isStaked: boolean
  collection?: string
}

interface ChatMessage {
  id: string
  message: string
  response: string
  timestamp: number
  intent?: {
    primary: string
    suggestedActions?: Array<{ action: string; label: string }>
  }
}

interface NFTCollection {
  name: string
  address: string
  network: string
  verified: boolean
  rewardMultiplier: number
}

const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
      <p className="text-gray-400">Loading staking interface...</p>
    </div>
  </div>
);

function StakingPageContent() {
  const [userNFTs, setUserNFTs] = useState<NFTData[]>([])
  const [stakedNFTs, setStakedNFTs] = useState<StakedNFT[]>([])
  const [totalStakingPoints, setTotalStakingPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stakingRewards, setStakingRewards] = useState(0)
  const [selectedLockPeriod, setSelectedLockPeriod] = useState<number>(0)
  const [selectedCollection, setSelectedCollection] = useState<string>(NFT_COLLECTIONS[0].address)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const [bankBalance, setBankBalance] = useState({ s: 0, usdc: 0, eth: 0 })
  const [lockPeriods] = useState([
    { period: 0, days: 0, bonus: 100, label: 'No Lock' },
    { period: 30 * 24 * 60 * 60, days: 30, bonus: 115, label: '30 Days' },
    { period: 60 * 24 * 60 * 60, days: 60, bonus: 135, label: '60 Days' },
    { period: 90 * 24 * 60 * 60, days: 90, bonus: 160, label: '90 Days' },
    { period: 120 * 24 * 60 * 60, days: 120, bonus: 190, label: '120 Days' },
    { period: 365 * 24 * 60 * 60, days: 365, bonus: 250, label: '365 Days' }
  ])
  
  const { address, isConnected, chainId } = useAccount()

  useEffect(() => {
    if (address) {
      fetchNFTsAndStaking()
      fetchBankBalance()
    }
  }, [address, selectedCollection]) // Re-fetch when collection changes

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const fetchNFTsAndStaking = async () => {
    if (!address || !chainId) return
    
    try {
      setLoading(true)
      
      // Get the selected collection info
      const selectedNFTCollection = NFT_COLLECTIONS.find(c => c.address === selectedCollection)
      if (!selectedNFTCollection) return
      
      // Fetch NFTs using blockchain data
      const nfts: NFTData[] = []
      
      try {
        // Try fetching via API that uses thirdweb or other indexer
        const nftResponse = await fetch(`/api/nfts/fetch-wallet-nfts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address,
            contractAddress: selectedCollection,
            chainId: chainId,
            collectionName: selectedNFTCollection.name
          })
        })
        
        if (nftResponse.ok) {
          const nftData = await nftResponse.json()
          if (nftData.success && nftData.nfts) {
            nfts.push(...nftData.nfts.map((nft: any) => ({
              tokenId: nft.tokenId,
              name: nft.name || `${selectedNFTCollection.name} #${nft.tokenId}`,
              image: nft.image || nft.imageUrl || '/api/placeholder/150/150',
              isStaked: false,
              collection: selectedCollection
            })))
          }
        }
      } catch (nftError) {
        console.warn('NFT API failed, using mock data for demo:', nftError)
      }
      
      // If no real NFTs found, add some demo NFTs for testing
      if (nfts.length === 0 && address) {
        console.log('Adding demo NFTs for testing...')
        const demoTokenIds = [1, 2, 3, 15, 42, 69, 100, 123] // Demo token IDs
        nfts.push(...demoTokenIds.map(tokenId => ({
          tokenId: tokenId.toString(),
          name: `${selectedNFTCollection.name} #${tokenId}`,
          image: `https://via.placeholder.com/150x150/1f2937/f59e0b?text=${tokenId}`,
          isStaked: Math.random() > 0.7, // Randomly make some staked for demo
          collection: selectedCollection
        })))
      }
      
      setUserNFTs(nfts)
      
      // Fetch staking data
      try {
        const stakingResponse = await fetch(`/api/staking/user/${address}`)
        const stakingData = await stakingResponse.json()
        
        if (stakingData.success) {
          setStakedNFTs(stakingData.stakedNFTs || [])
          setTotalStakingPoints(stakingData.totalPoints || 0)
          setStakingRewards(stakingData.pendingRewards || 0)
        }
      } catch (stakingError) {
        console.warn('Staking API failed:', stakingError)
        // Use demo staking data
        const stakedTokens = nfts.filter(nft => nft.isStaked)
        setStakedNFTs(stakedTokens.map((nft, index) => ({
          tokenId: nft.tokenId,
          stakingStartTime: Date.now() - (index * 24 * 60 * 60 * 1000), // Staked days ago
          pointsEarned: Math.floor(Math.random() * 500),
          canWithdraw: Math.random() > 0.5,
          lockPeriod: Math.random() > 0.5 ? 30 * 24 * 60 * 60 : 0,
          lockEndTime: Date.now() + (30 * 24 * 60 * 60 * 1000),
          bonusMultiplier: Math.random() > 0.5 ? 115 : 100,
          isLocked: Math.random() > 0.7
        })))
        setTotalStakingPoints(Math.floor(Math.random() * 1000))
        setStakingRewards(Math.random() * 50)
      }
      
    } catch (error) {
      console.error('Error fetching NFT/staking data:', error)
      setUserNFTs([])
    } finally {
      setLoading(false)
    }
  }

  const handleStakeNFT = async (tokenId: string, lockPeriod: number = selectedLockPeriod) => {
    if (!address) return

    try {
      const response = await fetch('/api/staking/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          userAddress: address,
          lockPeriod
        })
      })

      const data = await response.json()
      if (data.success) {
        // Refresh data
        await fetchNFTsAndStaking()
      }
    } catch (error) {
      console.error('Staking failed:', error)
    }
  }

  const handleUnstakeNFT = async (tokenId: string) => {
    if (!address) return

    try {
      const response = await fetch('/api/staking/unstake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          userAddress: address
        })
      })

      const data = await response.json()
      if (data.success) {
        // Refresh data
        await fetchNFTsAndStaking()
      }
    } catch (error) {
      console.error('Unstaking failed:', error)
    }
  }

  const handleClaimRewards = async () => {
    if (!address) return

    try {
      const response = await fetch('/api/staking/claim-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address
        })
      })

      const data = await response.json()
      if (data.success) {
        setStakingRewards(0)
        await fetchNFTsAndStaking()
      }
    } catch (error) {
      console.error('Claiming rewards failed:', error)
    }
  }

  const fetchBankBalance = async () => {
    if (!address) return
    
    try {
      // Mock bank balance - replace with actual blockchain calls
      setBankBalance({
        s: Math.random() * 1000,
        usdc: Math.random() * 500,
        eth: Math.random() * 10
      })
    } catch (error) {
      console.error('Error fetching bank balance:', error)
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return

    const messageId = Date.now().toString()
    const userMessage = chatInput.trim()
    setChatInput('')
    setChatLoading(true)

    try {
      // Get banking context
      const bankingContext = {
        stakedNFTs: stakedNFTs,
        pendingRewards: [{ token: 'S', amount: stakingRewards.toString() }],
        availableNFTs: userNFTs.filter(nft => !nft.isStaked),
        bankBalance: bankBalance
      }

      const response = await fetch('/api/crypto-bank-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          user_address: address,
          banking_context: bankingContext
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const newMessage: ChatMessage = {
          id: messageId,
          message: userMessage,
          response: data.response,
          timestamp: Date.now(),
          intent: data.intent
        }
        
        setChatMessages(prev => [...prev, newMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: messageId,
        message: userMessage,
        response: "I apologize, but I'm temporarily unavailable. Please try again in a moment.",
        timestamp: Date.now()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setChatLoading(false)
    }
  }

  const handleSuggestedAction = (action: string) => {
    switch (action) {
      case 'openDeposit':
        // Focus on staking interface
        window.scrollTo({ top: 0, behavior: 'smooth' })
        break
      case 'openWithdraw':
        // Focus on rewards section
        break
      case 'showAccount':
        // Show account overview
        break
    }
  }

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700 max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              NFT Staking
            </CardTitle>
            <p className="text-gray-400 mb-4">Connect your wallet to access staking</p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <NavigationMenu />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Building2 className="h-12 w-12 text-yellow-400" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
                Sonic Crypto Bank
              </h1>
              <p className="text-gray-400 mt-2">Professional NFT Banking Services • Deposits • Withdrawals • Rewards</p>
            </div>
          </div>
          
          {/* Collection Selector */}
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-300 mb-2 block">Select NFT Collection</label>
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger className="w-80 bg-gray-800/50 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NFT_COLLECTIONS.map((collection) => (
                  <SelectItem key={collection.address} value={collection.address}>
                    <div className="flex items-center gap-2">
                      <span>{collection.name}</span>
                      {collection.verified && <Badge variant="outline" className="text-xs text-green-400 border-green-400">Verified</Badge>}
                      <span className="text-xs text-gray-400">({collection.network})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Banking Teller Chat */}
        <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-400" />
                AI Bank Teller
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
              >
                {showChat ? 'Hide' : 'Show'} Chat
              </Button>
            </CardTitle>
          </CardHeader>
          {showChat && (
            <CardContent>
              <div className="space-y-4">
                {/* Chat Messages */}
                <ScrollArea className="h-64 border border-gray-600 rounded-lg p-4 bg-gray-900/50" ref={chatScrollRef}>
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-8">
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                      <p>Welcome to Sonic Crypto Bank!</p>
                      <p className="text-sm">I'm your AI teller. How can I assist with your banking needs today?</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className="space-y-2">
                          <div className="flex justify-end">
                            <div className="bg-blue-600 text-white p-3 rounded-lg max-w-xs">
                              {msg.message}
                            </div>
                          </div>
                          <div className="flex justify-start">
                            <div className="bg-gray-700 text-gray-100 p-3 rounded-lg max-w-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-yellow-400" />
                                <span className="text-xs text-yellow-400">AI Teller</span>
                              </div>
                              {msg.response}
                              {msg.intent?.suggestedActions?.map((action, i) => (
                                <Button
                                  key={i}
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 mr-2 text-xs border-blue-500 text-blue-400 hover:bg-blue-500/20"
                                  onClick={() => handleSuggestedAction(action.action)}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                
                {/* Chat Input */}
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about deposits, withdrawals, or account services..."
                    className="bg-gray-800/50 border-gray-600"
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    disabled={chatLoading}
                  />
                  <Button
                    onClick={sendChatMessage}
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {chatLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Banking Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-800/20 to-emerald-800/20 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Vault className="h-8 w-8 text-green-400" />
                <div>
                  <div className="text-2xl font-bold">{stakedNFTs.length}</div>
                  <div className="text-sm text-gray-400">Deposits (NFTs)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-800/20 to-pink-800/20 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-purple-400" />
                <div>
                  <div className="text-2xl font-bold">{totalStakingPoints}</div>
                  <div className="text-sm text-gray-400">Interest Points</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-800/20 to-orange-800/20 border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Banknote className="h-8 w-8 text-yellow-400" />
                  <div>
                    <div className="text-2xl font-bold">{stakingRewards.toFixed(2)}</div>
                    <div className="text-sm text-gray-400">Withdrawal Ready</div>
                  </div>
                </div>
                {stakingRewards > 0 && (
                  <Button
                    onClick={handleClaimRewards}
                    size="sm"
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    <Gift className="h-4 w-4 mr-1" />
                    Withdraw
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Bank Balance */}
          <Card className="bg-gradient-to-br from-blue-800/20 to-cyan-800/20 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-blue-400" />
                <div>
                  <div className="text-lg font-bold">
                    {bankBalance.s.toFixed(1)} S • {bankBalance.usdc.toFixed(1)} USDC
                  </div>
                  <div className="text-sm text-gray-400">Account Balance</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Available NFTs */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vault className="h-5 w-5 text-green-400" />
                Deposit Teller
              </CardTitle>
              <p className="text-sm text-gray-400">
                Deposit your NFTs to earn interest with flexible lock periods
              </p>
            </CardHeader>
            <CardContent>
              {/* Lock Period Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Select Lock Period</h3>
                <div className="grid grid-cols-3 gap-2">
                  {lockPeriods.map((lockOption) => (
                    <button
                      key={lockOption.period}
                      onClick={() => setSelectedLockPeriod(lockOption.period)}
                      className={`
                        p-2 rounded-lg border text-xs transition-all
                        ${selectedLockPeriod === lockOption.period
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                          : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                        }
                      `}
                    >
                      <div className="font-medium">{lockOption.label}</div>
                      <div className="text-gray-400">{lockOption.bonus}% rewards</div>
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Selected: <span className="text-blue-400 font-medium">
                    {lockPeriods.find(p => p.period === selectedLockPeriod)?.label} 
                    ({lockPeriods.find(p => p.period === selectedLockPeriod)?.bonus}% rewards)
                  </span>
                </div>
              </div>
              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading NFTs...</div>
              ) : userNFTs.filter(nft => !nft.isStaked).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">No available NFTs to stake</div>
                  <Button
                    variant="outline"
                    className="border-gray-600"
                    onClick={() => window.open('https://paintswap.io/sonic/collections/bandit-kidz/listings', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Get NFTs
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {userNFTs
                    .filter(nft => !nft.isStaked)
                    .map((nft) => (
                      <div key={nft.tokenId} className="bg-gray-700/30 rounded-lg p-4">
                        <div className="aspect-square bg-gray-600 rounded-lg mb-3 flex items-center justify-center">
                          {nft.image ? (
                            <img 
                              src={nft.image} 
                              alt={nft.name} 
                              className="w-full h-full object-cover rounded-lg" 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = `https://via.placeholder.com/150x150/1f2937/f59e0b?text=${nft.tokenId}`
                              }}
                            />
                          ) : (
                            <div className="text-gray-400 text-sm">#{nft.tokenId}</div>
                          )}
                        </div>
                        <div className="text-sm font-medium mb-2">{nft.name || `NFT #${nft.tokenId}`}</div>
                        <Button
                          onClick={() => handleStakeNFT(nft.tokenId)}
                          size="sm"
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          <Vault className="h-4 w-4 mr-1" />
                          Deposit
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Staked NFTs */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-yellow-400" />
                Account Manager
              </CardTitle>
              <p className="text-sm text-gray-400">
                Your deposited assets earning interest and account benefits
              </p>
            </CardHeader>
            <CardContent>
              {stakedNFTs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                  <p>No assets currently on deposit</p>
                  <p className="text-sm">Visit the Deposit Teller to start earning interest</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stakedNFTs.map((stakedNFT) => {
                    const nftData = userNFTs.find(nft => nft.tokenId === stakedNFT.tokenId)
                    return (
                      <div key={stakedNFT.tokenId} className="bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                            {nftData?.image ? (
                              <img 
                                src={nftData.image} 
                                alt={nftData.name} 
                                className="w-full h-full object-cover rounded-lg" 
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = `https://via.placeholder.com/150x150/1f2937/f59e0b?text=${stakedNFT.tokenId}`
                                }}
                              />
                            ) : (
                              <div className="text-gray-400 text-xs">#{stakedNFT.tokenId}</div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-medium mb-1">
                              {nftData?.name || `NFT #${stakedNFT.tokenId}`}
                            </div>
                            <div className="text-sm text-gray-400">
                              Deposited {Math.floor((Date.now() - stakedNFT.stakingStartTime) / (1000 * 60 * 60 * 24))} days ago
                            </div>
                            <div className="text-sm text-green-400">
                              ${stakedNFT.pointsEarned} interest earned ({stakedNFT.bonusMultiplier / 100}% rate)
                            </div>
                            {stakedNFT.isLocked && (
                              <div className="text-xs text-orange-400 flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Term expires {new Date(stakedNFT.lockEndTime * 1000).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                              Premium Account
                            </Badge>
                            {stakedNFT.canWithdraw && (
                              <Button
                                onClick={() => handleUnstakeNFT(stakedNFT.tokenId)}
                                size="sm"
                                variant="outline"
                                className="text-xs border-orange-600 text-orange-400 hover:bg-orange-500/20"
                              >
                                <Banknote className="h-3 w-3 mr-1" />
                                Withdraw
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* OpenOcean Swap Widget */}
          <div className="space-y-6">
            <OpenOceanSwapWidget />
            
            {/* Trading Tips */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Trading Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-400">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Use USDC for stable value storage</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Swap to S/wS for AI generation payments</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>OpenOcean finds the best rates automatically</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Staked NFTs require wS tokens for rewards</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Banking Services Information */}
        <Card className="bg-gradient-to-r from-slate-800/50 to-gray-800/50 border-gray-600 mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-yellow-400" />
              Banking Services Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Vault className="h-4 w-4 text-green-400" />
                  How Banking Works
                </h3>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li>• Deposit your NFTs to open a premium account</li>
                  <li>• Choose term deposits for higher interest rates (up to 150% extra)</li>
                  <li>• Earn interest from platform revenue sharing</li>
                  <li>• Premium accounts get voting power in community decisions</li>
                  <li>• Withdraw accumulated interest anytime</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  Interest Rate Schedule
                </h3>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li>• No Term: 100% base rate (withdraw anytime)</li>
                  <li>• 30 Day Term: 115% interest (+15% bonus)</li>
                  <li>• 60 Day Term: 135% interest (+35% bonus)</li>
                  <li>• 90 Day Term: 160% interest (+60% bonus)</li>
                  <li>• 120 Day Term: 190% interest (+90% bonus)</li>
                  <li>• 365 Day Term: 250% interest (+150% bonus)</li>
                  <li>• Early withdrawal penalty: 10% of pending interest</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function StakingPage() {
  return (
    <ClientOnlyWrapper fallback={<LoadingFallback />}>
      <StakingPageContent />
    </ClientOnlyWrapper>
  );
}