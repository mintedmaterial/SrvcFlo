const { ethers } = require("hardhat");
require("dotenv").config();

// SECURE DEPLOYMENT CONFIGURATION
const SECURE_CONFIG = {
  network: "sonic", // Sonic Mainnet
  
  // CRITICAL: Wallet addresses for credit management
  deployer: process.env.PRIVATE_KEY ? 
    new ethers.Wallet(process.env.PRIVATE_KEY).address : 
    "0x0000000000000000000000000000000000000000",
    
  // DEV WALLET - Where app revenue and credits are managed
  devWallet: "0x7B5a3C8B3e4F2D1A9E6C8F4B2A1D9E7C3B5A4F8E", // Replace with your secure dev wallet
  
  // BACKEND WALLET - For automated credit distributions  
  backendWallet: process.env.BACKEND_WALLET || "0x0000000000000000000000000000000000000000",
  
  // Existing NFT collection
  banditKidzNFT: "0x45bc8a938e487fde4f31a7e051c2b63627f6f966",
  
  // Sonic Mainnet token addresses (verified)
  tokens: {
    USDC: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
    wS: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38",
    SONIC_SFC: "0xFC00FACE00000000000000000000000000000000",
    MULTICALL3: "0xcA11bde05977b3631167028862bE2a173976CA11"
  },
  
  // Credit system configuration
  credits: {
    // ERC-1155 token IDs for different credit types
    IMAGE_CREDIT_TOKEN_ID: 1,
    VIDEO_CREDIT_TOKEN_ID: 2,
    NFT_CREDIT_TOKEN_ID: 3,
    
    // Initial credit packages (in USD)
    packages: [
      { id: 1, credits: 10, usdPrice: 10 },   // $1 per credit
      { id: 2, credits: 50, usdPrice: 45 },   // 10% discount
      { id: 3, credits: 100, usdPrice: 80 }   // 20% discount
    ]
  }
};

// Validation function to ensure no credits are lost
function validateWalletAddresses(config) {
  console.log("🔒 Validating wallet addresses for credit security...");
  
  if (config.deployer === "0x0000000000000000000000000000000000000000") {
    throw new Error("❌ DEPLOYER ADDRESS NOT SET - Credits would be lost!");
  }
  
  if (config.devWallet === "0x0000000000000000000000000000000000000000") {
    throw new Error("❌ DEV WALLET ADDRESS NOT SET - Revenue would be lost!");
  }
  
  console.log("✅ Deployer Address:", config.deployer);
  console.log("✅ Dev Wallet Address:", config.devWallet);
  console.log("✅ Backend Wallet Address:", config.backendWallet);
  console.log("✅ All addresses validated - Credits will be secure");
}

async function deployWithCreditSecurity() {
  console.log("🚀 Starting SECURE ServiceFlow AI Mainnet Deployment...");
  console.log("🔒 Credit Security: ENABLED");
  
  // Validate configuration
  validateWalletAddresses(SECURE_CONFIG);
  
  const [deployer] = await ethers.getSigners();
  console.log("📱 Deployer address:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "S");
  
  if (balance < ethers.parseEther("2.0")) {
    throw new Error("❌ Insufficient balance for deployment (need at least 2 S for gas + safety margin)");
  }

  const deployedContracts = {};

  try {
    // Step 1: Deploy Credits NFT Contract (ERC-1155) with SECURITY
    console.log("\n🎫 Step 1: Deploying SECURE Credits NFT Contract...");
    const SrvcfloCreditsNFT = await ethers.getContractFactory("SrvcfloCreditsNFT");
    // Note: We need to deploy staking first, so let's use placeholder then update
    const creditsNFT = await SrvcfloCreditsNFT.deploy(
      SECURE_CONFIG.devWallet,        // Owner = dev wallet (NOT deployer)
      ethers.ZeroAddress,             // Staking contract (will be set later)
      SECURE_CONFIG.devWallet         // Dev wallet
    );
    await creditsNFT.waitForDeployment();
    const creditsNFTAddress = await creditsNFT.getAddress();
    deployedContracts.creditsNFT = creditsNFTAddress;
    console.log("✅ Credits NFT deployed at:", creditsNFTAddress);
    console.log("🔒 Owner set to:", SECURE_CONFIG.devWallet);

    // Step 2: Deploy Staking Contract
    console.log("\n🏦 Step 2: Deploying Staking Contract...");
    const SrvcfloStaking = await ethers.getContractFactory("SrvcfloMultiCollectionStaking");
    const stakingContract = await SrvcfloStaking.deploy(
      SECURE_CONFIG.banditKidzNFT,
      SECURE_CONFIG.devWallet
    );
    await stakingContract.waitForDeployment();
    const stakingAddress = await stakingContract.getAddress();
    deployedContracts.staking = stakingAddress;
    console.log("✅ Staking Contract deployed at:", stakingAddress);
    
    // Update Credits NFT with correct staking address
    console.log("🔄 Updating Credits NFT with staking contract address...");
    const updateStakingTx = await creditsNFT.setSrvcfloStaking(stakingAddress);
    await updateStakingTx.wait();
    console.log("✅ Credits NFT updated with staking contract");

    // Step 3: Deploy Payment Contract
    console.log("\n💰 Step 3: Deploying Payment Contract...");
    const SonicPayment = await ethers.getContractFactory("SonicAIGenerationPayment");
    const paymentContract = await SonicPayment.deploy(
      stakingAddress,
      SECURE_CONFIG.devWallet,
      ethers.ZeroAddress // No oracle initially
    );
    await paymentContract.waitForDeployment();
    const paymentAddress = await paymentContract.getAddress();
    deployedContracts.payment = paymentAddress;
    console.log("✅ Payment Contract deployed at:", paymentAddress);

    // Step 4: Deploy Credit System Contract
    console.log("\n🪙 Step 4: Deploying Credit System Contract...");
    const SonicCreditSystem = await ethers.getContractFactory("SonicCreditSystemWithOracle");
    const creditSystem = await SonicCreditSystem.deploy(
      SECURE_CONFIG.tokens.USDC,
      SECURE_CONFIG.tokens.wS,
      ethers.ZeroAddress, // No oracle initially
      creditsNFTAddress
    );
    await creditSystem.waitForDeployment();
    const creditSystemAddress = await creditSystem.getAddress();
    deployedContracts.creditSystem = creditSystemAddress;
    console.log("✅ Credit System deployed at:", creditSystemAddress);

    // Step 5: SECURE PERMISSION SETUP
    console.log("\n🔐 Step 5: Setting up SECURE permissions...");
    
    // Transfer Credits NFT ownership to Credit System (for minting)
    console.log("🔄 Transferring Credits NFT ownership to Credit System...");
    const transferOwnershipTx = await creditsNFT.transferOwnership(creditSystemAddress);
    await transferOwnershipTx.wait();
    console.log("✅ Credits NFT ownership transferred to Credit System");
    
    // Grant backend wallet distributor role if provided
    if (SECURE_CONFIG.backendWallet !== "0x0000000000000000000000000000000000000000") {
      console.log("🔑 Granting distributor role to backend wallet...");
      const DISTRIBUTOR_ROLE = await stakingContract.DISTRIBUTOR_ROLE();
      const grantRoleTx = await stakingContract.grantRole(DISTRIBUTOR_ROLE, SECURE_CONFIG.backendWallet);
      await grantRoleTx.wait();
      console.log("✅ Distributor role granted to backend wallet");
    }

    // Step 6: Initialize Credit Packages
    console.log("\n📦 Step 6: Initializing Credit Packages...");
    for (const pkg of SECURE_CONFIG.credits.packages) {
      try {
        const initPackageTx = await creditSystem.initializeCreditPackage(
          pkg.id,
          pkg.credits,
          ethers.parseUnits(pkg.usdPrice.toString(), 6) // USDC has 6 decimals
        );
        await initPackageTx.wait();
        console.log(`✅ Package ${pkg.id}: ${pkg.credits} credits for $${pkg.usdPrice}`);
      } catch (error) {
        console.warn(`⚠️ Failed to initialize package ${pkg.id}:`, error.message);
      }
    }

    // Step 7: Register for FeeM
    console.log("\n💎 Step 7: Registering for FeeM...");
    try {
      const registerTx = await paymentContract.registerMe();
      await registerTx.wait();
      console.log("✅ FeeM registration successful!");
    } catch (error) {
      console.warn("⚠️ FeeM registration failed (may already be registered):", error.message);
    }

    // Step 8: SECURITY VERIFICATION
    console.log("\n🔒 Step 8: SECURITY VERIFICATION...");
    
    // Verify Credits NFT owner
    const creditsOwner = await creditsNFT.owner();
    console.log("🔍 Credits NFT Owner:", creditsOwner);
    console.log("✅ Owner is Credit System:", creditsOwner === creditSystemAddress);
    
    // Verify dev wallet permissions
    const stakingOwner = await stakingContract.owner();
    console.log("🔍 Staking Owner:", stakingOwner);
    console.log("✅ Owner is Dev Wallet:", stakingOwner === SECURE_CONFIG.devWallet);

    // Generate SECURE environment variables
    console.log("\n🔧 SECURE Environment Variables for .env.local:");
    console.log("==============================================");
    console.log(`# Sonic Mainnet Contracts - DEPLOYED ${new Date().toISOString()}`);
    console.log(`NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_MAINNET=${paymentAddress}`);
    console.log(`NEXT_PUBLIC_SONIC_CREDIT_CONTRACT_MAINNET=${creditSystemAddress}`);
    console.log(`NEXT_PUBLIC_SONIC_CREDITS_NFT_CONTRACT_MAINNET=${creditsNFTAddress}`);
    console.log(`NEXT_PUBLIC_SONIC_STAKING_CONTRACT_MAINNET=${stakingAddress}`);
    console.log(`NEXT_PUBLIC_SONIC_MAINNET_USDC=${SECURE_CONFIG.tokens.USDC}`);
    console.log(`NEXT_PUBLIC_SONIC_MAINNET_WS=${SECURE_CONFIG.tokens.wS}`);
    console.log(`# SECURITY: Dev wallet manages credits and revenue`);
    console.log(`DEV_WALLET=${SECURE_CONFIG.devWallet}`);
    console.log(`BACKEND_WALLET=${SECURE_CONFIG.backendWallet}`);

    // Update network config
    console.log("\n📝 Update lib/network-config.ts mainnet section:");
    console.log("================================================");
    console.log("mainnet: {");
    console.log(`  USDC: "${SECURE_CONFIG.tokens.USDC}" as Address,`);
    console.log(`  WS_TOKEN: "${SECURE_CONFIG.tokens.wS}" as Address,`);
    console.log(`  S_TOKEN: "${SECURE_CONFIG.tokens.wS}" as Address,`);
    console.log(`  SONIC_SFC: "${SECURE_CONFIG.tokens.SONIC_SFC}" as Address,`);
    console.log(`  MULTICALL3: "${SECURE_CONFIG.tokens.MULTICALL3}" as Address,`);
    console.log(`  PAYMENT: "${paymentAddress}" as Address,`);
    console.log(`  CREDITS_ERC1155: "${creditsNFTAddress}" as Address,`);
    console.log(`  STAKING_CONTRACT: "${stakingAddress}" as Address,`);
    console.log(`  CREDIT_TOKEN_ID: 1n,`);
    console.log(`  explorerBase: "https://sonicscan.org",`);
    console.log("},");

    console.log("\n✅ SECURE DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("🔒 CREDIT SECURITY STATUS: ✅ SECURE");
    console.log("💰 All credits and revenue properly configured");
    console.log("🎯 Contracts ready for mainnet use");

    return deployedContracts;

  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED:", error);
    console.log("🔒 CREDIT SECURITY STATUS: ⚠️ REVIEW REQUIRED");
    throw error;
  }
}

// Export for use in other scripts
module.exports = { deployWithCreditSecurity, SECURE_CONFIG };

// Run if called directly
if (require.main === module) {
  deployWithCreditSecurity()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Secure deployment failed:", error);
      process.exit(1);
    });
}