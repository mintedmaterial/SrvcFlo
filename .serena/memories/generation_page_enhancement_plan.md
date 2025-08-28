# ServiceApp Generation Page Enhancement Plan

## Current Issues Identified
1. **Paid generations not working with Sonic testnet tokens**
2. **Dev wallet paying for own generations** 
3. **Missing agentic interaction flow**
4. **Need better integration with Cloudflare AI and Gemini**

## Priority Implementation Tasks

### Phase 1: Critical Fixes (This Week)
1. **Dev Wallet Bypass System**
   - Created: `lib/dev-wallet-config.ts`
   - Need to add actual dev wallet addresses
   - Integration with payment flow to skip payment for dev wallets

2. **Fix Sonic Testnet Payment Flow**
   - Current config looks correct (SSSTT: 0xc777Fa50186362fe0EF9CCD579b6385cE7CB49f1)
   - Need to debug transaction approval and execution
   - Test with actual testnet tokens

3. **Agentic UI Flow Implementation**
   - Replace current button-based payment with conversational flow
   - Agent analyzes prompt and suggests payment method
   - User confirms via dialog, agent executes transaction

### Phase 2: Enhanced Features (Next Week)
1. **Referral/Access Control System**
   - NFT-based access for Bandit Kidz holders
   - Daily free generation limits (2-3 per day)
   - Whitelist system for initial mainnet testing

2. **Art Style Integration with Paintswap Collections**
   - Prompt analysis for collection keywords
   - API integration with Paintswap metadata
   - Style influence system for generations

### Phase 3: Advanced Features (Following Weeks)
1. **Premium Model Selection**
   - Cloudflare AI for high-quality images
   - Gemini for video generation
   - Dynamic model selection based on payment tier

## Technical Architecture

### Dev Wallet System
- Configuration file: `lib/dev-wallet-config.ts`
- Integration points: Payment handlers in `ai-generation.tsx`
- Bypass logic: Skip payment flow, use premium models directly

### Agentic Flow Design
- Agent chat interface overlay on generation page
- Natural language processing of generation requests
- Smart payment method recommendations
- Transaction confirmation workflow

### Paintswap Integration
- Collection metadata fetching
- Prompt keyword analysis
- Style prompt enhancement
- Visual trait integration

## Success Metrics
- Successful testnet payment transactions
- Dev wallet bypass working
- At least 2-3 test generations with paid flow
- Ready for mainnet contract deployment