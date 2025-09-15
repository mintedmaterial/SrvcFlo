const http = require('http');

function testPage(path, description) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Testing ${description}: http://localhost:3000${path}`);

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      timeout: 10000
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`✅ ${description} - Status: ${res.statusCode}`);

        // Check for fallbackConfigs errors in the HTML
        if (data.includes('fallbackConfigs is not defined')) {
          console.log('❌ Found fallbackConfigs error in HTML');
          resolve({ success: false, error: 'fallbackConfigs error found' });
        } else if (data.includes('ReferenceError')) {
          console.log('❌ Found ReferenceError in HTML');
          resolve({ success: false, error: 'ReferenceError found' });
        } else {
          console.log(`✅ No fallbackConfigs errors found in ${description}`);
          resolve({ success: true, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description} - Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      console.log(`⏰ ${description} - Request timed out`);
      req.destroy();
      resolve({ success: false, error: 'Request timed out' });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting simple HTTP tests for background component fix...\n');

  try {
    // Test main page
    const mainPageResult = await testPage('/', 'Main page');

    // Test agents page
    const agentsPageResult = await testPage('/agents', 'Agents page');

    // Test results
    console.log('\n📊 TEST RESULTS:');
    console.log('================');
    console.log(`Main page: ${mainPageResult.success ? '✅ PASS' : '❌ FAIL'}`);
    if (!mainPageResult.success) {
      console.log(`   Error: ${mainPageResult.error}`);
    }

    console.log(`Agents page: ${agentsPageResult.success ? '✅ PASS' : '❌ FAIL'}`);
    if (!agentsPageResult.success) {
      console.log(`   Error: ${agentsPageResult.error}`);
    }

    const overallSuccess = mainPageResult.success && agentsPageResult.success;
    console.log(`\n🎯 OVERALL: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (overallSuccess) {
      console.log('\n✨ Background component fix appears to be working!');
      console.log('   - No fallbackConfigs errors detected');
      console.log('   - Both pages are loading successfully');
      console.log('   - Ready for manual verification in browser');
    }

  } catch (error) {
    console.error('💥 Test runner error:', error.message);
  }
}

runTests();