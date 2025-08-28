import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Environment interface for Cloudflare Worker
interface Env {
  AI: any; // Cloudflare AI binding
  SONIC_PAYMENT_CONTRACT?: string;
  GEMINI_API_KEY?: string;
  [key: string]: any;
}

// Cloudflare AI model configurations
const IMAGE_MODELS = [
  "@cf/black-forest-labs/flux-1-schnell",
  "@cf/bytedance/stable-diffusion-xl-lightning", 
  "@cf/lykon/dreamshaper-8-lcm",
  "@cf/runwayml/stable-diffusion-v1-5-img2img",
  "@cf/runwayml/stable-diffusion-v1-5-inpainting"
];

const VIDEO_MODELS = [
  // Video models would be added here when available
  // "@cf/example/video-model"
];

// Payment verification interface
interface PaymentVerification {
  transactionHash: string;
  userAddress: string;
  paymentType: 'credits' | 's_tokens' | 'usdc' | 'free';
  verified: boolean;
}

interface GenerationState {
  totalGenerations: number;
  userGenerations: { [address: string]: number };
  freeGenerationsToday: { [address: string]: { count: number; date: string } };
  pendingGenerations: { [id: string]: any };
}

export class CloudflareAIMCPServer extends McpAgent<Env, GenerationState, {}> {
  server = new McpServer({
    name: "ServiceFlow AI Generation",
    version: "1.0.0",
  });

  initialState: GenerationState = {
    totalGenerations: 0,
    userGenerations: {},
    freeGenerationsToday: {},
    pendingGenerations: {},
  };

  async init() {
    // Image generation tool
    this.server.tool(
      "generate_image",
      "Generate an image using Cloudflare AI models with payment verification",
      {
        prompt: z.string().min(1).max(2048).describe("Text description of the image to generate"),
        paymentTx: z.string().optional().describe("Transaction hash for payment verification"),
        userAddress: z.string().describe("User's wallet address"),
        paymentType: z.enum(['free', 'credits', 's_tokens', 'usdc']).describe("Type of payment used"),
        width: z.number().min(256).max(2048).optional().default(1024).describe("Image width"),
        height: z.number().min(256).max(2048).optional().default(1024).describe("Image height"),
        steps: z.number().min(1).max(8).optional().default(4).describe("Number of diffusion steps"),
      },
      async ({ prompt, paymentTx, userAddress, paymentType, width, height, steps }) => {
        try {
          // Verify payment first
          const paymentValid = await this.verifyPayment({
            transactionHash: paymentTx || '',
            userAddress,
            paymentType,
            verified: false
          });

          if (!paymentValid) {
            return {
              content: [{
                type: "text",
                text: "Payment verification failed. Please ensure your transaction is confirmed."
              }]
            };
          }

          // Check free generation limits
          if (paymentType === 'free') {
            if (!this.canUseFreeGeneration(userAddress)) {
              return {
                content: [{
                  type: "text", 
                  text: "Daily free generation limit reached. Please use paid generation or try again tomorrow."
                }]
              };
            }
          }

          // Generate image with fallback
          const imageResult = await this.generateImageWithFallback(prompt, { width, height, steps });
          
          if (!imageResult.success) {
            return {
              content: [{
                type: "text",
                text: `Image generation failed: ${imageResult.error}`
              }]
            };
          }

          // Update state
          this.updateGenerationStats(userAddress, paymentType);

          return {
            content: [
              {
                type: "text",
                text: `Image generated successfully using ${imageResult.modelUsed}`
              },
              {
                type: "image",
                data: imageResult.imageData,
                mimeType: "image/png"
              }
            ]
          };

        } catch (error: any) {
          console.error('Image generation error:', error);
          return {
            content: [{
              type: "text",
              text: `Generation failed: ${error?.message || 'Unknown error'}`
            }]
          };
        }
      }
    );

    // Video generation tool (when available)
    this.server.tool(
      "generate_video",
      "Generate a video using Cloudflare AI models with payment verification",
      {
        prompt: z.string().min(1).max(2048).describe("Text description of the video to generate"),
        paymentTx: z.string().optional().describe("Transaction hash for payment verification"),
        userAddress: z.string().describe("User's wallet address"),
        paymentType: z.enum(['credits', 's_tokens', 'usdc']).describe("Type of payment used (free not available for video)"),
        duration: z.number().min(1).max(10).optional().default(3).describe("Video duration in seconds"),
      },
      async ({ prompt, paymentTx, userAddress, paymentType, duration }) => {
        try {
          // Verify payment (video requires payment)
          const paymentValid = await this.verifyPayment({
            transactionHash: paymentTx || '',
            userAddress,
            paymentType,
            verified: false
          });

          if (!paymentValid) {
            return {
              content: [{
                type: "text",
                text: "Payment verification failed. Video generation requires payment."
              }]
            };
          }

          // Generate video with fallback
          const videoResult = await this.generateVideoWithFallback(prompt, { duration });
          
          if (!videoResult.success) {
            return {
              content: [{
                type: "text",
                text: `Video generation failed: ${videoResult.error}`
              }]
            };
          }

          // Update state
          this.updateGenerationStats(userAddress, paymentType);

          return {
            content: [
              {
                type: "text",
                text: `Video generated successfully using ${videoResult.modelUsed}`
              },
              {
                type: "resource",
                resource: {
                  uri: videoResult.videoUrl,
                  mimeType: "video/mp4",
                  text: `Generated video: ${prompt}`
                }
              }
            ]
          };

        } catch (error: any) {
          console.error('Video generation error:', error);
          return {
            content: [{
              type: "text",
              text: `Video generation failed: ${error?.message || 'Unknown error'}`
            }]
          };
        }
      }
    );

    // Get user generation stats
    this.server.tool(
      "get_user_stats",
      "Get user's generation statistics and remaining free generations",
      {
        userAddress: z.string().describe("User's wallet address"),
      },
      async ({ userAddress }) => {
        const userStats = this.getUserStats(userAddress);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(userStats, null, 2)
          }]
        };
      }
    );
  }

  // Verify payment on Sonic blockchain
  async verifyPayment(payment: PaymentVerification): Promise<boolean> {
    try {
      if (payment.paymentType === 'free') {
        return true; // Free generations don't require blockchain verification
      }

      if (!payment.transactionHash) {
        return false;
      }

      // Check if transaction exists and is confirmed on Sonic
      // This would integrate with your Sonic payment contract
      const response = await fetch(`https://api.sonicscan.org/api/tx/${payment.transactionHash}`);
      const txData = await response.json();

      if (!txData || !txData.success) {
        return false;
      }

      // Verify the transaction called our payment contract with correct amount
      const contractAddress = this.env.SONIC_PAYMENT_CONTRACT;
      const isValidPayment = txData.to === contractAddress && 
                           txData.status === '1'; // Success

      return isValidPayment;

    } catch (error: any) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  // Check if user can use free generation (daily limit)
  canUseFreeGeneration(userAddress: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    const userFreeGens = this.state.freeGenerationsToday[userAddress];
    
    if (!userFreeGens || userFreeGens.date !== today) {
      return true; // First generation today
    }
    
    return userFreeGens.count < 3; // Max 3 free per day
  }

  // Generate image with model fallback
  async generateImageWithFallback(prompt: string, options: { width?: number; height?: number; steps?: number }) {
    for (const model of IMAGE_MODELS) {
      try {
        console.log(`Trying image generation with ${model}`);
        
        const result = await this.env.AI.run(model, {
          prompt,
          width: options.width || 1024,
          height: options.height || 1024,
          steps: options.steps || 4,
        });

        if (result && result.image) {
          return {
            success: true,
            imageData: result.image,
            modelUsed: model
          };
        }

      } catch (error: any) {
        console.error(`Model ${model} failed:`, error);
        continue;
      }
    }

    return {
      success: false,
      error: "All image models failed to generate"
    };
  }

  // Generate video with model fallback
  async generateVideoWithFallback(prompt: string, options: { duration?: number }) {
    // Video generation not yet available in Cloudflare AI
    // This is a placeholder for when video models are added
    
    try {
      // For now, return a placeholder response
      return {
        success: false,
        error: "Video generation not yet available in Cloudflare AI"
      };
      
      // Future implementation:
      // for (const model of VIDEO_MODELS) {
      //   try {
      //     const result = await this.env.AI.run(model, {
      //       prompt,
      //       duration: options.duration || 3,
      //     });
      //
      //     if (result && result.video) {
      //       return {
      //         success: true,
      //         videoUrl: result.video,
      //         modelUsed: model
      //       };
      //     }
      //   } catch (error) {
      //     console.error(`Video model ${model} failed:`, error);
      //     continue;
      //   }
      // }

    } catch (error: any) {
      return {
        success: false,
        error: `Video generation error: ${error?.message || 'Unknown error'}`
      };
    }
  }

  // Update generation statistics
  updateGenerationStats(userAddress: string, paymentType: string) {
    const newState = { ...this.state };
    
    // Update total generations
    newState.totalGenerations += 1;
    
    // Update user generations
    if (!newState.userGenerations[userAddress]) {
      newState.userGenerations[userAddress] = 0;
    }
    newState.userGenerations[userAddress] += 1;
    
    // Update free generation count if applicable
    if (paymentType === 'free') {
      const today = new Date().toISOString().split('T')[0];
      if (!newState.freeGenerationsToday[userAddress] || 
          newState.freeGenerationsToday[userAddress].date !== today) {
        newState.freeGenerationsToday[userAddress] = { count: 1, date: today };
      } else {
        newState.freeGenerationsToday[userAddress].count += 1;
      }
    }
    
    this.setState(newState);
  }

  // Get user statistics
  getUserStats(userAddress: string) {
    const today = new Date().toISOString().split('T')[0];
    const userFreeGens = this.state.freeGenerationsToday[userAddress];
    const freeGensUsed = (userFreeGens && userFreeGens.date === today) ? userFreeGens.count : 0;
    
    return {
      totalGenerations: this.state.userGenerations[userAddress] || 0,
      freeGenerationsUsedToday: freeGensUsed,
      freeGenerationsRemaining: Math.max(0, 3 - freeGensUsed),
      canUseFreeGeneration: this.canUseFreeGeneration(userAddress)
    };
  }

  // Handle state updates
  onStateUpdate(state: GenerationState) {
    console.log('Generation state updated:', {
      totalGenerations: state.totalGenerations,
      activeUsers: Object.keys(state.userGenerations).length
    });
  }
}

// Export default instance
export default CloudflareAIMCPServer;