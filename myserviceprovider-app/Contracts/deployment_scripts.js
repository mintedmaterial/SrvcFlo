// scripts/deploy-payment-contract.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Sonic Payment Testnet Contract...");

  // Contract addresses on Sonic testnet
  const SRVCFLO_STAKING_ADDRESS = ""; // Will be deployed separately
  const DEV_WALLET = "0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8";
  const CORAL_TOKEN = ""; // Set if CORAL token is available
  const PRICE_ORACLE = ""; // Set if price oracle is available

  // Deploy the contract
  const SonicPayment = await ethers.getContractFactory("SonicPaymentTestnet");
  const sonicPayment = await SonicPayment.deploy(
    SRVCFLO_STAKING_ADDRESS, // Will update after staking contract deployment
    DEV_WALLET,
    CORAL_TOKEN,
    PRICE_ORACLE
  );

  await sonicPayment.deployed();

  console.log("Sonic Payment Contract deployed to:", sonicPayment.address);
  console.log("Transaction hash:", sonicPayment.deployTransaction.hash);

  // Verify deployment
  console.log("\nContract deployment details:");
  console.log("- Contract Address:", sonicPayment.address);
  console.log("- Srvcflo Staking:", SRVCFLO_STAKING_ADDRESS || "To be set later");
  console.log("- Dev Wallet:", DEV_WALLET);
  console.log("- Image Generation USD:", await sonicPayment.IMAGE_GENERATION_USD());
  console.log("- Video Generation USD:", await sonicPayment.VIDEO_GENERATION_USD());

  return sonicPayment.address;
}

// scripts/deploy-staking-contract.js
async function deployStakingContract() {
  console.log("Deploying SrvcfloStaking Contract...");

  // BanditKidz NFT contract address (you'll need to set this)
  const BANDIT_KIDZ_NFT = ""; // Set your BanditKidz NFT contract address
  const PENALTY_WALLET = "0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8"; // Dev wallet for penalties

  const SrvcfloStaking = await ethers.getContractFactory("SrvcfloStaking");
  const stakingContract = await SrvcfloStaking.deploy(
    BANDIT_KIDZ_NFT,
    PENALTY_WALLET
  );

  await stakingContract.deployed();

  console.log("SrvcfloStaking Contract deployed to:", stakingContract.address);
  console.log("Transaction hash:", stakingContract.deployTransaction.hash);

  // Verify deployment
  console.log("\nStaking contract deployment details:");
  console.log("- Contract Address:", stakingContract.address);
  console.log("- Staked NFT:", await stakingContract.stakedNFT());
  console.log("- Penalty Wallet:", await stakingContract.penaltyWallet());
  console.log("- Staking Enabled:", await stakingContract.stakingEnabled());

  return stakingContract.address;
}

// scripts/deploy-all.js
async function deployAll() {
  console.log("Starting complete deployment process...\n");

  try {
    // Deploy staking contract first
    const stakingAddress = await deployStakingContract();
    
    console.log("\n" + "=".repeat(50));
    
    // Deploy payment contract with staking address
    const paymentAddress = await main();

    console.log("\n" + "=".repeat(50));
    console.log("DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(50));
    
    console.log("\nContract Addresses:");
    console.log("- Payment Contract:", paymentAddress);
    console.log("- Staking Contract:", stakingAddress);
    
    console.log("\nNext steps:");
    console.log("1. Update payment contract with staking address:");
    console.log(`   await paymentContract.setAddresses("${stakingAddress}", "${DEV_WALLET}")`);
    console.log("\n2. Update environment variables:");
    console.log(`   NEXT_PUBLIC_SONIC_PAYMENT_TESTNET_CONTRACT=${paymentAddress}`);
    console.log(`   NEXT_PUBLIC_SRVCFLO_STAKING_CONTRACT=${stakingAddress}`);
    console.log("\n3. Verify contracts on Sonic testnet explorer");
    console.log("\n4. Test payment and staking functionality with time-lock features");

    return { paymentAddress, stakingAddress };

  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

// scripts/setup-contracts.js
async function setupContracts(paymentAddress, stakingAddress) {
  console.log("Setting up contract connections...");

  const SonicPayment = await ethers.getContractFactory("SonicPaymentTestnet");
  const paymentContract = SonicPayment.attach(paymentAddress);

  const DEV_WALLET = "0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8";

  // Update payment contract with staking address
  console.log("Updating payment contract with staking address...");
  const updateTx = await paymentContract.setAddresses(stakingAddress, DEV_WALLET);
  await updateTx.wait();
  console.log("Payment contract updated successfully");

  // Verify setup
  const srvcfloStaking = await paymentContract.srvcfloStaking();
  const devWallet = await paymentContract.devWallet();

  console.log("\nContract setup verification:");
  console.log("- Payment contract staking address:", srvcfloStaking);
  console.log("- Payment contract dev wallet:", devWallet);
  console.log("- Setup completed successfully:", srvcfloStaking === stakingAddress);
}

// scripts/verify-contracts.js
async function verifyContracts(paymentAddress, stakingAddress) {
  console.log("Verifying contracts on Sonic explorer...");

  try {
    // Verify payment contract
    await hre.run("verify:verify", {
      address: paymentAddress,
      constructorArguments: [
        stakingAddress,
        "0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8",
        "", // CORAL token address
        ""  // Price oracle address
      ]
    });
    console.log("Payment contract verified successfully");

    // Verify staking contract (you'll need to set the NFT contract address)
    await hre.run("verify:verify", {
      address: stakingAddress,
      constructorArguments: [
        "", // BanditKidz NFT contract address
        "0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8" // Penalty wallet
      ]
    });
    console.log("Staking contract verified successfully");

  } catch (error) {
    console.error("Verification failed:", error);
    console.log("You can manually verify the contracts on Sonic explorer");
  }
}

// Export functions for use
module.exports = {
  main,
  deployStakingContract,
  deployAll,
  setupContracts,
  verifyContracts
};

// Run deployment if called directly
if (require.main === module) {
  deployAll()
    .then(({ paymentAddress, stakingAddress }) => {
      return setupContracts(paymentAddress, stakingAddress);
    })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}