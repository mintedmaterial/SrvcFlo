# Debug Contract State

## Problem: Contract Reverting on purchaseCreditsWithSonic

The contract `0x09575A8046048816317C41f9Cf37267E8486bb9b` is reverting when calling `purchaseCreditsWithSonic(1)` with 5 S tokens.

## Possible Causes:

1. **Package not configured**: Contract may not have package ID 1 set up
2. **Contract paused**: Contract might be paused
3. **Insufficient msg.value**: 5 S might not match the required price
4. **Package inactive**: Package might exist but be marked inactive
5. **Contract not initialized**: Missing initial setup

## Debug Commands

### Check if contract is paused:
```bash
cast call 0x09575A8046048816317C41f9Cf37267E8486bb9b "paused()(bool)" --rpc-url https://rpc.soniclabs.com
```

### Check package 1 configuration:
```bash
cast call 0x09575A8046048816317C41f9Cf37267E8486bb9b "packages(uint256)(uint256,uint256,uint256,uint256,bool)" 1 --rpc-url https://rpc.soniclabs.com
```

### Check owner:
```bash
cast call 0x09575A8046048816317C41f9Cf37267E8486bb9b "owner()(address)" --rpc-url https://rpc.soniclabs.com
```

### Check total packages:
```bash
cast call 0x09575A8046048816317C41f9Cf37267E8486bb9b "totalPackages()(uint256)" --rpc-url https://rpc.soniclabs.com
```

## Expected Package Configuration

Based on SONIC_PAYMENT_WIDGET_USAGE.md:

| Package ID | USDC Price | USDC Credits | S Price | S Credits |
|------------|------------|--------------|---------|-----------|
| 1 (Starter)| 5 USDC     | 750         | 5 S     | 1,000     |
| 2 (Pro)    | 50 USDC    | 8,000       | 50 S    | 10,000    |
| 3 (Business)| 500 USDC  | 100,000     | 500 S   | 115,000   |
| 4 (Enterprise)| 1,250 USDC| 260,000    | 1,250 S | 290,000   |

## Next Steps

1. Check contract state with cast commands above
2. If packages aren't configured, need to call `setPackage()` function as owner
3. If contract is paused, need to call `unpause()` as owner
4. Verify the exact msg.value expected matches package configuration

## Contract Addresses to Verify

- **Payment Contract**: `0x09575A8046048816317C41f9Cf37267E8486bb9b`
- **Credits ERC1155**: `0x6B57563377181967C468002Cb11566c561f8DAc6`
- **Staking Contract**: `0x103ce561d5137f137c9A86670812287B1B258499`
- **Owner/Deployer**: `0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8`