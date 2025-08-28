// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
    function symbol() external view returns (string memory);
}

// Interface for the Generated Art NFT contract
interface IGeneratedArtNFT {
    function mintGeneratedArt(
        address to,
        string memory prompt,
        string memory imageData,
        string memory model,
        string memory paymentMethod,
        string memory transactionHash
    ) external returns (uint256);
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

contract SonicPaymentTestnetWithNFT is Ownable {
    // Testnet token addresses
    IERC20 public constant SSSTT = IERC20(0xc777Fa50186362fe0EF9CCD579b6385cE7CB49f1); // SSStt - Sonic Speed and Scalability Test token
    IERC20 public constant S_TOKEN = IERC20(0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38); // wS token
    IERC20 public constant USDC = IERC20(0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6); // USDC testnet
    
    // CORAL token - need to find address
    IERC20 public coralToken;
    
    // NFT contract
    IGeneratedArtNFT public nftContract;
    
    // Payment configuration - simplified for testnet
    uint256 public constant SSSTT_COST = 1 * 10**18; // 1 SSStt (18 decimals)
    uint256 public constant CORAL_COST = 1 * 10**18; // 1 CORAL (18 decimals)
    uint256 public constant USDC_COST = 1 * 10**6;   // 1 USDC (6 decimals)
    uint256 public constant S_COST = 3 * 10**18;     // 3 S tokens (18 decimals)
    
    // NFT minting costs (additional cost to mint as NFT)
    uint256 public constant NFT_SSSTT_COST = 5 * 10**17; // 0.5 SSStt additional
    uint256 public constant NFT_CORAL_COST = 5 * 10**17; // 0.5 CORAL additional
    uint256 public constant NFT_USDC_COST = 5 * 10**5;   // 0.5 USDC additional
    uint256 public constant NFT_S_COST = 15 * 10**17;    // 1.5 S tokens additional
    
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
    
    // NFT minting tracking
    mapping(address => uint256) public userNFTsMinted;
    uint256 public totalNFTsMinted;
    
    // Events
    event PaymentReceived(address indexed payer, address indexed token, uint256 amount, string generationType);
    event GenerationRequested(address indexed user, string prompt, string generationType, uint256 generationId);
    event LeaderboardUpdated(address[3] winners, bool thresholdMet);
    event CreditsAdded(address indexed user, uint256 amount);
    event GenerationCompleted(address indexed user, uint256 generationId, string resultUrl);
    event NFTMinted(address indexed user, uint256 indexed tokenId, uint256 generationId, string paymentMethod);
    event NFTContractUpdated(address indexed oldContract, address indexed newContract);
    
    constructor(
        address _banditKidzStaking,
        address _devWallet,
        address _coralToken,
        address _nftContract
    ) {
        banditKidzStaking = _banditKidzStaking;
        devWallet = _devWallet;
        if (_coralToken != address(0)) {
            coralToken = IERC20(_coralToken);
        }
        if (_nftContract != address(0)) {
            nftContract = IGeneratedArtNFT(_nftContract);
        }
    }
    
    // Set CORAL token address (if not set in constructor)
    function setCoralToken(address _coralToken) external onlyOwner {
        require(_coralToken != address(0), "Zero address");
        coralToken = IERC20(_coralToken);
    }
    
    // Set NFT contract address
    function setNFTContract(address _nftContract) external onlyOwner {
        require(_nftContract != address(0), "Zero address");
        address oldContract = address(nftContract);
        nftContract = IGeneratedArtNFT(_nftContract);
        emit NFTContractUpdated(oldContract, _nftContract);
    }
    
    // Update addresses (only owner)
    function setAddresses(address _banditKidzStaking, address _devWallet) external onlyOwner {
        require(_banditKidzStaking != address(0) && _devWallet != address(0), "Zero address");
        banditKidzStaking = _banditKidzStaking;
        devWallet = _devWallet;
    }
    
    // Set leaderboard winners (only owner)
    function setLeaderboard(address[3] calldata winners, bool thresholdMet) external onlyOwner {
        leaderboardWinners = winners;
        leaderboardThresholdMet = thresholdMet;
        emit LeaderboardUpdated(winners, thresholdMet);
    }
    
    // Pay with SSStt tokens for generation
    function payWithSSStt(string calldata prompt, string calldata generationType) external {
        require(bytes(prompt).length > 0, "Empty prompt");
        
        require(
            SSSTT.transferFrom(msg.sender, address(this), SSSTT_COST),
            "SSStt transfer failed"
        );
        
        _distributePayment(SSSTT_COST, SSSTT);
        _processGeneration(msg.sender, prompt, generationType);
        
        emit PaymentReceived(msg.sender, address(SSSTT), SSSTT_COST, generationType);
    }
    
    // Pay with SSStt tokens for generation + NFT minting
    function payWithSSSttAndMintNFT(
        string calldata prompt, 
        string calldata generationType,
        string calldata imageData,
        string calldata model
    ) external {
        require(bytes(prompt).length > 0, "Empty prompt");
        require(address(nftContract) != address(0), "NFT contract not set");
        
        uint256 totalCost = SSSTT_COST + NFT_SSSTT_COST;
        require(
            SSSTT.transferFrom(msg.sender, address(this), totalCost),
            "SSStt transfer failed"
        );
        
        _distributePayment(totalCost, SSSTT);
        uint256 generationId = _processGeneration(msg.sender, prompt, generationType);
        
        // Mint NFT
        uint256 tokenId = nftContract.mintGeneratedArt(
            msg.sender,
            prompt,
            imageData,
            model,
            "SSSTT",
            "" // Transaction hash will be filled by backend
        );
        
        userNFTsMinted[msg.sender]++;
        totalNFTsMinted++;
        
        emit PaymentReceived(msg.sender, address(SSSTT), totalCost, generationType);
        emit NFTMinted(msg.sender, tokenId, generationId, "SSSTT");
    }
    
    // Pay with CORAL tokens for generation
    function payWithCORAL(string calldata prompt, string calldata generationType) external {
        require(bytes(prompt).length > 0, "Empty prompt");
        require(address(coralToken) != address(0), "CORAL token not set");
        
        require(
            coralToken.transferFrom(msg.sender, address(this), CORAL_COST),
            "CORAL transfer failed"
        );
        
        _distributePayment(CORAL_COST, coralToken);
        _processGeneration(msg.sender, prompt, generationType);
        
        emit PaymentReceived(msg.sender, address(coralToken), CORAL_COST, generationType);
    }
    
    // Pay with CORAL tokens for generation + NFT minting
    function payWithCORALAndMintNFT(
        string calldata prompt, 
        string calldata generationType,
        string calldata imageData,
        string calldata model
    ) external {
        require(bytes(prompt).length > 0, "Empty prompt");
        require(address(coralToken) != address(0), "CORAL token not set");
        require(address(nftContract) != address(0), "NFT contract not set");
        
        uint256 totalCost = CORAL_COST + NFT_CORAL_COST;
        require(
            coralToken.transferFrom(msg.sender, address(this), totalCost),
            "CORAL transfer failed"
        );
        
        _distributePayment(totalCost, coralToken);
        uint256 generationId = _processGeneration(msg.sender, prompt, generationType);
        
        // Mint NFT
        uint256 tokenId = nftContract.mintGeneratedArt(
            msg.sender,
            prompt,
            imageData,
            model,
            "CORAL",
            "" // Transaction hash will be filled by backend
        );
        
        userNFTsMinted[msg.sender]++;
        totalNFTsMinted++;
        
        emit PaymentReceived(msg.sender, address(coralToken), totalCost, generationType);
        emit NFTMinted(msg.sender, tokenId, generationId, "CORAL");
    }
    
    // Pay with S tokens for generation
    function payWithS(string calldata prompt, string calldata generationType) external {
        require(bytes(prompt).length > 0, "Empty prompt");
        
        require(
            S_TOKEN.transferFrom(msg.sender, address(this), S_COST),
            "S transfer failed"
        );
        
        _distributePayment(S_COST, S_TOKEN);
        _processGeneration(msg.sender, prompt, generationType);
        
        emit PaymentReceived(msg.sender, address(S_TOKEN), S_COST, generationType);
    }
    
    // Pay with S tokens for generation + NFT minting
    function payWithSAndMintNFT(
        string calldata prompt, 
        string calldata generationType,
        string calldata imageData,
        string calldata model
    ) external {
        require(bytes(prompt).length > 0, "Empty prompt");
        require(address(nftContract) != address(0), "NFT contract not set");
        
        uint256 totalCost = S_COST + NFT_S_COST;
        require(
            S_TOKEN.transferFrom(msg.sender, address(this), totalCost),
            "S transfer failed"
        );
        
        _distributePayment(totalCost, S_TOKEN);
        uint256 generationId = _processGeneration(msg.sender, prompt, generationType);
        
        // Mint NFT
        uint256 tokenId = nftContract.mintGeneratedArt(
            msg.sender,
            prompt,
            imageData,
            model,
            "S_TOKEN",
            "" // Transaction hash will be filled by backend
        );
        
        userNFTsMinted[msg.sender]++;
        totalNFTsMinted++;
        
        emit PaymentReceived(msg.sender, address(S_TOKEN), totalCost, generationType);
        emit NFTMinted(msg.sender, tokenId, generationId, "S_TOKEN");
    }
    
    // Pay with USDC for generation
    function payWithUSDC(string calldata prompt, string calldata generationType) external {
        require(bytes(prompt).length > 0, "Empty prompt");
        
        require(
            USDC.transferFrom(msg.sender, address(this), USDC_COST),
            "USDC transfer failed"
        );
        
        _distributePayment(USDC_COST, USDC);
        _processGeneration(msg.sender, prompt, generationType);
        
        emit PaymentReceived(msg.sender, address(USDC), USDC_COST, generationType);
    }
    
    // Pay with USDC for generation + NFT minting
    function payWithUSDCAndMintNFT(
        string calldata prompt, 
        string calldata generationType,
        string calldata imageData,
        string calldata model
    ) external {
        require(bytes(prompt).length > 0, "Empty prompt");
        require(address(nftContract) != address(0), "NFT contract not set");
        
        uint256 totalCost = USDC_COST + NFT_USDC_COST;
        require(
            USDC.transferFrom(msg.sender, address(this), totalCost),
            "USDC transfer failed"
        );
        
        _distributePayment(totalCost, USDC);
        uint256 generationId = _processGeneration(msg.sender, prompt, generationType);
        
        // Mint NFT
        uint256 tokenId = nftContract.mintGeneratedArt(
            msg.sender,
            prompt,
            imageData,
            model,
            "USDC",
            "" // Transaction hash will be filled by backend
        );
        
        userNFTsMinted[msg.sender]++;
        totalNFTsMinted++;
        
        emit PaymentReceived(msg.sender, address(USDC), totalCost, generationType);
        emit NFTMinted(msg.sender, tokenId, generationId, "USDC");
    }
    
    // Use credits for generation (free for users with credits)
    function useCredits(string calldata prompt, string calldata generationType) external {
        require(bytes(prompt).length > 0, "Empty prompt");
        require(userCredits[msg.sender] > 0, "No credits available");
        
        userCredits[msg.sender] -= 1;
        _processGeneration(msg.sender, prompt, generationType);
        
        emit PaymentReceived(msg.sender, address(0), 0, generationType);
    }
    
    // Add credits (owner only, for airdrops/rewards)
    function addCredits(address user, uint256 amount) external onlyOwner {
        userCredits[user] += amount;
        emit CreditsAdded(user, amount);
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
    function _processGeneration(address user, string calldata prompt, string calldata generationType) internal returns (uint256) {
        totalGenerations++;
        userGenerations[user]++;
        
        uint256 generationId = totalGenerations;
        
        emit GenerationRequested(user, prompt, generationType, generationId);
        return generationId;
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
        uint256 credits,
        uint256 nftsMinted
    ) {
        return (userGenerations[user], userCredits[user], userNFTsMinted[user]);
    }
    
    function getContractBalance(address token) external view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        }
        return IERC20(token).balanceOf(address(this));
    }
    
    function getSupportedTokens() external view returns (
        address ssstt,
        address coral,
        address sToken,
        address usdc
    ) {
        return (
            address(SSSTT),
            address(coralToken),
            address(S_TOKEN),
            address(USDC)
        );
    }
    
    // Get payment costs for each token (including NFT minting costs)
    function getPaymentCosts() external pure returns (
        uint256 sssttCost,
        uint256 coralCost,
        uint256 sCost,
        uint256 usdcCost,
        uint256 nftSssttCost,
        uint256 nftCoralCost,
        uint256 nftSCost,
        uint256 nftUsdcCost
    ) {
        return (
            SSSTT_COST, 
            CORAL_COST, 
            S_COST, 
            USDC_COST,
            NFT_SSSTT_COST,
            NFT_CORAL_COST,
            NFT_S_COST,
            NFT_USDC_COST
        );
    }
    
    // Get NFT contract address
    function getNFTContract() external view returns (address) {
        return address(nftContract);
    }
    
    // Get total NFT statistics
    function getNFTStats() external view returns (uint256 totalMinted) {
        return totalNFTsMinted;
    }
    
    // Receive function for native payments
    receive() external payable {}
}