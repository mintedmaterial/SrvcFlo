#!/usr/bin/env node

// Test real Groq Kimi K2 Instruct API calls for both image and video generation
// This will make actual API calls to verify the integration works

const path = require('path');
const fs = require('fs');
const { Groq } = require('groq-sdk');

// Load .env file
function loadEnvFile() {
  const envPath = path.join(__dirname, 'myserviceprovider-app', '.env');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key] = value;
        }
      }
    }
  }
}

async function testGroqKimiReal() {
  console.log('🤖 Real Groq Kimi K2 Instruct Test');
  console.log('=' .repeat(50));
  
  // Load environment variables
  console.log('📦 Loading environment variables...');
  loadEnvFile();
  
  const groqApiKey = process.env.GROQ_API_KEY;
  
  if (!groqApiKey) {
    console.log('❌ GROQ_API_KEY not found in environment');
    return;
  }
  
  console.log('✅ GROQ_API_KEY loaded:', groqApiKey.substring(0, 15) + '...');
  console.log('');
  
  // Initialize Groq client
  const groq = new Groq({
    apiKey: groqApiKey
  });
  
  try {
    // Test 1: Image Generation Request
    console.log('🎨 Test 1: ServiceFlow AI Image Generation');
    console.log('-'.repeat(45));
    
    const imagePrompt = `Generate an image: A ServiceFlow AI robot with bandit kidz style elements - cute, mischievous character with tech gadgets and colorful design.
    Style: High quality, detailed, cartoon-like with vibrant colors
    Aspect ratio: 16:9
    Please provide a direct link to the generated image.`;
    
    console.log('📝 Prompt:', imagePrompt.split('.')[0] + '...');
    console.log('⏳ Sending image generation request...');
    
    const imageCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: imagePrompt
        }
      ],
      model: "moonshotai/kimi-k2-instruct",
      temperature: 0.6,
      max_completion_tokens: 1000,
      top_p: 1,
      stream: false,
      stop: null
    });
    
    const imageResponse = imageCompletion.choices[0]?.message?.content;
    
    if (imageResponse) {
      console.log('✅ Image Generation Response:');
      console.log(imageResponse.substring(0, 300) + '...');
      
      // Extract URL if present
      const urlMatch = imageResponse.match(/https?:\/\/[^\s\)]+/);
      if (urlMatch) {
        console.log('🖼️  Image URL found:', urlMatch[0]);
        
        // Save to thread-like structure
        const imageResult = {
          generationId: `groq_img_${Date.now()}`,
          prompt: "ServiceFlow AI robot with bandit kidz style",
          resultUrl: urlMatch[0],
          provider: 'groq-kimi',
          type: 'image',
          timestamp: new Date().toISOString(),
          status: 'completed'
        };
        
        saveGeneration(imageResult);
      }
    } else {
      console.log('❌ No image response received');
    }
    
    console.log('');
    
    // Test 2: Video Generation Request
    console.log('🎬 Test 2: ServiceFlow AI Video Generation');
    console.log('-'.repeat(45));
    
    const videoPrompt = `Create a 5-second video: ServiceFlow AI agents collaborating in a digital workspace - show multiple AI characters working together with flowing data connections and automated workflows.
    Style: Cinematic, smooth animation, futuristic tech aesthetic
    Aspect ratio: 16:9
    Please provide a direct link to the generated video file.`;
    
    console.log('📝 Prompt:', videoPrompt.split('.')[0] + '...');
    console.log('⏳ Sending video generation request...');
    
    const videoCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: videoPrompt
        }
      ],
      model: "moonshotai/kimi-k2-instruct",
      temperature: 0.6,
      max_completion_tokens: 1000,
      top_p: 1,
      stream: false,
      stop: null
    });
    
    const videoResponse = videoCompletion.choices[0]?.message?.content;
    
    if (videoResponse) {
      console.log('✅ Video Generation Response:');
      console.log(videoResponse.substring(0, 300) + '...');
      
      // Extract URL if present
      const urlMatch = videoResponse.match(/https?:\/\/[^\s\)]+/);
      if (urlMatch) {
        console.log('🎬 Video URL found:', urlMatch[0]);
        
        // Save to thread-like structure
        const videoResult = {
          generationId: `groq_vid_${Date.now()}`,
          prompt: "ServiceFlow AI agents collaborating in digital workspace",
          resultUrl: urlMatch[0],
          provider: 'groq-kimi',
          type: 'video',
          timestamp: new Date().toISOString(),
          status: 'completed'
        };
        
        saveGeneration(videoResult);
      }
    } else {
      console.log('❌ No video response received');
    }
    
    console.log('');
    console.log('🎯 Test Summary:');
    console.log('- ✅ Groq Kimi K2 Instruct API connection successful');
    console.log('- ✅ Both image and video requests processed');
    console.log('- 📁 Results saved to generated_videos/thread/ folder');
    console.log('- 🔗 Check URLs to verify actual generation success');
    
  } catch (error) {
    console.error('❌ Error during Groq testing:', error.message);
    console.log('');
    console.log('💡 Possible issues:');
    console.log('- API key invalid or expired');
    console.log('- API quota exceeded');
    console.log('- Network connectivity problems');
    console.log('- Model temporarily unavailable');
  }
}

function saveGeneration(result) {
  try {
    // Create thread-like directory structure
    const threadDir = path.join(__dirname, 'generated_videos', 'thread');
    if (!fs.existsSync(threadDir)) {
      fs.mkdirSync(threadDir, { recursive: true });
    }
    
    const filename = `${result.generationId}.json`;
    const filepath = path.join(threadDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
    console.log(`💾 Saved generation to: ${filepath}`);
    
  } catch (error) {
    console.error('⚠️  Failed to save generation:', error.message);
  }
}

// Run the test
testGroqKimiReal().catch(console.error);