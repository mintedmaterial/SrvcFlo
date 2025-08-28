# Cloudflare INFT Deployment Guide

## 🚀 Quick Start - Deploy to Staging

### Prerequisites
1. **Cloudflare Account** with Workers plan
2. **Wrangler CLI** installed (`npm install -g wrangler`)
3. **Authentication** with Cloudflare (`wrangler login`)

### 1. Setup Resources (One-time)

Run the setup script to create all necessary Cloudflare resources:

```bash
cd C:\Users\PC\ServiceApp\myserviceprovider-app
node scripts/setup-cloudflare-deployment.js staging
```

This will create:
- R2 buckets for content storage
- KV namespaces for caching
- D1 databases for data storage
- Update wrangler.toml with resource IDs

### 2. Configure API Keys

Set the required environment variables:

```bash
# Essential for testing (use test keys initially)
npx wrangler secret put OPENAI_API_KEY --env staging
npx wrangler secret put CLOUDFLARE_API_TOKEN --env staging
npx wrangler secret put ADMIN_API_KEY --env staging

# Optional for advanced features
npx wrangler secret put GEMINI_API_KEY --env staging
```

### 3. Deploy to Staging

```bash
# Type check and deploy
npm run deploy:staging
```

Your INFT system will be available at:
**https://serviceflow-ai-staging.serviceflowagi.workers.dev**

### 4. Test the Deployment

Visit the health check endpoint:
```
https://serviceflow-ai-staging.serviceflowagi.workers.dev/health
```

You should see:
```json
{
  "success": true,
  "service": "INFT Agent System",
  "version": "1.0.0",
  "environment": "staging",
  "endpoints": {
    "agents": "/api/inft/agent/{agentId}",
    "generate": "/api/inft/generate/",
    "test": "/test/"
  }
}
```

## 🧪 Testing with Mock Data

### Create Test Agent
```bash
curl -X POST https://serviceflow-ai-staging.serviceflowagi.workers.dev/test/agents \
  -H "Content-Type: application/json" \
  -d '{"packageType": 2}'
```

### Generate Test Content
```bash
curl -X POST https://serviceflow-ai-staging.serviceflowagi.workers.dev/test/generate \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "test-agent-001",
    "prompt": "Beautiful sunset landscape",
    "isVideo": false
  }'
```

### Check Agent Status
```bash
curl https://serviceflow-ai-staging.serviceflowagi.workers.dev/test/agents/test-agent-001
```

## 📊 Available Test Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/test/agents` | GET | List all test agents |
| `/test/agents` | POST | Create test agent |
| `/test/agents/{id}` | GET | Get specific agent |
| `/test/generate` | POST | Create test generation |
| `/test/generations/{id}` | GET | Get generation status |
| `/test/collaborate` | POST | Test collaboration |
| `/test/stats` | GET | System statistics |

## 🔧 Local Development

### Start Local Development Server
```bash
npm run dev:inft
```

This runs Wrangler in local mode with:
- Local Durable Objects
- Mock R2/KV/D1 bindings
- Hot reloading

Access locally at: **http://localhost:8787**

### Local Testing Commands
```bash
# Test health endpoint
curl http://localhost:8787/health

# Create local test agent
curl -X POST http://localhost:8787/test/agents \
  -H "Content-Type: application/json" \
  -d '{"packageType": 1}'

# Test generation
curl -X POST http://localhost:8787/test/generate \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "test-agent-001",
    "prompt": "Test generation",
    "isVideo": false
  }'
```

## 🌐 Production Deployment

### 1. Setup Production Resources
```bash
node scripts/setup-cloudflare-deployment.js production
```

### 2. Configure Production Secrets
```bash
npx wrangler secret put OPENAI_API_KEY --env production
npx wrangler secret put CLOUDFLARE_API_TOKEN --env production
npx wrangler secret put GEMINI_API_KEY --env production
npx wrangler secret put ADMIN_API_KEY --env production
```

### 3. Update Contract Addresses
Edit `wrangler.toml` and replace placeholder contract addresses:
```toml
INFT_PACKAGES_CONTRACT = "0x[YOUR_DEPLOYED_CONTRACT]"
INFT_GENERATED_NFT_CONTRACT = "0x[YOUR_DEPLOYED_CONTRACT]"
INFT_MARKETPLACE_CONTRACT = "0x[YOUR_DEPLOYED_CONTRACT]"
```

### 4. Deploy to Production
```bash
npm run deploy:production
```

Access at: **https://srvcflo.com**

## 🔍 Monitoring & Debugging

### View Logs
```bash
# Real-time logs
npx wrangler tail --env staging

# Production logs
npx wrangler tail --env production
```

### Debug Common Issues

#### 1. "Durable Object not found"
- Ensure Durable Objects are deployed: `npm run deploy:staging`
- Check wrangler.toml has correct bindings

#### 2. "API key not configured"
- Set secrets: `npx wrangler secret put OPENAI_API_KEY --env staging`
- Verify with: `npx wrangler secret list --env staging`

#### 3. "R2 bucket not found"
- Run setup script: `node scripts/setup-cloudflare-deployment.js staging`
- Check buckets exist: `npx wrangler r2 bucket list`

#### 4. Type errors
- Run type check: `npx tsc --project tsconfig.workers.json --noEmit`
- Install types: `npm install @cloudflare/workers-types --save-dev`

### Performance Monitoring
- Use Cloudflare Analytics dashboard
- Monitor Durable Object usage and billing
- Check R2 bandwidth and storage costs

## 📋 Environment Comparison

| Feature | Local | Staging | Production |
|---------|-------|---------|------------|
| **URL** | localhost:8787 | serviceflow-ai-staging.workers.dev | srvcflo.com |
| **Test Endpoints** | ✅ | ✅ | ❌ |
| **Real AI APIs** | Mock | Optional | Required |
| **Blockchain** | Mock | Sonic Mainnet | Sonic Mainnet |
| **Storage** | Memory | R2/KV/D1 | R2/KV/D1 |
| **Analytics** | None | Basic | Full |

## 🎯 Next Steps After Deployment

1. **Frontend Integration**: Update your React app to use the new API endpoints
2. **WebSocket Testing**: Test real-time agent communication
3. **Blockchain Integration**: Connect with deployed INFT contracts
4. **Load Testing**: Validate performance under load
5. **Monitoring Setup**: Configure alerts and dashboards

## 🆘 Support & Troubleshooting

### Common Commands
```bash
# Check deployment status
npx wrangler deployments list --env staging

# View environment variables
npx wrangler secret list --env staging

# Rollback deployment
npx wrangler rollback --env staging

# Delete resources (if needed)
npx wrangler r2 bucket delete serviceflow-ai-content-staging
npx wrangler kv:namespace delete --namespace-id {id}
```

### Resource Cleanup
```bash
# Delete staging resources
npx wrangler r2 bucket delete serviceflow-ai-content-staging
npx wrangler r2 bucket delete serviceflow-user-uploads-staging
# ... repeat for other buckets and namespaces
```

The INFT system is now ready for deployment and testing! 🚀