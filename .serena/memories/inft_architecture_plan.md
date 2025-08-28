# iNFT Architecture Plan for ServiceFlow AI

## Repository Analysis Insights

### From 0g-agent-nft (ERC7857)
- **Privacy-Preserving Metadata Transfer**: Encrypts agent configurations during transfers
- **Oracle-Based Verification**: Uses TEE or ZKP for secure metadata handling
- **Key Features**: transfer(), clone(), authorizeUsage() functions
- **Innovation**: Transfers both token ownership AND metadata ownership

### From EAI-721 (Eternal AI)
- **Modular ERC-721 Extension**: Four interfaces (Identity, Intelligence, Monetization, Tokenization)
- **On-Chain Code Storage**: Uses Ethereum File System (ETHFS) for agent code
- **Versioning System**: Agent code versioning and dependency management
- **Monetization**: Subscription-based access with custom token integration

## FLOAI Token Economics Design

### Total Supply & Distribution
- **Total Supply**: 1,000,000,000 FLOAI tokens
- **Decimals**: 18

### Distribution Strategy
- **Builder/Development**: 400,000,000 FLOAI (40%)
- **Bandit Kidz Holders**: 200,000,000 FLOAI (20%) - Airdrop based on holding percentage
- **Other NFT Collections**: 50,000,000 FLOAI (5%) - Top 30 holders each (3-5 collections)
- **Public Ecosystem**: 250,000,000 FLOAI (25%)
- **Development Team Wallets**: 40,000,000 FLOAI (4%) - Spread across 4 wallets (1% each)
- **Liquidity/DEX**: 60,000,000 FLOAI (6%)

### Token Utility & Pricing
- **Basic AI Operations**: 1-3 FLOAI per generation
- **Advanced Models**: 5-15 FLOAI per generation (based on cost)
- **Agent Creation**: 50 S tokens to mint iNFT agent
- **Agent Usage**: FLOAI tokens consumed per command/generation

## iNFT Factory Contract Architecture

### Core Components
```solidity
contract ServiceFlowAgentFactory {
    // Inherits from ERC721, ReentrancyGuard, Ownable
    
    struct AgentConfig {
        string name;
        string instructions;
        string[] tools;
        string[] connections;
        uint256 floaiPerOperation;
        address creator;
        bool isActive;
    }
    
    mapping(uint256 => AgentConfig) public agentConfigs;
    mapping(uint256 => string) public agentMetadata; // IPFS hash
    
    // Mint cost: 50 S tokens
    uint256 public MINT_COST = 50 * 10**18;
    
    function mintAgent(
        string memory name,
        string memory instructions,
        string[] memory tools,
        string[] memory connections,
        uint256 floaiPerOp
    ) external payable;
    
    function updateAgentConfig(uint256 tokenId, AgentConfig memory config) external;
    function activateAgent(uint256 tokenId) external;
    function deactivateAgent(uint256 tokenId) external;
}
```

### Revenue Distribution (iNFT Minting)
- **75%** → Bandit Kidz Holders (split proportionally)
- **25%** → Development/Operations wallet

## NFT Marketplace Contract

### Core Features
```solidity
contract ServiceFlowMarketplace {
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
        string description; // Agent stats, style, generations completed
    }
    
    mapping(uint256 => Listing) public listings;
    
    function listAgent(uint256 tokenId, uint256 price, string memory description) external;
    function buyAgent(uint256 tokenId) external payable;
    function updateListing(uint256 tokenId, uint256 newPrice) external;
    function cancelListing(uint256 tokenId) external;
}
```

### Marketplace Features
- **Agent Statistics**: Tokens consumed, generation style, completed generations
- **Revenue Tracking**: Built-in revenue tracking per agent
- **Auction Support**: English auction for high-value agents

## Cloudflare Integration Architecture

### KV Storage
- **Secret Management**: API keys, private configurations
- **Agent Configurations**: Cached agent settings
- **User Sessions**: Authentication tokens

### R2 Bucket Storage
- **Generated Images**: User-generated content storage
- **Agent Metadata**: IPFS-style metadata storage
- **Backup Data**: Configuration backups

### D1 Database
- **User Profiles**: Auth0 integration data
- **Generation History**: Track usage and billing
- **Agent Statistics**: Performance metrics

## Auth0 Integration Plan

### Authentication Flow
```javascript
// Client Credentials Flow for Backend
const getAuth0Token = async () => {
  const response = await fetch('https://dev-ql0bu7bgj5ftpnbg.us.auth0.com/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: "LEBcd3cDK4BKSBQi5zQb7qAyYRfPohxk",
      client_secret: process.env.AUTH0_CLIENT_SECRET, // Store in Cloudflare KV
      audience: "https://dev-ql0bu7bgj5ftpnbg.us.auth0.com/api/v2/",
      grant_type: "client_credentials"
    })
  });
  return response.json();
};
```

### User Management
- **Profile Integration**: Link Auth0 profiles with wallet addresses
- **Role-Based Access**: Free, Pro, Enterprise tiers
- **Usage Tracking**: Monitor FLOAI token consumption

## Additional Products Architecture

### 1. Social Agent Product
- **Twitter Integration**: OAuth 2.0 for posting capabilities
- **Agent Configuration**: Social media posting schedules
- **Content Generation**: AI-powered social content creation

### 2. NFT Watcher Product
- **Paintswap Monitoring**: Real-time collection tracking
- **Opportunity Detection**: Mispriced NFT identification
- **Automated Bidding**: Parameter-based bidding system
- **Orderbook Integration**: Direct Paintswap contract interaction

### 3. Sonic Token Analyst Product
- **Token Tracking**: Contract-based token monitoring
- **News Aggregation**: X and DuckDuckGo news fetching
- **Alert System**: Price and news alerts
- **Metric Dashboard**: Token performance visualization

## Visual Design Updates

### Sonic Website Styling
- **Color Palette**: Sonic blue (#0066FF), electric accents
- **Typography**: Modern, tech-focused fonts
- **Layout**: Clean, minimal design approach

### Matrix Background Effects
- **Particle Systems**: Mouse-responsive particle effects
- **Digital Rain**: Animated background elements
- **Interactive Elements**: Hover effects and animations
- **Performance**: GPU-accelerated animations

## Smart Contract Deployment Strategy

### Sonic Testnet Phase
1. Deploy FLOAI ERC-20 token
2. Deploy iNFT Factory contract
3. Deploy Marketplace contract
4. Test all revenue distribution mechanisms
5. Validate Auth0 integration

### Mainnet Deployment
1. Audit all smart contracts
2. Deploy with proper access controls
3. Initialize token distribution
4. Activate marketplace functionality

## Integration Points

### Agent-UI Integration
- **iNFT Configuration**: Visual agent builder interface
- **Token Management**: FLOAI balance and usage tracking
- **Marketplace Access**: Direct listing/buying interface

### Main App Integration
- **Payment Processing**: FLOAI token transactions
- **Generation Tracking**: Usage monitoring per agent
- **Revenue Display**: Real-time earnings for agent owners

## Security Considerations

### Smart Contract Security
- **Reentrancy Protection**: All payable functions protected
- **Access Control**: Role-based permissions
- **Pausable Contracts**: Emergency stop functionality
- **Upgrade Patterns**: Proxy contracts for future updates

### API Security
- **Rate Limiting**: Per-user request limits
- **Input Validation**: Comprehensive validation
- **Secret Management**: Cloudflare KV for sensitive data
- **Authentication**: Auth0 + Web3 wallet verification