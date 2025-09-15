#!/usr/bin/env python3
"""
Improved Sonic Research Team - Following Agno Team Coordinate Pattern
Multi-agent collaborative research system using proper Agno Team architecture
"""

import os
import logging
from typing import Dict, List, Optional, Any
from agno.agent import Agent
from agno.team import Team
from agno.models.openai import OpenAIChat
from agno.storage.mongodb import MongoDbStorage
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.mongodb import MongoMemoryDb
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.reasoning import ReasoningTools
from Tools.finance_research_tools import DexScreenerAPI

logger = logging.getLogger(__name__)

class SonicResearchTeam:
    """
    Improved Sonic Research Team using Agno Team coordinate mode
    Based on investment-report-generator and agentic-deep-researcher patterns
    """
    
    def __init__(self, mongodb_uri: str):
        self.mongodb_uri = mongodb_uri
        self.team = self._create_research_team()
    
    def _create_finance_analyst(self) -> Agent:
        """Create Finance Analyst agent following investment-report-generator pattern"""
        
        # Create custom DexScreener tools
        def get_sonic_market_data(query: str) -> str:
            """Get Sonic ecosystem market data and DeFi metrics
            
            Args:
                query (str): Market data query (e.g. "liquidity pools", "top tokens")
                
            Returns:
                str: JSON formatted market data
            """
            try:
                api = DexScreenerAPI()
                if "liquidity" in query.lower():
                    data = api.get_market_overview()
                elif "pairs" in query.lower():
                    data = api.get_sonic_pairs(20)
                elif "yield" in query.lower():
                    data = api.calculate_yield_opportunities(1000)
                else:
                    data = api.get_market_overview()
                
                return str(data)
            except Exception as e:
                return f"Error fetching market data: {str(e)}"
        
        def analyze_arbitrage_opportunities(token_symbol: str = "S") -> str:
            """Analyze arbitrage opportunities for Sonic tokens
            
            Args:
                token_symbol (str): Token symbol to analyze
                
            Returns:
                str: Arbitrage analysis results
            """
            try:
                api = DexScreenerAPI()
                data = api.analyze_arbitrage_opportunities(token_symbol)
                return str(data)
            except Exception as e:
                return f"Error analyzing arbitrage: {str(e)}"
        
        return Agent(
            name="Sonic Finance Analyst",
            model=OpenAIChat(id="gpt-4o"),
            tools=[DuckDuckGoTools(), get_sonic_market_data, analyze_arbitrage_opportunities],
            instructions=[
                "You are a specialized DeFi analyst for the Sonic blockchain ecosystem.",
                "Your role is to analyze market data, liquidity pools, and yield opportunities.",
                "Focus on comprehensive financial analysis including:",
                "- Token price movements and market cap analysis",
                "- Liquidity pool performance and yield farming opportunities", 
                "- DEX trading volumes and pair analysis",
                "- Arbitrage opportunities across different DEXs",
                "- Risk assessment for DeFi protocols",
                "Always use the get_sonic_market_data tool for current market information.",
                "Provide specific numbers, percentages, and actionable insights.",
                "Support your analysis with data from multiple sources."
            ],
            storage=MongoDbStorage(
                collection_name="sonic_finance_analyst",
                db_url=self.mongodb_uri,
                db_name="myserviceprovider"
            ),
            memory=Memory(
                model=OpenAIChat(id="gpt-4o"),
                db=MongoMemoryDb(
                    collection_name="sonic_finance_analyst_memories",
                    db_url=self.mongodb_uri,
                    db_name="myserviceprovider"
                )
            ),
            markdown=True,
            show_tool_calls=True
        )
    
    def _create_crypto_analyst(self) -> Agent:
        """Create Crypto Market Analyst agent"""
        
        def search_crypto_news(query: str) -> str:
            """Search for cryptocurrency and blockchain news
            
            Args:
                query (str): Search query for crypto news
                
            Returns:
                str: Relevant news and market sentiment
            """
            # This would integrate with crypto news APIs in production
            return f"Searching crypto news for: {query}. Integration with CoinDesk, CoinTelegraph APIs would go here."
        
        return Agent(
            name="Crypto Market Analyst", 
            model=OpenAIChat(id="gpt-4o"),
            tools=[DuckDuckGoTools(), search_crypto_news],
            instructions=[
                "You are a cryptocurrency market analyst specializing in the Sonic blockchain.",
                "Your expertise includes:",
                "- Blockchain technology analysis and adoption trends",
                "- Comparative analysis with other L1/L2 solutions",
                "- Token economics and tokenomics evaluation",
                "- Market sentiment and social trends analysis",
                "- Technical analysis of price charts and patterns",
                "- Ecosystem development and partnership analysis",
                "Focus on Sonic's competitive advantages and market positioning.",
                "Analyze both technical fundamentals and market dynamics.",
                "Provide insights on potential catalysts and risks."
            ],
            storage=MongoDbStorage(
                collection_name="crypto_market_analyst",
                db_url=self.mongodb_uri,
                db_name="myserviceprovider"
            ),
            memory=Memory(
                model=OpenAIChat(id="gpt-4o"),
                db=MongoMemoryDb(
                    collection_name="crypto_market_analyst_memories",
                    db_url=self.mongodb_uri,
                    db_name="myserviceprovider"
                )
            ),
            markdown=True,
            show_tool_calls=True
        )
    
    def _create_social_analyst(self) -> Agent:
        """Create Social Sentiment Analyst agent"""
        
        def analyze_social_sentiment(platform: str, topic: str = "Sonic") -> str:
            """Analyze social media sentiment for Sonic ecosystem
            
            Args:
                platform (str): Social platform (twitter, discord, telegram)
                topic (str): Topic to analyze sentiment for
                
            Returns:
                str: Social sentiment analysis results
            """
            # In production, this would integrate with social media APIs
            return f"Analyzing {platform} sentiment for {topic}. Integration with Twitter API, Discord analytics would go here."
        
        return Agent(
            name="Social Sentiment Analyst",
            model=OpenAIChat(id="gpt-4o"), 
            tools=[DuckDuckGoTools(), analyze_social_sentiment],
            instructions=[
                "You are a social media and community sentiment analyst for the Sonic ecosystem.",
                "Your responsibilities include:",
                "- Monitoring community sentiment across Discord, Twitter, Telegram",
                "- Identifying key opinion leaders and influencers",
                "- Tracking social media metrics and engagement",
                "- Analyzing community growth and activity patterns",
                "- Identifying potential viral content and trending topics",
                "- Assessing community health and developer activity",
                "Focus on actionable insights that can inform strategy.",
                "Look for early signals of community sentiment shifts.",
                "Identify opportunities for community engagement and growth."
            ],
            storage=MongoDbStorage(
                collection_name="social_sentiment_analyst",
                db_url=self.mongodb_uri,
                db_name="myserviceprovider"
            ),
            memory=Memory(
                model=OpenAIChat(id="gpt-4o"),
                db=MongoMemoryDb(
                    collection_name="social_sentiment_analyst_memories", 
                    db_url=self.mongodb_uri,
                    db_name="myserviceprovider"
                )
            ),
            markdown=True,
            show_tool_calls=True
        )
    
    def _create_research_team(self) -> Team:
        """Create the coordinated research team"""
        
        # Create specialized agents
        finance_analyst = self._create_finance_analyst()
        crypto_analyst = self._create_crypto_analyst()
        social_analyst = self._create_social_analyst()
        
        # Create the coordinating team
        research_team = Team(
            name="Sonic Ecosystem Research Team",
            mode="coordinate",  # Use coordinate mode for hierarchical task delegation
            model=OpenAIChat(id="gpt-4o"),
            members=[finance_analyst, crypto_analyst, social_analyst],
            tools=[ReasoningTools(add_instructions=True)],  # Add reasoning capabilities
            instructions=[
                "You are the Research Team Lead coordinating comprehensive Sonic ecosystem analysis.",
                "Your team consists of three specialized analysts:",
                "1. Sonic Finance Analyst - DeFi metrics, liquidity, yield opportunities",
                "2. Crypto Market Analyst - Blockchain tech, market positioning, tokenomics", 
                "3. Social Sentiment Analyst - Community health, social trends, engagement",
                "",
                "COORDINATION WORKFLOW:",
                "1. Break down the research query into specific subtasks",
                "2. Delegate appropriate tasks to each specialist agent",
                "3. Collect and synthesize all analyst findings",
                "4. Provide a comprehensive research report with:",
                "   - Executive Summary",
                "   - Key Findings from each analyst",
                "   - Strategic Recommendations",
                "   - Risk Assessment",
                "   - Action Items",
                "",
                "QUALITY STANDARDS:",
                "- Ensure all recommendations are backed by data",
                "- Include specific metrics and numbers where possible",
                "- Identify potential risks and mitigation strategies",
                "- Provide actionable next steps",
                "- Cross-reference insights between analysts for validation"
            ],
            storage=MongoDbStorage(
                collection_name="sonic_research_team",
                db_url=self.mongodb_uri,
                db_name="myserviceprovider"
            ),
            enable_agentic_context=True,  # Enable enhanced coordination
            markdown=True,
            show_tool_calls=True
        )
        
        return research_team
    
    def run_research(self, query: str, user_id: Optional[str] = None) -> str:
        """Run coordinated research analysis"""
        try:
            logger.info(f"Starting research analysis for query: {query}")
            
            # Add user context if provided
            if user_id:
                research_query = f"Research request from user {user_id}: {query}"
            else:
                research_query = query
            
            # Execute the research using the coordinated team
            response = self.team.run(research_query)
            
            # Extract the content
            content = response.content if hasattr(response, 'content') else str(response)
            
            logger.info("Research analysis completed successfully")
            return content
            
        except Exception as e:
            logger.error(f"Research analysis failed: {e}")
            return f"Research analysis failed: {str(e)}"
    
    async def arun_research(self, query: str, user_id: Optional[str] = None) -> str:
        """Async version of research analysis"""
        try:
            logger.info(f"Starting async research analysis for query: {query}")
            
            # Add user context if provided
            if user_id:
                research_query = f"Research request from user {user_id}: {query}"
            else:
                research_query = query
            
            # Execute the research using the coordinated team
            response = await self.team.arun(research_query)
            
            # Extract the content
            content = response.content if hasattr(response, 'content') else str(response)
            
            logger.info("Async research analysis completed successfully")
            return content
            
        except Exception as e:
            logger.error(f"Async research analysis failed: {e}")
            return f"Research analysis failed: {str(e)}"

# Create a global instance that can be imported by playground
def create_sonic_research_team(mongodb_uri: str) -> SonicResearchTeam:
    """Factory function to create research team instance"""
    return SonicResearchTeam(mongodb_uri)

if __name__ == "__main__":
    # Test the research team
    mongodb_uri = os.getenv("MONGODB_URI", "")
    if mongodb_uri:
        team = create_sonic_research_team(mongodb_uri)
        result = team.run_research("What are the current DeFi opportunities in the Sonic ecosystem?")
        print(result)
    else:
        print("MONGODB_URI not set")