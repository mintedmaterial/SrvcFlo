// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @custom:security-contact security@serviceflow.ai
/// @title SrvcfloINFTPackages V2 - AI Image/Video Generation Packages
/// @notice INFT packages for AI image and video generation with dynamic pricing
contract SrvcfloINFTPackagesV2 is ERC721, Ownable, Pausable, ReentrancyGuard {
    
    // Package structure for INFT system
    struct PackageInfo {
        uint256 totalCredits;    // Total credits in package (750, 8000, 50000, 500000)
        uint256 priceS;          // Price in Native S (dynamic based on USD)
        uint256 priceUSDC;       // Price in USDC (fixed USD price)
        bool isActive;           // Package availability
        string aiModels;         // Available AI models description
        string description;      // Package description
    }
    
    // Package IDs
    uint256 public constant STARTER_PACKAGE = 1;     // 1000 credits - $5
    uint256 public constant CREATOR_PACKAGE = 2;     // 10000 credits - $50
    uint256 public constant PROFESSIONAL_PACKAGE = 3; // 100000 credits - $200
    uint256 public constant ENTERPRISE_PACKAGE = 4;   // 280000 credits - $1500

    // Sonic Labs Mainnet (Chain ID 146) Payment tokens
    IERC20 public constant USDC = IERC20(0x29219dd400f2Bf60E5a23d13Be72B486D4038894);
    IERC20 public constant wS_TOKEN = IERC20(0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38);

    // Contract addresses
    address public devWallet;
    address public stakingContract;
    
    // Package mappings
    mapping(uint256 => PackageInfo) public packages;
    mapping(uint256 => uint256) public packageCredits; // tokenId => remaining credits
    mapping(uint256 => uint256) public packageType; // tokenId => package type
    
    // Token tracking
    uint256 private _tokenIdCounter;
    
    // Events
    event PackageCreated(uint256 indexed packageId, uint256 totalCredits, uint256 priceS, uint256 priceUSDC);
    event PackagePurchased(address indexed buyer, uint256 indexed tokenId, uint256 packageId, uint256 credits);
    event CreditsUsed(uint256 indexed tokenId, uint256 creditsUsed, uint256 remaining);
    event PriceUpdated(uint256 indexed packageId, uint256 newPriceS);

    constructor(
        address initialOwner,
        address _devWallet,
        address _stakingContract
    ) ERC721("ServiceFlow AI INFT Packages", "SFINFT") Ownable(initialOwner) {
        devWallet = _devWallet;
        stakingContract = _stakingContract;
        
        // Initialize default packages
        _initializePackages();
    }

    /// @notice Initialize the default INFT packages
    function _initializePackages() internal {
        // Starter Package - $5 USD (Basic AI image generation)
        packages[STARTER_PACKAGE] = PackageInfo({
            totalCredits: 1000,  // 5 images (1000÷200) or 2 videos (1000÷500)
            priceS: 16 ether,   // ~$5 USD worth of S tokens (dynamic)
            priceUSDC: 5 * 1e6, // $5 USDC fixed
            isActive: true,
            aiModels: "Cloudflare AI, Basic Models",
            description: "Starter AI Image Generation - Basic usage for individual creators"
        });

        // Creator Package - $50 USD (Premium models + collection influence)  
        packages[CREATOR_PACKAGE] = PackageInfo({
            totalCredits: 10000,   // 50 images or 20 videos
            priceS: 161 ether,    // ~$50 USD worth of S tokens
            priceUSDC: 50 * 1e6,  // $50 USDC fixed
            isActive: true,
            aiModels: "OpenAI DALL-E-2, Flux Schnell, Stable Diffusion XL, Gemini Pro",
            description: "Creator AI Generation - Premium models + collection influence"
        });

        // Professional Package - $200 USD (Full model access)
        packages[PROFESSIONAL_PACKAGE] = PackageInfo({
            totalCredits: 100000,   // 500 images or 200 videos
            priceS: 645 ether,     // ~$200 USD worth of S tokens
            priceUSDC: 200 * 1e6,  // $200 USDC fixed
            isActive: true,
            aiModels: "OpenAI DALL-E-3, Flux Dev, All Premium Models, Video Generation",
            description: "Professional AI Generation - Full model access for businesses"
        });

        // Enterprise Package - $1500 USD (Unlimited capabilities)
        packages[ENTERPRISE_PACKAGE] = PackageInfo({
            totalCredits: 280000,  // 1400 images or 560 videos
            priceS: 4839 ether,    // ~$1500 USD worth of S tokens
            priceUSDC: 1500 * 1e6, // $1500 USDC fixed
            isActive: true,
            aiModels: "OpenAI GPT-5, DALL-E-3, Enterprise Models, Custom Fine-tuning, API Access",
            description: "Enterprise AI Generation - Unlimited capabilities for large operations"
        });
    }

    /// @notice Purchase a package with Native S tokens
    /// @param packageId The package ID to purchase
    /// @param recipient The recipient of the INFT
    function purchasePackageWithNativeS(uint256 packageId, address recipient) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        PackageInfo memory pkg = packages[packageId];
        require(pkg.isActive, "Package not active");
        require(msg.value >= pkg.priceS, "Insufficient payment");
        
        uint256 tokenId = _mintPackage(recipient, packageId, pkg.totalCredits);
        
        // Distribute payment
        _distributeNativeS(msg.value);
        
        // Refund excess
        if (msg.value > pkg.priceS) {
            payable(msg.sender).transfer(msg.value - pkg.priceS);
        }
        
        emit PackagePurchased(recipient, tokenId, packageId, pkg.totalCredits);
    }

    /// @notice Purchase a package with USDC
    /// @param packageId The package ID to purchase
    /// @param recipient The recipient of the INFT
    function purchasePackageWithUSDC(uint256 packageId, address recipient) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        PackageInfo memory pkg = packages[packageId];
        require(pkg.isActive, "Package not active");
        
        // Transfer USDC from user
        USDC.transferFrom(msg.sender, address(this), pkg.priceUSDC);
        
        uint256 tokenId = _mintPackage(recipient, packageId, pkg.totalCredits);
        
        // Distribute USDC payment
        _distributeUSDC(pkg.priceUSDC);
        
        emit PackagePurchased(recipient, tokenId, packageId, pkg.totalCredits);
    }

    /// @notice Use credits for generation (called by generation contracts)
    /// @param tokenId The INFT token ID
    /// @param creditsToUse Amount of credits to consume
    function useCredits(uint256 tokenId, uint256 creditsToUse) external {
        require(_exists(tokenId), "Token does not exist");
        require(packageCredits[tokenId] >= creditsToUse, "Insufficient credits");
        
        packageCredits[tokenId] -= creditsToUse;
        
        emit CreditsUsed(tokenId, creditsToUse, packageCredits[tokenId]);
    }

    /// @notice Update package pricing (owner only)
    /// @param packageId The package ID to update
    /// @param newPriceS New price in Native S tokens
    function updatePackagePriceS(uint256 packageId, uint256 newPriceS) external onlyOwner {
        require(packages[packageId].isActive, "Package does not exist");
        packages[packageId].priceS = newPriceS;
        emit PriceUpdated(packageId, newPriceS);
    }

    /// @notice Get remaining credits for a token
    /// @param tokenId The token ID to check
    /// @return The remaining credits
    function getRemainingCredits(uint256 tokenId) external view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        return packageCredits[tokenId];
    }

    /// @notice Get package information
    /// @param packageId The package ID to query
    /// @return The package information
    function getPackageInfo(uint256 packageId) external view returns (PackageInfo memory) {
        return packages[packageId];
    }

    /// @notice Internal function to mint a package
    function _mintPackage(address to, uint256 packageId, uint256 credits) internal returns (uint256) {
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        
        packageCredits[tokenId] = credits;
        packageType[tokenId] = packageId;
        
        return tokenId;
    }

    /// @notice Distribute Native S payments
    function _distributeNativeS(uint256 amount) internal {
        uint256 devAmount = (amount * 50) / 100;      // 50% to dev
        uint256 stakingAmount = (amount * 25) / 100;   // 25% to staking
        uint256 leaderboardAmount = (amount * 15) / 100; // 15% to leaderboard
        // 10% stays in contract for operations
        
        payable(devWallet).transfer(devAmount);
        if (stakingContract != address(0)) {
            payable(stakingContract).transfer(stakingAmount + leaderboardAmount);
        }
    }

    /// @notice Distribute USDC payments
    function _distributeUSDC(uint256 amount) internal {
        uint256 devAmount = (amount * 50) / 100;
        uint256 stakingAmount = (amount * 25) / 100;
        uint256 leaderboardAmount = (amount * 15) / 100;
        
        USDC.transfer(devWallet, devAmount);
        if (stakingContract != address(0)) {
            USDC.transfer(stakingContract, stakingAmount + leaderboardAmount);
        }
    }

    /// @notice Get total supply of INFTs
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    /// @notice Emergency functions
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    /// @notice Withdraw stuck Native S (emergency only)
    function withdrawNativeS(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
    }

    /// @notice Withdraw stuck USDC (emergency only)
    function withdrawUSDC(uint256 amount) external onlyOwner {
        require(amount <= USDC.balanceOf(address(this)), "Insufficient balance");
        USDC.transfer(owner(), amount);
    }

    /// @notice Update dev wallet address
    function updateDevWallet(address newDevWallet) external onlyOwner {
        devWallet = newDevWallet;
    }

    /// @notice Update staking contract address  
    function updateStakingContract(address newStakingContract) external onlyOwner {
        stakingContract = newStakingContract;
    }

    /// @notice Check if token exists (internal helper)
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId <= _tokenIdCounter && tokenId > 0;
    }
}