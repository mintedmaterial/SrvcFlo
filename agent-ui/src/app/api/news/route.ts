import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Replace with your actual API token
    const API_TOKEN = process.env.CRYPTOPANIC_API_TOKEN || "a6ddf5dba1c999bf140e128e146797ce2a515443"

    const response = await fetch(
      `https://cryptopanic.com/api/v1/posts/?auth_token=${API_TOKEN}&metadata=true&approved=true&currencies=SONIC-3,BTC,ETH`,
      {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      },
    )

    if (!response.ok) {
      throw new Error(`CryptoPanic API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching news:", error)
    return NextResponse.json({ error: "Failed to fetch news data" }, { status: 500 })
  }
}
