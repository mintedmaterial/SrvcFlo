# ServiceFlow AI Web3 Implementation Guide

## Overview
This document contains the complete implementation for updating ServiceFlow AI to use Web3Auth authentication, Sonic blockchain payments, and free HuggingFace models instead of Kie.ai.

## Key Changes Made

### 1. Removed Dependencies
- ❌ Stripe payments and Creem payments
- ❌ Kie.ai models 
- ❌ Traditional email/password authentication

### 2. Added Dependencies
- ✅ Web3Auth for wallet authentication
- ✅ Sonic blockchain for payments (S, wS, USDC)
- ✅ HuggingFace free models for AI generation
- ✅ Wagmi for Web3 interactions
- ✅ Viem for Ethereum utilities

## Updated Package.json
The package.json has been updated with new dependencies:
- `@web3auth/modal": "^10.0.4"`
- `@tanstack/react-query": "^5.37.1"`
- `ethers": "^6.8.0"`
- `viem": "^1.19.0"`
- `wagmi": "^2.14.16"`

Removed Stripe dependencies to focus on crypto payments only.

## Core Components Created

### 1. Web3Auth Provider (`components/web3auth-provider.tsx`)
- Configures Web3Auth with Sonic network
- Wraps app with authentication context
- Handles SSR with cookie state management

### 2. Updated Layout (`app/layout.tsx`)
- Integrates Web3Auth provider
- Handles cookie-based state for SSR
- Maintains existing Facebook SDK integration

### 3. Sonic Payment Smart Contract (`contracts/SonicPayment.sol`)
**Features:**
- Accepts S, wS, and USDC payments on Sonic network
- Automatic payment distribution:
  - 25% to BanditKidz staking contract
  - 15% to leaderboard winners  
  - 50% to dev wallet
  - 10% remains in contract
- FeeM registration for additional rewards
- Credit system for free generations
- Generation tracking and events

**Contract Addresses (Sonic Mainnet):**
- wS Token: `0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38`
- USDC: `0x29219dd400f2Bf60E5a23d13Be72B486D4038894`
- FeeM Registration: `0xDC2B0D2Dd2b7759D97D50db4eabDC36973110830`

### 4. Updated AI Generation Component (`components/ai-generation.tsx`)
**Features:**
- Web3Auth wallet connection
- Multiple payment options:
  - Free generation (HuggingFace models)
  - Credit usage (1 credit per generation)
  - S token payment (3 S tokens)
  - USDC payment (1 USDC)
- Real-time transaction tracking
- Sonic network integration
- Balance display for S and USDC tokens

### 5. HuggingFace MCP Tools (`src/huggingface-tools.ts`)
**Free Models Integrated:**
- **Images:**
  - `black-forest-labs/FLUX.1-schnell` (recommended)
  - `stabilityai/stable-diffusion-xl-base-1.0`
  - `runwayml/stable-diffusion-v1-5`
  - `dreamlike-art/dreamlike-diffusion-1.0`
  - `prompthero/openjourney-v4`

- **Videos:**
  - `damo-vilab/text-to-video-ms-1.7b`
  - `ali-vilab/modelscope-damo-text-to-video-synthesis`

**Features:**
- Automatic fallback to Cloudflare AI if HuggingFace fails
- Rate limit handling
- Model status checking
- Base64 image/video return format

## Environment Variables Required

```bash
# Web3Auth Configuration
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
WEB3AUTH_CLIENT_SECRET=your_web3auth_client_secret

# HuggingFace API (optional for rate limits)
HUGGINGFACE_API_KEY=your_huggingface_api_key

# Existing variables
ADMIN_API_KEY=your_admin_key
OPENAI_API_KEY=your_openai_key
SRVCFLO_AGENT_TOKEN=your_agent_token
AGNO_AGENT_BASE_URL=http://localhost:8000

# Facebook (existing)
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
NEXT_PUBLIC_FACEBOOK_API_VERSION=v19.0
```

## Smart Contract Deployment

1. **Deploy the Sonic Payment Contract:**
```bash
# Deploy to Sonic mainnet
npx hardhat deploy --network sonic

# Verify contract
npx hardhat verify --network sonic CONTRACT_ADDRESS \
  BANDIT_KIDZ_STAKING_ADDRESS \
  DEV_WALLET_ADDRESS
```

2. **Register for FeeM:**
```bash
# Call registerMe() function after deployment
npx hardhat run scripts/register-feem.js --network sonic
```

## Payment Flow

1. **User connects wallet** → Web3Auth modal opens
2. **User switches to Sonic network** → Automatic network switching
3. **User selects payment method:**
   - Free: Direct HuggingFace API call
   - Credits: Smart contract `useCredits()` call
   - S Tokens: Smart contract `payWithS()` call  
   - USDC: Smart contract `payWithUSDC()` call
4. **Payment processed** → Automatic distribution to stakeholders
5. **Generation triggered** → MCP server processes with HuggingFace
6. **Result delivered** → Image/video displayed in UI

## File Structure Updates

```
myserviceprovider-app/
├── components/
│   ├── web3auth-provider.tsx (NEW)
│   └── ai-generation.tsx (UPDATED)
├── app/
│   └── layout.tsx (UPDATED)
├── src/
│   ├── huggingface-tools.ts (NEW)
│   └── mcp-worker.ts (UPDATED)
├── contracts/
│   └── SonicPayment.sol (NEW)
└── package.json (UPDATED)
```

## Implementation Steps

1. **Install Dependencies:**
```bash
npm install @web3auth/modal @tanstack/react-query ethers viem wagmi
npm uninstall @stripe/react-stripe-js @stripe/stripe-js stripe
```

2. **Copy Components:**
- Save `web3auth-provider.tsx` to `components/`
- Update `ai-generation.tsx` in `components/`
- Update `layout.tsx` in `app/`

3. **Deploy Smart Contract:**
- Deploy `SonicPayment.sol` to Sonic mainnet
- Update contract address in AI Generation component

4. **Configure Environment:**
- Set up Web3Auth project at https://dashboard.web3auth.io
- Get HuggingFace API key (optional)
- Update environment variables

5. **Test Integration:**
- Test wallet connection flow
- Test free generation with HuggingFace
- Test paid generation with S/USDC
- Verify payment distribution

## Security Considerations

- **Smart Contract:** Ownable pattern for admin functions
- **API Keys:** HuggingFace API key optional (rate limited without)
- **Payment Validation:** All payments validated on-chain
- **Transaction Monitoring:** Real-time transaction status tracking

## Next Steps for New Chat

1. Reference this implementation guide
2. Mention need to complete MCP worker integration
3. Implement backend generation processing
4. Set up HuggingFace model fallbacks
5. Test end-to-end payment and generation flow

## Key Innovation

Complete transition from traditional payments to Web3-native experience:
- No credit cards or fiat currency needed
- Direct crypto payments on Sonic blockchain
- Community rewards through staking integration
- Free tier with premium upgrade path
- Transparent, on-chain payment distribution

## Files Ready for Implementation

All artifacts have been created and are ready to be copied to their respective locations in the project structure. The implementation removes Stripe/Creem dependencies and replaces them with a complete Web3 stack powered by Sonic blockchain and HuggingFace AI models.