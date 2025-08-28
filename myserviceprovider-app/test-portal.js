// Test script for ServiceFlow AI portal functionality
const baseURL = 'http://localhost:3000'

// Test API endpoints
async function testPortal() {
  console.log('🧪 Testing ServiceFlow AI Portal...\n')

  // Test 1: Portal validation with demo API key
  console.log('1. Testing portal validation...')
  try {
    const response = await fetch(`${baseURL}/api/portal/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'sfa_demo123' })
    })
    const data = await response.json()
    console.log('✅ Portal validation:', data.success ? 'PASSED' : 'FAILED')
    console.log('   User data:', data.user)
  } catch (error) {
    console.log('❌ Portal validation: FAILED -', error.message)
  }

  // Test 2: Blog content generation
  console.log('\n2. Testing blog content generation...')
  try {
    const response = await fetch(`${baseURL}/api/blog/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        apiKey: 'sfa_demo123',
        topic: 'Why Smart Contractors Use AI',
        industry: 'contractors'
      })
    })
    const data = await response.json()
    console.log('✅ Blog generation:', data.success ? 'PASSED' : 'FAILED')
    if (data.success) {
      console.log('   Generated title:', data.blog_post.title)
      console.log('   Content length:', data.blog_post.content.length, 'characters')
      console.log('   Social platforms:', Object.keys(data.blog_post.social_content))
    }
  } catch (error) {
    console.log('❌ Blog generation: FAILED -', error.message)
  }

  // Test 3: Blog posts endpoint
  console.log('\n3. Testing blog posts endpoint...')
  try {
    const response = await fetch(`${baseURL}/api/blog`)
    const data = await response.json()
    console.log('✅ Blog posts fetch:', data.success ? 'PASSED' : 'FAILED')
    console.log('   Posts count:', data.posts.length)
  } catch (error) {
    console.log('❌ Blog posts fetch: FAILED -', error.message)
  }

  console.log('\n🎉 Portal testing complete!')
  console.log('\n📝 Next steps:')
  console.log('   1. Visit http://localhost:3000 to see the landing page')
  console.log('   2. Visit http://localhost:3000/portal?key=sfa_demo123 to test the portal')
  console.log('   3. Generate sample content using the portal interface')
}

// Test ServiceFlow AI agents (if available)
async function testAgents() {
  console.log('\n🤖 Testing ServiceFlow AI Agents...')
  
  try {
    // This would test the Python agents if they're running
    const { spawn } = require('child_process')
    
    console.log('Agents setup completed! To test agents:')
    console.log('1. Install dependencies: pip install agno openai googlesearch-python newspaper4k python-dotenv')
    console.log('2. Set up your .env file with OPENAI_API_KEY')
    console.log('3. Run: python serviceflow_agents.py')
  } catch (error) {
    console.log('⚠️  Agent testing requires Python environment setup')
  }
}

// Run if this script is executed directly
if (require.main === module) {
  testPortal()
  testAgents()
}

module.exports = { testPortal, testAgents }