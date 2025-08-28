const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying NFT contracts to Sonic Testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the Generated Art NFT contract first
  console.log("\n📦 Deploying GeneratedArtNFT contract...");
  const GeneratedArtNFT = await ethers.getContractFactory("GeneratedArtNFT");
  const nftContract = await GeneratedArtNFT.deploy();
  await nftContract.deployed();
  console.log("✅ GeneratedArtNFT deployed to:", nftContract.address);

  // Get existing contract addresses
  const paymentContractAddress = process.env.NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_TESTNET || "0xAc917767E063A7b7Bc52ae02E019a282188F6CAd";
  const stakingContractAddress = process.env.NEXT_PUBLIC_BANDIT_KIDZ_STAKING_CONTRACT_TESTNET || "0x93d00036b8040005B4AF73b3A404F8bec4fD6B87";
  const coralTokenAddress = "0xAF93888cbD250300470A1618206e036E11470149"; // CORAL token address
  
  // Deploy the Enhanced Payment contract with NFT support
  console.log("\n📦 Deploying SonicPaymentTestnetWithNFT contract...");
  const SonicPaymentTestnetWithNFT = await ethers.getContractFactory("SonicPaymentTestnetWithNFT");
  const enhancedPaymentContract = await SonicPaymentTestnetWithNFT.deploy(
    stakingContractAddress,
    deployer.address, // Dev wallet
    coralTokenAddress,
    nftContract.address
  );
  await enhancedPaymentContract.deployed();
  console.log("✅ SonicPaymentTestnetWithNFT deployed to:", enhancedPaymentContract.address);

  // Authorize the payment contract to mint NFTs
  console.log("\n🔐 Authorizing payment contract to mint NFTs...");
  const authorizeTx = await nftContract.setAuthorizedMinter(enhancedPaymentContract.address, true);
  await authorizeTx.wait();
  console.log("✅ Payment contract authorized to mint NFTs");

  // Verify contracts are properly linked
  console.log("\n🔍 Verifying contract linkage...");
  const nftContractFromPayment = await enhancedPaymentContract.getNFTContract();
  console.log("NFT contract address from payment contract:", nftContractFromPayment);
  
  if (nftContractFromPayment.toLowerCase() === nftContract.address.toLowerCase()) {
    console.log("✅ Contracts are properly linked!");
  } else {
    console.log("❌ Contract linkage failed!");
  }

  // Display deployment summary
  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("=====================================");
  console.log("GeneratedArtNFT:           ", nftContract.address);
  console.log("SonicPaymentTestnetWithNFT:", enhancedPaymentContract.address);
  console.log("Deployer:                  ", deployer.address);
  console.log("Network:                   ", "Sonic Testnet");
  
  console.log("\n🔧 ENVIRONMENT VARIABLES TO UPDATE:");
  console.log("=====================================");
  console.log(`NEXT_PUBLIC_NFT_CONTRACT_TESTNET=${nftContract.address}`);
  console.log(`NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_TESTNET=${enhancedPaymentContract.address}`);
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nTo verify contracts on Sonic Testnet explorer:");
  console.log(`https://testnet.sonicscan.org/address/${nftContract.address}`);
  console.log(`https://testnet.sonicscan.org/address/${enhancedPaymentContract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });