// scripts/pre-deployment-check.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Pre-deployment checks for Sonic Mainnet...");
  console.log("=".repeat(60));

  let allChecksPass = true;

  try {
    // 1. Check Network Configuration
    console.log("\n📡 Checking Network Configuration...");
    const network = await hre.ethers.provider.getNetwork();
    console.log("Current Network:", network.name || "unknown");
    console.log("Chain ID:", network.chainId);
    
    if (network.chainId !== 146) {
      console.error("❌ Wrong network! Expected Sonic Mainnet (Chain ID: 146)");
      console.error("Update hardhat.config.js and use --network sonic");
      allChecksPass = false;
    } else {
      console.log("✅ Connected to Sonic Mainnet");
    }

    // 2. Check Wallet Configuration
    console.log("\n👛 Checking Wallet Configuration...");
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    
    const balance = await deployer.getBalance();
    const balanceEther = hre.ethers.utils.formatEther(balance);
    console.log("Balance:", balanceEther, "S");
    
    if (balance.lt(hre.ethers.utils.parseEther("10"))) {
      console.warn("⚠️  WARNING: Low balance. Recommended minimum: 10 S tokens");
      console.warn("   Deployment may fail due to insufficient gas");
    } else {
      console.log("✅ Sufficient balance for deployment");
    }

    // 3. Check Environment Variables
    console.log("\n🔐 Checking Environment Variables...");
    const requiredEnvVars = [
      'PRIVATE_KEY',
      'THIRDWEB_SECRET_KEY',
      'SONIC_PRIVATE_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar}: Set`);
      } else {
        console.error(`❌ ${envVar}: Missing`);
        allChecksPass = false;
      }
    }

    // 4. Check Contract Compilation
    console.log("\n🔨 Checking Contract Compilation...");
    const contractNames = [
      "TestBanditKidzNFT",
      "BanditKidzStaking", 
      "SonicAIGenerationPayment",
      "GenerationVotingAndLeaderboard"
    ];

    for (const contractName of contractNames) {
      try {
        await hre.ethers.getContractFactory(contractName);
        console.log(`✅ ${contractName}: Compiled successfully`);
      } catch (error) {
        console.error(`❌ ${contractName}: Compilation failed - ${error.message}`);
        allChecksPass = false;
      }
    }

    // 5. Check Hardhat Configuration
    console.log("\n⚙️  Checking Hardhat Configuration...");
    const config = hre.config;
    
    // Check if sonic network is configured
    if (config.networks && config.networks.sonic) {
      console.log("✅ Sonic network configured");
      console.log("   RPC URL:", config.networks.sonic.url);
      console.log("   Chain ID:", config.networks.sonic.chainId);
      
      if (config.networks.sonic.chainId !== 146) {
        console.error("❌ Sonic network chain ID should be 146");
        allChecksPass = false;
      }
    } else {
      console.error("❌ Sonic network not configured in hardhat.config.js");
      allChecksPass = false;
    }

    // Check etherscan configuration for verification
    if (config.etherscan && config.etherscan.customChains) {
      const sonicChain = config.etherscan.customChains.find(chain => chain.chainId === 146);
      if (sonicChain) {
        console.log("✅ Sonic Explorer verification configured");
      } else {
        console.warn("⚠️  Sonic Explorer verification not configured");
        console.warn("   Contract verification may not work");
      }
    }

    // 6. Check Token Addresses
    console.log("\n🪙 Checking Token Configuration...");
    const expectedTokens = {
      "S_TOKEN": "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38",
      "USDC": "0x29219dd400f2Bf60E5a23d13Be72B486D4038894"
    };

    // Read the contract to verify token addresses
    const contractPath = path.join(__dirname, "../Contracts/SonicPayment.sol");
    if (fs.existsSync(contractPath)) {
      const contractContent = fs.readFileSync(contractPath, "utf8");
      
      for (const [tokenName, expectedAddress] of Object.entries(expectedTokens)) {
        if (contractContent.includes(expectedAddress)) {
          console.log(`✅ ${tokenName}: Configured with mainnet address`);
        } else {
          console.error(`❌ ${tokenName}: Wrong address or not found`);
          allChecksPass = false;
        }
      }
    }

    // 7. Check Deployment Directory
    console.log("\n📁 Checking Deployment Directory...");
    const deploymentDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
      console.log("✅ Created deployments directory");
    } else {
      console.log("✅ Deployments directory exists");
    }

    // 8. Network Connectivity Test
    console.log("\n🌐 Testing Network Connectivity...");
    try {
      const blockNumber = await hre.ethers.provider.getBlockNumber();
      console.log("✅ Network connectivity OK");
      console.log("   Latest block:", blockNumber);
    } catch (error) {
      console.error("❌ Network connectivity failed:", error.message);
      allChecksPass = false;
    }

    // 9. Gas Price Check
    console.log("\n⛽ Checking Gas Configuration...");
    try {
      const gasPrice = await hre.ethers.provider.getGasPrice();
      console.log("✅ Gas price:", hre.ethers.utils.formatUnits(gasPrice, "gwei"), "gwei");
    } catch (error) {
      console.warn("⚠️  Could not fetch gas price:", error.message);
    }

    // Final Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 PRE-DEPLOYMENT CHECK SUMMARY");
    console.log("=".repeat(60));

    if (allChecksPass) {
      console.log("🎉 ALL CHECKS PASSED!");
      console.log("✅ Ready for mainnet deployment");
      console.log("\n🚀 To deploy, run:");
      console.log("   npx hardhat run scripts/deploy-mainnet-final.js --network sonic");
    } else {
      console.log("❌ SOME CHECKS FAILED!");
      console.log("⚠️  Please fix the issues above before deploying");
      console.log("\n📋 Common fixes:");
      console.log("   - Update .env file with correct PRIVATE_KEY");
      console.log("   - Ensure sufficient S token balance");
      console.log("   - Compile contracts: npx hardhat compile");
      console.log("   - Check network configuration in hardhat.config.js");
    }

    console.log("\n📋 Estimated Deployment Costs:");
    console.log("   NFT Contract: ~0.1 S");
    console.log("   Staking Contract: ~0.3 S"); 
    console.log("   Payment Contract: ~0.4 S");
    console.log("   Voting Contract: ~0.5 S");
    console.log("   FeeM Registration: ~0.01 S");
    console.log("   Total Estimated: ~1.5 S tokens");

    process.exit(allChecksPass ? 0 : 1);

  } catch (error) {
    console.error("\n❌ PRE-DEPLOYMENT CHECK FAILED");
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => {})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });