# 🚀 Quick Deploy to Cloudflare Workers + D1

## Prerequisites
- Node.js installed
- Cloudflare account
- Domain `srvcflo.com` added to Cloudflare

## 1-Minute Deployment

```bash
# Navigate to project
cd C:\Users\PC\ServiceApp\myserviceprovider-app

# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create serviceflow-waitlist

# Copy the database_id from output and update wrangler.toml
# Replace "your_d1_database_id_here" with your actual database ID

# Initialize database schema
npx wrangler d1 execute serviceflow-waitlist --file=./schema.sql

# Set admin API key
npx wrangler secret put ADMIN_API_KEY
# Enter: admin_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# Build and deploy
npm run build
npx wrangler deploy
```

## 🎉 Your Site Will Be Live At:
- **Primary URL**: `https://srvcflo.com`
- **Worker URL**: `https://serviceflow-ai.your-subdomain.workers.dev`

## 📊 Test Your Waitlist:
- Visit your site
- Fill out the waitlist form
- Check admin stats: `https://srvcflo.com/api/waitlist?admin_key=admin_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

## 🎯 What You Get:
- ✅ Professional landing page
- ✅ Waitlist signup form
- ✅ D1 database storage
- ✅ Real-time counter
- ✅ Admin analytics
- ✅ Global CDN
- ✅ Custom domain

**Total Cost**: $0 (Free tier covers most small businesses)

## 🔧 Update Database ID:
After running `npx wrangler d1 create serviceflow-waitlist`, edit `wrangler.toml` line 20:

```toml
database_id = "your_actual_database_id_here"
```

That's it! Your waitlist is live! 🎉