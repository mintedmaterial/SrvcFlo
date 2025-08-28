const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Initializing INFT packages on existing contract...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "S");

  // Use existing deployed contract
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_MAINNET;
  console.log("Target Contract:", CONTRACT_ADDRESS);

  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_MAINNET not found or invalid in .env");
  }

  // Minimal ABI for the functions we need
  const contractABI = [
    "function packages(uint256) external view returns (uint256 totalCredits, uint256 priceS, uint256 priceUSDC, bool isActive)",
    "function owner() external view returns (address)",
    "function createPackage(uint256 packageId, uint256 totalCredits, uint256 priceS, uint256 priceUSDC, bool isActive) external",
    "function purchasePackageWithNativeS(uint256 packageId, address recipient) external payable",
    "function updatePackagePriceS(uint256 packageId, uint256 newPriceS) external"
  ];

  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, deployer);

  // Check ownership
  try {
    const owner = await contract.owner();
    console.log("Contract owner:", owner);
    console.log("Are we owner?", owner.toLowerCase() === deployer.address.toLowerCase());
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("❌ We are not the contract owner. Cannot initialize packages.");
      console.log("🔄 Suggestion: Deploy a new INFT contract with the V2 script");
      return;
    }
  } catch (error) {
    console.error("❌ Could not verify contract ownership:", error.message);
    console.log("ℹ️  This might not be an INFT contract. Deploy a new one instead.");
    return;
  }

  console.log("\n🔍 Checking current packages...");

  // Package definitions for AI image/video generation
  const packageDefinitions = [
    {
      id: 1,
      totalCredits: 750,
      priceS: ethers.parseEther("16"),     // ~$5 USD worth of S
      priceUSDC: ethers.parseUnits("5", 6),
      description: "Starter - 3-4 images or 1-2 videos"
    },
    {
      id: 2, 
      totalCredits: 8000,
      priceS: ethers.parseEther("161"),    // ~$50 USD worth of S
      priceUSDC: ethers.parseUnits("50", 6),
      description: "Creator - 40 images or 16 videos + premium models"
    },
    {
      id: 3,
      totalCredits: 50000,
      priceS: ethers.parseEther("645"),    // ~$200 USD worth of S
      priceUSDC: ethers.parseUnits("200", 6),
      description: "Professional - 250 images or 100 videos + full access"
    },
    {
      id: 4,
      totalCredits: 500000,
      priceS: ethers.parseEther("4839"),   // ~$1500 USD worth of S
      priceUSDC: ethers.parseUnits("1500", 6),
      description: "Enterprise - 2500 images or 1000 videos + unlimited"
    }
  ];

  // Check and create packages
  for (const pkgDef of packageDefinitions) {
    console.log(`\n📦 Processing Package ${pkgDef.id}: ${pkgDef.description}`);
    
    try {
      // Try to read existing package
      const existingPkg = await contract.packages(pkgDef.id);
      
      if (existingPkg.isActive && existingPkg.totalCredits > 0) {
        console.log(`   ✅ Package ${pkgDef.id} already exists:`, {
          totalCredits: existingPkg.totalCredits.toString(),
          priceS: ethers.formatEther(existingPkg.priceS) + " S",
          priceUSDC: ethers.formatUnits(existingPkg.priceUSDC, 6) + " USDC"
        });
        continue;
      }
    } catch (error) {
      console.log(`   📝 Package ${pkgDef.id} needs to be created...`);
    }

    // Create the package
    try {
      console.log(`   🔨 Creating package ${pkgDef.id}...`);
      console.log(`      Credits: ${pkgDef.totalCredits}`);
      console.log(`      Price S: ${ethers.formatEther(pkgDef.priceS)} S`);
      console.log(`      Price USDC: ${ethers.formatUnits(pkgDef.priceUSDC, 6)} USDC`);

      const tx = await contract.createPackage(
        pkgDef.id,
        pkgDef.totalCredits,
        pkgDef.priceS,
        pkgDef.priceUSDC,
        true,
        {
          gasLimit: 300000,
          gasPrice: ethers.parseUnits("25", "gwei")
        }
      );

      console.log(`   ⏳ Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`   ✅ Package ${pkgDef.id} created! Gas used: ${receipt.gasUsed}`);

    } catch (error) {
      console.error(`   ❌ Failed to create package ${pkgDef.id}:`, error.message);
      console.log(`   💡 This might be a function name mismatch. Check contract ABI.`);
    }
  }

  // Final verification
  console.log("\n🔍 Final package verification...");
  let packagesFound = 0;

  for (let i = 1; i <= 4; i++) {
    try {
      const pkg = await contract.packages(i);
      if (pkg.isActive && pkg.totalCredits > 0) {
        console.log(`✅ Package ${i}: ${pkg.totalCredits} credits, ${ethers.formatEther(pkg.priceS)} S`);
        packagesFound++;
      }
    } catch (error) {
      console.log(`❌ Package ${i}: Not found or error`);
    }
  }

  console.log(`\n📊 Summary: ${packagesFound}/4 packages active`);
  
  if (packagesFound > 0) {
    console.log("🎉 INFT packages are now available for purchase!");
    console.log("🔗 Contract: https://sonicscan.org/address/" + CONTRACT_ADDRESS);
    console.log("✅ Users can now mint INFT packages from the frontend!");
  } else {
    console.log("⚠️  No packages were successfully created.");
    console.log("💡 Consider deploying a new INFT contract with the V2 script.");
  }
}

main()
  .then(() => {
    console.log("\n✨ Process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Process failed:", error);
    process.exit(1);
  });