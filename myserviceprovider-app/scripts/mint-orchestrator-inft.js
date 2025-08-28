const { ethers } = require("hardhat");
const crypto = require('crypto');

async function main() {
    console.log("🎯 Minting iNFT for Multi-Provider AI Orchestrator Agent...");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Minting with account:", deployer.address);
    
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

        // Create metadata for Multi-Provider AI Orchestrator Agent
        const agentMetadata = {
            name: "Multi-Provider AI Orchestrator",
            type: "intelligent-agent",
            category: "ai-orchestration",
            version: "1.0.0",
            description: "Intelligent routing and management for multiple AI providers: OpenAI, Cloudflare AI, Google Gemini",
            capabilities: [
                "Multi-provider AI routing",
                "Intelligent provider selection",
                "Automatic failover and retry logic", 
                "Performance tracking and optimization",
                "Cost management and optimization",
                "Quality assessment and provider ranking",
                "Real-time provider switching"
            ],
            supportedProviders: [
                {
                    name: "OpenAI",
                    models: ["GPT-4", "GPT-5", "DALL-E-3"],
                    modalities: ["text", "image"]
                },
                {
                    name: "Cloudflare AI", 
                    models: ["Flux", "Stable Diffusion", "Llama"],
                    modalities: ["text", "image"]
                },
                {
                    name: "Google Gemini",
                    models: ["Gemini Pro", "Gemini Ultra", "Vision API"],
                    modalities: ["text", "image", "video"]
                }
            ],
            features: {
                intelligentRouting: true,
                costOptimization: true,
                qualityAssessment: true,
                performanceTracking: true,
                automaticFailover: true,
                multiModalGeneration: true
            },
            packageRequirement: "Pro", // Requires Pro package or higher
            technicalSpecs: {
                language: "TypeScript",
                framework: "Cloudflare Workers",
                apiIntegrations: ["OpenAI API", "Cloudflare AI API", "Google Gemini API"],
                deployment: "Cloudflare Workers with Durable Objects"
            },
            created: new Date().toISOString(),
            creator: deployer.address,
            agentContractPath: "src/multi-provider-ai-orchestrator.ts"
        };

        // Create encrypted metadata hash (in production this would be properly encrypted)
        const metadataString = JSON.stringify(agentMetadata, null, 2);
        const metadataHash = crypto.createHash('sha256').update(metadataString).digest('hex');
        const encryptedMetadataHash = `QmOrchestrator${metadataHash.substring(0, 32)}`;
        
        // Create proof hash for verification
        const proofData = {
            agentType: "multi-provider-orchestrator",
            capabilities: agentMetadata.capabilities.length,
            providers: agentMetadata.supportedProviders.length,
            timestamp: Date.now(),
            creator: deployer.address
        };
        const proofHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(proofData)));

        console.log("\n🤖 Agent Metadata:");
        console.log("Name:", agentMetadata.name);
        console.log("Capabilities:", agentMetadata.capabilities.length);
        console.log("Supported Providers:", agentMetadata.supportedProviders.map(p => p.name).join(", "));
        console.log("Encrypted Metadata Hash:", encryptedMetadataHash);
        console.log("Proof Hash:", proofHash);

        // Mint the iNFT representing our AI Orchestrator Agent
        console.log("\n🎨 Minting Multi-Provider AI Orchestrator iNFT...");
        
        const mintTx = await contract.mintVerifiableINFT(
            deployer.address,                    // to (recipient)
            encryptedMetadataHash,              // encryptedMetadataHash
            proofHash,                          // proofHash
            2,                                  // packageTokenId (Pro package)
            "intelligent-agent"                 // contentType
        );

        const receipt = await mintTx.wait();
        console.log("🎉 AI Orchestrator iNFT MINTED! Transaction hash:", receipt.hash);
        
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
            console.log("🏆 Multi-Provider AI Orchestrator iNFT Token ID:", tokenId.toString());
            
            // Test metadata retrieval
            const metadata = await contract.getINFTMetadata(tokenId);
            console.log("\n📊 AI Orchestrator iNFT Metadata:");
            console.log({
                tokenId: tokenId.toString(),
                encryptedMetadataHash: metadata.encryptedMetadataHash,
                packageTokenId: metadata.packageTokenId.toString(),
                creator: metadata.creator,
                contentType: metadata.contentType,
                isVerified: metadata.isVerified,
                mintedAt: new Date(Number(metadata.mintedAt) * 1000).toISOString()
            });
            
            console.log("\n🌟 SUCCESS! Multi-Provider AI Orchestrator is now a Verifiable iNFT!");
            console.log("🔗 View Transaction: https://sonicscan.org/tx/" + receipt.hash);
            console.log("🔗 View iNFT: https://sonicscan.org/token/" + ERC7857_CONTRACT + "/" + tokenId.toString());
            
            console.log("\n💡 This iNFT represents your AI Orchestrator agent with capabilities:");
            agentMetadata.capabilities.forEach((cap, i) => {
                console.log(`   ${i + 1}. ${cap}`);
            });

            return {
                success: true,
                tokenId: tokenId.toString(),
                transactionHash: receipt.hash,
                contractAddress: ERC7857_CONTRACT,
                agentName: agentMetadata.name,
                agentType: "multi-provider-orchestrator"
            };

        } else {
            console.error("❌ Could not find mint event in transaction logs");
            return { success: false, error: "Mint event not found" };
        }

    } catch (error) {
        console.error("❌ AI Orchestrator iNFT minting failed:", error);
        throw error;
    }
}

// Execute minting
if (require.main === module) {
    main()
        .then((result) => {
            if (result.success) {
                console.log("\n🎉 Multi-Provider AI Orchestrator iNFT minting completed successfully!");
                console.log("Token ID:", result.tokenId);
                console.log("Agent Type:", result.agentType);
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n💥 AI Orchestrator iNFT minting failed:", error);
            process.exit(1);
        });
}

module.exports = main;