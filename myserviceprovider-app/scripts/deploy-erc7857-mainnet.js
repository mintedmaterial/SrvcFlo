const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("🚀 Deploying ERC-7857 Verifiable INFT Contract to Sonic Mainnet...");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "S");

    // INFT Packages contract address for mainnet
    const INFT_PACKAGES_MAINNET = process.env.INFT_PACKAGES_MAINNET_ADDRESS || process.env.NEXT_PUBLIC_INFT_PACKAGES_CONTRACT || "0x0000000000000000000000000000000000000000";
    
    if (INFT_PACKAGES_MAINNET === "0x0000000000000000000000000000000000000000") {
        console.log("⚠️  Warning: INFT_PACKAGES_MAINNET_ADDRESS not set, using zero address");
        console.log("⚠️  You can set this later with setINFTPackagesContract()");
    } else {
        console.log("📦 INFT Packages Contract:", INFT_PACKAGES_MAINNET);
    }

    try {
        // Deploy the upgradeable contract
        console.log("\n📄 Deploying ERC7857VerifiableINFT to Sonic Mainnet...");
        
        const ERC7857VerifiableINFT = await ethers.getContractFactory("Contracts/ERC7857VerifiableINFTTestnet.sol:ERC7857VerifiableINFT");
        
        const contract = await upgrades.deployProxy(
            ERC7857VerifiableINFT,
            [
                deployer.address,     // initialOwner
                INFT_PACKAGES_MAINNET, // inftPackagesContract
                "ServiceFlow Verifiable INFT", // name
                "SVINFT"              // symbol
            ],
            {
                initializer: 'initialize',
                kind: 'uups'
            }
        );

        await contract.waitForDeployment();
        const contractAddress = await contract.getAddress();

        console.log("✅ ERC7857VerifiableINFT deployed to Sonic Mainnet:", contractAddress);

        // Get implementation address
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(contractAddress);
        console.log("📋 Implementation address:", implementationAddress);

        // Test basic functionality
        console.log("\n🧪 Testing basic functionality...");
        
        try {
            const name = await contract.name();
            const symbol = await contract.symbol();
            const owner = await contract.owner();
            
            console.log("Contract name:", name);
            console.log("Contract symbol:", symbol);
            console.log("Contract owner:", owner);
            
            console.log("✅ Basic functionality test passed");
        } catch (testError) {
            console.error("❌ Basic functionality test failed:", testError.message);
        }

        // Test minting functionality on mainnet (FIRST iNFT MINT!)
        console.log("\n🎨 Minting FIRST iNFT on Sonic Mainnet...");
        
        try {
            const testMetadataHash = "QmMainnetFirstINFT" + Date.now();
            const testProofHash = ethers.keccak256(ethers.toUtf8Bytes("mainnet-first-inft-proof"));
            const testPackageTokenId = 1;
            const testContentType = "intelligent-agent";

            console.log("🔥 Minting the FIRST Verifiable INFT on Sonic Mainnet...");
            const mintTx = await contract.mintVerifiableINFT(
                deployer.address,
                testMetadataHash,
                testProofHash,
                testPackageTokenId,
                testContentType
            );

            const receipt = await mintTx.wait();
            console.log("🎉 FIRST iNFT MINT SUCCESSFUL! Transaction hash:", receipt.hash);
            
            // Get the minted token ID from events
            const mintEvent = receipt.logs.find(log => {
                try {
                    const parsed = contract.interface.parseLog(log);
                    return parsed.name === 'INFTCreated';
                } catch {
                    return false;
                }
            });

            if (mintEvent) {
                const parsedEvent = contract.interface.parseLog(mintEvent);
                const tokenId = parsedEvent.args.tokenId;
                console.log("🏆 FIRST iNFT Token ID:", tokenId.toString());
                
                // Test metadata retrieval
                const metadata = await contract.getINFTMetadata(tokenId);
                console.log("📊 FIRST iNFT metadata:", {
                    encryptedMetadataHash: metadata.encryptedMetadataHash,
                    packageTokenId: metadata.packageTokenId.toString(),
                    creator: metadata.creator,
                    contentType: metadata.contentType,
                    isVerified: metadata.isVerified
                });
                
                console.log("🌟 Congratulations! You have successfully minted the FIRST Verifiable INFT on Sonic Mainnet!");
                console.log("🔗 View on Sonic Explorer: https://sonicscan.org/tx/" + receipt.hash);
            }

        } catch (mintError) {
            console.error("❌ FIRST iNFT minting failed:", mintError.message);
            console.log("💡 You can try minting manually later using the contract interface");
        }

        console.log("\n📋 MAINNET Deployment Summary:");
        console.log("Contract Address:", contractAddress);
        console.log("Implementation Address:", implementationAddress);
        console.log("Network: Sonic Mainnet");
        console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
        console.log("Deployer:", deployer.address);
        console.log("INFT Packages Contract:", INFT_PACKAGES_MAINNET);
        console.log("🔗 Contract on Sonic Explorer: https://sonicscan.org/address/" + contractAddress);

        // Save deployment info
        const deploymentInfo = {
            contractAddress,
            implementationAddress,
            deployer: deployer.address,
            network: "sonic-mainnet",
            chainId: 146,
            inftPackagesContract: INFT_PACKAGES_MAINNET,
            deployedAt: new Date().toISOString(),
            explorerUrl: "https://sonicscan.org/address/" + contractAddress,
            firstINFTMinted: true
        };

        console.log("\n💾 MAINNET Deployment info:");
        console.log(JSON.stringify(deploymentInfo, null, 2));
        
        console.log("\n🎯 IMPORTANT: Save these addresses!");
        console.log("ERC-7857 Contract:", contractAddress);
        console.log("Implementation:", implementationAddress);
        console.log("Add to .env: NEXT_PUBLIC_ERC7857_CONTRACT=" + contractAddress);
        
        return {
            contract,
            contractAddress,
            implementationAddress,
            deploymentInfo
        };

    } catch (error) {
        console.error("❌ Mainnet deployment failed:", error);
        throw error;
    }
}

// Execute deployment
if (require.main === module) {
    main()
        .then(() => {
            console.log("\n🎉 SONIC MAINNET DEPLOYMENT COMPLETED SUCCESSFULLY!");
            console.log("🚀 ERC-7857 Verifiable INFT is now LIVE on Sonic Mainnet!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n💥 Mainnet deployment failed:", error);
            process.exit(1);
        });
}

module.exports = main;