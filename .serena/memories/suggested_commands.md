# ServiceApp Development Commands (Updated January 2025)

## System Commands (Windows/Git Bash)
- **Directory listing**: `dir` or `ls`
- **Change directory**: `cd`
- **Find files**: `dir /s /b *.extension` or `find . -name "*.extension"`
- **Search content**: `findstr "pattern" files` or `grep -r "pattern" .`
- **Copy files**: `copy source destination` or `cp source destination`

## Git Commands
- **Status**: `git status`
- **Add changes**: `git add .` or `git add filename`
- **Commit**: `git commit -m "message"`
- **Push**: `git push origin branch-name`
- **Pull**: `git pull origin branch-name`
- **Branch**: `git checkout -b new-branch`
- **View changes**: `git diff`

## Agent-UI Development (agent-ui/) - NEW COMPONENT
- **Install dependencies**: `pnpm install`
- **Development server**: `pnpm dev` (runs on port 3000)
- **Build**: `pnpm build`
- **Production**: `pnpm start`
- **Code quality**:
  - Lint: `pnpm lint` (fix: `pnpm lint:fix`)
  - Format: `pnpm format` (fix: `pnpm format:fix`) 
  - Type check: `pnpm typecheck`
  - Validate all: `pnpm validate`
- **Clean**: `pnpm clean` (clear build cache)

### Agent-UI Specific Commands
- **Connect to agents**: Automatic connection to `../myserviceprovider-app/Agents/playground.py`
- **Agent builder**: Navigate to `/agent-builder` route
- **Playground**: Navigate to `/playground` route
- **Tool configuration**: Access via agent builder interface

## Main App Development (myserviceprovider-app/)
- **Install dependencies**: `npm install`
- **Development server**: `npm run dev`
- **Build**: `npm run build`
- **Static build**: `npm run build:static`
- **Production**: `npm start`
- **Lint**: `npm run lint`
- **Type check**: `npm run type-check`

### Enhanced Cloudflare Commands
- **Deploy worker**: `npm run deploy:worker`
- **Dev worker**: `npm run dev:worker`
- **Deploy with secrets**: `npm run deploy:full`
- **Direct wrangler**: `npx wrangler deploy`
- **Tail logs**: `npx wrangler tail`
- **Check deployment**: `npx wrangler whoami`

### Smart Contract Development (Enhanced)
- **Compile contracts**: `npm run contracts:compile`
- **Pre-deployment check**: `npm run contracts:check`
- **Deploy testnet**: `npm run contracts:testnet`
- **Deploy mainnet**: `npm run contracts:deploy`
- **Verify contracts**: `npm run contracts:verify`
- **Deploy all**: `npm run contracts:deploy-all`
- **Test contracts**: `npm run contracts:test`
- **Sonic testnet**: `npm run sonic:testnet`
- **Check balances**: `npm run contracts:balance`

## Python Agents Development (myserviceprovider-app/Agents/)
- **Install dependencies**: `uv sync` or `pip install -r requirements.txt`
- **Run playground**: `python playground.py` (connects to agent-ui)
- **Run HTTP agent**: `python http_srvcflo_agent.py`
- **Test agents**: `python test_*.py`
- **Start MCP servers**: Individual MCP server startup

### Enhanced Agent Scripts (Windows batch files)
- **Run HTTP agent**: `run_http_agent.bat`
- **Run with uv**: `run_uv_http_agent.bat`
- **Run playground with uv**: `run_uv_playground.bat`
- **Fix venv issues**: `fix_venv_issue.bat`
- **Start all agents**: `start_all_agents.bat`
- **Kill agent processes**: `kill_agents.bat`

### Agent-Specific Commands
- **Content Agent**: `python content_agent.py`
- **Facebook Agent**: `python facebook_agent.py`
- **Google Agent**: `python google_agent.py`
- **Cloudflare Agent**: `python cloudflare_agent.py`

## AI Provider Testing (NEW)
- **Test Gemini Direct**: `node test-gemini-direct.js`
- **Test Gemini Text**: `node test-gemini-text.js`
- **Test Groq**: `node test-groq-real.js`
- **Test Video Generation**: `node test-real-video.js`
- **Run all tests**: `node run-tests.js`
- **Test API integration**: `node test-api-integration.js`

## Database Management
- **MongoDB**: 
  - Start service: `net start MongoDB` (Windows)
  - Connect: MongoDB Compass or `mongo` CLI
  - Backup: `mongodump --db serviceflo`
- **SQLite**: 
  - Files in `tmp/` directories
  - Browser tools: DB Browser for SQLite
  - CLI: `sqlite3 database.db`

## Payment & Blockchain Testing
- **Setup Stripe products**: `node setup-stripe-products.js`
- **Test Sonic payments**: `npm run test:payments`
- **Deploy payment contracts**: `npm run contracts:deploy-payments`
- **Test NFT staking**: `npm run test:staking`
- **Validate testnet**: `npm run sonic:validate`

## Environment & Configuration
- **Root package setup**: `npm install` (in ServiceApp root)
- **Environment check**: `node check-env.js`
- **Secrets deployment**: `deploy-secrets.bat`
- **Configuration validation**: `npm run validate:config`

## Documentation & Content
- **Generate docs**: `npm run docs:generate`
- **Build blog content**: `npm run blog:build`
- **Update README**: `npm run docs:readme`
- **Validate links**: `npm run docs:validate`

## Development Tools & Utilities
- **Code formatting**: `npm run format` (or `pnpm format` in agent-ui)
- **Dependency audit**: `npm audit` or `pnpm audit`
- **Update dependencies**: `npm update` or `pnpm update`
- **Clean installs**: `npm ci` or `pnpm install --frozen-lockfile`

## Production Deployment
- **Full deployment**: `npm run deploy:production`
- **Deploy frontend**: `npm run deploy:frontend`
- **Deploy contracts**: `npm run deploy:contracts`
- **Deploy workers**: `npm run deploy:workers`
- **Health check**: `npm run health:check`

## Monitoring & Debugging
- **View logs**: `npm run logs:view`
- **Performance monitoring**: `npm run monitor:performance`
- **Error tracking**: `npm run logs:errors`
- **Resource usage**: `npm run monitor:resources`

## Quick Development Workflows

### Starting Development Environment
```bash
# Terminal 1 - Agent UI
cd agent-ui
pnpm dev

# Terminal 2 - Main App
cd myserviceprovider-app
npm run dev

# Terminal 3 - Python Agents
cd myserviceprovider-app/Agents
python playground.py

# Terminal 4 - Cloudflare Worker (if needed)
cd myserviceprovider-app
npm run dev:worker
```

### Testing Workflow
```bash
# Run all AI provider tests
node run-tests.js

# Test smart contracts
cd myserviceprovider-app
npm run contracts:test

# Test payment flow
npm run test:payments

# Validate agent connections
cd Agents
python test_agent_connections.py
```

### Deployment Workflow
```bash
# 1. Test locally
npm run test:full

# 2. Deploy to testnet
npm run contracts:testnet

# 3. Validate payments
npm run sonic:validate

# 4. Deploy frontend
npm run deploy:frontend

# 5. Deploy workers
npm run deploy:workers
```

## Emergency Commands
- **Stop all services**: `npm run stop:all`
- **Restart development**: `npm run restart:dev`
- **Rollback deployment**: `npm run rollback:latest`
- **Emergency maintenance**: `npm run maintenance:on`