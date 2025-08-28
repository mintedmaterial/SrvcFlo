const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying SonicPaymentTestnetWithNFT Contract...");
  console.log("This version uses FIXED PRICING (no oracle calls)");
  console.log("=".repeat(60));

  // Configuration for deployment
  const DEPLOYMENT_CONFIG = {
    // Wallet addresses
    devWallet: "0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8",
    
    // Set these if you have them, leave empty strings if not
    banditKidzStaking: "", // BanditKidz/SrvcfloStaking contract address
    coralToken: "",        // CORAL token address (optional)
    nftContract: "",       // GeneratedArtNFT contract address (optional)
    
    // Network info
    chainId: 57054,       // Sonic testnet
    rpcUrl: "https://rpc.soniclabs.com"
  };

  console.log("Deployment Configuration:");
  console.log("- Dev Wallet:", DEPLOYMENT_CONFIG.devWallet);
  console.log("- BanditKidz Staking:", DEPLOYMENT_CONFIG.banditKidzStaking || "Will be set later");
  console.log("- CORAL Token:", DEPLOYMENT_CONFIG.coralToken || "Not set (optional)");
  console.log("- NFT Contract:", DEPLOYMENT_CONFIG.nftContract || "Will be set later");
  console.log("");

  // Get deployer info
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
  console.log("");

  // Deploy the contract
  const SonicPaymentWithNFT = await ethers.getContractFactory("SonicPaymentTestnetWithNFT");
  
  console.log("Deploying contract...");
  const sonicPayment = await SonicPaymentWithNFT.deploy(
    DEPLOYMENT_CONFIG.banditKidzStaking,  // Can be empty string, set later
    DEPLOYMENT_CONFIG.devWallet,
    DEPLOYMENT_CONFIG.coralToken,         // Can be empty string if not available
    DEPLOYMENT_CONFIG.nftContract         // Can be empty string, set later
  );

  console.log("Waiting for deployment confirmation...");
  await sonicPayment.deployed();

  console.log("");
  console.log("✅ DEPLOYMENT SUCCESSFUL\!");
  console.log("=".repeat(60));
  console.log("Contract Address:", sonicPayment.address);
  console.log("Transaction Hash:", sonicPayment.deployTransaction.hash);
  console.log("");

  // Verify contract configuration
  console.log("📋 CONTRACT CONFIGURATION:");
  console.log("=".repeat(40));
  
  try {
    const devWallet = await sonicPayment.devWallet();
    const banditKidzStaking = await sonicPayment.banditKidzStaking();
    const owner = await sonicPayment.owner();
    
    console.log("- Owner:", owner);
    console.log("- Dev Wallet:", devWallet);
    console.log("- BanditKidz Staking:", banditKidzStaking);
    
    // Get pricing info
    const costs = await sonicPayment.getPaymentCosts();
    console.log("");
    console.log("💰 FIXED PRICING (No Oracle Calls):");
    console.log("- SSStt Cost:", ethers.utils.formatEther(costs.sssttCost), "SSStt");
    console.log("- CORAL Cost:", ethers.utils.formatEther(costs.coralCost), "CORAL");
    console.log("- S Token Cost:", ethers.utils.formatEther(costs.sCost), "S");
    console.log("- USDC Cost:", ethers.utils.formatUnits(costs.usdcCost, 6), "USDC");
    console.log("");
    console.log("🎨 NFT MINTING ADDITIONAL COSTS:");
    console.log("- SSStt NFT Cost:", ethers.utils.formatEther(costs.nftSssttCost), "SSStt");
    console.log("- CORAL NFT Cost:", ethers.utils.formatEther(costs.nftCoralCost), "CORAL");
    console.log("- S Token NFT Cost:", ethers.utils.formatEther(costs.nftSCost), "S");
    console.log("- USDC NFT Cost:", ethers.utils.formatUnits(costs.nftUsdcCost, 6), "USDC");
    
  } catch (error) {
    console.log("Note: Some contract calls failed, but deployment was successful");
    console.log("Error:", error.message);
  }

  console.log("");
  console.log("🔧 NEXT STEPS:");
  console.log("=".repeat(40));
  console.log("1. Update your .env file with:");
  console.log(`   NEXT_PUBLIC_SONIC_PAYMENT_TESTNET_CONTRACT=${sonicPayment.address}`);
  console.log("");
  console.log("2. If you have a BanditKidz/SrvcfloStaking contract, set it:");
  console.log(`   await contract.setAddresses("STAKING_ADDRESS", "${DEPLOYMENT_CONFIG.devWallet}")`);
  console.log("");
  console.log("3. If you have a CORAL token, set it:");
  console.log(`   await contract.setCoralToken("CORAL_TOKEN_ADDRESS")`);
  console.log("");
  console.log("4. If you have an NFT contract, set it:");
  console.log(`   await contract.setNFTContract("NFT_CONTRACT_ADDRESS")`);
  console.log("");
  console.log("5. Test with the Sonic testnet at:");
  console.log("   - RPC: https://rpc.soniclabs.com");
  console.log("   - Chain ID: 57054");
  console.log("   - Faucet: Get testnet tokens from Sonic faucet");
  console.log("");
  console.log("✨ This contract version eliminates 'Simulation Not Supported' errors\!");
  console.log("   It uses fixed pricing instead of oracle calls.");

  return {
    address: sonicPayment.address,
    txHash: sonicPayment.deployTransaction.hash,
    config: DEPLOYMENT_CONFIG
  };
}

// Run if called directly
if (require.main === module) {
  main()
    .then((result) => {
      console.log("");
      console.log("🎉 Deployment completed successfully\!");
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
EOF < /dev/null
