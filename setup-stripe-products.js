const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const creditPackages = [
  {
    name: 'Starter Credits',
    description: '750 AI generation credits',
    credits: 750,
    price: 500, // $5.00 in cents
    package_id: 'starter'
  },
  {
    name: 'Standard Credits',
    description: '8,000 AI generation credits',
    credits: 8000,
    price: 5000, // $50.00 in cents
    package_id: 'standard'
  },
  {
    name: 'Premium Credits',
    description: '100,000 AI generation credits',
    credits: 100000,
    price: 50000, // $500.00 in cents
    package_id: 'premium'
  },
  {
    name: 'Enterprise Credits',
    description: '265,000 AI generation credits',
    credits: 265000,
    price: 125000, // $1,250.00 in cents
    package_id: 'enterprise'
  }
];

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...\n');
  
  const results = [];
  
  for (const package of creditPackages) {
    try {
      // Create product
      console.log(`Creating product: ${package.name}`);
      const product = await stripe.products.create({
        name: package.name,
        description: package.description,
        metadata: {
          package_id: package.package_id,
          credits: package.credits.toString()
        }
      });
      
      console.log(`✓ Product created: ${product.id}`);
      
      // Create price for the product
      console.log(`Creating price for ${package.name}`);
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: package.price,
        currency: 'usd',
        metadata: {
          package_id: package.package_id,
          credits: package.credits.toString()
        }
      });
      
      console.log(`✓ Price created: ${price.id}`);
      
      results.push({
        package: package.name,
        credits: package.credits,
        amount: `$${(package.price / 100).toFixed(2)}`,
        product_id: product.id,
        price_id: price.id
      });
      
      console.log('---');
      
    } catch (error) {
      console.error(`Error creating ${package.name}:`, error.message);
    }
  }
  
  // Display results summary
  console.log('\n🎉 Stripe Products and Prices Created Successfully!\n');
  console.log('PRICE IDs for your application:\n');
  
  results.forEach(result => {
    console.log(`${result.package}:`);
    console.log(`  Credits: ${result.credits.toLocaleString()}`);
    console.log(`  Price: ${result.amount}`);
    console.log(`  Product ID: ${result.product_id}`);
    console.log(`  Price ID: ${result.price_id}`);
    console.log('');
  });
  
  // Create a summary for easy copy-paste
  console.log('Price IDs Summary (for environment variables):');
  console.log('STRIPE_STARTER_PRICE_ID=' + results.find(r => r.package === 'Starter Credits')?.price_id);
  console.log('STRIPE_STANDARD_PRICE_ID=' + results.find(r => r.package === 'Standard Credits')?.price_id);
  console.log('STRIPE_PREMIUM_PRICE_ID=' + results.find(r => r.package === 'Premium Credits')?.price_id);
  console.log('STRIPE_ENTERPRISE_PRICE_ID=' + results.find(r => r.package === 'Enterprise Credits')?.price_id);
  
  return results;
}

// Run the script
createStripeProducts()
  .then((results) => {
    console.log('\n✅ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });