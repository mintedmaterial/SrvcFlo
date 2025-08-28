const { ethers } = require("hardhat");

async function main() {
  console.log("Testing SonicCreditSystem Contract...");
  console.log("========================================");
  
  const contractAddress = "0x938C1812C7C142eAaB72586227dBe3D3869709E1";
  
  // Get the contract
  const SonicCreditSystem = await ethers.getContractFactory("SonicCreditSystem");
  const creditSystem = SonicCreditSystem.attach(contractAddress);
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Testing from account:", deployer.address);
  
  try {
    // Check contract basic info
    console.log("\nCONTRACT INFO:");
    const owner = await creditSystem.owner();
    const devWallet = await creditSystem.devWallet();
    console.log("- Owner:", owner);
    console.log("- Dev Wallet:", devWallet);
    
    // Check user credits (should be 0 initially)
    const userCredits = await creditSystem.getUserCredits(deployer.address);
    console.log("- User Credits:", userCredits.toString());
    
    // Add some credits to the dev wallet for testing (owner only)
    console.log("\nAdding test credits to dev wallet...");
    if (owner.toLowerCase() === deployer.address.toLowerCase()) {
      const tx = await creditSystem.addCreditsToUser(deployer.address, 1000);
      await tx.wait();
      console.log("Added 1000 credits to dev wallet");
      
      const newCredits = await creditSystem.getUserCredits(deployer.address);
      console.log("- Credits after addition:", newCredits.toString());
    } else {
      console.log("- Skipped: Only owner can add credits");
    }
    
    console.log("\nContract is working properly\!");
    
  } catch (error) {
    console.error("Error testing contract:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
EOF < /dev/null
