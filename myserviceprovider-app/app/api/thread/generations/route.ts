import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'upvotes';

    // Mock thread generations data
    // In production, this would fetch from database/contract events
    const mockGenerations = [
      {
        id: 'gen_thread_1',
        type: 'image',
        prompt: 'A mystical dragon flying over a cyberpunk city',
        result: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        walletAddress: '0x1234567890123456789012345678901234567890',
        paymentMethod: 'USDC',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef12',
        upvotes: 15,
        downvotes: 2,
        leaderboardPoints: 150,
        userVote: null
      },
      {
        id: 'gen_thread_2',
        type: 'image',
        prompt: 'A peaceful forest with magical creatures',
        result: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        walletAddress: '0x2345678901234567890123456789012345678901',
        paymentMethod: 'S',
        transactionHash: '0xdef1234567890abcdef1234567890abcdef1234',
        upvotes: 8,
        downvotes: 1,
        leaderboardPoints: 85,
        userVote: null
      },
      {
        id: 'gen_thread_3',
        type: 'video',
        prompt: 'Time-lapse of a flower blooming',
        result: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        walletAddress: '0x3456789012345678901234567890123456789012',
        paymentMethod: 'free',
        upvotes: 12,
        downvotes: 0,
        leaderboardPoints: 120,
        userVote: null
      }
    ];

    // Sort generations
    let sortedGenerations = [...mockGenerations];
    switch (sort) {
      case 'upvotes':
        sortedGenerations.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
        break;
      case 'points':
        sortedGenerations.sort((a, b) => b.leaderboardPoints - a.leaderboardPoints);
        break;
      case 'recent':
        sortedGenerations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return NextResponse.json({
      success: true,
      generations: sortedGenerations
    });

  } catch (error: any) {
    console.error('Thread generations API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}