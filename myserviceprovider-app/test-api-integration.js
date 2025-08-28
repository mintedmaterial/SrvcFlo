// Test script to verify API integration end-to-end
const fetch = require('node-fetch')

async function testAPIIntegration() {
  console.log('🧪 Testing API Integration End-to-End...\n')
  
  // Test scenarios
  const testCases = [
    {
      name: 'Mainnet Default Pricing',
      url: 'http://localhost:3000/api/price/swap-amount?network=mainnet&imagePrice=1&videoPrice=2'
    },
    {
      name: 'Testnet Default Pricing',
      url: 'http://localhost:3000/api/price/swap-amount?network=testnet&imagePrice=1&videoPrice=2'
    },
    {
      name: 'Custom Pricing Values',
      url: 'http://localhost:3000/api/price/swap-amount?network=mainnet&imagePrice=1.5&videoPrice=3'
    },
    {
      name: 'Edge Case - High Values',
      url: 'http://localhost:3000/api/price/swap-amount?network=mainnet&imagePrice=10&videoPrice=20'
    },
    {
      name: 'Invalid Network (should default to mainnet)',
      url: 'http://localhost:3000/api/price/swap-amount?network=invalid&imagePrice=1&videoPrice=2'
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`)
    console.log(`🔗 URL: ${testCase.url}`)
    
    try {
      const startTime = Date.now()
      const response = await fetch(testCase.url)
      const responseTime = Date.now() - startTime
      
      console.log(`⏱️  Response Time: ${responseTime}ms`)
      console.log(`📊 Status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.error) {
          console.log(`❌ API Error: ${data.error}`)
        } else {
          console.log(`✅ Success!`)
          console.log(`🌐 Network: ${data.networkDisplay}`)
          console.log(`📸 Image Generation: ${data.pricing.image.targetFormatted}`)
          console.log(`   └─ wS: ${data.pricing.image.options[0]?.amountFormatted || 'N/A'}`)
          console.log(`   └─ USDC: ${data.pricing.image.options[1]?.amountFormatted || 'N/A'}`)
          console.log(`🎥 Video Generation: ${data.pricing.video.targetFormatted}`)
          console.log(`   └─ wS: ${data.pricing.video.options[0]?.amountFormatted || 'N/A'}`)
          console.log(`   └─ USDC: ${data.pricing.video.options[1]?.amountFormatted || 'N/A'}`)
          console.log(`🕐 Cache: ${data.cacheDuration}`)
        }
      } else {
        console.log(`❌ HTTP Error: ${response.status}`)
        const errorText = await response.text()
        if (errorText) {
          console.log(`📝 Error Details: ${errorText}`)
        }
      }
      
    } catch (error) {
      console.log(`❌ Request Failed: ${error.message}`)
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }
  
  // Test CORS preflight
  console.log(`\n📋 Testing: CORS Preflight Request`)
  try {
    const response = await fetch('http://localhost:3000/api/price/swap-amount', {
      method: 'OPTIONS'
    })
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    console.log(`🔒 CORS Headers:`)
    console.log(`   └─ Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin')}`)
    console.log(`   └─ Access-Control-Allow-Methods: ${response.headers.get('access-control-allow-methods')}`)
    console.log(`   └─ Access-Control-Allow-Headers: ${response.headers.get('access-control-allow-headers')}`)
  } catch (error) {
    console.log(`❌ CORS Test Failed: ${error.message}`)
  }
  
  // Test Rate Limiting (send multiple requests quickly)
  console.log(`\n📋 Testing: Rate Limiting (sending 5 quick requests)`)
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await fetch('http://localhost:3000/api/price/swap-amount?network=mainnet')
      console.log(`Request ${i}: ${response.status} ${response.statusText}`)
    } catch (error) {
      console.log(`Request ${i}: Failed - ${error.message}`)
    }
  }
  
  console.log('\n🎉 API Integration Testing Complete!')
}

// Run the test
testAPIIntegration().catch(console.error)