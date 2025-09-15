import { NextResponse } from "next/server"
import type { TokenPair } from "@/components/market-data-table"

// Define the Equalizer API response types
interface EqualizerStats {
  pairs: EqualizerPair[]
}

interface EqualizerPair {
  address: string
  token0: {
    symbol: string
    name: string
  }
  token1: {
    symbol: string
    name: string
  }
  tvlUSD: number
  volumeUSD24h: number
  feeTier: string
  apr?: number
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
  if (typeof num !== "number" || isNaN(num)) {
    return "$0.00"
  }

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
  try {
    if (!liquidity || liquidity === 0 || isNaN(liquidity) || isNaN(volume24h) || isNaN(feePercent)) {
      return "0.00%"
    }

    // Daily fee volume * 365 / liquidity * 100 = APR%
    const dailyFees = volume24h * (feePercent / 100)
    const annualFees = dailyFees * 365
    const apr = (annualFees / liquidity) * 100

    // Return formatted APR with 2 decimal places
    return `${apr.toFixed(2)}%`
  } catch (e) {
    console.log("Error in calculateEstimatedAPR:", e)
    return "0.00%"
  }
}

// Update the GET function to handle the new data structure
export async function GET() {
  try {
    console.log("Fetching data from Equalizer APIs...")

    // Fetch data from both Equalizer APIs with proper error handling
    let statsData: any = { pairs: [] }
    let pairsData: any = { data: {} }

    try {
      const statsResponse = await fetch("https://eqapi-sonic-prod-ltanm.ondigitalocean.app/sonic/stats/equalizer", {
        next: { revalidate: 300 }, // Cache for 5 minutes
      })

      if (statsResponse.ok) {
        statsData = await statsResponse.json()
        console.log(`Received ${statsData.pairs?.length || 0} pairs from Equalizer Stats API`)
      } else {
        console.error(`Equalizer Stats API error: ${statsResponse.status} ${statsResponse.statusText}`)
      }
    } catch (statsError) {
      console.error("Error fetching from Equalizer Stats API:", statsError)
    }

    try {
      const pairsResponse = await fetch("https://eqapi-sonic-prod-ltanm.ondigitalocean.app/sonic/v4/pairs/", {
        next: { revalidate: 300 }, // Cache for 5 minutes
      })

      if (pairsResponse.ok) {
        pairsData = await pairsResponse.json()
        console.log(`Received ${Object.keys(pairsData.data || {}).length} pairs from Equalizer Pairs API`)
      } else {
        console.error(`Equalizer Pairs API error: ${pairsResponse.status} ${pairsResponse.statusText}`)
      }
    } catch (pairsError) {
      console.error("Error fetching from Equalizer Pairs API:", pairsError)
    }

    // Convert the object of pairs to an array
    const pairsArray = Object.values(pairsData.data || {})
    console.log(`Converted ${pairsArray.length} pairs from object to array`)

    // Combine data from both endpoints
    const combinedData = [...(statsData.pairs || []), ...pairsArray]

    if (combinedData.length === 0) {
      console.warn("No data received from Equalizer APIs, using fallback data")
      return NextResponse.json({ pairs: getMockEqualizerPairs() })
    }

    // Transform the data to match our TokenPair interface
    const tokenPairs: TokenPair[] = combinedData
      .filter((pair: any) => {
        // Filter out any invalid pairs
        return (pair && pair.token0 && pair.token1) || (pair && pair.tvlUsd > 0)
      })
      .map((pair: any) => {
        try {
          // Extract fee percentage - default to 0.3% if not available
          let feePercent = 0.3
          try {
            if (pair.fee) {
              const parsedFee = Number.parseFloat(pair.fee)
              if (!isNaN(parsedFee)) {
                feePercent = parsedFee * 100
              }
            } else if (pair.feeTier) {
              const parsedFeeTier = Number.parseFloat(pair.feeTier)
              if (!isNaN(parsedFeeTier)) {
                feePercent = parsedFeeTier / 10000
              }
            }
          } catch (e) {
            console.log("Error parsing fee:", e)
          }

          // Get TVL and volume, with fallbacks
          let tvl = 0
          let volume = 0

          try {
            tvl =
              typeof pair.tvlUsd === "number"
                ? pair.tvlUsd
                : typeof pair.tvlUSD === "number"
                  ? pair.tvlUSD
                  : typeof pair.tvl === "number"
                    ? pair.tvl
                    : Number.parseFloat(pair.tvlUsd || pair.tvlUSD || pair.tvl || pair.liquidity || "0")
          } catch (e) {
            console.log("Error parsing TVL:", e)
          }

          try {
            volume =
              typeof pair.volumeUSD24h === "number"
                ? pair.volumeUSD24h
                : typeof pair.volume24h === "number"
                  ? pair.volume24h
                  : Number.parseFloat(pair.volumeUSD24h || pair.volume24h || "0")
          } catch (e) {
            console.log("Error parsing volume:", e)
          }

          // Calculate estimated 24h fees
          const fee24h = volume * feePercent

          // Calculate estimated APR if not provided
          let apr = "0.00%"
          try {
            if (pair.apr) {
              const parsedApr = Number.parseFloat(pair.apr)
              if (!isNaN(parsedApr)) {
                apr = `${parsedApr.toFixed(2)}%`
              }
            } else {
              apr = calculateEstimatedAPR(volume, tvl, feePercent)
            }
          } catch (e) {
            console.log("Error calculating APR:", e)
          }

          // Get token symbols
          const token0Symbol = pair.token0?.symbol || pair.symbol?.split("/")[0] || "EQUAL"
          const token1Symbol = pair.token1?.symbol || pair.symbol?.split("/")[1] || "SONIC"

          return {
            name: `${token0Symbol}-${token1Symbol}`,
            symbol1: token0Symbol.charAt(0),
            symbol2: token1Symbol.charAt(0),
            icon1: getTokenColor(token0Symbol),
            icon2: getTokenColor(token1Symbol),
            protocol: "Equalizer V4",
            fees: `${feePercent.toFixed(2)}% Fees`,
            liquidity: formatNumber(tvl),
            volume24h: formatNumber(volume),
            fee24h: formatNumber(fee24h),
            apr: apr,
          }
        } catch (err) {
          console.error("Error processing Equalizer pair:", err, pair)
          return null
        }
      })
      .filter(Boolean) // Remove any null entries from failed processing
      // Remove duplicates based on name
      .filter((pair, index, self) => index === self.findIndex((p) => p.name === pair.name))
      // Sort by liquidity (descending)
      .sort((a: TokenPair, b: TokenPair) => {
        try {
          const aLiquidity = Number.parseFloat(a.liquidity.replace(/[^0-9.]/g, "")) || 0
          const bLiquidity = Number.parseFloat(b.liquidity.replace(/[^0-9.]/g, "")) || 0
          return bLiquidity - aLiquidity
        } catch (err) {
          console.error("Error sorting pairs:", err)
          return 0
        }
      })
      // Take only the top 10
      .slice(0, 10)

    console.log(`Processed ${tokenPairs.length} Equalizer pairs successfully`)
    return NextResponse.json({ pairs: tokenPairs })
  } catch (error) {
    console.error("Error fetching Equalizer data:", error)

    // Return mock data as fallback
    return NextResponse.json({
      pairs: getMockEqualizerPairs(),
      error: `Failed to fetch Equalizer data: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

