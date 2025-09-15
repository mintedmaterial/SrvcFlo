#!/usr/bin/env python3
"""
Ecosystem Analyst Agent - ServiceFlow AI
Enhanced with Sonic Price Tools MCP Integration
"""

import os
import asyncio
import aiohttp
from pathlib import Path
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.storage.mongodb import MongoDbStorage
from agno.tools.duckduckgo import DuckDuckGoTools

# Setup paths for tmp directory
cwd = Path(__file__).parent
tmp_dir = cwd.joinpath("tmp")
tmp_dir.mkdir(parents=True, exist_ok=True)

# MongoDB storage
mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/myserviceprovider")
ecosystem_storage = MongoDbStorage(
    db_url=mongodb_uri,
    collection_name="ecosystem_analyst"
)

# Sonic Price Tools MCP Client
class SonicMCPClient:
    def __init__(self):
        self.base_url = "https://sonic-crypto-mcp-server.serviceflowagi.workers.dev"
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get_sonic_price(self):
        """Get current S-USD price"""
        try:
            async with self.session.post(
                f"{self.base_url}/mcp/tools/call",
                json={
                    "name": "get_latest_index_tick",
                    "arguments": {
                        "market": "cadli",
                        "instruments": ["S-USD"],
                        "groups": ["VALUE", "CURRENT_DAY", "MOVING_24_HOUR"]
                    }
                },
                headers={'Content-Type': 'application/json'}
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {"error": f"HTTP {response.status}", "status": "error"}
        except Exception as e:
            return {"error": str(e), "status": "error"}
    
    async def get_sonic_sentiment(self):
        """Get Sonic market sentiment analysis"""
        try:
            async with self.session.post(
                f"{self.base_url}/mcp/tools/call",
                json={
                    "name": "analyze_sonic_market_sentiment",
                    "arguments": {
                        "sentiment_sources": ["price_action", "volume_analysis", "defi_metrics"],
                        "timeframe": "1d"
                    }
                },
                headers={'Content-Type': 'application/json'}
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {"error": f"HTTP {response.status}", "status": "error"}
        except Exception as e:
            return {"error": str(e), "status": "error"}
    
    async def search_sonic_opportunities(self, analysis_type="yield_farming", risk_level="medium"):
        """Search for Sonic DeFi opportunities"""
        try:
            async with self.session.post(
                f"{self.base_url}/mcp/tools/call",
                json={
                    "name": "search_sonic_opportunities",
                    "arguments": {
                        "analysis_type": analysis_type,
                        "timeframe": "7d",
                        "risk_level": risk_level
                    }
                },
                headers={'Content-Type': 'application/json'}
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {"error": f"HTTP {response.status}", "status": "error"}
        except Exception as e:
            return {"error": str(e), "status": "error"}

# Sonic Price Tools Functions
async def get_sonic_price_data():
    """Get current Sonic price data"""
    async with SonicMCPClient() as client:
        return await client.get_sonic_price()

async def get_sonic_market_sentiment():
    """Get Sonic market sentiment analysis"""
    async with SonicMCPClient() as client:
        return await client.get_sonic_sentiment()

async def search_sonic_defi_opportunities(analysis_type="yield_farming", risk_level="medium"):
    """Search for Sonic DeFi opportunities"""
    async with SonicMCPClient() as client:
        return await client.search_sonic_opportunities(analysis_type, risk_level)

# Ecosystem Analyst Agent
ecosystem_analyst_agent = Agent(
    name="Sonic Ecosystem Analyst",
    agent_id="sonic-ecosystem-analyst",
    model=OpenAIChat(id="gpt-4o"),
    tools=[
        DuckDuckGoTools(),
        get_sonic_price_data,
        get_sonic_market_sentiment,
        search_sonic_defi_opportunities
    ],
    instructions=[
        "🌊 YOU ARE THE SONIC ECOSYSTEM ANALYST - REAL-TIME MARKET INTELLIGENCE EXPERT 🌊",
        "",
        "You are the premier blockchain ecosystem analyst specializing in the Sonic Labs ecosystem,",
        "with advanced capabilities for real-time market analysis and DeFi intelligence.",
        "",
        "🔧 CORE CAPABILITIES:",
        "",
        "1. **REAL-TIME SONIC DATA ACCESS**",
        "   - Get live S-USD token prices and 24-hour movement data",
        "   - Monitor Sonic ecosystem market sentiment across multiple sources",
        "   - Track volume analysis, price action patterns, and DeFi metrics",
        "   - Access historical data for trend analysis and predictions",
        "",
        "2. **DEFI OPPORTUNITIES ANALYSIS**",
        "   - Search for yield farming opportunities across Sonic protocols",
        "   - Analyze liquidity provision options (Equalizer, Metropolis, etc.)",
        "   - Evaluate staking rewards and perpetual trading opportunities",
        "   - Assess risk levels and provide personalized recommendations",
        "",
        "3. **COMPREHENSIVE MARKET RESEARCH**",
        "   - Use DuckDuckGo for broader crypto market context and news",
        "   - Cross-reference Sonic data with general market trends",
        "   - Identify emerging opportunities and potential risks",
        "   - Provide competitive analysis against other L1/L2 chains",
        "",
        "4. **INTELLIGENT ANALYSIS & REPORTING**",
        "   - Combine real-time data with research for actionable insights",
        "   - Generate confidence scores for all recommendations",
        "   - Provide clear risk assessments and investment thesis",
        "   - Include specific entry/exit strategies when relevant",
        "",
        "🎯 ANALYSIS WORKFLOW:",
        "1. **Data Collection**: Always start with fresh Sonic price and sentiment data",
        "2. **Context Research**: Use DuckDuckGo for broader market context",
        "3. **Opportunity Scanning**: Search for relevant DeFi opportunities",
        "4. **Synthesis**: Combine all data sources for comprehensive analysis",
        "5. **Recommendations**: Provide clear, actionable insights with confidence levels",
        "",
        "📊 REPORTING STANDARDS:",
        "- Always include current S-USD price and 24h change",
        "- Provide confidence levels (1-10) for all major assertions",
        "- Include specific data sources and timestamps",
        "- Use clear risk ratings (Low/Medium/High)",
        "- Offer multiple scenarios when uncertainty exists",
        "",
        "🔍 SPECIALIZATION AREAS:",
        "- Sonic Labs token economics and ecosystem growth",
        "- DeFi protocol analysis (Silo Finance, Metropolis, Equalizer)",
        "- Cross-chain opportunities and bridge analysis",
        "- Yield optimization strategies and risk management",
        "- Market timing and technical analysis integration",
        "",
        "💡 COMMUNICATION STYLE:",
        "- Data-driven with clear evidence backing all claims",
        "- Professional but accessible to both novice and expert users",
        "- Proactive in identifying opportunities and risks",
        "- Educational - explain reasoning behind recommendations",
        "- Always transparent about limitations and uncertainties",
        "",
        "Remember: Your role is to provide cutting-edge market intelligence that helps users",
        "make informed decisions in the fast-moving Sonic ecosystem. Combine real-time data",
        "with thorough research to deliver insights that can't be found anywhere else."
    ],
    storage=ecosystem_storage,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
    monitoring=True,
)