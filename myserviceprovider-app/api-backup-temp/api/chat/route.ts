import { NextRequest, NextResponse } from 'next/server';
import { StreamingTextResponse } from 'ai';

export const dynamic = 'force-dynamic';

// ServiceFlow AI knowledge base for responses
const serviceFlowKnowledge = {
  features: {
    live: [
      "AI Image Generation - $1 USDC or $S token per image",
      "AI Video Generation - $2 USDC or $S token per video",
      "Sonic Blockchain Integration for fast, secure payments",
      "Community voting and leaderboard system",
      "Revenue sharing model with NFT staking rewards"
    ],
    upcoming: [
      "Agent Launchpad - Build custom AI agents for your business",
      "Workflow Builder - Automate business processes",
      "Analytics Dashboard - Track performance and insights",
      "Lead Generation - AI-powered customer acquisition",
      "Smart Scheduling - Intelligent appointment booking"
    ]
  },
  pricing: {
    image: "$1 USDC or $S token",
    video: "$2 USDC or $S token",
    bonus: "20% extra value with crypto payments",
    distribution: "15% leaderboard, 50% development, 25% NFT staking"
  },
  industries: [
    "Contractors", "Plumbers", "Roofers", "Hair Stylists", 
    "Handymen", "Electricians", "Landscapers", "Cleaning Services"
  ]
};

// Simple response generator based on keywords
function generateResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();
  
  if (message.includes('image') || message.includes('generation') || message.includes('ai generation')) {
    return `🎨 **AI Image Generation is Live!**

Our AI image generation is powered by advanced models and costs just $1 USDC or $S token per image. Here's what makes it special:

• Lightning-fast generation (usually under 30 seconds)
• High-quality results using premium AI models  
• Sonic blockchain integration for secure payments
• 20% bonus value when paying with crypto
• Community voting system with leaderboard rewards

Ready to try it? Head to our /generate page and create your first AI image! You can start with a free generation to test it out.

What kind of images are you looking to create for your business?`;
  }
  
  if (message.includes('video')) {
    return `📹 **AI Video Generation - Now Available!**

Create stunning AI videos for your business for just $2 USDC or $S token per video:

• Generate promotional videos for your services
• Create engaging social media content
• Professional quality output
• Sonic blockchain powered payments
• Fast processing times

This is perfect for service businesses like contractors, plumbers, and hair stylists who want to showcase their work visually. 

Want to see it in action? Visit our /generate page and create your first AI video!`;
  }
  
  if (message.includes('pricing') || message.includes('cost') || message.includes('price')) {
    return `💰 **ServiceFlow AI Pricing - Simple & Transparent**

**Current Live Features:**
• Image Generation: $1 USDC or $S token
• Video Generation: $2 USDC or $S token
• 20% bonus value with crypto payments!

**Payment Distribution:**
• 15% → Leaderboard rewards for top creators
• 50% → Development and AI infrastructure costs  
• 25% → NFT holder staking rewards

**Upcoming Agent Builder:**
• Custom pricing based on complexity
• Success-based revenue sharing options
• Enterprise packages for larger businesses

We believe in fair, transparent pricing that grows with your business success!`;
  }
  
  if (message.includes('agent') || message.includes('builder') || message.includes('launchpad')) {
    return `🤖 **Agent Launchpad - Coming Soon!**

Our Agent Launchpad will let you build custom AI agents specifically for YOUR business:

• **Lead Qualification** - AI that understands your services and qualifies prospects
• **Appointment Scheduling** - Smart booking that syncs with your calendar  
• **Customer Service** - 24/7 support that knows your business inside and out
• **Quote Generation** - Automated estimates based on your pricing structure

**Perfect for:**
${serviceFlowKnowledge.industries.slice(0, 4).map(industry => `• ${industry}`).join('\n')}

The best part? Our agents learn your business processes and get smarter over time. 

Want early access? Join our waitlist and be the first to build your custom AI workforce!`;
  }
  
  if (message.includes('business') || message.includes('help') || message.includes('benefits')) {
    return `🚀 **How ServiceFlow AI Transforms Service Businesses**

**Immediate Impact:**
• Create professional marketing content with AI generation
• Stand out from competitors with unique visuals
• Generate content 10x faster than traditional methods

**Coming Soon - Full Business Automation:**
• AI agents that handle customer inquiries 24/7
• Automated lead qualification and follow-up
• Smart scheduling that maximizes your bookings
• Revenue sharing as you grow

**Industries We Serve:**
${serviceFlowKnowledge.industries.map(industry => `• ${industry}`).join('\n')}

**Real Results:**
Service businesses using AI see 40% more leads and 25% increase in booking conversions.

What type of service business do you run? I'd love to show you specific ways ServiceFlow AI can help you grow!`;
  }
  
  if (message.includes('sonic') || message.includes('blockchain') || message.includes('crypto')) {
    return `⚡ **Powered by Sonic Blockchain**

We chose Sonic blockchain for several key reasons:

• **Lightning Fast** - Transactions confirm in seconds, not minutes
• **Low Fees** - Keep more of your money with minimal transaction costs
• **Secure** - Enterprise-grade security for all payments
• **Scalable** - Handles high transaction volumes without slowdown

**Benefits for You:**
• Pay with USDC or $S tokens
• 20% bonus value with crypto payments
• Instant access to generated content
• Transparent payment distribution

**Revenue Sharing on Sonic:**
• 15% goes to community leaderboard rewards
• 50% funds development and AI infrastructure  
• 25% distributed to NFT staking holders

This creates a sustainable ecosystem where everyone benefits as the platform grows!`;
  }
  
  if (message.includes('hello') || message.includes('hi') || message.includes('start')) {
    return `👋 Welcome to ServiceFlow AI! 

I'm here to help you discover how our platform can revolutionize your service business with AI.

**Quick Links:**
• Try AI Generation → /generate  
• Join Waitlist → Scroll down on homepage
• Learn More → Ask me anything!

**Popular Questions:**
• "How does AI image generation work?"
• "What are your pricing plans?"  
• "Tell me about the Agent Launchpad"
• "How can ServiceFlow help my business?"

What would you like to explore first?`;
  }
  
  // Default response
  return `Thanks for your question! ServiceFlow AI is the leading platform for service businesses looking to leverage AI.

**Here's what we offer:**
🎨 AI Image & Video Generation (Live Now!)
🤖 Custom Agent Builder (Coming Soon!)
⚡ Sonic Blockchain Integration
💰 Revenue Sharing & Rewards

**Want to learn more?**
• Try our AI generation at /generate
• Ask about specific features like "pricing" or "agent builder"
• Tell me about your business for personalized recommendations

I'm here to help you understand how AI can transform your service business. What specific area interests you most?`;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    
    if (!lastMessage || !lastMessage.content) {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }

    // Try to use OpenAI if available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (openaiApiKey) {
      try {
        // Dynamic import to avoid issues if @ai-sdk/openai is not available
        const { openai } = await import('@ai-sdk/openai');
        const { streamText } = await import('ai');
        
        const systemPrompt = `You are ServiceFlow AI's intelligent assistant. Respond enthusiastically about our platform features:

LIVE NOW: AI Image Generation ($1 USDC/$S), AI Video Generation ($2 USDC/$S), Sonic blockchain payments
COMING SOON: Agent Launchpad, Workflow Builder, Smart Scheduling
INDUSTRIES: Contractors, Plumbers, Roofers, Hair Stylists, Handymen, etc.

Be conversational, focus on business value, and encourage trying our /generate page.`;

        const result = await streamText({
          model: openai('gpt-4-turbo-preview'),
          system: systemPrompt,
          messages,
          temperature: 0.7,
          maxTokens: 400,
        });

        return new StreamingTextResponse(result.toAIStream());
      } catch (openaiError) {
        console.log('OpenAI not available, using fallback:', openaiError.message);
      }
    }

    // Fallback to rule-based responses
    const response = generateResponse(lastMessage.content);
    
    // Create a simple streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(response));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process chat request. Please try again.' 
      },
      { status: 500 }
    );
  }
}