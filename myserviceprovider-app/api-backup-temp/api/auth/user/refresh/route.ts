import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateUser } from '@auth0/nextjs-auth0';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Fetch fresh user data from Cloudflare Worker
    let userData = {};
    let creditBalances = {};
    let agentData = {};

    try {
      const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
      if (workerUrl) {
        // Get user stats
        const statsResponse = await fetch(`${workerUrl}/api/user-stats`, {
          headers: {
            'X-User-Address': walletAddress,
          },
        });
        
        if (statsResponse.ok) {
          userData = await statsResponse.json();
        }

        // Get agent revenue info (if available)
        try {
          const revenueResponse = await fetch(`${workerUrl}/api/agent/revenue`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Address': walletAddress,
            },
            body: JSON.stringify({ userAddress: walletAddress }),
          });
          
          if (revenueResponse.ok) {
            agentData = await revenueResponse.json();
          }
        } catch (revenueError) {
          console.error('Error fetching agent revenue:', revenueError);
        }
      }
    } catch (error) {
      console.error('Error fetching user data from Cloudflare Worker:', error);
    }

    // Fetch blockchain data (FLOAI and S token balances)
    let blockchainData = {};
    try {
      // This would integrate with your Sonic blockchain contracts
      // For now, we'll use placeholder data
      blockchainData = {
        floaiBalance: 0,
        sTokenBalance: 0,
        // Additional blockchain-specific data
      };
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
    }

    // Combine all data
    const refreshedData = {
      ...userData,
      ...agentData,
      ...blockchainData,
      lastRefreshed: new Date().toISOString(),
    };

    // Update Auth0 user metadata with fresh data
    try {
      await updateUser(session.user.sub, {
        user_metadata: {
          ...session.user.user_metadata,
          serviceflow: refreshedData,
          web3: {
            ...session.user.user_metadata?.web3,
            lastActivity: new Date().toISOString(),
          },
        },
      });
    } catch (auth0Error) {
      console.error('Error updating Auth0 user metadata:', auth0Error);
      // Continue without failing - return the data anyway
    }

    return NextResponse.json({
      success: true,
      userData: refreshedData,
    });

  } catch (error: any) {
    console.error('User data refresh error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to refresh user data' },
      { status: 500 }
    );
  }
}