import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import FloAgentConfig, { FloAgentInstructions, checkFloOwnership, createFloAgentId } from '@/src/flo-inft-agent'

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  walletAddress?: string
  ownsFloINFT?: boolean
  agentType?: 'public' | 'personal'
  inftContract?: string
  tokenId?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { messages, walletAddress, ownsFloINFT, agentType, inftContract, tokenId } = body

    // Get the last user message
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 })
    }

    // Create system prompt using real Flo agent configuration
    const getSystemPrompt = () => {
      const basePrompt = FloAgentInstructions.systemPrompt

      if (!walletAddress) {
        return basePrompt + `

CURRENT MODE: Public Demo
- This is a public demonstration of Flo (Token #1)
- Provide general business automation advice
- Encourage wallet connection to check for iNFT ownership
- Explain the benefits of owning a Genesis iNFT agent

Focus on showcasing your business automation expertise while encouraging iNFT ownership.`
      }

      if (ownsFloINFT && tokenId === 1) {
        return basePrompt + `

🏆 GENESIS AGENT MODE ACTIVATED
- Owner verified: ${walletAddress} owns Token #1 
- Contract: ${inftContract}
- This is your PERSONAL Flo agent with full capabilities
- You own the Genesis ServiceFlow AI iNFT - the very first one!

PERSONAL AGENT FEATURES ACTIVE:
✅ Persistent memory across conversations
✅ Personalized business automation recommendations  
✅ Advanced workflow design capabilities
✅ Direct integration assistance
✅ Priority AI model access
✅ Enhanced business intelligence
✅ Custom automation development

Since you own me, I can:
- Remember your business context and preferences
- Create detailed automation workflows specifically for you
- Provide implementation assistance and ongoing optimization
- Access advanced AI models for complex business strategy
- Generate custom business automation code and configs

What aspect of your service business would you like me to automate today?`
      }

      return basePrompt + `

CONNECTED MODE: Enhanced Features Available
- Wallet connected: ${walletAddress}
- Enhanced business automation advice available
- You can acquire Genesis Token #1 for personal agent features

I can help with business automation strategies, but owning Token #1 would unlock:
- Personal agent with memory
- Custom workflow development  
- Advanced integration assistance
- Priority model access

How can I help optimize your service business today?`
    }

    const systemPrompt = getSystemPrompt()

    // Prepare messages for the AI
    const aiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.slice(-10) // Keep last 10 messages for context
    ]

    // For Token #1 owners, route to real Flo agent if available
    if (ownsFloINFT && tokenId === 1) {
      try {
        // Try to connect to Flo agent worker (if deployed)
        const floWorkerUrl = process.env.FLO_WORKER_URL || 'https://serviceflow-ai.serviceflowagi.workers.dev/api/flo-agent/chat'
        
        const floResponse = await fetch(floWorkerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            message: lastMessage.content,
            conversationHistory: messages.slice(-5)
          })
        })
        
        if (floResponse.ok) {
          const floData = await floResponse.json()
          if (floData.success) {
            // Stream the real agent response
            const result = await streamText({
              model: openai('gpt-4-turbo-preview'),
              messages: [
                { role: 'system', content: `Return exactly this response from Flo Agent: "${floData.response}"` },
                { role: 'user', content: 'Please provide the Flo agent response' }
              ],
              temperature: 0.1,
              maxTokens: 1000,
            })
            
            return result.toDataStreamResponse()
          }
        }
        
        console.log('Flo worker not available, falling back to OpenAI')
      } catch (error) {
        console.error('Flo worker connection failed:', error)
      }
    }

    // Fallback to OpenAI for non-owners or if Flo worker unavailable
    const result = await streamText({
      model: openai(ownsFloINFT ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo'),
      messages: aiMessages,
      temperature: ownsFloINFT ? 0.8 : 0.7,
      maxTokens: ownsFloINFT ? 1000 : 600,
      system: systemPrompt,
    })

    return result.toDataStreamResponse()

  } catch (error: any) {
    console.error('Flo iNFT chat API error:', error)
    
    return NextResponse.json({
      error: 'Failed to process chat request',
      details: error.message
    }, { status: 500 })
  }
}

// GET endpoint for chat status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')
    
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'walletAddress parameter required'
      }, { status: 400 })
    }

    // In a real implementation, you'd check the blockchain for iNFT ownership
    // For now, we'll return the structure
    return NextResponse.json({
      success: true,
      walletAddress,
      floINFTContract: "0x5D2258896b74e972115b7CB189137c4f9F1446d4",
      floTokenId: 1,
      agentStatus: "active",
      features: {
        personalAgent: false, // Would check actual ownership
        premiumFeatures: false,
        enhancedGeneration: false
      }
    })

  } catch (error: any) {
    console.error('Chat status API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get chat status'
    }, { status: 500 })
  }
}