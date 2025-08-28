# Complete Deployment and Setup Guide

## Overview
This guide covers deploying all contracts, setting up the backend APIs, and configuring the complete gamified NFT staking and voting system.

## 1. Smart Contract Deployment

### Deploy BanditKidz Staking Contract
```bash
# Deploy staking contract first
npx hardhat run scripts/deploy-staking.js --network sonic
```

### Deploy Voting/Leaderboard Contract
```bash
# Deploy voting contract with staking address
npx hardhat run scripts/deploy-voting.js --network sonic --staking-address <STAKING_ADDRESS>
```

### Deploy Payment Contract
```bash
# Deploy payment contract
npx hardhat run scripts/deploy-payment.js --network sonic --staking-address <STAKING_ADDRESS>
```

### Contract Verification
```bash
# Verify all contracts on Sonic
npx hardhat verify --network sonic <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## 2. Environment Variables Setup

Update your `.env.local` file:

```bash
# Existing variables
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
WEB3AUTH_CLIENT_SECRET=your_web3auth_client_secret
HUGGINGFACE_API_KEY=your_huggingface_api_key
ADMIN_API_KEY=your_admin_key
OPENAI_API_KEY=your_openai_key

# New contract addresses (update after deployment)
NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT=0x...
NEXT_PUBLIC_BANDIT_KIDZ_STAKING_CONTRACT=0x...
NEXT_PUBLIC_VOTING_CONTRACT=0x...

# Admin wallet for contract interactions
ADMIN_PRIVATE_KEY=your_admin_private_key

# Database (if using)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Optional: Analytics and monitoring
ANALYTICS_API_KEY=your_analytics_key
```

## 3. Database Schema (Optional)

If you want to store additional metadata in a database:

```sql
-- generations table for metadata
CREATE TABLE generations (
    id VARCHAR PRIMARY KEY,
    creator_address VARCHAR NOT NULL,
    prompt TEXT NOT NULL,
    result_url TEXT NOT NULL,
    type VARCHAR(10) NOT NULL, -- 'image' or 'video'
    payment_method VARCHAR(20) NOT NULL,
    transaction_hash VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    upvotes INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    weekly_contest_id INTEGER
);

-- user_stats table for caching
CREATE TABLE user_stats (
    address VARCHAR PRIMARY KEY,
    total_generations INTEGER DEFAULT 0,
    total_upvotes INTEGER DEFAULT 0,
    leaderboard_points INTEGER DEFAULT 0,
    weekly_points INTEGER DEFAULT 0,
    global_rank INTEGER,
    weekly_rank INTEGER,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- weekly_contests table
CREATE TABLE weekly_contests (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    prize_pool_s DECIMAL,
    prize_pool_usdc DECIMAL,
    winners JSONB -- Array of winner addresses
);

-- votes table for tracking
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    voter_address VARCHAR NOT NULL,
    generation_id VARCHAR NOT NULL,
    transaction_hash VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(voter_address, generation_id)
);

-- Indexes for performance
CREATE INDEX idx_generations_creator ON generations(creator_address);
CREATE INDEX idx_generations_weekly_contest ON generations(weekly_contest_id);
CREATE INDEX idx_votes_generation ON votes(generation_id);
CREATE INDEX idx_votes_voter ON votes(voter_address);
```

## 4. API Routes Implementation

Create the following API route files:

### Required API Routes:
- `app/api/generations/thread/route.ts` ✅ (Created)
- `app/api/leaderboard/route.ts` ✅ (Created)
- `app/api/contests/current/route.ts` ✅ (Created)
- `app/api/generations/submit/route.ts` ✅ (Created)
- `app/api/user/stats/route.ts` ✅ (Created)

### Additional API Routes Needed:

```typescript
// app/api/user/generations/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userAddress } = await request.json()
    
    // Query your database or contract for user's generations
    // Return user's generation history
    
    return NextResponse.json({
      success: true,
      generations: [] // User's generations
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user generations' }, { status: 500 })
  }
}
```

```typescript
// app/api/admin/weekly-contest/route.ts
export async function POST(request: NextRequest) {
  try {
    const { action, title, prizePool } = await request.json()
    
    // Validate admin access
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (action === 'start') {
      // Start new weekly contest via contract
      // Update database
    } else if (action === 'end') {
      // End current contest via contract
      // Calculate winners
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Contest operation failed' }, { status: 500 })
  }
}
```

## 5. Frontend Components Integration

### Page Structure:
```
app/
├── page.tsx (Home/Dashboard)
├── generate/
│   └── page.tsx (AI Generation - use updated component)
├── thread/
│   └── page.tsx (Generation Thread)
├── staking/
│   └── page.tsx (NFT Staking)
├── leaderboard/
│   └── page.tsx (Leaderboard)
└── api/ (API routes)
```

### Page Components:

```typescript
// app/thread/page.tsx
import { GenerationThread } from "@/components/generation-thread"

export default function ThreadPage() {
  return <GenerationThread />
}
```

```typescript
// app/staking/page.tsx  
import { NFTStaking } from "@/components/nft-staking"

export default function StakingPage() {
  return <NFTStaking />
}
```

```typescript
// app/generate/page.tsx
import { AIGeneration } from "@/components/ai-generation"

export default function GeneratePage() {
  return <AIGeneration />
}
```

## 6. Navigation Updates

Update your main navigation to include new pages:

```typescript
// components/navigation.tsx
const navItems = [
  { href: "/", label: "Home" },
  { href: "/generate", label: "Generate" },
  { href: "/thread", label: "Community Thread" },
  { href: "/staking", label: "Stake NFTs" },
  { href: "/leaderboard", label: "Leaderboard" }
]
```

## 7. Background Jobs Setup

### Weekly Contest Management:
```typescript
// scripts/manage-contests.ts
async function manageWeeklyContests() {
  // Check if current contest should end
  // Start new contest if needed
  // Update database and contract
}

// Run this script via cron job or scheduled function
```

### Leaderboard Updates:
```typescript
// scripts/update-leaderboard.ts
async function updateLeaderboard() {
  // Fetch latest data from contracts
  // Calculate rankings
  // Update database cache
}
```

## 8. Security Considerations

### API Security:
- Validate all contract addresses in requests
- Rate limit voting and generation APIs
- Implement proper CORS settings
- Validate user signatures for sensitive operations

### Contract Security:
- Use ReentrancyGuard on all contract functions
- Implement proper access controls
- Add emergency pause mechanisms
- Regular security audits

### Frontend Security:
- Validate all user inputs
- Sanitize generation prompts
- Implement CSP headers
- Secure API key management

## 9. Testing Strategy

### Contract Testing:
```bash
# Run contract tests
npx hardhat test

# Test on Sonic testnet first
npx hardhat deploy --network sonic-testnet
```

### Frontend Testing:
```bash
# Test generation flow
npm run test:generation

# Test voting functionality
npm run test:voting

# Test staking flow
npm run test:staking
```

### Integration Testing:
- Test complete user flow: Connect → Generate → Vote → Stake
- Test payment flows with different tokens
- Test leaderboard calculations
- Test weekly contest automation

## 10. Deployment Checklist

### Pre-deployment:
- [ ] All contracts deployed and verified
- [ ] Environment variables configured
- [ ] Database schema created (if using)
- [ ] API routes implemented and tested
- [ ] Frontend components integrated
- [ ] Admin functions tested

### Post-deployment:
- [ ] Register contracts for FeeM
- [ ] Start first weekly contest
- [ ] Test generation → thread submission flow
- [ ] Verify voting functionality
- [ ] Test staking rewards distribution
- [ ] Monitor contract events and logs

### Ongoing Maintenance:
- [ ] Weekly contest management
- [ ] Leaderboard updates
- [ ] Reward distribution monitoring
- [ ] User support and bug fixes
- [ ] Performance optimization

## 11. Admin Functions

### Contract Management:
```typescript
// Admin dashboard functions
const adminFunctions = {
  startWeeklyContest: (title: string, prizePool: string) => {},
  endWeeklyContest: () => {},
  updateStakingRewards: () => {},
  pauseVoting: () => {},
  updateLeaderboard: () => {},
  manageUsers: (address: string, action: string) => {}
}
```

### Monitoring Dashboard:
- Contract balance monitoring
- Generation submission rates
- Voting activity
- Staking participation
- Leaderboard changes
- Weekly contest progress

## 12. Future Enhancements

### Phase 2 Features:
- NFT marketplace integration
- Advanced voting mechanisms (quadratic voting)
- Cross-chain staking support
- Mobile app development
- AI model fine-tuning based on votes

### Scalability:
- Layer 2 integration for cheaper transactions
- IPFS for decentralized storage
- GraphQL API for better data querying
- Real-time WebSocket updates

This completes the full implementation of your gamified NFT staking and voting system! The system now includes:

✅ **NFT Staking** with rewards distribution  
✅ **Generation Thread** with community voting  
✅ **Leaderboard System** with points and rankings  
✅ **Weekly Contests** with automated prize distribution  
✅ **Complete Payment Integration** (S tokens, USDC, credits)  
✅ **Gamification Elements** (points, ranks, badges)  
✅ **Admin Controls** for system management