const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));

// Test route to create a Creem product first
app.get('/create-product', async (req, res) => {
    try {
        console.log('🚀 Creating test product...');
        
        const response = await axios.post(
            'https://test-api.creem.io/v1/products',
            {
                name: 'ServiceFlow AI Test Credits',
                description: 'Test credit package for ServiceFlow AI',
                price: 5.00,
                currency: 'USD',
                billing_type: 'one_time'
            },
            {
                headers: { 
                    'x-api-key': process.env.CREEM_API_KEY,
                    'Content-Type': 'application/json'
                },
            }
        );
        
        console.log('✅ Product created:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('❌ Error creating product:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Product Creation Failed',
            details: error.response?.data || error.message
        });
    }
});

// Test route for Creem checkout
app.get('/checkout', async (req, res) => {
    try {
        console.log('🚀 Creating Creem checkout...');
        
        const response = await axios.post(
            'https://test-api.creem.io/v1/checkouts',
            {
                product_id: 'prod_7aS6hakazt3bDNRLNUijGX', // Use test product ID
                metadata: {
                    package_id: 'test',
                    user_email: 'test@example.com',
                    credits: 900,
                    bonus_type: 'crypto_bonus',
                    source: 'serviceflow_ai_test'
                }
            },
            {
                headers: { 
                    'x-api-key': process.env.CREEM_API_KEY,
                    'Content-Type': 'application/json'
                },
            }
        );
        
        console.log('✅ Checkout created:', response.data.id);
        console.log('🔗 Checkout URL:', response.data.checkout_url);
        
        // Redirect to the checkout URL
        res.redirect(response.data.checkout_url);
    } catch (error) {
        console.error('❌ Error creating checkout:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
});

// Webhook endpoint for Creem
app.post('/webhook/creem', (req, res) => {
    try {
        console.log('🔔 Creem webhook received');
        console.log('📦 Headers:', req.headers);
        console.log('📦 Body:', req.body);
        
        const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        
        console.log(`📦 Event type: ${event.eventType}`, event.id);
        
        switch (event.eventType) {
            case 'checkout.completed':
                console.log('💳 Checkout completed!');
                console.log('👤 Customer:', event.object.customer?.email);
                console.log('💰 Amount:', event.object.order?.amount);
                console.log('📋 Metadata:', event.object.metadata);
                break;
                
            case 'subscription.paid':
                console.log('💰 Subscription payment received');
                break;
                
            default:
                console.log(`⚠️ Unhandled event type: ${event.eventType}`);
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).send('Webhook processing failed');
    }
});

// Test route to simulate AI generation page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>ServiceFlow AI - Creem Test</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                .button { background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
                .crypto { background: linear-gradient(135deg, #f97316, #dc2626); }
                .card { background: linear-gradient(135deg, #3b82f6, #8b5cf6); }
                h1 { color: #333; }
                .status { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <h1>🎨 ServiceFlow AI - Payment Test</h1>
            
            <div class="status">
                <h3>Test Configuration:</h3>
                <p><strong>Product ID:</strong> ${process.env.CREEM_TEST_PRODUCT_ID || 'prod_7aS6hakazt3bDNRLNUijGX'}</p>
                <p><strong>API Key:</strong> ${process.env.CREEM_API_KEY ? 'Configured ✅' : 'Missing ❌'}</p>
                <p><strong>Webhook URL:</strong> http://localhost:${port}/webhook/creem</p>
            </div>
            
            <h3>💳 Test Purchase Options:</h3>
            
            <a href="/create-product" class="button card">
                🏭 Create Test Product
            </a>
            
            <a href="/checkout" class="button crypto">
                🪙 Test Crypto Payment (900 credits)
            </a>
            
            <div class="status">
                <h4>📋 Test Flow:</h4>
                <ol>
                    <li>Click the payment button above</li>
                    <li>Complete the Creem checkout (test mode)</li>
                    <li>Check console logs for webhook events</li>
                    <li>Verify credit addition in your database</li>
                </ol>
            </div>
            
            <div class="status">
                <h4>🔍 Monitoring:</h4>
                <p>Watch your console for webhook events and checkout creation logs.</p>
                <p>Webhook endpoint: <code>POST http://localhost:${port}/webhook/creem</code></p>
            </div>
        </body>
        </html>
    `);
});

// Error handling
app.use((error, req, res, next) => {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`🚀 ServiceFlow AI Test Server running on http://localhost:${port}`);
    console.log('📊 Available routes:');
    console.log(`   - GET  http://localhost:${port}/          (Test page)`);
    console.log(`   - GET  http://localhost:${port}/checkout  (Create Creem checkout)`);
    console.log(`   - POST http://localhost:${port}/webhook/creem (Webhook endpoint)`);
    console.log('');
    console.log('🔧 Configuration:');
    console.log(`   - Creem API Key: ${process.env.CREEM_API_KEY ? 'Configured ✅' : 'Missing ❌'}`);
    console.log(`   - Test Product: ${process.env.CREEM_TEST_PRODUCT_ID || 'prod_7aS6hakazt3bDNRLNUijGX'}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Visit http://localhost:3000 to test');
    console.log('2. Set up ngrok: ngrok http 3000');
    console.log('3. Configure webhook in Creem dashboard');
});