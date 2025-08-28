# ServiceApp Project Overview

## Project Purpose
ServiceFlow AI is a comprehensive SaaS platform designed to:

1. **Agent Launchpad**: Allow users to build specialized AI agents and workflows using the Agno framework
2. **Frontend Monetization**: Image/video generation workflows with Sonic blockchain payments
3. **Multi-tenant Architecture**: Support for individual users and small service businesses
4. **Content Creation**: Autonomous social media management and content generation
5. **NFT Staking Rewards**: Revenue sharing through existing NFT collection staking

## Core Components

### 1. Agent-UI (`agent-ui/`)
- **Purpose**: Backend agents chat interface
- **Technology**: Next.js 15.2.3, React 19, TypeScript
- **Features**: Agent workflow builder, local agent chat, specialized agent configuration
- **Port**: 3000 (development)

### 2. Main Application (`myserviceprovider-app/`)
- **Purpose**: Primary frontend for monetized services
- **Technology**: Next.js 14+, TypeScript, Cloudflare Workers
- **Features**: Image/video generation, payment processing, user dashboard
- **Blockchain**: Sonic testnet/mainnet integration

### 3. Backend Agents (`myserviceprovider-app/Agents/`)
- **Framework**: Agno (Python 3.12+)
- **Agents**: Content creation, Facebook management, Google services, Cloudflare deployment
- **Storage**: MongoDB, SQLite databases
- **APIs**: Google, Facebook Graph, Twitter/X, DuckDuckGo

### 4. Smart Contracts (`myserviceprovider-app/Contracts/`)
- **Payment Processing**: SonicPaymentTestnet.sol
- **NFT Staking**: BanditKidzStaking.sol  
- **Revenue Split**: 15% leaderboard, 50% development, 25% NFT staking, 10% treasury

## Architecture Flow
1. Users interact with frontend (Cloudflare Workers)
2. Payments processed through Sonic blockchain contracts
3. AI generation requests routed to backend agents
4. Revenue automatically distributed per smart contract logic
5. Agent configurations managed through agent-ui interface