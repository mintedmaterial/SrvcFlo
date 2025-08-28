# ServiceFlow AI Cloudflare Deployment Guide

## Quick Setup Steps

### 1. Update Your Domain Configuration

Replace `yourdomain.com` in `wrangler.toml` with your actual Cloudflare domain.

### 2. Install Dependencies

```bash
npm install @cloudflare/workers-types wrangler @cloudflare/next-on-pages hono @hono/node-server mongodb
```

### 3. Set Up Cloudflare Resources

```bash
# Login to Cloudflare
npx wrangler login

# Create KV namespace for caching
npx wrangler kv:namespace create CACHE
npx wrangler kv:namespace create CACHE --preview

# Create R2 bucket for file storage
npx wrangler r2 bucket create serviceflow-files

# Create D1 database (optional)
npx wrangler d1 create serviceflow-db
```

### 4. Configure Secrets

```bash
# Set your MongoDB connection string
npx wrangler secret put MONGODB_URI

# Set admin API key for stats access
npx wrangler secret put ADMIN_API_KEY

# Set Agno API key
npx wrangler secret put AGNO_API_KEY
```

### 5. Update wrangler.toml with Resource IDs

After creating resources, update your `wrangler.toml` with the actual IDs:

```toml
name = "serviceflow-ai"
main = "src/index.ts"
compatibility_date = "2024-01-15"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "serviceflow-ai-prod"
route = { pattern = "yourdomain.com/*", zone_name = "yourdomain.com" }

[[kv_namespaces]]
binding = "CACHE"
id = "your_actual_kv_id_here"
preview_id = "your_preview_kv_id_here"

[[r2_buckets]]
binding = "FILES"
bucket_name = "serviceflow-files"

[[d1_databases]]
binding = "DB"
database_name = "serviceflow-db"
database_id = "your_d1_database_id_here"
```

### 6. Deploy to Cloudflare

```bash
# Deploy the worker
npx wrangler deploy

# For Next.js pages (alternative approach)
npm run build:cloudflare
npx wrangler pages deploy .vercel/output/static
```

## Database Models

### Waitlist Collection Schema

```typescript
interface WaitlistEntry {
  _id: ObjectId
  businessName: string
  ownerName: string
  email: string
  phone?: string
  businessType: string
  currentChallenges?: string
  interestedPackage?: string
  estimatedRevenue?: string
  signupDate: Date
  source: string
  status: 'pending' | 'notified' | 'converted' | 'cancelled'
  notified: boolean
  createdAt: Date
  updatedAt: Date
  ipAddress: string
  userAgent: string
  country?: string
  
  // Analytics fields
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  referrer?: string
  
  // Follow-up tracking
  lastContactDate?: Date
  notes?: string[]
  priority: number // 1-5 scoring
}
```

### MongoDB Indexes

```javascript
// Create these indexes in your MongoDB database
db.waitlist.createIndex({ "email": 1 }, { unique: true })
db.waitlist.createIndex({ "status": 1 })
db.waitlist.createIndex({ "businessType": 1 })
db.waitlist.createIndex({ "createdAt": -1 })
db.waitlist.createIndex({ "signupDate": -1 })
db.waitlist.createIndex({ "priority": -1, "createdAt": -1 })
```

## Environment Variables

Create these in your Cloudflare Worker settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/serviceflow_ai` |
| `ADMIN_API_KEY` | Secure key for admin endpoints | `admin_sk_1234567890abcdef` |
| `AGNO_API_KEY` | Your Agno framework API key | `agno_sk_abcdef1234567890` |
| `ENVIRONMENT` | Deployment environment | `production` |

## File Structure

```
src/
├── index.ts              # Main worker entry point
├── routes/
│   ├── waitlist.ts       # Waitlist API handlers
│   ├── api.ts           # Other API routes
│   └── static.ts        # Static file handling
├── lib/
│   ├── database.ts      # Database utilities
│   ├── email.ts         # Email service integration
│   └── analytics.ts     # Analytics helpers
└── types/
    └── bindings.ts      # TypeScript type definitions
```

## API Endpoints

### Waitlist Endpoints

```
POST /api/waitlist
- Add user to waitlist
- Body: { businessName, ownerName, email, businessType, ... }
- Returns: { success, waitlistId, position }

GET /api/waitlist/count
- Get public waitlist count
- Returns: { success, count }

GET /api/waitlist/stats?admin_key=KEY
- Get admin statistics
- Returns: { success, stats: { total, pending, businessTypes, recentSignups } }
```

### Health Check

```
GET /health
- Worker health check
- Returns: { status, timestamp, environment }
```

## Performance Optimizations

### Caching Strategy

```typescript
// Cache waitlist count for 5 minutes
await c.env.CACHE.put('waitlist_count', count.toString(), { 
  expirationTtl: 300 
})

// Cache full stats for admin dashboard
await c.env.CACHE.put('waitlist_stats', JSON.stringify(stats), { 
  expirationTtl: 300 
})
```

### Database Connection Pooling

```typescript
// Implement connection pooling for MongoDB
let cachedClient: MongoClient | null = null

async function getDatabase(mongoUri: string) {
  if (!cachedClient) {
    cachedClient = new MongoClient(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    await cachedClient.connect()
  }
  return cachedClient.db('serviceflow_ai')
}
```

## Monitoring & Analytics

### Custom Analytics Events

```typescript
// Track waitlist conversions
interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
  timestamp: Date
  userId?: string
  sessionId?: string
}

async function trackEvent(event: AnalyticsEvent) {
  // Send to your analytics provider
  // Could be Google Analytics, Mixpanel, etc.
}
```

### Error Monitoring

```typescript
// Integrate with Sentry or similar
app.onError((err, c) => {
  console.error('Worker error:', err)
  // Send to error tracking service
  return c.json({ error: 'Internal server error' }, 500)
})
```

## Security Considerations

### Rate Limiting

```typescript
// Implement rate limiting using KV storage
async function rateLimit(c: Context, key: string, limit: number = 10) {
  const current = await c.env.CACHE.get(`rate_limit:${key}`)
  const count = current ? parseInt(current) : 0
  
  if (count >= limit) {
    return c.json({ error: 'Rate limit exceeded' }, 429)
  }
  
  await c.env.CACHE.put(`rate_limit:${key}`, (count + 1).toString(), {
    expirationTtl: 3600 // 1 hour
  })
}
```

### Input Validation

```typescript
import { z } from 'zod'

const waitlistSchema = z.object({
  businessName: z.string().min(1).max(100),
  ownerName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  businessType: z.enum(['contractor', 'plumber', 'roofer', ...]),
  currentChallenges: z.string().max(1000).optional(),
  interestedPackage: z.string().optional(),
  estimatedRevenue: z.string().optional()
})
```

## Cost Optimization

### Expected Costs at Scale

| Resource | Free Tier | Paid Tier | At 10K Users |
|----------|-----------|-----------|--------------|
| Worker Requests | 100K/day | $0.50/M | ~$1.50/month |
| KV Operations | 1K/day | $0.50/M | ~$2/month |
| R2 Storage | 10GB | $0.015/GB | ~$0.15/month |
| MongoDB Atlas | Free 512MB | $9/month | $9-57/month |

**Total estimated cost: $12-60/month for 10K waitlist users**

## Deployment Commands

```bash
# Development
npm run dev:worker

# Production deployment
npm run deploy:worker

# Monitor logs
npx wrangler tail

# Check worker status
npx wrangler whoami
npx wrangler deployments list
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**
   - Ensure IP whitelist includes `0.0.0.0/0` for Cloudflare Workers
   - Check connection string format
   - Verify database user permissions

2. **KV Namespace Issues**
   - Ensure KV namespace IDs match in wrangler.toml
   - Check binding names are consistent

3. **CORS Issues**
   - Update origin URLs in CORS middleware
   - Ensure proper preflight handling

### Debug Mode

```typescript
// Add debug logging
if (c.env.ENVIRONMENT === 'development') {
  console.log('Debug info:', { body, headers: c.req.header() })
}
```

This setup gives you a production-ready Cloudflare Workers deployment for your ServiceFlow AI waitlist with MongoDB integration, caching, and monitoring capabilities!