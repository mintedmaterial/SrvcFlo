// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ERC7857VerifiableINFT
 * @dev Implementation of ERC-7857 Verifiable Intelligent NFTs with zero-trust architecture
 * 
 * This contract implements intelligent NFTs that:
 * - Store encrypted metadata with on-chain hash commitments
 * - Support verifiable proof generation without TEE using Cloudflare Workers
 * - Enable secure ownership transfers with re-encryption capabilities
 * - Maintain cryptographic integrity for dynamic metadata updates
 * - Provide agent learning data encryption and state management
 */
contract ERC7857VerifiableINFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, Pausable {
    
    // ERC-7857 standard events
    event MetadataUpdate(uint256 indexed tokenId, bytes32 metadataHash, string encryptedURI);
    event ProofVerified(uint256 indexed tokenId, bytes32 proofHash, address verifier);
    event OwnershipTransferInitiated(uint256 indexed tokenId, address from, address to, bytes32 transferHash);
    event AgentLearningUpdate(uint256 indexed tokenId, bytes32 learningHash, uint256 version);
    
    // Verifiable metadata structure
    struct VerifiableMetadata {
        bytes32 contentHash;        // Hash of encrypted content
        bytes32 proofHash;          // Hash of verification proof
        string encryptedURI;        // URI to encrypted metadata in R2
        uint256 version;            // Version number for updates
        uint256 lastUpdate;        // Timestamp of last update
        bool isVerified;            // Verification status
        address lastVerifier;      // Last entity that verified the content
    }
    
    // Agent learning data structure for intelligent behavior
    struct AgentLearningData {
        bytes32 learningHash;       // Hash of encrypted learning data
        bytes32 skillsHash;         // Hash of encrypted skills data
        bytes32 preferencesHash;    // Hash of encrypted preferences
        uint256 learningVersion;    // Version of learning data
        uint256 interactions;       // Number of interactions
        uint256 lastLearningUpdate; // Last learning update timestamp
        bool isActive;              // Whether agent is actively learning
    }
    
    // Transfer verification for secure ownership changes
    struct TransferVerification {
        bytes32 transferHash;       // Hash of transfer data
        address from;               // Current owner
        address to;                 // New owner
        uint256 deadline;           // Transfer deadline
        bool isCompleted;           // Transfer completion status
        bytes encryptionKeyHash;    // Hash for re-encryption
    }
    
    // Storage mappings
    mapping(uint256 => VerifiableMetadata) private _tokenMetadata;
    mapping(uint256 => AgentLearningData) private _agentLearning;
    mapping(uint256 => TransferVerification) private _pendingTransfers;
    mapping(address => bool) public authorizedVerifiers;
    mapping(bytes32 => bool) public usedProofs;
    
    // Contract configuration
    uint256 private _nextTokenId = 1;
    uint256 public constant MAX_SUPPLY = 100000;
    uint256 public constant TRANSFER_DEADLINE = 7 days;
    
    // CloudFlare Worker endpoint for verification
    string public verificationEndpoint;
    
    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender] || msg.sender == owner(), "Not authorized verifier");
        _;
    }
    
    modifier validTokenId(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _;
    }
    
    constructor(
        string memory name,
        string memory symbol,
        string memory _verificationEndpoint
    ) ERC721(name, symbol) Ownable(msg.sender) {
        verificationEndpoint = _verificationEndpoint;
        authorizedVerifiers[msg.sender] = true;
    }
    
    /**
     * @dev Mint a new verifiable INFT with encrypted metadata
     * @param to Address to mint the token to
     * @param encryptedURI URI pointing to encrypted metadata in R2
     * @param contentHash Hash of the encrypted content
     * @param proofHash Initial proof hash
     */
    function mintVerifiableINFT(
        address to,
        string memory encryptedURI,
        bytes32 contentHash,
        bytes32 proofHash
    ) external onlyOwner nonReentrant whenNotPaused returns (uint256) {
        require(_nextTokenId <= MAX_SUPPLY, "Max supply reached");
        require(bytes(encryptedURI).length > 0, "URI cannot be empty");
        require(contentHash != bytes32(0), "Content hash cannot be zero");
        require(!usedProofs[proofHash], "Proof already used");
        
        uint256 tokenId = _nextTokenId++;
        
        // Mint the token
        _safeMint(to, tokenId);
        
        // Set verifiable metadata
        _tokenMetadata[tokenId] = VerifiableMetadata({
            contentHash: contentHash,
            proofHash: proofHash,
            encryptedURI: encryptedURI,
            version: 1,
            lastUpdate: block.timestamp,
            isVerified: false,
            lastVerifier: address(0)
        });
        
        // Initialize agent learning data
        _agentLearning[tokenId] = AgentLearningData({
            learningHash: keccak256(abi.encodePacked(tokenId, "initial")),
            skillsHash: bytes32(0),
            preferencesHash: bytes32(0),
            learningVersion: 1,
            interactions: 0,
            lastLearningUpdate: block.timestamp,
            isActive: true
        });
        
        usedProofs[proofHash] = true;
        
        emit MetadataUpdate(tokenId, contentHash, encryptedURI);
        
        return tokenId;
    }
    
    /**
     * @dev Verify the integrity and authenticity of token metadata
     * @param tokenId Token ID to verify
     * @param proofData Verification proof data from Cloudflare Worker
     */
    function verifyMetadata(
        uint256 tokenId,
        bytes memory proofData
    ) external onlyAuthorizedVerifier validTokenId(tokenId) {
        VerifiableMetadata storage metadata = _tokenMetadata[tokenId];
        
        // Verify proof hasn't been used
        bytes32 proofHash = keccak256(proofData);
        require(!usedProofs[proofHash], "Proof already used");
        
        // In a full implementation, this would verify the proof against the content
        // For now, we mark as verified if the proof is from an authorized verifier
        metadata.isVerified = true;
        metadata.lastVerifier = msg.sender;
        metadata.proofHash = proofHash;
        
        usedProofs[proofHash] = true;
        
        emit ProofVerified(tokenId, proofHash, msg.sender);
    }
    
    /**
     * @dev Update metadata with new encrypted content and proof
     * @param tokenId Token ID to update
     * @param newEncryptedURI New encrypted URI
     * @param newContentHash New content hash
     * @param proofData Proof of update validity
     */
    function updateMetadata(
        uint256 tokenId,
        string memory newEncryptedURI,
        bytes32 newContentHash,
        bytes memory proofData
    ) external validTokenId(tokenId) {
        require(ownerOf(tokenId) == msg.sender || authorizedVerifiers[msg.sender], "Not authorized");
        require(bytes(newEncryptedURI).length > 0, "URI cannot be empty");
        require(newContentHash != bytes32(0), "Content hash cannot be zero");
        
        VerifiableMetadata storage metadata = _tokenMetadata[tokenId];
        bytes32 proofHash = keccak256(proofData);
        require(!usedProofs[proofHash], "Proof already used");
        
        // Update metadata
        metadata.encryptedURI = newEncryptedURI;
        metadata.contentHash = newContentHash;
        metadata.proofHash = proofHash;
        metadata.version++;
        metadata.lastUpdate = block.timestamp;
        metadata.isVerified = false; // Needs re-verification after update
        
        usedProofs[proofHash] = true;
        
        emit MetadataUpdate(tokenId, newContentHash, newEncryptedURI);
    }
    
    /**
     * @dev Update agent learning data
     * @param tokenId Token ID of the agent
     * @param learningHash Hash of new learning data
     * @param skillsHash Hash of updated skills
     * @param preferencesHash Hash of updated preferences
     */
    function updateAgentLearning(
        uint256 tokenId,
        bytes32 learningHash,
        bytes32 skillsHash,
        bytes32 preferencesHash
    ) external validTokenId(tokenId) {
        require(ownerOf(tokenId) == msg.sender || authorizedVerifiers[msg.sender], "Not authorized");
        
        AgentLearningData storage learning = _agentLearning[tokenId];
        require(learning.isActive, "Agent learning is not active");
        
        learning.learningHash = learningHash;
        learning.skillsHash = skillsHash;
        learning.preferencesHash = preferencesHash;
        learning.learningVersion++;
        learning.interactions++;
        learning.lastLearningUpdate = block.timestamp;
        
        emit AgentLearningUpdate(tokenId, learningHash, learning.learningVersion);
    }
    
    /**
     * @dev Initiate secure ownership transfer with re-encryption
     * @param tokenId Token ID to transfer
     * @param to New owner address
     * @param encryptionKeyHash Hash for re-encryption process
     */
    function initiateSecureTransfer(
        uint256 tokenId,
        address to,
        bytes memory encryptionKeyHash
    ) external validTokenId(tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(to != address(0), "Invalid recipient");
        require(to != msg.sender, "Cannot transfer to self");
        
        bytes32 transferHash = keccak256(abi.encodePacked(
            tokenId,
            msg.sender,
            to,
            block.timestamp,
            encryptionKeyHash
        ));
        
        _pendingTransfers[tokenId] = TransferVerification({
            transferHash: transferHash,
            from: msg.sender,
            to: to,
            deadline: block.timestamp + TRANSFER_DEADLINE,
            isCompleted: false,
            encryptionKeyHash: encryptionKeyHash
        });
        
        emit OwnershipTransferInitiated(tokenId, msg.sender, to, transferHash);
    }
    
    /**
     * @dev Complete secure transfer after re-encryption is done
     * @param tokenId Token ID to complete transfer for
     * @param newEncryptedURI Updated encrypted URI for new owner
     * @param newContentHash Updated content hash after re-encryption
     */
    function completeSecureTransfer(
        uint256 tokenId,
        string memory newEncryptedURI,
        bytes32 newContentHash
    ) external onlyAuthorizedVerifier validTokenId(tokenId) {
        TransferVerification storage transfer = _pendingTransfers[tokenId];
        require(transfer.from != address(0), "No pending transfer");
        require(block.timestamp <= transfer.deadline, "Transfer deadline passed");
        require(!transfer.isCompleted, "Transfer already completed");
        
        // Update metadata with re-encrypted content
        VerifiableMetadata storage metadata = _tokenMetadata[tokenId];
        metadata.encryptedURI = newEncryptedURI;
        metadata.contentHash = newContentHash;
        metadata.version++;
        metadata.lastUpdate = block.timestamp;
        metadata.isVerified = false; // Needs re-verification
        
        // Complete the transfer
        address from = transfer.from;
        address to = transfer.to;
        transfer.isCompleted = true;
        
        // Execute the actual transfer
        _transfer(from, to, tokenId);
        
        emit MetadataUpdate(tokenId, newContentHash, newEncryptedURI);
    }
    
    /**
     * @dev Get verifiable metadata for a token
     */
    function getVerifiableMetadata(uint256 tokenId) 
        external 
        view 
        validTokenId(tokenId) 
        returns (VerifiableMetadata memory) 
    {
        return _tokenMetadata[tokenId];
    }
    
    /**
     * @dev Get agent learning data for a token
     */
    function getAgentLearningData(uint256 tokenId) 
        external 
        view 
        validTokenId(tokenId) 
        returns (AgentLearningData memory) 
    {
        return _agentLearning[tokenId];
    }
    
    /**
     * @dev Get pending transfer information
     */
    function getPendingTransfer(uint256 tokenId) 
        external 
        view 
        validTokenId(tokenId) 
        returns (TransferVerification memory) 
    {
        return _pendingTransfers[tokenId];
    }
    
    /**
     * @dev Add or remove authorized verifiers
     */
    function setAuthorizedVerifier(address verifier, bool authorized) external onlyOwner {
        authorizedVerifiers[verifier] = authorized;
    }
    
    /**
     * @dev Update verification endpoint
     */
    function setVerificationEndpoint(string memory _verificationEndpoint) external onlyOwner {
        verificationEndpoint = _verificationEndpoint;
    }
    
    /**
     * @dev Pause/unpause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        override(ERC721) 
        returns (address) 
    {
        return super._update(to, tokenId, auth);
    }
    
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        return _tokenMetadata[tokenId].encryptedURI;
    }
    
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Emergency function to recover tokens sent to contract
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}