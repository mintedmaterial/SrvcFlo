import { NextRequest, NextResponse } from 'next/server';
import { createHybridGenerationService } from '@/src/hybrid-generation-service';
import { createPaintSwapIntegration } from '@/src/paintswap-integration';

// Model provider mappings for new routing system
const MODEL_PROVIDERS = {
  // OpenAI models
  'dall-e-3': 'openai',
  'dall-e-2': 'openai',
  'gpt-4': 'openai',
  'gpt-4-turbo': 'openai',
  'gpt-3.5-turbo': 'openai',
  'gpt-4.1': 'openai',
  'gpt-5': 'openai',
  
  // Cloudflare AI models
  'flux-schnell': 'cloudflare-ai',
  'flux-dev': 'cloudflare-ai',
  'stable-diffusion-xl': 'cloudflare-ai',
  'stable-diffusion-lightning': 'cloudflare-ai',
  'dreamshaper': 'cloudflare-ai',
  'llama-3-8b': 'cloudflare-ai',
  'mistral-7b': 'cloudflare-ai',
  
  // Gemini models (via Cloudflare AI)
  'gemini-pro': 'gemini',
  'gemini-ultra': 'gemini',
  'gemini-pro-vision': 'gemini',
  
  // Free/Default options
  'cloudflare-free': 'cloudflare-free'
}

// INFT model selection for different package tiers
const INFT_MODEL_SELECTION = {
  'starter': {
    image: ['cloudflare-free', 'flux-schnell'],
    video: ['cloudflare-ai']
  },
  'creator': {
    image: ['flux-schnell', 'dall-e-2', 'stable-diffusion-xl'],
    video: ['cloudflare-ai']
  },
  'professional': {
    image: ['dall-e-3', 'flux-dev', 'stable-diffusion-xl'],
    video: ['dall-e-3']
  },
  'enterprise': {
    image: ['dall-e-3', 'gpt-5', 'flux-dev'],
    video: ['dall-e-3']
  }
}

interface GenerationRequest {
  prompt: string;
  type?: 'image' | 'video';
  isVideo?: boolean;
  user?: string;
  userAddress?: string;
  creditType?: 'standard' | 'nft' | 'inft';
  packageId?: number;
  packageTokenId?: string;
  uploadedImage?: string;
  provider?: 'cloudflare' | 'gemini' | 'groq-kimi' | 'openai' | 'cloudflare-ai' | 'cloudflare-free';
  model?: string;
  quality?: 'standard' | 'high' | 'hd';
  enhance?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json();
    const { 
      prompt, 
      type,
      isVideo,
      user, 
      userAddress,
      creditType, 
      packageId,
      packageTokenId,
      uploadedImage,
      provider,
      model,
      quality = 'standard',
      enhance = false
    } = body;

    // Normalize parameters for both old and new API formats
    const generationType = type || (isVideo ? 'video' : 'image');
    const userAddr = userAddress || user;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' }, 
        { status: 400 }
      );
    }

    console.log(`🎨 Starting ${generationType} generation:`, {
      user: userAddr,
      creditType,
      packageId,
      packageTokenId,
      provider,
      model,
      prompt: prompt.substring(0, 50) + '...'
    });

    // NEW INFT ROUTING SYSTEM - Route to INFT endpoint if packageTokenId provided
    if (packageTokenId && creditType === 'inft') {
      console.log('🔄 Routing to INFT generation system');
      
      const inftResponse = await fetch(`${request.nextUrl.origin}/api/inft/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageTokenId,
          prompt,
          isVideo: generationType === 'video',
          preferredModel: model || (provider === 'openai' ? 'dall-e-3' : 'flux-schnell'),
          userAddress: userAddr,
          quality,
          enhance
        })
      });

      if (!inftResponse.ok) {
        throw new Error('INFT generation failed');
      }

      const inftResult = await inftResponse.json();
      return NextResponse.json(inftResult);
    }

    // NEW MODEL-SPECIFIC ROUTING - Route to specific provider endpoints
    if (model && MODEL_PROVIDERS[model]) {
      const selectedProvider = MODEL_PROVIDERS[model];
      
      console.log(`🔄 Routing to ${selectedProvider} for model ${model}`);
      
      let apiEndpoint: string;
      switch (selectedProvider) {
        case 'openai':
          apiEndpoint = '/api/generate/openai';
          break;
        case 'cloudflare-ai':
          apiEndpoint = '/api/generate/cloudflare-ai';
          break;
        case 'gemini':
          apiEndpoint = '/api/generate/gemini';
          break;
        case 'cloudflare-free':
          apiEndpoint = '/api/generate/cloudflare-free';
          break;
        default:
          throw new Error(`Unsupported provider: ${selectedProvider}`);
      }

      const providerResponse = await fetch(`${request.nextUrl.origin}${apiEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          userAddress: userAddr,
          model,
          isVideo: generationType === 'video',
          quality,
          enhance
        })
      });

      if (!providerResponse.ok) {
        const errorData = await providerResponse.json();
        throw new Error(errorData.error || `Provider ${selectedProvider} failed`);
      }

      const result = await providerResponse.json();
      return NextResponse.json({
        ...result,
        routing: {
          provider: selectedProvider,
          model,
          endpoint: apiEndpoint
        }
      });
    }

    // LEGACY HYBRID GENERATION SYSTEM - Backwards compatibility
    console.log('🔄 Using legacy hybrid generation system');
    
    // Initialize services in PRODUCTION mode for real API testing
    const hybridService = createHybridGenerationService(true); // REAL MODE
    const paintSwapService = createPaintSwapIntegration(true); // REAL MODE
    
    // Enhance prompt with collection influence if using NFT credits
    let enhancedPrompt = prompt;
    let detectedCollections: string[] = [];
    let isInfluenced = false;
    let influencedCollection: string | undefined;

    if (creditType === 'nft') {
      const enhancement = await paintSwapService.enhancePromptWithCollection(prompt, generationType === 'video');
      enhancedPrompt = enhancement.enhancedPrompt;
      detectedCollections = enhancement.detectedCollections;
      isInfluenced = enhancement.influence !== null;
      influencedCollection = enhancement.detectedCollections[0];
    }

    // Calculate credits required (legacy system)
    const baseCredits = generationType === 'image' ? 100 : 200;
    const influenceBonus = isInfluenced ? 50 : 0;
    const creditsUsed = baseCredits + influenceBonus;

    // Generate content using the selected provider (legacy)
    let result;
    const legacyProvider = provider || 'cloudflare';
    
    if (legacyProvider === 'gemini' && generationType === 'video') {
      // Use Gemini for video generation
      result = await hybridService.generateVideo({
        prompt: enhancedPrompt,
        aspectRatio: '16:9',
        duration: '5s',
        uploadedImage,
        collectionInfluence: isInfluenced ? {
          collection: influencedCollection || '',
          keywords: detectedCollections
        } : undefined
      });
    } else if (legacyProvider === 'groq-kimi') {
      // Use Groq Kimi for both image and video
      result = await hybridService.generateWithGroqKimi({
        prompt: enhancedPrompt,
        type: generationType,
        aspectRatio: '16:9',
        duration: generationType === 'video' ? '5s' : undefined,
        uploadedImage,
        collectionInfluence: isInfluenced ? {
          collection: influencedCollection || '',
          keywords: detectedCollections
        } : undefined
      });
    } else {
      // Use Cloudflare AI (default)
      result = await hybridService.generateImage({
        prompt: enhancedPrompt,
        width: 1024,
        height: 1024,
        uploadedImage,
        collectionInfluence: isInfluenced ? {
          collection: influencedCollection || '',
          keywords: detectedCollections
        } : undefined
      });
    }

    // Create generation record
    const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    const response = {
      success: true,
      generationId,
      resultUrl: result.resultUrl,
      isInfluenced,
      influencedCollection,
      detectedCollections,
      creditsUsed,
      provider: legacyProvider,
      enhancedPrompt: isInfluenced ? enhancedPrompt : undefined
    };

    console.log(`✅ Generation completed:`, {
      generationId,
      creditsUsed,
      isInfluenced,
      provider: legacyProvider
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}

// GET endpoint to list all available models and providers
export async function GET() {
  return NextResponse.json({
    modelProviders: MODEL_PROVIDERS,
    inftModelSelection: INFT_MODEL_SELECTION,
    endpoints: {
      'openai': '/api/generate/openai',
      'cloudflare-ai': '/api/generate/cloudflare-ai', 
      'gemini': '/api/generate/gemini',
      'cloudflare-free': '/api/generate/cloudflare-free',
      'inft': '/api/inft/generate',
      'legacy': '/api/generate (this endpoint)'
    },
    usage: {
      'new_model_routing': 'Specify model parameter for automatic provider routing',
      'inft_routing': 'Specify packageTokenId and creditType=inft for INFT generation',
      'legacy_routing': 'Use provider parameter for backwards compatibility'
    }
  });
}