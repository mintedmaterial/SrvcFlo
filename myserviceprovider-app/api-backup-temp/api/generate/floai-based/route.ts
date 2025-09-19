import { NextRequest, NextResponse } from 'next/server'

// FLOAI Payment Integration
const FLOAI_COSTS = {
  image: 50, // 50 FLOAI per image
  video: 100, // 100 FLOAI per video
  social: 25, // 25 FLOAI per social post
  research: 30, // 30 FLOAI per research
  analysis: 40 // 40 FLOAI per analysis
}

// Cloudflare AI models
const CLOUDFLARE_MODELS = {
  'flux-schnell': '@cf/black-forest-labs/flux-1-schnell',
  'flux-dev': '@cf/black-forest-labs/flux-1-dev', 
  'stable-diffusion-xl': '@cf/stabilityai/stable-diffusion-xl-base-1.0',
  'stable-diffusion-lightning': '@cf/bytedance/stable-diffusion-xl-lightning',
  'dreamshaper': '@cf/lykon/dreamshaper-8-lcm'
}

interface GenerationRequest {
  prompt: string
  userAddress: string
  agentId?: number
  agentOwner?: string
  generationType: 'image' | 'video' | 'social' | 'research' | 'analysis'
  model?: string
  quality?: 'standard' | 'high'
  enhance?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json()
    const { 
      prompt, 
      userAddress, 
      agentId = 0,
      agentOwner = userAddress,
      generationType = 'image',
      model = 'flux-schnell', 
      quality = 'standard',
      enhance = false
    } = body

    if (!prompt || !userAddress) {
      return NextResponse.json({
        success: false,
        error: 'Prompt and user address are required'
      }, { status: 400 })
    }

    // Get FLOAI cost for this generation type
    const floaiCost = FLOAI_COSTS[generationType]
    if (!floaiCost) {
      return NextResponse.json({
        success: false,
        error: 'Invalid generation type'
      }, { status: 400 })
    }

    // Step 1: Process FLOAI payment through payment splitter
    try {
      const paymentResponse = await fetch('/api/payment/floai-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          agentId,
          agentOwner,
          generationType,
          amount: floaiCost
        })
      })

      if (!paymentResponse.ok) {
        const paymentError = await paymentResponse.json()
        return NextResponse.json({
          success: false,
          error: 'FLOAI payment failed',
          details: paymentError,
          requiredFLOAI: floaiCost,
          generationType
        }, { status: 402 }) // Payment Required
      }

      const paymentResult = await paymentResponse.json()
      console.log('FLOAI payment processed:', paymentResult)

    } catch (paymentError) {
      console.error('FLOAI payment error:', paymentError)
      return NextResponse.json({
        success: false,
        error: 'Payment processing failed',
        requiredFLOAI: floaiCost,
        generationType
      }, { status: 402 })
    }

    // Step 2: Generate based on type
    let generationResult: any

    switch (generationType) {
      case 'image':
        generationResult = await generateImage(prompt, model, quality, enhance)
        break
      case 'video':
        generationResult = await generateVideo(prompt, model, quality)
        break
      case 'social':
        generationResult = await generateSocialPost(prompt)
        break
      case 'research':
        generationResult = await performResearch(prompt)
        break
      case 'analysis':
        generationResult = await performAnalysis(prompt)
        break
      default:
        throw new Error('Unsupported generation type')
    }

    // Step 3: Log the generation for analytics
    try {
      await fetch('/api/generations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          agentId,
          prompt,
          model,
          type: generationType,
          floaiCost,
          paymentMethod: 'floai',
          resultUrl: generationResult.output || generationResult.content,
          status: 'completed',
          metadata: {
            agentOwner,
            quality,
            enhanced: enhance,
            revenueDistributed: true
          }
        })
      })
    } catch (logError) {
      console.warn('Failed to log FLOAI generation:', logError)
    }

    return NextResponse.json({
      success: true,
      ...generationResult,
      payment: {
        method: 'floai',
        amount: floaiCost,
        generationType,
        revenueDistributed: true
      },
      metadata: {
        agentId,
        agentOwner,
        quality,
        enhanced: enhance,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('FLOAI-based generation error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Generation failed',
      floaiCosts: FLOAI_COSTS
    }, { status: 500 })
  }
}

// Image generation using Cloudflare AI
async function generateImage(prompt: string, model: string, quality: string, enhance: boolean) {
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('Cloudflare AI credentials not configured')
  }

  const cloudflareModel = CLOUDFLARE_MODELS[model as keyof typeof CLOUDFLARE_MODELS] || CLOUDFLARE_MODELS['flux-schnell']
  let enhancedPrompt = prompt

  // Optional prompt enhancement
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
    }
  }

  // Generate image
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
        steps: quality === 'high' ? 8 : 4,
        guidance: quality === 'high' ? 4.5 : 3.5,
        seed: Math.floor(Math.random() * 1000000)
      })
    }
  )

  if (!imageResponse.ok) {
    throw new Error(`Cloudflare AI error: ${imageResponse.status}`)
  }

  const imageBuffer = await imageResponse.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  const imageUrl = `data:image/png;base64,${base64Image}`

  return {
    type: 'image',
    output: imageUrl,
    model: cloudflareModel,
    originalPrompt: prompt,
    enhancedPrompt: enhance ? enhancedPrompt : undefined,
    quality
  }
}

// Video generation (placeholder)
async function generateVideo(prompt: string, model: string, quality: string) {
  // For now, return a placeholder since video generation requires specialized services
  return {
    type: 'video',
    output: 'https://via.placeholder.com/400x300.mp4?text=Video+Generation+Coming+Soon',
    model: 'placeholder',
    prompt,
    quality,
    note: 'Video generation will be implemented with specialized video AI services'
  }
}

// Social post generation
async function generateSocialPost(prompt: string) {
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('Cloudflare AI credentials not configured')
  }

  const response = await fetch(
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
            content: "You are a social media expert. Create engaging social media posts that are concise, engaging, and include relevant hashtags. Keep it under 280 characters for Twitter compatibility."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Social post generation failed: ${response.status}`)
  }

  const data = await response.json()
  const content = data.result?.response || 'Failed to generate social post'

  return {
    type: 'social',
    content,
    platform: 'universal',
    characterCount: content.length,
    hashtags: content.match(/#\w+/g) || []
  }
}

// Research query
async function performResearch(prompt: string) {
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('Cloudflare AI credentials not configured')
  }

  const response = await fetch(
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
            content: "You are a research assistant. Provide comprehensive, well-structured research results with key findings, sources recommendations, and actionable insights."
          },
          {
            role: "user",
            content: `Research query: ${prompt}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Research failed: ${response.status}`)
  }

  const data = await response.json()
  const content = data.result?.response || 'Research query failed'

  return {
    type: 'research',
    content,
    query: prompt,
    wordCount: content.split(' ').length,
    sections: content.split('\n\n').filter(s => s.trim())
  }
}

// Analysis task
async function performAnalysis(prompt: string) {
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('Cloudflare AI credentials not configured')
  }

  const response = await fetch(
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
            content: "You are a data analyst. Provide detailed analysis with insights, patterns, recommendations, and actionable conclusions. Use structured format with clear sections."
          },
          {
            role: "user",
            content: `Analysis request: ${prompt}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.status}`)
  }

  const data = await response.json()
  const content = data.result?.response || 'Analysis failed'

  return {
    type: 'analysis',
    content,
    query: prompt,
    insights: content.split('\n').filter(line => 
      line.toLowerCase().includes('insight') || 
      line.toLowerCase().includes('conclusion') ||
      line.toLowerCase().includes('recommendation')
    ),
    structure: {
      hasIntroduction: content.toLowerCase().includes('introduction') || content.toLowerCase().includes('overview'),
      hasConclusion: content.toLowerCase().includes('conclusion') || content.toLowerCase().includes('summary'),
      hasRecommendations: content.toLowerCase().includes('recommendation') || content.toLowerCase().includes('suggest')
    }
  }
}

// GET endpoint for cost information
export async function GET() {
  return NextResponse.json({
    floaiCosts: FLOAI_COSTS,
    revenueDistribution: {
      dev: '50%',
      staking: '25%', 
      leaderboard: '15%',
      treasury: '10%'
    },
    supportedTypes: Object.keys(FLOAI_COSTS),
    paymentMethod: 'FLOAI token transfers (no burning)',
    availableModels: Object.keys(CLOUDFLARE_MODELS)
  })
}