# Enhanced ServiceFlow AI Implementation
## Updated with Free Tier, Rabby/MetaMask Integration, and Optimized Pricing

## Updated Credit Package Strategy

Based on your existing structure, here's the optimized pricing that gives you better margins:

### KIE.AI vs ServiceFlow Pricing Analysis
```
KIE.AI Baseline: 1000 credits = $5.00
ServiceFlow: 750 credits = $5.00

Your effective rate: $6.67 per 1000 credits
Markup: 33% above KIE.AI base rate
```

### Updated Credit Packages
| Package | Price | Credits | KIE Value | Your Markup |
|---------|-------|---------|-----------|-------------|
| Starter | $5 | 750 | $3.75 | 33% |
| Standard | $50 | 8,000 | $40.00 | 25% |
| Premium | $500 | 100,000 | $500.00 | 0% (volume discount) |
| Enterprise | $1,250 | 265,000 | $1,325.00 | -6% (enterprise discount) |

### Generation Costs (Optimized)
- **Free Tier**: Basic model (cheaper/faster)
- **Paid Tier**: Premium models (GPT-4o, Veo3)

```typescript
const GENERATION_COSTS = {
  // Free tier - basic models
  'free_image': 0, // Free but limited quota
  'free_video': 0, // Free but limited quota
  
  // Paid tier - premium models
  'image_gpt4o_1': 7,    // 1 image variant
  'image_gpt4o_2': 8,    // 2 image variants  
  'image_gpt4o_4': 9,    // 4 image variants
  'video_veo3_16:9': 440,      // Veo3 quality 16:9
  'video_veo3_9:16': 473,      // Veo3 quality 9:16
  'video_veo3_fast_16:9': 88,  // Veo3 fast 16:9
  'video_veo3_fast_9:16': 121, // Veo3 fast 9:16
};
```

## Enhanced Wallet Integration (Rabby + MetaMask)

### Updated Web3 Configuration
```typescript
// Enhanced wagmi config with Rabby support
import { createConfig, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { InjectedConnector } from 'wagmi/connectors/injected'

const sonicMainnet = {
  id: 146,
  name: 'Sonic Mainnet',
  network: 'sonic',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    public: { http: ['https://rpc.soniclabs.com'] },
    default: { http: ['https://rpc.soniclabs.com'] },
  },
  blockExplorers: {
    default: { name: 'SonicScan', url: 'https://sonicscan.org' },
  },
}

const { chains, publicClient } = configureChains(
  [sonicMainnet],
  [publicProvider()]
)

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    // MetaMask
    new MetaMaskConnector({ chains }),
    
    // Rabby (detects as injected wallet)
    new InjectedConnector({
      chains,
      options: {
        name: 'Rabby',
        shimDisconnect: true,
      },
    }),
    
    // WalletConnect fallback
    new WalletConnectConnector({
      chains,
      options: {
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
      },
    }),
  ],
  publicClient,
})

// Rabby detection utility
export const detectRabby = () => {
  if (typeof window !== 'undefined') {
    return !!(window as any).ethereum?.isRabby
  }
  return false
}

// MetaMask detection utility  
export const detectMetaMask = () => {
  if (typeof window !== 'undefined') {
    return !!(window as any).ethereum?.isMetaMask && !(window as any).ethereum?.isRabby
  }
  return false
}
```

## Enhanced Free Tier Implementation

### Free Tier Features & Limits
```typescript
interface FreeTierLimits {
  daily: {
    images: 5;           // 5 free images per day
    videos: 1;           // 1 free video per week
  };
  models: {
    image: 'basic';      // Lower quality/faster model
    video: 'basic';      // Lower quality/faster model
  };
  features: {
    feedVisibility: false;   // Shows as "*Redacted*"
    advancedSettings: false; // No custom parameters
    priorityQueue: false;    // Standard queue
    history: 7;             // 7 days history only
  };
}
```

### Enhanced Worker with Free Tier
```typescript
// Enhanced free tier generation handler
async function handleFreeGeneration(request: Request, env: Env, type: 'image' | 'video') {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const { prompt } = await request.json();
  
  // Check daily quota
  const quotaCheck = await checkFreeQuota(ip, type, env);
  if (!quotaCheck.allowed) {
    return new Response(JSON.stringify({
      error: 'Daily limit reached',
      message: `Free users can generate ${quotaCheck.limit} ${type}s per ${quotaCheck.period}. Upgrade for unlimited access!`,
      used: quotaCheck.used,
      limit: quotaCheck.limit,
      resetTime: quotaCheck.resetTime,
      upgradeUrl: '/auth'
    }), { 
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Use basic model for free tier
  const model = type === 'image' ? 'stable-diffusion-basic' : 'basic-video-gen';
  const taskId = `free_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store generation request with redacted info
  await env.DB.prepare(`
    INSERT INTO generation_history (
      task_id, user_type, generation_type, prompt, prompt_visible, 
      status, credits_used, model_used, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    taskId, 'free', type, prompt, false, 'processing', 0, model
  ).run();
  
  // Increment quota usage
  await incrementFreeQuota(ip, type, env);
  
  // Call basic model API (cheaper endpoint)
  const generation = await callBasicModel(prompt, type, model, env);
  
  return new Response(JSON.stringify({
    success: true,
    taskId: taskId,
    message: `Free ${type} generation started! Upgrade for premium models and unlimited access.`,
    estimatedTime: type === 'image' ? '10-15 seconds' : '30-45 seconds',
    upgradeUrl: '/auth'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function checkFreeQuota(ip: string, type: 'image' | 'video', env: Env) {
  const period = type === 'image' ? 'day' : 'week';
  const limit = type === 'image' ? 5 : 1;
  
  let dateField, used;
  
  if (period === 'day') {
    const today = new Date().toISOString().split('T')[0];
    const result = await env.DB.prepare(`
      SELECT images_used FROM daily_quotas 
      WHERE ip_address = ? AND date = ?
    `).bind(ip, today).first();
    used = result?.images_used || 0;
  } else {
    // Weekly check for videos
    const weekStart = getWeekStart();
    const result = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM generation_history 
      WHERE user_ip = ? AND generation_type = 'video' 
      AND created_at >= ? AND user_type = 'free'
    `).bind(ip, weekStart).first();
    used = result?.count || 0;
  }
  
  return {
    allowed: used < limit,
    used,
    limit,
    period,
    resetTime: period === 'day' ? getTomorrowMidnight() : getNextWeekStart()
  };
}
```

## Enhanced UI Components

### Free Tier vs Paid Comparison
```tsx
// Enhanced AI Generation component with free tier
const FreeTierPrompt = ({ onUpgrade }: { onUpgrade: () => void }) => (
  <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">
          🎁 Free Tier Active
        </h3>
        <p className="text-gray-300 text-sm">
          5 free images daily • 1 free video weekly • Basic models
        </p>
      </div>
      <Button 
        onClick={onUpgrade}
        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
      >
        Upgrade for Premium Models
      </Button>
    </div>
  </div>
);

const WalletSelector = ({ onConnect }: { onConnect: (walletType: string) => void }) => (
  <div className="grid grid-cols-2 gap-4 mb-4">
    <Button
      onClick={() => onConnect('rabby')}
      className="flex items-center gap-3 p-4 border border-gray-600 bg-gray-800 hover:bg-gray-700"
      disabled={!detectRabby()}
    >
      <img src="/rabby-icon.svg" alt="Rabby" className="w-6 h-6" />
      <span>Rabby Wallet</span>
      {!detectRabby() && <span className="text-xs text-gray-400">(Not Installed)</span>}
    </Button>
    
    <Button
      onClick={() => onConnect('metamask')}
      className="flex items-center gap-3 p-4 border border-gray-600 bg-gray-800 hover:bg-gray-700"
      disabled={!detectMetaMask()}
    >
      <img src="/metamask-icon.svg" alt="MetaMask" className="w-6 h-6" />
      <span>MetaMask</span>
      {!detectMetaMask() && <span className="text-xs text-gray-400">(Not Installed)</span>}
    </Button>
  </div>
);
```

## Creem.io Integration Setup

### Creem.io Account Configuration
Once you set up your Creem.io account, here's the integration:

```typescript
// Creem.io SDK integration
import { CreemSDK } from '@creem/typescript-sdk';

class CreemPaymentProcessor {
  private creem: CreemSDK;
  
  constructor(apiKey: string, environment: 'sandbox' | 'production') {
    this.creem = new CreemSDK({
      apiKey,
      environment,
      webhook: {
        secret: process.env.CREEM_WEBHOOK_SECRET,
        endpoint: 'https://your-worker.your-subdomain.workers.dev/api/creem/webhook'
      }
    });
  }

  async payKieAI(amount: number, metadata: GenerationMetadata) {
    try {
      // Create payment to KIE.AI
      const payment = await this.creem.payments.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        recipient: {
          type: 'external',
          details: {
            service: 'kie.ai',
            account: process.env.KIE_AI_CREEM_ACCOUNT_ID
          }
        },
        metadata: {
          generationType: metadata.type,
          userId: metadata.userId,
          taskId: metadata.taskId,
          prompt: metadata.prompt.substring(0, 100)
        },
        reference: `serviceflow_${metadata.taskId}`
      });

      return {
        success: true,
        paymentId: payment.id,
        status: payment.status
      };
    } catch (error) {
      console.error('Creem payment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async handleWebhook(request: Request) {
    const signature = request.headers.get('creem-signature');
    const payload = await request.text();
    
    // Verify webhook signature
    const isValid = this.creem.webhooks.verify(payload, signature);
    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }
    
    const event = JSON.parse(payload);
    
    switch (event.type) {
      case 'payment.completed':
        await this.handlePaymentCompleted(event.data);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(event.data);
        break;
    }
    
    return new Response('OK');
  }
}
```

## Enhanced Generation Cost Structure

### Cost Mapping with Your Markup
```typescript
const GENERATION_COSTS_USD = {
  // KIE.AI API costs (base)
  'image_gpt4o': 0.006,    // $0.006 per image
  'video_veo3': 0.10,      // $0.10 per video
  'image_basic': 0.002,    // $0.002 per basic image
  'video_basic': 0.05,     // $0.05 per basic video
};

const SERVICEFLOW_CREDITS_USD = {
  // Your credit value: $5 / 750 credits = $0.0067 per credit
  creditValue: 0.00667,
  
  // Generation costs in credits (with markup)
  image_premium: Math.ceil(0.006 / 0.00667), // 1 credit
  video_premium: Math.ceil(0.10 / 0.00667),  // 15 credits
  image_basic: 0,    // Free tier
  video_basic: 0,    // Free tier
};

// Automatic cost calculation
function calculateCreditsNeeded(type: string, tier: 'free' | 'premium'): number {
  if (tier === 'free') return 0;
  
  const usdCost = GENERATION_COSTS_USD[`${type}_gpt4o`] || GENERATION_COSTS_USD[`${type}_veo3`];
  return Math.ceil(usdCost / SERVICEFLOW_CREDITS_USD.creditValue);
}
```

## Enhanced Feed Privacy System

### Redacted Feed for Free Users
```typescript
interface FeedItemDisplay {
  id: string;
  type: 'image' | 'video';
  prompt: string | '*Redacted*';
  userInfo: string | '*Anonymous User*';
  tier: 'free' | 'premium' | 'admin';
  result: string[];
  timestamp: string;
  model: string;
}

function formatFeedItem(item: GenerationHistory, viewerTier: string): FeedItemDisplay {
  const isFreeTierGeneration = item.user_type === 'free';
  const canViewDetails = viewerTier !== 'free' || !isFreeTierGeneration;
  
  return {
    id: item.task_id,
    type: item.generation_type,
    prompt: canViewDetails ? item.prompt : '*Redacted*',
    userInfo: canViewDetails ? 
      (item.user_email || item.user_wallet || 'Anonymous User') : 
      '*Anonymous User*',
    tier: item.user_type,
    result: item.result_urls ? JSON.parse(item.result_urls) : [],
    timestamp: item.created_at,
    model: item.model_used || 'unknown'
  };
}
```

## Updated Deployment Checklist

### Environment Setup for Creem.io
```bash
# Add Creem.io credentials
wrangler secret put CREEM_API_KEY
wrangler secret put CREEM_WEBHOOK_SECRET
wrangler secret put KIE_AI_CREEM_ACCOUNT_ID

# Enhanced database schema
wrangler d1 execute your-database --file=enhanced_schema_with_free_tier.sql
```

### Database Schema Updates
```sql
-- Add free tier tracking
CREATE TABLE daily_quotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    date DATE NOT NULL,
    images_used INTEGER DEFAULT 0,
    videos_used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ip_address, date)
);

-- Enhanced generation history
ALTER TABLE generation_history ADD COLUMN user_type TEXT DEFAULT 'authenticated';
ALTER TABLE generation_history ADD COLUMN user_ip TEXT;
ALTER TABLE generation_history ADD COLUMN prompt_visible BOOLEAN DEFAULT true;
ALTER TABLE generation_history ADD COLUMN model_used TEXT;

-- Payment tracking with Creem.io
ALTER TABLE purchase_history ADD COLUMN creem_payment_id TEXT;
ALTER TABLE purchase_history ADD COLUMN kie_ai_cost DECIMAL(10,4);

-- Indexes for performance
CREATE INDEX idx_daily_quotas_ip_date ON daily_quotas(ip_address, date);
CREATE INDEX idx_generation_history_ip ON generation_history(user_ip);
CREATE INDEX idx_generation_history_type ON generation_history(user_type);
```

## Next Steps

1. **Set up Creem.io Account**
   - Create account at creem.io
   - Get API keys and webhook secrets
   - Configure KIE.AI as payment recipient

2. **Enhanced Worker Deployment**
   - Copy the enhanced worker code
   - Set up all environment variables
   - Deploy with free tier support

3. **Frontend Integration**
   - Add Rabby wallet detection
   - Implement free tier UI components
   - Set up wallet selector

4. **Testing Strategy**
   - Test free tier limits (5 images/day, 1 video/week)
   - Test wallet connections (Rabby + MetaMask)
   - Test Creem.io → KIE.AI payment flow
   - Test feed privacy (redacted display)

5. **Production Optimization**
   - Set up monitoring for free tier usage
   - Configure rate limiting
   - Set up Creem.io webhook handling
   - Monitor cost efficiency

## Cost Analysis Summary

**Your Advantage:**
- 33% markup on starter package vs KIE.AI baseline
- Volume discounts on higher tiers
- Free tier acquisition funnel
- Premium model access for paid users

**Revenue Optimization:**
- Free tier → paid conversion tracking
- Creem.io automated payments reduce manual overhead
- Clear cost visibility and control

This enhanced implementation gives you a competitive free tier while maintaining healthy margins on paid tiers, with seamless Rabby/MetaMask integration and automated KIE.AI payments via Creem.io.