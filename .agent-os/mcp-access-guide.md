# Shared MCP Server Access Guide

## Overview

ServiceFlow AI uses a shared MCP (Model Context Protocol) server architecture that enables both Claude sub-agents and Agno worker agents to access the same tools and data sources. This ensures perfect compatibility between development and production environments.

## Architecture Benefits

### 🔄 Shared Access Pattern

```
Claude Sub-agents ←→ MCP Servers ←→ Agno Worker Agents
     (Testing)                        (Production)
```

### ✅ Key Advantages

- **Perfect Compatibility**: Claude tests the exact same tools Agno agents use in production
- **Optimized Integration**: Claude learns optimal usage patterns and optimizes Agno agent code
- **Consistent Responses**: Both systems get identical data and behavior from MCP servers
- **Real-world Testing**: Claude can debug actual API responses and edge cases

## Available MCP Servers

### 1. DeFAI (Port 8001)

**Purpose**: DeFi analysis tools and impermanent loss calculations

**Capabilities**:
- `calculate_impermanent_loss` - Calculate IL for liquidity positions
- `analyze_defi_positions` - Comprehensive position analysis
- `assess_protocol_risk` - Protocol safety evaluation
- `simulate_yield_scenarios` - Yield farming simulations
- `track_portfolio_performance` - Portfolio monitoring

**Rate Limits**: 30 req/min, 1000 req/hour

### 2. Paintswap MCP (Port 8002)

**Purpose**: NFT marketplace integration for Sonic blockchain

**Capabilities**:
- `get_collection_stats` - Collection floor prices, volume, etc.
- `get_nft_details` - Individual NFT metadata and history
- `track_floor_prices` - Real-time floor price monitoring
- `analyze_trading_volume` - Volume trend analysis
- `monitor_rare_traits` - Rarity and trait tracking
- `get_marketplace_trends` - Market trend analysis

**Rate Limits**: 60 req/min, 2000 req/hour
**Authentication**: API Key required

### 3. CoinCodex MCP (Port 8003)

**Purpose**: Cryptocurrency market data and price tracking

**Capabilities**:
- `get_latest_price` - Current cryptocurrency prices
- `get_price_history` - Historical price data
- `get_market_data` - Comprehensive market metrics
- `analyze_market_sentiment` - Sentiment analysis
- `track_volume_changes` - Volume monitoring
- `monitor_social_metrics` - Social media metrics

**Rate Limits**: 100 req/min, 5000 req/hour

### 4. Discord Monitoring MCP (Port 8004)

**Purpose**: Discord community monitoring and sentiment analysis

**Capabilities**:
- `analyze_sentiment` - Community sentiment analysis
- `get_trending_topics` - Trending discussion topics
- `monitor_community_health` - Community engagement metrics
- `track_engagement_metrics` - User engagement tracking
- `detect_emerging_trends` - Trend detection
- `generate_social_reports` - Social intelligence reports

**Rate Limits**: 50 req/min, 1500 req/hour
**Authentication**: Discord Bot Token required

### 5. Finance Research MCP (Port 8005)

**Purpose**: Financial data aggregation and market analysis

**Capabilities**:
- `aggregate_financial_data` - Multi-source data aggregation
- `perform_technical_analysis` - Technical indicator analysis
- `generate_research_reports` - Automated research reports
- `track_macro_indicators` - Macroeconomic indicators
- `analyze_correlations` - Asset correlation analysis
- `forecast_trends` - Trend forecasting

**Rate Limits**: 40 req/min, 1200 req/hour

### 6. Supabase MCP (Port 8006)

**Purpose**: Database operations and data management

**Capabilities**:
- `execute_queries` - Database query execution
- `manage_user_data` - User data management
- `handle_real_time_updates` - Real-time data sync
- `perform_analytics` - Data analytics
- `manage_file_storage` - File storage operations
- `handle_authentication` - User authentication

**Rate Limits**: 200 req/min, 10000 req/hour
**Authentication**: Supabase API Key required

## Access Patterns

### For Claude Sub-agents

Claude sub-agents can access MCP servers directly for:

1. **Testing and Validation**

   ```typescript
   // Claude can test MCP responses directly
   const response = await callMCPTool({
     server: "paintswap",
     tool: "get_collection_stats",
     args: { contract_address: "0x..." }
   });
   ```

2. **Code Optimization**
   - Test different request patterns
   - Optimize error handling
   - Validate response formats
   - Measure performance characteristics

3. **Integration Development**
   - Debug API responses
   - Handle edge cases
   - Optimize request batching
   - Test rate limiting behavior

### For Agno Worker Agents

Agno agents access MCP servers through Trigger.dev bridge tasks:

1. **Production Execution**
   ```python
   # Agno agent uses optimized patterns from Claude testing
   result = await agno_agent.call_mcp_tool(
       server="paintswap",
       tool="get_collection_stats",
       args={"contract_address": contract_address}
   )
   ```

2. **Reliable Operations**
   - Automatic retry mechanisms
   - Error recovery patterns
   - Performance monitoring
   - Cost optimization

## Health Monitoring

### Automated Health Checks

- **Interval**: Every 30 seconds
- **Timeout**: 5 seconds per check
- **Retries**: 3 attempts before marking unhealthy

### Health Endpoints
All MCP servers provide health status at `/health`:
```bash
curl http://localhost:8001/health  # DeFAI
curl http://localhost:8002/health  # Paintswap
curl http://localhost:8003/health  # CoinCodex
curl http://localhost:8004/health  # Discord Monitoring
curl http://localhost:8005/health  # Finance Research
curl http://localhost:8006/health  # Supabase
```

### Alert Thresholds

- **Response Time**: > 2 seconds
- **Error Rate**: > 5%
- **Availability**: < 99%

## Usage Guidelines

### For Development (Claude Sub-agents)

1. **Test Before Implementation**

   ```typescript
   // Always test MCP responses before writing Agno integration
   const testResponse = await callMCPTool({
     server: "defai",
     tool: "calculate_impermanent_loss",
     args: { initialRatio: 1.0, currentRatio: 1.5 }
   });

   // Validate response format and data
   if (testResponse.success) {
     // Write optimized Agno agent code based on response
   }
   ```

2. **Optimize Request Patterns**
   - Batch similar requests when possible
   - Implement intelligent caching
   - Handle rate limits gracefully
   - Use connection pooling

3. **Error Handling**
   - Test all error scenarios
   - Implement proper fallbacks
   - Design retry strategies
   - Log errors for debugging

### For Production (Agno Worker Agents)

1. **Use Trigger.dev Bridge**
   ```typescript
   // Use the universal MCP bridge task
   const result = await mcpUniversalBridge.triggerAndWait({
     server: "paintswap",
     tool: "get_collection_stats",
     args: { contract_address: "0x..." },
     timeout: 30000
   });
   ```

2. **Monitor Performance**
   - Track execution times
   - Monitor error rates
   - Optimize resource usage
   - Scale based on demand

3. **Implement Resilience**
   - Use circuit breakers
   - Implement fallback strategies
   - Handle partial failures
   - Maintain data consistency

## Configuration Management

### Environment Variables

```bash
# MCP Server Authentication
PAINTSWAP_API_KEY=your_paintswap_api_key
DISCORD_BOT_TOKEN=your_discord_bot_token
SUPABASE_ANON_KEY=your_supabase_key

# MCP Server URLs (for production deployment)
MCP_SERVERS_BASE_URL=http://localhost  # or https://mcp.serviceflow.ai
```

### Rate Limit Management

- Monitor usage across all agents
- Implement request queuing
- Use exponential backoff
- Distribute load across time

## Best Practices

### 1. Shared Testing Strategy

- Claude tests all MCP integrations before Agno implementation
- Use identical test data and scenarios
- Validate edge cases and error conditions
- Document optimal usage patterns

### 2. Performance Optimization

- Cache frequently requested data
- Batch requests when possible
- Use appropriate timeouts
- Monitor and optimize regularly

### 3. Error Recovery

- Implement circuit breakers for unhealthy servers
- Use graceful degradation patterns
- Log errors for analysis and improvement
- Provide fallback data sources when possible

### 4. Security

- Rotate API keys regularly
- Use environment variables for secrets
- Implement proper authentication
- Monitor for unusual usage patterns

## Troubleshooting

### Common Issues

1. **MCP Server Unavailable**
   - Check health endpoint
   - Verify network connectivity
   - Check server logs
   - Restart server if needed

2. **Rate Limiting**
   - Monitor request frequency
   - Implement request queuing
   - Use exponential backoff
   - Consider upgrading rate limits

3. **Authentication Failures**
   - Verify API keys
   - Check environment variables
   - Validate token expiration
   - Review authentication headers

4. **Performance Issues**
   - Monitor response times
   - Check server resource usage
   - Optimize request patterns
   - Consider caching strategies

### Debug Commands

```bash
# Check MCP server health
curl -X GET http://localhost:8001/health

# Test tool availability
curl -X POST http://localhost:8001/tools/list

# Test specific tool
curl -X POST http://localhost:8001/tools/calculate_impermanent_loss \
  -H "Content-Type: application/json" \
  -d '{"initialRatio": 1.0, "currentRatio": 1.5}'
```

This shared MCP architecture ensures that your development environment perfectly matches production, leading to more reliable agents and better user experiences.