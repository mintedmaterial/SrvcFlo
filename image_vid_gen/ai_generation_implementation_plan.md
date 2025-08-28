# AI Generation Platform Implementation Plan

## Overview
This plan outlines the implementation of a comprehensive AI generation platform with multiple user tiers, authentication options, and automated payment flows to KIE.AI via Creem.io SDK.

## User Tiers & Authentication

### 1. Free Users (No Auth Required)
- **Access**: Basic image/video generation with limited quota
- **Features**:
  - 5 free image generations per day
  - 1 free video generation per week
  - Generations appear in feed as "*Redacted*" (no prompt/user info shown)
  - No account creation required
- **Rate Limiting**: IP-based tracking via Cloudflare Workers
- **Storage**: R2 for generated content with TTL (7 days for free tier)

### 2. Authenticated Users (Email + Wallet)
- **Access**: Full feature set with purchased credits
- **Features**:
  - Unlimited generations based on credit balance
  - Full feed visibility with prompts and metadata
  - Credit purchase via Stripe/Link payments
  - Generation history and favorites
- **Auth Options**:
  - Email + password (traditional)
  - Wallet connection (MetaMask, WalletConnect)
  - Social login (Google, GitHub)

### 3. Admin Users (Waitlist → Admin)
- **Access**: Advanced tools + backend agent access
- **Features**:
  - All authenticated user features
  - Admin dashboard access
  - Backend agent routing (SrvcFlo, Agno)
  - Analytics and user management
- **Auth**: Cloudflare Zero Trust + session tokens

## Technical Architecture

### Frontend Components

#### Enhanced AI Generation Page
```typescript
// Enhanced ai-generation.tsx with auth tiers
interface UserTier {
  type: 'free' | 'authenticated' | 'admin';
  credits?: number;
  dailyQuota?: {
    images: number;
    videos: number;
    used: { images: number; videos: number };
  };
}

interface GenerationConfig {
  free: {
    imageCredits: 1;
    videoCredits: 10;
    dailyImageLimit: 5;
    weeklyVideoLimit: 1;
  };
  authenticated: {
    // Based on purchased credits
  };
}
```

#### Feed Privacy Controls
```typescript
interface FeedItem {
  id: string;
  type: 'image' | 'video';
  prompt: string | '*Redacted*';
  userType: 'free' | 'authenticated' | 'admin';
  walletAddress?: string | '*Redacted*';
  walletName?: string | '*Redacted*';
  result: string[];
  creditsUsed: number;
  createdAt: string;
}

// Free users see redacted feed
const feedDisplay = userTier === 'free' 
  ? { ...item, prompt: '*Redacted*', walletAddress: '*Redacted*' }
  : item;
```

### Backend Implementation

#### User Authentication Service
```typescript
// Enhanced auth with multiple options
interface AuthService {
  // Email/password auth
  loginWithEmail(email: string, password: string): Promise<AuthResult>;
  
  // Wallet auth
  loginWithWallet(address: string, signature: string): Promise<AuthResult>;
  
  // Session management
  createSession(userId: string, provider: 'email' | 'wallet'): Promise<string>;
  validateSession(token: string): Promise<User | null>;
}

interface User {
  id: string;
  email?: string;
  walletAddress?: string;
  tier: 'free' | 'authenticated' | 'admin';
  credits: number;
  dailyQuota: DailyQuota;
}
```

#### Credit Management System
```typescript
interface CreditSystem {
  // Check user balance
  getBalance(userId: string): Promise<number>;
  
  // Deduct credits for generation
  deductCredits(userId: string, amount: number): Promise<boolean>;
  
  // Add credits from purchase
  addCredits(userId: string, amount: number, source: 'stripe' | 'link'): Promise<void>;
  
  // Track free tier usage
  trackFreeUsage(ipAddress: string, type: 'image' | 'video'): Promise<boolean>;
}
```

## Payment Flow Architecture

### Option 1: Creem.io Direct Integration (Recommended)

#### Architecture Flow
```
User Purchase → Stripe/Link → Webhook → Credits Added → Generation Request → 
Creem.io Payment → KIE.AI Generation → Store Result → Update Credits
```

#### Implementation
```typescript
// Creem.io integration for KIE.AI payments
import { CreemSDK } from '@creem/typescript-sdk';

class AIGenerationService {
  private creem: CreemSDK;
  
  constructor() {
    this.creem = new CreemSDK({
      apiKey: process.env.CREEM_API_KEY,
      environment: 'production' // or 'sandbox'
    });
  }

  async generateWithKIEAI(prompt: string, type: 'image' | 'video', userId: string) {
    // 1. Calculate cost
    const cost = this.calculateKIECost(type);
    
    // 2. Check user credits
    const userCredits = await this.getUserCredits(userId);
    if (userCredits < cost) throw new Error('Insufficient credits');
    
    // 3. Deduct user credits immediately
    await this.deductCredits(userId, cost);
    
    try {
      // 4. Pay KIE.AI via Creem.io
      const payment = await this.creem.payments.create({
        amount: cost * 100, // cents
        currency: 'usd',
        recipient: 'kie.ai', // KIE.AI's Creem identifier
        metadata: { userId, type, prompt: prompt.substring(0, 100) }
      });
      
      // 5. Call KIE.AI API
      const generation = await this.callKIEAI(prompt, type);
      
      // 6. Store result
      await this.storeGeneration(userId, generation, cost);
      
      return generation;
    } catch (error) {
      // Refund credits on failure
      await this.addCredits(userId, cost);
      throw error;
    }
  }
  
  private calculateKIECost(type: 'image' | 'video'): number {
    return type === 'image' ? 0.02 : 0.10; // USD
  }
}
```

### Option 2: Bulk Pre-funding (Alternative)

#### Architecture Flow
```
User Purchase → Stripe/Link → Credits Pool → Generation Request → 
Deduct from Pool → KIE.AI Generation → Store Result
```

#### Implementation
```typescript
class BulkFundingService {
  async maintainKIEBalance() {
    const currentBalance = await this.getKIEBalance();
    const threshold = 100; // $100 threshold
    
    if (currentBalance < threshold) {
      const topupAmount = 500; // $500 topup
      await this.topupKIEAccount(topupAmount);
    }
  }
  
  async generateWithBulkFunding(prompt: string, type: 'image' | 'video', userId: string) {
    // Similar flow but without per-generation payments
    const cost = this.calculateCost(type);
    await this.deductCredits(userId, cost);
    
    // Direct KIE.AI call (already funded)
    const generation = await this.callKIEAI(prompt, type);
    
    // Track usage for bulk billing
    await this.trackUsage(cost);
    
    return generation;
  }
}
```

## Database Schema

### User Management
```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  wallet_address TEXT UNIQUE,
  tier TEXT CHECK(tier IN ('free', 'authenticated', 'admin')) DEFAULT 'free',
  credits INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  token TEXT UNIQUE,
  provider TEXT CHECK(provider IN ('email', 'wallet', 'cloudflare')),
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily quota tracking
CREATE TABLE daily_quotas (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  ip_address TEXT,
  date DATE,
  images_used INTEGER DEFAULT 0,
  videos_used INTEGER DEFAULT 0,
  UNIQUE(user_id, date),
  UNIQUE(ip_address, date)
);
```

### Generation Tracking
```sql
-- Enhanced generation history
CREATE TABLE generation_history (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  ip_address TEXT,
  user_tier TEXT,
  type TEXT CHECK(type IN ('image', 'video')),
  prompt TEXT,
  prompt_visible BOOLEAN DEFAULT true,
  status TEXT CHECK(status IN ('processing', 'completed', 'failed')),
  result_urls TEXT, -- JSON array
  credits_used INTEGER,
  usd_cost DECIMAL(10,4),
  provider TEXT DEFAULT 'kie.ai',
  provider_transaction_id TEXT,
  creem_payment_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Credit transactions
CREATE TABLE credit_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT CHECK(type IN ('purchase', 'deduction', 'refund')),
  amount INTEGER,
  source TEXT, -- 'stripe', 'link', 'generation'
  reference_id TEXT, -- stripe session, generation id, etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Cloudflare Worker Implementation

### Enhanced Main Worker
```typescript
// Enhanced mcp-standalone.js with new features
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle different user tiers
    const user = await this.authenticateUser(request, env);
    const userTier = this.determineUserTier(user, request);

    switch (true) {
      // Free tier endpoints
      case path === '/api/generate/free/image' && request.method === 'POST':
        return this.handleFreeImageGeneration(request, env);
      
      case path === '/api/generate/free/video' && request.method === 'POST':
        return this.handleFreeVideoGeneration(request, env);

      // Authenticated endpoints
      case path === '/api/generate/image' && request.method === 'POST':
        return this.handleAuthenticatedGeneration(request, env, user, 'image');
      
      case path === '/api/generate/video' && request.method === 'POST':
        return this.handleAuthenticatedGeneration(request, env, user, 'video');

      // Auth endpoints
      case path === '/api/auth/wallet' && request.method === 'POST':
        return this.handleWalletAuth(request, env);
      
      case path === '/api/auth/email' && request.method === 'POST':
        return this.handleEmailAuth(request, env);

      // Credit management
      case path === '/api/credits/purchase' && request.method === 'POST':
        return this.handleCreditPurchase(request, env, user);

      default:
        return env.ASSETS.fetch(request);
    }
  },

  async handleFreeImageGeneration(request: Request, env: Env) {
    const ip = request.headers.get('CF-Connecting-IP');
    const canGenerate = await this.checkFreeQuota(ip, 'image', env);
    
    if (!canGenerate) {
      return new Response(JSON.stringify({
        error: 'Daily limit reached',
        message: 'Free users can generate 5 images per day. Sign up for unlimited generations!',
        upgradeUrl: '/signup'
      }), { status: 429 });
    }

    // Generate with basic settings
    const { prompt } = await request.json();
    const result = await this.generateViaKIE(prompt, 'image', null, ip, env);
    
    return new Response(JSON.stringify({
      success: true,
      result: result.urls,
      message: 'Free generation complete! Sign up for unlimited access.'
    }));
  },

  async handleAuthenticatedGeneration(request: Request, env: Env, user: User, type: 'image' | 'video') {
    const { prompt, settings } = await request.json();
    
    // Check credits
    const cost = this.calculateCost(type, settings);
    if (user.credits < cost) {
      return new Response(JSON.stringify({
        error: 'Insufficient credits',
        required: cost,
        available: user.credits,
        purchaseUrl: '/credits'
      }), { status: 402 });
    }

    // Generate with full settings
    const result = await this.generateViaKIE(prompt, type, user.id, null, env, settings);
    
    return new Response(JSON.stringify({
      success: true,
      result: result.urls,
      creditsUsed: cost,
      newBalance: user.credits - cost
    }));
  }
};
```

## Security & Rate Limiting

### Free Tier Protection
```typescript
class RateLimiter {
  async checkFreeQuota(ip: string, type: 'image' | 'video', env: Env): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const quota = await env.DB.prepare(`
      SELECT images_used, videos_used 
      FROM daily_quotas 
      WHERE ip_address = ? AND date = ?
    `).bind(ip, today).first();

    const limits = { images: 5, videos: 1 };
    const used = quota || { images_used: 0, videos_used: 0 };

    return type === 'image' 
      ? used.images_used < limits.images
      : used.videos_used < limits.videos;
  }

  async incrementQuota(ip: string, type: 'image' | 'video', env: Env) {
    const today = new Date().toISOString().split('T')[0];
    const field = type === 'image' ? 'images_used' : 'videos_used';
    
    await env.DB.prepare(`
      INSERT INTO daily_quotas (ip_address, date, ${field})
      VALUES (?, ?, 1)
      ON CONFLICT(ip_address, date) 
      DO UPDATE SET ${field} = ${field} + 1
    `).bind(ip, today).run();
  }
}
```

## Deployment Strategy

### Phase 1: Core Features (Week 1-2)
1. Enhanced UI with tier-based features
2. Basic authentication (email + wallet)
3. Credit system integration
4. Free tier with IP-based limits

### Phase 2: Payment Integration (Week 3)
1. Stripe/Link payment processing
2. Creem.io SDK integration
3. Automated KIE.AI payments
4. Credit purchase flows

### Phase 3: Advanced Features (Week 4)
1. Admin dashboard enhancements
2. Advanced generation settings
3. Feed privacy controls
4. Analytics and reporting

### Phase 4: Optimization (Week 5)
1. Performance optimization
2. Advanced rate limiting
3. User experience improvements
4. Security hardening

## Recommendations

### Payment Flow: Use Creem.io Direct Integration
- **Pros**: Real-time payments, transparent costs, automatic reconciliation
- **Cons**: Slight complexity increase
- **Implementation**: Each generation triggers a Creem.io payment to KIE.AI

### Authentication: Multi-modal Approach
- **Free**: No auth required (IP tracking)
- **Paid**: Email + Wallet options
- **Admin**: Cloudflare Zero Trust

### Credit Strategy: Hybrid Model
- **Small purchases** (< $50): Direct Creem.io payments
- **Large purchases** (> $50): Bulk pre-funding for better rates

This approach provides maximum flexibility while maintaining cost efficiency and user experience.