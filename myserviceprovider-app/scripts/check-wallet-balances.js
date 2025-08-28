const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔍 CHECKING WALLET BALANCES ON SONIC TESTNET");
  console.log("=" .repeat(60));
  
  const [deployer] = await ethers.getSigners();
  const walletAddress = deployer.address;
  
  console.log("Wallet Address:", walletAddress);
  console.log("Network:", "Sonic Blaze Testnet (57054)");
  
  // Check native balance
  const nativeBalance = await ethers.provider.getBalance(walletAddress);
  console.log("\n💰 NATIVE BALANCE:");
  console.log("Native S:", ethers.formatEther(nativeBalance), "S");
  
  // Token addresses to check
  const tokens = {
    "SSStt": "0xc777Fa50186362fe0EF9CCD579b6385cE7CB49f1",
    "wS Token": "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38", 
    "USDC": "0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6",
    "Test NFT": "0x2DBFB3F4506aD4A205DAF8e319759e0E13e5A504"
  };
  
  console.log("\n🪙 TOKEN BALANCES:");
  console.log("-".repeat(40));
  
  for (const [name, address] of Object.entries(tokens)) {
    try {
      if (name === "Test NFT") {
        // ERC721 balance
        const nftContract = await ethers.getContractAt("TestBanditKidzNFT", address);
        const balance = await nftContract.balanceOf(walletAddress);
        console.log(`${name}:`, balance.toString(), "NFTs");
        
        if (balance > 0) {
          console.log(`  → You own ${balance} Test BanditKidz NFTs`);
        }
      } else {
        // ERC20 balance
        const tokenContract = await ethers.getContractAt("IERC20", address);
        
        try {
          const balance = await tokenContract.balanceOf(walletAddress);
          const decimals = await tokenContract.decimals();
          const symbol = await tokenContract.symbol();
          
          const formattedBalance = ethers.formatUnits(balance, decimals);
          console.log(`${name} (${symbol}):`, formattedBalance, symbol);
          
          if (parseFloat(formattedBalance) > 0) {
            console.log(`  ✅ You have ${formattedBalance} ${symbol} tokens`);
          } else {
            console.log(`  ⚠️  No ${symbol} balance`);
          }
        } catch (error) {
          console.log(`${name}:`, "❌ Failed to fetch balance -", error.message);
        }
      }
    } catch (error) {
      console.log(`${name}:`, "❌ Contract error -", error.message);
    }
  }
  
  console.log("\n🔗 EXPLORER LINKS:");
  console.log("-".repeat(40));
  console.log("Wallet:", `https://testnet.sonicscan.org/address/${walletAddress}`);
  console.log("SSStt Token:", `https://testnet.sonicscan.org/token/${tokens["SSStt"]}`);
  
  console.log("\n💡 TROUBLESHOOTING:");
  console.log("-".repeat(40));
  console.log("If balances show 0 but you have tokens:");
  console.log("1. Check if token addresses are correct");
  console.log("2. Verify you're on Sonic Blaze Testnet (Chain ID: 57054)");
  console.log("3. Check explorer links above to confirm token exists");
  console.log("4. Try importing tokens manually in your wallet");
}

main()
  .then(() => {
    console.log("\n✅ Balance check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Balance check failed:");
    console.error(error);
    process.exit(1);
  });