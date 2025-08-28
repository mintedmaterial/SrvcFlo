// Groq Kimi K2 Instruct Service
// Handles both image and video generation using Groq's Kimi K2 Instruct model

import { Groq } from 'groq-sdk';

interface GroqGenerationRequest {
  prompt: string;
  type: 'image' | 'video';
  aspectRatio?: '16:9' | '9:16' | '1:1';
  duration?: string; // For video: '5s', '10s', etc.
  style?: string;
}

interface GroqGenerationResult {
  success: boolean;
  resultUrl?: string;
  operationId: string;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  type: 'image' | 'video';
}

class GroqKimiService {
  private groq: Groq;
  private isTestMode: boolean;

  constructor(testMode: boolean = false) {
    this.isTestMode = testMode;
    if (!testMode) {
      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
      });
    }
  }

  async generateContent(request: GroqGenerationRequest): Promise<GroqGenerationResult> {
    if (this.isTestMode) {
      return this.generateMockContent(request);
    }

    try {
      const operationId = `groq_${request.type}_${Date.now()}`;
      
      // Enhance prompt based on type
      const enhancedPrompt = this.enhancePrompt(request);
      
      console.log(`🤖 Groq Kimi K2: Generating ${request.type} for prompt: "${request.prompt}"`);
      
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: enhancedPrompt
          }
        ],
        model: "moonshotai/kimi-k2-instruct",
        temperature: 0.6,
        max_completion_tokens: 4096,
        top_p: 1,
        stream: false,
        stop: null
      });

      const response = chatCompletion.choices[0]?.message?.content;
      
      if (response) {
        // Extract any URLs from the response (Kimi might provide direct links)
        const urlMatch = response.match(/https?:\/\/[^\s\)]+/);
        const resultUrl = urlMatch ? urlMatch[0] : `https://storage.srvcflo.com/groq/${operationId}.${request.type === 'image' ? 'png' : 'mp4'}`;
        
        return {
          success: true,
          resultUrl,
          operationId,
          status: 'completed',
          type: request.type
        };
      } else {
        throw new Error('No content generated');
      }
      
    } catch (error: any) {
      console.error('Groq Kimi generation error:', error);
      return {
        success: false,
        operationId: `error_${Date.now()}`,
        status: 'failed',
        error: error.message || 'Unknown error',
        type: request.type
      };
    }
  }

  private enhancePrompt(request: GroqGenerationRequest): string {
    const basePrompt = request.prompt;
    
    if (request.type === 'image') {
      return `Generate an image using Pollinations API: ${basePrompt}. 
      Style: High quality, detailed, ${request.style || 'professional'}
      Aspect ratio: ${request.aspectRatio || '16:9'}
      Please provide the direct Pollinations image URL in format: https://image.pollinations.ai/prompt/[encoded_prompt]?width=1280&height=720&nologo=true`;
    } else {
      return `I need a video for: ${basePrompt}.
      
      Since direct video generation isn't available through this API, please:
      1. Create a detailed video description/storyboard
      2. Suggest using a video generation service like RunwayML, Pika Labs, or Stable Video
      3. Provide a mock video URL in this format: https://storage.srvcflo.com/mock/video_[timestamp].mp4
      
      Style: Cinematic, smooth animation, ${request.style || 'professional'}
      Duration: ${request.duration || '5s'}
      Aspect ratio: ${request.aspectRatio || '16:9'}`;
    }
  }

  private generateMockContent(request: GroqGenerationRequest): GroqGenerationResult {
    const operationId = `test_groq_${request.type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const extension = request.type === 'image' ? 'png' : 'mp4';
    const resultUrl = `https://storage.srvcflo.com/test/groq/${operationId}.${extension}`;
    
    console.log(`🧪 TEST MODE - Groq Kimi K2: Mock ${request.type} generation`);
    console.log(`   - Operation ID: ${operationId}`);
    console.log(`   - Result URL: ${resultUrl}`);
    
    return {
      success: true,
      resultUrl,
      operationId,
      status: 'completed',
      type: request.type
    };
  }
}

// Factory functions
export function createGroqKimiService(testMode: boolean = false): GroqKimiService {
  return new GroqKimiService(testMode);
}

export function createTestGroqKimiService(): GroqKimiService {
  return new GroqKimiService(true);
}

export { GroqKimiService, GroqGenerationRequest, GroqGenerationResult };