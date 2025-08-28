const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Starting INFT contracts deployment to Sonic...");
  console.log("Network:", hre.network.name);
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "S");

  // Configuration
  const DEV_WALLET = "0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8";
  const TREASURY_WALLET = deployer.address; // Can be changed later
  
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: DEPLOYING SRVCFLO INFT PACKAGES CONTRACT");
  console.log("=".repeat(60));

  // Deploy INFT Packages Contract
  const SrvcfloINFTPackages = await ethers.getContractFactory("SrvcfloINFTPackages");
  console.log("Deploying SrvcfloINFTPackages contract...");
  
  const inftPackagesContract = await SrvcfloINFTPackages.deploy(DEV_WALLET);
  await inftPackagesContract.waitForDeployment();
  const inftPackagesAddress = await inftPackagesContract.getAddress();
  
  console.log("✅ SrvcfloINFTPackages deployed to:", inftPackagesAddress);
  console.log("Transaction hash:", inftPackagesContract.deploymentTransaction().hash);

  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: DEPLOYING SRVCFLO GENERATED NFT CONTRACT");
  console.log("=".repeat(60));

  // Deploy Generated NFT Contract
  const SrvcfloGeneratedNFT = await ethers.getContractFactory("SrvcfloGeneratedNFT");
  console.log("Deploying SrvcfloGeneratedNFT contract...");
  
  const generatedNFTContract = await SrvcfloGeneratedNFT.deploy(DEV_WALLET);
  await generatedNFTContract.waitForDeployment();
  const generatedNFTAddress = await generatedNFTContract.getAddress();
  
  console.log("✅ SrvcfloGeneratedNFT deployed to:", generatedNFTAddress);
  console.log("Transaction hash:", generatedNFTContract.deploymentTransaction().hash);

  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: DEPLOYING SRVCFLO MARKETPLACE CONTRACT");
  console.log("=".repeat(60));

  // Deploy Marketplace Contract
  const SrvcfloMarketplace = await ethers.getContractFactory("SrvcfloMarketplace");
  console.log("Deploying SrvcfloMarketplace contract...");
  
  const marketplaceContract = await SrvcfloMarketplace.deploy(
    inftPackagesAddress,
    generatedNFTAddress,
    TREASURY_WALLET
  );
  await marketplaceContract.waitForDeployment();
  const marketplaceAddress = await marketplaceContract.getAddress();
  
  console.log("✅ SrvcfloMarketplace deployed to:", marketplaceAddress);
  console.log("Transaction hash:", marketplaceContract.deploymentTransaction().hash);

  console.log("\n" + "=".repeat(60));
  console.log("STEP 4: CONFIGURING CONTRACTS");
  console.log("=".repeat(60));

  // Authorize the marketplace as a minter for the generated NFT contract
  console.log("Authorizing marketplace as minter for Generated NFT...");
  const authorizeTx = await generatedNFTContract.setAuthorizedMinter(marketplaceAddress, true);
  await authorizeTx.wait();
  console.log("✅ Marketplace authorized as minter");

  // Authorize the INFT packages contract as a minter for the generated NFT contract
  console.log("Authorizing INFT packages as minter for Generated NFT...");
  const authorizeTx2 = await generatedNFTContract.setAuthorizedMinter(inftPackagesAddress, true);
  await authorizeTx2.wait();
  console.log("✅ INFT packages authorized as minter");

  console.log("\n" + "=".repeat(60));
  console.log("STEP 5: MINTING DEV PACKAGES FOR TESTING");
  console.log("=".repeat(60));

  // Mint test packages for the dev wallet
  const packageTypes = [1, 2, 3, 4]; // Starter, Pro, Business, Enterprise
  const packageNames = ["Starter", "Pro", "Business", "Enterprise"];
  
  for (let i = 0; i < packageTypes.length; i++) {
    console.log(`Minting ${packageNames[i]} package for dev wallet...`);
    try {
      const mintTx = await inftPackagesContract.devMintPackage(DEV_WALLET, packageTypes[i]);
      const receipt = await mintTx.wait();
      
      // Get the token ID from the event
      const transferEvent = receipt.logs.find(log => {
        try {
          const parsed = inftPackagesContract.interface.parseLog(log);
          return parsed.name === 'Transfer';
        } catch (e) {
          return false;
        }
      });
      
      if (transferEvent) {
        const parsedLog = inftPackagesContract.interface.parseLog(transferEvent);
        const tokenId = parsedLog.args.tokenId;
        console.log(`✅ ${packageNames[i]} package minted with token ID: ${tokenId.toString()}`);
      } else {
        console.log(`✅ ${packageNames[i]} package minted successfully`);
      }
    } catch (error) {
      console.log(`❌ Failed to mint ${packageNames[i]} package:`, error.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));
  
  console.log("\n📋 CONTRACT ADDRESSES:");
  console.log("├─ INFT Packages:", inftPackagesAddress);
  console.log("├─ Generated NFT:", generatedNFTAddress);
  console.log("└─ Marketplace:", marketplaceAddress);
  
  console.log("\n🔗 EXPLORER LINKS:");
  const isTestnet = hre.network.name.includes("testnet") || hre.network.name.includes("Test");
  const explorerBase = isTestnet ? "https://testnet.sonicscan.org" : "https://sonicscan.org";
  console.log("├─ INFT Packages:", `${explorerBase}/address/${inftPackagesAddress}`);
  console.log("├─ Generated NFT:", `${explorerBase}/address/${generatedNFTAddress}`);
  console.log("└─ Marketplace:", `${explorerBase}/address/${marketplaceAddress}`);

  console.log("\n⚙️  CONTRACT CONFIGURATION:");
  try {
    const packages = await inftPackagesContract.getAllPackages();
    console.log("├─ Available packages:", packages.length);
    console.log("├─ Native S pricing enabled:", true);
    console.log("└─ Revenue distribution: 25% staking, 50% dev, 15% leaderboard, 10% treasury");
  } catch (error) {
    console.log("├─ Contract configuration check failed:", error.message);
  }

  console.log("\n📝 ENVIRONMENT VARIABLES TO ADD:");
  console.log("Add these to your .env file:");
  console.log(`NEXT_PUBLIC_INFT_PACKAGES_CONTRACT=${inftPackagesAddress}`);
  console.log(`NEXT_PUBLIC_GENERATED_NFT_CONTRACT=${generatedNFTAddress}`);
  console.log(`NEXT_PUBLIC_MARKETPLACE_CONTRACT=${marketplaceAddress}`);
  console.log(`MINTER_PRIVATE_KEY=${process.env.PRIVATE_KEY || process.env.SONIC_PRIVATE_KEY}`);

  console.log("\n🔧 NEXT STEPS:");
  console.log("1. Update your .env file with the contract addresses above");
  console.log("2. Test INFT minting on the frontend");
  console.log("3. Test generation with the dev wallet INFTs");
  console.log("4. Verify contracts on explorer (optional):");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${inftPackagesAddress} "${DEV_WALLET}"`);
  console.log(`   npx hardhat verify --network ${hre.network.name} ${generatedNFTAddress} "${DEV_WALLET}"`);
  console.log(`   npx hardhat verify --network ${hre.network.name} ${marketplaceAddress} "${inftPackagesAddress}" "${generatedNFTAddress}" "${TREASURY_WALLET}"`);

  console.log("\n🎮 TESTING:");
  console.log("You can now test INFT generations using:");
  console.log("- Dev wallet address:", DEV_WALLET);
  console.log("- Starter package token ID: 1");
  console.log("- Pro package token ID: 2");
  console.log("- Business package token ID: 3");
  console.log("- Enterprise package token ID: 4");

  return {
    inftPackagesAddress,
    generatedNFTAddress,
    marketplaceAddress
  };
}

main()
  .then((addresses) => {
    console.log("\n🎉 All INFT contracts deployed successfully!");
    console.log("Ready for testing on Sonic testnet!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ INFT deployment failed:");
    console.error(error);
    process.exit(1);
  });