const { ethers } = require("hardhat");
const crypto = require('crypto');

async function main() {
    console.log("🎯 Updating Token #1 to be 'Flo' Agent...");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Updating with account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "S");

    // ERC-7857 Contract Address (from our deployment)
    const ERC7857_CONTRACT = "0x5D2258896b74e972115b7CB189137c4f9F1446d4";
    
    console.log("📄 Using ERC-7857 Contract:", ERC7857_CONTRACT);

    try {
        // Connect to our deployed ERC-7857 contract using correct artifact path
        const ERC7857VerifiableINFT = await ethers.getContractFactory("Contracts/ERC7857VerifiableINFTTestnet.sol:ERC7857VerifiableINFT");
        const contract = ERC7857VerifiableINFT.attach(ERC7857_CONTRACT);

        // Check current Token #1 status
        console.log("\n🔍 Checking current Token #1 status...");
        try {
            const currentMetadata = await contract.getINFTMetadata(1);
            console.log("✅ Token #1 exists with current metadata:");
            console.log("   Encrypted Hash:", currentMetadata.encryptedMetadataHash);
            console.log("   Package Token ID:", currentMetadata.packageTokenId.toString());
            console.log("   Creator:", currentMetadata.creator);
            console.log("   Content Type:", currentMetadata.contentType);
            console.log("   Is Verified:", currentMetadata.isVerified);
            
            // Check if we own this token
            const owner = await contract.ownerOf(1);
            console.log("   Current Owner:", owner);
            console.log("   Are we owner?", owner.toLowerCase() === deployer.address.toLowerCase());
            
        } catch (error) {
            console.error("❌ Token #1 check failed:", error.message);
            return { success: false, error: "Token #1 does not exist or is not accessible" };
        }

        // Create Flo agent metadata 
        const floMetadata = {
            name: "Flo",
            description: "Flo is ServiceFlow AI's flagship intelligent virtual assistant agent, specialized in business automation and service workflow optimization.",
            image: "https://api.srvcflo.com/brand/Flo.PNG", 
            animation_url: "https://api.srvcflo.com/brand/Flo.mp4",
            external_url: "https://srvcflo.com/agents/flo",
            attributes: [
                {
                    trait_type: "Agent Name",
                    value: "Flo"
                },
                {
                    trait_type: "Agent Type", 
                    value: "Virtual Assistant"
                },
                {
                    trait_type: "Specialization",
                    value: "Business Automation"
                },
                {
                    trait_type: "Platform",
                    value: "ServiceFlow AI"
                },
                {
                    trait_type: "Rarity",
                    value: "Genesis Agent"
                },
                {
                    trait_type: "Version",
                    value: "1.0.0"
                }
            ],
            properties: {
                agent_type: "virtual-assistant",
                specialization: "business-automation", 
                capabilities: [
                    "Business process automation",
                    "Service workflow optimization",
                    "Customer service automation", 
                    "Multi-platform integration",
                    "Real-time analytics",
                    "Intelligent task routing"
                ],
                brand_colors: {
                    primary: "#FF91E0",
                    secondary: "#2B91FF"
                },
                is_genesis: true,
                is_official: true,
                serviceflow_branded: true
            },
            created_by: "ServiceFlow AI",
            token_id: 1,
            contract_address: ERC7857_CONTRACT,
            blockchain: "Sonic",
            standard: "ERC-7857"
        };

        // Create new encrypted metadata hash for Flo
        const metadataString = JSON.stringify(floMetadata, null, 2);
        const metadataHash = crypto.createHash('sha256').update(metadataString).digest('hex');
        const floEncryptedHash = `QmFloGenesis${metadataHash.substring(0, 32)}Official`;
        
        // Create new proof hash for Flo verification
        const floProofData = {
            agentName: "Flo",
            tokenId: 1,
            isGenesis: true,
            isOfficial: true,
            serviceFlowBranded: true,
            brandAssets: {
                image: "Flo.PNG", 
                animation: "Flo.mp4"
            },
            capabilities: floMetadata.properties.capabilities.length,
            timestamp: Date.now(),
            updater: deployer.address
        };
        const floProofHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(floProofData)));

        console.log("\n🎨 Flo Agent Details:");
        console.log("   Name: Flo");
        console.log("   Type: Genesis Virtual Assistant Agent");
        console.log("   Image: https://api.srvcflo.com/brand/Flo.PNG");
        console.log("   Animation: https://api.srvcflo.com/brand/Flo.mp4");
        console.log("   Capabilities:", floMetadata.properties.capabilities.length);
        console.log("   New Encrypted Hash:", floEncryptedHash);

        // Update Token #1 metadata to Flo
        console.log("\n🔄 Updating Token #1 metadata to Flo Agent...");
        
        const updateTx = await contract.updateMetadata(
            1,                  // tokenId = 1
            floEncryptedHash,   // new encrypted metadata hash for Flo
            floProofHash        // new proof hash for Flo
        );

        console.log("⏳ Transaction submitted, waiting for confirmation...");
        const receipt = await updateTx.wait();
        console.log("✅ Token #1 successfully updated to Flo Agent!");
        console.log("   Transaction Hash:", receipt.hash);

        // Set Token URI for Token #1 to point to Flo metadata
        console.log("\n🖼️ Setting Token #1 URI for Flo...");
        try {
            // Create a metadata URI that will resolve to Flo's data
            const floTokenURI = `https://api.srvcflo.com/metadata/inft/flo/1`;
            
            const setURITx = await contract.setTokenURI(1, floTokenURI);
            const uriReceipt = await setURITx.wait();
            console.log("✅ Token #1 URI set successfully!");
            console.log("   URI Transaction Hash:", uriReceipt.hash);
            console.log("   Token URI:", floTokenURI);
        } catch (uriError) {
            console.log("⚠️  Note: Token URI setting may require different approach:", uriError.message);
        }

        // Verify the update
        console.log("\n🔍 Verifying Token #1 Flo update...");
        const updatedMetadata = await contract.getINFTMetadata(1);
        console.log("✅ Updated Token #1 (Flo Agent) metadata:");
        console.log("   Token ID: 1");
        console.log("   Encrypted Hash:", updatedMetadata.encryptedMetadataHash);
        console.log("   Package Token ID:", updatedMetadata.packageTokenId.toString());
        console.log("   Creator:", updatedMetadata.creator);
        console.log("   Content Type:", updatedMetadata.contentType);
        console.log("   Is Verified:", updatedMetadata.isVerified);
        console.log("   Last Verified:", new Date(Number(updatedMetadata.lastVerified) * 1000).toISOString());

        // Check token URI
        try {
            const tokenURI = await contract.tokenURI(1);
            console.log("   Token URI:", tokenURI);
        } catch (error) {
            console.log("   Token URI: Not set or error accessing");
        }

        console.log("\n🎉 SUCCESS! Token #1 is now officially the 'Flo' Agent iNFT!");
        console.log("🔗 View on Sonic Explorer:");
        console.log("   Transaction: https://sonicscan.org/tx/" + receipt.hash);
        console.log("   Token: https://sonicscan.org/token/" + ERC7857_CONTRACT + "/1");
        console.log("   Contract: https://sonicscan.org/address/" + ERC7857_CONTRACT);

        console.log("\n🎭 Flo Agent Capabilities:");
        floMetadata.properties.capabilities.forEach((cap, i) => {
            console.log(`   ${i + 1}. ${cap}`);
        });

        return {
            success: true,
            tokenId: 1,
            agentName: "Flo",
            transactionHash: receipt.hash,
            contractAddress: ERC7857_CONTRACT,
            encryptedMetadataHash: floEncryptedHash,
            isGenesis: true,
            isOfficial: true
        };

    } catch (error) {
        console.error("❌ Flo update failed:", error);
        throw error;
    }
}

// Execute update
if (require.main === module) {
    main()
        .then((result) => {
            if (result.success) {
                console.log("\n🎊 Token #1 'Flo' Agent update completed successfully!");
                console.log("🤖 Flo is now live as an official ServiceFlow AI iNFT!");
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n💥 Flo update failed:", error);
            process.exit(1);
        });
}

module.exports = main;