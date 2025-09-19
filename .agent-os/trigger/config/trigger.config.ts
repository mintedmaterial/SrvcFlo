import { defineConfig } from "@trigger.dev/sdk";
import { pythonExtension } from "@trigger.dev/build/extensions/python";
import { additionalFiles } from "@trigger.dev/build/extensions/core";
import { syncEnvVars } from "@trigger.dev/build/extensions/core";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID!,
  dirs: ["./trigger/tasks"],
  runtime: "node",
  logLevel: "info",

  // Default retry settings for all tasks
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },

  // Build configuration for Agno agents and MCP servers
  build: {
    autoDetectExternal: true,
    keepNames: true,
    minify: false,
    extensions: [
      // Python extension for Agno framework agents
      pythonExtension({
        scripts: [
          "./agent-ui/Agents/**/*.py",
          "./myserviceprovider-app/Agents/**/*.py"
        ],
        requirementsFile: "./requirements.txt",
        devPythonBinaryPath: ".venv/bin/python",
      }),

      // Include agent configurations and MCP server files
      additionalFiles({
        files: [
          "./agent-ui/Agents/tmp/**",
          "./agent-ui/Agents/Tools/**",
          "./mcp-servers/**/*.py",
          "./mcp-servers/**/*.json",
          "./.agent-os/trigger/lib/**"
        ],
      }),

      // Sync environment variables for API keys and secrets
      syncEnvVars(async (ctx) => {
        const envVars = [
          { name: "OPENAI_API_KEY", value: process.env.OPENAI_API_KEY },
          { name: "DISCORD_TOKEN", value: process.env.DISCORD_TOKEN },
          { name: "TWITTER_API_KEY", value: process.env.TWITTER_API_KEY },
          { name: "TWITTER_API_SECRET", value: process.env.TWITTER_API_SECRET },
          { name: "PAINTSWAP_API_KEY", value: process.env.PAINTSWAP_API_KEY },
          { name: "MONGODB_URI", value: process.env.MONGODB_URI },
          { name: "SONIC_RPC_URL", value: process.env.SONIC_RPC_URL },
          { name: "THIRDWEB_SECRET_KEY", value: process.env.THIRDWEB_SECRET_KEY },
        ];

        // Environment-specific configurations
        if (ctx.environment === "staging") {
          envVars.push(
            { name: "MCP_SERVERS_BASE_URL", value: "http://localhost" },
            { name: "AGENT_UI_URL", value: "https://agent-ui-staging.serviceflow.ai" }
          );
        } else if (ctx.environment === "production") {
          envVars.push(
            { name: "MCP_SERVERS_BASE_URL", value: "https://mcp.serviceflow.ai" },
            { name: "AGENT_UI_URL", value: "https://agent-ui.serviceflow.ai" }
          );
        }

        return envVars.filter(env => env.value); // Only include vars with values
      }),
    ],
  },

  // Default machine configuration
  defaultMachine: "small-1x", // 0.5 vCPU, 0.5 GB RAM
  maxDuration: 1800, // 30 minutes default timeout
  enableConsoleLogging: true,

  // Global lifecycle hooks for monitoring
  onStart: async ({ payload, ctx }) => {
    console.log(`🚀 Starting ${ctx.task.id} for ${ctx.environment}`);
  },

  onSuccess: async ({ payload, output, ctx }) => {
    console.log(`✅ Completed ${ctx.task.id} successfully`);
  },

  onFailure: async ({ payload, error, ctx }) => {
    console.error(`❌ Failed ${ctx.task.id}:`, error.message);
  },
});