#!/usr/bin/env node

/**
 * Setup Cloudflare Deployment Script
 * 
 * This script helps set up the Cloudflare Workers deployment environment
 * for the INFT system, including:
 * - Creating necessary R2 buckets
 * - Setting up KV namespaces
 * - Configuring D1 databases
 * - Setting environment variables
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Cloudflare deployment environment...\n');

const environment = process.argv[2] || 'staging';
console.log(`📦 Environment: ${environment}\n`);

// Configuration for different environments
const config = {
  staging: {
    r2Buckets: [
      'serviceflow-ai-content-staging',
      'serviceflow-user-uploads-staging', 
      'serviceflow-nft-metadata-staging',
      'serviceflow-generated-content-staging'
    ],
    kvNamespaces: [
      'price-cache-staging',
      'generation-cache-staging'
    ],
    d1Databases: [
      'serviceflow-waitlist-staging',
      'serviceflow-portal-staging'
    ]
  },
  production: {
    r2Buckets: [
      'serviceflow-ai-content',
      'serviceflow-user-uploads',
      'serviceflow-nft-metadata', 
      'serviceflow-generated-content'
    ],
    kvNamespaces: [
      'price-cache-prod',
      'generation-cache-prod'
    ],
    d1Databases: [
      'serviceflow-waitlist',
      'serviceflow-portal'
    ]
  }
};

const envConfig = config[environment];
if (!envConfig) {
  console.error(`❌ Invalid environment: ${environment}`);
  console.log('Valid options: staging, production');
  process.exit(1);
}

function runCommand(command, description) {
  console.log(`🔧 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return null;
  }
}

function createR2Buckets() {
  console.log('\n📦 Creating R2 Buckets...');
  
  envConfig.r2Buckets.forEach(bucketName => {
    const output = runCommand(
      `npx wrangler r2 bucket create ${bucketName}`,
      `Creating R2 bucket: ${bucketName}`
    );
    
    if (output && output.includes('already exists')) {
      console.log(`ℹ️  Bucket ${bucketName} already exists`);
    }
  });
}

function createKVNamespaces() {
  console.log('\n🗄️  Creating KV Namespaces...');
  
  const kvIds = {};
  
  envConfig.kvNamespaces.forEach(namespaceName => {
    const output = runCommand(
      `npx wrangler kv:namespace create ${namespaceName}`,
      `Creating KV namespace: ${namespaceName}`
    );
    
    if (output) {
      // Extract the ID from the output
      const idMatch = output.match(/id = "([^"]+)"/);
      if (idMatch) {
        kvIds[namespaceName] = idMatch[1];
        console.log(`📝 KV namespace ${namespaceName} ID: ${idMatch[1]}`);
      }
    }
  });
  
  return kvIds;
}

function createD1Databases() {
  console.log('\n🗃️  Creating D1 Databases...');
  
  const dbIds = {};
  
  envConfig.d1Databases.forEach(dbName => {
    const output = runCommand(
      `npx wrangler d1 create ${dbName}`,
      `Creating D1 database: ${dbName}`
    );
    
    if (output) {
      // Extract the database ID from the output
      const idMatch = output.match(/database_id = "([^"]+)"/);
      if (idMatch) {
        dbIds[dbName] = idMatch[1];
        console.log(`📝 D1 database ${dbName} ID: ${idMatch[1]}`);
      }
    }
  });
  
  return dbIds;
}

function updateWranglerConfig(kvIds, dbIds) {
  console.log('\n📝 Updating wrangler.toml with resource IDs...');
  
  const wranglerPath = path.join(__dirname, '..', 'wrangler.toml');
  let wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
  
  // Update KV namespace IDs
  Object.entries(kvIds).forEach(([name, id]) => {
    const bindingName = name.replace('-staging', '').replace('-prod', '').replace('-', '_').toUpperCase();
    const pattern = new RegExp(`(\\[\\[env\\.${environment}\\.kv_namespaces\\]\\]\\s*binding = "${bindingName}"\\s*id = ")[^"]*(")`);
    wranglerContent = wranglerContent.replace(pattern, `$1${id}$2`);
  });
  
  // Update D1 database IDs
  Object.entries(dbIds).forEach(([name, id]) => {
    const bindingName = name.includes('portal') ? 'PORTAL_DB' : 'DB';
    const pattern = new RegExp(`(\\[\\[env\\.${environment}\\.d1_databases\\]\\]\\s*binding = "${bindingName}"[\\s\\S]*?database_id = ")[^"]*(")`);
    wranglerContent = wranglerContent.replace(pattern, `$1${id}$2`);
  });
  
  fs.writeFileSync(wranglerPath, wranglerContent);
  console.log('✅ wrangler.toml updated with resource IDs');
}

function setupEnvironmentSecrets() {
  console.log('\n🔐 Setting up environment secrets...');
  console.log('Please run the following commands to set your API keys:');
  console.log('');
  console.log(`npx wrangler secret put OPENAI_API_KEY --env ${environment}`);
  console.log(`npx wrangler secret put CLOUDFLARE_API_TOKEN --env ${environment}`);
  console.log(`npx wrangler secret put GEMINI_API_KEY --env ${environment}`);
  console.log(`npx wrangler secret put ADMIN_API_KEY --env ${environment}`);
  console.log('');
  console.log('💡 You can set these now or later before deployment');
}

function generateDeploymentScript() {
  console.log('\n📜 Generating deployment script...');
  
  const deployScript = `#!/bin/bash

# Deployment script for INFT Cloudflare Workers - ${environment}
# Generated on ${new Date().toISOString()}

echo "🚀 Deploying INFT system to ${environment}..."

# Type check
echo "🔍 Type checking..."
npx tsc --project tsconfig.workers.json --noEmit
if [ $? -ne 0 ]; then
  echo "❌ Type check failed"
  exit 1
fi

# Deploy to Cloudflare Workers
echo "📦 Deploying to Cloudflare Workers..."
npx wrangler deploy --env ${environment}

echo "✅ Deployment complete!"
echo "🌐 Your INFT system is available at:"
if [ "${environment}" = "staging" ]; then
  echo "   https://serviceflow-ai-staging.serviceflowagi.workers.dev"
else
  echo "   https://srvcflo.com (production)"
fi

echo ""
echo "🔧 API Endpoints:"
echo "   /api/inft/agent/{agentId} - Agent management"
echo "   /api/inft/generate/ - Content generation"
echo "   /api/inft/collaborate/ - Agent collaboration"
echo "   /api/inft/credits/{agentId} - Credit management"
echo "   /ws/ - WebSocket connections"
echo ""
echo "📊 Admin API:"
echo "   /api/admin/?action=stats - System statistics"
`;

  fs.writeFileSync(path.join(__dirname, `deploy-${environment}.sh`), deployScript);
  console.log(`✅ Deployment script created: scripts/deploy-${environment}.sh`);
}

// Main execution
async function main() {
  try {
    // Check if wrangler is installed
    runCommand('npx wrangler --version', 'Checking Wrangler installation');
    
    // Create resources
    createR2Buckets();
    const kvIds = createKVNamespaces();
    const dbIds = createD1Databases();
    
    // Update configuration
    if (Object.keys(kvIds).length > 0 || Object.keys(dbIds).length > 0) {
      updateWranglerConfig(kvIds, dbIds);
    }
    
    // Generate deployment files
    generateDeploymentScript();
    
    // Show next steps
    console.log('\n🎉 Cloudflare environment setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Set API keys using the secret commands shown above');
    console.log('2. Update contract addresses in wrangler.toml if needed');
    console.log(`3. Run: npm run deploy:${environment}`);
    console.log('4. Test the deployment at the provided URL');
    
    setupEnvironmentSecrets();
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };