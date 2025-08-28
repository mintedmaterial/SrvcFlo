# SonicCreditSystem with Dynamic Pricing - Deployment Guide

## Overview

The modified SonicCreditSystem.sol now integrates with SonicPriceOracle.sol to provide dynamic pricing for wS tokens while keeping USDC pricing fixed. This allows users to pay the equivalent USD value in wS tokens but receive bonus credits for using wS instead of USDC.

## Key Changes Made

### 1. Oracle Integration
- Added `ISonicPriceOracle` interface
- Added `priceOracle` contract instance
- Modified constructor to accept oracle address

### 2. Dynamic Pricing Structure
- Changed `wsPrice` to `usdValueForWS` in CreditPackage struct
- wS token amounts are now calculated dynamically based on current price from oracle
- USDC prices remain fixed for stability

### 3. Updated Functions
- `purchaseCreditsWithWS()`: Now calculates wS amount dynamically
- `mintNFTWithWS()`: Uses dynamic pricing for NFT minting costs
- Added helper functions for price queries

## Deployment Steps

### Step 1: Deploy SonicPriceOracle
```solidity
// Deploy the price oracle first
SonicPriceOracle oracle = new SonicPriceOracle();

// Add wS token as supported
oracle.addSupportedToken(0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38);

// Set initial price (example: $0.27 = 270000 with 6 decimals)
oracle.updatePrice(0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38, 270000);
```

### Step 2: Deploy SonicCreditSystem
```solidity
SonicCreditSystem creditSystem = new SonicCreditSystem(
    stakingContract,  // BanditKidz staking contract
    devWallet,       // Developer wallet
    nftContract,     // NFT minting contract
    oracleAddress    // Price oracle address
);
```

### Step 3: Configure Oracle with Beefy Price Feed
```solidity
// Add Beefy oracle as price updater
oracle.addPriceUpdater(0xBC4a342B0c057501E081484A2d24e576E854F823);
```

## Price Calculation Examples

### Current wS Price: $0.276941886177525337
For a $5 USD package:
- wS tokens needed: 5 / 0.276941886177525337 ≈ 18.05 wS tokens

### Package Examples with Dynamic Pricing:

**Starter Package:**
- USDC: $5.00 → 750 credits
- wS: $5.00 worth (≈18.05 wS at current price) → 1000 credits (25% bonus)

**Pro Package:**
- USDC: $50.00 → 8,000 credits  
- wS: $50.00 worth (≈180.5 wS at current price) → 10,000 credits (25% bonus)

## Benefits of Dynamic Pricing

1. **Market-Responsive**: wS pricing adjusts to market conditions
2. **Fixed USD Value**: Users always pay equivalent USD amounts
3. **Bonus Incentive**: More credits for using wS tokens
4. **Oracle Security**: Price staleness checks prevent outdated pricing

## Testing the Integration

### 1. Check Oracle Status
```solidity
bool supported = creditSystem.priceOracle().isTokenSupported(WS_TOKEN);
uint256 currentPrice = creditSystem.getCurrentWSTokenPrice();
```

### 2. Preview Package Costs
```solidity
(uint256 usdcPrice, uint256 wsPrice, uint256 usdcCredits, uint256 wsCredits, bool active) = 
    creditSystem.getCreditPackage(1);
```

### 3. Check NFT Minting Cost
```solidity
uint256 wsAmountForNFT = creditSystem.getWSTokenAmountForNFT();
```

## Error Handling

The contract includes robust error handling:
- Oracle availability checks
- Price staleness validation  
- Graceful fallback when oracle is unavailable
- Try-catch blocks for external oracle calls

## Security Considerations

1. **Price Oracle Security**: Only authorized updaters can modify prices
2. **Staleness Protection**: Prevents using outdated prices (5-minute threshold)
3. **Zero Price Protection**: Rejects invalid or zero prices
4. **Emergency Functions**: Owner can update oracle address if needed

## Monitoring

Key events to monitor:
- `CreditsPurchased`: Track wS vs USDC usage
- `PriceUpdated`: Monitor oracle price updates
- `NFTMinted`: Track NFT minting with dynamic pricing

This integration provides a flexible, secure, and user-friendly payment system that adapts to market conditions while maintaining the bonus incentive structure for wS token usage.