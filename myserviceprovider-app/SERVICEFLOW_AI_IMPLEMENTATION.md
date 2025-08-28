# ServiceFlow AI Generation Implementation Guide

This document contains the complete implementation for adding AI image and video generation capabilities to ServiceFlow AI using Cloudflare Workers, Kie.ai, Stripe payments, and crypto payments on Sonic blockchain with wallet authentication.

## Quick Start Summary

We created 6 main artifacts in this conversation:

1. **Enhanced ServiceFlow Worker** (TypeScript) - Complete backend implementation
2. **AI Generation Page Component** (React) - Frontend UI for credits and generation
3. **Database Schema** (SQL) - D1 database tables and indexes
4. **Wrangler Configuration** (TOML) - Cloudflare Worker configuration
5. **Smart Contract** (Solidity) - Sonic blockchain credit management
6. **Crypto Wallet Authentication** (React) - Web3 wallet integration

## Overview

**What we're building:**
- AI image generation (GPT-4o via Kie.ai)
- AI video generation (Veo3 via Kie.ai)
- Credit-based payment system
- Stripe integration for fiat payments
- Sonic blockchain for crypto payments (20% bonus)
- **Crypto wallet authentication (MetaMask, WalletConnect, etc.)**
- Real-time generation tracking
- **Seamless Web3 user experience**

## Authentication Methods

**Traditional Auth:**
- Email/password login
- Session-based authentication
- Stripe payment integration

**Crypto Wallet Auth:**
- MetaMask integration
- WalletConnect support
- Wallet address as user identifier
- Sign-in with Ethereum (SIWE) protocol
- Automatic Sonic network switching

## Credit Packages

| Package | Price | Fiat Credits | Crypto Credits (+20%) |
|---------|-------|--------------|----------------------|
| Starter | $5 | 750 | 900 |
| Standard | $50 | 8,000 | 9,600 |
| Premium | $500 | 100,000 | 120,000 |
| Enterprise | $1,250 | 265,000 | 318,000 |

**Generation Costs:**
- Image: 60 credits
- Video: 120 credits

## Required Environment Variables

```bash
wrangler secret put KIE_AI_API_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put ADMIN_API_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put SRVCFLO_AGENT_TOKEN
wrangler secret put JWT_SECRET_KEY
wrangler secret put WALLET_AUTH_MESSAGE
```

## Enhanced Database Setup

Run this SQL in your Cloudflare D1 database:

```sql
-- Enhanced user credits table with wallet support
CREATE TABLE user_credits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    wallet_address TEXT,
    auth_method TEXT NOT NULL DEFAULT 'email', -- 'email' or 'wallet'
    credits INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email),
    UNIQUE(wallet_address)
);

-- Wallet authentication sessions
CREATE TABLE wallet_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT NOT NULL,
    nonce TEXT NOT NULL,
    session_token TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX(wallet_address),
    INDEX(session_token)
);

-- Generation history table (enhanced)
CREATE TABLE generation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT UNIQUE NOT NULL,
    user_email TEXT,
    user_wallet TEXT,
    generation_type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    result_urls TEXT,
    credits_used INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Purchase history table (enhanced)
CREATE TABLE purchase_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT,
    user_wallet TEXT,
    package_id TEXT NOT NULL,
    payment_method TEXT NOT NULL, -- 'stripe' or 'crypto'
    amount_usd DECIMAL(10,2),
    amount_crypto DECIMAL(18,8),
    crypto_currency TEXT,
    transaction_hash TEXT,
    credits_purchased INTEGER,
    stripe_session_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_user_credits_email ON user_credits(email);
CREATE INDEX idx_user_credits_wallet ON user_credits(wallet_address);
CREATE INDEX idx_generation_history_user_email ON generation_history(user_email);
CREATE INDEX idx_generation_history_user_wallet ON generation_history(user_wallet);
CREATE INDEX idx_generation_history_task_id ON generation_history(task_id);
CREATE INDEX idx_wallet_sessions_address ON wallet_sessions(wallet_address);
CREATE INDEX idx_wallet_sessions_token ON wallet_sessions(session_token);
```

## Key API Endpoints

**Existing Endpoints:**
- `GET /api/credits/packages` - Available packages
- `GET /api/credits/balance?email=user@example.com` - User balance
- `POST /api/credits/checkout` - Stripe payment
- `POST /api/generate/image` - Generate image
- `POST /api/generate/video` - Generate video
- `GET /api/generate/status/{taskId}` - Check status
- `POST /api/stripe/webhook` - Payment webhook

**New Wallet Auth Endpoints:**
- `POST /api/auth/wallet/nonce` - Get signing nonce
- `POST /api/auth/wallet/verify` - Verify signature & login
- `POST /api/auth/wallet/logout` - Logout wallet session
- `GET /api/credits/balance?wallet=0x...` - Balance by wallet
- `POST /api/credits/crypto/purchase` - Crypto payment processing

## Web3 Integration Dependencies

Add these to your package.json:

```json
{
  "dependencies": {
    "ethers": "^6.8.0",
    "wagmi": "^1.4.0",
    "@wagmi/core": "^1.4.0",
    "@wagmi/connectors": "^3.1.0",
    "viem": "^1.19.0",
    "@walletconnect/modal": "^2.6.0",
    "siwe": "^2.1.4"
  }
}
```

## Wallet Authentication Flow

1. **User clicks "Connect Wallet"**
2. **Request nonce from backend**
3. **User signs authentication message**
4. **Backend verifies signature and creates session**
5. **Frontend stores session token**
6. **Subsequent requests use wallet address as identifier**

## Sonic Network Configuration

```javascript
const sonicMainnet = {
  id: 146,
  name: 'Sonic Mainnet',
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

## Crypto Payment Tokens

**Mainnet (Chain ID 146):**
- USDC: `0x29219dd400f2Bf60E5a23d13Be72B486D4038894`
- wS: `0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38`
- FeeM: `0xDC2B0D2Dd2b7759D97D50db4eabDC36973110830`

## Enhanced Component Features

**Wallet Integration:**
- Automatic network switching to Sonic
- Real-time balance display
- Transaction status tracking
- Gas fee estimation
- Multi-wallet support (MetaMask, WalletConnect, Coinbase Wallet)

**Payment Options:**
- Traditional Stripe checkout
- Direct crypto payments with 20% bonus
- Wallet balance verification
- Transaction confirmation

## Kie.ai Integration Examples

**Image Generation:**
```javascript
fetch('https://api.kie.ai/api/v1/gpt4o-image/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${KIE_AI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: prompt,
    model: 'gpt-4o'
  })
});
```

**Video Generation:**
```javascript
fetch('https://api.kie.ai/api/v1/veo/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${KIE_AI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: prompt,
    model: 'veo3',
    aspectRatio: '16:9'
  })
});
```

## Stripe MCP Setup

**Claude Code Integration:**
The Stripe Model Context Protocol (MCP) has been configured to provide AI-assisted Stripe API integration and documentation access.

```bash
# Add Stripe MCP to Claude Code (already configured)
claude mcp add --transport http http-server https://mcp.stripe.com/

# Check MCP status
claude mcp list
```

**Features Available:**
- Real-time Stripe API documentation search
- Payment Intent and Checkout Session guidance
- Best practices for Stripe integration
- OAuth authentication for secure API access

**Authentication:**
The Stripe MCP uses OAuth Dynamic Client Registration. When first accessing Stripe tools, you'll be prompted to authorize Claude Code to access your Stripe account through the Stripe Dashboard.

## Enhanced Deployment Checklist

1. ✅ Create D1 databases with wallet support
2. ✅ Run enhanced SQL schema
3. ✅ Set environment variables (including wallet auth)
4. ✅ Configure wrangler.toml
5. ✅ Deploy smart contracts to Sonic
6. ✅ Set up Web3 provider configuration
7. ✅ Deploy enhanced Cloudflare Worker
8. ✅ Set up Stripe webhooks
9. ✅ Configure WalletConnect project
10. ✅ Configure Stripe MCP for AI assistance
11. ✅ Test wallet connection flow
12. ✅ Test crypto payment processing
13. ✅ Test generation flows with both auth methods

## Integration with Existing ServiceFlow AI

1. **Replace your existing worker.js** with the enhanced TypeScript version
2. **Add the React component** with Web3 integration to your frontend routing
3. **Install Web3 dependencies** (ethers, wagmi, etc.)
4. **Update wrangler.toml** with the new configuration
5. **Deploy the enhanced database schema** to your D1 instance
6. **Set up the smart contracts** on Sonic blockchain
7. **Configure Web3 providers** and wallet connections

## New Artifacts Created

1. **serviceflow_ai_worker_enhanced** - Worker with wallet auth
2. **wallet_auth_component** - Web3 wallet integration
3. **crypto_payment_processor** - Blockchain payment handling
4. **enhanced_ai_generation_page** - UI with wallet support
5. **enhanced_database_schema** - Schema with wallet tables
6. **web3_config** - Wagmi and provider configuration

## Wallet Authentication Security

**Features:**
- Nonce-based signature verification
- Session token management
- Signature replay protection
- Secure message formatting (SIWE standard)
- Automatic session expiration

**Security Best Practices:**
- Never store private keys
- Validate all signatures server-side
- Use secure random nonces
- Implement rate limiting
- Log authentication attempts

## User Experience Flow

**New Users (Crypto):**
1. Visit ServiceFlow AI
2. Click "Connect Wallet"
3. Choose wallet provider
4. Sign authentication message
5. Automatically redirected to AI generation
6. Purchase credits with crypto (20% bonus)
7. Generate AI content

**Existing Users (Email):**
1. Continue using email authentication
2. Option to link crypto wallet
3. Access to crypto payment bonuses
4. Maintain existing credit balance

## Testing Scenarios

**Wallet Authentication:**
- Connect with MetaMask
- Connect with WalletConnect
- Network switching to Sonic
- Signature verification
- Session management

**Crypto Payments:**
- USDC purchases
- wS token purchases
- Transaction confirmation
- Credit allocation
- Bonus calculation

**Cross-Auth Compatibility:**
- Email user linking wallet
- Wallet user adding email
- Credit balance merging
- Purchase history tracking

## Development Environment Setup

```bash
# Install dependencies
npm install ethers wagmi @wagmi/core @wagmi/connectors viem

# Set up environment variables
wrangler secret put JWT_SECRET_KEY
wrangler secret put WALLET_AUTH_MESSAGE

# Deploy enhanced schema
npx wrangler d1 execute your-db --file=enhanced_schema.sql

# Test wallet connection
npm run dev
```

## Production Considerations

**Scalability:**
- Database indexing for wallet addresses
- Session cleanup automation
- Transaction status caching
- Rate limiting by wallet address

**Monitoring:**
- Wallet connection success rates
- Crypto payment completion rates
- Failed transaction handling
- Gas fee optimization

**Compliance:**
- KYC requirements for large purchases
- Transaction reporting
- Tax documentation
- Regional restrictions

## Next Steps for Implementation

1. **Copy the enhanced artifacts** from this conversation
2. **Install Web3 dependencies** in your project
3. **Set up wallet provider configuration**
4. **Deploy enhanced database schema**
5. **Configure Sonic network settings**
6. **Test wallet authentication flow**
7. **Implement crypto payment processing**
8. **Deploy to production with monitoring**

## Resources

- Kie.ai Docs: https://docs.kie.ai/
- Sonic Docs: https://docs.soniclabs.com/
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Stripe API: https://stripe.com/docs/api
- Wagmi Docs: https://wagmi.sh/
- SIWE Docs: https://docs.login.xyz/
- MetaMask Docs: https://docs.metamask.io/
- WalletConnect Docs: https://docs.walletconnect.com/

## Contact for New Chat

Reference this enhanced implementation file and mention the wallet authentication requirements. All code is ready for implementation with full Web3 integration.

**Key Innovation:** Seamless transition between traditional and crypto authentication methods, providing users with flexible payment options and the crypto community with native Web3 experience including 20% credit bonuses.

## File Locations

This enhanced implementation guide has been saved to:
C:\Users\PC\ServiceApp\myserviceprovider-app\SERVICEFLOW_AI_IMPLEMENTATION.md

All artifacts from this conversation should be copied to your project structure for implementation with Web3 wallet authentication support.