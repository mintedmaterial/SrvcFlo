// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/// @custom:security-contact security@srvcflo.com
/// @title ERC-7857 Verifiable Intelligent NFT (INFT) Contract
/// @dev Implementation of ERC-7857 standard for verifiable intelligent NFTs with encrypted metadata
contract ERC7857VerifiableINFT is 
    Initializable, 
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    PausableUpgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable 
{
    // ERC-7857 Events
    event INFTCreated(uint256 indexed tokenId, address indexed owner, string metadataHash, bytes32 proofHash);
    event MetadataUpdated(uint256 indexed tokenId, string newMetadataHash, bytes32 newProofHash);
    event SecureTransferInitiated(uint256 indexed tokenId, address indexed from, address indexed to, bytes32 transferId);
    event OwnershipVerified(uint256 indexed tokenId, address indexed owner, bytes32 proofHash);
    event INFTPackageLinked(uint256 indexed tokenId, uint256 indexed packageTokenId);

    // ERC-7857 Structs
    struct INFTMetadata {
        string encryptedMetadataHash;  // IPFS hash of encrypted metadata
        bytes32 proofHash;             // Cryptographic proof of authenticity
        uint256 packageTokenId;       // Linked INFT package token ID
        address creator;               // Original creator address
        uint256 createdAt;            // Creation timestamp
        uint256 lastVerified;         // Last verification timestamp
        bool isVerified;              // Verification status
        string contentType;           // Type of content (image, video, etc.)
    }

    struct SecureTransfer {
        address from;
        address to;
        uint256 tokenId;
        bytes32 transferId;
        uint256 initiatedAt;
        bool isCompleted;
        string reencryptedMetadataHash;  // Re-encrypted for new owner
    }

    // Storage
    mapping(uint256 => INFTMetadata) private _inftMetadata;
    mapping(bytes32 => SecureTransfer) private _secureTransfers;
    mapping(address => uint256[]) private _ownerTokens;
    mapping(uint256 => uint256) private _tokenIndex; // Token to index in owner array
    
    uint256 private _nextTokenId;
    address public inftPackagesContract; // Reference to INFT packages contract

    // Constants
    uint256 public constant MAX_TRANSFER_WINDOW = 24 hours;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner, 
        address _inftPackagesContract,
        string memory name,
        string memory symbol
    ) public initializer {
        __ERC721_init(name, symbol);
        __ERC721URIStorage_init();
        __Pausable_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
        inftPackagesContract = _inftPackagesContract;
        _nextTokenId = 1;
    }

    /// @notice Mint a new verifiable INFT
    /// @param to Address to mint the INFT to
    /// @param encryptedMetadataHash IPFS hash of encrypted metadata
    /// @param proofHash Cryptographic proof of authenticity
    /// @param packageTokenId Associated INFT package token ID
    /// @param contentType Type of content (image, video, etc.)
    /// @return tokenId The minted token ID
    function mintVerifiableINFT(
        address to,
        string memory encryptedMetadataHash,
        bytes32 proofHash,
        uint256 packageTokenId,
        string memory contentType
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(bytes(encryptedMetadataHash).length > 0, "Empty metadata hash");
        require(proofHash != bytes32(0), "Invalid proof hash");
        require(to != address(0), "Invalid recipient");

        uint256 tokenId = _nextTokenId++;
        
        // Store INFT metadata
        _inftMetadata[tokenId] = INFTMetadata({
            encryptedMetadataHash: encryptedMetadataHash,
            proofHash: proofHash,
            packageTokenId: packageTokenId,
            creator: msg.sender,
            createdAt: block.timestamp,
            lastVerified: block.timestamp,
            isVerified: true,
            contentType: contentType
        });

        // Mint the token
        _safeMint(to, tokenId);
        
        // Set token URI to IPFS hash
        _setTokenURI(tokenId, encryptedMetadataHash);
        
        // Update owner tracking
        _addTokenToOwner(to, tokenId);

        emit INFTCreated(tokenId, to, encryptedMetadataHash, proofHash);
        emit INFTPackageLinked(tokenId, packageTokenId);

        return tokenId;
    }

    /// @notice Verify metadata authenticity
    /// @param tokenId Token ID to verify
    /// @param expectedProofHash Expected proof hash for verification
    /// @return isValid Whether the metadata is valid
    function verifyMetadata(uint256 tokenId, bytes32 expectedProofHash) 
        external 
        view 
        returns (bool isValid) 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        INFTMetadata memory metadata = _inftMetadata[tokenId];
        return metadata.proofHash == expectedProofHash && metadata.isVerified;
    }

    /// @notice Update metadata with new encrypted data (owner only)
    /// @param tokenId Token ID to update
    /// @param newEncryptedMetadataHash New IPFS hash of encrypted metadata
    /// @param newProofHash New cryptographic proof
    function updateMetadata(
        uint256 tokenId,
        string memory newEncryptedMetadataHash,
        bytes32 newProofHash
    ) external whenNotPaused {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender || owner() == msg.sender, "Not authorized");
        require(bytes(newEncryptedMetadataHash).length > 0, "Empty metadata hash");
        require(newProofHash != bytes32(0), "Invalid proof hash");

        INFTMetadata storage metadata = _inftMetadata[tokenId];
        metadata.encryptedMetadataHash = newEncryptedMetadataHash;
        metadata.proofHash = newProofHash;
        metadata.lastVerified = block.timestamp;
        metadata.isVerified = true;

        // Update token URI
        _setTokenURI(tokenId, newEncryptedMetadataHash);

        emit MetadataUpdated(tokenId, newEncryptedMetadataHash, newProofHash);
    }

    /// @notice Initiate secure transfer with re-encryption
    /// @param from Current owner
    /// @param to New owner
    /// @param tokenId Token to transfer
    /// @param reencryptedMetadataHash Re-encrypted metadata for new owner
    /// @return transferId Unique transfer identifier
    function initiateSecureTransfer(
        address from,
        address to,
        uint256 tokenId,
        string memory reencryptedMetadataHash
    ) external whenNotPaused returns (bytes32 transferId) {
        require(ownerOf(tokenId) == from, "Not token owner");
        require(msg.sender == from || isApprovedForAll(from, msg.sender) || getApproved(tokenId) == msg.sender, "Not authorized");
        require(to != address(0), "Invalid recipient");
        require(bytes(reencryptedMetadataHash).length > 0, "Empty re-encrypted metadata");

        transferId = keccak256(abi.encodePacked(from, to, tokenId, block.timestamp, block.number));
        
        _secureTransfers[transferId] = SecureTransfer({
            from: from,
            to: to,
            tokenId: tokenId,
            transferId: transferId,
            initiatedAt: block.timestamp,
            isCompleted: false,
            reencryptedMetadataHash: reencryptedMetadataHash
        });

        emit SecureTransferInitiated(tokenId, from, to, transferId);
        return transferId;
    }

    /// @notice Complete secure transfer
    /// @param transferId Transfer identifier from initiateSecureTransfer
    function completeSecureTransfer(bytes32 transferId) external whenNotPaused nonReentrant {
        SecureTransfer storage transfer = _secureTransfers[transferId];
        require(transfer.transferId == transferId, "Invalid transfer ID");
        require(!transfer.isCompleted, "Transfer already completed");
        require(block.timestamp <= transfer.initiatedAt + MAX_TRANSFER_WINDOW, "Transfer window expired");
        
        address from = transfer.from;
        address to = transfer.to;
        uint256 tokenId = transfer.tokenId;
        
        require(ownerOf(tokenId) == from, "Token ownership changed");
        require(msg.sender == to || msg.sender == from, "Not authorized");

        // Update metadata with re-encrypted version
        INFTMetadata storage metadata = _inftMetadata[tokenId];
        metadata.encryptedMetadataHash = transfer.reencryptedMetadataHash;
        metadata.lastVerified = block.timestamp;
        
        // Update token URI
        _setTokenURI(tokenId, transfer.reencryptedMetadataHash);
        
        // Remove from old owner tracking
        _removeTokenFromOwner(from, tokenId);
        
        // Transfer the token
        _transfer(from, to, tokenId);
        
        // Add to new owner tracking
        _addTokenToOwner(to, tokenId);
        
        // Mark transfer as completed
        transfer.isCompleted = true;

        emit MetadataUpdated(tokenId, transfer.reencryptedMetadataHash, metadata.proofHash);
    }

    /// @notice Get INFT metadata
    /// @param tokenId Token ID to query
    /// @return metadata The INFT metadata struct
    function getINFTMetadata(uint256 tokenId) external view returns (INFTMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _inftMetadata[tokenId];
    }

    /// @notice Get tokens owned by an address
    /// @param owner Address to query
    /// @return tokenIds Array of token IDs owned by the address
    function getOwnerTokens(address owner) external view returns (uint256[] memory) {
        return _ownerTokens[owner];
    }

    /// @notice Verify ownership proof
    /// @param tokenId Token ID to verify
    /// @param proofHash Proof hash to verify
    /// @return isValid Whether the proof is valid
    function verifyOwnership(uint256 tokenId, bytes32 proofHash) external returns (bool isValid) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        INFTMetadata storage metadata = _inftMetadata[tokenId];
        isValid = metadata.proofHash == proofHash && metadata.isVerified;
        
        if (isValid) {
            metadata.lastVerified = block.timestamp;
            emit OwnershipVerified(tokenId, ownerOf(tokenId), proofHash);
        }
        
        return isValid;
    }

    // Internal functions for owner tracking
    function _addTokenToOwner(address to, uint256 tokenId) internal {
        _ownerTokens[to].push(tokenId);
        _tokenIndex[tokenId] = _ownerTokens[to].length - 1;
    }

    function _removeTokenFromOwner(address from, uint256 tokenId) internal {
        uint256[] storage tokens = _ownerTokens[from];
        uint256 tokenIdx = _tokenIndex[tokenId];
        uint256 lastTokenId = tokens[tokens.length - 1];
        
        tokens[tokenIdx] = lastTokenId;
        _tokenIndex[lastTokenId] = tokenIdx;
        tokens.pop();
        delete _tokenIndex[tokenId];
    }

    // Override transfers to update owner tracking
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        if (from != address(0) && to != from) {
            _removeTokenFromOwner(from, tokenId);
        }
        
        if (to != address(0) && to != from) {
            _addTokenToOwner(to, tokenId);
        }
        
        return super._update(to, tokenId, auth);
    }

    // Admin functions
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function setINFTPackagesContract(address _inftPackagesContract) external onlyOwner {
        inftPackagesContract = _inftPackagesContract;
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}