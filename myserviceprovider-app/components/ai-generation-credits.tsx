"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ImageIcon, Video, Wallet, Clock, CheckCircle, Loader2, Zap, LogIn, User, ExternalLink, Trophy, Star, Coins, Download, Upload, X, Palette, CreditCard, Package, ShoppingCart } from "lucide-react"
import { useAccount, useReadContract } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { toast } from "react-hot-toast"
import NavigationMenu from "@/components/navigation-menu"
import { CreditWidget } from "@/components/credit-widget"
import { MODEL_COSTS, CREDIT_PACKAGES } from "@/lib/credit-system-config"
import { isDevWallet } from "@/lib/dev-wallet-config"

interface GenerationItem {
  id: string
  type: 'image' | 'video'
  prompt: string
  status: 'processing' | 'completed' | 'failed'
  result?: string[]
  createdAt: string
  walletAddress: string
  paymentMethod: 'credits' | 'free'
  creditsUsed: number
  nftTokenId?: number
  nftMinted?: boolean
  cloudflareUrl?: string
  nftMetadata?: {
    tokenId: number
    metadataUrl: string
    name: string
    description: string
    image: string
    attributes: any[]
  }
}

interface ModelConfig {
  id: string
  name: string
  description: string
  creditCost: number
  type: 'image' | 'video' | 'both'
  quality: 'free' | 'standard' | 'premium'
  features: string[]
}

// Use MODEL_COSTS for dynamic model selection
const AI_MODELS: ModelConfig[] = MODEL_COSTS.map((m: any) => ({
  id: m.model,
  name: m.model,
  description: m.description,
  creditCost: m.credits,
  type: m.type,
  quality: m.quality,
  features: [m.description]
}))

export function AIGenerationCredits() {
  const [generations, setGenerations] = useState<GenerationItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState('cloudflare-free')
  const [showCreditWidget, setShowCreditWidget] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [latestGeneration, setLatestGeneration] = useState<GenerationItem | null>(null)
  const [mintAsNFT, setMintAsNFT] = useState(false)
  const router = useRouter()

  // Wagmi hooks
  const { address, isConnected } = useAccount()

  // Read user credits from ERC-1155 contract
  const { data: userCreditBalance, refetch: refetchCredits } = useReadContract({
    address: process.env.NEXT_PUBLIC_SONIC_CREDIT_ERC1155_CONTRACT as `0x${string}`,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'account', type: 'address' },
          { name: 'id', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ],
    functionName: 'balanceOf',
    args: [address as `0x${string}`, BigInt(1)], // Credit token ID = 1
    query: { enabled: !!address }
  })

  const selectedModelConfig = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0]
  const userCredits = userCreditBalance ? Number(userCreditBalance) : 0
  const canGenerate = userCredits >= selectedModelConfig.creditCost || selectedModel === 'cloudflare-free'

  useEffect(() => {
    if (address) {
      fetchGenerationHistory()
    }
  }, [address])

  const fetchGenerationHistory = async () => {
    if (!address) return

    try {
      const response = await fetch(`/api/generations/history?userAddress=${address}`)
      const data = await response.json()
      
      if (data.success) {
        setGenerations(data.generations || [])
      }
    } catch (error) {
      console.error('Failed to fetch generation history:', error)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    // Check if dev wallet for free generation
    if (isDevWallet(address)) {
      toast.success('🎉 Dev wallet detected - generating for free!')
      await handleDevGeneration()
      return
    }

    // Check if it's free model
    if (selectedModel === 'cloudflare-free') {
      await handleFreeGeneration()
      return
    }

    // Check credit balance for paid models
    if (userCredits < selectedModelConfig.creditCost) {
      toast.error(`Insufficient credits! You need ${selectedModelConfig.creditCost} credits.`)
      setShowCreditWidget(true)
      return
    }

    await handleCreditGeneration()
  }

  const handleFreeGeneration = async () => {
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/generate/cloudflare-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          userAddress: address,
          model: selectedModel
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const generationId = `free_gen_${Date.now()}`
        const newGeneration: GenerationItem = {
          id: generationId,
          type: 'image',
          prompt,
          status: 'completed',
          result: [data.imageUrl],
          createdAt: new Date().toISOString(),
          walletAddress: address,
          paymentMethod: 'free',
          creditsUsed: 0,
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

  const handleCreditGeneration = async () => {
    setIsGenerating(true)
    
    try {
      // First, use credits on-chain to ensure user has sufficient balance
      const useCreditsResponse = await fetch('/api/credits/use-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          creditsToUse: selectedModelConfig.creditCost,
          purpose: `${selectedModelConfig.name} generation`,
          prompt: prompt,
          model: selectedModel,
          mintNFT: mintAsNFT
        })
      })

      const creditsData = await useCreditsResponse.json()
      if (!creditsData.success) {
        throw new Error(creditsData.error || 'Failed to use credits')
      }

      // Now generate with the specified model
      const generateResponse = await fetch('/api/generate/credit-based', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedModelConfig.type,
          prompt,
          userAddress: address,
          model: selectedModel,
          creditsUsed: selectedModelConfig.creditCost,
          transactionHash: creditsData.transactionHash,
          mintAsNFT: mintAsNFT
        })
      })

      const data = await generateResponse.json()
      
      if (data.success) {
        const generationId = creditsData.transactionHash || `credit_gen_${Date.now()}`
        
        let nftMetadata = undefined
        if (mintAsNFT && data.nftData) {
          nftMetadata = {
            tokenId: data.nftData.tokenId,
            metadataUrl: data.nftData.metadataUrl,
            name: data.nftData.name,
            description: data.nftData.description,
            image: data.nftData.image,
            attributes: data.nftData.attributes || []
          }
        }
        
        const newGeneration: GenerationItem = {
          id: generationId,
          type: selectedModelConfig.type,
          prompt,
          status: 'completed',
          result: [data.resultUrl],
          createdAt: new Date().toISOString(),
          walletAddress: address,
          paymentMethod: 'credits',
          creditsUsed: selectedModelConfig.creditCost,
          submittedToThread: false,
          cloudflareUrl: data.permanentUrl,
          nftTokenId: nftMetadata?.tokenId,
          nftMinted: !!mintAsNFT,
          nftMetadata: nftMetadata
        }
        
        setGenerations(prev => [newGeneration, ...prev])
        setLatestGeneration(newGeneration)
        setPrompt("")
        setMintAsNFT(false)
        setShowSuccessDialog(true)
        
        // Refresh credits
        refetchCredits()
        
        if (mintAsNFT && nftMetadata) {
          toast.success(`🎉 Generated and minted as NFT! Used ${selectedModelConfig.creditCost} credits.`)
        } else {
          toast.success(`🎉 Generated using ${selectedModelConfig.creditCost} credits!`)
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

  const handleDevGeneration = async () => {
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/generate/dev-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedModelConfig.type,
          prompt,
          userAddress: address,
          model: selectedModel,
          devWallet: true
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const generationId = `dev_gen_${Date.now()}`
        const newGeneration: GenerationItem = {
          id: generationId,
          type: selectedModelConfig.type,
          prompt,
          status: 'completed',
          result: [data.resultUrl],
          createdAt: new Date().toISOString(),
          walletAddress: address,
          paymentMethod: 'free',
          creditsUsed: 0,
          submittedToThread: false,
          cloudflareUrl: data.permanentUrl
        }
        
        setGenerations(prev => [newGeneration, ...prev])
        setLatestGeneration(newGeneration)
        setPrompt("")
        setShowSuccessDialog(true)
        
        toast.success('🎉 Dev generation completed!')
      } else {
        throw new Error(data.error || 'Generation failed')
      }
    } catch (error: any) {
      console.error('Dev generation failed:', error)
      toast.error(`Generation failed: ${error?.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
        <NavigationMenu />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="bg-gray-800/50 border-gray-700 max-w-md w-full">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  AI Generation Studio
                </CardTitle>
                <p className="text-gray-400 mb-4">Connect your wallet to start creating</p>
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <NavigationMenu />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                AI Generation Studio
              </h1>
              <p className="text-gray-400 mt-2">Create images and videos using AI • Credit-based system</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-gray-800/50 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm text-gray-400">Credits:</span>
                  <span className="font-bold text-yellow-400">{userCredits}</span>
                </div>
              </div>
              
              <Button
                onClick={() => setShowCreditWidget(true)}
                variant="outline"
                className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy Credits
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Generation Panel */}
          <Card className="bg-gray-800/50 border-gray-700 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-400" />
                Create New Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Selection */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-3 block">
                  Select AI Model
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`
                        text-left p-4 rounded-lg border transition-all
                        ${selectedModel === model.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{model.name}</div>
                        <div className="flex items-center gap-2">
                          {model.creditCost > 0 ? (
                            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                              {model.creditCost} credit{model.creditCost > 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-400 border-green-400">
                              Free
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 mb-2">{model.description}</div>
                      <div className="flex gap-1 flex-wrap">
                        {model.features.slice(0, 2).map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Input */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Describe what you want to create
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A futuristic cityscape with flying cars, neon lights, cyberpunk style..."
                  className="bg-gray-700/30 border-gray-600 text-white placeholder-gray-400 min-h-[120px]"
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">{prompt.length}/500 characters</div>
              </div>

              {/* NFT Minting Option */}
              {selectedModel !== 'cloudflare-free' && (
                <div className="flex items-center gap-3 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <input
                    type="checkbox"
                    id="mintNFT"
                    checked={mintAsNFT}
                    onChange={(e) => setMintAsNFT(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="mintNFT" className="font-medium text-blue-300 cursor-pointer">
                      Mint as NFT (+1 credit)
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
                      Your creation will be minted as an NFT with metadata stored on-chain
                    </p>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <div className="space-y-3">
                {!canGenerate && selectedModel !== 'cloudflare-free' && (
                  <div className="text-center p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                    <p className="text-orange-300 text-sm">
                      ⚠️ You need {selectedModelConfig.creditCost} credits to use this model
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim() || (!canGenerate && selectedModel !== 'cloudflare-free')}
                  className={`
                    w-full py-6 text-lg font-medium
                    ${selectedModel === 'cloudflare-free'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    }
                  `}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      {selectedModelConfig.type === 'video' ? (
                        <Video className="h-5 w-5 mr-2" />
                      ) : (
                        <ImageIcon className="h-5 w-5 mr-2" />
                      )}
                      Generate {selectedModelConfig.type}
                      {selectedModel === 'cloudflare-free' ? ' (Free)' : ` (${selectedModelConfig.creditCost + (mintAsNFT ? 1 : 0)} credit${selectedModelConfig.creditCost + (mintAsNFT ? 1 : 0) > 1 ? 's' : ''})`}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generation History */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-400" />
                Recent Generations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generations.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p>No generations yet</p>
                  <p className="text-sm">Your creations will appear here</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {generations.map((generation) => (
                    <div key={generation.id} className="bg-gray-700/30 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <Badge
                              variant="outline"
                              className={
                                generation.paymentMethod === 'free'
                                  ? 'text-green-400 border-green-400'
                                  : 'text-blue-400 border-blue-400'
                              }
                            >
                              {generation.paymentMethod === 'free' ? 'Free' : `${generation.creditsUsed} credits`}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(generation.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                            {generation.prompt}
                          </p>
                          
                          {generation.nftMinted && (
                            <Badge variant="outline" className="text-purple-400 border-purple-400 text-xs">
                              NFT #{generation.nftTokenId}
                            </Badge>
                          )}
                        </div>
                        
                        {generation.result?.[0] && (
                          <div className="flex-shrink-0">
                            <img
                              src={generation.result[0]}
                              alt="Generated"
                              className="w-16 h-16 rounded object-cover cursor-pointer"
                              onClick={() => window.open(generation.result?.[0], '_blank')}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadImage(generation.result?.[0] || '', `generation-${generation.id}.png`)}
                              className="w-full mt-1 text-xs"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Credit Purchase Dialog */}
      <Dialog open={showCreditWidget} onOpenChange={setShowCreditWidget}>
        <DialogContent className="max-w-4xl bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Purchase Credits</DialogTitle>
            <DialogDescription className="text-gray-400">
              Buy credits to use premium AI models and mint NFTs
            </DialogDescription>
          </DialogHeader>
          <CreditWidget />
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-white flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-400" />
              Generation Complete!
            </DialogTitle>
          </DialogHeader>
          {latestGeneration && (
            <div className="space-y-4">
              <div className="text-gray-300">
                <p className="mb-2">"{latestGeneration.prompt}"</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    {latestGeneration.paymentMethod === 'free' ? 'Free' : `${latestGeneration.creditsUsed} credits`}
                  </Badge>
                  {latestGeneration.nftMinted && (
                    <Badge variant="outline" className="text-purple-400 border-purple-400">
                      NFT Minted
                    </Badge>
                  )}
                </div>
              </div>
              
              {latestGeneration.result?.[0] && (
                <div className="text-center">
                  <img
                    src={latestGeneration.result[0]}
                    alt="Generated result"
                    className="max-w-full max-h-96 mx-auto rounded-lg"
                  />
                  <div className="flex gap-2 justify-center mt-4">
                    <Button
                      onClick={() => downloadImage(latestGeneration.result?.[0] || '', `generation-${latestGeneration.id}.png`)}
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={() => window.open(latestGeneration.result?.[0], '_blank')}
                      variant="outline"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Size
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}