-- ServiceFlow AI Authentication Database Schema (Simplified)
-- This schema provides user management, access control, and human-in-the-loop approval for AI agents

-- Main users table with OAuth and role-based access control
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    access_code TEXT UNIQUE,
    status TEXT DEFAULT 'waitlist' CHECK (status IN ('waitlist', 'invited', 'active', 'suspended')),
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium')),
    auth_provider TEXT DEFAULT 'email',
    provider_id TEXT,
    google_refresh_token TEXT,
    google_access_token TEXT,
    token_expires_at DATETIME,
    invited_by TEXT,
    invited_at DATETIME,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User sessions for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Agent access logs and permissions
CREATE TABLE IF NOT EXISTS agent_access_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    action TEXT NOT NULL,
    query TEXT,
    response_summary TEXT,
    requires_approval BOOLEAN DEFAULT FALSE,
    approved BOOLEAN,
    approved_by TEXT,
    approval_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- Human in the loop approval requests
CREATE TABLE IF NOT EXISTS approval_requests (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    admin_id TEXT,
    agent_type TEXT NOT NULL,
    action_type TEXT NOT NULL,
    request_details TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    reason TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME
);

-- User permissions and feature access
CREATE TABLE IF NOT EXISTS user_permissions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    permission TEXT NOT NULL,
    granted_by TEXT,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    UNIQUE(user_id, permission)
);

-- Access codes for waitlist invitations
CREATE TABLE IF NOT EXISTS access_codes (
    code TEXT PRIMARY KEY,
    created_by TEXT NOT NULL,
    used_by TEXT,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    expires_at DATETIME,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME
);

-- Cloudflare Zero Trust rule groups for access control
CREATE TABLE IF NOT EXISTS cloudflare_rule_groups (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT UNIQUE NOT NULL,
    cloudflare_id TEXT UNIQUE,
    description TEXT,
    rules TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cloudflare Zero Trust applications
CREATE TABLE IF NOT EXISTS cloudflare_applications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT UNIQUE NOT NULL,
    cloudflare_id TEXT UNIQUE,
    domain TEXT NOT NULL,
    paths TEXT,
    rule_group_id TEXT,
    session_duration INTEGER DEFAULT 86400,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_user_id ON agent_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);