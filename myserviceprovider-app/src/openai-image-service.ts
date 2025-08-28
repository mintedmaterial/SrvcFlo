// OpenAI Image Generation Service
// Handles premium image generation using OpenAI GPT-4.1/5 with collection inspiration

import { OpenAI } from "openai";
import fs from "fs/promises";
import path from "path";

interface ImageGenerationRequest {
  prompt: string;
  collection?: string;
  negativePrompt?: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
  userAddress: string;
  paymentVerified: boolean;
  packageTokenId?: string; // INFT package ID
  aiModel?: string; // Specific model request (gpt-4.1, gpt-5, dall-e-3)
  creditType?: 'standard' | 'inft'; // Credit type for different handling
}

interface ImageGenerationResult {
  imageUrl?: string;
  imageData?: string; // base64 encoded
  operationId: string;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  tokensUsed?: number;
  collectionUsed?: string;
  ipfsHash?: string; // IPFS hash for INFT generations
  generatedTokenId?: string; // ERC-1155 token ID
  aiModelUsed?: string; // Actual AI model used
}

interface CollectionImage {
  filename: string;
  path: string;
  base64?: string;
}

class OpenAIImageService {
  private client: OpenAI;
  private isTestMode: boolean;
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();
  private maxRequestsPerHour = 10;

  constructor(testMode: boolean = false) {
    this.isTestMode = testMode;
    
    if (!testMode && !process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for production mode');
    }
    
    this.client = new OpenAI({
      apiKey: this.isTestMode ? 'test-key' : process.env.OPENAI_API_KEY
    });
  }

  /**
   * Check rate limiting for user
   */
  private checkRateLimit(userAddress: string): boolean {
    // Skip rate limiting for dev wallets
    if (this.isDevWallet(userAddress)) {
      return true;
    }

    const now = Date.now();
    const userLimit = this.rateLimits.get(userAddress);
    
    if (!userLimit || now > userLimit.resetTime) {
      // Reset or create new limit window
      this.rateLimits.set(userAddress, {
        count: 1,
        resetTime: now + (60 * 60 * 1000) // 1 hour from now
      });
      return true;
    }
    
    if (userLimit.count >= this.maxRequestsPerHour) {
      return false;
    }
    
    userLimit.count++;
    return true;
  }

  /**
   * Check if wallet is a dev wallet (bypass rate limits and payment)
   */
  private isDevWallet(address: string): boolean {
    const devWallets = [
      "0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8", // Main dev wallet
      // Add other dev wallets as needed
    ];
    return devWallets.includes(address.toLowerCase());
  }

  /**
   * Load collection images for inspiration
   */
  private async loadCollectionImages(collectionName: string): Promise<CollectionImage[]> {
    try {
      const collectionsPath = path.join(process.cwd(), 'public', 'collections', collectionName);
      const files = await fs.readdir(collectionsPath);
      
      const imageFiles = files.filter(file => 
        /\.(png|jpg|jpeg|webp)$/i.test(file) && !file.includes('README')
      );
      
      // Limit to 5 images to manage token costs
      const selectedFiles = imageFiles.slice(0, 5);
      
      const images: CollectionImage[] = [];
      for (const filename of selectedFiles) {
        const imagePath = path.join(collectionsPath, filename);
        try {
          const imageBuffer = await fs.readFile(imagePath);
          const base64 = imageBuffer.toString('base64');
          images.push({
            filename,
            path: imagePath,
            base64
          });
        } catch (error) {
          console.warn(`Failed to load image ${filename}:`, error);
        }
      }
      
      return images;
    } catch (error) {
      console.warn(`Failed to load collection ${collectionName}:`, error);
      return [];
    }
  }

  /**
   * Create enhanced prompt with collection context
   */
  private createEnhancedPrompt(originalPrompt: string, collection?: string, images?: CollectionImage[]): string {
    let enhancedPrompt = originalPrompt;
    
    if (collection && images && images.length > 0) {
      const collectionContext = this.getCollectionContext(collection);
      enhancedPrompt = `${originalPrompt}. Style inspiration from ${collection} collection: ${collectionContext}. Maintain the artistic style and quality of the reference images while creating something unique.`;
    }
    
    return enhancedPrompt;
  }

  /**
   * Get collection context description
   */
  private getCollectionContext(collection: string): string {
    const contexts: { [key: string]: string } = {
      'bandit-kidz': 'playful cartoon characters with vibrant colors, street art aesthetic',
      'beardies': 'bearded character art with detailed facial features and expressions',
      'bonkers-nft': 'abstract and surreal art with bold geometric patterns',
      'derps': 'cute and quirky character designs with exaggerated features',
      'goggles-exe': 'cyberpunk aesthetic with technological elements and neon colors',
      'lazy-bear': 'relaxed bear characters with cozy and comfortable vibes',
      'metronix': 'futuristic and metallic designs with precision engineering aesthetics',
      'pop-skullys': 'colorful skull art with pop art influences',
      'razors': 'sharp and edgy designs with blade-like elements',
      'rtards': 'abstract character art with unique artistic expressions',
      'whale': 'oceanic themes with whale motifs and aquatic elements'
    };
    
    return contexts[collection] || 'unique artistic style';
  }

  /**
   * Generate image using OpenAI with optional collection inspiration
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const operationId = `openai_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Check rate limiting
    if (!this.checkRateLimit(request.userAddress)) {
      return {
        operationId,
        status: 'failed',
        error: 'Rate limit exceeded. Please try again in an hour.'
      };
    }

    // Check payment for non-dev wallets (skip for INFT since they pre-pay)
    if (!this.isDevWallet(request.userAddress) && !request.paymentVerified && request.creditType !== 'inft') {
      return {
        operationId,
        status: 'failed',
        error: 'Payment verification required. 50 credits needed for OpenAI generation.'
      };
    }

    if (this.isTestMode) {
      return this.generateMockImage(request, operationId);
    }

    try {
      // Load collection images if specified
      let collectionImages: CollectionImage[] = [];
      if (request.collection) {
        collectionImages = await this.loadCollectionImages(request.collection);
      }

      // Create enhanced prompt with collection context
      const enhancedPrompt = this.createEnhancedPrompt(
        request.prompt, 
        request.collection, 
        collectionImages
      );

      // Prepare the input for OpenAI Responses API
      const input = [
        { 
          role: "user" as const, 
          content: enhancedPrompt 
        }
      ];

      // Add collection images as additional context if available
      if (collectionImages.length > 0) {
        const imageContext = collectionImages.map(img => ({
          role: "user" as const,
          content: [
            {
              type: "image_url" as const,
              image_url: {
                url: `data:image/png;base64,${img.base64}`
              }
            }
          ]
        }));
        input.push(...imageContext);
      }

      // Determine which model to use based on request or package
      const modelToUse = this.selectModelForRequest(request);
      
      // Generate image using OpenAI API based on model
      let response: any;
      let imageData: string;
      
      if (modelToUse === 'dall-e-3' || modelToUse === 'dall-e-2') {
        // Use DALL-E for direct image generation
        const dalleResponse = await this.client.images.generate({
          model: modelToUse,
          prompt: enhancedPrompt,
          size: request.size || "1024x1024",
          quality: request.quality || "standard",
          style: request.style || "vivid",
          response_format: "b64_json",
          n: 1
        });
        
        imageData = dalleResponse.data[0].b64_json || '';
      } else {
        // Use GPT models with image generation capability
        response = await this.client.responses.create({
          model: modelToUse,
          input,
          tools: [{ type: "image_generation" }],
        });
        
        // Extract image data from response
        imageData = response.output
          ?.filter((output: any) => output.type === "image_generation_call")
          ?.map((output: any) => output.result)[0] || '';
      }

      if (imageData) {
        return {
          imageData: imageData,
          operationId,
          status: 'completed',
          collectionUsed: request.collection,
          tokensUsed: response?.usage?.total_tokens || 0,
          aiModelUsed: modelToUse
        };
      } else {
        throw new Error('No image data returned from OpenAI');
      }

    } catch (error: any) {
      console.error(`OpenAI generation failed for ${operationId}:`, error);
      
      return {
        operationId,
        status: 'failed',
        error: error.message || 'Image generation failed'
      };
    }
  }

  /**
   * Generate mock image for testing
   */
  private async generateMockImage(request: ImageGenerationRequest, operationId: string): Promise<ImageGenerationResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock base64 image data (1x1 pixel PNG)
    const mockImageData = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    
    return {
      imageData: mockImageData,
      operationId,
      status: 'completed',
      collectionUsed: request.collection,
      tokensUsed: 1000
    };
  }

  /**
   * Check service health
   */
  async healthCheck(): Promise<{ status: string; available: boolean }> {
    if (this.isTestMode) {
      return { status: 'Test mode active', available: true };
    }

    try {
      // Simple API check
      const models = await this.client.models.list();
      return { 
        status: 'OpenAI API accessible', 
        available: true 
      };
    } catch (error) {
      return { 
        status: 'OpenAI API unavailable', 
        available: false 
      };
    }
  }

  /**
   * Get available collections
   */
  async getAvailableCollections(): Promise<string[]> {
    try {
      const collectionsPath = path.join(process.cwd(), 'public', 'collections');
      const collections = await fs.readdir(collectionsPath);
      
      // Filter to only return directories
      const validCollections = [];
      for (const collection of collections) {
        try {
          const collectionPath = path.join(collectionsPath, collection);
          const stat = await fs.stat(collectionPath);
          if (stat.isDirectory()) {
            validCollections.push(collection);
          }
        } catch (error) {
          // Skip invalid collections
        }
      }
      
      return validCollections;
    } catch (error) {
      console.error('Failed to get collections:', error);
      return [];
    }
  }

  /**
   * Get rate limit info for user
   */
  getRateLimitInfo(userAddress: string): { remaining: number; resetTime: number } {
    if (this.isDevWallet(userAddress)) {
      return { remaining: 999, resetTime: 0 };
    }

    const userLimit = this.rateLimits.get(userAddress);
    if (!userLimit || Date.now() > userLimit.resetTime) {
      return { remaining: this.maxRequestsPerHour, resetTime: Date.now() + (60 * 60 * 1000) };
    }

    return { 
      remaining: Math.max(0, this.maxRequestsPerHour - userLimit.count),
      resetTime: userLimit.resetTime
    };
  }

  /**
   * Select appropriate model based on request parameters
   */
  private selectModelForRequest(request: ImageGenerationRequest): string {
    // If specific model is requested
    if (request.aiModel) {
      return request.aiModel;
    }

    // For INFT packages, determine based on package
    if (request.creditType === 'inft' && request.packageTokenId) {
      const packageType = this.getPackageTypeFromTokenId(request.packageTokenId);
      
      switch (packageType) {
        case 1: // Starter
          return 'gpt-4.1';
        case 2: // Pro
          return 'gpt-5';
        case 3: // Business
        case 4: // Enterprise
          return 'gpt-5';
        default:
          return 'dall-e-3';
      }
    }

    // Default to DALL-E-3 for standard generations
    return 'dall-e-3';
  }

  /**
   * Get package type from INFT token ID
   */
  private getPackageTypeFromTokenId(tokenId: string): number {
    // Simplified logic - in practice would query the contract
    return ((parseInt(tokenId) % 4) + 1);
  }
}

export { OpenAIImageService, type ImageGenerationRequest, type ImageGenerationResult };