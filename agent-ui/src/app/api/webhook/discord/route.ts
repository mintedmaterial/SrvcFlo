import { NextResponse } from "next/server"
import { getServerSupabaseClient } from "@/lib/supabase/server-client"

// This is a simplified example of parsing Discord webhook data
// You'll need to adapt this to your specific Discord message format
function parseTweetFromDiscord(message: any) {
  // Example implementation - adjust based on your actual Discord message format
  try {
    // Check if this is a TweetShift message
    if (!message.embeds || !message.embeds.length || !message.content.includes("TweetShift")) {
      return null
    }

    const embed = message.embeds[0]

    // Extract author info
    const authorMatch = message.content.match(/@(\w+)/)
    const username = authorMatch ? `@${authorMatch[1]}` : ""

    // Extract author name
    const authorNameMatch = message.content.match(/([^@]+) \(@/)
    const author = authorNameMatch ? authorNameMatch[1].trim() : "Unknown"

    // Extract tweet content
    const content = embed.description || ""

    // Extract timestamp
    const timestamp = new Date().toISOString()

    // Check for attachments
    let attachment = null
    if (embed.title && embed.url) {
      attachment = {
        type: "link",
        title: embed.title,
        description: embed.description,
        url: embed.url,
      }
    }

    return {
      author,
      username,
      content,
      timestamp,
      verified: true, // You might want to determine this differently
      attachment,
    }
  } catch (error) {
    console.error("Error parsing tweet from Discord:", error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    // Verify the request is coming from Discord
    // You should implement proper authentication here

    const data = await request.json()

    // Parse the tweet from the Discord message
    const tweet = parseTweetFromDiscord(data)

    if (!tweet) {
      return NextResponse.json({ error: "Not a valid tweet" }, { status: 400 })
    }

    // Store the tweet in the database
    const supabase = getServerSupabaseClient()
    const { error } = await supabase.from("tweets").insert([
      {
        author: tweet.author,
        username: tweet.username,
        content: tweet.content,
        timestamp: tweet.timestamp,
        verified: tweet.verified,
        attachment: tweet.attachment,
      },
    ])

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing Discord webhook:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
