-- Initialize admin user and permissions
-- This should be run after the main schema is created

-- Initialize admin user (replace with your actual email)
INSERT OR IGNORE INTO users (
    email, 
    name, 
    status, 
    role, 
    auth_provider,
    created_at
) VALUES (
    'dev-admin@serviceflow.local',
    'ServiceFlow Admin',
    'active',
    'admin',
    'google',
    CURRENT_TIMESTAMP
);

-- Get admin user ID for permissions
-- Grant admin permissions one by one to avoid compound SELECT issues
INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by) 
SELECT id, 'google_agent', id FROM users WHERE email = 'dev-admin@serviceflow.local' AND role = 'admin';

INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by) 
SELECT id, 'x_agent', id FROM users WHERE email = 'dev-admin@serviceflow.local' AND role = 'admin';

INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by) 
SELECT id, 'srvcflo_agent', id FROM users WHERE email = 'dev-admin@serviceflow.local' AND role = 'admin';

INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by) 
SELECT id, 'agno_agent', id FROM users WHERE email = 'dev-admin@serviceflow.local' AND role = 'admin';

INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by) 
SELECT id, 'premium_features', id FROM users WHERE email = 'dev-admin@serviceflow.local' AND role = 'admin';

INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by) 
SELECT id, 'user_management', id FROM users WHERE email = 'dev-admin@serviceflow.local' AND role = 'admin';

INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by) 
SELECT id, 'system_administration', id FROM users WHERE email = 'dev-admin@serviceflow.local' AND role = 'admin';

INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by) 
SELECT id, 'cloudflare_management', id FROM users WHERE email = 'dev-admin@serviceflow.local' AND role = 'admin';

INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by) 
SELECT id, 'human_loop_approval', id FROM users WHERE email = 'dev-admin@serviceflow.local' AND role = 'admin';