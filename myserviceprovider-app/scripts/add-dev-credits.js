const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x938C1812C7C142eAaB72586227dBe3D3869709E1";
  const devWalletAddress = "0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8";
  
  const SonicCreditSystem = await ethers.getContractFactory("SonicCreditSystem");
  const creditSystem = SonicCreditSystem.attach(contractAddress);
  
  console.log("Adding 10000 test credits to dev wallet...");
  const tx = await creditSystem.addCreditsToUser(devWalletAddress, 10000);
  await tx.wait();
  
  const credits = await creditSystem.getUserCredits(devWalletAddress);
  console.log("Dev wallet now has", credits.toString(), "credits");
}

main().catch(console.error);
EOF < /dev/null
