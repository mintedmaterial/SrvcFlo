// scripts/deploy-mainnet-final.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Sonic Mainnet contract deployment...");
  console.log("=".repeat(60));
  
  // Get the ContractFactory and Signers here
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Check balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", hre.ethers.utils.formatEther(balance), "S");
  
  if (balance.lt(hre.ethers.utils.parseEther("10"))) {
    console.warn("⚠️  WARNING: Low balance. Consider adding more S tokens for deployment and FeeM registration.");
  }

  // Verify we're on Sonic Mainnet
  const network = await hre.ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);
  
  if (network.chainId !== 146) {
    console.error("❌ This script is intended for Sonic Mainnet (Chain ID: 146)");
    console.error("Current Chain ID:", network.chainId);
    process.exit(1);
  }

  const deployedContracts = {};
  const deploymentTimestamp = new Date().toISOString();

  try {
    console.log("\n" + "=".repeat(60));
    console.log("📋 DEPLOYMENT CONFIGURATION");
    console.log("=".repeat(60));
    console.log("Deployer Address:", deployer.address);
    console.log("Dev Wallet:", deployer.address);
    console.log("Network: Sonic Mainnet");
    console.log("Chain ID: 146");
    console.log("Timestamp:", deploymentTimestamp);

    // 1. Deploy BanditKidz NFT Contract
    console.log("\n" + "=".repeat(60));
    console.log("📄 STEP 1: Deploying BanditKidz NFT Contract...");
    console.log("=".repeat(60));
    
    const TestNFT = await hre.ethers.getContractFactory("TestBanditKidzNFT");
    console.log("Deploying NFT contract...");
    const banditKidzNFT = await TestNFT.deploy();
    await banditKidzNFT.deployed();
    
    console.log("✅ BanditKidz NFT deployed to:", banditKidzNFT.address);
    console.log("   Transaction hash:", banditKidzNFT.deployTransaction.hash);
    deployedContracts.banditKidzNFT = banditKidzNFT.address;

    // 2. Deploy Staking Contract
    console.log("\n" + "=".repeat(60));
    console.log("🔒 STEP 2: Deploying BanditKidz Staking Contract...");
    console.log("=".repeat(60));
    
    const BanditKidzStaking = await hre.ethers.getContractFactory("BanditKidzStaking");
    console.log("Deploying staking contract with NFT address:", banditKidzNFT.address);
    const stakingContract = await BanditKidzStaking.deploy(banditKidzNFT.address);
    await stakingContract.deployed();
    
    console.log("✅ BanditKidz Staking deployed to:", stakingContract.address);
    console.log("   Transaction hash:", stakingContract.deployTransaction.hash);
    deployedContracts.stakingContract = stakingContract.address;

    // 3. Deploy Payment Contract
    console.log("\n" + "=".repeat(60));
    console.log("💰 STEP 3: Deploying Sonic Payment Contract...");
    console.log("=".repeat(60));
    
    const SonicPayment = await hre.ethers.getContractFactory("SonicAIGenerationPayment");
    console.log("Deploying payment contract...");
    console.log("   Staking Contract:", stakingContract.address);
    console.log("   Dev Wallet:", deployer.address);
    
    const paymentContract = await SonicPayment.deploy(
      stakingContract.address, // banditKidzStaking
      deployer.address         // devWallet
    );
    await paymentContract.deployed();
    
    console.log("✅ Sonic Payment Contract deployed to:", paymentContract.address);
    console.log("   Transaction hash:", paymentContract.deployTransaction.hash);
    deployedContracts.paymentContract = paymentContract.address;

    // 4. Deploy Voting Contract
    console.log("\n" + "=".repeat(60));
    console.log("🗳️  STEP 4: Deploying Generation Voting Contract...");
    console.log("=".repeat(60));
    
    const VotingContract = await hre.ethers.getContractFactory("GenerationVotingAndLeaderboard");
    console.log("Deploying voting contract...");
    console.log("   Staking Contract:", stakingContract.address);
    console.log("   NFT Contract:", banditKidzNFT.address);
    
    const votingContract = await VotingContract.deploy(
      stakingContract.address,
      banditKidzNFT.address
    );
    await votingContract.deployed();
    
    console.log("✅ Voting Contract deployed to:", votingContract.address);
    console.log("   Transaction hash:", votingContract.deployTransaction.hash);
    deployedContracts.votingContract = votingContract.address;

    // 5. Register for FeeM rewards
    console.log("\n" + "=".repeat(60));
    console.log("⚙️  STEP 5: Registering for FeeM Rewards...");
    console.log("=".repeat(60));
    
    try {
      console.log("Registering payment contract for FeeM rewards...");
      const registerTx = await paymentContract.registerMe();
      await registerTx.wait();
      console.log("✅ Payment contract registered for FeeM rewards");
      console.log("   Transaction hash:", registerTx.hash);
    } catch (error) {
      console.log("⚠️  FeeM registration failed (this is optional):", error.message);
    }

    // 6. Verify contract configurations
    console.log("\n" + "=".repeat(60));
    console.log("🔍 STEP 6: Verifying Contract Configurations...");
    console.log("=".repeat(60));

    // Verify payment contract settings
    const sTokenAddress = await paymentContract.S_TOKEN();
    const usdcAddress = await paymentContract.USDC();
    const sCost = await paymentContract.S_COST();
    const usdcCost = await paymentContract.USDC_COST();
    const stakingAddress = await paymentContract.banditKidzStaking();
    const devWallet = await paymentContract.devWallet();

    console.log("Payment Contract Configuration:");
    console.log("   S Token Address:", sTokenAddress);
    console.log("   USDC Address:", usdcAddress);
    console.log("   S Token Cost:", hre.ethers.utils.formatEther(sCost), "S");
    console.log("   USDC Cost:", hre.ethers.utils.formatUnits(usdcCost, 6), "USDC");
    console.log("   Staking Contract:", stakingAddress);
    console.log("   Dev Wallet:", devWallet);

    // Verify staking contract
    const stakingNFTAddress = await stakingContract.banditKidzNFT();
    const totalStaked = await stakingContract.totalStaked();
    const stakingEnabled = await stakingContract.stakingEnabled();

    console.log("\nStaking Contract Configuration:");
    console.log("   NFT Address:", stakingNFTAddress);
    console.log("   Total Staked:", totalStaked.toString());
    console.log("   Staking Enabled:", stakingEnabled);

    // 7. Save deployment information
    console.log("\n" + "=".repeat(60));
    console.log("💾 STEP 7: Saving Deployment Information...");
    console.log("=".repeat(60));

    const deploymentInfo = {
      network: "sonic-mainnet",
      chainId: 146,
      deployer: deployer.address,
      deploymentDate: deploymentTimestamp,
      gasUsed: {
        nft: banditKidzNFT.deployTransaction.gasLimit?.toString() || "N/A",
        staking: stakingContract.deployTransaction.gasLimit?.toString() || "N/A",
        payment: paymentContract.deployTransaction.gasLimit?.toString() || "N/A",
        voting: votingContract.deployTransaction.gasLimit?.toString() || "N/A"
      },
      contracts: {
        banditKidzNFT: {
          address: banditKidzNFT.address,
          txHash: banditKidzNFT.deployTransaction.hash
        },
        stakingContract: {
          address: stakingContract.address,
          txHash: stakingContract.deployTransaction.hash
        },
        paymentContract: {
          address: paymentContract.address,
          txHash: paymentContract.deployTransaction.hash
        },
        votingContract: {
          address: votingContract.address,
          txHash: votingContract.deployTransaction.hash
        }
      },
      tokens: {
        S_TOKEN: sTokenAddress,
        USDC: usdcAddress
      },
      configuration: {
        devWallet: deployer.address,
        stakingEnabled: true,
        paymentCosts: {
          sToken: hre.ethers.utils.formatEther(sCost),
          usdc: hre.ethers.utils.formatUnits(usdcCost, 6)
        }
      }
    };

    // Create deployments directory if it doesn't exist
    const deploymentPath = path.join(__dirname, "../deployments/sonic-mainnet.json");
    fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    // 8. Generate environment variables
    console.log("\n" + "=".repeat(60));
    console.log("📋 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    
    console.log("\n🌍 Environment Variables for .env:");
    console.log("===================================");
    console.log(`NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_MAINNET=${paymentContract.address}`);
    console.log(`NEXT_PUBLIC_BANDIT_KIDZ_STAKING_CONTRACT_MAINNET=${stakingContract.address}`);
    console.log(`NEXT_PUBLIC_VOTING_CONTRACT_MAINNET=${votingContract.address}`);
    console.log(`NEXT_PUBLIC_BANDIT_KIDZ_NFT_MAINNET=${banditKidzNFT.address}`);
    
    console.log("\n📊 Contract Summary:");
    console.log("====================");
    console.log("Network: Sonic Mainnet (Chain ID: 146)");
    console.log("Deployer:", deployer.address);
    console.log("BanditKidz NFT:", banditKidzNFT.address);
    console.log("Staking Contract:", stakingContract.address);
    console.log("Payment Contract:", paymentContract.address);
    console.log("Voting Contract:", votingContract.address);
    
    console.log("\n📝 Deployment info saved to:", deploymentPath);

    console.log("\n🔍 Next Steps:");
    console.log("================");
    console.log("1. Update your .env file with the addresses above");
    console.log("2. Verify contracts on Sonic Explorer:");
    console.log(`   npx hardhat verify --network sonic ${banditKidzNFT.address}`);
    console.log(`   npx hardhat verify --network sonic ${stakingContract.address} "${banditKidzNFT.address}"`);
    console.log(`   npx hardhat verify --network sonic ${paymentContract.address} "${stakingContract.address}" "${deployer.address}"`);
    console.log(`   npx hardhat verify --network sonic ${votingContract.address} "${stakingContract.address}" "${banditKidzNFT.address}"`);
    console.log("3. Test contract functionality");
    console.log("4. Update frontend configurations");
    console.log("5. Deploy frontend to production");

    return deployedContracts;

  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED");
    console.error("=====================");
    console.error("Error:", error.message);
    if (error.transaction) {
      console.error("Transaction Hash:", error.transaction.hash);
    }
    console.error("\nFull Error:", error);
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