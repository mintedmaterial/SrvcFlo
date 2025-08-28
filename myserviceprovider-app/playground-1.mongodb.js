/* global use, db */
// MongoDB Playground
// To disable this template go to Settings | MongoDB | Use Default Template For Playground.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.
// The result of the last command run in a playground is shown on the results panel.
// By default the first 20 documents will be returned with a cursor.
// Use 'console.log()' to print to the debug output.
// For more documentation on playgrounds please refer to
// https://www.mongodb.com/docs/mongodb-vscode/playgrounds/

// Select the database to use.
use('southeast_remodeling');

// Insert sample customers
db.getCollection('customers').insertMany([
  {
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, Oklahoma City, OK 73102",
    projectDescription: "Kitchen remodel with new cabinets, countertops, and appliances",
    status: "new",
    estimatedValue: 15000,
    source: "website",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "(555) 987-6543",
    address: "456 Oak Ave, Tulsa, OK 74101",
    projectDescription: "Deck construction - 20x16 composite deck with railings",
    status: "quoted",
    estimatedValue: 8500,
    source: "website",
    createdAt: new Date("2025-01-02"),
    updatedAt: new Date("2025-01-03"),
  },
  {
    name: "Mike Wilson",
    email: "mike.wilson@example.com",
    phone: "(555) 456-7890",
    address: "789 Pine St, Norman, OK 73019",
    projectDescription: "Trim carpentry for living room and dining room",
    status: "scheduled",
    estimatedValue: 3200,
    source: "website",
    createdAt: new Date("2025-01-03"),
    updatedAt: new Date("2025-01-04"),
  },
]);

// Insert sample projects
db.getCollection('projects').insertMany([
  {
    customerId: null, // Will need to be updated with actual ObjectId after customer insertion
    clientName: "Sarah Johnson",
    projectType: "Deck Construction",
    status: "in-progress",
    progress: 65,
    startDate: new Date("2024-12-15"),
    endDate: new Date("2025-01-22"),
    estimatedValue: 8500,
    description: "20x16 composite deck with railings and stairs",
    materials: ["Composite decking", "Aluminum railings", "Concrete footings"],
    assignedTeam: ["Mike", "John"],
    createdAt: new Date("2024-12-10"),
    updatedAt: new Date("2025-01-04"),
  },
  {
    customerId: null, // Will need to be updated with actual ObjectId after customer insertion
    clientName: "Mike Wilson",
    projectType: "Trim Carpentry",
    status: "scheduled",
    progress: 0,
    startDate: new Date("2025-01-15"),
    endDate: new Date("2025-01-17"),
    estimatedValue: 3200,
    description: "Crown molding and baseboards for living and dining rooms",
    materials: ["Crown molding", "Baseboards", "Wood stain", "Finishing nails"],
    assignedTeam: ["Dave"],
    createdAt: new Date("2025-01-04"),
    updatedAt: new Date("2025-01-04"),
  },
]);

// Insert sample conversations
db.getCollection('conversations').insertMany([
  {
    customerEmail: "john.smith@example.com",
    messages: [
      {
        role: "user",
        content: "I need an estimate for a kitchen remodel",
        timestamp: new Date("2025-01-01T10:00:00Z"),
      },
      {
        role: "assistant",
        content:
          "I'd be happy to help with your kitchen remodel estimate! Can you tell me the approximate size of your kitchen and what specific updates you're looking for?",
        timestamp: new Date("2025-01-01T10:00:30Z"),
      },
      {
        role: "user",
        content: "It's about 12x14 feet. I want new cabinets, granite countertops, and stainless steel appliances",
        timestamp: new Date("2025-01-01T10:02:00Z"),
      },
    ],
    estimatesGenerated: [
      {
        service: "Kitchen Remodel",
        amount: 15000,
        breakdown: {
          materials: 9000,
          labor: 4500,
          markup: 1500,
        },
      },
    ],
    leadScore: 85,
    createdAt: new Date("2025-01-01T10:00:00Z"),
    updatedAt: new Date("2025-01-01T10:02:00Z"),
  },
]);

// Run a find command to view projects starting in January 2025
const projectsInJan2025 = db.getCollection('projects').find({
  startDate: { $gte: new Date('2025-01-01'), $lt: new Date('2025-02-01') }
}).count();

// Print a message to the output window
console.log(`${projectsInJan2025} projects scheduled to start in January 2025.`);

// Run an aggregation to calculate total estimated value by project type
db.getCollection('projects').aggregate([
  // Match projects from 2025
  { $match: { startDate: { $gte: new Date('2025-01-01'), $lt: new Date('2026-01-01') } } },
  // Group by project type and sum estimated values
  { $group: { _id: '$projectType', totalEstimatedValue: { $sum: '$estimatedValue' } } }
]);