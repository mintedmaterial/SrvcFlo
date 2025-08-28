// scripts/test-contracts.js
const { ethers } = require("hardhat");
require("dotenv").config();

// Updated contract addresses from our deployments
const CONTRACTS = {
  PAYMENT_CONTRACT: "0x08388768EEd51B2693D30AC1071D4AB558220eDE",
  STAKING_CONTRACT: "0x93d00036b8040005B4AF73b3A404F8bec4fD6B87",  
  VOTING_CONTRACT: "0x8D202946A136319B27340F61692db2bF5E69f273",
  TEST_NFT: "0x2DBFB3F4506aD4A205DAF8e319759e0E13e5A504",
  S_TOKEN: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38", // wS token
  USDC: "0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6", // USDC
};

async function main() {
  console.log("🧪 TESTING DEPLOYED CONTRACTS ON SONIC TESTNET");
  console.log("=" .repeat(60));
  
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);
  
  // Get contract instances
  try {
    console.log("\n📋 CONNECTING TO CONTRACTS");
    console.log("=" .repeat(40));
    
    const paymentContract = await ethers.getContractAt("SonicPayment", CONTRACTS.PAYMENT_CONTRACT);
    const stakingContract = await ethers.getContractAt("BanditKidzStaking", CONTRACTS.STAKING_CONTRACT);
    const votingContract = await ethers.getContractAt("VotingContract", CONTRACTS.VOTING_CONTRACT);
    const testNFT = await ethers.getContractAt("TestBanditKidzNFT", CONTRACTS.TEST_NFT);
    
    console.log("✅ All contracts connected successfully");
    
    // 1. TEST PAYMENT CONTRACT
    console.log("\n💰 TESTING PAYMENT CONTRACT");
    console.log("-".repeat(40));
    
    try {
      // Test getUserStats
      const userStats = await paymentContract.getUserStats(deployer.address);
      console.log("✅ User stats:", {
        generations: userStats[0].toString(),
        credits: userStats[1].toString()
      });
      
      // Check balance
      const contractBalance = await ethers.provider.getBalance(CONTRACTS.PAYMENT_CONTRACT);
      console.log("💰 Payment contract balance:", ethers.formatEther(contractBalance), "S");
      
      // Test payment functions (read-only check)
      console.log("📋 Payment contract methods available:");
      console.log("  - payWithS(string, string)");
      console.log("  - payWithUSDC(string, string)");
      console.log("  - useCredits(string, string)");
      console.log("  - getUserStats(address)");
      
    } catch (error) {
      console.error("❌ Payment contract test failed:", error.message);
    }
    
    // 2. TEST NFT STAKING CONTRACT
    console.log("\n🎯 TESTING NFT STAKING CONTRACT");
    console.log("-".repeat(40));
    
    try {
      // Check NFT contract address used by staking
      const nftContract = await stakingContract.banditKidzNFT();
      console.log("NFT contract used by staking:", nftContract);
      console.log("Our test NFT address:", CONTRACTS.TEST_NFT);
      
      if (nftContract.toLowerCase() !== CONTRACTS.TEST_NFT.toLowerCase()) {
        console.log("⚠️  MISMATCH: Staking contract uses different NFT address!");
        console.log("Expected:", CONTRACTS.TEST_NFT);
        console.log("Actual:", nftContract);
        console.log("🔧 SOLUTION: Need to update staking contract or use correct NFT address");
      } else {
        console.log("✅ NFT addresses match");
      }
      
      // Test reward tokens
      const sToken = await stakingContract.sToken();
      const usdcToken = await stakingContract.usdcToken();
      console.log("Reward S Token:", sToken);
      console.log("Reward USDC Token:", usdcToken);
      
      // Check staking contract balance
      const stakingBalance = await ethers.provider.getBalance(CONTRACTS.STAKING_CONTRACT);
      console.log("Staking contract balance:", ethers.formatEther(stakingBalance), "S");
      
      // Test user staking info
      const userStaking = await stakingContract.getUserStaking(deployer.address);
      console.log("User staking info:", {
        stakedTokens: userStaking[0].toString(),
        totalRewards: userStaking[1].toString(),
        lastUpdateTime: userStaking[2].toString()
      });
      
    } catch (error) {
      console.error("❌ Staking contract test failed:", error.message);
    }
    
    // 3. TEST VOTING CONTRACT
    console.log("\n🗳️  TESTING VOTING CONTRACT");
    console.log("-".repeat(40));
    
    try {
      // Check leaderboard and prize pool
      const prizePool = await votingContract.weeklyPrizePool();
      console.log("💰 Weekly prize pool:", ethers.formatEther(prizePool), "S");
      
      // Check NFT contract for voting power
      const votingNFT = await votingContract.BANDIT_KIDZ_NFT();
      console.log("Voting NFT contract:", votingNFT);
      
      // Check if user can vote
      const canVote = await votingContract.canVote(deployer.address);
      console.log("Deployer can vote:", canVote);
      
      // Check weekly contest status
      const contestActive = await votingContract.weeklyContestActive();
      console.log("Weekly contest active:", contestActive);
      
      // Get voting power
      const votingPower = await votingContract.getUserVotingPower(deployer.address);
      console.log("Deployer voting power:", votingPower.toString());
      
      // 🔍 IMPORTANT: Where do leaderboard funds go?
      console.log("\n💸 FUND DISTRIBUTION ANALYSIS:");
      console.log("Prize pool balance:", ethers.formatEther(prizePool), "S");
      console.log("❓ Need to check: Where do payments go? How is prize pool funded?");
      
    } catch (error) {
      console.error("❌ Voting contract test failed:", error.message);
    }
    
    // 4. TEST NFT CONTRACT
    console.log("\n🖼️  TESTING TEST NFT CONTRACT");
    console.log("-".repeat(40));
    
    try {
      const totalSupply = await testNFT.totalSupply();
      const deployerBalance = await testNFT.balanceOf(deployer.address);
      console.log("Total NFTs minted:", totalSupply.toString());
      console.log("Deployer NFT balance:", deployerBalance.toString());
      
      if (deployerBalance > 0) {
        console.log("✅ Test NFTs available for testing");
        
        // Check first token
        const firstTokenId = 1;
        const tokenOwner = await testNFT.ownerOf(firstTokenId);
        console.log(`Token #${firstTokenId} owned by:`, tokenOwner);
        
        // Try to approve staking contract for NFT transfers
        const isApproved = await testNFT.isApprovedForAll(deployer.address, CONTRACTS.STAKING_CONTRACT);
        console.log("Staking contract approved for NFTs:", isApproved);
      }
      
    } catch (error) {
      console.error("❌ Test NFT contract test failed:", error.message);
    }
    
    // 5. TEST TOKEN BALANCES
    console.log("\n💰 TESTING TOKEN BALANCES");
    console.log("-".repeat(40));
    
    try {
      // Check native S balance
      const nativeBalance = await ethers.provider.getBalance(deployer.address);
      console.log("Deployer native S balance:", ethers.formatEther(nativeBalance));
      
      // Check wS token balance
      const sTokenContract = await ethers.getContractAt("IERC20", CONTRACTS.S_TOKEN);
      const sBalance = await sTokenContract.balanceOf(deployer.address);
      console.log("Deployer wS balance:", ethers.formatUnits(sBalance, 18));
      
      // Check USDC balance
      const usdcContract = await ethers.getContractAt("IERC20", CONTRACTS.USDC);
      const usdcBalance = await usdcContract.balanceOf(deployer.address);
      console.log("Deployer USDC balance:", ethers.formatUnits(usdcBalance, 6));
      
    } catch (error) {
      console.error("❌ Token balance test failed:", error.message);
    }
    
    // 6. TEST PAYMENT FLOW SIMULATION
    console.log("\n💳 PAYMENT FLOW ANALYSIS");
    console.log("-".repeat(40));
    
    console.log("🔍 How payments should work:");
    console.log("1. User transfers tokens to payment contract");
    console.log("2. Payment contract triggers generation");
    console.log("3. Funds are distributed to:");
    console.log("   - Developer/operator");
    console.log("   - Leaderboard prize pool");
    console.log("   - Staking rewards pool");
    
    console.log("\n❓ KEY QUESTIONS TO ANSWER:");
    console.log("- Does payment contract have receive/fallback functions?");
    console.log("- How are funds distributed after payment?");
    console.log("- Where do leaderboard funds come from?");
    console.log("- How to properly call payment functions?");
    
    console.log("\n🎯 NEXT STEPS");
    console.log("=" .repeat(40));
    console.log("1. ✅ Deploy test NFT contract - COMPLETED");
    console.log("2. ⚠️  Update staking contract NFT address OR use correct NFT");
    console.log("3. 🔧 Test actual payment transactions");
    console.log("4. 🔧 Test NFT staking flow");
    console.log("5. 🔧 Test voting and leaderboard");
    console.log("6. 🔧 Fix frontend transaction errors");
    
  } catch (error) {
    console.error("❌ Contract connection failed:", error.message);
    console.log("💡 Make sure you're connected to Sonic testnet");
  }
}

main()
  .then(() => {
    console.log("\n🎉 All tests completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Testing failed:");
    console.error(error);
    process.exit(1);
  });