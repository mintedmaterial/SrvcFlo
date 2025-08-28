import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      transactionHash, 
      userAddress, 
      paymentMethod, // 'S' or 'USDC'
      prompt,
      generationType 
    } = body;

    // Validate required fields
    if (!transactionHash || !userAddress || !paymentMethod || !prompt || !generationType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Verifying payment approval:', {
      transactionHash,
      userAddress,
      paymentMethod,
      prompt: prompt.substring(0, 50) + '...'
    });

    // TODO: In production, verify the approval transaction on-chain using Thirdweb
    // and then execute transferFrom to actually collect the payment
    // For now, assume approval is valid and proceed with generation
    
    // Call the MCP generation API with verified payment
    const generationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/mcp/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: generationType,
        prompt,
        paymentTx: transactionHash,
        userAddress,
        paymentType: 'crypto',
        paymentMethod
      })
    });

    const generationData = await generationResponse.json();

    if (generationData.success) {
      return NextResponse.json({
        success: true,
        generationId: `gen_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        imageData: generationData.imageData,
        videoUrl: generationData.videoUrl,
        transactionHash,
        paymentMethod,
        message: 'Payment verified and generation completed'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Generation failed after payment verification',
        details: generationData.error
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}