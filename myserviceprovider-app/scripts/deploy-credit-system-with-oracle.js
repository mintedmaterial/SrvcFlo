const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying SonicCreditSystemWithOracle Contract...");
  console.log("This version uses DYNAMIC wS PRICING via Beefy Oracle");
  console.log("=".repeat(60));

  // Configuration for deployment
  const DEPLOYMENT_CONFIG = {
    // Wallet addresses
    devWallet: "0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8",
    
    // Set these if you have them, leave empty strings if not
    banditKidzStaking: "0x0000000000000000000000000000000000000000", // BanditKidz/SrvcfloStaking contract address
    nftContract: "0x0000000000000000000000000000000000000000",       // GeneratedArtNFT contract address (optional)
    
    // Oracle configuration
    beefyOracle: "0xBC4a342B0c057501E081484A2d24e576E854F823", // Beefy Oracle on Sonic
    
    // Network info
    chainId: 57054,       // Sonic testnet
    rpcUrl: "https://rpc.blaze.soniclabs.com"
  };

  console.log("Deployment Configuration:");
  console.log("- Dev Wallet:", DEPLOYMENT_CONFIG.devWallet);
  console.log("- BanditKidz Staking:", DEPLOYMENT_CONFIG.banditKidzStaking || "Will be set later");
  console.log("- NFT Contract:", DEPLOYMENT_CONFIG.nftContract || "Will be set later");
  console.log("- Beefy Oracle:", DEPLOYMENT_CONFIG.beefyOracle);
  console.log("");

  // Get deployer info
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  console.log("");

  // Deploy the contract
  const SonicCreditSystemWithOracle = await ethers.getContractFactory("SonicCreditSystemWithOracle");
  
  console.log("Deploying contract...");
  const creditSystem = await SonicCreditSystemWithOracle.deploy(
    DEPLOYMENT_CONFIG.banditKidzStaking,  // Can be empty string, set later
    DEPLOYMENT_CONFIG.devWallet,
    DEPLOYMENT_CONFIG.nftContract         // Can be empty string, set later
  );

  console.log("Waiting for deployment confirmation...");
  await creditSystem.waitForDeployment();
  
  const contractAddress = await creditSystem.getAddress();

  console.log("");
  console.log("✅ DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("Contract Address:", contractAddress);
  console.log("Transaction Hash:", creditSystem.deploymentTransaction().hash);
  console.log("");

  // Verify contract configuration
  console.log("📋 CONTRACT CONFIGURATION:");
  console.log("=".repeat(40));
  
  try {
    const devWallet = await creditSystem.devWallet();
    const srvcfloStaking = await creditSystem.srvcfloStaking();
    const owner = await creditSystem.owner();
    const beefyOracle = await creditSystem.BEEFY_ORACLE();
    
    console.log("- Owner:", owner);
    console.log("- Dev Wallet:", devWallet);
    console.log("- SrvcfloStaking:", srvcfloStaking);
    console.log("- Beefy Oracle:", beefyOracle);
    
    // Check oracle functionality
    console.log("");
    console.log("🔮 ORACLE STATUS:");
    try {
      const oracleInfo = await creditSystem.getOracleInfo();
      console.log("- Oracle Active:", oracleInfo[0]);
      console.log("- wS Token Supported:", oracleInfo[1]);
      if (oracleInfo[1]) {
        console.log("- Current wS Price:", ethers.formatUnits(oracleInfo[2], 6), "USD");
      }
    } catch (error) {
      console.log("- Oracle check failed:", error.message);
    }
    
    // Get credit package info with dynamic pricing
    console.log("");
    console.log("💳 CREDIT PACKAGES (with dynamic wS pricing):");
    for (let i = 1; i <= 4; i++) {
      try {
        const pkg = await creditSystem.getCreditPackage(i);
        console.log(`Package ${i}:`);
        console.log(`  - USDC Price: ${ethers.formatUnits(pkg[0], 6)} USDC`);
        console.log(`  - USD Value for wS: ${ethers.formatUnits(pkg[1], 6)} USD`);
        console.log(`  - USDC Credits: ${pkg[2]}`);
        console.log(`  - wS Credits: ${pkg[3]} (bonus)`);
        console.log(`  - Active: ${pkg[4]}`);
        
        // Try to get current wS amount needed
        try {
          const wsAmount = await creditSystem.getCurrentWSAmountForPackage(i);
          console.log(`  - Current wS Amount: ${ethers.formatEther(wsAmount)} wS`);
        } catch (error) {
          console.log(`  - wS Amount: Oracle unavailable`);
        }
        console.log("");
      } catch (error) {
        console.log(`Package ${i}: Error reading -`, error.message);
      }
    }
    
    // Get NFT minting costs
    console.log("🎨 NFT MINTING ADDITIONAL COSTS:");
    console.log("- SSStt NFT Cost:", ethers.formatEther(await creditSystem.NFT_SSSTT_COST()), "SSStt");
    console.log("- USDC NFT Cost:", ethers.formatUnits(await creditSystem.NFT_USDC_COST(), 6), "USDC");
    console.log("- USD Value for wS NFT:", ethers.formatUnits(await creditSystem.NFT_WS_USD_VALUE(), 6), "USD");
    
    try {
      const wsNftAmount = await creditSystem.getWSTokenAmountForNFT();
      console.log("- Current wS NFT Cost:", ethers.formatEther(wsNftAmount), "wS");
    } catch (error) {
      console.log("- wS NFT Cost: Oracle unavailable");
    }
    
  } catch (error) {
    console.log("Note: Some contract calls failed, but deployment was successful");
    console.log("Error:", error.message);
  }

  console.log("");
  console.log("🔧 NEXT STEPS:");
  console.log("=".repeat(40));
  console.log("1. Update your .env file with:");
  console.log(`   NEXT_PUBLIC_SONIC_CREDIT_CONTRACT=${contractAddress}`);
  console.log("");
  console.log("2. Update network config in lib/network-config.ts:");
  console.log(`   PAYMENT: "${contractAddress}"`);
  console.log("");
  console.log("3. If you have a BanditKidz/SrvcfloStaking contract, set it:");
  console.log(`   await contract.setAddresses("STAKING_ADDRESS", "${DEPLOYMENT_CONFIG.devWallet}", "NFT_ADDRESS")`);
  console.log("");
  console.log("4. Test dynamic pricing on Sonic testnet:");
  console.log("   - RPC: https://rpc.blaze.soniclabs.com");
  console.log("   - Chain ID: 57054");
  console.log("   - Get wS tokens to test dynamic pricing");
  console.log("");
  console.log("5. Credit costs per generation:");
  console.log("   - Basic Image: 15 credits");
  console.log("   - Premium Image: 20 credits");
  console.log("   - OpenAI Image: 50 credits");
  console.log("   - Gemini Video: 400 credits");
  console.log("");
  console.log("✨ This version uses DYNAMIC wS pricing via Beefy Oracle!");
  console.log("   Users pay equivalent USD values but get bonus credits for wS payments.");

  return {
    address: contractAddress,
    txHash: creditSystem.deploymentTransaction().hash,
    config: DEPLOYMENT_CONFIG
  };
}

// Run if called directly
if (require.main === module) {
  main()
    .then((result) => {
      console.log("");
      console.log("🎉 Oracle-integrated Credit System deployment completed!");
      console.log("Contract address to use in your network config:", result.address);
      process.exit(0);
    })
    .catch((error) => {
      console.error("");
      console.error("❌ Deployment failed:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };