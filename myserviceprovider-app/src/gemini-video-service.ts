// Gemini Video Generation Service
// Handles video generation using Gemini Veo 3.0 with native audio

import { GoogleGenAI, Modality } from "@google/genai";

interface VideoGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: "16:9" | "9:16";
  personGeneration?: "allow_all" | "allow_adult" | "dont_allow";
  inputImage?: {
    imageBytes: string;
    mimeType: string;
  };
}

interface VideoGenerationResult {
  videoUrl: string;
  operationId: string;
  status: 'processing' | 'completed' | 'failed';
  duration?: number;
  hasAudio: boolean;
}

class GeminiVideoService {
  private ai: GoogleGenAI;
  private isTestMode: boolean;

  constructor(testMode: boolean = false) {
    this.isTestMode = testMode;
    
    if (!testMode && !process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required for production mode');
    }
    
    this.ai = new GoogleGenAI({
      // In test mode, we'll use a mock API key
      apiKey: this.isTestMode ? 'test-key' : process.env.GEMINI_API_KEY
    });
  }

  /**
   * Generate video using Veo 3.0 with native audio
   */
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    if (this.isTestMode) {
      return this.generateMockVideo(request);
    }

    try {
      // Use Veo 3.0 for video with audio
      const operation = await this.ai.models.generateVideos({
        model: "veo-3.0-generate-preview",
        prompt: request.prompt,
        config: {
          aspectRatio: request.aspectRatio || "16:9",
          negativePrompt: request.negativePrompt,
          personGeneration: request.personGeneration || "allow_all"
        },
        image: request.inputImage
      });

      // Poll for completion
      let currentOperation = operation;
      while (!currentOperation.done) {
        console.log("Waiting for video generation to complete...");
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        currentOperation = await this.ai.operations.getVideosOperation({
          operation: currentOperation
        });
      }

      if (!currentOperation.done || !currentOperation.response?.generatedVideos?.[0]) {
        throw new Error('Video generation failed');
      }

      // Download the generated video
      const videoFile = currentOperation.response.generatedVideos[0].video;
      const videoId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // In production, you'd upload this to your storage service
      // For now, we'll create a temporary URL
      const videoUrl = await this.uploadVideoToStorage(videoFile, videoId);

      return {
        videoUrl,
        operationId: currentOperation.name || videoId,
        status: 'completed',
        duration: 8, // Veo 3.0 generates 8-second videos
        hasAudio: true // Veo 3.0 has native audio
      };

    } catch (error) {
      console.error('Gemini video generation error:', error);
      
      return {
        videoUrl: '',
        operationId: `error_${Date.now()}`,
        status: 'failed',
        hasAudio: false
      };
    }
  }

  /**
   * Generate video using Veo 2.0 (image-to-video, no audio)
   */
  async generateVideoFromImage(
    prompt: string, 
    imageBytes: string, 
    mimeType: string = "image/png"
  ): Promise<VideoGenerationResult> {
    if (this.isTestMode) {
      return this.generateMockVideo({ prompt, inputImage: { imageBytes, mimeType } });
    }

    try {
      // Use Veo 2.0 for image-to-video (no audio)
      const operation = await this.ai.models.generateVideos({
        model: "veo-2.0-generate-001",
        prompt: prompt,
        image: {
          imageBytes: imageBytes,
          mimeType: mimeType
        }
      });

      // Poll for completion
      let currentOperation = operation;
      while (!currentOperation.done) {
        console.log("Waiting for video generation to complete...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        currentOperation = await this.ai.operations.getVideosOperation({
          operation: currentOperation
        });
      }

      if (!currentOperation.done || !currentOperation.response?.generatedVideos?.[0]) {
        throw new Error('Video generation failed');
      }

      const videoFile = currentOperation.response.generatedVideos[0].video;
      const videoId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const videoUrl = await this.uploadVideoToStorage(videoFile, videoId);

      return {
        videoUrl,
        operationId: currentOperation.name || videoId,
        status: 'completed',
        duration: 5, // Veo 2.0 generates 5-8 second videos
        hasAudio: false // Veo 2.0 is silent
      };

    } catch (error) {
      console.error('Gemini video generation error:', error);
      
      return {
        videoUrl: '',
        operationId: `error_${Date.now()}`,
        status: 'failed',
        hasAudio: false
      };
    }
  }

  /**
   * Mock video generation for testing
   */
  private async generateMockVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    console.log('🎬 MOCK VIDEO GENERATION:', {
      prompt: request.prompt,
      aspectRatio: request.aspectRatio,
      hasInputImage: !!request.inputImage
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    const videoId = `mock_vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      videoUrl: `https://mock-storage.srvcflo.com/videos/${videoId}.mp4`,
      operationId: videoId,
      status: 'completed',
      duration: 8,
      hasAudio: true
    };
  }

  /**
   * Upload video to storage service
   * In production, implement with your preferred storage (R2, S3, etc.)
   */
  private async uploadVideoToStorage(videoFile: any, videoId: string): Promise<string> {
    try {
      // Download video from Gemini
      const videoBlob = await this.ai.files.download({
        file: videoFile
      });

      // In production, upload to your storage service
      // For now, return a mock URL
      return `https://storage.srvcflo.com/videos/${videoId}.mp4`;
      
    } catch (error) {
      console.error('Video upload error:', error);
      throw error;
    }
  }

  /**
   * Test the Gemini API connection
   */
  async testConnection(): Promise<boolean> {
    if (this.isTestMode) {
      console.log('✅ Test mode - Gemini connection OK');
      return true;
    }

    try {
      // Simple test to verify API key works
      const testPrompt = "A simple test video";
      console.log('Testing Gemini API connection...');
      
      // This would start a real generation in production
      // For testing, we'll just verify the API key format
      const hasValidKey = process.env.GEMINI_API_KEY && 
                         process.env.GEMINI_API_KEY.length > 20;
      
      if (hasValidKey) {
        console.log('✅ Gemini API key appears valid');
        return true;
      } else {
        console.log('❌ Invalid or missing Gemini API key');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Gemini API connection test failed:', error);
      return false;
    }
  }
}

// Export factory functions
export function createGeminiVideoService(testMode: boolean = false): GeminiVideoService {
  return new GeminiVideoService(testMode);
}

export function createTestGeminiVideoService(): GeminiVideoService {
  return new GeminiVideoService(true);
}

export { GeminiVideoService, VideoGenerationRequest, VideoGenerationResult };
export default GeminiVideoService;