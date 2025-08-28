# ServiceApp Development Guidelines (Updated January 2025)

## Code Style & Architecture Principles

### Frontend Development Standards
- **Framework**: Next.js 14/15 with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS with consistent design system
- **Components**: shadcn/ui for base components, custom components for business logic
- **State Management**: React Context, Zustand for complex state, TanStack Query for server state
- **Code Organization**: Feature-based directory structure

### Backend Development Standards
- **Python Agents**: Agno framework with async/await patterns
- **API Design**: RESTful endpoints with proper HTTP status codes
- **Database**: MongoDB for user data, SQLite for agent sessions
- **Security**: Input validation, rate limiting, secure authentication
- **Error Handling**: Comprehensive error logging and user-friendly messages

## Multi-Component Architecture

### Agent-UI Development
- **Purpose**: Backend agent interaction and building interface
- **Port**: 3000 (development)
- **Package Manager**: pnpm (NOT npm)
- **Connection**: Direct integration with `myserviceprovider-app/Agents/playground.py`
- **Security**: Local development only, no production deployment planned
- **Features**: Command-based agent creation, workflow builder, tool configuration

### Main App Development  
- **Purpose**: Customer-facing SaaS platform
- **Deployment**: Cloudflare Workers for production
- **Monetization**: Image/video generation with Sonic blockchain payments
- **Bridge**: http_srvcflo_agent.py for secure backend communication
- **Access Control**: Only development team can access backend agents

## Payment & Blockchain Integration

### Sonic Blockchain Requirements
- **Network**: Testnet for development, mainnet after validation
- **Smart Contracts**:
  - SonicPaymentTestnet.sol for payment processing
  - BanditKidzStaking.sol for NFT staking rewards
- **Revenue Distribution**:
  - 15% → Leaderboard wallet
  - 50% → Development wallet (AI costs/overhead)  
  - 25% → NFT staking contract
  - 10% → Treasury (from transaction fees)
- **Testing**: Comprehensive testnet validation before mainnet deployment

### Pricing Strategy
- **Image Generation**: $1 USDC or $S token per image
- **Video Generation**: $2 USDC or $S token per video
- **Subscription Tiers**: Free (limited), Pro (enhanced), Enterprise (unlimited)
- **Crypto Bonus**: 20% discount for crypto payments

## AI Integration Standards

### Multi-Provider Support
- **Primary**: OpenAI for reliability
- **Secondary**: Google Gemini for cost efficiency
- **Fallback**: Groq for high-speed inference
- **Testing**: Individual test files for each provider
- **Error Handling**: Graceful fallback between providers

### Content Generation Workflow
- **Images**: Stability AI, DALL-E, Midjourney integration
- **Videos**: Custom video generation pipeline
- **Text**: Multi-model approach based on request type
- **Quality Control**: Content filtering and safety checks

## Security & Access Control

### Development Environment Security
- **Backend Agents**: Development team access only
- **API Keys**: Secure environment variable management
- **Database**: Separate development and production databases
- **CORS**: Properly configured for each environment
- **Authentication**: Multi-tier user authentication system

### Production Security
- **Cloudflare**: WAF protection and DDoS mitigation
- **Rate Limiting**: Per-user and per-endpoint limits
- **Input Validation**: Comprehensive validation for all inputs
- **Audit Logging**: All payment and agent interactions logged

## Agent Development Guidelines

### Specialized Agent Creation
- **Framework**: Agno for all agent development
- **Tools**: Modular tool system for flexible agent capabilities
- **Configuration**: JSON-based configuration for easy customization
- **Testing**: Local testing before deployment
- **Documentation**: Comprehensive documentation for each agent type

### Agent Deployment Options
- **Local**: Users can run agents on their own infrastructure
- **Hosted**: Optional deployment to separate runtime environments
- **Security**: User agents isolated from development backend
- **Monitoring**: Basic usage tracking and performance metrics

## Testing & Quality Assurance

### Automated Testing
- **AI Providers**: `test-gemini-direct.js`, `test-groq-real.js`, `test-real-video.js`
- **Payment System**: Comprehensive Sonic testnet testing
- **Integration**: `run-tests.js` for automated test execution
- **Contract Testing**: Hardhat test suite for smart contracts

### Manual Testing Procedures
- **User Workflows**: Complete user journey testing
- **Payment Processing**: End-to-end payment validation
- **Agent Functionality**: Each agent type thoroughly tested
- **Cross-browser**: Testing across major browsers and devices

## Documentation Standards

### Code Documentation
- **Inline Comments**: For complex business logic only
- **Function Documentation**: JSDoc for all public functions
- **README Files**: Updated for each major component
- **API Documentation**: OpenAPI/Swagger specifications

### Project Documentation
- **Architecture Guides**: High-level system documentation
- **Deployment Procedures**: Step-by-step deployment instructions
- **User Guides**: Customer-facing documentation
- **Developer Onboarding**: New developer setup guides

## Development Workflow

### Git Workflow
- **Branching**: Feature branches for all development
- **Commits**: Descriptive commit messages with issue references
- **Pull Requests**: Required for all changes to main branch
- **Code Review**: Mandatory review process

### Deployment Pipeline
- **Development**: Local development with hot reload
- **Staging**: Cloudflare staging environment
- **Production**: Automated deployment via GitHub Actions
- **Rollback**: Quick rollback procedures for issues

## Performance & Monitoring

### Performance Requirements
- **Page Load**: Under 3 seconds for all pages
- **API Response**: Under 500ms for standard requests
- **AI Generation**: Progress indicators for long-running tasks
- **Database Queries**: Optimized queries with proper indexing

### Monitoring & Analytics
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Real-time performance metrics
- **User Analytics**: Privacy-compliant usage tracking
- **Financial Tracking**: Revenue and cost monitoring

## Future Development Considerations

### Scalability Planning
- **Database**: Prepared for horizontal scaling
- **Agent Infrastructure**: Modular agent deployment system
- **Payment Processing**: Multi-blockchain support preparation
- **Content Delivery**: CDN optimization for global users

### Feature Roadmap Alignment
- **Agent Launchpad**: Command-based agent creation interface
- **Workflow Builder**: Visual workflow creation tools
- **Advanced Analytics**: Comprehensive business intelligence
- **Enterprise Features**: White-label and custom deployment options