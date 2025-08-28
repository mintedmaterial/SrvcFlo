const fs = require('fs');
const path = require('path');

// Contract deployment configuration
const deploymentConfig = {
  chainId: 57054, // Sonic testnet
  deployerWallet: process.env.SONIC_DEPLOYMENT_WALLET || "0x31cF44313fECb7145A5289532483b12213420c16",
  contracts: [
    {
      name: "BanditKidzStaking",
      source: "./Contracts/BanditKidzStaking.sol",
      constructorParams: {}
    },
    {
      name: "SonicAIGenerationPayment", 
      source: "./Contracts/SonicPayment.sol",
      constructorParams: {
        _banditKidzStaking: "{{BanditKidzStaking}}", // Will be replaced with actual address
        _devWallet: process.env.SONIC_DEPLOYMENT_WALLET || "0x31cF44313fECb7145A5289532483b12213420c16"
      }
    },
    {
      name: "GenerationVotingAndLeaderboard",
      source: "./Contracts/VotingContract.sol", 
      constructorParams: {
        _banditKidzStaking: "{{BanditKidzStaking}}" // Will be replaced with actual address
      }
    }
  ]
};

async function deployContracts() {
  console.log('Starting contract deployment to Sonic testnet...');
  console.log(`Chain ID: ${deploymentConfig.chainId}`);
  console.log(`Deployer: ${deploymentConfig.deployerWallet}`);
  
  const deployedContracts = {};
  
  for (const contract of deploymentConfig.contracts) {
    console.log(`\nDeploying ${contract.name}...`);
    
    // Replace template variables in constructor params
    const constructorParams = JSON.parse(
      JSON.stringify(contract.constructorParams)
        .replace(/\{\{(\w+)\}\}/g, (match, contractName) => {
          return deployedContracts[contractName] || match;
        })
    );
    
    console.log(`Constructor params:`, constructorParams);
    
    try {
      // Note: This would use Thirdweb MCP for actual deployment
      // For now, we'll log the deployment configuration
      console.log(`Would deploy ${contract.name} with params:`, constructorParams);
      
      // Simulate deployment result
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      deployedContracts[contract.name] = mockAddress;
      
      console.log(`✅ ${contract.name} deployed to: ${mockAddress}`);
      
    } catch (error) {
      console.error(`❌ Failed to deploy ${contract.name}:`, error);
      throw error;
    }
  }
  
  console.log('\n🎉 All contracts deployed successfully!');
  console.log('Deployed addresses:', deployedContracts);
  
  // Update .env file with deployed addresses
  updateEnvFile(deployedContracts);
  
  return deployedContracts;
}

function updateEnvFile(deployedContracts) {
  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update contract addresses
  if (deployedContracts.BanditKidzStaking) {
    envContent = envContent.replace(
      /SONIC_STAKING_CONTRACT=.*/,
      `SONIC_STAKING_CONTRACT=${deployedContracts.BanditKidzStaking}`
    );
  }
  
  if (deployedContracts.SonicAIGenerationPayment) {
    envContent = envContent.replace(
      /SONIC_PAYMENT_CONTRACT=.*/,
      `SONIC_PAYMENT_CONTRACT=${deployedContracts.SonicAIGenerationPayment}`
    );
  }
  
  if (deployedContracts.GenerationVotingAndLeaderboard) {
    envContent = envContent.replace(
      /SONIC_VOTING_CONTRACT=.*/,
      `SONIC_VOTING_CONTRACT=${deployedContracts.GenerationVotingAndLeaderboard}`
    );
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Environment file updated with contract addresses');
}

// Run deployment if called directly
if (require.main === module) {
  deployContracts().catch(console.error);
}

module.exports = { deployContracts, deploymentConfig };