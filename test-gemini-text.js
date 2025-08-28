#!/usr/bin/env node

// Test Gemini text generation for video descriptions
// Since Veo 3.0 may not be available, let's generate detailed video prompts

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

async function testGeminiTextForVideo() {
  console.log('🎬 Gemini AI - ServiceFlow Video Script Generation');
  console.log('=' .repeat(55));
  
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
    console.log('🎯 Generating ServiceFlow AI video descriptions...');
    console.log('');
    
    // Check available models first
    const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const modelsResponse = await fetch(modelsUrl);
    
    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json();
      console.log('📋 Available Gemini models:');
      
      if (modelsData.models) {
        const textModels = modelsData.models.filter(model => 
          !model.name.includes('embedding') && 
          !model.name.includes('aqa') &&
          model.supportedGenerationMethods?.includes('generateContent')
        );
        
        textModels.slice(0, 5).forEach(model => {
          console.log(`   - ${model.name}`);
        });
        
        console.log('');
        
        // Use the first available text model
        if (textModels.length > 0) {
          const modelName = textModels[0].name;
          console.log(`🤖 Using model: ${modelName}`);
          console.log('');
          
          await generateVideoScripts(apiKey, modelName);
        }
      }
    } else {
      console.log('❌ Could not fetch models list');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function generateVideoScripts(apiKey, modelName) {
  const prompts = [
    {
      title: "ServiceFlow AI Platform Demo",
      prompt: `Create a detailed video script and visual description for a 30-second promotional video showcasing ServiceFlow AI platform. 
      Include:
      1. Opening scene description (futuristic UI, flowing data)
      2. Key features to highlight (AI agents, automation, workflows)  
      3. Visual effects and transitions
      4. Color scheme and aesthetic
      5. Text overlays or callouts
      6. Closing scene with logo/branding
      
      Make it cinematic and professional for a SaaS platform demo.`
    },
    {
      title: "NFT Credit System Showcase", 
      prompt: `Create a video script showing how ServiceFlow AI's NFT credit system works:
      1. User purchasing NFT credits
      2. Credits providing collection influence (show Derps/BanditKidz style)
      3. Enhanced AI generations with collection themes
      4. Comparison between standard vs NFT-influenced results
      5. Visual representation of Sonic blockchain integration
      
      Keep it engaging and educational, 45 seconds max.`
    },
    {
      title: "Agent Workflow Builder",
      prompt: `Design a video showcasing ServiceFlow AI's agent workflow builder:
      1. User creating custom AI agents
      2. Drag-and-drop workflow interface
      3. Agent collaboration and communication
      4. Real-time results and automation
      5. Multi-tenant architecture benefits
      
      Focus on ease of use and powerful capabilities, 40 seconds.`
    }
  ];
  
  for (let i = 0; i < prompts.length; i++) {
    const { title, prompt } = prompts[i];
    
    console.log(`🎬 ${i + 1}. Generating: ${title}`);
    console.log('-'.repeat(50));
    
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.candidates && result.candidates[0] && result.candidates[0].content) {
          const generatedText = result.candidates[0].content.parts[0].text;
          console.log('✅ Generated Video Script:');
          console.log(generatedText);
          
          // Save to file
          const filename = `serviceflow_video_${i + 1}_${title.toLowerCase().replace(/\s+/g, '_')}.txt`;
          const filepath = path.join(__dirname, 'generated_videos', filename);
          
          // Create directory if it doesn't exist
          const dir = path.dirname(filepath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          const fileContent = `ServiceFlow AI Video Script\n` +
                            `Title: ${title}\n` +
                            `Generated: ${new Date().toISOString()}\n` +
                            `${'='.repeat(50)}\n\n${generatedText}`;
          
          fs.writeFileSync(filepath, fileContent);
          console.log(`📁 Saved to: ${filepath}`);
          
        } else {
          console.log('⚠️  No content generated');
        }
      } else {
        const errorText = await response.text();
        console.log('❌ API Error:', errorText);
      }
      
    } catch (error) {
      console.error(`❌ Error generating ${title}:`, error.message);
    }
    
    console.log('');
  }
  
  console.log('🎉 Video script generation completed!');
  console.log('📂 Check the generated_videos folder for your scripts');
  console.log('💡 These can be used with any video generation service');
}

// Run the test
testGeminiTextForVideo().catch(console.error);