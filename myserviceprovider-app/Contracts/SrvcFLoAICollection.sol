// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {ERC1155Pausable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @custom:security-contact security@srvcflo.com
contract SrvcFLoAICollection is ERC1155, Ownable, ERC1155Pausable, ERC1155Burnable, ERC1155Supply {
    // Token IDs for different credit types - Updated to match actual system
    uint256 public constant STARTER_CREDITS = 0;      // 750 credits for 5 USDC/S
    uint256 public constant CREATOR_CREDITS = 1;      // 8000 credits for 50 USDC/S  
    uint256 public constant PROFESSIONAL_CREDITS = 2; // 50000 credits for 200 USDC/S
    uint256 public constant ENTERPRISE_CREDITS = 3;   // 500000 credits for 1500 USDC/S
    uint256 public constant CUSTOM_CREDITS = 4;       // Custom amount set by user
    
    // Credit amounts mapping
    mapping(uint256 => uint256) public creditAmounts;
    
    // Package pricing in USDC (6 decimals) and S tokens (18 decimals)
    mapping(uint256 => uint256) public usdcPrices;
    mapping(uint256 => uint256) public sTokenPrices;
    
    // User can set custom credit amount for CUSTOM_CREDITS type
    mapping(address => uint256) public userCustomCredits;
    
    // Model access tiers
    mapping(uint256 => bool) public hasAllModels;
    mapping(uint256 => bool) public hasCollectionInfluence;
    
    constructor(address initialOwner)
        ERC1155("https://api.srvcflo.com/credits/metadata/{id}")
        Ownable(initialOwner)
    {
        // Initialize credit amounts for predefined packages
        creditAmounts[STARTER_CREDITS] = 750;
        creditAmounts[CREATOR_CREDITS] = 8000;
        creditAmounts[PROFESSIONAL_CREDITS] = 50000;
        creditAmounts[ENTERPRISE_CREDITS] = 500000;
        
        // Initialize USDC prices (6 decimals)
        usdcPrices[STARTER_CREDITS] = 5 * 10**6;       // $5 USDC
        usdcPrices[CREATOR_CREDITS] = 50 * 10**6;      // $50 USDC
        usdcPrices[PROFESSIONAL_CREDITS] = 200 * 10**6; // $200 USDC
        usdcPrices[ENTERPRISE_CREDITS] = 1500 * 10**6;  // $1500 USDC
        
        // Initialize S token prices (18 decimals)
        sTokenPrices[STARTER_CREDITS] = 5 * 10**18;     // 5 S tokens
        sTokenPrices[CREATOR_CREDITS] = 50 * 10**18;    // 50 S tokens
        sTokenPrices[PROFESSIONAL_CREDITS] = 200 * 10**18; // 200 S tokens
        sTokenPrices[ENTERPRISE_CREDITS] = 1500 * 10**18;  // 1500 S tokens
        
        // Set model access tiers ($50+ gets all models)
        hasAllModels[CREATOR_CREDITS] = true;
        hasAllModels[PROFESSIONAL_CREDITS] = true;
        hasAllModels[ENTERPRISE_CREDITS] = true;
        hasCollectionInfluence[CREATOR_CREDITS] = true;
        hasCollectionInfluence[PROFESSIONAL_CREDITS] = true;
        hasCollectionInfluence[ENTERPRISE_CREDITS] = true;
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
    
    // Mint predefined credit packages
    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
        onlyOwner
    {
        _mint(account, id, amount, data);
    }

    // Mint custom credits - user can specify amount
    function mintCustomCredits(address account, uint256 creditAmount, bytes memory data)
        public
        onlyOwner
    {
        userCustomCredits[account] = creditAmount;
        _mint(account, CUSTOM_CREDITS, creditAmount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyOwner
    {
        _mintBatch(to, ids, amounts, data);
    }
    
    // Get credit amount for a token type
    function getCreditAmount(uint256 tokenId) public view returns (uint256) {
        if (tokenId == CUSTOM_CREDITS) {
            return userCustomCredits[msg.sender];
        }
        return creditAmounts[tokenId];
    }
    
    // Burn credits when used for generation
    function useCredits(address account, uint256 tokenId, uint256 creditsToUse) public onlyOwner {
        uint256 balance = balanceOf(account, tokenId);
        require(balance >= creditsToUse, "Insufficient credits");
        _burn(account, tokenId, creditsToUse);
    }
    
    // Get package pricing
    function getUSDCPrice(uint256 tokenId) public view returns (uint256) {
        return usdcPrices[tokenId];
    }
    
    function getSTokenPrice(uint256 tokenId) public view returns (uint256) {
        return sTokenPrices[tokenId];
    }
    
    // Check model access
    function packageHasAllModels(uint256 tokenId) public view returns (bool) {
        return hasAllModels[tokenId];
    }
    
    function packageHasCollectionInfluence(uint256 tokenId) public view returns (bool) {
        return hasCollectionInfluence[tokenId];
    }
    
    // Purchase credits with S tokens (payable function)
    function purchaseCreditsWithS(uint256 tokenId) external payable {
        require(tokenId < 4, "Invalid token ID");
        require(msg.value >= sTokenPrices[tokenId], "Insufficient S tokens");
        
        uint256 creditAmount = creditAmounts[tokenId];
        _mint(msg.sender, tokenId, creditAmount, "");
        
        // Refund excess payment
        if (msg.value > sTokenPrices[tokenId]) {
            payable(msg.sender).transfer(msg.value - sTokenPrices[tokenId]);
        }
    }
    
    // Owner can withdraw collected payments
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // The following functions are overrides required by Solidity.
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Pausable, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }
}