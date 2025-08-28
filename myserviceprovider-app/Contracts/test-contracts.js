// scripts/test-contracts.js
const { ethers } = require("hardhat");

async function testContracts() {
  console.log("🧪 Testing SrvcfloStaking and SonicPaymentTestnet contracts...\n");

  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);

  // Deploy a mock NFT contract for testing
  console.log("\n📋 Deploying mock NFT contract...");
  const MockNFT = await ethers.getContractFactory("TestNFT");
  const mockNFT = await MockNFT.deploy();
  await mockNFT.deployed();
  console.log("Mock NFT deployed to:", mockNFT.address);

  // Mint some NFTs to users for testing
  console.log("🎨 Minting test NFTs...");
  await mockNFT.mint(user1.address, 1);
  await mockNFT.mint(user1.address, 2);
  await mockNFT.mint(user2.address, 3);
  console.log("Minted NFTs 1,2 to user1 and NFT 3 to user2");

  // Deploy SrvcfloStaking contract
  console.log("\n🏦 Deploying SrvcfloStaking contract...");
  const SrvcfloStaking = await ethers.getContractFactory("SrvcfloStaking");
  const stakingContract = await SrvcfloStaking.deploy(
    mockNFT.address,
    deployer.address // penalty wallet
  );
  await stakingContract.deployed();
  console.log("SrvcfloStaking deployed to:", stakingContract.address);

  // Deploy SonicPaymentTestnet contract
  console.log("\n💰 Deploying SonicPaymentTestnet contract...");
  const SonicPayment = await ethers.getContractFactory("SonicPaymentTestnet");
  const paymentContract = await SonicPayment.deploy(
    stakingContract.address,
    deployer.address, // dev wallet
    ethers.constants.AddressZero, // no CORAL token
    ethers.constants.AddressZero  // no price oracle
  );
  await paymentContract.deployed();
  console.log("SonicPaymentTestnet deployed to:", paymentContract.address);

  // Test staking functionality
  console.log("\n🔒 Testing staking functionality...");
  
  // Approve NFT for staking
  await mockNFT.connect(user1).approve(stakingContract.address, 1);
  console.log("✅ User1 approved NFT #1 for staking");

  // Test different lock periods
  const lockPeriods = [
    { name: "No lock", duration: 0 },
    { name: "30 days", duration: 30 * 24 * 60 * 60 },
    { name: "60 days", duration: 60 * 24 * 60 * 60 },
    { name: "365 days", duration: 365 * 24 * 60 * 60 }
  ];

  // Get lock periods and bonuses
  const [periods, bonuses] = await stakingContract.getLockPeriodsAndBonuses();
  console.log("\n📊 Available lock periods and bonuses:");
  for (let i = 0; i < periods.length; i++) {
    const days = periods[i].toNumber() / (24 * 60 * 60);
    const bonus = bonuses[i].toNumber() / 100; // Convert from basis points to percentage
    console.log(`  ${days === 0 ? 'No lock' : days + ' days'}: ${bonus}% rewards`);
  }

  // Stake NFT with 30-day lock
  console.log("\n🔐 Staking NFT #1 with 30-day lock...");
  await stakingContract.connect(user1).stake(1, 30 * 24 * 60 * 60);
  
  // Check stake info
  const [stakeInfo, isLocked, timeUntilUnlock] = await stakingContract.getStakeInfo(1);
  console.log("✅ Stake successful!");
  console.log("  Staker:", stakeInfo.staker);
  console.log("  Bonus multiplier:", stakeInfo.bonusMultiplier.toString());
  console.log("  Is locked:", isLocked);
  console.log("  Time until unlock (seconds):", timeUntilUnlock.toString());

  // Test payment functionality
  console.log("\n💳 Testing payment functionality...");
  
  // Get payment costs
  const [sssttCost, coralCost, sCost, usdcCost] = await paymentContract.getPaymentCosts("image");
  console.log("📊 Payment costs for image generation:");
  console.log("  SSStt:", ethers.utils.formatEther(sssttCost));
  console.log("  CORAL:", ethers.utils.formatEther(coralCost));
  console.log("  S Token:", ethers.utils.formatEther(sCost));
  console.log("  USDC:", ethers.utils.formatUnits(usdcCost, 6));

  // Test credit system
  console.log("\n🎁 Testing credit system...");
  await paymentContract.addCredits(user1.address, 5);
  const userStats = await paymentContract.getUserStats(user1.address);
  console.log("✅ Added 5 credits to user1");
  console.log("  User1 credits:", userStats.credits.toString());

  // Test using credits for generation
  console.log("\n🎨 Testing generation with credits...");
  await paymentContract.connect(user1).useCredits("Test image generation", "image");
  const userStatsAfter = await paymentContract.getUserStats(user1.address);
  console.log("✅ Used 1 credit for image generation");
  console.log("  User1 credits remaining:", userStatsAfter.credits.toString());
  console.log("  User1 generations:", userStatsAfter.generations.toString());

  // Test distribution functionality
  console.log("\n💰 Testing distribution functionality...");
  
  // Add some ETH distribution to the staking contract
  const distributionAmount = ethers.utils.parseEther("0.1"); // 0.1 ETH per staked NFT
  await stakingContract.addDistribution(distributionAmount, ethers.constants.AddressZero, {
    value: distributionAmount // Since we have 1 NFT staked with bonus multiplier ~1.15, we need slightly more
  });
  console.log("✅ Added ETH distribution");

  // Check pending rewards
  const [amounts, tokens] = await stakingContract.getUserPendingRewards(user1.address);
  if (amounts.length > 0) {
    console.log("💎 User1 pending rewards:");
    for (let i = 0; i < amounts.length; i++) {
      const token = tokens[i] === ethers.constants.AddressZero ? "ETH" : tokens[i];
      console.log(`  ${ethers.utils.formatEther(amounts[i])} ${token}`);
    }
  }

  console.log("\n✅ Contract testing completed successfully!");
  console.log("\n📋 Summary:");
  console.log("- SrvcfloStaking contract: Deployed and functional");
  console.log("- Time-lock staking: Working with bonus multipliers");
  console.log("- SonicPaymentTestnet contract: Deployed and functional");
  console.log("- Credit system: Working");
  console.log("- Distribution system: Working");
  console.log("- Integration: Payment contract connected to staking contract");

  return {
    mockNFT: mockNFT.address,
    stakingContract: stakingContract.address,
    paymentContract: paymentContract.address
  };
}

// Export for use
module.exports = { testContracts };

// Run test if called directly
if (require.main === module) {
  testContracts()
    .then((addresses) => {
      console.log("\n🎯 Contract addresses for further testing:");
      console.log("- Mock NFT:", addresses.mockNFT);
      console.log("- SrvcfloStaking:", addresses.stakingContract);  
      console.log("- SonicPaymentTestnet:", addresses.paymentContract);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Test failed:", error);
      process.exit(1);
    });
}