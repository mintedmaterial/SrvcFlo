import { NextRequest, NextResponse } from "next/server"

// Mock purchase API as a fallback when PAYMENT_CONTRACT_ADDRESS is not set.
// This does NOT touch the blockchain. Replace/remove once your contracts are live.
export async function POST(request: NextRequest) {
  try {
    const { userAddress, packageId, paymentToken } = await request.json()

    if (!userAddress || !packageId || !paymentToken) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Credits mapping per package and payment token
    const id = Number(packageId)
    const credits =
      paymentToken === "USDC"
        ? id === 1
          ? 750
          : id === 2
          ? 8000
          : id === 3
          ? 100000
          : 260000
        : id === 1
        ? 1000
        : id === 2
        ? 10000
        : id === 3
        ? 115000
        : 290000

    const result = {
      success: true,
      transactionHash: `0x${Math.random().toString(16).slice(2).padEnd(64, "0")}`,
      packageId: id,
      paymentToken,
      creditsReceived: credits,
      userAddress,
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error purchasing credits:", error)
    return NextResponse.json({ error: "Failed to purchase credits" }, { status: 500 })
  }
}