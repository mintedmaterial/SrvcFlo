/**
 * INFT System Test File
 * 
 * Simple test endpoints to validate the INFT system is working
 * This provides mock data when real AI providers aren't configured
 */

export interface TestAgent {
  agentId: string
  packageType: number
  totalCredits: number
  usedCredits: number
  status: string
}

export interface TestGeneration {
  id: string
  agentId: string
  prompt: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  result?: {
    ipfsHash: string
    quality: number
  }
}

export class INFTSystemTester {
  private testAgents: Map<string, TestAgent> = new Map()
  private testGenerations: Map<string, TestGeneration> = new Map()

  constructor() {
    this.initializeTestData()
  }

  private initializeTestData(): void {
    // Create some test agents
    const testAgents: TestAgent[] = [
      {
        agentId: 'test-agent-001',
        packageType: 1, // Starter
        totalCredits: 750,
        usedCredits: 0,
        status: 'active'
      },
      {
        agentId: 'test-agent-002', 
        packageType: 2, // Pro
        totalCredits: 8000,
        usedCredits: 1200,
        status: 'active'
      },
      {
        agentId: 'test-agent-003',
        packageType: 3, // Business
        totalCredits: 100000,
        usedCredits: 25000,
        status: 'active'
      }
    ]

    testAgents.forEach(agent => {
      this.testAgents.set(agent.agentId, agent)
    })
  }

  // Test agent creation
  async createTestAgent(packageType: number): Promise<TestAgent> {
    const agentId = `test-agent-${Date.now()}`
    
    const creditMap = {
      1: 750,     // Starter
      2: 8000,    // Pro  
      3: 100000,  // Business
      4: 260000   // Enterprise
    }

    const agent: TestAgent = {
      agentId,
      packageType,
      totalCredits: creditMap[packageType as keyof typeof creditMap] || 750,
      usedCredits: 0,
      status: 'active'
    }

    this.testAgents.set(agentId, agent)
    return agent
  }

  // Test generation
  async createTestGeneration(agentId: string, prompt: string, isVideo: boolean = false): Promise<TestGeneration> {
    const agent = this.testAgents.get(agentId)
    if (!agent) {
      throw new Error('Agent not found')
    }

    const creditCost = isVideo ? 500 : 200
    if (agent.usedCredits + creditCost > agent.totalCredits) {
      throw new Error('Insufficient credits')
    }

    const generationId = `gen-${Date.now()}`
    const generation: TestGeneration = {
      id: generationId,
      agentId,
      prompt,
      status: 'queued'
    }

    this.testGenerations.set(generationId, generation)
    
    // Simulate generation process
    setTimeout(() => this.processTestGeneration(generationId, creditCost), 2000)
    
    return generation
  }

  private async processTestGeneration(generationId: string, creditCost: number): Promise<void> {
    const generation = this.testGenerations.get(generationId)
    if (!generation) return

    const agent = this.testAgents.get(generation.agentId)
    if (!agent) return

    // Update status to processing
    generation.status = 'processing'
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Update agent credits
    agent.usedCredits += creditCost
    
    // Complete generation
    generation.status = 'completed'
    generation.result = {
      ipfsHash: `Qm${crypto.randomUUID().replace(/-/g, '')}`,
      quality: Math.floor(Math.random() * 3) + 8 // 8-10
    }
  }

  // Get agent status
  getAgent(agentId: string): TestAgent | undefined {
    return this.testAgents.get(agentId)
  }

  // Get generation status
  getGeneration(generationId: string): TestGeneration | undefined {
    return this.testGenerations.get(generationId)
  }

  // Get all agents
  getAllAgents(): TestAgent[] {
    return Array.from(this.testAgents.values())
  }

  // Get all generations for an agent
  getAgentGenerations(agentId: string): TestGeneration[] {
    return Array.from(this.testGenerations.values())
      .filter(gen => gen.agentId === agentId)
  }

  // Test collaboration
  async createTestCollaboration(sourceAgentId: string, targetAgentId: string, type: string): Promise<any> {
    const sourceAgent = this.testAgents.get(sourceAgentId)
    const targetAgent = this.testAgents.get(targetAgentId)
    
    if (!sourceAgent || !targetAgent) {
      throw new Error('One or both agents not found')
    }

    return {
      id: `collab-${Date.now()}`,
      sourceAgentId,
      targetAgentId,
      type,
      status: 'pending',
      createdAt: new Date().toISOString(),
      message: `Test collaboration between ${sourceAgentId} and ${targetAgentId}`
    }
  }

  // System stats
  getSystemStats(): any {
    const agents = Array.from(this.testAgents.values())
    const generations = Array.from(this.testGenerations.values())
    
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      totalGenerations: generations.length,
      completedGenerations: generations.filter(g => g.status === 'completed').length,
      processingGenerations: generations.filter(g => g.status === 'processing').length,
      queuedGenerations: generations.filter(g => g.status === 'queued').length,
      averageCreditsUsed: agents.reduce((sum, a) => sum + a.usedCredits, 0) / agents.length,
      systemHealth: 'healthy'
    }
  }
}

// Global test instance
let testInstance: INFTSystemTester | null = null

export function getTestInstance(): INFTSystemTester {
  if (!testInstance) {
    testInstance = new INFTSystemTester()
  }
  return testInstance
}

// Test endpoints for the worker
export async function handleTestEndpoint(request: Request, pathname: string): Promise<Response> {
  const tester = getTestInstance()
  const url = new URL(request.url)
  
  try {
    if (pathname === '/test/agents' && request.method === 'GET') {
      // Get all test agents
      const agents = tester.getAllAgents()
      return new Response(JSON.stringify({
        success: true,
        agents
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
      
    } else if (pathname === '/test/agents' && request.method === 'POST') {
      // Create test agent
      const data = await request.json() as { packageType: number }
      const agent = await tester.createTestAgent(data.packageType)
      
      return new Response(JSON.stringify({
        success: true,
        agent
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
      
    } else if (pathname.startsWith('/test/agents/') && request.method === 'GET') {
      // Get specific agent
      const agentId = pathname.split('/')[3]
      const agent = tester.getAgent(agentId)
      
      if (!agent) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Agent not found'
        }), { status: 404 })
      }
      
      return new Response(JSON.stringify({
        success: true,
        agent
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
      
    } else if (pathname === '/test/generate' && request.method === 'POST') {
      // Create test generation
      const data = await request.json() as {
        agentId: string
        prompt: string
        isVideo?: boolean
      }
      
      const generation = await tester.createTestGeneration(
        data.agentId,
        data.prompt,
        data.isVideo || false
      )
      
      return new Response(JSON.stringify({
        success: true,
        generation
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
      
    } else if (pathname.startsWith('/test/generations/') && request.method === 'GET') {
      // Get generation status
      const generationId = pathname.split('/')[3]
      const generation = tester.getGeneration(generationId)
      
      if (!generation) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Generation not found'
        }), { status: 404 })
      }
      
      return new Response(JSON.stringify({
        success: true,
        generation
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
      
    } else if (pathname === '/test/collaborate' && request.method === 'POST') {
      // Test collaboration
      const data = await request.json() as {
        sourceAgentId: string
        targetAgentId: string
        type: string
      }
      
      const collaboration = await tester.createTestCollaboration(
        data.sourceAgentId,
        data.targetAgentId,
        data.type
      )
      
      return new Response(JSON.stringify({
        success: true,
        collaboration
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
      
    } else if (pathname === '/test/stats' && request.method === 'GET') {
      // Get system stats
      const stats = tester.getSystemStats()
      
      return new Response(JSON.stringify({
        success: true,
        stats
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
      
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Test endpoint not found',
        availableEndpoints: [
          'GET /test/agents - List all test agents',
          'POST /test/agents - Create test agent',
          'GET /test/agents/{id} - Get specific agent',
          'POST /test/generate - Create test generation',
          'GET /test/generations/{id} - Get generation status',
          'POST /test/collaborate - Test collaboration',
          'GET /test/stats - Get system stats'
        ]
      }), { status: 404 })
    }
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}