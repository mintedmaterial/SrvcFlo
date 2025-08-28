const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Starting deployment to Sonic Blaze Testnet...");
  console.log("Network:", hre.network.name);
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "S");

  // Contract addresses and configuration
  const DEV_WALLET = "0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8";
  
  console.log("\n" + "=".repeat(50));
  console.log("STEP 1: DEPLOYING BANDIT KIDZ STAKING CONTRACT");
  console.log("=".repeat(50));

  // Deploy BanditKidz Staking Contract
  const BanditKidzStaking = await ethers.getContractFactory("BanditKidzStaking");
  console.log("Deploying BanditKidzStaking contract...");
  
  const stakingContract = await BanditKidzStaking.deploy();
  await stakingContract.waitForDeployment();
  const stakingAddress = await stakingContract.getAddress();
  
  console.log("✅ BanditKidzStaking deployed to:", stakingAddress);
  console.log("Transaction hash:", stakingContract.deploymentTransaction().hash);

  // Register for FeeM (Sonic feature)
  try {
    console.log("Registering staking contract for FeeM...");
    const registerTx = await stakingContract.registerMe();
    await registerTx.wait();
    console.log("✅ FeeM registration completed for staking contract");
  } catch (error) {
    console.log("⚠️  FeeM registration failed (this is optional):", error.message);
  }

  console.log("\n" + "=".repeat(50));
  console.log("STEP 2: DEPLOYING SONIC PAYMENT CONTRACT");
  console.log("=".repeat(50));

  // Deploy Sonic Payment Contract
  const SonicPayment = await ethers.getContractFactory("SonicAIGenerationPayment");
  console.log("Deploying SonicPayment contract...");
  
  const paymentContract = await SonicPayment.deploy(
    stakingAddress,
    DEV_WALLET
  );
  await paymentContract.waitForDeployment();
  const paymentAddress = await paymentContract.getAddress();
  
  console.log("✅ SonicPayment deployed to:", paymentAddress);
  console.log("Transaction hash:", paymentContract.deploymentTransaction().hash);

  // Register for FeeM
  try {
    console.log("Registering payment contract for FeeM...");
    const registerTx = await paymentContract.registerMe();
    await registerTx.wait();
    console.log("✅ FeeM registration completed for payment contract");
  } catch (error) {
    console.log("⚠️  FeeM registration failed (this is optional):", error.message);
  }

  console.log("\n" + "=".repeat(50));
  console.log("STEP 3: DEPLOYING VOTING CONTRACT");
  console.log("=".repeat(50));

  // Deploy Voting Contract
  const VotingContract = await ethers.getContractFactory("GenerationVotingAndLeaderboard");
  console.log("Deploying VotingContract...");
  
  const votingContract = await VotingContract.deploy(stakingAddress);
  await votingContract.waitForDeployment();
  const votingAddress = await votingContract.getAddress();
  
  console.log("✅ VotingContract deployed to:", votingAddress);
  console.log("Transaction hash:", votingContract.deploymentTransaction().hash);

  console.log("\n" + "=".repeat(50));
  console.log("DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(50));
  
  console.log("\n📋 CONTRACT ADDRESSES:");
  console.log("├─ BanditKidz Staking:", stakingAddress);
  console.log("├─ Sonic Payment:", paymentAddress);
  console.log("└─ Voting Contract:", votingAddress);
  
  console.log("\n🔗 EXPLORER LINKS:");
  console.log("├─ Staking:", `https://testnet.sonicscan.org/address/${stakingAddress}`);
  console.log("├─ Payment:", `https://testnet.sonicscan.org/address/${paymentAddress}`);
  console.log("└─ Voting:", `https://testnet.sonicscan.org/address/${votingAddress}`);

  console.log("\n⚙️  CONTRACT CONFIGURATION:");
  console.log("├─ S Token (wS):", await paymentContract.S_TOKEN());
  console.log("├─ USDC Token:", await paymentContract.USDC());
  console.log("├─ S Cost:", ethers.formatEther(await paymentContract.S_COST()), "S");
  console.log("├─ USDC Cost:", ethers.formatUnits(await paymentContract.USDC_COST(), 6), "USDC");
  console.log("└─ Dev Wallet:", await paymentContract.devWallet());

  console.log("\n📝 NEXT STEPS:");
  console.log("1. Update your .env file with the deployed addresses:");
  console.log(`   NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT=${paymentAddress}`);
  console.log(`   NEXT_PUBLIC_BANDIT_KIDZ_STAKING_CONTRACT=${stakingAddress}`);
  console.log(`   NEXT_PUBLIC_VOTING_CONTRACT=${votingAddress}`);
  console.log("\n2. Verify contracts on explorer (optional):");
  console.log(`   npx hardhat verify --network sonicTestnet ${stakingAddress}`);
  console.log(`   npx hardhat verify --network sonicTestnet ${paymentAddress} "${stakingAddress}" "${DEV_WALLET}"`);
  console.log(`   npx hardhat verify --network sonicTestnet ${votingAddress} "${stakingAddress}"`);
  console.log("\n3. Test your contracts are working correctly");
  console.log("\n4. Get testnet S tokens from: https://testnet.soniclabs.com/account");

  return {
    stakingAddress,
    paymentAddress,
    votingAddress
  };
}

main()
  .then((addresses) => {
    console.log("\n🎉 All contracts deployed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });