// Create database indexes for ServiceFlow AI SaaS Platform
// Usage: node scripts/setup-indexes.js

const { MongoClient, ServerApiVersion } = require("mongodb")

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://MintedMaterial:Myrecovery1@myserviceprovider.qo7uihg.mongodb.net/?retryWrites=true&w=majority&appName=MyServiceProvider"

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function setupIndexes() {
  try {
    await client.connect()
    console.log("🔗 Connected to MongoDB Atlas")

    // Use consistent database name across JavaScript and Python code
    const db = client.db("myserviceprovider")

    // Create indexes for businesses collection
    console.log("📊 Creating indexes for businesses collection...")
    await db.createCollection("hair_salon_products", {
            validator: {
                $jsonSchema: {
                    bsonType: "object",
                    required: ["name", "sku", "price", "description"],
                    properties: {
                        name: { bsonType: "string" },
                        sku: { bsonType: "string" },
                        price: { bsonType: "number" },
                        description: { bsonType: "string" }
                    }
                }
            }
        });
        await db.collection("hair_salon_products").createIndex({ name: 1 });

        await db.createCollection("contractor_products", {
            validator: {
                $jsonSchema: {
                    bsonType: "object",
                    required: ["name", "sku", "price", "description"],
                    properties: {
                        name: { bsonType: "string" },
                        sku: { bsonType: "string" },
                        price: { bsonType: "number" },
                        description: { bsonType: "string" }
                    }
                }
            }
        });
        await db.collection("contractor_products").createIndex({ name: 1 });

        // Create building codes collection for PDF documents
        console.log("📊 Creating indexes for building_codes collection...")
        await db.createCollection("building_codes", {
            validator: {
                $jsonSchema: {
                    bsonType: "object",
                    required: ["state", "code_type", "filename", "url"],
                    properties: {
                        state: { bsonType: "string" },
                        code_type: { bsonType: "string" },
                        filename: { bsonType: "string" },
                        url: { bsonType: "string" },
                        description: { bsonType: "string" },
                        priority: { bsonType: "number" },
                        load_enabled: { bsonType: "bool" },
                        created_at: { bsonType: "date" },
                        updated_at: { bsonType: "date" }
                    }
                }
            }
        });
        await db.collection("building_codes").createIndex({ state: 1, code_type: 1 });
        await db.collection("building_codes").createIndex({ state: 1 });

        // Create building code agent sessions collection
        await db.createCollection("building_code_oklahoma_agent");
        await db.collection("building_code_oklahoma_agent").createIndex({ session_id: 1 });
        await db.collection("building_code_oklahoma_agent").createIndex({ created_at: 1 });

        console.log("Indexes and collections setup completed.");
    } catch (err) {
        console.error(err.stack);
    }

    client.close();
}

setupIndexes();