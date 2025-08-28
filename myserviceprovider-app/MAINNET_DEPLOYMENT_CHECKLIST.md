# 🚀 Mainnet Deployment Checklist

## Pre-Deployment Requirements

### ✅ **Contract Addresses Confirmed**
- [x] BanditKidz NFT (Mainnet): `0x45bC8A938E487FdE4F31A7E051c2b63627F6f966`
- [ ] Deploy SrvcfloStaking.sol to Sonic Mainnet
- [ ] Deploy SonicPayment.sol (mainnet version) to Sonic Mainnet
- [ ] Get CORAL token address (if available)
- [ ] Get Price Oracle address (if using)

### 📋 **Smart Contract Checklist**
- [x] SrvcfloStaking.sol - Security reviewed with OpenZeppelin features
- [x] Time-lock staking with 30/60/90/120/365 day options
- [x] Bonus multipliers: 15%, 35%, 60%, 90%, 150%
- [x] Early unstake penalty: 10% of pending rewards
- [x] Role-based access control (ADMIN, DISTRIBUTOR, EMERGENCY)
- [x] ReentrancyGuard on all state-changing functions
- [x] Pausable functionality for emergencies

### 🔧 **Frontend Updates Complete**
- [x] Updated contract addresses for mainnet BanditKidz
- [x] Updated ABIs to match SrvcfloStaking contract
- [x] Added time-lock selection UI
- [x] Added bonus multiplier display
- [x] Updated rewards claiming functionality
- [x] Added early unstake penalty warnings

## Deployment Steps

### 1. **Deploy SrvcfloStaking Contract**
```bash
# Update deployment script with correct addresses
cd C:\Users\PC\ServiceApp\myserviceprovider-app\Contracts

# Set BanditKidz NFT address
BANDIT_KIDZ_NFT="0x45bC8A938E487FdE4F31A7E051c2b63627F6f966"
PENALTY_WALLET="0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8"

# Deploy to Sonic Mainnet
npx hardhat run deployment_scripts.js --network sonic-mainnet
```

### 2. **Deploy SonicPayment Contract**
```bash
# Deploy payment contract with staking address
npx hardhat run deployment_scripts.js --network sonic-mainnet
```

### 3. **Update Frontend Configuration**
- [ ] Update network config with deployed contract addresses
- [ ] Update environment variables:
  - `NEXT_PUBLIC_SRVCFLO_STAKING_CONTRACT=<address>`
  - `NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT=<address>`

### 4. **Contract Verification**
- [ ] Verify SrvcfloStaking on Sonicscan
- [ ] Verify SonicPayment on Sonicscan
- [ ] Test contract functions on Sonicscan

### 5. **Integration Testing**
- [ ] Test staking with different lock periods
- [ ] Test unstaking (locked vs unlocked)
- [ ] Test rewards claiming
- [ ] Test early unstake penalties
- [ ] Test admin functions (pause/unpause)

## Post-Deployment Tasks

### 🎯 **Initial Setup**
- [ ] Grant DISTRIBUTOR_ROLE to payment contract
- [ ] Set up initial reward distributions
- [ ] Test payment flow: AI generation → distribution to staking
- [ ] Update leaderboard calculation to include staked amounts

### 🔒 **Security Measures**
- [ ] Revoke unnecessary admin roles
- [ ] Set up monitoring for contract events
- [ ] Establish emergency response procedures
- [ ] Document all contract addresses and roles

### 📱 **Frontend Launch**
- [ ] Update staking page to production mode
- [ ] Test all UI flows end-to-end
- [ ] Deploy gamified crypto bank UI theme
- [ ] Update documentation and help sections

## Testing Scenarios

### ⚡ **Core Functionality**
- [ ] Stake NFT with no lock (100% rewards)
- [ ] Stake NFT with 30-day lock (115% rewards)
- [ ] Stake NFT with 365-day lock (250% rewards)
- [ ] Try to unstake locked NFT (should show penalty warning)
- [ ] Unstake after lock period expires
- [ ] Claim rewards from multiple distributions

### 🚨 **Edge Cases**
- [ ] Emergency unstake by admin
- [ ] Contract pause/unpause functionality
- [ ] Early unstake with penalty calculation
- [ ] Batch staking/unstaking
- [ ] Multiple NFTs with different lock periods

## Final Checks

### 📊 **Analytics & Monitoring**
- [ ] Set up contract event monitoring
- [ ] Track staking participation rates
- [ ] Monitor reward distribution efficiency
- [ ] Set up alerts for unusual activity

### 🎮 **User Experience**
- [ ] Gamified bank UI is working
- [ ] Crypto teller interface for staking
- [ ] Bank teller interface for claiming rewards
- [ ] Clear lock period explanations
- [ ] Penalty warnings are prominent

## Contract Addresses (To be filled during deployment)

```javascript
// Add these to your network config after deployment
const SONIC_MAINNET_CONTRACTS = {
  BANDIT_KIDZ_NFT: "0x45bC8A938E487FdE4F31A7E051c2b63627F6f966",
  SRVCFLO_STAKING: "", // Deploy first
  SONIC_PAYMENT: "",   // Deploy second
  CORAL_TOKEN: "",     // If available
  PRICE_ORACLE: ""     // If using
}
```

## Risk Mitigation

### 🛡️ **Security Considerations**
- Contract has emergency pause functionality
- Role-based access prevents unauthorized actions
- ReentrancyGuard protects against common attacks
- Early unstake penalties discourage gaming
- Multi-signature wallet recommended for admin roles

### 💰 **Financial Safeguards**
- Penalty wallet is separate from main treasury
- Rewards are distributed from contract balance only
- No infinite minting or arbitrary token creation
- All transfers use SafeERC20 standards

---

**Deployment Team:** Check each item before proceeding to the next step.
**Timeline:** Allow 2-3 days for full deployment and testing.
**Rollback Plan:** Pause contracts if issues discovered, fix on testnet first.