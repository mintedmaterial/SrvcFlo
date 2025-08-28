// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Simple ERC721 interface
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
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

contract GeneratedArtNFT is IERC165, IERC721, Ownable {
    // Token storage
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    
    // Token metadata
    uint256 private _tokenIds;
    string private _name = "ServiceFlow AI Generated Art";
    string private _symbol = "SFAI";
    
    // Custom metadata for each token
    mapping(uint256 => string) private _tokenURIs;
    
    // Generation tracking
    struct GenerationData {
        string prompt;
        string imageData; // Base64 or IPFS hash
        string model;
        uint256 timestamp;
        address creator;
        string paymentMethod;
        string transactionHash;
    }
    
    mapping(uint256 => GenerationData) public tokenGenerationData;
    
    // Authorized minters (payment contract, etc.)
    mapping(address => bool) public authorizedMinters;
    
    // Events
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed to,
        string prompt,
        string imageData,
        string model,
        string paymentMethod,
        string transactionHash
    );
    
    event MetadataUpdated(uint256 indexed tokenId, string newURI);
    event MinterAuthorized(address indexed minter, bool authorized);
    
    constructor() {}
    
    // Authorize/deauthorize minters
    function setAuthorizedMinter(address minter, bool authorized) external onlyOwner {
        authorizedMinters[minter] = authorized;
        emit MinterAuthorized(minter, authorized);
    }
    
    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner, "Not authorized to mint");
        _;
    }
    
    // ERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }
    
    // ERC721 Metadata
    function name() public view returns (string memory) {
        return _name;
    }
    
    function symbol() public view returns (string memory) {
        return _symbol;
    }
    
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        
        string memory _tokenURI = _tokenURIs[tokenId];
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }
        
        // Fallback to generation data
        GenerationData memory data = tokenGenerationData[tokenId];
        if (bytes(data.imageData).length > 0) {
            return string(abi.encodePacked("data:application/json;base64,", _encodeMetadata(tokenId)));
        }
        
        return string(abi.encodePacked("https://api.serviceflow.ai/nft/metadata/", toString(tokenId)));
    }
    
    // Set custom metadata URI for a token
    function setTokenURI(uint256 tokenId, string memory uri) external onlyOwner {
        require(_exists(tokenId), "URI set of nonexistent token");
        _tokenURIs[tokenId] = uri;
        emit MetadataUpdated(tokenId, uri);
    }
    
    // ERC721 Core
    function balanceOf(address owner) public view virtual override returns (uint256) {
        require(owner != address(0), "Balance query for the zero address");
        return _balances[owner];
    }
    
    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Owner query for nonexistent token");
        return owner;
    }
    
    function approve(address to, uint256 tokenId) public virtual override {
        address owner = ownerOf(tokenId);
        require(to != owner, "Approval to current owner");
        require(
            msg.sender == owner || isApprovedForAll(owner, msg.sender),
            "Approve caller is not owner nor approved for all"
        );
        
        _approve(to, tokenId);
    }
    
    function getApproved(uint256 tokenId) public view virtual override returns (address) {
        require(_exists(tokenId), "Approved query for nonexistent token");
        return _tokenApprovals[tokenId];
    }
    
    function setApprovalForAll(address operator, bool approved) public virtual override {
        require(operator != msg.sender, "Approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {
        return _operatorApprovals[owner][operator];
    }
    
    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Transfer caller is not owner nor approved");
        _transfer(from, to, tokenId);
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Transfer caller is not owner nor approved");
        _safeTransfer(from, to, tokenId, data);
    }
    
    // Mint NFT with generation data
    function mintGeneratedArt(
        address to,
        string memory prompt,
        string memory imageData,
        string memory model,
        string memory paymentMethod,
        string memory transactionHash
    ) public onlyAuthorizedMinter returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(to, newTokenId);
        
        // Store generation data
        tokenGenerationData[newTokenId] = GenerationData({
            prompt: prompt,
            imageData: imageData,
            model: model,
            timestamp: block.timestamp,
            creator: to,
            paymentMethod: paymentMethod,
            transactionHash: transactionHash
        });
        
        emit NFTMinted(newTokenId, to, prompt, imageData, model, paymentMethod, transactionHash);
        
        return newTokenId;
    }
    
    // Batch mint for multiple generations
    function mintBatchGeneratedArt(
        address to,
        string[] memory prompts,
        string[] memory imageDatas,
        string[] memory models,
        string[] memory paymentMethods,
        string[] memory transactionHashes
    ) public onlyAuthorizedMinter returns (uint256[] memory) {
        require(
            prompts.length == imageDatas.length && 
            imageDatas.length == models.length &&
            models.length == paymentMethods.length &&
            paymentMethods.length == transactionHashes.length,
            "Array length mismatch"
        );
        
        uint256[] memory tokenIds = new uint256[](prompts.length);
        
        for (uint256 i = 0; i < prompts.length; i++) {
            tokenIds[i] = mintGeneratedArt(to, prompts[i], imageDatas[i], models[i], paymentMethods[i], transactionHashes[i]);
        }
        
        return tokenIds;
    }
    
    // Internal functions
    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _owners[tokenId] != address(0);
    }
    
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
        require(_exists(tokenId), "Operator query for nonexistent token");
        address owner = ownerOf(tokenId);
        return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
    }
    
    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "Mint to the zero address");
        require(!_exists(tokenId), "Token already minted");
        
        _balances[to] += 1;
        _owners[tokenId] = to;
        
        emit Transfer(address(0), to, tokenId);
    }
    
    function _transfer(address from, address to, uint256 tokenId) internal virtual {
        require(ownerOf(tokenId) == from, "Transfer from incorrect owner");
        require(to != address(0), "Transfer to the zero address");
        
        // Clear approvals from the previous owner
        _approve(address(0), tokenId);
        
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        
        emit Transfer(from, to, tokenId);
    }
    
    function _approve(address to, uint256 tokenId) internal virtual {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }
    
    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal virtual {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "Transfer to non ERC721Receiver implementer");
    }
    
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) private returns (bool) {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("Transfer to non ERC721Receiver implementer");
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }
    
    // Get total supply
    function totalSupply() public view returns (uint256) {
        return _tokenIds;
    }
    
    // Get generation data for a token
    function getGenerationData(uint256 tokenId) public view returns (
        string memory prompt,
        string memory imageData,
        string memory model,
        uint256 timestamp,
        address creator,
        string memory paymentMethod,
        string memory transactionHash
    ) {
        require(_exists(tokenId), "Query for nonexistent token");
        GenerationData memory data = tokenGenerationData[tokenId];
        return (
            data.prompt,
            data.imageData,
            data.model,
            data.timestamp,
            data.creator,
            data.paymentMethod,
            data.transactionHash
        );
    }
    
    // Get tokens owned by address
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokens = new uint256[](tokenCount);
        uint256 tokenIndex = 0;
        
        for (uint256 i = 1; i <= _tokenIds; i++) {
            if (_owners[i] == owner) {
                tokens[tokenIndex] = i;
                tokenIndex++;
            }
        }
        
        return tokens;
    }
    
    // Helper function to encode metadata as base64
    function _encodeMetadata(uint256 tokenId) internal view returns (string memory) {
        GenerationData memory data = tokenGenerationData[tokenId];
        
        // Create JSON metadata
        string memory json = string(abi.encodePacked(
            '{"name": "ServiceFlow AI Art #', toString(tokenId),
            '", "description": "AI generated artwork created with ServiceFlow AI platform',
            '", "image": "', data.imageData,
            '", "attributes": [',
            '{"trait_type": "Prompt", "value": "', data.prompt, '"},',
            '{"trait_type": "Model", "value": "', data.model, '"},',
            '{"trait_type": "Payment Method", "value": "', data.paymentMethod, '"},',
            '{"trait_type": "Creator", "value": "', toHexString(uint256(uint160(data.creator)), 20), '"},',
            '{"trait_type": "Timestamp", "value": ', toString(data.timestamp), '}',
            ']}'
        ));
        
        // In a real implementation, you would encode this as base64
        // For now, returning the JSON directly (this would need proper base64 encoding)
        return json;
    }
    
    // Helper function to convert uint to string
    function toString(uint256 value) internal pure returns (string memory) {
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
    
    // Helper function to convert address to hex string
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = bytes1(uint8(value & 0xf) + (uint8(value & 0xf) < 10 ? 48 : 87));
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    // Receive function for native payments
    receive() external payable {}
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}