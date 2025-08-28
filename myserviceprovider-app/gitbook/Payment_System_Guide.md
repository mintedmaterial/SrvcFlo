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

**FLOAI Token (ERC-20)**
- **Cost**: Variable based on agent type and complexity
- **Quality**: Premium
- **Benefits**: Primary utility token for agent operations
- **Use Cases**: Agent minting, usage fees, ecosystem governance

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

### Main Payment Splitter Contract

**SonicAIGenerationPayment Contract**
- **Network**: Sonic Mainnet (Chain ID: 146)
- **Purpose**: Handles all generation payments and distributions
- **Security**: Audited and battle-tested
- **Upgradability**: Proxy pattern for future improvements

**Key Functions:**
```solidity
// Pay with S tokens
function payWithS(string prompt, string generationType)

// Pay with USDC  
function payWithUSDC(string prompt, string generationType)

// Pay with FLOAI tokens
function payWithFLOAI(string prompt, string generationType, uint256 amount)

// Use credits for generation
function useCredits(string prompt, string generationType)

// Admin: Add credits to user account
function addCredits(address user, uint256 amount)
```

### Payment Distribution Logic

When a user pays for generation, funds are automatically distributed:

```
Total Payment (100%)
├── Development/App: 50%
├── BanditKidz Staking: 25%
├── Contest Prizes: 15%
└── Treasury/Reserves: 10%
```

**Distribution Details:**

**50% to Development/App (Immediate)**
- Infrastructure and operational costs (AI API costs, hosting)
- Server maintenance and platform scaling
- Development team compensation
- Platform operations and growth
- *Note: Portion of these tokens will be re-staked or returned to public pools for ecosystem growth*

**25% to BanditKidz Staking (Immediate)**
- Funds sent directly to staking contract
- Pro-rata allocation to all staked NFT holders
- Monthly distributions to stakeholders
- Supports long-term holder rewards and ecosystem participation

**15% to Contest Prizes (Weekly/Monthly)**
- Community engagement rewards
- Top contributors and active participants
- Quality content creation incentives
- Leaderboard and competition rewards

**10% to Treasury/Reserves (Accumulating)**
- Platform governance reserves
- Emergency fund for stability
- Future feature development
- Community initiatives and partnerships

## FLOAI Token Economics

### Token Utility

**Primary Use Cases:**
- **Agent Minting**: Cost to create new iNFT agents
- **Agent Usage**: Pay for agent operations and generations
- **Staking Rewards**: Earn FLOAI through NFT staking
- **Governance**: Vote on platform decisions and upgrades

### Token Distribution

**Agent Costs:**
- **Image Generation Agent**: 50 FLOAI per generation
- **Video Generation Agent**: 100 FLOAI per generation  
- **NFT Analyst Agent**: 30 FLOAI per analysis
- **Sonic Ecosystem Agent**: 40 FLOAI per report
- **Coordinator Agent**: Variable based on complexity

### Agent Owner Revenue

**5% Revenue Share**
- Agent owners earn 5% of all usage fees from their agents
- Passive income from agent utilization
- Encourages high-quality agent creation
- Scales with agent popularity and usage

## Transaction Flow

### Standard Generation Payment

1. **User Initiates Payment**
   - Selects payment method (S, USDC, FLOAI, Credits)
   - Enters prompt and generation parameters
   - Wallet shows transaction preview with gas estimates
   - User confirms transaction in wallet

2. **Smart Contract Processing**
   - Validates user has sufficient balance
   - Transfers tokens from user to payment splitter
   - Executes automatic distribution logic
   - Emits events for tracking and processing

3. **Distribution Execution**
   - 5% each to: App/Ops, Staking, Leaderboard, Treasury, Team
   - 75% held for monthly rewards pool distribution
   - All transfers executed atomically
   - Event logs for transparency

4. **Generation Trigger**
   - Contract emits `GenerationRequested` event
   - Backend services pick up event
   - AI generation process begins
   - Results stored and linked to payment

5. **Community Integration**
   - Generation automatically submitted to thread
   - Voting contract records generation details
   - User earns leaderboard eligibility
   - Available for community voting and rewards

## Contract Addresses

### Sonic Mainnet (Chain ID: 146)
```javascript
// V2 Deployed Contracts ✅
SONIC_PAYMENT_CONTRACT = "0x09575A8046048816317C41f9Cf37267E8486bb9b"
SONIC_CREDITS_NFT_CONTRACT = "0x6B57563377181967C468002Cb11566c561f8DAc6"
SONIC_STAKING_CONTRACT = "0x103ce561d5137f137c9A86670812287B1B258499"

// Token Contracts
USDC_CONTRACT = "0x29219dd400f2Bf60E5a23d13Be72B486D4038894"
WRAPPED_SONIC_CONTRACT = "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38"
BANDIT_KIDZ_NFT = "0x6988c29f8c0051d261f288c2c497a592e2d1061f"

// INFT System Contracts (To Be Deployed)
INFT_PACKAGES_CONTRACT = "0x..." // Agent factory contract
GENERATED_NFT_CONTRACT = "0x..." // ERC-1155 for outputs
MARKETPLACE_CONTRACT = "0x..."   // Agent trading
```

### Testnet (Chain ID: 57054)
```javascript
SONIC_PAYMENT_CONTRACT_TESTNET = "0x08388768EEd51B2693D30AC1071D4AB558220eDE"
BANDIT_KIDZ_STAKING_CONTRACT_TESTNET = "0x93d00036b8040005B4AF73b3A404F8bec4fD6B87"
VOTING_CONTRACT_TESTNET = "0x8D202946A136319B27340F61692db2bF5E69f273"
```

## Integration Examples

### Smart Contract Integration

**Basic Payment Example**
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

// Pay with FLOAI tokens
async function payWithFLOAI(prompt, generationType, amount) {
  const tx = await contract.payWithFLOAI(prompt, generationType, amount);
  return await tx.wait();
}

// Listen for generation events
contract.on('GenerationRequested', (user, prompt, type, id) => {
  console.log(`Generation ${id} requested by ${user}`);
});
```

### Frontend Integration

**React Payment Component**
```javascript
import { useWriteContract, useAccount } from 'wagmi';

const PaymentButton = ({ prompt, type, amount }) => {
  const { writeContract } = useWriteContract();
  const { address } = useAccount();
  
  const handleFLOAIPayment = () => {
    writeContract({
      address: PAYMENT_CONTRACT,
      abi: PaymentABI,
      functionName: 'payWithFLOAI',
      args: [prompt, type, amount]
    });
  };
  
  return (
    <div>
      <button onClick={handleFLOAIPayment}>
        Pay {amount} FLOAI
      </button>
    </div>
  );
};
```

## Quick Reference

### Payment Costs
- **S/wS Tokens**: 3 tokens per generation
- **USDC**: 1 token per generation  
- **FLOAI**: Variable by agent type (30-100 FLOAI)
- **Credits**: 1 credit per generation
- **Free Tier**: Limited daily usage

### Distribution Split
- **Development/App**: 50%
- **BanditKidz Staking**: 25%
- **Contest Prizes**: 15%
- **Treasury/Reserves**: 10%

### Gas Costs (Sonic Network)
- **Payment Transaction**: ~50,000 gas (~$0.01)
- **NFT Staking**: ~75,000 gas per NFT (~$0.015)
- **Agent Minting**: ~150,000 gas (~$0.03)
- **Voting**: ~45,000 gas (~$0.009)

---

*For technical support or integration assistance, join our Discord community or contact our development team directly.*