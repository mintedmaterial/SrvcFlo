# Payment System & Smart Contract Integration

> **🚀 NEW: INFT Agent System Available!** - Now supporting intelligent NFT agents alongside traditional credits

## Overview

Our payment system is built on the Sonic blockchain, utilizing smart contracts for transparent, automated distribution of generation payments to stakeholders. Now featuring both traditional credit purchases and revolutionary INFT (Intelligent NFT) agents that combine AI capabilities with ownership rights.

## Payment Models

### 1. Traditional Credits System
- Purchase credits with various tokens
- Pay per generation (1 credit = 1 generation)
- Instant processing, no ownership rights

### 2. INFT Agent System ⭐ NEW
- Mint intelligent AI agents as NFTs
- Agents include embedded credits and learning capabilities
- Own both the agent and all content it generates
- Transferable, tradeable, and rentable through AIaaS

Our payment system processes all transactions instantly with low fees and full transparency.

## Supported Payment Methods

### Crypto Payments (Sonic Network)

**S Token (Native Sonic Token)**
- **Cost**: 3 S tokens per generation
- **Quality**: Premium+ with priority processing  
- **Benefits**: Highest quality models, support ecosystem growth
- **Contract**: Native Sonic token

**wS Token (Wrapped Sonic)**
- **Cost**: 3 wS tokens per generation
- **Quality**: Premium+ with priority processing
- **Benefits**: Same as S token, ERC-20 compatibility
- **Contract**: `0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38`

**USDC (Sonic Network)**
- **Cost**: 1 USDC per generation
- **Quality**: Premium
- **Benefits**: Stable pricing, widely accepted
- **Contract**: `0x29219dd400f2Bf60E5a23d13Be72B486D4038894`

**EURC (Euro Coin)**
- **Cost**: 1 EURC per generation  
- **Quality**: Premium
- **Benefits**: Euro-denominated stable pricing
- **Regional Focus**: European users

### Alternative Payment Methods

**Credits System**
- **Cost**: 1 credit per generation
- **Source**: Purchased with fiat or earned through rewards
- **Quality**: Premium
- **Convenience**: No gas fees, instant processing

**Free Tier (HuggingFace Models)**
- **Cost**: Free (up to daily limits)
- **Quality**: Standard
- **Models**: Open-source HuggingFace models
- **Limitations**: Lower resolution, basic features

## Smart Contract Architecture

### Main Payment Contract

**SonicAIGenerationPayment Contract**
- **Network**: Sonic Mainnet
- **Purpose**: Handles all generation payments and distributions
- **Security**: Audited and battle-tested
- **Upgradability**: Proxy pattern for future improvements

**Key Functions:**
```solidity
// Pay with S tokens
function payWithS(string prompt, string generationType)

// Pay with USDC  
function payWithUSDC(string prompt, string generationType)

// Use credits for generation
function useCredits(string prompt, string generationType)

// Admin: Add credits to user account
function addCredits(address user, uint256 amount)
```

### Payment Distribution Logic

When a user pays for generation, funds are automatically distributed:

```
Total Payment (100%)
├── 25% → BanditKidz Staking Contract
├── 15% → Weekly Contest Prize Pool  
├── 50% → Developer Wallet
└── 10% → Contract Reserves
```

**Distribution Details:**

**25% to BanditKidz Staking (Immediate)**
- Funds sent directly to staking contract
- Accumulated for monthly distributions
- Pro-rata allocation to all staked NFT holders
- Supports long-term holder rewards

**15% to Contest Winners (Weekly)**
- Held in contract until contest ends
- Automatically distributed to top 3 winners
- Prize allocation: 50% / 30% / 20% split
- Payable in same tokens as original payments

**50% to Developer Wallet (Immediate)**
- Covers operational costs and development
- Server infrastructure and AI model access
- Platform maintenance and improvements  
- Team compensation and growth

**10% to Contract Reserves (Accumulating)**
- Emergency fund for platform stability
- Future feature development
- Community initiatives and partnerships
- Long-term sustainability fund

## Transaction Flow

### Standard Generation Payment

1. **User Initiates Payment**
   - Selects payment method and enters prompt
   - Wallet shows transaction preview with gas estimates
   - User confirms transaction in wallet

2. **Smart Contract Processing**
   - Validates user has sufficient balance
   - Transfers tokens from user to contract
   - Executes automatic distribution logic
   - Emits events for tracking

3. **Distribution Execution**
   - 25% sent to staking contract immediately
   - 15% held for weekly contest pool
   - 50% sent to developer wallet
   - 10% retained in contract reserves

4. **Generation Trigger**
   - Contract emits `GenerationRequested` event
   - Backend services pick up event
   - AI generation process begins
   - Results stored and linked to payment

5. **Community Submission**
   - Generation automatically submitted to thread
   - Voting contract records generation details
   - User earns leaderboard eligibility
   - Available for community voting

### Transaction Verification

**On-Chain Transparency**
- All transactions visible on Sonic Explorer
- Smart contract addresses are public
- Distribution percentages immutable in code
- Real-time balance tracking available

**Event Logging**
```solidity
event PaymentReceived(
    address indexed payer, 
    address indexed token, 
    uint256 amount, 
    string generationType
);

event GenerationRequested(
    address indexed user, 
    string prompt, 
    string generationType, 
    uint256 generationId
);
```

## FeeM Integration

### Automatic Rewards Registration

**FeeM Protocol Benefits**
- **Registration**: Contract automatically registers for FeeM rewards
- **Reward Direction**: All FeeM rewards sent to staking contract
- **Additional Yield**: Bonus rewards for ecosystem participation
- **Passive Income**: No user action required

**Implementation:**
```solidity
function registerMe() external onlyOwner {
    (bool success,) = address(0xDC2B0D2Dd2b7759D97D50db4eabDC36973110830).call("");
    require(success, "FeeM registration failed");
}
```

### Reward Amplification
- **Base Rewards**: Platform usage generates FeeM rewards
- **Staking Boost**: Rewards amplify staking distributions  
- **Community Benefits**: More rewards = higher staking yields
- **Growth Incentive**: Success breeds more success

## Gas Optimization

### Efficient Contract Design

**Batch Operations**
- Multiple NFT staking in single transaction
- Bulk reward distributions to reduce gas costs
- Optimized storage patterns for gas efficiency
- Event batching for reduced blockchain spam

**Gas Estimation**
- **S/wS Payment**: ~50,000 gas (~$0.01 on Sonic)
- **USDC Payment**: ~55,000 gas (~$0.01 on Sonic)  
- **NFT Staking**: ~75,000 gas per NFT (~$0.015 on Sonic)
- **Voting**: ~45,000 gas (~$0.009 on Sonic)

### User Experience Optimization

**Transaction Batching**
- Combine approval + payment in single flow
- Batch multiple generations for power users
- Optimize for mobile wallet compatibility
- Progressive transaction status updates

## Security Features

### Smart Contract Security

**Access Controls**
- Owner-only functions for admin operations
- Multi-signature wallet for critical functions
- Time-locked upgrades for major changes
- Emergency pause functionality

**Input Validation**
- Prompt length limits to prevent spam
- Payment amount validation
- Token address whitelisting
- Rate limiting for abuse prevention

**Economic Security**
- Minimum payment thresholds
- Maximum generation limits per user
- Anti-bot measures through gas costs
- Economic incentives align with platform health

### Audit & Testing

**Smart Contract Audits**
- Third-party security audit completed
- Formal verification of critical functions
- Bug bounty program for ongoing security
- Regular security reviews and updates

**Testing Coverage**
- 100% unit test coverage
- Integration testing with frontend
- Load testing for high-traffic scenarios
- Disaster recovery procedures tested

## Payment Analytics

### Real-Time Metrics

**Platform Statistics**
- Total payments processed
- Distribution breakdown by category
- Average payment amounts
- User adoption trends

**Token Analytics**
- Payment method preferences
- Token velocity and circulation
- Staking contract balance growth
- Reward distribution efficiency

### User Dashboard

**Personal Payment History**
- All generation payments with timestamps
- Transaction hashes and block confirmations
- Payment method breakdown
- Total spending and generations created

**Cost Tracking**
- Average cost per generation
- Gas fee analytics
- Payment method cost comparison
- Monthly spending summaries

## Troubleshooting

### Common Payment Issues

**Transaction Failed**
- **Insufficient Balance**: Ensure wallet has enough tokens + gas
- **Network Issues**: Check Sonic network status
- **Gas Limit**: Increase gas limit if transaction complex
- **Wallet Connection**: Reconnect wallet and retry

**Payment Not Processed**
- **Transaction Pending**: Wait for blockchain confirmation
- **Wrong Network**: Ensure connected to Sonic network
- **Contract Error**: Check transaction on Sonic Explorer
- **Support Contact**: Provide transaction hash for assistance

**Distribution Problems**
- **Staking Rewards Delayed**: Check monthly distribution schedule
- **Contest Prizes Missing**: Verify contest period and ranking
- **Wrong Token Received**: Check if payment was in mixed tokens
- **Amount Discrepancy**: Verify distribution percentages and timing

### Error Resolution

**Step-by-Step Debugging**
1. **Check Transaction Status**: Look up transaction hash on Sonic Explorer
2. **Verify Network**: Confirm you're on Sonic mainnet (Chain ID: 146)
3. **Balance Verification**: Check token balances before and after transaction
4. **Contract Interaction**: Verify you're interacting with correct contract address
5. **Gas Settings**: Ensure adequate gas limit and price settings

**Getting Support**
- **Discord Community**: Fast community support and troubleshooting
- **Technical Documentation**: Comprehensive guides and FAQs
- **Direct Support**: Contact team with transaction details
- **Emergency Procedures**: For urgent issues affecting payments

## Future Enhancements

### Payment System Roadmap

**Multi-Chain Support**
- **Ethereum Integration**: Support ETH and ERC-20 payments
- **Polygon Integration**: Lower-cost alternative payments
- **Base Integration**: Coinbase ecosystem connectivity
- **Cross-Chain Bridges**: Seamless token transfers

**Advanced Payment Features**
- **Subscription Model**: Monthly payment plans for power users
- **Payment Scheduling**: Schedule generations in advance
- **Bulk Discounts**: Volume pricing for enterprise users
- **Referral Rewards**: Earn tokens for bringing new users

### Smart Contract Evolution

**Governance Integration**
- **DAO Voting**: Community votes on distribution percentages
- **Proposal System**: Suggest platform improvements
- **Treasury Management**: Community control of reserves
- **Upgrade Governance**: Decentralized contract upgrades

**Advanced Distribution**
- **Dynamic Percentages**: Adjust based on platform metrics
- **Performance Bonuses**: Extra rewards for high-quality content
- **Seasonal Adjustments**: Special distributions during events
- **Cross-Platform Rewards**: Integration with partner platforms

## Integration Guide for Developers

### Smart Contract Integration

**Contract Addresses**
```javascript
// Sonic Mainnet
const PAYMENT_CONTRACT = "0x..." // Main payment contract
const STAKING_CONTRACT = "0x..." // BanditKidz staking
const VOTING_CONTRACT = "0x..."  // Community voting
const NFT_CONTRACT = "0x6988c29f8c0051d261f288c2c497a592e2d1061f"
```

**Basic Integration Example**
```javascript
import { ethers } from 'ethers';

// Connect to Sonic network
const provider = new ethers.providers.JsonRpcProvider('https://rpc.soniclabs.com');
const contract = new ethers.Contract(PAYMENT_CONTRACT, ABI, provider);

// Pay with USDC
async function payWithUSDC(prompt, generationType) {
  const tx = await contract.payWithUSDC(prompt, generationType);
  return await tx.wait();
}

// Listen for generation events
contract.on('GenerationRequested', (user, prompt, type, id) => {
  console.log(`Generation ${id} requested by ${user}`);
});
```

### API Integration

**Backend Event Handling**
```javascript
// Listen for payment events
const handlePaymentEvent = async (event) => {
  const { payer, token, amount, generationType } = event.args;
  
  // Trigger AI generation
  await processGeneration({
    user: payer,
    prompt: event.prompt,
    type: generationType,
    paymentTx: event.transactionHash
  });
};
```

**Frontend Integration**
```javascript
// React component for payment
const PaymentButton = ({ prompt, type }) => {
  const { writeContract } = useWriteContract();
  
  const handlePayment = () => {
    writeContract({
      address: PAYMENT_CONTRACT,
      abi: PaymentABI,
      functionName: 'payWithUSDC',
      args: [prompt, type]
    });
  };
  
  return <button onClick={handlePayment}>Pay with USDC</button>;
};
```

## Economic Model

### Token Economics

**Value Flow**
```
User Payment → Smart Contract → Automatic Distribution
    ↓               ↓                    ↓
Generation      Transparency      Stakeholder Rewards
```

**Deflationary Mechanics**
- **Burn Mechanism**: Potential future token burns from reserves
- **Staking Rewards**: Tokens locked in staking reduce circulating supply
- **Utility Demand**: Growing platform usage drives token demand
- **Network Effects**: More users = more value for all participants

### Revenue Sustainability

**Multiple Revenue Streams**
- **Generation Payments**: Primary revenue from AI content creation
- **Premium Features**: Advanced tools and priority processing
- **NFT Marketplace**: Trading fees on BanditKidz transactions
- **Partnership Revenue**: Integration fees from third parties

**Cost Management**
- **AI Model Costs**: Optimized through bulk contracts and efficiency
- **Infrastructure**: Scalable cloud architecture with usage-based pricing
- **Development**: Sustainable funding through revenue percentage
- **Community**: Self-sustaining through token incentives

## Compliance & Legal

### Regulatory Considerations

**Token Classification**
- **Utility Tokens**: S, wS tokens provide platform utility
- **Stablecoins**: USDC, EURC are regulated stablecoins
- **NFT Compliance**: BanditKidz NFTs follow NFT regulations
- **Platform Operations**: Comply with digital service regulations

**User Protection**
- **Transparent Pricing**: All costs clearly displayed
- **Refund Policy**: Clear terms for failed generations
- **Data Protection**: User privacy and data security
- **Dispute Resolution**: Fair process for payment disputes

### Terms of Service

**Payment Terms**
- **No Refunds**: Successful generations are final sales
- **Failed Generations**: Automatic refund or retry options
- **Service Availability**: 99.9% uptime target with compensation
- **Price Changes**: Advance notice of any pricing adjustments

**Smart Contract Risks**
- **Code Audits**: Regular security reviews and updates
- **Bug Bounties**: Incentives for security research
- **Insurance**: Platform insurance for major security events
- **User Education**: Clear explanation of blockchain risks

---

## Quick Reference

### Contract Addresses (Sonic Mainnet)
- **Payment Contract**: `0x...` (Deploy and update)
- **Staking Contract**: `0x...` (Deploy and update)  
- **Voting Contract**: `0x...` (Deploy and update)
- **BanditKidz NFT**: `0x6988c29f8c0051d261f288c2c497a592e2d1061f`
- **USDC Token**: `0x29219dd400f2Bf60E5a23d13Be72B486D4038894`
- **wS Token**: `0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38`

### Payment Costs
- **S/wS Tokens**: 3 tokens per generation
- **USDC/EURC**: 1 token per generation  
- **Credits**: 1 credit per generation
- **Free Tier**: 0 cost (limited daily usage)

### Distribution Split
- **Staking Rewards**: 25%
- **Contest Prizes**: 15%
- **Development**: 50%
- **Reserves**: 10%

---

*For technical support or integration assistance, join our Discord community or contact our development team directly.*