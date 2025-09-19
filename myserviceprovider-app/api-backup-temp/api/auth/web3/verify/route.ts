import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateUser } from '@auth0/nextjs-auth0';
import { ethers } from 'ethers';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { walletAddress, signature, message, chainId, timestamp } = await request.json();

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Verify the message contains the expected wallet address
    if (!message.includes(walletAddress)) {
      return NextResponse.json({ error: 'Message does not match wallet address' }, { status: 400 });
    }

    // Check timestamp is recent (within 5 minutes)
    const now = Date.now();
    if (now - timestamp > 5 * 60 * 1000) {
      return NextResponse.json({ error: 'Message expired' }, { status: 400 });
    }

    // Create Web3 claims object
    const web3Claims = {
      walletAddress: walletAddress.toLowerCase(),
      chainId,
      signature,
      message,
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };

    // Update Auth0 user metadata
    try {
      await updateUser(session.user.sub, {
        user_metadata: {
          ...session.user.user_metadata,
          web3: web3Claims,
        },
      });
    } catch (auth0Error) {
      console.error('Error updating Auth0 user:', auth0Error);
      // Continue without failing - the verification was successful
    }

    // Fetch additional user data from Cloudflare Worker
    let additionalData = {};
    try {
      const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
      if (workerUrl) {
        const response = await fetch(`${workerUrl}/api/user-stats`, {
          headers: {
            'X-User-Address': walletAddress,
          },
        });
        
        if (response.ok) {
          additionalData = await response.json();
        }
      }
    } catch (error) {
      console.error('Error fetching user data from Cloudflare Worker:', error);
    }

    return NextResponse.json({
      success: true,
      web3Claims,
      userData: additionalData,
    });

  } catch (error: any) {
    console.error('Web3 verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}