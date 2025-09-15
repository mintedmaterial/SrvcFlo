#!/usr/bin/env python3
"""
Discord Bot Server for ServiceFlow AI
Routes Discord messages to playground agents with channel-specific intelligence
"""

import os
import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, Optional, Any

import discord
from discord.ext import commands
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Channel configuration from discord_channel_agent.py
DISCORD_CHANNELS = {
    "1316271075675340800": {
        "name": "boardroom-og-only",
        "type": "team_only",
        "access": "restricted",
        "purpose": "Team-only discussions and strategic planning"
    },
    "1316237076303319114": {
        "name": "srvcflo-general", 
        "type": "user_interaction",
        "access": "public",
        "purpose": "General user interaction with ServiceFlow agents"
    },
    "1316243913752973322": {
        "name": "dao-holder-discussion",
        "type": "dao_holders",
        "access": "dao_members",
        "purpose": "DAO holder discussions and governance"
    },
    "1316248879922024479": {
        "name": "vote-generation-leaderboard",
        "type": "generation_voting", 
        "access": "public",
        "purpose": "AI generation voting and leaderboard updates"
    },
    "1333603176762576966": {
        "name": "nft-screen",
        "type": "nft_data",
        "access": "public", 
        "purpose": "NFT transaction monitoring from PaintSwap"
    },
    "1333615004305330348": {
        "name": "twitter-feed",
        "type": "social_data",
        "access": "public",
        "purpose": "Twitter/X feed from Sonic Labs and community leaders"
    },
    "1401440320088178778": {
        "name": "dao-holder-voting",
        "type": "dao_voting",
        "access": "dao_members",
        "purpose": "Main project DAO holder voting"
    },
    "1401441215601447092": {
        "name": "generate-how-to",
        "type": "documentation",
        "access": "public",
        "purpose": "Documentation and tutorials publication"
    },
    "1401444863400087602": {
        "name": "contracts",
        "type": "contract_docs",
        "access": "approved_members",
        "purpose": "Contract documentation and ChainGPT audits"
    },
    "1415207839642685470": {
        "name": "blog",
        "type": "content_publishing",
        "access": "public", 
        "purpose": "Agent-generated blogs, analysis, and trading strategies"
    }
}

class ServiceFlowDiscordBot(commands.Bot):
    """Discord bot that routes messages to ServiceFlow AI playground agents"""
    
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix='!sf ', intents=intents)
        
        # Playground server configuration
        self.playground_url = os.getenv('PLAYGROUND_URL', 'http://localhost:7777')
        
    async def on_ready(self):
        logger.info(f'{self.user.name} is connected to Discord and ready to route messages!')
        logger.info(f'Monitoring {len(DISCORD_CHANNELS)} specialized channels')
        logger.info(f'Playground server: {self.playground_url}')
    
    async def on_message(self, message):
        # Ignore bot messages
        if message.author.bot:
            return
        
        channel_id = str(message.channel.id)
        channel_info = DISCORD_CHANNELS.get(channel_id)
        
        # Only respond to messages in configured channels or when mentioned
        if not channel_info and not self.user.mentioned_in(message):
            return
        
        # Process commands first
        await self.process_commands(message)
        
        # Route message to appropriate agent if not a command
        if not message.content.startswith('!sf '):
            await self.route_to_agent(message, channel_info)
    
    async def route_to_agent(self, message, channel_info: Optional[Dict]):
        """Route Discord message to appropriate playground agent"""
        try:
            # Determine which agent to use based on channel type
            agent_name = self.get_agent_for_channel(channel_info)
            
            # Prepare request for playground
            payload = {
                "agent_name": agent_name,
                "message": message.content,
                "channel_context": {
                    "channel_id": str(message.channel.id),
                    "channel_name": message.channel.name,
                    "channel_info": channel_info,
                    "author": str(message.author),
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
            
            # Send typing indicator
            async with message.channel.typing():
                # Call playground agent
                response = await self.call_playground_agent(payload)
                
                if response and response.get('success'):
                    agent_response = response.get('response', 'No response from agent')
                    
                    # Format response for Discord
                    formatted_response = self.format_discord_response(
                        agent_response, 
                        channel_info.get('type', 'general') if channel_info else 'general'
                    )
                    
                    # Send response (split if too long)
                    await self.send_long_message(message.channel, formatted_response)
                    
                    # Add reaction to original message
                    await message.add_reaction('🤖')
                else:
                    error_msg = response.get('error', 'Unknown error') if response else 'No response from playground'
                    await message.reply(f"❌ Agent error: {error_msg}")
                    
        except Exception as e:
            logger.error(f"Error routing message to agent: {e}")
            await message.reply(f"❌ System error: {str(e)}")
    
    def get_agent_for_channel(self, channel_info: Optional[Dict]) -> str:
        """Determine which agent to use based on channel type"""
        if not channel_info:
            return "Discord Community Manager"
        
        channel_type = channel_info.get('type', 'general')
        
        # Map channel types to agents
        agent_mapping = {
            'team_only': 'Discord Community Manager',
            'user_interaction': 'Discord Community Manager', 
            'dao_holders': 'Discord Community Manager',
            'generation_voting': 'Discord Community Manager',
            'nft_data': 'NFT Market Analyst',
            'social_data': 'Content Agent',
            'dao_voting': 'Discord Community Manager',
            'documentation': 'Discord Community Manager',
            'contract_docs': 'Smart Contract Agent',
            'content_publishing': 'Content Agent'
        }
        
        return agent_mapping.get(channel_type, 'Discord Community Manager')
    
    async def call_playground_agent(self, payload: Dict) -> Optional[Dict]:
        """Call the playground server to get agent response"""
        try:
            # Use requests for synchronous HTTP call in async context
            import aiohttp
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.playground_url}/chat",
                    json=payload,
                    timeout=30
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        error_text = await response.text()
                        logger.error(f"Playground error {response.status}: {error_text}")
                        return {"success": False, "error": f"HTTP {response.status}"}
                        
        except Exception as e:
            logger.error(f"Failed to call playground: {e}")
            return {"success": False, "error": str(e)}
    
    def format_discord_response(self, content: str, channel_type: str) -> str:
        """Format response appropriately for Discord channel type"""
        if channel_type == "team_only":
            return f"🔒 **Team**: {content}"
        elif channel_type == "user_interaction":
            return f"💬 **ServiceFlow AI**: {content}"
        elif channel_type == "dao_holders":
            return f"🗳️ **DAO**: {content}"
        elif channel_type == "generation_voting":
            return f"🎨 **Generation**: {content}"
        elif channel_type == "nft_data":
            return f"🖼️ **NFT Analysis**: {content}"
        elif channel_type == "social_data":
            return f"🐦 **Social**: {content}"
        elif channel_type == "documentation":
            return f"📚 **Documentation**: {content}"
        elif channel_type == "contract_docs":
            return f"📄 **Contract**: {content}"
        elif channel_type == "content_publishing":
            return f"📝 **Blog**: {content}"
        else:
            return f"🤖 **ServiceFlow AI**: {content}"
    
    async def send_long_message(self, channel, content: str):
        """Send message, splitting if too long for Discord"""
        max_length = 1900  # Leave room for formatting
        
        if len(content) <= max_length:
            await channel.send(content)
            return
        
        # Split into chunks
        chunks = [content[i:i+max_length] for i in range(0, len(content), max_length)]
        
        for i, chunk in enumerate(chunks):
            if i == 0:
                await channel.send(chunk)
            else:
                await channel.send(f"*(...continued)*\n{chunk}")
    
    @commands.command(name='status')
    async def status_command(self, ctx):
        """Check bot and playground status"""
        embed = discord.Embed(
            title="🤖 ServiceFlow AI Bot Status",
            color=0x00D4FF,  # Sonic blue
            timestamp=datetime.utcnow()
        )
        
        # Bot status
        embed.add_field(
            name="Bot Status", 
            value="🟢 Online", 
            inline=True
        )
        
        # Monitored channels
        embed.add_field(
            name="Monitored Channels",
            value=str(len(DISCORD_CHANNELS)),
            inline=True
        )
        
        # Playground connection test
        try:
            async with ctx.typing():
                test_response = await self.call_playground_agent({
                    "agent_name": "Discord Community Manager",
                    "message": "Status check",
                    "channel_context": {"test": True}
                })
                
                playground_status = "🟢 Connected" if test_response and test_response.get('success') else "🔴 Disconnected"
        except:
            playground_status = "🔴 Error"
        
        embed.add_field(
            name="Playground Server",
            value=playground_status,
            inline=True
        )
        
        await ctx.send(embed=embed)
    
    @commands.command(name='agents')
    async def agents_command(self, ctx):
        """List available agents"""
        embed = discord.Embed(
            title="🤖 Available ServiceFlow AI Agents",
            color=0x00D4FF,
            description="Agents available for Discord interactions"
        )
        
        agents = [
            ("Discord Community Manager", "Channel-specific AI responses with DALL-E integration"),
            ("Content Agent", "Social media automation and content creation"), 
            ("NFT Market Analyst", "PaintSwap NFT analysis and market insights"),
            ("Smart Contract Agent", "Contract auditing with ChainGPT integration"),
            ("Ecosystem Analyst", "DeFi and market research"),
            ("Research Coordinator", "Comprehensive Sonic ecosystem analysis")
        ]
        
        for name, description in agents:
            embed.add_field(
                name=f"**{name}**",
                value=description,
                inline=False
            )
        
        await ctx.send(embed=embed)
    
    @commands.command(name='channels')
    async def channels_command(self, ctx):
        """List monitored channels"""
        embed = discord.Embed(
            title="📡 Monitored Channels",
            color=0x00D4FF,
            description="Channels with specialized AI routing"
        )
        
        for channel_id, info in DISCORD_CHANNELS.items():
            embed.add_field(
                name=f"**{info['name']}**",
                value=f"Type: {info['type']}\nPurpose: {info['purpose']}",
                inline=True
            )
        
        await ctx.send(embed=embed)

async def main():
    """Run the Discord bot"""
    token = os.getenv('DISCORD_BOT_TOKEN')
    if not token:
        logger.error("DISCORD_BOT_TOKEN environment variable not set!")
        return
    
    bot = ServiceFlowDiscordBot()
    
    try:
        logger.info("Starting ServiceFlow Discord Bot...")
        await bot.start(token)
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error(f"Bot error: {e}")
    finally:
        await bot.close()

if __name__ == "__main__":
    print("🤖 ServiceFlow AI Discord Bot")
    print("🔗 Connecting Discord to Playground Agents...")
    print("📡 Monitoring 10 specialized channels")
    print("💫 Channel-specific AI routing enabled")
    
    asyncio.run(main())