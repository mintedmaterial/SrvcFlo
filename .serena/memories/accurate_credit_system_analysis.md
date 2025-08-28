# ServiceFlow AI Accurate Credit System Analysis

## Current Credit System Structure (From Codebase)

### Credit Packages (S Token Pricing)
Based on `credit-system-config.ts`, the actual packages are:

1. **Starter AI Agent** - $5 USD / 5 S tokens
   - 750 credits total
   - ~3-4 images (750÷200=3.75) or 1-2 videos (750÷500=1.5)
   - Basic Cloudflare AI models only
   - No collection influence access

2. **Creator AI Agent** - $50 USD / 50 S tokens ⭐ POPULAR
   - 8,000 credits total  
   - ~40 images (8000÷200=40) or 16 videos (8000÷500=16)
   - Premium models: OpenAI DALL-E-2, Flux Schnell, Stable Diffusion XL, Gemini Pro
   - Collection influence: ['bandit', 'kidz']
   - **Threshold**: $50+ gets all models + collection influence

3. **Professional AI Agent** - $200 USD / 200 S tokens
   - 50,000 credits total
   - ~250 images (50000÷200=250) or 100 videos (50000÷500=100)
   - Enterprise models: OpenAI DALL-E-3, Flux Dev, All Premium Models, Video Generation
   - Collection influence: ['bandit', 'kidz', 'derp', 'sonic']

4. **Enterprise AI Agent** - $1500 USD / 1500 S tokens
   - 500,000 credits total
   - ~2500 images (500000÷200=2500) or 1000 videos (500000÷500=1000)
   - Maximum capabilities: OpenAI GPT-5, DALL-E-3, Enterprise Models, Custom Fine-tuning, API Access
   - Collection influence: ['bandit', 'kidz', 'derp', 'sonic', 'custom']

### Model Costs (Fixed INFT Standard)
**Image Generation**: 200 credits per image (all models)
- Free Cloudflare: 0 credits (basic users only)
- Flux Schnell: 200 credits
- DALL-E-2: 200 credits
- DALL-E-3: 200 credits
- Stable Diffusion XL: 200 credits
- Flux Dev: 200 credits
- Gemini Image: 200 credits

**Video Generation**: 500 credits per video (all models)
- Cloudflare Video: 500 credits
- DALL-E Video: 500 credits (future)
- Gemini Video: 500 credits
- Flux Video: 500 credits

### Payment System Integration

#### Dual Pricing Structure
- **S Token Pricing**: Dynamic USD equivalent in S tokens
- **USDC Pricing**: Fixed USDC amounts (5, 50, 200, 1500 USDC)

#### Payment Splits (Current System)
- **Bandit Kidz Holders**: 25%
- **Development**: 50% 
- **Leaderboard**: 15%
- **Contract/Treasury**: 10%

#### NFT Minting Costs (For Generated Content)
- **Native S Cost**: 1 S token per NFT mint
- **USDC Cost**: 0.5 USDC per NFT mint
- **wS Cost**: 1 wS token per NFT mint

## Cloudflare AI Integration (Special System)

### Cloudflare MCP Server Features
From `cloudflare_mcp_server.ts`:

1. **Payment Verification**: Integration with Sonic blockchain payment contracts
2. **Free Generation Limits**: 3 free generations per day per user
3. **Model Fallback System**: Automatic fallback between Cloudflare AI models
4. **State Management**: Tracks user generations and payment verification

### Cloudflare AI Models Available
**Image Models**:
- @cf/black-forest-labs/flux-1-schnell
- @cf/bytedance/stable-diffusion-xl-lightning
- @cf/lykon/dreamshaper-8-lcm
- @cf/runwayml/stable-diffusion-v1-5-img2img
- @cf/runwayml/stable-diffusion-v1-5-inpainting

**Video Models**: 
- Currently placeholder (not yet available in Cloudflare AI)
- Prepared for future integration

### Free Tier System
- **Daily Limit**: 3 free image generations per user per day
- **Quality**: Basic Cloudflare AI models only
- **Restrictions**: No video generation, no premium models, no collection influence

## ERC-1155 Credit Token System

### From SrvcFLoAICollection.sol
The system uses ERC-1155 tokens for credits with predefined token IDs:

```solidity
uint256 public constant STARTER_CREDITS = 0;      // 750 credits for 5 USDC
uint256 public constant PRO_CREDITS = 1;          // 8000 credits for 50 USDC  
uint256 public constant BUSINESS_CREDITS = 2;     // 100000 credits for 500 USDC
uint256 public constant ENTERPRISE_CREDITS = 3;   // 260000 credits for 1250 USDC
uint256 public constant CUSTOM_CREDITS = 4;       // Custom amount set by user
```

**Note**: The contract shows different names and amounts than config file:
- Contract: "PRO_CREDITS" vs Config: "Creator AI Agent"
- Contract: "BUSINESS_CREDITS" (100k credits/$500) vs Config: "Professional" (50k credits/$200)
- Contract: "ENTERPRISE_CREDITS" (260k credits/$1250) vs Config: "Enterprise" (500k credits/$1500)

## FLOAI Token Economics (Updated Requirements)

### Token Distribution (Refined)
Based on requirements for public market percentage:

**Total Supply**: 1,000,000,000 FLOAI tokens

**Recommended Distribution**:
- **Builder/Development**: 350M FLOAI (35%) - Reduced to allow public market
- **Public Market Trading**: 150M FLOAI (15%) - NEW: For DEX liquidity and public trading
- **Bandit Kidz Holders**: 200M FLOAI (20%) - Proportional airdrop
- **Other NFT Collections**: 50M FLOAI (5%) - Top 30 holders (3-5 collections)
- **Public Ecosystem/Rewards**: 100M FLOAI (10%) - Reduced, moved some to public market
- **Development Team**: 40M FLOAI (4%) - Split across 4 wallets (1% each)
- **Liquidity/DEX**: 110M FLOAI (11%) - Increased for better trading

### Token Utility Mapping
**FLOAI tokens** are used differently than **credits**:
- **Credits**: Direct generation costs (200 per image, 500 per video)
- **FLOAI**: Agent operation costs, minting iNFT agents, marketplace transactions
- **Conversion**: Users buy credit packages with S/USDC, use FLOAI for agent operations

### iNFT Agent Minting
- **Cost**: 50 S tokens (not FLOAI) to mint iNFT agent
- **FLOAI Usage**: Consumed per agent operation/command
- **Agent Revenue**: Generated revenue stored in agent for withdrawal

## Integration Points

### Agent-Credit System Flow
1. **Purchase Credits**: Users buy S token packages → get ERC-1155 credit tokens
2. **Mint iNFT Agent**: Pay 50 S tokens → get ERC-721 agent NFT
3. **Agent Operations**: FLOAI tokens consumed per agent command/generation
4. **Content Generation**: Credits consumed per image (200) or video (500)
5. **Revenue Distribution**: Generated content sales split via payment contracts

### Cloudflare Worker Integration
- **Free Tier**: 3 daily generations, basic models only
- **Paid Tier**: Credit-based, premium models, collection influence
- **Payment Verification**: On-chain verification via Sonic blockchain
- **State Management**: User stats, generation limits, payment history

## Recommendations for FLOAI Integration

### FLOAI Use Cases
1. **Agent Minting**: Alternative payment option (e.g., 1000 FLOAI = 50 S tokens)
2. **Agent Operations**: 1-10 FLOAI per agent command
3. **Marketplace Fees**: FLOAI for listing/trading agent NFTs
4. **Governance**: FLOAI staking for platform governance
5. **Premium Features**: Advanced agent configurations, custom tools

### Credit-FLOAI Relationship
- **Credits**: Direct generation costs (fixed 200/500)
- **FLOAI**: Agent management and platform operations
- **Conversion Rate**: Dynamic based on S token price (e.g., 1 S = 100 FLOAI)

### Public Market Strategy
- **150M FLOAI for trading**: Ensures healthy liquidity
- **Gradual Release**: Vested over 24 months to prevent dumping
- **Utility Drive**: Strong utility creates buy pressure
- **Staking Rewards**: Additional FLOAI rewards for platform participation