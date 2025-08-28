// Simple test script for AI generation routes
// Run with: node test-ai-routes.js

const testApiEndpoints = async () => {
  const baseUrl = 'http://localhost:8787'; // Default wrangler dev port
  const testEmail = 'test@example.com';
  
  console.log('🧪 Testing AI Generation Routes\n');
  
  // Test 1: Credit Packages
  console.log('1. Testing credit packages endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/credits/packages`);
    const data = await response.json();
    console.log('✅ Credit packages:', Object.keys(data.packages || {}));
  } catch (error) {
    console.log('❌ Credit packages failed:', error.message);
  }
  
  // Test 2: Credit Balance (no credits initially)
  console.log('\n2. Testing credit balance endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/credits/balance?email=${testEmail}`);
    const data = await response.json();
    console.log('✅ Credit balance:', data.credits || 0);
  } catch (error) {
    console.log('❌ Credit balance failed:', error.message);
  }
  
  // Test 3: Mock purchase to add credits
  console.log('\n3. Testing mock credit purchase...');
  try {
    const response = await fetch(`${baseUrl}/api/credits/mock-success?session=test123&package=starter&email=${testEmail}`);
    if (response.ok) {
      console.log('✅ Mock purchase successful');
    } else {
      console.log('❌ Mock purchase failed');
    }
  } catch (error) {
    console.log('❌ Mock purchase failed:', error.message);
  }
  
  // Test 4: Image Generation
  console.log('\n4. Testing image generation...');
  try {
    const response = await fetch(`${baseUrl}/api/generate/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'A beautiful sunset over mountains',
        userEmail: testEmail
      })
    });
    const data = await response.json();
    if (data.taskId) {
      console.log('✅ Image generation started:', data.taskId);
      
      // Test status check after a moment
      setTimeout(async () => {
        try {
          const statusResponse = await fetch(`${baseUrl}/api/generate/status/${data.taskId}`);
          const statusData = await statusResponse.json();
          console.log('📊 Task status:', statusData.status);
        } catch (error) {
          console.log('❌ Status check failed:', error.message);
        }
      }, 2000);
    } else {
      console.log('❌ Image generation failed:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Image generation failed:', error.message);
  }
  
  // Test 5: Video Generation
  console.log('\n5. Testing video generation...');
  try {
    const response = await fetch(`${baseUrl}/api/generate/video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'A person walking through a forest',
        userEmail: testEmail
      })
    });
    const data = await response.json();
    if (data.taskId) {
      console.log('✅ Video generation started:', data.taskId);
    } else {
      console.log('❌ Video generation failed:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Video generation failed:', error.message);
  }
  
  // Test 6: Generation History
  console.log('\n6. Testing generation history...');
  setTimeout(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/generate/history?email=${testEmail}`);
      const data = await response.json();
      console.log('✅ Generation history:', data.generations?.length || 0, 'items');
    } catch (error) {
      console.log('❌ Generation history failed:', error.message);
    }
  }, 5000);
  
  console.log('\n🔄 Tests initiated. Check status updates above...\n');
};

// Only run if this script is executed directly
if (require.main === module) {
  testApiEndpoints().catch(console.error);
}

module.exports = { testApiEndpoints };