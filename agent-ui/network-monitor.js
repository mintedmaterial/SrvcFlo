const http = require('http');
const https = require('https');

// Monitor network requests to localhost:3000
let requestCount = 0;
let startTime = Date.now();
const requests = [];

function logRequest(method, url, statusCode, duration) {
  requestCount++;
  const timestamp = new Date().toISOString().substr(11, 8);
  const entry = {
    id: requestCount,
    timestamp,
    method,
    url,
    statusCode,
    duration
  };
  requests.push(entry);

  console.log(`[${timestamp}] #${requestCount} ${method} ${url} - ${statusCode} (${duration}ms)`);

  // Flag suspicious patterns
  if (url.includes('background') && !url.includes('_next/static')) {
    console.log(`  ⚠️  Background-related request detected`);
  }

  if (duration > 1000) {
    console.log(`  🐌 Slow request (${duration}ms)`);
  }
}

// Patch HTTP module to monitor requests
const originalRequest = http.request;
const originalHttpsRequest = https.request;

http.request = function(options, callback) {
  const startTime = Date.now();
  const url = typeof options === 'string' ? options : `http://${options.hostname || 'localhost'}:${options.port || 80}${options.path || '/'}`;

  if (url.includes('localhost:3000')) {
    const req = originalRequest(options, (res) => {
      res.on('end', () => {
        const duration = Date.now() - startTime;
        logRequest(options.method || 'GET', url, res.statusCode, duration);
      });
      if (callback) callback(res);
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      logRequest(options.method || 'GET', url, 'ERROR', duration);
    });

    return req;
  }

  return originalRequest(options, callback);
};

async function simulateUserFlow() {
  console.log('🔍 Starting network monitoring for background component...\n');

  // Test 1: Load main page
  console.log('📍 Test 1: Loading main page');
  await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   ✅ Main page loaded (${res.statusCode})`);
        resolve();
      });
    });
    req.on('error', resolve);
    req.end();
  });

  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

  // Test 2: Load agents page
  console.log('\n📍 Test 2: Loading agents page');
  await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/agents',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   ✅ Agents page loaded (${res.statusCode})`);
        resolve();
      });
    });
    req.on('error', resolve);
    req.end();
  });

  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

  // Test 3: Check for any follow-up requests
  console.log('\n📍 Test 3: Monitoring for background requests');
  console.log('   (Waiting 5 seconds to catch any delayed requests...)');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Analysis
  console.log('\n📊 NETWORK ANALYSIS:');
  console.log('====================');
  console.log(`Total requests: ${requestCount}`);

  const pageRequests = requests.filter(r => r.url.includes('localhost:3000') && (r.url.endsWith('/') || r.url.endsWith('/agents')));
  const staticRequests = requests.filter(r => r.url.includes('_next/static'));
  const backgroundRequests = requests.filter(r => r.url.includes('background') && !r.url.includes('_next/static'));
  const slowRequests = requests.filter(r => r.duration > 1000);

  console.log(`Page requests: ${pageRequests.length}`);
  console.log(`Static asset requests: ${staticRequests.length}`);
  console.log(`Background-specific requests: ${backgroundRequests.length}`);
  console.log(`Slow requests (>1s): ${slowRequests.length}`);

  // Red flags
  let issues = [];

  if (backgroundRequests.length > 2) {
    issues.push(`Too many background requests: ${backgroundRequests.length}`);
  }

  if (slowRequests.length > 0) {
    issues.push(`Slow requests detected: ${slowRequests.map(r => `${r.url} (${r.duration}ms)`).join(', ')}`);
  }

  if (pageRequests.some(r => r.statusCode !== 200)) {
    issues.push(`Failed page requests: ${pageRequests.filter(r => r.statusCode !== 200).map(r => r.url).join(', ')}`);
  }

  console.log('\n🎯 ASSESSMENT:');
  if (issues.length === 0) {
    console.log('✅ All network patterns look good!');
    console.log('   - No excessive background requests');
    console.log('   - No slow requests detected');
    console.log('   - Page loads successful');
  } else {
    console.log('❌ Issues detected:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }

  process.exit(issues.length === 0 ? 0 : 1);
}

simulateUserFlow().catch(console.error);