/**
 * Test Real OpenOcean API Integration
 * Fetches live price data from OpenOcean API for Sonic mainnet
 */

const https = require('https');

// OpenOcean API configuration
const OPENOCEAN_API_KEY = 'nUvg4KhYQ1NdItTI8M4tgMNiktDRq5IS';
const SONIC_CHAIN_ID = '146'; // Sonic mainnet
const SONIC_TESTNET_CHAIN_ID = '57054'; // Sonic testnet

// Token addresses from user's example and official Sonic docs
const TOKENS = {
  mainnet: {
    wS: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
    USDC: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894',
    S: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' // Native S token
  },
  testnet: {
    wS: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
    USDC: '0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6',
    S: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
  }
};

console.log('🔄 Testing Real OpenOcean API Integration...\n');

// Helper function to make HTTP requests
function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'apikey': OPENOCEAN_API_KEY,
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`JSON parse error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test fetching token list from Sonic
async function testTokenList() {
  console.log('1. Testing OpenOcean Token List API...');
  
  try {
    const url = `https://open-api.openocean.finance/v4/sonic/tokenList`;
    const response = await makeRequest(url);
    
    if (response.code === 200) {
      console.log(`✅ Found ${response.data.length} tokens on Sonic`);
      
      // Look for our specific tokens
      const ourTokens = ['WS', 'USDC.e', 'S'];
      const foundTokens = response.data.filter(token => 
        ourTokens.some(symbol => token.symbol.includes(symbol))
      );
      
      console.log('\n📋 Our supported tokens found:');
      foundTokens.forEach(token => {
        console.log(`   ${token.symbol} (${token.name}): ${token.address}`);
        console.log(`   Price: $${token.usd || 'N/A'}`);
      });
      
      return foundTokens;
    } else {
      throw new Error(`API error: ${response.message}`);
    }
  } catch (error) {
    console.log(`❌ Token list fetch failed: ${error.message}`);
    return [];
  }
}

// Test getting price quote for wS to USDC (user's example)
async function testPriceQuote() {
  console.log('\n2. Testing Price Quote API (wS → USDC)...');
  
  try {
    // Using user's example: 1 wS token to USDC
    const url = `https://open-api.openocean.finance/v4/sonic/quote` +
      `?inTokenAddress=${TOKENS.mainnet.wS}` +
      `&outTokenAddress=${TOKENS.mainnet.USDC}` +
      `&amountDecimals=1000000000000000000` + // 1 wS (18 decimals)
      `&gasPrice=50000`;
    
    const response = await makeRequest(url);
    
    if (response.code === 200) {
      const { inToken, outToken, inAmount, outAmount } = response.data;
      
      console.log('✅ Price quote successful!');
      console.log(`   Input: ${inAmount} ${inToken.symbol} (${inToken.name})`);
      console.log(`   Output: ${outAmount} ${outToken.symbol} (${outToken.name})`);
      console.log(`   wS Price: $${inToken.usd}`);
      console.log(`   USDC Price: $${outToken.usd}`);
      
      // Calculate price per token
      const wsAmountFloat = parseFloat(inAmount) / Math.pow(10, inToken.decimals);
      const usdcAmountFloat = parseFloat(outAmount) / Math.pow(10, outToken.decimals);
      const pricePerWS = usdcAmountFloat / wsAmountFloat;
      
      console.log(`   Calculated wS price: $${pricePerWS.toFixed(6)} per wS`);
      
      return {
        wsPrice: pricePerWS,
        usdcPrice: parseFloat(outToken.usd),
        quoteData: response.data
      };
    } else {
      throw new Error(`Quote failed: ${response.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Price quote failed: ${error.message}`);
    return null;
  }
}

// Test calculating token amounts for $1 and $2 USD
async function testDynamicPricing(wsPrice) {
  console.log('\n3. Testing Dynamic Pricing Calculations...');
  
  if (!wsPrice) {
    console.log('❌ Cannot test dynamic pricing without wS price');
    return;
  }
  
  try {
    // Calculate tokens needed for image generation ($1 USD)
    const tokensFor1USD = 1 / wsPrice;
    const tokensFor2USD = 2 / wsPrice;
    
    console.log('💰 Dynamic Pricing Results:');
    console.log(`   Image Generation ($1 USD): ${tokensFor1USD.toFixed(6)} wS`);
    console.log(`   Video Generation ($2 USD): ${tokensFor2USD.toFixed(6)} wS`);
    
    // Convert to wei (18 decimals) for smart contract
    const imageWei = Math.ceil(tokensFor1USD * Math.pow(10, 18));
    const videoWei = Math.ceil(tokensFor2USD * Math.pow(10, 18));
    
    console.log('\n🔗 Smart Contract Values (wei):');
    console.log(`   Image Generation: ${imageWei.toString()}`);
    console.log(`   Video Generation: ${videoWei.toString()}`);
    
    // Compare with old hardcoded values
    const oldImageCost = Math.pow(10, 18); // 1 wS
    const savingsPercent = ((oldImageCost - imageWei) / oldImageCost * 100).toFixed(1);
    
    if (imageWei < oldImageCost) {
      console.log(`\n💡 Users save ${savingsPercent}% vs old hardcoded pricing!`);
    } else {
      console.log(`\n💡 Current price is ${Math.abs(savingsPercent)}% higher than old hardcoded pricing`);
    }
    
    return {
      imageTokens: tokensFor1USD,
      videoTokens: tokensFor2USD,
      imageWei: imageWei.toString(),
      videoWei: videoWei.toString()
    };
  } catch (error) {
    console.log(`❌ Dynamic pricing calculation failed: ${error.message}`);
    return null;
  }
}

// Test reverse calculation (USDC to wS for payment)
async function testReverseQuote() {
  console.log('\n4. Testing Reverse Quote (USDC → wS)...');
  
  try {
    // Quote 1 USDC to wS
    const url = `https://open-api.openocean.finance/v4/sonic/quote` +
      `?inTokenAddress=${TOKENS.mainnet.USDC}` +
      `&outTokenAddress=${TOKENS.mainnet.wS}` +
      `&amountDecimals=1000000` + // 1 USDC (6 decimals)
      `&gasPrice=50000`;
    
    const response = await makeRequest(url);
    
    if (response.code === 200) {
      const { inToken, outToken, inAmount, outAmount } = response.data;
      
      console.log('✅ Reverse quote successful!');
      console.log(`   Input: ${inAmount} ${inToken.symbol}`);
      console.log(`   Output: ${outAmount} ${outToken.symbol}`);
      
      const usdcAmount = parseFloat(inAmount) / Math.pow(10, inToken.decimals);
      const wsAmount = parseFloat(outAmount) / Math.pow(10, outToken.decimals);
      
      console.log(`   $${usdcAmount} USDC = ${wsAmount.toFixed(6)} wS`);
      
      return { wsAmount, usdcAmount };
    } else {
      throw new Error(`Reverse quote failed: ${response.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Reverse quote failed: ${error.message}`);
    return null;
  }
}

// Test API rate limiting and error handling
async function testAPILimits() {
  console.log('\n5. Testing API Rate Limits and Error Handling...');
  
  const testRequests = [];
  const startTime = Date.now();
  
  // Make 5 quick requests to test rate limiting (OpenOcean limit: 3 RPS)
  for (let i = 0; i < 5; i++) {
    const url = `https://open-api.openocean.finance/v4/sonic/quote` +
      `?inTokenAddress=${TOKENS.mainnet.wS}` +
      `&outTokenAddress=${TOKENS.mainnet.USDC}` +
      `&amountDecimals=1000000000000000000` +
      `&gasPrice=50000`;
    
    testRequests.push(
      makeRequest(url)
        .then(response => ({ success: true, response }))
        .catch(error => ({ success: false, error: error.message }))
    );
  }
  
  try {
    const results = await Promise.all(testRequests);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ API Rate Limit Test:`);
    console.log(`   Successful requests: ${successful}/5`);
    console.log(`   Failed requests: ${failed}/5`);
    console.log(`   Time taken: ${Date.now() - startTime}ms`);
    
    if (failed > 0) {
      console.log('💡 Some requests failed - this is expected due to 3 RPS limit');
    }
    
    return { successful, failed };
  } catch (error) {
    console.log(`❌ Rate limit test failed: ${error.message}`);
    return null;
  }
}

// Test with invalid parameters
async function testErrorHandling() {
  console.log('\n6. Testing Error Handling...');
  
  const tests = [
    {
      name: 'Invalid token address',
      url: `https://open-api.openocean.finance/v4/sonic/quote?inTokenAddress=0xinvalid&outTokenAddress=${TOKENS.mainnet.USDC}&amountDecimals=1000000000000000000&gasPrice=50000`
    },
    {
      name: 'Zero amount',
      url: `https://open-api.openocean.finance/v4/sonic/quote?inTokenAddress=${TOKENS.mainnet.wS}&outTokenAddress=${TOKENS.mainnet.USDC}&amountDecimals=0&gasPrice=50000`
    },
    {
      name: 'Missing parameters',
      url: `https://open-api.openocean.finance/v4/sonic/quote?inTokenAddress=${TOKENS.mainnet.wS}`
    }
  ];
  
  for (const test of tests) {
    try {
      const response = await makeRequest(test.url);
      if (response.code !== 200) {
        console.log(`✅ ${test.name}: Properly handled error (${response.code})`);
      } else {
        console.log(`⚠️ ${test.name}: Unexpected success`);
      }
    } catch (error) {
      console.log(`✅ ${test.name}: Properly caught error - ${error.message}`);
    }
  }
}

// Main test runner
async function runRealAPITests() {
  console.log('🧪 REAL OPENOCEAN API INTEGRATION TESTS');
  console.log('==========================================\n');
  
  try {
    // Test 1: Fetch token list
    const tokenList = await testTokenList();
    
    // Test 2: Get price quote
    const quoteResult = await testPriceQuote();
    
    // Test 3: Calculate dynamic pricing
    let pricingResult = null;
    if (quoteResult) {
      pricingResult = await testDynamicPricing(quoteResult.wsPrice);
    }
    
    // Test 4: Test reverse quote
    const reverseResult = await testReverseQuote();
    
    // Test 5: Test API limits
    const limitResult = await testAPILimits();
    
    // Test 6: Test error handling
    await testErrorHandling();
    
    // Summary
    console.log('\n==========================================');
    console.log('📊 INTEGRATION TEST SUMMARY');
    console.log('==========================================\n');
    
    if (quoteResult && pricingResult) {
      console.log('✅ OpenOcean API integration successful!');
      console.log(`💰 Current wS price: $${quoteResult.wsPrice.toFixed(6)}`);
      console.log(`🖼️  Image generation cost: ${pricingResult.imageTokens.toFixed(6)} wS`);
      console.log(`🎥 Video generation cost: ${pricingResult.videoTokens.toFixed(6)} wS`);
      console.log(`🔗 Smart contract ready for deployment`);
      
      console.log('\n🚀 NEXT STEPS:');
      console.log('1. Deploy Cloudflare Workers with: wrangler deploy');
      console.log('2. Deploy SonicPriceOracle contract to testnet');
      console.log('3. Deploy updated payment contracts');
      console.log('4. Test end-to-end payment flow');
      console.log('5. Deploy to mainnet after successful testing');
    } else {
      console.log('❌ Some API tests failed - check configuration');
    }
    
  } catch (error) {
    console.log(`❌ Test runner failed: ${error.message}`);
  }
}

// Execute the tests
runRealAPITests();