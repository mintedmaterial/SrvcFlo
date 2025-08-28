#!/usr/bin/env node
// Local Setup Test Script for ServiceFlow AI

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🧪 ServiceFlow AI Local Setup Test');
console.log('=' .repeat(50));

// Test configuration
const TESTS = {
  'Next.js Server': {
    url: 'http://localhost:3000',
    timeout: 5000
  },
  'API Routes': {
    tests: [
      {
        name: 'MCP Generate API',
        url: 'http://localhost:3000/api/mcp/generate',
        method: 'POST',
        body: {
          type: 'image',
          prompt: 'test prompt',
          paymentType: 'free'
        }
      },
      {
        name: 'User Stats API',  
        url: 'http://localhost:3000/api/user/stats',
        method: 'POST',
        body: {
          userAddress: '0x1234567890123456789012345678901234567890'
        }
      },
      {
        name: 'Contract Events API',
        url: 'http://localhost:3000/api/contracts/events?address=0x6988c29f8c0051d261f288c2c497a592e2d1061f&chainId=57054',
        method: 'GET'
      }
    ]
  },
  'Environment Variables': {
    required: [
      'NEXT_PUBLIC_THIRDWEB_CLIENT_ID',
      'THIRDWEB_SECRET_KEY',
      'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_ACCOUNT_ID',
      'SONIC_DEPLOYMENT_WALLET',
      'MONGODB_URI'
    ]
  },
  'File Structure': {
    files: [
      'components/ai-generation.tsx',
      'components/thirdweb-provider.tsx', 
      'components/contract-activity.tsx',
      'app/api/mcp/generate/route.ts',
      'app/api/user/stats/route.ts',
      'app/api/contracts/events/route.ts',
      'hooks/useContractEvents.ts',
      'lib/thirdweb-events.ts',
      'Contracts/SonicPayment.sol',
      'Contracts/VotingContract.sol',
      'Contracts/BanditKidzStaking.sol'
    ]
  }
};

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', body = null, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ServiceFlow-Test/1.0'
      },
      timeout: timeout
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body && method !== 'GET') {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Test Next.js server
async function testNextJSServer() {
  console.log('\n📱 Testing Next.js Server...');
  
  try {
    const response = await makeRequest('http://localhost:3000', 'GET', null, 3000);
    
    if (response.status === 200) {
      console.log('✅ Next.js server is running');
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers['content-type']}`);
      return true;
    } else {
      console.log(`⚠️  Next.js server responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Next.js server is not running');
    console.log(`   Error: ${error.message}`);
    console.log('   💡 Run: npm run dev');
    return false;
  }
}

// Test API routes
async function testAPIRoutes() {
  console.log('\n🔗 Testing API Routes...');
  
  let passedTests = 0;
  const totalTests = TESTS['API Routes'].tests.length;
  
  for (const test of TESTS['API Routes'].tests) {
    console.log(`\n   Testing ${test.name}...`);
    
    try {
      const response = await makeRequest(test.url, test.method, test.body, 5000);
      
      if (response.status >= 200 && response.status < 400) {
        console.log(`   ✅ ${test.name} - Status: ${response.status}`);
        
        try {
          const responseData = JSON.parse(response.body);
          if (responseData.success !== false) {
            console.log(`   📄 Response includes expected data structure`);
          }
        } catch (e) {
          console.log(`   📄 Response received (not JSON)`);
        }
        
        passedTests++;
      } else {
        console.log(`   ⚠️  ${test.name} - Status: ${response.status}`);
        console.log(`   Response: ${response.body.slice(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name} - Error: ${error.message}`);
    }
  }
  
  console.log(`\n   📊 API Tests: ${passedTests}/${totalTests} passed`);
  return passedTests === totalTests;
}

// Test environment variables
async function testEnvironmentVariables() {
  console.log('\n🔧 Testing Environment Variables...');
  
  // Load .env file
  const envPath = path.join(process.cwd(), '.env');
  let envVars = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value && !key.startsWith('#')) {
        envVars[key.trim()] = value.trim();
      }
    });
  }
  
  let foundVars = 0;
  const requiredVars = TESTS['Environment Variables'].required;
  
  for (const varName of requiredVars) {
    const value = process.env[varName] || envVars[varName];
    
    if (value && value !== 'your_' && !value.includes('your_')) {
      console.log(`   ✅ ${varName}: Set`);
      foundVars++;
    } else {
      console.log(`   ⚠️  ${varName}: Not set or placeholder`);
    }
  }
  
  console.log(`\n   📊 Environment: ${foundVars}/${requiredVars.length} variables configured`);
  return foundVars >= Math.floor(requiredVars.length * 0.7); // 70% threshold
}

// Test file structure
async function testFileStructure() {
  console.log('\n📁 Testing File Structure...');
  
  let foundFiles = 0;
  const requiredFiles = TESTS['File Structure'].files;
  
  for (const filePath of requiredFiles) {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      console.log(`   ✅ ${filePath}`);
      foundFiles++;
    } else {
      console.log(`   ❌ ${filePath} - Missing`);
    }
  }
  
  console.log(`\n   📊 Files: ${foundFiles}/${requiredFiles.length} found`);
  return foundFiles === requiredFiles.length;
}

// Test R2 bucket availability
async function testR2Buckets() {
  console.log('\n🪣 Testing R2 Buckets...');
  
  const buckets = [
    'serviceflow-ai-content',
    'serviceflow-user-uploads', 
    'serviceflow-nft-metadata'
  ];
  
  try {
    const { execSync } = require('child_process');
    
    for (const bucket of buckets) {
      try {
        execSync(`wrangler r2 bucket list | grep ${bucket}`, { stdio: 'pipe' });
        console.log(`   ✅ ${bucket} - Available`);
      } catch (error) {
        console.log(`   ❌ ${bucket} - Not found`);
      }
    }
    
    return true;
  } catch (error) {
    console.log('   ⚠️  Wrangler not available or not logged in');
    console.log('   💡 Run: wrangler auth login');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting comprehensive local setup test...\n');
  
  const results = {
    nextjs: await testNextJSServer(),
    apis: await testAPIRoutes(), 
    env: await testEnvironmentVariables(),
    files: await testFileStructure(),
    r2: await testR2Buckets()
  };
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const testNames = {
    nextjs: 'Next.js Server',
    apis: 'API Routes',
    env: 'Environment Variables', 
    files: 'File Structure',
    r2: 'R2 Buckets'
  };
  
  let passed = 0;
  let total = Object.keys(results).length;
  
  for (const [key, result] of Object.entries(results)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testNames[key]}`);
    if (result) passed++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your local setup is ready.');
    console.log('\n💡 Next steps:');
    console.log('   • Visit http://localhost:3000 to test the application');
    console.log('   • Connect a wallet to test web3 features');
    console.log('   • Try generating AI content');
    console.log('   • Check contract events at /activity');
  } else {
    console.log('⚠️  Some tests failed. Check the issues above.');
    console.log('\n🔧 Common fixes:');
    console.log('   • Start Next.js: npm run dev');  
    console.log('   • Set environment variables in .env');
    console.log('   • Install dependencies: npm install');
    console.log('   • Login to Wrangler: wrangler auth login');
  }
  
  return passed === total;
}

// Run tests
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testNextJSServer, testAPIRoutes };