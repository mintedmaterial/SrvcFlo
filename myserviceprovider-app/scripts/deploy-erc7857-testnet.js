const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("🚀 Deploying ERC-7857 Verifiable INFT Contract to Testnet...");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // INFT Packages contract address (update with actual testnet address)
    const INFT_PACKAGES_TESTNET = process.env.INFT_PACKAGES_TESTNET_ADDRESS || "0x0000000000000000000000000000000000000000";
    
    if (INFT_PACKAGES_TESTNET === "0x0000000000000000000000000000000000000000") {
        console.log("⚠️  Warning: INFT_PACKAGES_TESTNET_ADDRESS not set, using zero address");
    }

    try {
        // Deploy the upgradeable contract
        console.log("\n📄 Deploying ERC7857VerifiableINFT...");
        
        const ERC7857VerifiableINFT = await ethers.getContractFactory("Contracts/ERC7857VerifiableINFTTestnet.sol:ERC7857VerifiableINFT");
        
        const contract = await upgrades.deployProxy(
            ERC7857VerifiableINFT,
            [
                deployer.address,     // initialOwner
                INFT_PACKAGES_TESTNET, // inftPackagesContract
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

        console.log("✅ ERC7857VerifiableINFT deployed to:", contractAddress);

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

        // Test minting functionality
        console.log("\n🎨 Testing INFT minting...");
        
        try {
            const testMetadataHash = "QmTestHash123456789abcdef";
            const testProofHash = ethers.keccak256(ethers.toUtf8Bytes("test-proof"));
            const testPackageTokenId = 1;
            const testContentType = "image";

            const mintTx = await contract.mintVerifiableINFT(
                deployer.address,
                testMetadataHash,
                testProofHash,
                testPackageTokenId,
                testContentType
            );

            const receipt = await mintTx.wait();
            console.log("✅ Test mint successful, transaction hash:", receipt.hash);
            
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
                console.log("🎯 Minted token ID:", tokenId.toString());
                
                // Test metadata retrieval
                const metadata = await contract.getINFTMetadata(tokenId);
                console.log("📊 Token metadata:", {
                    encryptedMetadataHash: metadata.encryptedMetadataHash,
                    packageTokenId: metadata.packageTokenId.toString(),
                    creator: metadata.creator,
                    contentType: metadata.contentType,
                    isVerified: metadata.isVerified
                });
            }

        } catch (mintError) {
            console.error("❌ Minting test failed:", mintError.message);
        }

        console.log("\n📋 Deployment Summary:");
        console.log("Contract Address:", contractAddress);
        console.log("Implementation Address:", implementationAddress);
        console.log("Network:", (await ethers.provider.getNetwork()).name);
        console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
        console.log("Deployer:", deployer.address);
        console.log("INFT Packages Contract:", INFT_PACKAGES_TESTNET);

        // Save deployment info
        const deploymentInfo = {
            contractAddress,
            implementationAddress,
            deployer: deployer.address,
            network: (await ethers.provider.getNetwork()).name,
            chainId: Number((await ethers.provider.getNetwork()).chainId),
            inftPackagesContract: INFT_PACKAGES_TESTNET,
            deployedAt: new Date().toISOString(),
            transactionHash: "Deployment successful"
        };

        console.log("\n💾 Deployment info:", JSON.stringify(deploymentInfo, null, 2));
        
        return {
            contract,
            contractAddress,
            implementationAddress,
            deploymentInfo
        };

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        throw error;
    }
}

// Execute deployment
if (require.main === module) {
    main()
        .then(() => {
            console.log("\n🎉 Deployment completed successfully!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n💥 Deployment failed:", error);
            process.exit(1);
        });
}

module.exports = main;