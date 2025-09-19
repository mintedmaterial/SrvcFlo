import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { generationId, userAddress } = await request.json();

    if (!generationId || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' }, 
        { status: 400 }
      );
    }

    console.log(`💾 Saving generation to user collection:`, {
      generationId,
      userAddress
    });

    // For now, simulate successful save
    // In production, this would save to your database
    const result = {
      success: true,
      generationId,
      savedAt: new Date().toISOString()
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error saving generation:', error);
    return NextResponse.json(
      { error: 'Failed to save generation' },
      { status: 500 }
    );
  }
}