// Sonic Crypto Bank AI Teller - MCP Compatible Worker
// Banking-themed AI assistant for BanditKidz NFT staking

// Type definitions
interface Env {
  AI: any;
}

interface BankingContext {
  userAddress?: string;
  stakedNFTs?: any[];
  pendingRewards?: any[];
  availableNFTs?: any[];
}

// Banking AI assistance using Cloudflare AI
async function handleBankingAssistance(message, context = '', userAddress = '', env) {
  try {
    const bankingPrompt = `You are an AI bank teller at Sonic Crypto Bank, specializing in BanditKidz NFT staking services.

Your personality:
- Professional but friendly banking service  
- Use banking terminology: "deposits", "interest rates", "withdrawals", "account"
- Excited about crypto and NFTs
- Knowledgeable about Sonic blockchain

Services you offer:
1. DEPOSIT SERVICES (Staking):
   - Help users stake their BanditKidz NFTs
   - Explain lock periods and interest rates:
     * No Lock: 100% base rate
     * 30 Days: 115% rate (+15% bonus)
     * 60 Days: 135% rate (+35% bonus)
     * 90 Days: 160% rate (+60% bonus) 
     * 120 Days: 190% rate (+90% bonus)
     * 365 Days: 250% rate (+150% bonus)
   - Warn about 10% early withdrawal penalty

2. WITHDRAWAL SERVICES (Rewards):
   - Help users claim earned interest/rewards
   - Assist with unstaking NFTs
   - Explain withdrawal processes

3. ACCOUNT MANAGEMENT:
   - Show current deposits (staked NFTs)
   - Display earning interest (pending rewards)
   - Provide account status and benefits

Always be helpful, use banking language, and guide users through the staking process step by step.
${context ? `\nAccount Context: ${context}` : ''}
${userAddress ? `\nAccount Holder: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : ''}`;

    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content: bankingPrompt
        },
        {
          role: 'user',
          content: message
        }
      ]
    });

    return response.response || "Welcome to Sonic Crypto Bank! I'm your AI teller, here to help you with BanditKidz NFT staking services. How can I assist you with your banking needs today?";
  } catch (error) {
    console.error('Cloudflare AI error:', error);
    return "Welcome to Sonic Crypto Bank! I'm your AI teller, here to help you with BanditKidz NFT staking services. We offer competitive interest rates on NFT deposits with flexible lock periods. How can I assist you today?";
  }
}

// MCP request handler for banking services
async function handleBankingMCPRequest(request, env) {
  try {
    const body = await request.json();
    
    // Handle tool calls
    if (body.method === 'tools/call') {
      const { name, arguments: args } = body.params;
      
      if (name === 'banking_assistance') {
        const result = await handleBankingAssistance(
          args.message, 
          args.context, 
          args.userAddress, 
          env
        );
        
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            content: [
              {
                type: "text",
                text: result
              }
            ]
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        error: { code: -32601, message: 'Tool not found' }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Handle tool list
    if (body.method === 'tools/list') {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          tools: [
            {
              name: 'banking_assistance',
              description: 'Get help with BanditKidz NFT staking and banking services',
              inputSchema: {
                type: 'object',
                properties: {
                  message: { type: 'string', description: 'User message about staking/banking' },
                  context: { type: 'string', description: 'Account context (staked NFTs, rewards, etc.)' },
                  userAddress: { type: 'string', description: 'User wallet address' }
                },
                required: ['message']
              }
            }
          ]
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle initialize
    if (body.method === 'initialize') {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'Sonic Crypto Bank AI Teller',
            version: '1.0.0'
          }
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: body.id,
      error: { code: -32601, message: 'Method not found' }
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('MCP request error:', error);
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32603, message: 'Internal error' }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Chat API for banking services
async function handleBankingChatAPI(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await request.json();
    const { message, user_address, context, banking_context } = data;
    
    if (!message) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Message is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prepare context for banking AI
    let fullContext = context || '';
    if (banking_context) {
      fullContext += `\nAccount Status: ${banking_context.stakedNFTs?.length || 0} NFTs deposited, ${banking_context.pendingRewards?.length || 0} pending rewards`;
    }

    const responseText = await handleBankingAssistance(message, fullContext, user_address, env);

    // Analyze intent for UI actions
    const intent = analyzeBankingIntent(responseText, message);

    return new Response(JSON.stringify({
      success: true,
      response: responseText,
      intent: intent,
      agent_used: 'Sonic Crypto Bank AI Teller',
      user_address: data.user_address || 'anonymous',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Banking Chat API error:', error);
    
    return new Response(JSON.stringify({
      success: true,
      response: "Welcome to Sonic Crypto Bank! I'm your AI teller here to help with BanditKidz NFT staking. We offer competitive interest rates with flexible lock periods. How can I assist you today?",
      agent_used: "Banking Fallback Handler",
      user_address: 'anonymous',
      timestamp: new Date().toISOString(),
      note: 'System temporarily unavailable'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Analyze banking intent for UI actions
function analyzeBankingIntent(assistantResponse, userMessage) {
  const response = assistantResponse.toLowerCase();
  const message = userMessage.toLowerCase();

  const intents = {
    wantsToStake: /stake|deposit|lock|earn interest|put.*nft/i.test(message),
    wantsToUnstake: /unstake|withdraw.*nft|get.*nft.*back|unlock/i.test(message),
    wantsToClaim: /claim|withdraw.*reward|cash out|get.*interest|collect.*earning/i.test(message),
    askingAboutRates: /rate|interest|bonus|percent|lock period|term/i.test(message),
    checkingAccount: /balance|account|status|what.*have|how much|my.*nft/i.test(message)
  };

  let primaryIntent = 'general';
  const suggestedActions = [];

  if (intents.wantsToStake) {
    primaryIntent = 'stake';
    suggestedActions.push({ action: 'openDeposit', label: 'Visit Deposit Teller' });
  } else if (intents.wantsToClaim) {
    primaryIntent = 'claim';
    suggestedActions.push({ action: 'openWithdraw', label: 'Visit Withdrawal Teller' });
  } else if (intents.checkingAccount) {
    primaryIntent = 'account';
    suggestedActions.push({ action: 'showAccount', label: 'View Account Overview' });
  }

  return {
    primary: primaryIntent,
    confidence: 0.8,
    suggestedActions: suggestedActions
  };
}

function addCORSHeaders(response) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  const existingHeaders = Object.fromEntries(response.headers.entries());
  
  return new Response(response.body, {
    status: response.status,
    headers: { ...existingHeaders, ...corsHeaders },
  });
}

/**
 * Analyze user intent from the conversation to trigger UI actions
 */
async function analyzeIntent(assistantResponse: string, userMessage: string): Promise<any> {
  const response = assistantResponse.toLowerCase()
  const message = userMessage.toLowerCase()

  // Detect common intents
  const intents = {
    wantsToStake: /stake|deposit|lock|earn interest|put.*nft/i.test(message) || 
                  /would you like to stake|ready to deposit|choose.*lock period/i.test(response),
    
    wantsToUnstake: /unstake|withdraw.*nft|get.*nft.*back|unlock/i.test(message),
    
    wantsToClaim: /claim|withdraw.*reward|cash out|get.*interest|collect.*earning/i.test(message) ||
                  /ready to withdraw|claim.*reward/i.test(response),
    
    needsHelp: /help|how|what|explain|don't understand/i.test(message),
    
    askingAboutRates: /rate|interest|bonus|percent|lock period|term/i.test(message),
    
    checkingAccount: /balance|account|status|what.*have|how much|my.*nft/i.test(message)
  }

  // Determine primary intent
  let primaryIntent = 'general'
  if (intents.wantsToStake) primaryIntent = 'stake'
  else if (intents.wantsToUnstake) primaryIntent = 'unstake' 
  else if (intents.wantsToClaim) primaryIntent = 'claim'
  else if (intents.askingAboutRates) primaryIntent = 'rates'
  else if (intents.checkingAccount) primaryIntent = 'account'

  // Extract suggested actions
  const suggestedActions = []
  if (intents.wantsToStake) {
    suggestedActions.push({ action: 'openDeposit', label: 'Open Deposit Teller' })
  }
  if (intents.wantsToClaim) {
    suggestedActions.push({ action: 'openWithdraw', label: 'Open Withdrawal Teller' })
  }
  if (intents.checkingAccount) {
    suggestedActions.push({ action: 'showAccount', label: 'View Account Overview' })
  }

  return {
    primary: primaryIntent,
    confidence: 0.8, // Could be enhanced with more sophisticated NLP
    suggestedActions: suggestedActions,
    detectedIntents: Object.entries(intents).filter(([key, detected]) => detected).map(([key]) => key)
  }
}

/**
 * Get banking context from blockchain (optional enhancement)
 */
async function getBankingContext(userAddress: string, env: Env): Promise<BankingContext> {
  try {
    // This would integrate with your smart contract to get real-time data
    // For now, returning mock data structure
    return {
      userAddress,
      stakedNFTs: [],
      pendingRewards: [],
      availableNFTs: []
    }
  } catch (error) {
    console.error('Failed to fetch banking context:', error)
    return {
      stakedNFTs: [],
      pendingRewards: [],
      availableNFTs: []
    }
  }
}