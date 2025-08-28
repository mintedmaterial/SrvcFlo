# API Reference

## 🔗 Base URL
```
Development: http://localhost:3001
Production: https://serviceflow.ai
```

## 🔐 Authentication

### Wallet-Based Authentication
All agent management endpoints require wallet signature verification:

```typescript
// Headers required for authenticated requests
{
  "Authorization": "Bearer <wallet_signature>",
  "X-Wallet-Address": "0x...",
  "Content-Type": "application/json"
}
```

---

## 🎨 Image Generation Agent API

### Generate Image
Create AI-generated images with cyberpunk aesthetics.

```http
POST /api/agents/image-generation
```

#### Request Body
```json
{
  "prompt": "cyberpunk warrior with neon armor",
  "userAddress": "0x742d35cc6569c2c0ba0000000000000000000000",
  "agentId": "1001",
  "style": "cyberpunk",
  "quality": "high",
  "isForMinting": false,
  "collectionInfluence": ["bandit", "kidz"]
}
```

#### Response
```json
{
  "success": true,
  "imageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSU...",
  "originalPrompt": "cyberpunk warrior with neon armor",
  "enhancedPrompt": "cyberpunk warrior with neon armor, futuristic cyberpunk character, neon green glowing elements...",
  "quality": "high",
  "floaiCost": 75,
  "metadata": {
    "agentId": "1001",
    "userAddress": "0x...",
    "generatedAt": "2024-12-19T10:30:00Z",
    "model": "flux-schnell"
  }
}
```

### Generate Agent Minting Image
Create unique artwork for agent NFT minting.

```http
POST /api/agents/image-generation
```

#### Request Body
```json
{
  "prompt": "AI guardian protector",
  "userAddress": "0x...",
  "agentId": "1001",
  "style": "cyberpunk",
  "isForMinting": true
}
```

#### Response
```json
{
  "success": true,
  "imageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSU...",
  "originalPrompt": "AI guardian protector",
  "enhancedPrompt": "AI guardian protector, futuristic cyberpunk character...",
  "metadata": {
    "name": "iNFT Agent #1001",
    "description": "Intelligent NFT Agent created from prompt: 'AI guardian protector'",
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSU...",
    "attributes": [
      {"trait_type": "Agent Type", "value": "Image Generation"},
      {"trait_type": "Style", "value": "cyberpunk"},
      {"trait_type": "Creator", "value": "0x..."}
    ]
  },
  "ready_for_minting": true,
  "estimated_gas": "0.001 S"
}
```

### Get Agent Capabilities
Retrieve agent configuration and capabilities.

```http
GET /api/agents/image-generation
```

#### Response
```json
{
  "agentType": "Image Generation",
  "version": "1.0.0",
  "capabilities": [
    "AI image generation",
    "Agent NFT minting support",
    "Collection style influence",
    "Multiple quality levels",
    "Cyberpunk aesthetics"
  ],
  "supportedStyles": ["cyberpunk", "neon", "matrix", "ai"],
  "qualityLevels": ["standard", "high", "ultra"],
  "collections": ["bandit", "kidz", "derp", "lazy", "sonic"],
  "costs": {
    "regular_generation": "50 FLOAI",
    "high_quality": "75 FLOAI", 
    "ultra_quality": "100 FLOAI"
  }
}
```

---

## 👁️ NFT Watcher Agent API

### Add Collection to Monitor
Start monitoring a PaintSwap collection.

```http
POST /api/agents/nft-watcher
```

#### Request Body
```json
{
  "action": "add_collection",
  "userAddress": "0x...",
  "agentId": "1002",
  "collectionAddress": "0xPaintSwapCollection..."
}
```

#### Response
```json
{
  "success": true,
  "collection": {
    "address": "0xPaintSwapCollection...",
    "name": "Sonic Punks",
    "slug": "sonic-punks",
    "floorPrice": 0.95,
    "totalVolume": 1250.0,
    "alerts": [
      {"type": "floor_drop", "threshold": 0.15, "enabled": true},
      {"type": "volume_spike", "threshold": 1.5, "enabled": true}
    ]
  },
  "message": "Now monitoring Sonic Punks for unusual activity"
}
```

### Get Active Alerts
Retrieve current alerts for monitored collections.

```http
POST /api/agents/nft-watcher
```

#### Request Body
```json
{
  "action": "get_alerts",
  "userAddress": "0x...",
  "agentId": "1002"
}
```

#### Response
```json
{
  "success": true,
  "alerts": [
    {
      "id": "alert_1",
      "collectionAddress": "0x...",
      "tokenId": "123",
      "alertType": "listing_below_floor",
      "message": "Token #123 listed at 0.8 SOL (15% below floor price)",
      "severity": "medium",
      "timestamp": "2024-12-19T10:25:00Z",
      "data": {
        "listingPrice": 0.8,
        "floorPrice": 0.95,
        "percentBelow": 15
      }
    }
  ],
  "totalAlerts": 1,
  "highPriorityCount": 0
}
```

### Configure Collection Alerts
Set up custom alert thresholds.

```http
POST /api/agents/nft-watcher
```

#### Request Body
```json
{
  "action": "configure_alerts",
  "collectionAddress": "0x...",
  "alertConfig": [
    {
      "type": "floor_drop",
      "threshold": 0.1,
      "enabled": true
    },
    {
      "type": "volume_spike", 
      "threshold": 2.0,
      "enabled": true
    }
  ],
  "userAddress": "0x..."
}
```

### Chat with NFT Watcher
Natural language interaction with the agent.

```http
POST /api/agents/nft-watcher
```

#### Request Body
```json
{
  "action": "chat",
  "chatMessage": "Add Bandit Kidz collection to monitor",
  "userAddress": "0x...",
  "agentId": "1002"
}
```

#### Response
```json
{
  "success": true,
  "response": "To add a collection, please provide the contract address. I'll start monitoring it for unusual activity, floor price changes, and volume spikes.",
  "agentType": "nft-watcher",
  "timestamp": "2024-12-19T10:30:00Z"
}
```

---

## 📈 Pair Monitor Agent API

### Add Pair to Monitor
Start monitoring a DexScreener pair.

```http
POST /api/agents/pair-monitor
```

#### Request Body
```json
{
  "action": "add_pair",
  "userAddress": "0x...",
  "agentId": "1003",
  "pairAddress": "0xb1bc4b830fcba2184b92e15b9133c41160518038"
}
```

#### Response
```json
{
  "success": true,
  "pairConfig": {
    "pairAddress": "0xb1bc4b830fcba2184b92e15b9133c41160518038",
    "symbol": "S/wS",
    "name": "Sonic / Wrapped Sonic",
    "alerts": [
      {"type": "price_increase", "threshold": 0.1, "enabled": true},
      {"type": "volume_spike", "threshold": 2.0, "enabled": true}
    ]
  },
  "currentPrice": 0.3468,
  "message": "Now monitoring S/wS pair"
}
```

### Get Chart Data
Retrieve OHLCV data with technical indicators.

```http
POST /api/agents/pair-monitor
```

#### Request Body
```json
{
  "action": "get_chart_data",
  "pairAddress": "0xb1bc4b830fcba2184b92e15b9133c41160518038",
  "timeframe": "1h"
}
```

#### Response
```json
{
  "success": true,
  "pairAddress": "0xb1bc4b830fcba2184b92e15b9133c41160518038",
  "timeframe": "1h", 
  "data": {
    "timestamps": ["2024-12-19T09:00:00Z", "2024-12-19T10:00:00Z"],
    "prices": [0.3450, 0.3468],
    "volumes": [45000, 52000]
  },
  "indicators": {
    "sma20": [0.3440, 0.3455],
    "rsi": [65.2, 68.1],
    "volume": [45000, 52000]
  },
  "lastUpdated": "2024-12-19T10:30:00Z"
}
```

### Get Pair Statistics
Retrieve detailed pair information.

```http
POST /api/agents/pair-monitor
```

#### Request Body
```json
{
  "action": "get_pair_stats",
  "pairAddress": "0xb1bc4b830fcba2184b92e15b9133c41160518038"
}
```

#### Response
```json
{
  "success": true,
  "stats": {
    "pairAddress": "0xb1bc4b830fcba2184b92e15b9133c41160518038",
    "baseToken": {
      "symbol": "S",
      "name": "Sonic",
      "address": "0x..."
    },
    "quoteToken": {
      "symbol": "wS", 
      "name": "Wrapped Sonic",
      "address": "0x..."
    },
    "currentPrice": 0.3468,
    "priceChange24h": 2.5,
    "volume24h": 125000,
    "liquidity": 850000,
    "marketCap": 34680000
  }
}
```

---

## 💰 FLOAI Payment API

### Process FLOAI Payment
Handle payment for agent usage.

```http
POST /api/payment/floai-process
```

#### Request Body
```json
{
  "userAddress": "0x...",
  "agentId": 1001,
  "agentOwner": "0x...",
  "generationType": "image",
  "amount": 50
}
```

#### Response
```json
{
  "success": true,
  "paymentProcessed": true,
  "transactionHash": "0x...",
  "amount": 50,
  "generationType": "image",
  "revenueDistribution": {
    "dev": 25,
    "staking": 12.5,
    "leaderboard": 7.5,
    "treasury": 5
  },
  "userBalance": 450,
  "agentRevenue": 2.5
}
```

### Get Payment Info
Retrieve user balance and pricing information.

```http
GET /api/payment/floai-process?userAddress=0x...
```

#### Response
```json
{
  "floaiCosts": {
    "image": 50,
    "video": 100,
    "social": 25,
    "research": 30,
    "analysis": 40
  },
  "revenueDistribution": {
    "dev": "50%",
    "staking": "25%",
    "leaderboard": "15%",
    "treasury": "10%",
    "agentOwner": "5%"
  },
  "userBalance": 500,
  "supportedTypes": ["image", "video", "social", "research", "analysis"]
}
```

---

## 💲 Price Data API

### Get Sonic Price
Retrieve current Sonic token price from DexScreener.

```http
GET /api/price/sonic-price
```

#### Response
```json
{
  "symbol": "S",
  "name": "Sonic",
  "price": 0.3468,
  "priceChange24h": 2.5,
  "volume24h": 125000,
  "liquidity": 850000,
  "marketCap": 34680000,
  "pairAddress": "0xb1bc4b830fcba2184b92e15b9133c41160518038",
  "dexId": "sonicswap",
  "source": "dexscreener",
  "timestamp": 1703001000000,
  "display": {
    "priceFormatted": "$0.346800",
    "change24hFormatted": "+2.50%",
    "volume24hFormatted": "$125,000",
    "liquidityFormatted": "$850,000"
  }
}
```

### Monitor Contract Prices
Get price data for multiple contract addresses.

```http
GET /api/price/monitor?addresses=0xabc...,0xdef...
```

#### Response
```json
{
  "monitoredAddresses": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "address": "0xabc...",
      "status": "fulfilled",
      "data": {
        "contractAddress": "0xabc...",
        "symbol": "TOKEN",
        "price": 1.25,
        "priceChange24h": -5.2,
        "volume24h": 45000
      },
      "error": null
    }
  ],
  "timestamp": 1703001000000
}
```

---

## ⚠️ Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-12-19T10:30:00Z"
}
```

### Common Error Codes
| Code | Description | Status |
|------|-------------|--------|
| `INSUFFICIENT_FLOAI` | Not enough FLOAI tokens | 402 |
| `UNAUTHORIZED_WALLET` | Wallet not authorized | 401 |
| `INVALID_AGENT_TYPE` | Unknown agent type | 400 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `AGENT_NOT_FOUND` | Agent doesn't exist | 404 |
| `PAYMENT_FAILED` | Payment processing error | 500 |

---

## 🔄 Rate Limits

### Default Limits
- **Authenticated requests**: 200 requests per minute
- **Image generation**: 10 requests per minute  
- **Price data**: 60 requests per minute
- **Chat interactions**: 30 requests per minute

### Headers
Rate limit information is included in response headers:
```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 150  
X-RateLimit-Reset: 1703001000
```

---

## 📱 WebSocket API (Future)

### Real-time Updates
Connect to WebSocket for live updates:

```javascript
const ws = new WebSocket('wss://serviceflow.ai/ws');

// Subscribe to agent updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['agent-1001', 'price-updates', 'nft-alerts']
}));

// Receive real-time data
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

---

## 🧪 Testing

### Test Wallets
Development environment test wallet addresses:
```
0x742d35cc6569c2c0ba0000000000000000000000 - Admin wallet
0x8ba1f109551bd432803012645hdjddjjdj - Test user wallet
```

### Mock Data
Most endpoints return mock data in development mode for testing purposes.

---

*Complete API documentation with interactive examples available at `/api/docs` when running the development server.*