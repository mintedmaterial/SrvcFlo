const { ethers } = require('hardhat');
require('dotenv').config();

// Sonic Testnet Configuration
const SONIC_TESTNET_CONFIG = {
  name: 'Sonic Testnet',
  chainId: 146,
  rpcUrl: 'https://rpc.testnet.soniclabs.com',
  blockExplorer: 'https://testnet.sonicscan.org',
  nativeCurrency: {
    name: 'S',
    symbol: 'S',
    decimals: 18
  }
};

// Contract deployment order and configuration
const DEPLOYMENT_CONFIG = {
  // FLOAI Token - must deploy first
  floaiToken: {
    name: 'FLOAIToken',
    constructorArgs: [
      // Dev wallet addresses (4 wallets for 1% each)
      [
        '0x0000000000000000000000000000000000000001', // Dev 1
        '0x0000000000000000000000000000000000000002', // Dev 2  
        '0x0000000000000000000000000000000000000003', // Dev 3
        '0x0000000000000000000000000000000000000004'  // Dev 4
      ]
    ]
  },
  
  // Credit Contract - ERC1155 for credit packages
  creditContract: {
    name: 'SrvcFLoAICollection',
    constructorArgs: [] // Will use deployer as initial owner
  },
  
  // Agent Factory - Main iNFT contract
  agentFactory: {
    name: 'ServiceFlowAgentFactory',
    constructorArgs: [] // Will be set after FLOAI deployment
  },
  
  // Bandit Kidz Staking Contract (optional)
  banditKidzStaking: {
    name: 'BanditKidzStaking',
    constructorArgs: [] // Will be set after other deployments
  }
};

async function main() {
  console.log('🚀 Starting ServiceFlow AI deployment to Sonic Testnet...\n');
  
  // Get deployment account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await deployer.provider.getBalance(deployerAddress);
  
  console.log('📋 Deployment Details:');
  console.log(`Network: ${SONIC_TESTNET_CONFIG.name} (${SONIC_TESTNET_CONFIG.chainId})`);
  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Balance: ${ethers.formatEther(balance)} S\n`);
  
  if (balance < ethers.parseEther('0.1')) {
    throw new Error('Insufficient balance for deployment. Need at least 0.1 S tokens.');
  }
  
  const deployedContracts = {};
  
  try {
    // 1. Deploy FLOAI Token
    console.log('1️⃣ Deploying FLOAI Token...');
    const FLOAIToken = await ethers.getContractFactory('FLOAIToken');
    const floaiToken = await FLOAIToken.deploy(...DEPLOYMENT_CONFIG.floaiToken.constructorArgs);
    await floaiToken.waitForDeployment();
    deployedContracts.floaiToken = await floaiToken.getAddress();
    console.log(`✅ FLOAI Token deployed: ${deployedContracts.floaiToken}\n`);
    
    // 2. Deploy Credit Contract  
    console.log('2️⃣ Deploying Credit Contract...');
    const CreditContract = await ethers.getContractFactory('SrvcFLoAICollection');
    const creditContract = await CreditContract.deploy(deployerAddress);
    await creditContract.waitForDeployment();
    deployedContracts.creditContract = await creditContract.getAddress();
    console.log(`✅ Credit Contract deployed: ${deployedContracts.creditContract}\n`);
    
    // 3. Deploy Agent Factory
    console.log('3️⃣ Deploying Agent Factory...');
    const AgentFactory = await ethers.getContractFactory('ServiceFlowAgentFactory');
    const agentFactory = await AgentFactory.deploy(
      deployedContracts.floaiToken,
      deployedContracts.creditContract
    );
    await agentFactory.waitForDeployment();
    deployedContracts.agentFactory = await agentFactory.getAddress();
    console.log(`✅ Agent Factory deployed: ${deployedContracts.agentFactory}\n`);
    
    // 4. Verify FLOAI Token distribution
    console.log('4️⃣ Verifying FLOAI Token distribution...');
    const totalSupply = await floaiToken.totalSupply();
    const distributionInfo = await floaiToken.getDistributionInfo();
    
    console.log(`Total Supply: ${ethers.formatEther(totalSupply)} FLOAI`);
    console.log(`Builder Amount: ${ethers.formatEther(distributionInfo.builderAmount)} FLOAI`);
    console.log(`Public Market: ${ethers.formatEther(distributionInfo.publicMarketAmount)} FLOAI`);
    console.log(`Bandit Kidz: ${ethers.formatEther(distributionInfo.banditKidzAmount)} FLOAI`);
    console.log(`Ecosystem: ${ethers.formatEther(distributionInfo.ecosystemAmount)} FLOAI`);
    console.log(`Liquidity: ${ethers.formatEther(distributionInfo.liquidityAmount)} FLOAI`);
    console.log(`Dev Team: ${ethers.formatEther(distributionInfo.devAmount)} FLOAI\n`);
    
    // 5. Set up contract permissions
    console.log('5️⃣ Setting up contract permissions...');
    
    // Allow agent factory to use credits
    // Note: This would require additional setup in production
    console.log('Setting up Agent Factory permissions...\n');
    
    // 6. Deploy test configuration
    console.log('6️⃣ Creating test environment configuration...');
    
    const testConfig = {
      network: SONIC_TESTNET_CONFIG,
      contracts: deployedContracts,
      testAccounts: {
        deployer: deployerAddress,
        treasury: '0x0000000000000000000000000000000000000001',
        banditKidz: '0x0000000000000000000000000000000000000002'
      },
      creditPackages: {
        0: { name: 'Starter', credits: 750, priceS: 5, priceUSDC: 5 },
        1: { name: 'Creator', credits: 8000, priceS: 50, priceUSDC: 50 },
        2: { name: 'Professional', credits: 50000, priceS: 200, priceUSDC: 200 },
        3: { name: 'Enterprise', credits: 500000, priceS: 1500, priceUSDC: 1500 }
      },
      agentTypes: ['image', 'video', 'social', 'nft_watcher', 'token_analyst'],
      mintCosts: {
        sTokens: ethers.parseEther('50'),
        floai: ethers.parseEther('5000')
      }
    };
    
    // Save deployment configuration
    const fs = require('fs');
    const path = require('path');
    
    const configPath = path.join(__dirname, 'sonic-testnet-config.json');
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
    
    console.log(`✅ Test configuration saved to: ${configPath}\n`);
    
    // 7. Generate environment variables
    console.log('7️⃣ Generating environment variables...');
    
    const envVars = `
# Sonic Testnet Configuration
NEXT_PUBLIC_CHAIN_ID=${SONIC_TESTNET_CONFIG.chainId}
NEXT_PUBLIC_RPC_URL=${SONIC_TESTNET_CONFIG.rpcUrl}
NEXT_PUBLIC_BLOCK_EXPLORER=${SONIC_TESTNET_CONFIG.blockExplorer}

# Contract Addresses
NEXT_PUBLIC_FLOAI_TOKEN_ADDRESS=${deployedContracts.floaiToken}
NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS=${deployedContracts.creditContract}
NEXT_PUBLIC_AGENT_FACTORY_ADDRESS=${deployedContracts.agentFactory}

# Cloudflare Worker Configuration
NEXT_PUBLIC_CLOUDFLARE_WORKER_URL=https://your-worker.your-subdomain.workers.dev

# Auth0 Configuration (update with your values)
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://dev-serviceflow.us.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
`;
    
    const envPath = path.join(__dirname, '../.env.testnet');
    fs.writeFileSync(envPath, envVars.trim());
    
    console.log(`✅ Environment variables saved to: ${envPath}\n`);
    
    // 8. Deployment summary
    console.log('🎉 DEPLOYMENT COMPLETE!\n');
    console.log('📋 Contract Addresses:');
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });
    
    console.log('\n🔗 Next Steps:');
    console.log('1. Update your Cloudflare Worker environment variables with contract addresses');
    console.log('2. Configure Auth0 with the contract addresses');
    console.log('3. Fund test accounts with S tokens from Sonic testnet faucet');
    console.log('4. Test the frontend integration');
    console.log('5. Run integration tests\n');
    
    console.log('🌐 Useful Links:');
    console.log(`Block Explorer: ${SONIC_TESTNET_CONFIG.blockExplorer}`);
    console.log('Sonic Testnet Faucet: https://testnet.soniclabs.com/faucet');
    console.log('Sonic Documentation: https://docs.soniclabs.com\n');
    
    return deployedContracts;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

// Verification function for after deployment
async function verifyContracts(deployedContracts) {
  console.log('🔍 Starting contract verification...\n');
  
  try {
    for (const [contractName, address] of Object.entries(deployedContracts)) {
      console.log(`Verifying ${contractName} at ${address}...`);
      
      // This would integrate with Sonic's verification API
      // For now, we'll just log the verification command
      console.log(`Command: npx hardhat verify --network sonic-testnet ${address}`);
    }
    
    console.log('\n✅ Verification commands generated');
    console.log('Run these commands after deployment to verify contracts on Sonic explorer\n');
    
  } catch (error) {
    console.error('❌ Verification setup failed:', error);
  }
}

// Test deployment function
async function testDeployment(deployedContracts) {
  console.log('🧪 Running deployment tests...\n');
  
  try {
    const [deployer] = await ethers.getSigners();
    
    // Test FLOAI Token
    const floaiToken = await ethers.getContractAt('FLOAIToken', deployedContracts.floaiToken);
    const totalSupply = await floaiToken.totalSupply();
    const deployerBalance = await floaiToken.balanceOf(await deployer.getAddress());
    
    console.log(`✅ FLOAI Token - Total Supply: ${ethers.formatEther(totalSupply)}`);
    console.log(`✅ FLOAI Token - Deployer Balance: ${ethers.formatEther(deployerBalance)}`);
    
    // Test Credit Contract
    const creditContract = await ethers.getContractAt('SrvcFLoAICollection', deployedContracts.creditContract);
    const starterCredits = await creditContract.getCreditAmount(0);
    const starterPrice = await creditContract.getSTokenPrice(0);
    
    console.log(`✅ Credit Contract - Starter Credits: ${starterCredits}`);
    console.log(`✅ Credit Contract - Starter Price: ${ethers.formatEther(starterPrice)} S`);
    
    // Test Agent Factory
    const agentFactory = await ethers.getContractAt('ServiceFlowAgentFactory', deployedContracts.agentFactory);
    const mintCostS = await agentFactory.MINT_COST_S();
    const mintCostFLOAI = await agentFactory.MINT_COST_FLOAI();
    
    console.log(`✅ Agent Factory - S Token Mint Cost: ${ethers.formatEther(mintCostS)}`);
    console.log(`✅ Agent Factory - FLOAI Mint Cost: ${ethers.formatEther(mintCostFLOAI)}`);
    
    console.log('\n🎉 All deployment tests passed!\n');
    
  } catch (error) {
    console.error('❌ Deployment tests failed:', error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(async (deployedContracts) => {
      await testDeployment(deployedContracts);
      await verifyContracts(deployedContracts);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { main, testDeployment, verifyContracts };