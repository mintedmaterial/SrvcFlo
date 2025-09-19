import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

interface MintINFTRequest {
  userAddress: string
  packageType: number // 1=Starter, 2=Pro, 3=Business, 4=Enterprise
  paymentMethod: 'USDC' | 'wS' | 'Native_S'
  aiModelPreferences?: string[]
  systemPrompt?: string
  collectionInfluences?: string[]
}

// Contract addresses from environment
const INFT_PACKAGES_CONTRACT = process.env.NEXT_PUBLIC_INFT_PACKAGES_CONTRACT
const PRICE_ORACLE_CONTRACT = process.env.NEXT_PUBLIC_PRICE_ORACLE_CONTRACT
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.soniclabs.com'

// INFT Packages contract ABI
const INFT_PACKAGES_ABI = [
  {
    "inputs": [{"name": "packageType", "type": "uint256"}],
    "name": "purchasePackageWithUSDC",
    "outputs": [{"name": "tokenId", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "packageType", "type": "uint256"}],
    "name": "purchasePackageWithWS",
    "outputs": [{"name": "tokenId", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "packageType", "type": "uint256"}],
    "name": "purchasePackageWithNativeS",
    "outputs": [{"name": "tokenId", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "packageType", "type": "uint256"}],
    "name": "getPackagePricing",
    "outputs": [
      {"name": "usdPrice", "type": "uint256"},
      {"name": "nativeSPrice", "type": "uint256"},
      {"name": "wsPrice", "type": "uint256"},
      {"name": "usdcPrice", "type": "uint256"}
    ],
    "stateMutability": "view",
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

// Package definitions matching smart contract
const INFT_PACKAGES = [
  {
    id: 1,
    name: "Starter AI Agent",
    basePrice: 5, // USD
    credits: 750,
    models: ["OpenAI GPT-4.1", "DALL-E-3", "Cloudflare AI", "Gemini Pro"],
    capabilities: "Creative content generation focused on images, text, and basic reasoning"
  },
  {
    id: 2,
    name: "Pro AI Agent",
    basePrice: 50, // USD
    credits: 8000,
    models: ["OpenAI (GPT-4.1, GPT-5)", "Cloudflare Workers AI", "Gemini Pro/Ultra", "Video Suite"],
    capabilities: "Advanced multi-modal generation with style awareness and multi-platform AI integration"
  },
  {
    id: 3,
    name: "Business AI Agent",
    basePrice: 500, // USD
    credits: 100000,
    models: ["Multi-Cloud Suite", "OpenAI", "Cloudflare AI", "Google Gemini Ultra", "Custom Models"],
    capabilities: "Business-focused with advanced reasoning, workflow automation, and batch processing"
  },
  {
    id: 4,
    name: "Enterprise AI Agent",
    basePrice: 1250, // USD
    credits: 260000,
    models: ["Enterprise Multi-Cloud Suite", "All providers", "Custom fine-tuned models", "API access"],
    capabilities: "Unlimited capabilities with advanced reasoning, custom model training, and enterprise features"
  }
]

export async function POST(request: NextRequest) {
  try {
    const body: MintINFTRequest = await request.json()
    
    // Validate required fields
    if (!body.userAddress || !body.packageType || !body.paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate package type
    if (body.packageType < 1 || body.packageType > 4) {
      return NextResponse.json(
        { error: 'Invalid package type. Must be 1-4' },
        { status: 400 }
      )
    }

    // Set up provider and contract
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const privateKey = process.env.MINTER_PRIVATE_KEY
    
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing minter private key' },
        { status: 500 }
      )
    }

    if (!INFT_PACKAGES_CONTRACT) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing INFT contract address' },
        { status: 500 }
      )
    }

    const signer = new ethers.Wallet(privateKey, provider)
    const inftContract = new ethers.Contract(INFT_PACKAGES_CONTRACT, INFT_PACKAGES_ABI, signer)

    try {
      // Get package info
      const packageInfo = INFT_PACKAGES.find(pkg => pkg.id === body.packageType)
      if (!packageInfo) {
        return NextResponse.json(
          { error: 'Package not found' },
          { status: 404 }
        )
      }

      // Get current pricing from contract
      const pricing = await inftContract.getPackagePricing(body.packageType)
      const [usdPrice, nativeSPrice, wsPrice, usdcPrice] = pricing

      let txHash: string
      let tokenId: bigint

      // Execute minting based on payment method
      switch (body.paymentMethod) {
        case 'USDC':
          const usdcTx = await inftContract.purchasePackageWithUSDC(body.packageType)
          txHash = usdcTx.hash
          const usdcReceipt = await usdcTx.wait()
          tokenId = usdcReceipt.logs[0]?.args?.tokenId || 0n
          break

        case 'wS':
          const wsTx = await inftContract.purchasePackageWithWS(body.packageType)
          txHash = wsTx.hash
          const wsReceipt = await wsTx.wait()
          tokenId = wsReceipt.logs[0]?.args?.tokenId || 0n
          break

        case 'Native_S':
          const nativeTx = await inftContract.purchasePackageWithNativeS(body.packageType, {
            value: nativeSPrice
          })
          txHash = nativeTx.hash
          const nativeReceipt = await nativeTx.wait()
          tokenId = nativeReceipt.logs[0]?.args?.tokenId || 0n
          break

        default:
          return NextResponse.json(
            { error: 'Invalid payment method' },
            { status: 400 }
          )
      }

      // Get the minted package details
      const packageDetails = await inftContract.getPackageInfo(tokenId)

      // Log the successful minting
      console.log(`INFT Agent minted successfully:`, {
        userAddress: body.userAddress,
        packageType: body.packageType,
        paymentMethod: body.paymentMethod,
        tokenId: tokenId.toString(),
        packageName: packageInfo.name,
        credits: packageInfo.credits,
        txHash
      })

      return NextResponse.json({
        success: true,
        tokenId: tokenId.toString(),
        packageType: body.packageType,
        packageName: packageInfo.name,
        totalCredits: packageInfo.credits,
        aiModels: packageInfo.models,
        capabilities: packageInfo.capabilities,
        transactionHash: txHash,
        pricing: {
          usd: ethers.formatUnits(usdPrice, 6),
          nativeS: ethers.formatEther(nativeSPrice),
          wS: ethers.formatEther(wsPrice),
          usdc: ethers.formatUnits(usdcPrice, 6)
        },
        message: `Successfully minted ${packageInfo.name} with ${packageInfo.credits} credits`
      })

    } catch (contractError: any) {
      console.error('INFT Contract interaction failed:', contractError)
      return NextResponse.json(
        { 
          error: 'Contract interaction failed', 
          details: contractError?.message || 'Unknown contract error'
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Mint INFT API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve package information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const packageType = searchParams.get('packageType')
    const userAddress = searchParams.get('userAddress')

    if (!INFT_PACKAGES_CONTRACT) {
      return NextResponse.json(
        { error: 'Contract not configured' },
        { status: 500 }
      )
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const inftContract = new ethers.Contract(INFT_PACKAGES_CONTRACT, INFT_PACKAGES_ABI, provider)

    if (packageType) {
      // Get pricing for specific package
      const packageNum = parseInt(packageType)
      if (packageNum < 1 || packageNum > 4) {
        return NextResponse.json(
          { error: 'Invalid package type' },
          { status: 400 }
        )
      }

      const pricing = await inftContract.getPackagePricing(packageNum)
      const [usdPrice, nativeSPrice, wsPrice, usdcPrice] = pricing
      const packageInfo = INFT_PACKAGES.find(pkg => pkg.id === packageNum)

      return NextResponse.json({
        packageType: packageNum,
        packageInfo,
        pricing: {
          usd: ethers.formatUnits(usdPrice, 6),
          nativeS: ethers.formatEther(nativeSPrice),
          wS: ethers.formatEther(wsPrice),
          usdc: ethers.formatUnits(usdcPrice, 6)
        }
      })
    }

    // Return all packages
    const allPackages = await Promise.all(
      INFT_PACKAGES.map(async (pkg) => {
        const pricing = await inftContract.getPackagePricing(pkg.id)
        const [usdPrice, nativeSPrice, wsPrice, usdcPrice] = pricing
        
        return {
          ...pkg,
          pricing: {
            usd: ethers.formatUnits(usdPrice, 6),
            nativeS: ethers.formatEther(nativeSPrice),
            wS: ethers.formatEther(wsPrice),
            usdc: ethers.formatUnits(usdcPrice, 6)
          }
        }
      })
    )

    return NextResponse.json({
      packages: allPackages
    })

  } catch (error: any) {
    console.error('Get INFT packages error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch package information',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}