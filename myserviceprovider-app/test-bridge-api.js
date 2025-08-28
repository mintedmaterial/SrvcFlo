// Test the bridge API that connects frontend to INFT agents
const testBridgeAPI = async () => {
  console.log('🧪 Testing Bridge API: Frontend → INFT Agents');
  console.log('=' .repeat(60));

  const testData = {
    type: 'image',
    prompt: 'A magical ServiceFlow AI workspace with glowing holographic interfaces, crystal formations, and ethereal blue energy',
    userAddress: '0x0f4CBe532E34E4Dfcb648Adf145010b38ed5E8e8',
    creditsNeeded: 100,
    model: 'openai-dall-e-3',
    preferNFTCredits: false
  };

  console.log('\n📋 Test Request Data:');
  console.log(`   - User: ${testData.userAddress}`);
  console.log(`   - Model: ${testData.model}`);
  console.log(`   - Credits: ${testData.creditsNeeded}`);
  console.log(`   - Prompt: "${testData.prompt}"`);

  try {
    console.log('\n🚀 Sending request to bridge API...');
    
    // This would be the same request the frontend makes
    const response = await fetch('http://localhost:3000/api/generate/credit-based-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('\n✅ Bridge API Test SUCCESSFUL!');
      console.log('📊 Generation Results:');
      console.log(`   - Generation ID: ${result.generationId}`);
      console.log(`   - Agent ID: ${result.agentId}`);
      console.log(`   - Collection Influenced: ${result.collectionInfluenced}`);
      console.log(`   - Credits Used: ${result.creditsUsed}`);
      console.log(`   - Image URL: ${result.resultUrl}`);
      
      if (result.agentInfo) {
        console.log('\n🤖 Agent Information:');
        console.log(`   - Package Type: ${result.agentInfo.packageType} (${getPackageName(result.agentInfo.packageType)})`);
        console.log(`   - Total Credits: ${result.agentInfo.totalCredits}`);
        console.log(`   - Agent Metadata: ${result.agentInfo.agentMetadata}`);
      }
      
      if (result.agentGeneration) {
        console.log('\n🎨 Agent Generation Details:');
        console.log(`   - Provider: ${result.agentGeneration.provider}`);
        console.log(`   - Model: ${result.agentGeneration.model}`);
        console.log(`   - Quality: ${result.agentGeneration.quality}/10`);
        console.log(`   - Collection: ${result.agentGeneration.collection}`);
      }
      
      console.log('\n🎉 Frontend-to-INFT Bridge Working Perfectly!');
      console.log('✨ Users can now interact with their personal AI agents through the familiar UI!');
      
    } else {
      console.log('\n❌ Bridge API Test FAILED');
      console.log(`   Error: ${result.error}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
    }
  } catch (error) {
    console.log('\n❌ Bridge API Test FAILED');
    console.log(`   Network Error: ${error.message}`);
    console.log('\n💡 Make sure the Next.js frontend is running on port 3000');
    console.log('   Run: npm run dev');
  }
};

function getPackageName(packageType) {
  const names = { 1: 'Starter', 2: 'Pro', 3: 'Business', 4: 'Enterprise' };
  return names[packageType] || 'Unknown';
}

// Only run if this script is executed directly
if (require.main === module) {
  testBridgeAPI().catch(console.error);
}

module.exports = { testBridgeAPI };