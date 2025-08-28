# ServiceFlow AI Authentication Setup Guide

This guide walks you through setting up Cloudflare Zero Trust Authentication for ServiceFlow AI, with support for both development and production environments.

## 🚀 Quick Start

### Development Setup
```bash
# 1. Set up development environment
node scripts/deploy-dev.js setup

# 2. Start development server
node scripts/deploy-dev.js start
# OR
npm run dev:start

# 3. Test the API endpoints
npm run dev:test
```

### Production Deployment
```bash
# 1. Set environment variables
export NODE_ENV=production
export CLOUDFLARE_ACCOUNT_ID=your-account-id
export CLOUDFLARE_API_TOKEN=your-api-token
export ADMIN_EMAIL=your-admin@email.com

# 2. Deploy to production
node scripts/deploy-auth.js
```

## 📋 Prerequisites

### Required Environment Variables

**For Development:**
- `ADMIN_EMAIL` - Your development admin email

**For Production:**
- `NODE_ENV=production`
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Access permissions
- `ADMIN_EMAIL` - Your admin email address
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### Required Tools
- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with Zero Trust enabled

## 🏗️ Architecture Overview

### Authentication Flow
1. **Public Routes** - No authentication required
   - `/` - Homepage
   - `/api/waitlist` - Waitlist signup
   - `/api/chat` - Public chat
   - `/blog/*` - Blog posts

2. **Admin Routes** - Require admin authentication
   - `/dashboard/*` - Admin dashboard
   - `/api/admin/*` - Admin API endpoints
   - `/mcp/*` - MCP tools
   - `/agent-builder/*` - Agent builder

3. **User Routes** - Require user authentication + permissions
   - `/api/agents/*` - Agent interactions
   - `/portal/*` - User portal (premium users)

### Database Schema
The authentication system uses the following main tables:
- `users` - User accounts and roles
- `user_sessions` - Active sessions
- `user_permissions` - Granular permissions
- `agent_access_logs` - Audit trail
- `approval_requests` - Human-in-the-loop approvals
- `cloudflare_rule_groups` - Access rule management
- `cloudflare_applications` - Application configurations

## 🛠️ Development Workflow

### Step 1: Initialize Development Environment
```bash
node scripts/deploy-dev.js setup
```

This will:
- Create local D1 databases
- Set up development admin user
- Create development configuration files
- Generate test scripts

### Step 2: Start Development Server
```bash
node scripts/deploy-dev.js start
```

The development server:
- Runs on `http://localhost:8787`
- Uses local D1 databases
- Bypasses Cloudflare Access for testing
- Automatically creates admin user

### Step 3: Test Development Setup
```bash
npm run dev:test
```

This runs automated tests against:
- Public endpoints
- Admin endpoints
- Authentication flow
- Database operations

### Step 4: Clean Up Development Files
```bash
node scripts/deploy-dev.js clean
```

## 🚀 Production Deployment

### Step 1: Set Environment Variables
```bash
# Required for production
export NODE_ENV=production
export CLOUDFLARE_ACCOUNT_ID=your-account-id
export CLOUDFLARE_API_TOKEN=your-api-token
export ADMIN_EMAIL=your-admin@email.com

# OAuth credentials
export GOOGLE_CLIENT_ID=your-google-client-id
export GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 2: Configure Google OAuth

In the Cloudflare Zero Trust Dashboard:
1. Go to Settings → Authentication → Login methods
2. Click "Add new" → Google
3. Configure with your OAuth credentials:
   - Client ID: `YOUR_GOOGLE_CLIENT_ID`
   - Client Secret: `YOUR_GOOGLE_CLIENT_SECRET`
   - Scopes: `openid email profile`
   - For admin access, add: `https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly`

### Step 3: Deploy Authentication System
```bash
node scripts/deploy-auth.js
```

This will:
1. Initialize production databases
2. Create Cloudflare rule groups and applications
3. Deploy the authenticated worker
4. Set up required secrets
5. Test the deployment

### Step 4: Manual Configuration

After deployment, manually configure in Cloudflare Dashboard:
1. **Verify rule groups** are created correctly
2. **Test authentication flow** on your domain
3. **Configure session duration** as needed
4. **Set up monitoring** and alerts

## 🔐 Authentication Configuration

### Rule Groups Created

1. **Public Access**
   - Allows everyone
   - Applied to public routes

2. **ServiceFlow Admin**
   - Restricted to admin email
   - Applied to admin routes

3. **Premium Users**
   - Based on email domain or groups
   - Applied to premium features

### Access Applications

1. **Public ServiceFlow**
   - Domain: `srvcflo.com`
   - Paths: `/`, `/api/waitlist`, `/api/blog`, `/api/chat`
   - Policy: Allow everyone

2. **Admin Dashboard**
   - Domain: `srvcflo.com`
   - Paths: `/dashboard/*`, `/api/admin/*`, `/mcp/*`
   - Policy: Admin only
   - Session: 24 hours

## 🧪 Testing the Setup

### Manual Testing URLs

**Public Access (no auth required):**
- https://srvcflo.com/
- https://srvcflo.com/api/chat

**Admin Access (requires auth):**
- https://srvcflo.com/dashboard
- https://srvcflo.com/cdn-cgi/access/get-identity

### Automated Testing
```bash
# Development
npm run dev:test

# Production (requires manual setup)
node scripts/test-prod-api.js
```

### Verification Checklist

- [ ] Public routes accessible without authentication
- [ ] Admin routes redirect to Google OAuth
- [ ] Identity endpoint returns user info after login
- [ ] Database queries work correctly
- [ ] Agent permissions are enforced
- [ ] Human-in-the-loop approvals function
- [ ] Session management works
- [ ] Logout redirects properly

## 🔧 Troubleshooting

### Common Issues

**1. "Authentication required" on public routes**
- Check rule group configuration
- Verify application path patterns
- Ensure public access policy is correct

**2. "Admin access required" for admin user**
- Verify admin email in rule group
- Check user exists in database
- Confirm OAuth token contains correct email

**3. Development server not starting**
- Run `wrangler auth login`
- Check D1 database exists locally
- Verify wrangler.toml configuration

**4. Database connection errors**
- Run database initialization: `node scripts/deploy-auth.js database`
- Check D1 binding in wrangler.toml
- Verify schema was applied correctly

### Debug Commands

```bash
# Check database contents
wrangler d1 execute serviceflow-waitlist --command="SELECT * FROM users;" --local

# Test Cloudflare API connection
node scripts/cloudflare-auth-setup.js test

# Verify worker deployment
wrangler dev --local

# Check logs
wrangler tail --env=production
```

## 🚨 Security Considerations

### Production Security
- Use strong, unique API tokens
- Regularly rotate OAuth secrets
- Monitor access logs
- Set appropriate session timeouts
- Enable audit logging

### Development Security  
- Use separate OAuth app for development
- Don't use production data in development
- Clean up development files before production
- Use local databases only

## 📈 Monitoring and Maintenance

### Recommended Monitoring
- Failed authentication attempts
- API rate limits
- Database query performance
- Session durations
- Permission escalations

### Regular Maintenance
- Rotate API tokens quarterly
- Review and update user permissions
- Clean up expired sessions
- Monitor and archive access logs
- Update OAuth configurations as needed

## 🆘 Support

If you encounter issues:

1. **Check logs** - Use `wrangler tail` for real-time logs
2. **Review configuration** - Verify all environment variables
3. **Test locally** - Use development setup to isolate issues
4. **Check Cloudflare status** - Verify Zero Trust service status
5. **Consult documentation** - Cloudflare Zero Trust docs

### Useful Resources
- [Cloudflare Zero Trust Documentation](https://developers.cloudflare.com/cloudflare-one/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)