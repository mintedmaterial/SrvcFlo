# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-27-agent-ui-debug-auth-system/spec.md

> Created: 2025-08-27
> Version: 1.0.0

## Existing Storage Structure

### SQLite Databases (C:\Users\PC\ServiceApp\agent-ui\Agents\tmp)
The agent-ui system currently uses SQLite for temporary and session-based storage:

**Current SQLite Files:**
- `agent_sessions.db` - Agent session tracking and state management
- `agents.db` - Agent configuration and metadata  
- `cloudflare_agents.db` - Cloudflare-specific agent data
- `content_team.db` - Content creation team agent data
- `posting_test.db` - Social media posting test data
- `publishers.db` - Content publishing agent data
- `researchers.db` - Research agent data and findings
- `social.db` - Social media integration data
- `srvcflo.db` - ServiceFlow-specific agent operations
- `test.db` - Development and testing data

### MongoDB Collections (C:\Users\PC\ServiceApp\agent-ui\Agents\storage)
Persistent data storage using MongoDB for long-term agent memory and analytics:

**Current MongoDB Structure:**
- Agent memory databases for persistent conversation history
- User interaction logs and analytics
- Agent performance metrics and optimization data
- Cross-agent communication and workflow state

## Required Schema Enhancements

### Authentication Integration Tables

**SQLite: auth_sessions.db**
```sql
CREATE TABLE wallet_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT UNIQUE NOT NULL,
    session_token TEXT NOT NULL,
    nft_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE nft_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    token_id TEXT,
    verification_status TEXT NOT NULL,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_address) REFERENCES wallet_sessions(wallet_address)
);
```

**MongoDB: user_auth_collection**
```javascript
{
  _id: ObjectId,
  walletAddress: String,
  nftHoldings: [{
    contractAddress: String,
    tokenIds: [String],
    verifiedAt: Date,
    metadata: Object
  }],
  authLevel: String, // 'team', 'user', 'admin'
  permissions: [String],
  createdAt: Date,
  lastLogin: Date
}
```

### Token Consumption Tracking

**SQLite: token_usage.db**  
```sql
CREATE TABLE token_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT NOT NULL,
    transaction_type TEXT NOT NULL, -- 'mint_agent', 'generate_image', 'vote', etc.
    token_amount INTEGER NOT NULL,
    agent_id TEXT,
    transaction_hash TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending'
);

CREATE TABLE agent_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    cost_tokens INTEGER NOT NULL,
    wallet_address TEXT NOT NULL,
    execution_time INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### iNFT Agent Registry

**MongoDB: inft_agents_collection**
```javascript
{
  _id: ObjectId,
  contractAddress: String,
  tokenId: String,
  owner: String, // wallet address
  agentType: String, // 'social', 'image_gen', 'eco_monitor'
  configuration: {
    name: String,
    description: String,
    parameters: Object,
    permissions: [String]
  },
  performance: {
    votesReceived: Number,
    rewardsEarned: Number,
    tasksCompleted: Number,
    rating: Number
  },
  mintedAt: Date,
  lastActive: Date,
  status: String // 'active', 'paused', 'retired'
}
```

## Migration Requirements

### Data Retention Policies
- **SQLite (tmp/)**: Implement 30-day retention for session data, 7-day for test data
- **MongoDB (storage/)**: Maintain permanent agent memory with performance archiving after 1 year
- **Backup Strategy**: Daily SQLite dumps, MongoDB replica sets for redundancy

### Index Requirements
```sql
-- SQLite Indexes
CREATE INDEX idx_wallet_sessions_address ON wallet_sessions(wallet_address);
CREATE INDEX idx_token_transactions_wallet ON token_transactions(wallet_address);
CREATE INDEX idx_agent_operations_agent ON agent_operations(agent_id);
```

```javascript
// MongoDB Indexes
db.user_auth_collection.createIndex({ "walletAddress": 1 })
db.inft_agents_collection.createIndex({ "owner": 1, "status": 1 })
db.inft_agents_collection.createIndex({ "agentType": 1, "performance.rating": -1 })
```

## Database Connectivity Configuration

### SQLite Configuration
- Connection pooling for concurrent agent operations
- WAL mode for improved performance during heavy usage
- Backup procedures for critical session and transaction data

### MongoDB Configuration  
- Connection string management for development and production
- Database sharding preparation for scaling agent operations
- Aggregation pipelines for analytics and reporting