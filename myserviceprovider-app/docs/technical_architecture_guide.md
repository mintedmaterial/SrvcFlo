# Technical Architecture & Integration Guide

## System Overview

Our AI generation platform is built on a modern Web3 architecture utilizing Sonic blockchain for payments, smart contracts for transparent distribution, and a sophisticated backend for AI model orchestration.

## Architecture Components

### Frontend Layer

**Web3Auth Integration**
- **Authentication**: Wallet-based user authentication
- **Network Management**: Automatic Sonic network switching
- **Transaction Management**: Real-time transaction status tracking
- **Mobile Optimization**: Progressive web app capabilities

**React/Next.js Application**
```typescript
// Web3Auth Provider Configuration
const web3AuthOptions = {
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID,
  chainConfig: {
    chainNamespace: 'eip155',
    chainId: '0x92', // Sonic Chain ID (146)
    rpcTarget: 'https://rpc.soniclabs.com',
    displayName: 'Sonic Mainnet',
    blockExplorer: 'https://sonicscan.org/',
    ticker: 'S',
    tickerName: 'Sonic'
  }
};
```

**State Management**
- **Wagmi/Viem**: Ethereum interactions and contract calls
- **React Query**: Server state management and caching
- **Context Providers**: Global state for user data and contracts
- **Local Storage**: Non-sensitive data persistence

### Smart Contract Layer

**Contract Architecture**
```
┌─────────────────────────────────────────────────────┐
│                 Payment System                      │
├─────────────────────────────────────────────────────┤
│  SonicAIGenerationPayment.sol (Main Contract)      │
│  ├── Payment Processing                             │
│  ├── Automatic Distribution                         │
│  ├── Credit Management                              │
│  └── Event Emission                                 │
├─────────────────────────────────────────────────────┤
│  BanditKidzStaking.sol                             │
│  ├── NFT Staking Logic                             │
│  ├── Reward Distribution                           │
│  ├── Epoch Management                              │
│  └── Emergency Functions                           │
├─────────────────────────────────────────────────────┤
│  GenerationVotingAndLeaderboard.sol                │
│  ├── Community Voting                              │
│  ├── Leaderboard Tracking                         │
│  ├── Contest Management                            │
│  └── Point Calculation                             │
└─────────────────────────────────────────────────────┘
```

**Key Contract Functions**

**Payment Contract**
```solidity
contract SonicAIGenerationPayment {
    // Payment constants
    uint256 public constant USDC_COST = 1 * 10**6; // 1 USDC
    uint256 public constant S_COST = 3 * 10**18;   // 3 S tokens
    
    // Distribution percentages
    uint256 public constant BANDIT_KIDZ_PERCENT = 25;
    uint256 public constant DEV_PERCENT = 50;
    uint256 public constant LEADERBOARD_PERCENT = 15;
    uint256 public constant CONTRACT_PERCENT = 10;
    
    // Core payment functions
    function payWithS(string calldata prompt, string calldata generationType) external;
    function payWithUSDC(string calldata prompt, string calldata generationType) external;
    function useCredits(string calldata prompt, string calldata generationType) external;
    function addCredits(address user, uint256 amount) external onlyOwner;
}
```

**Staking Contract**
```solidity
contract BanditKidzStaking {
    struct StakeInfo {
        address staker;
        uint256 stakedAt;
        uint256 unstakedAt;
        bool earlyUnstake;
        uint256 lastClaimedDistribution;
    }
    
    // Core staking functions
    function stake(uint256 tokenId) external;
    function stakeBatch(uint256[] calldata tokenIds) external;
    function unstake(uint256 tokenId) external;
    function claimRewards(uint256[] calldata distributionIds) external;
}
```

**Voting Contract**
```solidity
contract GenerationVotingAndLeaderboard {
    struct Generation {
        string id;
        address creator;
        string prompt;
        string resultUrl;
        uint256 timestamp;
        uint256 upvotes;
        bool isActive;
        uint256 weeklyContestId;
    }
    
    // Core voting functions
    function submitGeneration(...) external onlyOwner;
    function vote(string calldata generationId) external;
    function getUserVotingPower(address user) public view returns (uint256);
}
```

### Backend Infrastructure

**MCP (Model Context Protocol) Server**
```typescript
class CloudflareAIMCPServer {
  // AI model integration
  private async generateImage(prompt: string, options: ImageOptions) {
    // HuggingFace model fallbacks
    const models = [
      'black-forest-labs/FLUX.1-schnell',
      'stabilityai/stable-diffusion-xl-base-1.0',
      'runwayml/stable-diffusion-v1-5'
    ];
    
    // Try models in sequence with fallbacks
    for (const model of models) {
      try {
        return await this.callHuggingFace(model, prompt, options);
      } catch (error) {
        console.log(`Model ${model} failed, trying next`);
      }
    }
    
    // Fallback to Cloudflare AI
    return await this.callCloudflareAI(prompt, options);
  }
}
```

**Event Processing Pipeline**
```typescript
// Blockchain event listener
const eventProcessor = {
  async processPaymentEvent(event: PaymentEvent) {
    const { user, prompt, generationType, txHash } = event;
    
    // 1. Validate payment transaction
    const txReceipt = await verifyTransaction(txHash);
    
    // 2. Trigger AI generation
    const generationResult = await mcpServer.generate({
      type: generationType,
      prompt,
      userAddress: user,
      paymentTx: txHash
    });
    
    // 3. Submit to voting contract
    if (generationResult.success) {
      await submitToVotingContract({
        generationId: generationResult.id,
        creator: user,
        prompt,
        resultUrl: generationResult.url
      });
    }
  }
};
```

### Database Schema

**User & Authentication**
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    wallet_address TEXT UNIQUE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    auth_provider TEXT DEFAULT 'web3auth',
    preferred_chain_id INTEGER DEFAULT 146,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Generation & Payment Tracking**
```sql
CREATE TABLE ai_generations (
    task_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    wallet_address TEXT,
    generation_type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    status TEXT DEFAULT 'processing',
    result_urls TEXT, -- JSON array
    payment_tx_hash TEXT,
    payment_method TEXT,
    credits_used INTEGER DEFAULT 0,
    submitted_to_thread BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_credits (
    email TEXT PRIMARY KEY,
    wallet_address TEXT,
    credits INTEGER DEFAULT 0,
    auth_method TEXT DEFAULT 'email',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Blockchain Transaction Tracking**
```sql
CREATE TABLE blockchain_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    tx_hash TEXT NOT NULL,
    contract_address TEXT,
    action TEXT NOT NULL,
    metadata TEXT, -- JSON
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE nft_stakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    token_id INTEGER NOT NULL,
    chain_id INTEGER DEFAULT 146,
    tx_hash TEXT,
    status TEXT DEFAULT 'active',
    staked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    unstaked_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API Architecture

### REST API Endpoints

**Authentication Routes**
```typescript
// POST /api/auth/login
interface LoginRequest {
  email?: string;
  walletAddress?: string;
  signature?: string;
  message?: string;
}

// GET /api/auth/user
interface UserResponse {
  user: {
    id: string;
    email?: string;
    walletAddress?: string;
    name: string;
    role: string;
    isAdmin: boolean;
  };
  permissions: string[];
  authenticated: boolean;
}
```

**Generation Routes**
```typescript
// POST /api/mcp/generate
interface GenerationRequest {
  type: 'image' | 'video';
  prompt: string;
  paymentTx?: string;
  userAddress: string;
  paymentType: 'free' | 'credits' | 'crypto';
  width?: number;
  height?: number;
  steps?: number;
  duration?: number;
}

interface GenerationResponse {
  success: boolean;
  imageData?: string; // base64 for images
  videoUrl?: string;  // URL for videos
  error?: string;
}
```

**Thread & Voting Routes**
```typescript
// POST /api/generations/thread
interface ThreadRequest {
  filters: {
    timeframe: 'all' | 'week' | 'month' | 'today';
    type: 'all' | 'image' | 'video';
    sortBy: 'newest' | 'trending' | 'top';
    stakedOnly: boolean;
  };
  searchQuery?: string;
  userAddress?: string;
}

// POST /api/user/stats
interface UserStatsRequest {
  userAddress: string;
}

interface UserStatsResponse {
  stats: {
    totalUpvotesReceived: number;
    totalGenerationsCreated: number;
    leaderboardPoints: number;
    weeklyPoints: number;
    isEligibleForVoting: boolean;
    canVote: boolean;
  };
}
```

### WebSocket Integration

**Real-time Updates**
```typescript
class WebSocketManager {
  private connections = new Map<string, WebSocket>();
  
  // Subscribe to user-specific updates
  subscribeToUser(userId: string, ws: WebSocket) {
    this.connections.set(userId, ws);
    
    // Send real-time updates for:
    ws.send(JSON.stringify({
      type: 'generation_complete',
      data: { taskId, result, timestamp }
    }));
    
    ws.send(JSON.stringify({
      type: 'vote_received',
      data: { generationId, newVoteCount, points }
    }));
    
    ws.send(JSON.stringify({
      type: 'leaderboard_update',
      data: { newRank, points }
    }));
  }
}
```

## Security Architecture

### Smart Contract Security

**Access Control Patterns**
```solidity
// Ownable pattern for admin functions
modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
}

// Role-based access control
modifier onlyAdmin() {
    require(hasRole(ADMIN_ROLE, msg.sender), "Not admin");
    _;
}

// Emergency pause functionality
modifier whenNotPaused() {
    require(!paused, "Contract is paused");
    _;
}
```

**Input Validation**
```solidity
// Validate prompt length
require(bytes(prompt).length > 0 && bytes(prompt).length <= 1000, "Invalid prompt");

// Validate payment amounts
require(msg.value >= MINIMUM_PAYMENT, "Insufficient payment");

// Validate token transfers
require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
```

**Economic Security**
```solidity
// Rate limiting per user
mapping(address => uint256) public lastGeneration;
modifier rateLimited() {
    require(block.timestamp >= lastGeneration[msg.sender] + RATE_LIMIT, "Rate limited");
    lastGeneration[msg.sender] = block.timestamp;
    _;
}

// Maximum generation limits
mapping(address => uint256) public dailyGenerations;
require(dailyGenerations[msg.sender] < MAX_DAILY_GENERATIONS, "Daily limit exceeded");
```

### Backend Security

**API Authentication**
```typescript
// JWT token validation
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }
  
  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

**Input Sanitization**
```typescript
// Prompt sanitization
const sanitizePrompt = (prompt: string): string => {
  // Remove potentially harmful content
  const cleaned = prompt
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
    
  if (cleaned.length > 1000) {
    throw new Error('Prompt too long');
  }
  
  return cleaned;
};

// Wallet address validation
const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
```

## Deployment Architecture

### Infrastructure Setup

**Cloudflare Workers Deployment**
```typescript
// wrangler.toml configuration
export default {
  name: "serviceflow-ai-backend",
  main: "src/index.ts",
  compatibility_date: "2024-01-15",
  
  [env.production]
  vars = {
    ENVIRONMENT = "production"
    SONIC_RPC_URL = "https://rpc.soniclabs.com"
  }
  
  [[env.production.kv_namespaces]]
  binding = "CACHE"
  id = "your-kv-namespace-id"
  
  [[env.production.r2_buckets]]
  binding = "AI_CONTENT"
  bucket_name = "serviceflow-ai-content"
};
```

**Frontend Deployment (Vercel)**
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_WEB3AUTH_CLIENT_ID": "your-web3auth-client-id",
    "NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT": "0x...",
    "NEXT_PUBLIC_VOTING_CONTRACT": "0x...",
    "NEXT_PUBLIC_STAKING_CONTRACT": "0x..."
  }
}
```

### Smart Contract Deployment

**Hardhat Configuration**
```typescript
// hardhat.config.ts
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sonic: {
      url: "https://rpc.soniclabs.com",
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 146
    }
  },
  etherscan: {
    apiKey: {
      sonic: process.env.SONIC_API_KEY!
    },
    customChains: [
      {
        network: "sonic",
        chainId: 146,
        urls: {
          apiURL: "https://api.sonicscan.org/api",
          browserURL: "https://sonicscan.org"
        }
      }
    ]
  }
};
```

**Deployment Scripts**
```typescript
// scripts/deploy.ts
async function deployContracts() {
  const [deployer] = await ethers.getSigners();
  
  // Deploy payment contract
  const PaymentContract = await ethers.getContractFactory("SonicAIGenerationPayment");
  const paymentContract = await PaymentContract.deploy(
    BANDIT_KIDZ_STAKING_ADDRESS,
    DEV_WALLET_ADDRESS
  );
  
  // Deploy staking contract
  const StakingContract = await ethers.getContractFactory("BanditKidzStaking");
  const stakingContract = await StakingContract.deploy();
  
  // Deploy voting contract
  const VotingContract = await ethers.getContractFactory("GenerationVotingAndLeaderboard");
  const votingContract = await VotingContract.deploy(stakingContract.address);
  
  // Verify contracts
  await hre.run("verify:verify", {
    address: paymentContract.address,
    constructorArguments: [BANDIT_KIDZ_STAKING_ADDRESS, DEV_WALLET_ADDRESS]
  });
  
  console.log("Contracts deployed and verified");
}
```

## Monitoring & Analytics

### Performance Monitoring

**Application Metrics**
```typescript
// Custom metrics tracking
class MetricsCollector {
  async trackGeneration(type: 'image' | 'video', duration: number, success: boolean) {
    await this.submitMetric('generation.duration', duration, {
      type,
      success: success.toString()
    });
  }
  
  async trackPayment(method: string, amount: number, success: boolean) {
    await this.submitMetric('payment.amount', amount, {
      method,
      success: success.toString()
    });
  }
  
  async trackVote(voterNFTCount: number, generationType: string) {
    await this.submitMetric('vote.cast', 1, {
      voterTier: this.getNFTTier(voterNFTCount),
      generationType
    });
  }
}
```

**Blockchain Monitoring**
```typescript
// Contract event monitoring
const monitorContractEvents = async () => {
  const paymentContract = new ethers.Contract(PAYMENT_CONTRACT_ADDRESS, ABI, provider);
  
  // Monitor payment events
  paymentContract.on('PaymentReceived', (payer, token, amount, type, event) => {
    console.log(`Payment: ${amount} ${token} from ${payer} for ${type}`);
    
    // Track metrics
    metrics.trackPayment(token, amount, true);
    
    // Alert on large payments
    if (amount > LARGE_PAYMENT_THRESHOLD) {
      alertManager.sendAlert('large_payment', { payer, amount, token });
    }
  });
  
  // Monitor generation requests
  paymentContract.on('GenerationRequested', (user, prompt, type, id) => {
    console.log(`Generation ${id} requested by ${user}`);
    
    // Trigger AI generation pipeline
    generationQueue.add({
      id,
      user,
      prompt,
      type,
      timestamp: Date.now()
    });
  });
};
```

### Error Handling & Logging

**Structured Logging**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage in application
logger.info('Generation started', {
  userId: user.id,
  generationType: type,
  prompt: prompt.substring(0, 50) + '...',
  paymentMethod: method
});

logger.error('Generation failed', {
  userId: user.id,
  error: error.message,
  stack: error.stack,
  paymentTx: txHash
});
```

**Error Recovery**
```typescript
class ErrorRecoveryManager {
  async handleGenerationFailure(taskId: string, error: Error) {
    logger.error('Generation failed', { taskId, error: error.message });
    
    // Attempt retry with different model
    const retryResult = await this.retryWithFallback(taskId);
    
    if (!retryResult.success) {
      // Refund user credits/payment
      await this.processRefund(taskId);
      
      // Notify user of failure
      await this.notifyUser(taskId, 'generation_failed');
    }
  }
  
  async handlePaymentFailure(txHash: string, user: string) {
    // Verify transaction status
    const txStatus = await this.verifyTransaction(txHash);
    
    if (txStatus === 'failed') {
      // Log for manual review
      logger.warn('Payment transaction failed', { txHash, user });
      
      // Add to manual review queue
      await this.addToReviewQueue({ txHash, user, type: 'payment_failure' });
    }
  }
}
```

---

## Quick Start Guide

### Developer Setup

1. **Clone Repository**
```bash
git clone https://github.com/your-org/serviceflow-ai
cd serviceflow-ai
```

2. **Install Dependencies**
```bash
npm install
# or
yarn install
```

3. **Environment Configuration**
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

4. **Deploy Smart Contracts**
```bash
npx hardhat deploy --network sonic
npx hardhat verify --network sonic DEPLOYED_ADDRESS
```

5. **Start Development Server**
```bash
npm run dev
# or
yarn dev
```

### Production Deployment

1. **Build Application**
```bash
npm run build
npm run start
```

2. **Deploy to Vercel**
```bash
vercel deploy --prod
```

3. **Deploy Workers**
```bash
wrangler deploy
```

4. **Verify Deployment**
```bash
curl https://your-domain.com/api/health
```

---

*This technical guide provides the foundation for understanding and extending the ServiceFlow AI platform. For specific implementation details, refer to the individual component documentation.*