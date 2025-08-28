// scripts/deploy-and-verify.js
const hre = require("hardhat");
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function main() {
  console.log("🚀 Starting complete Sonic Mainnet deployment and verification...");
  console.log("=".repeat(70));

  try {
    // Step 1: Run pre-deployment checks
    console.log("\n📋 STEP 1: Running pre-deployment checks...");
    console.log("=".repeat(50));
    
    try {
      const { stdout, stderr } = await execAsync('npx hardhat run scripts/pre-deployment-check.js --network sonic');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      if (error.code !== 0) {
        console.error("❌ Pre-deployment checks failed!");
        console.error("Please fix the issues and try again.");
        process.exit(1);
      }
    }

    console.log("✅ Pre-deployment checks passed!");

    // Step 2: Deploy contracts
    console.log("\n🏗️  STEP 2: Deploying contracts...");
    console.log("=".repeat(50));
    
    try {
      const { stdout, stderr } = await execAsync('npx hardhat run scripts/deploy-mainnet-final.js --network sonic');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      console.error("❌ Contract deployment failed!");
      console.error(error.message);
      process.exit(1);
    }

    console.log("✅ Contract deployment completed!");

    // Step 3: Wait for block confirmations
    console.log("\n⏳ STEP 3: Waiting for block confirmations...");
    console.log("=".repeat(50));
    console.log("Waiting 30 seconds for block confirmations before verification...");
    
    await new Promise(resolve => setTimeout(resolve, 30000));
    console.log("✅ Wait completed!");

    // Step 4: Verify contracts
    console.log("\n🔍 STEP 4: Verifying contracts on Sonic Explorer...");
    console.log("=".repeat(50));
    
    try {
      const { stdout, stderr } = await execAsync('npx hardhat run scripts/verify-mainnet-contracts.js --network sonic');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      console.warn("⚠️  Contract verification encountered issues:");
      console.warn(error.message);
      console.warn("You can verify contracts manually later.");
    }

    // Step 5: Final summary
    console.log("\n" + "=".repeat(70));
    console.log("🎉 DEPLOYMENT AND VERIFICATION COMPLETED!");
    console.log("=".repeat(70));

    console.log("\n📋 Next Steps:");
    console.log("1. Update your .env file with the new contract addresses");
    console.log("2. Update frontend configuration to use mainnet addresses");
    console.log("3. Test contract functionality on mainnet");
    console.log("4. Monitor contract activity on SonicScan");

    console.log("\n🔗 Useful Links:");
    console.log("- Sonic Explorer: https://sonicscan.org");
    console.log("- Deployment Info: deployments/sonic-mainnet.json");
    console.log("- Deployment Guide: MAINNET_DEPLOYMENT_GUIDE.md");

    console.log("\n✅ All deployment tasks completed successfully!");

  } catch (error) {
    console.error("\n❌ DEPLOYMENT PROCESS FAILED");
    console.error("=".repeat(50));
    console.error("Error:", error.message);
    
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check wallet balance and network connectivity");
    console.log("2. Verify environment variables are set correctly");
    console.log("3. Review hardhat.config.js network configuration");
    console.log("4. Check deployment logs for specific errors");
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });