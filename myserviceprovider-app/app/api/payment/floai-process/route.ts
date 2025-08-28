import { NextRequest, NextResponse } from 'next/server'

// Mock contract addresses - these would be real addresses after deployment
const CONTRACT_ADDRESSES = {
  FLOAI_TOKEN: '0x' + '0'.repeat(40), // To be replaced with actual deployed address
  PAYMENT_SPLITTER: '0x' + '1'.repeat(40), // To be replaced with actual deployed address
  DEV_WALLET: '0x' + '2'.repeat(40),
  STAKING_CONTRACT: '0x' + '3'.repeat(40),
  LEADERBOARD_WALLET: '0x' + '4'.repeat(40),
  TREASURY_WALLET: '0x' + '5'.repeat(40)
}

// FLOAI costs (should match the smart contract)
const FLOAI_COSTS = {
  image: 50, // 50 FLOAI per image
  video: 100, // 100 FLOAI per video
  social: 25, // 25 FLOAI per social post
  research: 30, // 30 FLOAI per research
  analysis: 40 // 40 FLOAI per analysis
}

interface PaymentRequest {
  userAddress: string
  agentId: number
  agentOwner: string
  generationType: 'image' | 'video' | 'social' | 'research' | 'analysis'
  amount?: number // Optional override
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json()
    const { userAddress, agentId, agentOwner, generationType, amount } = body

    if (!userAddress || !agentOwner || !generationType) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters',
        required: ['userAddress', 'agentOwner', 'generationType']
      }, { status: 400 })
    }

    // Get the cost for this generation type
    const floaiCost = amount || FLOAI_COSTS[generationType]
    if (!floaiCost) {
      return NextResponse.json({
        success: false,
        error: 'Invalid generation type',
        supportedTypes: Object.keys(FLOAI_COSTS)
      }, { status: 400 })
    }

    // Step 1: Check user's FLOAI balance (mock implementation)
    const userBalance = await checkFLOAIBalance(userAddress)
    if (userBalance < floaiCost) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient FLOAI balance',
        required: floaiCost,
        balance: userBalance,
        deficit: floaiCost - userBalance
      }, { status: 402 }) // Payment Required
    }

    // Step 2: Process payment through smart contract (mock implementation)
    try {
      const paymentResult = await processPaymentThroughContract({
        userAddress,
        agentId,
        agentOwner,
        generationType,
        amount: floaiCost
      })

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment processing failed')
      }

      // Step 3: Log the payment for analytics
      await logPayment({
        userAddress,
        agentId,
        agentOwner,
        generationType,
        amount: floaiCost,
        transactionHash: paymentResult.transactionHash,
        revenueDistribution: paymentResult.revenueDistribution
      })

      return NextResponse.json({
        success: true,
        paymentProcessed: true,
        transactionHash: paymentResult.transactionHash,
        amount: floaiCost,
        generationType,
        revenueDistribution: paymentResult.revenueDistribution,
        userBalance: userBalance - floaiCost,
        agentRevenue: paymentResult.agentRevenue
      })

    } catch (contractError: any) {
      console.error('Smart contract payment error:', contractError)
      return NextResponse.json({
        success: false,
        error: 'Smart contract payment failed',
        details: contractError.message
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('FLOAI payment processing error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Payment processing failed'
    }, { status: 500 })
  }
}

// Mock function to check FLOAI balance
async function checkFLOAIBalance(userAddress: string): Promise<number> {
  try {
    // In a real implementation, this would call the FLOAI token contract
    // For now, return a mock balance
    
    // Simulate some users having different balances
    const mockBalances: { [key: string]: number } = {
      '0x742d35cc6569c2c0ba0000000000000000000000': 1000, // Test wallet with 1000 FLOAI
      '0x8ba1f109551bd432803012645hdjddjjdj': 500,      // Another test wallet
    }

    const balance = mockBalances[userAddress.toLowerCase()] || Math.floor(Math.random() * 200) + 50
    
    console.log(`Mock FLOAI balance for ${userAddress}: ${balance}`)
    return balance

  } catch (error) {
    console.error('Error checking FLOAI balance:', error)
    return 0
  }
}

// Mock function to process payment through smart contract
async function processPaymentThroughContract(params: {
  userAddress: string
  agentId: number
  agentOwner: string
  generationType: string
  amount: number
}): Promise<{
  success: boolean
  transactionHash?: string
  revenueDistribution?: any
  agentRevenue?: number
  error?: string
}> {
  try {
    // In real implementation, this would:
    // 1. Call FLOAIPaymentSplitter.processPayment()
    // 2. Handle the transaction
    // 3. Return the transaction hash and results

    // Mock successful payment processing
    const mockTransactionHash = '0x' + Math.random().toString(16).substr(2, 64)
    
    // Calculate revenue distribution (matches smart contract logic)
    const devAmount = Math.floor(params.amount * 0.5) // 50%
    const stakingAmount = Math.floor(params.amount * 0.25) // 25%
    const leaderboardAmount = Math.floor(params.amount * 0.15) // 15%
    const treasuryAmount = Math.floor(params.amount * 0.1) // 10%
    const agentRevenue = Math.floor(params.amount * 0.05) // 5% to agent owner

    const revenueDistribution = {
      dev: devAmount,
      staking: stakingAmount,
      leaderboard: leaderboardAmount,
      treasury: treasuryAmount,
      total: devAmount + stakingAmount + leaderboardAmount + treasuryAmount
    }

    // Simulate a small chance of failure for testing
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Mock transaction failure for testing')
    }

    console.log('Mock payment processed:', {
      transactionHash: mockTransactionHash,
      revenueDistribution,
      agentRevenue
    })

    return {
      success: true,
      transactionHash: mockTransactionHash,
      revenueDistribution,
      agentRevenue
    }

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Log payment for analytics
async function logPayment(params: {
  userAddress: string
  agentId: number
  agentOwner: string
  generationType: string
  amount: number
  transactionHash: string
  revenueDistribution: any
}) {
  try {
    // In real implementation, this would save to database
    console.log('Payment logged:', {
      timestamp: new Date().toISOString(),
      ...params
    })

    // Could also trigger events like:
    // - Update leaderboards
    // - Notify staking contract
    // - Update agent usage stats
    
  } catch (error) {
    console.error('Failed to log payment:', error)
    // Don't fail the payment if logging fails
  }
}

// GET endpoint for payment information
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userAddress = searchParams.get('userAddress')

  try {
    let userBalance = 0
    if (userAddress) {
      userBalance = await checkFLOAIBalance(userAddress)
    }

    return NextResponse.json({
      floaiCosts: FLOAI_COSTS,
      contractAddresses: CONTRACT_ADDRESSES,
      revenueDistribution: {
        dev: '50%',
        staking: '25%',
        leaderboard: '15%',
        treasury: '10%',
        agentOwner: '5%'
      },
      paymentFlow: [
        '1. Check user FLOAI balance',
        '2. Transfer FLOAI from user to payment splitter',
        '3. Distribute revenue according to percentages',
        '4. Record agent usage for owner earnings',
        '5. Log transaction for analytics'
      ],
      userBalance: userAddress ? userBalance : undefined,
      supportedTypes: Object.keys(FLOAI_COSTS)
    })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      floaiCosts: FLOAI_COSTS
    }, { status: 500 })
  }
}