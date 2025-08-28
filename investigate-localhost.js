const { chromium } = require('playwright');
const fs = require('fs');

async function investigateApp() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Array to store network requests
  const networkRequests = [];
  const failedRequests = [];

  // Listen for all network requests
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      timestamp: new Date().toISOString()
    });
  });

  // Listen for failed requests
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure(),
      timestamp: new Date().toISOString()
    });
  });

  // Listen for responses
  page.on('response', response => {
    if (!response.ok()) {
      console.log(`Failed response: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('Navigating to http://localhost:3000/...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait a bit for any additional requests
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'localhost-screenshot.png', fullPage: true });
    console.log('Screenshot saved as localhost-screenshot.png');
    
    // Filter pricing-related requests
    const pricingRequests = networkRequests.filter(req => 
      req.url.toLowerCase().includes('pricing') || 
      req.url.toLowerCase().includes('price') ||
      req.url.toLowerCase().includes('payment') ||
      req.url.toLowerCase().includes('stripe') ||
      req.url.toLowerCase().includes('sonic') ||
      req.url.toLowerCase().includes('usdc') ||
      req.url.toLowerCase().includes('api')
    );

    // Save network analysis
    const analysis = {
      totalRequests: networkRequests.length,
      failedRequests: failedRequests.length,
      pricingRelatedRequests: pricingRequests.length,
      allRequests: networkRequests,
      failedRequestsDetails: failedRequests,
      pricingRequests: pricingRequests
    };

    fs.writeFileSync('network-analysis.json', JSON.stringify(analysis, null, 2));
    console.log('Network analysis saved to network-analysis.json');
    
    console.log(`\nSummary:
    - Total requests: ${networkRequests.length}
    - Failed requests: ${failedRequests.length}
    - Pricing-related requests: ${pricingRequests.length}
    `);

    if (failedRequests.length > 0) {
      console.log('\nFailed requests:');
      failedRequests.forEach(req => {
        console.log(`- ${req.method} ${req.url} - ${req.failure?.errorText || 'Unknown error'}`);
      });
    }

    if (pricingRequests.length > 0) {
      console.log('\nPricing-related requests:');
      pricingRequests.forEach(req => {
        console.log(`- ${req.method} ${req.url}`);
      });
    }

  } catch (error) {
    console.error('Error occurred:', error.message);
    
    // Still try to take a screenshot if possible
    try {
      await page.screenshot({ path: 'localhost-error-screenshot.png', fullPage: true });
      console.log('Error screenshot saved as localhost-error-screenshot.png');
    } catch (screenshotError) {
      console.error('Could not take screenshot:', screenshotError.message);
    }
  }

  await browser.close();
}

investigateApp().catch(console.error);