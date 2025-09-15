#!/usr/bin/env python3
"""
NFT Market Analyst Agent - ServiceFlow AI
"""

import os
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.storage.mongodb import MongoDbStorage
from agno.tools.duckduckgo import DuckDuckGoTools

# MongoDB storage
mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/myserviceprovider")
nft_storage = MongoDbStorage(
    db_url=mongodb_uri,
    collection_name="nft_market_analyst"
)

# NFT Market Analyst Agent
nft_market_analyst_agent = Agent(
    name="NFT Market Analyst",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],
    instructions=[
        "You are an NFT market analyst specializing in Sonic ecosystem and PaintSwap",
        "Analyze NFT collection performance, trading volumes, and market trends",
        "Use DuckDuckGo to research NFT market data and price movements",
        "Provide insights on floor prices, volume analysis, and trading opportunities",
        "Always include specific metrics and actionable insights"
    ],
    storage=nft_storage,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)