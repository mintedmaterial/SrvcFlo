// Test OpenOcean API endpoints to find what works
const fetch = require('node-fetch')

const OPENOCEAN_API_KEY = 'nUvg4KhYQ1NdItTI8M4tgMNiktDRq5IS'

async function testOpenOceanEndpoints() {
  console.log('🧪 Testing OpenOcean API Endpoints...\n')
  
  // Test different endpoint variations
  const endpoints = [
    {
      name: 'Gas Price (v3/sonic)',
      url: 'https://open-api.openocean.finance/v3/sonic/gasPrice'
    },
    {
      name: 'Quote wS->USDC (v3/sonic)', 
      url: 'https://open-api.openocean.finance/v3/sonic/quote?inTokenAddress=0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38&outTokenAddress=0x29219dd400f2Bf60E5a23d13Be72B486D4038894&amount=1000000000000000000&gasPrice=1000000000'
    },
    {
      name: 'Quote wS->USDC.e (v3/sonic)',
      url: 'https://open-api.openocean.finance/v3/sonic/quote?inTokenAddress=0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38&outTokenAddress=0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6&amount=1000000000000000000&gasPrice=1000000000'
    },
    {
      name: 'Supported Chains',
      url: 'https://open-api.openocean.finance/v3/chains'
    },
    {
      name: 'Tokens on Sonic',
      url: 'https://open-api.openocean.finance/v3/sonic/tokenList'
    },
    {
      name: 'Test without chain in URL',
      url: 'https://open-api.openocean.finance/v3/chains'
    }
  ]
  
  for (const endpoint of endpoints) {
    console.log(`\n📋 Testing: ${endpoint.name}`)
    console.log(`🔗 URL: ${endpoint.url}`)
    
    try {
      const startTime = Date.now()
      const response = await fetch(endpoint.url, {
        headers: {
          'accept': 'application/json',
          'X-API-KEY': OPENOCEAN_API_KEY,
        },
        timeout: 10000
      })
      const responseTime = Date.now() - startTime
      
      console.log(`⏱️  Response Time: ${responseTime}ms`)
      console.log(`📊 Status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Success!`)
        
        // Log relevant data based on endpoint
        if (endpoint.name.includes('Quote')) {
          if (data.outAmount) {
            const price = parseFloat(data.outAmount) / (endpoint.url.includes('USDC.e') ? 1000000 : 1000000)
            console.log(`💰 wS Price: $${price.toFixed(6)}`)
            console.log(`📊 Out Amount: ${data.outAmount}`)
          }
          if (data.data) {
            console.log(`🔍 Data keys: ${Object.keys(data.data).join(', ')}`)
          }
        } else if (endpoint.name.includes('Chains')) {
          if (Array.isArray(data)) {
            const sonicChain = data.find(chain => chain.name?.toLowerCase().includes('sonic'))
            if (sonicChain) {
              console.log(`🎯 Found Sonic: ${JSON.stringify(sonicChain, null, 2)}`)
            } else {
              console.log(`❌ Sonic not found in chains`)
              console.log(`📋 Available chains: ${data.map(c => c.name || c.code).join(', ')}`)
            }
          }
        } else if (endpoint.name.includes('Token')) {
          if (Array.isArray(data)) {
            const usdcTokens = data.filter(token => token.symbol?.includes('USDC'))
            console.log(`💎 USDC tokens found: ${usdcTokens.length}`)
            usdcTokens.forEach(token => {
              console.log(`   - ${token.symbol}: ${token.address}`)
            })
          }
        }
        
        // Show first few keys of response for debugging
        if (typeof data === 'object' && data !== null) {
          const keys = Object.keys(data).slice(0, 5)
          console.log(`🔑 Response keys: ${keys.join(', ')}${Object.keys(data).length > 5 ? '...' : ''}`)
        }
        
      } else {
        console.log(`❌ HTTP Error: ${response.status}`)
        const errorText = await response.text()
        if (errorText) {
          console.log(`📝 Error Details: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`)
        }
      }
      
    } catch (error) {
      console.log(`❌ Request Failed: ${error.message}`)
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }
  
  console.log('\n🎉 OpenOcean API Testing Complete!')
}

// Test a simple price conversion manually
async function testPriceConversion() {
  console.log('\n💱 Testing Price Conversion Logic...')
  
  // Simulate what we'd get from a working API
  const mockApiResponse = {
    outAmount: "305000", // 0.305 USDC for 1 wS (6 decimals)
  }
  
  const wsPrice = parseFloat(mockApiResponse.outAmount) / 1000000 // Convert from USDC 6 decimals
  console.log(`📊 Mock wS Price: $${wsPrice}`)
  
  // Calculate image/video costs
  const imagePrice = 1.0 // $1 USD
  const videoPrice = 2.0 // $2 USD
  
  const imageWsAmount = imagePrice / wsPrice
  const videoWsAmount = videoPrice / wsPrice
  
  console.log(`🖼️  Image: $${imagePrice} = ${imageWsAmount.toFixed(2)} wS`)
  console.log(`🎥 Video: $${videoPrice} = ${videoWsAmount.toFixed(2)} wS`)
}

// Run the tests
testOpenOceanEndpoints()
  .then(() => testPriceConversion())
  .catch(console.error)