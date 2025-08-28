// Quick deployment script to test basic functionality
const { execSync } = require('child_process');

console.log('🚀 Quick ServiceFlow AI Deployment Test');
console.log('=' * 50);

try {
    // Test current deployment
    console.log('Testing current deployment...');
    
    // Try a simple worker-only deploy without assets first
    console.log('Deploying worker script only...');
    execSync('npx wrangler deploy src/worker.js --name serviceflow-ai --no-bundle', { 
        stdio: 'inherit',
        timeout: 120000 
    });
    
    console.log('✅ Worker deployment complete!');
    
} catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\n📝 Manual steps needed:');
    console.log('1. Check wrangler.toml configuration');
    console.log('2. Verify environment variables are set');
    console.log('3. Try: npx wrangler deploy --env=""');
}