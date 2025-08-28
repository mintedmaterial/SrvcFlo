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
 * @title SrvcfloStaking V2
 * @dev Enhanced NFT staking contract with OpenZeppelin security features and time-lock staking
 * @notice This contract allows users to stake NFTs for rewards with optional time-lock periods for bonus rewards
 * @notice Initially designed for BanditKidz NFTs but can be extended to support other NFT collections
 */
contract SrvcfloStaking is ReentrancyGuard, AccessControl, Pausable, IERC721Receiver {
    using SafeERC20 for IERC20;
    using Address for address payable;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Time-lock periods in seconds
    uint256 public constant LOCK_30_DAYS = 30 days;
    uint256 public constant LOCK_60_DAYS = 60 days;
    uint256 public constant LOCK_90_DAYS = 90 days;
    uint256 public constant LOCK_120_DAYS = 120 days;
    uint256 public constant LOCK_365_DAYS = 365 days;

    // Bonus multipliers (scaled by 10000 for precision)
    // Base rewards = 10000 (100%), bonuses add to this
    uint256 public constant BONUS_30_DAYS = 1500;   // +15%
    uint256 public constant BONUS_60_DAYS = 3500;   // +35%
    uint256 public constant BONUS_90_DAYS = 6000;   // +60%
    uint256 public constant BONUS_120_DAYS = 9000;  // +90%
    uint256 public constant BONUS_365_DAYS = 15000; // +150%
    uint256 public constant BASE_MULTIPLIER = 10000; // 100%

    IERC721 public immutable stakedNFT; // Primary NFT contract (initially BanditKidz)
    
    // Enhanced staking info with time-lock support
    struct StakeInfo {
        address staker;
        uint256 stakedAt;
        uint256 unstakedAt; // 0 if still staked
        uint256 lockPeriod; // 0 for no lock, otherwise lock duration in seconds
        uint256 lockEndTime; // timestamp when lock expires
        uint256 bonusMultiplier; // reward multiplier based on lock period
        bool earlyUnstake; // true if unstaked before lock period
        uint256 lastClaimedDistribution; // last distribution epoch claimed
    }
    
    // Distribution tracking (unchanged from original)
    struct Distribution {
        uint256 amount; // amount per staked NFT
        address token; // token address (address(0) for ETH)
        uint256 timestamp;
        uint256 totalStakedAtDistribution; // total NFTs staked when distribution was made
        uint256 totalBonusPoints; // total bonus points at distribution time
        bool distributed;
    }
    
    // Staking storage
    mapping(uint256 => StakeInfo) public stakes; // tokenId => StakeInfo
    mapping(address => uint256[]) public userStakedTokens; // user => tokenIds[]
    mapping(uint256 => uint256) public stakedTokenIndex; // tokenId => index in userStakedTokens
    
    // Distribution storage
    Distribution[] public distributions;
    mapping(address => mapping(uint256 => bool)) public distributionClaimed; // user => distributionId => claimed
    
    // Global state
    uint256 public totalStaked;
    uint256 public totalBonusPoints; // sum of all staked NFTs' bonus multipliers
    uint256 public currentDistributionId;
    bool public stakingEnabled = true;
    
    // Early unstake penalty (10% penalty, scaled by 10000)
    uint256 public constant EARLY_UNSTAKE_PENALTY = 1000; // 10%
    address public penaltyWallet;
    
    // Events
    event Staked(address indexed user, uint256 indexed tokenId, uint256 timestamp, uint256 lockPeriod, uint256 bonusMultiplier);
    event Unstaked(address indexed user, uint256 indexed tokenId, uint256 timestamp, bool earlyUnstake, uint256 penalty);
    event DistributionAdded(uint256 indexed distributionId, uint256 amount, address token, uint256 totalStaked, uint256 totalBonusPoints);
    event RewardsClaimed(address indexed user, uint256 indexed distributionId, uint256 amount, address token);
    event StakingToggled(bool enabled);
    event PenaltyWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event EmergencyWithdraw(address indexed token, uint256 amount, address indexed to);

    /**
     * @dev Constructor sets up roles and initializes the contract
     * @param _stakedNFT Address of the NFT contract to be staked (initially BanditKidz)
     * @param _penaltyWallet Address to receive early unstake penalties
     */
    constructor(address _stakedNFT, address _penaltyWallet) {
        require(_stakedNFT != address(0), "SrvcfloStaking: Zero address");
        require(_penaltyWallet != address(0), "SrvcfloStaking: Zero penalty wallet");
        
        stakedNFT = IERC721(_stakedNFT);
        penaltyWallet = _penaltyWallet;
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }

    /**
     * @dev Stake an NFT with optional time-lock
     * @param tokenId The NFT token ID to stake
     * @param lockPeriod Lock period in seconds (0 for no lock)
     */
    function stake(uint256 tokenId, uint256 lockPeriod) external nonReentrant whenNotPaused {
        _stakeInternal(tokenId, lockPeriod);
    }

    /**
     * @dev Stake multiple NFTs with the same time-lock
     * @param tokenIds Array of NFT token IDs to stake
     * @param lockPeriod Lock period in seconds (0 for no lock)
     */
    function stakeBatch(uint256[] calldata tokenIds, uint256 lockPeriod) external nonReentrant whenNotPaused {
        require(tokenIds.length > 0, "SrvcfloStaking: Empty array");
        require(tokenIds.length <= 50, "SrvcfloStaking: Too many tokens"); // Gas optimization
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _stakeInternal(tokenIds[i], lockPeriod);
        }
    }

    /**
     * @dev Internal stake function with time-lock logic
     * @param tokenId The NFT token ID to stake
     * @param lockPeriod Lock period in seconds
     */
    function _stakeInternal(uint256 tokenId, uint256 lockPeriod) internal {
        require(stakingEnabled, "SrvcfloStaking: Staking disabled");
        require(stakedNFT.ownerOf(tokenId) == msg.sender, "SrvcfloStaking: Not owner");
        require(stakes[tokenId].staker == address(0), "SrvcfloStaking: Already staked");
        
        // Validate lock period and calculate bonus
        uint256 bonusMultiplier = _calculateBonusMultiplier(lockPeriod);
        uint256 lockEndTime = lockPeriod > 0 ? block.timestamp + lockPeriod : 0;
        
        // Transfer NFT to this contract
        stakedNFT.safeTransferFrom(msg.sender, address(this), tokenId);
        
        // Record stake info
        stakes[tokenId] = StakeInfo({
            staker: msg.sender,
            stakedAt: block.timestamp,
            unstakedAt: 0,
            lockPeriod: lockPeriod,
            lockEndTime: lockEndTime,
            bonusMultiplier: bonusMultiplier,
            earlyUnstake: false,
            lastClaimedDistribution: currentDistributionId
        });
        
        // Add to user's staked tokens
        userStakedTokens[msg.sender].push(tokenId);
        stakedTokenIndex[tokenId] = userStakedTokens[msg.sender].length - 1;
        
        // Update global state
        totalStaked++;
        totalBonusPoints += bonusMultiplier;
        
        emit Staked(msg.sender, tokenId, block.timestamp, lockPeriod, bonusMultiplier);
    }

    /**
     * @dev Calculate bonus multiplier based on lock period
     * @param lockPeriod Lock period in seconds
     * @return bonusMultiplier The multiplier for rewards (scaled by 10000)
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
            revert("SrvcfloStaking: Invalid lock period");
        }
    }

    /**
     * @dev Unstake an NFT
     * @param tokenId The NFT token ID to unstake
     */
    function unstake(uint256 tokenId) external nonReentrant {
        _unstakeInternal(tokenId);
    }

    /**
     * @dev Unstake multiple NFTs
     * @param tokenIds Array of NFT token IDs to unstake
     */
    function unstakeBatch(uint256[] calldata tokenIds) external nonReentrant {
        require(tokenIds.length > 0, "SrvcfloStaking: Empty array");
        require(tokenIds.length <= 50, "SrvcfloStaking: Too many tokens");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _unstakeInternal(tokenIds[i]);
        }
    }

    /**
     * @dev Internal unstake function with penalty logic
     * @param tokenId The NFT token ID to unstake
     */
    function _unstakeInternal(uint256 tokenId) internal {
        StakeInfo storage stakeInfo = stakes[tokenId];
        require(stakeInfo.staker == msg.sender, "SrvcfloStaking: Not staker");
        require(stakeInfo.unstakedAt == 0, "SrvcfloStaking: Already unstaked");
        
        bool isEarlyUnstake = stakeInfo.lockEndTime > 0 && block.timestamp < stakeInfo.lockEndTime;
        uint256 penalty = 0;
        
        // Calculate penalty for early unstake
        if (isEarlyUnstake) {
            stakeInfo.earlyUnstake = true;
            // Penalty is calculated on user's pending rewards, not the NFT itself
            penalty = _calculateEarlyUnstakePenalty(msg.sender);
        }
        
        // Mark as unstaked
        stakeInfo.unstakedAt = block.timestamp;
        
        // Remove from user's staked tokens array
        _removeFromUserStakedTokens(msg.sender, tokenId);
        
        // Update global state
        totalStaked--;
        totalBonusPoints -= stakeInfo.bonusMultiplier;
        
        // Apply penalty if early unstake
        if (penalty > 0) {
            _applyEarlyUnstakePenalty(msg.sender, penalty);
        }
        
        // Return NFT to user
        stakedNFT.safeTransferFrom(address(this), msg.sender, tokenId);
        
        emit Unstaked(msg.sender, tokenId, block.timestamp, isEarlyUnstake, penalty);
    }

    /**
     * @dev Remove token from user's staked tokens array
     * @param user The user address
     * @param tokenId The token ID to remove
     */
    function _removeFromUserStakedTokens(address user, uint256 tokenId) internal {
        uint256 lastIndex = userStakedTokens[user].length - 1;
        uint256 tokenIndex = stakedTokenIndex[tokenId];
        
        if (tokenIndex != lastIndex) {
            uint256 lastTokenId = userStakedTokens[user][lastIndex];
            userStakedTokens[user][tokenIndex] = lastTokenId;
            stakedTokenIndex[lastTokenId] = tokenIndex;
        }
        
        userStakedTokens[user].pop();
        delete stakedTokenIndex[tokenId];
    }

    /**
     * @dev Calculate early unstake penalty based on user's pending rewards
     * @param user The user address
     * @return penalty The penalty amount in ETH wei
     */
    function _calculateEarlyUnstakePenalty(address user) internal view returns (uint256) {
        (uint256[] memory amounts, address[] memory tokens) = this.getUserPendingRewards(user);
        uint256 totalPenalty = 0;
        
        for (uint256 i = 0; i < amounts.length; i++) {
            if (tokens[i] == address(0)) { // ETH rewards
                totalPenalty += (amounts[i] * EARLY_UNSTAKE_PENALTY) / 10000;
            }
            // Note: For simplicity, we only apply ETH penalties
            // ERC20 penalties would require more complex logic
        }
        
        return totalPenalty;
    }

    /**
     * @dev Apply early unstake penalty
     * @param user The user who is unstaking early
     * @param penalty The penalty amount in ETH wei
     */
    function _applyEarlyUnstakePenalty(address user, uint256 penalty) internal {
        if (penalty > 0 && address(this).balance >= penalty) {
            payable(penaltyWallet).sendValue(penalty);
        }
    }

    /**
     * @dev Add distribution (only DISTRIBUTOR_ROLE)
     * @param amount Amount per staked NFT
     * @param token Token address (address(0) for ETH)
     */
    function addDistribution(uint256 amount, address token) external payable onlyRole(DISTRIBUTOR_ROLE) nonReentrant {
        require(totalStaked > 0, "SrvcfloStaking: No tokens staked");
        require(amount > 0, "SrvcfloStaking: Zero amount");
        
        uint256 totalDistributionAmount = (amount * totalBonusPoints) / BASE_MULTIPLIER;
        
        if (token == address(0)) {
            // ETH distribution
            require(msg.value >= totalDistributionAmount, "SrvcfloStaking: Insufficient ETH");
        } else {
            // ERC20 distribution
            IERC20(token).safeTransferFrom(msg.sender, address(this), totalDistributionAmount);
        }
        
        distributions.push(Distribution({
            amount: amount,
            token: token,
            timestamp: block.timestamp,
            totalStakedAtDistribution: totalStaked,
            totalBonusPoints: totalBonusPoints,
            distributed: true
        }));
        
        emit DistributionAdded(currentDistributionId, amount, token, totalStaked, totalBonusPoints);
        currentDistributionId++;
    }

    /**
     * @dev Claim rewards for specific distributions
     * @param distributionIds Array of distribution IDs to claim
     */
    function claimRewards(uint256[] calldata distributionIds) external nonReentrant whenNotPaused {
        require(distributionIds.length > 0, "SrvcfloStaking: Empty array");
        require(distributionIds.length <= 100, "SrvcfloStaking: Too many distributions");
        
        uint256 totalRewards = 0;
        address rewardToken = address(0);
        
        for (uint256 i = 0; i < distributionIds.length; i++) {
            uint256 distributionId = distributionIds[i];
            require(distributionId < distributions.length, "SrvcfloStaking: Invalid distribution");
            require(!distributionClaimed[msg.sender][distributionId], "SrvcfloStaking: Already claimed");
            
            Distribution storage distribution = distributions[distributionId];
            require(distribution.distributed, "SrvcfloStaking: Not distributed");
            
            // Set reward token (must be same for all distributions in batch)
            if (i == 0) {
                rewardToken = distribution.token;
            } else {
                require(rewardToken == distribution.token, "SrvcfloStaking: Mixed token types");
            }
            
            // Calculate user's reward for this distribution
            uint256 userBonusPoints = getUserBonusPointsAtDistribution(msg.sender, distributionId);
            if (userBonusPoints > 0) {
                uint256 reward = (distribution.amount * userBonusPoints) / BASE_MULTIPLIER;
                
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
     * @dev Get user's bonus points at a specific distribution
     * @param user The user address
     * @param distributionId The distribution ID
     * @return totalBonusPoints The user's total bonus points at distribution time
     */
    function getUserBonusPointsAtDistribution(address user, uint256 distributionId) public view returns (uint256) {
        require(distributionId < distributions.length, "SrvcfloStaking: Invalid distribution");
        
        Distribution storage distribution = distributions[distributionId];
        uint256 userBonusPoints = 0;
        uint256[] memory userTokens = userStakedTokens[user];
        
        for (uint256 i = 0; i < userTokens.length; i++) {
            uint256 tokenId = userTokens[i];
            StakeInfo storage stakeInfo = stakes[tokenId];
            
            // Check if token was staked at the time of distribution
            if (stakeInfo.stakedAt <= distribution.timestamp && 
                (stakeInfo.unstakedAt == 0 || stakeInfo.unstakedAt > distribution.timestamp)) {
                userBonusPoints += stakeInfo.bonusMultiplier;
            }
        }
        
        return userBonusPoints;
    }

    /**
     * @dev Get user's staked count at a specific distribution (for compatibility)
     * @param user The user address
     * @param distributionId The distribution ID
     * @return count The number of NFTs staked by user at distribution time
     */
    function getUserStakedCountAtDistribution(address user, uint256 distributionId) public view returns (uint256) {
        require(distributionId < distributions.length, "SrvcfloStaking: Invalid distribution");
        
        Distribution storage distribution = distributions[distributionId];
        uint256 count = 0;
        uint256[] memory userTokens = userStakedTokens[user];
        
        for (uint256 i = 0; i < userTokens.length; i++) {
            uint256 tokenId = userTokens[i];
            StakeInfo storage stakeInfo = stakes[tokenId];
            
            // Check if token was staked at the time of distribution
            if (stakeInfo.stakedAt <= distribution.timestamp && 
                (stakeInfo.unstakedAt == 0 || stakeInfo.unstakedAt > distribution.timestamp)) {
                count++;
            }
        }
        
        return count;
    }

    // View functions
    function getUserStakedTokens(address user) external view returns (uint256[] memory) {
        return userStakedTokens[user];
    }

    function isTokenStaked(uint256 tokenId) external view returns (bool) {
        return stakes[tokenId].staker != address(0) && stakes[tokenId].unstakedAt == 0;
    }

    function getDistributionCount() external view returns (uint256) {
        return distributions.length;
    }

    function getUserPendingRewards(address user) external view returns (uint256[] memory amounts, address[] memory tokens) {
        uint256 pendingCount = 0;
        
        // First pass: count pending distributions
        for (uint256 i = 0; i < distributions.length; i++) {
            if (!distributionClaimed[user][i] && getUserBonusPointsAtDistribution(user, i) > 0) {
                pendingCount++;
            }
        }
        
        amounts = new uint256[](pendingCount);
        tokens = new address[](pendingCount);
        
        // Second pass: populate arrays
        uint256 index = 0;
        for (uint256 i = 0; i < distributions.length; i++) {
            if (!distributionClaimed[user][i]) {
                uint256 userBonusPoints = getUserBonusPointsAtDistribution(user, i);
                if (userBonusPoints > 0) {
                    amounts[index] = (distributions[i].amount * userBonusPoints) / BASE_MULTIPLIER;
                    tokens[index] = distributions[i].token;
                    index++;
                }
            }
        }
    }

    /**
     * @dev Get available lock periods and their bonus multipliers
     * @return periods Array of lock periods in seconds
     * @return bonuses Array of bonus multipliers (scaled by 10000)
     */
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

    /**
     * @dev Get stake info including lock status
     * @param tokenId The NFT token ID
     * @return stakeInfo The complete stake information
     * @return isLocked Whether the NFT is currently locked
     * @return timeUntilUnlock Time in seconds until unlock (0 if not locked or already unlocked)
     */
    function getStakeInfo(uint256 tokenId) external view returns (StakeInfo memory stakeInfo, bool isLocked, uint256 timeUntilUnlock) {
        stakeInfo = stakes[tokenId];
        isLocked = stakeInfo.lockEndTime > 0 && block.timestamp < stakeInfo.lockEndTime && stakeInfo.unstakedAt == 0;
        timeUntilUnlock = isLocked ? stakeInfo.lockEndTime - block.timestamp : 0;
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
        require(_penaltyWallet != address(0), "SrvcfloStaking: Zero address");
        address oldWallet = penaltyWallet;
        penaltyWallet = _penaltyWallet;
        emit PenaltyWalletUpdated(oldWallet, _penaltyWallet);
    }

    function emergencyWithdraw(address token, uint256 amount, address to) external onlyRole(EMERGENCY_ROLE) {
        require(to != address(0), "SrvcfloStaking: Zero address");
        
        if (token == address(0)) {
            require(address(this).balance >= amount, "SrvcfloStaking: Insufficient balance");
            payable(to).sendValue(amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
        
        emit EmergencyWithdraw(token, amount, to);
    }

    /**
     * @dev Emergency unstake (EMERGENCY_ROLE only)
     * @param tokenId The NFT token ID to emergency unstake
     */
    function emergencyUnstake(uint256 tokenId) external onlyRole(EMERGENCY_ROLE) {
        StakeInfo storage stakeInfo = stakes[tokenId];
        require(stakeInfo.staker != address(0), "SrvcfloStaking: Not staked");
        require(stakeInfo.unstakedAt == 0, "SrvcfloStaking: Already unstaked");
        
        address originalStaker = stakeInfo.staker;
        stakeInfo.unstakedAt = block.timestamp;
        stakeInfo.earlyUnstake = true;
        
        // Remove from arrays
        _removeFromUserStakedTokens(originalStaker, tokenId);
        
        // Update global state
        totalStaked--;
        totalBonusPoints -= stakeInfo.bonusMultiplier;
        
        // Return NFT to original staker
        stakedNFT.safeTransferFrom(address(this), originalStaker, tokenId);
        
        emit Unstaked(originalStaker, tokenId, block.timestamp, true, 0);
    }

    // ERC721Receiver implementation
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        // Only accept NFTs from the designated contract
        require(msg.sender == address(stakedNFT), "SrvcfloStaking: Invalid NFT contract");
        return this.onERC721Received.selector;
    }

    // Receive function for ETH distributions
    receive() external payable {
        // Allow contract to receive ETH for distributions
    }

    // Fallback function
    fallback() external payable {
        revert("SrvcfloStaking: Function not found");
    }
}