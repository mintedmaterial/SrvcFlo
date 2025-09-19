# ServiceFlow AI Platform - Project Context

## Core Vision
Build a SaaS platform using Agno framework for backend specialized agents, enabling higher-tier users to build custom agents/workflows for their business needs.

## Project Structure

### Key Directories
- **C:\Users\PC\ServiceApp\agent-ui**: Backend agents chat UI (Next.js app with OpenAI Agents SDK + Python agents)
- **C:\Users\PC\ServiceApp\myserviceprovider-app**: Frontend app (Next.js + Cloudflare Workers)
  - `/app` and `/src`: Frontend user-facing apps launched via Cloudflare Workers
  - `/Agents`: Bridge connections (e.g., `http_srvcflo_agent.py`)
  - `/Contracts`: Sonic blockchain smart contracts

### Agent OS
- Task management and planning system
- Product development workflows
- Integration with MCP servers (Supabase, Thirdweb, etc.) for database management

## Technology Stack

### Backend (Agent Infrastructure)
- **Framework**: Agno multi-agent system
- **Database**: Supabase via MCP server for agent-ui
- **Development Tools**: Trigger.dev for task scheduling and workflows
- **Runtime**: Node.js/Express + Cloudflare Workers
- **Python Agents**: content_agent.py, facebook_agent.py, google_agent.py

### Frontend (Next.js Apps)
- **agent-ui**: Internal agent management interface
- **myserviceprovider-app**: Customer-facing application
- **Styling**: Tailwind CSS + shadcn/ui
- **Web3**: Web3Auth, ethers, viem, wagmi, thirdweb/Gelato

### Blockchain (Sonic Network)
- **Testnet First**: Test all contracts on Sonic testnet before mainnet
- **Contracts**:
  - SonicPaymentTestnet.sol (payment processing)
  - BanditKidzStaking.sol (NFT holder rewards)
- **Payment Split**:
  - 15% leaderboard wallet
  - 50% dev app wallet (AI costs/overhead)
  - 25% NFT staking rewards

## Current Focus Areas

### 1. Agent UI Development
- Rename to "AgentForge" or similar
- Chat-based builder for user agents/workflows
- Tool selection via chat interface and buttons
- Local or runtime deployment options (separate from our codebase)

### 2. Frontend Monetization
- Image generation: $1 USDC/$S per image
- Video generation: $2 USDC/$S per video
- Voting system for generated content
- Payment distribution to leaderboards, dev wallets, NFT staking rewards

### 3. Agent Development
- Leverage existing agents (content, facebook, google)
- Add ecosystem analysis agents (3x daily reports)
- NFT market analyst for Paintswap monitoring

## MCP Server Integration
- **Supabase**: Database management for agent-ui
- **Thirdweb**: Blockchain interactions and smart contracts
- **Trigger.dev**: Task scheduling and workflow automation
- **Other MCP tools**: As needed for specific agent capabilities

## Trigger.dev Integration

### Core Concepts
- Define tasks with `task({ id, run })`
- Trigger with `await task.trigger(payload)`
- Retries: max 3 attempts, exponential backoff
- Real-time subscriptions for run monitoring

### Configuration
```typescript
defineConfig({
  project: "serviceflow-ai",
  dirs: ["./trigger"],
  build: {
    extensions: [
      prismaExtension({ schema: "prisma/schema.prisma" }),
      // Add other extensions as needed
    ]
  }
})
```

### Best Practices
- Use idempotency keys for critical operations
- Implement queues for concurrency control
- Track metadata for progress monitoring
- Use external storage for large payloads (>10MB)

## Development Workflow

### Key Commands
- Use Trigger.dev for scheduled tasks and workflows
- Test blockchain features on Sonic testnet first
- Maintain separation between production and development environments

### Agent Access
- Backend agents accessible only to us
- Users get bridges to their own agents
- Deploy user agents to separate runtime environments

## Next Steps
1. Complete frontend monetization implementation
2. Test payment contracts on Sonic testnet
3. Develop middle agent UI for user agent building
4. Implement voting system for generated content
5. Set up scheduled reports via Trigger.dev

## Important Notes
- Always test on Sonic testnet before mainnet deployment
- Maintain strict separation between our agents and user agents
- Use MCP servers for enhanced capabilities (database, blockchain, etc.)
- Follow Trigger.dev best practices for task management