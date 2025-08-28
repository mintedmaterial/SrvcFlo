# INFT Agent System Documentation

## Overview

The ServiceFlow AI INFT (Intelligent NFT) system enables users to mint AI agents as NFTs that contain embedded intelligence, learning capabilities, and generation credits. Based on ERC-7857 standards, these INFTs represent a new paradigm where users own both the AI agent and all content it generates.

## System Architecture

### Hybrid INFT + ERC-1155 Model

Our implementation uses a dual-token system:

1. **INFT Packages** (ERC-721): Intelligent AI agents with embedded capabilities
2. **Generated Content** (ERC-1155): Individual pieces of generated content stored on IPFS

### Package Types

#### Starter AI Agent ($5 USD)
- **Credits**: 750 (≈3-4 images or 1-2 videos)
- **AI Models**: OpenAI GPT-4.1, DALL-E-3, Cloudflare AI Suite, Google Gemini Pro, Stable Diffusion
- **Collections**: Basic influence detection
- **System Prompt**: Creative content generation focused on images, text, and basic reasoning
- **Use Case**: Individual creators, hobbyists

#### Pro AI Agent ($50 USD) ⭐ Popular
- **Credits**: 8,000 (≈40 images or 16 videos)
- **AI Models**: OpenAI (GPT-4.1, GPT-5, DALL-E-3), Cloudflare Workers AI, Google Gemini Pro/Ultra, Video Generation Suite
- **Collections**: Bandit Kidz, other supported collections
- **System Prompt**: Advanced multi-modal generation with style awareness, reasoning, and multi-platform AI integration
- **Use Case**: Professional creators, small businesses

#### Business AI Agent ($500 USD)
- **Credits**: 100,000 (≈500 images or 200 videos)
- **AI Models**: Full Multi-Provider Suite (OpenAI, Cloudflare AI, Google Gemini Ultra), Custom Models, Video Gen
- **Collections**: Full collection influence library
- **System Prompt**: Business-focused with advanced reasoning, workflow automation, multi-provider redundancy, and batch processing
- **Use Case**: Marketing agencies, content businesses

#### Enterprise AI Agent ($1,250 USD)
- **Credits**: 260,000 (≈1,300 images or 520 videos)
- **AI Models**: Enterprise Multi-Cloud Suite (All OpenAI, Cloudflare, Google models + Custom fine-tuned models + API access)
- **Collections**: All collections + custom training + white-label options
- **System Prompt**: Unlimited capabilities with advanced reasoning, custom model training, multi-provider failover, and enterprise features
- **Use Case**: Large enterprises, SaaS providers

## Credit System

### Generation Costs
- **Images**: 200 credits each
- **Videos**: 500 credits each

### Credit Calculation Examples
- Starter (750 credits): 3 images OR 1 video + extras
- Pro (8,000 credits): 40 images OR 16 videos OR mixed usage
- Business (100,000 credits): 500 images OR 200 videos
- Enterprise (260,000 credits): 1,300 images OR 520 videos

## Payment Methods

### Supported Tokens (Sonic Labs Chain ID 146)

#### Native S Token ✅ Available Now
- Dynamic pricing based on USD value
- Current rate: ~$0.31 per S token
- Automatic price adjustment via oracle
- Instant minting upon payment

#### USDC 🔄 Coming Soon for INFTs
- Currently available for credit purchases only
- INFT minting with USDC in development
- Fixed $1:1 USD rate

#### Wrapped S (wS)
- Available for both credits and INFTs
- Same pricing as Native S
- Requires ERC-20 approval

## Smart Contracts

### SrvcfloINFTPackages.sol
**Primary INFT contract handling agent minting and management**

Key Functions:
- `purchasePackageWithNativeS()`: Mint INFT with Native S
- `purchasePackageWithUSDC()`: Mint INFT with USDC
- `generateContent()`: Use agent to create content
- `createSubscription()`: Enable AIaaS model

### SrvcfloGeneratedNFT.sol
**ERC-1155 contract for generated content**

Key Functions:
- `mintGeneration()`: Create new generated content NFT
- `updateIPFSHash()`: Update content with IPFS storage
- `getGenerationInfo()`: Retrieve generation metadata

### SrvcfloMarketplace.sol
**Dual marketplace for both INFTs and generated content**

Key Functions:
- `listINFTPackage()`: List AI agent for sale
- `listGeneratedContent()`: List generated art for sale
- `createAuction()`: Start auction for either type

## Revenue Distribution

All payments are automatically distributed:
- **25%** → NFT Staking Rewards
- **50%** → Development Wallet (AI costs & overhead)
- **15%** → Leaderboard Winners
- **10%** → Treasury (contract balance)

## Multi-Provider AI Architecture

### Supported AI Providers
Our INFT agents leverage multiple AI providers for maximum capability and reliability:

#### OpenAI Integration
- **GPT-4.1**: Advanced text generation and reasoning
- **GPT-5**: Next-generation language model (when available)
- **DALL-E-3**: High-quality image generation
- **API Access**: Direct OpenAI API for enterprise users

#### Cloudflare Workers AI
- **Text Models**: Llama 2, CodeLlama, Mistral
- **Image Generation**: Stable Diffusion variants
- **Video Generation**: Stable Video Diffusion
- **Edge Deployment**: Low-latency processing

#### Google Gemini
- **Gemini Pro**: Multimodal reasoning and generation
- **Gemini Ultra**: Advanced capabilities for enterprise
- **Vision API**: Image understanding and analysis
- **Vertex AI**: Custom model training

### Provider Selection Logic
Agents automatically select the best provider based on:
- **Task Type**: Text, image, video, reasoning
- **Package Tier**: Available models per tier
- **Performance**: Speed and quality requirements
- **Failover**: Backup providers for reliability
- **Cost Optimization**: Most efficient provider per task

## AI Agent Features

### Learning & Evolution
- Agents learn from user interactions across all providers
- Style preferences are saved and transferred between models
- Collection influence detection improves over time
- Usage patterns inform future generations and provider selection

### Collection Influence System
Supported collections for style influence:
- **Bandit Kidz**: Street art, rebellious themes
- **Derps**: Cartoon, playful aesthetics  
- **Sonic**: Tech, speed, futuristic themes
- **Custom**: Enterprise-level custom training

### AIaaS (AI-as-a-Service)
Package owners can:
- Create subscriptions for other users
- Set usage limits and duration
- Earn revenue from agent usage
- Maintain ownership of generated content

## User Flow

### 1. Purchase INFT Package
1. Visit `/credits` page
2. Toggle to "Mint INFT Agent"
3. Select package tier
4. Choose Native S payment
5. Connect wallet & confirm transaction
6. Receive INFT with embedded AI agent

### 2. Generate Content
1. Access agent through dashboard
2. Input prompt with optional collection influence
3. Agent consumes credits (200 for images, 500 for videos)
4. Generated content minted as ERC-1155 to user's wallet
5. Agent metadata updated with learning data

### 3. Trade & Monetize
1. List INFT agent on marketplace
2. Set price for trained agent with remaining credits
3. Or list individual generated content pieces
4. Enable AIaaS subscriptions for recurring revenue

## Technical Integration

### Frontend Integration
```typescript
// Example INFT purchase
const purchaseINFT = async (packageType: number) => {
  const contract = new ethers.Contract(INFT_ADDRESS, INFT_ABI, signer)
  const tx = await contract.purchasePackageWithNativeS(packageType, {
    value: ethers.utils.parseEther(nativeSAmount)
  })
  return tx.wait()
}
```

### Backend Integration
```javascript
// Example generation processing
app.post('/api/generate', async (req, res) => {
  const { packageTokenId, prompt, isVideo } = req.body
  
  // Verify credits available
  const package = await inftContract.getPackageInfo(packageTokenId)
  const creditCost = isVideo ? 500 : 200
  
  if (package.remainingCredits >= creditCost) {
    // Process generation
    const result = await generateContent(prompt, isVideo)
    
    // Mint ERC-1155 with result
    const tokenId = await generatedNFT.mintGeneration(
      packageOwner,
      prompt,
      result.ipfsHash,
      detectedCollection,
      isVideo,
      packageTokenId
    )
    
    res.json({ success: true, tokenId, ipfsHash: result.ipfsHash })
  }
})
```

## Future Roadmap

### Phase 1: Core Launch ✅
- INFT minting with Native S
- Basic AI generation
- ERC-1155 content creation
- Marketplace integration

### Phase 2: Enhanced Features 🔄
- USDC support for INFTs
- Advanced collection training
- Improved learning algorithms
- Mobile app integration

### Phase 3: Enterprise 📋
- Custom model training
- API access for developers
- White-label solutions
- Advanced analytics

### Phase 4: Ecosystem 🚀
- Cross-chain deployment
- Community governance
- Agent collaboration features
- Metaverse integration

## Support & Resources

- **Smart Contracts**: `/Contracts/` directory
- **Frontend Components**: `/components/credit-widget.tsx`
- **API Endpoints**: `/app/api/` directory
- **Documentation**: `/docs/` directory

For technical support, contact: security@srvcflo.com