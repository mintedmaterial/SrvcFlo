const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Initializing INFT Packages on Sonic Mainnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "S");

  // Contract addresses from .env
  const PAYMENT_CONTRACT = process.env.NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_MAINNET;
  const GENERATED_NFT_CONTRACT = process.env.NEXT_PUBLIC_GENERATED_NFT_CONTRACT;
  
  if (!PAYMENT_CONTRACT) {
    throw new Error("NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_MAINNET not set in .env");
  }

  console.log("Payment Contract:", PAYMENT_CONTRACT);
  console.log("Generated NFT Contract:", GENERATED_NFT_CONTRACT || "Not deployed yet");

  // Get contract instance
  const SrvcfloINFTPackages = await ethers.getContractFactory("SrvcfloINFTPackages");
  const paymentContract = SrvcfloINFTPackages.attach(PAYMENT_CONTRACT);

  // Check if packages are already initialized
  try {
    const existingPackage = await paymentContract.packages(1);
    console.log("📦 Package 1 already exists:", {
      totalCredits: existingPackage.totalCredits.toString(),
      priceS: ethers.formatEther(existingPackage.priceS),
      priceUSDC: ethers.formatUnits(existingPackage.priceUSDC, 6),
      isActive: existingPackage.isActive
    });
    
    console.log("✅ Packages already initialized. Skipping initialization.");
    return;
  } catch (error) {
    console.log("📦 Packages not initialized. Proceeding with setup...");
  }

  // Package definitions matching the INFT system (AI image/video generation focus)
  // Using dynamic pricing: Assume 1 S ≈ $0.31, so $5 ≈ 16 S, $50 ≈ 161 S, etc.
  const packages = [
    {
      id: 1, // STARTER_PACKAGE 
      totalCredits: 750,  // 3-4 images (750÷200) or 1-2 videos (750÷500)
      priceS: ethers.parseEther("16"), // ~$5 USD worth of S tokens
      priceUSDC: ethers.parseUnits("5", 6), // $5 USDC fixed
      description: "Starter AI Image Generation - Basic usage for individual creators"
    },
    {
      id: 2, // CREATOR_PACKAGE  
      totalCredits: 8000,  // 40 images (8000÷200) or 16 videos (8000÷500)
      priceS: ethers.parseEther("161"), // ~$50 USD worth of S tokens
      priceUSDC: ethers.parseUnits("50", 6), // $50 USDC fixed
      description: "Creator AI Generation - Premium models + collection influence"
    },
    {
      id: 3, // PROFESSIONAL_PACKAGE
      totalCredits: 50000,  // 250 images (50000÷200) or 100 videos (50000÷500)
      priceS: ethers.parseEther("645"), // ~$200 USD worth of S tokens
      priceUSDC: ethers.parseUnits("200", 6), // $200 USDC fixed
      description: "Professional AI Generation - Full model access for businesses"
    },
    {
      id: 4, // ENTERPRISE_PACKAGE
      totalCredits: 500000,  // 2500 images (500000÷200) or 1000 videos (500000÷500)
      priceS: ethers.parseEther("4839"), // ~$1500 USD worth of S tokens  
      priceUSDC: ethers.parseUnits("1500", 6), // $1500 USDC fixed
      description: "Enterprise AI Generation - Unlimited capabilities for large operations"
    }
  ];

  console.log("\n📦 Initializing packages...");

  for (const pkg of packages) {
    console.log(`\n📝 Initializing Package ${pkg.id}: ${pkg.description}`);
    console.log(`   Credits: ${pkg.totalCredits}`);
    console.log(`   Price S: ${ethers.formatEther(pkg.priceS)} S`);
    console.log(`   Price USDC: ${ethers.formatUnits(pkg.priceUSDC, 6)} USDC`);
    console.log(`   AI Models: ${pkg.aiModels.join(", ")}`);

    try {
      const tx = await paymentContract.createPackage(
        pkg.id,
        pkg.totalCredits,
        pkg.priceS,
        pkg.priceUSDC,
        true, // isActive
        {
          gasLimit: 500000,
          gasPrice: ethers.parseUnits("20", "gwei")
        }
      );

      console.log(`   ⏳ Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`   ✅ Package ${pkg.id} initialized! Gas used: ${receipt.gasUsed.toString()}`);

    } catch (error) {
      console.error(`   ❌ Failed to initialize package ${pkg.id}:`, error.message);
      
      // Continue with other packages
      continue;
    }
  }

  console.log("\n🔍 Verifying package initialization...");

  for (let i = 1; i <= 4; i++) {
    try {
      const pkg = await paymentContract.packages(i);
      console.log(`📦 Package ${i}:`, {
        totalCredits: pkg.totalCredits.toString(),
        priceS: ethers.formatEther(pkg.priceS) + " S",
        priceUSDC: ethers.formatUnits(pkg.priceUSDC, 6) + " USDC",
        isActive: pkg.isActive
      });
    } catch (error) {
      console.error(`❌ Failed to read package ${i}:`, error.message);
    }
  }

  // Initialize dev wallet packages for testing
  console.log("\n👤 Minting dev wallet packages for testing...");
  
  const devWallet = deployer.address;
  const devPackages = [1, 2]; // Starter and Creator packages for testing

  for (const packageId of devPackages) {
    try {
      console.log(`🎁 Minting package ${packageId} to dev wallet...`);
      
      const pkg = await paymentContract.packages(packageId);
      const priceS = pkg.priceS;

      const tx = await paymentContract.mintPackageWithS(packageId, devWallet, {
        value: priceS,
        gasLimit: 800000,
        gasPrice: ethers.parseUnits("20", "gwei")
      });

      console.log(`   ⏳ Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`   ✅ Dev package ${packageId} minted! Gas used: ${receipt.gasUsed.toString()}`);

    } catch (error) {
      console.error(`   ❌ Failed to mint dev package ${packageId}:`, error.message);
    }
  }

  console.log("\n✅ INFT Package initialization completed!");
  console.log("🎯 Users can now purchase INFT packages on the frontend");
  console.log(`🔗 Payment Contract: https://sonicscan.org/address/${PAYMENT_CONTRACT}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });