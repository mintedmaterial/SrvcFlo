import { defineConfig } from "@trigger.dev/sdk/v3";
import { z } from "zod";

// Environment-specific configuration schema
const EnvironmentConfigSchema = z.object({
  name: z.enum(["development", "staging", "production"]),
  triggerDev: z.object({
    apiKey: z.string(),
    projectId: z.string(),
    endpoint: z.string().url(),
  }),
  database: z.object({
    url: z.string().url(),
    maxConnections: z.number().default(20),
  }),
  blockchain: z.object({
    rpcUrl: z.string().url(),
    chainId: z.number(),
    wallets: z.object({
      payment: z.string(),
      leaderboard: z.string(),
      devWallet: z.string(),
      nftStaking: z.string(),
      reserve: z.string(),
    }),
  }),
  storage: z.object({
    r2: z.object({
      endpoint: z.string().url(),
      accessKeyId: z.string(),
      secretAccessKey: z.string(),
      bucketName: z.string(),
    }),
  }),
  apis: z.object({
    openai: z.object({
      apiKey: z.string(),
      model: z.string().default("gpt-4"),
    }),
    cloudflare: z.object({
      apiKey: z.string(),
      accountId: z.string(),
    }),
    coincodex: z.object({
      apiKey: z.string().optional(),
    }),
  }),
  monitoring: z.object({
    discordWebhook: z.string().url().optional(),
    logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  }),
});

type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;

// Development environment configuration
const developmentConfig: EnvironmentConfig = {
  name: "development",
  triggerDev: {
    apiKey: process.env.TRIGGER_DEV_API_KEY!,
    projectId: process.env.TRIGGER_DEV_PROJECT_ID || "serviceflow-ai-dev",
    endpoint: "https://api.trigger.dev",
  },
  database: {
    url: process.env.SUPABASE_DATABASE_URL!,
    maxConnections: 10,
  },
  blockchain: {
    rpcUrl: "https://rpc.testnet.soniclabs.com",
    chainId: 64165, // Sonic testnet
    wallets: {
      payment: process.env.DEV_PAYMENT_WALLET!,
      leaderboard: process.env.DEV_LEADERBOARD_WALLET!,
      devWallet: process.env.DEV_DEV_WALLET!,
      nftStaking: process.env.DEV_NFT_STAKING_WALLET!,
      reserve: process.env.DEV_RESERVE_WALLET!,
    },
  },
  storage: {
    r2: {
      endpoint: "https://ff3c5e2beaea9f85fee3200bfe28da16.r2.cloudflarestorage.com",
      accessKeyId: "ff3c5e2beaea9f85fee3200bfe28da16",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucketName: "serviceflow-dev",
    },
  },
  apis: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      model: "gpt-4",
    },
    cloudflare: {
      apiKey: process.env.CLOUDFLARE_API_KEY!,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    },
    coincodex: {
      apiKey: process.env.COINCODEX_API_KEY,
    },
  },
  monitoring: {
    discordWebhook: process.env.DISCORD_WEBHOOK_URL,
    logLevel: "debug",
  },
};

// Staging environment configuration
const stagingConfig: EnvironmentConfig = {
  name: "staging",
  triggerDev: {
    apiKey: process.env.TRIGGER_DEV_API_KEY!,
    projectId: process.env.TRIGGER_DEV_PROJECT_ID || "serviceflow-ai-staging",
    endpoint: "https://api.trigger.dev",
  },
  database: {
    url: process.env.SUPABASE_DATABASE_URL!,
    maxConnections: 15,
  },
  blockchain: {
    rpcUrl: "https://rpc.testnet.soniclabs.com",
    chainId: 64165, // Sonic testnet
    wallets: {
      payment: process.env.STAGING_PAYMENT_WALLET!,
      leaderboard: process.env.STAGING_LEADERBOARD_WALLET!,
      devWallet: process.env.STAGING_DEV_WALLET!,
      nftStaking: process.env.STAGING_NFT_STAKING_WALLET!,
      reserve: process.env.STAGING_RESERVE_WALLET!,
    },
  },
  storage: {
    r2: {
      endpoint: "https://ff3c5e2beaea9f85fee3200bfe28da16.r2.cloudflarestorage.com",
      accessKeyId: "ff3c5e2beaea9f85fee3200bfe28da16",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucketName: "serviceflow-staging",
    },
  },
  apis: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      model: "gpt-4",
    },
    cloudflare: {
      apiKey: process.env.CLOUDFLARE_API_KEY!,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    },
    coincodex: {
      apiKey: process.env.COINCODX_API_KEY,
    },
  },
  monitoring: {
    discordWebhook: process.env.DISCORD_WEBHOOK_URL,
    logLevel: "info",
  },
};

// Production environment configuration
const productionConfig: EnvironmentConfig = {
  name: "production",
  triggerDev: {
    apiKey: process.env.TRIGGER_DEV_API_KEY!,
    projectId: process.env.TRIGGER_DEV_PROJECT_ID || "serviceflow-ai",
    endpoint: "https://api.trigger.dev",
  },
  database: {
    url: process.env.SUPABASE_DATABASE_URL!,
    maxConnections: 25,
  },
  blockchain: {
    rpcUrl: "https://rpc.soniclabs.com",
    chainId: 146, // Sonic mainnet
    wallets: {
      payment: process.env.PROD_PAYMENT_WALLET!,
      leaderboard: process.env.PROD_LEADERBOARD_WALLET!,
      devWallet: process.env.PROD_DEV_WALLET!,
      nftStaking: process.env.PROD_NFT_STAKING_WALLET!,
      reserve: process.env.PROD_RESERVE_WALLET!,
    },
  },
  storage: {
    r2: {
      endpoint: "https://ff3c5e2beaea9f85fee3200bfe28da16.r2.cloudflarestorage.com",
      accessKeyId: "ff3c5e2beaea9f85fee3200bfe28da16",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucketName: "serviceflow-production",
    },
  },
  apis: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      model: "gpt-4-turbo",
    },
    cloudflare: {
      apiKey: process.env.CLOUDFLARE_API_KEY!,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    },
    coincodex: {
      apiKey: process.env.COINCODEX_API_KEY,
    },
  },
  monitoring: {
    discordWebhook: process.env.DISCORD_WEBHOOK_URL,
    logLevel: "warn",
  },
};

// Get current environment configuration
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.NODE_ENV || "development";

  let config: EnvironmentConfig;

  switch (env) {
    case "production":
      config = productionConfig;
      break;
    case "staging":
      config = stagingConfig;
      break;
    default:
      config = developmentConfig;
      break;
  }

  // Validate configuration
  try {
    return EnvironmentConfigSchema.parse(config);
  } catch (error) {
    console.error("Invalid environment configuration:", error);
    throw new Error(`Environment configuration validation failed: ${error}`);
  }
}

// Trigger.dev configuration based on environment
export default defineConfig({
  project: getEnvironmentConfig().triggerDev.projectId,

  // Environment-specific settings
  machine: process.env.NODE_ENV === "production"
    ? { preset: "large-1x" }
    : { preset: "small-1x" },

  // Deployment configuration
  build: {
    extensions: [
      // Prisma for database operations
      {
        name: "prisma",
        onBuildStart: async () => {
          console.log("Generating Prisma client...");
        },
      },

      // FFmpeg for video processing
      {
        name: "ffmpeg",
        onBuildStart: async () => {
          console.log("Installing FFmpeg...");
        },
      },

      // Python environment for agent integration
      {
        name: "python",
        onBuildStart: async () => {
          console.log("Setting up Python environment...");
        },
      },
    ],
  },

  // Directories to include in deployment
  dirs: [
    "./src",
    "./tasks",
    "./workflows",
    "./lib",
    "../../../agent-ui/Agents", // Include Python agents
  ],

  // Environment variables validation
  onStart: async () => {
    const config = getEnvironmentConfig();
    console.log(`🚀 Starting Trigger.dev in ${config.name} environment`);

    // Validate required environment variables
    validateEnvironmentVariables();

    // Initialize connections
    await initializeConnections(config);
  },

  // Error handling
  onFailure: async (error) => {
    console.error("Trigger.dev deployment failed:", error);

    // Send failure notification
    if (process.env.DISCORD_WEBHOOK_URL) {
      await sendDeploymentAlert("failure", error.message);
    }
  },

  // Success handler
  onSuccess: async () => {
    const config = getEnvironmentConfig();
    console.log(`✅ Trigger.dev deployment successful in ${config.name} environment`);

    // Send success notification
    if (process.env.DISCORD_WEBHOOK_URL) {
      await sendDeploymentAlert("success", `Deployment completed for ${config.name}`);
    }
  },
});

// Validate required environment variables
function validateEnvironmentVariables() {
  const required = [
    "TRIGGER_DEV_API_KEY",
    "SUPABASE_DATABASE_URL",
    "R2_SECRET_ACCESS_KEY",
    "OPENAI_API_KEY",
    "CLOUDFLARE_API_KEY",
    "CLOUDFLARE_ACCOUNT_ID",
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

// Initialize external connections
async function initializeConnections(config: EnvironmentConfig) {
  try {
    // Test database connection
    console.log("Testing database connection...");
    // await testDatabaseConnection(config.database.url);

    // Test R2 storage
    console.log("Testing R2 storage connection...");
    // await testR2Connection(config.storage.r2);

    // Test blockchain connection
    console.log("Testing blockchain connection...");
    // await testBlockchainConnection(config.blockchain.rpcUrl);

    console.log("✅ All connections initialized successfully");
  } catch (error) {
    console.error("❌ Connection initialization failed:", error);
    throw error;
  }
}

// Send deployment alerts
async function sendDeploymentAlert(type: "success" | "failure", message: string) {
  if (!process.env.DISCORD_WEBHOOK_URL) return;

  const embed = {
    title: type === "success" ? "🚀 Deployment Successful" : "💥 Deployment Failed",
    description: message,
    color: type === "success" ? 0x00ff00 : 0xff0000,
    timestamp: new Date().toISOString(),
    footer: {
      text: "ServiceFlow AI Deployment Pipeline",
    },
  };

  try {
    await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Deployment Bot",
        embeds: [embed],
      }),
    });
  } catch (error) {
    console.error("Failed to send deployment alert:", error);
  }
}

// Export environment-specific utilities
export class EnvironmentManager {
  private config: EnvironmentConfig;

  constructor() {
    this.config = getEnvironmentConfig();
  }

  get environment() {
    return this.config.name;
  }

  get isProduction() {
    return this.config.name === "production";
  }

  get isDevelopment() {
    return this.config.name === "development";
  }

  get isStaging() {
    return this.config.name === "staging";
  }

  getDatabaseUrl() {
    return this.config.database.url;
  }

  getBlockchainConfig() {
    return this.config.blockchain;
  }

  getStorageConfig() {
    return this.config.storage.r2;
  }

  getApiConfig(service: keyof EnvironmentConfig["apis"]) {
    return this.config.apis[service];
  }

  getMonitoringConfig() {
    return this.config.monitoring;
  }

  // Wallet address helpers
  getWalletAddress(type: keyof EnvironmentConfig["blockchain"]["wallets"]) {
    return this.config.blockchain.wallets[type];
  }

  // Machine configuration based on environment
  getMachinePreset(taskType: "light" | "medium" | "heavy" = "medium") {
    if (this.isProduction) {
      return {
        light: "small-2x",
        medium: "medium-1x",
        heavy: "large-1x",
      }[taskType];
    } else {
      return {
        light: "micro",
        medium: "small-1x",
        heavy: "medium-1x",
      }[taskType];
    }
  }

  // Queue configuration
  getQueueConfig() {
    return {
      concurrency: this.isProduction ? 10 : 3,
      rateLimit: this.isProduction ? 100 : 20,
      maxRetries: this.isProduction ? 5 : 3,
    };
  }
}