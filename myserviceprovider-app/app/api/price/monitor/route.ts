import { NextRequest, NextResponse } from 'next/server';

const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com/latest/dex';
const SONIC_CHAIN_ID = 'sonic';

// Cache configuration
const CACHE_TTL = 30000; // 30 seconds in milliseconds
let monitorCache: Map<string, { data: any; timestamp: number }> = new Map();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const addressesParam = searchParams.get('addresses');
    
    if (!addressesParam) {
      return NextResponse.json({
        error: 'No addresses provided',
        message: 'Please provide contract addresses to monitor',
        example: '/api/price/monitor?addresses=0xabc...,0xdef...'
      }, { status: 400 });
    }

    const addresses = addressesParam.split(',').map(addr => addr.trim()).filter(Boolean);
    
    if (addresses.length === 0 || addresses.length > 10) {
      return NextResponse.json({
        error: 'Invalid address count',
        message: 'Please provide 1-10 contract addresses'
      }, { status: 400 });
    }

    // Fetch data for all addresses in parallel
    const results = await Promise.allSettled(
      addresses.map(async (address) => {
        // Check cache first
        const cacheKey = `monitor_${address.toLowerCase()}`;
        const cached = monitorCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
          return cached.data;
        }

        try {
          // Search for pairs by token address
          const response = await fetch(`${DEXSCREENER_BASE_URL}/search/?q=${address}`, {
            headers: {
              'User-Agent': 'ServiceFlow-AI/1.0'
            }
          });
          
          if (!response.ok) {
            throw new Error(`DexScreener search error: ${response.status}`);
          }

          const data = await response.json();
          const sonicPairs = data.pairs?.filter((pair: any) => 
            pair.chainId === SONIC_CHAIN_ID && 
            pair.baseToken.address.toLowerCase() === address.toLowerCase()
          ) || [];

          if (sonicPairs.length === 0) {
            throw new Error(`No trading pairs found for contract ${address} on Sonic`);
          }

          // Get the most liquid pair
          const bestPair = sonicPairs.reduce((best: any, current: any) => 
            (parseFloat(current.liquidity?.usd) || 0) > (parseFloat(best.liquidity?.usd) || 0) ? current : best
          );

          const result = {
            contractAddress: address,
            symbol: bestPair.baseToken.symbol,
            name: bestPair.baseToken.name,
            price: parseFloat(bestPair.priceUsd) || 0,
            priceChange24h: parseFloat(bestPair.priceChange?.h24) || 0,
            volume24h: parseFloat(bestPair.volume?.h24) || 0,
            liquidity: parseFloat(bestPair.liquidity?.usd) || 0,
            marketCap: parseFloat(bestPair.fdv) || 0,
            pairAddress: bestPair.pairAddress,
            dexId: bestPair.dexId,
            quoteToken: bestPair.quoteToken.symbol,
            availablePairs: sonicPairs.length,
            timestamp: Date.now(),
            source: 'dexscreener',
            display: {
              priceFormatted: `$${(parseFloat(bestPair.priceUsd) || 0).toFixed(8)}`,
              change24hFormatted: `${(parseFloat(bestPair.priceChange?.h24) || 0).toFixed(2)}%`,
              volume24hFormatted: `$${(parseFloat(bestPair.volume?.h24) || 0).toLocaleString()}`,
              liquidityFormatted: `$${(parseFloat(bestPair.liquidity?.usd) || 0).toLocaleString()}`,
              marketCapFormatted: `$${(parseFloat(bestPair.fdv) || 0).toLocaleString()}`
            }
          };

          // Update cache
          monitorCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });

          return result;

        } catch (error: any) {
          throw new Error(`Failed to fetch data for ${address}: ${error.message}`);
        }
      })
    );

    const monitorResults = results.map((result, index) => ({
      address: addresses[index],
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));

    const response = {
      monitoredAddresses: addresses.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results: monitorResults,
      timestamp: Date.now(),
      source: 'dexscreener-monitor'
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Contract monitor error:', error);
    return NextResponse.json({
      error: 'Failed to monitor contracts',
      message: error.message
    }, { status: 500 });
  }
}

// Add CORS support
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}