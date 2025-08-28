// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

interface SrvcfloCreditsNFTWithRoyalties {
    function mint(address account, uint256 id, uint256 amount, bytes memory data) external;
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

interface IBeefyOracle {
    function getFreshPrice(address token) external returns (uint256);
    function getPrice(address token) external view returns (uint256);
}

/**
 * @title SonicMainnetPaymentWithOracle
 * @dev Payment system with dynamic native S token pricing via Beefy Oracle
 * - USDC payments → ERC-20 credits (fixed pricing)
 * - Native S payments → ERC-1155 NFT credits with dynamic USD-based pricing and bonus
 */
contract SonicMainnetPaymentWithOracle is Ownable, ReentrancyGuard, Pausable {
    
    // Token contracts
    IERC20 public immutable USDC;
    SrvcfloCreditsNFTWithRoyalties public immutable creditsNFT;
    
    // Oracle and payment distribution
    IBeefyOracle public constant BEEFY_ORACLE = IBeefyOracle(0xBC4a342B0c057501E081484A2d24e576E854F823);
    address public immutable stakingContract;
    address public immutable devWallet;
    
    // Native S token address for oracle (wS token address used for price lookup)
    address public constant S_TOKEN_FOR_ORACLE = 0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38;
    
    // ERC-20 Credit balances (for USDC purchases)
    mapping(address => uint256) public userCredits;
    mapping(address => mapping(uint256 => uint256)) public userNFTCreditsSpent; // Track spent NFT credits per package
    
    // Credit packages
    struct CreditPackage {
        uint256 usdcPrice;        // Price in USDC (6 decimals)
        uint256 usdValueForS;     // USD value for native S payment (6 decimals, $5.00 = 5000000)
        uint256 usdcCredits;      // ERC-20 credits for USDC payment
        uint256 sonicCredits;     // ERC-1155 NFT credits for Sonic payment (bonus)
        bool active;
    }
    
    mapping(uint256 => CreditPackage) public creditPackages;
    
    // Generation tracking
    uint256 public totalGenerations;
    uint256 public currentGenerationId;
    mapping(address => uint256) public userGenerations;
    
    // Events
    event CreditsPurchasedUSDC(address indexed user, uint256 packageId, uint256 creditsReceived, uint256 usdcPaid);
    event CreditsPurchasedSonic(address indexed user, uint256 packageId, uint256 creditsReceived, uint256 sonicPaid, uint256 usdValue);
    event CreditsSpent(address indexed user, uint256 credits, string generationType, uint256 generationId);
    event PackageUpdated(uint256 indexed packageId, uint256 usdcPrice, uint256 usdValueForS, uint256 usdcCredits, uint256 sonicCredits);
    
    constructor(
        address initialOwner,
        address _usdc,
        address payable _creditsNFT,
        address _stakingContract,
        address _devWallet
    ) Ownable(initialOwner) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_creditsNFT != address(0), "Invalid credits NFT address");
        require(_stakingContract != address(0), "Invalid staking address");
        require(_devWallet != address(0), "Invalid dev wallet address");
        
        USDC = IERC20(_usdc);
        creditsNFT = SrvcfloCreditsNFTWithRoyalties(_creditsNFT);
        stakingContract = _stakingContract;
        devWallet = _devWallet;
        
        // Initialize credit packages
        _initializeCreditPackages();
    }
    
    function _initializeCreditPackages() internal {
        // Starter: $5 USD worth = 750 USDC credits, 1000 S credits (33% bonus)
        creditPackages[1] = CreditPackage({
            usdcPrice: 5 * 10**6,      // 5 USDC
            usdValueForS: 5 * 10**6,   // $5 USD worth of S (dynamic pricing)
            usdcCredits: 750,
            sonicCredits: 1000,        // 33% bonus credits
            active: true
        });
        
        // Pro: $50 USD worth = 8000 USDC credits, 10000 S credits (25% bonus)
        creditPackages[2] = CreditPackage({
            usdcPrice: 50 * 10**6,     // 50 USDC
            usdValueForS: 50 * 10**6,  // $50 USD worth of S (dynamic pricing)
            usdcCredits: 8000,
            sonicCredits: 10000,       // 25% bonus credits
            active: true
        });
        
        // Business: $500 USD worth = 100000 USDC credits, 115000 S credits (15% bonus)
        creditPackages[3] = CreditPackage({
            usdcPrice: 500 * 10**6,    // 500 USDC
            usdValueForS: 500 * 10**6, // $500 USD worth of S (dynamic pricing)
            usdcCredits: 100000,
            sonicCredits: 115000,      // 15% bonus credits
            active: true
        });
        
        // Enterprise: $1250 USD worth = 260000 USDC credits, 290000 S credits (~12% bonus)
        creditPackages[4] = CreditPackage({
            usdcPrice: 1250 * 10**6,   // 1250 USDC
            usdValueForS: 1250 * 10**6, // $1250 USD worth of S (dynamic pricing)
            usdcCredits: 260000,
            sonicCredits: 290000,      // ~12% bonus credits
            active: true
        });
    }
    
    // Purchase credits with USDC (stored as ERC-20 balance)
    function purchaseCreditsWithUSDC(uint256 packageId) external whenNotPaused nonReentrant {
        CreditPackage memory package = creditPackages[packageId];
        require(package.active, "Package not active");
        require(package.usdcCredits > 0, "Invalid package");
        
        // Transfer USDC from user
        require(USDC.transferFrom(msg.sender, address(this), package.usdcPrice), "USDC transfer failed");
        
        // Distribute USDC payment
        _distributeUSDCPayment(package.usdcPrice);
        
        // Add ERC-20 credits to user balance
        userCredits[msg.sender] += package.usdcCredits;
        
        emit CreditsPurchasedUSDC(msg.sender, packageId, package.usdcCredits, package.usdcPrice);
    }
    
    // Purchase credits with native Sonic tokens (dynamic pricing, minted as ERC-1155 NFTs with bonus)
    function purchaseCreditsWithSonic(uint256 packageId) external payable whenNotPaused nonReentrant {
        CreditPackage memory package = creditPackages[packageId];
        require(package.active, "Package not active");
        require(package.sonicCredits > 0, "Invalid package");
        
        // Get current S token price from Beefy Oracle (price in USD with 18 decimals)
        uint256 sTokenPriceUSD = BEEFY_ORACLE.getPrice(S_TOKEN_FOR_ORACLE);
        require(sTokenPriceUSD > 0, "Invalid S token price from oracle");
        
        // Calculate required S tokens: (USD_VALUE * 10^18) / PRICE_PER_TOKEN
        // package.usdValueForS has 6 decimals, sTokenPriceUSD has 18 decimals
        // Result should have 18 decimals (wei)
        uint256 requiredSTokens = (package.usdValueForS * 10**30) / sTokenPriceUSD;
        
        require(msg.value >= requiredSTokens, "Insufficient Sonic payment");
        
        // Distribute native Sonic payment
        _distributeSonicPayment(msg.value);
        
        // Mint ERC-1155 NFT credits to user (with bonus)
        creditsNFT.mint(msg.sender, packageId, package.sonicCredits, "");
        
        // Refund excess payment if any
        if (msg.value > requiredSTokens) {
            payable(msg.sender).transfer(msg.value - requiredSTokens);
        }
        
        emit CreditsPurchasedSonic(msg.sender, packageId, package.sonicCredits, requiredSTokens, package.usdValueForS);
    }
    
    // Internal payment distribution functions
    function _distributeUSDCPayment(uint256 amount) internal {
        uint256 toStaking = (amount * 25) / 100;      // 25% to staking
        uint256 toDev = (amount * 50) / 100;          // 50% to dev
        uint256 toLeaderboard = (amount * 15) / 100;  // 15% to leaderboard  
        // 10% remains in contract (treasury)
        
        USDC.transfer(stakingContract, toStaking);
        USDC.transfer(devWallet, toDev);
        // Note: For now, sending leaderboard to dev wallet
        USDC.transfer(devWallet, toLeaderboard);
    }
    
    function _distributeSonicPayment(uint256 amount) internal {
        uint256 toStaking = (amount * 25) / 100;      // 25% to staking
        uint256 toDev = (amount * 50) / 100;          // 50% to dev
        uint256 toLeaderboard = (amount * 15) / 100;  // 15% to leaderboard
        // 10% remains in contract (treasury)
        
        payable(stakingContract).transfer(toStaking);
        payable(devWallet).transfer(toDev);
        // Note: For now, sending leaderboard to dev wallet
        payable(devWallet).transfer(toLeaderboard);
    }
    
    // Spend ERC-20 credits for generation (called by backend)
    function spendERC20Credits(address user, uint256 credits, string calldata generationType) external onlyOwner {
        require(userCredits[user] >= credits, "Insufficient ERC-20 credits");
        
        userCredits[user] -= credits;
        totalGenerations++;
        userGenerations[user]++;
        currentGenerationId++;
        
        emit CreditsSpent(user, credits, generationType, currentGenerationId);
    }
    
    // Spend ERC-1155 credits for generation (called by backend)
    function spendNFTCredits(address user, uint256 packageId, uint256 credits, string calldata generationType) external onlyOwner {
        require(creditsNFT.balanceOf(user, packageId) >= credits, "Insufficient NFT credits");
        
        // Track spending instead of burning (preserves NFT for metadata updates)
        userNFTCreditsSpent[user][packageId] += credits;
        
        totalGenerations++;
        userGenerations[user]++;
        currentGenerationId++;
        
        emit CreditsSpent(user, credits, generationType, currentGenerationId);
    }
    
    // Get user's ERC-1155 credits by package
    function getUserNFTCredits(address user, uint256 packageId) external view returns (uint256) {
        return creditsNFT.balanceOf(user, packageId);
    }
    
    function updatePackage(
        uint256 packageId,
        uint256 usdcPrice,
        uint256 usdValueForS,
        uint256 usdcCredits,
        uint256 sonicCredits,
        bool active
    ) external onlyOwner {
        creditPackages[packageId] = CreditPackage({
            usdcPrice: usdcPrice,
            usdValueForS: usdValueForS,
            usdcCredits: usdcCredits,
            sonicCredits: sonicCredits,
            active: active
        });
        
        emit PackageUpdated(packageId, usdcPrice, usdValueForS, usdcCredits, sonicCredits);
    }
    
    // GIVEAWAY FUNCTIONS - Owner can transfer credits for promotions
    function giveawayERC20Credits(address[] calldata recipients, uint256 credits) external onlyOwner {
        require(recipients.length > 0, "No recipients");
        require(credits > 0, "Invalid credits");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] != address(0)) {
                userCredits[recipients[i]] += credits;
                emit CreditsPurchasedUSDC(recipients[i], 0, credits, 0);
            }
        }
    }
    
    function giveawayNFTCredits(address recipient, uint256 packageId, uint256 credits) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(credits > 0, "Invalid credits");
        
        creditsNFT.mint(recipient, packageId, credits, "");
        emit CreditsPurchasedSonic(recipient, packageId, credits, 0, 0);
    }
    
    // EMERGENCY FUNCTIONS
    function pause() public onlyOwner {
        _pause();
    }
    
    function unpause() public onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }
    
    function emergencyWithdrawERC20(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
    
    // VIEW FUNCTIONS FOR ORACLE PRICING
    
    // Get available (unspent) NFT credits for a user's package
    function getUserAvailableNFTCredits(address user, uint256 packageId) external view returns (uint256) {
        uint256 totalBalance = creditsNFT.balanceOf(user, packageId);
        uint256 spentAmount = userNFTCreditsSpent[user][packageId];
        return totalBalance > spentAmount ? totalBalance - spentAmount : 0;
    }
    
    // Get total credits (ERC-20 + available NFT credits across all packages)
    function getUserTotalCredits(address user) external view returns (uint256 total) {
        // Add ERC-20 credits
        total += userCredits[user];
        
        // Add available NFT credits from all packages (1-4)
        for (uint256 i = 1; i <= 4; i++) {
            uint256 totalBalance = creditsNFT.balanceOf(user, i);
            uint256 spentAmount = userNFTCreditsSpent[user][i];
            if (totalBalance > spentAmount) {
                total += totalBalance - spentAmount;
            }
        }
    }
    
    // Get current required S tokens for a package (dynamic pricing)
    function getRequiredSTokensForPackage(uint256 packageId) external view returns (uint256 sTokensRequired, uint256 currentPrice) {
        CreditPackage memory package = creditPackages[packageId];
        require(package.active, "Package not active");
        
        currentPrice = BEEFY_ORACLE.getPrice(S_TOKEN_FOR_ORACLE);
        if (currentPrice > 0) {
            sTokensRequired = (package.usdValueForS * 10**30) / currentPrice;
        } else {
            sTokensRequired = 0;
        }
    }
    
    // Get package info with current dynamic pricing
    function getPackageWithDynamicPricing(uint256 packageId) external view returns (
        uint256 usdcPrice,
        uint256 usdValueForS,
        uint256 currentSTokensRequired,
        uint256 usdcCredits,
        uint256 sonicCredits,
        bool active
    ) {
        CreditPackage memory package = creditPackages[packageId];
        uint256 currentPrice = BEEFY_ORACLE.getPrice(S_TOKEN_FOR_ORACLE);
        
        if (currentPrice > 0) {
            currentSTokensRequired = (package.usdValueForS * 10**30) / currentPrice;
        } else {
            currentSTokensRequired = 0;
        }
        
        return (
            package.usdcPrice,
            package.usdValueForS,
            currentSTokensRequired,
            package.usdcCredits,
            package.sonicCredits,
            package.active
        );
    }
    
    // Receive function to accept native Sonic tokens
    receive() external payable {
        // Allow contract to receive Sonic tokens
    }
    
    // Fallback function
    fallback() external payable {
        revert("Function not found");
    }
}