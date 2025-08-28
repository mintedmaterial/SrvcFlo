// scripts/verify-mainnet-contracts.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Starting Sonic Mainnet contract verification...");
  console.log("=".repeat(60));

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments/sonic-mainnet.json");
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment file not found!");
    console.error("Please run the deployment script first.");
    console.error("Expected file:", deploymentPath);
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("📋 Loaded deployment info from:", deploymentPath);
  console.log("Deployment Date:", deploymentInfo.deploymentDate);
  console.log("Deployer:", deploymentInfo.deployer);

  // Verify we're on the correct network
  const network = await hre.ethers.provider.getNetwork();
  if (network.chainId !== 146) {
    console.error("❌ This script is intended for Sonic Mainnet (Chain ID: 146)");
    console.error("Current Chain ID:", network.chainId);
    process.exit(1);
  }

  const contracts = deploymentInfo.contracts;
  let verifiedCount = 0;
  let failedCount = 0;

  console.log("\n" + "=".repeat(60));
  console.log("🔍 VERIFYING CONTRACTS ON SONIC EXPLORER");
  console.log("=".repeat(60));

  try {
    // 1. Verify BanditKidz NFT Contract
    console.log("\n📄 Verifying BanditKidz NFT Contract...");
    console.log("Address:", contracts.banditKidzNFT.address);
    try {
      await hre.run("verify:verify", {
        address: contracts.banditKidzNFT.address,
        constructorArguments: []
      });
      console.log("✅ BanditKidz NFT verified successfully");
      verifiedCount++;
    } catch (error) {
      console.log("❌ BanditKidz NFT verification failed:", error.message);
      failedCount++;
    }

    // 2. Verify Staking Contract
    console.log("\n🔒 Verifying BanditKidz Staking Contract...");
    console.log("Address:", contracts.stakingContract.address);
    console.log("Constructor args: [", contracts.banditKidzNFT.address, "]");
    try {
      await hre.run("verify:verify", {
        address: contracts.stakingContract.address,
        constructorArguments: [
          contracts.banditKidzNFT.address
        ]
      });
      console.log("✅ Staking Contract verified successfully");
      verifiedCount++;
    } catch (error) {
      console.log("❌ Staking Contract verification failed:", error.message);
      failedCount++;
    }

    // 3. Verify Payment Contract
    console.log("\n💰 Verifying Sonic Payment Contract...");
    console.log("Address:", contracts.paymentContract.address);
    console.log("Constructor args: [", contracts.stakingContract.address, ",", deploymentInfo.deployer, "]");
    try {
      await hre.run("verify:verify", {
        address: contracts.paymentContract.address,
        constructorArguments: [
          contracts.stakingContract.address,
          deploymentInfo.deployer
        ]
      });
      console.log("✅ Payment Contract verified successfully");
      verifiedCount++;
    } catch (error) {
      console.log("❌ Payment Contract verification failed:", error.message);
      failedCount++;
    }

    // 4. Verify Voting Contract
    console.log("\n🗳️  Verifying Generation Voting Contract...");
    console.log("Address:", contracts.votingContract.address);
    console.log("Constructor args: [", contracts.stakingContract.address, ",", contracts.banditKidzNFT.address, "]");
    try {
      await hre.run("verify:verify", {
        address: contracts.votingContract.address,
        constructorArguments: [
          contracts.stakingContract.address,
          contracts.banditKidzNFT.address
        ]
      });
      console.log("✅ Voting Contract verified successfully");
      verifiedCount++;
    } catch (error) {
      console.log("❌ Voting Contract verification failed:", error.message);
      failedCount++;
    }

  } catch (error) {
    console.error("\n❌ VERIFICATION PROCESS FAILED");
    console.error("Error:", error.message);
    process.exit(1);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 VERIFICATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successfully verified: ${verifiedCount} contracts`);
  console.log(`❌ Failed to verify: ${failedCount} contracts`);
  console.log(`📋 Total contracts: ${verifiedCount + failedCount}`);

  if (failedCount > 0) {
    console.log("\n⚠️  Some contracts failed to verify. This might be due to:");
    console.log("   - Already verified contracts");
    console.log("   - Network delays");
    console.log("   - Constructor argument mismatches");
    console.log("   - Sonic Explorer API issues");
    console.log("\n🔗 You can manually verify failed contracts on Sonic Explorer:");
    console.log("   https://sonicscan.org/");
  }

  console.log("\n🔗 Contract Explorer Links:");
  console.log("============================");
  console.log(`BanditKidz NFT: https://sonicscan.org/address/${contracts.banditKidzNFT.address}`);
  console.log(`Staking Contract: https://sonicscan.org/address/${contracts.stakingContract.address}`);
  console.log(`Payment Contract: https://sonicscan.org/address/${contracts.paymentContract.address}`);
  console.log(`Voting Contract: https://sonicscan.org/address/${contracts.votingContract.address}`);

  if (verifiedCount === 4) {
    console.log("\n🎉 ALL CONTRACTS VERIFIED SUCCESSFULLY!");
  }

  console.log("\n✅ Verification process completed!");
}

// Export for programmatic use
module.exports = { main };

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}