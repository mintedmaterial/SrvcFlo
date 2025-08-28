import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// OpenAI model configurations
const OPENAI_MODELS = {
  // Image models
  'dall-e-3': 'dall-e-3',
  'dall-e-2': 'dall-e-2',
  
  // Text models (for prompt enhancement)
  'gpt-4': 'gpt-4',
  'gpt-4-turbo': 'gpt-4-turbo-preview',
  'gpt-3.5-turbo': 'gpt-3.5-turbo',
  
  // Future models
  'gpt-4.1': 'gpt-4.1', // When available
  'gpt-5': 'gpt-5' // When available
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      prompt, 
      userAddress, 
      model = 'dall-e-3', 
      isVideo = false, 
      packageTokenId,
      quality = 'standard',
      size = '1024x1024',
      enhance = false
    } = body

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
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
          preferredModel: 'openai',
          userAddress
        })
      })

      if (!inftResponse.ok) {
        throw new Error('INFT generation failed')
      }

      return inftResponse.json()
    }

    // Get the OpenAI model
    const openaiModel = OPENAI_MODELS[model as keyof typeof OPENAI_MODELS] || OPENAI_MODELS['dall-e-3']

    let enhancedPrompt = prompt

    // Optional prompt enhancement using GPT-4
    if (enhance) {
      try {
        const enhanceResponse = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: "system",
              content: "You are an expert prompt engineer. Enhance the user's prompt to be more detailed and artistic for AI image generation. Keep it concise but vivid. Return only the enhanced prompt."
            },
            {
              role: "user", 
              content: `Enhance this prompt for DALL-E image generation: ${prompt}`
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })

        enhancedPrompt = enhanceResponse.choices[0]?.message?.content || prompt
      } catch (enhanceError) {
        console.warn('Prompt enhancement failed:', enhanceError)
        // Continue with original prompt
      }
    }

    // Video generation not supported by OpenAI
    if (isVideo) {
      return NextResponse.json({
        success: false,
        error: 'Video generation not yet available through OpenAI',
        model: openaiModel,
        supportedModels: ['dall-e-3', 'dall-e-2']
      }, { status: 501 })
    }

    // Image generation
    const imageResponse = await openai.images.generate({
      model: openaiModel as 'dall-e-3' | 'dall-e-2',
      prompt: enhancedPrompt,
      n: 1,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
      quality: quality as 'standard' | 'hd',
      response_format: 'url'
    })

    if (!imageResponse.data || !imageResponse.data[0]?.url) {
      throw new Error('OpenAI did not return image data')
    }

    const imageUrl = imageResponse.data[0].url

    // Determine credits used based on model and quality
    let creditsUsed = 0
    if (model === 'dall-e-3') {
      creditsUsed = quality === 'hd' ? 50 : 40
    } else if (model === 'dall-e-2') {
      creditsUsed = 30
    }

    // Add size premium for non-square images
    if (size !== '1024x1024') {
      creditsUsed += 10
    }

    const generationResult = {
      success: true,
      imageUrl,
      model: openaiModel,
      originalPrompt: prompt,
      enhancedPrompt: enhance ? enhancedPrompt : undefined,
      quality,
      size,
      creditsUsed,
      generatedAt: new Date().toISOString(),
      metadata: {
        enhanced: enhance,
        revised_prompt: imageResponse.data[0].revised_prompt
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
          model: openaiModel,
          type: 'image',
          creditsUsed,
          resultUrl: imageUrl,
          status: 'completed'
        })
      })
    } catch (logError) {
      console.warn('Failed to log OpenAI generation:', logError)
    }

    return NextResponse.json(generationResult)

  } catch (error: any) {
    console.error('OpenAI generation error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'OpenAI generation failed',
      availableModels: Object.keys(OPENAI_MODELS),
      documentation: 'https://platform.openai.com/docs/guides/images'
    }, { status: 500 })
  }
}

// GET endpoint to list available models
export async function GET() {
  return NextResponse.json({
    availableModels: OPENAI_MODELS,
    categories: {
      image: ['dall-e-3', 'dall-e-2'],
      text: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      future: ['gpt-4.1', 'gpt-5']
    },
    pricing: {
      'dall-e-3': { standard: 40, hd: 50 },
      'dall-e-2': { standard: 30 },
      'size_premium': 10
    },
    supported_sizes: {
      'dall-e-3': ['1024x1024', '1792x1024', '1024x1792'],
      'dall-e-2': ['1024x1024']
    }
  })
}