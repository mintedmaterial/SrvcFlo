#!/usr/bin/env python3
"""
Discord Channel Monitoring Bot for ServiceFlow AI
Monitors specific channels for Twitter and NFT data, embeds content, and reacts to messages
"""

import os
import re
import json
import logging
import dotenv
from datetime import datetime
from typing import Dict, List, Optional, Any
import asyncio

import discord
from discord.ext import commands
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.embedder.openai import OpenAIEmbedder
from agno.storage.sqlite import SqliteStorage

logger = logging.getLogger(__name__)

class ChannelMonitorBot(commands.Bot):
    """Discord bot that monitors specific channels for Twitter and NFT data"""
    
    def __init__(self, twitter_channel_id: int, nft_channel_id: int):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix='!', intents=intents)
        
        self.twitter_channel_id = twitter_channel_id
        self.nft_channel_id = nft_channel_id
        
        # Initialize OpenAI embedder
        self.embedder = OpenAIEmbedder()
        
        # Initialize storage for embedded data
        self.storage = SqliteStorage(
            table_name="monitored_data", 
            db_file="tmp/channel_monitoring.db"
        )
        
        # Initialize analysis agent
        self.analysis_agent = Agent(
            name="Content Analyzer",
            model=OpenAIChat(id="gpt-4o-mini"),
            instructions=[
                "You are a content analyzer that extracts structured data from social media posts.",
                "For Twitter posts, extract: handle, topic, date, time, engagement metrics.",
                "For NFT posts, extract: collection name, floor price, listed price, rank, seller.",
                "Return data in JSON format."
            ]
        )
    
    async def on_ready(self):
        logger.info(f'{self.user.name} is monitoring channels!')
        logger.info(f'Twitter Channel ID: {self.twitter_channel_id}')
        logger.info(f'NFT Channel ID: {self.nft_channel_id}')
    
    async def on_message(self, message):
        # Ignore bot messages
        if message.author.bot:
            return
        
        # Check if message is from monitored channels
        if message.channel.id == self.twitter_channel_id:
            await self.process_twitter_message(message)
        elif message.channel.id == self.nft_channel_id:
            await self.process_nft_message(message)
    
    async def process_twitter_message(self, message):
        """Process Twitter forwarded messages"""
        try:
            logger.info(f"Processing Twitter message: {message.content[:100]}...")
            
            # Extract Twitter data using the analysis agent
            analysis_prompt = f"""
            Analyze this Twitter message and extract structured data:
            
            Message: {message.content}
            
            Extract and return JSON with:
            - twitter_handle: string
            - topic: string  
            - date: string (YYYY-MM-DD)
            - time: string (HH:MM:SS)
            - engagement_likes: number (if available)
            - engagement_retweets: number (if available)
            - engagement_replies: number (if available)
            - content_summary: string
            """
            
            response = self.analysis_agent.run(analysis_prompt)
            extracted_data = self.parse_json_response(response.content)
            
            if extracted_data:
                # Add metadata
                extracted_data.update({
                    'source': 'twitter',
                    'discord_message_id': message.id,
                    'discord_channel_id': message.channel.id,
                    'processed_at': datetime.utcnow().isoformat(),
                    'raw_content': message.content
                })
                
                # Create embeddings
                embedding = await self.create_embedding(message.content)
                extracted_data['embedding'] = embedding
                
                # Store data
                await self.store_data(extracted_data)
                
                # React to message with 💯
                await message.add_reaction('💯')
                
                logger.info(f"Twitter data processed and stored: {extracted_data.get('twitter_handle', 'Unknown')}")
            
        except Exception as e:
            logger.error(f"Error processing Twitter message: {e}")
    
    async def process_nft_message(self, message):
        """Process NFT transaction messages"""
        try:
            logger.info(f"Processing NFT message: {message.content[:100]}...")
            
            # Extract NFT data using the analysis agent
            analysis_prompt = f"""
            Analyze this NFT transaction message and extract structured data:
            
            Message: {message.content}
            
            Extract and return JSON with:
            - collection_name: string
            - floor_price: number (in ETH/SOL/etc)
            - listed_price: number (in ETH/SOL/etc)
            - rank: number (if available)
            - seller: string (wallet address or username)
            - buyer: string (wallet address or username, if available)
            - token_id: string (if available)
            - transaction_type: string (sale, listing, etc)
            - currency: string (ETH, SOL, etc)
            """
            
            response = self.analysis_agent.run(analysis_prompt)
            extracted_data = self.parse_json_response(response.content)
            
            if extracted_data:
                # Add metadata
                extracted_data.update({
                    'source': 'nft',
                    'discord_message_id': message.id,
                    'discord_channel_id': message.channel.id,
                    'processed_at': datetime.utcnow().isoformat(),
                    'raw_content': message.content
                })
                
                # Create embeddings
                embedding = await self.create_embedding(message.content)
                extracted_data['embedding'] = embedding
                
                # Store data
                await self.store_data(extracted_data)
                
                # React to message with 💯
                await message.add_reaction('💯')
                
                logger.info(f"NFT data processed and stored: {extracted_data.get('collection_name', 'Unknown')}")
            
        except Exception as e:
            logger.error(f"Error processing NFT message: {e}")
    
    async def create_embedding(self, text: str) -> List[float]:
        """Create embedding for text content"""
        try:
            # Use OpenAI embedder
            embedding = self.embedder.get_embedding(text)
            return embedding
        except Exception as e:
            logger.error(f"Error creating embedding: {e}")
            return []
    
    def parse_json_response(self, response_text: str) -> Optional[Dict]:
        """Parse JSON from agent response"""
        try:
            # Try to find JSON in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                return json.loads(json_str)
            else:
                # If no JSON found, try parsing the whole response
                return json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response text: {response_text}")
            return None
    
    async def store_data(self, data: Dict):
        """Store extracted data with embeddings"""
        try:
            # Convert data to storage format
            storage_data = {
                'id': f"{data['source']}_{data['discord_message_id']}",
                'content': json.dumps(data),
                'created_at': datetime.utcnow()
            }
            
            # Store in database
            self.storage.upsert(storage_data)
            logger.info(f"Data stored successfully: {storage_data['id']}")
            
        except Exception as e:
            logger.error(f"Error storing data: {e}")

class ChannelMonitoringAgent(Agent):
    """Agent wrapper for the Discord monitoring bot"""
    
    def __init__(self, twitter_channel_id: int, nft_channel_id: int):
        super().__init__(
            name="Channel Monitor Agent",
            model=OpenAIChat(id="gpt-4o-mini"),
            instructions=[
                "You are a Discord channel monitoring agent.",
                "You monitor specific channels for Twitter and NFT content.",
                "You extract structured data and create embeddings for analysis."
            ]
        )
        
        self.bot = ChannelMonitorBot(twitter_channel_id, nft_channel_id)
    
    async def start_monitoring(self):
        """Start the Discord bot monitoring"""
        discord_token = os.getenv('DISCORD_BOT_TOKEN')
        if not discord_token:
            raise ValueError("DISCORD_BOT_TOKEN environment variable not set")
        
        await self.bot.start(discord_token)

# Alternative approach using Agno's DiscordClient
class MonitoringDiscordAgent(Agent):
    """Agent that processes Discord messages and extracts data"""
    
    def __init__(self):
        super().__init__(
            name="Discord Monitoring Agent",
            model=OpenAIChat(id="gpt-4o-mini"),
            instructions=[
                "You analyze Discord messages from Twitter and NFT channels.",
                "Extract structured data and provide insights.",
                "For Twitter: extract handle, topic, engagement metrics.",
                "For NFT: extract collection, prices, seller info.",
                "Always respond with structured JSON data."
            ],
            add_history_to_messages=True,
            num_history_responses=3
        )
        
        self.embedder = OpenAIEmbedder()
        self.storage = SqliteStorage(
            table_name="discord_monitoring", 
            db_file="tmp/discord_data.db"
        )
    
    def process_channel_message(self, message_content: str, channel_type: str) -> Dict:
        """Process message based on channel type"""
        
        if channel_type == "twitter":
            prompt = f"""
            Analyze this Twitter message and extract:
            - Twitter handle
            - Main topic/subject
            - Date and time (if available)
            - Engagement metrics (likes, retweets, replies)
            - Content summary
            
            Message: {message_content}
            
            Return as JSON.
            """
        else:  # NFT channel
            prompt = f"""
            Analyze this NFT transaction message and extract:
            - Collection name
            - Floor price
            - Listed price  
            - Token rank (if available)
            - Seller information
            - Transaction type
            
            Message: {message_content}
            
            Return as JSON.
            """
        
        response = self.run(prompt)
        
        # Create embedding
        embedding = self.embedder.get_embedding(message_content)
        
        # Store data
        data = {
            'content': message_content,
            'analysis': response.content,
            'embedding': embedding,
            'channel_type': channel_type,
            'processed_at': datetime.utcnow().isoformat()
        }
        
        self.storage.upsert(data)
        
        return data

# =============================================================================
# TOOL FUNCTIONS FOR AGENT INTEGRATION
# =============================================================================

def process_discord_message(message_content: str, channel_id: str) -> str:
    """Process a Discord message from a specific channel
    
    Args:
        message_content (str): The message content to process
        channel_id (str): Discord channel ID where message originated
        
    Returns:
        str: JSON string with processed message data
    """
    try:
        # Map channel ID to channel info
        from discord_channel_agent import DISCORD_CHANNELS
        
        channel_info = DISCORD_CHANNELS.get(channel_id, {
            "name": "unknown",
            "type": "general",
            "access": "public",
            "purpose": "General discussion"
        })
        
        # Create Discord message handler
        handler = MonitoringDiscordAgent()
        result = handler.process_channel_message(message_content, channel_info["type"])
        
        # Add channel context
        result.update({
            "channel_id": channel_id,
            "channel_info": channel_info,
            "timestamp": datetime.now().isoformat()
        })
        
        return json.dumps(result, indent=2, default=str)
        
    except Exception as e:
        return json.dumps({
            "error": f"Failed to process Discord message: {str(e)}",
            "channel_id": channel_id,
            "message_preview": message_content[:100] + "..." if len(message_content) > 100 else message_content
        })

def get_discord_channel_info(channel_id: str) -> str:
    """Get information about a Discord channel
    
    Args:
        channel_id (str): Discord channel ID
        
    Returns:
        str: JSON string with channel information
    """
    try:
        from discord_channel_agent import DISCORD_CHANNELS
        
        channel_info = DISCORD_CHANNELS.get(channel_id, {
            "name": "unknown",
            "type": "general", 
            "access": "public",
            "purpose": "Channel not found in configuration"
        })
        
        return json.dumps({
            "channel_id": channel_id,
            "channel_info": channel_info,
            "configured": channel_id in DISCORD_CHANNELS
        }, indent=2)
        
    except Exception as e:
        return json.dumps({
            "error": f"Failed to get channel info: {str(e)}",
            "channel_id": channel_id
        })

def format_discord_response(content: str, channel_type: str = "general") -> str:
    """Format a response appropriate for Discord channel type
    
    Args:
        content (str): Response content to format
        channel_type (str): Type of Discord channel (team_only, public, etc.)
        
    Returns:
        str: Formatted response appropriate for the channel
    """
    try:
        # Format response based on channel type
        if channel_type == "team_only":
            formatted = f"🔒 **Team Update**: {content}"
        elif channel_type == "generation_voting":
            formatted = f"🎨 **Generation**: {content}"
        elif channel_type == "nft_data":
            formatted = f"🖼️ **NFT Update**: {content}"
        elif channel_type == "social_data":
            formatted = f"🐦 **Social**: {content}"
        elif channel_type == "dao_holders":
            formatted = f"🏛️ **DAO**: {content}"
        else:
            formatted = content
            
        # Ensure Discord formatting limits
        if len(formatted) > 1900:  # Leave room for embeds
            formatted = formatted[:1897] + "..."
            
        return json.dumps({
            "formatted_content": formatted,
            "channel_type": channel_type,
            "length": len(formatted)
        }, indent=2)
        
    except Exception as e:
        return json.dumps({
            "error": f"Failed to format Discord response: {str(e)}",
            "original_content": content[:200] + "..." if len(content) > 200 else content
        })

def run_channel_monitor():
    """Run the channel monitoring bot"""
    
    # Configuration
    TWITTER_CHANNEL_ID = int(os.getenv('TWITTER_CHANNEL_ID', '0'))
    NFT_CHANNEL_ID = int(os.getenv('NFT_CHANNEL_ID', '0'))
    
    if not TWITTER_CHANNEL_ID or not NFT_CHANNEL_ID:
        raise ValueError("Please set TWITTER_CHANNEL_ID and NFT_CHANNEL_ID environment variables")
    
    # Create and run monitoring agent
    monitor_agent = ChannelMonitoringAgent(TWITTER_CHANNEL_ID, NFT_CHANNEL_ID)
    
    try:
        asyncio.run(monitor_agent.start_monitoring())
    except KeyboardInterrupt:
        logger.info("Monitoring stopped by user")
    except Exception as e:
        logger.error(f"Monitoring error: {e}")

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("🤖 Starting Discord Channel Monitoring Bot...")
    print("📱 Monitoring Twitter and NFT channels...")
    print("💯 Will react to processed messages with 💯 emoji")
    
    run_channel_monitor()