const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('🚀 Starting background component test...');

    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Listen for console messages and errors
    const consoleMessages = [];
    const jsErrors = [];

    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
      console.log(`📝 Console [${msg.type()}]:`, msg.text());
    });

    page.on('pageerror', error => {
      jsErrors.push(error.message);
      console.log('❌ Page Error:', error.message);
    });

    console.log('🔍 Testing main page (/)...');

    // Test main page
    await page.goto('http://localhost:3000/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Check for the background canvas
    const canvas = await page.$('canvas');
    console.log('🎨 Canvas element found:', !!canvas);

    // Check for the title
    const title = await page.$eval('h1', el => el.textContent).catch(() => null);
    console.log('📝 Page title:', title);

    // Check for the enter button
    const button = await page.$('button:contains("Enter serviceflow.com")');
    console.log('🔘 Enter button found:', !!button);

    // Check for fallbackConfigs errors
    const fallbackErrors = jsErrors.filter(error =>
      error.includes('fallbackConfigs') || error.includes('ReferenceError')
    );

    console.log('🚨 Fallback config errors:', fallbackErrors.length);
    if (fallbackErrors.length > 0) {
      fallbackErrors.forEach(error => console.log('   - ' + error));
    }

    // Test navigation to agents page
    console.log('🔍 Testing navigation to agents page...');

    if (button) {
      await page.click('button');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    } else {
      await page.goto('http://localhost:3000/agents', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
    }

    console.log('📍 Current URL:', page.url());

    // Check that background is NOT visible initially on agents page
    const agentsCanvas = await page.$('canvas');
    const canvasVisible = agentsCanvas ? await page.evaluate(el => {
      return window.getComputedStyle(el).display !== 'none' &&
             window.getComputedStyle(el).visibility !== 'hidden';
    }, agentsCanvas) : false;

    console.log('🎨 Canvas visible on agents page:', canvasVisible);
    console.log('✅ Expected: Canvas should NOT be visible initially (idle state = false)');

    // Check for any new errors on agents page
    const newFallbackErrors = jsErrors.filter(error =>
      error.includes('fallbackConfigs') || error.includes('ReferenceError')
    ).slice(fallbackErrors.length);

    console.log('🚨 New errors on agents page:', newFallbackErrors.length);

    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('================');
    console.log('✅ Main page loaded:', !!title);
    console.log('✅ Canvas found on main page:', !!canvas);
    console.log('✅ Navigation worked:', page.url().includes('/agents'));
    console.log('✅ No fallbackConfigs errors:', fallbackErrors.length === 0);
    console.log('✅ Canvas properly hidden on agents page:', !canvasVisible);

    const allTestsPassed = !!title && !!canvas && page.url().includes('/agents') &&
                          fallbackErrors.length === 0 && !canvasVisible;

    console.log('\n🎯 OVERALL RESULT:', allTestsPassed ? '✅ PASS' : '❌ FAIL');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();