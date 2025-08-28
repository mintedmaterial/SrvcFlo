#!/usr/bin/env node

// Test Real Gemini Veo 3.0 Video Generation
// Loads environment variables from myserviceprovider-app/.env

const path = require('path');
const fs = require('fs');

// Load .env file manually
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
          console.log(`✅ Loaded ${key}`);
        }
      }
    }
  } else {
    console.log('❌ .env file not found at:', envPath);
  }
}

async function testRealVideoGeneration() {
  console.log('🎬 ServiceFlow AI - Real Gemini Veo 3.0 Test');
  console.log('=' .repeat(60));
  
  // Load environment variables
  console.log('📦 Loading environment variables...');
  loadEnvFile();
  console.log('');
  
  // Check if API key is loaded
  const geminiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiKey) {
    console.log('❌ GEMINI_API_KEY not found in environment');
    return;
  }
  
  console.log('✅ GEMINI_API_KEY loaded:', geminiKey.substring(0, 10) + '...');
  console.log('');
  
  // Import the real Gemini service
  const { createGeminiVideoService } = require('./myserviceprovider-app/src/gemini-video-service.ts');
  
  try {
    console.log('🎯 Initializing Gemini Video Service...');
    const geminiService = createGeminiVideoService();
    
    console.log('🎬 Testing video generation...');
    console.log('📝 Prompt: "A cute robot dancing in a colorful garden with butterflies"');
    console.log('⏳ This may take 30-60 seconds...');
    console.log('');
    
    const videoRequest = {
      prompt: "A cute robot dancing in a colorful garden with butterflies",
      aspectRatio: "16:9",
      personGeneration: "allow_all"
    };
    
    const result = await geminiService.generateVideo(videoRequest);
    
    console.log('📊 Generation Result:');
    console.log(`   - Status: ${result.status}`);
    console.log(`   - Operation ID: ${result.operationId}`);
    
    if (result.status === 'completed') {
      console.log('✅ Video Generation Successful!');
      console.log(`   - Video URL: ${result.videoUrl}`);
      console.log(`   - Duration: ${result.duration || 'N/A'}`);
      console.log('');
      console.log('🎬 You can download the video from the URL above!');
    } else if (result.status === 'processing') {
      console.log('⏳ Video is still processing...');
      console.log(`   - Check status with operation ID: ${result.operationId}`);
    } else {
      console.log('❌ Video generation failed');
      console.log(`   - Error: ${result.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('❌ Error during video generation:', error.message);
    console.log('');
    console.log('💡 Possible issues:');
    console.log('- API key invalid or expired');
    console.log('- API quota exceeded'); 
    console.log('- Network connectivity problems');
    console.log('- Content policy violation');
    console.log('- Service temporarily unavailable');
  }
  
  console.log('');
  console.log('🎯 Test completed!');
}

// Run the test
testRealVideoGeneration().catch(console.error);