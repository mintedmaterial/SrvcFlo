"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ImageIcon, Video, Wallet, Clock, CheckCircle, Loader2, Zap, LogIn, User, ExternalLink, Trophy, Star, Coins, Download, Upload, X, Palette, CreditCard, Package, Sparkles, Bot, Activity, Wifi, ChevronDown, Settings, RefreshCw } from "lucide-react"
import { useAccount, useBalance, useSwitchChain, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { toast } from "react-hot-toast"
import NavigationMenu from "@/components/navigation-menu"
import { PriceTicker } from "@/components/price-ticker"
import { AddTokensButton } from "@/components/add-tokens-button"
import { 
  getNetworkConfig, 
  getSafeNetworkConfig,
  ERC20_ABI,
  isTestnet,
  isMainnet,
  isSonicNetwork,
  getNetworkDisplayName,
  validateNetworkConfig,
  SONIC_TESTNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  getAddressesForNetwork
} from "@/lib/network-config"

interface GenerationItem {
  id: string
  type: 'image' | 'video'
  prompt: string
  status: 'processing' | 'completed' | 'failed'
  result?: string[]
  createdAt: string
  walletAddress: string
  paymentMethod: 'USDC' | 'wS' | 'ERC20_credits' | 'NFT_credits' | 'free'
  transactionHash?: string
  submittedToThread: boolean
  nftTokenId?: number
  cloudflareUrl?: string
  creditsUsed?: number
  packageId?: number
}

interface UserStats {
  totalGenerations: number
  totalUpvotes: number
  leaderboardPoints: number
  weeklyRank?: number
  globalRank?: number
  canVote: boolean
  banditKidzNFTCount: number
  votingPower: number
}

interface CreditPackage {
  id: number
  name: string
  usdcPrice: bigint
  usdcCredits: number
  wsCredits: number
  wsTokenPrice: bigint
  active: boolean
  popular?: boolean
}

interface ModelConfig {
  credits: number
  type: 'image' | 'video'
  quality: 'standard' | 'premium'
  displayName: string
  description: string
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'openai-dall-e-3': { 
    credits: 100, 
    type: 'image', 
    quality: 'premium',
    displayName: 'DALL-E 3',
    description: 'OpenAI\'s most advanced image model'
  },
  'openai-dall-e-2': { 
    credits: 50, 
    type: 'image', 
    quality: 'standard',
    displayName: 'DALL-E 2',
    description: 'Fast, reliable image generation'
  },
  'stability-sd-xl': { 
    credits: 75, 
    type: 'image', 
    quality: 'premium',
    displayName: 'Stable Diffusion XL',
    description: 'High-quality artistic images'
  },
  'cloudflare-standard': { 
    credits: 25, 
    type: 'image', 
    quality: 'standard',
    displayName: 'Cloudflare Standard',
    description: 'Fast, cost-effective generation'
  },
  'video-basic': { 
    credits: 200, 
    type: 'video', 
    quality: 'standard',
    displayName: 'Basic Video',
    description: 'Short video clips'
  },
  'video-premium': { 
    credits: 400, 
    type: 'video', 
    quality: 'premium',
    displayName: 'Premium Video',
    description: 'High-quality video generation'
  }
}

export function AIGenerationV2() {
  const [generations, setGenerations] = useState<GenerationItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [generationType, setGenerationType] = useState<'image' | 'video'>('image')
  const [selectedModel, setSelectedModel] = useState<string>('openai-dall-e-3')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [latestGeneration, setLatestGeneration] = useState<GenerationItem | null>(null)
  const [showCreditPurchase, setShowCreditPurchase] = useState(false)
  const [selectedCreditPackage, setSelectedCreditPackage] = useState<number | null>(null)
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([])
  const [agentStatus, setAgentStatus] = useState<{
    id: string | null;
    status: 'connecting' | 'connected' | 'generating' | 'idle' | 'error';
    packageType: string | null;
    lastActivity: string | null;
  }>({
    id: null,
    status: 'idle',
    packageType: null,
    lastActivity: null
  })
  const [availableAgents, setAvailableAgents] = useState<Array<{
    id: string;
    name: string;
    type: string;
    status: 'available' | 'busy' | 'offline';
    capabilities: string[];
    packageType: string;
  }>>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [showAgentSelection, setShowAgentSelection] = useState(false)
  const [showAgentConfig, setShowAgentConfig] = useState(false)
  const [agentConfig, setAgentConfig] = useState({
    name: '',
    description: '',
    specialization: 'general',
    maxGenerationsPerDay: 100,
    allowVideoGeneration: true,
    preferredModels: ['openai-dall-e-3'],
    autoSubmitToThread: true,
    enableAdvancedFeatures: false
  })
  const router = useRouter()

  // Wagmi hooks
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })
  
  // Get network configuration based on current chain
  const networkConfig = chainId ? getSafeNetworkConfig(chainId) : null
  const addresses = chainId ? getAddressesForNetwork(chainId === SONIC_MAINNET_CHAIN_ID ? 'mainnet' : 'testnet') : null
  const isCurrentNetworkSupported = chainId ? isSonicNetwork(chainId) : false
  const isValidConfig = networkConfig && addresses ? validateNetworkConfig({...networkConfig, addresses}) : false
  
  // Payment flow state
  const [paymentStep, setPaymentStep] = useState<'idle' | 'approving' | 'paying' | 'completed'>('idle')
  const [pendingPayment, setPendingPayment] = useState<{
    type: 'credit_purchase' | 'direct_generation';
    paymentMethod: 'USDC' | 'wS';
    packageId?: number;
    amount: bigint;
  } | null>(null)
  
  // Read user ERC-20 credits
  const { data: userERC20Credits } = useReadContract({
    address: addresses?.PAYMENT as `0x${string}`,
    abi: [
      {
        name: 'userCredits',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ],
    functionName: 'userCredits',
    args: [address as `0x${string}`],
    query: { enabled: !!address && !!addresses?.PAYMENT }
  })

  // Read user NFT credits (ERC-1155)
  const { data: userNFTCredits1 } = useReadContract({
    address: addresses?.CREDITS_ERC1155 as `0x${string}`,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }, { name: 'id', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ],
    functionName: 'balanceOf',
    args: [address as `0x${string}`, 1n], // Package 1
    query: { enabled: !!address && !!addresses?.CREDITS_ERC1155 }
  })

  const { data: userNFTCredits2 } = useReadContract({
    address: addresses?.CREDITS_ERC1155 as `0x${string}`,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }, { name: 'id', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ],
    functionName: 'balanceOf',
    args: [address as `0x${string}`, 2n], // Package 2
    query: { enabled: !!address && !!addresses?.CREDITS_ERC1155 }
  })

  // Read Bandit Kidz NFT balance for voting power
  const { data: banditKidzBalance } = useReadContract({
    address: "0x45bc8a938e487fde4f31a7e051c2b63627f6f966" as `0x${string}`, // Bandit Kidz NFT
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ],
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address }
  })
  
  // Token balances
  const { data: usdcBalance } = useBalance({
    address: address,
    token: addresses?.USDC as `0x${string}`,
    chainId: chainId,
  })
  
  const { data: wsBalance } = useBalance({
    address: address,
    token: addresses?.WS_TOKEN as `0x${string}`,
    chainId: chainId,
  })

  // Calculate total credits
  const totalERC20Credits = Number(userERC20Credits || 0n)
  const totalNFTCredits = Number(userNFTCredits1 || 0n) + Number(userNFTCredits2 || 0n)
  const totalCredits = totalERC20Credits + totalNFTCredits

  // Calculate voting power (1 vote + 2 per Bandit Kidz NFT)
  const banditKidzCount = Number(banditKidzBalance || 0n)
  const votingPower = 1 + (banditKidzCount * 2)

  // Get available models for current generation type
  const availableModels = Object.entries(MODEL_CONFIGS)
    .filter(([_, config]) => config.type === generationType)
    .map(([key, config]) => ({ key, ...config }))

  // Get current model config and credit cost
  const currentModelConfig = MODEL_CONFIGS[selectedModel]
  const creditsNeeded = currentModelConfig?.credits || 100

  useEffect(() => {
    if (address) {
      fetchUserStats()
      fetchGenerationHistory()
      fetchCreditPackages()
      discoverOrCreateAgent()
      fetchAvailableAgents()
    }
  }, [address, chainId])

  // Fetch available agents
  const fetchAvailableAgents = async () => {
    if (!address) return

    try {
      // Mock available agents for now - this would call an actual API
      const mockAgents = [
        {
          id: `agent_${address.slice(2, 8)}_primary`,
          name: 'Primary INFT Agent',
          type: 'Multi-Modal',
          status: 'available' as const,
          capabilities: ['Image Generation', 'Video Generation', 'Content Creation'],
          packageType: 'Starter Package'
        },
        {
          id: `agent_${address.slice(2, 8)}_creative`,
          name: 'Creative Specialist',
          type: 'Artistic',
          status: 'available' as const,
          capabilities: ['Advanced Image Generation', 'Style Transfer', 'Art Analysis'],
          packageType: 'Pro Package'
        },
        {
          id: `agent_${address.slice(2, 8)}_video`,
          name: 'Video Expert',
          type: 'Video',
          status: 'available' as const,
          capabilities: ['Video Generation', 'Animation', 'Motion Graphics'],
          packageType: 'Business Package'
        }
      ]

      setAvailableAgents(mockAgents)
      
      // Auto-select the first available agent if none selected
      if (!selectedAgentId && mockAgents.length > 0) {
        setSelectedAgentId(mockAgents[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch available agents:', error)
    }
  }

  // Connect to a specific agent
  const connectToAgent = async (agentId: string) => {
    if (!address) return

    try {
      setAgentStatus(prev => ({ ...prev, status: 'connecting' }))
      
      const selectedAgent = availableAgents.find(agent => agent.id === agentId)
      if (!selectedAgent) return

      // Call the agent connection endpoint
      const response = await fetch('/api/generate/credit-based-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'agent_connection',
          model: 'dall-e-3',
          isVideo: false,
          packageId: 1,
          walletAddress: address,
          paymentMethod: 'agent_discovery',
          agentId: agentId
        })
      })

      const result = await response.json()

      if (result.success) {
        setAgentStatus({
          id: agentId,
          status: 'connected',
          packageType: selectedAgent.packageType,
          lastActivity: new Date().toLocaleTimeString()
        })
        setSelectedAgentId(agentId)
        toast.success(`Connected to ${selectedAgent.name}!`)
      } else {
        setAgentStatus(prev => ({ ...prev, status: 'error' }))
        toast.error('Failed to connect to agent')
      }
    } catch (error) {
      console.error('Agent connection failed:', error)
      setAgentStatus(prev => ({ ...prev, status: 'error' }))
      toast.error('Failed to connect to agent')
    }
  }

  // Agent discovery and connection
  const discoverOrCreateAgent = async () => {
    if (!address) return

    try {
      setAgentStatus(prev => ({ ...prev, status: 'connecting' }))
      
      // Auto-connect to selected agent or first available
      const targetAgentId = selectedAgentId || availableAgents[0]?.id
      if (targetAgentId) {
        await connectToAgent(targetAgentId)
      } else {
        // Fallback to original discovery logic
        const response = await fetch('/api/generate/credit-based-v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: 'test connection',
            model: 'dall-e-3',
            isVideo: false,
            packageId: 1,
            walletAddress: address,
            paymentMethod: 'agent_discovery'
          })
        })

        const result = await response.json()

        if (result.success && result.agentId) {
          setAgentStatus({
            id: result.agentId,
            status: 'connected',
            packageType: result.packageType || 'Starter Package',
            lastActivity: new Date().toLocaleTimeString()
          })
          toast.success('INFT Agent connected successfully!')
        } else {
          setAgentStatus(prev => ({ ...prev, status: 'idle' }))
          console.log('Agent discovery result:', result)
        }
      }
    } catch (error) {
      console.error('Agent discovery failed:', error)
      setAgentStatus(prev => ({ ...prev, status: 'error' }))
      toast.error('Failed to connect to INFT agent')
    }
  }

  // Update selected model when generation type changes
  useEffect(() => {
    const availableForType = Object.entries(MODEL_CONFIGS)
      .filter(([_, config]) => config.type === generationType)
    
    if (availableForType.length > 0 && !availableForType.find(([key]) => key === selectedModel)) {
      setSelectedModel(availableForType[0][0]) // Select first available model for this type
    }
  }, [generationType, selectedModel])

  // Handle transaction confirmations
  useEffect(() => {
    if (isConfirmed && hash && pendingPayment) {
      if (paymentStep === 'approving') {
        // Approval confirmed, now execute payment
        setPaymentStep('paying')
        executePayment()
      } else if (paymentStep === 'paying') {
        // Payment confirmed
        setPaymentStep('completed')
        
        if (pendingPayment.type === 'credit_purchase') {
          toast.success('🎉 Credits purchased successfully!')
          fetchUserStats() // Refresh credits
        } else {
          handleDirectGenerationSuccess(hash)
        }
        
        setIsGenerating(false)
        setPaymentStep('idle')
        setPendingPayment(null)
      }
    }
  }, [isConfirmed, hash, paymentStep, pendingPayment])

  const executePayment = async () => {
    if (!pendingPayment || !address || !addresses) return
    
    try {
      if (pendingPayment.type === 'credit_purchase') {
        toast('Step 2/2: Executing credit purchase...', { icon: '💰' })
        
        const functionName = pendingPayment.paymentMethod === 'USDC' 
          ? 'purchaseCreditsWithUSDC' 
          : 'purchaseCreditsWithWS'
        
        await writeContract({
          address: addresses.PAYMENT as `0x${string}`,
          abi: [
            {
              name: functionName,
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: pendingPayment.paymentMethod === 'USDC' 
                ? [{ name: 'packageId', type: 'uint256' }]
                : [{ name: 'packageId', type: 'uint256' }, { name: 'wsAmount', type: 'uint256' }],
              outputs: []
            }
          ],
          functionName: functionName as any,
          args: pendingPayment.paymentMethod === 'USDC'
            ? [BigInt(pendingPayment.packageId || 1)]
            : [BigInt(pendingPayment.packageId || 1), pendingPayment.amount],
          chainId: chainId,
        })
      }
    } catch (error) {
      console.error('Payment execution failed:', error)
      toast.error('Payment execution failed')
      setIsGenerating(false)
      setPaymentStep('idle')
      setPendingPayment(null)
    }
  }

  const fetchCreditPackages = async () => {
    if (!addresses?.PAYMENT) return
    
    // For now, use the hardcoded packages from our contract
    const packages: CreditPackage[] = [
      {
        id: 1,
        name: 'Starter',
        usdcPrice: parseUnits('5', 6), // 5 USDC
        usdcCredits: 750,
        wsCredits: 1000,
        wsTokenPrice: parseUnits('5', 18), // Dynamic pricing would calculate this
        active: true
      },
      {
        id: 2,
        name: 'Pro',
        usdcPrice: parseUnits('50', 6), // 50 USDC
        usdcCredits: 8000,
        wsCredits: 10000,
        wsTokenPrice: parseUnits('50', 18),
        active: true,
        popular: true
      },
      {
        id: 3,
        name: 'Business',
        usdcPrice: parseUnits('500', 6), // 500 USDC
        usdcCredits: 100000,
        wsCredits: 115000,
        wsTokenPrice: parseUnits('500', 18),
        active: true
      },
      {
        id: 4,
        name: 'Enterprise',
        usdcPrice: parseUnits('1250', 6), // 1250 USDC
        usdcCredits: 260000,
        wsCredits: 290000,
        wsTokenPrice: parseUnits('1250', 18),
        active: true
      }
    ]
    
    setCreditPackages(packages)
  }

  const fetchUserStats = async () => {
    if (!address) return
    
    try {
      const response = await fetch('/api/user/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address })
      })
      
      const data = await response.json()
      if (data.success) {
        setUserStats({
          totalGenerations: data.stats.totalGenerationsCreated || 0,
          totalUpvotes: data.stats.totalUpvotesReceived || 0,
          leaderboardPoints: data.stats.leaderboardPoints || 0,
          canVote: data.stats.canVote || false,
          weeklyRank: data.stats.weeklyRank,
          globalRank: data.stats.globalRank,
          banditKidzNFTCount: banditKidzCount,
          votingPower: votingPower
        })
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const fetchGenerationHistory = async () => {
    if (!address) return
    
    try {
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

  // Credit purchase handlers
  const handlePurchaseCreditsWithUSDC = async (packageId: number) => {
    if (!address || !addresses || !usdcBalance) return
    
    const pkg = creditPackages.find(p => p.id === packageId)
    if (!pkg) return
    
    if (usdcBalance.value < pkg.usdcPrice) {
      toast.error(`Insufficient USDC. Need ${formatUnits(pkg.usdcPrice, 6)} USDC`)
      return
    }
    
    setIsGenerating(true)
    setPaymentStep('approving')
    setSelectedCreditPackage(packageId)
    
    try {
      toast('Step 1/2: Approving USDC...', { icon: 'ℹ️' })
      
      await writeContract({
        address: addresses.USDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [addresses.PAYMENT as `0x${string}`, pkg.usdcPrice],
        chainId: chainId,
      })
      
      setPendingPayment({
        type: 'credit_purchase',
        paymentMethod: 'USDC',
        packageId: packageId,
        amount: pkg.usdcPrice
      })
    } catch (error: any) {
      console.error('USDC approval failed:', error)
      toast.error(`Approval failed: ${error?.message || 'Unknown error'}`)
      setIsGenerating(false)
      setPaymentStep('idle')
    }
  }

  const handlePurchaseCreditsWithWS = async (packageId: number) => {
    if (!address || !addresses || !wsBalance) return
    
    const pkg = creditPackages.find(p => p.id === packageId)
    if (!pkg) return
    
    if (wsBalance.value < pkg.wsTokenPrice) {
      toast.error(`Insufficient wS. Need ${formatUnits(pkg.wsTokenPrice, 18)} wS`)
      return
    }
    
    setIsGenerating(true)
    setPaymentStep('approving')
    setSelectedCreditPackage(packageId)
    
    try {
      toast('Step 1/2: Approving wS tokens...', { icon: 'ℹ️' })
      
      await writeContract({
        address: addresses.WS_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [addresses.PAYMENT as `0x${string}`, pkg.wsTokenPrice],
        chainId: chainId,
      })
      
      setPendingPayment({
        type: 'credit_purchase',
        paymentMethod: 'wS',
        packageId: packageId,
        amount: pkg.wsTokenPrice
      })
    } catch (error: any) {
      console.error('wS approval failed:', error)
      toast.error(`Approval failed: ${error?.message || 'Unknown error'}`)
      setIsGenerating(false)
      setPaymentStep('idle')
    }
  }

  // Generation handlers
  const handleUseCredits = async () => {
    if (!prompt.trim() || !address) return
    
    if (totalCredits < creditsNeeded) {
      toast.error(`Insufficient credits. Need ${creditsNeeded}, you have ${totalCredits}`)
      setShowCreditPurchase(true)
      return
    }
    
    setIsGenerating(true)
    setAgentStatus(prev => ({ ...prev, status: 'generating', lastActivity: new Date().toLocaleTimeString() }))
    
    try {
      const response = await fetch('/api/generate/credit-based-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: generationType,
          prompt,
          userAddress: address,
          creditsNeeded,
          model: selectedModel,
          preferNFTCredits: totalNFTCredits >= creditsNeeded, // Prefer NFT credits if available (they have bonus)
          uploadedImage: uploadedImage ? await convertFileToBase64(uploadedImage) : null
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        const newGeneration: GenerationItem = {
          id: data.generationId,
          type: generationType,
          prompt,
          status: 'completed',
          result: [data.resultUrl],
          createdAt: new Date().toISOString(),
          walletAddress: address,
          paymentMethod: data.creditType, // 'ERC20_credits' or 'NFT_credits'
          submittedToThread: false,
          cloudflareUrl: data.permanentUrl,
          creditsUsed: creditsNeeded
        }
        
        setGenerations(prev => [newGeneration, ...prev])
        setLatestGeneration(newGeneration)
        setPrompt("")
        setUploadedImage(null)
        setImagePreview(null)
        setShowSuccessDialog(true)
        
        // Auto-submit to thread
        await submitToThread(newGeneration)
        
        toast.success(`🎉 Generated with ${currentModelConfig?.displayName} using ${creditsNeeded} credits!`)
      } else {
        throw new Error(data.error || 'Generation failed')
      }
    } catch (error: any) {
      console.error('Credit generation failed:', error)
      toast.error(`Generation failed: ${error?.message}`)
    } finally {
      setIsGenerating(false)
      setAgentStatus(prev => ({ ...prev, status: 'connected', lastActivity: new Date().toLocaleTimeString() }))
    }
  }

  const handleFreeGeneration = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/generate/cloudflare-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          userAddress: address,
          model: '@cf/stabilityai/stable-diffusion-xl-base-1.0'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        const newGeneration: GenerationItem = {
          id: `free_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          type: 'image',
          prompt,
          status: 'completed',
          result: [data.imageUrl],
          createdAt: new Date().toISOString(),
          walletAddress: address || 'anonymous',
          paymentMethod: 'free',
          submittedToThread: false
        }
        
        setGenerations(prev => [newGeneration, ...prev])
        setLatestGeneration(newGeneration)
        setPrompt("")
        setShowSuccessDialog(true)
        
        toast.success('🎉 Free generation completed!')
      } else {
        throw new Error(data.error || 'Generation failed')
      }
    } catch (error: any) {
      console.error('Free generation failed:', error)
      toast.error(`Generation failed: ${error?.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDirectGenerationSuccess = async (txHash: string) => {
    // Handle direct payments (future feature)
    setIsGenerating(false)
    setPaymentStep('idle')
    setPendingPayment(null)
  }

  const submitToThread = async (generation: GenerationItem) => {
    try {
      const response = await fetch('/api/thread/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId: generation.id,
          creator: generation.walletAddress,
          prompt: generation.prompt,
          resultUrl: generation.result![0],
          type: generation.type,
          paymentMethod: generation.paymentMethod,
          transactionHash: generation.transactionHash
        })
      })
      
      if (response.ok) {
        setGenerations(prev => 
          prev.map(gen => 
            gen.id === generation.id 
              ? { ...gen, submittedToThread: true }
              : gen
          )
        )
      }
    } catch (error) {
      console.error('Failed to submit to thread:', error)
    }
  }

  // Helper functions
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      toast.success('Image uploaded successfully!')
    } else {
      toast.error('Please select a valid image file')
    }
  }

  const removeUploadedImage = () => {
    setUploadedImage(null)
    setImagePreview(null)
  }

  const downloadGeneration = (generation: GenerationItem) => {
    if (!generation.result?.[0]) return
    
    const link = document.createElement('a')
    link.href = generation.result[0]
    link.download = `generation-${generation.id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Download started!')
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700 w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wallet className="h-6 w-6" />
              Connect Wallet
            </CardTitle>
            <p className="text-gray-400">Connect your wallet to start generating AI content</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConnectButton />
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">Or try free generation</p>
              <Button
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                onClick={() => router.push('/generate')}
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
        <NavigationMenu />
        
        {/* Price Ticker */}
        <div className="mb-8">
          <PriceTicker 
            network={chainId === SONIC_MAINNET_CHAIN_ID ? 'mainnet' : 'testnet'} 
            className="max-w-4xl mx-auto"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Generation Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  Create Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* INFT Agent Status Display */}
                <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-lg p-3 border border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-300">INFT Agent</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowAgentSelection(!showAgentSelection)}
                        className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                        title="Select Agent"
                      >
                        <Settings className="h-3 w-3 text-blue-400" />
                      </button>
                      <button
                        onClick={() => fetchAvailableAgents()}
                        className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                        title="Refresh Agents"
                      >
                        <RefreshCw className="h-3 w-3 text-blue-400" />
                      </button>
                      <div className={`w-2 h-2 rounded-full ${
                        agentStatus.status === 'connected' ? 'bg-green-400' :
                        agentStatus.status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                        agentStatus.status === 'generating' ? 'bg-blue-400 animate-pulse' :
                        agentStatus.status === 'error' ? 'bg-red-400' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-xs text-gray-400 capitalize">{agentStatus.status}</span>
                    </div>
                  </div>

                  {/* Agent Selection Dropdown */}
                  {showAgentSelection && availableAgents.length > 0 && (
                    <div className="mb-3 p-2 bg-gray-800/50 rounded-lg border border-gray-600">
                      <div className="text-xs text-gray-400 mb-2">Select Agent:</div>
                      <div className="space-y-2">
                        {availableAgents.map((agent) => (
                          <div
                            key={agent.id}
                            className={`p-2 rounded cursor-pointer transition-colors ${
                              selectedAgentId === agent.id
                                ? 'bg-blue-500/20 border border-blue-500/50'
                                : 'bg-gray-700/30 hover:bg-gray-600/30 border border-gray-600/50'
                            }`}
                            onClick={() => {
                              setSelectedAgentId(agent.id)
                              connectToAgent(agent.id)
                              setShowAgentSelection(false)
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-white">{agent.name}</span>
                              <div className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  agent.status === 'available' ? 'bg-green-400' :
                                  agent.status === 'busy' ? 'bg-yellow-400' :
                                  'bg-red-400'
                                }`} />
                                <Badge variant="outline" className="text-xs px-1 py-0 text-purple-400 border-purple-500">
                                  {agent.type}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 mb-1">{agent.packageType}</div>
                            <div className="flex flex-wrap gap-1">
                              {agent.capabilities.slice(0, 2).map((capability, idx) => (
                                <span key={idx} className="text-xs px-1 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                                  {capability}
                                </span>
                              ))}
                              {agent.capabilities.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{agent.capabilities.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Current Agent Status */}
                  {agentStatus.id ? (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Agent:</span>
                        <span className="text-cyan-400">
                          {availableAgents.find(a => a.id === agentStatus.id)?.name || 'Unknown Agent'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Agent ID:</span>
                        <span className="text-cyan-400 font-mono">{agentStatus.id.slice(0, 8)}...</span>
                      </div>
                      {agentStatus.packageType && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Package:</span>
                          <span className="text-purple-400">{agentStatus.packageType}</span>
                        </div>
                      )}
                      {agentStatus.lastActivity && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Active:</span>
                          <span className="text-green-400">{agentStatus.lastActivity}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-1">
                      {agentStatus.status === 'connecting' ? 'Connecting to agent...' : 
                       availableAgents.length > 0 ? 'Select an agent above to connect' : 'No agents available'}
                    </div>
                  )}
                </div>
                {/* User Stats Display */}
                {userStats && (
                  <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg p-3 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-300">Your Stats</span>
                      {banditKidzCount > 0 && (
                        <Badge variant="outline" className="border-orange-500 text-orange-400 text-xs">
                          <Trophy className="h-3 w-3 mr-1" />
                          {banditKidzCount} Bandit Kidz
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="text-center">
                        <div className="font-bold text-purple-400">{userStats.totalGenerations}</div>
                        <div className="text-gray-400">Generations</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-pink-400">{votingPower}</div>
                        <div className="text-gray-400">Vote Power</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-yellow-400">{userStats.leaderboardPoints}</div>
                        <div className="text-gray-400">Points</div>
                      </div>
                    </div>
                  </div>
                )}

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

                {/* Model Selection */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Select Model
                  </div>
                  <div className="space-y-2">
                    {availableModels.map((model) => (
                      <div
                        key={model.key}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedModel === model.key
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                        }`}
                        onClick={() => setSelectedModel(model.key)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{model.displayName}</span>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                model.quality === 'premium' 
                                  ? 'border-yellow-500 text-yellow-400' 
                                  : 'border-gray-500 text-gray-400'
                              }`}
                            >
                              {model.quality}
                            </Badge>
                            <Badge variant="outline" className="text-xs text-purple-400 border-purple-500">
                              {model.credits} credits
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">{model.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors">
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-300">Upload Reference Image</span>
                      </div>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Reference"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        onClick={removeUploadedImage}
                        className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 rounded-full p-1"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Prompt Input */}
                <div>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Describe the ${generationType} you want to generate...${uploadedImage ? ' (Reference image attached)' : ''}`}
                    rows={4}
                    className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Credit System */}
                <div className="space-y-4">
                  {/* Free Generation */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-300">🆓 Free Generation</div>
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
                          Free Generation (Basic Quality)
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Credit Balance Display */}
                  <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">Your Credits</span>
                      <div className="text-lg font-bold text-yellow-400">{totalCredits}</div>
                    </div>
                    {totalERC20Credits > 0 && (
                      <div className="text-xs text-gray-500 mb-1">
                        ERC-20 Credits: {totalERC20Credits} (from USDC purchases)
                      </div>
                    )}
                    {totalNFTCredits > 0 && (
                      <div className="text-xs text-gray-500 mb-1">
                        NFT Credits: {totalNFTCredits} (from wS purchases - bonus included)
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Cost: {creditsNeeded} credits ({currentModelConfig?.displayName || 'Selected Model'})
                    </div>
                  </div>

                  {/* Use Credits Button */}
                  {totalCredits >= creditsNeeded ? (
                    <Button
                      onClick={handleUseCredits}
                      disabled={isGenerating || !prompt.trim()}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Generate with Credits ({creditsNeeded} credits)
                    </Button>
                  ) : (
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <CreditCard className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400 mb-3">
                        Need {creditsNeeded} credits. You have {totalCredits}.
                      </p>
                      <Button
                        onClick={() => setShowCreditPurchase(true)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Buy Credit Packages
                      </Button>
                    </div>
                  )}
                </div>

                {/* Token Balances */}
                <div className="pt-4 border-t border-gray-700">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 font-medium">Token Balances</span>
                      <span className="text-xs text-gray-500">
                        {isMainnet(chainId || 0) ? 'Sonic Mainnet' : 'Sonic Testnet'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">USDC Balance:</span>
                      <span className="text-blue-400">
                        {usdcBalance ? `${formatUnits(usdcBalance.value, 6)} USDC` : '0 USDC'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">wS Balance:</span>
                      <span className="text-orange-400">
                        {wsBalance ? `${formatUnits(wsBalance.value, 18)} wS` : '0 wS'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Add Tokens Helper */}
                <div className="pt-4 border-t border-gray-700">
                  <AddTokensButton />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Your Generations */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Your Generations</CardTitle>
                <Button
                  onClick={() => router.push('/thread')}
                  variant="outline"
                  size="sm"
                  className="border-purple-600 text-purple-400 hover:bg-purple-900/20"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  View Community Thread
                </Button>
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
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm flex-1">{gen.prompt}</div>
                          <div className="flex gap-1 ml-2">
                            <Badge 
                              variant={gen.paymentMethod === 'free' ? 'secondary' : 'default'} 
                              className={`text-xs ${
                                gen.paymentMethod === 'ERC20_credits' ? 'bg-blue-500/20 text-blue-400 border-blue-500' :
                                gen.paymentMethod === 'NFT_credits' ? 'bg-purple-500/20 text-purple-400 border-purple-500' :
                                gen.paymentMethod === 'free' ? 'bg-gray-500/20 text-gray-400' :
                                ''
                              }`}
                            >
                              {gen.paymentMethod === 'ERC20_credits' ? 'ERC-20 Credits' :
                               gen.paymentMethod === 'NFT_credits' ? 'NFT Credits' :
                               gen.paymentMethod === 'free' ? 'FREE' :
                               gen.paymentMethod}
                            </Badge>
                            {gen.creditsUsed && (
                              <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-500">
                                -{gen.creditsUsed} credits
                              </Badge>
                            )}
                            {gen.submittedToThread && (
                              <Badge variant="outline" className="text-xs text-green-400 border-green-500">
                                <Trophy className="h-3 w-3 mr-1" />
                                In Thread
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {gen.status === 'completed' && gen.result?.[0] ? (
                          <div className="bg-gray-800 rounded-lg p-2">
                            {gen.type === 'image' ? (
                              <img 
                                src={gen.result[0]} 
                                alt="Generated" 
                                className="w-full rounded" 
                                onError={(e) => {
                                  console.error('Image failed to load:', gen.id)
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <video 
                                src={gen.result[0]} 
                                controls 
                                className="w-full rounded" 
                                onError={(e) => {
                                  console.error('Video failed to load:', gen.id)
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400">
                            {gen.status === 'processing' ? 'Generating...' : 
                             gen.status === 'failed' ? 'Generation failed' :
                             'Unknown issue'}
                          </div>
                        )}
                        
                        {/* Download button */}
                        {gen.status === 'completed' && gen.result?.[0] && (
                          <div className="mt-3 flex gap-2">
                            <Button
                              onClick={() => downloadGeneration(gen)}
                              variant="outline"
                              size="sm"
                              className="flex-1 border-blue-600 text-blue-400 hover:bg-blue-900/20"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            {!gen.submittedToThread && (
                              <Button
                                onClick={() => submitToThread(gen)}
                                variant="outline"
                                size="sm"
                                className="border-purple-600 text-purple-400 hover:bg-purple-900/20"
                              >
                                <Trophy className="h-4 w-4 mr-2" />
                                Submit to Thread
                              </Button>
                            )}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 mt-2">
                          Created: {new Date(gen.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Credit Purchase Dialog */}
        <Dialog open={showCreditPurchase} onOpenChange={setShowCreditPurchase}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-400" />
                Purchase Credit Packages
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Choose your credit package. USDC purchases give ERC-20 credits, wS purchases give bonus NFT credits!
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {creditPackages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className={`relative border rounded-lg p-4 ${pkg.popular ? 'border-purple-500 bg-purple-500/10' : 'border-gray-600 bg-gray-800/50'}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 left-4">
                      <Badge className="bg-purple-500 text-white">Most Popular</Badge>
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold">{pkg.name}</h3>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>USDC: {pkg.usdcCredits} credits</div>
                      <div className="text-purple-400">wS: {pkg.wsCredits} credits (+{Math.round((pkg.wsCredits - pkg.usdcCredits) / pkg.usdcCredits * 100)}% bonus)</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button
                      onClick={() => handlePurchaseCreditsWithUSDC(pkg.id)}
                      disabled={!pkg.active || isGenerating}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <Coins className="h-4 w-4 mr-2" />
                      {formatUnits(pkg.usdcPrice, 6)} USDC
                    </Button>
                    
                    <Button
                      onClick={() => handlePurchaseCreditsWithWS(pkg.id)}
                      disabled={!pkg.active || isGenerating}
                      variant="outline"
                      className="w-full border-purple-500 text-purple-400 hover:bg-purple-900/20"
                      size="sm"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {formatUnits(pkg.wsTokenPrice, 18)} wS (Bonus!)
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Generation Complete!
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Your {latestGeneration?.type} has been generated successfully.
              </DialogDescription>
            </DialogHeader>
            
            {latestGeneration?.result?.[0] && (
              <div className="mt-4">
                {latestGeneration.type === 'image' ? (
                  <img 
                    src={latestGeneration.result[0]} 
                    alt="Generated content" 
                    className="w-full rounded-lg"
                  />
                ) : (
                  <video 
                    src={latestGeneration.result[0]} 
                    controls 
                    className="w-full rounded-lg"
                  />
                )}
              </div>
            )}
            
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => downloadGeneration(latestGeneration!)}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => router.push('/thread')}
                variant="outline"
                className="flex-1 border-purple-600 text-purple-400 hover:bg-purple-900/20"
              >
                <Trophy className="h-4 w-4 mr-2" />
                View in Thread
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}