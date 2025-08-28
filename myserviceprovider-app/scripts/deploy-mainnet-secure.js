const { ethers } = require("hardhat");
require("dotenv").config();

// SECURE MAINNET DEPLOYMENT CONFIGURATION
const CONFIG = {
  // Dev wallet is the same as deployer wallet
  devWallet: "0x0f4CBe532E34E4Dfcb648Adf145010b38ed5E8e8", 
  
  // Bandit Kidz NFT collection
  banditKidzNFT: "0x45bc8a938e487fde4f31a7e051c2b63627f6f966",
  
  // Sonic Mainnet token addresses
  tokens: {
    USDC: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
    wS: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38"
  }
};

async function main() {
  console.log("🚀 Starting Secure Sonic Mainnet Deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📱 Deployer address:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "S");
  
  if (balance < ethers.parseEther("1.0")) {
    throw new Error("❌ Insufficient balance (need at least 1 S)");
  }

  const contracts = {};

  try {
    // 1. Deploy Credits NFT (ERC-1155)
    console.log("\n🎫 Deploying Credits NFT...");
    const CreditsNFT = await ethers.getContractFactory("SrvcfloCreditsNFTMainnet");
    const creditsNFT = await CreditsNFT.deploy(CONFIG.devWallet);
    await creditsNFT.waitForDeployment();
    contracts.creditsNFT = await creditsNFT.getAddress();
    console.log("✅ Credits NFT:", contracts.creditsNFT);

    // 2. Deploy Staking Contract
    console.log("\n🏦 Deploying Staking Contract...");
    const Staking = await ethers.getContractFactory("SrvcfloMultiCollectionStaking");
    const staking = await Staking.deploy(CONFIG.banditKidzNFT, CONFIG.devWallet);
    await staking.waitForDeployment();
    contracts.staking = await staking.getAddress();
    console.log("✅ Staking Contract:", contracts.staking);

    // 3. Deploy Payment Contract
    console.log("\n💰 Deploying Payment Contract...");
    const Payment = await ethers.getContractFactory("SonicMainnetPayment");
    const payment = await Payment.deploy(
      CONFIG.devWallet,      // owner
      CONFIG.tokens.USDC,    // USDC address
      CONFIG.tokens.wS,      // wS address
      contracts.creditsNFT,  // Credits NFT
      contracts.staking,     // Staking contract
      CONFIG.devWallet       // Dev wallet
    );
    await payment.waitForDeployment();
    contracts.payment = await payment.getAddress();
    console.log("✅ Payment Contract:", contracts.payment);

    // 4. Setup Permissions - CRITICAL FOR CREDIT SECURITY
    console.log("\n🔐 Setting up permissions...");
    
    // Transfer Credits NFT ownership to Payment contract for minting
    console.log("🔄 Transferring Credits NFT ownership to Payment contract...");
    const transferTx = await creditsNFT.transferOwnership(contracts.payment);
    await transferTx.wait();
    console.log("✅ Credits NFT ownership transferred");

    // Verify ownership
    const newOwner = await creditsNFT.owner();
    console.log("🔍 New Credits NFT owner:", newOwner);
    console.log("✅ Ownership verified:", newOwner === contracts.payment);

    // Display results
    console.log("\n📋 DEPLOYMENT SUMMARY");
    console.log("====================");
    console.log("Credits NFT:    ", contracts.creditsNFT);
    console.log("Staking:        ", contracts.staking);
    console.log("Payment:        ", contracts.payment);
    console.log("Dev Wallet:     ", CONFIG.devWallet);
    
    console.log("\n🔧 Environment Variables:");
    console.log(`NEXT_PUBLIC_SONIC_CREDITS_NFT_CONTRACT_MAINNET=${contracts.creditsNFT}`);
    console.log(`NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_MAINNET=${contracts.payment}`);
    console.log(`NEXT_PUBLIC_SONIC_STAKING_CONTRACT_MAINNET=${contracts.staking}`);
    
    console.log("\n📝 Network Config Update:");
    console.log("mainnet: {");
    console.log(`  CREDITS_ERC1155: "${contracts.creditsNFT}" as Address,`);
    console.log(`  PAYMENT: "${contracts.payment}" as Address,`);
    console.log(`  STAKING_CONTRACT: "${contracts.staking}" as Address,`);
    console.log(`  USDC: "${CONFIG.tokens.USDC}" as Address,`);
    console.log(`  WS_TOKEN: "${CONFIG.tokens.wS}" as Address,`);
    console.log(`  S_TOKEN: "${CONFIG.tokens.wS}" as Address,`);
    console.log("  CREDIT_TOKEN_ID: 1n,");
    console.log("  explorerBase: \"https://sonicscan.org\",");
    console.log("},");

    console.log("\n✅ SECURE DEPLOYMENT COMPLETED!");
    console.log("🔒 Credits are safely managed by Payment contract");
    console.log("💰 Revenue will be distributed to dev wallet and staking");

  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });