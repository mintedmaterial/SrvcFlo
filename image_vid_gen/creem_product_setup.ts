// Creem.io Product Creation for ServiceFlow AI
// Run these API calls to create your remaining 3 credit packages

const CREEM_API_KEY = 'creem_5nNsiwUDYzdp38uaD5g0c6';
const CREEM_BASE_URL = 'https://api.creem.io/v1';

interface CreemProduct {
  name: string;
  description: string;
  price: number;
  currency: string;
  type: 'one_time' | 'subscription';
  metadata?: Record<string, any>;
}

// Product definitions for your remaining packages
const PRODUCTS_TO_CREATE = [
  {
    name: 'IMG/MP4 Standard',
    description: 'Standard AI generation package - 8,000 credits for images and videos',
    price: 5000, // $50.00 in cents
    currency: 'USD',
    type: 'one_time' as const,
    metadata: {
      package_id: 'standard',
      credits_fiat: 8000,
      credits_crypto: 9600, // 20% bonus
      generation_types: ['image', 'video'],
      models: ['gpt-4o', 'veo3']
    }
  },
  {
    name: 'IMG/MP4 Premium',
    description: 'Premium AI generation package - 100,000 credits for unlimited creativity',
    price: 50000, // $500.00 in cents
    currency: 'USD',
    type: 'one_time' as const,
    metadata: {
      package_id: 'premium',
      credits_fiat: 100000,
      credits_crypto: 120000, // 20% bonus
      generation_types: ['image', 'video'],
      models: ['gpt-4o', 'veo3'],
      popular: true
    }
  },
  {
    name: 'IMG/MP4 Enterprise',
    description: 'Enterprise AI generation package - 265,000 credits for business scale',
    price: 125000, // $1,250.00 in cents
    currency: 'USD',
    type: 'one_time' as const,
    metadata: {
      package_id: 'enterprise',
      credits_fiat: 265000,
      credits_crypto: 318000, // 20% bonus
      generation_types: ['image', 'video'],
      models: ['gpt-4o', 'veo3'],
      enterprise: true,
      priority_support: true
    }
  }
];

// Function to create a single product
async function createCreemProduct(product: CreemProduct): Promise<any> {
  try {
    const response = await fetch(`${CREEM_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'x-api-key': CREEM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(product)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    const result = await response.json();
    console.log(`✅ Created product: ${product.name}`);
    console.log(`   Product ID: ${result.id}`);
    console.log(`   Price: $${product.price / 100}`);
    console.log(`   Credits: ${product.metadata?.credits_fiat}`);
    console.log('');
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to create product: ${product.name}`);
    console.error(`   Error: ${error.message}`);
    throw error;
  }
}

// Function to create all products
async function createAllProducts(): Promise<Record<string, string>> {
  console.log('🚀 Creating ServiceFlow AI credit packages in Creem.io...\n');
  
  const productIds: Record<string, string> = {};
  
  for (const product of PRODUCTS_TO_CREATE) {
    try {
      const result = await createCreemProduct(product);
      productIds[product.metadata!.package_id] = result.id;
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to create ${product.name}, skipping...`);
    }
  }
  
  console.log('📋 Summary of created products:');
  console.log('================================');
  
  // Display results
  Object.entries(productIds).forEach(([packageId, productId]) => {
    const product = PRODUCTS_TO_CREATE.find(p => p.metadata!.package_id === packageId);
    console.log(`${packageId.toUpperCase()}:`);
    console.log(`  Product ID: ${productId}`);
    console.log(`  Price: $${product!.price / 100}`);
    console.log(`  Credits: ${product!.metadata!.credits_fiat}`);
    console.log('');
  });
  
  console.log('🔧 Updated CREDIT_PACKAGES configuration:');
  console.log('==========================================');
  console.log('');
  
  // Generate updated configuration
  console.log('const CREDIT_PACKAGES = {');
  console.log(`  'starter': {`);
  console.log(`    price_usd: 5,`);
  console.log(`    credits_fiat: 750,`);
  console.log(`    credits_crypto: 900,`);
  console.log(`    creem_product_id: 'prod_5gilhen0tIN6Aljqs7ZVIU', // Your existing product`);
  console.log(`    stripe_price_id: 'price_1RpJFA2M1Cr3qWQa3zukLMg8'`);
  console.log(`  },`);
  
  Object.entries(productIds).forEach(([packageId, productId]) => {
    const product = PRODUCTS_TO_CREATE.find(p => p.metadata!.package_id === packageId);
    console.log(`  '${packageId}': {`);
    console.log(`    price_usd: ${product!.price / 100},`);
    console.log(`    credits_fiat: ${product!.metadata!.credits_fiat},`);
    console.log(`    credits_crypto: ${product!.metadata!.credits_crypto},`);
    console.log(`    creem_product_id: '${productId}',`);
    console.log(`    stripe_price_id: 'price_${packageId}' // Update with your Stripe price ID`);
    console.log(`  },`);
  });
  console.log('};');
  
  console.log('');
  console.log('✨ Next steps:');
  console.log('1. Copy the product IDs above into your worker code');
  console.log('2. Set up webhook: https://srvcflo.com/api/creem/webhook');
  console.log('3. Configure webhook events: checkout.completed, payment.completed, payment.failed');
  console.log('4. Deploy your updated worker');
  
  return productIds;
}

// Node.js execution (if running directly)
if (typeof require !== 'undefined' && require.main === module) {
  createAllProducts()
    .then((productIds) => {
      console.log('\n🎉 All products created successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Product creation failed:', error);
      process.exit(1);
    });
}

// Browser/Worker execution
if (typeof window !== 'undefined' || typeof globalThis !== 'undefined') {
  console.log('Run createAllProducts() to create your Creem.io products');
}

// Alternative: Manual API calls using curl
export const CURL_COMMANDS = `
# Create Standard Package ($50, 8,000 credits)
curl -X POST "${CREEM_BASE_URL}/products" \\
  -H "x-api-key: ${CREEM_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "IMG/MP4 Standard",
    "description": "Standard AI generation package - 8,000 credits for images and videos",
    "price": 5000,
    "currency": "USD",
    "type": "one_time",
    "metadata": {
      "package_id": "standard",
      "credits_fiat": 8000,
      "credits_crypto": 9600
    }
  }'

# Create Premium Package ($500, 100,000 credits)
curl -X POST "${CREEM_BASE_URL}/products" \\
  -H "x-api-key: ${CREEM_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "IMG/MP4 Premium",
    "description": "Premium AI generation package - 100,000 credits for unlimited creativity",
    "price": 50000,
    "currency": "USD",
    "type": "one_time",
    "metadata": {
      "package_id": "premium",
      "credits_fiat": 100000,
      "credits_crypto": 120000,
      "popular": true
    }
  }'

# Create Enterprise Package ($1,250, 265,000 credits)
curl -X POST "${CREEM_BASE_URL}/products" \\
  -H "x-api-key: ${CREEM_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "IMG/MP4 Enterprise",
    "description": "Enterprise AI generation package - 265,000 credits for business scale",
    "price": 125000,
    "currency": "USD",
    "type": "one_time",
    "metadata": {
      "package_id": "enterprise",
      "credits_fiat": 265000,
      "credits_crypto": 318000,
      "enterprise": true
    }
  }'
`;

// Export for use in other modules
export {
  createCreemProduct,
  createAllProducts,
  PRODUCTS_TO_CREATE,
  CREEM_API_KEY,
  CREEM_BASE_URL
};