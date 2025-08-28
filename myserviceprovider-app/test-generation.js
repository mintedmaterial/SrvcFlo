// Test Generation Without Payment System
// Test both image and video generation with collection influence

const { createTestHybridGenerationService } = require('./test-hybrid-service.js');

async function testGeneration() {
  console.log('🧪 Starting Generation Tests (No Payment Required)');
  console.log('=' .repeat(60));

  // Create test service instance
  const testService = createTestHybridGenerationService();

  // Test 1: Standard Image Generation
  console.log('\n📸 Test 1: Standard Image Generation');
  console.log('-'.repeat(40));
  
  const standardImageRequest = {
    prompt: "A beautiful sunset over the ocean",
    type: 'image',
    user: '0x1234567890123456789012345678901234567890',
    creditType: 'standard'
  };

  try {
    const result1 = await testService.generateContent(standardImageRequest);
    console.log('✅ Standard Image Generation Result:');
    console.log(`   - Generation ID: ${result1.generationId}`);
    console.log(`   - Status: ${result1.status}`);
    console.log(`   - Credits Used: ${result1.creditsUsed}`);
    console.log(`   - Collection Influenced: ${result1.isInfluenced}`);
    if (result1.resultUrl) {
      console.log(`   - Result URL: ${result1.resultUrl}`);
    }
  } catch (error) {
    console.error('❌ Standard Image Generation Failed:', error.message);
  }

  // Test 2: NFT Image Generation with Collection Influence
  console.log('\n🎨 Test 2: NFT Image with Collection Influence');
  console.log('-'.repeat(40));
  
  const nftImageRequest = {
    prompt: "A cute derp character wearing sunglasses",
    type: 'image',
    user: '0x1234567890123456789012345678901234567890',
    creditType: 'nft',
    packageId: 1
  };

  try {
    const result2 = await testService.generateContent(nftImageRequest);
    console.log('✅ NFT Image Generation Result:');
    console.log(`   - Generation ID: ${result2.generationId}`);
    console.log(`   - Status: ${result2.status}`);
    console.log(`   - Credits Used: ${result2.creditsUsed}`);
    console.log(`   - Collection Influenced: ${result2.isInfluenced}`);
    console.log(`   - Influenced Collection: ${result2.influencedCollection}`);
    if (result2.influence) {
      console.log(`   - Style Enhancement: ${result2.influence.style_prompt}`);
      console.log(`   - Art Style: ${result2.influence.art_style}`);
      console.log(`   - Color Palette: ${result2.influence.color_palette}`);
    }
    if (result2.resultUrl) {
      console.log(`   - Result URL: ${result2.resultUrl}`);
    }
  } catch (error) {
    console.error('❌ NFT Image Generation Failed:', error.message);
  }

  // Test 3: Standard Video Generation
  console.log('\n🎬 Test 3: Standard Video Generation (Gemini Veo 3.0)');
  console.log('-'.repeat(40));
  
  const standardVideoRequest = {
    prompt: "A robot walking through a futuristic city",
    type: 'video',
    user: '0x1234567890123456789012345678901234567890',
    creditType: 'standard'
  };

  try {
    const result3 = await testService.generateContent(standardVideoRequest);
    console.log('✅ Standard Video Generation Result:');
    console.log(`   - Generation ID: ${result3.generationId}`);
    console.log(`   - Status: ${result3.status}`);
    console.log(`   - Credits Used: ${result3.creditsUsed}`);
    console.log(`   - Collection Influenced: ${result3.isInfluenced}`);
    if (result3.resultUrl) {
      console.log(`   - Result URL: ${result3.resultUrl}`);
    }
  } catch (error) {
    console.error('❌ Standard Video Generation Failed:', error.message);
  }

  // Test 4: NFT Video Generation with Collection Influence
  console.log('\n🎭 Test 4: NFT Video with Collection Influence');
  console.log('-'.repeat(40));
  
  const nftVideoRequest = {
    prompt: "Bandit kidz playing in a playground, laughing and having fun",
    type: 'video',
    user: '0x1234567890123456789012345678901234567890',
    creditType: 'nft',
    packageId: 2
  };

  try {
    const result4 = await testService.generateContent(nftVideoRequest);
    console.log('✅ NFT Video Generation Result:');
    console.log(`   - Generation ID: ${result4.generationId}`);
    console.log(`   - Status: ${result4.status}`);
    console.log(`   - Credits Used: ${result4.creditsUsed}`);
    console.log(`   - Collection Influenced: ${result4.isInfluenced}`);
    console.log(`   - Influenced Collection: ${result4.influencedCollection}`);
    if (result4.influence) {
      console.log(`   - Style Enhancement: ${result4.influence.style_prompt}`);
      console.log(`   - Art Style: ${result4.influence.art_style}`);
      console.log(`   - Mood: ${result4.influence.mood}`);
    }
    if (result4.resultUrl) {
      console.log(`   - Result URL: ${result4.resultUrl}`);
    }
  } catch (error) {
    console.error('❌ NFT Video Generation Failed:', error.message);
  }

  // Test 5: Image-to-Image Generation
  console.log('\n🖼️  Test 5: Image-to-Image Generation');
  console.log('-'.repeat(40));
  
  const imageToImageRequest = {
    prompt: "Transform this into a magical fantasy scene",
    type: 'image',
    user: '0x1234567890123456789012345678901234567890',
    creditType: 'standard',
    uploadedImage: 'base64_encoded_image_data_here' // Mock base64 image
  };

  try {
    const result5 = await testService.generateContent(imageToImageRequest);
    console.log('✅ Image-to-Image Generation Result:');
    console.log(`   - Generation ID: ${result5.generationId}`);
    console.log(`   - Status: ${result5.status}`);
    console.log(`   - Credits Used: ${result5.creditsUsed}`);
    if (result5.resultUrl) {
      console.log(`   - Result URL: ${result5.resultUrl}`);
    }
  } catch (error) {
    console.error('❌ Image-to-Image Generation Failed:', error.message);
  }

  // Test 6: Groq Kimi K2 Image Generation
  console.log('\n🤖 Test 6: Groq Kimi K2 Image Generation');
  console.log('-'.repeat(40));
  
  const groqImageRequest = {
    prompt: "A ServiceFlow AI robot with bandit kidz style elements",
    type: 'image',
    user: '0x1234567890123456789012345678901234567890',
    creditType: 'nft',
    packageId: 1,
    provider: 'groq-kimi'
  };

  try {
    const result6 = await testService.generateContent(groqImageRequest);
    console.log('✅ Groq Kimi Image Generation Result:');
    console.log(`   - Generation ID: ${result6.generationId}`);
    console.log(`   - Status: ${result6.status}`);
    console.log(`   - Credits Used: ${result6.creditsUsed}`);
    console.log(`   - Collection Influenced: ${result6.isInfluenced}`);
    if (result6.resultUrl) {
      console.log(`   - Result URL: ${result6.resultUrl}`);
    }
  } catch (error) {
    console.error('❌ Groq Kimi Image Generation Failed:', error.message);
  }

  // Test 7: Groq Kimi K2 Video Generation
  console.log('\n🎬 Test 7: Groq Kimi K2 Video Generation');
  console.log('-'.repeat(40));
  
  const groqVideoRequest = {
    prompt: "ServiceFlow AI agents collaborating in a digital workspace",
    type: 'video',
    user: '0x1234567890123456789012345678901234567890',
    creditType: 'standard',
    provider: 'groq-kimi'
  };

  try {
    const result7 = await testService.generateContent(groqVideoRequest);
    console.log('✅ Groq Kimi Video Generation Result:');
    console.log(`   - Generation ID: ${result7.generationId}`);
    console.log(`   - Status: ${result7.status}`);
    console.log(`   - Credits Used: ${result7.creditsUsed}`);
    console.log(`   - Collection Influenced: ${result7.isInfluenced}`);
    if (result7.resultUrl) {
      console.log(`   - Result URL: ${result7.resultUrl}`);
    }
  } catch (error) {
    console.error('❌ Groq Kimi Video Generation Failed:', error.message);
  }

  console.log('\n🎉 All Tests Completed!');
  console.log('=' .repeat(60));
  console.log('\n💡 Notes:');
  console.log('- This is TEST MODE - no real API calls or payments made');
  console.log('- To use real APIs, set GEMINI_API_KEY, CLOUDFLARE_API_TOKEN, and GROQ_API_KEY');
  console.log('- Collection influence only works for NFT credit type');
  console.log('- Supported keywords: "derp", "kidz", "bandit"');
  console.log('- Provider options: cloudflare (default), gemini, groq-kimi');
}

// Export for use in other files
module.exports = { testGeneration };

// Run tests if called directly
if (require.main === module) {
  testGeneration().catch(console.error);
}