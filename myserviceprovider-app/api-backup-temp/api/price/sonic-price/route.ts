import { NextRequest, NextResponse } from 'next/server';

const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com/latest/dex';
const SONIC_CHAIN_ID = 'sonic';
const SONIC_WS_PAIR = '0xb1bc4b830fcba2184b92e15b9133c41160518038';

// Cache configuration
const CACHE_TTL = 30000; // 30 seconds in milliseconds
let priceCache: { price: number; timestamp: number } | null = null;

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    if (priceCache && (Date.now() - priceCache.timestamp) < CACHE_TTL) {
      return NextResponse.json({
        symbol: 'S',
        name: 'Sonic',
        price: priceCache.price,
        source: 'cache',
        timestamp: priceCache.timestamp,
        display: {
          priceFormatted: `$${priceCache.price.toFixed(6)}`,
          network: 'Sonic Mainnet'
        }
      });
    }

    // Try to fetch from DexScreener
    try {
      console.log('Fetching Sonic price from DexScreener...');
      const response = await fetch(`${DEXSCREENER_BASE_URL}/pairs/${SONIC_CHAIN_ID}/${SONIC_WS_PAIR}`, {
        headers: {
          'User-Agent': 'ServiceFlow-AI/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status}`);
      }

      const data = await response.json();
      const pair = data.pairs?.[0];

      if (!pair || !pair.priceUsd) {
        throw new Error('Invalid pair data from DexScreener');
      }

      const price = parseFloat(pair.priceUsd);
      
      // Update cache
      priceCache = {
        price,
        timestamp: Date.now()
      };

      console.log(`Sonic price updated: $${price}`);

      return NextResponse.json({
        symbol: 'S',
        name: 'Sonic',
        price,
        priceChange24h: parseFloat(pair.priceChange?.h24) || 0,
        volume24h: parseFloat(pair.volume?.h24) || 0,
        liquidity: parseFloat(pair.liquidity?.usd) || 0,
        pairAddress: SONIC_WS_PAIR,
        dexId: pair.dexId,
        source: 'dexscreener',
        timestamp: Date.now(),
        display: {
          priceFormatted: `$${price.toFixed(6)}`,
          change24hFormatted: `${(parseFloat(pair.priceChange?.h24) || 0).toFixed(2)}%`,
          volume24hFormatted: `$${(parseFloat(pair.volume?.h24) || 0).toLocaleString()}`,
          liquidityFormatted: `$${(parseFloat(pair.liquidity?.usd) || 0).toLocaleString()}`,
          network: 'Sonic Mainnet'
        }
      });

    } catch (dexError) {
      console.error('DexScreener error:', dexError);
      
      // Fallback to CoinGecko or other sources
      try {
        console.log('Trying CoinGecko as fallback...');
        const cgResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=sonic&vs_currencies=usd', {
          headers: {
            'User-Agent': 'ServiceFlow-AI/1.0'
          }
        });

        if (cgResponse.ok) {
          const cgData = await cgResponse.json();
          const price = cgData.sonic?.usd || 0.305;
          
          // Update cache with fallback price
          priceCache = {
            price,
            timestamp: Date.now()
          };

          return NextResponse.json({
            symbol: 'S',
            name: 'Sonic',
            price,
            source: 'coingecko_fallback',
            timestamp: Date.now(),
            display: {
              priceFormatted: `$${price.toFixed(6)}`,
              network: 'Sonic Mainnet'
            }
          });
        }
      } catch (cgError) {
        console.error('CoinGecko fallback error:', cgError);
      }

      // Final fallback to static price
      const fallbackPrice = 0.305;
      
      // Update cache with fallback
      priceCache = {
        price: fallbackPrice,
        timestamp: Date.now()
      };

      console.log(`Using fallback Sonic price: $${fallbackPrice}`);

      return NextResponse.json({
        symbol: 'S',
        name: 'Sonic',
        price: fallbackPrice,
        source: 'fallback',
        timestamp: Date.now(),
        error: 'External APIs unavailable',
        display: {
          priceFormatted: `$${fallbackPrice.toFixed(6)}`,
          network: 'Sonic Mainnet'
        }
      });
    }

  } catch (error: any) {
    console.error('Sonic price API error:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch Sonic price',
      message: error.message,
      price: 0.305, // Emergency fallback
      source: 'emergency_fallback',
      timestamp: Date.now()
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