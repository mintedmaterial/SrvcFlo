import { NextResponse } from "next/server"
import type { TokenPair } from "@/components/market-data-table"

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

// Helper function to format numbers with $ prefix
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
  if (!liquidity || liquidity === 0) return "0.00%"

  // Daily fee volume * 365 / liquidity * 100 = APR%
  const dailyFees = volume24h * (feePercent / 100)
  const annualFees = dailyFees * 365
  const apr = (annualFees / liquidity) * 100

  // Return formatted APR with 2 decimal places
  return `${apr.toFixed(2)}%`
}

export async function GET() {
  try {
    console.log("Fetching data from Metro API...")

    // Fetch data from Metro API
    const response = await fetch(
      "https://api-b.metropolis.exchange/api/v1/pools-classic-v2/?chainId=146&pairAddresses=0x7a2D923588afFDf40059A3375F750C78BC26a0BD,0x4C777fB7292Ad93797cF70E8aE60560cB7B5B805,0xdbAf4C3fb4f3007C6920690a7Af207E931d42037,0x9Fc6B2cadaa287d2c4D635231B51c96B8cc92859,0xAc6450DaF30C6DB4D000a443bee2264Bd7A1CC92,0xEbcCE8b534A35E93c7Cf25f3FfF2F8202F9f0655,0xd97233Ef59E21Bde4A62C91c99AA1b6aa18A5EA5,0x38A7689CFE589e23620d44B10aE71bF3b38667a9,0x6ea10f2bd54520c5EA9a988F34a07b89A2C1B441,0x56B404073C990E828691aF936bcfFf710f6c97A1,0xdD93c63fFC4B4a85daaec86a4752D616E03a3015,0x3F8A68140B09bD060F27c1A76CcE330291a103fE,0x7a36Dd5ecde194914C6b9Dee0b932e9D9E44152C,0x3B47c123973415951e080dC00ce45387EAae03aF,0x74717286ECb77Bfad051e3Db5Ec6433f2A6A1B9b,0x5015643B8dB50A1cB779A3e134176237d14ca67a,0x9577Ba24C8276572e5e1F98eBcB207133f9f2422,0x3987a13D675c66570bC28c955685a9bcA2dCF26e,0x449970c59d1eAD3AA5b587756f6B58012a311a6D,0x18536F666624C3Fb1C1266FE015C6e7828A09228,0xD6C1BEf61f9BA5c08746cf46BA19cF33F184111b,0x695Dd6522c5247Ca7b26A3585e609234bCa24192,0x27D85E244dd8ae1fe5010fc92C91602145BA8e82,0xFE1D557F530224b12F3c93AF154DcE73Dc947024,0x9f5fb66bEA62a247cECf652bDFEdDD0944ffA5A6,0x0a57C7aCE5307efEC570f33A92b2e4Fa5f7D4360,0x20ae8268F98412807109715ad5216Dc3998f89Ba,0x25F56aA4ABEd7073E746aEb2Cf0030D6982d0Bf8,0x4dE9Ae0aADC8fEFEA9CF008E7774fE380887b80f,0xA72fa090b7ea8F0407003860D1343E18a32f9839,0xBB9e9f35E5EdA1eeED3d811366501d940866268f,0x86be9e5aA45114f8F5Fa0b780a517919cb5ce849,0x11456271DeA7b10893c618349f7dfda9F7D1116E,0x302Eca0D685dE55Ff7F93b51C0D6cf02EE782B0E,0x953684EDcf221DfB23497f8392FF76201562416b,0x47E53F02b939316Ac4Fff4678c2014ca565bcf42,0xc0aac9BB9fb72a77e3bc8beE46D3E227C84a54C0,0xbc76Fe58639262a977A0D08Ea4cCd28EE82B778E,0x40AbED95DF97953088C7DE4f83c7c4395A2410f8,0xB59CD3622Ff62e88995bE05704828b2047A64735,0x6aBBFA16917540765e47b11cB3Eb9514AE556269,0x8f78425afe065dA311A39e1566ceA9e1BD35C963,0x29ED80C7Cf29F50Dd0419d53821b06cE4F4EAce2,0xa95ff726F9927F9e7491ff06a09607067C531804,0x12A4Af6d39540aCC9Ad827E5608e8FE8c5a53e90,0xf4b737dB55DC2E9222838c0ad03fD5bE6F42CEb2,0xbfdbc6620C9dc7d786a1146323381643868c59B1,0x24F9dD90dF03cC0610F743ca485fF940aaFb0A2f,0x3E8CfB6B1864c2AE81b28cfb0419B95BFB586589,0xf7eC55273d2Af90aCf56083B60de257D17DF15Ac,0xD7C29FA1eFacf729F44E85C82CD77B48e3DabdE9",
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      },
    )

    if (!response.ok) {
      console.error(`Metro API error: ${response.status} ${response.statusText}`)
      throw new Error(`Metro API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Received ${data.length || 0} pools from Metro API with specific pair addresses`)

    // Log a sample of the data to understand its structure
    if (data.length > 0) {
      console.log("First pool data:", JSON.stringify(data[0], null, 2))
    }

    // Check if data is in the expected format
    if (!Array.isArray(data)) {
      console.error("Metro API returned unexpected data format:", typeof data)
      return NextResponse.json({
        pairs: getMockMetroPairs(),
        error: "Unexpected data format from Metro API",
      })
    }

    // Transform the data to match our TokenPair interface
    const tokenPairs: TokenPair[] = data
      .filter((pool: any) => {
        // Filter out invalid pools or pools with zero liquidity
        if (!pool || !pool.tokenX || !pool.tokenY) {
          return false
        }

        // Make sure we have valid liquidity data
        const tvl = Number.parseFloat(pool.liquidityUSD) || 0
        return tvl > 0 // Only include pools with positive liquidity
      })
      .map((pool: any) => {
        try {
          // Get TVL and volume with fallbacks
          const tvl = Number.parseFloat(pool.liquidityUSD) || 0
          const volume = Number.parseFloat(pool.volumeUSD) || 0

          // Calculate fee percentage - Metro uses a fixed 0.3% fee for classic-v2
          const feePercent = 0.3

          // Calculate estimated 24h fees
          const fee24h = pool.lpFees24h || (volume * feePercent) / 100

          // Use the provided APR if available, otherwise calculate it
          const apr = pool.feeApr24
            ? `${Number.parseFloat(pool.feeApr24).toFixed(2)}%`
            : calculateEstimatedAPR(volume, tvl, feePercent * 100)

          // Clean up token symbols
          const token0Symbol = String(pool.tokenX.symbol).replace(/[^a-zA-Z0-9]/g, "")
          const token1Symbol = String(pool.tokenY.symbol).replace(/[^a-zA-Z0-9]/g, "")

          return {
            name: `${token0Symbol}-${token1Symbol}`,
            symbol1: token0Symbol.charAt(0),
            symbol2: token1Symbol.charAt(0),
            icon1: getTokenColor(token0Symbol),
            icon2: getTokenColor(token1Symbol),
            protocol: "Metro V2",
            fees: `${feePercent.toFixed(2)}% Fees`,
            liquidity: formatNumber(tvl),
            volume24h: formatNumber(volume),
            fee24h: formatNumber(fee24h),
            apr: apr,
            // Store raw values for sorting
            _rawLiquidity: tvl,
          }
        } catch (err) {
          console.error("Error processing Metro pool:", err, pool)
          return null
        }
      })
      .filter(Boolean) // Remove any null entries from failed processing

      // Sort by liquidity (descending) using the raw values
      .sort((a: any, b: any) => {
        return b._rawLiquidity - a._rawLiquidity
      })
      // Take only the top 15
      .slice(0, 15)
      // Remove the raw values before returning
      .map((pair) => {
        const { _rawLiquidity, ...cleanPair } = pair
        return cleanPair
      })

    console.log(`Successfully processed ${tokenPairs.length} Metro pairs from specific addresses`)

    // Log the top pairs we're returning
    console.log(
      "Top Metro pairs:",
      tokenPairs.map((p) => `${p.name}: ${p.liquidity}`),
    )

    return NextResponse.json({ pairs: tokenPairs })
  } catch (error) {
    console.error("Error fetching Metro data:", error)

    // Return mock data as fallback
    return NextResponse.json({
      pairs: getMockMetroPairs(),
      error: `Failed to fetch Metro data: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

// Add a function to provide mock data as fallback
function getMockMetroPairs(): TokenPair[] {
  return [
    {
      name: "METRO-ETH",
      symbol1: "M",
      symbol2: "E",
      icon1: "bg-blue-500",
      icon2: "bg-blue-500",
      protocol: "Metro V2",
      fees: "0.3% Fees",
      liquidity: "$432,156",
      volume24h: "$98,765",
      fee24h: "$296",
      apr: "76.54%",
    },
    {
      name: "METRO-USDC",
      symbol1: "M",
      symbol2: "$",
      icon1: "bg-blue-500",
      icon2: "bg-blue-500",
      protocol: "Metro V2",
      fees: "0.3% Fees",
      liquidity: "$321,654",
      volume24h: "$76,543",
      fee24h: "$229",
      apr: "65.43%",
    },
    {
      name: "S-METRO",
      symbol1: "S",
      symbol2: "M",
      icon1: "bg-purple-500",
      icon2: "bg-blue-500",
      protocol: "Metro V2",
      fees: "0.3% Fees",
      liquidity: "$609,358",
      volume24h: "$123,456",
      fee24h: "$370",
      apr: "58.29%",
    },
    {
      name: "ETH-USDC",
      symbol1: "E",
      symbol2: "$",
      icon1: "bg-blue-500",
      icon2: "bg-blue-500",
      protocol: "Metro V2",
      fees: "0.3% Fees",
      liquidity: "$876,543",
      volume24h: "$234,567",
      fee24h: "$703",
      apr: "87.65%",
    },
    {
      name: "WBTC-ETH",
      symbol1: "₿",
      symbol2: "E",
      icon1: "bg-yellow-500",
      icon2: "bg-blue-500",
      protocol: "Metro V2",
      fees: "0.3% Fees",
      liquidity: "$543,210",
      volume24h: "$98,765",
      fee24h: "$296",
      apr: "54.32%",
    },
  ]
}