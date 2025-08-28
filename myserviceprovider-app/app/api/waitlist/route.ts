import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Mock waitlist data for local development
    const mockWaitlistData = {
      success: true,
      waitlistCount: 1247,
      userPosition: null,
      isUserOnWaitlist: false
    };

    return NextResponse.json(mockWaitlistData);
  } catch (error: any) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waitlist data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Mock waitlist signup
    console.log('Waitlist signup:', email);

    return NextResponse.json({
      success: true,
      message: 'Successfully added to waitlist',
      position: Math.floor(Math.random() * 1000) + 1000
    });
  } catch (error: any) {
    console.error('Waitlist signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}