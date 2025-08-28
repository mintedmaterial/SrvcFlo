// app/api/contracts/events/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const chainId = searchParams.get('chainId') || '57054'; // Default to Sonic testnet
    const decode = searchParams.get('decode') || 'true';
    const limit = searchParams.get('limit') || '20';
    const page = searchParams.get('page') || '0';
    
    if (!address) {
      return NextResponse.json(
        { error: 'Contract address is required' },
        { status: 400 }
      );
    }
    
    // Use Thirdweb MCP to get contract events
    const response = await fetch(`https://api.thirdweb.com/v1/contracts/${address}/events`, {
      method: 'GET',
      headers: {
        'x-secret-key': process.env.THIRDWEB_SECRET_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chainId: parseInt(chainId),
        decode: decode === 'true',
        limit: parseInt(limit),
        page: parseInt(page)
      })
    });
    
    if (!response.ok) {
      throw new Error(`Thirdweb API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      events: data.result || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: data.result?.length === parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching contract events:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch contract events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      address, 
      chainId = 57054, 
      eventSignatures = [], 
      userAddress,
      fromBlock,
      toBlock,
      limit = 100 
    } = body;
    
    if (!address) {
      return NextResponse.json(
        { error: 'Contract address is required' },
        { status: 400 }
      );
    }
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      chainId: chainId.toString(),
      decode: 'true',
      limit: limit.toString()
    });
    
    if (fromBlock) queryParams.append('startTime', fromBlock.toString());
    if (toBlock) queryParams.append('endTime', toBlock.toString());
    
    const response = await fetch(`https://api.thirdweb.com/v1/contracts/${address}/events?${queryParams}`, {
      headers: {
        'x-secret-key': process.env.THIRDWEB_SECRET_KEY || '',
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Thirdweb API error: ${response.status}`);
    }
    
    const data = await response.json();
    let events = data.result || [];
    
    // Filter by event signatures if specified
    if (eventSignatures.length > 0) {
      events = events.filter((event: any) => 
        eventSignatures.includes(event.eventName) ||
        eventSignatures.some((sig: string) => event.signature?.includes(sig))
      );
    }
    
    // Filter by user address if specified
    if (userAddress) {
      events = events.filter((event: any) => {
        const eventData = event.decodedLog || event;
        
        // Check common user-related fields
        return (
          eventData.args?.user?.toLowerCase() === userAddress.toLowerCase() ||
          eventData.args?.from?.toLowerCase() === userAddress.toLowerCase() ||
          eventData.args?.to?.toLowerCase() === userAddress.toLowerCase() ||
          eventData.args?.creator?.toLowerCase() === userAddress.toLowerCase() ||
          eventData.args?.voter?.toLowerCase() === userAddress.toLowerCase() ||
          eventData.args?.payer?.toLowerCase() === userAddress.toLowerCase()
        );
      });
    }
    
    // Sort by block number (descending)
    events.sort((a: any, b: any) => Number(b.blockNumber) - Number(a.blockNumber));
    
    return NextResponse.json({
      success: true,
      events,
      count: events.length,
      filters: {
        userAddress,
        eventSignatures,
        fromBlock,
        toBlock
      }
    });
    
  } catch (error) {
    console.error('Error fetching filtered contract events:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch contract events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}