import { logger } from "@trigger.dev/sdk";

/**
 * Universal MCP (Model Context Protocol) client for ServiceFlow AI
 * Provides standardized interface for interacting with all MCP servers
 */

export interface MCPServerConfig {
  name: string;
  baseUrl: string;
  port: number;
  description: string;
  healthEndpoint?: string;
  timeout?: number;
}

export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  serverName: string;
  executionTime: number;
}

export interface MCPToolCall {
  server: string;
  tool: string;
  args: Record<string, any>;
  timeout?: number;
}

/**
 * Available MCP servers configuration
 */
export const MCP_SERVERS: Record<string, MCPServerConfig> = {
  DeFAI: {
    name: "DeFAI",
    baseUrl: "http://localhost:8001",
    port: 8001,
    description: "DeFi analysis tools and impermanent loss calculations",
    healthEndpoint: "/health",
    timeout: 30000,
  },

  paintswap: {
    name: "Paintswap MCP",
    baseUrl: "http://localhost:8002",
    port: 8002,
    description: "NFT marketplace data from Paintswap on Sonic blockchain",
    healthEndpoint: "/health",
    timeout: 15000,
  },

  coincodex: {
    name: "CoinCodex MCP",
    baseUrl: "http://localhost:8003",
    port: 8003,
    description: "Cryptocurrency market data and price tracking",
    healthEndpoint: "/health",
    timeout: 10000,
  },

  discordMonitoring: {
    name: "Discord Monitoring MCP",
    baseUrl: "http://localhost:8004",
    port: 8004,
    description: "Discord community monitoring and sentiment analysis",
    healthEndpoint: "/health",
    timeout: 20000,
  },

  financeResearch: {
    name: "Finance Research MCP",
    baseUrl: "http://localhost:8005",
    port: 8005,
    description: "Financial data aggregation and research tools",
    healthEndpoint: "/health",
    timeout: 25000,
  },

  supabase: {
    name: "Supabase MCP",
    baseUrl: "http://localhost:8006",
    port: 8006,
    description: "Database operations and data management",
    healthEndpoint: "/health",
    timeout: 15000,
  },
};

/**
 * Execute a tool call on an MCP server
 */
export async function callMCPTool<T = any>(
  toolCall: MCPToolCall
): Promise<MCPResponse<T>> {
  const startTime = Date.now();
  const server = MCP_SERVERS[toolCall.server];

  if (!server) {
    return {
      success: false,
      error: `Unknown MCP server: ${toolCall.server}`,
      serverName: toolCall.server,
      executionTime: 0,
    };
  }

  try {
    logger.info(`🔧 Calling MCP tool: ${toolCall.tool} on ${server.name}`, {
      server: server.name,
      tool: toolCall.tool,
      args: toolCall.args,
    });

    const response = await fetch(`${server.baseUrl}/tools/${toolCall.tool}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toolCall.args),
      signal: AbortSignal.timeout(toolCall.timeout || server.timeout || 30000),
    });

    const executionTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`❌ MCP tool call failed: ${toolCall.tool}`, {
        server: server.name,
        status: response.status,
        error: errorText,
        executionTime: `${executionTime}ms`,
      });

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        serverName: server.name,
        executionTime,
      };
    }

    const data = await response.json();

    logger.info(`✅ MCP tool call succeeded: ${toolCall.tool}`, {
      server: server.name,
      executionTime: `${executionTime}ms`,
      dataSize: JSON.stringify(data).length,
    });

    return {
      success: true,
      data,
      serverName: server.name,
      executionTime,
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(`❌ MCP tool call error: ${toolCall.tool}`, {
      server: server.name,
      error: errorMessage,
      executionTime: `${executionTime}ms`,
    });

    return {
      success: false,
      error: errorMessage,
      serverName: server.name,
      executionTime,
    };
  }
}

/**
 * Check health status of an MCP server
 */
export async function checkMCPServerHealth(
  serverName: string
): Promise<MCPResponse<{ status: string; timestamp: string }>> {
  const server = MCP_SERVERS[serverName];

  if (!server) {
    return {
      success: false,
      error: `Unknown MCP server: ${serverName}`,
      serverName,
      executionTime: 0,
    };
  }

  try {
    const response = await fetch(
      `${server.baseUrl}${server.healthEndpoint || "/health"}`,
      {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout for health checks
      }
    );

    if (response.ok) {
      return {
        success: true,
        data: {
          status: "healthy",
          timestamp: new Date().toISOString(),
        },
        serverName: server.name,
        executionTime: 0,
      };
    } else {
      return {
        success: false,
        error: `Health check failed: HTTP ${response.status}`,
        serverName: server.name,
        executionTime: 0,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      serverName: server.name,
      executionTime: 0,
    };
  }
}

/**
 * Check health of all MCP servers
 */
export async function checkAllMCPServersHealth(): Promise<
  Record<string, MCPResponse<{ status: string; timestamp: string }>>
> {
  const healthChecks = Object.keys(MCP_SERVERS).map(async (serverName) => {
    const result = await checkMCPServerHealth(serverName);
    return [serverName, result] as const;
  });

  const results = await Promise.all(healthChecks);
  return Object.fromEntries(results);
}

/**
 * Batch MCP tool calls with error handling
 */
export async function batchMCPToolCalls<T = any>(
  toolCalls: MCPToolCall[]
): Promise<MCPResponse<T>[]> {
  logger.info(`🔧 Executing ${toolCalls.length} MCP tool calls in batch`);

  const results = await Promise.allSettled(
    toolCalls.map((toolCall) => callMCPTool<T>(toolCall))
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        success: false,
        error: result.reason?.message || "Batch call failed",
        serverName: toolCalls[index].server,
        executionTime: 0,
      };
    }
  });
}

/**
 * Convenience functions for specific MCP servers
 */
export const MCPTools = {
  // DeFAI tools
  defi: {
    calculateImpermanentLoss: (params: {
      initialRatio: number;
      currentRatio: number;
    }) =>
      callMCPTool({
        server: "DeFAI",
        tool: "calculate_impermanent_loss",
        args: params,
      }),

    analyzePosition: (params: { wallet: string; protocols: string[] }) =>
      callMCPTool({
        server: "DeFAI",
        tool: "analyze_defi_position",
        args: params,
      }),
  },

  // Paintswap tools
  paintswap: {
    getCollectionStats: (contractAddress: string) =>
      callMCPTool({
        server: "paintswap",
        tool: "get_collection_stats",
        args: { contract_address: contractAddress },
      }),

    getFloorPrice: (contractAddress: string) =>
      callMCPTool({
        server: "paintswap",
        tool: "get_floor_price",
        args: { contract_address: contractAddress },
      }),
  },

  // CoinCodex tools
  coincodex: {
    getPrice: (symbol: string) =>
      callMCPTool({
        server: "coincodex",
        tool: "get_latest_price",
        args: { symbol },
      }),

    getMarketData: (symbols: string[]) =>
      callMCPTool({
        server: "coincodex",
        tool: "get_market_data",
        args: { symbols },
      }),
  },

  // Discord monitoring tools
  discord: {
    getSentiment: (channels: string[]) =>
      callMCPTool({
        server: "discordMonitoring",
        tool: "analyze_sentiment",
        args: { channels },
      }),

    getTrendingTopics: () =>
      callMCPTool({
        server: "discordMonitoring",
        tool: "get_trending_topics",
        args: {},
      }),
  },
};