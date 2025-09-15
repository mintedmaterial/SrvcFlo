#!/usr/bin/env python3
"""
Discord Agent Integration for ServiceFlow AI
Provides Discord bot integration using Agno pattern
"""

import os
import asyncio
import logging
from typing import Optional, Dict, Any
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.storage.mongodb import MongoDbStorage
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.mongodb import MongoMemoryDb

logger = logging.getLogger(__name__)

try:
    import discord
    from discord.ext import commands
    DISCORD_AVAILABLE = True
except ImportError:
    DISCORD_AVAILABLE = False
    logger.warning("Discord.py not installed. Install with: pip install discord.py")

class DiscordAgentBot:
    """Discord bot integrated with Agno agents"""
    
    def __init__(self, token: str, mongodb_uri: str):
        self.token = token
        self.mongodb_uri = mongodb_uri
        self.bot = None
        self.agents = {}
        
        if DISCORD_AVAILABLE:
            intents = discord.Intents.default()
            intents.message_content = True
            self.bot = commands.Bot(command_prefix='!', intents=intents)
            self._setup_commands()
    
    def _setup_commands(self):
        """Setup Discord bot commands"""
        
        @self.bot.event
        async def on_ready():
            logger.info(f'Discord bot logged in as {self.bot.user}')
        
        @self.bot.command(name='agents')
        async def list_agents(ctx):
            """List available agents"""
            agent_list = '\n'.join([f"• {name}" for name in self.agents.keys()])
            await ctx.send(f"Available agents:\n{agent_list}")
        
        @self.bot.command(name='chat')
        async def chat_with_agent(ctx, agent_name: str, *, message: str):
            """Chat with a specific agent"""
            if agent_name not in self.agents:
                await ctx.send(f"Agent '{agent_name}' not found. Use !agents to list available agents.")
                return
            
            try:
                agent = self.agents[agent_name]
                response = await agent.arun(message)
                
                # Discord has a 2000 character limit
                if len(response.content) > 2000:
                    # Split long messages
                    chunks = [response.content[i:i+2000] for i in range(0, len(response.content), 2000)]
                    for chunk in chunks:
                        await ctx.send(chunk)
                else:
                    await ctx.send(response.content)
            except Exception as e:
                logger.error(f"Error chatting with agent {agent_name}: {e}")
                await ctx.send(f"Error communicating with {agent_name}: {str(e)}")
    
    def add_agent(self, name: str, agent: Agent):
        """Add an agent to the bot"""
        self.agents[name] = agent
        logger.info(f"Added agent: {name}")
    
    async def start(self):
        """Start the Discord bot"""
        if not DISCORD_AVAILABLE:
            logger.error("Discord.py not available")
            return
        
        try:
            await self.bot.start(self.token)
        except Exception as e:
            logger.error(f"Failed to start Discord bot: {e}")

def create_discord_agent(mongodb_uri: str) -> Agent:
    """Create a Discord management agent"""
    
    storage = MongoDbStorage(
        collection_name="discord_agent",
        db_url=mongodb_uri,
        db_name="myserviceprovider"
    )
    
    memory_db = MongoMemoryDb(
        collection_name="discord_agent_memories",
        db_url=mongodb_uri,
        db_name="myserviceprovider"
    )
    
    memory = Memory(
        model=OpenAIChat(id="gpt-4o"),
        db=memory_db
    )
    
    return Agent(
        name="Discord Integration Agent",
        model=OpenAIChat(id="gpt-4o"),
        instructions=[
            "You are a Discord bot integration manager for ServiceFlow AI.",
            "Help users interact with agents through Discord commands.",
            "Provide guidance on Discord bot setup and configuration.",
            "Handle user queries about Discord integration features.",
            "Coordinate between Discord users and the agent ecosystem."
        ],
        storage=storage,
        memory=memory,
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True
    )

async def start_discord_integration():
    """Start Discord integration with agents using improved bot"""
    try:
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        discord_token = os.getenv("DISCORD_BOT_TOKEN")
        mongodb_uri = os.getenv("MONGODB_URI") or os.getenv("MONGODB_URL")
        
        if not discord_token:
            logger.error("DISCORD_BOT_TOKEN not set")
            return
        
        if not mongodb_uri:
            logger.error("MONGODB_URI not set")
            return
        
        # Add SSL params to MongoDB URI
        if "?" in mongodb_uri:
            mongodb_uri += "&ssl=true&ssl_cert_reqs=CERT_NONE&tlsAllowInvalidCertificates=true"
        else:
            mongodb_uri += "?ssl=true&ssl_cert_reqs=CERT_NONE&tlsAllowInvalidCertificates=true"
        
        logger.info("Starting Discord integration with ServiceFlow AI agents...")
        
        # Use the improved Discord bot integration
        from discord_bot_integration import ServiceFlowDiscordBot
        bot = ServiceFlowDiscordBot(discord_token, mongodb_uri)
        await bot.start()
        
    except Exception as e:
        logger.error(f"Discord integration startup failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(start_discord_integration())