import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { requireAuth, WalletAuthRequest, WalletAuthAPIMiddleware } from '../../../../lib/wallet-auth-api-middleware'

interface INFTGenerateRequest {
  packageTokenId: string
  prompt: string
  isVideo: boolean
  influencedCollection?: string
  preferredModel?: string // "openai" | "cloudflare" | "gemini"
  userAddress: string
}

// Contract addresses
const INFT_PACKAGES_CONTRACT = process.env.NEXT_PUBLIC_INFT_PACKAGES_CONTRACT
const GENERATED_NFT_CONTRACT = process.env.NEXT_PUBLIC_GENERATED_NFT_CONTRACT
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.soniclabs.com'

// INFT Packages ABI for generation
const INFT_PACKAGES_ABI = [
  {
    "inputs": [
      {"name": "packageTokenId", "type": "uint256"},
      {"name": "prompt", "type": "string"},
      {"name": "isVideo", "type": "bool"},
      {"name": "influencedCollection", "type": "string"}
    ],
    "name": "generateContent",
    "outputs": [{"name": "generatedTokenId", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "getPackageInfo",
    "outputs": [
      {"name": "packageType", "type": "uint256"},
      {"name": "totalCredits", "type": "uint256"},
      {"name": "usedCredits", "type": "uint256"},
      {"name": "remainingCredits", "type": "uint256"},
      {"name": "agentMetadata", "type": "string"},
      {"name": "collectionInfluences", "type": "string[]"},
      {"name": "generatedTokenIds", "type": "uint256[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

// Generated NFT ABI for metadata updates
const GENERATED_NFT_ABI = [
  {
    "inputs": [
      {"name": "tokenId", "type": "uint256"},
      {"name": "newIpfsHash", "type": "string"}
    ],
    "name": "updateIPFSHash",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "getGenerationInfo",
    "outputs": [
      {"name": "prompt", "type": "string"},
      {"name": "ipfsHash", "type": "string"},
      {"name": "influencedCollection", "type": "string"},
      {"name": "creator", "type": "address"},
      {"name": "packageTokenId", "type": "uint256"},
      {"name": "timestamp", "type": "uint256"},
      {"name": "isVideo", "type": "bool"},
      {"name": "aiModel", "type": "string"},
      {"name": "generationCost", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

// Multi-provider generation service
async function generateWithProvider(
  prompt: string,
  isVideo: boolean,
  preferredModel: string,
  packageType: number,
  collectionInfluence?: string
): Promise<{ ipfsHash: string; aiModel: string; metadata: any }> {
  
  // Determine the best AI provider based on package type and preference
  let provider: string
  let model: string

  if (packageType === 1) {
    // Starter: Basic models
    provider = preferredModel === "gemini" ? "gemini" : 
               preferredModel === "cloudflare" ? "cloudflare" : "openai"
    model = isVideo ? "stable-video" : "dall-e-3"
  } else if (packageType === 2) {
    // Pro: Advanced models
    provider = preferredModel || (isVideo ? "openai" : "gemini")
    model = isVideo ? "gpt-5-video" : "gpt-5"
  } else if (packageType >= 3) {
    // Business/Enterprise: Multi-cloud with failover
    provider = preferredModel || "openai"
    model = isVideo ? "enterprise-video" : "gpt-5"
  }

  // Enhanced prompt with collection influence
  let enhancedPrompt = prompt
  if (collectionInfluence) {
    switch (collectionInfluence.toLowerCase()) {
      case "bandit":
      case "bandits":
        enhancedPrompt += " in a street art, rebellious, urban style"
        break
      case "kidz":
        enhancedPrompt += " in a playful, colorful, kid-friendly style"
        break
      case "derp":
        enhancedPrompt += " in a cartoon, playful, humorous style"
        break
      case "sonic":
        enhancedPrompt += " in a futuristic, tech-inspired, speed-focused style"
        break
    }
  }

  try {
    // Call the appropriate generation service
    let generationResult: any

    switch (provider) {
      case "openai":
        generationResult = await callOpenAIService(enhancedPrompt, isVideo, model)
        break
      case "cloudflare":
        generationResult = await callCloudflareService(enhancedPrompt, isVideo, model)
        break
      case "gemini":
        generationResult = await callGeminiService(enhancedPrompt, isVideo, model)
        break
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }

    return {
      ipfsHash: generationResult.ipfsHash,
      aiModel: `${provider.toUpperCase()} ${model}`,
      metadata: generationResult.metadata
    }

  } catch (error) {
    console.error(`Generation failed with ${provider}, trying fallback...`)
    
    // Implement failover logic for Business/Enterprise packages
    if (packageType >= 3) {
      const fallbackProviders = ["openai", "cloudflare", "gemini"].filter(p => p !== provider)
      
      for (const fallbackProvider of fallbackProviders) {
        try {
          let fallbackResult: any
          
          switch (fallbackProvider) {
            case "openai":
              fallbackResult = await callOpenAIService(enhancedPrompt, isVideo, "gpt-4.1")
              break
            case "cloudflare":
              fallbackResult = await callCloudflareService(enhancedPrompt, isVideo, "stable-diffusion")
              break
            case "gemini":
              fallbackResult = await callGeminiService(enhancedPrompt, isVideo, "gemini-pro")
              break
          }

          return {
            ipfsHash: fallbackResult.ipfsHash,
            aiModel: `${fallbackProvider.toUpperCase()} (fallback)`,
            metadata: fallbackResult.metadata
          }
        } catch (fallbackError) {
          console.error(`Fallback ${fallbackProvider} also failed:`, fallbackError)
        }
      }
    }
    
    throw error
  }
}

async function callOpenAIService(prompt: string, isVideo: boolean, model: string) {
  const response = await fetch('/api/generate/openai-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, isVideo, model })
  })
  
  if (!response.ok) {
    throw new Error(`OpenAI service failed: ${response.statusText}`)
  }
  
  return await response.json()
}

async function callCloudflareService(prompt: string, isVideo: boolean, model: string) {
  const response = await fetch('/api/generate/cloudflare-free', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, isVideo, model })
  })
  
  if (!response.ok) {
    throw new Error(`Cloudflare service failed: ${response.statusText}`)
  }
  
  return await response.json()
}

async function callGeminiService(prompt: string, isVideo: boolean, model: string) {
  // This would call your Gemini integration
  const response = await fetch('/api/generate/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, isVideo, model })
  })
  
  if (!response.ok) {
    throw new Error(`Gemini service failed: ${response.statusText}`)
  }
  
  return await response.json()
}

// Apply wallet authentication middleware
const authenticatedPOST = requireAuth({
  requiredPermissions: ['generate_content'],
  requireOwnership: true,
  rateLimitPerMinute: 30
})(async (request: WalletAuthRequest) => {
  try {
    const body: INFTGenerateRequest = await request.json()
    
    // Validate required fields
    if (!body.packageTokenId || !body.prompt || !body.userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the authenticated wallet matches the request
    if (request.walletAuth?.walletAddress.toLowerCase() !== body.userAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Wallet address mismatch' },
        { status: 403 }
      )
    }

    if (!INFT_PACKAGES_CONTRACT || !GENERATED_NFT_CONTRACT) {
      return NextResponse.json(
        { error: 'Contract addresses not configured' },
        { status: 500 }
      )
    }

    // Set up provider and contracts
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const privateKey = process.env.MINTER_PRIVATE_KEY
    
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing minter private key' },
        { status: 500 }
      )
    }

    const signer = new ethers.Wallet(privateKey, provider)
    const inftContract = new ethers.Contract(INFT_PACKAGES_CONTRACT, INFT_PACKAGES_ABI, signer)
    const generatedNFTContract = new ethers.Contract(GENERATED_NFT_CONTRACT, GENERATED_NFT_ABI, signer)

    try {
      // Get package information
      const packageInfo = await inftContract.getPackageInfo(body.packageTokenId)
      const [packageType, totalCredits, usedCredits, remainingCredits, agentMetadata, collectionInfluences, generatedTokenIds] = packageInfo

      // Check if package has sufficient credits
      const creditCost = body.isVideo ? 500 : 200
      if (remainingCredits < creditCost) {
        return NextResponse.json(
          { error: `Insufficient credits. Needed: ${creditCost}, Available: ${remainingCredits}` },
          { status: 400 }
        )
      }

      // Generate content using multi-provider system
      const generationResult = await generateWithProvider(
        body.prompt,
        body.isVideo,
        body.preferredModel || "openai",
        Number(packageType),
        body.influencedCollection
      )

      // Call smart contract to mint the generated content NFT
      const generateTx = await inftContract.generateContent(
        body.packageTokenId,
        body.prompt,
        body.isVideo,
        body.influencedCollection || ""
      )

      const receipt = await generateTx.wait()
      const generatedTokenId = receipt.logs[0]?.args?.generatedTokenId || 0n

      // Update the generated NFT with IPFS hash
      if (generationResult.ipfsHash) {
        await generatedNFTContract.updateIPFSHash(generatedTokenId, generationResult.ipfsHash)
      }

      // Get updated package info
      const updatedPackageInfo = await inftContract.getPackageInfo(body.packageTokenId)
      const [, , newUsedCredits, newRemainingCredits] = updatedPackageInfo

      console.log(`INFT generation successful for wallet ${request.walletAuth?.walletAddress}:`, {
        packageTokenId: body.packageTokenId,
        generatedTokenId: generatedTokenId.toString(),
        prompt: body.prompt,
        isVideo: body.isVideo,
        aiModel: generationResult.aiModel,
        creditsUsed: creditCost,
        remainingCredits: newRemainingCredits.toString(),
        txHash: generateTx.hash,
        authenticatedWallet: request.walletAuth?.walletAddress
      })

      return NextResponse.json({
        success: true,
        generatedTokenId: generatedTokenId.toString(),
        packageTokenId: body.packageTokenId,
        ipfsHash: generationResult.ipfsHash,
        aiModel: generationResult.aiModel,
        prompt: body.prompt,
        isVideo: body.isVideo,
        influencedCollection: body.influencedCollection,
        creditsUsed: creditCost,
        remainingCredits: newRemainingCredits.toString(),
        transactionHash: generateTx.hash,
        metadata: generationResult.metadata,
        message: `Successfully generated ${body.isVideo ? 'video' : 'image'} using ${generationResult.aiModel}`
      })

    } catch (contractError: any) {
      console.error('INFT Generation contract interaction failed:', contractError)
      return NextResponse.json(
        { 
          error: 'Generation failed', 
          details: contractError?.message || 'Unknown contract error'
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('INFT Generate API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
})

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  const preflightResponse = WalletAuthAPIMiddleware.handlePreflight(request)
  if (preflightResponse) {
    return preflightResponse
  }
  return new NextResponse(null, { status: 405 })
}

// Export authenticated POST handler
export async function POST(request: NextRequest) {
  return authenticatedPOST(request)
}

// Apply authentication to GET endpoint as well
const authenticatedGET = requireAuth({
  requiredPermissions: ['read_status'],
  requireOwnership: false, // Allow reading package info without ownership
  rateLimitPerMinute: 60
})(async (request: WalletAuthRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const packageTokenId = searchParams.get('packageTokenId')
    const userAddress = searchParams.get('userAddress')

    if (!packageTokenId) {
      return NextResponse.json(
        { error: 'Package token ID is required' },
        { status: 400 }
      )
    }

    // Verify the authenticated wallet matches the request if userAddress is provided
    if (userAddress && request.walletAuth?.walletAddress.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Wallet address mismatch' },
        { status: 403 }
      )
    }

    if (!INFT_PACKAGES_CONTRACT) {
      return NextResponse.json(
        { error: 'Contract not configured' },
        { status: 500 }
      )
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const inftContract = new ethers.Contract(INFT_PACKAGES_CONTRACT, INFT_PACKAGES_ABI, provider)

    // Get package information
    const packageInfo = await inftContract.getPackageInfo(packageTokenId)
    const [packageType, totalCredits, usedCredits, remainingCredits, agentMetadata, collectionInfluences, generatedTokenIds] = packageInfo

    return NextResponse.json({
      packageTokenId,
      packageType: Number(packageType),
      totalCredits: Number(totalCredits),
      usedCredits: Number(usedCredits),
      remainingCredits: Number(remainingCredits),
      agentMetadata,
      collectionInfluences,
      generatedTokenIds: generatedTokenIds.map((id: bigint) => id.toString()),
      generationCosts: {
        image: 200,
        video: 500
      }
    })

  } catch (error: any) {
    console.error('Get INFT package info error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch package information',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
})

// Export authenticated GET handler
export async function GET(request: NextRequest) {
  return authenticatedGET(request)
}