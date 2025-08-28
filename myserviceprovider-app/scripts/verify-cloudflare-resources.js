/**
 * Cloudflare Resources Verification Script
 * 
 * Verifies that all required Cloudflare resources are properly configured:
 * - R2 buckets
 * - KV namespaces
 * - D1 databases
 * - Account connectivity
 */

const CLOUDFLARE_ACCOUNT_ID = 'ff3c5e2beaea9f85fee3200bfe28da16'
const R2_ENDPOINT = `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`

// Required resources from wrangler.toml
const REQUIRED_R2_BUCKETS = [
  'serviceflow-ai-content',
  'serviceflow-user-uploads', 
  'serviceflow-nft-metadata',
  'serviceflow-generated-content'
]

const REQUIRED_KV_NAMESPACES = [
  { name: 'PRICE_CACHE', id: 'eb9dda04c33d4622a6d87b159b0a5a7d' },
  { name: 'GENERATION_CACHE', id: '75bcff3d8269497fa3bd60da679380b5' }
]

const REQUIRED_D1_DATABASES = [
  { name: 'serviceflow-waitlist', id: '663deff9-6ade-462b-82b4-874267e87da0' },
  { name: 'serviceflow-portal', id: '18eb9a3e-399f-4e29-89ea-97f18813c82e' }
]

async function verifyCloudflareAPI() {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  if (!apiToken) {
    throw new Error('CLOUDFLARE_API_TOKEN not found in environment')
  }

  console.log('✓ Cloudflare API token found')
  console.log(`✓ Account ID: ${CLOUDFLARE_ACCOUNT_ID}`)
  console.log(`✓ R2 Endpoint: ${R2_ENDPOINT}`)
  
  return apiToken
}

async function listR2Buckets(apiToken) {
  console.log('\n🪣 Checking R2 Buckets...')
  
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`R2 API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    const existingBuckets = data.result.map(bucket => bucket.name)
    
    console.log(`Found ${existingBuckets.length} existing buckets:`)
    existingBuckets.forEach(name => console.log(`  ✓ ${name}`))
    
    // Check for missing buckets
    const missingBuckets = REQUIRED_R2_BUCKETS.filter(name => !existingBuckets.includes(name))
    
    if (missingBuckets.length > 0) {
      console.log(`\n❌ Missing buckets:`)
      missingBuckets.forEach(name => console.log(`  ❌ ${name}`))
      
      // Offer to create missing buckets
      console.log(`\n📝 To create missing buckets, run:`)
      missingBuckets.forEach(name => {
        console.log(`wrangler r2 bucket create ${name}`)
      })
    } else {
      console.log('✅ All required R2 buckets exist')
    }
    
    return { existing: existingBuckets, missing: missingBuckets }
  } catch (error) {
    console.error('❌ R2 bucket verification failed:', error.message)
    return { existing: [], missing: REQUIRED_R2_BUCKETS }
  }
}

async function listKVNamespaces(apiToken) {
  console.log('\n🗂️ Checking KV Namespaces...')
  
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`KV API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    const existingNamespaces = data.result
    
    console.log(`Found ${existingNamespaces.length} existing namespaces:`)
    existingNamespaces.forEach(ns => console.log(`  ✓ ${ns.title} (${ns.id})`))
    
    // Check for required namespaces
    const results = []
    for (const required of REQUIRED_KV_NAMESPACES) {
      const existing = existingNamespaces.find(ns => ns.id === required.id)
      if (existing) {
        console.log(`✅ ${required.name}: Found as "${existing.title}"`)
        results.push({ ...required, exists: true, actualTitle: existing.title })
      } else {
        console.log(`❌ ${required.name}: Not found (ID: ${required.id})`)
        results.push({ ...required, exists: false })
      }
    }
    
    return results
  } catch (error) {
    console.error('❌ KV namespace verification failed:', error.message)
    return REQUIRED_KV_NAMESPACES.map(ns => ({ ...ns, exists: false }))
  }
}

async function listD1Databases(apiToken) {
  console.log('\n🗄️ Checking D1 Databases...')
  
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`D1 API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    const existingDatabases = data.result
    
    console.log(`Found ${existingDatabases.length} existing databases:`)
    existingDatabases.forEach(db => console.log(`  ✓ ${db.name} (${db.uuid})`))
    
    // Check for required databases
    const results = []
    for (const required of REQUIRED_D1_DATABASES) {
      const existing = existingDatabases.find(db => db.uuid === required.id)
      if (existing) {
        console.log(`✅ ${required.name}: Found as "${existing.name}"`)
        results.push({ ...required, exists: true, actualName: existing.name })
      } else {
        console.log(`❌ ${required.name}: Not found (ID: ${required.id})`)
        results.push({ ...required, exists: false })
      }
    }
    
    return results
  } catch (error) {
    console.error('❌ D1 database verification failed:', error.message)
    return REQUIRED_D1_DATABASES.map(db => ({ ...db, exists: false }))
  }
}

async function testR2Connectivity() {
  console.log('\n🔗 Testing R2 Connectivity...')
  
  try {
    // Test with a simple HEAD request to check bucket accessibility
    const testBucket = 'serviceflow-ai-content'
    const testUrl = `${R2_ENDPOINT}/${testBucket}`
    
    console.log(`Testing access to: ${testUrl}`)
    
    // Note: This will likely fail without proper S3 credentials
    // This is mainly to test endpoint reachability
    const response = await fetch(testUrl, { method: 'HEAD' })
    
    console.log(`Response status: ${response.status}`)
    
    if (response.status === 403) {
      console.log('✅ R2 endpoint reachable (403 expected without auth)')
    } else if (response.status === 200) {
      console.log('✅ R2 bucket accessible')
    } else {
      console.log(`⚠️ Unexpected response: ${response.status}`)
    }
    
  } catch (error) {
    console.error('❌ R2 connectivity test failed:', error.message)
  }
}

async function generateWranglerConfig() {
  console.log('\n📝 Generating wrangler.toml verification...')
  
  const config = `
# Verified Cloudflare Resources Configuration
# Account ID: ${CLOUDFLARE_ACCOUNT_ID}
# Generated: ${new Date().toISOString()}

[vars]
CLOUDFLARE_ACCOUNT_ID = "${CLOUDFLARE_ACCOUNT_ID}"
R2_ENDPOINT = "${R2_ENDPOINT}"

# R2 Buckets (verify these exist)
${REQUIRED_R2_BUCKETS.map(bucket => `# - ${bucket}`).join('\n')}

# KV Namespaces (verify these IDs are correct)
${REQUIRED_KV_NAMESPACES.map(ns => `# ${ns.name}: ${ns.id}`).join('\n')}

# D1 Databases (verify these IDs are correct)  
${REQUIRED_D1_DATABASES.map(db => `# ${db.name}: ${db.id}`).join('\n')}
`
  
  console.log(config)
}

async function main() {
  console.log('🚀 Cloudflare Resources Verification\n')
  
  try {
    // Verify API access
    const apiToken = await verifyCloudflareAPI()
    
    // Check all resources
    const r2Results = await listR2Buckets(apiToken)
    const kvResults = await listKVNamespaces(apiToken)
    const d1Results = await listD1Databases(apiToken)
    
    // Test connectivity
    await testR2Connectivity()
    
    // Generate config
    await generateWranglerConfig()
    
    // Summary
    console.log('\n📊 Verification Summary:')
    console.log(`R2 Buckets: ${REQUIRED_R2_BUCKETS.length - r2Results.missing.length}/${REQUIRED_R2_BUCKETS.length} ✓`)
    console.log(`KV Namespaces: ${kvResults.filter(ns => ns.exists).length}/${REQUIRED_KV_NAMESPACES.length} ✓`)
    console.log(`D1 Databases: ${d1Results.filter(db => db.exists).length}/${REQUIRED_D1_DATABASES.length} ✓`)
    
    if (r2Results.missing.length === 0 && 
        kvResults.every(ns => ns.exists) && 
        d1Results.every(db => db.exists)) {
      console.log('\n🎉 All Cloudflare resources are properly configured!')
    } else {
      console.log('\n⚠️ Some resources need attention. See details above.')
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    process.exit(1)
  }
}

// Run verification if called directly
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  verifyCloudflareAPI,
  listR2Buckets,
  listKVNamespaces,
  listD1Databases,
  testR2Connectivity
}