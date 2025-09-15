import { NextRequest, NextResponse } from 'next/server'

// Allow streaming responses up to 30 seconds - Updated to handle both message formats
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Handle both old format (messages, agent_id) and new format (message, agent_name)
    let messageText: string
    let selectedAgent: string
    let messages: any[] = []

    if (body.messages && Array.isArray(body.messages)) {
      // Old format from ChatArea
      messages = body.messages
      const userMessage = messages[messages.length - 1]
      messageText = userMessage?.parts?.[0]?.text || userMessage?.content || ''
      selectedAgent = body.agent_id || 'content_creation_agent'
    } else {
      // New format from Sidebar connection tests and future calls
      messageText = body.message || ''
      selectedAgent = body.agent_name || 'content_creation_agent'
      messages = body.messages || []
    }
    
    console.log(`📨 Routing message to agent: ${selectedAgent}`)
    console.log(`💬 Message: ${messageText}`)
    
    // Connect to the playground chat endpoint (correct path)
    const agentEndpoint = process.env.NEXT_PUBLIC_AGENT_ENDPOINT || 'http://localhost:7777'
    
    // Use the correct endpoint format for the playground
    const response = await fetch(`${agentEndpoint}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        agent_name: selectedAgent,
        message: messageText,
        channel_context: {}
      })
    })

    if (!response.ok) {
      console.error(`❌ Backend response: ${response.status} ${response.statusText}`)
      
      // Try to get agents list for debugging
      let availableAgents = []
      try {
        const agentsResponse = await fetch(`${agentEndpoint}/v1/playground/agents`)
        if (agentsResponse.ok) {
          const agentsData = await agentsResponse.json()
          availableAgents = agentsData.map((agent: any) => agent.name || agent.agent_id)
        }
      } catch (e) {
        console.log('Could not fetch agents list')
      }
      
      // Return fallback response with debugging info
      return NextResponse.json({
        messages: [
          ...messages,
          {
            id: Date.now().toString(),
            role: 'assistant',
            parts: [{
              type: 'text',
              text: `Hello! I'm having trouble connecting to the ServiceFlow AI backend (${response.status}). 

Available agents: ${availableAgents.join(', ') || 'Loading...'}

Please make sure the playground server is running on port 7777. You can start it with:
\`\`\`
cd C:/Users/PC/ServiceApp/agent-ui/Agents
python playground.py
\`\`\`

How can I help you today?`
            }]
          }
        ]
      })
    }

    const data = await response.json()
    
    // Transform the response to match the expected frontend format
    if (data.success) {
      return NextResponse.json({
        messages: [
          ...messages,
          {
            id: Date.now().toString(),
            role: 'assistant',
            parts: [{
              type: 'text',
              text: data.response
            }],
            agent_name: data.agent_name,
            timestamp: data.timestamp
          }
        ]
      })
    } else {
      // Handle error response from playground
      return NextResponse.json({
        messages: [
          ...messages,
          {
            id: Date.now().toString(),
            role: 'assistant',
            parts: [{
              type: 'text',
              text: `Error: ${data.error}\n\nAvailable agents: ${data.available_agents?.join(', ') || 'Unknown'}`
            }]
          }
        ]
      })
    }
    
  } catch (error) {
    console.error('Chat API error:', error)
    
    // Return a fallback response
    let fallbackMessages: any[] = []
    try {
      const errorBody = await req.json()
      fallbackMessages = errorBody.messages || []
    } catch (e) {
      fallbackMessages = []
    }
    
    return NextResponse.json({
      messages: [
        ...fallbackMessages,
        {
          id: Date.now().toString(),
          role: 'assistant',
          parts: [{
            type: 'text',
            text: 'I apologize, but I am currently experiencing connection issues. Please try again in a moment.'
          }]
        }
      ]
    })
  }
}