import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

interface MintCreditsRequest {
  userAddress: string
  packageId: string
  paymentMethod: 'USDC' | 'wS'
  customAmount?: number
}

// Contract addresses and ABIs
const PAYMENT_SPLITTER_CONTRACT = process.env.NEXT_PUBLIC_PAYMENT_SPLITTER_CONTRACT
const CREDITS_CONTRACT = process.env.NEXT_PUBLIC_CREDITS_CONTRACT
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.soniclabs.com'

// Payment splitter ABI (simplified for processing payments)
const PAYMENT_SPLITTER_ABI = [
  {
    "inputs": [
      {"name": "token", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "recipient", "type": "address"},
      {"name": "creditAmount", "type": "uint256"}
    ],
    "name": "processPaymentAndMintCredits",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// ERC-1155 Credits contract ABI
const CREDITS_ABI = [
  {
    "inputs": [
      {"name": "account", "type": "address"},
      {"name": "id", "type": "uint256"},
      {"name": "amount", "type": "uint256"},
      {"name": "data", "type": "bytes"}
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "account", "type": "address"},
      {"name": "creditAmount", "type": "uint256"},
      {"name": "data", "type": "bytes"}
    ],
    "name": "mintCustomCredits",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// Credit package definitions (should match lib/credit-system-config.ts)
const CREDIT_PACKAGES = [
  {
    id: 'starter',
    usdcCredits: 750,
    wsCredits: 1000,
    tokenId: 0
  },
  {
    id: 'pro', 
    usdcCredits: 8000,
    wsCredits: 10000,
    tokenId: 1
  },
  {
    id: 'business',
    usdcCredits: 100000,
    wsCredits: 115000,
    tokenId: 2
  },
  {
    id: 'enterprise',
    usdcCredits: 260000,
    wsCredits: 290000,
    tokenId: 3
  }
]

export async function POST(request: NextRequest) {
  try {
    const body: MintCreditsRequest = await request.json()
    
    // Validate required fields
    if (!body.userAddress || !body.packageId || !body.paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    const signer = new ethers.Wallet(privateKey, provider)
    const creditsContract = new ethers.Contract(CREDITS_CONTRACT!, CREDITS_ABI, signer)

    let creditAmount: number
    let tokenId: number | undefined

    if (body.packageId === 'custom') {
      // Handle custom amount
      if (!body.customAmount || body.customAmount < 100) {
        return NextResponse.json(
          { error: 'Custom amount must be at least 100 credits' },
          { status: 400 }
        )
      }
      
      creditAmount = body.customAmount
      tokenId = 4 // CUSTOM_CREDITS token ID
      
    } else {
      // Handle predefined packages
      const packageData = CREDIT_PACKAGES.find(pkg => pkg.id === body.packageId)
      if (!packageData) {
        return NextResponse.json(
          { error: 'Invalid package ID' },
          { status: 400 }
        )
      }
      
      creditAmount = body.paymentMethod === 'USDC' 
        ? packageData.usdcCredits 
        : packageData.wsCredits
      tokenId = packageData.tokenId
    }

    try {
      let txHash: string

      if (body.packageId === 'custom') {
        // Mint custom credits
        const tx = await creditsContract.mintCustomCredits(
          body.userAddress,
          creditAmount,
          '0x' // empty bytes
        )
        txHash = tx.hash
        await tx.wait()
        
      } else {
        // Mint predefined package
        const tx = await creditsContract.mint(
          body.userAddress,
          tokenId,
          1, // amount of NFTs (1 per package)
          '0x' // empty bytes
        )
        txHash = tx.hash
        await tx.wait()
      }

      // Log the successful minting
      console.log(`Credits minted successfully:`, {
        userAddress: body.userAddress,
        packageId: body.packageId,
        paymentMethod: body.paymentMethod,
        creditAmount,
        tokenId,
        txHash
      })

      return NextResponse.json({
        success: true,
        creditAmount,
        tokenId,
        transactionHash: txHash,
        message: `Successfully minted ${creditAmount} credits`
      })

    } catch (contractError: any) {
      console.error('Contract interaction failed:', contractError)
      return NextResponse.json(
        { 
          error: 'Contract interaction failed', 
          details: contractError?.message || 'Unknown contract error'
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Mint credits API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}