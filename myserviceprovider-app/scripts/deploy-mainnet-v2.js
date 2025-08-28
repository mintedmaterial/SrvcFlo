const { ethers } = require("hardhat");
require("dotenv").config();

// SECURE MAINNET DEPLOYMENT CONFIGURATION - V2 with Correct Credit Packages
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
  console.log("🚀 Starting Sonic Mainnet V2 Deployment with Correct Credit Packages...");
  console.log("💰 Credit System: USDC = ERC-20 Credits | wS = ERC-1155 NFT Credits");
  
  const [deployer] = await ethers.getSigners();
  console.log("📱 Deployer address:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "S");
  
  if (balance < ethers.parseEther("1.0")) {
    throw new Error("❌ Insufficient balance (need at least 1 S)");
  }

  const contracts = {};

  try {
    // 1. Deploy Credits NFT (ERC-1155) - for wS purchases
    console.log("\n🎫 Deploying Credits NFT (for wS purchases)...");
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

    // 3. Deploy Payment Contract V2 (Dual Credit System)
    console.log("\n💰 Deploying Payment Contract V2 (Dual Credit System)...");
    const PaymentV2 = await ethers.getContractFactory("SonicMainnetPaymentV2");
    const payment = await PaymentV2.deploy(
      CONFIG.devWallet,      // owner
      CONFIG.tokens.USDC,    // USDC address
      CONFIG.tokens.wS,      // wS address
      contracts.creditsNFT,  // Credits NFT
      contracts.staking,     // Staking contract
      CONFIG.devWallet       // Dev wallet
    );
    await payment.waitForDeployment();
    contracts.payment = await payment.getAddress();
    console.log("✅ Payment Contract V2:", contracts.payment);

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

    // 5. Verify Credit Packages
    console.log("\n📦 Verifying Credit Packages...");
    for (let i = 1; i <= 4; i++) {
      const pkg = await payment.creditPackages(i);
      console.log(`Package ${i}:`);
      console.log(`  USDC Price: ${ethers.formatUnits(pkg.usdcPrice, 6)} USDC`);
      console.log(`  USDC Credits: ${pkg.usdcCredits} (ERC-20)`);
      console.log(`  wS Credits: ${pkg.wsCredits} (ERC-1155 NFT)`);
      console.log(`  Active: ${pkg.active}`);
    }

    // Display results
    console.log("\n📋 DEPLOYMENT SUMMARY");
    console.log("====================");
    console.log("Credits NFT:    ", contracts.creditsNFT);
    console.log("Staking:        ", contracts.staking);
    console.log("Payment V2:     ", contracts.payment);
    console.log("Dev Wallet:     ", CONFIG.devWallet);
    
    console.log("\n💡 Credit System:");
    console.log("• USDC Purchases → ERC-20 Credits (stored in contract)");
    console.log("• wS Purchases → ERC-1155 NFT Credits (minted with bonus)");
    console.log("• Owner can gift/transfer credits for giveaways");
    
    console.log("\n📦 Credit Packages:");
    console.log("1. Starter:    5 USDC = 750 ERC-20 credits | 1000 NFT credits (25% bonus)");
    console.log("2. Pro:        50 USDC = 8000 ERC-20 credits | 10000 NFT credits (25% bonus)");
    console.log("3. Business:   500 USDC = 100000 ERC-20 credits | 115000 NFT credits (15% bonus)");
    console.log("4. Enterprise: 1250 USDC = 260000 ERC-20 credits | 290000 NFT credits (~11.5% bonus)");
    
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

    console.log("\n✅ SECURE V2 DEPLOYMENT COMPLETED!");
    console.log("🔒 Dual credit system: ERC-20 (USDC) + ERC-1155 (wS with bonus)");
    console.log("🎁 Giveaway functions: Owner can gift/transfer credits");
    console.log("💰 Revenue distribution: 50% dev, 25% staking, 25% other");
    console.log("🛡️ All credits are safely managed and secured");

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