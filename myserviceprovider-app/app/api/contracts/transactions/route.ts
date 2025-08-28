// app/api/contracts/transactions/route.ts
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
    
    // Use Thirdweb MCP to get contract transactions
    // This would be called via the MCP server in a real implementation
    const response = await fetch(`https://api.thirdweb.com/v1/contracts/${address}/transactions`, {
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
      transactions: data.result || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: data.result?.length === parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching contract transactions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch contract transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { addresses, chainId = 57054, decode = true, limit = 20 } = body;
    
    if (!addresses || !Array.isArray(addresses)) {
      return NextResponse.json(
        { error: 'Addresses array is required' },
        { status: 400 }
      );
    }
    
    // Fetch transactions for multiple contracts
    const transactionPromises = addresses.map(async (address: string) => {
      try {
        const response = await fetch(`https://api.thirdweb.com/v1/contracts/${address}/transactions`, {
          method: 'GET',
          headers: {
            'x-secret-key': process.env.THIRDWEB_SECRET_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chainId,
            decode,
            limit
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch transactions for ${address}`);
        }
        
        const data = await response.json();
        return {
          address,
          transactions: data.result || [],
          success: true
        };
      } catch (error) {
        return {
          address,
          transactions: [],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
    
    const results = await Promise.all(transactionPromises);
    
    return NextResponse.json({
      success: true,
      results
    });
    
  } catch (error) {
    console.error('Error fetching multiple contract transactions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch contract transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}