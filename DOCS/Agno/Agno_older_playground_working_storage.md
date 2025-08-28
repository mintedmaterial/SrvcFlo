# playground.py
import os
import sys
import asyncio
from dotenv import load_dotenv
from agno.agent import Agent
from google_agent import GoogleAgent
from agno_assist import agno_assist  # Import agno_assist
from agno.app.agui import AGUIApp
from agno.models.openai import OpenAIChat
from agno.playground import Playground
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.mcp import MCPTools
from agno.tools.gmail import GmailTools
from agno.tools.googlecalendar import GoogleCalendarTools
from agno.tools.x import XTools 
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.mongodb import MongoMemoryDb

# Import the Google agent class directly
from google_agent import GoogleAgent

# Add parent directory to path to allow imports from storage module
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)
from storage.mongodb_storage_for_team import get_mongodb_storage_for_team

# Load environment variables from .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

# Get MongoDB connection string from environment variables
mongodb_uri = os.getenv("MONGODB_URL", "")
if not mongodb_uri:
    raise ValueError("MONGODB_URL environment variable is not set. Please set it to your MongoDB Atlas connection string.")

# MongoDB storage for team connection
mongodb_team_storage = get_mongodb_storage_for_team(
    db_url=mongodb_uri,
    collection_name="agent_sessions",
    db_name="myserviceprovider"
)

# MongoDB storage for individual agents
lead_gen_storage = get_mongodb_storage_for_team(
    db_url=mongodb_uri,
    collection_name="lead_generation_agent",
    db_name="myserviceprovider"
)

content_creation_storage = get_mongodb_storage_for_team(
    db_url=mongodb_uri,
    collection_name="content_creation_agent",
    db_name="myserviceprovider"
)

facebook_storage = get_mongodb_storage_for_team(
    db_url=mongodb_uri,
    collection_name="facebook_agent",
    db_name="myserviceprovider"
)

# Initialize separate MongoDB memory instances for each agent
lead_gen_memory_db = MongoMemoryDb(
    collection_name="lead_gen_agent_memories",
    db_url=mongodb_uri,
    db_name="myserviceprovider"
)

content_creation_memory_db = MongoMemoryDb(
    collection_name="content_creation_agent_memories",
    db_url=mongodb_uri,
    db_name="myserviceprovider"
)

facebook_memory_db = MongoMemoryDb(
    collection_name="facebook_agent_memories",
    db_url=mongodb_uri,
    db_name="myserviceprovider"
)

google_memory_db = MongoMemoryDb(
    collection_name="google_agent_memories",
    db_url=mongodb_uri,
    db_name="myserviceprovider"
)

# Create separate memory instances for each agent
lead_gen_agent_memory = Memory(
    model=OpenAIChat(id="gpt-4o"),
    db=lead_gen_memory_db
)

content_creation_agent_memory = Memory(
    model=OpenAIChat(id="gpt-4o"),
    db=content_creation_memory_db
)

facebook_agent_memory = Memory(
    model=OpenAIChat(id="gpt-4o"),
    db=facebook_memory_db
)

google_agent_memory = Memory(
    model=OpenAIChat(id="gpt-4o"),
    db=google_memory_db
)

# Lead Generation Agent
lead_generation_agent = Agent(
    name="Lead Generation Agent",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],
    instructions=["Scrape social media for leads based on provider-defined keywords.", "Always include sources"],
    storage=lead_gen_storage,
    memory=lead_gen_agent_memory,
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
    tools=[XTools(
        bearer_token=os.getenv("X_BEARER_TOKEN"),
        consumer_key=os.getenv("X_CONSUMER_KEY"),
        consumer_secret=os.getenv("X_CONSUMER_SECRET"),
        access_token=os.getenv("X_ACCESS_TOKEN"),
        access_token_secret=os.getenv("X_ACCESS_TOKEN_SECRET")
    ), DuckDuckGoTools()],
    instructions=[
        "Generate social media posts for ServiceFlow AI to promote small business automation.",
        "Create posts about automation benefits, how-to guides, and recommended tools.",
        "Use DuckDuckGoTools to find recent articles and insights on automation to inform content.",
        "Engage with automation-related tweets using context-aware replies.",
        "Keep posts concise (under 280 characters), engaging, with emojis and hashtags (#Automation, #SmallBusiness, #ServiceFlowAI).",
        "Include links to https://serviceflow.ai where relevant.",
        "Check API rate limits using x_api_rate_limiter and use cached data when possible."
    ], 
    storage=content_creation_storage,
    memory=content_creation_agent_memory,
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

# Get Facebook access token from environment variables
facebook_access_token = os.getenv("FACEBOOK_ACCESS_TOKEN")
facebook_app_id = os.getenv("FACEBOOK_APP_ID")
facebook_app_secret = os.getenv("FACEBOOK_APP_SECRET")

# Facebook Agent using MCPTools
facebook_agent = Agent(
    name="Facebook Page Manager",
    model=OpenAIChat(id="gpt-4o"),
    tools=[MCPTools(
        command="python Agents/facebook_mcp/server.py",
        env={
            "FACEBOOK_ACCESS_TOKEN": facebook_access_token,
            "FACEBOOK_APP_ID": facebook_app_id,
            "FACEBOOK_APP_SECRET": facebook_app_secret,
            **os.environ
        }
    )],
    instructions=[
        "You are a Facebook Page management assistant that can help with posting content, managing comments, and analyzing engagement.",
        "You can create posts, reply to comments, hide/unhide comments, and get insights about post performance.",
        "Always confirm before taking actions that modify content (posting, deleting, etc.).",
        "When showing insights, present the data in a clear, structured format with appropriate markdown formatting.",
        "If you encounter an error related to Facebook access tokens, suggest the user to log in again or check their Facebook permissions."
    ],
    storage=facebook_storage,
    memory=facebook_agent_memory,
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

# Initialize Google Calendar tool
calendar_credentials_path = os.path.join(parent_dir, "credentials", "google_calendar_credentials.json")
token_dir = os.path.join(parent_dir, "credentials",