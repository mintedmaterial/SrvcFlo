-- Enhanced ServiceFlow AI Database Schema with Web3 Integration
-- This schema includes web3 features, blockchain transactions, NFT staking, and AI content storage

-- Extend users table for web3 support
ALTER TABLE users ADD COLUMN wallet_address TEXT;
ALTER TABLE users ADD COLUMN preferred_chain_id INTEGER DEFAULT 64165; -- Sonic testnet
ALTER TABLE users ADD COLUMN thirdweb_account_id TEXT;
ALTER TABLE users ADD COLUMN web3_auth_nonce TEXT;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium', 'master_admin'));

-- Create index for wallet addresses
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_chain_id ON users(preferred_chain_id);

-- Blockchain transactions tracking
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    chain_id INTEGER NOT NULL,
    tx_hash TEXT NOT NULL,
    contract_address TEXT,
    action TEXT NOT NULL, -- 'nft_stake', 'sonic_payment', 'token_transfer', etc.
    amount TEXT, -- Store as string to handle large numbers
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    metadata JSON,
    block_number INTEGER,
    gas_used INTEGER,
    gas_price TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_blockchain_tx_user ON blockchain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON blockchain_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_chain ON blockchain_transactions(chain_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_contract ON blockchain_transactions(contract_address);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_status ON blockchain_transactions(status);

-- NFT staking system
CREATE TABLE IF NOT EXISTS nft_stakes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    wallet_address TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    token_id TEXT NOT NULL,
    chain_id INTEGER NOT NULL DEFAULT 64165,
    tx_hash TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unstaked', 'expired')),
    rewards_earned TEXT DEFAULT '0', -- Accumulated rewards as string
    staked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    unstaked_at DATETIME,
    last_reward_claim DATETIME,
    metadata JSON -- Store additional NFT metadata
);

CREATE INDEX IF NOT EXISTS idx_nft_stakes_user ON nft_stakes(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_stakes_wallet ON nft_stakes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nft_stakes_contract ON nft_stakes(contract_address);
CREATE INDEX IF NOT EXISTS idx_nft_stakes_status ON nft_stakes(status);
CREATE INDEX IF NOT EXISTS idx_nft_stakes_token ON nft_stakes(contract_address, token_id);

-- Sonic blockchain payments
CREATE TABLE IF NOT EXISTS sonic_payments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    wallet_address TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    amount TEXT NOT NULL, -- Amount in SONIC tokens as string
    service_type TEXT NOT NULL, -- 'credits', 'premium', 'nft_mint', etc.
    tx_hash TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    credits_granted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_sonic_payments_user ON sonic_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_sonic_payments_wallet ON sonic_payments(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sonic_payments_tx ON sonic_payments(tx_hash);
CREATE INDEX IF NOT EXISTS idx_sonic_payments_status ON sonic_payments(status);

-- Enhanced user credits with web3 support
ALTER TABLE user_credits ADD COLUMN wallet_address TEXT;
ALTER TABLE user_credits ADD COLUMN chain_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_user_credits_wallet ON user_credits(wallet_address);

-- AI-generated content with R2 storage
CREATE TABLE IF NOT EXISTS ai_generations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    task_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(id),
    wallet_address TEXT, -- For web3 users
    generation_type TEXT NOT NULL CHECK (generation_type IN ('image', 'video', 'audio')),
    prompt TEXT NOT NULL,
    model_used TEXT, -- Which AI model was used
    r2_key TEXT NOT NULL, -- R2 storage key
    public_url TEXT NOT NULL, -- Public URL for generated content
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    file_size INTEGER, -- File size in bytes
    duration INTEGER, -- For video/audio content in seconds
    resolution TEXT, -- e.g., '1024x1024' for images
    credits_used INTEGER NOT NULL DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    metadata JSON, -- Additional generation metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_user ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_wallet ON ai_generations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_ai_generations_task ON ai_generations(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type ON ai_generations(generation_type);
CREATE INDEX IF NOT EXISTS idx_ai_generations_status ON ai_generations(status);
CREATE INDEX IF NOT EXISTS idx_ai_generations_public ON ai_generations(is_public);

-- File uploads and R2 storage tracking
CREATE TABLE IF NOT EXISTS file_uploads (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    r2_key TEXT NOT NULL,
    original_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    bucket_name TEXT NOT NULL,
    public_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    upload_source TEXT DEFAULT 'manual', -- 'manual', 'ai_generation', 'nft_metadata'
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accessed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_file_uploads_user ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_bucket ON file_uploads(bucket_name);
CREATE INDEX IF NOT EXISTS idx_file_uploads_key ON file_uploads(r2_key);
CREATE INDEX IF NOT EXISTS idx_file_uploads_public ON file_uploads(is_public);

-- Smart contract interactions tracking
CREATE TABLE IF NOT EXISTS contract_interactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    wallet_address TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    method_name TEXT NOT NULL,
    parameters JSON,
    tx_hash TEXT NOT NULL,
    gas_estimate INTEGER,
    gas_used INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_interactions_user ON contract_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_interactions_wallet ON contract_interactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_contract_interactions_contract ON contract_interactions(contract_address);
CREATE INDEX IF NOT EXISTS idx_contract_interactions_tx ON contract_interactions(tx_hash);

-- Voting system for governance
CREATE TABLE IF NOT EXISTS governance_votes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    wallet_address TEXT NOT NULL,
    proposal_id TEXT NOT NULL,
    vote_choice TEXT NOT NULL CHECK (vote_choice IN ('for', 'against', 'abstain')),
    voting_power TEXT NOT NULL DEFAULT '1', -- NFT-based voting power
    tx_hash TEXT,
    signature TEXT, -- Off-chain signature for gasless voting
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_governance_votes_user ON governance_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_governance_votes_proposal ON governance_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_governance_votes_wallet ON governance_votes(wallet_address);

-- Thirdweb integration data
CREATE TABLE IF NOT EXISTS thirdweb_accounts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    wallet_address TEXT NOT NULL,
    account_address TEXT NOT NULL, -- Smart account address
    chain_id INTEGER NOT NULL,
    factory_address TEXT NOT NULL,
    is_deployed BOOLEAN DEFAULT FALSE,
    deployment_tx TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deployed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_thirdweb_accounts_user ON thirdweb_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_thirdweb_accounts_wallet ON thirdweb_accounts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_thirdweb_accounts_address ON thirdweb_accounts(account_address);

-- Web3 session management for persistent connections
CREATE TABLE IF NOT EXISTS web3_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    wallet_address TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    session_key TEXT NOT NULL,
    permissions JSON, -- What the session can do
    expires_at DATETIME NOT NULL,
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_web3_sessions_user ON web3_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_web3_sessions_wallet ON web3_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_web3_sessions_key ON web3_sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_web3_sessions_expires ON web3_sessions(expires_at);

-- Token balances and portfolio tracking
CREATE TABLE IF NOT EXISTS token_balances (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    wallet_address TEXT NOT NULL,
    token_address TEXT, -- NULL for native tokens
    chain_id INTEGER NOT NULL,
    token_symbol TEXT NOT NULL,
    token_name TEXT,
    balance TEXT NOT NULL DEFAULT '0', -- Token balance as string
    decimals INTEGER DEFAULT 18,
    usd_value TEXT DEFAULT '0',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_token_balances_user ON token_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_token_balances_wallet ON token_balances(wallet_address);
CREATE INDEX IF NOT EXISTS idx_token_balances_token ON token_balances(token_address, chain_id);
CREATE INDEX IF NOT EXISTS idx_token_balances_updated ON token_balances(last_updated);

-- Initialize master admin with web3 support
INSERT OR REPLACE INTO users (
    email, 
    name, 
    wallet_address,
    status, 
    role, 
    auth_provider,
    preferred_chain_id,
    created_at
) VALUES (
    'serviceflowagi@gmail.com',
    'ServiceFlow Master Admin',
    NULL, -- Will be set when wallet is connected
    'active',
    'master_admin',
    'google',
    64165, -- Sonic testnet
    CURRENT_TIMESTAMP
);

-- Grant all permissions to master admin
INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by) 
SELECT 
    u.id,
    permission,
    u.id
FROM users u, (
    SELECT 'google_agent' as permission
    UNION SELECT 'x_agent'
    UNION SELECT 'srvcflo_agent'
    UNION SELECT 'agno_agent'
    UNION SELECT 'premium_features'
    UNION SELECT 'user_management'
    UNION SELECT 'system_administration'
    UNION SELECT 'cloudflare_management'
    UNION SELECT 'human_loop_approval'
    UNION SELECT 'web3_management'
    UNION SELECT 'nft_staking'
    UNION SELECT 'sonic_payments'
    UNION SELECT 'ai_generation'
    UNION SELECT 'r2_storage'
    UNION SELECT 'thirdweb_integration'
) permissions
WHERE u.email = 'serviceflowagi@gmail.com' AND u.role = 'master_admin';

-- Initialize some sample NFT contracts on Sonic testnet
INSERT OR IGNORE INTO contract_interactions (
    user_id, 
    wallet_address, 
    contract_address, 
    chain_id, 
    method_name, 
    parameters, 
    tx_hash, 
    status,
    created_at
) VALUES 
(
    (SELECT id FROM users WHERE email = 'serviceflowagi@gmail.com'),
    '0x0000000000000000000000000000000000000000',
    '0x1234567890123456789012345678901234567890', -- Placeholder NFT contract
    64165,
    'deploy',
    '{"name": "ServiceFlow AI NFT", "symbol": "SFAI"}',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    'success',
    CURRENT_TIMESTAMP
);

-- Create sample R2 bucket configuration
INSERT OR IGNORE INTO file_uploads (
    user_id,
    r2_key,
    original_name,
    content_type,
    file_size,
    bucket_name,
    public_url,
    is_public,
    upload_source,
    metadata,
    created_at
) VALUES (
    (SELECT id FROM users WHERE email = 'serviceflowagi@gmail.com'),
    'system/readme.txt',
    'ServiceFlow AI System README',
    'text/plain',
    1024,
    'AI_CONTENT',
    'https://pub-your-account-hash.r2.dev/serviceflow-ai-content/system/readme.txt',
    TRUE,
    'manual',
    '{"description": "System configuration file", "version": "1.0"}',
    CURRENT_TIMESTAMP
);

-- Sample AI generation for testing
INSERT OR IGNORE INTO ai_generations (
    task_id,
    user_id,
    generation_type,
    prompt,
    model_used,
    r2_key,
    public_url,
    status,
    file_size,
    resolution,
    credits_used,
    is_public,
    metadata,
    created_at,
    completed_at
) VALUES (
    'demo_img_001',
    (SELECT id FROM users WHERE email = 'serviceflowagi@gmail.com'),
    'image',
    'A futuristic AI-powered service platform with blockchain integration',
    '@cf/black-forest-labs/flux-1-schnell',
    'generated/images/demo/sample.jpg',
    'https://pub-your-account-hash.r2.dev/serviceflow-ai-content/generated/images/demo/sample.jpg',
    'completed',
    524288, -- 512KB
    '1024x1024',
    10,
    TRUE,
    '{"model_version": "1.0", "seed": 12345}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Trigger to update last_used for web3_sessions
CREATE TRIGGER IF NOT EXISTS update_web3_session_last_used 
AFTER UPDATE ON web3_sessions
BEGIN
    UPDATE web3_sessions 
    SET last_used = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Trigger to update token balance timestamps
CREATE TRIGGER IF NOT EXISTS update_token_balance_timestamp
AFTER UPDATE ON token_balances
BEGIN
    UPDATE token_balances 
    SET last_updated = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;