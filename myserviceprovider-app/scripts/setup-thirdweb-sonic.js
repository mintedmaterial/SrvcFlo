#!/usr/bin/env node
// Thirdweb and Sonic Blockchain Integration Setup for ServiceFlow AI

const fs = require('fs');
const path = require('path');

// Sonic blockchain configuration
const SONIC_CONFIG = {
  chainId: 64165,
  name: 'Sonic Testnet',
  rpcUrl: 'https://rpc.testnet.soniclabs.com',
  blockExplorer: 'https://testnet.soniclabs.com',
  nativeCurrency: {
    name: 'Sonic',
    symbol: 'S',
    decimals: 18
  },
  contracts: {
    // ServiceFlow AI contracts on Sonic
    payment: {
      name: 'SonicPayment',
      description: 'Handle payments and credits on Sonic blockchain',
      features: ['payForCredits', 'processServicePayment', 'refundPayment']
    },
    staking: {
      name: 'BanditKidzStaking',
      description: 'NFT staking for rewards and governance',
      features: ['stakeNFT', 'unstakeNFT', 'claimRewards', 'getStakingInfo']
    },
    voting: {
      name: 'VotingContract',
      description: 'Governance voting with NFT-based voting power',
      features: ['createProposal', 'vote', 'executeProposal', 'getVotingPower']
    }
  }
};

// Thirdweb SDK configuration
const THIRDWEB_CONFIG = {
  clientId: 'your-thirdweb-client-id', // Will be set via environment variables
  secretKey: 'your-thirdweb-secret-key', // Will be set via environment variables
  supportedChains: [1, 137, 8453, 64165, 56], // Ethereum, Polygon, Base, Sonic, BSC
  smartAccountConfig: {
    factoryAddress: '0x85e23b94e7F5E9cC1fF78BCe78cfb15B81f0DF00', // Thirdweb factory
    gasless: true,
    bundlerUrl: 'https://bundler.thirdweb.com',
    paymasterUrl: 'https://paymaster.thirdweb.com'
  }
};

console.log('🔗 ServiceFlow AI Web3 Integration Setup');
console.log('='.repeat(50));

// Function to create Thirdweb configuration file
function createThirdwebConfig() {
  console.log('\n📝 Creating Thirdweb configuration...');
  
  const thirdwebConfig = {
    version: '1.0.0',
    name: 'ServiceFlow AI',
    description: 'Web3 integration for AI-powered service platform',
    website: 'https://srvcflo.com',
    chains: THIRDWEB_CONFIG.supportedChains.map(chainId => {
      if (chainId === 64165) {
        return {
          chainId: SONIC_CONFIG.chainId,
          name: SONIC_CONFIG.name,
          rpc: [SONIC_CONFIG.rpcUrl],
          nativeCurrency: SONIC_CONFIG.nativeCurrency,
          blockExplorers: [
            {
              name: 'Sonic Explorer',
              url: SONIC_CONFIG.blockExplorer
            }
          ],
          testnet: true
        };
      }
      return { chainId }; // Use default Thirdweb chain config for others
    }),
    wallets: [
      'metamask',
      'walletConnect',
      'coinbaseWallet',
      'injected'
    ],
    smartAccount: THIRDWEB_CONFIG.smartAccountConfig,
    storage: {
      gateway: 'https://gateway.ipfscdn.io/ipfs/'
    }
  };
  
  const configPath = path.join(__dirname, '..', 'thirdweb.config.json');
  fs.writeFileSync(configPath, JSON.stringify(thirdwebConfig, null, 2));
  
  console.log(`✅ Thirdweb config created at: ${configPath}`);
  return configPath;
}

// Function to create contract deployment scripts
function createContractScripts() {
  console.log('\n📋 Creating contract deployment scripts...');
  
  // Sonic Payment Contract deployment script
  const sonicPaymentScript = `
// Deploy Sonic Payment Contract
const { ThirdwebSDK } = require('@thirdweb-dev/sdk');
const { Sonic } = require('@thirdweb-dev/chains');

async function deploySonicPaymentContract() {
  console.log('🚀 Deploying Sonic Payment Contract...');
  
  const sdk = ThirdwebSDK.fromPrivateKey(
    process.env.SONIC_PRIVATE_KEY,
    Sonic,
    {
      secretKey: process.env.THIRDWEB_SECRET_KEY
    }
  );
  
  try {
    const contractAddress = await sdk.deployer.deployContract({
      name: 'SonicPayment',
      primary_sale_recipient: process.env.ADMIN_WALLET_ADDRESS,
      trusted_forwarders: ['0x0000000000000000000000000000000000000000'],
      constructor_params: {
        _serviceWallet: process.env.SERVICE_WALLET_ADDRESS,
        _creditRate: '100' // 1 SONIC = 100 credits
      }
    });
    
    console.log('✅ Sonic Payment Contract deployed at:', contractAddress);
    
    // Save contract info
    const contractInfo = {
      name: 'SonicPayment',
      address: contractAddress,
      chainId: 64165,
      deployedAt: new Date().toISOString(),
      features: ['payForCredits', 'processServicePayment', 'refundPayment']
    };
    
    return contractInfo;
  } catch (error) {
    console.error('❌ Failed to deploy Sonic Payment Contract:', error);
    throw error;
  }
}

module.exports = { deploySonicPaymentContract };
`;
  
  // NFT Staking Contract deployment script
  const stakingScript = `
// Deploy NFT Staking Contract
const { ThirdwebSDK } = require('@thirdweb-dev/sdk');
const { Sonic } = require('@thirdweb-dev/chains');

async function deployStakingContract() {
  console.log('🥩 Deploying NFT Staking Contract...');
  
  const sdk = ThirdwebSDK.fromPrivateKey(
    process.env.SONIC_PRIVATE_KEY,
    Sonic,
    {
      secretKey: process.env.THIRDWEB_SECRET_KEY
    }
  );
  
  try {
    const contractAddress = await sdk.deployer.deployContract({
      name: 'BanditKidzStaking',
      primary_sale_recipient: process.env.ADMIN_WALLET_ADDRESS,
      constructor_params: {
        _nftContract: process.env.NFT_CONTRACT_ADDRESS,
        _rewardToken: process.env.REWARD_TOKEN_ADDRESS,
        _rewardRate: '10' // 10 tokens per day
      }
    });
    
    console.log('✅ NFT Staking Contract deployed at:', contractAddress);
    
    const contractInfo = {
      name: 'BanditKidzStaking',
      address: contractAddress,
      chainId: 64165,
      deployedAt: new Date().toISOString(),
      features: ['stakeNFT', 'unstakeNFT', 'claimRewards', 'getStakingInfo']
    };
    
    return contractInfo;
  } catch (error) {
    console.error('❌ Failed to deploy Staking Contract:', error);
    throw error;
  }
}

module.exports = { deployStakingContract };
`;
  
  // Voting Contract deployment script
  const votingScript = `
// Deploy Voting Contract
const { ThirdwebSDK } = require('@thirdweb-dev/sdk');
const { Sonic } = require('@thirdweb-dev/chains');

async function deployVotingContract() {
  console.log('🗳️  Deploying Voting Contract...');
  
  const sdk = ThirdwebSDK.fromPrivateKey(
    process.env.SONIC_PRIVATE_KEY,
    Sonic,
    {
      secretKey: process.env.THIRDWEB_SECRET_KEY
    }
  );
  
  try {
    const contractAddress = await sdk.deployer.deployContract({
      name: 'VotingContract',
      primary_sale_recipient: process.env.ADMIN_WALLET_ADDRESS,
      constructor_params: {
        _votingToken: process.env.NFT_CONTRACT_ADDRESS,
        _votingPeriod: '604800', // 1 week in seconds
        _executionDelay: '86400' // 1 day in seconds
      }
    });
    
    console.log('✅ Voting Contract deployed at:', contractAddress);
    
    const contractInfo = {
      name: 'VotingContract',
      address: contractAddress,
      chainId: 64165,
      deployedAt: new Date().toISOString(),
      features: ['createProposal', 'vote', 'executeProposal', 'getVotingPower']
    };
    
    return contractInfo;
  } catch (error) {
    console.error('❌ Failed to deploy Voting Contract:', error);
    throw error;
  }
}

module.exports = { deployVotingContract };
`;
  
  // Write deployment scripts
  const scriptsDir = path.join(__dirname, '..', 'contracts', 'deploy');
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(scriptsDir, 'deploy-sonic-payment.js'), sonicPaymentScript);
  fs.writeFileSync(path.join(scriptsDir, 'deploy-staking.js'), stakingScript);
  fs.writeFileSync(path.join(scriptsDir, 'deploy-voting.js'), votingScript);
  
  console.log(`✅ Contract deployment scripts created in: ${scriptsDir}`);
}

// Function to create Web3 client configuration
function createWeb3ClientConfig() {
  console.log('\n🌐 Creating Web3 client configuration...');
  
  const web3Config = `
// Web3 Client Configuration for ServiceFlow AI
import { ThirdwebProvider, ConnectWallet } from '@thirdweb-dev/react';
import { Sonic } from '@thirdweb-dev/chains';

const SONIC_CHAIN = {
  chainId: ${SONIC_CONFIG.chainId},
  name: '${SONIC_CONFIG.name}',
  chain: 'SONIC',
  rpc: ['${SONIC_CONFIG.rpcUrl}'],
  nativeCurrency: ${JSON.stringify(SONIC_CONFIG.nativeCurrency, null, 2)},
  shortName: 'sonic',
  slug: 'sonic-testnet',
  testnet: true,
  blockExplorers: [
    {
      name: 'Sonic Explorer',
      url: '${SONIC_CONFIG.blockExplorer}'
    }
  ]
};

export const WEB3_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
  chains: [
    SONIC_CHAIN,
    // Add other supported chains
  ],
  walletConnectOptions: {
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
  },
  smartAccount: {
    factoryAddress: '${THIRDWEB_CONFIG.smartAccountConfig.factoryAddress}',
    gasless: ${THIRDWEB_CONFIG.smartAccountConfig.gasless}
  }
};

// ServiceFlow AI Contract Addresses (to be updated after deployment)
export const CONTRACTS = {
  SONIC_PAYMENT: {
    address: 'CONTRACT_ADDRESS_TO_BE_SET',
    chainId: ${SONIC_CONFIG.chainId}
  },
  NFT_STAKING: {
    address: 'CONTRACT_ADDRESS_TO_BE_SET',
    chainId: ${SONIC_CONFIG.chainId}
  },
  VOTING: {
    address: 'CONTRACT_ADDRESS_TO_BE_SET',
    chainId: ${SONIC_CONFIG.chainId}
  }
};

// Provider component for the app
export function Web3Provider({ children }) {
  return (
    <ThirdwebProvider
      clientId={WEB3_CONFIG.clientId}
      activeChain={SONIC_CHAIN}
      supportedChains={WEB3_CONFIG.chains}
      smartWallet={WEB3_CONFIG.smartAccount}
    >
      {children}
    </ThirdwebProvider>
  );
}

export default WEB3_CONFIG;
`;
  
  const configPath = path.join(__dirname, '..', 'lib', 'web3-config.js');
  const libDir = path.dirname(configPath);
  
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, web3Config);
  console.log(`✅ Web3 client config created at: ${configPath}`);
}

// Function to create contract interaction utilities
function createContractUtils() {
  console.log('\n🔧 Creating contract interaction utilities...');
  
  const contractUtils = `
// Contract Interaction Utilities for ServiceFlow AI
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { Sonic } from '@thirdweb-dev/chains';

// Initialize SDK for server-side operations
export function initializeServerSDK() {
  return ThirdwebSDK.fromPrivateKey(
    process.env.SONIC_PRIVATE_KEY,
    Sonic,
    {
      secretKey: process.env.THIRDWEB_SECRET_KEY
    }
  );
}

// Sonic Payment Contract interactions
export class SonicPaymentContract {
  constructor(sdk, contractAddress) {
    this.sdk = sdk;
    this.contract = sdk.getContract(contractAddress);
  }
  
  async payForCredits(userAddress, amountInSonic) {
    try {
      const tx = await this.contract.call('payForCredits', [userAddress], {
        value: amountInSonic
      });
      return { success: true, txHash: tx.receipt.transactionHash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getCreditsForAmount(amountInSonic) {
    try {
      const credits = await this.contract.call('getCreditsForAmount', [amountInSonic]);
      return { success: true, credits: credits.toString() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async processRefund(userAddress, refundAmount) {
    try {
      const tx = await this.contract.call('processRefund', [userAddress, refundAmount]);
      return { success: true, txHash: tx.receipt.transactionHash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// NFT Staking Contract interactions
export class NFTStakingContract {
  constructor(sdk, contractAddress) {
    this.sdk = sdk;
    this.contract = sdk.getContract(contractAddress);
  }
  
  async stakeNFT(tokenId, userAddress) {
    try {
      const tx = await this.contract.call('stakeNFT', [tokenId], { from: userAddress });
      return { success: true, txHash: tx.receipt.transactionHash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async unstakeNFT(tokenId, userAddress) {
    try {
      const tx = await this.contract.call('unstakeNFT', [tokenId], { from: userAddress });
      return { success: true, txHash: tx.receipt.transactionHash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async claimRewards(userAddress) {
    try {
      const tx = await this.contract.call('claimRewards', [], { from: userAddress });
      return { success: true, txHash: tx.receipt.transactionHash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getStakingInfo(userAddress) {
    try {
      const info = await this.contract.call('getStakingInfo', [userAddress]);
      return { 
        success: true, 
        stakedTokens: info.stakedTokens,
        pendingRewards: info.pendingRewards.toString(),
        lastRewardTime: info.lastRewardTime.toString()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Voting Contract interactions
export class VotingContract {
  constructor(sdk, contractAddress) {
    this.sdk = sdk;
    this.contract = sdk.getContract(contractAddress);
  }
  
  async createProposal(title, description, userAddress) {
    try {
      const tx = await this.contract.call('createProposal', [title, description], { from: userAddress });
      return { success: true, txHash: tx.receipt.transactionHash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async vote(proposalId, support, userAddress) {
    try {
      const tx = await this.contract.call('vote', [proposalId, support], { from: userAddress });
      return { success: true, txHash: tx.receipt.transactionHash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getVotingPower(userAddress) {
    try {
      const power = await this.contract.call('getVotingPower', [userAddress]);
      return { success: true, votingPower: power.toString() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getProposal(proposalId) {
    try {
      const proposal = await this.contract.call('getProposal', [proposalId]);
      return { 
        success: true, 
        proposal: {
          id: proposal.id.toString(),
          title: proposal.title,
          description: proposal.description,
          forVotes: proposal.forVotes.toString(),
          againstVotes: proposal.againstVotes.toString(),
          status: proposal.status
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export utility functions
export async function getContractInstance(contractType, contractAddress) {
  const sdk = initializeServerSDK();
  
  switch (contractType) {
    case 'payment':
      return new SonicPaymentContract(sdk, contractAddress);
    case 'staking':
      return new NFTStakingContract(sdk, contractAddress);
    case 'voting':
      return new VotingContract(sdk, contractAddress);
    default:
      throw new Error(\`Unknown contract type: \${contractType}\`);
  }
}

export default {
  SonicPaymentContract,
  NFTStakingContract,
  VotingContract,
  getContractInstance,
  initializeServerSDK
};
`;
  
  const utilsPath = path.join(__dirname, '..', 'lib', 'contract-utils.js');
  fs.writeFileSync(utilsPath, contractUtils);
  console.log(`✅ Contract utilities created at: ${utilsPath}`);
}

// Function to create environment variables template
function createEnvTemplate() {
  console.log('\n📋 Creating environment variables template...');
  
  const envTemplate = `# ServiceFlow AI Web3 Environment Variables Template
# Copy this to .env and fill in your actual values

# Thirdweb Configuration
THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here
THIRDWEB_SECRET_KEY=your_thirdweb_secret_key_here
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here

# Sonic Blockchain
SONIC_PRIVATE_KEY=your_sonic_private_key_here
SONIC_RPC_URL=https://rpc.testnet.soniclabs.com
SONIC_CHAIN_ID=64165

# Wallet Addresses
ADMIN_WALLET_ADDRESS=your_admin_wallet_address_here
SERVICE_WALLET_ADDRESS=your_service_wallet_address_here

# Contract Addresses (to be filled after deployment)
SONIC_PAYMENT_CONTRACT=contract_address_after_deployment
NFT_STAKING_CONTRACT=contract_address_after_deployment
VOTING_CONTRACT=contract_address_after_deployment
NFT_CONTRACT_ADDRESS=your_nft_contract_address_here
REWARD_TOKEN_ADDRESS=your_reward_token_address_here

# WalletConnect (optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Cloudflare (for integration)
CLOUDFLARE_ACCOUNT_HASH=your_cloudflare_account_hash
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token

# MongoDB (for user data)
MONGODB_URI=your_mongodb_connection_string

# Additional APIs
INFURA_PROJECT_ID=your_infura_project_id
ALCHEMY_API_KEY=your_alchemy_api_key
`;
  
  const envPath = path.join(__dirname, '..', '.env.template');
  fs.writeFileSync(envPath, envTemplate);
  console.log(`✅ Environment template created at: ${envPath}`);
}

// Main setup function
async function setupWeb3Integration() {
  console.log('🚀 Starting Web3 integration setup...\n');
  
  try {
    // Create Thirdweb configuration
    createThirdwebConfig();
    
    // Create contract deployment scripts
    createContractScripts();
    
    // Create Web3 client configuration
    createWeb3ClientConfig();
    
    // Create contract utilities
    createContractUtils();
    
    // Create environment template
    createEnvTemplate();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Web3 Integration Setup Complete!');
    console.log('='.repeat(60));
    
    console.log('\n📋 Next Steps:');
    console.log('1. Fill in the .env.template file with your actual values');
    console.log('2. Install required dependencies:');
    console.log('   npm install @thirdweb-dev/sdk @thirdweb-dev/react @thirdweb-dev/chains');
    console.log('3. Deploy contracts using the scripts in contracts/deploy/');
    console.log('4. Update contract addresses in the configuration files');
    console.log('5. Test the integration with your Cloudflare Worker');
    
    console.log('\n🔗 Useful Resources:');
    console.log('• Thirdweb Dashboard: https://thirdweb.com/dashboard');
    console.log('• Sonic Testnet Explorer: https://testnet.soniclabs.com');
    console.log('• ServiceFlow AI Docs: https://docs.srvcflo.com');
    
    return true;
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    return false;
  }
}

// Function to test Web3 configuration
async function testWeb3Config() {
  console.log('\n🧪 Testing Web3 configuration...');
  
  try {
    // Check if required files exist
    const requiredFiles = [
      'thirdweb.config.json',
      'lib/web3-config.js',
      'lib/contract-utils.js',
      '.env.template'
    ];
    
    let allFilesExist = true;
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (!fs.existsSync(filePath)) {
        console.log(`❌ Missing file: ${file}`);
        allFilesExist = false;
      } else {
        console.log(`✅ Found: ${file}`);
      }
    }
    
    if (allFilesExist) {
      console.log('\n✅ All configuration files are present');
      console.log('🔧 Ready for Web3 integration!');
    } else {
      console.log('\n⚠️  Some configuration files are missing');
      console.log('Run "node scripts/setup-thirdweb-sonic.js setup" to create them');
    }
    
    return allFilesExist;
  } catch (error) {
    console.error('❌ Configuration test failed:', error.message);
    return false;
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      setupWeb3Integration();
      break;
    case 'test':
      testWeb3Config();
      break;
    case 'help':
    default:
      console.log('ServiceFlow AI Web3 Integration Setup');
      console.log('');
      console.log('Commands:');
      console.log('  setup - Create all Web3 configuration files');
      console.log('  test  - Test Web3 configuration');
      console.log('  help  - Show this help message');
      console.log('');
      console.log('Usage: node scripts/setup-thirdweb-sonic.js [command]');
      break;
  }
}

module.exports = {
  setupWeb3Integration,
  testWeb3Config,
  SONIC_CONFIG,
  THIRDWEB_CONFIG
};