#!/usr/bin/env node
// ServiceFlow AI Development Deployment Script
// This script sets up the authentication system for development testing

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Development Configuration
const DEV_CONFIG = {
  ENVIRONMENT: 'development',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'dev-admin@serviceflow.local', 
  DATABASE_PATH: './auth_schema.sql',
  DEV_PORT: process.env.DEV_PORT || 8787,
  DEV_HOST: process.env.DEV_HOST || 'localhost'
};

console.log('🛠️  ServiceFlow AI Development Setup');
console.log('=' .repeat(50));
console.log(`Environment: ${DEV_CONFIG.ENVIRONMENT}`);
console.log(`Admin Email: ${DEV_CONFIG.ADMIN_EMAIL}`);
console.log(`Dev Server: http://${DEV_CONFIG.DEV_HOST}:${DEV_CONFIG.DEV_PORT}`);
console.log('');

// Step 1: Initialize Local Database
async function initializeLocalDatabase() {
  console.log('📁 Step 1: Initializing Local Database...');
  
  try {
    // Check if schema file exists
    if (!fs.existsSync(DEV_CONFIG.DATABASE_PATH)) {
      throw new Error(`Database schema file not found: ${DEV_CONFIG.DATABASE_PATH}`);
    }

    console.log('Applying database schema to local D1...');
    
    // Apply schema to local D1 databases
    execSync('wrangler d1 execute serviceflow-waitlist --file=auth_schema.sql --local', {
      stdio: 'inherit'
    });
    
    execSync('wrangler d1 execute serviceflow-portal --file=auth_schema.sql --local', {
      stdio: 'inherit'
    });

    // Insert development admin user
    const devAdminInsert = `
      INSERT OR REPLACE INTO users (
        email, name, status, role, auth_provider, created_at
      ) VALUES (
        '${DEV_CONFIG.ADMIN_EMAIL}',
        'Development Admin',
        'active',
        'admin', 
        'email',
        datetime('now')
      );
    `;

    fs.writeFileSync('./temp_dev_admin.sql', devAdminInsert);
    
    execSync('wrangler d1 execute serviceflow-waitlist --file=temp_dev_admin.sql --local', {
      stdio: 'inherit'
    });
    
    execSync('wrangler d1 execute serviceflow-portal --file=temp_dev_admin.sql --local', {
      stdio: 'inherit'
    });

    // Clean up temp file
    fs.unlinkSync('./temp_dev_admin.sql');

    console.log('✅ Local database initialized successfully');
    console.log(`✅ Development admin user created: ${DEV_CONFIG.ADMIN_EMAIL}`);
  } catch (error) {
    console.error('❌ Local database initialization failed:', error.message);
    throw error;
  }
}

// Step 2: Create Development Auth Configuration
async function createDevAuthConfig() {
  console.log('');
  console.log('🔧 Step 2: Creating Development Auth Configuration...');
  
  try {
    // Create a development version of the auth worker
    const authWorkerPath = './src/mcp-standalone-auth.js';
    const devWorkerPath = './src/mcp-standalone-dev.js';
    
    let authWorkerContent = fs.readFileSync(authWorkerPath, 'utf8');
    
    // Modify for development - disable Cloudflare Access checks
    const devAuthWorkerContent = authWorkerContent.replace(
      'async function verifyCloudflareAccess(request, env) {',
      `async function verifyCloudflareAccess(request, env) {
  // Development mode - skip Cloudflare Access validation
  if (env.ENVIRONMENT === 'development') {
    const devEmail = env.ADMIN_EMAIL || '${DEV_CONFIG.ADMIN_EMAIL}';
    
    try {
      const user = await env.DB.prepare(
        'SELECT * FROM users WHERE email = ? AND status = "active"'
      ).bind(devEmail).first();
      
      return user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.role === 'admin'
      } : null;
    } catch (error) {
      console.error('Error fetching dev user:', error);
      return null;
    }
  }
  
  // Original Cloudflare Access logic for production`
    );

    fs.writeFileSync(devWorkerPath, devAuthWorkerContent);
    console.log('✅ Development auth worker created');

    // Create development environment file
    const devEnvContent = `# Development Environment Configuration
NODE_ENV=development
ENVIRONMENT=development
ADMIN_EMAIL=${DEV_CONFIG.ADMIN_EMAIL}
AUTH_ENABLED=false
CLOUDFLARE_ACCESS_TEAM_NAME=serviceflow-ai-dev
DEV_PORT=${DEV_CONFIG.DEV_PORT}
DEV_HOST=${DEV_CONFIG.DEV_HOST}

# Development Database
DATABASE_URL=local

# Development API Keys (replace with your development keys)
ADMIN_API_KEY=dev_admin_key_12345
AGNO_API_KEY=dev_agno_key_12345

# Optional: Set these for full testing
# CLOUDFLARE_ACCOUNT_ID=your-dev-account-id
# CLOUDFLARE_API_TOKEN=your-dev-api-token
# GOOGLE_CLIENT_ID=your-dev-google-client-id
# GOOGLE_CLIENT_SECRET=your-dev-google-client-secret
`;

    fs.writeFileSync('.env.development', devEnvContent);
    console.log('✅ Development environment file created');

  } catch (error) {
    console.error('❌ Development configuration failed:', error.message);
    throw error;
  }
}

// Step 3: Start Development Server
async function startDevServer() {
  console.log('');
  console.log('🚀 Step 3: Starting Development Server...');
  
  try {
    // Update main worker to use dev version temporarily
    const devWorkerPath = './src/mcp-standalone-dev.js';
    const mainWorkerPath = './src/mcp-standalone.js';
    
    // Backup original worker
    if (fs.existsSync(mainWorkerPath)) {
      fs.copyFileSync(mainWorkerPath, `${mainWorkerPath}.backup`);
      console.log('📋 Backed up original worker');
    }
    
    // Copy dev worker to main
    fs.copyFileSync(devWorkerPath, mainWorkerPath);
    console.log('📝 Updated worker for development');

    console.log('🌐 Starting Wrangler development server...');
    console.log(`🔗 Server will be available at: http://${DEV_CONFIG.DEV_HOST}:${DEV_CONFIG.DEV_PORT}`);
    console.log('');
    console.log('Press Ctrl+C to stop the development server');
    console.log('');

    // Start wrangler dev with local D1
    const devProcess = spawn('wrangler', ['dev', '--local', '--port', DEV_CONFIG.DEV_PORT], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        ENVIRONMENT: 'development',
        ADMIN_EMAIL: DEV_CONFIG.ADMIN_EMAIL
      }
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping development server...');
      devProcess.kill('SIGINT');
      
      // Restore original worker
      const backupPath = `${mainWorkerPath}.backup`;
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, mainWorkerPath);
        fs.unlinkSync(backupPath);
        console.log('📋 Restored original worker');
      }
      
      process.exit(0);
    });

    devProcess.on('close', (code) => {
      console.log(`\n📊 Development server exited with code ${code}`);
      
      // Restore original worker
      const backupPath = `${mainWorkerPath}.backup`;
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, mainWorkerPath);
        fs.unlinkSync(backupPath);
        console.log('📋 Restored original worker');
      }
    });

  } catch (error) {
    console.error('❌ Development server failed to start:', error.message);
    throw error;
  }
}

// Step 4: Create Development Test Scripts
async function createDevTestScripts() {
  console.log('');
  console.log('🧪 Step 4: Creating Development Test Scripts...');
  
  try {
    // Create test script for development endpoints
    const testScript = `#!/usr/bin/env node
// Development Test Script for ServiceFlow AI Authentication

const baseUrl = 'http://${DEV_CONFIG.DEV_HOST}:${DEV_CONFIG.DEV_PORT}';

async function testEndpoint(path, options = {}) {
  try {
    const response = await fetch(\`\${baseUrl}\${path}\`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    const data = await response.json();
    console.log(\`✅ \${options.method || 'GET'} \${path} - Status: \${response.status}\`);
    console.log(\`   Response:\`, JSON.stringify(data, null, 2));
    return { success: true, status: response.status, data };
  } catch (error) {
    console.log(\`❌ \${options.method || 'GET'} \${path} - Error: \${error.message}\`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Running Development API Tests');
  console.log('=' .repeat(40));
  
  // Test public endpoints
  await testEndpoint('/');
  await testEndpoint('/api/chat', {
    method: 'POST',
    body: { message: 'Hello, this is a test message' }
  });
  
  // Test waitlist endpoint
  await testEndpoint('/api/waitlist', {
    method: 'POST', 
    body: { 
      email: 'test@example.com',
      business_name: 'Test Business',
      business_type: 'contractor'
    }
  });
  
  // Test auth endpoints
  await testEndpoint('/api/auth/user');
  
  // Test admin endpoints (should work in dev mode)
  await testEndpoint('/dashboard');
  await testEndpoint('/api/admin/agents');
  
  console.log('');
  console.log('🎉 Development tests completed!');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };
`;

    fs.writeFileSync('./scripts/test-dev-api.js', testScript);
    console.log('✅ Development test script created');

    // Create package.json scripts for development
    const packageJsonPath = './package.json';
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      packageJson.scripts = {
        ...packageJson.scripts,
        'dev:setup': 'node scripts/deploy-dev.js setup',
        'dev:start': 'node scripts/deploy-dev.js start',
        'dev:test': 'node scripts/test-dev-api.js',
        'dev:clean': 'node scripts/deploy-dev.js clean'
      };
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Added development scripts to package.json');
    }

  } catch (error) {
    console.error('❌ Test script creation failed:', error.message);
    throw error;
  }
}

// Clean up development files
async function cleanupDev() {
  console.log('');
  console.log('🧹 Cleaning up development files...');
  
  try {
    const filesToClean = [
      './src/mcp-standalone-dev.js',
      './src/mcp-standalone.js.backup',
      './.env.development',
      './scripts/test-dev-api.js'
    ];
    
    filesToClean.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(\`🗑️  Removed: \${file}\`);
      }
    });
    
    console.log('✅ Development cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

// Main development setup function
async function setupDevelopment() {
  try {
    console.log('🛠️  Setting up ServiceFlow AI for Development...');
    
    await initializeLocalDatabase();
    await createDevAuthConfig();
    await createDevTestScripts();
    
    console.log('');
    console.log('🎉 Development Setup Completed Successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run dev:start (or node scripts/deploy-dev.js start)');
    console.log('2. Test endpoints with: npm run dev:test');
    console.log('3. Access development server at: http://localhost:8787');
    console.log('4. Development admin user: ' + DEV_CONFIG.ADMIN_EMAIL);
    console.log('');
    console.log('Development URLs:');
    console.log(\`- Home: http://\${DEV_CONFIG.DEV_HOST}:\${DEV_CONFIG.DEV_PORT}/\`);
    console.log(\`- Dashboard: http://\${DEV_CONFIG.DEV_HOST}:\${DEV_CONFIG.DEV_PORT}/dashboard\`);
    console.log(\`- API Test: http://\${DEV_CONFIG.DEV_HOST}:\${DEV_CONFIG.DEV_PORT}/api/chat\`);
    
  } catch (error) {
    console.error('');
    console.error('💥 Development Setup Failed:', error.message);
    console.error('');
    console.error('Check the logs above for specific error details.');
    
    process.exit(1);
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      setupDevelopment();
      break;
    case 'start':
      startDevServer();
      break;
    case 'clean':
      cleanupDev();
      break;
    case 'database':
      initializeLocalDatabase();
      break;
    default:
      console.log('ServiceFlow AI Development Commands:');
      console.log('');
      console.log('  setup    - Set up development environment');
      console.log('  start    - Start development server');
      console.log('  clean    - Clean up development files');
      console.log('  database - Initialize local database only');
      console.log('');
      console.log('Usage: node scripts/deploy-dev.js [command]');
      setupDevelopment();
  }
}

module.exports = {
  setupDevelopment,
  initializeLocalDatabase,
  createDevAuthConfig,
  startDevServer,
  createDevTestScripts,
  cleanupDev
};`