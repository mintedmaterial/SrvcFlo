 #!/usr/bin/env python3
"""
Sonic Finance Team - Investment Report Generator Pattern
Multi-agent financial analysis system following Agno investment-report-generator workflow
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
from Tools.finance_research_tools import DexScreenerAPI
from Tools.paintswap_tools import PaintswapAPI

logger = logging.getLogger(__name__)

class SonicFinanceTeam:
    """
    Sonic Finance Team following investment-report-generator pattern
    Three specialized agents: Market Analyst → Research Analyst → Investment Strategist
    """
    
    def __init__(self, mongodb_uri: str):
        self.mongodb_uri = mongodb_uri
        self.team = self._create_finance_team()
    
    def _create_market_analyst(self) -> Agent:
        """Create Market Analyst agent (equivalent to Stock Analyst in investment-report-generator)"""
        
        def get_sonic_market_data(query: str = "overview") -> str:
            """Get comprehensive Sonic ecosystem market data
            
            Args:
                query (str): Type of data to retrieve (overview, pairs, trending, yield)
                
            Returns:
                str: JSON formatted market data
            """
            try:
                api = DexScreenerAPI()
                
                if query.lower() == "overview":
                    data = api.get_market_overview()
                elif query.lower() == "pairs":
                    data = api.get_sonic_pairs(50)
                elif query.lower() == "trending":
                    data = api.get_trending_tokens("sonic", 20)
                elif query.lower() == "yield":
                    data = api.calculate_yield_opportunities(10000)
                else:
                    data = api.get_market_overview()
                
                return f"Market Data ({query}): {str(data)}"
            except Exception as e:
                return f"Error fetching market data: {str(e)}"
        
        def analyze_token_metrics(token_address: str = "") -> str:
            """Analyze specific token metrics and performance
            
            Args:
                token_address (str): Token contract address to analyze
                
            Returns:
                str: Token analysis results
            """
            try:
                api = DexScreenerAPI()
                
                if token_address:
                    data = api.get_token_info(token_address)
                else:
                    # Analyze top Sonic tokens
                    data = api.get_sonic_pairs(10)
                
                return f"Token Analysis: {str(data)}"
            except Exception as e:
                return f"Error analyzing token: {str(e)}"
        
        def get_nft_market_data() -> str:
            """Get Sonic NFT marketplace data from Paintswap
            
            Returns:
                str: NFT market analysis
            """
            try:
                api = PaintswapAPI()
                
                # Get top collections and market trends
                collections = api.get_top_collections(10)
                trends = api.get_market_trends()
                
                return f"NFT Market Data - Collections: {str(collections)}, Trends: {str(trends)}"
            except Exception as e:
                return f"Error fetching NFT data: {str(e)}"
        
        return Agent(
            name="Sonic Market Analyst",
            model=OpenAIChat(id="gpt-4o"),
            tools=[
                DuckDuckGoTools(), 
                get_sonic_market_data, 
                analyze_token_metrics,
                get_nft_market_data
            ],
            instructions=[
                "You are a Market Analyst specializing in comprehensive Sonic ecosystem analysis.",
                "Your role parallels a stock analyst but for the Sonic blockchain ecosystem.",
                "",
                "PRIMARY RESPONSIBILITIES:",
                "- Conduct thorough market analysis of Sonic DeFi protocols",
                "- Analyze token performance, trading volumes, and price movements",
                "- Evaluate liquidity pools and DEX pair performance",
                "- Assess NFT marketplace activity and trends",
                "- Research yield farming and staking opportunities",
                "",
                "ANALYSIS FRAMEWORK:",
                "- Market cap and fully diluted valuation analysis",
                "- Trading volume and liquidity depth assessment",
                "- Price action and technical indicator analysis",
                "- Comparative analysis with other L1/L2 solutions",
                "- Risk-adjusted returns calculation",
                "",
                "OUTPUT REQUIREMENTS:",
                "- Provide specific metrics, numbers, and percentages",
                "- Include data sources and timestamps",
                "- Highlight key trends and patterns",
                "- Identify potential opportunities and risks",
                "- Use the market data tools for current information"
            ],
            storage=MongoDbStorage(
                collection_name="sonic_market_analyst",
                db_url=self.mongodb_uri,
                db_name="myserviceprovider"
            ),
            # memory=Memory(  # Disabled for playground reliability
            #     model=OpenAIChat(id="gpt-4o"),
            #     db=MongoMemoryDb(
            #         collection_name="sonic_market_analyst_memories",
            #         db_url=self.mongodb_uri,
            #         db_name="myserviceprovider"
            #     )
            # ),
            markdown=True,
            show_tool_calls=True
        )
    
    def _create_research_analyst(self) -> Agent:
        """Create Research Analyst agent for evaluation and ranking"""
        
        def calculate_risk_metrics(protocol_data: str) -> str:
            """Calculate risk metrics for DeFi protocols
            
            Args:
                protocol_data (str): Protocol information to analyze
                
            Returns:
                str: Risk assessment results
            """
            # Simplified risk calculation - would use more sophisticated models in production
            risk_factors = [
                "Smart contract audits",
                "TVL stability", 
                "Team transparency",
                "Token distribution",
                "Liquidity depth"
            ]
            
            return f"Risk Analysis for: {protocol_data}. Key factors: {', '.join(risk_factors)}"
        
        def rank_investment_opportunities(opportunities: List[str]) -> str:
            """Rank DeFi opportunities by investment potential
            
            Args:
                opportunities (List[str]): List of opportunities to rank
                
            Returns:
                str: Ranked opportunities with scoring
            """
            # Simplified ranking algorithm
            scoring_criteria = {
                "yield_potential": 0.3,
                "risk_level": 0.25,
                "liquidity": 0.2,
                "team_quality": 0.15,
                "innovation": 0.1
            }
            
            return f"Investment Ranking based on: {str(scoring_criteria)}. Opportunities: {str(opportunities)}"
        
        return Agent(
            name="Sonic Research Analyst", 
            model=OpenAIChat(id="gpt-4o"),
            tools=[DuckDuckGoTools(), calculate_risk_metrics, rank_investment_opportunities],
            instructions=[
                "You are a Research Analyst focused on evaluating and ranking Sonic ecosystem investment opportunities.",
                "You analyze the market data provided by the Market Analyst and create investment rankings.",
                "",
                "CORE RESPONSIBILITIES:",
                "- Evaluate DeFi protocols for investment potential",
                "- Rank opportunities based on risk-adjusted returns",
                "- Assess competitive advantages and moats",
                "- Analyze team quality and development activity",
                "- Calculate risk metrics and safety scores",
                "",
                "EVALUATION CRITERIA:",
                "- Yield potential and sustainability",
                "- Protocol security and audit status", 
                "- Total Value Locked (TVL) trends",
                "- Token economics and inflation rates",
                "- Community adoption and governance",
                "- Technical innovation and differentiation",
                "",
                "RANKING METHODOLOGY:",
                "1. Assign scores across multiple dimensions",
                "2. Weight factors by importance and risk",
                "3. Consider correlation and diversification benefits",
                "4. Account for market conditions and timing",
                "5. Provide clear rationale for each ranking",
                "",
                "OUTPUT FORMAT:",
                "- Tier 1: High conviction, low-medium risk",
                "- Tier 2: Medium conviction, medium risk", 
                "- Tier 3: Speculative, high risk/reward",
                "- Include specific reasons for each tier placement"
            ],
            storage=MongoDbStorage(
                collection_name="sonic_research_analyst",
                db_url=self.mongodb_uri,
                db_name="myserviceprovider"
            ),
            memory=Memory(
                model=OpenAIChat(id="gpt-4o"),
                db=MongoMemoryDb(
                    collection_name="sonic_research_analyst_memories",
                    db_url=self.mongodb_uri,
                    db_name="myserviceprovider"
                )
            ),
            markdown=True,
            show_tool_calls=True
        )
    
    def _create_investment_strategist(self) -> Agent:
        """Create Investment Strategist agent (equivalent to Investment Lead)"""
        
        def create_portfolio_allocation(ranked_opportunities: str, risk_level: str = "medium") -> str:
            """Create portfolio allocation strategy
            
            Args:
                ranked_opportunities (str): Ranked investment opportunities
                risk_level (str): Risk tolerance (low, medium, high)
                
            Returns:
                str: Portfolio allocation recommendations
            """
            allocations = {
                "low": {"tier_1": 70, "tier_2": 25, "tier_3": 5},
                "medium": {"tier_1": 50, "tier_2": 35, "tier_3": 15},
                "high": {"tier_1": 30, "tier_2": 40, "tier_3": 30}
            }
            
            allocation = allocations.get(risk_level, allocations["medium"])
            
            return f"Portfolio Allocation ({risk_level} risk): {str(allocation)}. Based on: {ranked_opportunities}"
        
        def generate_execution_plan(strategy: str) -> str:
            """Generate step-by-step execution plan
            
            Args:
                strategy (str): Investment strategy to execute
                
            Returns:
                str: Detailed execution plan
            """
            execution_steps = [
                "1. Wallet setup and security measures",
                "2. Capital allocation and staging",
                "3. DeFi protocol interaction sequence", 
                "4. Risk management and stop-loss levels",
                "5. Monitoring and rebalancing schedule"
            ]
            
            return f"Execution Plan for: {strategy}. Steps: {'; '.join(execution_steps)}"
        
        return Agent(
            name="Sonic Investment Strategist",
            model=OpenAIChat(id="gpt-4o"),
            tools=[DuckDuckGoTools(), create_portfolio_allocation, generate_execution_plan],
            instructions=[
                "You are an Investment Strategist developing comprehensive DeFi investment strategies for the Sonic ecosystem.",
                "You synthesize market analysis and research rankings into actionable investment plans.",
                "",
                "STRATEGIC RESPONSIBILITIES:",
                "- Develop portfolio allocation strategies",
                "- Create risk management frameworks", 
                "- Design execution roadmaps and timelines",
                "- Provide investment rationale and thesis",
                "- Recommend monitoring and rebalancing protocols",
                "",
                "PORTFOLIO CONSTRUCTION:",
                "- Diversification across protocol types (DEX, lending, yield)",
                "- Risk-adjusted position sizing",
                "- Correlation analysis and concentration limits",
                "- Liquidity requirements and exit strategies",
                "- Tax optimization considerations",
                "",
                "RISK MANAGEMENT:",
                "- Maximum drawdown limits per position",
                "- Stop-loss and take-profit levels",
                "- Hedging strategies using derivatives",
                "- Smart contract risk mitigation",
                "- Regulatory and compliance considerations",
                "",
                "EXECUTION GUIDANCE:",
                "- Optimal entry timing and market conditions",
                "- Gas optimization and transaction batching",
                "- Slippage management for large positions",
                "- Gradual deployment vs. lump sum strategies",
                "- Performance tracking and KPI definitions",
                "",
                "DELIVERABLES:",
                "- Complete investment thesis and rationale",
                "- Portfolio allocation with specific percentages",
                "- Step-by-step execution plan",
                "- Risk management protocols",
                "- Performance monitoring framework"
            ],
            storage=MongoDbStorage(
                collection_name="sonic_investment_strategist",
                db_url=self.mongodb_uri,
                db_name="myserviceprovider"
            ),
            memory=Memory(
                model=OpenAIChat(id="gpt-4o"),
                db=MongoMemoryDb(
                    collection_name="sonic_investment_strategist_memories",
                    db_url=self.mongodb_uri,
                    db_name="myserviceprovider"
                )
            ),
            markdown=True,
            show_tool_calls=True
        )
    
    def _create_finance_team(self) -> Team:
        """Create the coordinated finance team following investment-report-generator pattern"""
        
        # Create the three specialized agents
        market_analyst = self._create_market_analyst()
        research_analyst = self._create_research_analyst()
        investment_strategist = self._create_investment_strategist()
        
        # Create the coordinating team
        finance_team = Team(
            name="Sonic Finance Investment Team",
            mode="coordinate",  # Hierarchical coordination
            model=OpenAIChat(id="gpt-4o"),
            members=[market_analyst, research_analyst, investment_strategist],
            instructions=[
                "You are the Finance Team Lead coordinating comprehensive Sonic DeFi investment analysis.",
                "Your team follows the investment-report-generator workflow:",
                "",
                "TEAM STRUCTURE:",
                "1. Sonic Market Analyst - Comprehensive market data and analysis",
                "2. Sonic Research Analyst - Evaluation, ranking, and risk assessment", 
                "3. Sonic Investment Strategist - Portfolio strategy and execution plans",
                "",
                "COORDINATION WORKFLOW:",
                "1. Market Analyst conducts thorough ecosystem analysis",
                "2. Research Analyst evaluates and ranks opportunities",
                "3. Investment Strategist creates portfolio allocation and execution plan",
                "4. Team Lead synthesizes into comprehensive investment report",
                "",
                "INVESTMENT REPORT STRUCTURE:",
                "# Executive Summary",
                "- Key investment thesis and recommendations",
                "- Top 3 opportunities with expected returns",
                "- Primary risks and mitigation strategies",
                "",
                "# Market Analysis", 
                "- Sonic ecosystem overview and trends",
                "- DeFi protocol landscape and metrics",
                "- Competitive positioning analysis",
                "",
                "# Investment Opportunities",
                "- Tier 1: High conviction recommendations",
                "- Tier 2: Medium conviction opportunities", 
                "- Tier 3: Speculative high-risk/reward plays",
                "",
                "# Portfolio Strategy",
                "- Recommended allocation percentages",
                "- Risk management protocols",
                "- Execution timeline and entry strategies",
                "",
                "# Risk Assessment",
                "- Smart contract risks and mitigation",
                "- Market risks and hedging strategies", 
                "- Regulatory and operational considerations",
                "",
                "QUALITY STANDARDS:",
                "- All recommendations backed by specific data",
                "- Include expected returns and risk metrics",
                "- Provide clear rationale for each decision",
                "- Consider multiple scenarios and contingencies"
            ],
            storage=MongoDbStorage(
                collection_name="sonic_finance_team",
                db_url=self.mongodb_uri,
                db_name="myserviceprovider"
            ),
            enable_agentic_context=True,
            markdown=True,
            show_tool_calls=True
        )
        
        return finance_team
    
    def generate_investment_report(self, query: str, risk_level: str = "medium") -> str:
        """Generate comprehensive investment report"""
        try:
            logger.info(f"Generating investment report for: {query}")
            
            # Format the query with context
            investment_query = f"""Generate a comprehensive Sonic DeFi investment report for: {query}
            
Risk Level: {risk_level}
            
Please follow the investment-report-generator workflow:
1. Market Analysis (current state, opportunities, trends)
2. Opportunity Evaluation (ranking by risk-adjusted returns)
3. Investment Strategy (portfolio allocation, execution plan)

Focus on actionable recommendations with specific metrics."""
            
            # Execute using the coordinated team
            response = self.team.run(investment_query)
            
            # Extract content
            content = response.content if hasattr(response, 'content') else str(response)
            
            logger.info("Investment report generated successfully")
            return content
            
        except Exception as e:
            logger.error(f"Investment report generation failed: {e}")
            return f"Investment report generation failed: {str(e)}"
    
    async def agenerate_investment_report(self, query: str, risk_level: str = "medium") -> str:
        """Async version of investment report generation"""
        try:
            logger.info(f"Generating async investment report for: {query}")
            
            # Format the query with context
            investment_query = f"""Generate a comprehensive Sonic DeFi investment report for: {query}
            
Risk Level: {risk_level}
            
Please follow the investment-report-generator workflow:
1. Market Analysis (current state, opportunities, trends)
2. Opportunity Evaluation (ranking by risk-adjusted returns) 
3. Investment Strategy (portfolio allocation, execution plan)

Focus on actionable recommendations with specific metrics."""
            
            # Execute using the coordinated team
            response = await self.team.arun(investment_query)
            
            # Extract content
            content = response.content if hasattr(response, 'content') else str(response)
            
            logger.info("Async investment report generated successfully")
            return content
            
        except Exception as e:
            logger.error(f"Async investment report generation failed: {e}")
            return f"Investment report generation failed: {str(e)}"

# Factory function for integration
def create_sonic_finance_team(mongodb_uri: str) -> SonicFinanceTeam:
    """Factory function to create finance team instance"""
    return SonicFinanceTeam(mongodb_uri)

if __name__ == "__main__":
    # Test the finance team
    mongodb_uri = os.getenv("MONGODB_URI", "")
    if mongodb_uri:
        team = create_sonic_finance_team(mongodb_uri)
        result = team.generate_investment_report("Best yield farming opportunities in Sonic DeFi")
        print(result)
    else:
        print("MONGODB_URI not set")