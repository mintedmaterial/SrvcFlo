// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

interface ISrvcfloINFTPackages {
    function getPackageInfo(uint256 tokenId) external view returns (
        uint256 packageType,
        uint256 maxGenerations,
        uint256 usedGenerations,
        uint256 remainingGenerations,
        string memory agentMetadata,
        string[] memory collectionInfluences,
        uint256[] memory generatedTokenIds
    );
}

interface ISrvcfloGeneratedNFT {
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
    );
}

/// @custom:security-contact security@srvcflo.com
/// @title SrvcfloMarketplace - Marketplace for INFT Packages and Generated Content
/// @dev Handles listing, bidding, and trading of both INFT packages and ERC-1155 generated content
contract SrvcfloMarketplace is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // Supported tokens for payments
    IERC20 public constant USDC = IERC20(0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6);
    IERC20 public constant WS_TOKEN = IERC20(0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38);
    IERC20 public constant SSSTT = IERC20(0xc777Fa50186362fe0EF9CCD579b6385cE7CB49f1);

    // Contract addresses
    ISrvcfloINFTPackages public inftPackagesContract;
    ISrvcfloGeneratedNFT public generatedNFTContract;
    
    // Marketplace fee (2.5%)
    uint256 public constant MARKETPLACE_FEE = 250; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    address public feeRecipient;

    // Listing types
    enum ListingType { INFT_PACKAGE, GENERATED_CONTENT }
    enum PaymentToken { ETH, USDC, WS, SSSTT }

    // Listing structure
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        PaymentToken paymentToken;
        ListingType listingType;
        uint256 amount; // For ERC-1155, usually 1
        bool active;
        uint256 createdAt;
        uint256 expiresAt;
    }

    // Bid structure
    struct Bid {
        address bidder;
        uint256 amount;
        PaymentToken paymentToken;
        uint256 createdAt;
        uint256 expiresAt;
        bool active;
    }

    // Auction structure
    struct Auction {
        uint256 tokenId;
        address seller;
        uint256 startingPrice;
        uint256 currentBid;
        address currentBidder;
        PaymentToken paymentToken;
        ListingType listingType;
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        bool active;
        bool ended;
    }

    // Storage
    mapping(bytes32 => Listing) public listings; // keccak256(abi.encodePacked(listingType, tokenId, seller))
    mapping(bytes32 => Bid[]) public bids; // listingId => bids array
    mapping(bytes32 => Auction) public auctions; // keccak256(abi.encodePacked(listingType, tokenId, seller))
    
    // User activity tracking
    mapping(address => uint256) public userListingsCount;
    mapping(address => uint256) public userPurchasesCount;

    // Events
    event Listed(
        bytes32 indexed listingId,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 price,
        PaymentToken paymentToken,
        ListingType listingType
    );
    
    event Sold(
        bytes32 indexed listingId,
        address indexed seller,
        address indexed buyer,
        uint256 tokenId,
        uint256 price,
        PaymentToken paymentToken,
        ListingType listingType
    );
    
    event BidPlaced(
        bytes32 indexed listingId,
        address indexed bidder,
        uint256 amount,
        PaymentToken paymentToken
    );
    
    event AuctionCreated(
        bytes32 indexed auctionId,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 startingPrice,
        uint256 endTime,
        ListingType listingType
    );
    
    event AuctionEnded(
        bytes32 indexed auctionId,
        address indexed winner,
        uint256 winningBid
    );

    event ListingCancelled(bytes32 indexed listingId);

    constructor(
        address initialOwner,
        address _inftPackagesContract,
        address _generatedNFTContract,
        address _feeRecipient
    ) Ownable(initialOwner) {
        inftPackagesContract = ISrvcfloINFTPackages(_inftPackagesContract);
        generatedNFTContract = ISrvcfloGeneratedNFT(_generatedNFTContract);
        feeRecipient = _feeRecipient;
    }

    // List INFT Package
    function listINFTPackage(
        uint256 tokenId,
        uint256 price,
        PaymentToken paymentToken,
        uint256 duration
    ) external nonReentrant whenNotPaused {
        require(price > 0, "Price must be greater than 0");
        require(IERC721(address(inftPackagesContract)).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(IERC721(address(inftPackagesContract)).isApprovedForAll(msg.sender, address(this)) || 
                IERC721(address(inftPackagesContract)).getApproved(tokenId) == address(this), "Not approved");

        bytes32 listingId = keccak256(abi.encodePacked(ListingType.INFT_PACKAGE, tokenId, msg.sender, block.timestamp));
        
        listings[listingId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            paymentToken: paymentToken,
            listingType: ListingType.INFT_PACKAGE,
            amount: 1,
            active: true,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + duration
        });

        userListingsCount[msg.sender]++;

        emit Listed(listingId, msg.sender, tokenId, price, paymentToken, ListingType.INFT_PACKAGE);
    }

    // List Generated Content (ERC-1155)
    function listGeneratedContent(
        uint256 tokenId,
        uint256 amount,
        uint256 price,
        PaymentToken paymentToken,
        uint256 duration
    ) external nonReentrant whenNotPaused {
        require(price > 0, "Price must be greater than 0");
        require(amount > 0, "Amount must be greater than 0");
        require(IERC1155(address(generatedNFTContract)).balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
        require(IERC1155(address(generatedNFTContract)).isApprovedForAll(msg.sender, address(this)), "Not approved");

        bytes32 listingId = keccak256(abi.encodePacked(ListingType.GENERATED_CONTENT, tokenId, msg.sender, block.timestamp));
        
        listings[listingId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            paymentToken: paymentToken,
            listingType: ListingType.GENERATED_CONTENT,
            amount: amount,
            active: true,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + duration
        });

        userListingsCount[msg.sender]++;

        emit Listed(listingId, msg.sender, tokenId, price, paymentToken, ListingType.GENERATED_CONTENT);
    }

    // Buy function
    function buy(bytes32 listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(block.timestamp <= listing.expiresAt, "Listing expired");
        require(listing.seller != msg.sender, "Cannot buy own listing");

        uint256 totalPrice = listing.price;
        uint256 marketplaceFee = (totalPrice * MARKETPLACE_FEE) / FEE_DENOMINATOR;
        uint256 royaltyFee = 0;
        address royaltyRecipient = address(0);

        // Calculate royalties for generated content
        if (listing.listingType == ListingType.GENERATED_CONTENT) {
            if (IERC165(address(generatedNFTContract)).supportsInterface(type(IERC2981).interfaceId)) {
                (royaltyRecipient, royaltyFee) = IERC2981(address(generatedNFTContract)).royaltyInfo(listing.tokenId, totalPrice);
            }
        }

        uint256 sellerAmount = totalPrice - marketplaceFee - royaltyFee;

        // Handle payment
        _handlePayment(listing.paymentToken, msg.sender, totalPrice, sellerAmount, marketplaceFee, royaltyFee, royaltyRecipient, listing.seller);

        // Transfer NFT
        if (listing.listingType == ListingType.INFT_PACKAGE) {
            IERC721(address(inftPackagesContract)).safeTransferFrom(listing.seller, msg.sender, listing.tokenId);
        } else {
            IERC1155(address(generatedNFTContract)).safeTransferFrom(listing.seller, msg.sender, listing.tokenId, listing.amount, "");
        }

        // Mark listing as inactive
        listing.active = false;
        userPurchasesCount[msg.sender]++;

        emit Sold(listingId, listing.seller, msg.sender, listing.tokenId, totalPrice, listing.paymentToken, listing.listingType);
    }

    // Place bid
    function placeBid(
        bytes32 listingId,
        uint256 bidAmount,
        uint256 duration
    ) external nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(block.timestamp <= listing.expiresAt, "Listing expired");
        require(listing.seller != msg.sender, "Cannot bid on own listing");
        require(bidAmount > 0, "Bid must be greater than 0");

        // Transfer bid amount to escrow (this contract)
        _transferPayment(listing.paymentToken, msg.sender, address(this), bidAmount);

        bids[listingId].push(Bid({
            bidder: msg.sender,
            amount: bidAmount,
            paymentToken: listing.paymentToken,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + duration,
            active: true
        }));

        emit BidPlaced(listingId, msg.sender, bidAmount, listing.paymentToken);
    }

    // Accept bid
    function acceptBid(bytes32 listingId, uint256 bidIndex) external nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not listing owner");
        require(listing.active, "Listing not active");
        require(bidIndex < bids[listingId].length, "Invalid bid index");

        Bid storage bid = bids[listingId][bidIndex];
        require(bid.active, "Bid not active");
        require(block.timestamp <= bid.expiresAt, "Bid expired");

        uint256 totalPrice = bid.amount;
        uint256 marketplaceFee = (totalPrice * MARKETPLACE_FEE) / FEE_DENOMINATOR;
        uint256 royaltyFee = 0;
        address royaltyRecipient = address(0);

        // Calculate royalties for generated content
        if (listing.listingType == ListingType.GENERATED_CONTENT) {
            if (IERC165(address(generatedNFTContract)).supportsInterface(type(IERC2981).interfaceId)) {
                (royaltyRecipient, royaltyFee) = IERC2981(address(generatedNFTContract)).royaltyInfo(listing.tokenId, totalPrice);
            }
        }

        uint256 sellerAmount = totalPrice - marketplaceFee - royaltyFee;

        // Distribute payments from escrow
        _distributeEscrowPayment(bid.paymentToken, sellerAmount, marketplaceFee, royaltyFee, royaltyRecipient, listing.seller);

        // Transfer NFT
        if (listing.listingType == ListingType.INFT_PACKAGE) {
            IERC721(address(inftPackagesContract)).safeTransferFrom(listing.seller, bid.bidder, listing.tokenId);
        } else {
            IERC1155(address(generatedNFTContract)).safeTransferFrom(listing.seller, bid.bidder, listing.tokenId, listing.amount, "");
        }

        // Mark listing and bid as inactive
        listing.active = false;
        bid.active = false;
        userPurchasesCount[bid.bidder]++;

        // Refund other bids
        _refundOtherBids(listingId, bidIndex);

        emit Sold(listingId, listing.seller, bid.bidder, listing.tokenId, totalPrice, bid.paymentToken, listing.listingType);
    }

    // Cancel listing
    function cancelListing(bytes32 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not listing owner");
        require(listing.active, "Listing not active");

        listing.active = false;

        // Refund all bids
        _refundAllBids(listingId);

        emit ListingCancelled(listingId);
    }

    // Create auction
    function createAuction(
        uint256 tokenId,
        uint256 startingPrice,
        PaymentToken paymentToken,
        ListingType listingType,
        uint256 duration,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(startingPrice > 0, "Starting price must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");

        if (listingType == ListingType.INFT_PACKAGE) {
            require(IERC721(address(inftPackagesContract)).ownerOf(tokenId) == msg.sender, "Not token owner");
            require(IERC721(address(inftPackagesContract)).isApprovedForAll(msg.sender, address(this)) || 
                    IERC721(address(inftPackagesContract)).getApproved(tokenId) == address(this), "Not approved");
            amount = 1;
        } else {
            require(IERC1155(address(generatedNFTContract)).balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
            require(IERC1155(address(generatedNFTContract)).isApprovedForAll(msg.sender, address(this)), "Not approved");
        }

        bytes32 auctionId = keccak256(abi.encodePacked(listingType, tokenId, msg.sender, block.timestamp));
        
        auctions[auctionId] = Auction({
            tokenId: tokenId,
            seller: msg.sender,
            startingPrice: startingPrice,
            currentBid: 0,
            currentBidder: address(0),
            paymentToken: paymentToken,
            listingType: listingType,
            amount: amount,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            active: true,
            ended: false
        });

        emit AuctionCreated(auctionId, msg.sender, tokenId, startingPrice, block.timestamp + duration, listingType);
    }

    // Bid on auction
    function bidOnAuction(bytes32 auctionId, uint256 bidAmount) external payable nonReentrant whenNotPaused {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Auction not active");
        require(block.timestamp <= auction.endTime, "Auction ended");
        require(auction.seller != msg.sender, "Cannot bid on own auction");
        require(bidAmount > auction.currentBid, "Bid too low");
        require(bidAmount >= auction.startingPrice, "Bid below starting price");

        // Refund previous bidder
        if (auction.currentBidder != address(0)) {
            _transferPayment(auction.paymentToken, address(this), auction.currentBidder, auction.currentBid);
        }

        // Transfer new bid to escrow
        _transferPayment(auction.paymentToken, msg.sender, address(this), bidAmount);

        auction.currentBid = bidAmount;
        auction.currentBidder = msg.sender;

        emit BidPlaced(auctionId, msg.sender, bidAmount, auction.paymentToken);
    }

    // End auction
    function endAuction(bytes32 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Auction not active");
        require(block.timestamp > auction.endTime, "Auction still active");
        require(!auction.ended, "Auction already ended");

        auction.active = false;
        auction.ended = true;

        if (auction.currentBidder != address(0)) {
            uint256 totalPrice = auction.currentBid;
            uint256 marketplaceFee = (totalPrice * MARKETPLACE_FEE) / FEE_DENOMINATOR;
            uint256 royaltyFee = 0;
            address royaltyRecipient = address(0);

            // Calculate royalties for generated content
            if (auction.listingType == ListingType.GENERATED_CONTENT) {
                if (IERC165(address(generatedNFTContract)).supportsInterface(type(IERC2981).interfaceId)) {
                    (royaltyRecipient, royaltyFee) = IERC2981(address(generatedNFTContract)).royaltyInfo(auction.tokenId, totalPrice);
                }
            }

            uint256 sellerAmount = totalPrice - marketplaceFee - royaltyFee;

            // Distribute payments from escrow
            _distributeEscrowPayment(auction.paymentToken, sellerAmount, marketplaceFee, royaltyFee, royaltyRecipient, auction.seller);

            // Transfer NFT
            if (auction.listingType == ListingType.INFT_PACKAGE) {
                IERC721(address(inftPackagesContract)).safeTransferFrom(auction.seller, auction.currentBidder, auction.tokenId);
            } else {
                IERC1155(address(generatedNFTContract)).safeTransferFrom(auction.seller, auction.currentBidder, auction.tokenId, auction.amount, "");
            }

            userPurchasesCount[auction.currentBidder]++;

            emit AuctionEnded(auctionId, auction.currentBidder, auction.currentBid);
        } else {
            emit AuctionEnded(auctionId, address(0), 0);
        }
    }

    // Internal payment functions
    function _handlePayment(
        PaymentToken paymentToken,
        address from,
        uint256 totalAmount,
        uint256 sellerAmount,
        uint256 marketplaceFee,
        uint256 royaltyFee,
        address royaltyRecipient,
        address seller
    ) internal {
        if (paymentToken == PaymentToken.ETH) {
            require(msg.value >= totalAmount, "Insufficient ETH");
            
            payable(seller).transfer(sellerAmount);
            payable(feeRecipient).transfer(marketplaceFee);
            if (royaltyFee > 0 && royaltyRecipient != address(0)) {
                payable(royaltyRecipient).transfer(royaltyFee);
            }
            
            // Refund excess
            if (msg.value > totalAmount) {
                payable(from).transfer(msg.value - totalAmount);
            }
        } else {
            IERC20 token = _getTokenContract(paymentToken);
            token.safeTransferFrom(from, seller, sellerAmount);
            token.safeTransferFrom(from, feeRecipient, marketplaceFee);
            if (royaltyFee > 0 && royaltyRecipient != address(0)) {
                token.safeTransferFrom(from, royaltyRecipient, royaltyFee);
            }
        }
    }

    function _transferPayment(PaymentToken paymentToken, address from, address to, uint256 amount) internal {
        if (paymentToken == PaymentToken.ETH) {
            if (from == address(this)) {
                payable(to).transfer(amount);
            } else {
                require(msg.value >= amount, "Insufficient ETH");
            }
        } else {
            IERC20 token = _getTokenContract(paymentToken);
            if (from == address(this)) {
                token.safeTransfer(to, amount);
            } else {
                token.safeTransferFrom(from, to, amount);
            }
        }
    }

    function _distributeEscrowPayment(
        PaymentToken paymentToken,
        uint256 sellerAmount,
        uint256 marketplaceFee,
        uint256 royaltyFee,
        address royaltyRecipient,
        address seller
    ) internal {
        if (paymentToken == PaymentToken.ETH) {
            payable(seller).transfer(sellerAmount);
            payable(feeRecipient).transfer(marketplaceFee);
            if (royaltyFee > 0 && royaltyRecipient != address(0)) {
                payable(royaltyRecipient).transfer(royaltyFee);
            }
        } else {
            IERC20 token = _getTokenContract(paymentToken);
            token.safeTransfer(seller, sellerAmount);
            token.safeTransfer(feeRecipient, marketplaceFee);
            if (royaltyFee > 0 && royaltyRecipient != address(0)) {
                token.safeTransfer(royaltyRecipient, royaltyFee);
            }
        }
    }

    function _refundOtherBids(bytes32 listingId, uint256 acceptedBidIndex) internal {
        Bid[] storage listingBids = bids[listingId];
        for (uint256 i = 0; i < listingBids.length; i++) {
            if (i != acceptedBidIndex && listingBids[i].active) {
                listingBids[i].active = false;
                _transferPayment(listingBids[i].paymentToken, address(this), listingBids[i].bidder, listingBids[i].amount);
            }
        }
    }

    function _refundAllBids(bytes32 listingId) internal {
        Bid[] storage listingBids = bids[listingId];
        for (uint256 i = 0; i < listingBids.length; i++) {
            if (listingBids[i].active) {
                listingBids[i].active = false;
                _transferPayment(listingBids[i].paymentToken, address(this), listingBids[i].bidder, listingBids[i].amount);
            }
        }
    }

    function _getTokenContract(PaymentToken paymentToken) internal pure returns (IERC20) {
        if (paymentToken == PaymentToken.USDC) {
            return USDC;
        } else if (paymentToken == PaymentToken.WS) {
            return WS_TOKEN;
        } else if (paymentToken == PaymentToken.SSSTT) {
            return SSSTT;
        }
        revert("Invalid payment token");
    }

    // View functions
    function getBids(bytes32 listingId) external view returns (Bid[] memory) {
        return bids[listingId];
    }

    function getActiveBids(bytes32 listingId) external view returns (Bid[] memory) {
        Bid[] memory allBids = bids[listingId];
        uint256 activeCount = 0;
        
        // Count active bids
        for (uint256 i = 0; i < allBids.length; i++) {
            if (allBids[i].active && block.timestamp <= allBids[i].expiresAt) {
                activeCount++;
            }
        }
        
        // Create array of active bids
        Bid[] memory activeBids = new Bid[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allBids.length; i++) {
            if (allBids[i].active && block.timestamp <= allBids[i].expiresAt) {
                activeBids[index] = allBids[i];
                index++;
            }
        }
        
        return activeBids;
    }

    // Admin functions
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    function setContracts(address _inftPackagesContract, address _generatedNFTContract) external onlyOwner {
        inftPackagesContract = ISrvcfloINFTPackages(_inftPackagesContract);
        generatedNFTContract = ISrvcfloGeneratedNFT(_generatedNFTContract);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    receive() external payable {}
}