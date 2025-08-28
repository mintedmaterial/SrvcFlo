# ServiceApp Tech Stack (Updated January 2025)

## Frontend Technologies

### Agent-UI (Backend Agent Interface) - NEW
- **Framework**: Next.js 15.2.3
- **Runtime**: React 19.0.0
- **Language**: TypeScript 5.7.2
- **Package Manager**: pnpm 9.17.0
- **Styling**: Tailwind CSS 3.4.1 + tailwindcss-animate
- **UI Components**: 
  - Radix UI (@radix-ui/react-*) - Accessible components
  - shadcn/ui - Customized component library
  - Lucide React 0.474.0 - Icon system
- **State Management**: 
  - Zustand 5.0.3 - Lightweight state management
  - TanStack Query - Server state management
- **Development Tools**:
  - ESLint 9.18.0 - Code linting
  - Prettier 3.4.2 - Code formatting
  - TypeScript strict mode - Type safety
- **Theming**: next-themes 0.4.4 - Dark/light mode
- **Notifications**: Sonner 1.7.4 - Toast notifications
- **Markdown**: react-markdown 9.0.3 with rehype/remark plugins
- **Animation**: Framer Motion 12.4.1 - UI animations
- **Date Handling**: dayjs 1.11.13 - Date utilities

### Main App (myserviceprovider-app) - ENHANCED
- **Framework**: Next.js 14.0.4 (upgrading to 15.x planned)
- **Runtime**: React 18.3.1
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.3.0 + tailwindcss-animate
- **UI Components**: 
  - Radix UI - Base components
  - shadcn/ui - Custom component system
  - Lucide React 0.454.0 - Icons
- **State Management**:
  - @tanstack/react-query 5.83.0 - Server state
  - React Context - Local state
  - Zustand - Complex client state

## AI & Machine Learning Integration - ENHANCED

### Multi-Provider AI Support
- **Primary**: @ai-sdk/openai 0.0.66 - OpenAI GPT models
- **Secondary**: @google/genai 1.12.0 - Google Gemini integration
- **High-Speed**: Groq integration - Fast inference
- **Fallback System**: Automatic provider switching on failures
- **Testing Infrastructure**:
  - `test-gemini-direct.js` - Direct Gemini API testing
  - `test-groq-real.js` - Groq performance testing
  - `test-real-video.js` - Video generation validation
  - `run-tests.js` - Automated test execution

### Specialized AI Capabilities
- **Image Generation**: 
  - DALL-E integration via OpenAI
  - Stability AI integration
  - Custom image processing pipelines
- **Video Generation**: 
  - Custom video generation workflow
  - Multiple model integration
  - Quality optimization system
- **Text Processing**: 
  - Multi-model text generation
  - Content filtering and safety
  - Language detection and translation

## Blockchain & Web3 Technologies - ENHANCED

### Sonic Blockchain Integration
- **Primary Network**: Sonic blockchain (testnet + mainnet)
- **Web3 Libraries**:
  - thirdweb 5.77.0 - Web3 development framework
  - wagmi 2.16.0 - React hooks for Ethereum
  - viem 2.33.1 - TypeScript interface for Ethereum
  - ethers 6.8.0 - Ethereum library
- **Wallet Integration**:
  - @web3auth/modal 10.0.4 - Social login + Web3
  - @rainbow-me/rainbowkit 2.2.8 - Wallet connection UI
- **Smart Contract Development**:
  - Hardhat - Development environment
  - @nomicfoundation/hardhat-toolbox 6.1.0 - Development tools
  - Solidity - Smart contract language

### Payment & Staking System
- **Payment Processing**: SonicPaymentTestnet.sol
- **NFT Staking**: BanditKidzStaking.sol
- **Revenue Distribution**: Automated contract-based splitting
- **Testing**: Comprehensive testnet validation before mainnet

## Backend Technologies

### Python Agents (Agno Framework) - ENHANCED
- **Python Version**: 3.12+
- **Primary Framework**: agno - Multi-agent system framework
- **Web Frameworks**: 
  - FastAPI - High-performance API framework
  - Flask 3.1.1 + flask-cors 6.0.1 - Lightweight web framework
- **Runtime**: uvicorn[standard] - ASGI server
- **Async Processing**: nest-asyncio 1.6.0 - Nested async support

### Database Technologies
- **Primary Database**: MongoDB 6.3.0 with pymongo 4.13.2
- **Session Storage**: SQLite 3 with sqlite3 5.1.7
- **Cache**: Redis integration planned
- **Database per tenant**: Multi-tenancy support

### External API Integrations - ENHANCED
- **Google Services**:
  - google-api-python-client 2.176.0
  - google-auth-* packages
  - Gmail and Calendar integration
- **Social Media**:
  - tweepy - Twitter/X integration
  - Facebook Graph API - Facebook management
  - Instagram Basic Display API
- **Content & Web**:
  - spider-client - Web scraping
  - beautifulsoup4 - HTML parsing
  - DuckDuckGo API - Search integration

## Development & Deployment Technologies

### Package Management
- **Frontend**: npm (main app), pnpm (agent-ui)
- **Backend**: pip + uv for Python dependency management
- **Monorepo**: Root package.json for shared dependencies

### Build & Development Tools
- **Frontend Build**: Next.js compiler + SWC
- **Backend Build**: Python packaging + virtual environments
- **Code Quality**:
  - ESLint + Prettier (frontend)
  - Black + flake8 (Python)
  - TypeScript strict mode
- **Testing**:
  - Jest (frontend unit tests)
  - pytest (Python unit tests)
  - Custom integration test suite

### Deployment Infrastructure
- **Frontend**: Cloudflare Workers + Pages
- **Backend Agents**: Docker containers + cloud deployment
- **Smart Contracts**: Hardhat deployment scripts
- **CDN**: Cloudflare for static assets
- **Monitoring**: 
  - Error tracking integration
  - Performance monitoring
  - Usage analytics

## Security & Authentication

### Authentication Systems
- **Web3 Auth**: Social login + crypto wallet integration
- **Traditional Auth**: Email/password with JWT
- **Multi-tier Access**: Free, Pro, Enterprise levels
- **API Security**: Rate limiting + input validation

### Security Measures
- **Input Validation**: Comprehensive validation on all inputs
- **CORS Configuration**: Properly configured cross-origin policies
- **Secrets Management**: Environment-based secret handling
- **SSL/TLS**: Full HTTPS encryption
- **Smart Contract Security**: Audited contract patterns

## Infrastructure & DevOps

### Cloud Services
- **Primary**: Cloudflare (Workers, Pages, CDN, Security)
- **Database Hosting**: MongoDB Atlas + self-hosted options
- **File Storage**: Cloudflare R2 + local storage
- **Email**: SendGrid integration
- **Analytics**: Custom analytics + third-party integration

### Development Environment
- **Version Control**: Git with GitHub
- **CI/CD**: GitHub Actions + automated deployments
- **Local Development**: 
  - Hot reload for all services
  - Local blockchain node
  - Database containers
- **Environment Management**: 
  - Development, staging, production environments
  - Environment-specific configurations

## Communication & Integration

### Inter-Service Communication
- **Frontend ↔ Backend**: REST APIs + WebSocket connections
- **Agent Communication**: MCP (Model Context Protocol) servers
- **Blockchain Integration**: Web3 provider connections
- **External APIs**: RESTful integration with rate limiting

### Real-time Features
- **Agent Chat**: WebSocket-based real-time communication
- **Payment Status**: Real-time blockchain transaction monitoring
- **Generation Progress**: Live updates for AI content generation
- **Notifications**: Real-time user notifications

## Monitoring & Analytics

### Performance Monitoring
- **Frontend**: Core Web Vitals tracking
- **Backend**: API response time monitoring
- **Blockchain**: Transaction success rate tracking
- **AI Services**: Generation success rate and quality metrics

### Business Analytics
- **User Behavior**: Privacy-compliant usage tracking
- **Revenue Tracking**: Real-time payment and revenue monitoring
- **Agent Performance**: Agent success rate and user satisfaction
- **Cost Management**: AI provider cost tracking and optimization

## Future Technology Roadmap

### Planned Integrations
- **Additional AI Providers**: Anthropic Claude, Cohere
- **Multi-blockchain Support**: Ethereum, Polygon, BSC
- **Advanced Analytics**: Business intelligence dashboard
- **Mobile Apps**: React Native applications
- **Enterprise Features**: White-label deployment options

### Scalability Preparations
- **Microservices**: Gradual transition to microservice architecture
- **Edge Computing**: Enhanced Cloudflare edge deployment
- **Database Scaling**: Horizontal scaling preparation
- **Load Balancing**: Multi-region deployment planning