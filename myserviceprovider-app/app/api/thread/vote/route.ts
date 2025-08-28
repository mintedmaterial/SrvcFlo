import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { generationId, voteType, voterAddress } = body;

    if (!generationId || !voteType || !voterAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate vote type
    if (!['up', 'down'].includes(voteType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vote type' },
        { status: 400 }
      );
    }

    console.log('Vote request:', { generationId, voteType, voterAddress });

    // In production, this would:
    // 1. Check if user has voting power (staked NFTs)
    // 2. Record vote in contract/database
    // 3. Update leaderboard points
    // 4. Prevent duplicate voting

    // Mock response with updated vote counts
    const mockResponse = {
      success: true,
      newUpvotes: voteType === 'up' ? 16 : 15, // Mock increment
      newDownvotes: voteType === 'down' ? 3 : 2, // Mock increment
      newPoints: voteType === 'up' ? 160 : 140, // Mock point calculation
      message: `Vote ${voteType} recorded successfully`
    };

    return NextResponse.json(mockResponse);

  } catch (error: any) {
    console.error('Voting API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}