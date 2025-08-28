import { NextRequest, NextResponse } from 'next/server'

interface PriceOption {
  token: string
  tokenName: string
  amount: number
  amountFormatted: string
  amountDecimals: string
  pricePerToken: number
  summary: string
}

interface PricingData {
  image: {
    service: string
    targetUSD: number
    targetFormatted: string
    options: PriceOption[]
  }
  video: {
    service: string
    targetUSD: number
    targetFormatted: string
    options: PriceOption[]
  }
}

interface PriceResponse {
  network: string
  networkDisplay: string
  pricing: PricingData
  timestamp: number
  cacheDuration: string
  source: 'openocean' | 'fallback'
}

// In-memory cache for development (use Redis/KV in production)
interface CacheEntry {
  data: PriceResponse
  timestamp: number
}

const priceCache = new Map<string, CacheEntry>()
const CACHE_DURATION = 3 * 60 * 1000 // 3 minutes in milliseconds
const OPENOCEAN_API_KEY = 'nUvg4KhYQ1NdItTI8M4tgMNiktDRq5IS'

// Rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 30 // requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || realIP || 'unknown'
}

function isRateLimited(clientIP: string): boolean {
  const now = Date.now()
  const clientData = requestCounts.get(clientIP)
  
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientIP, { count: 1, resetTime: now + RATE_WINDOW })
    return false
  }
  
  if (clientData.count >= RATE_LIMIT) {
    return true
  }
  
  clientData.count++
  return false
}

function validateNetwork(network: string): 'mainnet' | 'testnet' {
  return network === 'testnet' ? 'testnet' : 'mainnet'
}

function sanitizeNumber(value: any): number {
  const num = parseFloat(value)
  if (isNaN(num) || num < 0 || num > 1000) {
    return 1 // default fallback
  }
  return num
}

async function fetchOpenOceanPrice(): Promise<number | null> {
  try {
    // Fetch wS to USDC price from OpenOcean API
    const response = await fetch(`https://open-api.openocean.finance/v3/sonic/gasPrice`, {
      headers: {
        'accept': 'application/json',
        'X-API-KEY': OPENOCEAN_API_KEY,
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      console.warn(`OpenOcean API error: ${response.status}`)
      return null
    }

    // Try quote endpoint for wS/USDC price
    const quoteResponse = await fetch(`https://open-api.openocean.finance/v3/sonic/quote?inTokenAddress=0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38&outTokenAddress=0x29219dd400f2Bf60E5a23d13Be72B486D4038894&amount=1000000000000000000&gasPrice=1000000000`, {
      headers: {
        'accept': 'application/json',
        'X-API-KEY': OPENOCEAN_API_KEY,
      },
      cache: 'no-store'
    })

    if (quoteResponse.ok) {
      const quoteData = await quoteResponse.json()
      if (quoteData && quoteData.outAmount) {
        // Calculate price: 1 wS = outAmount USDC (considering decimals)
        const wsPrice = parseFloat(quoteData.outAmount) / 1000000 // USDC has 6 decimals
        console.log(`OpenOcean wS price: $${wsPrice}`)
        return wsPrice
      }
    }

    return null
  } catch (error) {
    console.error('OpenOcean API error:', error)
    return null
  }
}

function createPricingData(network: string, imagePrice: number, videoPrice: number, wsPrice: number, source: 'openocean' | 'fallback'): PriceResponse {
  const isMainnet = network === 'mainnet'
  
  // Calculate amounts based on current wS price
  const imageWsAmount = imagePrice / wsPrice
  const videoWsAmount = videoPrice / wsPrice
  
  return {
    network,
    networkDisplay: isMainnet ? 'Sonic Mainnet' : 'Sonic Testnet',
    pricing: {
      image: {
        service: 'AI Image Generation',
        targetUSD: imagePrice,
        targetFormatted: `$${imagePrice.toFixed(2)} USD`,
        options: [
          {
            token: 'wS',
            tokenName: 'Wrapped Sonic',
            amount: imageWsAmount,
            amountFormatted: `${imageWsAmount.toFixed(2)} wS`,
            amountDecimals: imageWsAmount.toFixed(18),
            pricePerToken: wsPrice,
            summary: `${imageWsAmount.toFixed(2)} wS (~$${imagePrice.toFixed(2)})`
          },
          {
            token: 'USDC',
            tokenName: 'USD Coin',
            amount: imagePrice,
            amountFormatted: `${imagePrice.toFixed(2)} USDC`,
            amountDecimals: (imagePrice * 1e6).toString(),
            pricePerToken: 1.0,
            summary: `${imagePrice.toFixed(2)} USDC ($${imagePrice.toFixed(2)})`
          }
        ]
      },
      video: {
        service: 'AI Video Generation',
        targetUSD: videoPrice,
        targetFormatted: `$${videoPrice.toFixed(2)} USD`,
        options: [
          {
            token: 'wS',
            tokenName: 'Wrapped Sonic',
            amount: videoWsAmount,
            amountFormatted: `${videoWsAmount.toFixed(2)} wS`,
            amountDecimals: videoWsAmount.toFixed(18),
            pricePerToken: wsPrice,
            summary: `${videoWsAmount.toFixed(2)} wS (~$${videoPrice.toFixed(2)})`
          },
          {
            token: 'USDC',
            tokenName: 'USD Coin',
            amount: videoPrice,
            amountFormatted: `${videoPrice.toFixed(2)} USDC`,
            amountDecimals: (videoPrice * 1e6).toString(),
            pricePerToken: 1.0,
            summary: `${videoPrice.toFixed(2)} USDC ($${videoPrice.toFixed(2)})`
          }
        ]
      }
    },
    timestamp: Date.now(),
    cacheDuration: source === 'openocean' ? '3min' : 'fallback-3min',
    source
  }
}

async function fetchPriceData(network: string, imagePrice: number, videoPrice: number): Promise<PriceResponse> {
  const cacheKey = `${network}-${imagePrice}-${videoPrice}`
  const now = Date.now()
  
  // Check cache first
  const cached = priceCache.get(cacheKey)
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log('Returning cached price data')
    return cached.data
  }
  
  console.log('Fetching fresh price data from OpenOcean')
  
  // Fetch fresh data from OpenOcean
  const wsPrice = await fetchOpenOceanPrice()
  
  let priceData: PriceResponse
  
  if (wsPrice && wsPrice > 0) {
    priceData = createPricingData(network, imagePrice, videoPrice, wsPrice, 'openocean')
    console.log(`Using OpenOcean price: $${wsPrice} per wS`)
  } else {
    // Fallback to static price if OpenOcean fails
    const fallbackPrice = 0.305 // Default fallback
    priceData = createPricingData(network, imagePrice, videoPrice, fallbackPrice, 'fallback')
    console.warn(`OpenOcean failed, using fallback price: $${fallbackPrice} per wS`)
  }
  
  // Update cache
  priceCache.set(cacheKey, {
    data: priceData,
    timestamp: now
  })
  
  return priceData
}

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    
    // Rate limiting check
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 30 requests per minute.' },
        { status: 429 }
      )
    }
    
    // Extract and validate query parameters
    const { searchParams } = new URL(request.url)
    const networkParam = searchParams.get('network') || 'mainnet'
    const imagePriceParam = searchParams.get('imagePrice') || '1'
    const videoPriceParam = searchParams.get('videoPrice') || '2'
    
    const network = validateNetwork(networkParam)
    const imagePrice = sanitizeNumber(imagePriceParam)
    const videoPrice = sanitizeNumber(videoPriceParam)
    
    console.log(`Price API: Fetching for network=${network}, imagePrice=${imagePrice}, videoPrice=${videoPrice}`)
    
    const priceData = await fetchPriceData(network, imagePrice, videoPrice)
    
    return NextResponse.json(priceData, {
      headers: {
        'Cache-Control': 'public, max-age=180, s-maxage=180', // 3 minutes
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
    
  } catch (error) {
    console.error('Price API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error while fetching price data' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}