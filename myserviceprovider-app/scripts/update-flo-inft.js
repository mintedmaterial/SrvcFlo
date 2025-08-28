const { ethers } = require("hardhat");
const crypto = require('crypto');

async function main() {
    console.log("🎯 Updating Token #1 to be 'Flo' Agent iNFT...");

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
        // Connect to our deployed ERC-7857 contract
        const ERC7857VerifiableINFT = await ethers.getContractFactory("Contracts/ERC7857VerifiableINFTTestnet.sol:ERC7857VerifiableINFT");
        const contract = ERC7857VerifiableINFT.attach(ERC7857_CONTRACT);

        // First, let's check the current state of Token #1
        console.log("\n🔍 Checking current Token #1 status...");
        try {
            const currentMetadata = await contract.getINFTMetadata(1);
            console.log("Current Token #1 Metadata:", {
                encryptedMetadataHash: currentMetadata.encryptedMetadataHash,
                packageTokenId: currentMetadata.packageTokenId.toString(),
                creator: currentMetadata.creator,
                contentType: currentMetadata.contentType,
                isVerified: currentMetadata.isVerified
            });
        } catch (error) {
            console.log("Token #1 status:", error.message);
        }

        // Create metadata for Flo Agent
        const floAgentMetadata = {
            name: "Flo",
            type: "intelligent-agent",
            category: "virtual-assistant",
            version: "1.0.0",
            description: "Flo is ServiceFlow AI's flagship intelligent agent - a versatile AI assistant specialized in business automation and service workflow optimization",
            image: "https://api.srvcflo.com/brand/Flo.PNG",
            animation_url: "https://api.srvcflo.com/brand/Flo.mp4",
            capabilities: [
                "Business process automation",
                "Service workflow optimization", 
                "Customer service automation",
                "Multi-platform integration",
                "Real-time analytics and reporting",
                "Intelligent task routing",
                "Automated content generation",
                "Cross-platform communication"
            ],
            personality: {
                traits: ["Professional", "Efficient", "Helpful", "Innovative"],
                communicationStyle: "Clear, concise, business-focused",
                expertise: ["Service businesses", "Workflow automation", "Process optimization"]
            },
            technicalSpecs: {
                aiModel: "Multi-provider orchestration",
                platforms: ["Cloudflare Workers", "ServiceFlow AI"],
                integrations: ["OpenAI", "Cloudflare AI", "Google Gemini"],
                deployment: "Distributed edge computing"
            },
            branding: {
                primaryColor: "#FF91E0", // Pink from logo
                secondaryColor: "#2B91FF", // Blue from logo  
                logoUrl: "https://api.srvcflo.com/brand/Flo.PNG",
                videoUrl: "https://api.srvcflo.com/brand/Flo.mp4"
            },
            attributes: [
                {
                    trait_type: "Agent Type",
                    value: "Virtual Assistant"
                },
                {
                    trait_type: "Specialization", 
                    value: "Service Business Automation"
                },
                {
                    trait_type: "AI Provider",
                    value: "Multi-Provider"
                },
                {
                    trait_type: "Deployment",
                    value: "Cloudflare Edge"
                },
                {
                    trait_type: "Version",
                    value: "1.0.0"
                },
                {
                    trait_type: "Rarity",
                    value: "Genesis Agent"
                }
            ],
            external_url: "https://srvcflo.com/agents/flo",
            created: new Date().toISOString(),
            creator: deployer.address,
            isGenesis: true, // First official ServiceFlow AI agent
            serviceFlowOfficial: true
        };

        // Create encrypted metadata hash 
        const metadataString = JSON.stringify(floAgentMetadata, null, 2);
        const metadataHash = crypto.createHash('sha256').update(metadataString).digest('hex');
        const encryptedMetadataHash = `QmFlo${metadataHash.substring(0, 40)}Genesis`;
        
        // Create proof hash for Flo agent verification
        const proofData = {
            agentName: "Flo",
            agentType: "genesis-virtual-assistant",
            isOfficial: true,
            serviceFlowBranded: true,
            brandAssets: ["Flo.PNG", "Flo.mp4"],
            timestamp: Date.now(),
            creator: deployer.address,
            tokenId: 1
        };
        const proofHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(proofData)));

        console.log("\n🎨 Flo Agent Metadata:");
        console.log("Name:", floAgentMetadata.name);
        console.log("Type:", floAgentMetadata.type);
        console.log("Capabilities:", floAgentMetadata.capabilities.length);
        console.log("Image URL:", floAgentMetadata.image);
        console.log("Animation URL:", floAgentMetadata.animation_url);
        console.log("Encrypted Metadata Hash:", encryptedMetadataHash);
        console.log("Proof Hash:", proofHash);

        // Update Token #1 metadata to be Flo agent
        console.log("\n🔄 Updating Token #1 to be Flo Agent...");
        
        try {
            const updateTx = await contract.updateINFTMetadata(
                1,                          // tokenId (Token #1)
                encryptedMetadataHash,      // new encrypted metadata hash
                proofHash                   // new proof hash
            );

            const receipt = await updateTx.wait();
            console.log("✅ Token #1 updated to Flo Agent! Transaction hash:", receipt.hash);
            
            // Verify the update
            const updatedMetadata = await contract.getINFTMetadata(1);
            console.log("\n📊 Updated Flo Agent iNFT (Token #1):");
            console.log({
                tokenId: "1",
                encryptedMetadataHash: updatedMetadata.encryptedMetadataHash,
                packageTokenId: updatedMetadata.packageTokenId.toString(),
                creator: updatedMetadata.creator,
                contentType: updatedMetadata.contentType,
                isVerified: updatedMetadata.isVerified,
                mintedAt: new Date(Number(updatedMetadata.mintedAt) * 1000).toISOString()
            });
            
            console.log("\n🌟 SUCCESS! Token #1 is now the official 'Flo' Agent iNFT!");
            console.log("🔗 View Transaction: https://sonicscan.org/tx/" + receipt.hash);
            console.log("🔗 View Flo iNFT: https://sonicscan.org/token/" + ERC7857_CONTRACT + "/1");
            
            console.log("\n🎭 Flo Agent Features:");
            floAgentMetadata.capabilities.forEach((cap, i) => {
                console.log(`   ${i + 1}. ${cap}`);
            });

            console.log("\n🎨 Brand Assets:");
            console.log("   • Logo: Flo.PNG");
            console.log("   • Animation: Flo.mp4");
            console.log("   • Primary Color: " + floAgentMetadata.branding.primaryColor);
            console.log("   • Secondary Color: " + floAgentMetadata.branding.secondaryColor);

            return {
                success: true,
                tokenId: "1",
                transactionHash: receipt.hash,
                contractAddress: ERC7857_CONTRACT,
                agentName: "Flo",
                agentType: "genesis-virtual-assistant",
                isGenesis: true
            };

        } catch (updateError) {
            console.error("❌ Failed to update Token #1:", updateError.message);
            
            // If update fails, let's try to mint a new Flo agent instead
            console.log("\n🔄 Update failed, trying to mint new Flo agent...");
            
            const mintTx = await contract.mintVerifiableINFT(
                deployer.address,               // to (recipient)
                encryptedMetadataHash,          // encryptedMetadataHash
                proofHash,                      // proofHash
                1,                              // packageTokenId (Starter package for Flo)
                "genesis-agent"                 // contentType
            );

            const receipt = await mintTx.wait();
            console.log("🎉 New Flo Agent iNFT MINTED! Transaction hash:", receipt.hash);
            
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
                console.log("🏆 Flo Agent iNFT Token ID:", tokenId.toString());
                
                return {
                    success: true,
                    tokenId: tokenId.toString(),
                    transactionHash: receipt.hash,
                    contractAddress: ERC7857_CONTRACT,
                    agentName: "Flo",
                    agentType: "genesis-virtual-assistant",
                    isGenesis: true,
                    action: "minted-new"
                };
            }
        }

    } catch (error) {
        console.error("❌ Flo Agent iNFT operation failed:", error);
        throw error;
    }
}

// Execute
if (require.main === module) {
    main()
        .then((result) => {
            if (result.success) {
                console.log("\n🎉 Flo Agent iNFT operation completed successfully!");
                console.log("Token ID:", result.tokenId);
                console.log("Agent Name: Flo");
                console.log("Type: Genesis Virtual Assistant");
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n💥 Flo Agent iNFT operation failed:", error);
            process.exit(1);
        });
}

module.exports = main;