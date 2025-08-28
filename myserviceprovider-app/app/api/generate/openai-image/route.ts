import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { loadCollectionImages, createCollectionEnhancedPrompt, getCollectionInfo } from '@/lib/collection-helpers';
import { isDevWallet } from '@/lib/dev-wallet-config';
import { checkRateLimit } from '@/lib/openai-rate-limiter';
import { MongoClient } from 'mongodb';

interface OpenAIImageRequest {
  prompt: string;
  collection?: string;
  userAddress: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MONGODB_URI = process.env.MONGODB_URI!;
const CREDITS_REQUIRED = 50;

/**
 * Check user's credit balance from SonicCreditSystem contract
 */
async function checkUserCredits(userAddress: string): Promise<{ hasCredits: boolean; balance: number }> {
  try {
    // Connect to MongoDB to check user credits
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('serviceflow');
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ 
      walletAddress: userAddress.toLowerCase() 
    });
    
    await client.close();
    
    const balance = user?.credits || 0;
    return {
      hasCredits: balance >= CREDITS_REQUIRED,
      balance
    };
  } catch (error) {
    console.error('Error checking user credits:', error);
    return { hasCredits: false, balance: 0 };
  }
}

/**
 * Deduct credits from user account
 */
async function deductCredits(userAddress: string, amount: number): Promise<boolean> {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('serviceflow');
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.updateOne(
      { 
        walletAddress: userAddress.toLowerCase(),
        credits: { $gte: amount }
      },
      { 
        $inc: { credits: -amount },
        $push: {
          creditHistory: {
            type: 'deduction',
            amount: amount,
            reason: 'OpenAI image generation',
            timestamp: new Date(),
            balance: null // Will be updated after the operation
          }
        }
      }
    );

    // Update the balance in the history record
    if (result.modifiedCount > 0) {
      const updatedUser = await usersCollection.findOne({ 
        walletAddress: userAddress.toLowerCase() 
      });
      
      if (updatedUser) {
        await usersCollection.updateOne(
          { 
            walletAddress: userAddress.toLowerCase(),
            'creditHistory.balance': null
          },
          {
            $set: { 'creditHistory.$.balance': updatedUser.credits }
          }
        );
      }
    }
    
    await client.close();
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error deducting credits:', error);
    return false;
  }
}

/**
 * Save generation to database
 */
async function saveGeneration(
  userAddress: string, 
  prompt: string, 
  imageUrl: string, 
  collection?: string
): Promise<string> {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('serviceflow');
    const generationsCollection = db.collection('generations');
    
    const generationId = `openai_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    await generationsCollection.insertOne({
      generationId,
      userAddress: userAddress.toLowerCase(),
      type: 'image',
      provider: 'openai',
      model: 'gpt-image-1',
      prompt,
      collection,
      imageUrl,
      creditsUsed: CREDITS_REQUIRED,
      timestamp: new Date(),
      status: 'completed'
    });
    
    await client.close();
    return generationId;
  } catch (error) {
    console.error('Error saving generation:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body: OpenAIImageRequest = await request.json();
        const { 
          prompt, 
          collection, 
          userAddress,
          size = '1024x1024',
          quality = 'standard',
          style = 'vivid'
        } = body;

        // Validate required parameters
        if (!prompt || !userAddress) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            error: 'Missing required parameters: prompt and userAddress' 
          })}\n\n`));
          controller.close();
          return;
        }

        // Send initial status
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: 'initializing',
          message: 'Starting OpenAI image generation...' 
        })}\n\n`));

        // Check if user is dev wallet (gets free access)
        const isDev = isDevWallet(userAddress);
        
        // Rate limiting check
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: 'checking_limits',
          message: 'Checking rate limits...' 
        })}\n\n`));

        const rateLimitResult = await checkRateLimit(userAddress, isDev);
        
        if (!rateLimitResult.allowed) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            error: rateLimitResult.errorMessage || 'Rate limit exceeded',
            remainingRequests: rateLimitResult.remainingRequests,
            resetTime: rateLimitResult.resetTime.toISOString()
          })}\n\n`));
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: 'rate_limit_ok',
          message: `Rate limit check passed. ${rateLimitResult.remainingRequests} requests remaining.` 
        })}\n\n`));
        
        if (!isDev) {
          // Check user credits for non-dev wallets
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            status: 'checking_credits',
            message: 'Checking credit balance...' 
          })}\n\n`));

          const { hasCredits, balance } = await checkUserCredits(userAddress);
          
          if (!hasCredits) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              error: `Insufficient credits. Required: ${CREDITS_REQUIRED}, Available: ${balance}`,
              requiredCredits: CREDITS_REQUIRED,
              availableCredits: balance
            })}\n\n`));
            controller.close();
            return;
          }

          // Deduct credits
          const creditDeducted = await deductCredits(userAddress, CREDITS_REQUIRED);
          if (!creditDeducted) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              error: 'Failed to deduct credits. Please try again.',
            })}\n\n`));
            controller.close();
            return;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            status: 'credits_deducted',
            message: `${CREDITS_REQUIRED} credits deducted. Remaining balance: ${balance - CREDITS_REQUIRED}` 
          })}\n\n`));
        } else {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            status: 'dev_access',
            message: 'Dev wallet detected - free access granted' 
          })}\n\n`));
        }

        // Handle collection inspiration
        let enhancedPrompt = prompt;
        let collectionImages: any[] = [];
        let collectionInfo = null;

        if (collection) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            status: 'loading_collection',
            message: `Loading ${collection} collection images...` 
          })}\n\n`));

          collectionInfo = await getCollectionInfo(collection);
          
          if (collectionInfo && collectionInfo.images.length > 0) {
            collectionImages = collectionInfo.images.slice(0, 3); // Limit to 3 images for token efficiency
            enhancedPrompt = createCollectionEnhancedPrompt(
              prompt, 
              collectionInfo.name, 
              collectionInfo.description
            );

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              status: 'collection_loaded',
              message: `Loaded ${collectionImages.length} inspiration images from ${collection}`,
              collection: collectionInfo.name,
              collectionDescription: collectionInfo.description
            })}\n\n`));
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              status: 'collection_warning',
              message: `Collection ${collection} not found or empty. Using original prompt.` 
            })}\n\n`));
          }
        }

        // Generate image with OpenAI
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: 'generating',
          message: 'Generating image with OpenAI GPT Image model...' 
        })}\n\n`));

        // Prepare the input for OpenAI Responses API
        const responseInput: any[] = [{
          role: "user",
          content: [
            { type: "input_text", text: enhancedPrompt }
          ]
        }];

        // Add collection images as inspiration
        if (collectionImages.length > 0) {
          for (const img of collectionImages) {
            responseInput[0].content.push({
              type: "input_image",
              image_url: img.base64,
              detail: "low" // Use low detail to save tokens
            });
          }
        }

        // Call OpenAI Responses API with image generation
        const response = await openai.responses.create({
          model: "gpt-4.1-mini",
          input: responseInput,
          tools: [{ type: "image_generation" }],
        });

        // Extract generated image
        const imageData = response.output
          .filter((output) => output.type === "image_generation_call")
          .map((output) => output.result);

        if (imageData.length === 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            error: 'No image was generated by OpenAI' 
          })}\n\n`));
          controller.close();
          return;
        }

        const imageBase64 = imageData[0];
        
        // Convert base64 to data URL for frontend display
        const imageDataUrl = `data:image/png;base64,${imageBase64}`;

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: 'saving',
          message: 'Saving generation to database...' 
        })}\n\n`));

        // Save generation to database
        const generationId = await saveGeneration(
          userAddress, 
          prompt, 
          imageDataUrl,
          collection
        );

        // Send final result
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: 'completed',
          generationId,
          imageUrl: imageDataUrl,
          prompt: enhancedPrompt,
          collection,
          creditsUsed: isDev ? 0 : CREDITS_REQUIRED,
          provider: 'openai',
          model: 'gpt-image-1'
        })}\n\n`));

      } catch (error: any) {
        console.error('OpenAI image generation error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          error: error.message || 'Failed to generate image with OpenAI',
          details: error.response?.data || error.toString()
        })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}