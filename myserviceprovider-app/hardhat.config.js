require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.SONIC_PRIVATE_KEY || "your-wallet-private-key-here";

if (PRIVATE_KEY === "your-wallet-private-key-here") {
  console.warn("⚠️  WARNING: Using placeholder private key. Set PRIVATE_KEY in your .env file.");
}

module.exports = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true,
      metadata: {
        bytecodeHash: "none"
      }
    }
  },
  networks: {
    // Local development
    hardhat: {
      chainId: 57054,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 57054,
      accounts: [PRIVATE_KEY]
    },
    
    // Sonic Mainnet
    sonic: {
      url: "https://rpc.soniclabs.com",
      chainId: 146,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
      gas: "auto",
      timeout: 60000,
      confirmations: 2
    },
    
    // Sonic Testnet (Blaze)
    sonicTestnet: {
      url: "https://rpc.blaze.soniclabs.com", 
      chainId: 57054,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
      gas: "auto",
      timeout: 60000,
      confirmations: 1
    },
    
    // Alternative Sonic RPC
    sonic : {
      tenderly: true 
      url: "https://sonic.gateway.tenderly.co/pJrZzy8Ljkx62pj2GgBOK",
      chainId: 146,
      accounts: [PRIVATE_KEY],
      gasPrice: 1000000000, // 1 gwei
      gas: 5000000,
      timeout: 60000,
    }
  },
  
  // Contract verification
  etherscan: {
    apiKey: { 
      sonic: process.env.ETHERSCAN_API_KEY || "sonic-mainnet",
      sonicTestnet: process.env.ETHERSCAN_API_KEY || "sonic-testnet",
      "sonic-testnet": process.env.SONIC_TESTNET_API_KEY || "sonic-testnet-alt"
    },
    customChains: [
      {
        network: "sonic",
        chainId: 146,
        urls: {
          apiURL: "https://api.sonicscan.org/api",
          browserURL: "https://sonicscan.org"
        }
      },
      {
        network: "sonicTestnet", 
        chainId: 57054,
        urls: {
          apiURL: "https://api-testnet.sonicscan.org/api",
          browserURL: "https://testnet.sonicscan.org"
        }
      },
      {
        network: "sonic-testnet",
        chainId: 146,
        urls: {
          apiURL: "https://api.testnet.sonicscan.org/api",
          browserURL: "https://testnet.sonicscan.org",
        }
      }
    ]
  },
  
  // Source verification
  sourcify: {
    enabled: true,
  },
  
  // Gas reporter
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    gasPrice: 1, // Sonic gas price in gwei
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  
  // Contract size
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  
  // Paths
  paths: {
    sources: "./Contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  
  // Mocha configuration for tests
  mocha: {
    timeout: 40000
  },
  
  // Default network
  defaultNetwork: "hardhat",
};
