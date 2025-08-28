import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, WalletAuthRequest, WalletAuthAPIMiddleware } from '../../../lib/wallet-auth-api-middleware'

interface SaveGenerationRequest {
  generationId: string
  type: 'image' | 'video'
  prompt: string
  userAddress: string
  paymentMethod: 'credits' | 'USDC'
  model: string
  creditsUsed?: number
  resultData: string | string[]
  collectionInfluence?: {
    collection: string
    keywords: string[]
    similarImages?: string[]
  }
}

interface CloudflareR2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrl: string
}

// Initialize Cloudflare R2 configuration
const r2Config: CloudflareR2Config = {
  accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID || '',
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'serviceflow-generations',
  publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://generations.srvcflo.com'
}

async function uploadToR2(fileBuffer: Buffer, fileName: string, contentType: string): Promise<string> {
  const AWS = require('aws-sdk')
  
  const s3 = new AWS.S3({
    endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
    signatureVersion: 'v4',
    region: 'auto',
  })

  const uploadParams = {
    Bucket: r2Config.bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
    ACL: 'public-read'
  }

  try {
    const uploadResult = await s3.upload(uploadParams).promise()
    return `${r2Config.publicUrl}/${fileName}`
  } catch (error) {
    console.error('R2 upload failed:', error)
    throw new Error('Failed to upload to Cloudflare R2')
  }
}

async function createNFTMetadata(generation: SaveGenerationRequest, permanentUrls: string[]): Promise<any> {
  const metadata = {
    name: `ServiceFlow AI Generation #${generation.generationId}`,
    description: generation.prompt,
    image: permanentUrls[0], // Primary image/video
    attributes: [
      {
        trait_type: "Generation Type",
        value: generation.type
      },
      {
        trait_type: "Model",
        value: generation.model
      },
      {
        trait_type: "Payment Method",
        value: generation.paymentMethod
      },
      {
        trait_type: "Credits Used",
        value: generation.creditsUsed || 0
      },
      {
        trait_type: "Created At",
        value: new Date().toISOString()
      }
    ],
    external_url: `https://srvcflo.com/generation/${generation.generationId}`,
    animation_url: generation.type === 'video' ? permanentUrls[0] : undefined,
    properties: {
      generationId: generation.generationId,
      creator: generation.userAddress,
      prompt: generation.prompt,
      permanentUrls: permanentUrls,
      collectionInfluence: generation.collectionInfluence
    }
  }

  // Add collection influence attributes if present
  if (generation.collectionInfluence) {
    metadata.attributes.push({
      trait_type: "Influenced By Collection",
      value: generation.collectionInfluence.collection
    })
    
    if (generation.collectionInfluence.keywords.length > 0) {
      metadata.attributes.push({
        trait_type: "Collection Keywords",
        value: generation.collectionInfluence.keywords.join(", ")
      })
    }
  }

  return metadata
}

async function storeGenerationRecord(generation: SaveGenerationRequest, permanentUrls: string[], metadata: any): Promise<void> {
  // Store generation record in database for indexing and retrieval
  // This would typically be a database insert operation
  console.log('Storing generation record:', {
    generationId: generation.generationId,
    userAddress: generation.userAddress,
    permanentUrls: permanentUrls,
    metadata: metadata,
    createdAt: new Date().toISOString()
  })
  
  // TODO: Implement actual database storage
  // Example:
  // await prisma.generation.create({
  //   data: {
  //     id: generation.generationId,
  //     userAddress: generation.userAddress,
  //     type: generation.type,
  //     prompt: generation.prompt,
  //     model: generation.model,
  //     paymentMethod: generation.paymentMethod,
  //     creditsUsed: generation.creditsUsed,
  //     permanentUrls: permanentUrls,
  //     metadata: metadata,
  //     collectionInfluence: generation.collectionInfluence
  //   }
  // })
}

// Apply wallet authentication middleware
const authenticatedPOST = requireAuth({
  requiredPermissions: ['generate_content'],
  requireOwnership: false,
  rateLimitPerMinute: 10
})(async (request: WalletAuthRequest) => {
  try {
    const body: SaveGenerationRequest = await request.json()
    
    // Validate required fields
    if (!body.generationId || !body.type || !body.userAddress || !body.resultData) {
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

    const permanentUrls: string[] = []
    const resultUrls = Array.isArray(body.resultData) ? body.resultData : [body.resultData]

    // Process each generated file
    for (let i = 0; i < resultUrls.length; i++) {
      const resultUrl = resultUrls[i]
      
      try {
        // Download the file from the temporary URL
        const response = await fetch(resultUrl)
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`)
        }
        
        const fileBuffer = Buffer.from(await response.arrayBuffer())
        
        // Determine file extension and content type
        const isVideo = body.type === 'video'
        const extension = isVideo ? 'mp4' : 'png'
        const contentType = isVideo ? 'video/mp4' : 'image/png'
        
        // Generate unique filename with authenticated wallet
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const fileName = `generations/${request.walletAuth?.walletAddress}/${body.generationId}-${i}.${extension}`
        
        // Upload to Cloudflare R2
        const permanentUrl = await uploadToR2(fileBuffer, fileName, contentType)
        permanentUrls.push(permanentUrl)
        
      } catch (error) {
        console.error(`Failed to process file ${i}:`, error)
        return NextResponse.json(
          { error: `Failed to process file ${i}: ${error}` },
          { status: 500 }
        )
      }
    }

    // Create NFT metadata
    const metadata = await createNFTMetadata(body, permanentUrls)

    // Store generation record for indexing with authenticated wallet
    await storeGenerationRecord(body, permanentUrls, metadata)
    
    console.log(`Generation saved by wallet ${request.walletAuth?.walletAddress}:`, {
      generationId: body.generationId,
      type: body.type,
      permanentUrls: permanentUrls.length
    })

    // Optional: Mint NFT with metadata
    if (body.paymentMethod === 'credits') {
      // For ERC-1155 credit users, we can automatically add this metadata to their NFT
      // This would require calling the smart contract to update metadata
      console.log('Adding metadata to ERC-1155 credit NFT for user:', body.userAddress)
      
      // TODO: Implement NFT metadata update
      // Example:
      // await updateNFTMetadata(body.userAddress, body.generationId, metadata)
    }

    return NextResponse.json({
      success: true,
      generationId: body.generationId,
      permanentUrls: permanentUrls,
      metadata: metadata,
      message: 'Generation saved successfully to permanent storage'
    })

  } catch (error) {
    console.error('Save generation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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