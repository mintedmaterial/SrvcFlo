# ServiceFlow AI Platform

**Transform Content Creation with Multi-Agent AI Orchestration**

ServiceFlow AI is a comprehensive SaaS platform that leverages the Agno framework and Trigger.dev for backend specialized agents, enabling users to build custom AI workflows for viral content generation, blockchain integration, and automated monetization.

## 🌟 Features

### 🤖 Multi-Agent System
- **Enhanced Content Agent**: AI-powered content generation with virality optimization
- **Social Media Distribution**: Automated posting to Facebook, Google, and other platforms
- **NFT Market Analysis**: Real-time monitoring of Paintswap marketplace and Sonic ecosystem
- **Team Orchestration**: Coordinated multi-agent workflows with Trigger.dev

### 🎨 Content Generation
- **Image Generation**: High-quality AI imagery ($1 USDC/$S per image)
- **Video Creation**: Professional video content ($2 USDC/$S per video)
- **Blog Posts & Articles**: SEO-optimized written content
- **Social Media Posts**: Platform-specific content with hashtag optimization

### 💰 Monetization System
- **Blockchain Payments**: Sonic network integration with smart contracts
- **Revenue Distribution**:
  - 15% to leaderboard wallet
  - 50% to development/AI costs
  - 25% to NFT staking rewards
  - 10% platform reserve
- **Voting System**: Community-driven quality assessment
- **NFT Rewards**: BanditKidz NFT holder benefits

### 📊 Real-Time Monitoring
- **Workflow Dashboard**: Live monitoring of Trigger.dev tasks
- **Agent Performance**: Real-time health and resource tracking
- **Payment Analytics**: Blockchain transaction monitoring
- **System Health**: Comprehensive platform status

## 🏗️ Architecture

### Backend Infrastructure
- **Framework**: Agno multi-agent orchestration system
- **Task Management**: Trigger.dev for workflow automation
- **Database**: Supabase with MCP server integration
- **Blockchain**: Sonic network (testnet and mainnet support)
- **Storage**: Cloudflare R2 buckets for media assets

### Frontend Applications
- **Agent UI**: Internal agent management interface (Next.js)
- **Customer App**: User-facing application with Web3 integration
- **Monitoring Dashboard**: Real-time system analytics

### Integration Stack
- **MCP Servers**: Supabase, Thirdweb, Trigger.dev, Stripe, OpenZeppelin
- **Web3**: Dynamic, ethers, viem, wagmi, Gelato smart wallets
- **AI Services**: OpenAI, Cloudflare AI, FloAI integration
- **Payment Processing**: USDC/S tokens, smart contract automation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- Git
- Sonic wallet (for testnet)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ServiceApp.git
cd ServiceApp
```

2. **Install dependencies**
```bash
# Agent UI
cd agent-ui
npm install

# Customer App
cd ../myserviceprovider-app
npm install

# Python Agents
cd ../Agents
pip install -r requirements.txt
```

3. **Environment Setup**
```bash
# Copy environment templates
cp .env.example .env
cp agent-ui/.env.example agent-ui/.env.local
cp myserviceprovider-app/.env.example myserviceprovider-app/.env.local
```

4. **Configure Environment Variables**
- Set up Supabase credentials
- Configure Sonic network RPC
- Add Cloudflare R2 bucket credentials
- Set Trigger.dev API keys

5. **Start Development Servers**
```bash
# Agent UI (Port 3000)
cd agent-ui
npm run dev

# Customer App (Port 3001)
cd myserviceprovider-app
npm run dev

# Trigger.dev (Port 3002)
cd .agent-os/trigger
npm run dev
```

## 📱 Applications

### Agent UI (Internal)
- **Port**: 3000
- **Purpose**: Agent management and monitoring
- **Access**: Internal team only
- **Features**: Real-time dashboard, workflow orchestration, system health

### Customer App (Public)
- **Port**: 3001
- **Purpose**: Content generation and monetization
- **Access**: Public users with wallet connection
- **Features**: Content creation, voting, payments, NFT integration

## 🔧 Configuration

### MCP Servers
Configure Model Context Protocol servers in `.mcp.json`:
- **Supabase**: Database operations
- **Thirdweb**: Blockchain interactions
- **Trigger.dev**: Task automation
- **Stripe**: Payment processing
- **OpenZeppelin**: Smart contract templates

### Trigger.dev Setup
1. Create account at [trigger.dev](https://trigger.dev)
2. Configure project in `.agent-os/trigger/trigger.config.ts`
3. Deploy tasks with `npm run deploy`

### Blockchain Configuration
- **Testnet**: Use Sonic testnet for development
- **Mainnet**: Production deployment on Sonic mainnet
- **Contracts**: Deploy using Hardhat or Foundry

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Agent Testing
```bash
cd Agents
python -m pytest tests/
```

## 🚀 Deployment

### Agent UI Deployment
- **Platform**: Railway/Vercel
- **Environment**: Node.js
- **Build**: `npm run build`

### Customer App Deployment
- **Platform**: Cloudflare Workers
- **Environment**: Edge runtime
- **Build**: `npm run build`

### Agent Services
- **Platform**: Railway/Docker
- **Environment**: Python/Node.js
- **Monitoring**: Trigger.dev dashboard

## 🔐 Security

### Authentication
- **Web3**: Dynamic wallet connection
- **API**: JWT token-based authentication
- **Admin**: Role-based access control

### Smart Contract Security
- **Audits**: OpenZeppelin standards
- **Testing**: Comprehensive test coverage
- **Upgrades**: Proxy pattern implementation

### Data Protection
- **Encryption**: End-to-end encryption for sensitive data
- **Storage**: Secure R2 bucket configuration
- **Compliance**: GDPR and privacy standards

## 📚 Documentation

- **API Documentation**: `/docs/api`
- **Agent Development**: `/docs/agents`
- **Blockchain Integration**: `/docs/blockchain`
- **Deployment Guide**: `/docs/deployment`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Legal Disclaimers

**Financial Disclaimer**: ServiceFlow AI is not a financial advisor. We are not responsible for user funds, investment decisions, or financial losses. Users interact with blockchain and cryptocurrency features at their own risk.

**Platform Disclaimer**: This platform facilitates content creation and blockchain interactions but does not guarantee outcomes, earnings, or platform availability.

## 🆘 Support

- **Documentation**: [docs.serviceflow.ai](https://docs.serviceflow.ai)
- **Issues**: GitHub Issues
- **Discord**: [ServiceFlow Community](https://discord.gg/serviceflow)
- **Email**: support@serviceflow.ai

## 🎯 Roadmap

### Q1 2025
- [ ] Multi-chain support (Ethereum, Base, Arbitrum)
- [ ] Advanced AI model integration
- [ ] Mobile app development

### Q2 2025
- [ ] Enterprise features
- [ ] API marketplace
- [ ] Advanced analytics dashboard

### Q3 2025
- [ ] White-label solutions
- [ ] AI model training platform
- [ ] Global expansion

---

**Built with ❤️ by the ServiceFlow AI Team**

*Transforming content creation through intelligent automation*