// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Pausable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @custom:security-contact admin@serviceflowai.com
/// @title SrvcfloCreditsNFTWithRoyalties
/// @dev ERC-1155 contract for ServiceFlow AI Credits with creator royalties
/// @notice 2% total royalty: 1.5% to original creator, 0.5% to ServiceFlow AI
contract SrvcfloCreditsNFTWithRoyalties is ERC1155, Ownable, ERC1155Pausable, ERC1155Supply, IERC2981 {
    
    // Royalty configuration
    uint256 public constant TOTAL_ROYALTY_BASIS_POINTS = 200; // 2%
    uint256 public constant CREATOR_ROYALTY_BASIS_POINTS = 150; // 1.5%
    uint256 public constant APP_ROYALTY_BASIS_POINTS = 50; // 0.5%
    uint256 public constant BASIS_POINTS_DENOMINATOR = 10000; // 100%
    
    // ServiceFlow AI wallet for app royalties
    address public appWallet;
    
    // Token creator mapping (tracks who minted each token type)
    mapping(uint256 => address) public tokenCreators;
    
    // Generation metadata tracking
    mapping(uint256 => string) public generationPrompts;
    mapping(uint256 => string) public generationMethods; // "OpenAI", "Cloudflare", "Gemini"
    mapping(uint256 => uint256) public mintTimestamps;
    
    event TokenCreatorSet(uint256 indexed tokenId, address indexed creator);
    event GenerationMetadataSet(uint256 indexed tokenId, string prompt, string method);
    event AppWalletUpdated(address indexed oldWallet, address indexed newWallet);

    constructor(address initialOwner, address _appWallet)
        ERC1155("https://api.serviceflowai.com/metadata/{id}.json")
        Ownable(initialOwner)
    {
        require(_appWallet != address(0), "App wallet cannot be zero address");
        appWallet = _appWallet;
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

    /**
     * @dev Set the app wallet for receiving royalties
     */
    function setAppWallet(address _appWallet) public onlyOwner {
        require(_appWallet != address(0), "App wallet cannot be zero address");
        address oldWallet = appWallet;
        appWallet = _appWallet;
        emit AppWalletUpdated(oldWallet, _appWallet);
    }

    /**
     * @dev Mint NFT with creator and generation metadata
     */
    function mintWithMetadata(
        address creator,
        uint256 tokenId,
        uint256 amount,
        string memory prompt,
        string memory generationMethod,
        bytes memory data
    ) public onlyOwner {
        require(creator != address(0), "Creator cannot be zero address");
        require(bytes(prompt).length > 0, "Prompt cannot be empty");
        require(bytes(generationMethod).length > 0, "Generation method cannot be empty");
        
        // Set creator if not already set (first mint of this token type)
        if (tokenCreators[tokenId] == address(0)) {
            tokenCreators[tokenId] = creator;
            generationPrompts[tokenId] = prompt;
            generationMethods[tokenId] = generationMethod;
            mintTimestamps[tokenId] = block.timestamp;
            
            emit TokenCreatorSet(tokenId, creator);
            emit GenerationMetadataSet(tokenId, prompt, generationMethod);
        }
        
        _mint(creator, tokenId, amount, data);
    }

    /**
     * @dev Standard mint function (for backward compatibility)
     */
    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
        onlyOwner
    {
        // Set account as creator if not already set
        if (tokenCreators[id] == address(0)) {
            tokenCreators[id] = account;
            mintTimestamps[id] = block.timestamp;
            emit TokenCreatorSet(id, account);
        }
        
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyOwner
    {
        // Set creators for new token types
        for (uint256 i = 0; i < ids.length; i++) {
            if (tokenCreators[ids[i]] == address(0)) {
                tokenCreators[ids[i]] = to;
                mintTimestamps[ids[i]] = block.timestamp;
                emit TokenCreatorSet(ids[i], to);
            }
        }
        
        _mintBatch(to, ids, amounts, data);
    }

    /**
     * @dev ERC2981 royalty implementation
     * @param tokenId The token being queried for royalty information
     * @param salePrice The sale price of the token specified by tokenId
     * @return receiver Address to receive royalty
     * @return royaltyAmount Royalty amount for the receiver
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        // For marketplace compatibility, return the creator as primary receiver
        // Marketplaces will need to handle the split manually or use our split function
        address creator = tokenCreators[tokenId];
        if (creator == address(0)) {
            return (appWallet, (salePrice * APP_ROYALTY_BASIS_POINTS) / BASIS_POINTS_DENOMINATOR);
        }
        
        return (creator, (salePrice * TOTAL_ROYALTY_BASIS_POINTS) / BASIS_POINTS_DENOMINATOR);
    }

    /**
     * @dev Calculate split royalty amounts for external marketplaces
     * @param tokenId The token being queried
     * @param salePrice The sale price
     * @return creatorAmount Amount for the creator (1.5%)
     * @return appAmount Amount for ServiceFlow AI (0.5%)
     * @return creatorAddress Address of the creator
     * @return appAddress Address of ServiceFlow AI
     */
    function calculateRoyaltySplit(uint256 tokenId, uint256 salePrice)
        external
        view
        returns (
            uint256 creatorAmount,
            uint256 appAmount,
            address creatorAddress,
            address appAddress
        )
    {
        address creator = tokenCreators[tokenId];
        
        creatorAmount = (salePrice * CREATOR_ROYALTY_BASIS_POINTS) / BASIS_POINTS_DENOMINATOR;
        appAmount = (salePrice * APP_ROYALTY_BASIS_POINTS) / BASIS_POINTS_DENOMINATOR;
        creatorAddress = creator != address(0) ? creator : appWallet;
        appAddress = appWallet;
    }

    /**
     * @dev Helper function for marketplaces to execute royalty split
     */
    function executeRoyaltySplit(uint256 tokenId) external payable {
        require(msg.value > 0, "No payment received");
        
        (uint256 creatorAmount, uint256 appAmount, address creatorAddress, address appAddress) = 
            this.calculateRoyaltySplit(tokenId, msg.value);
        
        // Send royalties
        if (creatorAmount > 0 && creatorAddress != address(0)) {
            (bool creatorSuccess, ) = payable(creatorAddress).call{value: creatorAmount}("");
            require(creatorSuccess, "Creator payment failed");
        }
        
        if (appAmount > 0 && appAddress != address(0)) {
            (bool appSuccess, ) = payable(appAddress).call{value: appAmount}("");
            require(appSuccess, "App payment failed");
        }
    }

    /**
     * @dev Get generation metadata for a token
     */
    function getGenerationMetadata(uint256 tokenId)
        external
        view
        returns (
            address creator,
            string memory prompt,
            string memory method,
            uint256 timestamp
        )
    {
        return (
            tokenCreators[tokenId],
            generationPrompts[tokenId],
            generationMethods[tokenId],
            mintTimestamps[tokenId]
        );
    }

    /**
     * @dev Check if contract supports ERC2981 royalty standard
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }

    // The following functions are overrides required by Solidity.
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Pausable, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }

    /**
     * @dev Emergency functions for owner
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Allow contract to receive Ether for royalty splits
     */
    receive() external payable {}
}