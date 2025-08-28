// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./SrvcfloCreditsNFTWithRoyalties.sol";

/// @custom:security-contact admin@serviceflowai.com
/// @title SonicMainnetPaymentV2 - Dual Credit System
/// @notice USDC purchases = ERC-20 credits, Native Sonic purchases = ERC-1155 NFT credits
contract SonicMainnetPaymentV2 is Pausable, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Contract addresses
    IERC20 public immutable USDC;
    SrvcfloCreditsNFTWithRoyalties public immutable creditsNFT;
    address public immutable stakingContract;
    address public immutable devWallet;
    
    // ERC-20 Credit balances (for USDC purchases)
    mapping(address => uint256) public userCredits;
    mapping(address => mapping(uint256 => uint256)) public userNFTCreditsSpent; // Track spent NFT credits per package
    
    // Credit packages
    struct CreditPackage {
        uint256 usdcPrice;        // Price in USDC (6 decimals)
        uint256 sonicPrice;       // Price in Sonic tokens (18 decimals)
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
    event CreditsPurchased(
        address indexed user,
        uint256 indexed packageId,
        string tokenType,
        uint256 credits,
        uint256 amount
    );
    
    event CreditsSpent(
        address indexed user,
        uint256 credits,
        string generationType,
        uint256 generationId
    );
    
    event PackageUpdated(
        uint256 indexed packageId,
        uint256 usdcPrice,
        uint256 usdValueForWS,
        uint256 usdcCredits,
        uint256 wsCredits
    );
    
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
        // Starter: 5 USDC = 750 credits, Native Sonic = 1000 credits (33% bonus)
        creditPackages[1] = CreditPackage({
            usdcPrice: 5 * 10**6,      // 5 USDC
            sonicPrice: 5 * 10**18,    // 5 S
            usdcCredits: 750,
            sonicCredits: 1000,        // 33% bonus credits
            active: true
        });
        
        // Pro: 50 USDC = 8000 credits, Native Sonic = 10000 credits (25% bonus)
        creditPackages[2] = CreditPackage({
            usdcPrice: 50 * 10**6,     // 50 USDC
            sonicPrice: 50 * 10**18,   // 50 S
            usdcCredits: 8000,
            sonicCredits: 10000,       // 25% bonus credits
            active: true
        });
        
        // Business: 500 USDC = 100000 credits, Native Sonic = 115000 credits (15% bonus)
        creditPackages[3] = CreditPackage({
            usdcPrice: 500 * 10**6,    // 500 USDC
            sonicPrice: 500 * 10**18,  // 500 S
            usdcCredits: 100000,
            sonicCredits: 115000,      // 15% bonus credits
            active: true
        });
        
        // Enterprise: 1250 USDC = 260000 credits, Native Sonic = 290000 credits (~12% bonus)
        creditPackages[4] = CreditPackage({
            usdcPrice: 1250 * 10**6,   // 1250 USDC
            sonicPrice: 1250 * 10**18, // 1250 S
            usdcCredits: 260000,
            sonicCredits: 290000,      // ~12% bonus credits
            active: true
        });
    }
    
    // Purchase credits with USDC (stored as ERC-20 balance)
    function purchaseCreditsWithUSDC(uint256 packageId) external whenNotPaused nonReentrant {
        CreditPackage memory package = creditPackages[packageId];
        require(package.active, "Package not active");
        require(package.usdcPrice > 0, "Invalid package");
        
        // Transfer USDC from user
        USDC.safeTransferFrom(msg.sender, address(this), package.usdcPrice);
        
        // Distribute payment
        _distributePayment(package.usdcPrice, address(USDC));
        
        // Add ERC-20 credits to user balance
        userCredits[msg.sender] += package.usdcCredits;
        
        emit CreditsPurchased(msg.sender, packageId, "USDC", package.usdcCredits, package.usdcPrice);
    }
    
    // Function removed - wS token payments no longer supported
    // Use purchaseCreditsWithSonic for native Sonic payments instead
    
    // Purchase credits with native Sonic tokens (minted as ERC-1155 NFTs with bonus)
    function purchaseCreditsWithSonic(uint256 packageId) external payable whenNotPaused nonReentrant {
        CreditPackage memory package = creditPackages[packageId];
        require(package.active, "Package not active");
        require(package.sonicCredits > 0, "Invalid package");
        require(msg.value >= package.sonicPrice, "Insufficient Sonic payment");
        
        // Distribute native Sonic payment to protocol wallets
        _distributeSonicPayment(msg.value);
        
        // Mint ERC-1155 NFT credits to user (with bonus)
        // Payment contract should be owner of the NFT contract to call mint
        creditsNFT.mint(msg.sender, packageId, package.sonicCredits, "");
        
        emit CreditsPurchased(msg.sender, packageId, "SONIC", package.sonicCredits, msg.value);
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
    
    function _distributePayment(uint256 amount, address token) private {
        IERC20 paymentToken = IERC20(token);
        
        // Calculate distribution: 50% dev, 25% staking, 15% leaderboard, 10% treasury
        uint256 toStaking = (amount * 25) / 100;  // 25%
        uint256 toDev = (amount * 50) / 100;      // 50%
        uint256 toLeaderboard = (amount * 15) / 100; // 15%
        uint256 toTreasury = amount - toStaking - toDev - toLeaderboard; // Remaining ~10%
        
        // Distribute payments
        paymentToken.safeTransfer(stakingContract, toStaking);
        paymentToken.safeTransfer(devWallet, toDev);
        // Note: For now, sending leaderboard and treasury to dev wallet
        paymentToken.safeTransfer(devWallet, toLeaderboard + toTreasury);
    }
    
    function _distributeSonicPayment(uint256 amount) private {
        // Calculate distribution: 50% dev, 25% staking, 15% leaderboard, 10% treasury
        uint256 toStaking = (amount * 25) / 100;  // 25%
        uint256 toDev = (amount * 50) / 100;      // 50%
        uint256 toLeaderboard = (amount * 15) / 100; // 15%
        uint256 toTreasury = amount - toStaking - toDev - toLeaderboard; // Remaining ~10%
        
        // Distribute native Sonic payments
        payable(stakingContract).transfer(toStaking);
        payable(devWallet).transfer(toDev);
        // Note: For now, sending leaderboard and treasury to dev wallet
        payable(devWallet).transfer(toLeaderboard + toTreasury);
    }
    
    
    // Get user's ERC-1155 credits by package
    function getUserNFTCredits(address user, uint256 packageId) external view returns (uint256) {
        return creditsNFT.balanceOf(user, packageId);
    }
    
    function updatePackage(
        uint256 packageId,
        uint256 usdcPrice,
        uint256 sonicPrice,
        uint256 usdcCredits,
        uint256 sonicCredits,
        bool active
    ) external onlyOwner {
        creditPackages[packageId] = CreditPackage({
            usdcPrice: usdcPrice,
            sonicPrice: sonicPrice,
            usdcCredits: usdcCredits,
            sonicCredits: sonicCredits,
            active: active
        });
        
        emit PackageUpdated(packageId, usdcPrice, sonicPrice, usdcCredits, sonicCredits);
    }
    
    // GIVEAWAY FUNCTIONS - Owner can transfer credits for promotions
    
    /**
     * @dev Transfer ERC-20 credits from one user to another (for giveaways)
     * @param from Source address (must have sufficient credits)
     * @param to Recipient address
     * @param credits Amount of ERC-20 credits to transfer
     */
    function transferERC20Credits(address from, address to, uint256 credits) external onlyOwner {
        require(from != address(0) && to != address(0), "Invalid addresses");
        require(userCredits[from] >= credits, "Insufficient credits");
        require(credits > 0, "Invalid credit amount");
        
        userCredits[from] -= credits;
        userCredits[to] += credits;
        
        emit CreditTransfer(from, to, credits, "ERC20");
    }
    
    /**
     * @dev Gift ERC-20 credits to a user (owner mints credits for giveaways)
     * @param to Recipient address
     * @param credits Amount of credits to gift
     * @param reason Reason for the gift (e.g., "Promotion", "Referral Bonus")
     */
    function giftERC20Credits(address to, uint256 credits, string calldata reason) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(credits > 0, "Invalid credit amount");
        
        userCredits[to] += credits;
        
        emit CreditGifted(to, credits, "ERC20", reason);
    }
    
    /**
     * @dev Gift ERC-1155 NFT credits to a user (owner mints NFT credits)
     * @param to Recipient address  
     * @param packageId Package ID for the NFT credits
     * @param credits Amount of NFT credits to gift
     * @param reason Reason for the gift
     */
    function giftNFTCredits(address to, uint256 packageId, uint256 credits, string calldata reason) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(credits > 0, "Invalid credit amount");
        require(packageId >= 1 && packageId <= 4, "Invalid package ID");
        
        // Mint NFT credits to recipient
        creditsNFT.mint(to, packageId, credits, "");
        
        emit CreditGifted(to, credits, "NFT", reason);
    }
    
    /**
     * @dev Bulk gift credits to multiple users (for mass giveaways)
     * @param recipients Array of recipient addresses
     * @param credits Amount of ERC-20 credits to gift each recipient
     * @param reason Reason for the bulk gift
     */
    function bulkGiftERC20Credits(address[] calldata recipients, uint256 credits, string calldata reason) external onlyOwner {
        require(recipients.length > 0, "No recipients");
        require(credits > 0, "Invalid credit amount");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            if (recipient != address(0)) {
                userCredits[recipient] += credits;
                emit CreditGifted(recipient, credits, "ERC20", reason);
            }
        }
    }
    
    // Additional events for transfers and gifts
    event CreditTransfer(address indexed from, address indexed to, uint256 credits, string creditType);
    event CreditGifted(address indexed recipient, uint256 credits, string creditType, string reason);
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
    
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
    
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
    
    // Receive function to accept native Sonic tokens
    receive() external payable {
        // Allow contract to receive Sonic tokens
    }
    
    // Fallback function
    fallback() external payable {
        revert("Function not found");
    }
}