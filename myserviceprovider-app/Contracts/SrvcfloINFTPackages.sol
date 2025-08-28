// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISrvcfloGeneratedNFT {
    function mintGeneration(
        address to,
        string memory prompt,
        string memory ipfsHash,
        string memory influencedCollection,
        bool isVideo,
        uint256 packageTokenId
    ) external returns (uint256);
}

interface ISrvcfloStaking {
    function distributeRewards(uint256 amount, address token) external;
}

interface IPriceOracle {
    function getTokenAmountForUSD(address token, uint256 usdAmount) external view returns (uint256);
    function getSTokenPriceUSD() external view returns (uint256); // Price in USD with 8 decimals
    function isTokenSupported(address token) external view returns (bool);
}

/// @custom:security-contact security@srvcflo.com
/// @title SrvcfloINFTPackages - ERC-7857 Intelligent NFT Packages for AI Generation
/// @dev INFT packages that contain AI agents with generation capabilities
contract SrvcfloINFTPackages is ERC721, ERC721URIStorage, ERC721Burnable, Ownable, ReentrancyGuard {

    // Package Types
    uint256 public constant STARTER_PACKAGE = 1;    // 750 generations
    uint256 public constant PRO_PACKAGE = 2;        // 8000 generations  
    uint256 public constant BUSINESS_PACKAGE = 3;   // 100000 generations
    uint256 public constant ENTERPRISE_PACKAGE = 4; // 260000 generations

    // Sonic Labs Mainnet (Chain ID 146) Payment tokens
    // Note: Native S is handled via msg.value, no token contract needed
    IERC20 public constant USDC = IERC20(0x29219dd400f2Bf60E5a23d13Be72B486D4038894); // USDC on Sonic
    IERC20 public constant wS_TOKEN = IERC20(0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38); // Wrapped S on Sonic
    // Additional tokens can be added as needed

    // Contracts
    ISrvcfloGeneratedNFT public generatedNFTContract;
    IPriceOracle public priceOracle;
    address public srvcfloStaking;
    address public devWallet;
    address[3] public leaderboardWinners;
    bool public leaderboardThresholdMet;

    // Package definitions
    struct PackageInfo {
        uint256 totalCredits;    // Total credits in package (750, 8000, 100000, 260000)
        uint256 usdPrice;        // Price in USD (scaled by 1e6 for precision)
        string packageName;
        string agentCapabilities;
        bool active;
    }
    
    // Generation costs in credits
    uint256 public constant IMAGE_GENERATION_COST = 200;      // 200 credits per image
    uint256 public constant VIDEO_GENERATION_COST = 500;      // 500 credits per video

    // INFT Package data (ERC-7857 inspired)
    struct INFTPackage {
        uint256 packageType;
        uint256 totalCredits;       // Total credits in package
        uint256 usedCredits;        // Credits consumed so far
        uint256 mintedAt;
        string agentMetadata;       // Encrypted AI agent data
        string[] collectionInfluences;
        uint256[] generatedTokenIds; // Links to ERC-1155 generated content
        mapping(address => AuthorizedUser) authorizations; // AIaaS subscriptions
    }

    // AIaaS Authorization
    struct AuthorizedUser {
        uint256 maxCredits;         // Maximum credits authorized user can consume
        uint256 usedCredits;        // Credits used by authorized user
        uint256 expiresAt;
        bool active;
    }

    // Storage
    mapping(uint256 => PackageInfo) public packages;
    mapping(uint256 => INFTPackage) public inftPackages;
    mapping(uint256 => mapping(address => AuthorizedUser)) public authorizations;
    
    uint256 private _nextTokenId = 1;
    uint256 public totalPackagesSold;

    // Events
    event PackagePurchased(address indexed buyer, uint256 indexed tokenId, uint256 packageType, string paymentToken);
    event GenerationCreated(uint256 indexed packageTokenId, uint256 indexed generatedTokenId, address indexed creator);
    event SubscriptionCreated(uint256 indexed packageTokenId, address indexed subscriber, uint256 maxGenerations, uint256 duration);
    event AgentMetadataUpdated(uint256 indexed tokenId, string newMetadata);

    constructor(
        address initialOwner,
        address _generatedNFTContract,
        address _priceOracle,
        address _srvcfloStaking,
        address _devWallet
    ) ERC721("Srvcflo INFT Packages", "SINFT") Ownable(initialOwner) {
        generatedNFTContract = ISrvcfloGeneratedNFT(_generatedNFTContract);
        priceOracle = IPriceOracle(_priceOracle);
        srvcfloStaking = _srvcfloStaking;
        devWallet = _devWallet;
        _initializePackages();
    }

    function _initializePackages() internal {
        packages[STARTER_PACKAGE] = PackageInfo({
            totalCredits: 750,        // 750 credits = ~3 images OR ~1 video
            usdPrice: 5 * 10**6,      // $5.00 USD
            packageName: "Starter AI Agent",
            agentCapabilities: "Image generation, basic styles, collection influence detection",
            active: true
        });

        packages[PRO_PACKAGE] = PackageInfo({
            totalCredits: 8000,       // 8000 credits = ~40 images OR ~16 videos
            usdPrice: 50 * 10**6,     // $50.00 USD
            packageName: "Pro AI Agent",
            agentCapabilities: "Image + video generation, advanced styles, multi-collection influence",
            active: true
        });

        packages[BUSINESS_PACKAGE] = PackageInfo({
            totalCredits: 100000,     // 100000 credits = ~500 images OR ~200 videos
            usdPrice: 500 * 10**6,    // $500.00 USD
            packageName: "Business AI Agent",
            agentCapabilities: "Full generation suite, custom workflows, batch processing",
            active: true
        });

        packages[ENTERPRISE_PACKAGE] = PackageInfo({
            totalCredits: 260000,     // 260000 credits = ~1300 images OR ~520 videos
            usdPrice: 1250 * 10**6,   // $1250.00 USD
            packageName: "Enterprise AI Agent",
            agentCapabilities: "Advanced AI models, unlimited styles, API access, white-label options",
            active: true
        });
    }

    // Package purchase functions
    function purchasePackageWithUSDC(uint256 packageType) external nonReentrant returns (uint256) {
        PackageInfo memory package = packages[packageType];
        require(package.active && package.usdPrice > 0, "Invalid package");
        
        require(
            USDC.transferFrom(msg.sender, address(this), package.usdPrice),
            "USDC transfer failed"
        );
        
        _distributePayment(package.usdPrice, USDC);
        return _mintPackage(msg.sender, packageType, "USDC");
    }

    function purchasePackageWithWS(uint256 packageType) external nonReentrant returns (uint256) {
        PackageInfo memory package = packages[packageType];
        require(package.active && package.usdPrice > 0, "Invalid package");
        
        // Get equivalent wS amount for USD price
        uint256 wsAmount = _getTokenAmountForUSD(address(wS_TOKEN), package.usdPrice);
        
        require(
            wS_TOKEN.transferFrom(msg.sender, address(this), wsAmount),
            "wS transfer failed"
        );
        
        _distributePayment(wsAmount, wS_TOKEN);
        return _mintPackage(msg.sender, packageType, "wS");
    }

    function purchasePackageWithNativeS(uint256 packageType) external payable nonReentrant returns (uint256) {
        PackageInfo memory package = packages[packageType];
        require(package.active && package.usdPrice > 0, "Invalid package");
        
        // Get equivalent Native S amount for USD price
        uint256 nativeSAmount = _getNativeSAmountForUSD(package.usdPrice);
        require(msg.value >= nativeSAmount, "Insufficient Native S");
        
        // Refund excess if any
        if (msg.value > nativeSAmount) {
            payable(msg.sender).transfer(msg.value - nativeSAmount);
        }
        
        _distributeNativePayment(nativeSAmount);
        return _mintPackage(msg.sender, packageType, "Native S");
    }

    function _mintPackage(address to, uint256 packageType, string memory paymentToken) internal returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        PackageInfo memory package = packages[packageType];
        
        _safeMint(to, tokenId);
        
        // Initialize INFT package data
        INFTPackage storage inftPackage = inftPackages[tokenId];
        inftPackage.packageType = packageType;
        inftPackage.totalCredits = package.totalCredits;
        inftPackage.usedCredits = 0;
        inftPackage.mintedAt = block.timestamp;
        inftPackage.agentMetadata = _generateInitialAgentMetadata(packageType);
        
        // Set initial collection influences based on package type
        if (packageType >= PRO_PACKAGE) {
            inftPackage.collectionInfluences.push("bandit");
            inftPackage.collectionInfluences.push("kidz");
        }
        if (packageType >= BUSINESS_PACKAGE) {
            inftPackage.collectionInfluences.push("derp");
            inftPackage.collectionInfluences.push("sonic");
        }
        
        totalPackagesSold++;
        
        emit PackagePurchased(to, tokenId, packageType, paymentToken);
        return tokenId;
    }

    // Generation functions
    function generateContent(
        uint256 packageTokenId,
        string memory prompt,
        bool isVideo,
        string memory influencedCollection
    ) external nonReentrant returns (uint256) {
        require(_isAuthorizedToGenerate(packageTokenId, msg.sender), "Not authorized");
        
        INFTPackage storage package = inftPackages[packageTokenId];
        
        // Calculate credit cost based on generation type
        uint256 creditCost = isVideo ? VIDEO_GENERATION_COST : IMAGE_GENERATION_COST;
        require(package.usedCredits + creditCost <= package.totalCredits, "Insufficient credits");
        
        // Update credit usage
        package.usedCredits += creditCost;
        
        // If authorized user, also update their usage
        if (ownerOf(packageTokenId) != msg.sender) {
            AuthorizedUser storage auth = authorizations[packageTokenId][msg.sender];
            auth.usedCredits += creditCost;
        }
        
        // Mint the generated content as ERC-1155
        uint256 generatedTokenId = generatedNFTContract.mintGeneration(
            ownerOf(packageTokenId), // Package owner gets the generated NFT
            prompt,
            "", // IPFS hash will be updated after generation
            influencedCollection,
            isVideo,
            packageTokenId
        );
        
        // Link to package
        package.generatedTokenIds.push(generatedTokenId);
        
        // Update agent metadata (learning)
        _updateAgentLearning(packageTokenId, prompt, influencedCollection, isVideo);
        
        emit GenerationCreated(packageTokenId, generatedTokenId, msg.sender);
        return generatedTokenId;
    }

    // AIaaS Subscription system
    function createSubscription(
        uint256 packageTokenId,
        address subscriber,
        uint256 maxGenerations,
        uint256 duration
    ) external {
        require(ownerOf(packageTokenId) == msg.sender, "Not package owner");
        require(maxGenerations > 0 && duration > 0, "Invalid parameters");
        
        INFTPackage storage package = inftPackages[packageTokenId];
        require(package.totalCredits >= package.usedCredits + maxGenerations, "Insufficient credits");
        
        AuthorizedUser storage auth = authorizations[packageTokenId][subscriber];
        auth.maxCredits = maxGenerations;
        auth.usedCredits = 0;
        auth.expiresAt = block.timestamp + duration;
        auth.active = true;
        
        emit SubscriptionCreated(packageTokenId, subscriber, maxGenerations, duration);
    }

    function _isAuthorizedToGenerate(uint256 packageTokenId, address user) internal view returns (bool) {
        // Package owner can always generate
        if (ownerOf(packageTokenId) == user) {
            return true;
        }
        
        // Check subscription authorization
        AuthorizedUser storage auth = authorizations[packageTokenId][user];
        return auth.active && 
               auth.expiresAt > block.timestamp && 
               auth.usedCredits < auth.maxCredits;
    }

    // Dynamic pricing functions
    function _getTokenAmountForUSD(address token, uint256 usdAmount) internal view returns (uint256) {
        if (address(priceOracle) != address(0)) {
            try priceOracle.getTokenAmountForUSD(token, usdAmount) returns (uint256 tokenAmount) {
                return tokenAmount;
            } catch {
                // Fallback pricing if oracle fails
                return _getFallbackTokenAmount(token, usdAmount);
            }
        }
        return _getFallbackTokenAmount(token, usdAmount);
    }

    function _getNativeSAmountForUSD(uint256 usdAmount) internal view returns (uint256) {
        if (address(priceOracle) != address(0)) {
            try priceOracle.getSTokenPriceUSD() returns (uint256 sTokenPriceUSD) {
                // sTokenPriceUSD has 8 decimals, usdAmount has 6 decimals
                // Result should have 18 decimals for Native S
                return (usdAmount * 10**20) / sTokenPriceUSD; // (6 + 18 - 8 = 16, but we need 20 for proper scaling)
            } catch {
                // Fallback: assume $0.31 per S token
                return (usdAmount * 10**18) / (31 * 10**4); // $0.31 with 6 decimal precision
            }
        }
        // Fallback: assume $0.31 per S token  
        return (usdAmount * 10**18) / (31 * 10**4);
    }

    function _getFallbackTokenAmount(address token, uint256 usdAmount) internal pure returns (uint256) {
        if (token == address(0x29219dd400f2Bf60E5a23d13Be72B486D4038894)) { // USDC
            return usdAmount; // 1:1 with USD
        } else if (token == address(0x4200000000000000000000000000000000000006)) { // wS
            // Assume $0.31 per wS token (same as Native S)
            return (usdAmount * 10**18) / (31 * 10**4);
        }
        revert("Unsupported token for fallback pricing");
    }

    // Native payment distribution
    function _distributeNativePayment(uint256 amount) internal {
        uint256 toStaking = (amount * 25) / 100;     // 25%
        uint256 toLeaderboard = (amount * 15) / 100; // 15%
        uint256 toDev = (amount * 50) / 100;         // 50%
        // 10% remains in contract

        if (toStaking > 0 && srvcfloStaking != address(0)) {
            payable(srvcfloStaking).transfer(toStaking);
        }

        if (leaderboardThresholdMet && toLeaderboard > 0) {
            uint256 perWinner = toLeaderboard / 3;
            for (uint256 i = 0; i < 3; i++) {
                if (leaderboardWinners[i] != address(0)) {
                    payable(leaderboardWinners[i]).transfer(perWinner);
                }
            }
        }

        if (toDev > 0 && devWallet != address(0)) {
            payable(devWallet).transfer(toDev);
        }
    }

    function _updateAgentLearning(
        uint256 packageTokenId,
        string memory prompt,
        string memory collection,
        bool isVideo
    ) internal {
        // Update agent metadata with learning data
        // In practice, this would update encrypted metadata
        INFTPackage storage package = inftPackages[packageTokenId];
        
        // Simplified learning update - in reality this would be more sophisticated
        package.agentMetadata = string(abi.encodePacked(
            package.agentMetadata,
            ",learned:",
            collection,
            isVideo ? ":video" : ":image"
        ));
        
        emit AgentMetadataUpdated(packageTokenId, package.agentMetadata);
    }

    function _generateInitialAgentMetadata(uint256 packageType) internal pure returns (string memory) {
        if (packageType == STARTER_PACKAGE) {
            return "agent:starter,providers:openai+cloudflare+google,models:gpt4.1+dalle3+gemini+cf_ai,capabilities:text+image,styles:basic";
        } else if (packageType == PRO_PACKAGE) {
            return "agent:pro,providers:openai+cloudflare+google,models:gpt4.1+gpt5+dalle3+gemini_ultra+cf_workers+video,capabilities:text+image+video,styles:advanced";
        } else if (packageType == BUSINESS_PACKAGE) {
            return "agent:business,providers:multicloud,models:openai_suite+cloudflare_ai+gemini_ultra+custom,capabilities:full_multimodal+redundancy,styles:custom,workflow:batch";
        } else if (packageType == ENTERPRISE_PACKAGE) {
            return "agent:enterprise,providers:multicloud+custom,models:all_providers+finetuned+api,capabilities:unlimited+failover,styles:unlimited,api:enabled";
        }
        return "agent:unknown";
    }

    // Payment distribution (same as existing system)
    function _distributePayment(uint256 amount, IERC20 token) internal {
        uint256 toStaking = (amount * 25) / 100;     // 25%
        uint256 toLeaderboard = (amount * 15) / 100; // 15%
        uint256 toDev = (amount * 50) / 100;         // 50%
        // 10% remains in contract

        if (toStaking > 0 && srvcfloStaking != address(0)) {
            token.transfer(srvcfloStaking, toStaking);
        }

        if (leaderboardThresholdMet && toLeaderboard > 0) {
            uint256 perWinner = toLeaderboard / 3;
            for (uint256 i = 0; i < 3; i++) {
                if (leaderboardWinners[i] != address(0)) {
                    token.transfer(leaderboardWinners[i], perWinner);
                }
            }
        }

        if (toDev > 0 && devWallet != address(0)) {
            token.transfer(devWallet, toDev);
        }
    }

    // Dev functions
    function mintDevPackages() external onlyOwner {
        // Mint one of each package type to dev wallet for testing
        _mintPackage(devWallet, STARTER_PACKAGE, "Dev Mint");
        _mintPackage(devWallet, PRO_PACKAGE, "Dev Mint");
        _mintPackage(devWallet, BUSINESS_PACKAGE, "Dev Mint");
        _mintPackage(devWallet, ENTERPRISE_PACKAGE, "Dev Mint");
    }

    function mintSpecificDevPackage(uint256 packageType, address recipient) external onlyOwner {
        require(packages[packageType].active, "Invalid package type");
        _mintPackage(recipient, packageType, "Dev Mint");
    }

    // View functions
    function getPackageInfo(uint256 tokenId) external view returns (
        uint256 packageType,
        uint256 totalCredits,
        uint256 usedCredits,
        uint256 remainingCredits,
        string memory agentMetadata,
        string[] memory collectionInfluences,
        uint256[] memory generatedTokenIds
    ) {
        require(_ownerOf(tokenId) != address(0), "Package does not exist");
        
        INFTPackage storage package = inftPackages[tokenId];
        return (
            package.packageType,
            package.totalCredits,
            package.usedCredits,
            package.totalCredits - package.usedCredits,
            package.agentMetadata,
            package.collectionInfluences,
            package.generatedTokenIds
        );
    }

    function getPackagePricing(uint256 packageType) external view returns (
        uint256 usdPrice,
        uint256 nativeSPrice,
        uint256 wsPrice,
        uint256 usdcPrice
    ) {
        PackageInfo memory package = packages[packageType];
        require(package.active, "Invalid package");
        
        return (
            package.usdPrice,
            _getNativeSAmountForUSD(package.usdPrice),
            _getTokenAmountForUSD(address(wS_TOKEN), package.usdPrice),
            package.usdPrice // USDC is 1:1 with USD
        );
    }

    function getUserPackages(address user) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(user);
        uint256[] memory tokenIds = new uint256[](balance);
        
        uint256 index = 0;
        for (uint256 i = 1; i < _nextTokenId; i++) {
            if (_ownerOf(i) == user) {
                tokenIds[index] = i;
                index++;
            }
        }
        
        return tokenIds;
    }

    function getSubscriptionInfo(uint256 packageTokenId, address subscriber) external view returns (
        uint256 maxGenerations,
        uint256 usedGenerations,
        uint256 expiresAt,
        bool active
    ) {
        AuthorizedUser storage auth = authorizations[packageTokenId][subscriber];
        return (auth.maxCredits, auth.usedCredits, auth.expiresAt, auth.active);
    }

    // Admin functions
    function setContracts(
        address _generatedNFTContract,
        address _srvcfloStaking,
        address _devWallet
    ) external onlyOwner {
        generatedNFTContract = ISrvcfloGeneratedNFT(_generatedNFTContract);
        srvcfloStaking = _srvcfloStaking;
        devWallet = _devWallet;
    }

    function setLeaderboard(address[3] calldata winners, bool thresholdMet) external onlyOwner {
        leaderboardWinners = winners;
        leaderboardThresholdMet = thresholdMet;
    }

    function updatePackage(uint256 packageType, PackageInfo calldata newPackage) external onlyOwner {
        packages[packageType] = newPackage;
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}