const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Fixing existing INFT contract packages...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "S");

  // Use existing deployed contract
  const EXISTING_CONTRACT = process.env.NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_MAINNET;
  console.log("Existing Contract:", EXISTING_CONTRACT);

  if (!EXISTING_CONTRACT) {
    throw new Error("NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_MAINNET not found in .env");
  }

  // Try to get contract instance - we'll use a generic ABI first
  const contractABI = [
    "function packages(uint256) external view returns (uint256 totalCredits, uint256 priceS, uint256 priceUSDC, bool isActive)",
    "function createPackage(uint256 packageId, uint256 totalCredits, uint256 priceS, uint256 priceUSDC, bool isActive) external",
    "function owner() external view returns (address)",
    "function mintPackageWithS(uint256 packageId, address to) external payable"
  ];

  const contract = new ethers.Contract(EXISTING_CONTRACT, contractABI, deployer);

  // Check if we're the owner
  try {
    const owner = await contract.owner();
    console.log("Contract owner:", owner);
    console.log("Are we owner?", owner.toLowerCase() === deployer.address.toLowerCase());
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("❌ We are not the contract owner. Cannot initialize packages.");
      console.log("ℹ️  Deploy a new contract instead using deploy-inft-packages-v2.js");
      return;
    }
  } catch (error) {
    console.error("❌ Could not read contract owner:", error.message);
    console.log("ℹ️  Deploy a new contract instead using deploy-inft-packages-v2.js");
    return;
  }

  // Check existing packages
  console.log("\n🔍 Checking existing packages...");
  
  for (let i = 1; i <= 4; i++) {
    try {
      const pkg = await contract.packages(i);
      if (pkg.isActive) {
        console.log(`📦 Package ${i} already exists:`, {
          totalCredits: pkg.totalCredits.toString(),
          priceS: ethers.formatEther(pkg.priceS),
          priceUSDC: ethers.formatUnits(pkg.priceUSDC, 6),
          isActive: pkg.isActive
        });
        continue;
      }
    } catch (error) {
      console.log(`📦 Package ${i}: Not found, will create...`);
    }

    // Create the package
    const packageData = getPackageData(i);
    console.log(`Creating package ${i}:`, packageData.description);
    
    try {
      const tx = await contract.createPackage(
        i,
        packageData.totalCredits,
        packageData.priceS,
        packageData.priceUSDC,
        true,
        {
          gasLimit: 500000,
          gasPrice: ethers.parseUnits("25", "gwei")
        }
      );

      console.log(`⏳ Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Package ${i} created! Gas used: ${receipt.gasUsed.toString()}`);

    } catch (error) {
      console.error(`❌ Failed to create package ${i}:`, error.message);
    }
  }

  console.log("\n✅ Package initialization completed!");
  console.log("🎯 Users can now purchase INFT packages from the frontend!");
}

function getPackageData(packageId) {
  const packages = {
    1: {
      totalCredits: 750,
      priceS: ethers.parseEther("16"), // ~$5 USD
      priceUSDC: ethers.parseUnits("5", 6),
      description: "Starter AI Image Generation - Basic usage"
    },
    2: {
      totalCredits: 8000,
      priceS: ethers.parseEther("161"), // ~$50 USD
      priceUSDC: ethers.parseUnits("50", 6),
      description: "Creator AI Generation - Premium models"
    },
    3: {
      totalCredits: 50000,
      priceS: ethers.parseEther("645"), // ~$200 USD
      priceUSDC: ethers.parseUnits("200", 6),
      description: "Professional AI Generation - Full access"
    },
    4: {
      totalCredits: 500000,
      priceS: ethers.parseEther("4839"), // ~$1500 USD
      priceUSDC: ethers.parseUnits("1500", 6),
      description: "Enterprise AI Generation - Unlimited"
    }
  };

  return packages[packageId];
}

main()
  .then(() => {
    console.log("\n✅ Contract fix completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fix failed:", error);
    process.exit(1);
  });