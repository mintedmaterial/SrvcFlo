// scripts/deploy-mainnet-contracts.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Sonic Mainnet contract deployment...");
  
  // Get the ContractFactory and Signers here
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Verify we're on Sonic Mainnet
  const network = await hre.ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);
  
  if (network.chainId !== 146) {
    console.error("❌ This script is intended for Sonic Mainnet (Chain ID: 146)");
    console.error("Current Chain ID:", network.chainId);
    process.exit(1);
  }

  const deployedContracts = {};

  try {
    // 1. Deploy TestNFT Contract (BanditKidz NFT for staking)
    console.log("\n📄 Deploying BanditKidz NFT Contract...");
    const TestNFT = await hre.ethers.getContractFactory("TestBanditKidzNFT");
    const testNFT = await TestNFT.deploy();
    await testNFT.deployed();
    console.log("✅ BanditKidz NFT deployed to:", testNFT.address);
    deployedContracts.banditKidzNFT = testNFT.address;

    // 2. Deploy Staking Contract
    console.log("\n🔒 Deploying BanditKidz Staking Contract...");
    const BanditKidzStaking = await hre.ethers.getContractFactory("BanditKidzStaking");
    const stakingContract = await BanditKidzStaking.deploy(testNFT.address);
    await stakingContract.deployed();
    console.log("✅ BanditKidz Staking deployed to:", stakingContract.address);
    deployedContracts.stakingContract = stakingContract.address;

    // 3. Deploy Payment Contract
    console.log("\n💰 Deploying Sonic Payment Contract...");
    const SonicPayment = await hre.ethers.getContractFactory("SonicAIGenerationPayment");
    
    // Deploy with constructor parameters: banditKidzStaking, devWallet
    const paymentContract = await SonicPayment.deploy(
      stakingContract.address, // banditKidzStaking
      deployer.address         // devWallet
    );
    await paymentContract.deployed();
    console.log("✅ Sonic Payment Contract deployed to:", paymentContract.address);
    deployedContracts.paymentContract = paymentContract.address;

    // 4. Deploy Voting Contract
    console.log("\n🗳️  Deploying Generation Voting Contract...");
    const VotingContract = await hre.ethers.getContractFactory("GenerationVotingAndLeaderboard");
    const votingContract = await VotingContract.deploy(
      stakingContract.address,
      testNFT.address
    );
    await votingContract.deployed();
    console.log("✅ Voting Contract deployed to:", votingContract.address);
    deployedContracts.votingContract = votingContract.address;

    // 5. Set up contract permissions and configurations
    console.log("\n⚙️  Setting up contract configurations...");
    
    // Register for FeeM rewards on mainnet
    try {
      await paymentContract.registerMe();
      console.log("✅ Payment contract registered for FeeM rewards");
    } catch (error) {
      console.log("⚠️  FeeM registration failed (this is optional):", error.message);
    }
    
    console.log("✅ Contract configurations completed");

    // 6. Save deployment information
    const deploymentInfo = {
      network: "sonic-mainnet",
      chainId: 146,
      deployer: deployer.address,
      deploymentDate: new Date().toISOString(),
      contracts: {
        banditKidzNFT: testNFT.address,
        stakingContract: stakingContract.address,
        paymentContract: paymentContract.address,
        votingContract: votingContract.address,
      },
      tokens: {
        S_TOKEN: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38", // wS token
        USDC: "0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6", // USDC on Sonic
      },
      configuration: {
        devWallet: deployer.address,
        leaderboardWallet: deployer.address,
        stakingNFT: testNFT.address,
      }
    };

    // Save to file
    const deploymentPath = path.join(__dirname, "../deployments/sonic-mainnet.json");
    fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n📋 Deployment Summary:");
    console.log("======================");
    console.log("Network: Sonic Mainnet (Chain ID: 146)");
    console.log("Deployer:", deployer.address);
    console.log("BanditKidz NFT:", testNFT.address);
    console.log("Staking Contract:", stakingContract.address);
    console.log("Payment Contract:", paymentContract.address);
    console.log("Voting Contract:", votingContract.address);
    
    console.log("\n🌍 Environment Variables for .env:");
    console.log("===================================");
    console.log(`NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_MAINNET=${paymentContract.address}`);
    console.log(`NEXT_PUBLIC_BANDIT_KIDZ_STAKING_CONTRACT_MAINNET=${stakingContract.address}`);
    console.log(`NEXT_PUBLIC_VOTING_CONTRACT_MAINNET=${votingContract.address}`);
    console.log(`NEXT_PUBLIC_BANDIT_KIDZ_NFT_MAINNET=${testNFT.address}`);
    
    console.log("\n📝 Deployment info saved to:", deploymentPath);
    console.log("✅ Mainnet deployment completed successfully!");

    // Optional: Verify contracts on block explorer
    console.log("\n🔍 To verify contracts on Sonic Explorer, run:");
    console.log(`npx hardhat verify --network sonic-mainnet ${testNFT.address}`);
    console.log(`npx hardhat verify --network sonic-mainnet ${stakingContract.address} "${testNFT.address}"`);
    console.log(`npx hardhat verify --network sonic-mainnet ${paymentContract.address} "${stakingContract.address}" "${deployer.address}"`);
    console.log(`npx hardhat verify --network sonic-mainnet ${votingContract.address} "${stakingContract.address}" "${testNFT.address}"`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });