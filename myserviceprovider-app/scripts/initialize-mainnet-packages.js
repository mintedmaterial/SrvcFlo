const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Initializing Sonic Mainnet Payment Contract Packages...");
  console.log("=".repeat(60));

  // Contract address (already deployed)
  const PAYMENT_CONTRACT = "0x09575A8046048816317C41f9Cf37267E8486bb9b";
  
  // Get deployer wallet
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "S");

  // Connect to deployed contract
  const contract = await ethers.getContractAt("SonicMainnetPaymentV2", PAYMENT_CONTRACT);
  
  // Verify we're the owner
  const owner = await contract.owner();
  console.log("Contract owner:", owner);
  console.log("Deployer is owner:", owner.toLowerCase() === deployer.address.toLowerCase());
  
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error("Deployer is not the contract owner!");
  }

  // Check if contract is paused
  const isPaused = await contract.paused();
  console.log("Contract paused:", isPaused);

  // Credit packages to set up (matching the frontend)
  const packages = [
    {
      id: 1,
      name: "Starter",
      usdcPrice: ethers.utils.parseUnits("5", 6),      // 5 USDC
      sonicPrice: ethers.utils.parseEther("5"),        // 5 S
      usdcCredits: 750,                               // 750 credits
      sonicCredits: 1000,                             // 1000 credits (33% bonus)
      isActive: true
    },
    {
      id: 2, 
      name: "Pro",
      usdcPrice: ethers.utils.parseUnits("50", 6),     // 50 USDC
      sonicPrice: ethers.utils.parseEther("50"),       // 50 S
      usdcCredits: 8000,                              // 8000 credits
      sonicCredits: 10000,                            // 10000 credits (25% bonus)
      isActive: true
    },
    {
      id: 3,
      name: "Business", 
      usdcPrice: ethers.utils.parseUnits("500", 6),    // 500 USDC
      sonicPrice: ethers.utils.parseEther("500"),      // 500 S
      usdcCredits: 100000,                            // 100k credits
      sonicCredits: 115000,                           // 115k credits (15% bonus)
      isActive: true
    },
    {
      id: 4,
      name: "Enterprise",
      usdcPrice: ethers.utils.parseUnits("1250", 6),   // 1250 USDC
      sonicPrice: ethers.utils.parseEther("1250"),     // 1250 S
      usdcCredits: 260000,                            // 260k credits
      sonicCredits: 290000,                           // 290k credits (12% bonus)
      isActive: true
    }
  ];

  console.log("\n📦 Setting up packages...");
  
  for (const pkg of packages) {
    console.log(`\nSetting up ${pkg.name} (ID: ${pkg.id}):`);
    console.log(`- USDC: ${ethers.utils.formatUnits(pkg.usdcPrice, 6)} → ${pkg.usdcCredits} credits`);
    console.log(`- Sonic: ${ethers.utils.formatEther(pkg.sonicPrice)} → ${pkg.sonicCredits} credits`);
    
    try {
      // Check if package already exists
      try {
        const existingPkg = await contract.packages(pkg.id);
        console.log(`Package ${pkg.id} already exists:`, {
          usdcPrice: ethers.utils.formatUnits(existingPkg.usdcPrice, 6),
          sonicPrice: ethers.utils.formatEther(existingPkg.sonicPrice),
          usdcCredits: existingPkg.usdcCredits.toString(),
          sonicCredits: existingPkg.sonicCredits.toString(), 
          isActive: existingPkg.isActive
        });
        continue;
      } catch (err) {
        // Package doesn't exist, we'll create it
        console.log(`Package ${pkg.id} does not exist, creating...`);
      }

      const tx = await contract.setPackage(
        pkg.id,
        pkg.usdcPrice,
        pkg.sonicPrice, 
        pkg.usdcCredits,
        pkg.sonicCredits,
        pkg.isActive
      );
      
      console.log(`Transaction hash: ${tx.hash}`);
      console.log("Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log(`✅ ${pkg.name} package configured! (Block: ${receipt.blockNumber})`);
      
    } catch (error) {
      console.error(`❌ Failed to set up ${pkg.name}:`, error.message);
    }
  }

  console.log("\n✅ Package initialization complete!");
  console.log("=".repeat(60));
  
  // Verify all packages are set up correctly
  console.log("\n🔍 Verifying package setup:");
  for (const pkg of packages) {
    try {
      const result = await contract.packages(pkg.id);
      console.log(`Package ${pkg.id} (${pkg.name}):`);
      console.log(`  - USDC Price: ${ethers.utils.formatUnits(result.usdcPrice, 6)} USDC`);
      console.log(`  - Sonic Price: ${ethers.utils.formatEther(result.sonicPrice)} S`); 
      console.log(`  - USDC Credits: ${result.usdcCredits.toString()}`);
      console.log(`  - Sonic Credits: ${result.sonicCredits.toString()}`);
      console.log(`  - Active: ${result.isActive}`);
      console.log("");
    } catch (error) {
      console.error(`❌ Failed to verify package ${pkg.id}:`, error.message);
    }
  }

  console.log("🎉 Contract is now ready for credit purchases!");
  console.log("Users can now mint credits with both USDC and native S tokens.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Initialization failed:");
    console.error(error);
    process.exit(1);
  });