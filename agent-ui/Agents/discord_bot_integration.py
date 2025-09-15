#!/usr/bin/env python3
"""
ServiceFlow AI Discord Bot - Agent Wrapper Integration
Provides Discord slash commands that directly connect to playground agents
Following Agno best practices with proper async patterns
"""

import os
import asyncio
import logging
import sys
from typing import Optional, Dict, Any
from datetime import datetime

# Add current directory to Python path for imports
sys.path.append(os.path.dirname(__file__))

# Discord imports
try:
    import discord
    from discord.ext import commands
    from discord import app_commands
    DISCORD_AVAILABLE = True
except ImportError:
    DISCORD_AVAILABLE = False
    print("6c Discord.py not installed. Install with: uv add discord.py")

# Agno imports
from agno.agent import Agent
from agno.models.openai import OpenAIChat

# ServiceFlow AI imports
from unified_user_manager import UnifiedUserManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ServiceFlowDiscordBot:
    """Discord bot that wraps playground agents with slash commands"""
    
    def __init__(self, token: str, mongodb_uri: str):
        self.token = token
        self.mongodb_uri = mongodb_uri
        self.user_manager = UnifiedUserManager()
        self.playground_agents = {}
        
        # Channel IDs for data collection
        self.monitored_channels = {
            'nft_transactions': 1333603176762576966,  # Paintswap bot NFT transactions
            'twitter_feed': 1333615004305330348,      # Twitter feed from Sonic ecosystem KOLs
            'user_prompts': 'srvcflo-generation-general',  # User prompts for agents (wallet verified)
            'sonic_price': 1328154017968164956        # Sonic price data
        }
        
        if DISCORD_AVAILABLE:
            # Set up bot intents
            intents = discord.Intents.default()
            intents.message_content = True
            intents.guilds = True
            
            # Create bot instance
            self.bot = commands.Bot(command_prefix='/', intents=intents)
            self.setup_commands()
            self.setup_events()
    
    def get_playground_agent(self, agent_name: str) -> Optional[Agent]:
        """Safely import and get playground agent using lazy initialization"""
        try:
            # Import playground module dynamically
            if 'playground' not in sys.modules:
                import playground
                sys.modules['playground'] = playground
            else:
                playground = sys.modules['playground']
            
            # Use the new get_playground_agent function for proper lazy loading
            if hasattr(playground, 'get_playground_agent'):
                agent = playground.get_playground_agent(agent_name)
                if agent is None:
                    logger.warning(f"Agent {agent_name} not found in playground")
                return agent
            else:
                # Fallback to old method
                agent = getattr(playground, agent_name, None)
                if callable(agent):  # It's a lambda function
                    agent = agent()
                if agent is None:
                    logger.warning(f"Agent {agent_name} not found in playground")
                return agent
        except ImportError as e:
            logger.error(f"Failed to import playground: {e}")
            return None
        except Exception as e:
            logger.error(f"Error getting agent {agent_name}: {e}")
            return None
    
    def setup_events(self):
        """Setup Discord bot events"""
        
        @self.bot.event
        async def on_ready():
            logger.info(f'05 Discord bot logged in as {self.bot.user}')
            print(f'05 Discord bot logged in as {self.bot.user}')
            
            # Sync slash commands
            try:
                synced = await self.bot.tree.sync()
                logger.info(f'Synced {len(synced)} slash commands')
                print(f'dd04 Synced {len(synced)} slash commands')
            except Exception as e:
                logger.error(f'Failed to sync commands: {e}')
                print(f'6c Failed to sync commands: {e}')
            
            # Send initialization message
            await self.send_initialization_message()
            
            # Set up channel monitoring
            await self.setup_channel_monitoring()
        
        @self.bot.event
        async def on_message(message):
            # Skip bot messages
            logger.info(f'Received message from: {message.author}')
            if message.author == self.bot.user:
                logger.debug('Ignoring message from self')
                return
            
            # Handle monitored channels
            await self.process_monitored_message(message)
            
            # Process commands
            await self.bot.process_commands(message)
    
    def setup_commands(self):
        """Setup Discord slash commands"""
        
        @self.bot.tree.command(name="register", description="Register for ServiceFlow AI agent access")
        @app_commands.describe(
            wallet_address="Your crypto wallet address (required)",
            telegram_id="Your Telegram ID (optional)", 
            twitter_id="Your Twitter/X ID (optional)"
        )
        async def register(interaction: discord.Interaction, wallet_address: str, 
                           telegram_id: Optional[str] = None, twitter_id: Optional[str] = None):
            """Register user for agent access"""
            logger.info(f'Received register command from user: {interaction.user.display_name}')
            await interaction.response.defer()
            
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
        
        @self.bot.tree.command(name="research", description="Chat with Sonic Research Coordinator agent")
        @app_commands.describe(topic="Research topic or question for the multi-agent team")
        async def research(interaction: discord.Interaction, topic: str):
            """Connect to Sonic Research Coordinator agent"""
            logger.info(f'Received research command from user: {interaction.user.display_name}')
            await interaction.response.defer()
            
            try:
                # Check if user is registered
                user_id = f"discord_{interaction.user.id}"
                user = self.user_manager.get_user(user_id)
                
                if not user:
                    await interaction.followup.send("6c Please register first with `/register [wallet_address]`")
                    return
                
                # Get the agent from playground
                agent = self.get_playground_agent("research_coordinator")
                
                if agent is None:
                    await interaction.followup.send("6c Research Coordinator agent not available")
                    return
                
                # Send query to the agent with proper context
                query = f"Discord user {interaction.user.display_name} asks: {topic}"
                
                # Use run instead of arun to avoid async issues
                logger.info(f'Sending research query to agent: {topic}')
                response = agent.run(query)
                
                # Extract content from response
                content = response.content if hasattr(response, 'content') else str(response)
                
                # Create response embed
                embed = discord.Embed(
                    title="d2c Sonic Research Coordinator",
                    description=content[:1000] + ("..." if len(content) > 1000 else ""),
                    color=discord.Color.blue()
                )
                
                embed.add_field(name="User", value=interaction.user.display_name, inline=True)
                embed.add_field(name="Agent", value="Research Coordinator", inline=True)
                embed.set_footer(text="ServiceFlow AI - Multi-Agent Research Team")
                
                await interaction.followup.send(embed=embed)
                
                # If response is too long, send remaining content
                if len(content) > 1000:
                    remaining = content[1000:]
                    chunks = [remaining[i:i+2000] for i in range(0, len(remaining), 2000)]
                    for chunk in chunks:
                        await interaction.followup.send(f"```\n{chunk}\n```")
                    
            except Exception as e:
                logger.error(f"Research command error: {e}")
                await interaction.followup.send(f"6c Research session failed: {str(e)}")
        
        @self.bot.tree.command(name="finance", description="Chat with Sonic Finance Researcher agent")
        @app_commands.describe(query="Your DeFi/finance question for the finance agent")
        async def finance(interaction: discord.Interaction, query: str):
            """Connect to Sonic Finance Researcher agent"""
            logger.info(f'Received finance command from user: {interaction.user.display_name}')
            await interaction.response.defer()
            
            try:
                # Check registration
                user_id = f"discord_{interaction.user.id}"
                user = self.user_manager.get_user(user_id)
                
                if not user:
                    await interaction.followup.send("6c Please register first with `/register [wallet_address]`")
                    return
                
                # Get the agent from playground
                agent = self.get_playground_agent("finance_agent")
                
                if agent is None:
                    await interaction.followup.send("6c Finance Researcher agent not available")
                    return
                
                # Send query to the agent with proper context
                user_query = f"Discord user {interaction.user.display_name} asks: {query}"
                
                # Use run instead of arun to avoid async issues
                logger.info(f'Sending finance query to agent: {query}')
                response = agent.run(user_query)
                
                # Extract content from response
                content = response.content if hasattr(response, 'content') else str(response)
                
                # Create response embed
                embed = discord.Embed(
                    title="cb0 Sonic Finance Researcher",
                    description=content[:1000] + ("..." if len(content) > 1000 else ""),
                    color=discord.Color.gold()
                )
                
                embed.add_field(name="User", value=interaction.user.display_name, inline=True)
                embed.add_field(name="Agent", value="Finance Researcher", inline=True)
                embed.set_footer(text="ServiceFlow AI - DeFi Analysis")
                
                await interaction.followup.send(embed=embed)
                
                # If response is too long, send remaining content
                if len(content) > 1000:
                    remaining = content[1000:]
                    chunks = [remaining[i:i+2000] for i in range(0, len(remaining), 2000)]
                    for chunk in chunks:
                        await interaction.followup.send(f"```\n{chunk}\n```")
                
            except Exception as e:
                logger.error(f"Finance command error: {e}")
                await interaction.followup.send(f"6c Finance analysis failed: {str(e)}")
        
        @self.bot.tree.command(name="dalle", description="Generate AI images with DALLE-3")
        @app_commands.describe(prompt="Image description/prompt")
        async def dalle(interaction: discord.Interaction, prompt: str):
            """DALLE image generation"""
            logger.info(f'Received dalle command from user: {interaction.user.display_name}')
            await interaction.response.defer()
            
            try:
                # Check registration
                user_id = f"discord_{interaction.user.id}"
                user = self.user_manager.get_user(user_id)
                
                if not user:
                    await interaction.followup.send("6c Please register first with `/register [wallet_address]`")
                    return
                
                # Get DALLE agent from playground
                dalle_agent = self.get_playground_agent("dalleai_agent")
                
                if dalle_agent is None:
                    await interaction.followup.send("6c DALLE AI agent not available")
                    return
                
                # Generate image using the agent
                dalle_query = f"Discord user {interaction.user.display_name} requests image generation: {prompt}"
                logger.info(f'Sending dalle query to agent: {prompt}')
                response = dalle_agent.run(dalle_query)
                
                # Extract content
                content = response.content if hasattr(response, 'content') else str(response)
                
                # For now, simulate a result - later this will be properly integrated with DALLE tools
                result = {
                    "success": True,
                    "message": content,
                    "prompt": prompt
                }
                
                if result.get("success"):
                    embed = discord.Embed(
                        title="3a8 AI Generated Image",
                        description=f"Prompt: {prompt}\n\nAgent Response: {result.get('message', '')[:200]}...",
                        color=discord.Color.purple()
                    )
                    
                    embed.add_field(name="Cost", value="$1 USDC or $S", inline=True)
                    embed.add_field(name="Quality", value="HD", inline=True)
                    embed.add_field(name="Status", value="Image generation in development", inline=False)
                    
                    await interaction.followup.send(embed=embed)
                else:
                    await interaction.followup.send(f"6c Image generation failed: {result.get('message', 'Unknown error')}")
                
            except Exception as e:
                logger.error(f"DALLE command error: {e}")
                await interaction.followup.send(f"6c Image generation failed: {str(e)}")
        
        @self.bot.tree.command(name="paintswap", description="NFT marketplace analysis")
        @app_commands.describe(query="NFT collection name or search term")
        async def paintswap(interaction: discord.Interaction, query: str):
            """Paintswap NFT analysis"""
            logger.info(f'Received paintswap command from user: {interaction.user.display_name}')
            await interaction.response.defer()
            
            try:
                # Check registration
                user_id = f"discord_{interaction.user.id}"
                user = self.user_manager.get_user(user_id)
                
                if not user:
                    await interaction.followup.send("6c Please register first with `/register [wallet_address]`")
                    return
                
                # Get Paintswap agent from playground
                paintswap_agent = self.get_playground_agent("paintswap_agent")
                
                if paintswap_agent is None:
                    await interaction.followup.send("6c Paintswap NFT agent not available")
                    return
                
                # Send query to the agent
                user_query = f"Discord user {interaction.user.display_name} searches NFTs: {query}"
                logger.info(f'Sending paintswap query to agent: {query}')
                response = paintswap_agent.run(user_query)
                
                # Extract content
                content = response.content if hasattr(response, 'content') else str(response)
                
                embed = discord.Embed(
                    title="3a8 Paintswap NFT Analysis",
                    description=content[:1000] + ("..." if len(content) > 1000 else ""),
                    color=discord.Color.orange()
                )
                
                embed.add_field(name="User", value=interaction.user.display_name, inline=True)
                embed.add_field(name="Agent", value="Paintswap NFT Analyst", inline=True)
                embed.set_footer(text="ServiceFlow AI - NFT Marketplace Analysis")
                
                await interaction.followup.send(embed=embed)
                
                # Send remaining content if needed
                if len(content) > 1000:
                    remaining = content[1000:]
                    chunks = [remaining[i:i+2000] for i in range(0, len(remaining), 2000)]
                    for chunk in chunks:
                        await interaction.followup.send(f"```\n{chunk}\n```")
                
            except Exception as e:
                logger.error(f"Paintswap command error: {e}")
                await interaction.followup.send(f"6c NFT analysis failed: {str(e)}")
        
        @self.bot.tree.command(name="agno", description="Chat with Agno Assist agent")
        @app_commands.describe(query="Your question for the Agno assistant")
        async def agno(interaction: discord.Interaction, query: str):
            """Connect to Agno Assist agent"""
            logger.info(f'Received agno command from user: {interaction.user.display_name}')
            await interaction.response.defer()
            
            try:
                # Check registration
                user_id = f"discord_{interaction.user.id}"
                user = self.user_manager.get_user(user_id)
                
                if not user:
                    await interaction.followup.send("6c Please register first with `/register [wallet_address]`")
                    return
                
                # Get the agent from playground
                agent = self.get_playground_agent("agno_assist")
                
                if agent is None:
                    await interaction.followup.send("6c Agno Assist agent not available")
                    return
                
                # Send query to the agent
                user_query = f"Discord user {interaction.user.display_name} asks: {query}"
                logger.info(f'Sending agno query to agent: {query}')
                response = agent.run(user_query)
                
                # Extract content
                content = response.content if hasattr(response, 'content') else str(response)
                
                # Create response embed
                embed = discord.Embed(
                    title="116 Agno Assistant",
                    description=content[:1000] + ("..." if len(content) > 1000 else ""),
                    color=discord.Color.green()
                )
                
                embed.add_field(name="User", value=interaction.user.display_name, inline=True)
                embed.add_field(name="Agent", value="Agno Assist", inline=True)
                embed.set_footer(text="ServiceFlow AI - General Assistant")
                
                await interaction.followup.send(embed=embed)
                
                # Send remaining content if needed
                if len(content) > 1000:
                    remaining = content[1000:]
                    chunks = [remaining[i:i+2000] for i in range(0, len(remaining), 2000)]
                    for chunk in chunks:
                        await interaction.followup.send(f"```\n{chunk}\n```")
                
            except Exception as e:
                logger.error(f"Agno command error: {e}")
                await interaction.followup.send(f"6c Agno assist failed: {str(e)}")
        
        @self.bot.tree.command(name="content", description="Chat with SrvcFlo Team Lead for content creation")
        @app_commands.describe(task="Content creation task or question")
        async def content(interaction: discord.Interaction, task: str):
            """Connect to SrvcFlo Team Lead agent"""
            logger.info(f'Received content command from user: {interaction.user.display_name}')
            await interaction.response.defer()
            
            try:
                # Check registration
                user_id = f"discord_{interaction.user.id}"
                user = self.user_manager.get_user(user_id)
                
                if not user:
                    await interaction.followup.send("6c Please register first with `/register [wallet_address]`")
                    return
                
                # Get the content creation agent from playground
                agent = self.get_playground_agent("content_creation_agent")
                
                if agent is None:
                    await interaction.followup.send("6c SrvcFlo Team Lead agent not available")
                    return
                
                # Send query to the agent
                user_query = f"Discord user {interaction.user.display_name} requests: {task}"
                logger.info(f'Sending content query to agent: {task}')
                response = agent.run(user_query)
                
                # Extract content
                content = response.content if hasattr(response, 'content') else str(response)
                
                # Create response embed
                embed = discord.Embed(
                    title="dcdd SrvcFlo Team Lead",
                    description=content[:1000] + ("..." if len(content) > 1000 else ""),
                    color=discord.Color.orange()
                )
                
                embed.add_field(name="User", value=interaction.user.display_name, inline=True)
                embed.add_field(name="Agent", value="SrvcFlo Team Lead", inline=True)
                embed.set_footer(text="ServiceFlow AI - Content Creation")
                
                await interaction.followup.send(embed=embed)
                
                # Send remaining content if needed
                if len(content) > 1000:
                    remaining = content[1000:]
                    chunks = [remaining[i:i+2000] for i in range(0, len(remaining), 2000)]
                    for chunk in chunks:
                        await interaction.followup.send(f"```\n{chunk}\n```")
                
            except Exception as e:
                logger.error(f"Content command error: {e}")
                await interaction.followup.send(f"6c Content creation failed: {str(e)}")
        
        @self.bot.tree.command(name="contractor", description="Chat with Contractor Assistant for building codes")
        @app_commands.describe(question="Building code or construction question")
        async def contractor(interaction: discord.Interaction, question: str):
            """Connect to Contractor Assistant agent"""
            logger.info(f'Received contractor command from user: {interaction.user.display_name}')
            await interaction.response.defer()
            
            try:
                # Check registration
                user_id = f"discord_{interaction.user.id}"
                user = self.user_manager.get_user(user_id)
                
                if not user:
                    await interaction.followup.send("6c Please register first with `/register [wallet_address]`")
                    return
                
                # Get the agent from playground
                agent = self.get_playground_agent("contractor_agent")
                
                if agent is None:
                    await interaction.followup.send("6c Contractor Assistant agent not available")
                    return
                
                # Send query to the agent
                user_query = f"Discord user {interaction.user.display_name} asks: {question}"
                logger.info(f'Sending contractor query to agent: {question}')
                response = agent.run(user_query)
                
                # Extract content
                content = response.content if hasattr(response, 'content') else str(response)
                
                # Create response embed
                embed = discord.Embed(
                    title="dfd7e0f Contractor Assistant",
                    description=content[:1000] + ("..." if len(content) > 1000 else ""),
                    color=discord.Color.from_rgb(139, 69, 19)  # Brown color
                )
                
                embed.add_field(name="User", value=interaction.user.display_name, inline=True)
                embed.add_field(name="Agent", value="Contractor Assistant", inline=True)
                embed.set_footer(text="ServiceFlow AI - Building Codes & Construction")
                
                await interaction.followup.send(embed=embed)
                
                # Send remaining content if needed
                if len(content) > 1000:
                    remaining = content[1000:]
                    chunks = [remaining[i:i+2000] for i in range(0, len(remaining), 2000)]
                    for chunk in chunks:
                        await interaction.followup.send(f"```\n{chunk}\n```")
                
            except Exception as e:
                logger.error(f"Contractor command error: {e}")
                await interaction.followup.send(f"6c Contractor assistance failed: {str(e)}")
        
        @self.bot.tree.command(name="help", description="Show all available commands")
        async def help_command(interaction: discord.Interaction):
            """Help command"""
            logger.info(f'Received help command from user: {interaction.user.display_name}')
            embed = discord.Embed(
                title="116 ServiceFlow AI Agent Commands",
                description="Connect directly to playground agents via Discord slash commands",
                color=discord.Color.blue()
            )
            
            embed.add_field(
                name="Registration",
                value="`/register [wallet]` - Register for agent access",
                inline=False
            )
            
            embed.add_field(
                name="Sonic Ecosystem Agents", 
                value="`/research [topic]` - Multi-agent research team\n`/finance [query]` - DeFi & market analysis\n`/paintswap [query]` - NFT marketplace data",
                inline=False
            )
            
            embed.add_field(
                name="Content & Creation",
                value="`/dalle [prompt]` - AI image generation\n`/content [task]` - Content creation & social\n`/contractor [question]` - Building codes assistant",
                inline=False
            )
            
            embed.add_field(
                name="General Assistance",
                value="`/agno [query]` - General AI assistant\n`/status` - Check registration\n`/help` - Show this message",
                inline=False
            )
            
            embed.add_field(
                name="How It Works",
                value="Each command connects you directly to specialized playground agents. All responses are powered by the full ServiceFlow AI ecosystem.",
                inline=False
            )
            
            embed.set_footer(text="ServiceFlow AI - Playground Agent Wrapper")
            
            await interaction.response.send_message(embed=embed)
        
        @self.bot.tree.command(name="status", description="Check your registration status")
        async def status(interaction: discord.Interaction):
            """Status command"""
            logger.info(f'Received status command from user: {interaction.user.display_name}')
            user_id = f"discord_{interaction.user.id}"
            user = self.user_manager.get_user(user_id)
            
            if user:
                embed = discord.Embed(
                    title="05 Registration Status",
                    description="You are registered and can use all commands",
                    color=discord.Color.green()
                )
                embed.add_field(name="Username", value=user.username, inline=True)
                embed.add_field(name="Credits", value=str(user.credits), inline=True)
                embed.add_field(name="Tier", value=user.subscription_tier, inline=True)
            else:
                embed = discord.Embed(
                    title="6c Not Registered", 
                    description="Please register with `/register [wallet_address]`",
                    color=discord.Color.red()
                )
            
            await interaction.response.send_message(embed=embed)
    
    async def setup_channel_monitoring(self):
        """Set up monitoring for specified Discord channels"""
        try:
            logger.info("Setting up Discord channel monitoring...")
            for channel_name, channel_id in self.monitored_channels.items():
                if isinstance(channel_id, int):
                    channel = self.bot.get_channel(channel_id)
                    if channel:
                        logger.info(f"Monitoring channel: {channel.name} (ID: {channel_id}) for {channel_name}")
                    else:
                        logger.warning(f"Channel not found: {channel_id} for {channel_name}")
                else:
                    # Handle channel name lookup
                    for guild in self.bot.guilds:
                        channel = discord.utils.get(guild.channels, name=channel_id)
                        if channel:
                            logger.info(f"Monitoring channel: {channel.name} for {channel_name}")
                            break
                    if not channel:
                        logger.warning(f"Channel not found: {channel_id} for {channel_name}")
        except Exception as e:
            logger.error(f"Failed to set up channel monitoring: {e}")
    
    async def process_monitored_message(self, message):
        """Process messages from monitored channels"""
        try:
            channel_id = message.channel.id
            channel_name = message.channel.name
            
            # NFT transactions from Paintswap bot
            if channel_id == self.monitored_channels['nft_transactions']:
                if message.author.id == 914241476253339668:  # Paintswap bot ID
                    logger.info(f"NFT transaction detected: {message.content[:100]}...")
                    # TODO: Process NFT transaction data
            
            # Twitter feed from Sonic ecosystem KOLs
            elif channel_id == self.monitored_channels['twitter_feed']:
                logger.info(f"Twitter feed update: {message.content[:100]}...")
                # TODO: Process Twitter feed data
            
            # User prompts for agents (wallet verified)
            elif channel_name == self.monitored_channels['user_prompts']:
                logger.info(f"User prompt detected: {message.content[:100]}...")
                # TODO: Process user prompts for agent interaction
            
            # Sonic price data
            elif channel_id == self.monitored_channels['sonic_price']:
                logger.info(f"Sonic price update: {message.content[:100]}...")
                # TODO: Process price data
                
        except Exception as e:
            logger.error(f"Failed to process monitored message: {e}")
    
    async def send_initialization_message(self):
        """Send bot initialization message to channels"""
        try:
            for guild in self.bot.guilds:
                # Find appropriate channel
                channel = None
                
                # Look for specific channels
                for ch_name in ['general', 'agents', 'ai-bots', 'bot-commands']:
                    channel = discord.utils.get(guild.channels, name=ch_name)
                    if channel:
                        break
                
                # Fallback to first text channel
                if not channel:
                    channel = next((ch for ch in guild.channels if isinstance(ch, discord.TextChannel)), None)
                
                if channel:
                    embed = discord.Embed(
                        title="de80 ServiceFlow AI Agents Online!",
                        description="Sonic ecosystem agents are now available via Discord commands\n\n**Channel Monitoring Active:**\n2022 NFT Transactions\n2022 Twitter Feed\n2022 User Prompts\n2022 Sonic Price Data",
                        color=discord.Color.green()
                    )
                    
                    embed.add_field(
                        name="Quick Start",
                        value="`/register [wallet]` to get started\n`/help` to see all commands",
                        inline=False
                    )
                    
                    embed.add_field(
                        name="Available Services",
                        value="2022 DeFi Analysis (`/finance`)\n2022 Multi-Agent Research (`/research`)\n2022 AI Image Generation (`/dalle`)\n2022 NFT Marketplace (`/paintswap`)",
                        inline=False
                    )
                    
                    embed.set_footer(text="ServiceFlow AI - Powered by Sonic Blockchain")
                    
                    await channel.send(embed=embed)
                    
        except Exception as e:
            logger.error(f"Failed to send initialization message: {e}")
    
    async def start(self):
        """Start the Discord bot"""
        if not DISCORD_AVAILABLE:
            logger.error("Discord.py not available")
            return
        
        try:
            await self.bot.start(self.token)
        except Exception as e:
            logger.error(f"Failed to start Discord bot: {e}")

async def main():
    """Main function to start the Discord bot"""
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    discord_token = os.getenv("DISCORD_BOT_TOKEN")
    mongodb_uri = os.getenv("MONGODB_URI") or os.getenv("MONGODB_URL")
    
    if not discord_token:
        print("6c DISCORD_BOT_TOKEN not set in environment variables")
        return
    
    if not mongodb_uri:
        print("6c MONGODB_URI not set in environment variables") 
        return
    
    # Add SSL params to MongoDB URI
    if "?" in mongodb_uri:
        mongodb_uri += "&ssl=true&ssl_cert_reqs=CERT_NONE&tlsAllowInvalidCertificates=true"
    else:
        mongodb_uri += "?ssl=true&ssl_cert_reqs=CERT_NONE&tlsAllowInvalidCertificates=true"
    
    print("de80 Starting ServiceFlow AI Discord Bot...")
    
    # Create and start bot
    bot = ServiceFlowDiscordBot(discord_token, mongodb_uri)
    await bot.start()

if __name__ == "__main__":
    asyncio.run(main())