import { useState, useCallback } from 'react';

export interface OpenAIStreamStatus {
  status: 'idle' | 'initializing' | 'checking_limits' | 'rate_limit_ok' | 'checking_credits' | 
          'credits_deducted' | 'dev_access' | 'loading_collection' | 'collection_loaded' | 
          'collection_warning' | 'generating' | 'saving' | 'completed' | 'error';
  message?: string;
  generationId?: string;
  imageUrl?: string;
  prompt?: string;
  collection?: string;
  collectionDescription?: string;
  creditsUsed?: number;
  provider?: string;
  model?: string;
  error?: string;
  requiredCredits?: number;
  availableCredits?: number;
  remainingRequests?: number;
  resetTime?: string;
}

export interface OpenAIImageGenerationParams {
  prompt: string;
  collection?: string;
  userAddress: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export function useOpenAIImageStream() {
  const [status, setStatus] = useState<OpenAIStreamStatus>({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(false);

  const generateImage = useCallback(async (params: OpenAIImageGenerationParams) => {
    setIsLoading(true);
    setStatus({ status: 'initializing' });

    try {
      const response = await fetch('/api/generate/openai-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                setStatus({ 
                  status: 'error', 
                  error: data.error,
                  requiredCredits: data.requiredCredits,
                  availableCredits: data.availableCredits,
                  remainingRequests: data.remainingRequests,
                  resetTime: data.resetTime
                });
                setIsLoading(false);
                return;
              }

              setStatus({
                status: data.status || 'generating',
                message: data.message,
                generationId: data.generationId,
                imageUrl: data.imageUrl,
                prompt: data.prompt,
                collection: data.collection,
                collectionDescription: data.collectionDescription,
                creditsUsed: data.creditsUsed,
                provider: data.provider,
                model: data.model,
                remainingRequests: data.remainingRequests,
                resetTime: data.resetTime,
              });

              if (data.status === 'completed') {
                setIsLoading(false);
                return;
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('OpenAI image generation error:', error);
      setStatus({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setStatus({ status: 'idle' });
    setIsLoading(false);
  }, []);

  return {
    status,
    isLoading,
    generateImage,
    reset,
  };
}

export default useOpenAIImageStream;