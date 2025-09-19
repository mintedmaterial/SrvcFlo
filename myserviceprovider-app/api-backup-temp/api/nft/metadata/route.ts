import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, optionalAuth, WalletAuthRequest, WalletAuthAPIMiddleware } from '@/lib/wallet-auth-api-middleware';

export const dynamic = 'force-dynamic';

// Apply wallet authentication middleware for NFT creation
const authenticatedPOST = requireAuth({
  requiredPermissions: ['generate_content'],
  requireOwnership: false,
  rateLimitPerMinute: 20
})(async (request: WalletAuthRequest) => {
  try {
    const body = await request.json();
    const { 
      tokenId,
      prompt, 
      imageData, 
      model, 
      creator, 
      paymentMethod,
      transactionHash,
      timestamp
    } = body;

    // Validate required fields
    if (!tokenId || !prompt || !imageData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: tokenId, prompt, imageData' },
        { status: 400 }
      );
    }

    // Verify creator matches authenticated wallet if provided
    if (creator && request.walletAuth?.walletAddress.toLowerCase() !== creator.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Creator address must match authenticated wallet' },
        { status: 403 }
      );
    }

    console.log('NFT Metadata Generation Request from wallet:', {
      wallet: request.walletAuth?.walletAddress,
      tokenId, 
      prompt: prompt.substring(0, 50) + '...', 
      model, 
      creator
    });

    // Generate NFT metadata following OpenSea standard
    const metadata = {
      name: `ServiceFlow AI Art #${tokenId}`,
      description: `AI-generated artwork created with ServiceFlow AI platform. Generated using the prompt: "${prompt}". This unique piece of digital art was created using advanced AI models and represents the fusion of artificial intelligence and creative expression.`,
      image: imageData, // This should be IPFS URL or base64 data URL
      external_url: `https://serviceflow.ai/nft/${tokenId}`,
      attributes: [
        {
          trait_type: "Model",
          value: model || "Premium AI Model"
        },
        {
          trait_type: "Payment Method",
          value: paymentMethod || "Crypto"
        },
        {
          trait_type: "Creator",
          value: creator || request.walletAuth?.walletAddress || "Anonymous"
        },
        {
          trait_type: "Generation Type",
          value: "AI Generated"
        },
        {
          trait_type: "Platform",
          value: "ServiceFlow AI"
        },
        {
          trait_type: "Blockchain",
          value: "Sonic"
        }
      ],
      properties: {
        prompt: prompt,
        model: model,
        timestamp: timestamp || Date.now(),
        transactionHash: transactionHash,
        creator: creator || request.walletAuth?.walletAddress,
        authenticatedWallet: request.walletAuth?.walletAddress
      }
    };

    // In a production environment, you would:
    // 1. Upload the image to IPFS/Arweave
    // 2. Upload the metadata to IPFS/Arweave
    // 3. Return the IPFS URLs
    
    // For now, we'll return the metadata as JSON that can be served directly
    // or uploaded to IPFS by the frontend/backend integration

    const response = {
      success: true,
      metadata: metadata,
      metadataUri: `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`,
      tokenId: tokenId
    };

    console.log('NFT metadata generated successfully for token:', tokenId);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('NFT metadata generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Metadata generation failed' },
      { status: 500 }
    );
  }
})

// GET endpoint for public metadata retrieval (no auth required)
const publicGET = optionalAuth()(async (request: WalletAuthRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json(
        { success: false, error: 'Missing tokenId parameter' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Query your database for the NFT metadata
    // 2. Return the stored metadata or IPFS URL
    
    // For now, return a basic response
    const metadata = {
      name: `ServiceFlow AI Art #${tokenId}`,
      description: `AI-generated artwork created with ServiceFlow AI platform`,
      image: `https://api.serviceflow.ai/nft/image/${tokenId}`,
      external_url: `https://serviceflow.ai/nft/${tokenId}`,
      attributes: [
        {
          trait_type: "Platform",
          value: "ServiceFlow AI"
        },
        {
          trait_type: "Blockchain",
          value: "Sonic"
        }
      ]
    };

    return NextResponse.json(metadata);

  } catch (error: any) {
    console.error('NFT metadata retrieval error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Metadata retrieval failed' },
      { status: 500 }
    );
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

// Export authenticated handlers
export async function POST(request: NextRequest) {
  return authenticatedPOST(request)
}

export async function GET(request: NextRequest) {
  return publicGET(request)
}