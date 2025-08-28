// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./SrvcfloCreditsNFTMainnet.sol";

/// @custom:security-contact admin@serviceflowai.com
contract SonicMainnetPayment is Pausable, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Contract addresses
    IERC20 public immutable USDC;
    IERC20 public immutable WS_TOKEN;
    SrvcfloCreditsNFTMainnet public immutable creditsNFT;
    address public immutable stakingContract;
    address public immutable devWallet;
    
    // Credit packages
    struct CreditPackage {
        uint256 usdcPrice;    // Price in USDC (6 decimals)
        uint256 usdcCredits;  // Credits for USDC payment
        uint256 wsCredits;    // Credits for wS payment (with bonus)
        bool active;
    }
    
    mapping(uint256 => CreditPackage) public creditPackages;
    
    // Events
    event CreditsPurchased(
        address indexed user,
        uint256 indexed packageId,
        uint256 credits,
        address token,
        uint256 amount
    );
    
    event PackageUpdated(
        uint256 indexed packageId,
        uint256 usdcPrice,
        uint256 usdcCredits,
        uint256 wsCredits
    );
    
    constructor(
        address initialOwner,
        address _usdc,
        address _wsToken,
        address _creditsNFT,
        address _stakingContract,
        address _devWallet
    ) Ownable(initialOwner) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_wsToken != address(0), "Invalid wS token address");
        require(_creditsNFT != address(0), "Invalid credits NFT address");
        require(_stakingContract != address(0), "Invalid staking address");
        require(_devWallet != address(0), "Invalid dev wallet address");
        
        USDC = IERC20(_usdc);
        WS_TOKEN = IERC20(_wsToken);
        creditsNFT = SrvcfloCreditsNFTMainnet(_creditsNFT);
        stakingContract = _stakingContract;
        devWallet = _devWallet;
        
        // Initialize default packages
        _initializePackages();
    }
    
    function _initializePackages() private {
        // Starter: 5 USDC = 750 credits, 5 USD worth of wS = 1000 credits (25% bonus)
        creditPackages[1] = CreditPackage({
            usdcPrice: 5_000_000,      // 5 USDC (6 decimals)
            usdcCredits: 750,
            wsCredits: 1000,           // 25% bonus credits
            active: true
        });
        
        // Pro: 50 USDC = 8000 credits, 50 USD worth of wS = 10000 credits (25% bonus)
        creditPackages[2] = CreditPackage({
            usdcPrice: 50_000_000,     // 50 USDC (6 decimals)
            usdcCredits: 8000,
            wsCredits: 10000,          // 25% bonus credits
            active: true
        });
        
        // Business: 500 USDC = 100000 credits, 500 USD worth of wS = 115000 credits (15% bonus)
        creditPackages[3] = CreditPackage({
            usdcPrice: 500_000_000,    // 500 USDC (6 decimals)
            usdcCredits: 100000,
            wsCredits: 115000,         // 15% bonus credits
            active: true
        });
        
        // Enterprise: 1250 USDC = 260000 credits, 1250 USD worth of wS = 290000 credits (~11.5% bonus)
        creditPackages[4] = CreditPackage({
            usdcPrice: 1250_000_000,   // 1250 USDC (6 decimals)
            usdcCredits: 260000,
            wsCredits: 290000,         // ~11.5% bonus credits
            active: true
        });
    }
    
    function purchaseCreditsWithUSDC(uint256 packageId) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        CreditPackage memory package = creditPackages[packageId];
        require(package.active, "Package not active");
        require(package.usdcPrice > 0, "Invalid package");
        
        // Transfer USDC from user
        USDC.safeTransferFrom(msg.sender, address(this), package.usdcPrice);
        
        // Distribute payment
        _distributePayment(package.usdcPrice, address(USDC));
        
        // Mint credits to user
        creditsNFT.mint(msg.sender, packageId, package.usdcCredits, "");
        
        emit CreditsPurchased(
            msg.sender,
            packageId,
            package.usdcCredits,
            address(USDC),
            package.usdcPrice
        );
    }
    
    function purchaseCreditsWithWS(uint256 packageId, uint256 wsAmount) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        CreditPackage memory package = creditPackages[packageId];
        require(package.active, "Package not active");
        require(package.wsCredits > 0, "Invalid package");
        require(wsAmount > 0, "Invalid wS amount");
        
        // Transfer wS from user
        WS_TOKEN.safeTransferFrom(msg.sender, address(this), wsAmount);
        
        // Distribute payment
        _distributePayment(wsAmount, address(WS_TOKEN));
        
        // Mint credits to user (with bonus)
        creditsNFT.mint(msg.sender, packageId, package.wsCredits, "");
        
        emit CreditsPurchased(
            msg.sender,
            packageId,
            package.wsCredits,
            address(WS_TOKEN),
            wsAmount
        );
    }
    
    function _distributePayment(uint256 amount, address token) private {
        IERC20 paymentToken = IERC20(token);
        
        // Calculate distribution
        uint256 toStaking = (amount * 25) / 100;  // 25%
        uint256 toDev = (amount * 50) / 100;      // 50%
        uint256 toLeaderboard = (amount * 15) / 100; // 15%
        uint256 toTreasury = amount - toStaking - toDev - toLeaderboard; // Remaining ~10%
        
        // Distribute payments
        paymentToken.safeTransfer(stakingContract, toStaking);
        paymentToken.safeTransfer(devWallet, toDev);
        // Note: Leaderboard and treasury distributions would need specific addresses
        paymentToken.safeTransfer(devWallet, toLeaderboard + toTreasury); // Temporary to dev wallet
    }
    
    function updatePackage(
        uint256 packageId,
        uint256 usdcPrice,
        uint256 usdcCredits,
        uint256 wsCredits,
        bool active
    ) external onlyOwner {
        creditPackages[packageId] = CreditPackage({
            usdcPrice: usdcPrice,
            usdcCredits: usdcCredits,
            wsCredits: wsCredits,
            active: active
        });
        
        emit PackageUpdated(packageId, usdcPrice, usdcCredits, wsCredits);
    }
    
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
}