const http = require('http');

function makeRequest(path, description) {
  return new Promise((resolve) => {
    console.log(`🔄 ${description}...`);

    const startTime = Date.now();
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      timeout: 15000
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        const success = res.statusCode === 200;

        // Check for critical errors in HTML
        const hasReferenceError = data.includes('ReferenceError');
        const hasFallbackError = data.includes('fallbackConfigs is not defined');
        const hasUnexpectedErrors = hasReferenceError || hasFallbackError;

        // Check for expected elements
        const hasCanvas = data.includes('<canvas');
        const hasTitle = data.includes('ServiceFlow AI');
        const hasButton = path === '/' && data.includes('Enter serviceflow.com');

        console.log(`   Status: ${res.statusCode} (${duration}ms)`);
        if (hasUnexpectedErrors) {
          console.log('   ❌ JavaScript errors found in HTML');
        } else {
          console.log('   ✅ No JavaScript errors detected');
        }

        resolve({
          success: success && !hasUnexpectedErrors,
          statusCode: res.statusCode,
          duration,
          hasCanvas,
          hasTitle,
          hasButton,
          hasReferenceError,
          hasFallbackError,
          path
        });
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Request failed: ${error.message}`);
      resolve({
        success: false,
        error: error.message,
        path
      });
    });

    req.on('timeout', () => {
      console.log('   ⏰ Request timed out');
      req.destroy();
      resolve({
        success: false,
        error: 'timeout',
        path
      });
    });

    req.end();
  });
}

async function runIntegrationTest() {
  console.log('🚀 ServiceFlow AI Agent UI - Background Component Integration Test');
  console.log('================================================================\n');

  const results = [];

  // Test 1: Main page
  console.log('📍 Test 1: Main Page (Landing with Background)');
  const mainResult = await makeRequest('/', 'Loading main page');
  results.push(mainResult);

  if (mainResult.success) {
    console.log('   ✅ Main page loaded successfully');
    console.log(`   📄 Has title: ${mainResult.hasTitle ? 'Yes' : 'No'}`);
    console.log(`   🎨 Has canvas: ${mainResult.hasCanvas ? 'Yes' : 'No'}`);
    console.log(`   🔘 Has enter button: ${mainResult.hasButton ? 'Yes' : 'No'}`);
  } else {
    console.log('   ❌ Main page failed to load');
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Test 2: Agents page
  console.log('📍 Test 2: Agents Page (Chat Interface)');
  const agentsResult = await makeRequest('/agents', 'Loading agents page');
  results.push(agentsResult);

  if (agentsResult.success) {
    console.log('   ✅ Agents page loaded successfully');
    console.log(`   📄 Has title: ${agentsResult.hasTitle ? 'Yes' : 'No'}`);
    // Note: Canvas might be present but hidden on agents page
  } else {
    console.log('   ❌ Agents page failed to load');
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Test 3: Quick succession test (simulates fast navigation)
  console.log('📍 Test 3: Navigation Flow Test');
  console.log('   Testing rapid page switches...');

  const rapidTests = await Promise.all([
    makeRequest('/', 'Main page (rapid 1)'),
    makeRequest('/agents', 'Agents page (rapid 1)'),
    makeRequest('/', 'Main page (rapid 2)')
  ]);

  const allRapidSuccess = rapidTests.every(r => r.success);
  console.log(`   ${allRapidSuccess ? '✅' : '❌'} Rapid navigation: ${allRapidSuccess ? 'PASSED' : 'FAILED'}`);

  console.log('\n' + '='.repeat(60) + '\n');

  // Final analysis
  console.log('📊 FINAL TEST RESULTS:');
  console.log('========================');

  const mainPageWorking = mainResult.success && mainResult.hasTitle && !mainResult.hasReferenceError;
  const agentsPageWorking = agentsResult.success && !agentsResult.hasReferenceError;
  const noJavaScriptErrors = results.every(r => !r.hasReferenceError && !r.hasFallbackError);
  const allPagesLoading = results.every(r => r.success);
  const navigationWorking = allRapidSuccess;

  console.log(`1. Main page functionality:     ${mainPageWorking ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`2. Agents page functionality:   ${agentsPageWorking ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`3. No JavaScript errors:        ${noJavaScriptErrors ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`4. All pages loading:           ${allPagesLoading ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`5. Navigation working:          ${navigationWorking ? '✅ PASS' : '❌ FAIL'}`);

  const overallSuccess = mainPageWorking && agentsPageWorking && noJavaScriptErrors &&
                        allPagesLoading && navigationWorking;

  console.log('\n🎯 OVERALL RESULT:');
  console.log(`${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (overallSuccess) {
    console.log('\n🎉 SUCCESS! Background component fix is working correctly:');
    console.log('   ✨ No fallbackConfigs errors detected');
    console.log('   ✨ Both pages load without JavaScript errors');
    console.log('   ✨ Navigation between pages works smoothly');
    console.log('   ✨ Background component is properly integrated');
    console.log('\n📝 Next steps:');
    console.log('   - Manual verification in browser recommended');
    console.log('   - Test idle state behavior on agents page');
    console.log('   - Verify background animation plays correctly');
  } else {
    console.log('\n❌ Issues detected:');
    results.forEach(result => {
      if (!result.success || result.hasReferenceError || result.hasFallbackError) {
        console.log(`   - ${result.path}: ${result.error || 'JavaScript errors detected'}`);
      }
    });
  }

  // Performance summary
  const avgLoadTime = results.filter(r => r.duration).reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.duration).length;
  console.log(`\n⚡ Average load time: ${Math.round(avgLoadTime)}ms`);

  process.exit(overallSuccess ? 0 : 1);
}

runIntegrationTest().catch(console.error);