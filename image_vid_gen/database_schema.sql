-- Database schema for ServiceFlow AI Generation features
-- Run these SQL commands in your Cloudflare D1 database

-- User credits table
CREATE TABLE IF NOT EXISTS user_credits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    credits INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Generation history table
CREATE TABLE IF NOT EXISTS generation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT UNIQUE NOT NULL,
    user_email TEXT NOT NULL,
    generation_type TEXT NOT NULL, -- 'image' or 'video'
    prompt TEXT NOT NULL,
    model TEXT,
    aspect_ratio TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    result_urls TEXT, -- JSON string of result URLs
    credits_used INTEGER,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_email) REFERENCES user_credits(email)
);

-- Purchase history table
CREATE TABLE IF NOT EXISTS purchase_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    package_id TEXT NOT NULL,
    payment_method TEXT NOT NULL, -- 'stripe', 'crypto'
    amount_usd DECIMAL(10,2),
    credits_purchased INTEGER,
    stripe_session_id TEXT,
    crypto_tx_hash TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_email) REFERENCES user_credits(email)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_credits_email ON user_credits(email);
CREATE INDEX IF NOT EXISTS idx_generation_history_user_email ON generation_history(user_email);
CREATE INDEX IF NOT EXISTS idx_generation_history_task_id ON generation_history(task_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_status ON generation_history(status);
CREATE INDEX IF NOT EXISTS idx_purchase_history_user_email ON purchase_history(user_email);
CREATE INDEX IF NOT EXISTS idx_purchase_history_status ON purchase_history(status);

-- Insert some sample data (optional, for testing)
-- INSERT INTO user_credits (email, credits) VALUES ('test@example.com', 1000);