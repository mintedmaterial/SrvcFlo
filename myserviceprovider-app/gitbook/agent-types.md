# iNFT Agent Types

## 🤖 Overview

ServiceFlow AI offers four specialized agent types, each packaged as intelligent NFTs with unique capabilities and earning potential. Users can mint custom agents with personalized artwork and specific functionalities.

---

## 🎨 Image Generation Agent

### **Core Functionality**
The Image Generation Agent specializes in AI-powered image creation using advanced text-to-image models with cyberpunk aesthetics and collection-style influences.

### **Technical Specifications**
- **Model**: Cloudflare AI Flux-1-Schnell
- **Resolution**: 1024x1024 pixels
- **Quality Levels**: Standard (4 steps), High (6 steps), Ultra (8 steps)
- **Style Enhancement**: Automatic cyberpunk theme integration
- **Collection Influence**: Bandit Kidz, Derps, Lazy Bears, and more

### **Features**
#### **Prompt Enhancement**
```typescript
// Base prompt gets enhanced with cyberpunk elements
"cat wearing sunglasses" → 
"cat wearing sunglasses, futuristic cyberpunk character, 
neon green glowing elements, tech accessories, dark urban background, 
high-tech aesthetic, digital art style"
```

#### **Collection Keywords**
- **"bandit"** or **"kidz"**: Adds Bandit Kidz aesthetic influence
- **"derp"**: Applies Derps collection style
- **"lazy"**: Uses Lazy Bears collection vibes
- **"sonic"**: Incorporates Sonic-themed elements

#### **Quality Options**
| Quality | Steps | Guidance | Cost (FLOAI) | Use Case |
|---------|-------|----------|--------------|----------|
| Standard | 4 | 3.5 | 50 | Quick generations |
| High | 6 | 4.0 | 75 | Detailed artwork |
| Ultra | 8 | 5.0 | 100 | Maximum quality |

### **Agent Minting Process**
1. **User provides custom prompt**
2. **AI enhances prompt with cyberpunk elements**
3. **Generates unique agent artwork**
4. **Creates NFT metadata with attributes**
5. **Mints iNFT with embedded capabilities**

### **Revenue Model**
- **User pays**: 50 FLOAI per generation
- **Agent owner earns**: 5% of usage (2.5 FLOAI)
- **Platform distribution**: 95% split across dev/staking/treasury

### **API Endpoints**
```typescript
// Generate regular image
POST /api/agents/image-generation
{
  "prompt": "cyberpunk warrior",
  "userAddress": "0x...",
  "agentId": "1001",
  "quality": "high",
  "collectionInfluence": ["bandit", "kidz"]
}

// Generate agent minting image
POST /api/agents/image-generation
{
  "prompt": "AI guardian",
  "userAddress": "0x...",
  "agentId": "1001",
  "isForMinting": true,
  "style": "cyberpunk"
}
```

### **Chat Interface**
Users can interact with their Image Generation Agent through natural language:
- **"Generate a futuristic city"**
- **"Create bandit-style character"**
- **"Make ultra quality image of robot"**
- **"Apply neon theme to my prompt"**

---

## 👁️ NFT Watcher Agent

### **Core Functionality**
The NFT Watcher Agent monitors PaintSwap marketplace collections, tracks price movements, and alerts users to trading opportunities and unusual activity.

### **Technical Specifications**
- **Marketplace**: PaintSwap (Sonic's primary NFT marketplace)
- **Monitoring**: Real-time collection data
- **Alerts**: Price drops, volume spikes, mispricing detection
- **Data Sources**: PaintSwap API, on-chain events

### **Monitoring Capabilities**
#### **Collection Tracking**
- **Floor Price Monitoring**: Tracks minimum listing prices
- **Volume Analysis**: 24h/7d/30d volume tracking
- **Sales Activity**: Recent sales and price trends
- **Holder Analysis**: Owner distribution and whale movements

#### **Alert Types**
| Alert Type | Description | Default Threshold |
|------------|-------------|-------------------|
| Floor Drop | Floor price decrease | 15% decrease |
| Volume Spike | Trading volume increase | 150% increase |
| Listing Below Floor | Items listed below floor | 10% below floor |
| Unusual Activity | Whale movements, bulk sales | Custom logic |

### **PaintSwap Integration**
```typescript
// Add collection to monitor
POST /api/agents/nft-watcher
{
  "action": "add_collection",
  "userAddress": "0x...",
  "agentId": "1002",
  "collectionAddress": "0xPaintSwapCollection..."
}

// Configure alerts
POST /api/agents/nft-watcher
{
  "action": "configure_alerts",
  "collectionAddress": "0x...",
  "alertConfig": [
    {
      "type": "floor_drop",
      "threshold": 0.15,
      "enabled": true
    }
  ]
}
```

### **Features**
#### **Smart Notifications**
- **Discord/Telegram Integration**: Send alerts to messaging platforms
- **Email Notifications**: Critical alerts via email
- **In-App Alerts**: Real-time dashboard notifications
- **Mobile Push**: Future mobile app integration

#### **Analytics Dashboard**
- **Collection Performance**: Price charts and volume graphs
- **Market Trends**: Cross-collection analysis
- **Rarity Tools**: Trait rarity and pricing analysis
- **Portfolio Tracking**: User's collection value monitoring

### **Chat Interface Examples**
- **"Add Sonic Punks collection to monitor"**
- **"Alert me if floor drops below 0.5 SOL"**
- **"Show me collections with high volume today"**
- **"What's the rarest trait in Bandit Kidz?"**

### **Revenue Model**
- **Monitoring Fee**: 25 FLOAI per collection per month
- **Alert Premium**: 10 FLOAI per custom alert setup
- **Analytics Access**: 5 FLOAI per detailed report

---

## 📈 Pair Monitor Agent

### **Core Functionality**
The Pair Monitor Agent provides real-time DexScreener integration for Sonic DEX pairs, offering price tracking, technical analysis, and trading alerts.

### **Technical Specifications**
- **Data Source**: DexScreener API for Sonic chain
- **Coverage**: All Sonic DEX pairs
- **Refresh Rate**: 30-second price updates
- **Technical Indicators**: SMA, EMA, RSI, MACD, Volume

### **Monitoring Features**
#### **Price Tracking**
- **Real-time Price Feeds**: Live pair prices from DexScreener
- **Historical Data**: OHLCV data for multiple timeframes
- **Price Alerts**: Custom price movement notifications
- **Volatility Analysis**: Price movement patterns and predictions

#### **Supported Timeframes**
| Timeframe | Data Points | Use Case |
|-----------|-------------|----------|
| 5 minutes | 288 points (24h) | Scalping/Day trading |
| 15 minutes | 96 points (24h) | Short-term analysis |
| 1 hour | 24 points (24h) | Swing trading |
| 4 hours | 12 points (48h) | Position trading |
| 1 day | 30 points (30d) | Long-term trends |

### **Technical Analysis**
#### **Indicators Available**
```typescript
// Chart data with indicators
{
  "pairAddress": "0x...",
  "timeframe": "1h",
  "data": {
    "timestamps": [...],
    "prices": [...],
    "volumes": [...]
  },
  "indicators": {
    "sma20": [...],    // Simple Moving Average (20 periods)
    "sma50": [...],    // Simple Moving Average (50 periods)
    "rsi": [...],      // Relative Strength Index
    "volume": [...],   // Volume bars
    "macd": {          // MACD indicator
      "macd": [...],
      "signal": [...],
      "histogram": [...]
    }
  }
}
```

#### **Alert Configuration**
```typescript
POST /api/agents/pair-monitor
{
  "action": "configure_alerts",
  "pairAddress": "0xSonicPair...",
  "alertConfig": [
    {
      "type": "price_increase",
      "threshold": 0.1,        // 10% increase
      "enabled": true
    },
    {
      "type": "volume_spike",
      "threshold": 2.0,        // 200% volume increase
      "enabled": true
    },
    {
      "type": "rsi_oversold",
      "threshold": 30,         // RSI below 30
      "enabled": true
    }
  ]
}
```

### **Supported Pairs**
- **S/wS**: Sonic to Wrapped Sonic
- **USDC/wS**: USDC to Wrapped Sonic
- **Custom Pairs**: Any pair on Sonic DEXes
- **Cross-chain**: Future support for multi-chain pairs

### **Chat Interface Examples**
- **"Show me S/wS 1-hour chart"**
- **"Alert me if volume spikes 200%"**
- **"What's the RSI for USDC/wS?"**
- **"Add 0x... pair to monitoring"**

### **Revenue Model**
- **Basic Monitoring**: 30 FLOAI per pair per month
- **Advanced Analytics**: 50 FLOAI per pair with full indicators
- **Custom Alerts**: 10 FLOAI per alert configuration

---

## 📱 Social Media Agent

### **Core Functionality**
The Social Media Agent automates posting, engagement, and content creation across social platforms with human-like interaction patterns.

### **Technical Specifications**
- **Platforms**: X (Twitter), Discord, Telegram (future: Instagram, TikTok)
- **Posting Schedule**: 4-5 posts daily with varying intervals
- **Content Types**: Text, images, polls, threads
- **Engagement**: Automated likes, replies, and retweets

### **Features**
#### **Content Creation**
- **AI-Generated Posts**: Relevant content for crypto/NFT space
- **Image Integration**: Combine with Image Generation Agent
- **Hashtag Optimization**: Trending and relevant hashtags
- **Thread Creation**: Multi-tweet thread support

#### **Engagement Automation**
```typescript
// Social posting configuration
{
  "schedule": {
    "postsPerDay": 5,
    "intervals": [
      "09:00-10:00",  // Morning
      "13:00-14:00",  // Lunch
      "17:00-18:00",  // Evening
      "20:00-21:00",  // Prime time
      "23:00-00:00"   // Late night
    ]
  },
  "engagement": {
    "autoLike": true,
    "autoReply": true,
    "maxEngagementsPerHour": 10
  }
}
```

#### **Content Categories**
- **Market Updates**: Price movements and analysis
- **Community Content**: Engaging with followers
- **Educational Posts**: Crypto/NFT knowledge sharing
- **Promotional Content**: Platform features and updates

### **Chat Interface Examples**
- **"Post about today's Sonic price movement"**
- **"Schedule 5 tweets for tomorrow"**
- **"Create a thread about NFT utility"**
- **"Engage with posts about #SonicEcosystem"**

### **Revenue Model**
- **Basic Automation**: 40 FLOAI per month per platform
- **Advanced Engagement**: 80 FLOAI per month with full features
- **Custom Content**: 15 FLOAI per custom post/thread

---

## 🔧 **Universal Agent Features**

### **Earnings System**
All agent owners earn **5% of usage fees**:
```typescript
// Example earnings calculation
const usageFee = 50; // FLOAI
const ownerEarnings = usageFee * 0.05; // 2.5 FLOAI
const platformFee = usageFee * 0.95;   // 47.5 FLOAI
```

### **Agent Metadata**
Each minted agent includes comprehensive metadata:
```json
{
  "name": "iNFT Agent #1001",
  "description": "Intelligent NFT Agent created from prompt: 'cyberpunk warrior'",
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSU...",
  "attributes": [
    {"trait_type": "Agent Type", "value": "Image Generation"},
    {"trait_type": "Style", "value": "cyberpunk"},
    {"trait_type": "Creator", "value": "0x..."},
    {"trait_type": "Generation Date", "value": "2024-12-19T10:30:00Z"},
    {"trait_type": "Original Prompt", "value": "cyberpunk warrior"},
    {"trait_type": "Usage Count", "value": "0"},
    {"trait_type": "Total Earnings", "value": "0"}
  ],
  "external_url": "https://serviceflow.ai/agent/1001"
}
```

### **Cross-Agent Synergy**
Agents can work together for enhanced functionality:
- **Image + Social**: Generate images for social media posts
- **NFT Watcher + Pair Monitor**: Correlate NFT prices with token prices
- **All Agents**: Comprehensive market analysis and content creation

### **Future Enhancements**
- **Agent Governance**: Vote on platform decisions
- **Agent Marketplace**: Trade and lease agents
- **Advanced AI**: GPT-4 integration for enhanced capabilities
- **Mobile App**: Native mobile agent management

---

*Each agent type represents a unique opportunity to earn passive income while contributing to the Sonic ecosystem's growth and automation.*