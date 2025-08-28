const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 DEPLOYING SONIC TESTNET PAYMENT CONTRACT");
  console.log("=" .repeat(60));
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "S");

  // Contract addresses
  const BANDIT_KIDZ_STAKING = "0x93d00036b8040005B4AF73b3A404F8bec4fD6B87"; // Existing staking contract
  const DEV_WALLET = deployer.address; // Use deployer as dev wallet for testing
  const CORAL_TOKEN = "0x0000000000000000000000000000000000000000"; // We'll set this later if needed

  console.log("\n📋 DEPLOYMENT CONFIGURATION");
  console.log("-".repeat(40));
  console.log("Bandit Kidz Staking:", BANDIT_KIDZ_STAKING);
  console.log("Dev Wallet:", DEV_WALLET);
  console.log("CORAL Token (if known):", CORAL_TOKEN || "Will be set later");

  console.log("\n💰 SUPPORTED TESTNET TOKENS");
  console.log("-".repeat(40));
  console.log("SSStt (Sonic Speed Test):", "0xc777Fa50186362fe0EF9CCD579b6385cE7CB49f1");
  console.log("wS Token:", "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38");
  console.log("USDC Testnet:", "0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6");
  console.log("CORAL (TBD):", "Will be added via setCoralToken()");

  console.log("\n🔧 DEPLOYING CONTRACT...");
  console.log("-".repeat(40));

  try {
    // Deploy the testnet payment contract
    const TestnetPayment = await ethers.getContractFactory("SonicPaymentTestnet");
    console.log("Deploying SonicPaymentTestnet contract...");
    
    const testnetPayment = await TestnetPayment.deploy(
      BANDIT_KIDZ_STAKING,
      DEV_WALLET,
      CORAL_TOKEN // Zero address for now
    );
    
    await testnetPayment.waitForDeployment();
    const testnetPaymentAddress = await testnetPayment.getAddress();
    
    console.log("✅ SonicPaymentTestnet deployed to:", testnetPaymentAddress);
    console.log("Transaction hash:", testnetPayment.deploymentTransaction().hash);

    // Register with FeeM (Sonic's fee monetization)
    console.log("\n🔗 REGISTERING WITH FEEM...");
    try {
      const registerTx = await testnetPayment.registerMe();
      await registerTx.wait();
      console.log("✅ FeeM registration successful");
    } catch (error) {
      console.log("⚠️  FeeM registration failed (this is optional):", error.message);
    }

    console.log("\n📋 CONTRACT FUNCTIONS AVAILABLE:");
    console.log("-".repeat(40));
    console.log("• payWithSSStt(prompt, generationType) - Cost: 1 SSStt");
    console.log("• payWithCORAL(prompt, generationType) - Cost: 1 CORAL (when set)");
    console.log("• payWithS(prompt, generationType) - Cost: 3 wS");
    console.log("• payWithUSDC(prompt, generationType) - Cost: 1 USDC");
    console.log("• useCredits(prompt, generationType) - Free with credits");

    console.log("\n💸 FUND DISTRIBUTION:");
    console.log("-".repeat(40));
    console.log("• 25% → Bandit Kidz Staking Rewards");
    console.log("• 50% → Dev Wallet");
    console.log("• 15% → Reserved for Weekly Leaderboard Winners");
    console.log("• 10% → Contract Operations");

    console.log("\n🎯 NEXT STEPS:");
    console.log("-".repeat(40));
    console.log("1. Update frontend to use new contract address:");
    console.log(`   PAYMENT_CONTRACT_ADDRESS = "${testnetPaymentAddress}"`);
    console.log("2. If you find CORAL token address, set it via:");
    console.log(`   testnetPayment.setCoralToken("CORAL_ADDRESS")`);
    console.log("3. Test payments with SSStt tokens from your wallet");
    console.log("4. Add payment buttons for SSStt and CORAL in frontend");

    console.log("\n🔗 EXPLORER LINK:");
    console.log(`https://testnet.sonicscan.org/address/${testnetPaymentAddress}`);

    return {
      testnetPaymentAddress
    };

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then((addresses) => {
    console.log("\n🎉 Testnet payment contract deployed successfully!");
    console.log("Update your .env file with the new contract address");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });