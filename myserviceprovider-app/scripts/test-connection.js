// Test MongoDB Atlas connection for MyServiceProvider
// Usage: node scripts/test-connection.js

const { MongoClient, ServerApiVersion } = require("mongodb")

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://MintedMaterial:Myrecovery1@myserviceprovider.qo7uihg.mongodb.net/?retryWrites=true&w=majority&appName=MyServiceProvider"

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function run() {
  try {
    // Connect the client to the server
    await client.connect()

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 })
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!")

    // Test the MyServiceProvider database
    const db = client.db("myserviceprovider")

    // Check if super admin user exists
    const superAdmin = await db.collection("admin_users").findOne({
      email: "admin@serviceflowai.com",
      role: "super_admin",
    })
    if (superAdmin) {
      console.log("✅ Super admin user found in database")
    } else {
      console.log("⚠️  Super admin user not found - you may need to create one")
    }

    // List all collections
    const collections = await db.listCollections().toArray()
    console.log(
      "📁 Available collections:",
      collections.map((c) => c.name),
    )

    // Test inserting a sample business (will be removed)
    const testBusiness = {
      businessName: "Test Business",
      businessType: "test",
      ownerName: "Test Owner",
      email: "test@example.com",
      phone: "(555) 000-0000",
      packageType: "basic",
      packagePrice: 200,
      packageStartDate: new Date(),
      packageStatus: "trial",
      agentSettings: {
        chatbotEnabled: true,
        phoneAgentEnabled: false,
        socialMediaEnabled: false,
        videoContentEnabled: false,
        leadScoringEnabled: true,
      },
      metrics: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("businesses").insertOne(testBusiness)
    console.log("✅ Test business inserted with ID:", result.insertedId)

    // Remove the test business
    await db.collection("businesses").deleteOne({ _id: result.insertedId })
    console.log("✅ Test business removed")

    // Check existing businesses count
    const businessCount = await db.collection("businesses").countDocuments()
    console.log(`📊 Current businesses in platform: ${businessCount}`)

    // Check subscriptions
    const subscriptionCount = await db.collection("subscriptions").countDocuments()
    console.log(`💳 Active subscriptions: ${subscriptionCount}`)

    // Check Python agent collections
    const agentSessionCount = await db.collection("agent_sessions").countDocuments()
    console.log(`🤖 Agent sessions: ${agentSessionCount}`)

    const teamSessionCount = await db.collection("team_sessions").countDocuments()
    console.log(`👥 Team sessions: ${teamSessionCount}`)
    
    // Check user memories collection
    const userMemoriesCount = await db.collection("user_memories").countDocuments()
    console.log(`🧠 User memories: ${userMemoriesCount}`)
    
    // Test inserting a sample memory (will be removed)
    const testMemory = {
      userId: "test@example.com",
      businessId: "test_business_id",
      memory: "This is a test memory for connection verification.",
      importance: 0.75,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const memoryResult = await db.collection("user_memories").insertOne(testMemory)
    console.log("✅ Test memory inserted with ID:", memoryResult.insertedId)
    
    // Remove the test memory
    await db.collection("user_memories").deleteOne({ _id: memoryResult.insertedId })
    console.log("✅ Test memory removed")
    
    // Test retrieving memories for a specific user
    if (userMemoriesCount > 0) {
      const sampleUser = await db.collection("user_memories").findOne({})
      if (sampleUser) {
        const userId = sampleUser.userId
        const userMemories = await db.collection("user_memories")
          .find({ userId: userId })
          .sort({ importance: -1 })
          .limit(3)
          .toArray()
        
        console.log(`🧠 Top 3 memories for user ${userId}:`)
        userMemories.forEach((memory, index) => {
          console.log(`  ${index + 1}. ${memory.memory} (importance: ${memory.importance})`)
        })
      }
    }

    console.log("\n🎉 MyServiceProvider MongoDB connection is working perfectly!")
    console.log("🚀 Your SaaS platform database is ready for multi-tenant operations.")
  } catch (error) {
    console.error("❌ Connection failed:", error)
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close()
  }
}

run().catch(console.dir)
