const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying INFT Packages V2 to Sonic Mainnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "S");

  // Contract parameters
  const initialOwner = deployer.address;
  const devWallet = deployer.address; // Using deployer as dev wallet for now
  const stakingContract = process.env.NEXT_PUBLIC_SONIC_STAKING_CONTRACT_MAINNET || "0x103ce561d5137f137c9A86670812287B1B258499";

  console.log("Contract parameters:");
  console.log("- Initial Owner:", initialOwner);
  console.log("- Dev Wallet:", devWallet);  
  console.log("- Staking Contract:", stakingContract);

  // Deploy the contract
  console.log("\n📦 Deploying SrvcfloINFTPackagesV2...");
  
  const SrvcfloINFTPackagesV2 = await ethers.getContractFactory("SrvcfloINFTPackagesV2");
  const inftPackages = await SrvcfloINFTPackagesV2.deploy(
    initialOwner,
    devWallet,
    stakingContract,
    {
      gasLimit: 6000000,
      gasPrice: ethers.parseUnits("20", "gwei")
    }
  );

  await inftPackages.waitForDeployment();
  const contractAddress = await inftPackages.getAddress();

  console.log(`✅ SrvcfloINFTPackagesV2 deployed to: ${contractAddress}`);
  console.log(`🔗 View on SonicScan: https://sonicscan.org/address/${contractAddress}`);

  // Verify packages are initialized
  console.log("\n🔍 Verifying package initialization...");

  for (let i = 1; i <= 4; i++) {
    try {
      const pkg = await inftPackages.getPackageInfo(i);
      console.log(`📦 Package ${i}:`, {
        totalCredits: pkg.totalCredits.toString(),
        priceS: ethers.formatEther(pkg.priceS) + " S",
        priceUSDC: ethers.formatUnits(pkg.priceUSDC, 6) + " USDC", 
        isActive: pkg.isActive,
        description: pkg.description
      });
    } catch (error) {
      console.error(`❌ Failed to read package ${i}:`, error.message);
    }
  }

  // Test minting a dev package
  console.log("\n🎁 Minting test package to dev wallet...");
  
  try {
    const pkg = await inftPackages.getPackageInfo(1); // Starter package
    const priceS = pkg.priceS;

    console.log(`Minting Starter package for ${ethers.formatEther(priceS)} S...`);
    
    const tx = await inftPackages.purchasePackageWithNativeS(1, devWallet, {
      value: priceS,
      gasLimit: 500000,
      gasPrice: ethers.parseUnits("20", "gwei")
    });

    console.log(`⏳ Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Dev package minted! Gas used: ${receipt.gasUsed.toString()}`);

    // Check token was minted
    const totalSupply = await inftPackages.totalSupply();
    console.log(`📊 Total supply: ${totalSupply.toString()}`);

    if (totalSupply > 0) {
      const credits = await inftPackages.getRemainingCredits(1);
      console.log(`💳 Token 1 credits: ${credits.toString()}`);
    }

  } catch (error) {
    console.error("❌ Failed to mint dev package:", error.message);
  }

  // Update environment variables
  console.log("\n📝 Contract deployment completed!");
  console.log("Add this to your .env file:");
  console.log(`NEXT_PUBLIC_INFT_PACKAGES_CONTRACT=${contractAddress}`);
  console.log("");
  console.log("🎯 Users can now purchase INFT packages!");
  console.log("🔄 Update your frontend to use the new contract address");

  return {
    contractAddress,
    deployer: deployer.address,
    txHash: inftPackages.deploymentTransaction()?.hash
  };
}

main()
  .then((result) => {
    console.log("\n✅ Deployment successful!");
    console.log("Contract Address:", result.contractAddress);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });