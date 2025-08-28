"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ImageIcon, Video, Wallet, Clock, CheckCircle, Loader2, Zap, LogIn, User, ExternalLink, Trophy, Star, Coins, Download, Upload, X, Palette, CreditCard, Package } from "lucide-react"
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
  getPaymentContractABI,
  ERC20_ABI,
  NFT_CONTRACT_ABI,
  isTestnet,
  isMainnet,
  isSonicNetwork,
  getNetworkDisplayName,
  validateNetworkConfig,
  isMainnetContractsDeployed,
  SONIC_TESTNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID
} from "@/lib/network-config"
import { 
  CREDIT_PACKAGES, 
  MODEL_COSTS, 
  getCreditPackage, 
  getModelCost,
  calculateCreditsForGeneration,
  NFT_MINT_COSTS
} from "@/lib/credit-system-config"
import { isDevWallet, getDevWalletInfo, DEV_MODE } from "@/lib/dev-wallet-config"
import { logConnectedWallet, generateDevWalletConfig } from "@/lib/wallet-identifier"
import { diagnoseWalletTokens, testContractConnection, testContractFunction } from "@/lib/testnet-diagnostic"


interface GenerationItem {
  id: string
  type: 'image' | 'video'
  prompt: string
  status: 'processing' | 'completed' | 'failed'
  result?: string[]
  createdAt: string
  walletAddress: string
  paymentMethod: 'S' | 'USDC' | 'credits' | 'free' | 'SSSTT' | 'CORAL'
  transactionHash?: string
  submittedToThread: boolean
  nftTokenId?: number
  nftMinted?: boolean
  cloudflareUrl?: string
  nftMetadata?: any
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
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [userCredits, setUserCredits] = useState(0)
  const [selectedModel, setSelectedModel] = useState('cloudflare-free')
  const [showCreditPurchase, setShowCreditPurchase] = useState(false)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [latestGeneration, setLatestGeneration] = useState<GenerationItem | null>(null)
  const [showPaymentWidget, setShowPaymentWidget] = useState<'S_TOKEN' | 'USDC' | 'SSSTT' | null>(null)
  const [selectedCreditPackage, setSelectedCreditPackage] = useState<string | null>(null)
  const [sTokensPerUSDC, setSTokensPerUSDC] = useState(4.0) // Default fallback
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null)
  const [mintAsNFT, setMintAsNFT] = useState(false) // NFT minting option
  const [nftMintingEnabled, setNFTMintingEnabled] = useState(true) // Global NFT feature toggle
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
    token: string;
    functionName: string;
    amount: bigint;
    paymentMethod: 'S' | 'USDC' | 'SSSTT' | 'CORAL';
    mintNFT?: boolean;
    imageData?: string;
    model?: string;
  } | null>(null)
  
  // Read user credits from credit system contract
  const { data: userCreditBalance } = useReadContract({
    address: process.env.NEXT_PUBLIC_SONIC_CREDIT_CONTRACT as `0x${string}`,
    abi: [
      {
        name: 'getUserCredits',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ],
    functionName: 'getUserCredits',
    args: [address as `0x${string}`],
    query: { enabled: !!address }
  })

  // Read user stats from contract
  const { data: contractStats } = useReadContract({
    address: networkConfig?.contracts.payment as `0x${string}`,
    abi: chainId ? getPaymentContractABI(chainId) : [],
    functionName: 'getUserStats',
    args: [address as `0x${string}`],
    query: { enabled: !!address && !!networkConfig?.contracts.payment }
  })
  
  // Token balances using Wagmi - Dynamic based on current network
  const { data: sTokenBalance } = useBalance({
    address: address,
    token: addresses?.S_TOKEN as `0x${string}`,
    chainId: chainId,
    query: { enabled: !!addresses?.S_TOKEN }
  })
  
  const { data: usdcBalance } = useBalance({
    address: address,
    token: addresses?.USDC as `0x${string}`,
    chainId: chainId,
    query: { enabled: !!addresses?.USDC }
  })
  
  const { data: sssttBalance, isLoading: sssttLoading, error: sssttError } = useBalance({
    address: address,
    token: addresses?.SSSTT as `0x${string}`,
    chainId: chainId,
    query: { enabled: !!addresses?.SSSTT } // Only query if SSSTT exists (testnet)
  })
  
  const { data: coralBalance, isLoading: coralLoading, error: coralError } = useBalance({
    address: address,
    token: addresses?.CORAL as `0x${string}`,
    chainId: chainId,
    query: { enabled: !!addresses?.CORAL } // Only query if CORAL exists (testnet)
  })
  
  const { data: nativeBalance } = useBalance({
    address: address,
    chainId: chainId,
  })

  useEffect(() => {
    if (address) {
      fetchUserStats()
      fetchGenerationHistory()
      if (DEV_MODE) {
        console.log('=== WALLET DEBUG INFO ===')
        console.log('Account connected:', address)
        console.log('Is Dev Wallet:', isDevWallet(address))
        console.log('Chain ID:', chainId)
        console.log('Network Config:', networkConfig)
        console.log('Is Supported Network:', isCurrentNetworkSupported)
        console.log('SSStt token address:', addresses?.SSSTT)
        console.log('SSStt balance object:', sssttBalance)
        console.log('SSStt balance loading:', sssttLoading)
        console.log('SSStt balance error:', sssttError)
        console.log('USDC balance object:', usdcBalance)
        console.log('S token balance object:', sTokenBalance)
        console.log('CORAL balance object:', coralBalance)
        console.log('CORAL loading:', coralLoading)
        console.log('CORAL error:', coralError)
        console.log('Native balance object:', nativeBalance)
        console.log('=========================')
        
        // Show dev wallet info in the UI during development
        if (isDevWallet(address)) {
          toast.success(`🛠️ Dev Mode: Premium access enabled for ${address.substring(0, 8)}...`, { duration: 3000 })
        }
      }
    }
    // Fetch current pricing on component mount
    fetchCurrentPricing()
  }, [address, chainId, networkConfig, sssttBalance, sssttLoading, sssttError, usdcBalance, sTokenBalance, coralBalance, coralLoading, coralError, nativeBalance])

  // Handle transaction confirmations for two-step payment process
  useEffect(() => {
    if (isConfirmed && hash) {
      console.log('Transaction confirmed:', hash)
      console.log('Payment step:', paymentStep)
      console.log('Pending payment:', pendingPayment)
      
      if (paymentStep === 'approving' && pendingPayment) {
        // Approval transaction confirmed, now execute payment
        console.log('Approval confirmed, executing payment...')
        setPaymentStep('paying')
        executePayment()
      } else if (paymentStep === 'paying') {
        // Payment transaction confirmed
        console.log('Payment confirmed, checking if credit purchase or generation...')
        setPaymentStep('completed')
        
        // Check if this was a credit purchase
        if (pendingPayment && (pendingPayment.functionName === 'purchaseCreditsWithUSDC' || pendingPayment.functionName === 'purchaseCreditsWithWS')) {
          // Credit purchase completed
          toast.success('🎉 Credits purchased successfully!')
          
          // Refresh user credits
          setTimeout(() => {
            fetchUserStats()
          }, 2000)
          
          setIsGenerating(false)
          setPaymentStep('idle')
          setPendingPayment(null)
          setSelectedCreditPackage(null)
        } else {
          // Generation payment - trigger generation
          handlePaidGenerationSuccess(hash)
          // Don't reset isGenerating here - let handlePaidGenerationSuccess do it
        }
      }
    }
  }, [isConfirmed, hash, paymentStep, pendingPayment])

  // Debug function to validate contract addresses and user setup
  const validatePaymentSetup = async () => {
    console.log('=== Payment Setup Validation ===')
    console.log('User address:', address)
    console.log('Current chain:', chainId)
    console.log('Current network:', getNetworkDisplayName(chainId || 0))
    console.log('Network config:', networkConfig)
    console.log('SSStt balance:', sssttBalance)
    console.log('USDC balance:', usdcBalance)
    console.log('Payment contract:', networkConfig?.contracts.payment)
    console.log('SSStt token address:', addresses?.SSSTT)
    console.log('USDC token address:', addresses?.USDC)
    console.log('Required SSStt amount:', networkConfig?.paymentAmounts.SSSTT_AMOUNT?.toString())
    console.log('Required USDC amount:', networkConfig?.paymentAmounts.USDC_AMOUNT?.toString())
    console.log('================================')
  }

  // Execute the actual payment transaction after approval
  const executePayment = async () => {
    if (!pendingPayment || !address) return
    
    try {
      // Check if this is a credit purchase
      if (pendingPayment.functionName === 'purchaseCreditsWithUSDC' || pendingPayment.functionName === 'purchaseCreditsWithWS') {
        toast('Step 2/2: Executing credit purchase...', { icon: '💰' })
        
        const packageId = selectedCreditPackage || '2' // Default to Pro package
        
        await writeContract({
          address: process.env.NEXT_PUBLIC_SONIC_CREDIT_CONTRACT as `0x${string}`,
          abi: [
            {
              name: pendingPayment.functionName,
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [{ name: 'packageId', type: 'uint256' }],
              outputs: []
            }
          ],
          functionName: pendingPayment.functionName as any,
          args: [parseInt(packageId)],
          chainId: networkConfig?.chainId,
        })
        return
      }

      // Handle legacy NFT minting and generation payments
      if (!networkConfig || !prompt) return
      
      const isNFTMinting = pendingPayment.mintNFT
      toast(`Step 2/2: Executing ${isNFTMinting ? 'generation + NFT minting' : 'payment'} transaction...`, { icon: '💰' })
      
      let args: any[]
      if (isNFTMinting) {
        // For NFT minting, we need placeholder values for imageData and model
        // These will be updated after generation is complete
        args = [prompt, generationType, 'placeholder', 'premium-model']
      } else {
        args = [prompt, generationType]
      }
      
      await writeContract({
        address: networkConfig.contracts.payment as `0x${string}`,
        abi: getPaymentContractABI(networkConfig.chainId),
        functionName: pendingPayment.functionName as any,
        args,
        chainId: networkConfig.chainId,
      })
    } catch (error) {
      console.error('Payment execution failed:', error)
      toast.error('Payment execution failed')
      setIsGenerating(false)
      setPaymentStep('idle')
      setPendingPayment(null)
    }
  }

  const fetchCurrentPricing = async () => {
    try {
      setLoadingPrices(true)
      const response = await fetch('/api/price/sonic')
      const data = await response.json()
      
      if (data.success) {
        setSTokensPerUSDC(data.data.sTokensPerUSDC)
      } else {
        console.warn('Using fallback pricing:', data.fallback)
        if (data.fallback) {
          setSTokensPerUSDC(data.fallback.sTokensPerUSDC)
        }
      }
    } catch (error) {
      console.error('Error fetching pricing:', error)
      // Keep fallback value of 4.0 S tokens per USDC
    } finally {
      setLoadingPrices(false)
    }
  }

  // Check if user needs to switch to a supported Sonic network
  const needsNetworkSwitch = !isCurrentNetworkSupported

  // Already have isConnected from useAccount hook

  // Payment handler functions
  const handlePayWithSSStt = async () => {
    if (!prompt.trim() || !address) return
    
    // Check if this is a dev wallet - bypass payment
    if (isDevWallet(address)) {
      toast.success('🎉 Dev wallet detected - using premium generation for free!')
      await handleDevWalletGeneration('premium')
      return
    }
    
    // Simplified approach - skip simulation, just try the transaction
    console.log('🚀 Attempting SSStt payment with simplified flow...')
    console.log('User balance:', sssttBalance ? formatUnits(sssttBalance.value, 18) : 'Unknown')
    
    if (needsNetworkSwitch) {
      toast.error('Please switch to a supported Sonic network')
      try {
        await switchChain({ chainId: SONIC_TESTNET_CHAIN_ID })
      } catch (error) {
        console.error('Failed to switch network:', error)
        return
      }
    }
    
    if (!networkConfig) {
      toast.error('Network configuration not available')
      return
    }
    
    // Check if user has enough SSStt tokens
    if (!sssttBalance || !networkConfig.paymentAmounts.SSSTT_AMOUNT || sssttBalance.value < networkConfig.paymentAmounts.SSSTT_AMOUNT) {
      toast.error(`Insufficient SSStt balance. You need at least ${formatUnits(networkConfig.paymentAmounts.SSSTT_AMOUNT, 18)} SSStt tokens.`)
      return
    }
    
    setIsGenerating(true)
    toast('🔄 Attempting direct SSStt payment (no approval step)...', { duration: 5000 })

    try {
      console.log('Calling payWithSSStt directly with params:', {
        contract: networkConfig.contracts.payment,
        prompt,
        generationType,
        chainId: networkConfig.chainId,
        userAddress: address,
        requiredAmount: networkConfig.paymentAmounts.SSSTT_AMOUNT.toString()
      })
      
      // Try direct payment without approval step
      await writeContract({
        address: networkConfig.contracts.payment as `0x${string}`,
        abi: [
          {
            name: 'payWithSSStt',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'prompt', type: 'string' },
              { name: 'generationType', type: 'string' }
            ],
            outputs: []
          }
        ],
        functionName: 'payWithSSStt',
        args: [prompt, generationType],
        chainId: networkConfig.chainId,
      })
      
      toast.success('🎉 SSStt payment submitted! Generating premium content...')
      
      // Simulate a successful payment for testing
      const mockTxHash = `0x${'0'.repeat(64)}`
      setTimeout(async () => {
        await handlePaidGenerationSuccess(mockTxHash)
      }, 2000)
      
    } catch (error: any) {
      console.error('Direct SSStt payment failed:', error)
      
      // More detailed error handling
      if (error?.message?.includes('User rejected') || error?.code === 4001) {
        toast.error('Transaction cancelled by user')
      } else if (error?.message?.includes('insufficient') || error?.message?.includes('balance')) {
        toast.error('Insufficient SSStt balance or gas')
      } else if (error?.message?.includes('allowance')) {
        toast.error('Token allowance issue. Try the approval flow.')
      } else {
        toast.error(`Payment failed: ${error?.shortMessage || error?.message || 'Unknown error'}`)
        console.log('Full error details:', error)
      }
      
      setIsGenerating(false)
    }
  }

  const handlePayWithUSDC = async () => {
    if (!prompt.trim() || !address) return
    
    // Check if this is a dev wallet - bypass payment
    if (isDevWallet(address)) {
      toast.success('🎉 Dev wallet detected - using premium generation for free!')
      await handleDevWalletGeneration('premium')
      return
    }
    
    if (needsNetworkSwitch) {
      toast.error('Please switch to a supported Sonic network')
      try {
        await switchChain({ chainId: SONIC_TESTNET_CHAIN_ID })
      } catch (error) {
        console.error('Failed to switch network:', error)
        return
      }
    }
    
    if (!networkConfig) {
      toast.error('Network configuration not available')
      return
    }
    
    // Check if contracts are properly deployed and configured
    if (!isValidConfig) {
      if (isMainnet(chainId || 0) && !isMainnetContractsDeployed()) {
        toast.error('Mainnet contracts are not yet deployed. Please use testnet for now.')
        return
      }
      toast.error('Invalid network configuration. Please try switching networks.')
      return
    }
    
    // Check if user has enough USDC
    if (!usdcBalance || usdcBalance.value < networkConfig.paymentAmounts.USDC_AMOUNT) {
      toast.error('Insufficient USDC balance. You need at least 1 USDC.')
      return
    }
    
    setIsGenerating(true)
    setPaymentStep('approving')
    setPendingPayment({
      token: networkConfig.tokens.USDC,
      functionName: 'payWithUSDC',
      amount: networkConfig.paymentAmounts.USDC_AMOUNT,
      paymentMethod: 'USDC'
    })

    try {
      console.log('Starting USDC approval...')
      toast('Step 1/2: Approving USDC spending...', { icon: 'ℹ️' })
      
      const result = await writeContract({
        address: networkConfig.tokens.USDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [networkConfig.contracts.payment as `0x${string}`, networkConfig.paymentAmounts.USDC_AMOUNT],
        chainId: networkConfig.chainId,
      })
      
      console.log('USDC approval transaction initiated:', result)
    } catch (error: any) {
      console.error('USDC approval failed:', error)
      
      if (error?.message?.includes('User rejected') || error?.code === 4001) {
        toast.error('Transaction cancelled by user')
      } else if (error?.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction')
      } else {
        toast.error(`USDC approval failed: ${error?.message || 'Unknown error'}`)
      }
      
      setIsGenerating(false)
      setPaymentStep('idle')
      setPendingPayment(null)
    }
  }

  const handlePayWithSToken = async () => {
    if (!prompt.trim() || !address) return
    
    // Check if this is a dev wallet - bypass payment
    if (isDevWallet(address)) {
      toast.success('🎉 Dev wallet detected - using premium generation for free!')
      await handleDevWalletGeneration('premium')
      return
    }
    
    if (needsNetworkSwitch) {
      toast.error('Please switch to a supported Sonic network')
      try {
        const targetChain = networkConfig?.chainId || SONIC_TESTNET_CHAIN_ID
        await switchChain({ chainId: targetChain })
      } catch (error) {
        console.error('Failed to switch network:', error)
        return
      }
    }
    
    if (!networkConfig) {
      toast.error('Network configuration not available')
      return
    }
    
    // Check if contracts are properly deployed and configured
    if (!isValidConfig) {
      if (isMainnet(chainId || 0) && !isMainnetContractsDeployed()) {
        toast.error('Mainnet contracts are not yet deployed. Please use testnet for now.')
        return
      }
      toast.error('Invalid network configuration. Please try switching networks.')
      return
    }
    
    // Check if user has enough S tokens
    if (!sTokenBalance || sTokenBalance.value < networkConfig.paymentAmounts.S_TOKEN_AMOUNT) {
      toast.error('Insufficient S token balance.')
      return
    }
    
    setIsGenerating(true)
    setPaymentStep('approving')
    setPendingPayment({
      token: networkConfig.tokens.S_TOKEN,
      functionName: 'payWithS',
      amount: networkConfig.paymentAmounts.S_TOKEN_AMOUNT,
      paymentMethod: 'S'
    })

    try {
      toast('Step 1/2: Approving S token spending...', { icon: 'ℹ️' })
      await writeContract({
        address: networkConfig.tokens.S_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [networkConfig.contracts.payment as `0x${string}`, networkConfig.paymentAmounts.S_TOKEN_AMOUNT],
        chainId: networkConfig.chainId,
      })
    } catch (error) {
      console.error('S token approval failed:', error)
      toast.error('S token approval failed')
      setIsGenerating(false)
      setPaymentStep('idle')
      setPendingPayment(null)
    }
  }

  const handlePayWithCORAL = async () => {
    if (!prompt.trim() || !address) return
    
    if (needsNetworkSwitch) {
      toast.error('Please switch to a supported Sonic network')
      try {
        const targetChain = networkConfig?.chainId || SONIC_TESTNET_CHAIN_ID
        await switchChain({ chainId: targetChain })
      } catch (error) {
        console.error('Failed to switch network:', error)
        return
      }
    }
    
    if (!networkConfig || !networkConfig.tokens.CORAL || !networkConfig.paymentAmounts.CORAL_AMOUNT) {
      toast.error('CORAL token not available on this network')
      return
    }
    
    // Check if contracts are properly deployed and configured
    if (!isValidConfig) {
      if (isMainnet(chainId || 0) && !isMainnetContractsDeployed()) {
        toast.error('Mainnet contracts are not yet deployed. Please use testnet for now.')
        return
      }
      toast.error('Invalid network configuration. Please try switching networks.')
      return
    }
    
    // Check if user has enough CORAL tokens
    if (!coralBalance || coralBalance.value < networkConfig.paymentAmounts.CORAL_AMOUNT) {
      toast.error('Insufficient CORAL balance.')
      return
    }
    
    setIsGenerating(true)
    setPaymentStep('approving')
    setPendingPayment({
      token: networkConfig.tokens.CORAL,
      functionName: 'payWithCORAL',
      amount: networkConfig.paymentAmounts.CORAL_AMOUNT,
      paymentMethod: 'CORAL'
    })

    try {
      toast('Step 1/2: Approving CORAL spending...', { icon: 'ℹ️' })
      await writeContract({
        address: networkConfig.tokens.CORAL as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [networkConfig.contracts.payment as `0x${string}`, networkConfig.paymentAmounts.CORAL_AMOUNT],
        chainId: networkConfig.chainId,
      })
    } catch (error) {
      console.error('CORAL approval failed:', error)
      toast.error('CORAL approval failed')
      setIsGenerating(false)
      setPaymentStep('idle')
      setPendingPayment(null)
    }
  }

  // Credit Purchase Functions
  const handlePurchaseCreditsWithUSDC = async (packageId: number) => {
    if (!address) return
    
    const creditPackage = getCreditPackage(packageId.toString())
    if (!creditPackage) {
      toast.error('Invalid credit package selected')
      return
    }

    if (needsNetworkSwitch) {
      toast.error('Please switch to a supported Sonic network')
      try {
        await switchChain({ chainId: SONIC_TESTNET_CHAIN_ID })
      } catch (error) {
        console.error('Failed to switch network:', error)
        return
      }
    }

    // Check USDC balance
    if (!usdcBalance || usdcBalance.value < creditPackage.usdcPrice) {
      toast.error(`Insufficient USDC balance. Need ${Number(creditPackage.usdcPrice) / 1e6} USDC`)
      return
    }

    setIsGenerating(true)
    setPaymentStep('approving')

    try {
      toast('Step 1/2: Approving USDC for credit purchase...', { icon: 'ℹ️' })
      
      // First approve USDC
      await writeContract({
        address: networkConfig?.tokens.USDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [process.env.NEXT_PUBLIC_SONIC_CREDIT_CONTRACT as `0x${string}`, creditPackage.usdcPrice],
        chainId: networkConfig?.chainId,
      })

      // Store purchase intent
      setPendingPayment({
        token: networkConfig?.tokens.USDC!,
        functionName: 'purchaseCreditsWithUSDC',
        amount: creditPackage.usdcPrice,
        paymentMethod: 'USDC'
      })
    } catch (error: any) {
      console.error('USDC approval for credits failed:', error)
      toast.error(`Credit purchase approval failed: ${error?.message || 'Unknown error'}`)
      setIsGenerating(false)
      setPaymentStep('idle')
    }
  }

  const handlePurchaseCreditsWithWS = async (packageId: number) => {
    if (!address) return
    
    const creditPackage = getCreditPackage(packageId.toString())
    if (!creditPackage) {
      toast.error('Invalid credit package selected')
      return
    }

    if (needsNetworkSwitch) {
      toast.error('Please switch to a supported Sonic network')
      try {
        await switchChain({ chainId: SONIC_TESTNET_CHAIN_ID })
      } catch (error) {
        console.error('Failed to switch network:', error)
        return
      }
    }

    // Check wS balance  
    if (!sTokenBalance || sTokenBalance.value < creditPackage.wsTokenPrice) {
      toast.error(`Insufficient wS balance. Need ${Number(creditPackage.wsTokenPrice) / 1e18} wS`)
      return
    }

    setIsGenerating(true)
    setPaymentStep('approving')

    try {
      toast('Step 1/2: Approving wS tokens for credit purchase...', { icon: 'ℹ️' })
      
      // First approve wS tokens
      await writeContract({
        address: networkConfig?.tokens.S_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [process.env.NEXT_PUBLIC_SONIC_CREDIT_CONTRACT as `0x${string}`, creditPackage.wsTokenPrice],
        chainId: networkConfig?.chainId,
      })

      // Store purchase intent
      setPendingPayment({
        token: networkConfig?.tokens.S_TOKEN!,
        functionName: 'purchaseCreditsWithWS',
        amount: creditPackage.wsTokenPrice,
        paymentMethod: 'S'
      })
    } catch (error: any) {
      console.error('wS approval for credits failed:', error)
      toast.error(`Credit purchase approval failed: ${error?.message || 'Unknown error'}`)
      setIsGenerating(false)
      setPaymentStep('idle')
    }
  }

  const handleUseCredits = async () => {
    if (!prompt.trim() || !address) return
    
    const modelCost = getModelCost(selectedModel)
    const requiredCredits = modelCost ? modelCost.credits : 15 // Default to 15 credits
    
    if (userCredits < requiredCredits) {
      toast.error(`Insufficient credits. Need ${requiredCredits} credits, you have ${userCredits}`)
      setShowCreditPurchase(true)
      return
    }

    if (needsNetworkSwitch) {
      toast.error('Please switch to a supported Sonic network')
      try {
        const targetChain = networkConfig?.chainId || SONIC_TESTNET_CHAIN_ID
        await switchChain({ chainId: targetChain })
      } catch (error) {
        console.error('Failed to switch network:', error)
        return
      }
    }
    
    setIsGenerating(true)

    try {
      // Generate using credits (backend will deduct credits via contract call)
      const response = await fetch('/api/mcp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: generationType,
          prompt,
          paymentType: 'credits',
          userAddress: address,
          model: selectedModel,
          creditsToSpend: requiredCredits
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const generationId = `credit_gen_${Date.now()}_${Math.random().toString(36).slice(2)}`
        const resultUrl = data.imageData ? `data:image/png;base64,${data.imageData}` : data.videoUrl
        
        // Save to Cloudflare R2 and get permanent URL
        let permanentUrl = resultUrl
        let nftMetadata = undefined
        
        try {
          const saveResponse = await fetch('/api/generations/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              generationId,
              type: generationType,
              prompt,
              userAddress: address,
              paymentMethod: 'credits',
              model: selectedModel,
              creditsUsed: requiredCredits,
              resultData: data.imageData || data.videoUrl,
              collectionInfluence: data.collectionInfluence // If collection keywords were detected
            })
          })
          
          const saveData = await saveResponse.json()
          if (saveData.success) {
            permanentUrl = saveData.permanentUrl
            nftMetadata = {
              tokenId: saveData.tokenId,
              metadataUrl: saveData.metadataUrl
            }
          }
        } catch (saveError) {
          console.warn('Failed to save to permanent storage:', saveError)
          // Continue with temporary storage
        }
        
        const newGeneration: GenerationItem = {
          id: generationId,
          type: generationType,
          prompt,
          status: 'completed',
          result: [permanentUrl],
          createdAt: new Date().toISOString(),
          walletAddress: address,
          paymentMethod: 'credits',
          submittedToThread: false,
          cloudflareUrl: nftMetadata ? permanentUrl : undefined,
          nftTokenId: nftMetadata?.tokenId
        }
        
        setGenerations(prev => [newGeneration, ...prev])
        setLatestGeneration(newGeneration)
        setPrompt("")
        setShowSuccessDialog(true)
        
        // Update user credits locally (will be refreshed from contract)
        setUserCredits(prev => prev - requiredCredits)
        
        if (nftMetadata) {
          toast.success(`🎉 Generated and saved to permanent storage! Used ${requiredCredits} credits.`)
        } else {
          toast.success(`🎉 Generated using ${requiredCredits} credits! (Temporary storage)`)
        }
      } else {
        throw new Error(data.error || 'Generation failed')
      }
    } catch (error: any) {
      console.error('Credit generation failed:', error)
      toast.error(`Generation failed: ${error?.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // NFT Minting Payment Functions
  const handlePayWithSSSttAndMintNFT = async () => {
    if (!prompt.trim() || !address) return
    
    if (needsNetworkSwitch) {
      toast.error('Please switch to a supported Sonic network')
      try {
        await switchChain({ chainId: SONIC_TESTNET_CHAIN_ID })
      } catch (error) {
        console.error('Failed to switch network:', error)
        return
      }
    }
    
    if (!networkConfig) {
      toast.error('Network configuration not available')
      return
    }
    
    if (!isValidConfig) {
      toast.error('Invalid network configuration. Please try switching networks.')
      return
    }
    
    // Calculate total cost (generation + NFT minting)
    const generationCost = networkConfig.paymentAmounts.SSSTT_AMOUNT!
    const nftCost = parseUnits('0.5', 18) // 0.5 SSStt additional for NFT
    const totalCost = generationCost + nftCost
    
    // Check if user has enough SSStt tokens
    if (!sssttBalance || sssttBalance.value < totalCost) {
      toast.error('Insufficient SSStt balance. You need at least 1.5 SSStt tokens for generation + NFT minting.')
      return
    }
    
    setIsGenerating(true)
    setPaymentStep('approving')
    setPendingPayment({
      token: networkConfig.tokens.SSSTT!,
      functionName: 'payWithSSSttAndMintNFT',
      amount: totalCost,
      paymentMethod: 'SSSTT',
      mintNFT: true
    })

    try {
      toast('Step 1/2: Approving SSStt spending for generation + NFT...', { icon: 'ℹ️' })
      
      await writeContract({
        address: networkConfig.tokens.SSSTT as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [networkConfig.contracts.payment as `0x${string}`, totalCost],
        chainId: networkConfig.chainId,
      })
    } catch (error: any) {
      console.error('SSStt + NFT approval failed:', error)
      toast.error(`SSStt + NFT approval failed: ${error?.message || 'Unknown error'}`)
      setIsGenerating(false)
      setPaymentStep('idle')
      setPendingPayment(null)
    }
  }

  const handlePayWithUSDCAndMintNFT = async () => {
    if (!prompt.trim() || !address) return
    
    if (needsNetworkSwitch) {
      toast.error('Please switch to a supported Sonic network')
      try {
        await switchChain({ chainId: SONIC_TESTNET_CHAIN_ID })
      } catch (error) {
        console.error('Failed to switch network:', error)
        return
      }
    }
    
    if (!networkConfig || !isValidConfig) {
      toast.error('Network configuration not available or invalid')
      return
    }
    
    const generationCost = networkConfig.paymentAmounts.USDC_AMOUNT
    const nftCost = parseUnits('0.5', 6) // 0.5 USDC additional for NFT
    const totalCost = generationCost + nftCost
    
    if (!usdcBalance || usdcBalance.value < totalCost) {
      toast.error('Insufficient USDC balance. You need at least 1.5 USDC for generation + NFT minting.')
      return
    }
    
    setIsGenerating(true)
    setPaymentStep('approving')
    setPendingPayment({
      token: networkConfig.tokens.USDC,
      functionName: 'payWithUSDCAndMintNFT',
      amount: totalCost,
      paymentMethod: 'USDC',
      mintNFT: true
    })

    try {
      toast('Step 1/2: Approving USDC spending for generation + NFT...', { icon: 'ℹ️' })
      
      await writeContract({
        address: networkConfig.tokens.USDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [networkConfig.contracts.payment as `0x${string}`, totalCost],
        chainId: networkConfig.chainId,
      })
    } catch (error: any) {
      console.error('USDC + NFT approval failed:', error)
      toast.error(`USDC + NFT approval failed: ${error?.message || 'Unknown error'}`)
      setIsGenerating(false)
      setPaymentStep('idle')
      setPendingPayment(null)
    }
  }

  const handlePayWithSTokenAndMintNFT = async () => {
    if (!prompt.trim() || !address) return
    
    if (needsNetworkSwitch) {
      toast.error('Please switch to a supported Sonic network')
      try {
        await switchChain({ chainId: networkConfig?.chainId || SONIC_TESTNET_CHAIN_ID })
      } catch (error) {
        console.error('Failed to switch network:', error)
        return
      }
    }
    
    if (!networkConfig || !isValidConfig) {
      toast.error('Network configuration not available or invalid')
      return
    }
    
    const generationCost = networkConfig.paymentAmounts.S_TOKEN_AMOUNT
    const nftCost = parseUnits('1.5', 18) // 1.5 S tokens additional for NFT
    const totalCost = generationCost + nftCost
    
    if (!sTokenBalance || sTokenBalance.value < totalCost) {
      toast.error('Insufficient S token balance. You need additional tokens for NFT minting.')
      return
    }
    
    setIsGenerating(true)
    setPaymentStep('approving')
    setPendingPayment({
      token: networkConfig.tokens.S_TOKEN,
      functionName: 'payWithSAndMintNFT',
      amount: totalCost,
      paymentMethod: 'S',
      mintNFT: true
    })

    try {
      toast('Step 1/2: Approving S token spending for generation + NFT...', { icon: 'ℹ️' })
      
      await writeContract({
        address: networkConfig.tokens.S_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [networkConfig.contracts.payment as `0x${string}`, totalCost],
        chainId: networkConfig.chainId,
      })
    } catch (error: any) {
      console.error('S token + NFT approval failed:', error)
      toast.error(`S token + NFT approval failed: ${error?.message || 'Unknown error'}`)
      setIsGenerating(false)
      setPaymentStep('idle')
      setPendingPayment(null)
    }
  }

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
      
      // Get credits from credit system contract
      if (userCreditBalance) {
        setUserCredits(Number(userCreditBalance))
      }
      
      // Dev wallets get unlimited credits (999999)
      if (isDevWallet(address)) {
        setUserCredits(999999)
      }
      
      // Also get stats from payment contract for legacy support
      if (contractStats) {
        // Additional stats can go here
      }
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

  // Submit generation to contract for voting/leaderboard
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

  // Download generation result
  const downloadGeneration = (generation: GenerationItem) => {
    if (!generation.result || !generation.result[0]) {
      toast.error('No image data to download')
      return
    }

    try {
      const base64Data = generation.result[0]
      const link = document.createElement('a')
      link.href = base64Data
      link.download = `generation-${generation.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Download started!')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Download failed')
    }
  }

  // Handle image upload
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

  const handleFreeGeneration = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/mcp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: generationType,
          prompt,
          paymentType: 'free'
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
      toast.error('Free generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePaidGenerationSuccess = async (txHash: string) => {
    if (!prompt || !address || !pendingPayment) {
      console.error('Missing prompt, address, or pendingPayment for paid generation')
      return
    }

    console.log('Starting paid generation with txHash:', txHash)
    console.log('PendingPayment details:', pendingPayment)
    
    // Keep the generating state active while processing
    setIsGenerating(true)

    try {
      const response = await fetch('/api/mcp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: generationType,
          prompt,
          paymentTx: txHash,
          userAddress: address,
          paymentType: 'crypto'
        })
      })

      const data = await response.json()
      console.log('Paid generation API response:', data)
      
      if (data.success) {
        const generationId = `gen_${Date.now()}_${Math.random().toString(36).slice(2)}`
        const resultUrl = data.imageData ? `data:image/png;base64,${data.imageData}` : data.videoUrl
        
        // Save to Cloudflare R2 and get permanent URL
        let permanentUrl = resultUrl
        let nftMetadata = undefined
        
        try {
          const saveResponse = await fetch('/api/generations/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              generationId,
              type: generationType,
              prompt,
              userAddress: address,
              paymentMethod: 'USDC',  // USDC payment
              model: selectedModel,
              creditsUsed: 0,  // No credits used, paid with USDC
              resultData: data.imageData || data.videoUrl,
              collectionInfluence: data.collectionInfluence // If collection keywords were detected
            })
          })
          
          const saveData = await saveResponse.json()
          if (saveData.success) {
            permanentUrl = saveData.permanentUrls[0] // Use first permanent URL
            nftMetadata = {
              metadataUrl: saveData.metadata
            }
          }
        } catch (saveError) {
          console.warn('Failed to save to permanent storage:', saveError)
          // Continue with temporary storage
        }
        
        console.log('Creating generation record for paid generation:', generationId)
        console.log('Data received:', { hasImageData: !!data.imageData, hasVideoUrl: !!data.videoUrl, resultUrl: resultUrl?.substring(0, 50) + '...' })
        
        const newGeneration: GenerationItem = {
          id: generationId,
          type: generationType,
          prompt,
          status: 'completed',
          result: [permanentUrl], // Use permanent URL instead of temporary
          createdAt: new Date().toISOString(),
          walletAddress: address,
          paymentMethod: pendingPayment.paymentMethod, // Use the specific payment method
          transactionHash: txHash,
          submittedToThread: false,
          cloudflareUrl: permanentUrl !== resultUrl ? permanentUrl : undefined, // Set if saved to R2
          nftMetadata: nftMetadata
        }
        
        console.log('Adding new generation to state:', newGeneration)
        
        // Update generations state and force re-render
        setGenerations(prev => {
          const updated = [newGeneration, ...prev]
          console.log('Updated generations array:', updated.length, 'items')
          return updated
        })
        
        setLatestGeneration(newGeneration)
        
        // Submit to voting contract
        const submitted = await submitGenerationToContract({
          id: generationId,
          prompt,
          resultUrl,
          paymentTx: txHash
        })
        
        if (submitted) {
          // Update the generation item with submitted status
          setGenerations(prev => 
            prev.map(gen => 
              gen.id === generationId 
                ? { ...gen, submittedToThread: true }
                : gen
            )
          )
        }
        
        setPrompt("")
        setShowSuccessDialog(true)
        toast.success('🎉 Premium generation completed!')
        
        
      } else {
        console.error('Paid generation API error:', data.error)
        throw new Error(data.error || 'Generation failed')
      }
    } catch (error) {
      console.error('Paid generation failed:', error)
      toast.error(`Paid generation failed: ${error.message}`)
    } finally {
      setIsGenerating(false)
      setPaymentStep('idle')
      setPendingPayment(null)
    }
  }

  const handleSwitchToSonic = async () => {
    try {
      // Default to testnet for now, but this could be configurable
      const targetChain = networkConfig?.chainId || SONIC_TESTNET_CHAIN_ID
      await switchChain({ chainId: targetChain })
    } catch (error) {
      console.error('Failed to switch to Sonic network:', error)
    }
  }

  // Wallet identification helper for dev setup
  const handleWalletIdentification = () => {
    if (!address) {
      toast.error('No wallet connected')
      return
    }

    logConnectedWallet(address)
    
    const configContent = generateDevWalletConfig(address)
    
    toast.success(`✅ Wallet identified! Check console for setup instructions.`, { 
      duration: 5000 
    })
    
    // Also show in a prompt for easy copying
    if (DEV_MODE) {
      navigator.clipboard.writeText(address.toLowerCase()).then(() => {
        toast.success(`📋 Wallet address copied to clipboard!`, { duration: 3000 })
      })
    }
  }

  // Debug payment contract function
  const handleContractDiagnostic = async () => {
    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt first')
      return
    }

    console.log('🔍 Starting comprehensive contract diagnostics...')
    console.log('Connected wallet:', address)
    
    // Import and run all diagnostic functions
    try {
      const { 
        diagnoseWalletTokens, 
        testContractConnection, 
        testContractFunction,
        checkPaymentHistory,
        testGenerationFlow,
        checkPriceOracleIssue,
        checkCurrentContract,
        verifyContractDeployment
      } = await import('../lib/testnet-diagnostic')
      
      // Run comprehensive diagnostics
      await diagnoseWalletTokens(address)
      await verifyContractDeployment()
      await testContractConnection()
      await checkCurrentContract()
      await checkPriceOracleIssue()
      await testContractFunction(address, prompt || 'Diagnostic test')
      await checkPaymentHistory(address)
      await testGenerationFlow(address)
      
      toast.success('Contract diagnostics completed - check console for details')
    } catch (error) {
      console.error('Diagnostic error:', error)
      toast.error('Diagnostic failed: ' + error.message)
    }
  }

  // Dev wallet premium generation (no payment required)
  const handleDevWalletGeneration = async (quality: 'free' | 'premium' = 'premium') => {
    if (!prompt.trim() || !address) return
    
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/mcp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: generationType,
          prompt,
          paymentType: quality === 'premium' ? 'dev-premium' : 'free',
          userAddress: address,
          devWallet: true
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const generationId = `dev_gen_${Date.now()}_${Math.random().toString(36).slice(2)}`
        const resultUrl = data.imageData ? `data:image/png;base64,${data.imageData}` : data.videoUrl
        
        const newGeneration: GenerationItem = {
          id: generationId,
          type: generationType,
          prompt,
          status: 'completed',
          result: [resultUrl],
          createdAt: new Date().toISOString(),
          walletAddress: address,
          paymentMethod: quality === 'premium' ? 'credits' : 'free', // Show as credits for premium dev gen
          submittedToThread: false
        }
        
        setGenerations(prev => [newGeneration, ...prev])
        setLatestGeneration(newGeneration)
        setPrompt("")
        setShowSuccessDialog(true)
        
        toast.success(`🎉 ${quality === 'premium' ? 'Premium dev' : 'Free'} generation completed!`)
      } else {
        throw new Error(data.error || 'Generation failed')
      }
    } catch (error) {
      console.error('Dev wallet generation failed:', error)
      toast.error(`Generation failed: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
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
            <div className="w-full">
              <ConnectButton />
            </div>
            
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
                  <ImageIcon className="h-5 w-5" />
                  Create Content
                </CardTitle>
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

                {/* Payment Options - New Credit System */}
                <div className="space-y-4">
                  {/* Free Generation - Always available */}
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

                  {/* Model Selection for Premium Generation */}
                  {userCredits > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-300">🎨 Select Model</div>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {MODEL_COSTS.filter(model => model.type === generationType && model.quality !== 'free').map(model => {
                          const isAffordable = userCredits >= model.credits
                          return (
                            <option key={model.model} value={model.model} disabled={!isAffordable}>
                              {model.description} - {model.credits} credits {!isAffordable ? '(insufficient credits)' : ''}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  )}

                  {/* Credit Balance Display */}
                  <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-300">Your Credits</span>
                      </div>
                      <div className="text-lg font-bold text-yellow-400">{userCredits}</div>
                    </div>
                    {userCredits > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.floor(userCredits / (getModelCost(selectedModel)?.credits || 15))} generations available with selected model
                      </div>
                    )}
                  </div>

                  {/* Use Credits Button */}
                  {userCredits > 0 ? (
                    <Button
                      onClick={handleUseCredits}
                      disabled={isGenerating || !prompt.trim()}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Generate with Credits ({getModelCost(selectedModel)?.credits || 15} credits)
                    </Button>
                  ) : (
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <CreditCard className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400 mb-3">No credits available. Purchase credits to generate premium content.</p>
                      <Button
                        onClick={() => setShowCreditPurchase(true)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Buy Credit Packages
                      </Button>
                    </div>
                  )}

                  {/* Paid Options */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-300">💎 Premium Generation</div>
                    
                    {/* Universal tokens (available on both networks) - PRIMARY */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={mintAsNFT ? handlePayWithUSDCAndMintNFT : handlePayWithUSDC}
                        disabled={isGenerating || !prompt.trim() || !isValidConfig}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 flex flex-col items-center py-3 h-auto border-2 border-blue-400/30"
                      >
                        <div className="flex items-center gap-1">
                          <span className="font-medium">💎 USDC</span>
                          {mintAsNFT && <Palette className="h-3 w-3" />}
                        </div>
                        <span className="text-xs opacity-80">
                          {networkConfig?.paymentAmounts.USDC_AMOUNT ? 
                            `${formatUnits(networkConfig.paymentAmounts.USDC_AMOUNT + (mintAsNFT ? parseUnits('0.5', 6) : BigInt(0)), 6)} USDC` : 
                            mintAsNFT ? '1.50 USDC' : '1.00 USDC'
                          }
                        </span>
                        {mintAsNFT && (
                          <span className="text-xs opacity-60">+ NFT Mint</span>
                        )}
                      </Button>

                      <Button
                        onClick={mintAsNFT ? handlePayWithSTokenAndMintNFT : handlePayWithSToken}
                        disabled={isGenerating || !prompt.trim() || !isValidConfig}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 flex flex-col items-center py-3 h-auto border-2 border-orange-400/30"
                      >
                        <div className="flex items-center gap-1">
                          <span className="font-medium">🔥 wS Token</span>
                          {mintAsNFT && <Palette className="h-3 w-3" />}
                        </div>
                        <span className="text-xs opacity-80">
                          {networkConfig?.paymentAmounts.S_TOKEN_AMOUNT ? 
                            `${formatUnits(networkConfig.paymentAmounts.S_TOKEN_AMOUNT + (mintAsNFT ? parseUnits('1.5', 18) : BigInt(0)), 18)} wS` : 
                            mintAsNFT ? `${isTestnet(chainId || 0) ? '4.50' : '2.50'} wS` : `${isTestnet(chainId || 0) ? '3.00' : '1.00'} wS`
                          }
                        </span>
                        {mintAsNFT && (
                          <span className="text-xs opacity-60">+ NFT Mint</span>
                        )}
                      </Button>
                    </div>

                    {/* Testnet-only tokens - SECONDARY */}
                    {isTestnet(chainId || 0) && (
                      <>
                        <div className="text-xs text-gray-500 mt-4 mb-2 flex items-center gap-2">
                          <span>🧪 Testnet Tokens</span>
                          <div className="flex-1 h-px bg-gray-700"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={mintAsNFT ? handlePayWithSSSttAndMintNFT : handlePayWithSSStt}
                            disabled={isGenerating || !prompt.trim() || !isValidConfig}
                            className="bg-gradient-to-r from-purple-500/70 to-pink-500/70 hover:from-purple-600/70 hover:to-pink-600/70 flex flex-col items-center py-2 h-auto text-sm"
                            size="sm"
                          >
                            <div className="flex items-center gap-1">
                              <span className="font-medium">SSStt</span>
                              {mintAsNFT && <Palette className="h-3 w-3" />}
                            </div>
                            <span className="text-xs opacity-80">
                              {networkConfig?.paymentAmounts.SSSTT_AMOUNT ? 
                                `${formatUnits(networkConfig.paymentAmounts.SSSTT_AMOUNT + (mintAsNFT ? parseUnits('0.5', 18) : BigInt(0)), 18)} SSStt` : 
                                mintAsNFT ? '1.50 SSStt' : '1.00 SSStt'
                              }
                            </span>
                            {mintAsNFT && (
                              <span className="text-xs opacity-60">+ NFT Mint</span>
                            )}
                          </Button>

                          <Button
                            onClick={handlePayWithCORAL}
                            disabled={isGenerating || !prompt.trim() || !isValidConfig}
                            className="bg-gradient-to-r from-teal-500/70 to-green-500/70 hover:from-teal-600/70 hover:to-green-600/70 flex flex-col items-center py-2 h-auto text-sm"
                            size="sm"
                          >
                            <span className="font-medium">CORAL</span>
                            <span className="text-xs opacity-80">
                              {networkConfig?.paymentAmounts.CORAL_AMOUNT ? 
                                `${formatUnits(networkConfig.paymentAmounts.CORAL_AMOUNT, 18)} CORAL` : 
                                '1.00 CORAL'
                              }
                            </span>
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Add Tokens Helper */}
                <div className="pt-4 border-t border-gray-700">
                  <AddTokensButton />
                </div>

                {/* Balance Display */}
                <div className="pt-4 border-t border-gray-700">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 font-medium">Token Balances</span>
                      <span className="text-xs text-gray-500">
                        {isCurrentNetworkSupported ? 
                          (isTestnet(chainId || 0) ? 'Sonic Testnet' : 'Sonic Mainnet') : 
                          'Unsupported Network'
                        }
                      </span>
                    </div>

                    {/* Dev Wallet Setup Helper - Only show in development mode */}
                    {DEV_MODE && !isDevWallet(address) && (
                      <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-yellow-300 font-medium">🛠️ Dev Setup</p>
                            <p className="text-xs text-yellow-400/80">Configure this wallet as dev wallet</p>
                          </div>
                          <Button
                            onClick={handleWalletIdentification}
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 h-auto border-yellow-600/50 text-yellow-300 hover:bg-yellow-900/30"
                          >
                            Get Address
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Dev Wallet Status - Show when configured */}
                    {DEV_MODE && isDevWallet(address) && (
                      <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-green-300">🛠️ Dev Mode Active</span>
                          <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                            Premium Access
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Contract Diagnostic - Show in development mode */}
                    {DEV_MODE && prompt.trim() && (
                      <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-red-300 font-medium">🔧 Contract Debug</p>
                            <p className="text-xs text-red-400/80">Test payment contract functions</p>
                          </div>
                          <Button
                            onClick={handleContractDiagnostic}
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 h-auto border-red-600/50 text-red-300 hover:bg-red-900/30"
                          >
                            Diagnose
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Testnet-only balances */}
                    {isTestnet(chainId || 0) && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">SSStt Balance:</span>
                          <span className="text-purple-400">
                            {sssttLoading ? 'Loading...' : 
                             sssttError ? 'Error' :
                             sssttBalance ? `${formatUnits(sssttBalance.value, sssttBalance.decimals)} SSStt` : '0 SSStt'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">CORAL Balance:</span>
                          <span className="text-teal-400">
                            {coralLoading ? 'Loading...' : 
                             coralError ? 'Error' :
                             coralBalance ? `${formatUnits(coralBalance.value, coralBalance.decimals)} CORAL` : '0 CORAL'}
                          </span>
                        </div>
                      </>
                    )}
                    
                    {/* Universal balances */}
                    <div className="flex justify-between">
                      <span className="text-gray-400">USDC Balance:</span>
                      <span className="text-blue-400">
                        {usdcBalance ? `${formatUnits(usdcBalance.value, usdcBalance.decimals)} USDC` : '0 USDC'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">wS Balance:</span>
                      <span className="text-orange-400">
                        {sTokenBalance ? `${formatUnits(sTokenBalance.value, sTokenBalance.decimals)} wS` : '0 wS'}
                      </span>
                    </div>
                    
                    {!isCurrentNetworkSupported && (
                      <div className="text-center pt-2">
                        <span className="text-xs text-red-400">Please switch to a supported Sonic network</span>
                      </div>
                    )}
                    
                    {isCurrentNetworkSupported && !isValidConfig && (
                      <div className="text-center pt-2">
                        <span className="text-xs text-yellow-400">
                          {isMainnet(chainId || 0) && !isMainnetContractsDeployed() 
                            ? 'Mainnet contracts not deployed. Use testnet for payments.' 
                            : 'Network configuration issue'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Your Generations */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Your Generations</CardTitle>
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
                            <Badge variant={gen.paymentMethod === 'free' ? 'secondary' : 'default'} className="text-xs">
                              {gen.paymentMethod === 'free' ? 'FREE' : 
                               gen.paymentMethod === 'S' ? 'wS' :
                               gen.paymentMethod === 'USDC' ? 'USDC' :
                               gen.paymentMethod === 'SSSTT' ? 'SSStt' :
                               gen.paymentMethod === 'CORAL' ? 'CORAL' :
                               gen.paymentMethod}
                            </Badge>
                            {gen.transactionHash && (
                              <Badge variant="outline" className="text-xs">
                                TX
                              </Badge>
                            )}
                            {gen.nftMinted && (
                              <Badge variant="outline" className="text-xs border-purple-500 text-purple-400">
                                <Palette className="h-3 w-3 mr-1" />
                                NFT #{gen.nftTokenId || '?'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {gen.status === 'completed' && gen.result && gen.result[0] ? (
                          <div className="bg-gray-800 rounded-lg p-2">
                            {gen.type === 'image' ? (
                              <img 
                                src={gen.result[0]} 
                                alt="Generated" 
                                className="w-full rounded" 
                                onError={(e) => {
                                  console.error('Image failed to load:', gen.id, gen.result[0]?.substring(0, 100))
                                  e.target.style.display = 'none'
                                }}
                                onLoad={() => {
                                  console.log('Image loaded successfully:', gen.id)
                                }}
                              />
                            ) : (
                              <video 
                                src={gen.result[0]} 
                                controls 
                                className="w-full rounded" 
                                onError={(e) => {
                                  console.error('Video failed to load:', gen.id, gen.result[0]?.substring(0, 100))
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400">
                            {gen.status === 'processing' ? 'Generating...' : 
                             gen.status === 'failed' ? 'Generation failed' :
                             !gen.result ? 'No result data' :
                             'Unknown issue'}
                          </div>
                        )}
                        
                        {/* Download button for paid generations */}
                        {gen.transactionHash && gen.status === 'completed' && gen.result && gen.result[0] && (
                          <div className="mt-3">
                            <Button
                              onClick={() => downloadGeneration(gen)}
                              variant="outline"
                              size="sm"
                              className="w-full border-blue-600 text-blue-400 hover:bg-blue-900/20"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Premium Generation
                            </Button>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 mt-2">
                          Created: {new Date(gen.createdAt).toLocaleString()}
                          {gen.transactionHash && (
                            <span className="ml-2">TX: {gen.transactionHash.substring(0, 10)}...</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}
