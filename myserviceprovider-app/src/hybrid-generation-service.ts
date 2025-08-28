// Hybrid Generation Service
// Handles both standard and NFT credit-based generations with collection influence

import PaintSwapIntegration, { CollectionInfluence } from './paintswap-integration';
import { createGeminiVideoService, createTestGeminiVideoService } from './gemini-video-service';
import { createGroqKimiService, createTestGroqKimiService, GroqGenerationRequest } from './groq-kimi-service';

interface GenerationRequest {
  prompt: string;
  type: 'image' | 'video';
  user: string;
  creditType: 'standard' | 'inft';
  packageId?: number;
  packageTokenId?: string; // INFT token ID for INFT generations
  uploadedImage?: string; // Base64 encoded image for enhancement
  provider?: 'openai' | 'cloudflare' | 'gemini' | 'groq-kimi'; // Generation provider choice
  aiModel?: string; // Specific AI model to use
  influencedCollection?: string; // Collection influence for style
}

interface GenerationResponse {
  generationId: string;
  resultUrl?: string;
  status: 'processing' | 'completed' | 'failed';
  isInfluenced: boolean;
  influencedCollection?: string;
  influence?: CollectionInfluence;
  creditsUsed: number;
  remainingCredits?: number;
  generatedTokenId?: string; // ERC-1155 token ID for generated content
  ipfsHash?: string; // IPFS hash for content storage
  aiModel?: string; // AI model used for generation
  packageTokenId?: string; // INFT package used
}

interface CloudflareImageGenRequest {
  prompt: string;
  model?: string;
  steps?: number;
  guidance?: number;
  seed?: number;
  image?: string; // For image-to-image
}

interface GeminiVideoGenRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: "16:9" | "9:16";
  personGeneration?: "allow_all" | "allow_adult" | "dont_allow";
  image?: {
    imageBytes: string;
    mimeType: string;
  };
}

class HybridGenerationService {
  private cloudflareAccountId: string;
  private cloudflareApiToken: string;
  private geminiApiKey: string;
  private openaiApiKey: string;
  private isTestMode: boolean;
  private geminiVideoService: any;
  private groqKimiService: any;
  private openaiService: any;
  
  constructor(testMode: boolean = false) {
    this.isTestMode = testMode;
    this.cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
    this.cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN || '';
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    
    // Initialize Gemini service based on test mode
    this.geminiVideoService = testMode 
      ? createTestGeminiVideoService()
      : createGeminiVideoService();
    
    // Initialize Groq Kimi service based on test mode
    this.groqKimiService = testMode
      ? createTestGroqKimiService()
      : createGroqKimiService();

    // Initialize OpenAI service for INFT support
    this.openaiService = this.initializeOpenAIService(testMode);
  }

  /**
   * Initialize OpenAI service
   */
  private initializeOpenAIService(testMode: boolean) {
    // Dynamic import to avoid circular dependencies
    try {
      const { OpenAIImageService } = require('./openai-image-service');
      return new OpenAIImageService(testMode);
    } catch (error) {
      console.warn('OpenAI service not available:', error);
      return null;
    }
  }

  /**
   * Main generation handler - routes to appropriate service based on credit type
   */
  async generateContent(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      // Step 1: Handle collection influence for INFT generations
      let influence: CollectionInfluence | null = null;
      let enhancedPrompt = request.prompt;
      let detectedCollections: string[] = [];
      
      if (request.creditType === 'inft') {
        // Use provided collection influence or detect from prompt
        const targetCollection = request.influencedCollection || null;
        
        if (targetCollection) {
          detectedCollections = [targetCollection];
          enhancedPrompt = this.enhancePromptWithCollection(request.prompt, targetCollection);
        } else {
          // Fallback to automatic detection
          const enhancementResult = await PaintSwapIntegration.enhancePromptWithCollection(
            request.prompt,
            request.type === 'video'
          );
          
          enhancedPrompt = enhancementResult.enhancedPrompt;
          detectedCollections = enhancementResult.detectedCollections;
          influence = enhancementResult.influence;
        }
      }

      // Step 2: Determine provider and AI model for INFT generations
      let provider = request.provider;
      let aiModel = request.aiModel;
      
      if (request.creditType === 'inft' && request.packageTokenId) {
        // Auto-select provider based on package type
        const packageType = this.getPackageTypeFromTokenId(request.packageTokenId);
        const providerSelection = this.selectProviderForPackage(packageType, request.type, provider);
        provider = providerSelection.provider;
        aiModel = aiModel || providerSelection.model;
      }
      
      provider = provider || 'cloudflare'; // Default fallback

      // Step 3: Generate content based on provider
      let resultUrl: string;
      let generationId: string;
      let ipfsHash: string | undefined;

      if (provider === 'openai' && this.openaiService) {
        // Use OpenAI for premium generations
        const openaiRequest = {
          prompt: enhancedPrompt,
          collection: detectedCollections[0],
          userAddress: request.user,
          paymentVerified: request.creditType === 'inft' || request.creditType === 'standard',
          size: request.type === 'image' ? "1024x1024" : undefined
        };
        
        const result = await this.openaiService.generateImage(openaiRequest);
        resultUrl = result.imageUrl || result.imageData || '';
        generationId = result.operationId;
        
      } else if (provider === 'groq-kimi') {
        // Use Groq Kimi for both image and video
        const groqRequest: GroqGenerationRequest = {
          prompt: enhancedPrompt,
          type: request.type,
          aspectRatio: '16:9',
          duration: request.type === 'video' ? '5s' : undefined
        };
        
        const result = await this.groqKimiService.generateContent(groqRequest);
        resultUrl = result.resultUrl || '';
        generationId = result.operationId;
        
      } else if (request.type === 'image') {
        // Use Cloudflare for images
        const result = await this.generateImage(enhancedPrompt, request.uploadedImage);
        resultUrl = result.url;
        generationId = result.id;
      } else {
        // Use Gemini for videos
        const result = await this.generateVideo(enhancedPrompt, request.uploadedImage);
        resultUrl = result.url;
        generationId = result.id;
      }

      // Step 4: Upload to IPFS for INFT generations
      if (request.creditType === 'inft' && resultUrl) {
        ipfsHash = await this.uploadToIPFS(resultUrl, generationId);
      }

      // Step 5: Handle credit deduction and NFT minting
      const creditsUsed = this.calculateCreditsUsed(request.type, !!influence);
      let generatedTokenId: string | undefined;
      
      if (request.creditType === 'inft' && request.packageTokenId) {
        // Call INFT generation API to handle credits and minting
        const inftResponse = await this.generateWithINFT({
          packageTokenId: request.packageTokenId,
          prompt: request.prompt,
          isVideo: request.type === 'video',
          influencedCollection: detectedCollections[0],
          preferredModel: provider,
          userAddress: request.user
        });
        
        generatedTokenId = inftResponse.generatedTokenId;
        ipfsHash = inftResponse.ipfsHash;
      }

      return {
        generationId,
        resultUrl,
        status: 'completed',
        isInfluenced: !!influence,
        influencedCollection: detectedCollections[0],
        influence,
        creditsUsed,
        generatedTokenId,
        ipfsHash,
        aiModel: `${provider?.toUpperCase()} ${aiModel || 'default'}`,
        packageTokenId: request.packageTokenId
      };

    } catch (error) {
      console.error('Generation failed:', error);
      return {
        generationId: 'error_' + Date.now(),
        status: 'failed',
        isInfluenced: false,
        creditsUsed: 0
      };
    }
  }

  /**
   * Generate image using Cloudflare Workers AI
   */
  private async generateImage(prompt: string, uploadedImage?: string): Promise<{ url: string; id: string }> {
    const genRequest: CloudflareImageGenRequest = {
      prompt,
      model: "@cf/black-forest-labs/flux-1-schnell",
      steps: 4,
      guidance: 3.5,
      seed: Math.floor(Math.random() * 1000000)
    };

    // Add uploaded image if provided for image-to-image
    if (uploadedImage) {
      genRequest.image = uploadedImage;
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.cloudflareAccountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.cloudflareApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(genRequest)
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status}`);
    }

    const result = await response.arrayBuffer();
    const imageId = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Upload to your storage (implement based on your storage solution)
    const imageUrl = await this.uploadToStorage(result, imageId, 'image/png');
    
    return {
      url: imageUrl,
      id: imageId
    };
  }

  /**
   * Generate video using Gemini API
   */
  private async generateVideo(prompt: string, uploadedImage?: string): Promise<{ url: string; id: string }> {
    if (this.isTestMode) {
      console.log('🎬 TEST MODE: Video generation for prompt:', prompt);
    }

    const videoRequest: any = {
      prompt: prompt,
      aspectRatio: "16:9" as const,
      personGeneration: "allow_all" as const
    };

    // Add uploaded image if provided
    if (uploadedImage) {
      videoRequest.inputImage = {
        imageBytes: uploadedImage,
        mimeType: "image/png"
      };
    }

    const result = await this.geminiVideoService.generateVideo(videoRequest);
    
    if (result.status === 'failed') {
      throw new Error('Video generation failed');
    }

    return {
      url: result.videoUrl,
      id: result.operationId
    };
  }

  /**
   * Calculate credits used based on generation type and influence (Updated for INFT system)
   */
  private calculateCreditsUsed(type: 'image' | 'video', isInfluenced: boolean): number {
    const baseCredits = type === 'image' ? 200 : 500; // Updated to match INFT system
    return baseCredits; // No bonus for influence in INFT system
  }

  /**
   * Enhance prompt with collection influence
   */
  private enhancePromptWithCollection(prompt: string, collection: string): string {
    const collectionStyles: { [key: string]: string } = {
      'bandit': 'in a street art, rebellious, urban style',
      'bandits': 'in a street art, rebellious, urban style',
      'kidz': 'in a playful, colorful, kid-friendly style',
      'derp': 'in a cartoon, playful, humorous style',
      'sonic': 'in a futuristic, tech-inspired, speed-focused style'
    };

    const style = collectionStyles[collection.toLowerCase()] || 'in a unique artistic style';
    return `${prompt} ${style}`;
  }

  /**
   * Get package type from token ID
   */
  private getPackageTypeFromTokenId(tokenId: string): number {
    // Simplified logic - in practice this would query the contract
    return ((parseInt(tokenId) % 4) + 1);
  }

  /**
   * Select provider and model based on package type
   */
  private selectProviderForPackage(packageType: number, generationType: 'image' | 'video', preferredProvider?: string): { provider: string; model: string } {
    if (preferredProvider) {
      return { provider: preferredProvider, model: this.getModelForProvider(preferredProvider, generationType, packageType) };
    }

    // Auto-select based on package tier
    switch (packageType) {
      case 1: // Starter
        return { 
          provider: generationType === 'video' ? 'cloudflare' : 'openai',
          model: generationType === 'video' ? 'stable-video' : 'gpt-4.1'
        };
      case 2: // Pro
        return { 
          provider: 'openai',
          model: generationType === 'video' ? 'gpt-5-video' : 'gpt-5'
        };
      case 3: // Business
      case 4: // Enterprise
        return { 
          provider: 'openai',
          model: generationType === 'video' ? 'enterprise-video' : 'gpt-5'
        };
      default:
        return { provider: 'cloudflare', model: 'default' };
    }
  }

  /**
   * Get model for provider
   */
  private getModelForProvider(provider: string, type: 'image' | 'video', packageType: number): string {
    const models: { [key: string]: { [key: string]: string[] } } = {
      'openai': {
        'image': ['gpt-4.1', 'gpt-5', 'dall-e-3'],
        'video': ['gpt-5-video', 'openai-video']
      },
      'cloudflare': {
        'image': ['flux-1-schnell', 'stable-diffusion'],
        'video': ['stable-video', 'cloudflare-video']
      },
      'gemini': {
        'image': ['gemini-pro', 'gemini-ultra'],
        'video': ['gemini-video', 'gemini-ultra-video']
      }
    };

    const providerModels = models[provider]?.[type];
    if (!providerModels) return 'default';

    // Select model based on package type
    const modelIndex = Math.min(packageType - 1, providerModels.length - 1);
    return providerModels[modelIndex] || 'default';
  }

  /**
   * Generate content with INFT system
   */
  private async generateWithINFT(request: {
    packageTokenId: string;
    prompt: string;
    isVideo: boolean;
    influencedCollection?: string;
    preferredModel?: string;
    userAddress: string;
  }): Promise<{ generatedTokenId: string; ipfsHash: string }> {
    // Call the INFT generation API
    const response = await fetch('/api/inft/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`INFT generation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      generatedTokenId: result.generatedTokenId,
      ipfsHash: result.ipfsHash
    };
  }

  /**
   * Upload content to IPFS
   */
  private async uploadToIPFS(contentUrl: string, generationId: string): Promise<string> {
    if (this.isTestMode) {
      return `Qm${generationId.slice(-44)}`; // Mock IPFS hash
    }

    // Implementation would upload to IPFS
    // For now, return a mock hash
    return `QmHash${Date.now()}`;
  }

  /**
   * Spend NFT credits via smart contract
   */
  private async spendNFTCredits(
    user: string, 
    packageId: number, 
    prompt: string, 
    isVideo: boolean, 
    collection: string
  ): Promise<void> {
    if (this.isTestMode) {
      console.log('💳 TEST MODE: Spending NFT credits for user:', user, 'package:', packageId);
      return;
    }
    
    // This would interact with your contract
    // Implementation depends on your web3 setup
    console.log(`Spending NFT credits for user ${user}, package ${packageId}`);
  }

  /**
   * Upload generated content to storage
   * Implement based on your storage solution (IPFS, Cloudflare R2, AWS S3, etc.)
   */
  private async uploadToStorage(data: ArrayBuffer | Blob, id: string, mimeType: string): Promise<string> {
    // Placeholder implementation
    // In production, upload to your preferred storage service
    
    // For now, return a mock URL
    const extension = mimeType.includes('image') ? 'png' : 'mp4';
    return `https://storage.srvcflo.com/generations/${id}.${extension}`;
  }

  /**
   * Get user's available credits (both standard and NFT)
   */
  async getUserCredits(userAddress: string): Promise<{
    standardCredits: number;
    nftCredits: Array<{ packageId: number; balance: number; creditAmount: number }>;
  }> {
    // Implementation would query both systems
    return {
      standardCredits: 0,
      nftCredits: []
    };
  }

  /**
   * Get generation history for user
   */
  async getUserGenerations(userAddress: string): Promise<GenerationResponse[]> {
    // Implementation would query your database
    return [];
  }

  /**
   * Save generation directly (both standard and NFT users)
   */
  async saveGeneration(generationId: string, userAddress: string): Promise<string> {
    // Implementation for saving to user's collection
    return `Saved generation ${generationId} for user ${userAddress}`;
  }

  /**
   * Mint generation as NFT (for NFT credit users)
   */
  async mintGenerationNFT(generationId: string, resultUrl: string): Promise<string> {
    // Implementation would call the contract's mintGenerationNFT function
    return `Minted NFT for generation ${generationId}`;
  }
}

// Factory function to create service instance
export function createHybridGenerationService(testMode: boolean = false): HybridGenerationService {
  return new HybridGenerationService(testMode);
}

// Create test instance for development
export function createTestHybridGenerationService(): HybridGenerationService {
  return new HybridGenerationService(true);
}

export { HybridGenerationService, GenerationRequest, GenerationResponse };
export default new HybridGenerationService();