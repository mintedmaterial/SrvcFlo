# Quick Deployment Commands

## Prerequisites
1. Ensure `.env` file has `PRIVATE_KEY` set
2. Wallet should have at least 10 S tokens
3. Contracts should be compiled: `npm run contracts:compile`

## Quick Deployment (Recommended)
```bash
# One command to deploy and verify everything
npm run contracts:deploy-all
```

## Step-by-Step Deployment

### 1. Pre-deployment Check
```bash
npm run contracts:check
```

### 2. Deploy Contracts
```bash
npm run contracts:deploy
```

### 3. Verify Contracts
```bash
npm run contracts:verify
```

## Manual Commands

### Compile Contracts
```bash
npx hardhat compile
```

### Deploy to Mainnet
```bash
npx hardhat run scripts/deploy-mainnet-final.js --network sonic
```

### Deploy to Testnet
```bash
npm run contracts:testnet
```

### Verify Individual Contract
```bash
npx hardhat verify --network sonic <CONTRACT_ADDRESS> [CONSTRUCTOR_ARGS]
```

## Environment Variables to Update After Deployment

After successful deployment, update your `.env` file:

```bash
# Copy these from deployment output
NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT_MAINNET=0x...
NEXT_PUBLIC_BANDIT_KIDZ_STAKING_CONTRACT_MAINNET=0x...
NEXT_PUBLIC_VOTING_CONTRACT_MAINNET=0x...
NEXT_PUBLIC_BANDIT_KIDZ_NFT_MAINNET=0x...
```

## Troubleshooting

### Common Issues
- **Low Balance**: Ensure wallet has 10+ S tokens
- **Network Error**: Check internet connection and RPC endpoint
- **Verification Failed**: Wait 1-2 minutes after deployment before verifying

### Get Help
- Check deployment logs in console
- Review `MAINNET_DEPLOYMENT_GUIDE.md` for detailed instructions
- Check `deployments/sonic-mainnet.json` for contract addresses

## Quick Status Check
```bash
# Check if contracts are deployed and verified
npx hardhat run scripts/verify-mainnet-contracts.js --network sonic
```