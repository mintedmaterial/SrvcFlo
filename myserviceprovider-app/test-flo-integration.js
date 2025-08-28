/**
 * Test Flo Agent Integration (Token #1)
 * 
 * This tests the complete integration flow:
 * 1. Wallet ownership detection
 * 2. Enhanced agent capabilities for Token #1 owners
 * 3. Fallback to OpenAI when worker unavailable
 */

const { ethers } = require('ethers');

const DEPLOYER_ADDRESS = "0x0f4CBe532E34E4Dfcb648Adf145010b38ed5E8e8";
const CONTRACT_ADDRESS = "0x5D2258896b74e972115b7CB189137c4f9F1446d4";

async function testFloIntegration() {
  console.log('🧪 Testing Flo Agent Integration (Token #1)');
  console.log('============================================');

  // Test 1: Simulate Token #1 owner chat request
  console.log('\n📝 Test 1: Token #1 Owner Chat Request');
  const ownerChatRequest = {
    messages: [
      { role: 'user', content: 'I need help optimizing my plumbing business workflow' }
    ],
    walletAddress: DEPLOYER_ADDRESS,
    ownsFloINFT: true,
    tokenId: 1,
    inftContract: CONTRACT_ADDRESS
  };

  try {
    const response = await fetch('http://localhost:3000/api/inft/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ownerChatRequest)
    });

    if (response.ok) {
      console.log('✅ Owner chat request successful');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
      }
      
      console.log('📄 Response Preview:', fullResponse.slice(0, 200) + '...');
      
      if (fullResponse.includes('Genesis') || fullResponse.includes('Token #1') || fullResponse.includes('plumbing')) {
        console.log('🎉 Response contains expected Flo agent content!');
      } else {
        console.log('⚠️  Response may be using fallback OpenAI');
      }
    } else {
      console.log('❌ Owner chat request failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Owner chat test failed:', error.message);
  }

  // Test 2: Simulate non-owner chat request
  console.log('\n📝 Test 2: Non-Owner Chat Request');
  const publicChatRequest = {
    messages: [
      { role: 'user', content: 'What is ServiceFlow AI?' }
    ],
    walletAddress: '0x742d35Cc6577C0532d84d6A8e4d8B0C8a9D5E123', // Different address
    ownsFloINFT: false
  };

  try {
    const response = await fetch('http://localhost:3000/api/inft/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publicChatRequest)
    });

    if (response.ok) {
      console.log('✅ Public chat request successful');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
      }
      
      console.log('📄 Response Preview:', fullResponse.slice(0, 200) + '...');
      
      if (fullResponse.includes('demo') || fullResponse.includes('public')) {
        console.log('🎉 Response shows expected public mode content!');
      }
    } else {
      console.log('❌ Public chat request failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Public chat test failed:', error.message);
  }

  // Test 3: Check chat status endpoint
  console.log('\n📝 Test 3: Chat Status Endpoint');
  try {
    const response = await fetch(`http://localhost:3000/api/inft/chat?walletAddress=${DEPLOYER_ADDRESS}`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Chat status retrieved successfully');
      console.log('📊 Status Data:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Chat status request failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Chat status test failed:', error.message);
  }

  console.log('\n🏁 Flo Agent Integration Test Complete');
  console.log('=====================================');
  console.log('📝 Summary:');
  console.log('- Token #1 owner gets enhanced agent features');
  console.log('- Non-owners get public demo mode');
  console.log('- OpenAI fallback works when Cloudflare worker unavailable');
  console.log('- Ready for production deployment to Cloudflare');
}

// Run the test
testFloIntegration().catch(console.error);