/**
 * INFT Worker Main Entry Point
 * 
 * Main Cloudflare Worker that orchestrates the INFT (Intelligent NFT) system
 * Integrates all Durable Objects and provides unified API endpoints
 * 
 * Features:
 * - INFT Agent management and orchestration
 * - Multi-provider AI generation routing
 * - Real-time WebSocket communications
 * - Generation queue management
 * - Agent collaboration coordination
 * - Credit system integration
 * - Blockchain contract interactions
 * - IPFS content management
 */

import { INFTAgentDurableObject } from './inft-agent-durable-object'
import { MultiProviderAIOrchestrator } from './multi-provider-ai-orchestrator'
import { AgentWebSocketHandler } from './agent-websocket-handler'
import { GenerationQueueManager } from './generation-queue-manager'
import { AgentCollaborationEngine } from './agent-collaboration-engine'
import { handleTestEndpoint } from './test-inft-system'
import { FloAgentWorker } from './flo-agent-worker'

export interface Env {
  // Durable Object Bindings
  INFT_AGENT: DurableObjectNamespace
  // GENERATION_QUEUE: DurableObjectNamespace // TODO: Add back when implemented
  // AGENT_COLLABORATION: DurableObjectNamespace // TODO: Add back when implemented
  
  // AI Provider Bindings
  AI: any // Cloudflare AI
  
  // Storage Bindings
  AI_CONTENT: R2Bucket
  USER_UPLOADS: R2Bucket
  NFT_METADATA: R2Bucket
  
  // Database Bindings
  DB: D1Database
  PORTAL_DB: D1Database
  
  // KV Bindings
  PRICE_CACHE: KVNamespace
  GENERATION_CACHE: KVNamespace
  
  // Environment Variables
  OPENAI_API_KEY: string
  CLOUDFLARE_API_TOKEN: string
  CLOUDFLARE_ACCOUNT_ID: string
  GEMINI_API_KEY: string
  SONIC_RPC_URL: string
  SONIC_CHAIN_ID: string
  ERC7857_VERIFIABLE_INFT_CONTRACT: string
  INFT_GENERATED_NFT_CONTRACT: string
  INFT_MARKETPLACE_CONTRACT: string
  ADMIN_API_KEY: string
  ENVIRONMENT: string
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    
    // CORS handling
    if (request.method === 'OPTIONS') {
      return handleCORS()
    }

    try {
      // Route requests based on path
      if (url.pathname.startsWith('/api/flo-agent/')) {
        return handleFloAgentRequest(request, env, ctx)
      } else if (url.pathname.startsWith('/api/inft/agent/')) {
        return handleAgentRequest(request, env, ctx)
      } else if (url.pathname.startsWith('/api/inft/generate/')) {
        return handleGenerationRequest(request, env, ctx)
      } else if (url.pathname.startsWith('/api/inft/collaborate/')) {
        return handleCollaborationRequest(request, env, ctx)
      } else if (url.pathname.startsWith('/api/inft/credits/')) {
        return handleCreditsRequest(request, env, ctx)
      } else if (url.pathname.startsWith('/api/inft/marketplace/')) {
        return handleMarketplaceRequest(request, env, ctx)
      } else if (url.pathname.startsWith('/api/mint-generation-nft')) {
        return handleMintNFTRequest(request, env, ctx)
      } else if (url.pathname.startsWith('/ws/')) {
        return handleWebSocketRequest(request, env, ctx)
      } else if (url.pathname.startsWith('/api/admin/')) {
        return handleAdminRequest(request, env, ctx)
      } else if (url.pathname.startsWith('/test/')) {
        // Test endpoints for development and staging
        if (env.ENVIRONMENT === 'production') {
          return new Response('Test endpoints not available in production', { status: 404 })
        }
        const response = await handleTestEndpoint(request, url.pathname)
        return new Response(response.body, {
          status: response.status,
          headers: { ...Object.fromEntries(response.headers.entries()), ...getCORSHeaders() }
        })
      } else if (url.pathname === '/' || url.pathname === '/health' || url.pathname === '') {
        // Health check endpoint
        return new Response(JSON.stringify({
          success: true,
          service: 'INFT Agent System',
          version: '1.0.0',
          environment: env.ENVIRONMENT || 'development',
          timestamp: new Date().toISOString(),
          endpoints: {
            floAgent: '/api/flo-agent/chat',
            agents: '/api/inft/agent/{agentId}',
            generate: '/api/inft/generate/',
            collaborate: '/api/inft/collaborate/',
            credits: '/api/inft/credits/{agentId}',
            marketplace: '/api/inft/marketplace/',
            websocket: '/ws/',
            admin: '/api/admin/',
            test: env.ENVIRONMENT !== 'production' ? '/test/' : null
          }
        }), {
          headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
        })
      } else {
        return new Response(JSON.stringify({
          error: 'Not Found',
          path: url.pathname,
          availableEndpoints: [
            '/api/flo-agent/',
            '/api/flo-agent/chat',
            '/api/inft/agent/{agentId}',
            '/health',
            '/'
          ]
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
        })
      }

    } catch (error) {
      console.error('Worker error:', error)
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
      })
    }
  }
}

async function handleAgentRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const agentId = pathParts[4] // /api/inft/agent/{agentId}
  const action = pathParts[5] // /api/inft/agent/{agentId}/{action}
  
  if (!agentId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Agent ID required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
    })
  }

  // Get Durable Object instance for this agent
  const agentObjectId = env.INFT_AGENT.idFromName(agentId)
  const agentObject = env.INFT_AGENT.get(agentObjectId)
  
  // Determine the action - default to 'status' for GET requests, 'initialize' for POST without action
  let targetAction = action
  if (!targetAction) {
    if (request.method === 'GET') {
      targetAction = 'status'
    } else if (request.method === 'POST') {
      targetAction = 'initialize'
    } else {
      targetAction = 'status'
    }
  }
  
  // Create new request with proper path for Durable Object
  const agentUrl = new URL(request.url)
  agentUrl.pathname = `/${targetAction}`
  
  const agentRequest = new Request(agentUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body
  })
  
  // Forward request to the agent Durable Object
  const agentResponse = await agentObject.fetch(agentRequest)
  
  // Add CORS headers to response
  const response = new Response(agentResponse.body, {
    status: agentResponse.status,
    headers: {
      ...Object.fromEntries(agentResponse.headers.entries()),
      ...getCORSHeaders()
    }
  })
  
  return response
}

async function handleFloAgentRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url)
  
  // Handle Flo Agent specific requests (Token #1)
  if (url.pathname === '/api/flo-agent/chat') {
    const floWorker = new FloAgentWorker(env)
    return floWorker.handleChat(request)
  }
  
  // Default to health check for Flo agent
  return new Response(JSON.stringify({
    success: true,
    agent: "Flo - Token #1",
    contract: env.ERC7857_VERIFIABLE_INFT_CONTRACT,
    status: "active",
    capabilities: [
      "business-automation",
      "service-workflows", 
      "customer-experience",
      "efficiency-optimization"
    ]
  }), {
    headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
  })
}

async function handleGenerationRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url)
  
  if (request.method === 'POST') {
    const data = await request.json() as {
      agentId: string
      prompt: string
      isVideo: boolean
      collection?: string
      quality?: 'low' | 'medium' | 'high' | 'ultra'
      userAddress: string
      websocketId?: string
    }

    // Validate request
    if (!data.agentId || !data.prompt || !data.userAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: agentId, prompt, userAddress'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
      })
    }

    // Get agent Durable Object
    const agentObjectId = env.INFT_AGENT.idFromName(data.agentId)
    const agentObject = env.INFT_AGENT.get(agentObjectId)
    
    // Forward generation request to agent
    const generateRequest = new Request(`${url.origin}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: data.prompt,
        isVideo: data.isVideo || false,
        collection: data.collection || 'default',
        websocketId: data.websocketId,
        userAddress: data.userAddress
      })
    })

    const agentResponse = await agentObject.fetch(generateRequest)
    const result = await agentResponse.json()

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
    })

  } else if (request.method === 'GET') {
    // Get generation status
    const generationId = url.searchParams.get('generationId')
    const agentId = url.searchParams.get('agentId')

    if (!generationId || !agentId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing generationId or agentId parameters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
      })
    }

    // Get agent status
    const agentObjectId = env.INFT_AGENT.idFromName(agentId)
    const agentObject = env.INFT_AGENT.get(agentObjectId)
    
    const statusRequest = new Request(`${url.origin}/status?generationId=${generationId}`)
    const agentResponse = await agentObject.fetch(statusRequest)
    
    return new Response(agentResponse.body, {
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
    })
  }

  return new Response('Method not allowed', { status: 405 })
}

async function handleCollaborationRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url)
  
  if (request.method === 'POST') {
    const data = await request.json() as {
      sourceAgentId: string
      targetAgentId: string
      type: string
      data: any
      initiatorUserId: string
      expiresIn?: number
    }

    // Validate request
    if (!data.sourceAgentId || !data.targetAgentId || !data.type || !data.initiatorUserId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
      })
    }

    // TODO: Implement collaboration via INFT Agent for now
    // For now, return mock collaboration response
    
    // Mock collaboration response for now
    const collaborationResult = {
      success: true,
      message: `Collaboration initiated between ${data.sourceAgentId} and ${data.targetAgentId}`,
      collaborationId: crypto.randomUUID(),
      type: data.type,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    
    const collabResponse = new Response(JSON.stringify(collaborationResult), {
      headers: { 'Content-Type': 'application/json' }
    })
    
    return new Response(collabResponse.body, {
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
    })

  } else if (request.method === 'GET') {
    // Get collaboration status or suggestions
    const agentId = url.searchParams.get('agentId')
    const collaborationId = url.searchParams.get('collaborationId')
    const action = url.searchParams.get('action')

    if (!agentId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'agentId parameter required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
      })
    }

    // TODO: Implement proper collaboration status via agents
    // For now, return mock data
    
    // Mock collaboration status response
    const statusResult = {
      success: true,
      collaborations: [],
      suggestions: [
        {
          agentId: 'suggested-agent-001',
          compatibilityScore: 0.85,
          reason: 'Complementary skills in image generation'
        }
      ],
      message: 'Collaboration system temporarily simplified'
    }
    
    const collabResponse = new Response(JSON.stringify(statusResult), {
      headers: { 'Content-Type': 'application/json' }
    })
    
    return new Response(collabResponse.body, {
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
    })
  }

  return new Response('Method not allowed', { status: 405 })
}

async function handleCreditsRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const agentId = pathParts[4] // /api/inft/credits/{agentId}
  
  if (!agentId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Agent ID required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
    })
  }

  if (request.method === 'GET') {
    // Get agent credit status
    const agentObjectId = env.INFT_AGENT.idFromName(agentId)
    const agentObject = env.INFT_AGENT.get(agentObjectId)
    
    const statusRequest = new Request(`${url.origin}/status`)
    const agentResponse = await agentObject.fetch(statusRequest)
    
    return new Response(agentResponse.body, {
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
    })

  } else if (request.method === 'POST') {
    const action = url.searchParams.get('action')
    
    if (action === 'purchase') {
      // Handle credit purchase - this would integrate with blockchain
      const data = await request.json() as {
        packageType: number
        paymentMethod: 'native_s' | 'usdc' | 'ws'
        userAddress: string
      }

      // This would call the blockchain contract to mint INFT package
      // For now, return a mock response
      return new Response(JSON.stringify({
        success: true,
        message: 'Credit purchase initiated',
        transactionHash: '0x' + crypto.randomUUID().replace(/-/g, ''),
        packageTokenId: Math.floor(Math.random() * 10000) + 1
      }), {
        headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
      })

    } else if (action === 'transfer') {
      // Handle credit transfer between agents
      const data = await request.json() as {
        targetAgentId: string
        amount: number
        userAddress: string
      }

      // Validate authorization and execute transfer
      const transferResult = await executeCreditsTransfer(agentId, data.targetAgentId, data.amount, env)

      return new Response(JSON.stringify(transferResult), {
        headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
      })
    }
  }

  return new Response('Method not allowed', { status: 405 })
}

async function handleMarketplaceRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url)
  
  if (request.method === 'GET') {
    const action = url.searchParams.get('action')
    
    if (action === 'agents') {
      // List INFT agents for sale
      return getMarketplaceAgents(env)
    } else if (action === 'content') {
      // List generated content for sale
      return getMarketplaceContent(env)
    } else {
      // Get marketplace overview
      return getMarketplaceOverview(env)
    }

  } else if (request.method === 'POST') {
    const data = await request.json() as {
      itemType: 'agent' | 'content'
      itemId: string
      price: string
      currency: 'native_s' | 'usdc'
      userAddress: string
    }

    // List item on marketplace
    return listMarketplaceItem(data, env)
  }

  return new Response('Method not allowed', { status: 405 })
}

async function handleMintNFTRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Method not allowed' 
    }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
    });
  }
  
  try {
    const body = await request.json() as {
      generationId: string
      userAddress: string
      packageTokenId?: string
      agentId?: string
    }
    
    const { generationId, userAddress, packageTokenId, agentId } = body;
    
    if (!generationId || !userAddress) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required parameters: generationId, userAddress' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
      });
    }

    console.log(`🎭 Minting generation as NFT:`, {
      generationId,
      userAddress,
      packageTokenId,
      agentId
    });

    // If this is an INFT agent generation, get details from the agent
    let generationDetails = null;
    if (packageTokenId && agentId) {
      try {
        const agentObjectId = env.INFT_AGENT.idFromName(agentId);
        const agentObject = env.INFT_AGENT.get(agentObjectId);
        
        const statusUrl = new URL(request.url);
        statusUrl.pathname = '/status';
        statusUrl.searchParams.set('generationId', generationId);
        
        const statusResponse = await agentObject.fetch(new Request(statusUrl.toString(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }));
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          generationDetails = statusData.generationDetails;
        }
      } catch (error) {
        console.warn('Could not fetch generation details from INFT agent:', error);
      }
    }

    // Simulate NFT minting (in production, this would call blockchain contracts)
    const tokenId = Math.floor(Math.random() * 10000) + 1000;
    const transactionHash = `0x${crypto.randomUUID().replace(/-/g, '')}`;
    
    // Enhanced NFT metadata for INFT generations
    const nftMetadata = {
      tokenId,
      generationId,
      userAddress,
      mintedAt: new Date().toISOString(),
      isINFT: !!(packageTokenId && agentId),
      ...(packageTokenId && {
        packageTokenId,
        agentId,
        agentGenerated: true
      }),
      ...(generationDetails && {
        prompt: generationDetails.prompt,
        collection: generationDetails.collection,
        provider: generationDetails.provider,
        model: generationDetails.model,
        quality: generationDetails.quality
      })
    };

    // Store NFT metadata (in production, upload to IPFS and store hash)
    const metadataHash = `QmMockHash${tokenId}${Date.now()}`;
    
    const result = {
      success: true,
      generationId,
      tokenId,
      transactionHash,
      metadataHash,
      mintedAt: new Date().toISOString(),
      isINFT: nftMetadata.isINFT,
      metadata: nftMetadata,
      estimatedGas: '0.001',
      networkFee: '0.0005'
    };

    // If this was an INFT generation, notify the agent of successful minting
    if (packageTokenId && agentId) {
      try {
        const agentObjectId = env.INFT_AGENT.idFromName(agentId);
        const agentObject = env.INFT_AGENT.get(agentObjectId);
        
        await agentObject.fetch(new Request(request.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generation_minted',
            generationId,
            tokenId,
            transactionHash,
            userAddress
          })
        }));
      } catch (error) {
        console.warn('Could not notify INFT agent of minting:', error);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
    });
    
  } catch (error) {
    console.error('Mint NFT API error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
    });
  }
}

async function handleWebSocketRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  // Handle WebSocket upgrades for real-time communication
  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('Expected WebSocket', { status: 400 })
  }

  const url = new URL(request.url)
  const agentId = url.searchParams.get('agentId')
  const userId = url.searchParams.get('userId')

  if (!agentId || !userId) {
    return new Response('Missing agentId or userId', { status: 400 })
  }

  // Get agent Durable Object to handle WebSocket
  const agentObjectId = env.INFT_AGENT.idFromName(agentId)
  const agentObject = env.INFT_AGENT.get(agentObjectId)
  
  // Forward WebSocket upgrade to agent
  return agentObject.fetch(request)
}

async function handleAdminRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  // Verify admin authorization
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  if (token !== env.ADMIN_API_KEY) {
    return new Response('Forbidden', { status: 403 })
  }

  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  switch (action) {
    case 'stats':
      return getSystemStats(env)
    case 'agents':
      return getAgentOverview(env)
    case 'collaborations':
      return getCollaborationStats(env)
    case 'queue':
      return getQueueStats(env)
    default:
      return new Response(JSON.stringify({
        success: false,
        error: 'Unknown admin action'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
      })
  }
}

// Helper functions
function handleCORS(): Response {
  return new Response(null, {
    headers: getCORSHeaders()
  })
}

function getCORSHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  }
}

async function executeCreditsTransfer(fromAgentId: string, toAgentId: string, amount: number, env: Env): Promise<any> {
  // Mock credit transfer - would integrate with blockchain
  return {
    success: true,
    message: `Transferred ${amount} credits from ${fromAgentId} to ${toAgentId}`,
    transactionHash: '0x' + crypto.randomUUID().replace(/-/g, '')
  }
}

async function getMarketplaceAgents(env: Env): Promise<Response> {
  // Mock marketplace data - would query blockchain contracts
  const agents = [
    {
      agentId: 'agent_001',
      packageType: 2,
      remainingCredits: 5000,
      totalCredits: 8000,
      price: '50',
      currency: 'native_s',
      seller: '0x...',
      metadata: {
        skills: ['artistic_style', 'composition'],
        successfulGenerations: 150,
        averageQuality: 8.5
      }
    }
  ]

  return new Response(JSON.stringify({
    success: true,
    agents
  }), {
    headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
  })
}

async function getMarketplaceContent(env: Env): Promise<Response> {
  // Mock content marketplace
  const content = [
    {
      contentId: 'content_001',
      type: 'image',
      agentId: 'agent_001',
      price: '5',
      currency: 'native_s',
      ipfsHash: 'QmExample...',
      metadata: {
        prompt: 'Digital art landscape',
        quality: 9,
        style: 'photorealistic'
      }
    }
  ]

  return new Response(JSON.stringify({
    success: true,
    content
  }), {
    headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
  })
}

async function getMarketplaceOverview(env: Env): Promise<Response> {
  return new Response(JSON.stringify({
    success: true,
    overview: {
      totalAgents: 150,
      totalContent: 2500,
      totalVolume: '125000',
      topSellers: ['agent_001', 'agent_045', 'agent_023']
    }
  }), {
    headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
  })
}

async function listMarketplaceItem(data: any, env: Env): Promise<Response> {
  // Mock listing - would call blockchain contract
  return new Response(JSON.stringify({
    success: true,
    message: 'Item listed on marketplace',
    listingId: crypto.randomUUID(),
    transactionHash: '0x' + crypto.randomUUID().replace(/-/g, '')
  }), {
    headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
  })
}

async function getSystemStats(env: Env): Promise<Response> {
  // Mock system stats
  return new Response(JSON.stringify({
    success: true,
    stats: {
      totalAgents: 1250,
      activeAgents: 890,
      totalGenerations: 45000,
      todayGenerations: 1200,
      totalCollaborations: 3500,
      activeCollaborations: 45,
      queueHealth: 'healthy',
      systemLoad: 0.65
    }
  }), {
    headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
  })
}

async function getAgentOverview(env: Env): Promise<Response> {
  return new Response(JSON.stringify({
    success: true,
    agents: {
      byPackageType: {
        starter: 450,
        pro: 600,
        business: 150,
        enterprise: 50
      },
      topPerformers: [
        { agentId: 'agent_001', generations: 850, quality: 9.2 },
        { agentId: 'agent_045', generations: 720, quality: 8.9 },
        { agentId: 'agent_023', generations: 680, quality: 8.7 }
      ]
    }
  }), {
    headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
  })
}

async function getCollaborationStats(env: Env): Promise<Response> {
  return new Response(JSON.stringify({
    success: true,
    collaborations: {
      total: 3500,
      active: 45,
      successful: 2890,
      averageQualityImprovement: 0.25,
      topCollaborativePairs: [
        { agents: ['agent_001', 'agent_045'], collaborations: 25, successRate: 0.96 }
      ]
    }
  }), {
    headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
  })
}

async function getQueueStats(env: Env): Promise<Response> {
  return new Response(JSON.stringify({
    success: true,
    queue: {
      totalQueued: 45,
      totalProcessing: 12,
      averageWaitTime: 8500,
      averageProcessingTime: 12000,
      providerUtilization: {
        openai: 75,
        cloudflare: 85,
        gemini: 60
      },
      queueHealth: 'healthy'
    }
  }), {
    headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
  })
}

// Export Durable Object classes for Cloudflare Workers
export { INFTAgentDurableObject }