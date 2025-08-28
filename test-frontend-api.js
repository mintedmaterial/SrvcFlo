// Test script to check frontend API calls
const testUrls = [
  'http://localhost:3000/api/price/swap-amount?network=mainnet&imagePrice=1&videoPrice=2',
  'http://localhost:3000/api/price/swap-amount?network=testnet&imagePrice=1&videoPrice=2',
  'http://localhost:3000/api/price/swap-amount', // without params
];

async function testAPIs() {
  console.log('Testing ServiceFlow AI Frontend APIs...\n');
  
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Response:`, JSON.stringify(data, null, 2));
      console.log('---\n');
      
    } catch (error) {
      console.error(`Error testing ${url}:`, error.message);
      console.log('---\n');
    }
  }
}

testAPIs();