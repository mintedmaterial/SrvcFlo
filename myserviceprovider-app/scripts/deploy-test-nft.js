const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Deploying Test NFT for Staking Testing...");
  console.log("Network:", hre.network.name);
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "S");

  console.log("\n" + "=".repeat(50));
  console.log("DEPLOYING TEST BANDITKIDZ NFT CONTRACT");
  console.log("=".repeat(50));

  // Deploy Test NFT Contract
  const TestNFT = await ethers.getContractFactory("TestBanditKidzNFT");
  console.log("Deploying TestBanditKidzNFT contract...");
  
  const testNFT = await TestNFT.deploy();
  await testNFT.waitForDeployment();
  const testNFTAddress = await testNFT.getAddress();
  
  console.log("✅ TestBanditKidzNFT deployed to:", testNFTAddress);
  console.log("Transaction hash:", testNFT.deploymentTransaction().hash);

  // Mint some test NFTs to the deployer for testing
  console.log("\nMinting test NFTs for testing...");
  
  try {
    const mintTx = await testNFT.mintBatch(deployer.address, 5);
    await mintTx.wait();
    console.log("✅ Minted 5 test NFTs to deployer address");
    
    const totalSupply = await testNFT.totalSupply();
    console.log("Total NFTs minted:", totalSupply.toString());
  } catch (error) {
    console.log("⚠️  Minting failed (check if OpenZeppelin is installed):", error.message);
  }

  console.log("\n" + "=".repeat(50));
  console.log("TEST NFT DEPLOYMENT COMPLETED!");
  console.log("=".repeat(50));
  
  console.log("\n📋 CONTRACT ADDRESS:");
  console.log("└─ Test BanditKidz NFT:", testNFTAddress);
  
  console.log("\n🔗 EXPLORER LINK:");
  console.log("└─ https://testnet.sonicscan.org/address/" + testNFTAddress);

  console.log("\n📝 NEXT STEPS:");
  console.log("1. Update your staking contract to use this NFT address");
  console.log("2. Update your frontend to use this test NFT contract");
  console.log("3. Mint NFTs to test addresses:");
  console.log(`   npx hardhat run scripts/mint-test-nfts.js --network sonicTestnet`);

  return {
    testNFTAddress
  };
}

main()
  .then((addresses) => {
    console.log("\n🎉 Test NFT contract deployed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });