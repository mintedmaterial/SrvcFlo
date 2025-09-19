import { NextRequest, NextResponse } from 'next/server';

interface UserCredits {
  standardCredits: number;
  nftCredits: Array<{ packageId: number; balance: number; creditAmount: number }>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // For now, return mock data that matches the correct credit packages
    // In production, this would fetch from your database and blockchain
    const userCredits: UserCredits = {
      standardCredits: 1500, // Mock standard credits
      nftCredits: [
        // Mock NFT credit packages with correct credit amounts including wS bonuses
        { packageId: 1, balance: 2, creditAmount: 1000 },   // Starter Pack with wS bonus
        { packageId: 2, balance: 1, creditAmount: 10000 }   // Pro Pack with wS bonus
      ]
    };

    return NextResponse.json(userCredits);
  } catch (error: any) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}