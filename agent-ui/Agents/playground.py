#!/usr/bin/env python3
"""
ServiceFlow AI Playground - Standard Agno Implementation
Back to basics - simple Agent objects passed directly to Playground
"""

import os
import sys
import asyncio
import logging
from dotenv import load_dotenv

# Core Agno imports
from agno.agent import Agent
from agno.playground import Playground
from agno.models.openai import OpenAIChat
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.mcp import MCPTools
from agno.tools.discord import DiscordTools
from agno.tools.x import XTools
# Memory disabled for playground simplicity

# Import existing agents
try:
    from agno_assist_simple import agno_assist
    AGNO_ASSIST_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Agno Assist not available: {e}")
    agno_assist = None
    AGNO_ASSIST_AVAILABLE = False

from google_agent import GoogleAgent
from teams.sonic_finance_team import create_sonic_finance_team
from ecosystem_analyst_agent import ecosystem_analyst_agent
from nft_market_analyst_agent import nft_market_analyst_agent

# Import custom tools
try:
    from Tools.dalle_tools import generate_dalle_image, generate_sonic_themed_image, get_dalle_user_stats
    DALLE_TOOLS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: DALL-E tools not available: {e}")
    DALLE_TOOLS_AVAILABLE = False

# Import pools report tools
try:
    from Tools.pools_report import (
        fetch_sonic_pairs, get_sonic_pairs, fetch_equalizer_pools, get_equalizer_pools,
        fetch_beets_pools, get_beets_pools, get_listed_nfts, search_listings, 
        get_marketplace_stats, get_collection_metadata, generate_nft_market_report,
        get_collections_by_volume, get_top_nft_sales, get_collection_floor_price
    )
    POOLS_REPORT_TOOLS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Pools report tools not available: {e}")
    POOLS_REPORT_TOOLS_AVAILABLE = False

# Import finance research tools
try:
    from Tools.finance_research_tools import (
        DexScreenerAPI, get_sonic_trading_pairs, search_token_pairs, 
        get_token_analysis, get_trending_sonic_tokens, analyze_arbitrage_opportunities,
        get_defi_market_overview, calculate_yield_farming_opportunities
    )
    FINANCE_TOOLS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Finance research tools not available: {e}")
    FINANCE_TOOLS_AVAILABLE = False

# Import ChainGPT audit tool
try:
    from Tools.chaingpt_audit_tool import audit_contract_with_chaingpt
    CHAINGPT_AUDIT_AVAILABLE = True
except ImportError as e:
    print(f"Warning: ChainGPT audit tool not available: {e}")
    CHAINGPT_AUDIT_AVAILABLE = False

# Import PaintSwap NFT tools
try:
    from Tools.paintswap_tools import (
        get_top_nft_collections, get_nft_collection_stats, search_nft_assets,
        get_user_nft_portfolio, get_nft_market_trends, analyze_collection_rarity,
        get_collection_price_history
    )
    PAINTSWAP_TOOLS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: PaintSwap NFT tools not available: {e}")
    PAINTSWAP_TOOLS_AVAILABLE = False

# Import Discord tools
try:
    from Tools.discord_monitoring_tools import (
        process_discord_message, get_discord_channel_info, format_discord_response
    )
    DISCORD_TOOLS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Discord tools not available: {e}")
    DISCORD_TOOLS_AVAILABLE = False

# Use standard Agno storage for simplicity
from agno.storage.sqlite import SqliteStorage

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# ENVIRONMENT VARIABLE VALIDATION WITH FALLBACKS
# ============================================================================

def verify_environment_variables():
    """Verify environment variables with fallbacks"""
    required_vars = {
        "OPENAI_API_KEY": "OpenAI API access",
    }
    
    missing_vars = []
    for var, description in required_vars.items():
        if not os.getenv(var):
            missing_vars.append(f"{var} ({description})")
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
    
    # Check MongoDB URI with fallback
    mongodb_uri = os.getenv("MONGODB_URI") or os.getenv("MONGODB_URL")
    if not mongodb_uri:
        logger.warning("MongoDB not configured, using fallback")
        mongodb_uri = "mongodb://localhost:27017/myserviceprovider"  # Default fallback
        logger.info(f"Using fallback MongoDB URI: {mongodb_uri}")
    
    return mongodb_uri

# Verify environment and get MongoDB URI
try:
    mongodb_uri = verify_environment_variables()
except ValueError as e:
    print(f"❌ Environment validation failed: {e}")
    sys.exit(1)

# ============================================================================
# STORAGE AND MEMORY SETUP - Using SQLite for Reliability
# ============================================================================

def get_sqlite_storage_for_agent(agent_name):
    """Create SQLite storage for an agent"""
    return SqliteStorage(
        table_name=agent_name,
        db_file=f"tmp/{agent_name}.db"
    )

# Individual agent storage using SQLite
lead_gen_storage = get_sqlite_storage_for_agent("lead_generation_agent")
content_creation_storage = get_sqlite_storage_for_agent("content_creation_agent")
facebook_storage = get_sqlite_storage_for_agent("facebook_agent")
google_storage = get_sqlite_storage_for_agent("google_agent")
dalle_storage = get_sqlite_storage_for_agent("dalle_agent")
research_coordinator_storage = get_sqlite_storage_for_agent("research_coordinator")
data_scraper_storage = get_sqlite_storage_for_agent("data_scraper_agent")
smart_contract_storage = get_sqlite_storage_for_agent("smart_contract_agent")
nft_analyst_storage = get_sqlite_storage_for_agent("nft_analyst_agent")

# Memory disabled for playground simplicity and reliability

# Memory instances removed for simplicity

# ============================================================================
# AGENT DEFINITIONS - Direct Agent() Objects Like Working Version
# ============================================================================

# Lead Generation Agent
lead_generation_agent = Agent(
    name="Lead Generation Agent",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],
    instructions=["Scrape social media for leads based on provider-defined keywords.", "Always include sources"],
    storage=lead_gen_storage,
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

# Content Creation Agent  
content_creation_agent = Agent(
    name="Content Creation Agent",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools(), DiscordTools(), XTools()],
    instructions=[
        "Generate social media posts for ServiceFlow AI to promote small business automation.",
        "Create posts about automation benefits, how-to guides, and recommended tools.",
        "Use DuckDuckGoTools to find recent articles and insights on automation to inform content.",
        "Keep posts concise and engaging, with emojis and hashtags (#Automation, #SmallBusiness, #ServiceFlowAI).",
        "Include links to https://serviceflow.com where relevant.",
        "",
        "🔐 ADMIN-ONLY SOCIAL TOOLS:",
        "- Discord Tools: Admin use for community management and announcements",
        "- X/Twitter Tools: Admin use for content publishing and brand management", 
        "- These tools are NOT accessible to general users - only for team operations",
        "",
        "When using social tools, focus on professional content that drives ServiceFlow AI growth."
    ],
    storage=content_creation_storage,
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

# Facebook Agent using MCP
facebook_agent = Agent(
    name="Facebook Page Manager",
    model=OpenAIChat(id="gpt-4o"),
    tools=[MCPTools(
        command="python Agents/facebook_mcp/server.py",
        env={
            "FACEBOOK_ACCESS_TOKEN": os.getenv("FACEBOOK_ACCESS_TOKEN"),
            "FACEBOOK_APP_ID": os.getenv("FACEBOOK_APP_ID"),
            "FACEBOOK_APP_SECRET": os.getenv("FACEBOOK_APP_SECRET"),
            **os.environ
        }
    )],
    instructions=[
        "You are a Facebook Page management assistant that can help with posting content, managing comments, and analyzing engagement.",
        "You can create posts, reply to comments, hide/unhide comments, and get insights about post performance.",
        "Always confirm before taking actions that modify content (posting, deleting, etc.).",
        "When showing insights, present the data in a clear, structured format with appropriate markdown formatting."
    ],
    storage=facebook_storage,
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

# Google Agent (simplified for playground)
google_agent = Agent(
    name="Google Services Manager",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],  # Simplified tools for playground
    instructions=[
        "You are a Google services assistant.",
        "Help with Gmail and Google Calendar related queries.",
        "Provide helpful guidance and information about Google services.",
    ],
    storage=google_storage,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

# DALL-E Agent
dalle_tools = [DuckDuckGoTools()]
if DALLE_TOOLS_AVAILABLE:
    dalle_tools.extend([generate_dalle_image, generate_sonic_themed_image, get_dalle_user_stats])

dalle_agent = Agent(
    name="DALLE AI Image Generator",
    model=OpenAIChat(id="gpt-4o"),
    tools=dalle_tools,
    instructions=[
        "You are an AI image generation specialist using DALL-E technology.",
        "You have access to powerful image generation tools:",
        "- generate_dalle_image: Create images from detailed prompts",
        "- generate_sonic_themed_image: Create Sonic blockchain themed images", 
        "- get_dalle_user_stats: Get user generation statistics",
        "",
        "Help users create detailed prompts for image generation.",
        "Use the appropriate generation tool based on the request.",
        "For Sonic/blockchain related images, use generate_sonic_themed_image.",
        "Always provide the image URL and explain the generation process.",
        "Ask clarifying questions to understand the user's vision better."
    ],
    storage=dalle_storage,
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

# Research Coordinator Agent
research_tools = [DuckDuckGoTools()]
if POOLS_REPORT_TOOLS_AVAILABLE:
    research_tools.extend([
        fetch_sonic_pairs, get_sonic_pairs, fetch_equalizer_pools, get_equalizer_pools,
        fetch_beets_pools, get_beets_pools, get_listed_nfts, search_listings, 
        get_marketplace_stats, get_collection_metadata, generate_nft_market_report,
        get_collections_by_volume, get_top_nft_sales, get_collection_floor_price
    ])
if PAINTSWAP_TOOLS_AVAILABLE:
    research_tools.extend([
        get_top_nft_collections, get_nft_collection_stats, search_nft_assets,
        get_user_nft_portfolio, get_nft_market_trends, analyze_collection_rarity,
        get_collection_price_history
    ])

research_coordinator = Agent(
    name="Sonic Research Coordinator",
    model=OpenAIChat(id="gpt-4o"),
    tools=research_tools,
    instructions=[
        "You coordinate research efforts across the Sonic ecosystem and ServiceFlow AI platform.",
        "You have access to comprehensive Sonic DeFi and NFT market data tools:",
        "- Sonic DEX pairs and trading data (fetch_sonic_pairs, get_sonic_pairs)",
        "- Liquidity pools from Equalizer, Beets protocols", 
        "- NFT marketplace data from Paintswap (listings, sales, floor prices)",
        "- Advanced NFT analytics (get_top_nft_collections, get_nft_collection_stats)",
        "- NFT market trends and rarity analysis (get_nft_market_trends, analyze_collection_rarity)",
        "- User portfolio analysis and price history (get_user_nft_portfolio, get_collection_price_history)",
        "- Market statistics and analytics (generate_nft_market_report)",
        "",
        "You analyze market trends, competitor activities, and emerging opportunities.",
        "Use the specific data tools to gather current market information.",
        "Leverage both DeFi and NFT tools for comprehensive ecosystem analysis.",
        "You provide strategic insights and data-driven recommendations.",
        "Always fetch fresh data before making analysis conclusions.",
        "Always cite sources and provide actionable intelligence with specific metrics."
    ],
    storage=research_coordinator_storage,
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

# Data Scraper Agent
data_scraper_agent = Agent(
    name="Universal Data Scraper",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],
    instructions=[
        "You are a comprehensive data scraping specialist that can extract information from websites and online sources.",
        "You can accept URLs provided by users and scrape the content.",
        "You can also search for information using DuckDuckGo when no specific URL is provided.",
        "Always respect robots.txt and rate limiting when scraping websites.",
        "Provide structured, organized data output with clear source attribution.",
        "Ask users to specify the URL and what specific data they want extracted."
    ],
    storage=data_scraper_storage,
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

# Smart Contract Agent
def read_contract_file(file_path: str) -> str:
    """Read a Solidity contract file"""
    try:
        from pathlib import Path
        contracts_dir = Path("C:/Users/PC/ServiceApp/myserviceprovider-app/Contracts")
        full_path = contracts_dir / file_path
        
        if not full_path.exists():
            matching_files = list(contracts_dir.glob(f"**/*{file_path}*"))
            if matching_files:
                full_path = matching_files[0]
            else:
                return f"Contract file '{file_path}' not found in {contracts_dir}"
        
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        return f"Contract: {full_path.name}\n\n{content}"
        
    except Exception as e:
        return f"Error reading contract file: {str(e)}"

# Smart Contract Agent
smart_contract_tools = [DuckDuckGoTools(), read_contract_file]
if CHAINGPT_AUDIT_AVAILABLE:
    smart_contract_tools.append(audit_contract_with_chaingpt)

smart_contract_agent = Agent(
    name="Smart Contract Analyst",
    model=OpenAIChat(id="gpt-4o"),
    tools=smart_contract_tools,
    instructions=[
        "You are a specialized Smart Contract Analysis Agent for ServiceFlow AI blockchain contracts.",
        "You have expert knowledge of Solidity, EVM, and smart contract security.",
        "You have access to professional audit tools:",
        "- read_contract_file: Read contracts from the Contracts directory",
        "- audit_contract_with_chaingpt: Professional audit using ChainGPT API",
        "",
        "You analyze ServiceFlow AI smart contracts (SonicPaymentTestnet.sol, BanditKidzStaking.sol, etc.)",
        "You explain contract functions, state variables, and interactions.",
        "You detail payment splits and tokenomics (15% leaderboard, 50% dev, 25% staking).",
        "Use read_contract_file() to examine specific contracts from the Contracts directory.",
        "Use audit_contract_with_chaingpt() for professional security audits.",
        "Always provide security considerations and best practice recommendations."
    ],
    storage=smart_contract_storage,
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

# NFT Market Analyst Agent
nft_analyst_agent = Agent(
    name="NFT Market Analyst",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],
    instructions=[
        "You are an expert NFT market analyst specializing in the Sonic ecosystem.",
        "You analyze NFT collection performance, trading volumes, and market trends.",
        "You provide insights on NFT valuations, rarity analysis, and investment opportunities.",
        "You track marketplace activity on platforms like Paintswap.",
        "Always provide data-driven analysis with specific metrics and trends."
    ],
    storage=nft_analyst_storage,
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

# Create Team (optional)
try:
    sonic_finance_team = create_sonic_finance_team(mongodb_uri).team  # Access the internal Team object
    TEAM_AVAILABLE = True
except Exception as e:
    print(f"Warning: Sonic Finance Team not available: {e}")
    sonic_finance_team = None
    TEAM_AVAILABLE = False

# ============================================================================
# SAFE AGENT VALIDATION - KEEPING ORIGINAL LIST PATTERN
# ============================================================================

def get_or_create_agent_safely(agent_name: str, agent_obj):
    """Safely validate an agent with error handling"""
    try:
        # Verify it's an actual Agent object
        if hasattr(agent_obj, 'name') and hasattr(agent_obj, 'model'):
            logger.info(f"✅ {agent_name} validated successfully")
            return agent_obj
        else:
            logger.warning(f"❌ {agent_name} is not a valid Agent object")
            return None
    except Exception as e:
        logger.error(f"❌ Failed to validate {agent_name}: {e}")
        return None

# ============================================================================
# AGENT AND TEAM LISTS - ORIGINAL PATTERN WITH VALIDATION
# ============================================================================

# Discord Community Agent
discord_tools = [DuckDuckGoTools()]
if DISCORD_TOOLS_AVAILABLE:
    discord_tools.extend([
        process_discord_message, get_discord_channel_info, format_discord_response
    ])

discord_agent = Agent(
    name="Discord Community Manager",
    model=OpenAIChat(id="gpt-4o"),
    tools=discord_tools,
    instructions=[
        "You are the Discord Community Manager for ServiceFlow AI.",
        "You have access to Discord channel management tools:",
        "- process_discord_message: Process messages from specific Discord channels",
        "- get_discord_channel_info: Get information about Discord channels", 
        "- format_discord_response: Format responses for different channel types",
        "",
        "You manage 10 specific Discord channels with different purposes:",
        "🔒 boardroom-og-only: Team-only strategic discussions",
        "💬 srvcflo-general: General user interaction", 
        "🏛️ dao-holder-discussion: DAO governance discussions",
        "🎨 vote-generation-leaderboard: AI generation voting",
        "🖼️ nft-screen: NFT transaction monitoring",
        "🐦 twitter-feed: Social media updates",
        "📊 sonic-data-feed: Blockchain data updates",
        "💰 defi-alpha: DeFi opportunities and analysis",
        "🔧 dev-updates: Development progress",
        "🚀 announcements: Official announcements",
        "",
        "Always use appropriate formatting for each channel type.",
        "Maintain professional tone while being engaging and helpful.",
        "Use Discord markdown formatting and appropriate emojis."
    ],
    storage=get_sqlite_storage_for_agent("discord_community_manager"),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

# Enhanced Ecosystem Analyst with Finance Tools
ecosystem_tools = [DuckDuckGoTools()]
if FINANCE_TOOLS_AVAILABLE:
    ecosystem_tools.extend([
        get_sonic_trading_pairs, search_token_pairs, get_token_analysis,
        get_trending_sonic_tokens, analyze_arbitrage_opportunities,
        get_defi_market_overview, calculate_yield_farming_opportunities
    ])

enhanced_ecosystem_analyst = Agent(
    name="Ecosystem Analyst",
    model=OpenAIChat(id="gpt-4o"),
    tools=ecosystem_tools,
    instructions=[
        "You are a crypto ecosystem analyst specializing in Sonic blockchain.",
        "You have access to advanced DeFi analysis tools:",
        "- get_sonic_trading_pairs: Get top trading pairs with liquidity data",
        "- search_token_pairs: Search for specific tokens and pairs",
        "- get_token_analysis: Deep dive analysis of specific tokens",
        "- get_trending_sonic_tokens: Identify trending opportunities", 
        "- analyze_arbitrage_opportunities: Find cross-DEX arbitrage",
        "- get_defi_market_overview: Comprehensive market metrics",
        "- calculate_yield_farming_opportunities: Yield farming analysis",
        "",
        "Analyze market trends, token performance, and DeFi metrics.",
        "Use real-time data tools to gather current market information.",
        "Provide data-driven insights and actionable intelligence.",
        "Focus on specific metrics: liquidity, volume, price changes, APY.",
        "Always include sources, confidence levels, and risk assessments."
    ],
    storage=get_sqlite_storage_for_agent("ecosystem_analyst"),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

# Create simple list of agents - keeping original pattern but with validation
agents_list = []

# Define all agents to validate
agent_candidates = [
    ("Lead Generation Agent", lead_generation_agent),
    ("Content Creation Agent", content_creation_agent),
    ("Facebook Agent", facebook_agent),
    ("Google Agent", google_agent),
    ("DALLE Agent", dalle_agent),
    ("Research Coordinator", research_coordinator),
    ("Data Scraper Agent", data_scraper_agent),
    ("Smart Contract Agent", smart_contract_agent),
    ("NFT Analyst Agent", nft_analyst_agent),
    ("Ecosystem Analyst", enhanced_ecosystem_analyst),
    ("NFT Market Analyst", nft_market_analyst_agent),
    ("Discord Community Manager", discord_agent),
]

# Validate and add agents to list
for agent_name, agent_obj in agent_candidates:
    validated_agent = get_or_create_agent_safely(agent_name, agent_obj)
    if validated_agent is not None:
        agents_list.append(validated_agent)

# Add agno_assist if available
if AGNO_ASSIST_AVAILABLE and agno_assist:
    validated_agno = get_or_create_agent_safely("Agno Assist", agno_assist)
    if validated_agno is not None:
        agents_list.append(validated_agno)

# Teams list - keeping original pattern
teams_list = []
if TEAM_AVAILABLE and sonic_finance_team:
    try:
        # Basic validation for team
        if hasattr(sonic_finance_team, 'agents') or hasattr(sonic_finance_team, 'name'):
            teams_list.append(sonic_finance_team)
            logger.info("✅ Sonic Finance Team added successfully")
        else:
            logger.warning("❌ Sonic Finance Team is not a valid Team object")
    except Exception as e:
        logger.error(f"❌ Failed to validate Sonic Finance Team: {e}")

# Validate we have agents
if not agents_list:
    logger.error("❌ No valid agents available!")
    print("❌ No valid agents available - check agent definitions")
    sys.exit(1)

logger.info(f"✅ Successfully loaded {len(agents_list)} agents and {len(teams_list)} teams")

# ============================================================================
# PLAYGROUND SETUP - Following Agno Documentation Pattern
# ============================================================================

# Create playground at module level for ASGI
if teams_list:
    playground_app = Playground(agents=agents_list, teams=teams_list)
else:
    playground_app = Playground(agents=agents_list)

# Create the FastAPI app instance at module level
app = playground_app.get_app()

# Add Discord bot endpoint
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

class DiscordChatRequest(BaseModel):
    agent_name: str
    message: str
    channel_context: dict = {}

@app.post("/chat")
async def discord_chat_endpoint(request: DiscordChatRequest):
    """Chat endpoint for Discord bot integration"""
    try:
        # Find the agent by name
        agent = None
        for a in agents_list:
            if a.name.lower().replace(" ", "_") == request.agent_name.lower().replace(" ", "_"):
                agent = a
                break
            # Also try exact name match
            if a.name == request.agent_name:
                agent = a
                break
        
        if not agent:
            # Return available agents for debugging
            available_agents = [a.name for a in agents_list]
            return {
                "success": False, 
                "error": f"Agent '{request.agent_name}' not found", 
                "available_agents": available_agents
            }
        
        # Prepare message with Discord context
        enhanced_message = request.message
        if request.channel_context:
            channel_info = request.channel_context.get('channel_info', {})
            if channel_info:
                enhanced_message = f"[Discord Channel: {channel_info.get('name', 'unknown')} - {channel_info.get('purpose', 'General discussion')}]\n\n{request.message}"
        
        # Get agent response
        response = agent.run(enhanced_message)
        
        return {
            "success": True,
            "response": response.content if hasattr(response, 'content') else str(response),
            "agent_name": agent.name,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Discord chat error: {e}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# Add imports at top if needed
import json
from datetime import datetime

if __name__ == "__main__":
    try:
        print(f"🚀 Starting ServiceFlow AI Playground...")
        print(f"📊 Loading {len(agents_list)} agents and {len(teams_list)} teams")
        
        # Log all agents being loaded
        print("✅ Validated agents:")
        for agent in agents_list:
            print(f"   • {agent.name}")
        
        if teams_list:
            print("✅ Teams:")
            for team in teams_list:
                team_name = getattr(team, 'name', 'Unknown Team')
                print(f"   • {team_name}")
        
        print("📡 Playground will be available at: https://app.agno.com/playground?endpoint=localhost%3A7777/v1")
        print(f"🎯 Playground ready with {len(agents_list)} agents!")
        
        # Run the playground - Following Agno documentation pattern
        playground_app.serve("playground:app", reload=True)
        
    except Exception as e:
        print(f"❌ Failed to start playground: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

# Function for Discord bot integration
def get_playground_agent(agent_name: str):
    """Get a specific agent by name for external access (Discord bot)"""
    agent_mapping = {
        'lead_generation_agent': lead_generation_agent,
        'content_creation_agent': content_creation_agent,
        'facebook_agent': facebook_agent,
        'google_agent': google_agent,
        'dalle_agent': dalle_agent,
        'research_coordinator': research_coordinator,
        'data_scraper_agent': data_scraper_agent,
        'smart_contract_agent': smart_contract_agent,
        'nft_analyst_agent': nft_analyst_agent,
    }
    
    if AGNO_ASSIST_AVAILABLE and agno_assist:
        agent_mapping['agno_assist'] = agno_assist
    
    return agent_mapping.get(agent_name.lower())

def initialize_playground():
    """Initialize the playground for external use - KEEPING ORIGINAL PATTERN"""
    try:
        logger.info("🚀 Initializing playground for external use")
        
        if not agents_list:
            raise ValueError("No agents available for playground")
        
        # Create playground - EXACTLY as specified: Playground(agents=[...])
        if teams_list:
            playground = Playground(agents=agents_list, teams=teams_list)
        else:
            playground = Playground(agents=agents_list)
        
        logger.info(f"✅ Playground initialized with {len(agents_list)} agents")
        return playground
        
    except Exception as e:
        logger.error(f"Failed to initialize playground: {e}")
        raise

def create_test_playground():
    """Create a minimal playground for testing"""
    try:
        # Just create one simple agent for testing
        test_agent = Agent(
            name="Test Agent",
            model=OpenAIChat(id="gpt-4o"),
            instructions=["You are a helpful test agent."],
            markdown=True,
        )
        
        # EXACTLY as specified: Playground(agents=[...])
        playground = Playground(agents=[test_agent])
        logger.info("✅ Test playground created successfully")
        return playground
    except Exception as e:
        logger.error(f"Failed to create test playground: {e}")
        raise