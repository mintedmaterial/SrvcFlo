import { NextRequest, NextResponse } from 'next/server'

interface BankingContext {
  stakedNFTs?: any[]
  pendingRewards?: any[]
  availableNFTs?: any[]
  bankBalance?: {
    s: number
    usdc: number
    eth: number
  }
}

interface ChatRequest {
  message: string
  user_address?: string
  banking_context?: BankingContext
  context?: string
}

// Banking AI assistance using Cloudflare AI
async function handleBankingAssistance(message: string, context = '', userAddress = '', env: any) {
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

    // For now, use a simple response system since we don't have direct Cloudflare AI access in this context
    // In production, this would call env.AI.run()
    const mockResponse = generateBankingResponse(message, context, userAddress);
    
    return mockResponse;
  } catch (error) {
    console.error('Banking AI error:', error);
    return "Welcome to Sonic Crypto Bank! I'm your AI teller, here to help you with BanditKidz NFT staking services. We offer competitive interest rates on NFT deposits with flexible lock periods. How can I assist you today?";
  }
}

// Mock banking response generator (replace with actual AI when deployed)
function generateBankingResponse(message: string, context: string, userAddress: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('deposit') || lowerMessage.includes('stake')) {
    return "Excellent! I'd be happy to help you make a deposit to your premium account. Our current interest rates are very competitive:\n\n• No Lock Period: 100% base rate - withdraw anytime\n• 30-Day Term: 115% rate (+15% bonus)\n• 90-Day Term: 160% rate (+60% bonus)\n• 365-Day Term: 250% rate (+150% bonus)\n\nWhich term deposit interests you most? I can walk you through the deposit process step by step.";
  }
  
  if (lowerMessage.includes('withdraw') || lowerMessage.includes('claim') || lowerMessage.includes('reward')) {
    return "I see you're interested in making a withdrawal from your account. Let me check your account status... \n\nFor withdrawal services, I can help you:\n• Claim your earned interest/rewards\n• Process early withdrawals (10% penalty applies for locked terms)\n• Withdraw your deposited NFTs when terms expire\n\nWould you like me to show you your current withdrawal options?";
  }
  
  if (lowerMessage.includes('rate') || lowerMessage.includes('interest') || lowerMessage.includes('bonus')) {
    return "Our interest rate schedule is designed to reward longer-term deposits:\n\n🏦 **Current Interest Rates:**\n• No Lock: 100% base rate\n• 30 Days: 115% (+15% bonus)\n• 60 Days: 135% (+35% bonus) \n• 90 Days: 160% (+60% bonus)\n• 120 Days: 190% (+90% bonus)\n• 365 Days: 250% (+150% bonus)\n\nThese rates are among the most competitive in the Sonic ecosystem! Longer terms earn significantly higher returns.";
  }
  
  if (lowerMessage.includes('account') || lowerMessage.includes('balance') || lowerMessage.includes('status')) {
    return `Thank you for banking with us${userAddress ? `, account holder ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : ''}! \n\nYour account provides:\n• Premium banking services\n• Competitive interest rates on deposits\n• Voting power in community decisions\n• Priority customer support\n\nWould you like me to review your current account activity or help you with a specific banking service?`;
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
    return "Welcome to Sonic Crypto Bank! I'm here to provide professional banking services for your NFT assets.\n\n🏦 **My Services Include:**\n• **Deposit Services**: Stake your BanditKidz NFTs with flexible terms\n• **Withdrawal Services**: Claim rewards and withdraw assets\n• **Account Management**: Monitor your deposits and earnings\n• **Financial Advisory**: Help choose the best interest rates\n\nWhat banking service can I assist you with today?";
  }
  
  return "Thank you for choosing Sonic Crypto Bank! I'm your dedicated AI teller, here to help with all your NFT banking needs. Whether you're looking to make deposits, withdraw earnings, or learn about our competitive interest rates, I'm here to provide professional service. How may I assist you today?";
}

// Analyze banking intent for UI actions
function analyzeBankingIntent(assistantResponse: string, userMessage: string) {
  const response = assistantResponse.toLowerCase();
  const message = userMessage.toLowerCase();

  const intents = {
    wantsToStake: /deposit|stake|lock|earn interest|put.*nft/i.test(message),
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

export async function POST(request: NextRequest) {
  try {
    const data: ChatRequest = await request.json();
    const { message, user_address, context, banking_context } = data;
    
    if (!message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Message is required' 
      }, { status: 400 });
    }

    // Prepare context for banking AI
    let fullContext = context || '';
    if (banking_context) {
      fullContext += `\nAccount Status: ${banking_context.stakedNFTs?.length || 0} NFTs deposited, ${banking_context.pendingRewards?.length || 0} pending rewards`;
      if (banking_context.bankBalance) {
        fullContext += `\nAccount Balance: ${banking_context.bankBalance.s.toFixed(1)} S, ${banking_context.bankBalance.usdc.toFixed(1)} USDC`;
      }
    }

    const responseText = await handleBankingAssistance(message, fullContext, user_address || '', null);

    // Analyze intent for UI actions
    const intent = analyzeBankingIntent(responseText, message);

    return NextResponse.json({
      success: true,
      response: responseText,
      intent: intent,
      agent_used: 'Sonic Crypto Bank AI Teller',
      user_address: user_address || 'anonymous',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Banking Chat API error:', error);
    
    return NextResponse.json({
      success: true,
      response: "Welcome to Sonic Crypto Bank! I'm your AI teller here to help with BanditKidz NFT staking. We offer competitive interest rates with flexible lock periods. How can I assist you today?",
      agent_used: "Banking Fallback Handler",
      user_address: 'anonymous',
      timestamp: new Date().toISOString(),
      note: 'System temporarily unavailable'
    });
  }
}