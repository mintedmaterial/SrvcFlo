# ServiceFlow AI iNFT Integration Guide (Comprehensive Cloudflare Edition)

## Overview

This comprehensive guide details the implementation of ServiceFlow AI's iNFT ecosystem on Sonic blockchain, leveraging Cloudflare's developer platform and integrating insights from 0g-agent-nft (ERC-7857) and EAI-721 standards. This updated version includes FLOAI token economics, Auth0 authentication, multiple product lines, and visual design specifications.

### ServiceFlow AI iNFT Ecosystem Components

1. **FLOAI Token (ERC-20)**: Utility token for agent operations (1B total supply)
2. **iNFT Agents (ERC-721)**: Smart NFT agents with embedded AI capabilities
3. **Agent Factory Contract**: Mint iNFT agents (50 S tokens per mint)
4. **NFT Marketplace**: Trade iNFT agents with performance metrics
5. **Revenue Distribution**: Automated splitting through smart contracts
6. **Multi-Product Platform**: Image/Video, Social, NFT Watcher, Token Analyst agents

### Technology Stack Integration

- **Sonic Blockchain**: EVM-compatible L1 with 90% fee returns and S token staking
- **Cloudflare Services**: R2 (storage), KV (metadata), D1 (analytics), Workers (compute)
- **Auth0**: Secure authentication with Web3 wallet integration
- **Multi-AI Providers**: OpenAI, Gemini, Groq with intelligent fallback
- **Visual Design**: Sonic blue + Matrix green with interactive particle effects

### Key Innovations from Repository Analysis

**From 0g-agent-nft (ERC-7857)**:
- Privacy-preserving metadata transfer with encryption
- Oracle-based verification for secure ownership changes
- Clone and authorize usage functions for agent sharing

**From EAI-721 (Eternal AI)**:
- Modular agent architecture (Identity, Intelligence, Monetization, Tokenization)
- On-chain code storage and versioning
- Subscription-based agent access model

### FLOAI Token Economics

**Total Supply**: 1,000,000,000 FLOAI tokens
**Distribution Strategy**:
- Builder/Development: 400M FLOAI (40%)
- Bandit Kidz Holders: 200M FLOAI (20%) - Proportional airdrop
- Other NFT Collections: 50M FLOAI (5%) - Top 30 holders (3-5 collections)
- Public Ecosystem: 250M FLOAI (25%)
- Development Team: 40M FLOAI (4%) - Split across 4 wallets
- Liquidity/DEX: 60M FLOAI (6%)

**Token Utility**:
- Basic AI Operations: 1-3 FLOAI per generation
- Advanced Models: 5-15 FLOAI (cost-based pricing)
- Agent Minting: 50 S tokens (separate from FLOAI)
- Agent Usage: FLOAI consumed per command/generation

## Prerequisites

### Environment Setup
- Node.js v18+ and npm/yarn
- Hardhat: `npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox`
- Wrangler CLI: `npm install -g wrangler` for Cloudflare deployments
- OpenZeppelin contracts: `npm install @openzeppelin/contracts`
- Cloudflare Account with R2 subscription enabled
- TypeScript configs for type safety

### API Keys and Wallets
- Cloudflare API Token with permissions for Workers, R2, KV, D1
- Sonic Labs RPC endpoint
- AI Provider APIs (OpenAI, Gemini, Groq)
- Auth0 credentials for authentication
- Web3 wallet for contract deployment

### Project Structure
```
ServiceApp/
├── contracts/              # Solidity smart contracts
├── workers/                # Cloudflare Workers scripts
├── src/config.ts          # Configuration management
├── docs/                  # Documentation
├── app/                   # Frontend application
├── agent-ui/              # Agent builder interface
└── myserviceprovider-app/ # Main SaaS platform
```

## Step 1: Smart Contract Development

### 1.1 FLOAI ERC-20 Token Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract FLOAIToken is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1B tokens
    
    // Distribution addresses
    address public constant BUILDER_WALLET = 0x...; // 40%
    address public constant BANDIT_KIDZ_STAKING = 0x...; // 20%
    address public constant PUBLIC_DISTRIBUTION = 0x...; // 25%
    address public constant LIQUIDITY_POOL = 0x...; // 6%
    
    // Development team wallets (1% each)
    address[4] public devWallets;
    
    constructor() ERC20("ServiceFlow AI", "FLOAI") {
        // Distribute initial supply
        _mint(BUILDER_WALLET, (TOTAL_SUPPLY * 40) / 100);
        _mint(BANDIT_KIDZ_STAKING, (TOTAL_SUPPLY * 20) / 100);
        _mint(PUBLIC_DISTRIBUTION, (TOTAL_SUPPLY * 25) / 100);
        _mint(LIQUIDITY_POOL, (TOTAL_SUPPLY * 6) / 100);
        
        // Mint to dev wallets (1% each)
        for (uint i = 0; i < 4; i++) {
            _mint(devWallets[i], (TOTAL_SUPPLY * 1) / 100);
        }
        
        // Remaining 5% for other NFT collections (handled separately)
        _mint(address(this), (TOTAL_SUPPLY * 5) / 100);
    }
    
    function airdropToCollection(address[] memory holders, uint256[] memory amounts) 
        external onlyOwner nonReentrant {
        require(holders.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < holders.length; i++) {
            _transfer(address(this), holders[i], amounts[i]);
        }
    }
}
```

### 1.2 iNFT Agent Factory Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract ServiceFlowAgentFactory is ERC721, Ownable, ReentrancyGuard {
    struct AgentConfig {
        string name;
        string agentType; // "image", "video", "social", "nft_watcher", "token_analyst"
        string instructions;
        string[] tools;
        string[] connections;
        uint256 floaiPerOperation;
        address creator;
        bool isActive;
        uint256 generationCount;
        uint256 totalRevenue;
    }
    
    struct AgentMetadata {
        string metadataURI; // R2 URI for encrypted metadata
        bytes32 metadataHash; // Hash commitment
        uint256 lastUpdated;
    }
    
    mapping(uint256 => AgentConfig) public agentConfigs;
    mapping(uint256 => AgentMetadata) public agentMetadata;
    mapping(uint256 => address) public agentGeneratedCollections; // tokenId => ERC721 collection
    
    uint256 public constant MINT_COST = 50 * 10**18; // 50 S tokens
    uint256 private _currentTokenId = 1;
    
    // Revenue distribution for minting fees
    address public constant BANDIT_KIDZ_TREASURY = 0x...; // 75%
    address public constant DEV_TREASURY = 0x...; // 25%
    
    event AgentMinted(uint256 indexed tokenId, address indexed creator, string agentType);
    event AgentConfigUpdated(uint256 indexed tokenId, string metadataURI);
    event AgentUsed(uint256 indexed tokenId, uint256 floaiConsumed);
    event RevenueGenerated(uint256 indexed tokenId, uint256 amount);
    
    constructor() ERC721("ServiceFlow iNFT Agents", "SFAI") {}
    
    function mintAgent(
        string memory name,
        string memory agentType,
        string memory instructions,
        string[] memory tools,
        string[] memory connections,
        uint256 floaiPerOp,
        string memory metadataURI,
        bytes32 metadataHash
    ) external payable nonReentrant {
        require(msg.value >= MINT_COST, "Insufficient payment");
        require(bytes(name).length > 0, "Name required");
        require(bytes(agentType).length > 0, "Agent type required");
        
        uint256 tokenId = _currentTokenId++;
        _safeMint(msg.sender, tokenId);
        
        agentConfigs[tokenId] = AgentConfig({
            name: name,
            agentType: agentType,
            instructions: instructions,
            tools: tools,
            connections: connections,
            floaiPerOperation: floaiPerOp,
            creator: msg.sender,
            isActive: true,
            generationCount: 0,
            totalRevenue: 0
        });
        
        agentMetadata[tokenId] = AgentMetadata({
            metadataURI: metadataURI,
            metadataHash: metadataHash,
            lastUpdated: block.timestamp
        });
        
        // Distribute minting fees
        _distributeMintingFees();
        
        emit AgentMinted(tokenId, msg.sender, agentType);
    }
    
    function _distributeMintingFees() internal {
        uint256 banditKidzShare = (msg.value * 75) / 100;
        uint256 devShare = msg.value - banditKidzShare;
        
        payable(BANDIT_KIDZ_TREASURY).transfer(banditKidzShare);
        payable(DEV_TREASURY).transfer(devShare);
    }
    
    function updateAgentMetadata(
        uint256 tokenId, 
        string memory newMetadataURI,
        bytes32 newMetadataHash
    ) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        
        agentMetadata[tokenId].metadataURI = newMetadataURI;
        agentMetadata[tokenId].metadataHash = newMetadataHash;
        agentMetadata[tokenId].lastUpdated = block.timestamp;
        
        emit AgentConfigUpdated(tokenId, newMetadataURI);
    }
    
    function recordAgentUsage(uint256 tokenId, uint256 floaiConsumed) external onlyOwner {
        agentConfigs[tokenId].generationCount++;
        emit AgentUsed(tokenId, floaiConsumed);
    }
    
    function recordRevenue(uint256 tokenId, uint256 amount) external onlyOwner {
        agentConfigs[tokenId].totalRevenue += amount;
        emit RevenueGenerated(tokenId, amount);
    }
    
    function getAgentConfig(uint256 tokenId) external view returns (AgentConfig memory) {
        return agentConfigs[tokenId];
    }
    
    function getAgentMetadata(uint256 tokenId) external view returns (AgentMetadata memory) {
        return agentMetadata[tokenId];
    }
}
```

### 1.3 NFT Marketplace Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";

contract ServiceFlowMarketplace is ReentrancyGuard, Ownable {
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
        string description;
        uint256 listedAt;
    }
    
    struct Auction {
        uint256 tokenId;
        address seller;
        uint256 startingBid;
        uint256 currentBid;
        address currentBidder;
        uint256 endTime;
        bool isActive;
    }
    
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Auction) public auctions;
    
    address public agentFactory;
    uint256 public platformFee = 250; // 2.5%
    address public feeRecipient;
    
    event AgentListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event AgentSold(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event AuctionCreated(uint256 indexed tokenId, address indexed seller, uint256 startingBid);
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    
    constructor(address _agentFactory) {
        agentFactory = _agentFactory;
        feeRecipient = msg.sender;
    }
    
    function listAgent(
        uint256 tokenId, 
        uint256 price, 
        string memory description
    ) external nonReentrant {
        require(IERC721(agentFactory).ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Price must be greater than 0");
        require(!listings[tokenId].isActive, "Already listed");
        
        IERC721(agentFactory).transferFrom(msg.sender, address(this), tokenId);
        
        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            isActive: true,
            description: description,
            listedAt: block.timestamp
        });
        
        emit AgentListed(tokenId, msg.sender, price);
    }
    
    function buyAgent(uint256 tokenId) external payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        
        // Calculate fees
        uint256 fee = (price * platformFee) / 10000;
        uint256 sellerAmount = price - fee;
        
        // Mark as sold
        listing.isActive = false;
        
        // Transfer NFT to buyer
        IERC721(agentFactory).transferFrom(address(this), msg.sender, tokenId);
        
        // Transfer payments
        payable(seller).transfer(sellerAmount);
        payable(feeRecipient).transfer(fee);
        
        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        emit AgentSold(tokenId, msg.sender, price);
    }
    
    function cancelListing(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.seller == msg.sender, "Not seller");
        require(listing.isActive, "Not active");
        
        listing.isActive = false;
        IERC721(agentFactory).transferFrom(address(this), msg.sender, tokenId);
    }
}
```

## Step 2: Cloudflare Infrastructure Setup

### 2.1 Create Cloudflare Resources

```bash
# Create R2 bucket for metadata and generated content
wrangler r2 bucket create srvcflo-metadata
wrangler r2 bucket create srvcflo-generated-content

# Create KV namespace for fast lookups
wrangler kv namespace create srvcflo-agents
wrangler kv namespace create srvcflo-auth

# Create D1 database for analytics
wrangler d1 create srvcflo-analytics
```

### 2.2 Configure wrangler.toml

```toml
name = "serviceflow-inft-handler"
main = "workers/inft-handler.js"
compatibility_date = "2024-01-15"

[env.production]
vars = { ENVIRONMENT = "production" }

[[env.production.r2_buckets]]
binding = "METADATA_BUCKET"
bucket_name = "srvcflo-metadata"

[[env.production.r2_buckets]]
binding = "CONTENT_BUCKET"
bucket_name = "srvcflo-generated-content"

[[env.production.kv_namespaces]]
binding = "AGENT_KV"
id = "your-kv-namespace-id"

[[env.production.d1_databases]]
binding = "ANALYTICS_DB"
database_name = "srvcflo-analytics"
database_id = "your-d1-database-id"

[env.production.vars]
AUTH0_DOMAIN = "dev-ql0bu7bgj5ftpnbg.us.auth0.com"
AUTH0_CLIENT_ID = "LEBcd3cDK4BKSBQi5zQb7qAyYRfPohxk"
SONIC_RPC_URL = "https://rpc.soniclabs.com"
OPENAI_API_KEY = "your-openai-key"
GEMINI_API_KEY = "your-gemini-key"
GROQ_API_KEY = "your-groq-key"
```

### 2.3 iNFT Handler Worker

```javascript
// workers/inft-handler.js
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    
    // CORS handling
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      let response;
      
      switch (pathname) {
        case '/api/mint-agent':
          response = await handleMintAgent(request, env);
          break;
        case '/api/generate-content':
          response = await handleGenerateContent(request, env);
          break;
        case '/api/transfer-agent':
          response = await handleTransferAgent(request, env);
          break;
        case '/api/auth/token':
          response = await handleAuth0Token(request, env);
          break;
        default:
          response = new Response('Not Found', { status: 404 });
      }
      
      // Add CORS headers to response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};

async function handleMintAgent(request, env) {
  const data = await request.json();
  const { agentConfig, ownerAddress, signature } = data;
  
  // Verify signature and ownership
  const isValidSignature = await verifySignature(agentConfig, signature, ownerAddress);
  if (!isValidSignature) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
  }
  
  // Generate encryption key for this agent
  const encryptionKey = randomBytes(32);
  const iv = randomBytes(16);
  
  // Encrypt agent configuration
  const cipher = createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encrypted = cipher.update(JSON.stringify(agentConfig), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Create metadata hash
  const metadataHash = createHash('sha256').update(encrypted).digest('hex');
  
  // Store encrypted metadata in R2
  const metadataKey = `agents/${Date.now()}-${metadataHash}`;
  await env.METADATA_BUCKET.put(metadataKey, encrypted);
  
  // Store encryption key and metadata mapping in KV
  await env.AGENT_KV.put(`key:${metadataHash}`, encryptionKey.toString('hex'));
  await env.AGENT_KV.put(`metadata:${metadataHash}`, metadataKey);
  
  const metadataURI = `https://r2.srvcflo.com/metadata/${metadataKey}`;
  
  return new Response(JSON.stringify({
    success: true,
    metadataURI,
    metadataHash: `0x${metadataHash}`,
    encryptionKey: encryptionKey.toString('hex')
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleGenerateContent(request, env) {
  const data = await request.json();
  const { tokenId, prompt, agentType, floaiAmount } = data;
  
  // Get agent configuration
  const agentConfig = await getAgentConfig(tokenId, env);
  if (!agentConfig) {
    return new Response(JSON.stringify({ error: 'Agent not found' }), { status: 404 });
  }
  
  // Check FLOAI balance (simplified - in production, verify on-chain)
  const userBalance = await env.AGENT_KV.get(`floai:${data.userAddress}`);
  if (!userBalance || parseInt(userBalance) < floaiAmount) {
    return new Response(JSON.stringify({ error: 'Insufficient FLOAI balance' }), { status: 402 });
  }
  
  // Generate content based on agent type
  let generatedContent;
  
  switch (agentType) {
    case 'image':
      generatedContent = await generateImage(prompt, agentConfig, env);
      break;
    case 'video':
      generatedContent = await generateVideo(prompt, agentConfig, env);
      break;
    case 'social':
      generatedContent = await generateSocialPost(prompt, agentConfig, env);
      break;
    default:
      return new Response(JSON.stringify({ error: 'Unsupported agent type' }), { status: 400 });
  }
  
  // Store generated content in R2
  const contentKey = `generated/${tokenId}/${Date.now()}`;
  await env.CONTENT_BUCKET.put(contentKey, generatedContent.data);
  
  // Update usage statistics
  await updateAgentUsage(tokenId, floaiAmount, env);
  
  return new Response(JSON.stringify({
    success: true,
    contentURI: `https://r2.srvcflo.com/content/${contentKey}`,
    generatedContent: generatedContent.metadata
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function generateImage(prompt, agentConfig, env) {
  // Multi-provider fallback system
  const providers = ['openai', 'gemini', 'groq'];
  
  for (const provider of providers) {
    try {
      switch (provider) {
        case 'openai':
          return await generateWithOpenAI(prompt, agentConfig, env);
        case 'gemini':
          return await generateWithGemini(prompt, agentConfig, env);
        case 'groq':
          return await generateWithGroq(prompt, agentConfig, env);
      }
    } catch (error) {
      console.warn(`${provider} failed:`, error.message);
      continue;
    }
  }
  
  throw new Error('All AI providers failed');
}

async function handleAuth0Token(request, env) {
  const data = await request.json();
  
  const tokenResponse = await fetch(`https://${env.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.AUTH0_CLIENT_ID,
      client_secret: env.AUTH0_CLIENT_SECRET,
      audience: `https://${env.AUTH0_DOMAIN}/api/v2/`,
      grant_type: 'client_credentials'
    })
  });
  
  const tokenData = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    return new Response(JSON.stringify({ error: 'Auth0 token request failed' }), { 
      status: 401 
    });
  }
  
  return new Response(JSON.stringify(tokenData), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Utility functions
async function verifySignature(message, signature, address) {
  // Implement signature verification logic
  // This would use Web3 libraries to verify the signature
  return true; // Simplified for example
}

async function getAgentConfig(tokenId, env) {
  const configData = await env.AGENT_KV.get(`config:${tokenId}`);
  return configData ? JSON.parse(configData) : null;
}

async function updateAgentUsage(tokenId, floaiAmount, env) {
  const currentUsage = await env.AGENT_KV.get(`usage:${tokenId}`) || '0';
  const newUsage = parseInt(currentUsage) + floaiAmount;
  await env.AGENT_KV.put(`usage:${tokenId}`, newUsage.toString());
  
  // Log to D1 for analytics
  await env.ANALYTICS_DB.prepare(
    'INSERT INTO agent_usage (token_id, floai_consumed, timestamp) VALUES (?, ?, ?)'
  ).bind(tokenId, floaiAmount, new Date().toISOString()).run();
}
```

## Step 3: Frontend Integration

### 3.1 Auth0 Integration

```typescript
// lib/auth0-config.ts
import { WebAuth } from 'auth0-js';

export const auth0Config = {
  domain: 'dev-ql0bu7bgj5ftpnbg.us.auth0.com',
  clientID: 'LEBcd3cDK4BKSBQi5zQb7qAyYRfPohxk',
  redirectUri: `${window.location.origin}/callback`,
  responseType: 'token id_token',
  scope: 'openid profile email'
};

export const webAuth = new WebAuth(auth0Config);

// Auth0 token management
export async function getAuth0ManagementToken() {
  const response = await fetch('/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get Auth0 token');
  }
  
  const data = await response.json();
  return data.access_token;
}
```

### 3.2 Web3 Integration with Sonic

```typescript
// lib/web3-config.ts
import { createConfig, http } from 'wagmi';
import { sonic } from 'wagmi/chains'; // Assuming Sonic chain is supported

export const wagmiConfig = createConfig({
  chains: [sonic],
  transports: {
    [sonic.id]: http('https://rpc.soniclabs.com')
  }
});

// Contract addresses
export const CONTRACT_ADDRESSES = {
  FLOAI_TOKEN: '0x...', // Deploy and update
  AGENT_FACTORY: '0x...', // Deploy and update
  MARKETPLACE: '0x...', // Deploy and update
  PAYMENT_PROCESSOR: '0x...' // Deploy and update
};
```

### 3.3 Agent Minting Component

```tsx
// components/AgentMinter.tsx
import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/web3-config';

interface AgentConfig {
  name: string;
  agentType: 'image' | 'video' | 'social' | 'nft_watcher' | 'token_analyst';
  instructions: string;
  tools: string[];
  connections: string[];
  floaiPerOperation: number;
}

export function AgentMinter() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    agentType: 'image',
    instructions: '',
    tools: [],
    connections: [],
    floaiPerOperation: 3
  });
  
  const mintAgent = async () => {
    try {
      // First, upload encrypted metadata to Cloudflare
      const metadataResponse = await fetch('/api/mint-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentConfig: config,
          ownerAddress: address,
          signature: 'user-signature' // Implement proper signing
        })
      });
      
      const { metadataURI, metadataHash } = await metadataResponse.json();
      
      // Then, mint the NFT on-chain
      await writeContract({
        address: CONTRACT_ADDRESSES.AGENT_FACTORY as `0x${string}`,
        abi: agentFactoryAbi,
        functionName: 'mintAgent',
        args: [
          config.name,
          config.agentType,
          config.instructions,
          config.tools,
          config.connections,
          config.floaiPerOperation,
          metadataURI,
          metadataHash
        ],
        value: BigInt(50 * 10**18) // 50 S tokens
      });
    } catch (error) {
      console.error('Minting failed:', error);
    }
  };
  
  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-900 to-black rounded-xl border border-green-500/20">
      <h2 className="text-2xl font-bold text-green-400">Create iNFT Agent</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Agent Name"
          value={config.name}
          onChange={(e) => setConfig({ ...config, name: e.target.value })}
          className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
        />
        
        <select
          value={config.agentType}
          onChange={(e) => setConfig({ ...config, agentType: e.target.value as any })}
          className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
        >
          <option value="image">Image Generation</option>
          <option value="video">Video Generation</option>
          <option value="social">Social Media</option>
          <option value="nft_watcher">NFT Watcher</option>
          <option value="token_analyst">Token Analyst</option>
        </select>
      </div>
      
      <textarea
        placeholder="Agent Instructions"
        value={config.instructions}
        onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
        rows={4}
      />
      
      <button
        onClick={mintAgent}
        className="w-full bg-gradient-to-r from-blue-600 to-green-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all"
      >
        Mint Agent (50 S tokens)
      </button>
    </div>
  );
}
```

## Step 4: Visual Design Implementation

### 4.1 Matrix Background Component

```tsx
// components/MatrixBackground.tsx
import { useEffect, useRef } from 'react';

export function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charArray = chars.split('');
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = Array(Math.floor(columns)).fill(0);
    
    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ff41';
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        const char = charArray[Math.floor(Math.random() * charArray.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }
    
    const interval = setInterval(draw, 33);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-20"
    />
  );
}
```

### 4.2 Sonic-styled Components

```tsx
// components/SonicButton.tsx
interface SonicButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'matrix';
  onClick?: () => void;
  disabled?: boolean;
}

export function SonicButton({ 
  children, 
  variant = 'primary', 
  onClick, 
  disabled 
}: SonicButtonProps) {
  const baseClasses = "px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg hover:shadow-blue-500/25",
    secondary: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-lg hover:shadow-orange-500/25",
    matrix: "bg-transparent border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-black shadow-lg hover:shadow-green-500/25"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

## Step 5: Additional Products Implementation

### 5.1 Social Agent Integration

```typescript
// lib/social-agent.ts
interface TwitterCredentials {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export class SocialAgent {
  constructor(
    private tokenId: number,
    private credentials: TwitterCredentials,
    private floaiBalance: number
  ) {}
  
  async generateAndPost(prompt: string, style: string = 'professional') {
    // Generate content using AI
    const content = await fetch('/api/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenId: this.tokenId,
        prompt,
        agentType: 'social',
        floaiAmount: 3,
        style
      })
    });
    
    const { generatedContent } = await content.json();
    
    // Post to Twitter
    const tweetResponse = await fetch('/api/social/tweet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: generatedContent.text,
        credentials: this.credentials
      })
    });
    
    return await tweetResponse.json();
  }
}
```

### 5.2 NFT Watcher Implementation

```typescript
// lib/nft-watcher.ts
export class NFTWatcher {
  constructor(
    private tokenId: number,
    private collections: string[],
    private parameters: WatcherConfig
  ) {}
  
  async monitorCollections() {
    for (const collection of this.collections) {
      const listings = await this.getPaintswapListings(collection);
      
      for (const listing of listings) {
        if (this.isOpportunity(listing)) {
          await this.alertUser(listing);
          
          if (this.parameters.autoBidding.enabled) {
            await this.placeBid(listing);
          }
        }
      }
    }
  }
  
  private async getPaintswapListings(contractAddress: string) {
    // Integration with Paintswap API
    const response = await fetch(`/api/paintswap/collection/${contractAddress}`);
    return await response.json();
  }
  
  private isOpportunity(listing: any): boolean {
    const discount = (listing.floorPrice - listing.price) / listing.floorPrice;
    return discount >= this.parameters.alertCriteria.minDiscount &&
           listing.price <= this.parameters.alertCriteria.maxPrice;
  }
}
```

## Step 6: Deployment and Testing

### 6.1 Contract Deployment

```javascript
// scripts/deploy.js
const { ethers } = require('hardhat');

async function main() {
  // Deploy FLOAI Token
  const FLOAIToken = await ethers.getContractFactory('FLOAIToken');
  const floaiToken = await FLOAIToken.deploy();
  await floaiToken.deployed();
  console.log('FLOAI Token deployed to:', floaiToken.address);
  
  // Deploy Agent Factory
  const AgentFactory = await ethers.getContractFactory('ServiceFlowAgentFactory');
  const agentFactory = await AgentFactory.deploy();
  await agentFactory.deployed();
  console.log('Agent Factory deployed to:', agentFactory.address);
  
  // Deploy Marketplace
  const Marketplace = await ethers.getContractFactory('ServiceFlowMarketplace');
  const marketplace = await Marketplace.deploy(agentFactory.address);
  await marketplace.deployed();
  console.log('Marketplace deployed to:', marketplace.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 6.2 Testing Suite

```javascript
// test/agent-factory.test.js
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('ServiceFlow Agent Factory', function () {
  let agentFactory, floaiToken;
  let owner, user1, user2;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const FLOAIToken = await ethers.getContractFactory('FLOAIToken');
    floaiToken = await FLOAIToken.deploy();
    
    const AgentFactory = await ethers.getContractFactory('ServiceFlowAgentFactory');
    agentFactory = await AgentFactory.deploy();
  });
  
  it('Should mint agent NFT', async function () {
    const mintCost = ethers.utils.parseEther('50');
    
    await agentFactory.connect(user1).mintAgent(
      'Test Agent',
      'image',
      'Generate beautiful images',
      ['dalle', 'midjourney'],
      ['openai'],
      3,
      'https://r2.srvcflo.com/metadata/test',
      '0x1234567890abcdef',
      { value: mintCost }
    );
    
    expect(await agentFactory.ownerOf(1)).to.equal(user1.address);
  });
  
  it('Should distribute minting fees correctly', async function () {
    const mintCost = ethers.utils.parseEther('50');
    const banditKidzBalance = await ethers.provider.getBalance('0x...'); // Bandit Kidz treasury
    
    await agentFactory.connect(user1).mintAgent(
      'Test Agent',
      'image',
      'Test instructions',
      [],
      [],
      3,
      'https://r2.srvcflo.com/metadata/test',
      '0x1234567890abcdef',
      { value: mintCost }
    );
    
    const newBalance = await ethers.provider.getBalance('0x...');
    const expectedIncrease = mintCost.mul(75).div(100); // 75%
    
    expect(newBalance.sub(banditKidzBalance)).to.equal(expectedIncrease);
  });
});
```

## Step 7: Monitoring and Analytics

### 7.1 D1 Database Schema

```sql
-- D1 Analytics Schema
CREATE TABLE agent_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id INTEGER NOT NULL,
  user_address TEXT NOT NULL,
  floai_consumed INTEGER NOT NULL,
  generation_type TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE revenue_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id INTEGER NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  revenue_type TEXT NOT NULL, -- 'generation', 'sale', 'royalty'
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_address TEXT NOT NULL,
  auth0_user_id TEXT,
  session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_end DATETIME,
  actions_count INTEGER DEFAULT 0
);

CREATE INDEX idx_agent_usage_token_id ON agent_usage(token_id);
CREATE INDEX idx_revenue_tracking_token_id ON revenue_tracking(token_id);
CREATE INDEX idx_user_sessions_address ON user_sessions(user_address);
```

### 7.2 Analytics Dashboard

```tsx
// components/AnalyticsDashboard.tsx
import { useEffect, useState } from 'react';

interface AgentMetrics {
  tokenId: number;
  totalGenerations: number;
  floaiConsumed: number;
  revenueGenerated: number;
  dailyActiveUsers: number;
}

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AgentMetrics[]>([]);
  
  useEffect(() => {
    fetchMetrics();
  }, []);
  
  const fetchMetrics = async () => {
    const response = await fetch('/api/analytics/agents');
    const data = await response.json();
    setMetrics(data);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <div key={metric.tokenId} className="bg-gray-800 rounded-lg p-6 border border-green-500/20">
          <h3 className="text-lg font-semibold text-green-400">Agent #{metric.tokenId}</h3>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Generations:</span>
              <span className="text-white">{metric.totalGenerations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">FLOAI Used:</span>
              <span className="text-white">{metric.floaiConsumed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Revenue:</span>
              <span className="text-white">{metric.revenueGenerated} S</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">DAU:</span>
              <span className="text-white">{metric.dailyActiveUsers}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Conclusion

This comprehensive guide provides the complete implementation strategy for ServiceFlow AI's iNFT ecosystem, including:

1. **Smart Contract Architecture**: FLOAI token, Agent Factory, and Marketplace contracts
2. **Cloudflare Integration**: R2 storage, KV namespaces, D1 database, and Workers
3. **Auth0 Authentication**: Secure user management with Web3 integration
4. **Multi-Product Platform**: Image/Video, Social, NFT Watcher, and Token Analyst agents
5. **Visual Design**: Sonic blue + Matrix green aesthetic with interactive effects
6. **Revenue Distribution**: Automated fee splitting for sustainable tokenomics
7. **Analytics and Monitoring**: Comprehensive tracking and reporting system

The implementation leverages Sonic blockchain's EVM compatibility and fee return mechanisms while providing a scalable, secure, and user-friendly platform for AI agent creation and monetization.