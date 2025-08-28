"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageIcon, Video, Wallet, Clock, CheckCircle, Loader2, Zap, Package, Coins, Download, Upload, X, Palette, CreditCard, Star, Trophy } from "lucide-react"
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { toast } from "react-hot-toast"
import NavigationMenu from "@/components/navigation-menu"

// Types
interface CreditPackage {
  id: number;
  name: string;
  credits: number;
  usdcPrice: number;
  wsPrice: number;
  sssttPrice: number;
  benefits: string[];
}

interface GenerationItem {
  id: string;
  type: 'image' | 'video';
  prompt: string;
  status: 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  isInfluenced: boolean;
  influencedCollection?: string;
  creditsUsed: number;
  timestamp: Date;
  isNFT: boolean;
}

interface UserCredits {
  standardCredits: number;
  nftCredits: Array<{ packageId: number; balance: number; creditAmount: number }>;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 1,
    name: "Starter Pack",
    credits: 1000, // wS bonus credits (750 USDC + 33% bonus)
    usdcPrice: 5,
    wsPrice: 15,
    sssttPrice: 5,
    benefits: ["Collection Influence", "NFT Minting", "Priority Support", "33% wS Bonus"]
  },
  {
    id: 2,
    name: "Pro Pack", 
    credits: 10000, // wS bonus credits (8000 USDC + 25% bonus)
    usdcPrice: 50,
    wsPrice: 150,
    sssttPrice: 50,
    benefits: ["Collection Influence", "NFT Minting", "Priority Support", "Exclusive Models", "25% wS Bonus"]
  },
  {
    id: 3,
    name: "Business Pack",
    credits: 115000, // wS bonus credits (100000 USDC + 15% bonus)
    usdcPrice: 500,
    wsPrice: 1500,
    sssttPrice: 500,
    benefits: ["Collection Influence", "NFT Minting", "Priority Support", "Exclusive Models", "API Access", "15% wS Bonus"]
  },
  {
    id: 4,
    name: "Enterprise Pack",
    credits: 290000, // wS bonus credits (260000 USDC + 11.5% bonus)
    usdcPrice: 1250,
    wsPrice: 3750,
    sssttPrice: 1250,
    benefits: ["All Features", "Custom Models", "Dedicated Support", "White Label", "11.5% wS Bonus"]
  }
];

const SUPPORTED_COLLECTIONS = [
  { keyword: "derp", name: "Derps Collection", description: "Meme-style derpy characters" },
  { keyword: "kidz", name: "Bandit Kidz", description: "Cute bandit-themed kids" },
  { keyword: "bandit", name: "Bandit Kidz", description: "Playful bandit characters" }
];

export default function HybridAIGeneration() {
  // State
  const [prompt, setPrompt] = useState("")
  const [generationType, setGenerationType] = useState<'image' | 'video'>('image')
  const [creditType, setCreditType] = useState<'standard' | 'nft'>('standard')
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null)
  const [generations, setGenerations] = useState<GenerationItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [userCredits, setUserCredits] = useState<UserCredits>({ standardCredits: 0, nftCredits: [] })
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [detectedCollections, setDetectedCollections] = useState<string[]>([])
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [selectedPaymentToken, setSelectedPaymentToken] = useState<'usdc' | 'ws' | 'ssstt'>('usdc')

  const { address, isConnected } = useAccount()

  // Real-time collection detection
  useEffect(() => {
    if (creditType === 'nft') {
      const detected = SUPPORTED_COLLECTIONS
        .filter(col => prompt.toLowerCase().includes(col.keyword.toLowerCase()))
        .map(col => col.keyword);
      setDetectedCollections(detected);
    } else {
      setDetectedCollections([]);
    }
  }, [prompt, creditType]);

  // Load user credits
  const loadUserCredits = useCallback(async () => {
    if (!address) return;
    
    try {
      // Load from your API
      const response = await fetch(`/api/user-credits?address=${address}`);
      const credits = await response.json();
      setUserCredits(credits);
    } catch (error) {
      console.error('Failed to load credits:', error);
    }
  }, [address]);

  useEffect(() => {
    loadUserCredits();
  }, [loadUserCredits]);

  // Purchase credit package
  const handlePurchasePackage = async (packageId: number, paymentToken: string) => {
    if (!address) return;

    try {
      setIsGenerating(true);
      
      // Call your contract purchase function
      const response = await fetch('/api/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          packageId,
          paymentToken
        })
      });

      if (response.ok) {
        toast.success('Credit package purchased successfully!');
        setShowPurchaseDialog(false);
        await loadUserCredits();
      } else {
        throw new Error('Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to purchase credits');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate content
  const handleGenerate = async () => {
    if (!prompt.trim() || !isConnected) return;

    // Check credit requirements
    if (creditType === 'nft') {
      if (!selectedPackage || userCredits.nftCredits.find(c => c.packageId === selectedPackage)?.balance === 0) {
        toast.error('Please select a valid NFT credit package');
        return;
      }
    } else {
      const requiredCredits = generationType === 'image' ? 100 : 200;
      if (userCredits.standardCredits < requiredCredits) {
        toast.error('Insufficient standard credits');
        return;
      }
    }

    try {
      setIsGenerating(true);

      const generationRequest = {
        prompt,
        type: generationType,
        user: address,
        creditType,
        packageId: creditType === 'nft' ? selectedPackage : undefined,
        uploadedImage: uploadedImage || undefined
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generationRequest)
      });

      const result = await response.json();

      if (response.ok) {
        const newGeneration: GenerationItem = {
          id: result.generationId,
          type: generationType,
          prompt,
          status: 'processing',
          resultUrl: result.resultUrl,
          isInfluenced: result.isInfluenced,
          influencedCollection: result.influencedCollection,
          creditsUsed: result.creditsUsed,
          timestamp: new Date(),
          isNFT: creditType === 'nft'
        };

        setGenerations(prev => [newGeneration, ...prev]);
        toast.success(`${generationType} generation started!`);
        setPrompt('');
        setUploadedImage(null);
        await loadUserCredits();
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result.split(',')[1]); // Remove data:image/png;base64, prefix
      };
      reader.readAsDataURL(file);
    }
  };

  // Save generation
  const handleSaveGeneration = async (generationId: string) => {
    try {
      const response = await fetch('/api/save-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId, userAddress: address })
      });

      if (response.ok) {
        toast.success('Generation saved to your collection!');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save generation');
    }
  };

  // Mint NFT (for NFT credit users)
  const handleMintNFT = async (generationId: string) => {
    try {
      const response = await fetch('/api/mint-generation-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId, userAddress: address })
      });

      if (response.ok) {
        toast.success('Generation minted as NFT!');
      } else {
        throw new Error('Minting failed');
      }
    } catch (error) {
      console.error('Minting error:', error);
      toast.error('Failed to mint NFT');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <NavigationMenu />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6 text-center">
              <Wallet className="mx-auto h-12 w-12 text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-4">Connect Wallet</h2>
              <p className="text-gray-300 mb-6">Connect your wallet to start generating AI content</p>
              <ConnectButton />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <NavigationMenu />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Generation Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  AI Content Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Credit Type Selection */}
                <Tabs value={creditType} onValueChange={(value) => setCreditType(value as 'standard' | 'nft')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="standard" className="flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      Standard Credits
                    </TabsTrigger>
                    <TabsTrigger value="nft" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      NFT Credits
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="standard" className="space-y-4">
                    <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
                      <h3 className="font-medium text-white mb-2">Standard Mode</h3>
                      <p className="text-gray-300 text-sm">
                        Simple credit-based generation. Your images and videos are influenced only by your prompt and uploaded image.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Coins className="h-4 w-4 text-yellow-400" />
                        <span className="text-white">Available: {userCredits.standardCredits} credits</span>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="nft" className="space-y-4">
                    <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-400/30">
                      <h3 className="font-medium text-white mb-2">NFT Credit Mode</h3>
                      <p className="text-gray-300 text-sm">
                        Collection-influenced generation. Your content gets enhanced with Sonic NFT collection styles when keywords are detected.
                      </p>
                      
                      {detectedCollections.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Palette className="h-4 w-4 text-pink-400" />
                            <span className="text-sm font-medium text-white">Detected Collections:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {detectedCollections.map(collection => {
                              const info = SUPPORTED_COLLECTIONS.find(c => c.keyword === collection);
                              return (
                                <Badge key={collection} variant="secondary" className="bg-pink-500/20 text-pink-300 border-pink-400/30">
                                  <Star className="h-3 w-3 mr-1" />
                                  {info?.name || collection}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Package Selection */}
                      <div className="mt-4">
                        <Select value={selectedPackage?.toString()} onValueChange={(value) => setSelectedPackage(parseInt(value))}>
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue placeholder="Select NFT Credit Package" />
                          </SelectTrigger>
                          <SelectContent>
                            {userCredits.nftCredits.map(credit => {
                              const pkg = CREDIT_PACKAGES.find(p => p.id === credit.packageId);
                              return (
                                <SelectItem key={credit.packageId} value={credit.packageId.toString()}>
                                  {pkg?.name} ({credit.balance} available)
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {userCredits.nftCredits.length === 0 && (
                        <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
                          <DialogTrigger asChild>
                            <Button className="w-full mt-2" variant="outline">
                              <Package className="h-4 w-4 mr-2" />
                              Purchase NFT Credits
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-900 border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-white">Purchase NFT Credit Package</DialogTitle>
                              <DialogDescription className="text-gray-300">
                                Choose a package to unlock collection-influenced generations
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              {CREDIT_PACKAGES.map(pkg => (
                                <Card key={pkg.id} className="bg-white/5 border-white/20 p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h3 className="font-medium text-white">{pkg.name}</h3>
                                      <p className="text-gray-400 text-sm">{pkg.credits.toLocaleString()} credits</p>
                                    </div>
                                    <Badge className="bg-purple-500/20 text-purple-300">
                                      {pkg.usdcPrice} USDC
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {pkg.benefits.map(benefit => (
                                      <Badge key={benefit} variant="secondary" className="text-xs">
                                        {benefit}
                                      </Badge>
                                    ))}
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handlePurchasePackage(pkg.id, 'usdc')}
                                      disabled={isGenerating}
                                    >
                                      {pkg.usdcPrice} USDC
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePurchasePackage(pkg.id, 'ws')}
                                      disabled={isGenerating}
                                    >
                                      {pkg.wsPrice} wS
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePurchasePackage(pkg.id, 'ssstt')}
                                      disabled={isGenerating}
                                    >
                                      {pkg.sssttPrice} SSStt
                                    </Button>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Generation Type */}
                <div className="flex gap-4">
                  <Button
                    variant={generationType === 'image' ? 'default' : 'outline'}
                    onClick={() => setGenerationType('image')}
                    className="flex-1"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Image ({creditType === 'nft' && detectedCollections.length > 0 ? 150 : 100} credits)
                  </Button>
                  <Button
                    variant={generationType === 'video' ? 'default' : 'outline'}
                    onClick={() => setGenerationType('video')}
                    className="flex-1"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Video ({creditType === 'nft' && detectedCollections.length > 0 ? 250 : 200} credits)
                  </Button>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Upload Image (optional)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex items-center justify-center w-full p-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors"
                    >
                      {uploadedImage ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <span className="text-white">Image uploaded</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.preventDefault();
                              setUploadedImage(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Upload className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-400">Click to upload image</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Prompt */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Describe what you want to generate
                  </label>
                  <Textarea
                    placeholder={creditType === 'nft' 
                      ? "Try including 'derp' or 'kidz' to activate collection influence..." 
                      : "Describe your image or video..."}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px] bg-white/5 border-white/20 text-white placeholder:text-gray-400 resize-none"
                  />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating || (creditType === 'nft' && !selectedPackage)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate {generationType === 'image' ? 'Image' : 'Video'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Credit Balance */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-sm">Credit Balance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Standard</span>
                  <Badge variant="secondary">{userCredits.standardCredits}</Badge>
                </div>
                {userCredits.nftCredits.map(credit => {
                  const pkg = CREDIT_PACKAGES.find(p => p.id === credit.packageId);
                  return (
                    <div key={credit.packageId} className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">{pkg?.name}</span>
                      <Badge className="bg-purple-500/20 text-purple-300">{credit.balance}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Supported Collections */}
            {creditType === 'nft' && (
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Supported Collections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {SUPPORTED_COLLECTIONS.map(collection => (
                    <div key={collection.keyword} className="p-2 bg-white/5 rounded border border-white/10">
                      <div className="font-medium text-white text-sm">{collection.name}</div>
                      <div className="text-xs text-gray-400">{collection.description}</div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        "{collection.keyword}"
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Generation History */}
        {generations.length > 0 && (
          <Card className="mt-8 bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Generations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generations.map(generation => (
                  <Card key={generation.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={generation.isNFT ? "default" : "secondary"}>
                          {generation.isNFT ? 'NFT' : 'Standard'}
                        </Badge>
                        <Badge variant="outline">
                          {generation.type === 'image' ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                        </Badge>
                      </div>
                      
                      <p className="text-white text-sm line-clamp-2">{generation.prompt}</p>
                      
                      {generation.isInfluenced && generation.influencedCollection && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400" />
                          <span className="text-xs text-yellow-300">
                            {SUPPORTED_COLLECTIONS.find(c => c.keyword === generation.influencedCollection)?.name}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                          {generation.creditsUsed} credits
                        </span>
                        {generation.status === 'completed' && generation.resultUrl && (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => handleSaveGeneration(generation.id)}>
                              <Download className="h-3 w-3" />
                            </Button>
                            {generation.isNFT && (
                              <Button size="sm" variant="outline" onClick={() => handleMintNFT(generation.id)}>
                                <Trophy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}