const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying SonicMainnetPaymentWithOracle to Sonic Mainnet...");
  console.log("=".repeat(70));

  // Mainnet addresses
  const DEPLOYMENT_CONFIG = {
    // Contract addresses
    usdc: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",           // Sonic Mainnet USDC
    creditsNFT: "0x6B57563377181967C468002Cb11566c561f8DAc6",      // Existing credits NFT
    stakingContract: "0x103ce561d5137f137c9A86670812287B1B258499", // Existing staking contract
    devWallet: "0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8",       // Dev wallet
    
    // Oracle address
    beefyOracle: "0xBC4a342B0c057501E081484A2d24e576E854F823",     // Beefy Oracle
    sTokenForOracle: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38",  // wS token (for price lookup)
    
    // Network info
    chainId: 146,
    rpcUrl: "https://rpc.soniclabs.com"
  };

  console.log("📋 Deployment Configuration:");
  console.log("- USDC Address:", DEPLOYMENT_CONFIG.usdc);
  console.log("- Credits NFT:", DEPLOYMENT_CONFIG.creditsNFT);
  console.log("- Staking Contract:", DEPLOYMENT_CONFIG.stakingContract);
  console.log("- Dev Wallet:", DEPLOYMENT_CONFIG.devWallet);
  console.log("- Beefy Oracle:", DEPLOYMENT_CONFIG.beefyOracle);
  console.log("- Chain ID:", DEPLOYMENT_CONFIG.chainId);
  console.log("");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deployer account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "S");
  
  if (balance < ethers.parseEther("0.1")) {
    console.warn("⚠️  WARNING: Low balance. Ensure you have enough S tokens for deployment.");
  }
  console.log("");

  // Deploy the contract
  console.log("📦 Deploying SonicOraclePayment...");
  const SonicPaymentOracle = await ethers.getContractFactory("SonicOraclePayment");
  
  const sonicPayment = await SonicPaymentOracle.deploy(
    deployer.address,                      // initialOwner
    DEPLOYMENT_CONFIG.usdc,                // _usdc
    DEPLOYMENT_CONFIG.creditsNFT,          // _creditsNFT
    DEPLOYMENT_CONFIG.stakingContract,     // _stakingContract
    DEPLOYMENT_CONFIG.devWallet            // _devWallet
  );

  console.log("⏳ Waiting for deployment confirmation...");
  await sonicPayment.waitForDeployment();

  console.log("");
  console.log("✅ DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(70));
  console.log("📍 Contract Address:", await sonicPayment.getAddress());
  console.log("🔗 Transaction Hash:", sonicPayment.deploymentTransaction().hash);
  console.log("⛽ Gas Used:", sonicPayment.deploymentTransaction().gasLimit?.toString());
  console.log("");

  // Verify contract configuration
  console.log("🔍 VERIFYING CONTRACT CONFIGURATION:");
  console.log("=".repeat(50));
  
  try {
    const owner = await sonicPayment.owner();
    const devWallet = await sonicPayment.devWallet();
    const stakingContract = await sonicPayment.stakingContract();
    const usdc = await sonicPayment.USDC();
    const creditsNFT = await sonicPayment.creditsNFT();
    
    console.log("- Owner:", owner);
    console.log("- Dev Wallet:", devWallet);
    console.log("- Staking Contract:", stakingContract);
    console.log("- USDC Contract:", usdc);
    console.log("- Credits NFT:", creditsNFT);
    console.log("");
    
    // Test oracle connection
    console.log("🔮 TESTING ORACLE CONNECTION:");
    console.log("=".repeat(40));
    
    try {
      const [sTokensRequired, currentPrice] = await sonicPayment.getRequiredSTokensForPackage(1);
      console.log("✅ Oracle connection successful!");
      console.log("- Current S token price:", ethers.formatEther(currentPrice), "USD");
      console.log("- S tokens required for Package 1 ($5):", ethers.formatEther(sTokensRequired), "S");
      
      const currentPriceUSD = parseFloat(ethers.formatEther(currentPrice));
      const requiredUSD = 5; // Package 1 costs $5
      const calculatedTokens = requiredUSD / currentPriceUSD;
      console.log("- Manual calculation:", calculatedTokens.toFixed(2), "S tokens");
      
    } catch (oracleError) {
      console.error("❌ Oracle connection failed:", oracleError.message);
    }
    
    console.log("");
    console.log("📦 CREDIT PACKAGES (Pre-initialized):");
    console.log("=".repeat(45));
    
    for (let i = 1; i <= 4; i++) {
      try {
        const packageInfo = await sonicPayment.getPackageWithDynamicPricing(i);
        const packageNames = ["", "Starter", "Pro", "Business", "Enterprise"];
        
        console.log(`${packageNames[i]} (Package ${i}):`);
        console.log(`  - USDC Price: ${ethers.formatUnits(packageInfo.usdcPrice, 6)} USDC`);
        console.log(`  - USD Value for S: $${ethers.formatUnits(packageInfo.usdValueForS, 6)}`);
        console.log(`  - Current S Required: ${ethers.formatEther(packageInfo.currentSTokensRequired)} S`);
        console.log(`  - USDC Credits: ${packageInfo.usdcCredits.toString()}`);
        console.log(`  - S Credits: ${packageInfo.sonicCredits.toString()} (${Math.round((packageInfo.sonicCredits / packageInfo.usdcCredits - 1) * 100)}% bonus)`);
        console.log(`  - Active: ${packageInfo.active}`);
        console.log("");
      } catch (error) {
        console.error(`❌ Failed to verify package ${i}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error("❌ Contract verification failed:", error.message);
  }

  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(50));
  console.log("");
  console.log("📝 NEXT STEPS:");
  console.log("1. Update network-config.ts:");
  const contractAddress = await sonicPayment.getAddress();
  console.log(`   PAYMENT: "${contractAddress}"`);
  console.log("");
  console.log("2. Update environment variables:");
  console.log(`   NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT=${contractAddress}`);
  console.log("");
  console.log("3. Test the widget with dynamic pricing!");
  console.log("");
  console.log("🔗 Explorer Link:");
  console.log(`https://sonicscan.org/address/${sonicPayment.address}`);

  return {
    address: sonicPayment.address,
    txHash: sonicPayment.deployTransaction.hash,
    config: DEPLOYMENT_CONFIG
  };
}

main()
  .then((result) => {
    console.log("");
    console.log("🎊 Oracle-enabled payment contract deployed successfully!");
    console.log(`📍 Address: ${result.address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("");
    console.error("💥 Deployment failed:");
    console.error(error);
    process.exit(1);
  });