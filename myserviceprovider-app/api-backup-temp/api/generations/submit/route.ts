import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const adminKey = authHeader?.replace('Bearer ', '');
    
    // Validate admin access
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      generationId,
      creator,
      prompt,
      resultUrl,
      type,
      paymentMethod,
      transactionHash
    } = body;

    // Validate required fields
    if (!generationId || !creator || !prompt || !resultUrl || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Store the generation in the database
    // 2. Submit it to the voting contract for community voting
    // 3. Update the generation thread
    
    console.log('Submitting generation to voting contract:', {
      generationId,
      creator,
      prompt,
      resultUrl,
      type,
      paymentMethod,
      transactionHash
    });

    // Mock successful submission
    return NextResponse.json({
      success: true,
      message: 'Generation submitted to voting contract successfully'
    });

  } catch (error: any) {
    console.error('Generation submission error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}