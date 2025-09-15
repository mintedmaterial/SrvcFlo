import { NextResponse } from "next/server"
import type { TokenPair } from "@/components/market-data-table"

// Define the DexScreener response type based on the schema
interface DexScreenerResponse {
  schemaVersion: string
  pairs: DexPair[]
}

interface DexPair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  labels?: string[]
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceNative: string
  priceUsd: string
  txns: {
    m5: { buys: number; sells: number }
    h1: { buys: number; sells: number }
    h6: { buys: number; sells: number }
    h24: { buys: number; sells: number }
  }
  volume: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  priceChange: {
    h1: number
    h6: number
    h24: number
  }
  liquidity: {
    usd: number
    base: number
    quote: number
  }
  fdv?: number
  marketCap?: number
  pairCreatedAt: number
  info?: {
    imageUrl?: string
    header?: string
    openGraph?: string
    websites?: { label: string; url: string }[]
    socials?: { type: string; url: string }[]
  }
}

// Helper function to get a background color based on token symbol
function getTokenColor(symbol: string): string {
  const colorMap: Record<string, string> = {
    SHADOW: "bg-gray-500",
    wS: "bg-purple-500",
    S: "bg-purple-500",
    SONIC: "bg-purple-500",
    ETH: "bg-blue-500",
    USDC: "bg-blue-500",
    METRO: "bg-blue-500",
    EQUAL: "bg-teal-500",
    BEETS: "bg-green-500",
    BTC: "bg-yellow-500",
    OIL: "bg-amber-600",
  }

  return colorMap[symbol] || "bg-gray-500"
}

// Helper function to format numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`
  } else {
    return `$${num.toFixed(2)}`
  }
}

// Calculate estimated APR based on 24h volume and liquidity
function calculateEstimatedAPR(volume24h: number, liquidity: number, feePercent = 0.3): string {
  // Daily fee volume * 365 / liquidity * 100 = APR%
  const dailyFees = volume24h * (feePercent / 100)
  const annualFees = dailyFees * 365
  const apr = (annualFees / liquidity) * 100

  // Return formatted APR with 2 decimal places
  return `${apr.toFixed(2)}%`
}

export async function GET() {
  try {
    // Fetch data from DexScreener API
    const response = await fetch("https://api.dexscreener.com/latest/dex/search?q=Sonic%2FwS", {
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`)
    }

    const data: DexScreenerResponse = await response.json()

    // Transform the data to match our TokenPair interface
    const tokenPairs: TokenPair[] = data.pairs.map((pair) => {
      // Determine fee percentage based on dexId or labels
      let feePercent = 0.3 // Default fee
      if (pair.dexId === "shadow-exchange") {
        feePercent = 0.8
      } else if (pair.labels?.includes("v3")) {
        feePercent = 0.3
      }

      // Calculate estimated 24h fees
      const fee24h = pair.volume.h24 * (feePercent / 100)

      // Calculate estimated APR
      const apr = calculateEstimatedAPR(pair.volume.h24, pair.liquidity.usd, feePercent)

      return {
        name: `${pair.baseToken.symbol}-${pair.quoteToken.symbol}`,
        symbol1: pair.baseToken.symbol.charAt(0),
        symbol2: pair.quoteToken.symbol.charAt(0),
        icon1: getTokenColor(pair.baseToken.symbol),
        icon2: getTokenColor(pair.quoteToken.symbol),
        protocol: pair.dexId
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        fees: `${feePercent.toFixed(2)}% Fees`,
        liquidity: formatNumber(pair.liquidity.usd),
        volume24h: formatNumber(pair.volume.h24),
        fee24h: formatNumber(fee24h),
        apr: apr,
      }
    })

    return NextResponse.json({ pairs: tokenPairs })
  } catch (error) {
    console.error("Error fetching DexScreener data:", error)
    return NextResponse.json({ error: "Failed to fetch DexScreener data" }, { status: 500 })
  }
}