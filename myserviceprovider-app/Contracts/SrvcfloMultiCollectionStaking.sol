// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title SrvcfloMultiCollectionStaking V3
 * @dev Enhanced NFT staking contract supporting multiple collections
 * @notice Supports Bandit Kidz NFTs and future NFT collections with configurable rewards
 * @author ServiceFlow AI Team
 */
contract SrvcfloMultiCollectionStaking is ReentrancyGuard, AccessControl, Pausable, IERC721Receiver {
    using SafeERC20 for IERC20;
    using Address for address payable;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    bytes32 public constant COLLECTION_MANAGER_ROLE = keccak256("COLLECTION_MANAGER_ROLE");

    // Time-lock periods in seconds
    uint256 public constant LOCK_30_DAYS = 30 days;
    uint256 public constant LOCK_60_DAYS = 60 days;
    uint256 public constant LOCK_90_DAYS = 90 days;
    uint256 public constant LOCK_120_DAYS = 120 days;
    uint256 public constant LOCK_365_DAYS = 365 days;

    // Bonus multipliers (scaled by 10000 for precision)
    uint256 public constant BONUS_30_DAYS = 1500;   // +15%
    uint256 public constant BONUS_60_DAYS = 3500;   // +35%
    uint256 public constant BONUS_90_DAYS = 6000;   // +60%
    uint256 public constant BONUS_120_DAYS = 9000;  // +90%
    uint256 public constant BONUS_365_DAYS = 15000; // +150%
    uint256 public constant BASE_MULTIPLIER = 10000; // 100%

    // Collection configuration
    struct CollectionInfo {
        IERC721 contractAddress;
        bool isActive;
        uint256 baseRewardMultiplier; // Base reward multiplier for this collection (scaled by 10000)
        string name;
        uint256 addedAt;
        uint256 totalStaked; // Total NFTs staked from this collection
    }

    // Enhanced staking info with collection support
    struct StakeInfo {
        address staker;
        address collection; // NFT collection address
        uint256 stakedAt;
        uint256 unstakedAt; // 0 if still staked
        uint256 lockPeriod; // 0 for no lock, otherwise lock duration in seconds
        uint256 lockEndTime; // timestamp when lock expires
        uint256 bonusMultiplier; // time-based bonus multiplier
        uint256 collectionMultiplier; // collection-based multiplier
        uint256 totalMultiplier; // bonusMultiplier * collectionMultiplier
        bool earlyUnstake; // true if unstaked before lock period
        uint256 lastClaimedDistribution; // last distribution epoch claimed
    }
    
    // Distribution tracking
    struct Distribution {
        uint256 amount; // amount per reward point
        address token; // token address (address(0) for ETH)
        uint256 timestamp;
        uint256 totalStakedAtDistribution; // total NFTs staked when distribution was made
        uint256 totalRewardPoints; // total reward points at distribution time
        bool distributed;
        mapping(address => bool) eligibleCollections; // which collections are eligible for this distribution
    }
    
    // Collections registry
    mapping(address => CollectionInfo) public collections;
    address[] public supportedCollections;
    
    // Staking storage - Global unique key: keccak256(collection, tokenId)
    mapping(bytes32 => StakeInfo) public stakes;
    mapping(address => mapping(address => uint256[])) public userStakedTokensByCollection; // user => collection => tokenIds[]
    mapping(bytes32 => uint256) public stakedTokenIndex; // stakeKey => index in user array
    
    // Distribution storage
    Distribution[] public distributions;
    mapping(address => mapping(uint256 => bool)) public distributionClaimed; // user => distributionId => claimed
    
    // Global state
    uint256 public totalStaked;
    uint256 public totalRewardPoints; // sum of all staked NFTs' total multipliers
    uint256 public currentDistributionId;
    bool public stakingEnabled = true;
    
    // Early unstake penalty (10% penalty, scaled by 10000)
    uint256 public constant EARLY_UNSTAKE_PENALTY = 1000; // 10%
    address public penaltyWallet;
    
    // Events
    event CollectionAdded(address indexed collection, string name, uint256 baseRewardMultiplier);
    event CollectionUpdated(address indexed collection, bool isActive, uint256 baseRewardMultiplier);
    event CollectionRemoved(address indexed collection);
    event Staked(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 timestamp, uint256 lockPeriod, uint256 totalMultiplier);
    event Unstaked(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 timestamp, bool earlyUnstake, uint256 penalty);
    event DistributionAdded(uint256 indexed distributionId, uint256 amount, address token, uint256 totalStaked, uint256 totalRewardPoints);
    event RewardsClaimed(address indexed user, uint256 indexed distributionId, uint256 amount, address token);
    event StakingToggled(bool enabled);
    event PenaltyWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event EmergencyWithdraw(address indexed token, uint256 amount, address indexed to);

    /**
     * @dev Constructor sets up roles and initializes the contract with Bandit Kidz collection
     * @param _banditKidzNFT Address of the Bandit Kidz NFT contract
     * @param _penaltyWallet Address to receive early unstake penalties
     */
    constructor(address _banditKidzNFT, address _penaltyWallet) {
        require(_banditKidzNFT != address(0), "Zero address");
        require(_penaltyWallet != address(0), "Zero penalty wallet");
        
        penaltyWallet = _penaltyWallet;
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        _grantRole(COLLECTION_MANAGER_ROLE, msg.sender);
        
        // Add Bandit Kidz collection as the first supported collection
        _addCollection(_banditKidzNFT, "Bandit Kidz", BASE_MULTIPLIER);
    }

    /**
     * @dev Add a new NFT collection for staking
     * @param collectionAddress The NFT contract address
     * @param name Human readable name for the collection
     * @param baseRewardMultiplier Base reward multiplier for this collection (scaled by 10000)
     */
    function addCollection(
        address collectionAddress,
        string calldata name,
        uint256 baseRewardMultiplier
    ) external onlyRole(COLLECTION_MANAGER_ROLE) {
        _addCollection(collectionAddress, name, baseRewardMultiplier);
    }

    /**
     * @dev Internal function to add collection
     */
    function _addCollection(
        address collectionAddress,
        string memory name,
        uint256 baseRewardMultiplier
    ) internal {
        require(collectionAddress != address(0), "Zero address");
        require(collections[collectionAddress].contractAddress == IERC721(address(0)), "Collection already exists");
        require(baseRewardMultiplier >= 5000 && baseRewardMultiplier <= 50000, "Invalid multiplier"); // 0.5x to 5x
        require(bytes(name).length > 0, "Empty name");

        collections[collectionAddress] = CollectionInfo({
            contractAddress: IERC721(collectionAddress),
            isActive: true,
            baseRewardMultiplier: baseRewardMultiplier,
            name: name,
            addedAt: block.timestamp,
            totalStaked: 0
        });

        supportedCollections.push(collectionAddress);
        emit CollectionAdded(collectionAddress, name, baseRewardMultiplier);
    }

    /**
     * @dev Update collection parameters
     * @param collectionAddress The NFT contract address
     * @param isActive Whether the collection is active for staking
     * @param baseRewardMultiplier New base reward multiplier
     */
    function updateCollection(
        address collectionAddress,
        bool isActive,
        uint256 baseRewardMultiplier
    ) external onlyRole(COLLECTION_MANAGER_ROLE) {
        require(collections[collectionAddress].contractAddress != IERC721(address(0)), "Collection not found");
        require(baseRewardMultiplier >= 5000 && baseRewardMultiplier <= 50000, "Invalid multiplier");

        collections[collectionAddress].isActive = isActive;
        collections[collectionAddress].baseRewardMultiplier = baseRewardMultiplier;
        
        emit CollectionUpdated(collectionAddress, isActive, baseRewardMultiplier);
    }

    /**
     * @dev Remove a collection (only if no tokens are staked)
     * @param collectionAddress The NFT contract address to remove
     */
    function removeCollection(address collectionAddress) external onlyRole(COLLECTION_MANAGER_ROLE) {
        require(collections[collectionAddress].contractAddress != IERC721(address(0)), "Collection not found");
        require(collections[collectionAddress].totalStaked == 0, "Tokens still staked");

        // Remove from supportedCollections array
        for (uint256 i = 0; i < supportedCollections.length; i++) {
            if (supportedCollections[i] == collectionAddress) {
                supportedCollections[i] = supportedCollections[supportedCollections.length - 1];
                supportedCollections.pop();
                break;
            }
        }

        delete collections[collectionAddress];
        emit CollectionRemoved(collectionAddress);
    }

    /**
     * @dev Stake an NFT with optional time-lock
     * @param collectionAddress The NFT collection address
     * @param tokenId The NFT token ID to stake
     * @param lockPeriod Lock period in seconds (0 for no lock)
     */
    function stake(address collectionAddress, uint256 tokenId, uint256 lockPeriod) external nonReentrant whenNotPaused {
        _stakeInternal(collectionAddress, tokenId, lockPeriod);
    }

    /**
     * @dev Stake multiple NFTs from the same collection with the same time-lock
     * @param collectionAddress The NFT collection address
     * @param tokenIds Array of NFT token IDs to stake
     * @param lockPeriod Lock period in seconds (0 for no lock)
     */
    function stakeBatch(
        address collectionAddress,
        uint256[] calldata tokenIds,
        uint256 lockPeriod
    ) external nonReentrant whenNotPaused {
        require(tokenIds.length > 0, "Empty array");
        require(tokenIds.length <= 50, "Too many tokens"); // Gas optimization
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _stakeInternal(collectionAddress, tokenIds[i], lockPeriod);
        }
    }

    /**
     * @dev Internal stake function with collection and time-lock logic
     */
    function _stakeInternal(address collectionAddress, uint256 tokenId, uint256 lockPeriod) internal {
        require(stakingEnabled, "Staking disabled");
        
        CollectionInfo storage collection = collections[collectionAddress];
        require(collection.contractAddress != IERC721(address(0)), "Collection not supported");
        require(collection.isActive, "Collection not active");
        require(collection.contractAddress.ownerOf(tokenId) == msg.sender, "Not owner");
        
        bytes32 stakeKey = keccak256(abi.encodePacked(collectionAddress, tokenId));
        require(stakes[stakeKey].staker == address(0), "Already staked");
        
        // Calculate multipliers
        uint256 bonusMultiplier = _calculateBonusMultiplier(lockPeriod);
        uint256 collectionMultiplier = collection.baseRewardMultiplier;
        uint256 totalMultiplier = (bonusMultiplier * collectionMultiplier) / BASE_MULTIPLIER;
        uint256 lockEndTime = lockPeriod > 0 ? block.timestamp + lockPeriod : 0;
        
        // Transfer NFT to this contract
        collection.contractAddress.safeTransferFrom(msg.sender, address(this), tokenId);
        
        // Record stake info
        stakes[stakeKey] = StakeInfo({
            staker: msg.sender,
            collection: collectionAddress,
            stakedAt: block.timestamp,
            unstakedAt: 0,
            lockPeriod: lockPeriod,
            lockEndTime: lockEndTime,
            bonusMultiplier: bonusMultiplier,
            collectionMultiplier: collectionMultiplier,
            totalMultiplier: totalMultiplier,
            earlyUnstake: false,
            lastClaimedDistribution: currentDistributionId
        });
        
        // Add to user's staked tokens
        userStakedTokensByCollection[msg.sender][collectionAddress].push(tokenId);
        stakedTokenIndex[stakeKey] = userStakedTokensByCollection[msg.sender][collectionAddress].length - 1;
        
        // Update global state
        totalStaked++;
        totalRewardPoints += totalMultiplier;
        collection.totalStaked++;
        
        emit Staked(msg.sender, collectionAddress, tokenId, block.timestamp, lockPeriod, totalMultiplier);
    }

    /**
     * @dev Calculate bonus multiplier based on lock period
     */
    function _calculateBonusMultiplier(uint256 lockPeriod) internal pure returns (uint256) {
        if (lockPeriod == 0) {
            return BASE_MULTIPLIER;
        } else if (lockPeriod == LOCK_30_DAYS) {
            return BASE_MULTIPLIER + BONUS_30_DAYS;
        } else if (lockPeriod == LOCK_60_DAYS) {
            return BASE_MULTIPLIER + BONUS_60_DAYS;
        } else if (lockPeriod == LOCK_90_DAYS) {
            return BASE_MULTIPLIER + BONUS_90_DAYS;
        } else if (lockPeriod == LOCK_120_DAYS) {
            return BASE_MULTIPLIER + BONUS_120_DAYS;
        } else if (lockPeriod == LOCK_365_DAYS) {
            return BASE_MULTIPLIER + BONUS_365_DAYS;
        } else {
            revert("Invalid lock period");
        }
    }

    /**
     * @dev Unstake an NFT
     * @param collectionAddress The NFT collection address
     * @param tokenId The NFT token ID to unstake
     */
    function unstake(address collectionAddress, uint256 tokenId) external nonReentrant {
        _unstakeInternal(collectionAddress, tokenId);
    }

    /**
     * @dev Unstake multiple NFTs from the same collection
     */
    function unstakeBatch(
        address collectionAddress,
        uint256[] calldata tokenIds
    ) external nonReentrant {
        require(tokenIds.length > 0, "Empty array");
        require(tokenIds.length <= 50, "Too many tokens");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _unstakeInternal(collectionAddress, tokenIds[i]);
        }
    }

    /**
     * @dev Internal unstake function with penalty logic
     */
    function _unstakeInternal(address collectionAddress, uint256 tokenId) internal {
        bytes32 stakeKey = keccak256(abi.encodePacked(collectionAddress, tokenId));
        StakeInfo storage stakeInfo = stakes[stakeKey];
        require(stakeInfo.staker == msg.sender, "Not staker");
        require(stakeInfo.unstakedAt == 0, "Already unstaked");
        
        bool isEarlyUnstake = stakeInfo.lockEndTime > 0 && block.timestamp < stakeInfo.lockEndTime;
        uint256 penalty = 0;
        
        // Calculate penalty for early unstake
        if (isEarlyUnstake) {
            stakeInfo.earlyUnstake = true;
            penalty = _calculateEarlyUnstakePenalty(msg.sender);
        }
        
        // Mark as unstaked
        stakeInfo.unstakedAt = block.timestamp;
        
        // Remove from user's staked tokens array
        _removeFromUserStakedTokens(msg.sender, collectionAddress, tokenId, stakeKey);
        
        // Update global state
        totalStaked--;
        totalRewardPoints -= stakeInfo.totalMultiplier;
        collections[collectionAddress].totalStaked--;
        
        // Apply penalty if early unstake
        if (penalty > 0) {
            _applyEarlyUnstakePenalty(msg.sender, penalty);
        }
        
        // Return NFT to user
        IERC721(collectionAddress).safeTransferFrom(address(this), msg.sender, tokenId);
        
        emit Unstaked(msg.sender, collectionAddress, tokenId, block.timestamp, isEarlyUnstake, penalty);
    }

    /**
     * @dev Remove token from user's staked tokens array for specific collection
     */
    function _removeFromUserStakedTokens(
        address user,
        address collectionAddress,
        uint256 tokenId,
        bytes32 stakeKey
    ) internal {
        uint256[] storage userTokens = userStakedTokensByCollection[user][collectionAddress];
        uint256 lastIndex = userTokens.length - 1;
        uint256 tokenIndex = stakedTokenIndex[stakeKey];
        
        if (tokenIndex != lastIndex) {
            uint256 lastTokenId = userTokens[lastIndex];
            userTokens[tokenIndex] = lastTokenId;
            bytes32 lastTokenStakeKey = keccak256(abi.encodePacked(collectionAddress, lastTokenId));
            stakedTokenIndex[lastTokenStakeKey] = tokenIndex;
        }
        
        userTokens.pop();
        delete stakedTokenIndex[stakeKey];
    }

    /**
     * @dev Calculate early unstake penalty based on user's pending rewards
     */
    function _calculateEarlyUnstakePenalty(address user) internal view returns (uint256) {
        (uint256[] memory amounts, address[] memory tokens) = this.getUserPendingRewards(user);
        uint256 totalPenalty = 0;
        
        for (uint256 i = 0; i < amounts.length; i++) {
            if (tokens[i] == address(0)) { // ETH rewards
                totalPenalty += (amounts[i] * EARLY_UNSTAKE_PENALTY) / 10000;
            }
        }
        
        return totalPenalty;
    }

    /**
     * @dev Apply early unstake penalty
     */
    function _applyEarlyUnstakePenalty(address user, uint256 penalty) internal {
        if (penalty > 0 && address(this).balance >= penalty) {
            payable(penaltyWallet).sendValue(penalty);
        }
    }

    /**
     * @dev Add distribution with collection eligibility
     * @param amount Amount per reward point
     * @param token Token address (address(0) for ETH)
     * @param eligibleCollections Array of collection addresses eligible for this distribution
     */
    function addDistribution(
        uint256 amount,
        address token,
        address[] calldata eligibleCollections
    ) external payable onlyRole(DISTRIBUTOR_ROLE) nonReentrant {
        require(totalStaked > 0, "No tokens staked");
        require(amount > 0, "Zero amount");
        require(eligibleCollections.length > 0, "No eligible collections");

        // Calculate total eligible reward points
        uint256 totalEligiblePoints = 0;
        for (uint256 i = 0; i < supportedCollections.length; i++) {
            address collection = supportedCollections[i];
            bool isEligible = false;
            
            for (uint256 j = 0; j < eligibleCollections.length; j++) {
                if (eligibleCollections[j] == collection) {
                    isEligible = true;
                    break;
                }
            }
            
            if (isEligible && collections[collection].totalStaked > 0) {
                // This is a simplified calculation - in practice, you'd sum up all reward points
                // from stakes belonging to eligible collections
                totalEligiblePoints += collections[collection].totalStaked * collections[collection].baseRewardMultiplier;
            }
        }
        
        require(totalEligiblePoints > 0, "No eligible stakers");
        
        uint256 totalDistributionAmount = (amount * totalEligiblePoints) / BASE_MULTIPLIER;
        
        if (token == address(0)) {
            // ETH distribution
            require(msg.value >= totalDistributionAmount, "Insufficient ETH");
        } else {
            // ERC20 distribution
            IERC20(token).safeTransferFrom(msg.sender, address(this), totalDistributionAmount);
        }
        
        // Create distribution (note: we can't use mapping in memory structs in older Solidity)
        distributions.push();
        Distribution storage distribution = distributions[distributions.length - 1];
        distribution.amount = amount;
        distribution.token = token;
        distribution.timestamp = block.timestamp;
        distribution.totalStakedAtDistribution = totalStaked;
        distribution.totalRewardPoints = totalRewardPoints;
        distribution.distributed = true;
        
        // Set eligible collections
        for (uint256 i = 0; i < eligibleCollections.length; i++) {
            require(collections[eligibleCollections[i]].contractAddress != IERC721(address(0)), "Invalid collection");
            distribution.eligibleCollections[eligibleCollections[i]] = true;
        }
        
        emit DistributionAdded(currentDistributionId, amount, token, totalStaked, totalRewardPoints);
        currentDistributionId++;
    }

    /**
     * @dev Claim rewards for specific distributions
     */
    function claimRewards(uint256[] calldata distributionIds) external nonReentrant whenNotPaused {
        require(distributionIds.length > 0, "Empty array");
        require(distributionIds.length <= 100, "Too many distributions");
        
        uint256 totalRewards = 0;
        address rewardToken = address(0);
        
        for (uint256 i = 0; i < distributionIds.length; i++) {
            uint256 distributionId = distributionIds[i];
            require(distributionId < distributions.length, "Invalid distribution");
            require(!distributionClaimed[msg.sender][distributionId], "Already claimed");
            
            Distribution storage distribution = distributions[distributionId];
            require(distribution.distributed, "Not distributed");
            
            // Set reward token (must be same for all distributions in batch)
            if (i == 0) {
                rewardToken = distribution.token;
            } else {
                require(rewardToken == distribution.token, "Mixed token types");
            }
            
            // Calculate user's reward for this distribution
            uint256 userRewardPoints = getUserRewardPointsAtDistribution(msg.sender, distributionId);
            if (userRewardPoints > 0) {
                uint256 reward = (distribution.amount * userRewardPoints) / BASE_MULTIPLIER;
                
                distributionClaimed[msg.sender][distributionId] = true;
                totalRewards += reward;
                emit RewardsClaimed(msg.sender, distributionId, reward, rewardToken);
            }
        }
        
        // Transfer total rewards
        if (totalRewards > 0) {
            if (rewardToken == address(0)) {
                payable(msg.sender).sendValue(totalRewards);
            } else {
                IERC20(rewardToken).safeTransfer(msg.sender, totalRewards);
            }
        }
    }

    /**
     * @dev Get user's reward points at a specific distribution considering collection eligibility
     */
    function getUserRewardPointsAtDistribution(address user, uint256 distributionId) public view returns (uint256) {
        require(distributionId < distributions.length, "Invalid distribution");
        
        Distribution storage distribution = distributions[distributionId];
        uint256 userRewardPoints = 0;
        
        // Check all supported collections
        for (uint256 c = 0; c < supportedCollections.length; c++) {
            address collectionAddress = supportedCollections[c];
            
            // Skip if collection is not eligible for this distribution
            if (!distribution.eligibleCollections[collectionAddress]) {
                continue;
            }
            
            uint256[] memory userTokens = userStakedTokensByCollection[user][collectionAddress];
            
            for (uint256 i = 0; i < userTokens.length; i++) {
                uint256 tokenId = userTokens[i];
                bytes32 stakeKey = keccak256(abi.encodePacked(collectionAddress, tokenId));
                StakeInfo storage stakeInfo = stakes[stakeKey];
                
                // Check if token was staked at the time of distribution
                if (stakeInfo.stakedAt <= distribution.timestamp && 
                    (stakeInfo.unstakedAt == 0 || stakeInfo.unstakedAt > distribution.timestamp)) {
                    userRewardPoints += stakeInfo.totalMultiplier;
                }
            }
        }
        
        return userRewardPoints;
    }

    // View functions
    function getUserStakedTokens(address user, address collectionAddress) external view returns (uint256[] memory) {
        return userStakedTokensByCollection[user][collectionAddress];
    }

    function getAllUserStakedTokens(address user) external view returns (
        address[] memory userCollections,
        uint256[][] memory tokenIds
    ) {
        uint256 collectionCount = 0;
        
        // Count collections with staked tokens
        for (uint256 i = 0; i < supportedCollections.length; i++) {
            if (userStakedTokensByCollection[user][supportedCollections[i]].length > 0) {
                collectionCount++;
            }
        }
        
        userCollections = new address[](collectionCount);
        tokenIds = new uint256[][](collectionCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < supportedCollections.length; i++) {
            address collection = supportedCollections[i];
            uint256[] memory tokens = userStakedTokensByCollection[user][collection];
            if (tokens.length > 0) {
                userCollections[index] = collection;
                tokenIds[index] = tokens;
                index++;
            }
        }
    }

    function isTokenStaked(address collectionAddress, uint256 tokenId) external view returns (bool) {
        bytes32 stakeKey = keccak256(abi.encodePacked(collectionAddress, tokenId));
        return stakes[stakeKey].staker != address(0) && stakes[stakeKey].unstakedAt == 0;
    }

    function getStakeInfo(address collectionAddress, uint256 tokenId) external view returns (
        StakeInfo memory stakeInfo,
        bool isLocked,
        uint256 timeUntilUnlock
    ) {
        bytes32 stakeKey = keccak256(abi.encodePacked(collectionAddress, tokenId));
        stakeInfo = stakes[stakeKey];
        isLocked = stakeInfo.lockEndTime > 0 && block.timestamp < stakeInfo.lockEndTime && stakeInfo.unstakedAt == 0;
        timeUntilUnlock = isLocked ? stakeInfo.lockEndTime - block.timestamp : 0;
    }

    function getSupportedCollections() external view returns (
        address[] memory collectionAddresses,
        string[] memory names,
        uint256[] memory baseMultipliers,
        bool[] memory activeStatus,
        uint256[] memory totalStakedCounts
    ) {
        uint256 length = supportedCollections.length;
        collectionAddresses = new address[](length);
        names = new string[](length);
        baseMultipliers = new uint256[](length);
        activeStatus = new bool[](length);
        totalStakedCounts = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            address collection = supportedCollections[i];
            CollectionInfo storage info = collections[collection];
            
            collectionAddresses[i] = collection;
            names[i] = info.name;
            baseMultipliers[i] = info.baseRewardMultiplier;
            activeStatus[i] = info.isActive;
            totalStakedCounts[i] = info.totalStaked;
        }
    }

    function getUserPendingRewards(address user) external view returns (uint256[] memory amounts, address[] memory tokens) {
        uint256 pendingCount = 0;
        
        // First pass: count pending distributions
        for (uint256 i = 0; i < distributions.length; i++) {
            if (!distributionClaimed[user][i] && getUserRewardPointsAtDistribution(user, i) > 0) {
                pendingCount++;
            }
        }
        
        amounts = new uint256[](pendingCount);
        tokens = new address[](pendingCount);
        
        // Second pass: populate arrays
        uint256 index = 0;
        for (uint256 i = 0; i < distributions.length; i++) {
            if (!distributionClaimed[user][i]) {
                uint256 userRewardPoints = getUserRewardPointsAtDistribution(user, i);
                if (userRewardPoints > 0) {
                    amounts[index] = (distributions[i].amount * userRewardPoints) / BASE_MULTIPLIER;
                    tokens[index] = distributions[i].token;
                    index++;
                }
            }
        }
    }

    function getDistributionCount() external view returns (uint256) {
        return distributions.length;
    }

    function getLockPeriodsAndBonuses() external pure returns (uint256[] memory periods, uint256[] memory bonuses) {
        periods = new uint256[](6);
        bonuses = new uint256[](6);
        
        periods[0] = 0;
        bonuses[0] = BASE_MULTIPLIER;
        
        periods[1] = LOCK_30_DAYS;
        bonuses[1] = BASE_MULTIPLIER + BONUS_30_DAYS;
        
        periods[2] = LOCK_60_DAYS;
        bonuses[2] = BASE_MULTIPLIER + BONUS_60_DAYS;
        
        periods[3] = LOCK_90_DAYS;
        bonuses[3] = BASE_MULTIPLIER + BONUS_90_DAYS;
        
        periods[4] = LOCK_120_DAYS;
        bonuses[4] = BASE_MULTIPLIER + BONUS_120_DAYS;
        
        periods[5] = LOCK_365_DAYS;
        bonuses[5] = BASE_MULTIPLIER + BONUS_365_DAYS;
    }

    // Admin functions
    function toggleStaking() external onlyRole(ADMIN_ROLE) {
        stakingEnabled = !stakingEnabled;
        emit StakingToggled(stakingEnabled);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function setPenaltyWallet(address _penaltyWallet) external onlyRole(ADMIN_ROLE) {
        require(_penaltyWallet != address(0), "Zero address");
        address oldWallet = penaltyWallet;
        penaltyWallet = _penaltyWallet;
        emit PenaltyWalletUpdated(oldWallet, _penaltyWallet);
    }

    function emergencyWithdraw(address token, uint256 amount, address to) external onlyRole(EMERGENCY_ROLE) {
        require(to != address(0), "Zero address");
        
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient balance");
            payable(to).sendValue(amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
        
        emit EmergencyWithdraw(token, amount, to);
    }

    /**
     * @dev Emergency unstake (EMERGENCY_ROLE only)
     */
    function emergencyUnstake(address collectionAddress, uint256 tokenId) external onlyRole(EMERGENCY_ROLE) {
        bytes32 stakeKey = keccak256(abi.encodePacked(collectionAddress, tokenId));
        StakeInfo storage stakeInfo = stakes[stakeKey];
        require(stakeInfo.staker != address(0), "Not staked");
        require(stakeInfo.unstakedAt == 0, "Already unstaked");
        
        address originalStaker = stakeInfo.staker;
        stakeInfo.unstakedAt = block.timestamp;
        stakeInfo.earlyUnstake = true;
        
        // Remove from arrays
        _removeFromUserStakedTokens(originalStaker, collectionAddress, tokenId, stakeKey);
        
        // Update global state
        totalStaked--;
        totalRewardPoints -= stakeInfo.totalMultiplier;
        collections[collectionAddress].totalStaked--;
        
        // Return NFT to original staker
        IERC721(collectionAddress).safeTransferFrom(address(this), originalStaker, tokenId);
        
        emit Unstaked(originalStaker, collectionAddress, tokenId, block.timestamp, true, 0);
    }

    // ERC721Receiver implementation
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        // Only accept NFTs from supported collections
        require(collections[msg.sender].contractAddress != IERC721(address(0)), "Invalid NFT contract");
        return this.onERC721Received.selector;
    }

    // Receive function for ETH distributions
    receive() external payable {
        // Allow contract to receive ETH for distributions
    }

    // Fallback function
    fallback() external payable {
        revert("Function not found");
    }
}