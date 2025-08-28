import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')
    
    if (!userAddress) {
      return NextResponse.json({
        success: false,
        error: 'userAddress parameter required'
      }, { status: 400 })
    }

    const workerUrl = 'http://localhost:8787'
    const agentId = `user-${userAddress.toLowerCase()}`
    
    // Get agent status
    const statusResponse = await fetch(`${workerUrl}/api/inft/agent/${agentId}/status`)
    
    if (!statusResponse.ok) {
      return NextResponse.json({
        success: true,
        hasAgent: false,
        message: 'No agent found for this user'
      })
    }
    
    const statusData = await statusResponse.json()
    
    return NextResponse.json({
      success: true,
      hasAgent: true,
      agentId,
      agent: statusData.agent,
      generatedContent: statusData.agent.generatedContent || []
    })
    
  } catch (error: any) {
    console.error('User agents API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch user agents'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userAddress, packageType = 2 } = body
    
    if (!userAddress) {
      return NextResponse.json({
        success: false,
        error: 'userAddress is required'
      }, { status: 400 })
    }

    const workerUrl = 'http://localhost:8787'
    const agentId = `user-${userAddress.toLowerCase()}`
    
    // Check if agent already exists
    const statusResponse = await fetch(`${workerUrl}/api/inft/agent/${agentId}/status`)
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json()
      return NextResponse.json({
        success: true,
        message: 'Agent already exists',
        agentId,
        agent: statusData.agent,
        existed: true
      })
    }
    
    // Create new agent
    const creditsByPackage = { 1: 750, 2: 8000, 3: 100000, 4: 260000 }
    
    const createResponse = await fetch(`${workerUrl}/api/inft/agent/${agentId}/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageTokenId: Date.now(),
        packageType: Math.min(Math.max(packageType, 1), 4),
        owner: userAddress,
        totalCredits: creditsByPackage[packageType] || 8000
      })
    })
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create agent: ${createResponse.statusText}`)
    }
    
    const createData = await createResponse.json()
    
    return NextResponse.json({
      success: true,
      message: 'Agent created successfully',
      agentId,
      agent: createData.agent,
      existed: false
    })
    
  } catch (error: any) {
    console.error('Create agent API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create agent'
    }, { status: 500 })
  }
}