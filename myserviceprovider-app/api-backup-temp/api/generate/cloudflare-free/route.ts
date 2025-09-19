import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, userAddress, model = 'cloudflare-free' } = body

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 })
    }

    // Use Cloudflare AI API directly for free generation
    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          steps: 4,
          guidance: 3.5,
          seed: Math.floor(Math.random() * 1000000)
        })
      }
    )

    if (!cloudflareResponse.ok) {
      const errorText = await cloudflareResponse.text()
      throw new Error(`Cloudflare AI API error: ${cloudflareResponse.status} - ${errorText}`)
    }

    // Cloudflare AI returns binary image data
    const imageBuffer = await cloudflareResponse.arrayBuffer()
    
    // Convert to base64 for return (in production, you'd upload to R2/IPFS)
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const imageUrl = `data:image/png;base64,${base64Image}`

    const data = { imageUrl }

    // Log the free generation
    try {
      await fetch('/api/generations/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          prompt,
          model,
          type: 'image',
          creditsUsed: 0,
          resultUrl: data.imageUrl,
          status: 'completed'
        })
      })
    } catch (logError) {
      console.warn('Failed to log free generation:', logError)
      // Continue without failing
    }

    return NextResponse.json({
      success: true,
      imageUrl: data.imageUrl,
      model: '@cf/black-forest-labs/flux-1-schnell',
      creditsUsed: 0,
      generatedAt: new Date().toISOString(),
      prompt: prompt
    })

  } catch (error: any) {
    console.error('Free generation error:', error)
    
    // Fallback to a placeholder image for demo purposes
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        imageUrl: `https://via.placeholder.com/1024x1024/1f2937/f59e0b?text=Demo+Image`,
        model: 'demo-fallback',
        creditsUsed: 0,
        generatedAt: new Date().toISOString(),
        isDemo: true
      })
    }
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Free generation failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}