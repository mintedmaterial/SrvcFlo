const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking Token #1 status...");

    const [deployer] = await ethers.getSigners();
    console.log("Checking with account:", deployer.address);

    const ERC7857_CONTRACT = "0x5D2258896b74e972115b7CB189137c4f9F1446d4";
    console.log("Contract:", ERC7857_CONTRACT);

    try {
        const ERC7857VerifiableINFT = await ethers.getContractFactory("Contracts/ERC7857VerifiableINFTTestnet.sol:ERC7857VerifiableINFT");
        const contract = ERC7857VerifiableINFT.attach(ERC7857_CONTRACT);

        // Check if Token #1 exists
        try {
            const owner = await contract.ownerOf(1);
            console.log("✅ Token #1 exists!");
            console.log("Owner:", owner);
            console.log("Are we owner?", owner.toLowerCase() === deployer.address.toLowerCase());

            // Get metadata
            const metadata = await contract.getINFTMetadata(1);
            console.log("\nCurrent metadata:");
            console.log("   Encrypted Hash:", metadata.encryptedMetadataHash);
            console.log("   Package Token ID:", metadata.packageTokenId.toString());
            console.log("   Creator:", metadata.creator);
            console.log("   Content Type:", metadata.contentType);
            console.log("   Is Verified:", metadata.isVerified);

            // Try to get token URI
            try {
                const uri = await contract.tokenURI(1);
                console.log("   Token URI:", uri);
            } catch (uriError) {
                console.log("   Token URI: Not set");
            }

        } catch (error) {
            console.log("❌ Token #1 does not exist or error:", error.message);
        }

        // Check contract info
        const name = await contract.name();
        const symbol = await contract.symbol();
        console.log("\nContract info:");
        console.log("   Name:", name);
        console.log("   Symbol:", symbol);

    } catch (error) {
        console.error("❌ Contract check failed:", error);
    }
}

main().catch(console.error);