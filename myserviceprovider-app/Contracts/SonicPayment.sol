// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
    function symbol() external view returns (string memory);
}

// Price Oracle Interface for dynamic pricing
interface IPriceOracle {
    function getTokenAmountForUSD(address token, uint256 usdAmount) external view returns (uint256);
    function isTokenSupported(address token) external view returns (bool);
    function getTokenPriceUSD(address token) external view returns (uint256);
}

// Ownable pattern
contract Ownable {
    address public owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() { 
        owner = msg.sender; 
    }

    modifier onlyOwner() { 
        require(msg.sender == owner, "Not owner"); 
        _; 
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

contract SonicAIGenerationPayment is Ownable {
    // Token addresses on Sonic Mainnet
    IERC20 public constant S_TOKEN = IERC20(0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38); // wS token (mainnet)
    IERC20 public constant USDC = IERC20(0x29219dd400f2Bf60E5a23d13Be72B486D4038894); // USDC on Sonic Mainnet
    
    // Dynamic pricing configuration
    IPriceOracle public priceOracle;
    
    // Service pricing in USD (scaled by 1e6 for precision)
    uint256 public constant IMAGE_GENERATION_USD = 1 * 10**6; // $1.00 USD
    uint256 public constant VIDEO_GENERATION_USD = 2 * 10**6; // $2.00 USD
    
    // Fallback costs (used when oracle is unavailable)
    uint256 public constant FALLBACK_USDC_COST = 1 * 10**6;   // 1 USDC (6 decimals)
    uint256 public constant FALLBACK_S_COST = 1 * 10**18;     // 1 S token (18 decimals)
    
    // Distribution addresses
    address public banditKidzStaking;
    address public devWallet;
    
    // Distribution percentages
    uint256 public constant BANDIT_KIDZ_PERCENT = 25;
    uint256 public constant DEV_PERCENT = 50;
    uint256 public constant LEADERBOARD_PERCENT = 15;
    uint256 public constant CONTRACT_PERCENT = 10;
    
    // Leaderboard tracking
    address[3] public leaderboardWinners;
    bool public leaderboardThresholdMet;
    
    // Generation tracking
    uint256 public totalGenerations;
    mapping(address => uint256) public userGenerations;
    mapping(address => uint256) public userCredits;
    
    // Events
    event PaymentReceived(address indexed payer, address indexed token, uint256 amount, string generationType);
    event GenerationRequested(address indexed user, string prompt, string generationType, uint256 generationId);
    event LeaderboardUpdated(address[3] winners, bool thresholdMet);
    event CreditsAdded(address indexed user, uint256 amount);
    event GenerationCompleted(address indexed user, uint256 generationId, string resultUrl);
    
    // FeeM registration
    function registerMe() external onlyOwner {
        (bool _success,) = address(0xDC2B0D2Dd2b7759D97D50db4eabDC36973110830).call("");
        require(_success, "FeeM registration failed");
    }
    
    constructor(
        address _banditKidzStaking,
        address _devWallet,
        address _priceOracle
    ) {
        banditKidzStaking = _banditKidzStaking;
        devWallet = _devWallet;
        if (_priceOracle != address(0)) {
            priceOracle = IPriceOracle(_priceOracle);
        }
    }
    
    // Update addresses (only owner)
    function setAddresses(address _banditKidzStaking, address _devWallet) external onlyOwner {
        require(_banditKidzStaking != address(0) && _devWallet != address(0), "Zero address");
        banditKidzStaking = _banditKidzStaking;
        devWallet = _devWallet;
    }
    
    // Set price oracle address (only owner)
    function setPriceOracle(address _priceOracle) external onlyOwner {
        require(_priceOracle != address(0), "Zero address");
        priceOracle = IPriceOracle(_priceOracle);
    }
    
    // Set leaderboard winners (only owner)
    function setLeaderboard(address[3] calldata winners, bool thresholdMet) external onlyOwner {
        leaderboardWinners = winners;
        leaderboardThresholdMet = thresholdMet;
        emit LeaderboardUpdated(winners, thresholdMet);
    }
    
    // Pay with S tokens for generation
    function payWithS(string calldata prompt, string calldata generationType) external {
        require(bytes(prompt).length > 0, "Empty prompt");
        
        uint256 requiredAmount = _getTokenCost(address(S_TOKEN), generationType);
        
        // Transfer S tokens
        require(
            S_TOKEN.transferFrom(msg.sender, address(this), requiredAmount),
            "S transfer failed"
        );
        
        _distributePayment(requiredAmount, S_TOKEN);
        _processGeneration(msg.sender, prompt, generationType);
        
        emit PaymentReceived(msg.sender, address(S_TOKEN), requiredAmount, generationType);
    }
    
    // Pay with USDC for generation
    function payWithUSDC(string calldata prompt, string calldata generationType) external {
        require(bytes(prompt).length > 0, "Empty prompt");
        
        uint256 requiredAmount = _getTokenCost(address(USDC), generationType);
        
        // Transfer USDC
        require(
            USDC.transferFrom(msg.sender, address(this), requiredAmount),
            "USDC transfer failed"
        );
        
        _distributePayment(requiredAmount, USDC);
        _processGeneration(msg.sender, prompt, generationType);
        
        emit PaymentReceived(msg.sender, address(USDC), requiredAmount, generationType);
    }
    
    // Add credits (owner only, for airdrops/rewards)
    function addCredits(address user, uint256 amount) external onlyOwner {
        userCredits[user] += amount;
        emit CreditsAdded(user, amount);
    }
    
    // Use credits for generation (free for users with credits)
    function useCredits(string calldata prompt, string calldata generationType) external {
        require(bytes(prompt).length > 0, "Empty prompt");
        require(userCredits[msg.sender] > 0, "No credits available");
        
        userCredits[msg.sender] -= 1;
        _processGeneration(msg.sender, prompt, generationType);
        
        emit PaymentReceived(msg.sender, address(0), 0, generationType); // address(0) indicates credit usage
    }
    
    // Internal function to distribute payments
    function _distributePayment(uint256 amount, IERC20 token) internal {
        uint256 toBanditKidz = (amount * BANDIT_KIDZ_PERCENT) / 100;
        uint256 toLeaderboard = (amount * LEADERBOARD_PERCENT) / 100;
        uint256 toDev = (amount * DEV_PERCENT) / 100;
        // Remainder (10%) stays in contract
        
        // Transfer to Bandit Kidz staking
        token.transfer(banditKidzStaking, toBanditKidz);
        
        // Transfer to leaderboard if threshold met
        if (leaderboardThresholdMet) {
            uint256 perWinner = toLeaderboard / 3;
            for (uint256 i = 0; i < 3; i++) {
                if (leaderboardWinners[i] != address(0)) {
                    token.transfer(leaderboardWinners[i], perWinner);
                }
            }
        }
        
        // Transfer to dev wallet
        token.transfer(devWallet, toDev);
    }
    
    // Internal function to process generation
    function _processGeneration(address user, string calldata prompt, string calldata generationType) internal {
        totalGenerations++;
        userGenerations[user]++;
        
        uint256 generationId = totalGenerations;
        
        emit GenerationRequested(user, prompt, generationType, generationId);
    }
    
    // Get dynamic token cost for generation type
    function _getTokenCost(address token, string memory generationType) internal view returns (uint256) {
        // Determine USD cost based on generation type
        uint256 usdCost;
        if (keccak256(bytes(generationType)) == keccak256(bytes("video"))) {
            usdCost = VIDEO_GENERATION_USD;
        } else {
            usdCost = IMAGE_GENERATION_USD; // Default to image generation cost
        }
        
        // Try to get dynamic pricing from oracle
        if (address(priceOracle) != address(0)) {
            try priceOracle.getTokenAmountForUSD(token, usdCost) returns (uint256 dynamicAmount) {
                return dynamicAmount;
            } catch {
                // Fall back to static pricing if oracle fails
            }
        }
        
        // Fallback to static pricing
        if (token == address(S_TOKEN)) {
            return FALLBACK_S_COST;
        } else if (token == address(USDC)) {
            return FALLBACK_USDC_COST;
        } else {
            revert("Unsupported token");
        }
    }
    
    // Complete generation (called by backend after processing)
    function completeGeneration(uint256 generationId, address user, string calldata resultUrl) external onlyOwner {
        emit GenerationCompleted(user, generationId, resultUrl);
    }
    
    // Emergency withdraw (owner only)
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner).transfer(amount);
        } else {
            IERC20(token).transfer(owner, amount);
        }
    }
    
    // View functions
    function getUserStats(address user) external view returns (
        uint256 generations,
        uint256 credits
    ) {
        return (userGenerations[user], userCredits[user]);
    }
    
    function getContractBalance(address token) external view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        }
        return IERC20(token).balanceOf(address(this));
    }
    
    // Get dynamic payment costs for each token
    function getPaymentCosts(string calldata generationType) external view returns (
        uint256 sCost,
        uint256 usdcCost
    ) {
        return (
            _getTokenCost(address(S_TOKEN), generationType),
            _getTokenCost(address(USDC), generationType)
        );
    }
    
    // Get USD pricing for services
    function getServicePricing() external pure returns (
        uint256 imageGenerationUSD,
        uint256 videoGenerationUSD
    ) {
        return (IMAGE_GENERATION_USD, VIDEO_GENERATION_USD);
    }
    
    // Check if oracle is available and working
    function isOracleActive() external view returns (bool) {
        if (address(priceOracle) == address(0)) {
            return false;
        }
        
        try priceOracle.isTokenSupported(address(USDC)) returns (bool supported) {
            return supported;
        } catch {
            return false;
        }
    }
    
    // Get current token price from oracle (for frontend display)
    function getTokenPriceUSD(address token) external view returns (uint256) {
        if (address(priceOracle) != address(0)) {
            try priceOracle.getTokenPriceUSD(token) returns (uint256 price) {
                return price;
            } catch {
                return 0; // Oracle unavailable
            }
        }
        return 0; // Oracle not set
    }
    
    // Get supported tokens
    function getSupportedTokens() external view returns (
        address sToken,
        address usdc
    ) {
        return (
            address(S_TOKEN),
            address(USDC)
        );
    }
    
    // Receive function for native payments
    receive() external payable {}
}