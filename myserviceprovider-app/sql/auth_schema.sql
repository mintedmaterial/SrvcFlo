-- ServiceFlow AI Authentication Database Schema
-- This schema provides user management, access control, and human-in-the-loop approval for AI agents

-- Main users table with OAuth and role-based access control
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    access_code TEXT UNIQUE,
    status TEXT DEFAULT 'waitlist' CHECK (status IN ('waitlist', 'invited', 'active', 'suspended')),
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium')),
    auth_provider TEXT DEFAULT 'email', -- google, github, email
    provider_id TEXT, -- ID from OAuth provider
    google_refresh_token TEXT, -- For Google API access
    google_access_token TEXT,
    token_expires_at DATETIME,
    invited_by TEXT, -- Admin who sent the invite
    invited_at DATETIME,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User sessions for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    user_id TEXT NOT NULL REFERENCES users(id),
    agent_type TEXT NOT NULL, -- 'srvcflo', 'google', 'x', 'agno'
    action TEXT NOT NULL,
    query TEXT,
    response_summary TEXT,
    requires_approval BOOLEAN DEFAULT FALSE,
    approved BOOLEAN,
    approved_by TEXT REFERENCES users(id),
    approval_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- Human in the loop approval requests
CREATE TABLE IF NOT EXISTS approval_requests (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    admin_id TEXT REFERENCES users(id),
    agent_type TEXT NOT NULL,
    action_type TEXT NOT NULL,
    request_details JSON NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    reason TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME
);

-- User permissions and feature access
CREATE TABLE IF NOT EXISTS user_permissions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL, -- 'google_agent', 'x_agent', 'premium_features', etc.
    granted_by TEXT REFERENCES users(id),
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    UNIQUE(user_id, permission)
);

-- Access codes for waitlist invitations
CREATE TABLE IF NOT EXISTS access_codes (
    code TEXT PRIMARY KEY,
    created_by TEXT NOT NULL REFERENCES users(id),
    used_by TEXT REFERENCES users(id),
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    expires_at DATETIME,
    metadata JSON, -- Can store additional invitation details
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME
);

-- Cloudflare Zero Trust rule groups for access control
CREATE TABLE IF NOT EXISTS cloudflare_rule_groups (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT UNIQUE NOT NULL,
    cloudflare_id TEXT UNIQUE, -- ID from Cloudflare API
    description TEXT,
    rules JSON NOT NULL, -- Store include/exclude/require rules
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cloudflare Zero Trust applications
CREATE TABLE IF NOT EXISTS cloudflare_applications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT UNIQUE NOT NULL,
    cloudflare_id TEXT UNIQUE, -- ID from Cloudflare API
    domain TEXT NOT NULL,
    paths JSON, -- Array of protected paths
    rule_group_id TEXT REFERENCES cloudflare_rule_groups(id),
    session_duration INTEGER DEFAULT 86400, -- 24 hours in seconds
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Update existing waitlist table to reference users
-- ALTER TABLE waitlist ADD COLUMN user_id TEXT REFERENCES users(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_access_code ON users(access_code);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_agent_logs_user_id ON agent_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON agent_access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_type ON agent_access_logs(agent_type);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_admin ON approval_requests(admin_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_user ON approval_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_access_codes_expires ON access_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_cloudflare_rule_groups_name ON cloudflare_rule_groups(name);
CREATE INDEX IF NOT EXISTS idx_cloudflare_applications_domain ON cloudflare_applications(domain);

-- Initialize admin user (replace with your actual email)
INSERT OR IGNORE INTO users (
    email, 
    name, 
    status, 
    role, 
    auth_provider,
    created_at
) VALUES (
    'your-admin-email@gmail.com',
    'ServiceFlow Admin',
    'active',
    'admin',
    'google',
    CURRENT_TIMESTAMP
);

-- Grant all permissions to admin
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
) permissions
WHERE u.email = 'your-admin-email@gmail.com' AND u.role = 'admin';

-- Initialize default Cloudflare rule groups
INSERT OR IGNORE INTO cloudflare_rule_groups (name, description, rules) VALUES 
    ('Public Access', 'Allow everyone to access public routes', '{"include": [{"everyone": {}}], "exclude": [], "require": []}'),
    ('ServiceFlow Admin', 'Admin access for ServiceFlow AI team', '{"include": [{"email": {"email": "your-admin-email@gmail.com"}}], "exclude": [], "require": []}'),
    ('Premium Users', 'Users with premium access', '{"include": [{"group": {"name": "premium"}}], "exclude": [], "require": []}'),
    ('Active Users', 'Users with active status', '{"include": [{"group": {"name": "active"}}], "exclude": [], "require": []}'
);

-- Initialize default Cloudflare applications
INSERT OR IGNORE INTO cloudflare_applications (name, domain, paths, rule_group_id, session_duration) VALUES
    ('Public ServiceFlow', 'srvcflo.com', '["/", "/api/waitlist", "/api/blog", "/api/chat"]', 
     (SELECT id FROM cloudflare_rule_groups WHERE name = 'Public Access'), 3600),
    ('Admin Dashboard', 'srvcflo.com', '["/dashboard/*", "/api/admin/*", "/mcp/*", "/agent-builder/*"]', 
     (SELECT id FROM cloudflare_rule_groups WHERE name = 'ServiceFlow Admin'), 86400),
    ('Premium Portal', 'srvcflo.com', '["/portal/*", "/api/premium/*"]', 
     (SELECT id FROM cloudflare_rule_groups WHERE name = 'Premium Users'), 43200);

-- Sample data for testing (remove in production)
-- INSERT OR IGNORE INTO users (email, name, status, role, auth_provider) VALUES
--     ('test@example.com', 'Test User', 'active', 'user', 'google'),
--     ('premium@example.com', 'Premium User', 'active', 'premium', 'google');

-- Grant basic permissions to test users
-- INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by)
-- SELECT u.id, 'google_agent', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
-- FROM users u WHERE u.email IN ('test@example.com', 'premium@example.com');