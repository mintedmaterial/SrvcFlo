// Cloudflare Zero Trust Authentication Setup Script
// This script creates rule groups and access applications for ServiceFlow AI

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

// Configuration - Update these with your actual values
const CONFIG = {
    ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || 'your-account-id',
    API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || 'your-api-token',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'your-admin-email@gmail.com',
    DOMAIN: 'srvcflo.com'
};

// Helper function to make Cloudflare API requests
async function cloudflareAPI(endpoint, method = 'GET', data = null) {
    const url = `${CLOUDFLARE_API_BASE}${endpoint}`;
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${CONFIG.API_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    console.log(`Making ${method} request to: ${url}`);
    const response = await fetch(url, options);
    const result = await response.json();

    if (!result.success) {
        console.error('Cloudflare API Error:', result);
        throw new Error(`API Error: ${result.errors?.[0]?.message || 'Unknown error'}`);
    }

    return result.result;
}

// Step 1: Create Rule Groups
async function createRuleGroups() {
    console.log('🔐 Creating Cloudflare Access Rule Groups...');

    const ruleGroups = [
        {
            name: 'Public Access',
            include: [{ everyone: {} }],
            exclude: [],
            require: [],
            is_default: false
        },
        {
            name: 'ServiceFlow Admin',
            include: [
                {
                    email: {
                        email: CONFIG.ADMIN_EMAIL
                    }
                }
            ],
            exclude: [],
            require: [],
            is_default: false
        },
        {
            name: 'Premium Users',
            include: [
                {
                    email_domain: {
                        domain: 'serviceflow.ai'
                    }
                }
            ],
            exclude: [],
            require: [],
            is_default: false
        }
    ];

    const createdGroups = {};

    for (const group of ruleGroups) {
        try {
            console.log(`Creating rule group: ${group.name}`);
            const result = await cloudflareAPI(
                `/accounts/${CONFIG.ACCOUNT_ID}/access/groups`,
                'POST',
                group
            );
            createdGroups[group.name] = result.id;
            console.log(`✅ Created rule group "${group.name}" with ID: ${result.id}`);
        } catch (error) {
            console.error(`❌ Failed to create rule group "${group.name}":`, error.message);
        }
    }

    return createdGroups;
}

// Step 2: Create Access Applications
async function createAccessApplications(ruleGroups) {
    console.log('🚀 Creating Cloudflare Access Applications...');

    const applications = [
        {
            name: 'Public ServiceFlow',
            domain: CONFIG.DOMAIN,
            type: 'self_hosted',
            session_duration: '1h',
            auto_redirect_to_identity: false,
            enable_binding_cookie: false,
            custom_deny_message: 'Access denied to ServiceFlow AI',
            custom_deny_url: `https://${CONFIG.DOMAIN}/access-denied`,
            policies: [
                {
                    name: 'Public Access Policy',
                    decision: 'allow',
                    include: [{ everyone: {} }],
                    exclude: [],
                    require: []
                }
            ],
            cors_headers: {
                allow_all_origins: true,
                allow_credentials: true,
                allow_all_methods: true,
                allow_all_headers: true,
                max_age: 86400
            }
        },
        {
            name: 'ServiceFlow Admin Dashboard',
            domain: CONFIG.DOMAIN,
            type: 'self_hosted',
            session_duration: '24h',
            auto_redirect_to_identity: true,
            enable_binding_cookie: true,
            custom_deny_message: 'Admin access required for ServiceFlow AI Dashboard',
            custom_deny_url: `https://${CONFIG.DOMAIN}/admin-access-denied`,
            policies: [
                {
                    name: 'Admin Access Policy',
                    decision: 'allow',
                    include: [
                        {
                            group: {
                                id: ruleGroups['ServiceFlow Admin']
                            }
                        }
                    ],
                    exclude: [],
                    require: []
                }
            ],
            cors_headers: {
                allow_all_origins: false,
                allowed_origins: [`https://${CONFIG.DOMAIN}`],
                allow_credentials: true,
                allow_all_methods: true,
                allow_all_headers: true,
                max_age: 86400
            }
        }
    ];

    const createdApps = {};

    for (const app of applications) {
        try {
            console.log(`Creating access application: ${app.name}`);
            
            // First create the application
            const appResult = await cloudflareAPI(
                `/accounts/${CONFIG.ACCOUNT_ID}/access/apps`,
                'POST',
                {
                    name: app.name,
                    domain: app.domain,
                    type: app.type,
                    session_duration: app.session_duration,
                    auto_redirect_to_identity: app.auto_redirect_to_identity,
                    enable_binding_cookie: app.enable_binding_cookie,
                    custom_deny_message: app.custom_deny_message,
                    custom_deny_url: app.custom_deny_url,
                    cors_headers: app.cors_headers
                }
            );

            createdApps[app.name] = appResult.id;
            console.log(`✅ Created application "${app.name}" with ID: ${appResult.id}`);

            // Then create policies for the application
            for (const policy of app.policies) {
                try {
                    const policyResult = await cloudflareAPI(
                        `/accounts/${CONFIG.ACCOUNT_ID}/access/apps/${appResult.id}/policies`,
                        'POST',
                        policy
                    );
                    console.log(`✅ Created policy "${policy.name}" for "${app.name}"`);
                } catch (error) {
                    console.error(`❌ Failed to create policy "${policy.name}":`, error.message);
                }
            }

        } catch (error) {
            console.error(`❌ Failed to create application "${app.name}":`, error.message);
        }
    }

    return createdApps;
}

// Step 3: Set up path-based access rules
async function setupPathBasedAccess(applications) {
    console.log('🛡️ Setting up path-based access rules...');

    const pathRules = [
        {
            app: 'Public ServiceFlow',
            paths: ['/', '/api/waitlist', '/api/blog', '/api/chat', '/blog/*'],
            description: 'Public routes that everyone can access'
        },
        {
            app: 'ServiceFlow Admin Dashboard', 
            paths: ['/dashboard/*', '/api/admin/*', '/mcp/*', '/agent-builder/*', '/admin/*'],
            description: 'Admin-only routes requiring authentication'
        }
    ];

    // Note: Cloudflare Access doesn't have a direct "path rules" API
    // Path-based access is handled through the application configuration
    // and URL patterns in the dashboard or through more specific applications

    for (const rule of pathRules) {
        console.log(`📋 Path rule for ${rule.app}:`);
        console.log(`   Paths: ${rule.paths.join(', ')}`);
        console.log(`   Description: ${rule.description}`);
    }

    console.log('ℹ️  Path-based rules are configured through application domain patterns');
    console.log('   Configure these manually in the Cloudflare dashboard if needed');
}

// Step 4: Update wrangler.toml with authentication settings
async function updateWranglerConfig() {
    console.log('📝 Updating wrangler.toml with authentication settings...');

    const authConfig = `
# Cloudflare Zero Trust Authentication Settings
[env.production.vars]
CLOUDFLARE_ACCESS_TEAM_NAME = "serviceflow-ai"
CLOUDFLARE_ACCESS_AUDIENCE = "serviceflow-audience"
ADMIN_EMAIL = "${CONFIG.ADMIN_EMAIL}"
AUTH_ENABLED = "true"

# Add these secrets using: wrangler secret put <SECRET_NAME>
# CLOUDFLARE_API_TOKEN
# GOOGLE_CLIENT_ID  
# GOOGLE_CLIENT_SECRET
`;

    console.log('Add the following to your wrangler.toml:');
    console.log(authConfig);
}

// Step 5: Test the setup
async function testAuthSetup() {
    console.log('🧪 Testing authentication setup...');

    try {
        // Test getting rule groups
        const groups = await cloudflareAPI(`/accounts/${CONFIG.ACCOUNT_ID}/access/groups`);
        console.log(`✅ Found ${groups.length} rule groups`);

        // Test getting applications
        const apps = await cloudflareAPI(`/accounts/${CONFIG.ACCOUNT_ID}/access/apps`);
        console.log(`✅ Found ${apps.length} access applications`);

        console.log('🎉 Authentication setup test completed successfully!');
        
        return {
            groups: groups.length,
            applications: apps.length,
            success: true
        };
    } catch (error) {
        console.error('❌ Authentication setup test failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Main setup function
async function setupCloudflareAuth() {
    console.log('🚀 Starting Cloudflare Zero Trust Authentication Setup for ServiceFlow AI');
    console.log('='.repeat(80));

    try {
        // Validate configuration
        if (!CONFIG.ACCOUNT_ID || CONFIG.ACCOUNT_ID === 'your-account-id') {
            throw new Error('Please set CLOUDFLARE_ACCOUNT_ID environment variable');
        }
        if (!CONFIG.API_TOKEN || CONFIG.API_TOKEN === 'your-api-token') {
            throw new Error('Please set CLOUDFLARE_API_TOKEN environment variable');
        }

        console.log(`Account ID: ${CONFIG.ACCOUNT_ID}`);
        console.log(`Domain: ${CONFIG.DOMAIN}`);
        console.log(`Admin Email: ${CONFIG.ADMIN_EMAIL}`);
        console.log('');

        // Step 1: Create rule groups
        const ruleGroups = await createRuleGroups();
        console.log('');

        // Step 2: Create access applications
        const applications = await createAccessApplications(ruleGroups);
        console.log('');

        // Step 3: Setup path-based access
        await setupPathBasedAccess(applications);
        console.log('');

        // Step 4: Update wrangler config
        await updateWranglerConfig();
        console.log('');

        // Step 5: Test the setup
        const testResult = await testAuthSetup();
        console.log('');

        if (testResult.success) {
            console.log('🎉 Cloudflare Zero Trust Authentication setup completed successfully!');
            console.log('');
            console.log('Next steps:');
            console.log('1. Configure Google OAuth in Cloudflare Zero Trust Dashboard');
            console.log('2. Update your worker code with authentication verification');
            console.log('3. Test the authentication flow on your domain');
            console.log('4. Set up monitoring and logging for access attempts');
        } else {
            console.log('❌ Setup completed with errors. Please check the logs above.');
        }

        return {
            success: testResult.success,
            ruleGroups,
            applications,
            testResult
        };

    } catch (error) {
        console.error('💥 Fatal error during setup:', error.message);
        console.log('');
        console.log('Please check your configuration and try again.');
        console.log('Required environment variables:');
        console.log('- CLOUDFLARE_ACCOUNT_ID');
        console.log('- CLOUDFLARE_API_TOKEN');
        console.log('- ADMIN_EMAIL (optional)');
        
        return { success: false, error: error.message };
    }
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setupCloudflareAuth,
        createRuleGroups,
        createAccessApplications,
        testAuthSetup
    };
}

// Run if called directly
if (require.main === module) {
    setupCloudflareAuth()
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unhandled error:', error);
            process.exit(1);
        });
}