import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, WalletAuthRequest, WalletAuthAPIMiddleware } from '@/lib/wallet-auth-api-middleware';

export const dynamic = 'force-dynamic';

// Apply wallet authentication middleware
const authenticatedPOST = requireAuth({
  requiredPermissions: ['read_status'],
  requireOwnership: false,
  rateLimitPerMinute: 30
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

    // Mock user generations - in production this would query the database
    const mockGenerations = {
      success: true,
      generations: [
        {
          id: 'gen_1234567890_abc123',
          type: 'image',
          prompt: 'A beautiful sunset over mountains',
          status: 'completed',
          result: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          walletAddress: userAddress,
          paymentMethod: 'free',
          submittedToThread: true
        },
        {
          id: 'gen_1234567891_def456',
          type: 'image',
          prompt: 'A futuristic city with flying cars',
          status: 'completed',
          result: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
          createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          walletAddress: userAddress,
          paymentMethod: 'S',
          transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
          submittedToThread: true
        }
      ]
    };

    return NextResponse.json(mockGenerations);

  } catch (error: any) {
    console.error('User generations API error:', error);
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