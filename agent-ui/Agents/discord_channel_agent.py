#!/usr/bin/env python3
"""
Discord Channel Agent - ServiceFlow AI
Enhanced Discord agent with channel-specific routing and DALL-E integration
"""

import os
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.storage.mongodb import MongoDbStorage
from agno.tools.duckduckgo import DuckDuckGoTools
from Tools.dalle_tools import DALLEImageGenerator

# Channel mapping for ServiceFlow AI Discord server
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

def route_message_to_channel(message: str, channel_id: str) -> str:
    """Route message to appropriate channel based on content and channel type"""
    channel_info = DISCORD_CHANNELS.get(channel_id, {"name": "unknown", "type": "general"})
    channel_type = channel_info.get("type", "general")
    
    # Channel-specific message processing
    if channel_type == "team_only":
        return f"🔒 Team Channel Response: {message}"
    elif channel_type == "user_interaction":
        return f"💬 Public Response: {message}"
    elif channel_type == "dao_holders":
        return f"🗳️ DAO Response: {message}"
    elif channel_type == "generation_voting":
        return f"🎨 Generation Response: {message}"
    elif channel_type == "nft_data":
        return f"🖼️ NFT Analysis: {message}"
    elif channel_type == "social_data":
        return f"🐦 Social Analysis: {message}"
    elif channel_type == "documentation":
        return f"📚 Documentation: {message}"
    elif channel_type == "contract_docs":
        return f"📄 Contract Info: {message}"
    elif channel_type == "content_publishing":
        return f"📝 Blog Content: {message}"
    else:
        return f"🤖 General Response: {message}"

def generate_image_for_channel(prompt: str, channel_id: str) -> str:
    """Generate image using DALL-E for appropriate channels"""
    try:
        channel_info = DISCORD_CHANNELS.get(channel_id, {})
        channel_name = channel_info.get("name", "unknown")
        
        # Only generate images for appropriate channels
        if channel_info.get("type") in ["content_publishing", "user_interaction", "generation_voting"]:
            dalle = DALLEImageGenerator()
            
            # Generate image with channel-appropriate prompt
            enhanced_prompt = f"Professional illustration for {channel_name}: {prompt}. Clean, modern style."
            
            result = dalle.generate_image(
                prompt=enhanced_prompt,
                size="1024x1024",
                user_id=f"discord_channel_{channel_id}"
            )
            
            if result.get("success"):
                image_url = result.get("image_url", "")
                return f"🎨 Image generated for {channel_name}: {image_url}"
            else:
                return f"❌ Image generation failed: {result.get('error', 'Unknown error')}"
        else:
            return f"❌ Image generation not available in {channel_name}"
            
    except Exception as e:
        return f"❌ Image generation error: {str(e)}"

def get_channel_permissions(channel_id: str, user_id: str = None) -> dict:
    """Get channel permissions for user"""
    channel_info = DISCORD_CHANNELS.get(channel_id, {})
    access_level = channel_info.get("access", "public")
    
    return {
        "can_post": access_level in ["public", "dao_members", "approved_members"],
        "can_generate": channel_info.get("type") in ["content_publishing", "user_interaction"],
        "can_audit": channel_info.get("type") == "contract_docs",
        "access_level": access_level
    }

# MongoDB storage
mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/myserviceprovider")
discord_storage = MongoDbStorage(
    db_url=mongodb_uri,
    collection_name="discord_channel_agent"
)

# Discord Channel Agent
discord_channel_agent = Agent(
    name="Discord Channel Agent",
    model=OpenAIChat(id="gpt-4o"),
    tools=[
        DuckDuckGoTools(),
        route_message_to_channel,
        generate_image_for_channel,
        get_channel_permissions
    ],
    instructions=[
        "You are the ServiceFlow AI Discord Channel Agent with intelligent channel routing",
        "You understand channel-specific purposes and route content appropriately",
        "You can generate images for blog posts and content when beneficial",
        "You respect channel permissions and access levels",
        "You provide channel-appropriate responses based on context",
        "Use route_message_to_channel() to format responses appropriately",
        "Use generate_image_for_channel() for visual content when helpful",
        "Use get_channel_permissions() to check user access levels"
    ],
    storage=discord_storage,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)