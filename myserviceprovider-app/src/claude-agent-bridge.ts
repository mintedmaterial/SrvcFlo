/**
 * Cloudflare Workers Bridge for ServiceFlow AI Claude Sub-agents
 * Connects the frontend UI to Claude sub-agents with MCP tools
 */

import { Ai } from '@cloudflare/ai';

interface Env {
  AI: any;
  KV_STORE: KVNamespace;
  R2_BUCKET: R2Bucket;
  CLAUDE_API_KEY?: string;
  THIRDWEB_CLIENT_ID?: string;
  DISCORD_SONIC_WEBHOOK?: string;
  SONIC_RPC_URL?: string;
}

interface AgentRequest {
  agentType: 'nft-market-analyst' | 'ecosystem-analyst' | 'workflow-orchestrator';
  query: string;
  context?: any;
  userId?: string;
  walletAddress?: string;
}

interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  agentUsed: string;
  executionTime: number;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const url = new URL(request.url);
    
    try {
      // Route to appropriate handler
      if (url.pathname === '/api/agent/query') {
        return await handleAgentQuery(request, env);
      } else if (url.pathname === '/api/agent/status') {
        return await handleAgentStatus(request, env);
      } else if (url.pathname === '/api/mcp/tools') {
        return await handleMCPTools(request, env);
      } else if (url.pathname === '/api/storage/bridge') {
        return await handleStorageBridge(request, env);
      } else {
        return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

async function handleAgentQuery(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const agentRequest: AgentRequest = await request.json();
  const startTime = Date.now();

  try {
    // Validate request
    if (!agentRequest.agentType || !agentRequest.query) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing agentType or query'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Route to appropriate Claude sub-agent
    let response: AgentResponse;
    
    switch (agentRequest.agentType) {
      case 'nft-market-analyst':
        response = await callNFTMarketAnalyst(agentRequest, env);
        break;
      case 'ecosystem-analyst':
        response = await callEcosystemAnalyst(agentRequest, env);
        break;
      case 'workflow-orchestrator':
        response = await callWorkflowOrchestrator(agentRequest, env);
        break;
      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown agent type: ${agentRequest.agentType}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    response.executionTime = Date.now() - startTime;

    // Store interaction in KV for analytics
    if (agentRequest.userId) {
      await storeInteraction(env.KV_STORE, {
        userId: agentRequest.userId,
        agentType: agentRequest.agentType,
        query: agentRequest.query.substring(0, 100), // Truncate for storage
        success: response.success,
        executionTime: response.executionTime,
        timestamp: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    const errorResponse: AgentResponse = {
      success: false,
      error: `Agent execution failed: ${error.message}`,
      agentUsed: agentRequest.agentType,
      executionTime: Date.now() - startTime,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

async function callNFTMarketAnalyst(request: AgentRequest, env: Env): Promise<AgentResponse> {
  // Simulate Claude sub-agent call with MCP tools
  // In production, this would make actual calls to Claude API with MCP configuration
  
  const mockAnalysis = {
    topCollections: [
      { name: "Sonic Punks", floorPrice: 1.5, volume24h: 245.7 },
      { name: "Sonic Apes", floorPrice: 0.8, volume24h: 189.3 }
    ],
    marketSentiment: "Bullish on Sonic NFTs",
    trendingTraits: ["Laser Eyes", "Golden Background"],
    recommendation: "Strong buy signal for established collections"
  };

  // Check if user is Bandit Kidz holder for exclusive insights
  let exclusiveData = null;
  if (request.walletAddress) {
    exclusiveData = await checkBanditKidzHolder(request.walletAddress, env);
  }

  return {
    success: true,
    data: {
      analysis: mockAnalysis,
      exclusive: exclusiveData,
      source: "paintswap-mcp",
      lastUpdated: new Date().toISOString(),
    },
    agentUsed: 'nft-market-analyst',
    executionTime: 0, // Will be set by caller
  };
}

async function callEcosystemAnalyst(request: AgentRequest, env: Env): Promise<AgentResponse> {
  // Simulate comprehensive ecosystem analysis
  const mockEcosystemData = {
    sonicPrice: { usd: 0.15, change24h: 5.2 },
    marketCap: 45000000,
    totalValueLocked: 12500000,
    networkStats: {
      transactions24h: 15420,
      avgBlockTime: "1.2s",
      gasPrice: "0.001 S"
    },
    defiProtocols: [
      { name: "SonicSwap", tvl: 8500000 },
      { name: "SonicLend", tvl: 4000000 }
    ],
    alerts: [
      { type: "price_increase", message: "S token up 5.2% in 24h" }
    ]
  };

  return {
    success: true,
    data: {
      ecosystem: mockEcosystemData,
      source: "coincodx-mcp",
      pipelineStatus: "active",
      lastUpdated: new Date().toISOString(),
    },
    agentUsed: 'ecosystem-analyst',
    executionTime: 0,
  };
}

async function callWorkflowOrchestrator(request: AgentRequest, env: Env): Promise<AgentResponse> {
  // Coordinate multiple agents based on complex query
  const tasks = parseComplexQuery(request.query);
  
  const results = [];
  for (const task of tasks) {
    if (task.requiresNFT) {
      const nftResult = await callNFTMarketAnalyst(
        { ...request, query: task.query, agentType: 'nft-market-analyst' },
        env
      );
      results.push({ type: 'nft', result: nftResult });
    }
    
    if (task.requiresEcosystem) {
      const ecosystemResult = await callEcosystemAnalyst(
        { ...request, query: task.query, agentType: 'ecosystem-analyst' },
        env
      );
      results.push({ type: 'ecosystem', result: ecosystemResult });
    }
  }

  return {
    success: true,
    data: {
      workflow: 'multi-agent-coordination',
      tasks: tasks.length,
      results: results,
      synthesis: "Coordinated analysis from multiple specialized agents",
    },
    agentUsed: 'workflow-orchestrator',
    executionTime: 0,
  };
}

async function handleAgentStatus(request: Request, env: Env): Promise<Response> {
  const status = {
    agents: {
      'nft-market-analyst': { status: 'active', lastUsed: new Date().toISOString() },
      'ecosystem-analyst': { status: 'active', lastUsed: new Date().toISOString() },
      'workflow-orchestrator': { status: 'active', lastUsed: new Date().toISOString() }
    },
    mcpServers: {
      'paintswap-mcp': { status: 'connected', rpcUrl: env.SONIC_RPC_URL },
      'discord-monitoring-mcp': { status: 'connected', webhookConfigured: !!env.DISCORD_SONIC_WEBHOOK },
      'coincodx-mcp': { status: 'connected', pipelineRunning: true }
    },
    storage: {
      kvStore: 'connected',
      r2Bucket: 'connected'
    }
  };

  return new Response(JSON.stringify(status), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function handleMCPTools(request: Request, env: Env): Promise<Response> {
  // List available MCP tools for frontend display
  const tools = {
    'paintswap-mcp': [
      'get_top_collections',
      'get_collection_stats', 
      'analyze_collection_traits',
      'get_market_trends',
      'search_nfts'
    ],
    'discord-monitoring-mcp': [
      'send_nft_alert',
      'analyze_sentiment',
      'monitor_nft_channel',
      'send_sonic_alert'
    ],
    'coincodx-mcp': [
      'run_data_pipeline',
      'get_coin_details',
      'get_watchlist_summary',
      'setup_price_alert'
    ]
  };

  return new Response(JSON.stringify(tools), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function handleStorageBridge(request: Request, env: Env): Promise<Response> {
  // Bridge to your existing Cloudflare storage (KV, R2)
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    
    if (!key) {
      return new Response('Missing key parameter', { status: 400 });
    }

    const value = await env.KV_STORE.get(key);
    return new Response(value || JSON.stringify({ error: 'Key not found' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'POST') {
    const { key, value, metadata } = await request.json();
    await env.KV_STORE.put(key, JSON.stringify(value), { metadata });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405 });
}

// Helper functions
async function checkBanditKidzHolder(walletAddress: string, env: Env): Promise<any> {
  // Check if wallet holds Bandit Kidz NFTs for exclusive features
  // This would integrate with your existing NFT verification logic
  return {
    isHolder: true, // Mock - replace with actual verification
    nftsHeld: 3,
    stakingRewards: 125.50,
    exclusiveInsights: "Premium market analysis available"
  };
}

function parseComplexQuery(query: string): Array<{ query: string, requiresNFT: boolean, requiresEcosystem: boolean }> {
  // Simple query parsing - in production would be more sophisticated
  const requiresNFT = query.toLowerCase().includes('nft') || query.toLowerCase().includes('collection');
  const requiresEcosystem = query.toLowerCase().includes('price') || query.toLowerCase().includes('defi');
  
  return [{
    query,
    requiresNFT,
    requiresEcosystem
  }];
}

async function storeInteraction(kv: KVNamespace, interaction: any): Promise<void> {
  const key = `interaction:${interaction.userId}:${Date.now()}`;
  await kv.put(key, JSON.stringify(interaction), {
    expirationTtl: 60 * 60 * 24 * 30, // 30 days
    metadata: { type: 'agent_interaction' }
  });
}