# ServiceFlow Agent-UI Railway Deployment Guide

## Overview
This guide covers deploying the complete ServiceFlow Agent-UI system to Railway, including both the agent infrastructure and the Next.js UI application.

## Architecture
- **Agent System**: Python-based Agno framework with specialized agents
- **UI Application**: Next.js React application for agent interaction
- **Multi-Service**: Both agent backend and UI frontend in single deployment
- **Health Checks**: Built-in health monitoring for Railway

## Pre-Deployment Checklist

### 1. Environment Variables
Copy variables from `.env.railway` template to Railway environment:

**Required:**
- `AGNO_API_KEY` - Core agent framework
- `OPENAI_API_KEY` - AI model access
- `CHAINGPT_API_KEY` - Smart contract auditing
- `CLOUDFLARE_RAG_TOKEN` - Documentation search

**Optional (for full functionality):**
- `DISCORD_BOT_TOKEN` - Discord integration
- `X_API_KEY` - Twitter/X integration
- `GOOGLE_CLIENT_ID` - Google services
- `FACEBOOK_ACCESS_TOKEN` - Facebook integration

### 2. Database Setup
Railway will auto-provision PostgreSQL and set `DATABASE_URL`

### 3. Domain Configuration
Railway will provide domain: `your-app.railway.app`

## Deployment Process

### Method 1: Railway CLI
```bash
cd /path/to/ServiceApp/agent-ui
railway login
railway link
railway up
```

### Method 2: GitHub Integration
1. Push agent-ui to GitHub repository
2. Connect Railway to GitHub repo
3. Select agent-ui directory as root
4. Deploy automatically on push

## Service Architecture

### Port Configuration
- **Main Port (8080)**: Health check and service management
- **UI Port (3000)**: Next.js application interface
- **Agent System**: Background processes

### Startup Sequence
1. Install Node.js dependencies
2. Build Next.js application
3. Start UI server on port 3000
4. Start agent playground system
5. Start health check server on port 8080

## Agent System Features

### Available Agents
- **Auditooor Agent**: Smart contract auditing and generation
- **Cloudflare RAG Agent**: Documentation search and analysis
- **Ecosystem Analyst**: DeFi and blockchain analysis
- **NFT Market Analyst**: NFT marketplace monitoring
- **Google Agent**: Gmail and Calendar integration
- **Discord Integration**: Community management

### Agent Tools
- OpenZeppelin contract generation
- ChainGPT security auditing
- DuckDuckGo search capabilities
- Social media posting (X, Discord, Facebook)
- DALL-E image generation
- Document processing and RAG search

## UI Application Features

### Agent Interface
- Chat-based agent interaction
- Real-time agent responses
- Agent tool execution
- File upload and processing

### Agent Management
- Agent status monitoring
- Tool configuration
- Workflow management
- Results visualization

## Health Monitoring

### Health Check Endpoint
- **URL**: `https://your-app.railway.app/health`
- **Response**: Service status and port information
- **Timeout**: 300 seconds
- **Auto-restart**: On failure

### Monitoring Points
- Next.js application status
- Agent system health
- Database connectivity
- External API availability

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js/Python dependency conflicts
   - Verify environment variables are set
   - Review build logs for missing packages

2. **Agent Import Errors**
   - Ensure all agent dependencies in requirements.txt
   - Check Python path and module imports
   - Verify MCP tool availability

3. **UI Not Loading**
   - Check Next.js build completed successfully
   - Verify port 3000 is accessible
   - Review browser console for errors

4. **Database Connection Issues**
   - Confirm DATABASE_URL is set by Railway
   - Check PostgreSQL service status
   - Verify connection string format

### Deployment Logs
```bash
railway logs --deployment
railway logs --build
```

### Environment Check
```bash
railway variables
```

## Scaling and Performance

### Resource Requirements
- **Memory**: 2GB minimum (4GB recommended)
- **CPU**: 1 vCPU minimum
- **Storage**: 1GB for application, additional for database

### Performance Optimization
- Next.js static optimization enabled
- Agent system async processing
- Database connection pooling
- Resource cleanup on shutdown

## Security Considerations

### Environment Variables
- Never commit secrets to repository
- Use Railway environment variables for all sensitive data
- Rotate API keys regularly

### Network Security
- HTTPS enforced by Railway
- CORS configured for allowed origins
- Health check endpoint only exposes basic status

### Data Protection
- Agent conversations logged securely
- Database connections encrypted
- File uploads validated and sanitized

## Maintenance

### Updates
1. Update dependencies in requirements.txt and package.json
2. Test locally before deployment
3. Deploy via Railway CLI or GitHub push
4. Monitor health checks and logs

### Backup
- Database: Railway auto-backup enabled
- Code: Version controlled in Git
- Environment: Document variable changes

## Support

For deployment issues:
1. Check Railway deployment logs
2. Review this guide for common solutions
3. Verify environment variable configuration
4. Test agent functionality locally first

## Railway Configuration Files

- `railway.json` - Deployment configuration
- `start.sh` - Multi-service startup script
- `requirements.txt` - Python dependencies
- `package.json` - Node.js dependencies
- `.railwayignore` - Exclude unnecessary files
- `.env.railway` - Environment template