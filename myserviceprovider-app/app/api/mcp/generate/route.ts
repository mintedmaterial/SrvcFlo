import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Import Groq for Kimi K2 Instruct integration
import { Groq } from 'groq-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      type, 
      prompt, 
      paymentTx, 
      userAddress, 
      paymentType, 
      width, 
      height, 
      steps,
      duration,
      model,
      provider // New: Allow specifying provider (cloudflare, gemini, groq-kimi)
    } = body;

    // Validate required fields
    if (!prompt || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: prompt and type' },
        { status: 400 }
      );
    }

    console.log('MCP Generation Request:', { type, prompt, paymentType, userAddress });

    // Import dev wallet utilities
    const { isDevWallet } = require('@/lib/dev-wallet-config');
    
    // Check if this is a dev wallet for unlimited access
    const isDevUser = userAddress && isDevWallet(userAddress);
    if (isDevUser) {
      console.log('🛠️ Dev wallet detected - using premium generation');
    }

    // Handle different payment types
    if (paymentType === 'free' || (paymentType === 'credits' && isDevUser) || paymentType === 'dev-premium') {
      try {
        // Select model based on user type and generation type
        let model;
        let modelQuality = 'basic';
        
        if (type === 'image') {
          if (isDevUser || paymentType === 'dev-premium') {
            // Premium models for dev users
            const premiumModels = [
              '@cf/black-forest-labs/flux-1-schnell',
              '@cf/stabilityai/stable-diffusion-xl-base-1.0',
              '@cf/runwayml/stable-diffusion-v1-5',
            ];
            model = premiumModels[Math.floor(Math.random() * premiumModels.length)];
            modelQuality = 'premium';
          } else {
            // Basic models for free users
            const basicModels = [
              '@cf/stabilityai/stable-diffusion-xl-base-1.0',
              '@cf/runwayml/stable-diffusion-v1-5',
            ];
            model = basicModels[Math.floor(Math.random() * basicModels.length)];
          }
        } else {
          // Video models
          if (isDevUser || paymentType === 'dev-premium') {
            model = '@cf/runwayml/stable-video-diffusion-img2vid'; // Better video model
            modelQuality = 'premium';
          } else {
            model = '@cf/bytedance/stable-video-diffusion-img2vid';
          }
        }

        console.log(`Using ${modelQuality} Cloudflare AI model: ${model} for ${type} generation (dev user: ${isDevUser})`);

        // Enhance prompt for dev users
        const enhancedPrompt = (isDevUser || paymentType === 'dev-premium') 
          ? `${prompt}. High quality, professional, detailed, sharp focus, excellent composition, vivid colors.`
          : prompt;

        // Check if we're in Cloudflare Workers environment (has AI binding)
        const env = process.env;
        let result;

        if (typeof env.AI !== 'undefined') {
          // We're in Cloudflare Workers - use the AI binding directly
          console.log('Using Cloudflare Workers AI binding');
          const aiResult = await env.AI.run(model, {
            prompt: enhancedPrompt,
            num_steps: (isDevUser || paymentType === 'dev-premium') ? 30 : (steps || 20),
            guidance: (isDevUser || paymentType === 'dev-premium') ? 8.5 : 7.5,
            height: height || 1024,
            width: width || 1024,
          });
          
          // AI binding returns { image: "base64_string" } for image models
          result = aiResult;
        } else {
          // We're in local development - use REST API
          console.log('Using Cloudflare REST API for local development');
          const cloudflareResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: enhancedPrompt,
                num_steps: (isDevUser || paymentType === 'dev-premium') ? 30 : (steps || 20),
                guidance: (isDevUser || paymentType === 'dev-premium') ? 8.5 : 7.5,
                height: height || 1024,
                width: width || 1024,
              }),
            }
          );

          if (!cloudflareResponse.ok) {
            const errorText = await cloudflareResponse.text();
            console.error('Cloudflare API error response:', errorText);
            throw new Error(`Cloudflare API error: ${cloudflareResponse.status} - ${errorText}`);
          }

          // Cloudflare AI API returns binary image data directly for image models
          const imageBuffer = await cloudflareResponse.arrayBuffer();
          console.log('Received binary image data, size:', imageBuffer.byteLength);
          
          // Convert binary data to base64
          result = Buffer.from(imageBuffer).toString('base64');
        }

        // Handle the result based on the response format
        let base64Image;
        if (result instanceof ArrayBuffer) {
          // Direct ArrayBuffer from AI binding
          base64Image = Buffer.from(result).toString('base64');
        } else if (typeof result === 'string') {
          // Already converted to base64 string (from REST API)
          base64Image = result;
        } else if (result && typeof result === 'object' && result.image) {
          // JSON response with image field
          base64Image = result.image;
        } else if (Array.isArray(result) && result.length > 0) {
          // Array of results, take the first one
          base64Image = result[0];
        } else {
          console.error('Unexpected result format:', typeof result, result);
          throw new Error('Unexpected response format from Cloudflare AI');
        }

        // Ensure we have valid base64 data
        if (!base64Image || base64Image.length === 0) {
          throw new Error('No image data received from Cloudflare AI');
        }

        const response = {
          success: true,
          imageData: type === 'image' ? base64Image : undefined,
          videoUrl: type === 'video' ? `data:video/mp4;base64,${base64Image}` : undefined,
          model: model,
          timestamp: Date.now(),
          paymentType: 'free'
        };

        console.log('Free generation successful, image data length:', base64Image.length);
        return NextResponse.json(response);
      } catch (error) {
        console.error('Cloudflare AI generation error:', error);
        return NextResponse.json({
          success: false,
          error: `Free generation failed: ${error.message}`,
          details: error.toString()
        }, { status: 500 });
      }
    }

    // Handle credit-based generation for regular users
    if (paymentType === 'credits' && !isDevUser) {
      try {
        console.log(`Processing credit-based generation for user: ${userAddress}`);
        
        // TODO: Implement credit deduction logic here
        // For now, use the same logic as paid generation
        
        // Select premium models for credit users
        let model;
        if (type === 'image') {
          const premiumModels = [
            '@cf/black-forest-labs/flux-1-schnell',
            '@cf/stabilityai/stable-diffusion-xl-base-1.0',
          ];
          model = premiumModels[Math.floor(Math.random() * premiumModels.length)];
        } else {
          model = '@cf/runwayml/stable-video-diffusion-img2vid';
        }

        console.log(`Using premium model for credit generation: ${model}`);
        
        // Enhanced prompt for premium quality
        const enhancedPrompt = `${prompt}. High quality, professional, detailed, sharp focus, excellent composition, vivid colors, 8k resolution.`;
        
        const cloudflareResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: enhancedPrompt,
              height: height || 1024,
              width: width || 1024,
              num_steps: 30,
              guidance: 8.5
            }),
          }
        );

        if (!cloudflareResponse.ok) {
          const errorText = await cloudflareResponse.text();
          console.error('Cloudflare API error for credit generation:', errorText);
          throw new Error(`Cloudflare API error: ${cloudflareResponse.status} - ${errorText}`);
        }

        const imageBuffer = await cloudflareResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');

        const creditResponse = {
          success: true,
          imageData: type === 'image' ? base64Image : undefined,
          videoUrl: type === 'video' ? `data:video/mp4;base64,${base64Image}` : undefined,
          model: model,
          timestamp: Date.now(),
          paymentType: 'credits',
          userAddress: userAddress
        };

        console.log('Credit generation successful, data length:', base64Image.length);
        return NextResponse.json(creditResponse);
      } catch (error) {
        console.error('Credit generation error:', error);
        return NextResponse.json({
          success: false,
          error: `Credit generation failed: ${error.message}`
        }, { status: 500 });
      }
    }

    // For paid generation, use premium models
    if (paymentType === 'crypto' && paymentTx) {
      try {
        console.log(`Processing paid generation with txHash: ${paymentTx}`);
        
        // Verify payment transaction first
        // This would integrate with Sonic blockchain to verify the payment
        
        let result;
        let model;
        
        if (type === 'video') {
          // Use Gemini Veo 3 for premium video generation with audio
          console.log('Using Gemini Veo 3 for premium video generation with audio');
          model = 'veo-3.0-generate-preview';
          
          const { GoogleGenAI } = require('@google/genai');
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          
          // Enhance prompt for better video generation with audio cues
          const enhancedPrompt = `${prompt}. Cinematic quality, professional lighting, smooth camera movement, high detail, 8-second duration with appropriate ambient sound and audio effects.`;
          
          let operation = await ai.models.generateVideos({
            model: model,
            prompt: enhancedPrompt,
            config: {
              aspectRatio: "16:9"
            }
          });

          // Poll the operation status until the video is ready
          while (!operation.done) {
            console.log("Waiting for Gemini video generation to complete...");
            await new Promise((resolve) => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({
              operation: operation,
            });
          }

          // Download the generated video to a buffer
          const videoFile = operation.response.generatedVideos[0].video;
          const videoBuffer = await ai.files.download({
            file: videoFile,
            returnBuffer: true
          });
          
          // Convert to base64
          result = Buffer.from(videoBuffer).toString('base64');
          
        } else {
          // Use premium image generation models
          console.log('Using premium model for image generation');
          
          // Try Gemini 2.0 Flash first for highest quality, fallback to Cloudflare
          if (process.env.GEMINI_API_KEY) {
            try {
              const { GoogleGenAI, Modality } = require('@google/genai');
              const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
              
              model = 'gemini-2.0-flash-preview-image-generation';
              console.log(`Using Gemini model: ${model} for premium image generation`);
              
              const enhancedPrompt = `Create a high-quality, detailed image: ${prompt}. Professional photography quality, sharp focus, excellent composition, vivid colors, high resolution.`;
              
              const response = await ai.models.generateContent({
                model: model,
                contents: enhancedPrompt,
                config: {
                  responseModalities: [Modality.TEXT, Modality.IMAGE],
                },
              });
              
              // Extract image from Gemini response
              for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                  result = part.inlineData.data; // This is already base64
                  break;
                }
              }
              
              if (!result) {
                throw new Error('No image data received from Gemini');
              }
              
            } catch (geminiError) {
              console.warn('Gemini image generation failed, falling back to premium Cloudflare:', geminiError.message);
              
              // Fallback to Cloudflare premium models - use best available paid model
              model = '@cf/black-forest-labs/flux-1-schnell';  // Premium model for paid users
              console.log(`Fallback to premium Cloudflare model: ${model}`);
              
              // Enhance prompt for better quality
              const enhancedPrompt = `${prompt}. High quality, professional photography, sharp focus, excellent composition, vivid colors, detailed, 8k resolution.`;
              
              const cloudflareResponse = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    prompt: enhancedPrompt,
                    height: height || 1024,
                    width: width || 1024,
                    num_steps: 30,  // More steps for better quality on paid generation
                    guidance: 8.5   // Higher guidance for paid generation
                  }),
                }
              );

              if (!cloudflareResponse.ok) {
                const errorText = await cloudflareResponse.text();
                console.error('Cloudflare Premium API error response:', errorText);
                throw new Error(`Cloudflare Premium API error: ${cloudflareResponse.status} - ${errorText}`);
              }

              const imageBuffer = await cloudflareResponse.arrayBuffer();
              console.log('Received premium Cloudflare binary image data, size:', imageBuffer.byteLength);
              
              result = Buffer.from(imageBuffer).toString('base64');
            }
          } else {
            // Use premium Cloudflare if no Gemini API key
            model = '@cf/black-forest-labs/flux-1-schnell';  // Premium model for paid users
            console.log(`Using premium Cloudflare model: ${model} (no Gemini API key)`);
            
            // Enhance prompt for better quality
            const enhancedPrompt = `${prompt}. High quality, professional photography, sharp focus, excellent composition, vivid colors, detailed, 8k resolution.`;
            
            const cloudflareResponse = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  prompt: enhancedPrompt,
                  height: height || 1024,
                  width: width || 1024,
                  num_steps: 30,  // More steps for better quality on paid generation
                  guidance: 8.5   // Higher guidance for paid generation
                }),
              }
            );

            if (!cloudflareResponse.ok) {
              const errorText = await cloudflareResponse.text();
              console.error('Cloudflare Premium API error response:', errorText);
              throw new Error(`Cloudflare Premium API error: ${cloudflareResponse.status} - ${errorText}`);
            }

            const imageBuffer = await cloudflareResponse.arrayBuffer();
            result = Buffer.from(imageBuffer).toString('base64');
          }
        }

        // Handle the result based on the response format
        let base64Data;
        if (result instanceof ArrayBuffer) {
          base64Data = Buffer.from(result).toString('base64');
        } else if (typeof result === 'string') {
          base64Data = result;
        } else if (result && typeof result === 'object' && result.image) {
          base64Data = result.image;
        } else if (Array.isArray(result) && result.length > 0) {
          base64Data = result[0];
        } else {
          console.error('Unexpected premium result format:', typeof result, result);
          throw new Error('Unexpected response format from premium AI models');
        }

        // Ensure we have valid data for premium generation
        if (!base64Data || base64Data.length === 0) {
          throw new Error('No data received from premium AI models');
        }

        const premiumResponse = {
          success: true,
          imageData: type === 'image' ? base64Data : undefined,
          videoUrl: type === 'video' ? `data:video/mp4;base64,${base64Data}` : undefined,
          model: model,
          paymentTx: paymentTx,
          timestamp: Date.now(),
          paymentType: 'crypto'
        };

        console.log('Premium generation successful, data length:', base64Data.length);
        console.log('Premium generation response structure:', {
          success: premiumResponse.success,
          hasImageData: !!premiumResponse.imageData,
          hasVideoUrl: !!premiumResponse.videoUrl,
          model: premiumResponse.model,
          paymentTx: premiumResponse.paymentTx
        });
        return NextResponse.json(premiumResponse);
      } catch (error) {
        console.error('Premium generation error:', error);
        return NextResponse.json({
          success: false,
          error: `Premium generation failed: ${error.message}`,
          details: error.toString()
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid payment type or missing payment information'
    }, { status: 400 });

  } catch (error: any) {
    console.error('MCP API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}