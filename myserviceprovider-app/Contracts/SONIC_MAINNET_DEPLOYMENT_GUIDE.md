# ServiceFlow AI - Sonic Mainnet Deployment Guide

## Overview
This guide covers the deployment of ServiceFlow AI contracts to Sonic Mainnet (Chain ID 146) with the proper configuration for production use.

## Pre-Deployment Checklist

### 1. Required Information
- [ ] Deployer wallet with sufficient S tokens for gas
- [ ] Bandit Kidz NFT contract address: `0x45bc8a938e487fde4f31a7e051c2b63627f6f966` (verified)
- [ ] Dev wallet address for receiving fees
- [ ] USDC contract address on Sonic Mainnet (when available)
- [ ] wS token contract address on Sonic Mainnet

### 2. Contract Verification
- [ ] All contracts compiled successfully
- [ ] Security audit completed (if applicable)
- [ ] Gas estimation completed
- [ ] Constructor parameters prepared

## Deployment Order

Deploy contracts in the following order to ensure proper dependencies:

### Phase 1: Core Infrastructure

#### 1. Price Oracle (Optional)
```bash
# If using price oracle functionality
Contract: SonicPriceOracle.sol
Constructor params: None
```

#### 2. Credits NFT Contract (ERC-1155)
```bash
Contract: SrvcfloCreditsNFTWithRoyalties.sol
Constructor params:
- initialOwner: [DEPLOYER_ADDRESS]
- _appWallet: [DEV_WALLET_ADDRESS] # For royalty distribution
```

#### 3. Credit System Contract
```bash
Contract: SonicCreditSystemWithOracle.sol
Constructor params:
- _usdcToken: [USDC_MAINNET_ADDRESS] # To be determined
- _wsToken: [WS_TOKEN_MAINNET_ADDRESS] # To be determined
- _oracle: [ORACLE_ADDRESS] # Or 0x0000... if not using oracle
- _creditsNFTContract: [CREDITS_NFT_ADDRESS] # From step 2
```

### Phase 2: Payment and Staking

#### 4. Main Payment Contract
```bash
Contract: SonicPayment.sol (Mainnet version)
Constructor params:
- _banditKidzStaking: [PLACEHOLDER] # Will be updated after staking deployment
- _devWallet: [DEV_WALLET_ADDRESS]
- _priceOracle: [ORACLE_ADDRESS] # Or 0x0000... if not using oracle
```

#### 5. Multi-Collection Staking Contract
```bash
Contract: SrvcfloMultiCollectionStaking.sol (or existing SrvcfloStaking.sol)
Constructor params:
- _banditKidzNFT: 0x45bc8a938e487fde4f31a7e051c2b63627f6f966
- _penaltyWallet: [DEV_WALLET_ADDRESS]
```

#### 6. Update Payment Contract
```bash
# Call setAddresses on payment contract to update staking address
paymentContract.setAddresses(
    [STAKING_CONTRACT_ADDRESS],
    [DEV_WALLET_ADDRESS]
)
```

### Phase 3: Governance and Utilities

#### 7. Voting Contract
```bash
Contract: VotingContract.sol
Constructor params:
- _stakingContract: [STAKING_CONTRACT_ADDRESS]
- _admin: [DEPLOYER_ADDRESS]
```

## Mainnet Configuration Updates

### 1. Update Network Configuration
Update `lib/network-config.ts`:

```typescript
// Replace mainnet section in ADDRESS_BOOK
mainnet: {
  USDC: "0x[USDC_MAINNET_ADDRESS]" as Address,
  WS_TOKEN: "0x[WS_TOKEN_MAINNET_ADDRESS]" as Address,
  BEEFY_ORACLE: "0x[ORACLE_ADDRESS]" as Address, // Optional
  PAYMENT: "0x[PAYMENT_CONTRACT_ADDRESS]" as Address,
  CREDITS_ERC1155: "0x[CREDITS_NFT_ADDRESS]" as Address,
  CREDIT_TOKEN_ID: 1n,
  explorerBase: "https://sonicscan.org",
}
```

### 2. Environment Variables
Add to production environment:
```bash
# Contract Addresses
NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT=0x[PAYMENT_CONTRACT_ADDRESS]
NEXT_PUBLIC_SONIC_CREDIT_CONTRACT=0x[CREDIT_SYSTEM_ADDRESS]
NEXT_PUBLIC_SONIC_STAKING_CONTRACT=0x[STAKING_CONTRACT_ADDRESS]
NEXT_PUBLIC_SONIC_VOTING_CONTRACT=0x[VOTING_CONTRACT_ADDRESS]

# Mainnet Chain Configuration  
NEXT_PUBLIC_SONIC_MAINNET_CHAIN_ID=146
NEXT_PUBLIC_SONIC_RPC_URL=https://rpc.soniclabs.com
NEXT_PUBLIC_SONIC_EXPLORER_URL=https://sonicscan.org

# Backend Configuration
SONIC_MAINNET_RPC=https://rpc.soniclabs.com
SONIC_MAINNET_PRIVATE_KEY=[BACKEND_PRIVATE_KEY]
```

## Contract Configuration

### 1. Credit Packages Configuration
Default credit packages for mainnet:
- Starter: $5 USDC = 750 credits, 5 wS = 1000 credits
- Pro: $50 USDC = 8000 credits, 50 wS = 10000 credits  
- Business: $500 USDC = 100k credits, 500 wS = 115k credits
- Enterprise: $1250 USDC = 260k credits, 1250 wS = 290k credits

### 2. Staking Configuration
Lock periods and bonuses:
- No lock: 100% base rewards
- 30 days: 115% rewards (+15% bonus)
- 60 days: 135% rewards (+35% bonus) 
- 90 days: 160% rewards (+60% bonus)
- 120 days: 190% rewards (+90% bonus)
- 365 days: 250% rewards (+150% bonus)

### 3. Payment Distribution
Revenue split for all payments:
- 50% to dev wallet (operational costs, AI services)
- 25% to Bandit Kidz staking contract
- 15% to leaderboard winners
- 10% remains in contract (treasury)

### 4. Royalty Configuration (NFT Credits)
- Total royalties: 2%
- Creator share: 1.5%
- ServiceFlow share: 0.5%

## Post-Deployment Tasks

### 1. Contract Verification
- [ ] Verify all contracts on SonicScan
- [ ] Update documentation with verified addresses
- [ ] Test all contract interactions

### 2. Initialize Contracts
```bash
# Set up credit packages in credit system
creditSystem.setCreditPackages([...])

# Register for FeeM if applicable  
paymentContract.registerMe()

# Grant necessary roles
stakingContract.grantRole(DISTRIBUTOR_ROLE, [BACKEND_ADDRESS])
votingContract.grantRole(MODERATOR_ROLE, [BACKEND_ADDRESS])
```

### 3. Frontend Updates
- [ ] Update credit widget to use mainnet contracts
- [ ] Update AI generation component contract addresses
- [ ] Update staking page contract configuration
- [ ] Test all payment flows on mainnet

### 4. Backend Integration
- [ ] Update API routes to use mainnet contract addresses
- [ ] Configure RPC endpoints for mainnet
- [ ] Update contract ABI imports
- [ ] Test generation fulfillment on mainnet

## Testing Checklist

### Core Functionality
- [ ] USDC credit purchases work
- [ ] wS token credit purchases work  
- [ ] Credit-based image generation works
- [ ] Direct payment image generation works
- [ ] NFT staking and unstaking works
- [ ] Reward distribution works
- [ ] Voting system functions properly

### Edge Cases
- [ ] Insufficient balance handling
- [ ] Contract pausing works
- [ ] Emergency functions work
- [ ] Rate limiting functions properly
- [ ] Lock period enforcement works

### Integration Tests
- [ ] Frontend to contract interaction
- [ ] Backend generation fulfillment
- [ ] Cross-contract communications
- [ ] Revenue distribution flows

## Monitoring and Maintenance

### 1. Key Metrics to Monitor
- Total S/USDC collected
- Number of active stakers
- Credit usage patterns
- Generation request volume
- Contract gas usage

### 2. Regular Maintenance Tasks
- Monitor contract balances
- Process staking reward distributions
- Update leaderboard winners
- Review and update credit pricing

### 3. Emergency Procedures
- Contract pause procedures
- Emergency withdrawal processes
- Communication plan for issues
- Rollback procedures if needed

## Security Considerations

### 1. Access Control
- Multi-sig wallet for admin functions
- Role-based access for critical operations
- Regular access review and rotation

### 2. Fund Management
- Regular withdrawal of excess funds
- Separate hot/cold wallet strategy
- Insurance considerations for large holdings

### 3. Smart Contract Security
- Regular security audits
- Automated monitoring for suspicious activity
- Incident response procedures

## Contract Addresses (To Be Filled)

Once deployed, update this section with actual addresses:

```bash
# Sonic Mainnet Contract Addresses
CREDITS_NFT_CONTRACT=0x[TBD]
CREDIT_SYSTEM_CONTRACT=0x[TBD]  
PAYMENT_CONTRACT=0x[TBD]
STAKING_CONTRACT=0x[TBD]
VOTING_CONTRACT=0x[TBD]
PRICE_ORACLE=0x[TBD] # Optional

# External Contract Addresses
BANDIT_KIDZ_NFT=0x45bc8a938e487fde4f31a7e051c2b63627f6f966
USDC_TOKEN=0x[TBD] # When Sonic mainnet USDC is available
WS_TOKEN=0x[TBD] # When Sonic mainnet wS is available
```

## Notes

1. **USDC on Sonic**: Currently, native USDC may not be available on Sonic mainnet. Monitor Sonic Labs announcements for official USDC deployment.

2. **wS Token**: Ensure you have the correct wS (wrapped Sonic) token address for mainnet before deployment.

3. **Gas Optimization**: All contracts are optimized for Sonic's low gas fees, but monitor gas usage patterns in production.

4. **Upgrade Paths**: Consider implementing upgradeable proxy patterns for future contract updates if needed.

5. **Compliance**: Ensure all revenue sharing and staking mechanisms comply with applicable regulations in your jurisdiction.

## Support

For deployment support or questions, contact the ServiceFlow AI development team or refer to:
- Sonic Labs documentation
- Contract source code comments  
- Previous testnet deployment logs