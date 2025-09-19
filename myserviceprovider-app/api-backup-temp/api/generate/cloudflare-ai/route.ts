import { NextRequest, NextResponse } from 'next/server'

// Available Cloudflare AI models
const CLOUDFLARE_MODELS = {
  // Image models
  'flux-schnell': '@cf/black-forest-labs/flux-1-schnell',
  'flux-dev': '@cf/black-forest-labs/flux-1-dev', 
  'stable-diffusion-xl': '@cf/stabilityai/stable-diffusion-xl-base-1.0',
  'stable-diffusion-lightning': '@cf/bytedance/stable-diffusion-xl-lightning',
  'dreamshaper': '@cf/lykon/dreamshaper-8-lcm',
  'stable-diffusion-v1-5': '@cf/runwayml/stable-diffusion-v1-5-img2img',
  
  // Text models (for prompt enhancement)
  'llama-2-7b': '@cf/meta/llama-2-7b-chat-fp16',
  'llama-2-13b': '@cf/meta/llama-2-13b-chat-fp16',
  'llama-3-8b': '@cf/meta/llama-3-8b-instruct',
  'mistral-7b': '@cf/mistral/mistral-7b-instruct-v0.1',
  
  // Code models
  'codellama-7b': '@cf/meta/codellama-7b-instruct-awq',
  
  // Translation models
  'translation': '@cf/meta/m2m100-1.2b',
  
  // Speech models  
  'whisper': '@cf/openai/whisper'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      prompt, 
      userAddress, 
      model = 'flux-schnell', 
      isVideo = false, 
      packageTokenId,
      quality = 'standard',
      steps = 4,
      guidance = 3.5,
      enhance = false
    } = body

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 })
    }

    if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
      return NextResponse.json({
        success: false,
        error: 'Cloudflare AI credentials not configured'
      }, { status: 500 })
    }

    // For INFT generations, route to INFT endpoint
    if (packageTokenId) {
      const inftResponse = await fetch('/api/inft/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageTokenId,
          prompt,
          isVideo,
          preferredModel: 'cloudflare',
          userAddress
        })
      })

      if (!inftResponse.ok) {
        throw new Error('INFT generation failed')
      }

      return inftResponse.json()
    }

    // Get the Cloudflare model
    const cloudflareModel = CLOUDFLARE_MODELS[model as keyof typeof CLOUDFLARE_MODELS] || CLOUDFLARE_MODELS['flux-schnell']

    let enhancedPrompt = prompt

    // Optional prompt enhancement using Llama
    if (enhance) {
      try {
        const enhanceResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
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
                  content: "You are an expert prompt engineer. Enhance the user's prompt to be more detailed and artistic for AI image generation. Keep it concise but vivid."
                },
                {
                  role: "user", 
                  content: `Enhance this prompt for image generation: ${prompt}`
                }
              ],
              max_tokens: 150,
              temperature: 0.7
            })
          }
        )

        if (enhanceResponse.ok) {
          const enhanceData = await enhanceResponse.json()
          enhancedPrompt = enhanceData.result?.response || prompt
        }
      } catch (enhanceError) {
        console.warn('Prompt enhancement failed:', enhanceError)
        // Continue with original prompt
      }
    }

    // Video generation (placeholder - Cloudflare AI doesn't support video yet)
    if (isVideo) {
      return NextResponse.json({
        success: false,
        error: 'Video generation not yet available through Cloudflare AI',
        model: cloudflareModel,
        supportedModels: Object.keys(CLOUDFLARE_MODELS).filter(k => k.includes('stable') || k.includes('flux'))
      }, { status: 501 })
    }

    // Image generation
    const imageResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${cloudflareModel}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          steps: quality === 'high' ? steps * 2 : steps,
          guidance: quality === 'high' ? guidance + 1 : guidance,
          seed: Math.floor(Math.random() * 1000000),
          ...(model.includes('img2img') && { strength: 0.8 })
        })
      }
    )

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text()
      throw new Error(`Cloudflare AI error: ${imageResponse.status} - ${errorText}`)
    }

    // Handle binary image response
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const imageUrl = `data:image/png;base64,${base64Image}`

    // Determine credits used based on model and quality
    let creditsUsed = 0
    if (model === 'flux-schnell') creditsUsed = quality === 'high' ? 20 : 15
    else if (model === 'stable-diffusion-xl') creditsUsed = quality === 'high' ? 25 : 20
    else creditsUsed = quality === 'high' ? 30 : 25

    const generationResult = {
      success: true,
      imageUrl,
      model: cloudflareModel,
      originalPrompt: prompt,
      enhancedPrompt: enhance ? enhancedPrompt : undefined,
      quality,
      creditsUsed,
      generatedAt: new Date().toISOString(),
      metadata: {
        steps: quality === 'high' ? steps * 2 : steps,
        guidance: quality === 'high' ? guidance + 1 : guidance,
        enhanced: enhance
      }
    }

    // Log the generation
    try {
      await fetch('/api/generations/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          prompt: enhancedPrompt,
          model: cloudflareModel,
          type: 'image',
          creditsUsed,
          resultUrl: imageUrl,
          status: 'completed'
        })
      })
    } catch (logError) {
      console.warn('Failed to log Cloudflare AI generation:', logError)
    }

    return NextResponse.json(generationResult)

  } catch (error: any) {
    console.error('Cloudflare AI generation error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Cloudflare AI generation failed',
      availableModels: Object.keys(CLOUDFLARE_MODELS),
      documentation: 'https://developers.cloudflare.com/workers-ai/models/'
    }, { status: 500 })
  }
}

// GET endpoint to list available models
export async function GET() {
  return NextResponse.json({
    availableModels: CLOUDFLARE_MODELS,
    categories: {
      image: ['flux-schnell', 'flux-dev', 'stable-diffusion-xl', 'stable-diffusion-lightning', 'dreamshaper'],
      text: ['llama-2-7b', 'llama-2-13b', 'llama-3-8b', 'mistral-7b'],
      code: ['codellama-7b'],
      audio: ['whisper'],
      translation: ['translation']
    },
    pricing: {
      'flux-schnell': { standard: 15, high: 20 },
      'stable-diffusion-xl': { standard: 20, high: 25 },
      'default': { standard: 25, high: 30 }
    }
  })
}