# ServiceFlow AI - Cloudflare Workers + D1 Deployment

## Quick Start

Your landing page with waitlist functionality is ready for Cloudflare Workers deployment using D1 database. Follow these steps:

### 1. Install Dependencies

```bash
npm install
```

### 2. Update Domain Configuration

Your domain `srvcflo.com` is already configured in `wrangler.toml`.

### 3. Set Up Cloudflare D1 Database

```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create serviceflow-waitlist

# This will output something like:
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
# Copy this ID and update it in wrangler.toml
```

### 4. Update wrangler.toml with D1 Database ID

Edit `wrangler.toml` and replace `your_d1_database_id_here` with the actual database ID from step 3.

### 5. Initialize Database Schema

```bash
# Run the schema to create tables
npx wrangler d1 execute serviceflow-waitlist --file=./schema.sql
```

### 6. Configure Cloudflare Secrets

```bash
# Set admin API key for stats access
npx wrangler secret put ADMIN_API_KEY

# Optional: Set Agno API key if using AI features
npx wrangler secret put AGNO_API_KEY
```

### 7. Deploy to Cloudflare Workers

```bash
# Build the Next.js static site
npm run build

# Deploy the worker with static assets
npx wrangler deploy
```

### 8. Test Your Deployment

- Visit your deployed domain: `https://srvcflo.com`
- Test the waitlist signup form
- Verify database entries are being created in D1

## Features Implemented

✅ **Landing Page with Waitlist**
- Professional landing page design
- Waitlist signup form with validation
- Real-time waitlist counter
- Business type categorization
- Lead qualification fields

✅ **API Endpoints**
- `POST /api/waitlist` - Add users to waitlist
- `GET /api/waitlist` - Get public waitlist count
- `GET /api/waitlist?admin_key=KEY` - Admin statistics

✅ **Database Schema**
- Complete waitlist entry tracking
- Priority scoring system
- Analytics fields (UTM, referrer, etc.)
- Contact tracking capabilities

## Next Steps

1. **Update Domain**: Replace `yourdomain.com` in wrangler.toml
2. **Set Up Analytics**: Configure tracking for marketing campaigns
3. **Email Integration**: Add email notifications for new signups
4. **Admin Dashboard**: Build interface to manage waitlist
5. **A/B Testing**: Test different messaging and conversion rates

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ADMIN_API_KEY` | Secure key for admin endpoints | `admin_sk_1234567890abcdef` |
| `AGNO_API_KEY` | Your Agno framework API key | `agno_sk_abcdef1234567890` |
| `ENVIRONMENT` | Deployment environment | `production` |

## D1 Database Schema

The waitlist table includes:
- Business and owner information
- Contact details (email, phone)
- Business type and challenges
- Package interest and revenue estimates
- Signup tracking (date, source, status)
- Analytics data (IP, user agent, UTM parameters)
- Priority scoring for lead qualification

## Support

For deployment issues, check the main deployment guide at `/deployment-guide.md` or contact support.