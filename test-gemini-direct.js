#!/usr/bin/env node

// Direct Gemini API test for video generation
// Tests Veo 3.0 without TypeScript complications

const path = require('path');
const fs = require('fs');

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

async function testGeminiVeo3Direct() {
  console.log('🎬 Direct Gemini Veo 3.0 API Test');
  console.log('=' .repeat(50));
  
  // Load environment variables
  console.log('📦 Loading environment variables...');
  loadEnvFile();
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ GEMINI_API_KEY not found');
    return;
  }
  
  console.log('✅ API Key loaded:', apiKey.substring(0, 15) + '...');
  console.log('');
  
  try {
    console.log('🎯 Testing Gemini Veo 3.0 video generation...');
    console.log('📝 ServiceFlow AI Prompt: "ServiceFlow AI platform showcase"');
    console.log('⏳ Sending request to Gemini API...');
    console.log('');
    
    // Try different Gemini video generation endpoints
    const possibleEndpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-veo-3.0:generateVideo?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/veo-3:generateVideo?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-veo:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-video:generateContent?key=${apiKey}`
    ];
    
    console.log('🔍 Available models check...');
    
    // First, let's check what models are available
    const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const modelsResponse = await fetch(modelsUrl);
    
    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json();
      console.log('📋 Available models:');
      
      if (modelsData.models) {
        modelsData.models.forEach(model => {
          if (model.name.toLowerCase().includes('video') || model.name.toLowerCase().includes('veo')) {
            console.log(`   - ${model.name} (${model.displayName || 'N/A'})`);
          }
        });
      }
      console.log('');
    }
    
    const apiUrl = possibleEndpoints[0]; // Start with the first one
    
    const requestBody = {
      prompt: {
        text: "ServiceFlow AI: A futuristic AI platform interface with flowing data streams, neural network visualizations, and automated agent workflows. Show sleek UI elements, glowing connections between AI agents, and dynamic content generation in progress. Modern tech aesthetic with blue and purple gradients, 4K cinematic quality."
      },
      generationConfig: {
        aspectRatio: "16:9",
        duration: "5s",
        personGeneration: "ALLOW_ALL"
      }
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    console.log('');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error Response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('📋 API Response:', JSON.stringify(result, null, 2));
    
    if (result.operation) {
      console.log('');
      console.log('✅ Video generation started!');
      console.log(`🆔 Operation ID: ${result.operation.name}`);
      console.log('⏳ Video is being processed...');
      console.log('');
      console.log('💡 The video will be available shortly.');
      console.log('💡 In production, you would poll this operation to check completion.');
      
      // Try to check operation status
      await checkOperationStatus(result.operation.name, apiKey);
    } else if (result.video) {
      console.log('');
      console.log('✅ Video generated immediately!');
      console.log(`🎬 Video URL: ${result.video.uri}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('💡 Common issues:');
    console.log('- API key invalid or expired');
    console.log('- Veo 3.0 not available in your region');
    console.log('- API quota exceeded');
    console.log('- Network connectivity problems');
  }
}

async function downloadVideo(videoUrl, filename) {
  try {
    console.log('📥 Downloading video...');
    
    const response = await fetch(videoUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const videoBuffer = await response.arrayBuffer();
    const videoPath = path.join(__dirname, 'generated_videos', filename);
    
    // Create directory if it doesn't exist
    const dir = path.dirname(videoPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(videoPath, Buffer.from(videoBuffer));
    console.log(`✅ Video saved to: ${videoPath}`);
    console.log(`📁 File size: ${(videoBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
    
    return videoPath;
  } catch (error) {
    console.error('❌ Failed to download video:', error.message);
    return null;
  }
}

async function checkOperationStatus(operationName, apiKey) {
  try {
    console.log('🔍 Checking operation status...');
    
    const statusUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`;
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const response = await fetch(statusUrl);
      
      if (response.ok) {
        const status = await response.json();
        console.log(`📊 Operation Status (attempt ${attempts + 1}):`, status.done ? 'COMPLETED' : 'PROCESSING');
        
        if (status.done && status.response && status.response.video) {
          console.log('');
          console.log('🎉 Video generation completed!');
          console.log(`🎬 Video URL: ${status.response.video.uri}`);
          
          // Download and save the video
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `serviceflow_ai_demo_${timestamp}.mp4`;
          const savedPath = await downloadVideo(status.response.video.uri, filename);
          
          if (savedPath) {
            console.log('');
            console.log('🔽 Video successfully downloaded and saved!');
            console.log(`📂 Location: ${savedPath}`);
            console.log('🎬 You can now view your ServiceFlow AI demo video!');
          }
          
          return;
        } else if (status.error) {
          console.log('❌ Generation failed:', status.error.message);
          return;
        } else {
          console.log(`⏳ Still processing... waiting 10 seconds (${attempts + 1}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        }
      } else {
        console.log('❌ Failed to check status:', response.statusText);
        return;
      }
      
      attempts++;
    }
    
    console.log('⏰ Max attempts reached. Video may still be processing.');
    console.log('💡 You can manually check the operation status later.');
    
  } catch (error) {
    console.log('⚠️  Could not check operation status:', error.message);
  }
}

// Run the test
testGeminiVeo3Direct().catch(console.error);