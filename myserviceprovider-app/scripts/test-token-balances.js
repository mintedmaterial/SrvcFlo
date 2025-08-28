// Test script to check token balances on Sonic testnet
const { ethers } = require('ethers');

// Sonic Testnet configuration
const RPC_URL = 'https://rpc.blaze.soniclabs.com';
const CHAIN_ID = 57054;

// Token addresses from your config
const TOKENS = {
  wS: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
  USDC: '0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6',
  SSSTT: '0xc777Fa50186362fe0EF9CCD579b6385cE7CB49f1',
  CORAL: '0xAF93888cbD250300470A1618206e036E11470149'
};

// Contract addresses
const PAYMENT_CONTRACT = '0x08388768EEd51B2693D30AC1071D4AB558220eDE';
const STAKING_CONTRACT = '0x93d00036b8040005B4AF73b3A404F8bec4fD6B87';
const TEST_NFT_CONTRACT = '0x2DBFB3F4506aD4A205DAF8e319759e0E13e5A504';

// ERC20 ABI for balance checking
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

async function testTokenBalances() {
  console.log('🔍 Testing Sonic Testnet Token Balances...\n');
  
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Test wallet address (replace with your wallet address)
    const testWallet = '0x93d00036b8040005B4AF73b3A404F8bec4fD6B87'; // Using staking contract for test
    
    console.log(`Testing balances for: ${testWallet}`);
    console.log(`Network: Sonic Testnet (Chain ID: ${CHAIN_ID})`);
    console.log(`RPC: ${RPC_URL}\n`);
    
    // Check native S token balance
    const nativeBalance = await provider.getBalance(testWallet);
    console.log(`Native S Balance: ${ethers.formatEther(nativeBalance)} S\n`);
    
    // Check each token
    for (const [symbol, address] of Object.entries(TOKENS)) {
      try {
        const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
        
        // Get token info
        const [balance, decimals, name] = await Promise.all([
          tokenContract.balanceOf(testWallet),
          tokenContract.decimals(),
          tokenContract.name()
        ]);
        
        const formattedBalance = ethers.formatUnits(balance, decimals);
        
        console.log(`${symbol} (${name}):`);
        console.log(`  Address: ${address}`);
        console.log(`  Balance: ${formattedBalance} ${symbol}`);
        console.log(`  Decimals: ${decimals}`);
        console.log();
        
      } catch (error) {
        console.log(`❌ Error checking ${symbol} at ${address}:`);
        console.log(`   ${error.message}\n`);
      }
    }
    
    // Test contract deployments
    console.log('📄 Testing Contract Deployments:');
    console.log(`Payment Contract: ${PAYMENT_CONTRACT}`);
    console.log(`Staking Contract: ${STAKING_CONTRACT}`);
    console.log(`Test NFT Contract: ${TEST_NFT_CONTRACT}\n`);
    
    // Check if contracts have code deployed
    for (const [name, address] of Object.entries({
      'Payment': PAYMENT_CONTRACT,
      'Staking': STAKING_CONTRACT,
      'Test NFT': TEST_NFT_CONTRACT
    })) {
      try {
        const code = await provider.getCode(address);
        const isDeployed = code !== '0x';
        console.log(`${name} Contract: ${isDeployed ? '✅ Deployed' : '❌ Not Deployed'} at ${address}`);
      } catch (error) {
        console.log(`${name} Contract: ❌ Error checking ${address}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Add token to wallet helper (for MetaMask)
function generateAddTokenScript() {
  console.log('\n🪙 Add Tokens to MetaMask:');
  console.log('Copy and paste this in your browser console while connected to Sonic Testnet:\n');
  
  for (const [symbol, address] of Object.entries(TOKENS)) {
    console.log(`// Add ${symbol} token`);
    console.log(`await ethereum.request({
  method: 'wallet_watchAsset',
  params: {
    type: 'ERC20',
    options: {
      address: '${address}',
      symbol: '${symbol}',
      decimals: 18,
    },
  },
});`);
    console.log();
  }
}

if (require.main === module) {
  testTokenBalances().then(() => {
    generateAddTokenScript();
  });
}

module.exports = { testTokenBalances, TOKENS, PAYMENT_CONTRACT };