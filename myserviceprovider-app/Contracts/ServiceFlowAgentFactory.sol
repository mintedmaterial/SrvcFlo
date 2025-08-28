// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC1155.sol";

/// @custom:security-contact security@srvcflo.com
contract ServiceFlowAgentFactory is ERC721, Ownable, ReentrancyGuard, Pausable {
    
    // Agent configuration structure
    struct AgentConfig {
        string name;
        string agentType; // "image", "video", "social", "nft_watcher", "token_analyst"
        string instructions;
        string[] tools;
        string[] connections;
        uint256 floaiPerOperation;
        address creator;
        bool isActive;
        uint256 generationCount;
        uint256 totalRevenue;
        uint256 creditPackageId; // Links to credit package tier
    }
    
    // Agent metadata for privacy-preserving storage
    struct AgentMetadata {
        string metadataURI; // R2 URI for encrypted metadata
        bytes32 metadataHash; // Hash commitment
        uint256 lastUpdated;
        bool isEncrypted;
    }
    
    // Revenue tracking
    struct RevenueInfo {
        uint256 totalGenerated;
        uint256 totalWithdrawn;
        uint256 lastDistribution;
        mapping(address => uint256) ownerEarnings;
    }
    
    // Mappings
    mapping(uint256 => AgentConfig) public agentConfigs;
    mapping(uint256 => AgentMetadata) public agentMetadata;
    mapping(uint256 => RevenueInfo) public agentRevenue;
    mapping(uint256 => address) public agentGeneratedCollections; // tokenId => ERC721 collection
    mapping(address => uint256[]) public userAgents; // user => agent token IDs
    
    // Contract references
    IERC20 public floaiToken;
    IERC1155 public creditContract;
    
    // Constants
    uint256 public constant MINT_COST_S = 50 * 10**18; // 50 S tokens
    uint256 public constant MINT_COST_FLOAI = 5000 * 10**18; // 5000 FLOAI alternative
    uint256 private _currentTokenId = 1;
    
    // Revenue distribution addresses
    address public constant BANDIT_KIDZ_TREASURY = 0x0000000000000000000000000000000000000001; // 75%
    address public constant DEV_TREASURY = 0x0000000000000000000000000000000000000002; // 25%
    
    // Events
    event AgentMinted(
        uint256 indexed tokenId, 
        address indexed creator, 
        string agentType,
        uint256 creditPackageId,
        string paymentMethod
    );
    event AgentConfigUpdated(uint256 indexed tokenId, string metadataURI);
    event AgentUsed(uint256 indexed tokenId, uint256 floaiConsumed, string operation);
    event RevenueGenerated(uint256 indexed tokenId, uint256 amount, address generator);
    event RevenueWithdrawn(uint256 indexed tokenId, address owner, uint256 amount);
    event AgentTransferred(uint256 indexed tokenId, address from, address to, string newMetadataURI);
    
    constructor(address _floaiToken, address _creditContract) 
        ERC721("ServiceFlow iNFT Agents", "SFAI") 
        Ownable(msg.sender) {
        floaiToken = IERC20(_floaiToken);
        creditContract = IERC1155(_creditContract);
    }
    
    // Mint agent with S tokens
    function mintAgentWithS(
        string memory name,
        string memory agentType,
        string memory instructions,
        string[] memory tools,
        string[] memory connections,
        uint256 floaiPerOp,
        string memory metadataURI,
        bytes32 metadataHash,
        uint256 creditPackageId
    ) external payable nonReentrant whenNotPaused {
        require(msg.value >= MINT_COST_S, "Insufficient S tokens");
        require(bytes(name).length > 0, "Name required");
        require(bytes(agentType).length > 0, "Agent type required");
        require(creditPackageId < 4, "Invalid credit package");
        
        uint256 tokenId = _mintAgent(
            name, agentType, instructions, tools, connections, 
            floaiPerOp, metadataURI, metadataHash, creditPackageId
        );
        
        // Distribute S token payment
        _distributeMintingFees(msg.value);
        
        emit AgentMinted(tokenId, msg.sender, agentType, creditPackageId, "S_TOKENS");
    }
    
    // Mint agent with FLOAI tokens
    function mintAgentWithFLOAI(
        string memory name,
        string memory agentType,
        string memory instructions,
        string[] memory tools,
        string[] memory connections,
        uint256 floaiPerOp,
        string memory metadataURI,
        bytes32 metadataHash,
        uint256 creditPackageId
    ) external nonReentrant whenNotPaused {
        require(floaiToken.balanceOf(msg.sender) >= MINT_COST_FLOAI, "Insufficient FLOAI");
        require(bytes(name).length > 0, "Name required");
        require(bytes(agentType).length > 0, "Agent type required");
        require(creditPackageId < 4, "Invalid credit package");
        
        // Transfer FLOAI tokens
        require(
            floaiToken.transferFrom(msg.sender, address(this), MINT_COST_FLOAI),
            "FLOAI transfer failed"
        );
        
        uint256 tokenId = _mintAgent(
            name, agentType, instructions, tools, connections,
            floaiPerOp, metadataURI, metadataHash, creditPackageId
        );
        
        emit AgentMinted(tokenId, msg.sender, agentType, creditPackageId, "FLOAI");
    }
    
    // Internal mint function
    function _mintAgent(
        string memory name,
        string memory agentType,
        string memory instructions,
        string[] memory tools,
        string[] memory connections,
        uint256 floaiPerOp,
        string memory metadataURI,
        bytes32 metadataHash,
        uint256 creditPackageId
    ) internal returns (uint256) {
        uint256 tokenId = _currentTokenId++;
        _safeMint(msg.sender, tokenId);
        
        agentConfigs[tokenId] = AgentConfig({
            name: name,
            agentType: agentType,
            instructions: instructions,
            tools: tools,
            connections: connections,
            floaiPerOperation: floaiPerOp,
            creator: msg.sender,
            isActive: true,
            generationCount: 0,
            totalRevenue: 0,
            creditPackageId: creditPackageId
        });
        
        agentMetadata[tokenId] = AgentMetadata({
            metadataURI: metadataURI,
            metadataHash: metadataHash,
            lastUpdated: block.timestamp,
            isEncrypted: true
        });
        
        // Initialize revenue tracking
        agentRevenue[tokenId].totalGenerated = 0;
        agentRevenue[tokenId].totalWithdrawn = 0;
        agentRevenue[tokenId].lastDistribution = block.timestamp;
        
        // Track user's agents
        userAgents[msg.sender].push(tokenId);
        
        return tokenId;
    }
    
    // Distribute minting fees (75/25 split)
    function _distributeMintingFees(uint256 amount) internal {
        uint256 banditKidzShare = (amount * 75) / 100;
        uint256 devShare = amount - banditKidzShare;
        
        payable(BANDIT_KIDZ_TREASURY).transfer(banditKidzShare);
        payable(DEV_TREASURY).transfer(devShare);
    }
    
    // Update agent metadata (with re-encryption on transfer)
    function updateAgentMetadata(
        uint256 tokenId, 
        string memory newMetadataURI,
        bytes32 newMetadataHash
    ) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        
        agentMetadata[tokenId].metadataURI = newMetadataURI;
        agentMetadata[tokenId].metadataHash = newMetadataHash;
        agentMetadata[tokenId].lastUpdated = block.timestamp;
        
        emit AgentConfigUpdated(tokenId, newMetadataURI);
    }
    
    // Record agent usage (called by Cloudflare Worker)
    function recordAgentUsage(
        uint256 tokenId, 
        uint256 floaiConsumed,
        string memory operation
    ) external onlyOwner {
        require(_exists(tokenId), "Agent does not exist");
        
        agentConfigs[tokenId].generationCount++;
        
        emit AgentUsed(tokenId, floaiConsumed, operation);
    }
    
    // Record revenue from generated content sales
    function recordRevenue(
        uint256 tokenId, 
        uint256 amount,
        address generator
    ) external onlyOwner {
        require(_exists(tokenId), "Agent does not exist");
        
        agentConfigs[tokenId].totalRevenue += amount;
        agentRevenue[tokenId].totalGenerated += amount;
        agentRevenue[tokenId].ownerEarnings[ownerOf(tokenId)] += amount;
        
        emit RevenueGenerated(tokenId, amount, generator);
    }
    
    // Withdraw agent revenue
    function withdrawAgentRevenue(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not agent owner");
        
        uint256 earnings = agentRevenue[tokenId].ownerEarnings[msg.sender];
        require(earnings > 0, "No earnings to withdraw");
        
        agentRevenue[tokenId].ownerEarnings[msg.sender] = 0;
        agentRevenue[tokenId].totalWithdrawn += earnings;
        
        payable(msg.sender).transfer(earnings);
        
        emit RevenueWithdrawn(tokenId, msg.sender, earnings);
    }
    
    // Override transfer to handle metadata re-encryption
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        whenNotPaused
        returns (address)
    {
        address from = super._update(to, tokenId, auth);
        
        if (from != address(0) && to != address(0)) {
            // Update user agent tracking
            _removeFromUserAgents(from, tokenId);
            userAgents[to].push(tokenId);
            
            // Emit transfer event for metadata re-encryption
            emit AgentTransferred(tokenId, from, to, agentMetadata[tokenId].metadataURI);
        }
        
        return from;
    }
    
    // Helper function to remove agent from user's list
    function _removeFromUserAgents(address user, uint256 tokenId) internal {
        uint256[] storage agents = userAgents[user];
        for (uint256 i = 0; i < agents.length; i++) {
            if (agents[i] == tokenId) {
                agents[i] = agents[agents.length - 1];
                agents.pop();
                break;
            }
        }
    }
    
    // Get agent configuration
    function getAgentConfig(uint256 tokenId) external view returns (AgentConfig memory) {
        require(_exists(tokenId), "Agent does not exist");
        return agentConfigs[tokenId];
    }
    
    // Get agent metadata
    function getAgentMetadata(uint256 tokenId) external view returns (AgentMetadata memory) {
        require(_exists(tokenId), "Agent does not exist");
        return agentMetadata[tokenId];
    }
    
    // Get user's agents
    function getUserAgents(address user) external view returns (uint256[] memory) {
        return userAgents[user];
    }
    
    // Get agent revenue info
    function getAgentRevenue(uint256 tokenId, address owner) external view returns (
        uint256 totalGenerated,
        uint256 totalWithdrawn,
        uint256 ownerEarnings,
        uint256 lastDistribution
    ) {
        require(_exists(tokenId), "Agent does not exist");
        
        return (
            agentRevenue[tokenId].totalGenerated,
            agentRevenue[tokenId].totalWithdrawn,
            agentRevenue[tokenId].ownerEarnings[owner],
            agentRevenue[tokenId].lastDistribution
        );
    }
    
    // Check if agent has premium features based on credit package
    function agentHasPremiumFeatures(uint256 tokenId) external view returns (bool) {
        require(_exists(tokenId), "Agent does not exist");
        uint256 packageId = agentConfigs[tokenId].creditPackageId;
        return packageId >= 1; // Creator tier and above
    }
    
    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Withdraw accumulated FLOAI tokens
    function withdrawFLOAI() external onlyOwner {
        uint256 balance = floaiToken.balanceOf(address(this));
        require(balance > 0, "No FLOAI to withdraw");
        floaiToken.transfer(owner(), balance);
    }
    
    // Get total agents count
    function totalSupply() external view returns (uint256) {
        return _currentTokenId - 1;
    }
}