#!/usr/bin/env node
// R2 Bucket Setup and Management Script for ServiceFlow AI

const { execSync } = require('child_process');
const fs = require('fs');

// R2 Bucket Configuration
const R2_BUCKETS = {
  'serviceflow-ai-content': {
    description: 'AI-generated content (images, videos)',
    corsPolicy: {
      allowedOrigins: ['https://srvcflo.com', 'https://www.srvcflo.com', 'http://localhost:3000'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['*'],
      exposeHeaders: ['ETag'],
      maxAge: 3600
    },
    publicAccess: true
  },
  'serviceflow-user-uploads': {
    description: 'User uploaded files and documents',
    corsPolicy: {
      allowedOrigins: ['https://srvcflo.com', 'https://www.srvcflo.com'],
      allowedMethods: ['GET', 'POST', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposeHeaders: ['ETag'],
      maxAge: 1800
    },
    publicAccess: false
  },
  'serviceflow-nft-metadata': {
    description: 'NFT metadata and IPFS-compatible content',
    corsPolicy: {
      allowedOrigins: ['*'],
      allowedMethods: ['GET'],
      allowedHeaders: ['*'],
      exposeHeaders: ['ETag', 'Content-Type'],
      maxAge: 86400
    },
    publicAccess: true
  }
};

console.log('🪣 ServiceFlow AI R2 Bucket Setup');
console.log('='.repeat(50));

// Function to create R2 bucket
async function createR2Bucket(bucketName, config) {
  console.log(`\n📦 Creating R2 bucket: ${bucketName}`);
  
  try {
    // Create the bucket
    const createCommand = `wrangler r2 bucket create ${bucketName}`;
    console.log(`Executing: ${createCommand}`);
    execSync(createCommand, { stdio: 'inherit' });
    
    console.log(`✅ Bucket ${bucketName} created successfully`);
    
    // Set up CORS policy
    if (config.corsPolicy) {
      await setCORSPolicy(bucketName, config.corsPolicy);
    }
    
    // Set up public access if needed
    if (config.publicAccess) {
      await setPublicAccess(bucketName);
    }
    
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`ℹ️  Bucket ${bucketName} already exists`);
      
      // Still apply CORS and public access settings
      if (config.corsPolicy) {
        await setCORSPolicy(bucketName, config.corsPolicy);
      }
      if (config.publicAccess) {
        await setPublicAccess(bucketName);
      }
      
      return true;
    } else {
      console.error(`❌ Failed to create bucket ${bucketName}:`, error.message);
      return false;
    }
  }
}

// Function to set CORS policy
async function setCORSPolicy(bucketName, corsPolicy) {
  console.log(`🌐 Setting CORS policy for ${bucketName}`);
  
  try {
    const corsConfig = JSON.stringify([{
      AllowedOrigins: corsPolicy.allowedOrigins,
      AllowedMethods: corsPolicy.allowedMethods,
      AllowedHeaders: corsPolicy.allowedHeaders,
      ExposeHeaders: corsPolicy.exposeHeaders,
      MaxAgeSeconds: corsPolicy.maxAge
    }], null, 2);
    
    // Write CORS config to temporary file
    const corsFile = `./temp_cors_${bucketName}.json`;
    fs.writeFileSync(corsFile, corsConfig);
    
    // Apply CORS configuration
    const corsCommand = `wrangler r2 bucket cors put ${bucketName} --file ${corsFile}`;
    execSync(corsCommand, { stdio: 'inherit' });
    
    // Clean up temp file
    fs.unlinkSync(corsFile);
    
    console.log(`✅ CORS policy applied to ${bucketName}`);
  } catch (error) {
    console.error(`❌ Failed to set CORS for ${bucketName}:`, error.message);
  }
}

// Function to set public access
async function setPublicAccess(bucketName) {
  console.log(`🔓 Enabling public access for ${bucketName}`);
  
  try {
    // Note: This is a placeholder - actual public access setup might require
    // custom domain configuration or R2 public URL setup
    console.log(`ℹ️  Public access for ${bucketName} requires custom domain setup`);
    console.log(`   Configure at: https://dash.cloudflare.com/r2/buckets`);
    console.log(`   Use format: https://pub-{account-hash}.r2.dev/${bucketName}/`);
  } catch (error) {
    console.error(`❌ Failed to set public access for ${bucketName}:`, error.message);
  }
}

// Function to test bucket connectivity
async function testBucket(bucketName) {
  console.log(`\n🧪 Testing bucket: ${bucketName}`);
  
  try {
    // Test by listing objects (should work even if empty)
    const listCommand = `wrangler r2 object list ${bucketName} --limit 1`;
    execSync(listCommand, { stdio: 'pipe' });
    
    console.log(`✅ Bucket ${bucketName} is accessible`);
    return true;
  } catch (error) {
    console.error(`❌ Bucket ${bucketName} test failed:`, error.message);
    return false;
  }
}

// Function to upload a test file
async function uploadTestFile(bucketName) {
  console.log(`📁 Uploading test file to ${bucketName}`);
  
  try {
    // Create a simple test file
    const testContent = JSON.stringify({
      message: `Test file for ${bucketName}`,
      created: new Date().toISOString(),
      bucket: bucketName,
      serviceflow: 'ai'
    }, null, 2);
    
    const testFile = `./test_${bucketName}.json`;
    fs.writeFileSync(testFile, testContent);
    
    // Upload the test file
    const uploadCommand = `wrangler r2 object put ${bucketName}/test/connectivity.json --file ${testFile}`;
    execSync(uploadCommand, { stdio: 'inherit' });
    
    // Clean up local test file
    fs.unlinkSync(testFile);
    
    console.log(`✅ Test file uploaded to ${bucketName}/test/connectivity.json`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to upload test file to ${bucketName}:`, error.message);
    return false;
  }
}

// Function to set up bucket lifecycle rules
async function setupLifecycleRules(bucketName) {
  console.log(`♻️  Setting up lifecycle rules for ${bucketName}`);
  
  try {
    let lifecycleConfig;
    
    if (bucketName.includes('ai-content')) {
      // AI content: Keep for 1 year, then archive
      lifecycleConfig = {
        Rules: [{
          ID: 'ai-content-lifecycle',
          Status: 'Enabled',
          Filter: { Prefix: 'generated/' },
          Transitions: [{
            Days: 365,
            StorageClass: 'STANDARD_IA'
          }]
        }]
      };
    } else if (bucketName.includes('user-uploads')) {
      // User uploads: Keep active for 6 months
      lifecycleConfig = {
        Rules: [{
          ID: 'user-uploads-lifecycle',
          Status: 'Enabled',
          Filter: { Prefix: 'uploads/' },
          Transitions: [{
            Days: 180,
            StorageClass: 'STANDARD_IA'
          }]
        }]
      };
    } else {
      // NFT metadata: Keep forever (no lifecycle)
      console.log(`ℹ️  No lifecycle rules needed for ${bucketName}`);
      return true;
    }
    
    // Note: Lifecycle configuration might require API calls or dashboard setup
    console.log(`ℹ️  Lifecycle rules for ${bucketName}:`, JSON.stringify(lifecycleConfig, null, 2));
    console.log(`   Configure manually at: https://dash.cloudflare.com/r2/buckets/${bucketName}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to set lifecycle rules for ${bucketName}:`, error.message);
    return false;
  }
}

// Main setup function
async function setupAllBuckets() {
  console.log('🚀 Starting R2 bucket setup...\n');
  
  let successCount = 0;
  let totalCount = Object.keys(R2_BUCKETS).length;
  
  for (const [bucketName, config] of Object.entries(R2_BUCKETS)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Setting up: ${bucketName}`);
    console.log(`Description: ${config.description}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      // Create bucket
      const created = await createR2Bucket(bucketName, config);
      if (!created) continue;
      
      // Test connectivity
      const tested = await testBucket(bucketName);
      if (!tested) continue;
      
      // Upload test file
      await uploadTestFile(bucketName);
      
      // Setup lifecycle rules
      await setupLifecycleRules(bucketName);
      
      successCount++;
      console.log(`\n✅ ${bucketName} setup completed successfully!`);
      
    } catch (error) {
      console.error(`\n❌ Failed to setup ${bucketName}:`, error.message);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 R2 Setup Complete!`);
  console.log(`✅ Successfully configured: ${successCount}/${totalCount} buckets`);
  
  if (successCount === totalCount) {
    console.log(`\n🔗 Next Steps:`);
    console.log(`1. Update wrangler.toml with correct bucket names`);
    console.log(`2. Set CLOUDFLARE_ACCOUNT_HASH environment variable`);
    console.log(`3. Configure custom domains for public buckets (optional)`);
    console.log(`4. Test the buckets with your application`);
    console.log(`\n📊 Bucket URLs:`);
    Object.keys(R2_BUCKETS).forEach(bucket => {
      console.log(`   ${bucket}: https://pub-{account-hash}.r2.dev/${bucket}/`);
    });
  } else {
    console.log(`\n⚠️  Some buckets failed to setup. Check the logs above.`);
  }
}

// Function to clean up test files
async function cleanupTestFiles() {
  console.log('\n🧹 Cleaning up test files...');
  
  for (const bucketName of Object.keys(R2_BUCKETS)) {
    try {
      const deleteCommand = `wrangler r2 object delete ${bucketName}/test/connectivity.json`;
      execSync(deleteCommand, { stdio: 'pipe' });
      console.log(`🗑️  Removed test file from ${bucketName}`);
    } catch (error) {
      // Ignore errors for cleanup
    }
  }
}

// Function to display bucket status
async function showBucketStatus() {
  console.log('\n📊 R2 Bucket Status:');
  console.log('='.repeat(50));
  
  for (const bucketName of Object.keys(R2_BUCKETS)) {
    try {
      const listCommand = `wrangler r2 object list ${bucketName} --limit 5`;
      const output = execSync(listCommand, { encoding: 'utf8' });
      
      console.log(`\n📦 ${bucketName}:`);
      if (output.trim()) {
        console.log(`   Status: ✅ Active`);
        console.log(`   Sample objects:`);
        console.log(output.split('\n').slice(0, 3).map(line => `     ${line}`).join('\n'));
      } else {
        console.log(`   Status: ✅ Empty`);
      }
    } catch (error) {
      console.log(`\n📦 ${bucketName}:`);
      console.log(`   Status: ❌ Error - ${error.message}`);
    }
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      setupAllBuckets();
      break;
    case 'status':
      showBucketStatus();
      break;
    case 'cleanup':
      cleanupTestFiles();
      break;
    case 'help':
    default:
      console.log('ServiceFlow AI R2 Bucket Management');
      console.log('');
      console.log('Commands:');
      console.log('  setup   - Create and configure all R2 buckets');
      console.log('  status  - Show current bucket status');
      console.log('  cleanup - Remove test files from buckets');
      console.log('  help    - Show this help message');
      console.log('');
      console.log('Usage: node scripts/setup-r2-buckets.js [command]');
      break;
  }
}

module.exports = {
  setupAllBuckets,
  cleanupTestFiles,
  showBucketStatus,
  R2_BUCKETS
};