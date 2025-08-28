// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IERC721 {
    function safeMint(address to, string memory tokenURI) external returns (uint256);
}

interface ISonicPriceOracle {
    function getTokenAmountForUSD(address token, uint256 usdAmount) external view returns (uint256);
    function getTokenPriceUSD(address token) external view returns (uint256);
    function isTokenSupported(address token) external view returns (bool);
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

/**
 * @title SonicCreditSystemWithOracle
 * @dev Credit-based payment system with dynamic wS token pricing via Beefy Oracle
 * Users pay equivalent USD values ($5, $50, $500, $1250) in wS tokens with dynamic pricing
 * Bonus credits awarded for wS payments vs USDC payments
 */
contract SonicCreditSystemWithOracle is Ownable {
    // Token contracts
    IERC20 public constant USDC = IERC20(0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6); // Sonic testnet USDC
    IERC20 public constant WS_TOKEN = IERC20(0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38); // wS token
    IERC20 public constant SSSTT = IERC20(0xc777Fa50186362fe0EF9CCD579b6385cE7CB49f1); // SSStt testnet
    
    // NFT contract for minting
    IERC721 public nftContract;
    
    // Beefy Price Oracle for dynamic wS pricing
    ISonicPriceOracle public priceOracle;
    address public constant BEEFY_ORACLE = 0xBC4a342B0c057501E081484A2d24e576E854F823;
    
    // Distribution addresses
    address public srvcfloStaking; // BanditKidz staking contract
    address public devWallet;
    address[3] public leaderboardWinners;
    bool public leaderboardThresholdMet;
    
    // Distribution percentages
    uint256 public constant BANDIT_KIDZ_PERCENT = 25;
    uint256 public constant DEV_PERCENT = 50;
    uint256 public constant LEADERBOARD_PERCENT = 15;
    uint256 public constant CONTRACT_PERCENT = 10;
    
    // Credit packages (USD values and bonus structure)
    struct CreditPackage {
        uint256 usdcPrice;        // Fixed USDC price (6 decimals)
        uint256 usdValueForWS;    // USD value for wS calculation (6 decimals) - used with oracle
        uint256 usdcCredits;      // Credits for USDC payment
        uint256 wsCredits;        // Credits for wS payment (with bonus)
        bool active;
    }
    
    // Credit package definitions
    mapping(uint256 => CreditPackage) public creditPackages;
    
    // User credit balances
    mapping(address => uint256) public userCredits;
    
    // NFT minting costs (additional to generation)
    uint256 public constant NFT_SSSTT_COST = 5 * 10**17; // 0.5 SSStt
    uint256 public constant NFT_USDC_COST = 5 * 10**5;   // 0.5 USDC
    uint256 public constant NFT_WS_USD_VALUE = 5 * 10**5; // 0.5 USD value for wS (dynamic pricing)
    
    // Generation tracking
    uint256 public totalGenerations;
    mapping(address => uint256) public userGenerations;
    uint256 public currentGenerationId;
    
    // Events
    event CreditsPurchased(address indexed user, uint256 packageId, string paymentToken, uint256 creditsReceived, uint256 amount);
    event CreditsSpent(address indexed user, uint256 credits, string generationType, uint256 generationId);
    event NFTMinted(address indexed user, uint256 tokenId, uint256 generationId, string paymentToken, uint256 additionalCost);
    event GenerationCompleted(address indexed user, uint256 generationId, string resultUrl);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    
    constructor(
        address _srvcfloStaking,
        address _devWallet,
        address _nftContract
    ) {
        srvcfloStaking = _srvcfloStaking;
        devWallet = _devWallet;
        nftContract = IERC721(_nftContract);
        priceOracle = ISonicPriceOracle(BEEFY_ORACLE);
        
        // Initialize credit packages with bonus structure
        _initializeCreditPackages();
    }
    
    function _initializeCreditPackages() internal {
        // Starter: $5 USDC = 750 credits, $5 wS = 1000 credits (33% bonus)
        creditPackages[1] = CreditPackage({
            usdcPrice: 5 * 10**6,      // $5 USDC
            usdValueForWS: 5 * 10**6,  // $5 USD worth of wS (dynamic pricing)
            usdcCredits: 750,
            wsCredits: 1000,           // 33% bonus credits
            active: true
        });
        
        // Pro: $50 USDC = 8000 credits, $50 wS = 10000 credits (25% bonus)
        creditPackages[2] = CreditPackage({
            usdcPrice: 50 * 10**6,     // $50 USDC
            usdValueForWS: 50 * 10**6, // $50 USD worth of wS (dynamic pricing)
            usdcCredits: 8000,
            wsCredits: 10000,          // 25% bonus credits
            active: true
        });
        
        // Business: $500 USDC = 100000 credits, $500 wS = 115000 credits (15% bonus)
        creditPackages[3] = CreditPackage({
            usdcPrice: 500 * 10**6,    // $500 USDC
            usdValueForWS: 500 * 10**6, // $500 USD worth of wS (dynamic pricing)
            usdcCredits: 100000,
            wsCredits: 115000,         // 15% bonus credits
            active: true
        });
        
        // Enterprise: $1250 USDC = 260000 credits, $1250 wS = 290000 credits (~11.5% bonus)
        creditPackages[4] = CreditPackage({
            usdcPrice: 1250 * 10**6,   // $1250 USDC
            usdValueForWS: 1250 * 10**6, // $1250 USD worth of wS (dynamic pricing)
            usdcCredits: 260000,
            wsCredits: 290000,         // ~11.5% bonus credits
            active: true
        });
    }
    
    // Purchase credits with USDC (fixed pricing)
    function purchaseCreditsWithUSDC(uint256 packageId) external {
        CreditPackage memory package = creditPackages[packageId];
        require(package.active, "Package not active");
        require(package.usdcPrice > 0, "Invalid package");
        
        // Transfer USDC from user
        require(
            USDC.transferFrom(msg.sender, address(this), package.usdcPrice),
            "USDC transfer failed"
        );
        
        // Distribute payment
        _distributePayment(package.usdcPrice, USDC);
        
        // Add credits to user balance
        userCredits[msg.sender] += package.usdcCredits;
        
        emit CreditsPurchased(msg.sender, packageId, "USDC", package.usdcCredits, package.usdcPrice);
    }
    
    // Purchase credits with wS tokens (dynamic pricing with bonus credits)
    function purchaseCreditsWithWS(uint256 packageId) external {
        CreditPackage memory package = creditPackages[packageId];
        require(package.active, "Package not active");
        require(package.usdValueForWS > 0, "Invalid package");
        require(address(priceOracle) != address(0), "Oracle not set");
        require(priceOracle.isTokenSupported(address(WS_TOKEN)), "wS token not supported by oracle");
        
        // Get dynamic wS token amount based on USD value using Beefy Oracle
        uint256 wsAmount = priceOracle.getTokenAmountForUSD(address(WS_TOKEN), package.usdValueForWS);
        require(wsAmount > 0, "Invalid wS amount calculated");
        
        // Transfer wS tokens from user
        require(
            WS_TOKEN.transferFrom(msg.sender, address(this), wsAmount),
            "wS token transfer failed"
        );
        
        // Distribute payment
        _distributePayment(wsAmount, WS_TOKEN);
        
        // Add bonus credits to user balance (more credits for wS payment)
        userCredits[msg.sender] += package.wsCredits;
        
        emit CreditsPurchased(msg.sender, packageId, "wS", package.wsCredits, wsAmount);
    }
    
    // Spend credits for generation (called by backend)
    function spendCredits(address user, uint256 credits, string calldata generationType) external onlyOwner {
        require(userCredits[user] >= credits, "Insufficient credits");
        
        userCredits[user] -= credits;
        totalGenerations++;
        userGenerations[user]++;
        currentGenerationId++;
        
        emit CreditsSpent(user, credits, generationType, currentGenerationId);
    }
    
    // Mint NFT with additional payment (SSStt tokens)
    function mintNFTWithSSStt(uint256 generationId, string calldata tokenURI) external {
        require(
            SSSTT.transferFrom(msg.sender, address(this), NFT_SSSTT_COST),
            "SSStt transfer failed"
        );
        
        // Distribute additional payment
        _distributePayment(NFT_SSSTT_COST, SSSTT);
        
        // Mint NFT
        uint256 tokenId = nftContract.safeMint(msg.sender, tokenURI);
        
        emit NFTMinted(msg.sender, tokenId, generationId, "SSStt", NFT_SSSTT_COST);
    }
    
    // Mint NFT with additional payment (USDC)
    function mintNFTWithUSDC(uint256 generationId, string calldata tokenURI) external {
        require(
            USDC.transferFrom(msg.sender, address(this), NFT_USDC_COST),
            "USDC transfer failed"
        );
        
        // Distribute additional payment
        _distributePayment(NFT_USDC_COST, USDC);
        
        // Mint NFT
        uint256 tokenId = nftContract.safeMint(msg.sender, tokenURI);
        
        emit NFTMinted(msg.sender, tokenId, generationId, "USDC", NFT_USDC_COST);
    }
    
    // Mint NFT with additional payment (wS tokens, dynamic pricing)
    function mintNFTWithWS(uint256 generationId, string calldata tokenURI) external {
        require(address(priceOracle) != address(0), "Oracle not set");
        require(priceOracle.isTokenSupported(address(WS_TOKEN)), "wS token not supported by oracle");
        
        // Get dynamic wS token amount based on USD value
        uint256 wsAmount = priceOracle.getTokenAmountForUSD(address(WS_TOKEN), NFT_WS_USD_VALUE);
        require(wsAmount > 0, "Invalid wS amount calculated");
        
        require(
            WS_TOKEN.transferFrom(msg.sender, address(this), wsAmount),
            "wS token transfer failed"
        );
        
        // Distribute additional payment
        _distributePayment(wsAmount, WS_TOKEN);
        
        // Mint NFT
        uint256 tokenId = nftContract.safeMint(msg.sender, tokenURI);
        
        emit NFTMinted(msg.sender, tokenId, generationId, "wS", wsAmount);
    }
    
    // Internal payment distribution function
    function _distributePayment(uint256 amount, IERC20 token) internal {
        uint256 toStaking = (amount * BANDIT_KIDZ_PERCENT) / 100; // 25% to staking
        uint256 toLeaderboard = (amount * LEADERBOARD_PERCENT) / 100; // 15% to leaderboard
        uint256 toDev = (amount * DEV_PERCENT) / 100; // 50% to dev
        // Remainder (10%) stays in contract
        
        // Transfer to SrvcfloStaking contract
        if (toStaking > 0 && srvcfloStaking != address(0)) {
            token.transfer(srvcfloStaking, toStaking);
        }
        
        // Transfer to leaderboard if threshold met
        if (leaderboardThresholdMet && toLeaderboard > 0) {
            uint256 perWinner = toLeaderboard / 3;
            for (uint256 i = 0; i < 3; i++) {
                if (leaderboardWinners[i] != address(0)) {
                    token.transfer(leaderboardWinners[i], perWinner);
                }
            }
        }
        
        // Transfer to dev wallet
        if (toDev > 0 && devWallet != address(0)) {
            token.transfer(devWallet, toDev);
        }
    }
    
    // Admin functions
    function addCreditsToUser(address user, uint256 credits) external onlyOwner {
        userCredits[user] += credits;
    }
    
    function updateCreditPackage(
        uint256 packageId,
        uint256 usdcPrice,
        uint256 usdValueForWS,
        uint256 usdcCredits,
        uint256 wsCredits,
        bool active
    ) external onlyOwner {
        creditPackages[packageId] = CreditPackage({
            usdcPrice: usdcPrice,
            usdValueForWS: usdValueForWS,
            usdcCredits: usdcCredits,
            wsCredits: wsCredits,
            active: active
        });
    }
    
    function setAddresses(address _srvcfloStaking, address _devWallet, address _nftContract) external onlyOwner {
        srvcfloStaking = _srvcfloStaking;
        devWallet = _devWallet;
        if (_nftContract != address(0)) {
            nftContract = IERC721(_nftContract);
        }
    }
    
    // Update price oracle (admin function)
    function setPriceOracle(address _priceOracle) external onlyOwner {
        require(_priceOracle != address(0), "Zero address");
        address oldOracle = address(priceOracle);
        priceOracle = ISonicPriceOracle(_priceOracle);
        emit OracleUpdated(oldOracle, _priceOracle);
    }
    
    function setLeaderboard(address[3] calldata winners, bool thresholdMet) external onlyOwner {
        leaderboardWinners = winners;
        leaderboardThresholdMet = thresholdMet;
    }
    
    function completeGeneration(uint256 generationId, address user, string calldata resultUrl) external onlyOwner {
        emit GenerationCompleted(user, generationId, resultUrl);
    }
    
    // View functions
    function getUserCredits(address user) external view returns (uint256) {
        return userCredits[user];
    }
    
    function getUserStats(address user) external view returns (uint256 generations, uint256 credits) {
        return (userGenerations[user], userCredits[user]);
    }
    
    // Get credit package with dynamic wS pricing
    function getCreditPackage(uint256 packageId) external view returns (
        uint256 usdcPrice,
        uint256 currentWSPrice,
        uint256 usdcCredits,
        uint256 wsCredits,
        bool active
    ) {
        CreditPackage memory package = creditPackages[packageId];
        
        // Calculate dynamic wS price if oracle is available
        uint256 dynamicWSPrice = 0;
        if (address(priceOracle) != address(0) && priceOracle.isTokenSupported(address(WS_TOKEN))) {
            try priceOracle.getTokenAmountForUSD(address(WS_TOKEN), package.usdValueForWS) returns (uint256 wsAmount) {
                dynamicWSPrice = wsAmount;
            } catch {
                // If oracle fails, return 0 for wS price to indicate unavailable
                dynamicWSPrice = 0;
            }
        }
        
        return (package.usdcPrice, dynamicWSPrice, package.usdcCredits, package.wsCredits, package.active);
    }
    
    // Get credit package with USD value details
    function getCreditPackageWithUSDValue(uint256 packageId) external view returns (
        uint256 usdcPrice,
        uint256 usdValueForWS,
        uint256 currentWSPrice,
        uint256 usdcCredits,
        uint256 wsCredits,
        bool active
    ) {
        CreditPackage memory package = creditPackages[packageId];
        
        // Calculate current wS price if oracle is available
        uint256 dynamicWSPrice = 0;
        if (address(priceOracle) != address(0) && priceOracle.isTokenSupported(address(WS_TOKEN))) {
            try priceOracle.getTokenAmountForUSD(address(WS_TOKEN), package.usdValueForWS) returns (uint256 wsAmount) {
                dynamicWSPrice = wsAmount;
            } catch {
                dynamicWSPrice = 0;
            }
        }
        
        return (package.usdcPrice, package.usdValueForWS, dynamicWSPrice, package.usdcCredits, package.wsCredits, package.active);
    }
    
    // Get current wS token amount needed for NFT minting
    function getWSTokenAmountForNFT() external view returns (uint256) {
        if (address(priceOracle) != address(0) && priceOracle.isTokenSupported(address(WS_TOKEN))) {
            try priceOracle.getTokenAmountForUSD(address(WS_TOKEN), NFT_WS_USD_VALUE) returns (uint256 wsAmount) {
                return wsAmount;
            } catch {
                return 0;
            }
        }
        return 0;
    }
    
    // Get current wS token price from oracle
    function getCurrentWSTokenPrice() external view returns (uint256) {
        if (address(priceOracle) != address(0) && priceOracle.isTokenSupported(address(WS_TOKEN))) {
            try priceOracle.getTokenPriceUSD(address(WS_TOKEN)) returns (uint256 price) {
                return price;
            } catch {
                return 0;
            }
        }
        return 0;
    }
    
    // Get oracle information
    function getOracleInfo() external view returns (address oracle, bool wsSupported, uint256 currentPrice) {
        oracle = address(priceOracle);
        wsSupported = false;
        currentPrice = 0;
        
        if (oracle != address(0)) {
            try priceOracle.isTokenSupported(address(WS_TOKEN)) returns (bool supported) {
                wsSupported = supported;
                if (supported) {
                    try priceOracle.getTokenPriceUSD(address(WS_TOKEN)) returns (uint256 price) {
                        currentPrice = price;
                    } catch {}
                }
            } catch {}
        }
    }
    
    // Emergency functions
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner).transfer(amount);
        } else {
            IERC20(token).transfer(owner, amount);
        }
    }
    
    // Receive function for native payments
    receive() external payable {}
}