/**
 * Shared MCP Server Configuration for ServiceFlow AI
 *
 * This configuration enables both Claude sub-agents and Agno worker agents
 * to access the same MCP servers, ensuring perfect compatibility and optimal usage patterns.
 */

export interface SharedMCPServerRegistry {
  servers: Record<string, MCPServerInfo>;
  accessPatterns: MCPAccessPatterns;
  healthMonitoring: HealthMonitoringConfig;
}

export interface MCPServerInfo {
  name: string;
  endpoint: string;
  port: number;
  description: string;
  capabilities: string[];
  rateLimit: RateLimitConfig;
  authentication?: AuthConfig;
  healthEndpoint: string;
  documentation: string;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
}

export interface AuthConfig {
  type: 'none' | 'api_key' | 'bearer_token';
  headerName?: string;
  envVar?: string;
}

export interface MCPAccessPatterns {
  claudeSubAgents: {
    enabled: boolean;
    accessMethods: string[];
    testingCapabilities: string[];
    optimizationFeatures: string[];
  };
  agnoWorkerAgents: {
    enabled: boolean;
    accessMethods: string[];
    productionCapabilities: string[];
    bridgeIntegration: string[];
  };
}

export interface HealthMonitoringConfig {
  checkInterval: number;
  timeoutMs: number;
  retryAttempts: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    availability: number;
  };
}

/**
 * Complete MCP server registry for ServiceFlow AI
 */
export const SHARED_MCP_REGISTRY: SharedMCPServerRegistry = {
  servers: {
    defai: {
      name: "DeFAI",
      endpoint: "http://localhost:8001",
      port: 8001,
      description: "DeFi analysis tools with impermanent loss calculations and protocol safety assessment",
      capabilities: [
        "calculate_impermanent_loss",
        "analyze_defi_positions",
        "assess_protocol_risk",
        "simulate_yield_scenarios",
        "track_portfolio_performance"
      ],
      rateLimit: {
        requestsPerMinute: 30,
        requestsPerHour: 1000,
        burstLimit: 10,
        backoffStrategy: 'exponential'
      },
      authentication: {
        type: 'none'
      },
      healthEndpoint: "/health",
      documentation: "http://localhost:8001/docs"
    },

    paintswap: {
      name: "Paintswap MCP",
      endpoint: "http://localhost:8002",
      port: 8002,
      description: "Comprehensive NFT marketplace integration for Sonic blockchain with $wS token support",
      capabilities: [
        "get_collection_stats",
        "get_nft_details",
        "track_floor_prices",
        "analyze_trading_volume",
        "monitor_rare_traits",
        "get_marketplace_trends"
      ],
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 2000,
        burstLimit: 20,
        backoffStrategy: 'exponential'
      },
      authentication: {
        type: 'api_key',
        headerName: 'X-API-Key',
        envVar: 'PAINTSWAP_API_KEY'
      },
      healthEndpoint: "/health",
      documentation: "http://localhost:8002/docs"
    },

    coincodex: {
      name: "CoinCodex MCP",
      endpoint: "http://localhost:8003",
      port: 8003,
      description: "Cryptocurrency market data, price tracking, and market sentiment analysis",
      capabilities: [
        "get_latest_price",
        "get_price_history",
        "get_market_data",
        "analyze_market_sentiment",
        "track_volume_changes",
        "monitor_social_metrics"
      ],
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 5000,
        burstLimit: 30,
        backoffStrategy: 'linear'
      },
      authentication: {
        type: 'none'
      },
      healthEndpoint: "/health",
      documentation: "http://localhost:8003/docs"
    },

    discordMonitoring: {
      name: "Discord Monitoring MCP",
      endpoint: "http://localhost:8004",
      port: 8004,
      description: "Discord community monitoring, sentiment analysis, and social intelligence",
      capabilities: [
        "analyze_sentiment",
        "get_trending_topics",
        "monitor_community_health",
        "track_engagement_metrics",
        "detect_emerging_trends",
        "generate_social_reports"
      ],
      rateLimit: {
        requestsPerMinute: 50,
        requestsPerHour: 1500,
        burstLimit: 15,
        backoffStrategy: 'exponential'
      },
      authentication: {
        type: 'bearer_token',
        headerName: 'Authorization',
        envVar: 'DISCORD_BOT_TOKEN'
      },
      healthEndpoint: "/health",
      documentation: "http://localhost:8004/docs"
    },

    financeResearch: {
      name: "Finance Research MCP",
      endpoint: "http://localhost:8005",
      port: 8005,
      description: "Financial data aggregation, research tools, and market analysis",
      capabilities: [
        "aggregate_financial_data",
        "perform_technical_analysis",
        "generate_research_reports",
        "track_macro_indicators",
        "analyze_correlations",
        "forecast_trends"
      ],
      rateLimit: {
        requestsPerMinute: 40,
        requestsPerHour: 1200,
        burstLimit: 12,
        backoffStrategy: 'exponential'
      },
      authentication: {
        type: 'none'
      },
      healthEndpoint: "/health",
      documentation: "http://localhost:8005/docs"
    },

    supabase: {
      name: "Supabase MCP",
      endpoint: "http://localhost:8006",
      port: 8006,
      description: "Database operations, data management, and real-time synchronization",
      capabilities: [
        "execute_queries",
        "manage_user_data",
        "handle_real_time_updates",
        "perform_analytics",
        "manage_file_storage",
        "handle_authentication"
      ],
      rateLimit: {
        requestsPerMinute: 200,
        requestsPerHour: 10000,
        burstLimit: 50,
        backoffStrategy: 'linear'
      },
      authentication: {
        type: 'api_key',
        headerName: 'apikey',
        envVar: 'SUPABASE_ANON_KEY'
      },
      healthEndpoint: "/health",
      documentation: "http://localhost:8006/docs"
    }
  },

  accessPatterns: {
    claudeSubAgents: {
      enabled: true,
      accessMethods: [
        "direct_http_calls",
        "mcp_client_library",
        "testing_harness",
        "optimization_suite"
      ],
      testingCapabilities: [
        "validate_api_responses",
        "test_error_scenarios",
        "measure_performance",
        "optimize_request_patterns",
        "debug_integration_issues"
      ],
      optimizationFeatures: [
        "request_batching",
        "response_caching",
        "connection_pooling",
        "retry_optimization",
        "rate_limit_intelligence"
      ]
    },
    agnoWorkerAgents: {
      enabled: true,
      accessMethods: [
        "trigger_dev_bridge",
        "mcp_universal_client",
        "queue_based_processing",
        "real_time_streaming"
      ],
      productionCapabilities: [
        "reliable_execution",
        "error_recovery",
        "performance_monitoring",
        "scalable_processing",
        "cost_optimization"
      ],
      bridgeIntegration: [
        "python_script_execution",
        "agno_framework_compatibility",
        "metadata_tracking",
        "progress_reporting",
        "result_validation"
      ]
    }
  },

  healthMonitoring: {
    checkInterval: 30000, // 30 seconds
    timeoutMs: 5000, // 5 seconds
    retryAttempts: 3,
    alertThresholds: {
      responseTime: 2000, // 2 seconds
      errorRate: 0.05, // 5%
      availability: 0.99 // 99%
    }
  }
};

/**
 * Helper functions for shared MCP access
 */
export class SharedMCPManager {
  private static instance: SharedMCPManager;
  private healthStatus: Map<string, boolean> = new Map();
  private lastHealthCheck: Map<string, number> = new Map();

  static getInstance(): SharedMCPManager {
    if (!SharedMCPManager.instance) {
      SharedMCPManager.instance = new SharedMCPManager();
    }
    return SharedMCPManager.instance;
  }

  /**
   * Get all available MCP servers
   */
  getAvailableServers(): string[] {
    return Object.keys(SHARED_MCP_REGISTRY.servers);
  }

  /**
   * Get server configuration by name
   */
  getServerConfig(serverName: string): MCPServerInfo | null {
    return SHARED_MCP_REGISTRY.servers[serverName] || null;
  }

  /**
   * Check if a server is healthy
   */
  isServerHealthy(serverName: string): boolean {
    return this.healthStatus.get(serverName) || false;
  }

  /**
   * Get servers by capability
   */
  getServersByCapability(capability: string): string[] {
    return Object.entries(SHARED_MCP_REGISTRY.servers)
      .filter(([_, config]) => config.capabilities.includes(capability))
      .map(([name, _]) => name);
  }

  /**
   * Get optimal server for a specific operation
   */
  getOptimalServer(operation: string, context?: any): string | null {
    // Logic to select the best server based on operation type, load, health, etc.
    const capableServers = this.getServersByCapability(operation);

    if (capableServers.length === 0) return null;

    // Return the first healthy server (can be enhanced with load balancing)
    return capableServers.find(server => this.isServerHealthy(server)) || capableServers[0];
  }

  /**
   * Update health status for a server
   */
  updateHealthStatus(serverName: string, isHealthy: boolean): void {
    this.healthStatus.set(serverName, isHealthy);
    this.lastHealthCheck.set(serverName, Date.now());
  }

  /**
   * Get rate limit info for a server
   */
  getRateLimit(serverName: string): RateLimitConfig | null {
    const config = this.getServerConfig(serverName);
    return config?.rateLimit || null;
  }
}

/**
 * Export singleton instance
 */
export const sharedMCPManager = SharedMCPManager.getInstance();