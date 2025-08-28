import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { SONIC_BLAZE_TESTNET, SONIC_MAINNET } from '@/lib/network-config'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// NFT Contract ABI for minting
const NFT_CONTRACT_ABI = [
  {
    name: 'mintWithMetadata',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'creator', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'prompt', type: 'string' },
      { name: 'generationMethod', type: 'string' },
      { name: 'data', type: 'bytes' }
    ],
    outputs: []
  }
] as const

// Save image to Cloudflare R2 and create NFT metadata
async function saveToCloudflareR2(imageData: string, metadata: any) {
  try {
    const response = await fetch('/api/storage/upload-r2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData,
        metadata,
        folder: 'ai-generations'
      })
    })

    const data = await response.json()
    return data.success ? data : null
  } catch (error) {
    console.error('Failed to save to R2:', error)
    return null
  }
}

// Generate image with OpenAI DALL-E
async function generateWithOpenAI(prompt: string) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url"
    })

    return {
      success: true,
      imageUrl: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt
    }
  } catch (error: any) {
    console.error('OpenAI generation failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Generate image with Cloudflare Workers AI
async function generateWithCloudflare(prompt: string) {
  try {
    const response = await fetch('/api/generate/cloudflare-worker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    })

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('Cloudflare generation failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Mint NFT with generation metadata
async function mintGenerationNFT(
  userAddress: string,
  prompt: string,
  model: string,
  imageUrl: string,
  transactionHash?: string
) {
  try {
    const isMainnet = process.env.NODE_ENV === 'production'
    const chain = isMainnet ? SONIC_MAINNET : SONIC_BLAZE_TESTNET
    const rpcUrl = isMainnet ? 'https://rpc.soniclabs.com' : 'https://rpc.blaze.soniclabs.com'
    
    const nftContractAddress = process.env.NEXT_PUBLIC_SONIC_CREDITS_NFT_CONTRACT as `0x${string}`
    const backendPrivateKey = process.env.SONIC_BACKEND_PRIVATE_KEY

    if (!nftContractAddress || !backendPrivateKey) {
      throw new Error('NFT contract or backend key not configured')
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl)
    })

    const account = privateKeyToAccount(backendPrivateKey as `0x${string}`)
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl)
    })

    // Generate unique token ID based on timestamp and transaction hash
    const tokenId = BigInt(Date.now() + Math.floor(Math.random() * 1000))

    // Create metadata
    const metadata = {
      name: `AI Generation #${tokenId}`,
      description: `Generated with ${model}: "${prompt}"`,
      image: imageUrl,
      attributes: [
        { trait_type: 'Model', value: model },
        { trait_type: 'Prompt', value: prompt },
        { trait_type: 'Generation Date', value: new Date().toISOString() },
        { trait_type: 'Transaction Hash', value: transactionHash || 'N/A' }
      ]
    }

    // Save metadata to IPFS or permanent storage
    const metadataStorage = await saveToCloudflareR2(imageUrl, metadata)
    const metadataUri = metadataStorage?.metadataUrl || `https://api.serviceflowai.com/metadata/${tokenId}.json`

    // Mint NFT
    const { request } = await publicClient.simulateContract({
      address: nftContractAddress,
      abi: NFT_CONTRACT_ABI,
      functionName: 'mintWithMetadata',
      args: [
        userAddress as `0x${string}`,
        tokenId,
        BigInt(1), // amount = 1
        prompt,
        model,
        '0x' // empty data
      ],
      account: account.address
    })

    const mintTxHash = await walletClient.writeContract(request)
    const mintReceipt = await publicClient.waitForTransactionReceipt({ 
      hash: mintTxHash,
      timeout: 30000
    })

    return {
      success: true,
      tokenId: Number(tokenId),
      transactionHash: mintTxHash,
      metadataUrl: metadataUri,
      metadata: metadata
    }

  } catch (error: any) {
    console.error('NFT minting failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      type = 'image', 
      prompt, 
      userAddress, 
      model = 'openai-dall-e-3',
      creditsUsed,
      transactionHash,
      mintAsNFT = false
    } = body

    if (!prompt || !userAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 })
    }

    // Generate based on selected model
    let generationResult
    
    switch (model) {
      case 'openai-dall-e-3':
        generationResult = await generateWithOpenAI(prompt)
        break
      case 'stability-sd-xl':
      case 'cloudflare-standard':
        generationResult = await generateWithCloudflare(prompt)
        break
      default:
        return NextResponse.json({
          success: false,
          error: 'Unsupported model'
        }, { status: 400 })
    }

    if (!generationResult.success) {
      return NextResponse.json({
        success: false,
        error: generationResult.error
      }, { status: 500 })
    }

    // Save to permanent storage
    const storageResult = await saveToCloudflareR2(
      generationResult.imageUrl,
      {
        prompt,
        model,
        userAddress,
        creditsUsed,
        transactionHash,
        generatedAt: new Date().toISOString()
      }
    )

    const permanentUrl = storageResult?.permanentUrl || generationResult.imageUrl
    
    // Mint NFT if requested
    let nftData = null
    if (mintAsNFT) {
      const nftResult = await mintGenerationNFT(
        userAddress,
        prompt,
        model,
        permanentUrl,
        transactionHash
      )
      
      if (nftResult.success) {
        nftData = {
          tokenId: nftResult.tokenId,
          transactionHash: nftResult.transactionHash,
          metadataUrl: nftResult.metadataUrl,
          name: nftResult.metadata?.name,
          description: nftResult.metadata?.description,
          image: nftResult.metadata?.image,
          attributes: nftResult.metadata?.attributes
        }
      }
    }

    // Log the generation to database
    try {
      await fetch('/api/generations/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          prompt,
          model,
          type,
          creditsUsed,
          transactionHash,
          resultUrl: permanentUrl,
          nftData,
          status: 'completed'
        })
      })
    } catch (logError) {
      console.warn('Failed to log generation:', logError)
      // Continue without failing
    }

    return NextResponse.json({
      success: true,
      resultUrl: generationResult.imageUrl,
      permanentUrl: permanentUrl,
      revisedPrompt: generationResult.revisedPrompt,
      model,
      creditsUsed,
      nftData,
      generatedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Credit-based generation error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Generation failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}