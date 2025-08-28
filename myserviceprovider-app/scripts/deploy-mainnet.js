const { ethers } = require("hardhat");
require("dotenv").config();

// Contract deployment configuration
const DEPLOYMENT_CONFIG = {
  network: "sonic", // Sonic Mainnet
  deployer: process.env.DEPLOYER_ADDRESS || "", // Your wallet address
  banditKidzNFT: "0x45bc8a938e487fde4f31a7e051c2b63627f6f966", // Verified Bandit Kidz collection
  devWallet: process.env.DEV_WALLET || "", // Your dev wallet for fees
  // Token addresses on Sonic Mainnet
  tokens: {
    USDC: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
    wS: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38",
    SONIC_SFC: "0xFC00FACE00000000000000000000000000000000",
    MULTICALL3: "0xcA11bde05977b3631167028862bE2a173976CA11"
  }
};

async function main() {
  console.log("🚀 Starting ServiceFlow AI Mainnet Deployment...");
  console.log("Network:", DEPLOYMENT_CONFIG.network);
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "S");
  
  if (balance < ethers.parseEther("1.0")) {
    throw new Error("Insufficient balance for deployment (need at least 1 S for gas)");
  }

  // Step 1: Deploy Credits NFT Contract (ERC-1155)
  console.log("\n📜 Step 1: Deploying Credits NFT Contract...");
  const SrvcfloCreditsNFT = await ethers.getContractFactory("SrvcfloCreditsNFT");
  const creditsNFT = await SrvcfloCreditsNFT.deploy(deployer.address);
  await creditsNFT.waitForDeployment();
  const creditsNFTAddress = await creditsNFT.getAddress();
  console.log("✅ Credits NFT deployed at:", creditsNFTAddress);

  // Step 2: Deploy Staking Contract
  console.log("\n🏦 Step 2: Deploying Staking Contract...");
  const SrvcfloStaking = await ethers.getContractFactory("SrvcfloMultiCollectionStaking");
  const stakingContract = await SrvcfloStaking.deploy(
    DEPLOYMENT_CONFIG.banditKidzNFT,
    DEPLOYMENT_CONFIG.devWallet || deployer.address
  );
  await stakingContract.waitForDeployment();
  const stakingAddress = await stakingContract.getAddress();
  console.log("✅ Staking Contract deployed at:", stakingAddress);

  // Step 3: Deploy Payment Contract
  console.log("\n💰 Step 3: Deploying Payment Contract...");
  const SonicPayment = await ethers.getContractFactory("SonicAIGenerationPayment");
  const paymentContract = await SonicPayment.deploy(
    stakingAddress, // banditKidzStaking
    DEPLOYMENT_CONFIG.devWallet || deployer.address, // devWallet
    ethers.ZeroAddress // priceOracle (optional)
  );
  await paymentContract.waitForDeployment();
  const paymentAddress = await paymentContract.getAddress();
  console.log("✅ Payment Contract deployed at:", paymentAddress);

  // Step 4: Register for FeeM (Fee Monetization)
  console.log("\n💎 Step 4: Registering for FeeM...");
  try {
    const registerTx = await paymentContract.registerMe();
    await registerTx.wait();
    console.log("✅ FeeM registration successful!");
  } catch (error) {
    console.warn("⚠️ FeeM registration failed (may already be registered):", error.message);
  }

  // Step 5: Deploy Credit System Contract
  console.log("\n🪙 Step 5: Deploying Credit System Contract...");
  const SonicCreditSystem = await ethers.getContractFactory("SonicCreditSystemWithOracle");
  const creditSystem = await SonicCreditSystem.deploy(
    DEPLOYMENT_CONFIG.tokens.USDC, // USDC token
    DEPLOYMENT_CONFIG.tokens.wS,   // wS token
    ethers.ZeroAddress,            // oracle (optional)
    creditsNFTAddress              // credits NFT contract
  );
  await creditSystem.waitForDeployment();
  const creditSystemAddress = await creditSystem.getAddress();
  console.log("✅ Credit System deployed at:", creditSystemAddress);

  // Step 6: Setup Contract Permissions
  console.log("\n🔐 Step 6: Setting up contract permissions...");
  
  // Grant minting permissions to credit system
  const grantMinterRole = await creditsNFT.transferOwnership(creditSystemAddress);
  await grantMinterRole.wait();
  console.log("✅ Credits NFT ownership transferred to Credit System");

  // Grant distributor role to backend wallet if provided
  if (process.env.BACKEND_WALLET) {
    const DISTRIBUTOR_ROLE = await stakingContract.DISTRIBUTOR_ROLE();
    const grantDistributorTx = await stakingContract.grantRole(DISTRIBUTOR_ROLE, process.env.BACKEND_WALLET);
    await grantDistributorTx.wait();
    console.log("✅ Distributor role granted to backend wallet");
  }

  // Step 7: Verify Contracts (if API key is provided)
  if (process.env.SONIC_API_KEY) {
    console.log("\n🔍 Step 7: Verifying contracts...");
    
    try {
      await hre.run("verify:verify", {
        address: creditsNFTAddress,
        constructorArguments: [deployer.address],
      });
      console.log("✅ Credits NFT verified");
    } catch (error) {
      console.warn("⚠️ Credits NFT verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: stakingAddress,
        constructorArguments: [DEPLOYMENT_CONFIG.banditKidzNFT, DEPLOYMENT_CONFIG.devWallet || deployer.address],
      });
      console.log("✅ Staking Contract verified");
    } catch (error) {
      console.warn("⚠️ Staking Contract verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: paymentAddress,
        constructorArguments: [stakingAddress, DEPLOYMENT_CONFIG.devWallet || deployer.address, ethers.ZeroAddress],
      });
      console.log("✅ Payment Contract verified");
    } catch (error) {
      console.warn("⚠️ Payment Contract verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: creditSystemAddress,
        constructorArguments: [DEPLOYMENT_CONFIG.tokens.USDC, DEPLOYMENT_CONFIG.tokens.wS, ethers.ZeroAddress, creditsNFTAddress],
      });
      console.log("✅ Credit System verified");
    } catch (error) {
      console.warn("⚠️ Credit System verification failed:", error.message);
    }
  }

  // Step 8: Generate deployment summary
  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("=====================");
  console.log("Network: Sonic Mainnet (Chain ID: 146)");
  console.log("Deployer:", deployer.address);
  console.log("");
  console.log("📜 Contract Addresses:");
  console.log("Credits NFT (ERC-1155):", creditsNFTAddress);
  console.log("Staking Contract:      ", stakingAddress);
  console.log("Payment Contract:      ", paymentAddress);
  console.log("Credit System:         ", creditSystemAddress);
  console.log("");
  console.log("🔗 Token Addresses:");
  console.log("USDC:", DEPLOYMENT_CONFIG.tokens.USDC);
  console.log("wS:  ", DEPLOYMENT_CONFIG.tokens.wS);
  console.log("SFC: ", DEPLOYMENT_CONFIG.tokens.SONIC_SFC);
  console.log("");
  console.log("🎯 NFT Collection:");
  console.log("Bandit Kidz:", DEPLOYMENT_CONFIG.banditKidzNFT);
  console.log("");
  
  // Generate environment variables
  console.log("🔧 Environment Variables for .env.local:");
  console.log("========================================");
  console.log(`NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT=${paymentAddress}`);
  console.log(`NEXT_PUBLIC_SONIC_CREDIT_CONTRACT=${creditSystemAddress}`);
  console.log(`NEXT_PUBLIC_SONIC_CREDITS_NFT_CONTRACT=${creditsNFTAddress}`);
  console.log(`NEXT_PUBLIC_SONIC_STAKING_CONTRACT=${stakingAddress}`);
  console.log(`NEXT_PUBLIC_SONIC_MAINNET_USDC=${DEPLOYMENT_CONFIG.tokens.USDC}`);
  console.log(`NEXT_PUBLIC_SONIC_MAINNET_WS=${DEPLOYMENT_CONFIG.tokens.wS}`);
  console.log("");

  // Generate network config update
  console.log("📝 Update lib/network-config.ts with these addresses:");
  console.log("===================================================");
  console.log("mainnet: {");
  console.log(`  USDC: "${DEPLOYMENT_CONFIG.tokens.USDC}" as Address,`);
  console.log(`  WS_TOKEN: "${DEPLOYMENT_CONFIG.tokens.wS}" as Address,`);
  console.log(`  S_TOKEN: "${DEPLOYMENT_CONFIG.tokens.wS}" as Address,`);
  console.log(`  SONIC_SFC: "${DEPLOYMENT_CONFIG.tokens.SONIC_SFC}" as Address,`);
  console.log(`  MULTICALL3: "${DEPLOYMENT_CONFIG.tokens.MULTICALL3}" as Address,`);
  console.log(`  PAYMENT: "${paymentAddress}" as Address,`);
  console.log(`  CREDITS_ERC1155: "${creditsNFTAddress}" as Address,`);
  console.log(`  STAKING_CONTRACT: "${stakingAddress}" as Address,`);
  console.log("  CREDIT_TOKEN_ID: 1n,");
  console.log('  explorerBase: "https://sonicscan.org",');
  console.log("},");

  console.log("\n✅ Deployment completed successfully!");
  console.log("🔗 View contracts on SonicScan:");
  console.log(`   Credits NFT: https://sonicscan.org/address/${creditsNFTAddress}`);
  console.log(`   Staking:     https://sonicscan.org/address/${stakingAddress}`);
  console.log(`   Payment:     https://sonicscan.org/address/${paymentAddress}`);
  console.log(`   Credit Sys:  https://sonicscan.org/address/${creditSystemAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });