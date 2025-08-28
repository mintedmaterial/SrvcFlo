import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

// MongoDB connection
let cachedClient: MongoClient | null = null

async function connectToDatabase() {
  if (cachedClient && cachedClient.topology?.isConnected()) {
    return cachedClient
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment variables')
  }

  const client = new MongoClient(process.env.MONGODB_URI)
  await client.connect()
  cachedClient = client
  return client
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userAddress) {
      return NextResponse.json({
        success: false,
        error: 'User address is required'
      }, { status: 400 })
    }

    const client = await connectToDatabase()
    const db = client.db('serviceflow_ai')
    const collection = db.collection('generations')

    // Fetch user's generation history
    const generations = await collection
      .find({ 
        walletAddress: userAddress.toLowerCase() 
      })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray()

    // Get total count for pagination
    const totalCount = await collection.countDocuments({
      walletAddress: userAddress.toLowerCase()
    })

    // Transform the data for frontend
    const transformedGenerations = generations.map(gen => ({
      id: gen._id.toString(),
      type: gen.type || 'image',
      prompt: gen.prompt,
      status: gen.status || 'completed',
      result: gen.resultUrl ? [gen.resultUrl] : [],
      createdAt: gen.createdAt || gen.timestamp || new Date().toISOString(),
      walletAddress: gen.walletAddress,
      paymentMethod: gen.paymentMethod || (gen.creditsUsed > 0 ? 'credits' : 'free'),
      creditsUsed: gen.creditsUsed || 0,
      nftTokenId: gen.nftData?.tokenId,
      nftMinted: !!gen.nftData,
      cloudflareUrl: gen.permanentUrl,
      nftMetadata: gen.nftData,
      model: gen.model,
      transactionHash: gen.transactionHash
    }))

    return NextResponse.json({
      success: true,
      generations: transformedGenerations,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: (offset + limit) < totalCount
      }
    })

  } catch (error: any) {
    console.error('Fetch generation history error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch generation history',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userAddress,
      prompt,
      model,
      type = 'image',
      creditsUsed = 0,
      transactionHash,
      resultUrl,
      permanentUrl,
      nftData,
      status = 'completed'
    } = body

    if (!userAddress || !prompt) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 })
    }

    const client = await connectToDatabase()
    const db = client.db('serviceflow_ai')
    const collection = db.collection('generations')

    const generationRecord = {
      walletAddress: userAddress.toLowerCase(),
      prompt,
      model,
      type,
      creditsUsed,
      transactionHash,
      resultUrl,
      permanentUrl,
      nftData,
      status,
      paymentMethod: creditsUsed > 0 ? 'credits' : 'free',
      createdAt: new Date().toISOString(),
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    }

    const result = await collection.insertOne(generationRecord)

    return NextResponse.json({
      success: true,
      generationId: result.insertedId.toString(),
      message: 'Generation logged successfully'
    })

  } catch (error: any) {
    console.error('Log generation error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to log generation',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}