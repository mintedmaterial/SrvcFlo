// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

/// @custom:security-contact security@srvcflo.com
/// @title SrvcfloGeneratedNFT - ERC-1155 for AI Generated Content with IPFS Hosting
/// @dev Stores AI generated images/videos from INFT packages with full metadata and IPFS links
contract SrvcfloGeneratedNFT is ERC1155, Ownable, ERC1155Pausable, ERC1155Burnable, ERC1155Supply, ERC2981, ReentrancyGuard {

    // Generation metadata
    struct GenerationInfo {
        string prompt;
        string ipfsHash;
        string influencedCollection;
        address creator;
        uint256 packageTokenId;
        uint256 timestamp;
        bool isVideo;
        string aiModel;
        uint256 generationCost;
    }

    // Storage
    mapping(uint256 => GenerationInfo) public generations;
    mapping(uint256 => string) private _tokenURIs;
    mapping(address => bool) public authorizedMinters; // INFT package contracts
    
    uint256 private _currentTokenId = 1;
    string public baseMetadataURI = "https://api.srvcflo.com/metadata/generated/";
    
    // Royalty settings (5% default)
    uint96 public constant DEFAULT_ROYALTY_PERCENTAGE = 500; // 5%

    // Events
    event GenerationMinted(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 indexed packageTokenId,
        string prompt,
        string ipfsHash,
        bool isVideo
    );
    event IPFSHashUpdated(uint256 indexed tokenId, string oldHash, string newHash);
    event MinterAuthorized(address indexed minter, bool authorized);

    constructor(
        address initialOwner
    ) ERC1155("https://api.srvcflo.com/metadata/generated/{id}") Ownable(initialOwner) {
        // Set default royalty to contract owner
        _setDefaultRoyalty(initialOwner, DEFAULT_ROYALTY_PERCENTAGE);
    }

    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }

    // Authorize/deauthorize minters (INFT package contracts)
    function setAuthorizedMinter(address minter, bool authorized) external onlyOwner {
        authorizedMinters[minter] = authorized;
        emit MinterAuthorized(minter, authorized);
    }

    // Main minting function called by INFT packages
    function mintGeneration(
        address to,
        string memory prompt,
        string memory ipfsHash,
        string memory influencedCollection,
        bool isVideo,
        uint256 packageTokenId
    ) public onlyAuthorizedMinter returns (uint256) {
        uint256 tokenId = _currentTokenId++;
        
        // Determine AI model based on package type and generation type
        string memory aiModel = _determineAIModel(packageTokenId, isVideo);
        
        // Store generation metadata
        generations[tokenId] = GenerationInfo({
            prompt: prompt,
            ipfsHash: ipfsHash,
            influencedCollection: influencedCollection,
            creator: to,
            packageTokenId: packageTokenId,
            timestamp: block.timestamp,
            isVideo: isVideo,
            aiModel: aiModel,
            generationCost: isVideo ? 500 : 200 // Credits used
        });
        
        // Mint the NFT (amount = 1 for unique generations)
        _mint(to, tokenId, 1, "");
        
        emit GenerationMinted(tokenId, to, packageTokenId, prompt, ipfsHash, isVideo);
        return tokenId;
    }

    // Batch mint for multiple generations
    function mintGenerationBatch(
        address to,
        string[] memory prompts,
        string[] memory ipfsHashes,
        string[] memory influencedCollections,
        bool[] memory isVideos,
        uint256 packageTokenId
    ) external onlyAuthorizedMinter returns (uint256[] memory) {
        require(
            prompts.length == ipfsHashes.length &&
            ipfsHashes.length == influencedCollections.length &&
            influencedCollections.length == isVideos.length,
            "Array length mismatch"
        );
        
        uint256[] memory tokenIds = new uint256[](prompts.length);
        
        for (uint256 i = 0; i < prompts.length; i++) {
            tokenIds[i] = mintGeneration(
                to,
                prompts[i],
                ipfsHashes[i],
                influencedCollections[i],
                isVideos[i],
                packageTokenId
            );
        }
        
        return tokenIds;
    }

    // Determine AI model based on package type and generation type
    function _determineAIModel(uint256 packageTokenId, bool isVideo) internal pure returns (string memory) {
        // This is a simplified version - in practice, this would query the INFT contract
        // For now, we'll use package-based logic
        uint256 packageType = (packageTokenId % 4) + 1; // Simplified logic
        
        if (isVideo) {
            if (packageType == 1) {
                return "Cloudflare AI Video + Stable Video";
            } else if (packageType == 2) {
                return "GPT-5 + Gemini Ultra + Advanced Video";
            } else if (packageType == 3) {
                return "Multi-Cloud Video Suite (OpenAI + Cloudflare + Google)";
            } else {
                return "Enterprise Video + Custom + Multi-Provider";
            }
        } else {
            if (packageType == 1) {
                return "GPT-4.1 + DALL-E-3 + Cloudflare AI + Gemini Pro";
            } else if (packageType == 2) {
                return "GPT-5 + DALL-E-3 + Gemini Ultra + Cloudflare Workers AI";
            } else if (packageType == 3) {
                return "Multi-Cloud Suite (OpenAI + Cloudflare + Google + Custom)";
            } else {
                return "Enterprise Multi-Provider + Fine-tuned + Failover";
            }
        }
    }


    // Update IPFS hash after generation completes
    function updateIPFSHash(uint256 tokenId, string memory newIpfsHash) public onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        
        string memory oldHash = generations[tokenId].ipfsHash;
        generations[tokenId].ipfsHash = newIpfsHash;
        
        emit IPFSHashUpdated(tokenId, oldHash, newIpfsHash);
    }

    // Batch update IPFS hashes
    function updateIPFSHashBatch(
        uint256[] memory tokenIds,
        string[] memory newIpfsHashes
    ) external onlyOwner {
        require(tokenIds.length == newIpfsHashes.length, "Array length mismatch");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            updateIPFSHash(tokenIds[i], newIpfsHashes[i]);
        }
    }


    // Custom URI function that returns IPFS or API metadata
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        
        GenerationInfo memory gen = generations[tokenId];
        
        // If IPFS hash is set, return IPFS URL
        if (bytes(gen.ipfsHash).length > 0) {
            return string(abi.encodePacked("ipfs://", gen.ipfsHash));
        }
        
        // Otherwise return API metadata URL
        return string(abi.encodePacked(baseMetadataURI, _toString(tokenId)));
    }

    // Set custom URI for specific token
    function setTokenURI(uint256 tokenId, string memory newUri) external onlyOwner {
        require(_exists(tokenId), "URI set of nonexistent token");
        _tokenURIs[tokenId] = newUri;
    }

    // Get complete generation info
    function getGenerationInfo(uint256 tokenId) external view returns (
        string memory prompt,
        string memory ipfsHash,
        string memory influencedCollection,
        address creator,
        uint256 packageTokenId,
        uint256 timestamp,
        bool isVideo,
        string memory aiModel,
        uint256 generationCost
    ) {
        require(_exists(tokenId), "Token does not exist");
        
        GenerationInfo memory gen = generations[tokenId];
        return (
            gen.prompt,
            gen.ipfsHash,
            gen.influencedCollection,
            gen.creator,
            gen.packageTokenId,
            gen.timestamp,
            gen.isVideo,
            gen.aiModel,
            gen.generationCost
        );
    }

    // Get generations by creator
    function getGenerationsByCreator(address creator) external view returns (uint256[] memory) {
        uint256 totalTokens = _currentTokenId - 1;
        uint256 creatorCount = 0;
        
        // First pass: count creator's tokens
        for (uint256 i = 1; i <= totalTokens; i++) {
            if (_exists(i) && generations[i].creator == creator) {
                creatorCount++;
            }
        }
        
        // Second pass: populate array
        uint256[] memory creatorTokens = new uint256[](creatorCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalTokens; i++) {
            if (_exists(i) && generations[i].creator == creator) {
                creatorTokens[index] = i;
                index++;
            }
        }
        
        return creatorTokens;
    }

    // Get generations by package
    function getGenerationsByPackage(uint256 packageTokenId) external view returns (uint256[] memory) {
        uint256 totalTokens = _currentTokenId - 1;
        uint256 packageCount = 0;
        
        // First pass: count package's tokens
        for (uint256 i = 1; i <= totalTokens; i++) {
            if (_exists(i) && generations[i].packageTokenId == packageTokenId) {
                packageCount++;
            }
        }
        
        // Second pass: populate array
        uint256[] memory packageTokens = new uint256[](packageCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalTokens; i++) {
            if (_exists(i) && generations[i].packageTokenId == packageTokenId) {
                packageTokens[index] = i;
                index++;
            }
        }
        
        return packageTokens;
    }

    // Get generations by collection influence
    function getGenerationsByCollection(string memory collection) external view returns (uint256[] memory) {
        uint256 totalTokens = _currentTokenId - 1;
        uint256 collectionCount = 0;
        bytes32 collectionHash = keccak256(bytes(collection));
        
        // First pass: count collection's tokens
        for (uint256 i = 1; i <= totalTokens; i++) {
            if (_exists(i) && keccak256(bytes(generations[i].influencedCollection)) == collectionHash) {
                collectionCount++;
            }
        }
        
        // Second pass: populate array
        uint256[] memory collectionTokens = new uint256[](collectionCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalTokens; i++) {
            if (_exists(i) && keccak256(bytes(generations[i].influencedCollection)) == collectionHash) {
                collectionTokens[index] = i;
                index++;
            }
        }
        
        return collectionTokens;
    }

    // Internal helper function to check if token exists
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId < _currentTokenId && tokenId > 0;
    }

    // Admin functions
    function setBaseMetadataURI(string memory newBaseURI) external onlyOwner {
        baseMetadataURI = newBaseURI;
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // Royalty functions
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) external onlyOwner {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    // Emergency functions
    function emergencyMint(address to, uint256 id, uint256 amount, bytes memory data) external onlyOwner {
        _mint(to, id, amount, data);
    }

    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Helper function to convert uint to string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // Required overrides
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Pausable, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Receive function for royalties
    receive() external payable {}
}