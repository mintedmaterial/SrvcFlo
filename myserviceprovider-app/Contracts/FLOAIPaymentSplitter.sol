// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FLOAIPaymentSplitter
 * @dev Handles FLOAI token payments for AI generation with revenue distribution
 * Splits payments: 50% dev, 25% staking rewards, 15% leaderboard, 10% treasury
 * NO TOKEN BURNING - focuses on sustainable transfer-based economy
 */
contract FLOAIPaymentSplitter is Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable floaiToken;
    
    // Payment distribution percentages (basis points for precision)
    uint256 public constant DEV_SHARE = 5000;        // 50%
    uint256 public constant STAKING_SHARE = 2500;    // 25% 
    uint256 public constant LEADERBOARD_SHARE = 1500; // 15%
    uint256 public constant TREASURY_SHARE = 1000;   // 10%
    uint256 public constant TOTAL_BASIS_POINTS = 10000; // 100%
    
    // Revenue recipient addresses
    address public devWallet;
    address public stakingContract;
    address public leaderboardWallet;
    address public treasuryWallet;
    
    // Usage costs in FLOAI tokens (18 decimals)
    uint256 public imageGenerationCost = 50 * 10**18;    // 50 FLOAI per image
    uint256 public videoGenerationCost = 100 * 10**18;   // 100 FLOAI per video
    uint256 public socialPostCost = 25 * 10**18;         // 25 FLOAI per social post
    uint256 public researchCost = 30 * 10**18;           // 30 FLOAI per research query
    uint256 public analysisAgentCost = 40 * 10**18;      // 40 FLOAI per analysis
    
    // Agent revenue tracking
    mapping(uint256 => uint256) public agentRevenue;        // tokenId => total revenue
    mapping(uint256 => address) public agentOwner;          // tokenId => owner address
    mapping(address => uint256) public ownerEarnings;       // owner => total earnings
    
    // Usage tracking
    mapping(address => uint256) public userTotalSpent;      // user => total FLOAI spent
    mapping(address => uint256) public userGenerationCount; // user => total generations
    
    // Emergency controls
    mapping(address => bool) public authorizedCallers;      // Authorized to process payments
    uint256 public maxSinglePayment = 1000 * 10**18;       // Max 1000 FLOAI per transaction
    
    // Events
    event PaymentProcessed(
        address indexed user,
        uint256 indexed agentId,
        string generationType,
        uint256 amount,
        uint256 timestamp
    );
    
    event RevenueDistributed(
        uint256 devAmount,
        uint256 stakingAmount,
        uint256 leaderboardAmount,
        uint256 treasuryAmount,
        uint256 timestamp
    );
    
    event AgentRevenueRecorded(
        uint256 indexed agentId,
        address indexed owner,
        uint256 amount,
        uint256 totalRevenue
    );
    
    event CostUpdated(
        string generationType,
        uint256 oldCost,
        uint256 newCost
    );
    
    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier validAmount(uint256 amount) {
        require(amount > 0 && amount <= maxSinglePayment, "Invalid payment amount");
        _;
    }
    
    constructor(
        address _floaiToken,
        address _devWallet,
        address _stakingContract,
        address _leaderboardWallet,
        address _treasuryWallet
    ) Ownable(msg.sender) {
        require(_floaiToken != address(0), "Invalid FLOAI token address");
        require(_devWallet != address(0), "Invalid dev wallet");
        require(_stakingContract != address(0), "Invalid staking contract");
        require(_leaderboardWallet != address(0), "Invalid leaderboard wallet");
        require(_treasuryWallet != address(0), "Invalid treasury wallet");
        
        floaiToken = IERC20(_floaiToken);
        devWallet = _devWallet;
        stakingContract = _stakingContract;
        leaderboardWallet = _leaderboardWallet;
        treasuryWallet = _treasuryWallet;
        
        // Owner is automatically authorized
        authorizedCallers[msg.sender] = true;
    }
    
    /**
     * @dev Process payment for AI generation with revenue distribution
     * @param user The user making the payment
     * @param agentId The agent token ID being used
     * @param agentOwner The owner of the agent
     * @param generationType Type of generation ("image", "video", "social", etc.)
     * @return success Whether the payment was processed successfully
     */
    function processPayment(
        address user,
        uint256 agentId,
        address agentOwner,
        string memory generationType
    ) external onlyAuthorized whenNotPaused nonReentrant returns (bool success) {
        require(user != address(0), "Invalid user address");
        require(agentOwner != address(0), "Invalid agent owner");
        
        uint256 cost = getGenerationCost(generationType);
        require(cost > 0, "Invalid generation type");
        
        // Check user's FLOAI balance
        require(floaiToken.balanceOf(user) >= cost, "Insufficient FLOAI balance");
        
        // Transfer FLOAI from user to this contract
        require(
            floaiToken.transferFrom(user, address(this), cost),
            "FLOAI transfer failed"
        );
        
        // Distribute revenue (no burning - all tokens stay in circulation)
        _distributeRevenue(cost);
        
        // Record agent revenue for owner
        _recordAgentRevenue(agentId, agentOwner, cost);
        
        // Update user statistics
        userTotalSpent[user] += cost;
        userGenerationCount[user] += 1;
        
        emit PaymentProcessed(user, agentId, generationType, cost, block.timestamp);
        
        return true;
    }
    
    /**
     * @dev Batch process multiple payments (for efficiency)
     */
    function batchProcessPayments(
        address[] calldata users,
        uint256[] calldata agentIds,
        address[] calldata agentOwners,
        string[] calldata generationTypes
    ) external onlyAuthorized whenNotPaused nonReentrant returns (bool[] memory results) {
        require(users.length == agentIds.length, "Array length mismatch");
        require(users.length == agentOwners.length, "Array length mismatch");
        require(users.length == generationTypes.length, "Array length mismatch");
        require(users.length <= 50, "Batch too large"); // Prevent gas issues
        
        results = new bool[](users.length);
        
        for (uint256 i = 0; i < users.length; i++) {
            try this.processPayment(users[i], agentIds[i], agentOwners[i], generationTypes[i]) {
                results[i] = true;
            } catch {
                results[i] = false;
            }
        }
        
        return results;
    }
    
    /**
     * @dev Get the cost for a specific generation type
     */
    function getGenerationCost(string memory generationType) public view returns (uint256) {
        bytes32 typeHash = keccak256(abi.encodePacked(generationType));
        
        if (typeHash == keccak256(abi.encodePacked("image"))) {
            return imageGenerationCost;
        } else if (typeHash == keccak256(abi.encodePacked("video"))) {
            return videoGenerationCost;
        } else if (typeHash == keccak256(abi.encodePacked("social"))) {
            return socialPostCost;
        } else if (typeHash == keccak256(abi.encodePacked("research"))) {
            return researchCost;
        } else if (typeHash == keccak256(abi.encodePacked("analysis"))) {
            return analysisAgentCost;
        }
        
        return 0; // Invalid type
    }
    
    /**
     * @dev Internal function to distribute revenue without burning tokens
     */
    function _distributeRevenue(uint256 totalAmount) private {
        uint256 devAmount = (totalAmount * DEV_SHARE) / TOTAL_BASIS_POINTS;
        uint256 stakingAmount = (totalAmount * STAKING_SHARE) / TOTAL_BASIS_POINTS;
        uint256 leaderboardAmount = (totalAmount * LEADERBOARD_SHARE) / TOTAL_BASIS_POINTS;
        uint256 treasuryAmount = (totalAmount * TREASURY_SHARE) / TOTAL_BASIS_POINTS;
        
        // Transfer to recipients (keeping tokens in circulation)
        require(floaiToken.transfer(devWallet, devAmount), "Dev transfer failed");
        require(floaiToken.transfer(stakingContract, stakingAmount), "Staking transfer failed");
        require(floaiToken.transfer(leaderboardWallet, leaderboardAmount), "Leaderboard transfer failed");
        require(floaiToken.transfer(treasuryWallet, treasuryAmount), "Treasury transfer failed");
        
        emit RevenueDistributed(devAmount, stakingAmount, leaderboardAmount, treasuryAmount, block.timestamp);
    }
    
    /**
     * @dev Record revenue for agent owner (they earn from their agent usage)
     */
    function _recordAgentRevenue(uint256 agentId, address owner, uint256 amount) private {
        // Agent owners get a small percentage of usage (e.g., 5% of total)
        uint256 ownerRevenue = (amount * 500) / TOTAL_BASIS_POINTS; // 5%
        
        agentRevenue[agentId] += ownerRevenue;
        agentOwner[agentId] = owner;
        ownerEarnings[owner] += ownerRevenue;
        
        emit AgentRevenueRecorded(agentId, owner, ownerRevenue, agentRevenue[agentId]);
    }
    
    /**
     * @dev Allow agent owners to claim their earnings
     */
    function claimOwnerEarnings() external nonReentrant {
        uint256 earnings = ownerEarnings[msg.sender];
        require(earnings > 0, "No earnings to claim");
        
        ownerEarnings[msg.sender] = 0;
        
        // Transfer from treasury (which holds agent owner earnings)
        require(floaiToken.transferFrom(treasuryWallet, msg.sender, earnings), "Earnings transfer failed");
    }
    
    /**
     * @dev Admin functions for updating costs
     */
    function updateGenerationCost(string memory generationType, uint256 newCost) external onlyOwner {
        require(newCost > 0 && newCost <= 1000 * 10**18, "Invalid cost range");
        
        bytes32 typeHash = keccak256(abi.encodePacked(generationType));
        uint256 oldCost;
        
        if (typeHash == keccak256(abi.encodePacked("image"))) {
            oldCost = imageGenerationCost;
            imageGenerationCost = newCost;
        } else if (typeHash == keccak256(abi.encodePacked("video"))) {
            oldCost = videoGenerationCost;
            videoGenerationCost = newCost;
        } else if (typeHash == keccak256(abi.encodePacked("social"))) {
            oldCost = socialPostCost;
            socialPostCost = newCost;
        } else if (typeHash == keccak256(abi.encodePacked("research"))) {
            oldCost = researchCost;
            researchCost = newCost;
        } else if (typeHash == keccak256(abi.encodePacked("analysis"))) {
            oldCost = analysisAgentCost;
            analysisAgentCost = newCost;
        } else {
            revert("Invalid generation type");
        }
        
        emit CostUpdated(generationType, oldCost, newCost);
    }
    
    /**
     * @dev Update revenue recipient addresses
     */
    function updateRecipients(
        address _devWallet,
        address _stakingContract,
        address _leaderboardWallet,
        address _treasuryWallet
    ) external onlyOwner {
        require(_devWallet != address(0), "Invalid dev wallet");
        require(_stakingContract != address(0), "Invalid staking contract");
        require(_leaderboardWallet != address(0), "Invalid leaderboard wallet");
        require(_treasuryWallet != address(0), "Invalid treasury wallet");
        
        devWallet = _devWallet;
        stakingContract = _stakingContract;
        leaderboardWallet = _leaderboardWallet;
        treasuryWallet = _treasuryWallet;
    }
    
    /**
     * @dev Manage authorized callers (typically Cloudflare Workers)
     */
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        require(caller != address(0), "Invalid caller address");
        authorizedCallers[caller] = authorized;
    }
    
    /**
     * @dev Update maximum single payment limit
     */
    function setMaxSinglePayment(uint256 newMax) external onlyOwner {
        require(newMax >= 100 * 10**18, "Max too low"); // At least 100 FLOAI
        maxSinglePayment = newMax;
    }
    
    /**
     * @dev Emergency functions
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency token recovery (only for non-FLOAI tokens)
     */
    function emergencyTokenRecovery(address token, uint256 amount) external onlyOwner {
        require(token != address(floaiToken), "Cannot recover FLOAI");
        require(IERC20(token).transfer(owner(), amount), "Recovery failed");
    }
    
    /**
     * @dev View functions for frontend integration
     */
    function getUserStats(address user) external view returns (
        uint256 totalSpent,
        uint256 generationCount,
        uint256 floaiBalance
    ) {
        return (
            userTotalSpent[user],
            userGenerationCount[user],
            floaiToken.balanceOf(user)
        );
    }
    
    function getAgentStats(uint256 agentId) external view returns (
        uint256 totalRevenue,
        address owner,
        uint256 ownerEarnings
    ) {
        address owner = agentOwner[agentId];
        return (
            agentRevenue[agentId],
            owner,
            ownerEarnings[owner]
        );
    }
    
    function getAllGenerationCosts() external view returns (
        uint256 image,
        uint256 video,
        uint256 social,
        uint256 research,
        uint256 analysis
    ) {
        return (
            imageGenerationCost,
            videoGenerationCost,
            socialPostCost,
            researchCost,
            analysisAgentCost
        );
    }
}