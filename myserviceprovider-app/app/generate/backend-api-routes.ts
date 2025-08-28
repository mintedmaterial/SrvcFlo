// app/api/generations/thread/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

// Contract addresses and ABIs
const VOTING_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS
const VOTING_CONTRACT_ABI = [
  // Add the ABI from the voting contract
  {
    "inputs": [{"name": "generationId", "type": "string"}],
    "name": "getGeneration",
    "outputs": [
      {"name": "id", "type": "string"},
      {"name": "creator", "type": "address"},
      {"name": "prompt", "type": "string"},
      {"name": "resultUrl", "type": "string"},
      {"name": "timestamp", "type": "uint256"},
      {"name": "upvotes", "type": "uint256"},
      {"name": "isActive", "type": "bool"},
      {"name": "weeklyContestId", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "count", "type": "uint256"}],
    "name": "getTopGenerations",
    "outputs": [{"name": "", "type": "string[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllGenerationIds",
    "outputs": [{"name": "", "type": "string[]"}],
    "stateMutability": "view",
    "type": "function"
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { filters, searchQuery, userAddress } = body

    // Connect to Sonic network
    const provider = new ethers.JsonRpcProvider('https://rpc.soniclabs.com')
    const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS!, VOTING_CONTRACT_ABI, provider)

    // Get generation IDs based on sorting
    let generationIds: string[]
    
    if (filters.sortBy === 'top') {
      generationIds = await contract.getTopGenerations(100) // Get top 100
    } else {
      generationIds = await contract.getAllGenerationIds()
    }

    // Fetch detailed generation data
    const generations = await Promise.all(
      generationIds.map(async (id: string) => {
        try {
          const [
            genId,
            creator,
            prompt,
            resultUrl,
            timestamp,
            upvotes,
            isActive,
            weeklyContestId
          ] = await contract.getGeneration(id)

          // Check if user has voted (if userAddress provided)
          let hasVoted = false
          if (userAddress) {
            hasVoted = await contract.hasVotedForGeneration(userAddress, id)
          }

          // Get additional data from your database
          const additionalData = await getGenerationAdditionalData(id)

          return {
            id: genId,
            type: additionalData.type || 'image',
            prompt,
            result: [resultUrl],
            createdAt: new Date(Number(timestamp) * 1000).toISOString(),
            walletAddress: creator,
            paymentMethod: additionalData.paymentMethod || 'unknown',
            transactionHash: additionalData.transactionHash,
            upvotes: Number(upvotes),
            hasVoted,
            userStakedNFTs: additionalData.userStakedNFTs || 0,
            isCreator: userAddress?.toLowerCase() === creator.toLowerCase(),
            leaderboardRank: additionalData.leaderboardRank,
            weeklyRank: additionalData.weeklyRank
          }
        } catch (error) {
          console.error(`Error fetching generation ${id}:`, error)
          return null
        }
      })
    )

    // Filter out failed fetches and apply filters
    const validGenerations = generations
      .filter(gen => gen !== null)
      .filter(gen => {
        // Apply time filter
        const now = Date.now()
        const createdTime = new Date(gen.createdAt).getTime()
        
        switch (filters.timeframe) {
          case 'today':
            if (now - createdTime > 86400000) return false
            break
          case 'week':
            if (now - createdTime > 7 * 86400000) return false
            break
          case 'month':
            if (now - createdTime > 30 * 86400000) return false
            break
        }

        // Apply type filter
        if (filters.type !== 'all' && gen.type !== filters.type) return false

        // Apply staked filter
        if (filters.stakedOnly && gen.userStakedNFTs === 0) return false

        // Apply search filter
        if (searchQuery && !gen.prompt.toLowerCase().includes(searchQuery.toLowerCase())) return false

        return true
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'trending':
            // Calculate trending score (upvotes / hours since creation)
            const aHours = Math.max(1, (Date.now() - new Date(a.createdAt).getTime()) / 3600000)
            const bHours = Math.max(1, (Date.now() - new Date(b.createdAt).getTime()) / 3600000)
            return (b.upvotes / bHours) - (a.upvotes / aHours)
          case 'top':
            return b.upvotes - a.upvotes
          default: // newest
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
      })

    return NextResponse.json({
      success: true,
      generations: validGenerations
    })

  } catch (error) {
    console.error('Generation thread API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch generations' },
      { status: 500 }
    )
  }
}

// Helper function to get additional data from database
async function getGenerationAdditionalData(generationId: string) {
  // This would query your database for additional metadata
  // For now, return mock data
  return {
    type: 'image',
    paymentMethod: 'S',
    transactionHash: `0x${Math.random().toString(16).slice(2)}`,
    userStakedNFTs: Math.floor(Math.random() * 10),
    leaderboardRank: Math.floor(Math.random() * 100) + 1,
    weeklyRank: Math.floor(Math.random() * 20) + 1
  }
}

// app/api/leaderboard/route.ts
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const count = parseInt(url.searchParams.get('count') || '50')

    // Connect to contract
    const provider = new ethers.JsonRpcProvider('https://rpc.soniclabs.com')
    const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS!, VOTING_CONTRACT_ABI, provider)

    // Get leaderboard data
    const [users, points, upvotes, generations] = await contract.getLeaderboard(count)

    const leaderboard = users.map((user: string, index: number) => ({
      address: user,
      stakedCount: 0, // Would get from staking contract
      totalUpvotes: Number(upvotes[index]),
      leaderboardPoints: Number(points[index]),
      rank: index + 1,
      totalGenerations: Number(generations[index])
    }))

    return NextResponse.json({
      success: true,
      leaderboard
    })

  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

// app/api/contests/current/route.ts
export async function GET() {
  try {
    const provider = new ethers.JsonRpcProvider('https://rpc.soniclabs.com')
    const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS!, VOTING_CONTRACT_ABI, provider)

    const [id, title, startTime, endTime, isActive, prizePool] = await contract.getCurrentWeeklyContest()

    const contest = {
      id: Number(id),
      title,
      startDate: new Date(Number(startTime) * 1000).toISOString(),
      endDate: new Date(Number(endTime) * 1000).toISOString(),
      prize: `${ethers.formatEther(prizePool)} ETH`, // Adjust based on your prize structure
      isActive,
      topEntries: [] // Would populate with top entries
    }

    return NextResponse.json({
      success: true,
      contest
    })

  } catch (error) {
    console.error('Contest API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contest' },
      { status: 500 }
    )
  }
}

// app/api/generations/submit/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { generationId, creator, prompt, resultUrl, type, paymentMethod, transactionHash } = body

    // Validate admin API key
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Store additional metadata in your database
    await storeGenerationMetadata({
      generationId,
      type,
      paymentMethod,
      transactionHash,
      creator
    })

    // Submit to smart contract
    const provider = new ethers.JsonRpcProvider('https://rpc.soniclabs.com')
    const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, provider)
    const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS!, VOTING_CONTRACT_ABI, wallet)

    const tx = await contract.submitGeneration(generationId, creator, prompt, resultUrl)
    await tx.wait()

    return NextResponse.json({
      success: true,
      transactionHash: tx.hash
    })

  } catch (error) {
    console.error('Submit generation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit generation' },
      { status: 500 }
    )
  }
}

// app/api/user/stats/route.ts
export async function POST(request: NextRequest) {
  try {
    const { userAddress } = await request.json()

    if (!userAddress) {
      return NextResponse.json({ error: 'User address required' }, { status: 400 })
    }

    const provider = new ethers.JsonRpcProvider('https://rpc.soniclabs.com')
    const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS!, VOTING_CONTRACT_ABI, provider)

    const [
      totalUpvotesReceived,
      totalGenerationsCreated,
      leaderboardPoints,
      weeklyPoints,
      isEligibleForVoting
    ] = await contract.getUserStats(userAddress)

    return NextResponse.json({
      success: true,
      stats: {
        totalUpvotesReceived: Number(totalUpvotesReceived),
        totalGenerationsCreated: Number(totalGenerationsCreated),
        leaderboardPoints: Number(leaderboardPoints),
        weeklyPoints: Number(weeklyPoints),
        isEligibleForVoting,
        canVote: await contract.canVote(userAddress)
      }
    })

  } catch (error) {
    console.error('User stats API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}

// Helper function to store generation metadata
async function storeGenerationMetadata(data: {
  generationId: string
  type: string
  paymentMethod: string
  transactionHash?: string
  creator: string
}) {
  // This would store in your database (PostgreSQL, MongoDB, etc.)
  // For now, just log
  console.log('Storing generation metadata:', data)
  
  // Example using a hypothetical database connection:
  /*
  await db.generations.create({
    id: data.generationId,
    type: data.type,
    paymentMethod: data.paymentMethod,
    transactionHash: data.transactionHash,
    creator: data.creator,
    createdAt: new Date()
  })
  */
}