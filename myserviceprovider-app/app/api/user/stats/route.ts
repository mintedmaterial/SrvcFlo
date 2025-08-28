import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, WalletAuthRequest, WalletAuthAPIMiddleware } from '../../../lib/wallet-auth-api-middleware';

// Apply wallet authentication middleware
const authenticatedPOST = requireAuth({
  requiredPermissions: ['read_status'],
  requireOwnership: false,
  rateLimitPerMinute: 60
})(async (request: WalletAuthRequest) => {
  try {
    const body = await request.json();
    const { userAddress } = body;

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address required' },
        { status: 400 }
      );
    }

    // Verify the authenticated wallet matches the request
    if (request.walletAuth?.walletAddress.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Wallet address mismatch' },
        { status: 403 }
      );
    }

    // Mock user stats - in production this would query the smart contracts and database
    const mockStats = {
      success: true,
      stats: {
        totalGenerationsCreated: 5,
        totalUpvotesReceived: 12,
        leaderboardPoints: 150,
        weeklyRank: 42,
        globalRank: 1337,
        canVote: true, // This would check if user has the required NFT
        freeGenerationsUsedToday: 2,
        freeGenerationsRemaining: 1,
        creditsBalance: 5
      }
    };

    return NextResponse.json(mockStats);

  } catch (error: any) {
    console.error('User stats API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
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

// Export authenticated POST handler
export async function POST(request: NextRequest) {
  return authenticatedPOST(request)
}