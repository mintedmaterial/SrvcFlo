# ServiceApp Task Completion Workflow (Updated January 2025)

## Development Environment Setup

### Initial Setup for New Features
1. **Environment Check**: Verify all services are running
   - Agent-UI: `cd agent-ui && pnpm dev` (port 3000)
   - Main App: `cd myserviceprovider-app && npm run dev`
   - Python Agents: `cd myserviceprovider-app/Agents && python playground.py`
   - Cloudflare Worker: `npm run dev:worker` (if needed)

2. **Git Workflow**: Create feature branch from main
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

3. **Dependencies**: Ensure all dependencies are current
   - Agent-UI: `pnpm install`
   - Main App: `npm install`
   - Python: `uv sync` or `pip install -r requirements.txt`

## Component-Specific Development Workflows

### Agent-UI Development Workflow
**Purpose**: Backend agent interaction and building interface

1. **Planning Phase**:
   - Define agent capabilities and tools needed
   - Plan UI/UX for agent builder interface
   - Document integration points with playground.py

2. **Development Phase**:
   - Use pnpm for all package management
   - Follow React 19 + Next.js 15 patterns
   - Implement real-time communication with backend agents
   - Test agent configuration and deployment workflows

3. **Testing Phase**:
   - Unit tests: `pnpm test`
   - Type checking: `pnpm typecheck`
   - Linting: `pnpm lint`
   - Integration: Test with actual agents

4. **Quality Assurance**:
   - Code formatting: `pnpm format`
   - Full validation: `pnpm validate`
   - Cross-browser testing
   - Agent connectivity validation

### Main App Development Workflow
**Purpose**: Customer-facing monetized platform

1. **Planning Phase**:
   - Define user journey and payment flow
   - Plan blockchain integration requirements
   - Design API endpoints and data flow

2. **Development Phase**:
   - Implement frontend with Next.js 14+
   - Develop Cloudflare Workers for backend
   - Integrate Sonic blockchain payments
   - Connect with agent bridge (http_srvcflo_agent.py)

3. **Testing Phase**:
   - Payment flow testing on Sonic testnet
   - AI generation pipeline validation
   - User authentication and authorization
   - Performance optimization

4. **Deployment Preparation**:
   - Smart contract deployment to testnet
   - Cloudflare Workers configuration
   - Environment variable setup
   - Security audit

### Python Agents Development Workflow
**Purpose**: Backend AI agent development and deployment

1. **Planning Phase**:
   - Define agent capabilities and required tools
   - Plan integration with existing agent ecosystem
   - Document MCP server requirements

2. **Development Phase**:
   - Use Agno framework patterns
   - Implement async/await for performance
   - Connect to appropriate databases (MongoDB/SQLite)
   - Integrate external APIs (Google, Facebook, etc.)

3. **Testing Phase**:
   - Unit tests: `pytest`
   - Integration tests with MCP servers
   - Performance testing under load
   - API connectivity validation

4. **Deployment**:
   - Local testing with agent-ui
   - Integration with main app bridge
   - Production deployment to runtime environment

## AI Integration Workflow

### Multi-Provider AI Implementation
1. **Provider Selection**:
   - Primary: OpenAI for reliability
   - Secondary: Google Gemini for cost efficiency
   - Fallback: Groq for speed
   - Emergency: Local models if available

2. **Testing Procedure**:
   ```bash
   # Test individual providers
   node test-gemini-direct.js
   node test-groq-real.js
   node test-real-video.js
   
   # Run comprehensive tests
   node run-tests.js
   ```

3. **Implementation Pattern**:
   - Implement fallback logic
   - Add error handling and retry mechanisms
   - Monitor success rates and costs
   - Optimize for performance and cost

4. **Quality Assurance**:
   - Content safety filtering
   - Generation quality validation
   - Performance benchmarking
   - Cost analysis

## Blockchain Integration Workflow

### Smart Contract Development
1. **Development**:
   ```bash
   cd myserviceprovider-app
   npm run contracts:compile
   npm run contracts:test
   ```

2. **Testnet Deployment**:
   ```bash
   npm run contracts:testnet
   npm run sonic:validate
   ```

3. **Payment Testing**:
   - Test with small amounts on testnet
   - Validate revenue distribution
   - Test NFT staking functionality
   - Verify all payment flows

4. **Mainnet Preparation**:
   - Security audit
   - Final testing with production amounts
   - Deployment scripts preparation
   - Monitoring setup

### Payment Integration Testing
1. **Local Testing**: Use Hardhat local network
2. **Testnet Validation**: Comprehensive testing on Sonic testnet
3. **User Flow Testing**: End-to-end user payment experience
4. **Error Handling**: Test all failure scenarios

## Quality Assurance Workflows

### Code Quality Standards
1. **Frontend** (Agent-UI & Main App):
   - TypeScript strict mode enforcement
   - ESLint + Prettier configuration
   - Component testing with Jest/Vitest
   - Accessibility testing

2. **Backend** (Python Agents):
   - Type hints for all functions
   - Comprehensive error handling
   - Unit testing with pytest
   - Performance profiling

3. **Smart Contracts**:
   - Solidity best practices
   - Comprehensive test coverage
   - Gas optimization
   - Security audit preparation

### Testing Hierarchy
1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Component interaction testing
3. **End-to-End Tests**: Complete user journey testing
4. **Performance Tests**: Load and stress testing
5. **Security Tests**: Vulnerability assessment

## Deployment Workflows

### Staging Deployment
1. **Frontend Staging**:
   ```bash
   npm run build
   npm run deploy:staging
   ```

2. **Worker Staging**:
   ```bash
   npm run deploy:worker:staging
   ```

3. **Contract Staging**:
   ```bash
   npm run contracts:testnet
   ```

### Production Deployment
1. **Pre-deployment Checklist**:
   - All tests passing
   - Security audit complete
   - Performance validation done
   - Monitoring setup ready

2. **Deployment Sequence**:
   ```bash
   # 1. Deploy smart contracts
   npm run contracts:deploy
   
   # 2. Deploy Cloudflare Workers
   npm run deploy:worker
   
   # 3. Deploy frontend
   npm run deploy:frontend
   
   # 4. Validate deployment
   npm run validate:production
   ```

3. **Post-deployment**:
   - Monitor error rates
   - Validate payment flows
   - Check performance metrics
   - Monitor user feedback

## Error Handling & Rollback Procedures

### Error Detection
1. **Automated Monitoring**: Real-time error tracking
2. **User Reports**: Customer support integration
3. **Performance Degradation**: Automatic alerts
4. **Payment Failures**: Immediate notification system

### Rollback Procedures
1. **Frontend Rollback**:
   ```bash
   npm run rollback:frontend
   ```

2. **Worker Rollback**:
   ```bash
   npm run rollback:worker
   ```

3. **Database Rollback**: Prepared rollback scripts
4. **Smart Contract**: Emergency pause functionality

## Maintenance Workflows

### Regular Maintenance
1. **Dependency Updates**: Weekly security updates
2. **Database Optimization**: Monthly database maintenance
3. **Performance Monitoring**: Continuous monitoring
4. **Security Audits**: Quarterly security reviews

### Emergency Procedures
1. **Service Outage**: Immediate response procedures
2. **Security Incident**: Security response protocols
3. **Payment Issues**: Financial incident response
4. **Data Recovery**: Backup and recovery procedures

## Documentation & Communication

### Development Documentation
1. **Code Changes**: Document all significant changes
2. **API Changes**: Update API documentation
3. **Architecture Changes**: Update architecture diagrams
4. **Deployment Notes**: Document deployment procedures

### Team Communication
1. **Daily Standups**: Progress and blocker discussion
2. **Code Reviews**: Mandatory review process
3. **Architecture Decisions**: Team consensus required
4. **Incident Reports**: Post-incident analysis and documentation