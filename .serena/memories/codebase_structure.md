# ServiceApp Codebase Structure (Updated January 2025)

## Root Directory Structure
```
ServiceApp/
├── .claude/                     # Claude AI assistant configuration
├── .serena/                     # Serena MCP server configuration  
├── .vscode/                     # VS Code workspace settings
├── agent-ui/                    # Backend agents chat interface (NEW)
├── myserviceprovider-app/       # Main application & services  
├── DOCS/                        # Comprehensive project documentation
├── generated_videos/            # AI-generated video output storage
├── image_vid_gen/               # Image/video generation implementation
├── tmp/                         # Temporary files and databases
├── claude.md                    # Project instructions & context
├── DEVELOPMENT_PLAN_SESSION1.md # Recent development session planning
├── TESTNET_PAYMENT_FIX_REPORT.md # Payment system fixes documentation
├── serviceflow_progress.md      # Project milestone tracking
├── blog_post_strat*.md          # Blog content strategy (4 files)
├── cloudflare-*.md              # Cloudflare deployment guides
├── complete_setup_guide.md      # Comprehensive setup instructions
├── test-*.js                    # AI provider testing (Gemini, Groq, video)
├── run-tests.js                 # Automated testing workflow
├── sonic-credits-widget.zip     # Payment widget components
├── Sonic_Logo.ai + PNG files    # Branding assets
├── package.json                 # Root dependencies
└── requirements.txt             # Python requirements
```

## Agent-UI Directory (`agent-ui/`) - NEW MAJOR COMPONENT
**Purpose**: Chat interface for backend AI agents with agent building capabilities

```
agent-ui/
├── src/
│   ├── app/                     # Next.js 15 app router
│   │   ├── agent-builder/       # Agent configuration UI
│   │   ├── playground/          # Agent chat interface
│   │   └── api/                 # API routes for agent communication
│   ├── components/
│   │   ├── agno/                # Agno framework components
│   │   ├── playground/          # Chat interface components
│   │   ├── ui/                  # shadcn/ui components
│   │   └── agent-builder/       # Agent building interface
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities and configurations
│   ├── types/                   # TypeScript type definitions
│   └── styles/                  # CSS and styling
├── public/                      # Static assets
├── components.json              # shadcn/ui configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── next.config.mjs              # Next.js configuration
├── package.json                 # Dependencies (pnpm managed)
└── README.md                    # Agent-UI specific documentation
```

**Key Features:**
- Connected to `myserviceprovider-app/Agents/playground.py`
- Command-based agent creation with document, coding, cloudflare agents
- Local agent chat and testing
- Workflow builder for specialized business agents
- Tool configuration interface for backend agent capabilities

## Main Application (`myserviceprovider-app/`) - ENHANCED
**Purpose**: Primary SaaS platform with monetized AI services

```
myserviceprovider-app/
├── app/                         # Next.js 14 frontend application
│   ├── api/                     # API routes (enhanced with new endpoints)
│   │   ├── blog/                # Blog management
│   │   ├── chat/                # Agent communication
│   │   ├── payment/             # Sonic blockchain payments
│   │   ├── staking/             # NFT staking functionality
│   │   └── generate/            # AI generation endpoints
│   ├── generate/                # AI generation pages (image/video)
│   ├── dashboard/               # User dashboard with usage tracking
│   ├── staking/                 # NFT staking interface
│   ├── pricing/                 # Pricing calculator and plans
│   └── globals.css              # Global styles
├── src/                         # Cloudflare Workers
│   ├── components/              # React components for workers
│   ├── utils/                   # Worker utility functions
│   ├── middleware/              # Authentication and rate limiting
│   └── worker.js                # Main worker script
├── Agents/                      # Python AI agents (Agno framework)
│   ├── facebook_mcp/            # Facebook MCP server
│   ├── cloudflare_mcp/          # Cloudflare MCP server
│   ├── google_mcp/              # Google services MCP server
│   ├── tmp/                     # Agent databases and sessions
│   ├── playground.py            # Main agent playground (connects to agent-ui)
│   ├── content_agent.py         # Autonomous content creation
│   ├── facebook_agent.py        # Facebook Page management
│   ├── google_agent.py          # Gmail and Calendar operations
│   ├── cloudflare_agent.py      # Cloudflare deployment automation
│   ├── http_srvcflo_agent.py    # HTTP bridge (dev-only access)
│   ├── run_*.bat                # Windows batch scripts for agent execution
│   └── requirements.txt         # Agent-specific Python dependencies
├── Contracts/                   # Solidity smart contracts (Sonic blockchain)
│   ├── SonicPaymentTestnet.sol  # Payment processing (testnet ready)
│   ├── BanditKidzStaking.sol    # NFT staking rewards system
│   ├── VotingContract.sol       # Community governance voting
│   ├── deployment_scripts.js    # Contract deployment automation
│   └── artifacts/               # Compiled contract artifacts
├── components/                  # React components
│   ├── ui/                      # Base UI components (shadcn/ui)
│   ├── ai-generation.tsx        # AI generation interface
│   ├── crypto-bank-staking.tsx  # NFT staking interface
│   ├── pricing-calculator.tsx   # Dynamic pricing calculator
│   ├── payment-widget.tsx       # Sonic payment integration
│   └── dashboard-components/    # User dashboard components
├── lib/                         # Libraries and utilities
│   ├── models/                  # Data models and schemas
│   ├── auth-levels.ts           # Multi-tier authentication
│   ├── wagmi-config.ts          # Web3 configuration (Sonic)
│   ├── payment-processor.ts     # Blockchain payment handling
│   └── utils.ts                 # General utilities
├── scripts/                     # Build and deployment scripts
├── public/                      # Static assets and branding
├── wrangler.toml               # Cloudflare Workers configuration
└── package.json                # Dependencies and build scripts
```

## Documentation (`DOCS/`) - ENHANCED
**Purpose**: Comprehensive project documentation with recent additions

```
DOCS/
├── Agno_*.md                    # Agno framework documentation
├── Cloudflare_*.md              # Cloudflare Workers deployment guides
├── API_*.md                     # API documentation and integration guides
├── Payment_Integration.md       # Sonic blockchain payment documentation
├── Agent_Development_Guide.md   # Guide for creating specialized agents
├── NFT_Staking_Guide.md         # NFT staking implementation details
├── Images/                      # Documentation images and diagrams
├── technical_architecture_guide.md # Overall system architecture
└── deployment_procedures.md     # Step-by-step deployment instructions
```

## Key Configuration Files - UPDATED

### Frontend Configurations
- **Next.js**: `next.config.mjs` (multiple, including agent-ui)
- **TypeScript**: `tsconfig.json` (updated for new structure)
- **Tailwind**: `tailwind.config.ts` (consistent across projects)
- **Components**: `components.json` (shadcn/ui config)
- **ESLint**: Updated for new lint standards

### Backend Configurations  
- **Python**: `pyproject.toml` (Agents directory)
- **Agno**: Configuration for multi-agent systems
- **Hardhat**: `hardhat.config.js` (Sonic blockchain development)
- **Wrangler**: `wrangler.toml` (Cloudflare Workers deployment)

### New Environment & Deployment
- **CORS**: Updated `temp_cors_*.json` files for new endpoints
- **SSL**: `srvcflo.com.pem`, `srvcflo.com.key` for HTTPS
- **Secrets**: Secure credential management for multi-provider AI access
- **Payment Keys**: Sonic blockchain wallet configurations

## Database & Storage - EXPANDED

### SQLite Databases (in `tmp/` directories)
- **Agent sessions**: Enhanced session management
- **Content**: Content creation and publishing workflows
- **Social**: Multi-platform social media management
- **Payment**: Transaction tracking and revenue distribution
- **Staking**: NFT staking rewards and user balances

### New File Storage
- **Generated Content**: `generated_videos/` for AI video output
- **User Assets**: Profile images, custom branding
- **Cache**: Multi-provider AI model caching
- **Logs**: Enhanced logging for debugging and analytics

## Entry Points & Development Servers - UPDATED

### Development Servers
- **Agent-UI**: `pnpm dev` → `http://localhost:3000` (NEW)
- **Main App**: `npm run dev` → Next.js dev server
- **Python Agents**: `python playground.py` (connects to agent-ui)
- **Workers**: `npm run dev:worker` → Cloudflare local development
- **Contract Testing**: `npx hardhat node` → Local blockchain

### Production Deployment
- **Cloudflare Workers**: Multi-worker deployment via wrangler
- **Smart Contracts**: Sonic mainnet deployment (post-testnet)
- **Agent Infrastructure**: Secure runtime environment deployment
- **CDN**: Static asset distribution via Cloudflare

## Revenue & Payment Flow - NEW ARCHITECTURE

### Payment Processing
1. Frontend → SonicPaymentTestnet.sol → Revenue distribution
2. **15%** → Leaderboard rewards wallet
3. **50%** → Development wallet (AI costs, overhead)
4. **25%** → BanditKidzStaking.sol (NFT holder rewards)
5. **10%** → Treasury (from transaction fees)

### Pricing Structure
- **Image Generation**: $1 USDC or $S token
- **Video Generation**: $2 USDC or $S token
- **Subscription Tiers**: Free, Pro, Enterprise
- **Agent Building**: Premium feature for higher tiers

## Security & Access Control

### Agent Access
- **Backend Agents**: Development team only
- **User Agents**: Local or user-deployed runtime
- **Bridge Security**: http_srvcflo_agent.py with authentication
- **API Keys**: Secure multi-provider AI access management