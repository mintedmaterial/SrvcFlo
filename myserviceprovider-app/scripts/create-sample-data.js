const { MongoClient, ServerApiVersion } = require("mongodb");
const fs = require('fs');
const path = require('path');

// MongoDB connection URL
const uri = process.env.MONGODB_URI || "mongodb+srv://MintedMaterial:Myrecovery1@myserviceprovider.qo7uihg.mongodb.net/?retryWrites=true&w=majority&appName=MyServiceProvider";

// Instantiating the MongoClient with updated options
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const dbName = "myserviceprovider"; // Correctly define the database name

async function createSampleData() {
    try {
        await client.connect();
        console.log("Connected correctly to server");

        const db = client.db(dbName);  // Use the defined database name

        // Read the scraped data from JSON files
        const hairSalonData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/hair_salon_products.json'), 'utf8'));
        const contractorData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/contractor_products.json'), 'utf8'));

        // Insert the data into respective collections
        await db.collection('hair_salon_products').insertMany(hairSalonData);
        await db.collection('contractor_products').insertMany(contractorData);

        console.log("Sample data inserted successfully.");
    } catch (err) {
        console.error(err.stack);
    } finally {
        await client.close();
    }
}

createSampleData();