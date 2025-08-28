Possible replacement for admin dashboard once we start working on users being able to launch agents and workflows from our Agents UI



SaaS Admin Template
Deploy to Cloudflare

SaaS Admin Template

A complete admin dashboard template built with Astro, Shadcn UI, and Cloudflare's developer stack. Quickly deploy a fully functional admin interface with customer and subscription management capabilities.

Features
🎨 Modern UI built with Astro and Shadcn UI
🔐 Built-in API with token authentication
👥 Customer management
💳 Subscription tracking
🚀 Deploy to Cloudflare Workers
📦 Powered by Cloudflare D1 database
✨ Clean, responsive interface
🔍 Data validation with Zod
Tech Stack
Frontend: Astro
UI Components: Shadcn UI
Database: Cloudflare D1
Deployment: Cloudflare Workers
Validation: Zod
Important

When using C3 to create this project, select "no" when it asks if you want to deploy. You need to follow this project's setup steps before deploying.

Setup Steps
Install dependencies:
npm install
Set up your environment variables:
# Create a .dev.vars file for local development
cp .dev.vars.example .dev.vars
Add your API token:

API_TOKEN=your_token_here
An API token is required to authenticate requests to the API. You should generate this before trying to run the project locally or deploying it.

Create a D1 database with the name "admin-db":
npx wrangler d1 create admin-db
...and update the database_id field in wrangler.json with the new database ID.

Run the database migrations locally:
$ npm run db:migrate
Run the development server:

npm run dev
If you're testing Workflows, you should run npm run wrangler:dev instead.

Build the application:
npm run build
Deploy to Cloudflare Workers:
npm run deploy
Run the database migrations remotely:
$ npm run db:migrate:remote
Set your production API token:
npx wrangler secret put API_TOKEN
Usage
This project includes a fully functional admin dashboard with customer and subscription management capabilities. It also includes an API with token authentication to access resources via REST, returning JSON data.

It also includes a "Customer Workflow", built with Cloudflare Workflows. This workflow can be triggered in the UI or via the REST API to do arbitrary actions in the background for any given user. See customer_workflow.ts to learn more about what you can do in this workflow.