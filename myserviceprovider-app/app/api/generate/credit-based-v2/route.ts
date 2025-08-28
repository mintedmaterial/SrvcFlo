import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { SONIC_BLAZE_TESTNET, SONIC_MAINNET } from '@/lib/network-config'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// V2 Payment Contract ABI for credit spending
const PAYMENT_CONTRACT_ABI = [
  {
    name: 'spendERC20Credits',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'credits', type: 'uint256' },
      { name: 'generationType', type: 'string' }
    ],
    outputs: []
  },
  {
    name: 'spendNFTCredits',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'packageId', type: 'uint256' },
      { name: 'credits', type: 'uint256' },
      { name: 'generationType', type: 'string' }
    ],
    outputs: []
  }
] as const

// ERC1155 ABI for checking NFT credits
const ERC1155_ABI = [
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
] as const

// ERC-20 Credits ABI
const CREDITS_ABI = [
  {
    name: 'userCredits',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

// Model configurations with different credit costs
const MODEL_CONFIGS = {
  'openai-dall-e-3': { credits: 100, type: 'image', quality: 'premium' },
  'openai-dall-e-2': { credits: 50, type: 'image', quality: 'standard' },
  'stability-sd-xl': { credits: 75, type: 'image', quality: 'premium' },
  'cloudflare-standard': { credits: 25, type: 'image', quality: 'standard' },
  'video-basic': { credits: 200, type: 'video', quality: 'standard' },
  'video-premium': { credits: 400, type: 'video', quality: 'premium' }
}

// Check user's available credits (both ERC-20 and NFT)
async function checkUserCredits(userAddress: string, isMainnet: boolean) {
  try {
    const chain = isMainnet ? SONIC_MAINNET : SONIC_BLAZE_TESTNET
    const rpcUrl = isMainnet ? 'https://rpc.soniclabs.com' : 'https://rpc.blaze.soniclabs.com'
    
    const paymentContract = isMainnet 
      ? process.env.NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_MAINNET 
      : process.env.NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_TESTNET
    const creditsNFTContract = isMainnet
      ? process.env.NEXT_PUBLIC_SONIC_CREDITS_NFT_CONTRACT_MAINNET
      : process.env.NEXT_PUBLIC_SONIC_CREDITS_NFT_CONTRACT_TESTNET

    if (!paymentContract || !creditsNFTContract) {
      throw new Error('Contract addresses not configured')
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl)
    })

    // Check ERC-20 credits
    const erc20Credits = await publicClient.readContract({
      address: paymentContract as `0x${string}`,
      abi: CREDITS_ABI,
      functionName: 'userCredits',
      args: [userAddress as `0x${string}`]
    })

    // Check NFT credits for packages 1-4
    const nftCredits = await Promise.all([
      publicClient.readContract({
        address: creditsNFTContract as `0x${string}`,
        abi: ERC1155_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`, 1n]
      }),
      publicClient.readContract({
        address: creditsNFTContract as `0x${string}`,
        abi: ERC1155_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`, 2n]
      }),
      publicClient.readContract({
        address: creditsNFTContract as `0x${string}`,
        abi: ERC1155_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`, 3n]
      }),
      publicClient.readContract({
        address: creditsNFTContract as `0x${string}`,
        abi: ERC1155_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`, 4n]
      })
    ])

    return {
      erc20Credits: Number(erc20Credits),
      nftCredits: {
        package1: Number(nftCredits[0]),
        package2: Number(nftCredits[1]),
        package3: Number(nftCredits[2]),
        package4: Number(nftCredits[3])
      },
      totalNFTCredits: nftCredits.reduce((sum, credits) => sum + Number(credits), 0),
      totalCredits: Number(erc20Credits) + nftCredits.reduce((sum, credits) => sum + Number(credits), 0)
    }
  } catch (error) {
    console.error('Error checking credits:', error)
    return {
      erc20Credits: 0,
      nftCredits: { package1: 0, package2: 0, package3: 0, package4: 0 },
      totalNFTCredits: 0,
      totalCredits: 0
    }
  }
}

// Spend credits through contract call
async function spendCredits(
  userAddress: string, 
  creditsToSpend: number, 
  generationType: string,
  useNFTCredits: boolean = false,
  isMainnet: boolean = false
) {
  try {
    const chain = isMainnet ? SONIC_MAINNET : SONIC_BLAZE_TESTNET
    const rpcUrl = isMainnet ? 'https://rpc.soniclabs.com' : 'https://rpc.blaze.soniclabs.com'
    
    const paymentContract = isMainnet 
      ? process.env.NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_MAINNET 
      : process.env.NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_TESTNET
    const backendPrivateKey = process.env.SONIC_BACKEND_PRIVATE_KEY

    if (!paymentContract || !backendPrivateKey) {
      throw new Error('Contract or backend key not configured')
    }

    const account = privateKeyToAccount(backendPrivateKey as `0x${string}`)
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl)
    })

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl)
    })

    if (useNFTCredits) {
      // Find which NFT package to spend from (prioritize higher packages for efficiency)
      const credits = await checkUserCredits(userAddress, isMainnet)
      let packageId = 0

      if (credits.nftCredits.package4 >= creditsToSpend) packageId = 4
      else if (credits.nftCredits.package3 >= creditsToSpend) packageId = 3
      else if (credits.nftCredits.package2 >= creditsToSpend) packageId = 2
      else if (credits.nftCredits.package1 >= creditsToSpend) packageId = 1

      if (packageId === 0) {
        throw new Error('Insufficient NFT credits')
      }

      const { request } = await publicClient.simulateContract({
        address: paymentContract as `0x${string}`,
        abi: PAYMENT_CONTRACT_ABI,
        functionName: 'spendNFTCredits',
        args: [
          userAddress as `0x${string}`,
          BigInt(packageId),
          BigInt(creditsToSpend),
          generationType
        ],
        account: account.address
      })

      const txHash = await walletClient.writeContract(request)
      await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 30000 })

      return { success: true, creditType: 'NFT_credits', packageId, transactionHash: txHash }
    } else {
      // Spend ERC-20 credits
      const { request } = await publicClient.simulateContract({
        address: paymentContract as `0x${string}`,
        abi: PAYMENT_CONTRACT_ABI,
        functionName: 'spendERC20Credits',
        args: [
          userAddress as `0x${string}`,
          BigInt(creditsToSpend),
          generationType
        ],
        account: account.address
      })

      const txHash = await walletClient.writeContract(request)
      await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 30000 })

      return { success: true, creditType: 'ERC20_credits', transactionHash: txHash }
    }
  } catch (error) {
    console.error('Error spending credits:', error)
    return { success: false, error: error.message }
  }
}

// Get or create INFT agent for user
async function getOrCreateUserAgent(userAddress: string, packageId?: number) {
  try {
    const agentId = `user-${userAddress.toLowerCase()}`
    const workerUrl = 'http://localhost:8787'
    
    // First try to get agent status
    const statusResponse = await fetch(`${workerUrl}/api/inft/agent/${agentId}/status`)
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json()
      return {
        success: true,
        agentId,
        agent: statusData.agent,
        existed: true
      }
    }
    
    // Agent doesn't exist, create one
    const packageType = packageId ? Math.min(packageId, 4) : 2 // Default to Pro if no package specified
    const creditsByPackage = { 1: 750, 2: 8000, 3: 100000, 4: 260000 }
    
    const createResponse = await fetch(`${workerUrl}/api/inft/agent/${agentId}/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageTokenId: Date.now(),
        packageType,
        owner: userAddress,
        totalCredits: creditsByPackage[packageType] || 8000
      })
    })
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create agent: ${createResponse.statusText}`)
    }
    
    const createData = await createResponse.json()
    return {
      success: true,
      agentId,
      agent: createData.agent,
      existed: false
    }
  } catch (error) {
    console.error('Error with user agent:', error)
    return { success: false, error: error.message }
  }
}

// Generate content using INFT agent system
async function generateContentWithAgent(userAddress: string, model: string, prompt: string, packageId?: number) {
  try {
    const workerUrl = 'http://localhost:8787'
    
    // Get or create user's agent
    const agentResult = await getOrCreateUserAgent(userAddress, packageId)
    if (!agentResult.success) {
      throw new Error(`Agent setup failed: ${agentResult.error}`)
    }
    
    const { agentId } = agentResult
    
    // Map model to INFT system parameters
    const isVideo = model.includes('video')
    
    // Start generation with INFT agent
    const generateResponse = await fetch(`${workerUrl}/api/inft/generate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId,
        prompt,
        isVideo,
        collection: detectCollection(prompt),
        userAddress
      })
    })
    
    if (!generateResponse.ok) {
      throw new Error(`Generation failed: ${generateResponse.statusText}`)
    }
    
    const generateData = await generateResponse.json()
    const { generationId, estimatedTime } = generateData
    
    // Wait for generation to complete (with timeout)
    const maxWaitTime = estimatedTime + 10000 // Add 10s buffer
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Check every 2 seconds
      
      const statusResponse = await fetch(`${workerUrl}/api/inft/agent/${agentId}/status`)
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        const generation = statusData.agent.generatedContent?.find(g => 
          g.metadata?.generationId === generationId || 
          g.prompt === prompt && g.createdAt > new Date(Date.now() - maxWaitTime).toISOString()
        )
        
        if (generation) {
          return {
            success: true,
            resultUrl: generation.imageUrl || generation.r2Url,
            r2Url: generation.r2Url,
            agentId,
            agentInfo: agentResult.agent,
            generation,
            revisedPrompt: generation.metadata?.revisedPrompt || prompt
          }
        }
      }
    }
    
    throw new Error('Generation timed out')
  } catch (error) {
    console.error('INFT generation failed:', error)
    return { success: false, error: error.message }
  }
}

// Detect collection keywords for style influence
function detectCollection(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase()
  if (lowerPrompt.includes('derp')) return 'derp'
  if (lowerPrompt.includes('kidz') || lowerPrompt.includes('kids')) return 'kidz'
  if (lowerPrompt.includes('bandit')) return 'bandit'
  return 'default'
}

// Save generation to permanent storage
async function saveGenerationToR2(
  generationData: {
    resultUrl: string,
    userAddress: string,
    prompt: string,
    model: string,
    creditsUsed: number,
    creditType: string
  }
) {
  try {
    const response = await fetch('/api/generations/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...generationData,
        generationId: `v2_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: 'image',
        paymentMethod: generationData.creditType,
        resultData: generationData.resultUrl
      })
    })

    const data = await response.json()
    return data.success ? data : null
  } catch (error) {
    console.error('Failed to save to R2:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      type = 'image',
      prompt,
      userAddress,
      creditsNeeded,
      model = 'openai-dall-e-3',
      uploadedImage,
      preferNFTCredits = false
    } = body

    if (!prompt || !userAddress || !creditsNeeded) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 })
    }

    const isMainnet = process.env.NODE_ENV === 'production'
    const modelConfig = MODEL_CONFIGS[model]
    
    if (!modelConfig) {
      return NextResponse.json({
        success: false,
        error: 'Unsupported model'
      }, { status: 400 })
    }

    // Validate credit amount matches model requirements
    if (creditsNeeded !== modelConfig.credits) {
      return NextResponse.json({
        success: false,
        error: `Model ${model} requires ${modelConfig.credits} credits, not ${creditsNeeded}`
      }, { status: 400 })
    }

    // Check user's available credits
    const userCredits = await checkUserCredits(userAddress, isMainnet)
    
    if (userCredits.totalCredits < creditsNeeded) {
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. Need ${creditsNeeded}, have ${userCredits.totalCredits}`,
        userCredits
      }, { status: 400 })
    }

    // Determine which credits to use (NFT credits have bonus, so prefer them if available)
    const useNFTCredits = preferNFTCredits && userCredits.totalNFTCredits >= creditsNeeded

    // Spend credits first (prevents double spending)
    const spendResult = await spendCredits(
      userAddress,
      creditsNeeded,
      type,
      useNFTCredits,
      isMainnet
    )

    if (!spendResult.success) {
      return NextResponse.json({
        success: false,
        error: `Failed to spend credits: ${spendResult.error}`
      }, { status: 400 })
    }

    // Generate content using INFT agent system
    const generationResult = await generateContentWithAgent(
      userAddress, 
      model, 
      prompt, 
      spendResult.packageId
    )
    
    if (!generationResult.success) {
      // TODO: Refund credits if generation fails
      console.error('Generation failed after spending credits:', generationResult.error)
      return NextResponse.json({
        success: false,
        error: generationResult.error
      }, { status: 500 })
    }

    // Save to permanent storage
    const storageResult = await saveGenerationToR2({
      resultUrl: generationResult.resultUrl,
      userAddress,
      prompt,
      model,
      creditsUsed: creditsNeeded,
      creditType: spendResult.creditType
    })

    const permanentUrl = storageResult?.permanentUrls?.[0] || generationResult.resultUrl
    const generationId = storageResult?.generationId || `gen_${Date.now()}`

    // Log the generation
    try {
      await fetch('/api/generations/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          prompt,
          model,
          type,
          creditsUsed: creditsNeeded,
          creditType: spendResult.creditType,
          resultUrl: permanentUrl,
          status: 'completed',
          generationId,
          transactionHash: spendResult.transactionHash
        })
      })
    } catch (logError) {
      console.warn('Failed to log generation:', logError)
    }

    return NextResponse.json({
      success: true,
      generationId,
      resultUrl: permanentUrl,
      creditType: spendResult.creditType,
      creditsUsed: creditsNeeded,
      model,
      revisedPrompt: generationResult.revisedPrompt,
      transactionHash: spendResult.transactionHash,
      userCreditsAfter: {
        ...userCredits,
        totalCredits: userCredits.totalCredits - creditsNeeded,
        [useNFTCredits ? 'totalNFTCredits' : 'erc20Credits']: 
          (useNFTCredits ? userCredits.totalNFTCredits : userCredits.erc20Credits) - creditsNeeded
      },
      generatedAt: new Date().toISOString(),
      // INFT Agent information
      agentId: generationResult.agentId,
      agentInfo: generationResult.agentInfo,
      agentGeneration: generationResult.generation,
      collectionInfluenced: detectCollection(prompt) !== 'default'
    })

  } catch (error: any) {
    console.error('Credit-based V2 generation error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Generation failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}