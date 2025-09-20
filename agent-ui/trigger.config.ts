import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "serviceflow-ai-agents",
  projectRef: "proj_serviceflow_ai_sonic",

  // Directories to scan for trigger files
  dirs: ["./trigger"],

  // Build configuration
  build: {
    // Extensions for additional capabilities
    extensions: [
      // Add any required build extensions here
      // For example: prismaExtension(), ffmpegExtension(), etc.
    ],
  },

  // Environment configuration
  environments: {
    development: {
      // Development-specific configuration
      concurrency: {
        // Limit concurrent tasks in development
        maximum: 5
      }
    },
    production: {
      // Production configuration
      concurrency: {
        // Higher concurrency for production
        maximum: 20,
        // Per-task concurrency limits
        "sonic-finance-analysis": 2,
        "sonic-research-analysis": 2,
        "ecosystem-analysis": 2,
        "nft-market-analysis": 2,
        "smart-contract-audit": 1 // Security audits should run sequentially
      }
    }
  },

  // Retry configuration
  retries: {
    // Global retry settings
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true
    },
    // Task-specific retry settings
    "smart-contract-audit": {
      maxAttempts: 2, // Fewer retries for security audits
      minTimeoutInMs: 5000,
      maxTimeoutInMs: 30000
    }
  },

  // Task metadata and configuration
  metadata: {
    name: "ServiceFlow AI - Sonic Ecosystem Monitoring",
    description: "Automated AI agents for monitoring and analyzing the Sonic blockchain ecosystem",
    version: "1.0.0",

    // Task categories for organization
    categories: {
      "sonic-finance-analysis": "finance",
      "sonic-research-analysis": "research",
      "ecosystem-analysis": "ecosystem",
      "nft-market-analysis": "nft",
      "smart-contract-audit": "security"
    },

    // Custom metadata for the agent system
    agents: {
      "sonic-finance": {
        name: "Sonic Finance Team",
        role: "DeFi Analyst",
        schedule: "Every 3 hours",
        capabilities: ["Token Analysis", "Price Predictions", "Liquidity Monitoring", "Yield Farming"]
      },
      "sonic-research": {
        name: "Sonic Research Team",
        role: "Research Analyst",
        schedule: "Every 3 hours",
        capabilities: ["Protocol Analysis", "Trend Research", "Risk Assessment", "Community Sentiment"]
      },
      "ecosystem-analyst": {
        name: "Ecosystem Analyst",
        role: "Ecosystem Monitor",
        schedule: "Every 3 hours",
        capabilities: ["Project Discovery", "TVL Tracking", "User Growth", "Ecosystem Health"]
      },
      "nft-analyst": {
        name: "NFT Market Analyst",
        role: "NFT Specialist",
        schedule: "Every 3 hours",
        capabilities: ["Paintswap Analysis", "Floor Price Tracking", "Rarity Analysis", "Volume Trends"]
      },
      "smart-contract": {
        name: "Smart Contract Auditor",
        role: "Security Analyst",
        schedule: "Every 6 hours",
        capabilities: ["Contract Auditing", "Vulnerability Detection", "Gas Optimization", "Best Practices"]
      }
    }
  },

  // Logging configuration
  logging: {
    level: "info",
    enableColors: true,
    enableTimestamps: true
  },

  // Machine configuration for different task types
  machine: {
    // Default machine for most tasks
    cpu: 1,
    memory: 1, // 1 GB

    // Override for resource-intensive tasks
    overrides: {
      "smart-contract-audit": {
        cpu: 2,
        memory: 2 // 2 GB for security analysis
      },
      "ecosystem-analysis": {
        cpu: 1.5,
        memory: 1.5 // 1.5 GB for ecosystem analysis
      }
    }
  }
});