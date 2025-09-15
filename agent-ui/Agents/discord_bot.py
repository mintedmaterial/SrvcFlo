#!/usr/bin/env python3
"""
Discord Bot for ServiceFlow AI
Separated from UnifiedUserManager to prevent import conflicts and allow optional Discord integration
"""

import os
import sys
import asyncio
import logging
from typing import Optional
import discord
from discord import app_commands
from discord.ext import commands

# Add agent-ui to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from unified_user_manager import UnifiedUserManager
    # Import playground function to get agents
    from playground import get_playground_agent, initialize_playground
    DISCORD_AVAILABLE = True
    PLAYGROUND_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Discord/Playground integration disabled due to import error: {e}")
    DISCORD_AVAILABLE = False
    PLAYGROUND_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ServiceFlowBot(commands.Bot):
    """ServiceFlow AI Discord Bot"""
    
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix='!sf ', intents=intents)
        
        self.user_manager = UnifiedUserManager() if DISCORD_AVAILABLE else None
    
    async def on_ready(self):
        logger.info(f'{self.user.name} has connected to Discord!')
        try:
            synced = await self.tree.sync()
            logger.info(f'Synced {len(synced)} command(s)')
        except Exception as e:
            logger.error(f'Failed to sync commands: {e}')

    async def setup_hook(self):
        """Setup hook called when bot starts"""
        if DISCORD_AVAILABLE:
            await self.add_cog(ServiceFlowCommands(self))

class ServiceFlowCommands(commands.Cog):
    """ServiceFlow AI Discord Commands"""
    
    def __init__(self, bot: ServiceFlowBot):
        self.bot = bot
        self.user_manager = bot.user_manager
    
    @app_commands.command(name="register", description="Register for ServiceFlow AI agent access")
    @app_commands.describe(
        wallet_address="Your crypto wallet address (required)",
        telegram_id="Your Telegram ID (optional)", 
        twitter_id="Your Twitter/X ID (optional)"
    )
    async def register(self, interaction: discord.Interaction, wallet_address: str, 
                      telegram_id: Optional[str] = None, twitter_id: Optional[str] = None):
        """Register user for agent access"""
        logger.info(f'Received register command from user: {interaction.user.display_name}')  # Logging the command
        await interaction.response.defer()
        
        if not self.user_manager:
            await interaction.followup.send("6c User management system not available")
            return
        
        try:
            # Extract user ID and wallet address
            user_id = f"discord_{interaction.user.id}"
            result = self.user_manager.register_user(
                user_id=user_id,
                username=interaction.user.display_name,
                email=f"{interaction.user.id}@discord.temp",
                discord_id=str(interaction.user.id),
                wallet_address=wallet_address,
                telegram_id=telegram_id,
                twitter_id=twitter_id
            )
            
            if result.get("success"):
                await interaction.followup.send(f"05 Registration successful for {interaction.user.display_name}")
            else:
                await interaction.followup.send(f"6c Registration failed: {result.get('message', 'Unknown error')}")
        except Exception as e:
            logger.error(f"Registration error: {e}")
            await interaction.followup.send(f"6c Registration failed: {str(e)}")
    
    @app_commands.command(name="credits", description="Check your ServiceFlow AI credits")
    async def credits(self, interaction: discord.Interaction):
        """Check user credits"""
        logger.info(f'Received credits command from user: {interaction.user.display_name}')  # Logging the command
        await interaction.response.defer()
        
        if not self.user_manager:
            await interaction.followup.send("6c User management system not available")
            return
        
        try:
            user_id = f"discord_{interaction.user.id}"
            user = self.user_manager.get_user(user_id)
            
            if user:
                await interaction.followup.send(f"cb0 Credits: {user.credits}\n3af Tier: {user.subscription_tier}")
            else:
                await interaction.followup.send("6c User not found. Use `/register` first.")
        except Exception as e:
            logger.error(f"Credits check error: {e}")
            await interaction.followup.send(f"6c Error checking credits: {str(e)}")
    
    @app_commands.command(name="agents", description="List available ServiceFlow AI agents")
    async def agents(self, interaction: discord.Interaction):
        """List available agents"""
        logger.info(f'Received agents command from user: {interaction.user.display_name}')  # Logging the command
        await interaction.response.defer()
        
        try:
            agent_list = [
                "916 **Content Agent** - Social media automation and content creation",
                "cd8 **Facebook Agent** - Facebook Page management and posting",
                "ce7 **Google Agent** - Gmail and Calendar operations", 
                "d0d **Research Agent** - Web scraping and data analysis",
                "cb0 **Trading Agent** - NFT and DeFi trading automation",
                "3af **Admin Verification** - Team access control via NFT verification"
            ]
            
            agents_text = "\n".join(agent_list)
            await interaction.followup.send(f"de80 **Available ServiceFlow AI Agents:**\n\n{agents_text}")
            
        except Exception as e:
            logger.error(f"Agents list error: {e}")
            await interaction.followup.send(f"6c Error listing agents: {str(e)}")
    
    @app_commands.command(name="chat", description="Chat with a ServiceFlow AI agent")
    @app_commands.describe(
        agent_name="Name of the agent to chat with",
        message="Your message to the agent"
    )
    async def chat(self, interaction: discord.Interaction, agent_name: str, message: str):
        """Chat with a specific agent from the playground"""
        logger.info(f'Received chat command from user: {interaction.user.display_name}')  # Logging the command
        await interaction.response.defer()
        
        if not PLAYGROUND_AVAILABLE:
            await interaction.followup.send("6c Playground integration not available")
            return
        
        try:
            # Initialize playground if needed
            initialize_playground()
            logger.info('Playground initialized')  # Logging
            
            # Get the requested agent from playground
            agent = get_playground_agent(agent_name.lower().replace(' ', '_').replace('-', '_'))
            
            if not agent:
                available_agents = [
                    "content_creation_agent", "lead_generation_agent", "facebook_agent", 
                    "google_agent", "dalle_agent", "agno_assist", "research_coordinator",
                    "data_scraper_agent", "cloudflare_rag_agent", "drpc_monitoring_agent",
                    "nft_analyst_agent", "ecosystem_analyst_agent", "paintswap_agent", 
                    "discord_monitor_agent", "smart_contract_agent"
                ]
                await interaction.followup.send(
                    f"6c Agent '{agent_name}' not found.\n\n"
                    f"Available agents:\n2022 " + "\n2022 ".join(available_agents)
                )
                return
            
            # Chat with the agent
            user_id = f"discord_{interaction.user.id}"
            logger.info(f'Sending message to agent: {agent_name}')  # Logging
            response = agent.run(message, user_id=user_id)
            
            # Get response content
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            # Discord has a 2000 character limit, so truncate if necessary
            if len(response_text) > 1900:
                response_text = response_text[:1900] + "...\n\n*(Response truncated due to Discord limits)*"
            
            await interaction.followup.send(
                f"916 **{agent.name if hasattr(agent, 'name') else agent_name}:**\n\n{response_text}"
            )
            logger.info('Response sent successfully')  # Logging
            
        except Exception as e:
            logger.error(f"Chat error: {e}")
            await interaction.followup.send(f"6c Error chatting with agent: {str(e)}")
    
    @app_commands.command(name="contract", description="Analyze smart contracts and blockchain functionality")
    @app_commands.describe(question="Your smart contract question or analysis request")
    async def contract(self, interaction: discord.Interaction, question: str):
        """Smart contract analysis command - routes to smart_contract_agent"""
        logger.info(f'Received contract command from user: {interaction.user.display_name}')  # Logging the command
        await interaction.response.defer()
        
        if not PLAYGROUND_AVAILABLE:
            await interaction.followup.send("6c Playground integration not available")
            return
        
        try:
            # Initialize playground if needed
            initialize_playground()
            
            # Get the smart contract agent
            agent = get_playground_agent('smart_contract_agent')
            
            if not agent:
                await interaction.followup.send("6c Smart Contract Agent not available")
                return
            
            # Chat with the smart contract agent
            user_id = f"discord_{interaction.user.id}"
            response = agent.run(question, user_id=user_id)
            
            # Get response content
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            # Discord has a 2000 character limit, so truncate if necessary
            if len(response_text) > 1900:
                response_text = response_text[:1900] + "...\n\n*(Response truncated due to Discord limits)*"
            
            await interaction.followup.send(
                f"dd17 **Smart Contract Analyst:**\n\n{response_text}"
            )
            
        except Exception as e:
            logger.error(f"Contract analysis error: {e}")
            await interaction.followup.send(f"6c Error with smart contract analysis: {str(e)}")
    
    @app_commands.command(name="research", description="Get research insights and market analysis")
    @app_commands.describe(query="Your research question or topic")
    async def research(self, interaction: discord.Interaction, query: str):
        """Research command - routes to research_coordinator"""
        logger.info(f'Received research command from user: {interaction.user.display_name}')  # Logging the command
        await interaction.response.defer()
        
        if not PLAYGROUND_AVAILABLE:
            await interaction.followup.send("6c Playground integration not available")
            return
        
        try:
            initialize_playground()
            agent = get_playground_agent('research_coordinator')
            
            if not agent:
                await interaction.followup.send("6c Research Coordinator not available")
                return
            
            user_id = f"discord_{interaction.user.id}"
            response = agent.run(query, user_id=user_id)
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            if len(response_text) > 1900:
                response_text = response_text[:1900] + "...\n\n*(Response truncated)*"
            
            await interaction.followup.send(f"d0d **Research Coordinator:**\n\n{response_text}")
            
        except Exception as e:
            logger.error(f"Research error: {e}")
            await interaction.followup.send(f"6c Research error: {str(e)}")
    
    @app_commands.command(name="nft", description="NFT market analysis and insights")
    @app_commands.describe(query="Your NFT market question")
    async def nft(self, interaction: discord.Interaction, query: str):
        """NFT analysis command - routes to nft_analyst_agent"""
        logger.info(f'Received nft command from user: {interaction.user.display_name}')  # Logging the command
        await interaction.response.defer()
        
        if not PLAYGROUND_AVAILABLE:
            await interaction.followup.send("6c Playground integration not available")
            return
        
        try:
            initialize_playground()
            agent = get_playground_agent('nft_analyst_agent')
            
            if not agent:
                await interaction.followup.send("6c NFT Market Analyst not available")
                return
            
            user_id = f"discord_{interaction.user.id}"
            response = agent.run(query, user_id=user_id)
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            if len(response_text) > 1900:
                response_text = response_text[:1900] + "...\n\n*(Response truncated)*"
            
            await interaction.followup.send(f"dbce0f **NFT Market Analyst:**\n\n{response_text}")
            
        except Exception as e:
            logger.error(f"NFT analysis error: {e}")
            await interaction.followup.send(f"6c NFT analysis error: {str(e)}")
    
    @app_commands.command(name="scrape", description="Scrape data from websites and URLs")
    @app_commands.describe(
        url="URL to scrape (optional)",
        query="Data extraction query or search terms"
    )
    async def scrape(self, interaction: discord.Interaction, query: str, url: str = None):
        """Data scraping command - routes to data_scraper_agent"""
        logger.info(f'Received scrape command from user: {interaction.user.display_name}')  # Logging the command
        await interaction.response.defer()
        
        if not PLAYGROUND_AVAILABLE:
            await interaction.followup.send("6c Playground integration not available")
            return
        
        try:
            initialize_playground()
            agent = get_playground_agent('data_scraper_agent')
            
            if not agent:
                await interaction.followup.send("6c Data Scraper Agent not available")
                return
            
            # Format the query with URL if provided
            full_query = f"{query}"
            if url:
                full_query = f"Please scrape data from {url} - {query}"
            
            user_id = f"discord_{interaction.user.id}"
            response = agent.run(full_query, user_id=user_id)
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            if len(response_text) > 1900:
                response_text = response_text[:1900] + "...\n\n*(Response truncated)*"
            
            await interaction.followup.send(f"d77e0f **Data Scraper:**\n\n{response_text}")
            
        except Exception as e:
            logger.error(f"Scraping error: {e}")
            await interaction.followup.send(f"6c Scraping error: {str(e)}")

def run_discord_bot():
    """Run the Discord bot if token is available"""
    discord_token = os.getenv('DISCORD_BOT_TOKEN')
    
    if not discord_token:
        logger.warning("Discord bot token not found. Set DISCORD_BOT_TOKEN environment variable.")
        return False
    
    if not DISCORD_AVAILABLE:
        logger.warning("Discord integration not available due to missing dependencies.")
        return False
    
    try:
        bot = ServiceFlowBot()
        asyncio.run(bot.start(discord_token))
        return True
    except Exception as e:
        logger.error(f"Failed to start Discord bot: {e}")
        return False

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("916 Starting ServiceFlow AI Discord Bot...")
    success = run_discord_bot()
    
    if not success:
        print("6c Discord bot failed to start. Check logs for details.")
        sys.exit(1)