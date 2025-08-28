/**
 * Deploy Flo Agent Worker (Token #1) to Cloudflare
 * 
 * This script deploys the enhanced Flo agent infrastructure
 */

const { execSync } = require('child_process');

console.log('🚀 Deploying Flo Agent Worker (Token #1)...');
console.log('=====================================');

try {
  // Check if wrangler is available
  console.log('📋 Checking Wrangler CLI...');
  execSync('npx wrangler --version', { stdio: 'inherit' });

  // Check configuration
  console.log('\n📝 Verifying wrangler.toml configuration...');
  const fs = require('fs');
  const wranglerConfig = fs.readFileSync('./wrangler.toml', 'utf8');
  
  if (wranglerConfig.includes('ERC7857_VERIFIABLE_INFT_CONTRACT')) {
    console.log('✅ ERC-7857 contract configuration found');
  } else {
    console.log('❌ Missing ERC-7857 contract configuration');
    process.exit(1);
  }

  // Deploy to staging first
  console.log('\n🔧 Deploying to staging environment...');
  execSync('npx wrangler deploy --env staging', { stdio: 'inherit' });
  
  console.log('\n✅ Staging deployment complete!');
  console.log('🔗 Staging URL: https://serviceflow-ai-staging.serviceflowagi.workers.dev');
  console.log('\n🧪 Testing Flo Agent endpoint...');
  
  // Test the deployment
  setTimeout(async () => {
    try {
      const response = await fetch('https://serviceflow-ai-staging.serviceflowagi.workers.dev/api/flo-agent/');
      const data = await response.json();
      console.log('📊 Test Response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.agent === 'Flo - Token #1') {
        console.log('\n🎉 Flo Agent deployment successful!');
        console.log('💬 Chat endpoint: https://serviceflow-ai-staging.serviceflowagi.workers.dev/api/flo-agent/chat');
      } else {
        console.log('\n⚠️  Deployment successful but response unexpected');
      }
    } catch (error) {
      console.log('❌ Test failed:', error.message);
    }
  }, 5000);

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}