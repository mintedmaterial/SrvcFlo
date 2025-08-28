// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function decimals() external view returns (uint8);
    function symbol() external view returns (string memory);
}

contract SonicPriceOracle {
    address public owner;
    
    // Authorized price updaters (can be Chainlink, API3, or our own oracle)
    mapping(address => bool) public priceUpdaters;
    
    // Token price storage (price in USD with 6 decimals, like USDC)
    mapping(address => uint256) public tokenPricesUSD;
    mapping(address => uint256) public lastUpdated;
    mapping(address => bool) public supportedTokens;
    
    // Price staleness threshold (default: 5 minutes)
    uint256 public constant PRICE_STALENESS_THRESHOLD = 300; // 5 minutes
    
    // Events
    event PriceUpdated(address indexed token, uint256 price, uint256 timestamp);
    event PriceUpdaterAdded(address indexed updater);
    event PriceUpdaterRemoved(address indexed updater);
    event TokenAdded(address indexed token, string symbol);
    event TokenRemoved(address indexed token);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyPriceUpdater() {
        require(priceUpdaters[msg.sender], "Not authorized price updater");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        // Add owner as initial price updater
        priceUpdaters[msg.sender] = true;
        emit PriceUpdaterAdded(msg.sender);
    }
    
    // Owner functions
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }
    
    function addPriceUpdater(address updater) external onlyOwner {
        require(updater != address(0), "Zero address");
        priceUpdaters[updater] = true;
        emit PriceUpdaterAdded(updater);
    }
    
    function removePriceUpdater(address updater) external onlyOwner {
        priceUpdaters[updater] = false;
        emit PriceUpdaterRemoved(updater);
    }
    
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Zero address");
        supportedTokens[token] = true;
        
        try IERC20(token).symbol() returns (string memory symbol) {
            emit TokenAdded(token, symbol);
        } catch {
            emit TokenAdded(token, "UNKNOWN");
        }
    }
    
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }
    
    // Price update functions (called by authorized updaters)
    function updatePrice(address token, uint256 priceUSD) external onlyPriceUpdater {
        require(supportedTokens[token], "Token not supported");
        require(priceUSD > 0, "Invalid price");
        
        tokenPricesUSD[token] = priceUSD;
        lastUpdated[token] = block.timestamp;
        
        emit PriceUpdated(token, priceUSD, block.timestamp);
    }
    
    function updatePrices(
        address[] calldata tokens,
        uint256[] calldata prices
    ) external onlyPriceUpdater {
        require(tokens.length == prices.length, "Array length mismatch");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            require(supportedTokens[tokens[i]], "Token not supported");
            require(prices[i] > 0, "Invalid price");
            
            tokenPricesUSD[tokens[i]] = prices[i];
            lastUpdated[tokens[i]] = block.timestamp;
            
            emit PriceUpdated(tokens[i], prices[i], block.timestamp);
        }
    }
    
    // Interface functions for payment contract
    function getTokenAmountForUSD(address token, uint256 usdAmount) external view returns (uint256) {
        require(supportedTokens[token], "Token not supported");
        require(usdAmount > 0, "Invalid USD amount");
        
        uint256 tokenPriceUSD = tokenPricesUSD[token];
        require(tokenPriceUSD > 0, "Price not available");
        require(!_isPriceStale(token), "Price is stale");
        
        // Get token decimals
        uint8 tokenDecimals = 18; // Default to 18
        try IERC20(token).decimals() returns (uint8 decimals) {
            tokenDecimals = decimals;
        } catch {
            // Use default 18 decimals
        }
        
        // Calculate token amount needed
        // usdAmount has 6 decimals (like USDC)
        // tokenPriceUSD has 6 decimals (price per token in USD)
        // Result should have tokenDecimals
        uint256 tokenAmount = (usdAmount * (10 ** tokenDecimals)) / tokenPriceUSD;
        
        return tokenAmount;
    }
    
    function getTokenPriceUSD(address token) external view returns (uint256) {
        require(supportedTokens[token], "Token not supported");
        require(!_isPriceStale(token), "Price is stale");
        return tokenPricesUSD[token];
    }
    
    function isTokenSupported(address token) external view returns (bool) {
        return supportedTokens[token] && !_isPriceStale(token);
    }
    
    // View functions
    function isPriceStale(address token) external view returns (bool) {
        return _isPriceStale(token);
    }
    
    function _isPriceStale(address token) internal view returns (bool) {
        return (block.timestamp - lastUpdated[token]) > PRICE_STALENESS_THRESHOLD;
    }
    
    function getTokenInfo(address token) external view returns (
        bool supported,
        uint256 priceUSD,
        uint256 lastUpdatedTime,
        bool stale
    ) {
        return (
            supportedTokens[token],
            tokenPricesUSD[token],
            lastUpdated[token],
            _isPriceStale(token)
        );
    }
    
    function getAllTokens() external view returns (
        address[] memory tokens,
        uint256[] memory prices,
        uint256[] memory timestamps,
        bool[] memory staleFlags
    ) {
        // Note: This is a view function for convenience. In a production system,
        // you might want to implement a more efficient way to iterate over tokens
        // or use events to track supported tokens off-chain.
        
        // For this example, we'll return empty arrays and expect the caller
        // to query individual token addresses they're interested in
        return (
            new address[](0),
            new uint256[](0),
            new uint256[](0),
            new bool[](0)
        );
    }
    
    // Emergency functions
    function emergencyUpdatePrice(address token, uint256 priceUSD) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        require(priceUSD > 0, "Invalid price");
        
        tokenPricesUSD[token] = priceUSD;
        lastUpdated[token] = block.timestamp;
        
        emit PriceUpdated(token, priceUSD, block.timestamp);
    }
}