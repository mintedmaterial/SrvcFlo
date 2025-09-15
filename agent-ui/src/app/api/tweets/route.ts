import { NextResponse } from "next/server"
import { getServerSupabaseClient } from "@/lib/supabase/server-client"

export async function GET() {
  try {
    const supabase = getServerSupabaseClient()

    // Fetch tweets from the database
    const { data, error } = await supabase
      .from("tweets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    return NextResponse.json({ tweets: data })
  } catch (error) {
    console.error("Error fetching tweets:", error)
    return NextResponse.json({ error: "Failed to fetch tweets" }, { status: 500 })
  }
}
