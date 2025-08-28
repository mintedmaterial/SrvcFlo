#!/usr/bin/env node
// ServiceFlow AI Authentication Deployment Script
// This script sets up the complete authentication system

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'your-admin-email@gmail.com',
  DATABASE_PATH: './auth_schema.sql'
};

console.log('🚀 ServiceFlow AI Authentication Setup');
console.log('=' .repeat(50));
console.log(`Environment: ${CONFIG.ENVIRONMENT}`);
console.log(`Admin Email: ${CONFIG.ADMIN_EMAIL}`);
console.log('');

// Step 1: Initialize Database Schema
async function initializeDatabase() {
  console.log('📁 Step 1: Initializing Database Schema...');
  
  try {
    // Check if schema file exists
    if (!fs.existsSync(CONFIG.DATABASE_PATH)) {
      throw new Error(`Database schema file not found: ${CONFIG.DATABASE_PATH}`);
    }

    // Apply schema to D1 database
    console.log('Applying database schema to D1...');
    
    if (CONFIG.ENVIRONMENT === 'production') {
      execSync('wrangler d1 execute serviceflow-waitlist --file=auth_schema.sql --env=production', {
        stdio: 'inherit'
      });
      
      execSync('wrangler d1 execute serviceflow-portal --file=auth_schema.sql --env=production', {
        stdio: 'inherit'
      });
    } else {
      execSync('wrangler d1 execute serviceflow-waitlist --file=auth_schema.sql --local', {
        stdio: 'inherit'
      });
      
      execSync('wrangler d1 execute serviceflow-portal --file=auth_schema.sql --local', {
        stdio: 'inherit'
      });
    }

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

// Step 2: Set up Cloudflare Zero Trust
async function setupCloudflareAuth() {
  console.log('');
  console.log('🔐 Step 2: Setting up Cloudflare Zero Trust...');
  
  try {
    // Check if required environment variables are set
    const requiredVars = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('⚠️  Skipping Cloudflare setup - missing environment variables:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
      console.log('');
      console.log('To set up Cloudflare authentication:');
      console.log('1. Set the required environment variables');
      console.log('2. Run: node scripts/cloudflare-auth-setup.js');
      return;
    }

    // Run Cloudflare setup script
    execSync('node scripts/cloudflare-auth-setup.js', {
      stdio: 'inherit',
      env: {
        ...process.env,
        ADMIN_EMAIL: CONFIG.ADMIN_EMAIL
      }
    });

    console.log('✅ Cloudflare Zero Trust setup completed');
  } catch (error) {
    console.error('❌ Cloudflare setup failed:', error.message);
    console.log('You can run the setup manually later with:');
    console.log('node scripts/cloudflare-auth-setup.js');
  }
}

// Step 3: Deploy the worker
async function deployWorker() {
  console.log('');
  console.log('🚀 Step 3: Deploying Worker...');
  
  try {
    // Update main worker to use the new auth version
    const authWorkerPath = './src/mcp-standalone-auth.js';
    const mainWorkerPath = './src/mcp-standalone.js';
    
    // Backup original worker
    if (fs.existsSync(mainWorkerPath)) {
      fs.copyFileSync(mainWorkerPath, `${mainWorkerPath}.backup`);
      console.log('📋 Backed up original worker');
    }
    
    // Copy auth worker to main
    fs.copyFileSync(authWorkerPath, mainWorkerPath);
    console.log('📝 Updated worker with authentication');

    // Deploy to Cloudflare
    if (CONFIG.ENVIRONMENT === 'production') {
      execSync('wrangler deploy --env=production', {
        stdio: 'inherit'
      });
    } else {
      execSync('wrangler dev --local', {
        stdio: 'inherit'
      });
    }

    console.log('✅ Worker deployed successfully');
  } catch (error) {
    console.error('❌ Worker deployment failed:', error.message);
    
    // Restore backup if deployment failed
    const mainWorkerPath = './src/mcp-standalone.js';
    const backupPath = `${mainWorkerPath}.backup`;
    
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, mainWorkerPath);
      console.log('📋 Restored original worker from backup');
    }
    
    throw error;
  }
}

// Step 4: Set up secrets
async function setupSecrets() {
  console.log('');
  console.log('🔑 Step 4: Setting up Secrets...');
  
  const secrets = [
    'ADMIN_API_KEY',
    'AGNO_API_KEY', 
    'CLOUDFLARE_API_TOKEN',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];

  console.log('Required secrets (set manually using wrangler secret put):');
  secrets.forEach(secret => {
    const value = process.env[secret];
    if (value) {
      try {
        if (CONFIG.ENVIRONMENT === 'production') {
          execSync(`echo "${value}" | wrangler secret put ${secret} --env=production`, {
            stdio: 'pipe'
          });
        } else {
          execSync(`echo "${value}" | wrangler secret put ${secret}`, {
            stdio: 'pipe'
          });
        }
        console.log(`✅ ${secret} - Set successfully`);
      } catch (error) {
        console.log(`⚠️  ${secret} - Failed to set automatically`);
      }
    } else {
      console.log(`❌ ${secret} - Not set (missing environment variable)`);
    }
  });
}

// Step 5: Test the setup
async function testSetup() {
  console.log('');
  console.log('🧪 Step 5: Testing Setup...');
  
  try {
    // Test database connection
    console.log('Testing database connection...');
    if (CONFIG.ENVIRONMENT === 'production') {
      execSync('wrangler d1 execute serviceflow-waitlist --command="SELECT COUNT(*) FROM users;" --env=production', {
        stdio: 'inherit'
      });
    } else {
      execSync('wrangler d1 execute serviceflow-waitlist --command="SELECT COUNT(*) FROM users;" --local', {
        stdio: 'inherit'
      });
    }
    
    console.log('✅ Database connection test passed');
    
    // Test worker deployment
    console.log('Testing worker deployment...');
    // This would typically involve making a test request to the worker
    console.log('⚠️  Worker test requires manual verification');
    
    console.log('✅ Setup test completed');
  } catch (error) {
    console.error('❌ Setup test failed:', error.message);
    console.log('Please verify the setup manually');
  }
}

// Main deployment function
async function deployAuthentication() {
  try {
    console.log('Starting ServiceFlow AI Authentication Deployment...');
    
    // Check if this is a development deployment
    if (CONFIG.ENVIRONMENT === 'development') {
      console.log('⚠️  Development mode detected!');
      console.log('   For development setup, use: node scripts/deploy-dev.js');
      console.log('   For production deployment, set NODE_ENV=production');
      console.log('');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('Continue with production deployment? (y/N): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('Deployment cancelled. Use deploy-dev.js for development setup.');
        return { success: false, cancelled: true };
      }
    }
    
    await initializeDatabase();
    await setupCloudflareAuth();
    await deployWorker();
    await setupSecrets();
    await testSetup();
    
    console.log('');
    console.log('🎉 Authentication Deployment Completed Successfully!');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Configure Google OAuth in Cloudflare Zero Trust Dashboard');
    console.log('2. Test authentication flow on your domain');
    console.log('3. Verify admin access to protected routes');
    console.log('4. Set up monitoring and logging');
    console.log('');
    console.log('URLs to test:');
    console.log('- Public: https://srvcflo.com/');
    console.log('- Admin: https://srvcflo.com/dashboard');
    console.log('- Auth Check: https://srvcflo.com/cdn-cgi/access/get-identity');
    
  } catch (error) {
    console.error('');
    console.error('💥 Deployment Failed:', error.message);
    console.error('');
    console.error('Check the logs above for specific error details.');
    console.error('You may need to run individual setup steps manually.');
    
    process.exit(1);
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'database':
      initializeDatabase().catch(console.error);
      break;
    case 'cloudflare':
      setupCloudflareAuth().catch(console.error);
      break;
    case 'worker':
      deployWorker().catch(console.error);
      break;
    case 'secrets':
      setupSecrets().catch(console.error);
      break;
    case 'test':
      testSetup().catch(console.error);
      break;
    default:
      deployAuthentication();
  }
}

module.exports = {
  deployAuthentication,
  initializeDatabase,
  setupCloudflareAuth,
  deployWorker,
  setupSecrets,
  testSetup
};