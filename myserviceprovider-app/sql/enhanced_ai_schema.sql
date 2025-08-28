-- Enhanced ServiceFlow AI Database Schema
-- Supports image/video generation, credits, payments, and wallet authentication

-- Enhanced user credits table with wallet support
CREATE TABLE IF NOT EXISTS user_credits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    wallet_address TEXT,
    auth_method TEXT NOT NULL DEFAULT 'email', -- 'email' or 'wallet'
    credits INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email),
    UNIQUE(wallet_address)
);

-- Wallet authentication sessions
CREATE TABLE IF NOT EXISTS wallet_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT NOT NULL,
    nonce TEXT NOT NULL,
    session_token TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Generation history table (enhanced)
CREATE TABLE IF NOT EXISTS generation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT UNIQUE NOT NULL,
    user_email TEXT,
    user_wallet TEXT,
    generation_type TEXT NOT NULL, -- 'image' or 'video'
    prompt TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    result_urls TEXT, -- JSON array of result URLs
    credits_used INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- Purchase history table (enhanced)
CREATE TABLE IF NOT EXISTS purchase_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT,
    user_wallet TEXT,
    package_id TEXT NOT NULL, -- 'starter', 'standard', 'premium', 'enterprise'
    payment_method TEXT NOT NULL, -- 'stripe' or 'crypto'
    amount_usd DECIMAL(10,2),
    amount_crypto DECIMAL(18,8),
    crypto_currency TEXT, -- 'USDC', 'wS', 'FeeM'
    transaction_hash TEXT,
    credits_purchased INTEGER,
    stripe_session_id TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Credit packages definition
CREATE TABLE IF NOT EXISTS credit_packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    fiat_credits INTEGER NOT NULL,
    crypto_credits INTEGER NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default credit packages
INSERT OR REPLACE INTO credit_packages (id, name, price_usd, fiat_credits, crypto_credits, description) VALUES
('starter', 'Starter', 5.00, 750, 900, 'Perfect for trying out AI generation'),
('standard', 'Standard', 50.00, 8000, 9600, 'Great for regular content creation'),
('premium', 'Premium', 500.00, 100000, 120000, 'For heavy content creators'),
('enterprise', 'Enterprise', 1250.00, 265000, 318000, 'Enterprise-level generation volume');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_email ON user_credits(email);
CREATE INDEX IF NOT EXISTS idx_user_credits_wallet ON user_credits(wallet_address);
CREATE INDEX IF NOT EXISTS idx_generation_history_user_email ON generation_history(user_email);
CREATE INDEX IF NOT EXISTS idx_generation_history_user_wallet ON generation_history(user_wallet);
CREATE INDEX IF NOT EXISTS idx_generation_history_task_id ON generation_history(task_id);
CREATE INDEX IF NOT EXISTS idx_wallet_sessions_address ON wallet_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_sessions_token ON wallet_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_purchase_history_email ON purchase_history(user_email);
CREATE INDEX IF NOT EXISTS idx_purchase_history_wallet ON purchase_history(user_wallet);
CREATE INDEX IF NOT EXISTS idx_purchase_history_status ON purchase_history(status);