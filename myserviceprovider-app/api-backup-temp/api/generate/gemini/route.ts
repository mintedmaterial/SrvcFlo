import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, userAddress, model = 'gemini-pro', isVideo = false, packageTokenId } = body

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Gemini API key not configured'
      }, { status: 500 })
    }

    // Determine the Gemini model based on request
    let geminiModel = 'gemini-pro'
    if (model.includes('ultra')) {
      geminiModel = 'gemini-ultra'
    } else if (model.includes('video') || isVideo) {
      geminiModel = 'gemini-pro-vision' // For video, we'll use vision model
    }

    // For INFT generations, we should call the INFT generation endpoint
    if (packageTokenId) {
      const inftResponse = await fetch('/api/inft/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageTokenId,
          prompt,
          isVideo,
          preferredModel: 'gemini',
          userAddress
        })
      })

      if (!inftResponse.ok) {
        throw new Error('INFT generation failed')
      }

      return inftResponse.json()
    }

    // Use Cloudflare AI for Gemini models through Workers AI
    const cloudflareModel = isVideo 
      ? '@cf/meta/llama-2-7b-chat-fp16' // Placeholder for video - Cloudflare doesn't have Gemini video yet
      : '@cf/meta/llama-2-7b-chat-fp16'  // Use Llama as Gemini alternative

    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${cloudflareModel}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are a creative AI assistant that generates detailed, artistic descriptions for image generation."
            },
            {
              role: "user", 
              content: `Create a detailed artistic description for generating an image of: ${prompt}`
            }
          ],
          max_tokens: 200,
          temperature: 0.8
        })
      }
    )

    if (!cloudflareResponse.ok) {
      const errorText = await cloudflareResponse.text()
      throw new Error(`Cloudflare AI error: ${cloudflareResponse.status} - ${errorText}`)
    }

    const cloudflareData = await cloudflareResponse.json()
    const enhancedPrompt = cloudflareData.result?.response || prompt

    let generationResult: any

    if (isVideo) {
      // Video generation not yet available through Cloudflare AI
      generationResult = {
        success: false,
        error: 'Video generation through Cloudflare AI not yet available',
        model: cloudflareModel,
        enhancedPrompt
      }
    } else {
      // Now use the enhanced prompt for image generation with Flux
      const imageResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            steps: 6,
            guidance: 4.0,
            seed: Math.floor(Math.random() * 1000000)
          })
        }
      )

      if (!imageResponse.ok) {
        throw new Error(`Image generation failed: ${imageResponse.status}`)
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString('base64')
      const imageUrl = `data:image/png;base64,${base64Image}`

      generationResult = {
        success: true,
        imageUrl,
        model: 'gemini-enhanced-flux',
        enhancedPrompt,
        originalPrompt: prompt,
        creditsUsed: 25,
        generatedAt: new Date().toISOString()
      }
    }

    // Log the generation
    try {
      await fetch('/api/generations/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          prompt,
          model: geminiModel,
          type: isVideo ? 'video' : 'image',
          creditsUsed: generationResult.creditsUsed || 0,
          resultUrl: generationResult.imageUrl || generationResult.videoUrl,
          status: generationResult.success ? 'completed' : 'failed'
        })
      })
    } catch (logError) {
      console.warn('Failed to log Gemini generation:', logError)
    }

    return NextResponse.json(generationResult)

  } catch (error: any) {
    console.error('Gemini generation error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Gemini generation failed',
      model: 'gemini-error'
    }, { status: 500 })
  }
}