// Deploy SrvcfloCreditsNFTWithRoyalties.sol
// Deployment script for ERC-1155 credits contract with 2% royalty system

const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying SrvcfloCreditsNFTWithRoyalties contract...");

  // Get deployment parameters
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // ServiceFlow AI app wallet for receiving royalties (0.5%)
  const APP_WALLET = "0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8"; // Main dev wallet
  
  // Deploy the contract
  const SrvcfloCreditsNFT = await ethers.getContractFactory("SrvcfloCreditsNFTWithRoyalties");
  
  console.log("📝 Constructor parameters:");
  console.log("  Initial Owner:", deployer.address);
  console.log("  App Wallet:", APP_WALLET);
  console.log("  Royalty Setup: 2% total (1.5% creator + 0.5% app)");
  
  const contract = await SrvcfloCreditsNFT.deploy(
    deployer.address, // initialOwner
    APP_WALLET        // _appWallet for royalties
  );

  await contract.deployed();

  console.log("✅ SrvcfloCreditsNFTWithRoyalties deployed to:", contract.address);
  console.log("📋 Deployment Summary:");
  console.log("  Contract:", contract.address);
  console.log("  Owner:", deployer.address);
  console.log("  App Wallet:", APP_WALLET);
  console.log("  Metadata URI:", "https://api.serviceflowai.com/metadata/{id}.json");
  
  // Verify royalty configuration
  const totalRoyalty = await contract.TOTAL_ROYALTY_BASIS_POINTS();
  const creatorRoyalty = await contract.CREATOR_ROYALTY_BASIS_POINTS();
  const appRoyalty = await contract.APP_ROYALTY_BASIS_POINTS();
  
  console.log("🎯 Royalty Configuration:");
  console.log("  Total Royalty:", totalRoyalty.toString(), "basis points (2%)");
  console.log("  Creator Royalty:", creatorRoyalty.toString(), "basis points (1.5%)");
  console.log("  App Royalty:", appRoyalty.toString(), "basis points (0.5%)");
  
  // Test royalty calculation for verification
  const salePrice = ethers.utils.parseEther("100"); // 100 ETH test price
  const [creatorAmount, appAmount, creatorAddr, appAddr] = await contract.calculateRoyaltySplit(1, salePrice);
  
  console.log("💰 Royalty Test (100 ETH sale):");
  console.log("  Creator Amount:", ethers.utils.formatEther(creatorAmount), "ETH (1.5%)");
  console.log("  App Amount:", ethers.utils.formatEther(appAmount), "ETH (0.5%)");
  console.log("  Total Royalty:", ethers.utils.formatEther(creatorAmount.add(appAmount)), "ETH (2%)");

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contract.address,
    deployer: deployer.address,
    appWallet: APP_WALLET,
    totalRoyaltyBasisPoints: totalRoyalty.toString(),
    creatorRoyaltyBasisPoints: creatorRoyalty.toString(),
    appRoyaltyBasisPoints: appRoyalty.toString(),
    metadataURI: "https://api.serviceflowai.com/metadata/{id}.json",
    deployedAt: new Date().toISOString(),
    network: "unknown" // Will be set by deployment environment
  };

  console.log("\n📄 Add this to your network-config.ts:");
  console.log(`CREDITS_ERC1155: "${contract.address}" as Address,`);
  
  console.log("\n🔗 Contract Features:");
  console.log("  ✅ ERC2981 royalty standard support");
  console.log("  ✅ Creator tracking and attribution");
  console.log("  ✅ Generation metadata storage");
  console.log("  ✅ Royalty split calculation helper");
  console.log("  ✅ Emergency functions for owner");
  console.log("  ✅ Pausable for emergency response");

  return {
    contract,
    deploymentInfo
  };
}

// Allow script to be run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;