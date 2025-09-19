import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Credits API is working',
    timestamp: new Date().toISOString(),
    endpoints: {
      mint: '/api/credits/mint',
      balance: '/api/credits/balance'
    }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json({
    success: true,
    message: 'Credits test POST endpoint working',
    received: body,
    timestamp: new Date().toISOString()
  })
}