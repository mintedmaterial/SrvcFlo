// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {ERC721PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title ServiceFlow Subscription NFT (ERC-5643 Compatible)
 * @dev Subscription-based NFT system for ServiceFlow AI platform
 * Features:
 * - ERC-5643 expirable subscription standard
 * - Tiered access with Bandit Kidz NFT holder benefits
 * - Sonic token payments with revenue distribution
 * - Usage tracking and prompt limits
 * - Renewal and upgrade capabilities
 */
/// @custom:security-contact security@serviceflow.ai
contract ServiceFlowSubscription is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    ERC721URIStorageUpgradeable,
    ERC721PausableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{

    // Subscription tiers
    enum SubscriptionTier {
        BANDIT_KIDZ,  // Free for Bandit Kidz holders - 100 prompts
        BASIC,        // $10 USD - 50 prompts
        STANDARD,     // $100 USD - 500 prompts
        PREMIUM,      // $200 USD - 2000 prompts
        UNLIMITED     // $300 USD - unlimited prompts
    }

    // Subscription details structure
    struct Subscription {
        SubscriptionTier tier;
        uint256 expiresAt;
        uint256 promptsUsed;
        uint256 promptsLimit;
        bool isActive;
        address holder;
        bool isBanditKidzHolder;
        uint256 renewalCount;
    }

    // Configuration struct for tiers
    struct TierConfig {
        uint256 priceUSD;        // Price in USD (converted to SONIC)
        uint256 promptLimit;     // Monthly prompt limit
        uint256 duration;        // Duration in seconds (30 days)
        string[] features;       // Available features
    }

    // State variables
    uint256 private _nextTokenId;
    IERC20 public sonicToken;
    IERC721 public banditKidzNFT;

    // Subscription configurations
    mapping(SubscriptionTier => TierConfig) public tierConfigs;
    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => uint256) public userSubscriptions; // user -> tokenId
    mapping(address => bool) public authorizedAgents; // Agents that can consume prompts
    mapping(address => bool) public accessRequests; // Pending access requests

    // Revenue distribution (percentages)
    uint256 public constant LEADERBOARD_SHARE = 15; // 15%
    uint256 public constant DEV_SHARE = 50;         // 50%
    uint256 public constant NFT_STAKING_SHARE = 25; // 25%
    uint256 public constant RESERVE_SHARE = 10;     // 10%

    // Wallet addresses for revenue distribution
    address public leaderboardWallet;
    address public devWallet;
    address public nftStakingWallet;
    address public reserveWallet;

    // Oracle for USD to SONIC conversion
    uint256 public sonicPriceUSD; // Price of SONIC in USD (8 decimals)
    uint256 public lastPriceUpdate;

    // Events
    event SubscriptionMinted(address indexed user, uint256 indexed tokenId, SubscriptionTier tier, uint256 expiresAt);
    event SubscriptionRenewed(uint256 indexed tokenId, uint256 newExpiresAt, uint256 payment);
    event SubscriptionExpired(uint256 indexed tokenId, address indexed user);
    event PromptUsed(uint256 indexed tokenId, address indexed agent, uint256 promptsRemaining);
    event TierUpgraded(uint256 indexed tokenId, SubscriptionTier oldTier, SubscriptionTier newTier);
    event PaymentDistributed(uint256 amount, address leaderboard, address dev, address nftStaking, address reserve);
    event AccessRequested(address indexed user, string reason);
    event AccessGranted(address indexed user, address indexed admin);
    event PriceUpdated(uint256 newPrice, uint256 timestamp);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner,
        address _sonicToken,
        address _banditKidzNFT,
        address _leaderboardWallet,
        address _devWallet,
        address _nftStakingWallet,
        address _reserveWallet
    ) public initializer {
        __ERC721_init("ServiceFlow Subscription", "SFS");
        __ERC721Enumerable_init();
        __ERC721URIStorage_init();
        __ERC721Pausable_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _nextTokenId = 1;
        sonicToken = IERC20(_sonicToken);
        banditKidzNFT = IERC721(_banditKidzNFT);
        leaderboardWallet = _leaderboardWallet;
        devWallet = _devWallet;
        nftStakingWallet = _nftStakingWallet;
        reserveWallet = _reserveWallet;

        // Initialize tier configurations
        _initializeTiers();

        // Set initial SONIC price (example: $0.75)
        sonicPriceUSD = 75000000; // $0.75 with 8 decimals
        lastPriceUpdate = block.timestamp;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://ff3c5e2beaea9f85fee3200bfe28da16.r2.cloudflarestorage.com/metadata/subscriptions/";
    }

    function _initializeTiers() private {
        // Duration: 30 days in seconds
        uint256 monthlyDuration = 30 * 24 * 60 * 60;

        // Initialize each tier configuration
        tierConfigs[SubscriptionTier.BANDIT_KIDZ] = TierConfig({
            priceUSD: 0,
            promptLimit: 100,
            duration: monthlyDuration,
            features: new string[](0)
        });

        tierConfigs[SubscriptionTier.BASIC] = TierConfig({
            priceUSD: 10 * 1e8, // $10 with 8 decimals
            promptLimit: 50,
            duration: monthlyDuration,
            features: new string[](0)
        });

        tierConfigs[SubscriptionTier.STANDARD] = TierConfig({
            priceUSD: 100 * 1e8, // $100 with 8 decimals
            promptLimit: 500,
            duration: monthlyDuration,
            features: new string[](0)
        });

        tierConfigs[SubscriptionTier.PREMIUM] = TierConfig({
            priceUSD: 200 * 1e8, // $200 with 8 decimals
            promptLimit: 2000,
            duration: monthlyDuration,
            features: new string[](0)
        });

        tierConfigs[SubscriptionTier.UNLIMITED] = TierConfig({
            priceUSD: 300 * 1e8, // $300 with 8 decimals
            promptLimit: type(uint256).max,
            duration: monthlyDuration,
            features: new string[](0)
        });
    }

    /**
     * @dev Check if user holds Bandit Kidz NFT
     */
    function isBanditKidzHolder(address user) public view returns (bool) {
        return banditKidzNFT.balanceOf(user) > 0;
    }

    /**
     * @dev Calculate price in SONIC tokens based on USD price
     */
    function calculateSonicPrice(uint256 usdPrice, bool isBanditHolder) public view returns (uint256) {
        if (usdPrice == 0) return 0;

        // Apply 50% discount for Bandit Kidz holders
        uint256 finalPrice = isBanditHolder ? usdPrice / 2 : usdPrice;

        // Convert USD to SONIC: (USD_amount * 1e18) / (SONIC_price_in_USD)
        return (finalPrice * 1e18) / sonicPriceUSD;
    }

    /**
     * @dev Request access to the platform (for non-NFT holders)
     */
    function requestAccess(string calldata reason) external {
        require(!isBanditKidzHolder(msg.sender), "Bandit Kidz holders have automatic access");
        require(userSubscriptions[msg.sender] == 0, "Already has subscription");

        accessRequests[msg.sender] = true;
        emit AccessRequested(msg.sender, reason);
    }

    /**
     * @dev Grant access to user (admin function)
     */
    function grantAccess(address user) external onlyOwner {
        require(accessRequests[user], "No access request found");
        accessRequests[user] = false;
        emit AccessGranted(user, msg.sender);
    }

    /**
     * @dev Mint free subscription for Bandit Kidz NFT holders
     */
    function mintFreeSubscription() external whenNotPaused {
        require(isBanditKidzHolder(msg.sender), "Must hold Bandit Kidz NFT");
        require(userSubscriptions[msg.sender] == 0, "Already has active subscription");

        _mintSubscription(msg.sender, SubscriptionTier.BANDIT_KIDZ, true);
    }

    /**
     * @dev Mint paid subscription
     */
    function mintSubscription(SubscriptionTier tier) external nonReentrant whenNotPaused {
        require(tier != SubscriptionTier.BANDIT_KIDZ, "Use mintFreeSubscription for Bandit Kidz tier");
        require(userSubscriptions[msg.sender] == 0, "Already has active subscription");
        require(accessRequests[msg.sender] || isBanditKidzHolder(msg.sender), "Access not granted");

        bool isHolder = isBanditKidzHolder(msg.sender);
        uint256 usdPrice = tierConfigs[tier].priceUSD;
        uint256 sonicAmount = calculateSonicPrice(usdPrice, isHolder);

        require(sonicAmount > 0, "Invalid price calculation");

        // Transfer payment
        require(sonicToken.transferFrom(msg.sender, address(this), sonicAmount), "Payment failed");

        // Distribute revenue
        _distributeRevenue(sonicAmount);

        _mintSubscription(msg.sender, tier, isHolder);
    }

    function _mintSubscription(address to, SubscriptionTier tier, bool isBanditHolder) private {
        uint256 tokenId = _nextTokenId++;
        TierConfig storage config = tierConfigs[tier];
        uint256 expiresAt = block.timestamp + config.duration;

        subscriptions[tokenId] = Subscription({
            tier: tier,
            expiresAt: expiresAt,
            promptsUsed: 0,
            promptsLimit: config.promptLimit,
            isActive: true,
            holder: to,
            isBanditKidzHolder: isBanditHolder,
            renewalCount: 0
        });

        userSubscriptions[to] = tokenId;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked(Strings.toString(uint256(tier)), ".json")));

        emit SubscriptionMinted(to, tokenId, tier, expiresAt);
    }

    /**
     * @dev Renew existing subscription (ERC-5643 standard)
     */
    function renewSubscription(uint256 tokenId) external nonReentrant whenNotPaused {
        require(_ownerOf(tokenId) == msg.sender, "Not subscription owner");

        Subscription storage sub = subscriptions[tokenId];
        require(sub.isActive, "Subscription not active");

        TierConfig storage config = tierConfigs[sub.tier];

        if (sub.tier != SubscriptionTier.BANDIT_KIDZ) {
            uint256 sonicAmount = calculateSonicPrice(config.priceUSD, sub.isBanditKidzHolder);
            require(sonicToken.transferFrom(msg.sender, address(this), sonicAmount), "Payment failed");
            _distributeRevenue(sonicAmount);
        }

        // Extend expiration from current time or existing expiry (whichever is later)
        uint256 baseTime = block.timestamp > sub.expiresAt ? block.timestamp : sub.expiresAt;
        sub.expiresAt = baseTime + config.duration;
        sub.promptsUsed = 0; // Reset usage for new period
        sub.isActive = true;
        sub.renewalCount++;

        emit SubscriptionRenewed(tokenId, sub.expiresAt, 0);
    }

    /**
     * @dev Upgrade subscription tier
     */
    function upgradeSubscription(uint256 tokenId, SubscriptionTier newTier) external nonReentrant whenNotPaused {
        require(_ownerOf(tokenId) == msg.sender, "Not subscription owner");
        require(newTier > subscriptions[tokenId].tier, "Can only upgrade to higher tier");

        Subscription storage sub = subscriptions[tokenId];
        require(sub.isActive && !isExpired(tokenId), "Subscription expired");

        // Calculate prorated price difference
        TierConfig storage oldConfig = tierConfigs[sub.tier];
        TierConfig storage newConfig = tierConfigs[newTier];

        uint256 oldPrice = calculateSonicPrice(oldConfig.priceUSD, sub.isBanditKidzHolder);
        uint256 newPrice = calculateSonicPrice(newConfig.priceUSD, sub.isBanditKidzHolder);

        if (newPrice > oldPrice) {
            uint256 priceDiff = newPrice - oldPrice;
            require(sonicToken.transferFrom(msg.sender, address(this), priceDiff), "Payment failed");
            _distributeRevenue(priceDiff);
        }

        SubscriptionTier oldTier = sub.tier;
        sub.tier = newTier;
        sub.promptsLimit = newConfig.promptLimit;

        // Update metadata
        _setTokenURI(tokenId, string(abi.encodePacked(Strings.toString(uint256(newTier)), ".json")));

        emit TierUpgraded(tokenId, oldTier, newTier);
    }

    /**
     * @dev Use prompts (called by authorized agents)
     */
    function usePrompts(address user, uint256 promptCount) external {
        require(authorizedAgents[msg.sender], "Not authorized agent");

        uint256 tokenId = userSubscriptions[user];
        require(tokenId != 0, "No active subscription");

        Subscription storage sub = subscriptions[tokenId];
        require(sub.isActive && !isExpired(tokenId), "Subscription expired");

        if (sub.promptsLimit != type(uint256).max) {
            require(sub.promptsUsed + promptCount <= sub.promptsLimit, "Insufficient prompts");
            sub.promptsUsed += promptCount;
        }

        uint256 remaining = sub.promptsLimit == type(uint256).max ?
            type(uint256).max : sub.promptsLimit - sub.promptsUsed;

        emit PromptUsed(tokenId, msg.sender, remaining);
    }

    /**
     * @dev Cancel subscription
     */
    function cancelSubscription(uint256 tokenId, string calldata reason) external {
        require(_ownerOf(tokenId) == msg.sender, "Not subscription owner");

        Subscription storage sub = subscriptions[tokenId];
        sub.isActive = false;
        userSubscriptions[sub.holder] = 0;

        // Burn the NFT
        _burn(tokenId);

        emit SubscriptionExpired(tokenId, msg.sender);
    }

    /**
     * @dev Check if subscription is expired (ERC-5643 standard)
     */
    function isExpired(uint256 tokenId) public view returns (bool) {
        return subscriptions[tokenId].expiresAt < block.timestamp;
    }

    /**
     * @dev Get expiration timestamp (ERC-5643 standard)
     */
    function getExpiration(uint256 tokenId) external view returns (uint256) {
        return subscriptions[tokenId].expiresAt;
    }

    /**
     * @dev Get subscription details for user
     */
    function getUserSubscription(address user) external view returns (
        uint256 tokenId,
        SubscriptionTier tier,
        uint256 expiresAt,
        uint256 promptsUsed,
        uint256 promptsLimit,
        bool isActive,
        bool expired,
        uint256 renewalCount
    ) {
        tokenId = userSubscriptions[user];
        if (tokenId == 0) return (0, SubscriptionTier.BASIC, 0, 0, 0, false, true, 0);

        Subscription storage sub = subscriptions[tokenId];
        return (
            tokenId,
            sub.tier,
            sub.expiresAt,
            sub.promptsUsed,
            sub.promptsLimit,
            sub.isActive,
            isExpired(tokenId),
            sub.renewalCount
        );
    }

    /**
     * @dev Distribute revenue to wallets based on configured percentages
     */
    function _distributeRevenue(uint256 amount) private {
        uint256 leaderboardShare = (amount * LEADERBOARD_SHARE) / 100;
        uint256 devShare = (amount * DEV_SHARE) / 100;
        uint256 nftStakingShare = (amount * NFT_STAKING_SHARE) / 100;
        uint256 reserveShare = (amount * RESERVE_SHARE) / 100;

        require(sonicToken.transfer(leaderboardWallet, leaderboardShare), "Leaderboard transfer failed");
        require(sonicToken.transfer(devWallet, devShare), "Dev transfer failed");
        require(sonicToken.transfer(nftStakingWallet, nftStakingShare), "NFT staking transfer failed");
        require(sonicToken.transfer(reserveWallet, reserveShare), "Reserve transfer failed");

        emit PaymentDistributed(amount, leaderboardWallet, devWallet, nftStakingWallet, reserveWallet);
    }

    // Admin functions
    function setAuthorizedAgent(address agent, bool authorized) external onlyOwner {
        authorizedAgents[agent] = authorized;
    }

    function updateSonicPrice(uint256 newPriceUSD) external onlyOwner {
        sonicPriceUSD = newPriceUSD;
        lastPriceUpdate = block.timestamp;
        emit PriceUpdated(newPriceUSD, block.timestamp);
    }

    function updateTierConfig(
        SubscriptionTier tier,
        uint256 priceUSD,
        uint256 promptLimit,
        uint256 duration
    ) external onlyOwner {
        tierConfigs[tier].priceUSD = priceUSD;
        tierConfigs[tier].promptLimit = promptLimit;
        tierConfigs[tier].duration = duration;
    }

    function expireSubscription(uint256 tokenId) external onlyOwner {
        Subscription storage sub = subscriptions[tokenId];
        sub.isActive = false;
        userSubscriptions[sub.holder] = 0;
        emit SubscriptionExpired(tokenId, sub.holder);
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = sonicToken.balanceOf(address(this));
        require(sonicToken.transfer(owner(), balance), "Emergency withdrawal failed");
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Required overrides for multiple inheritance
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721PausableUpgradeable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721URIStorageUpgradeable)
        returns (bool)
    {
        // Add ERC-5643 interface support
        return interfaceId == bytes4(keccak256("getExpiration(uint256)")) ||
               super.supportsInterface(interfaceId);
    }

    // Prevent transfers (soulbound NFTs)
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual {
        require(from == address(0) || to == address(0), "Subscription NFTs are non-transferable");
    }
}