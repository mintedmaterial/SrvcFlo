// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISrvcfloStaking {
    function distributeRewards(uint256 amount, address token) external;
}

/// @custom:security-contact security@srvcflo.com
/// @title SrvcfloCreditsNFT - ERC-1155 Credit System with Collection Influence
/// @dev NFT-based credits that provide collection-influenced AI generations
contract SrvcfloCreditsNFT is ERC1155, Ownable, ERC1155Burnable, ERC1155Supply, ReentrancyGuard {
    
    // Token IDs for different credit types
    uint256 public constant STARTER_CREDITS = 1;      // 750 credits
    uint256 public constant PRO_CREDITS = 2;          // 8000 credits  
    uint256 public constant BUSINESS_CREDITS = 3;     // 100000 credits
    uint256 public constant ENTERPRISE_CREDITS = 4;   // 260000 credits
    uint256 public constant GENERATION_NFT = 100;     // Base ID for generation NFTs
    
    // Payment tokens
    IERC20 public constant USDC = IERC20(0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6);
    IERC20 public constant WS_TOKEN = IERC20(0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38);
    IERC20 public constant SSSTT = IERC20(0xc777Fa50186362fe0EF9CCD579b6385cE7CB49f1);
    
    // Distribution addresses
    address public srvcfloStaking;
    address public devWallet;
    address[3] public leaderboardWinners;
    bool public leaderboardThresholdMet;
    
    // Credit package definitions
    struct CreditPackage {
        uint256 usdcPrice;    // Price in USDC (6 decimals)
        uint256 wsPrice;      // Price in wS (18 decimals)
        uint256 sssttPrice;   // Price in SSStt (18 decimals)
        uint256 usdcCredits;  // Credits for USDC payment
        uint256 wsCredits;    // Credits for wS payment (bonus)
        uint256 sssttCredits; // Credits for SSStt payment
        string packageName;
        bool active;
    }
    
    mapping(uint256 => CreditPackage) public creditPackages;
    
    // Generation tracking
    uint256 public currentGenerationId = 100; // Start at 100 to avoid conflicts
    mapping(uint256 => GenerationInfo) public generations;
    mapping(address => uint256) public userGenerationCount;
    
    struct GenerationInfo {
        address creator;
        string prompt;
        string resultUrl;
        string influencedCollection;
        uint256 timestamp;
        bool isVideo;
    }
    
    // Collection influence system
    mapping(string => string) public collectionKeywords; // keyword -> collection address
    string[] public supportedCollections;
    
    // Events
    event CreditPackagePurchased(address indexed buyer, uint256 packageId, uint256 amount, string paymentToken);
    event CreditsSpent(address indexed user, uint256 packageId, uint256 amount, uint256 generationId);
    event GenerationMinted(address indexed user, uint256 generationId, string prompt, string collection);
    event CollectionInfluenceAdded(string keyword, string collection);
    
    constructor(
        address initialOwner,
        address _srvcfloStaking,
        address _devWallet
    ) ERC1155("https://api.srvcflo.com/metadata/credits/{id}") Ownable(initialOwner) {
        srvcfloStaking = _srvcfloStaking;
        devWallet = _devWallet;
        _initializeCreditPackages();
        _initializeCollectionInfluences();
    }
    
    function _initializeCreditPackages() internal {
        // Starter: 5 USDC = 750 credits, wS = 1000 credits (33% bonus)
        creditPackages[STARTER_CREDITS] = CreditPackage({
            usdcPrice: 5 * 10**6,      // 5 USDC
            wsPrice: 15 * 10**18,      // ~5 USDC worth of wS
            sssttPrice: 5 * 10**18,    // 5 SSStt 
            usdcCredits: 750,          // Base credits for USDC
            wsCredits: 1000,           // Bonus credits for wS (33% more)
            sssttCredits: 750,         // Base credits for SSStt
            packageName: "Starter Pack",
            active: true
        });
        
        // Pro: 50 USDC = 8000 credits, wS = 10000 credits (25% bonus)  
        creditPackages[PRO_CREDITS] = CreditPackage({
            usdcPrice: 50 * 10**6,     // 50 USDC
            wsPrice: 150 * 10**18,     // ~50 USDC worth of wS
            sssttPrice: 50 * 10**18,   // 50 SSStt
            usdcCredits: 8000,         // Base credits for USDC
            wsCredits: 10000,          // Bonus credits for wS (25% more)
            sssttCredits: 8000,        // Base credits for SSStt
            packageName: "Pro Pack",
            active: true
        });
        
        // Business: 500 USDC = 100000 credits, wS = 115000 credits (15% bonus)
        creditPackages[BUSINESS_CREDITS] = CreditPackage({
            usdcPrice: 500 * 10**6,    // 500 USDC
            wsPrice: 1500 * 10**18,    // ~500 USDC worth of wS
            sssttPrice: 500 * 10**18,  // 500 SSStt
            usdcCredits: 100000,       // Base credits for USDC
            wsCredits: 115000,         // Bonus credits for wS (15% more)
            sssttCredits: 100000,      // Base credits for SSStt
            packageName: "Business Pack",
            active: true
        });
        
        // Enterprise: 1250 USDC = 260000 credits, wS = 290000 credits (11.5% bonus)
        creditPackages[ENTERPRISE_CREDITS] = CreditPackage({
            usdcPrice: 1250 * 10**6,   // 1250 USDC
            wsPrice: 3750 * 10**18,    // ~1250 USDC worth of wS
            sssttPrice: 1250 * 10**18, // 1250 SSStt
            usdcCredits: 260000,       // Base credits for USDC
            wsCredits: 290000,         // Bonus credits for wS (11.5% more)
            sssttCredits: 260000,      // Base credits for SSStt
            packageName: "Enterprise Pack",
            active: true
        });
    }
    
    function _initializeCollectionInfluences() internal {
        // Initialize known Sonic collections
        collectionKeywords["derp"] = "0x..."; // Derps collection address
        collectionKeywords["kidz"] = "0x..."; // BanditKidz collection address
        collectionKeywords["bandit"] = "0x..."; // BanditKidz collection address
        
        supportedCollections.push("derp");
        supportedCollections.push("kidz");
        supportedCollections.push("bandit");
    }
    
    // Purchase credit packages with different tokens
    function purchaseCreditsWithUSDC(uint256 packageId) external nonReentrant {
        CreditPackage memory package = creditPackages[packageId];
        require(package.active && package.usdcPrice > 0, "Invalid package");
        
        require(
            USDC.transferFrom(msg.sender, address(this), package.usdcPrice),
            "USDC transfer failed"
        );
        
        _distributePayment(package.usdcPrice, USDC);
        
        // Mint credit NFT with USDC credit amount
        uint256 tokenId = packageId + 1000; // Offset to differentiate payment types
        _mint(msg.sender, tokenId, package.usdcCredits, "");
        
        emit CreditPackagePurchased(msg.sender, tokenId, package.usdcCredits, "USDC");
    }
    
    function purchaseCreditsWithWS(uint256 packageId) external nonReentrant {
        CreditPackage memory package = creditPackages[packageId];
        require(package.active && package.wsPrice > 0, "Invalid package");
        
        require(
            WS_TOKEN.transferFrom(msg.sender, address(this), package.wsPrice),
            "wS transfer failed"
        );
        
        _distributePayment(package.wsPrice, WS_TOKEN);
        
        // Mint credit NFT with wS BONUS credit amount
        uint256 tokenId = packageId + 2000; // Different offset for wS payments
        _mint(msg.sender, tokenId, package.wsCredits, "");
        
        emit CreditPackagePurchased(msg.sender, tokenId, package.wsCredits, "wS");
    }
    
    function purchaseCreditsWithSSStt(uint256 packageId) external nonReentrant {
        CreditPackage memory package = creditPackages[packageId];
        require(package.active && package.sssttPrice > 0, "Invalid package");
        
        require(
            SSSTT.transferFrom(msg.sender, address(this), package.sssttPrice),
            "SSStt transfer failed"
        );
        
        _distributePayment(package.sssttPrice, SSSTT);
        
        // Mint credit NFT with SSStt credit amount
        uint256 tokenId = packageId + 3000; // Different offset for SSStt payments
        _mint(msg.sender, tokenId, package.sssttCredits, "");
        
        emit CreditPackagePurchased(msg.sender, tokenId, package.sssttCredits, "SSStt");
    }
    
    // Spend credits for generation (called by backend)
    function spendCreditsForGeneration(
        address user,
        uint256 packageId,
        string calldata prompt,
        bool isVideo,
        string calldata detectedCollection
    ) external onlyOwner returns (uint256 generationId) {
        require(balanceOf(user, packageId) > 0, "Insufficient credit NFTs");
        
        // Calculate credits needed (100 for image, 200 for video)
        uint256 creditsNeeded = isVideo ? 200 : 100;
        CreditPackage memory package = creditPackages[packageId];
        
        require(package.usdcCredits >= creditsNeeded, "Package has insufficient credits");
        
        // Burn partial credits by minting a new reduced package or handle fractionally
        // For simplicity, we'll track usage in generation info
        
        generationId = currentGenerationId++;
        generations[generationId] = GenerationInfo({
            creator: user,
            prompt: prompt,
            resultUrl: "",
            influencedCollection: detectedCollection,
            timestamp: block.timestamp,
            isVideo: isVideo
        });
        
        userGenerationCount[user]++;
        
        emit CreditsSpent(user, packageId, creditsNeeded, generationId);
        return generationId;
    }
    
    // Mint generation NFT with result
    function mintGenerationNFT(
        uint256 generationId,
        string calldata resultUrl
    ) external onlyOwner {
        GenerationInfo storage gen = generations[generationId];
        require(gen.creator != address(0), "Generation not found");
        require(bytes(gen.resultUrl).length == 0, "Already minted");
        
        gen.resultUrl = resultUrl;
        
        // Mint the generation as NFT
        _mint(gen.creator, generationId, 1, "");
        
        emit GenerationMinted(gen.creator, generationId, gen.prompt, gen.influencedCollection);
    }
    
    // Collection influence management
    function addCollectionInfluence(string calldata keyword, string calldata collectionAddress) external onlyOwner {
        collectionKeywords[keyword] = collectionAddress;
        
        // Add to supported collections if not exists
        bool exists = false;
        for (uint i = 0; i < supportedCollections.length; i++) {
            if (keccak256(bytes(supportedCollections[i])) == keccak256(bytes(keyword))) {
                exists = true;
                break;
            }
        }
        
        if (!exists) {
            supportedCollections.push(keyword);
        }
        
        emit CollectionInfluenceAdded(keyword, collectionAddress);
    }
    
    function detectCollectionInfluence(string calldata prompt) external view returns (string memory) {
        bytes memory promptBytes = bytes(prompt);
        
        for (uint i = 0; i < supportedCollections.length; i++) {
            string memory keyword = supportedCollections[i];
            bytes memory keywordBytes = bytes(keyword);
            
            // Simple keyword detection (case insensitive would require more complex logic)
            if (_contains(promptBytes, keywordBytes)) {
                return collectionKeywords[keyword];
            }
        }
        
        return "";
    }
    
    function _contains(bytes memory data, bytes memory keyword) internal pure returns (bool) {
        if (keyword.length > data.length) return false;
        
        for (uint i = 0; i <= data.length - keyword.length; i++) {
            bool found = true;
            for (uint j = 0; j < keyword.length; j++) {
                if (data[i + j] != keyword[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
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
    
    // Admin functions
    function setAddresses(address _srvcfloStaking, address _devWallet) external onlyOwner {
        srvcfloStaking = _srvcfloStaking;
        devWallet = _devWallet;
    }
    
    function setLeaderboard(address[3] calldata winners, bool thresholdMet) external onlyOwner {
        leaderboardWinners = winners;
        leaderboardThresholdMet = thresholdMet;
    }
    
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }
    
    // View functions
    function getUserCreditBalance(address user) external view returns (uint256[] memory packageIds, uint256[] memory balances) {
        packageIds = new uint256[](4);
        balances = new uint256[](4);
        
        packageIds[0] = STARTER_CREDITS;
        packageIds[1] = PRO_CREDITS;
        packageIds[2] = BUSINESS_CREDITS;
        packageIds[3] = ENTERPRISE_CREDITS;
        
        for (uint256 i = 0; i < 4; i++) {
            balances[i] = balanceOf(user, packageIds[i]);
        }
    }
    
    function getUserGenerations(address user) external view returns (uint256[] memory generationIds) {
        uint256 count = userGenerationCount[user];
        generationIds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = GENERATION_NFT; i < currentGenerationId; i++) {
            if (generations[i].creator == user) {
                generationIds[index] = i;
                index++;
            }
        }
    }
    
    function getSupportedCollections() external view returns (string[] memory) {
        return supportedCollections;
    }
    
    // Required overrides
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }
}