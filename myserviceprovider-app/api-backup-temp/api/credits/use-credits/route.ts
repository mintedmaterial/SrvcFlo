import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { SONIC_BLAZE_TESTNET, SONIC_MAINNET } from '@/lib/network-config'

// Contract ABIs
const CREDITS_ERC1155_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'safeTransferFrom',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'id', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'data', type: 'bytes' }
    ],
    outputs: []
  }
] as const

const CREDIT_SYSTEM_ABI = [
  {
    name: 'useCreditsForGeneration',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'creditsToUse', type: 'uint256' },
      { name: 'purpose', type: 'string' },
      { name: 'metadata', type: 'bytes' }
    ],
    outputs: [{ name: 'transactionId', type: 'uint256' }]
  }
] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userAddress, 
      creditsToUse, 
      purpose, 
      prompt, 
      model,
      mintNFT = false
    } = body

    if (!userAddress || !creditsToUse || !purpose) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 })
    }

    // Determine network (default to testnet for now)
    const isMainnet = process.env.NODE_ENV === 'production'
    const chain = isMainnet ? SONIC_MAINNET : SONIC_BLAZE_TESTNET
    const rpcUrl = isMainnet ? 'https://rpc.soniclabs.com' : 'https://rpc.blaze.soniclabs.com'

    // Contract addresses (should be in environment variables)
    const creditsContractAddress = process.env.NEXT_PUBLIC_SONIC_CREDIT_ERC1155_CONTRACT as `0x${string}`
    const creditSystemAddress = process.env.NEXT_PUBLIC_SONIC_CREDIT_CONTRACT as `0x${string}`

    if (!creditsContractAddress || !creditSystemAddress) {
      return NextResponse.json({
        success: false,
        error: 'Contract addresses not configured'
      }, { status: 500 })
    }

    // Create clients
    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl)
    })

    // Check user's credit balance first
    const userBalance = await publicClient.readContract({
      address: creditsContractAddress,
      abi: CREDITS_ERC1155_ABI,
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`, BigInt(1)] // Credit token ID = 1
    })

    if (Number(userBalance) < creditsToUse) {
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. You have ${userBalance}, need ${creditsToUse}`
      }, { status: 400 })
    }

    // For backend operations, we need a wallet client with private key
    const backendPrivateKey = process.env.SONIC_BACKEND_PRIVATE_KEY
    if (!backendPrivateKey) {
      // If no backend key, just validate the balance and return success
      // The actual credit usage will be handled by the frontend transaction
      return NextResponse.json({
        success: true,
        userBalance: Number(userBalance),
        creditsToUse,
        message: 'Credits validated. Please confirm the transaction to use credits.',
        requiresFrontendTx: true
      })
    }

    const account = privateKeyToAccount(backendPrivateKey as `0x${string}`)
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl)
    })

    // Create metadata for the credit usage
    const metadata = JSON.stringify({
      purpose,
      prompt,
      model,
      mintNFT,
      timestamp: Date.now()
    })

    // Use credits via the credit system contract
    const { request } = await publicClient.simulateContract({
      address: creditSystemAddress,
      abi: CREDIT_SYSTEM_ABI,
      functionName: 'useCreditsForGeneration',
      args: [
        userAddress as `0x${string}`, 
        BigInt(creditsToUse), 
        purpose,
        metadata as `0x${string}`
      ],
      account: account.address
    })

    const txHash = await walletClient.writeContract(request)

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: txHash,
      timeout: 30000
    })

    return NextResponse.json({
      success: true,
      transactionHash: txHash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: Number(receipt.gasUsed),
      creditsUsed: creditsToUse,
      remainingCredits: Number(userBalance) - creditsToUse
    })

  } catch (error: any) {
    console.error('Use credits error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to use credits',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}