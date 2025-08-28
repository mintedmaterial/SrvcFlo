agents-starter
Public
cloudflare/agents-starter
Go to file
t
Name		
ghostwriternr
ghostwriternr
Bump biome schema (#98)
03d0b5f
 · 
last week
.cursor/rules
rename agents-sdk -> agents
4 months ago
.github/workflows
pass lints/typecheck, add a github workflow to run checks
3 months ago
public
first commit
5 months ago
src
Bump biome schema (#98)
last week
tests
update types an deps
4 months ago
.dev.vars.example
Adding optional cloudflare ai gateway refrence
5 months ago
.gitignore
first commit
5 months ago
.prettierignore
use wrangler types, update deps
4 months ago
.prettierrc
add linting, checks
4 months ago
LICENSE
first commit
5 months ago
README.md
Bump deps (#97)
last week
biome.json
Bump biome schema (#98)
last week
components.json
Add new visual components
4 months ago
index.html
add linting, checks
4 months ago
package-lock.json
Bump deps (#97)
last week
package.json
Bump deps (#97)
last week
tsconfig.json
close mcp connections after response
3 months ago
vite.config.ts
add linting, checks
4 months ago
vitest.config.ts
update deps, pass tests
3 months ago
worker-configuration.d.ts
update deps and types
2 months ago
wrangler.jsonc
update deps and types
2 months ago
Repository files navigation
README
Code of conduct
MIT license
Security
🤖 Chat Agent Starter Kit
agents-header

Deploy to Cloudflare

A starter template for building AI-powered chat agents using Cloudflare's Agent platform, powered by agents. This project provides a foundation for creating interactive chat experiences with AI, complete with a modern UI and tool integration capabilities.

Features
💬 Interactive chat interface with AI
🛠️ Built-in tool system with human-in-the-loop confirmation
📅 Advanced task scheduling (one-time, delayed, and recurring via cron)
🌓 Dark/Light theme support
⚡️ Real-time streaming responses
🔄 State management and chat history
🎨 Modern, responsive UI
Prerequisites
Cloudflare account
OpenAI API key
Quick Start
Create a new project:
npx create-cloudflare@latest --template cloudflare/agents-starter
Install dependencies:
npm install
Set up your environment:
Create a .dev.vars file:

OPENAI_API_KEY=your_openai_api_key
Run locally:
npm start
Deploy:
npm run deploy
Project Structure
├── src/
│   ├── app.tsx        # Chat UI implementation
│   ├── server.ts      # Chat agent logic
│   ├── tools.ts       # Tool definitions
│   ├── utils.ts       # Helper functions
│   └── styles.css     # UI styling
Customization Guide
Adding New Tools
Add new tools in tools.ts using the tool builder:

// Example of a tool that requires confirmation
const searchDatabase = tool({
  description: "Search the database for user records",
  parameters: z.object({
    query: z.string(),
    limit: z.number().optional(),
  }),
  // No execute function = requires confirmation
});

// Example of an auto-executing tool
const getCurrentTime = tool({
  description: "Get current server time",
  parameters: z.object({}),
  execute: async () => new Date().toISOString(),
});

// Scheduling tool implementation
const scheduleTask = tool({
  description:
    "schedule a task to be executed at a later time. 'when' can be a date, a delay in seconds, or a cron pattern.",
  parameters: z.object({
    type: z.enum(["scheduled", "delayed", "cron"]),
    when: z.union([z.number(), z.string()]),
    payload: z.string(),
  }),
  execute: async ({ type, when, payload }) => {
    // ... see the implementation in tools.ts
  },
});
To handle tool confirmations, add execution functions to the executions object:

export const executions = {
  searchDatabase: async ({
    query,
    limit,
  }: {
    query: string;
    limit?: number;
  }) => {
    // Implementation for when the tool is confirmed
    const results = await db.search(query, limit);
    return results;
  },
  // Add more execution handlers for other tools that require confirmation
};
Tools can be configured in two ways:

With an execute function for automatic execution
Without an execute function, requiring confirmation and using the executions object to handle the confirmed action. NOTE: The keys in executions should match toolsRequiringConfirmation in app.tsx.
Use a different AI model provider
The starting server.ts implementation uses the ai-sdk and the OpenAI provider, but you can use any AI model provider by:

Installing an alternative AI provider for the ai-sdk, such as the workers-ai-provider or anthropic provider:
Replacing the AI SDK with the OpenAI SDK
Using the Cloudflare Workers AI + AI Gateway binding API directly
For example, to use the workers-ai-provider, install the package:

npm install workers-ai-provider
Add an ai binding to wrangler.jsonc:

// rest of file
  "ai": {
    "binding": "AI"
  }
// rest of file
Replace the @ai-sdk/openai import and usage with the workers-ai-provider:

// server.ts
// Change the imports
- import { openai } from "@ai-sdk/openai";
+ import { createWorkersAI } from 'workers-ai-provider';

// Create a Workers AI instance
+ const workersai = createWorkersAI({ binding: env.AI });

// Use it when calling the streamText method (or other methods)
// from the ai-sdk
- const model = openai("gpt-4o-2024-11-20");
+ const model = workersai("@cf/deepseek-ai/deepseek-r1-distill-qwen-32b")
Commit your changes and then run the agents-starter as per the rest of this README.

Modifying the UI
The chat interface is built with React and can be customized in app.tsx:

Modify the theme colors in styles.css
Add new UI components in the chat container
Customize message rendering and tool confirmation dialogs
Add new controls to the header
Example Use Cases
Customer Support Agent

Add tools for:
Ticket creation/lookup
Order status checking
Product recommendations
FAQ database search
Development Assistant

Integrate tools for:
Code linting
Git operations
Documentation search
Dependency checking
Data Analysis Assistant

Build tools for:
Database querying
Data visualization
Statistical analysis
Report generation
Personal Productivity Assistant

Implement tools for:
Task scheduling with flexible timing options
One-time, delayed, and recurring task management
Task tracking with reminders
Email drafting
Note taking
Scheduling Assistant

Build tools for:
One-time event scheduling using specific dates
Delayed task execution (e.g., "remind me in 30 minutes")
Recurring tasks using cron patterns
Task payload management
Flexible scheduling patterns
Each use case can be implemented by:

Adding relevant tools in tools.ts
Customizing the UI for specific interactions
Extending the agent's capabilities in server.ts
Adding any necessary external API integrations