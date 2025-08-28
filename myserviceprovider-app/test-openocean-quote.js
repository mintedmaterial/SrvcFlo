// Test OpenOcean quote to get actual price data
const fetch = require('node-fetch')

const OPENOCEAN_API_KEY = 'nUvg4KhYQ1NdItTI8M4tgMNiktDRq5IS'

async function getActualQuote() {
  console.log('💰 Getting Actual wS->USDC Quote...\n')
  
  try {
    const response = await fetch('https://open-api.openocean.finance/v3/sonic/quote?inTokenAddress=0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38&outTokenAddress=0x29219dd400f2Bf60E5a23d13Be72B486D4038894&amount=1000000000000000000&gasPrice=1000000000', {
      headers: {
        'accept': 'application/json',
        'X-API-KEY': OPENOCEAN_API_KEY,
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('📊 Full Response:', JSON.stringify(data, null, 2))
      
      if (data.data && data.data.outAmount) {
        const outAmount = data.data.outAmount
        const wsPrice = parseFloat(outAmount) / 1000000 // USDC has 6 decimals
        
        console.log(`\n💎 Raw outAmount: ${outAmount}`)
        console.log(`💵 wS Price: $${wsPrice.toFixed(6)}`)
        console.log(`📈 1 wS = ${wsPrice.toFixed(6)} USDC`)
        
        // Calculate our pricing
        const imageWs = 1.0 / wsPrice
        const videoWs = 2.0 / wsPrice
        
        console.log(`\n🖼️  Image ($1): ${imageWs.toFixed(2)} wS`)
        console.log(`🎥 Video ($2): ${videoWs.toFixed(2)} wS`)
        
      } else {
        console.log('❌ No outAmount in response')
      }
    } else {
      console.log(`❌ Error: ${response.status}`)
      const errorText = await response.text()
      console.log(`Error: ${errorText}`)
    }
    
  } catch (error) {
    console.error('Request failed:', error)
  }
}

getActualQuote()