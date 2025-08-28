# Sonic Mainnet Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying ServiceFlow AI contracts to Sonic Mainnet (Chain ID: 146).

## Prerequisites

### 1. Environment Setup
Ensure your `.env` file contains the following required variables:

```bash
# Deployment Configuration
PRIVATE_KEY=0x...  # Your wallet private key for deployment
SONIC_PRIVATE_KEY=0x...  # Alternative key variable

# Thirdweb Configuration (for frontend integration)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
THIRDWEB_SECRET_KEY=your_secret_key

# Optional: Sonic API Keys for contract verification
SONIC_API_KEY=your_sonic_api_key
```

### 2. Wallet Requirements
- **Minimum Balance**: 10 S tokens recommended
- **Estimated Deployment Cost**: ~1.5 S tokens total
  - NFT Contract: ~0.1 S
  - Staking Contract: ~0.3 S  
  - Payment Contract: ~0.4 S
  - Voting Contract: ~0.5 S
  - FeeM Registration: ~0.01 S
  - Gas buffer: ~0.2 S

### 3. Network Configuration
Verify hardhat.config.js is properly configured for Sonic Mainnet:
- RPC URL: `https://rpc.soniclabs.com`
- Chain ID: `146`
- Explorer: `https://sonicscan.org`

## Contract Configuration

### Token Addresses (Sonic Mainnet)
- **S Token (wS)**: `0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38`
- **USDC**: `0x29219dd400f2Bf60E5a23d13Be72B486D4038894`

### Payment Configuration
- **Image Generation**: 1 USDC or 1 S token
- **Video Generation**: 2 USDC or 2 S tokens (to be implemented)

### Revenue Distribution
- **NFT Staking**: 25%
- **Development Wallet**: 50%
- **Leaderboard Winners**: 15%
- **Contract Reserve**: 10%

## Deployment Process

### Step 1: Pre-Deployment Checks
Run the pre-deployment checker to verify all configurations:

```bash
npx hardhat run scripts/pre-deployment-check.js --network sonic
```

This script checks:
- ✅ Network connectivity and configuration
- ✅ Wallet balance and access
- ✅ Contract compilation
- ✅ Environment variables
- ✅ Token address configuration

### Step 2: Deploy Contracts
Execute the main deployment script:

```bash
npx hardhat run scripts/deploy-mainnet-final.js --network sonic
```

The deployment process will:
1. Deploy BanditKidz NFT Contract
2. Deploy BanditKidz Staking Contract
3. Deploy Sonic Payment Contract
4. Deploy Generation Voting Contract
5. Register for FeeM rewards
6. Verify all configurations
7. Save deployment information

### Step 3: Verify Contracts
Verify contracts on Sonic Explorer for transparency:

```bash
npx hardhat run scripts/verify-mainnet-contracts.js --network sonic
```

Or verify manually:
```bash
npx hardhat verify --network sonic <CONTRACT_ADDRESS> [CONSTRUCTOR_ARGS]
```

### Step 4: Update Environment Variables
After successful deployment, update your `.env` file with the new contract addresses:

```bash
# Mainnet Contract Addresses
NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_MAINNET=0x...
NEXT_PUBLIC_BANDIT_KIDZ_STAKING_CONTRACT_MAINNET=0x...
NEXT_PUBLIC_VOTING_CONTRACT_MAINNET=0x...
NEXT_PUBLIC_BANDIT_KIDZ_NFT_MAINNET=0x...
```

## Contract Addresses

After deployment, your contracts will be deployed at unique addresses. Example structure:

```
📋 Deployed Contracts:
├── BanditKidz NFT: 0x...
├── Staking Contract: 0x...
├── Payment Contract: 0x...
└── Voting Contract: 0x...
```

## Frontend Integration

### Update Network Configuration
Ensure your frontend network configuration includes Sonic Mainnet:

```typescript
// lib/network-config.ts
export const SONIC_MAINNET = {
  id: 146,
  name: 'Sonic',
  network: 'sonic',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    public: { http: ['https://rpc.soniclabs.com'] },
    default: { http: ['https://rpc.soniclabs.com'] },
  },
  blockExplorers: {
    default: { name: 'SonicScan', url: 'https://sonicscan.org' },
  },
}
```

### Update Contract Hooks
Modify your React hooks to use mainnet addresses:

```typescript
// hooks/useSonicPayments.ts
const contractAddress = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_MAINNET
  : process.env.NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_TESTNET;
```

## Post-Deployment Tasks

### 1. Test Contract Functionality
- [ ] Test payment processing with S tokens
- [ ] Test payment processing with USDC
- [ ] Test NFT staking/unstaking
- [ ] Test voting mechanism
- [ ] Test reward distribution

### 2. Set Up Monitoring
- [ ] Monitor contract transactions
- [ ] Set up alerts for large transactions
- [ ] Monitor FeeM rewards accumulation

### 3. Update Documentation
- [ ] Update API documentation with new addresses
- [ ] Update user guides with mainnet information
- [ ] Update support documentation

## Security Considerations

### Contract Security
- ✅ All contracts use OpenZeppelin standards
- ✅ Contracts include proper access controls
- ✅ Emergency withdrawal functions for admin
- ✅ Reentrancy protection implemented

### Operational Security
- 🔐 Private keys stored securely
- 🔐 Multi-signature recommended for high-value operations
- 🔐 Regular security audits recommended

## Troubleshooting

### Common Issues

**"Insufficient Balance" Error**
- Ensure wallet has enough S tokens for gas
- Check current gas prices on Sonic network

**"Network Timeout" Error**
- Increase timeout in hardhat.config.js
- Try deployment during off-peak hours

**"Contract Verification Failed"**
- Check constructor arguments match exactly
- Ensure contract source code is identical
- Try manual verification on SonicScan

**"Transaction Reverted" Error**
- Check contract constructor requirements
- Verify all addresses are valid
- Ensure proper permissions

### Support Resources
- **Sonic Documentation**: https://docs.soniclabs.com
- **Sonic Explorer**: https://sonicscan.org
- **Community Support**: Sonic Discord/Telegram

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Wallet funded with sufficient S tokens
- [ ] Contracts compiled successfully
- [ ] Network configuration verified
- [ ] Pre-deployment checks passed

### Deployment
- [ ] NFT contract deployed
- [ ] Staking contract deployed  
- [ ] Payment contract deployed
- [ ] Voting contract deployed
- [ ] FeeM registration completed
- [ ] All contracts verified on explorer

### Post-Deployment
- [ ] Environment variables updated
- [ ] Frontend configuration updated
- [ ] Contract functionality tested
- [ ] Monitoring systems configured
- [ ] Documentation updated

## Files Structure

```
scripts/
├── deploy-mainnet-final.js      # Main deployment script
├── verify-mainnet-contracts.js  # Contract verification
├── pre-deployment-check.js      # Pre-deployment validation
└── deploy-mainnet-contracts.js  # Legacy deployment (reference)

deployments/
└── sonic-mainnet.json          # Deployment information

Contracts/
├── SonicPayment.sol            # Payment processing contract
├── BanditKidzStaking.sol       # NFT staking contract
├── VotingContract.sol          # Voting and leaderboard contract
└── TestNFT.sol                 # BanditKidz NFT contract
```

## Support

If you encounter issues during deployment:

1. Check the troubleshooting section above
2. Review deployment logs for specific errors
3. Verify all prerequisites are met
4. Contact the development team with detailed error information

---

**⚠️ Important**: Always test on testnet before mainnet deployment. Mainnet deployments are irreversible and involve real value.

**✅ Ready to Deploy**: Once all checks pass, you're ready for production deployment on Sonic Mainnet!