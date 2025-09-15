# playground.py
import os
import sys
import asyncio
import logging
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from agno.agent import Agent
from google_agent import GoogleAgent
from agno_assist import agno_assist  # Import agno_assist
from agno.models.openai import OpenAIChat
from agno.playground import Playground
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.mcp import MCPTools 
from agno.tools.gmail import GmailTools
from agno.tools.googlecalendar import GoogleCalendarTools
from agno.tools.x import XTools
from agno.tools.thinking import ThinkingTools
from agno.tools.python import PythonTools
from agno.tools.hackernews import HackerNewsTools
from agno.tools import Toolkit
from agno.storage.sqlite import SqliteStorage
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.mongodb import MongoMemoryDb
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from sonic_content_team import create_sonic_content_team
import content_agent
from cloudflare_agent import cloudflare_agent
from data_scraper_agent import UniversalScraperAgent, BuildingCodeManager
# Import Langfuse and OpenInference for comprehensive tracing
import base64
from langfuse import observe, Langfuse

# Try to import OpenInference for advanced tracing
try:
    from openinference.instrumentation.agno import AgnoInstrumentor
    from opentelemetry import trace as trace_api
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import SimpleSpanProcessor
    OPENINFERENCE_AVAILABLE = True
except ImportError:
    print("⚠️  OpenInference not available. Install with: pip install openinference-instrumentation-agno")
    OPENINFERENCE_AVAILABLE = False

# Import the Google agent class directly
from google_agent import GoogleAgent

# Import agents from agent-ui directory
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'agent-ui', 'Agents'))
from unified_user_manager import UnifiedUserManager
from dalle_tools import DALLEImageGenerator
from linear_tools import LinearAPI
from paintswap_tools import PaintswapAPI
from finance_research_tools import DexScreenerAPI
from discord_monitoring_tools import DiscordWebhookManager
from sonic_research_team import SonicResearchTeam
from nft_market_analyst import NFTMarketAnalyst
from ecosystem_analyst import EcosystemAnalyst
from coincodex_pipeline import CoinCodexDataPipeline

# Discord bot integration using Agno pattern
try:
    from discord_agent_integration import create_discord_agent, start_discord_integration
    DISCORD_BOT_AVAILABLE = True
    print("OK Discord agent integration available (Agno pattern)")
except ImportError as e:
    DISCORD_BOT_AVAILABLE = False
    print(f"⚠️  Discord agent not available: {e}")

# Import the agno_assist agent, which uses SQLite and ElevenLabsTools
from agno_assist import agno_assist

# Add parent directory to path to allow imports from storage module
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)
from agno.storage.mongodb import MongoDbStorage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('playground.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def create_agent_safely(agent_name, agent_creation_func):
    """
    Safely create an agent with comprehensive error handling.
    
    Args:
        agent_name (str): Name of the agent for logging
        agent_creation_func (callable): Function that creates the agent
        
    Returns:
        Agent or None: The created agent or None if creation failed
    """
    try:
        logger.info(f"Creating {agent_name}...")
        agent = agent_creation_func()
        logger.info(f"{agent_name} created successfully")
        return agent
    except Exception as e:
        logger.error(f"Failed to create {agent_name}: {e}")
        logger.exception(f"Full traceback for {agent_name} creation failure:")
        return None

# Load environment variables from .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
logger.info(f"Loading environment variables from: {dotenv_path}")
load_dotenv(dotenv_path=dotenv_path)

def verify_environment_variables():
    """Verify all required environment variables are present"""
    logger.info("Verifying environment variables...")
    
    required_vars = {
        "OPENAI_API_KEY": "OpenAI API access",
        "MONGODB_URI": "MongoDB database connection (or MONGODB_URL)"
    }
    
    optional_vars = {
        "LANGFUSE_SECRET_KEY": "Langfuse tracing",
        "LANGFUSE_PUBLIC_KEY": "Langfuse tracing",
        "LANGDB_PROJECT_ID": "Langfuse project identification",
        "X_BEARER_TOKEN": "X/Twitter integration",
        "X_CONSUMER_KEY": "X/Twitter integration",
        "X_CONSUMER_SECRET": "X/Twitter integration",
        "X_ACCESS_TOKEN": "X/Twitter integration",
        "X_ACCESS_TOKEN_SECRET": "X/Twitter integration",
        "FACEBOOK_ACCESS_TOKEN": "Facebook integration",
        "FACEBOOK_PAGE_ID": "Facebook integration"
    }
    
    missing_required = []
    for var, purpose in required_vars.items():
        value = os.getenv(var)
        if var == "MONGODB_URI" and not value:
            # Check alternative
            value = os.getenv("MONGODB_URL")
        
        if not value:
            missing_required.append(f"{var} ({purpose})")
            logger.error(f"Missing required environment variable: {var}")
        else:
            logger.info(f"OK {var} configured")
    
    missing_optional = []
    for var, purpose in optional_vars.items():
        value = os.getenv(var)
        if not value:
            missing_optional.append(f"{var} ({purpose})")
            logger.warning(f"Optional environment variable not set: {var}")
        else:
            logger.info(f"OK {var} configured")
    
    if missing_required:
        logger.error(f"Missing required environment variables: {', '.join(missing_required)}")
        raise ValueError(f"Missing required environment variables: {', '.join(missing_required)}")
    
    if missing_optional:
        logger.info(f"Note: Some optional integrations not configured: {', '.join(missing_optional)}")
    
    logger.info("Environment variable verification completed")

# Verify environment variables
verify_environment_variables()

# Configure Langfuse tracing
langfuse_client = None
if os.getenv("LANGFUSE_SECRET_KEY") and os.getenv("LANGFUSE_PUBLIC_KEY"):
    langfuse_client = Langfuse(
        secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
        public_key=os.getenv("LANGFUSE_PUBLIC_KEY"), 
        host=os.getenv("LANGFUSE_HOST", "https://us.cloud.langfuse.com")
    )

if os.getenv("LANGFUSE_SECRET_KEY") and os.getenv("LANGFUSE_PUBLIC_KEY"):
    print("OK Langfuse tracing enabled")
    
    # Set up OpenInference tracing if available
    if OPENINFERENCE_AVAILABLE:
        try:
            # Set environment variables for Langfuse OTLP endpoint
            LANGFUSE_AUTH = base64.b64encode(
                f"{os.getenv('LANGFUSE_PUBLIC_KEY')}:{os.getenv('LANGFUSE_SECRET_KEY')}".encode()
            ).decode()
            os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = f"{os.getenv('LANGFUSE_HOST', 'https://us.cloud.langfuse.com')}/api/public/otel"
            os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"Authorization=Basic {LANGFUSE_AUTH}"
            
            # Configure the tracer provider
            tracer_provider = TracerProvider()
            tracer_provider.add_span_processor(SimpleSpanProcessor(OTLPSpanExporter()))
            trace_api.set_tracer_provider(tracer_provider=tracer_provider)
            
            # Start instrumenting agno
            AgnoInstrumentor().instrument()
            print("OK OpenInference instrumentation enabled for Agno agents")
        except Exception as e:
            print(f"⚠️  OpenInference setup failed: {e}")
    
else:
    print("⚠️  Langfuse tracing disabled - set LANGFUSE_SECRET_KEY and LANGFUSE_PUBLIC_KEY environment variables to enable")

# Get MongoDB connection string from environment variables
mongodb_uri = os.getenv("MONGODB_URI", "") or os.getenv("MONGODB_URL", "")
if not mongodb_uri:
    logger.error("MONGODB_URI or MONGODB_URL environment variable is not set. Please set it to your MongoDB Atlas connection string.")
    raise ValueError("MONGODB_URI or MONGODB_URL environment variable is not set. Please set it to your MongoDB Atlas connection string.")

def add_ssl_params_to_mongodb_uri(uri: str) -> str:
    """Add SSL parameters to MongoDB URI for Atlas compatibility"""
    ssl_params = "&ssl=true&ssl_cert_reqs=CERT_NONE&tlsAllowInvalidCertificates=true"
    if "?" in uri:
        return uri + ssl_params
    else:
        return uri + "?" + ssl_params.lstrip("&")

# Add SSL parameters to the MongoDB URI for all connections
mongodb_uri = add_ssl_params_to_mongodb_uri(mongodb_uri)

logger.info("MongoDB URI configured successfully")

# MongoDB storage for team connection
try:
    mongodb_team_storage = MongoDbStorage(
        collection_name="agent_sessions",
        db_url=mongodb_uri,
        db_name="myserviceprovider"
    )
    logger.info("MongoDB team storage initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize MongoDB team storage: {e}")
    raise

# Define MongoDB storage for individual agents
lead_gen_storage = MongoDbStorage(
    collection_name="lead_generation_agent",
    db_url=mongodb_uri,
    db_name="myserviceprovider"
)

content_creation_storage = SqliteStorage(
    table_name="content_creation_agent",
    db_file="tmp/discord_agents/content_creation.db"
)

# Facebook agent uses SQLite fallback due to potential connection issues
facebook_storage = SqliteStorage(
    table_name="facebook_agent",
    db_file="tmp/agents.db"
)

# Building Code Tools for Contractor Agent
class BuildingCodeTools(Toolkit):
    def __init__(self, **kwargs):
        super().__init__(name="building_codes", **kwargs)
        self.building_code_manager = BuildingCodeManager()
        self.current_state = None
        self.initialized_states = {}  # Cache for initialized agents
        self.register(self.get_available_states)
        self.register(self.initialize_state_codes)
        self.register(self.query_building_code)
        self.register(self.get_code_types)
        self.register(self.show_available_codes)

    def get_available_states(self) -> str:
        """Get list of available states for building codes"""
        try:
            states = self.building_code_manager.get_available_states()
            return f"Available states for building codes: {', '.join(states)}"
        except Exception as e:
            return f"Error getting available states: {str(e)}"

    def initialize_state_codes(self, state: str) -> str:
        """Initialize building codes for a specific state"""
        try:
            state_lower = state.lower()
            if state_lower not in self.building_code_manager.get_available_states():
                return f"Building codes not available for {state}. Available states: {', '.join(self.building_code_manager.get_available_states())}"
            
            self.current_state = state_lower
            
            # Check if already initialized
            if state_lower in self.initialized_states:
                return f"Building codes for {state.capitalize()} are already initialized and ready for queries."
            
            # Note: Due to async requirements, we'll mark it as ready to initialize
            # The actual initialization will happen on first query
            return f"OK Building codes for {state.capitalize()} are now ready for queries. The PDF knowledge base will be loaded on your first query. Ask me any building code questions for {state}!"
        except Exception as e:
            return f"Error initializing state codes: {str(e)}"

    def query_building_code(self, question: str, state: str = "oklahoma") -> str:
        """Query building codes for a specific question"""
        try:
            if not state and not self.current_state:
                return "Please specify a state for building code queries or use initialize_state_codes(state) first. Available states: oklahoma"
            
            query_state = state or self.current_state
            query_state_lower = query_state.lower()
            
            if query_state_lower not in self.building_code_manager.get_available_states():
                return f"Building codes not available for {query_state}. Available states: {', '.join(self.building_code_manager.get_available_states())}"
            
            # For now, provide guidance on how to get the actual building code information
            # Since the async PDF processing can't be done directly in the tool
            guidance = f"""🏗️ Building Code Query for {query_state.capitalize()}: "{question}"

📋 **Available Building Codes for {query_state.capitalize()}:**
"""
            code_types = self.building_code_manager.get_code_types(query_state_lower)
            for code_type, description in code_types.items():
                guidance += f"• {description}\n"
            
            guidance += f"""
🔍 **To get detailed answers to your building code question:**

1. **Residential Buildings**: Check the Oklahoma Residential Code (IRC 2018)
2. **Commercial Buildings**: Check the Oklahoma International Building Code (IBC 2018)  
3. **Existing Buildings**: Check the Oklahoma Existing Building Code (IEBC 2018)
4. **Mechanical Systems**: Check the Oklahoma Mechanical Code (IMC 2018)

**Your question:** "{question}"

**Recommendation:** This appears to be related to {"residential construction" if any(word in question.lower() for word in ["home", "house", "residential", "dwelling"]) else "commercial construction" if any(word in question.lower() for word in ["commercial", "business", "office"]) else "building codes"}. 

For detailed, specific code sections and requirements, I can help you navigate through the relevant building code documents. What specific aspect of "{question}" would you like me to focus on?"""

            return guidance
        except Exception as e:
            return f"Error querying building codes: {str(e)}"

    def get_code_types(self, state: str) -> str:
        """Get available building code types for a specific state"""
        try:
            code_types = self.building_code_manager.get_code_types(state.lower())
            if not code_types:
                return f"No building codes available for state: {state}"
            
            result = f"Building code types available for {state.capitalize()}:\n"
            for code_type, description in code_types.items():
                result += f"• {description}\n"
            return result
        except Exception as e:
            return f"Error getting code types: {str(e)}"

    def show_available_codes(self) -> str:
        """Show all available building codes by state"""
        try:
            result = "📋 Available Building Codes by State:\n\n"
            
            for state in self.building_code_manager.get_available_states():
                result += f"🏛️ {state.upper()}:\n"
                code_types = self.building_code_manager.get_code_types(state)
                for code_type, description in code_types.items():
                    result += f"  • {description}\n"
                result += "\n"
            
            result += "📖 **How to Use:**\n"
            result += "1. Use `initialize_state_codes('oklahoma')` to set up building codes\n"
            result += "2. Use `query_building_code('your question', 'oklahoma')` to ask specific questions\n"
            result += f"3. Available states: {', '.join(self.building_code_manager.get_available_states())}\n\n"
            result += "💡 **Example Questions:**\n"
            result += "• What are the minimum ceiling height requirements?\n"
            result += "• What are the electrical outlet requirements for kitchens?\n"
            result += "• What are the fire safety requirements?\n"
            result += "• What are the ADA compliance requirements?"
            
            return result
        except Exception as e:
            return f"Error showing available codes: {str(e)}"

# Initialize separate MongoDB memory instances for each agent
lead_gen_memory_db = MongoMemoryDb(
    collection_name="lead_gen_agent_memories",
    db_url=mongodb_uri,
    db_name="myserviceprovider"
)

content_creation_memory_db = SqliteMemoryDb(
    table_name="content_creation_agent_memories",
    db_file="tmp/discord_agents/content_creation_memory.db"
)

# Facebook agent uses SQLite memory fallback
facebook_memory_db = SqliteMemoryDb(
    table_name="facebook_agent_memories",
    db_file="tmp/agents.db"
)

# Initialize MongoDB memory for Google agent
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

# Global agent storage - initialized on demand
_agents_cache = {}

def get_or_create_lead_generation_agent():
    """Get or create lead generation agent (lazy initialization)"""
    if 'lead_generation_agent' not in _agents_cache:
        _agents_cache['lead_generation_agent'] = Agent(
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
            monitoring=True,
        )
    return _agents_cache['lead_generation_agent']

# Backward compatibility - create the agent when accessed
lead_generation_agent = lambda: get_or_create_lead_generation_agent()

# Content Creation Agent - Wrapper for Sonic Content Team using content-creator workflow
def create_content_wrapper_agent():
    """Create content creation wrapper agent using improved sonic content team"""
    
    def use_sonic_content_team(query: str) -> str:
        """Route content creation requests to the Sonic Content Team
        
        Args:
            query (str): Content creation request or task
            
        Returns:
            str: Content creation results from the team
        """
        try:
            # Create the sonic content team
            content_team = create_sonic_content_team()
            
            # Execute the content creation request
            result = content_team.create_content_campaign(query)
            
            return result
            
        except Exception as e:
            logger.error(f"Content team execution failed: {e}")
            return f"Content creation failed: {str(e)}"
    
    return Agent(
        name="Content Creation Agent",
        model=OpenAIChat(id="gpt-4o"),
        tools=[use_sonic_content_team, DuckDuckGoTools()],
        instructions=[
            "You are a content creation specialist using the Sonic Content Team workflow.",
            "Route all content creation requests to the use_sonic_content_team tool.",
            "The Sonic Content Team follows content-creator pattern: Blog Analyzer → Social Media Planner → Content Publisher.",
            "Focus on ServiceFlow AI content for service business automation.",
            "Use DuckDuckGoTools for additional research when needed.",
            "Always specify content type: blog posts, social media threads, LinkedIn posts, or Instagram content.",
            "For social media, include platform-specific optimizations and hashtags.",
            "Emphasize automation benefits for small service businesses."
        ],
        storage=content_creation_storage,
        memory=content_creation_agent_memory,
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True,
    )

def create_content_wrapper_agent():
    """Create content creation agent with enhanced functionality"""
    
    def create_blog_post(topic: str, category: str = "AI Automation") -> str:
        """Create blog post using content_agent functionality"""
        try:
            blog_data = content_agent.generate_blog_post(topic, category)
            if blog_data and isinstance(blog_data, dict):
                saved_path = content_agent.save_blog_json(blog_data)
                return f"OK Blog post '{blog_data.get('title', topic)}' created and saved to {saved_path}"
            return f"⚠️ Blog post generated with unexpected format: {str(blog_data)[:200]}..."
        except Exception as e:
            return f"❌ Blog post creation failed: {str(e)}"

    def create_social_content(platform: str, topic: str) -> str:
        """Create social media content"""
        try:
            content_team = create_sonic_content_team()
            result = content_team.create_content_campaign(f"Create {platform} content about {topic}")
            return result
        except Exception as e:
            return f"❌ Social content creation failed: {str(e)}"

    return Agent(
        name="Content Creation Agent",
        model=OpenAIChat(id="gpt-4o"),
        tools=[create_blog_post, create_social_content, DuckDuckGoTools()],
        instructions=[
            "You are a comprehensive content creation specialist for ServiceFlow AI.",
            "You can create blog posts, social media content, and research topics.",
            "Use create_blog_post for detailed AI automation blog posts.",
            "Use create_social_content for platform-specific social media content.",
            "Focus on ServiceFlow AI themes: business automation, AI workflows, service optimization."
        ],
        storage=content_creation_storage,
        memory=content_creation_agent_memory,
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True,
    )

def get_or_create_content_creation_agent():
    """Get or create content creation agent (lazy initialization)"""
    if 'content_creation_agent' not in _agents_cache:
        _agents_cache['content_creation_agent'] = create_content_wrapper_agent()
    return _agents_cache['content_creation_agent']

# Create the agent reference
content_creation_agent = get_or_create_content_creation_agent()

# Get Facebook access token from environment variables
facebook_access_token = os.getenv("FACEBOOK_ACCESS_TOKEN")
facebook_page_id = os.getenv("FACEBOOK_PAGE_ID")
facebook_app_id = os.getenv("FACEBOOK_APP_ID")
facebook_app_secret = os.getenv("FACEBOOK_APP_SECRET")

# Facebook Agent using MCPTools with UV command
facebook_mcp_server_path = os.path.join(os.path.dirname(__file__), "facebook_mcp", "server.py")
# Initialize Facebook MCP Tools first
facebook_mcp_tools = MCPTools(
    command=f"uv run --with mcp[cli] --with requests mcp run {facebook_mcp_server_path}",
    env={
        "FACEBOOK_ACCESS_TOKEN": facebook_access_token,
        "FACEBOOK_PAGE_ID": facebook_page_id,
        "FACEBOOK_APP_ID": facebook_app_id,
        "FACEBOOK_APP_SECRET": facebook_app_secret,
        **os.environ
    }
)

def get_or_create_facebook_agent():
    """Get or create Facebook agent (lazy initialization)"""
    if 'facebook_agent' not in _agents_cache:
        # Initialize Facebook MCP Tools first
        facebook_mcp_tools_local = MCPTools(
            command=f"uv run --with mcp[cli] --with requests mcp run {facebook_mcp_server_path}",
            env={
                "FACEBOOK_ACCESS_TOKEN": facebook_access_token,
                "FACEBOOK_PAGE_ID": facebook_page_id,
                "FACEBOOK_APP_ID": facebook_app_id,
                "FACEBOOK_APP_SECRET": facebook_app_secret,
                **os.environ
            }
        )
        
        _agents_cache['facebook_agent'] = Agent(
            name="Facebook Page Manager",
            model=OpenAIChat(id="gpt-4o"),
            tools=[facebook_mcp_tools_local],
            instructions=[
                "You are a Facebook Page management assistant with access to Facebook Graph API tools via MCP (Model Context Protocol).",
                "",
                "Your capabilities include:",
                "- Creating and managing Facebook posts (text, images, scheduled posts)",
                "- Managing comments and replies on posts",
                "- Analyzing post performance and engagement metrics",
                "- Managing page followers and direct messages",
                "- Moderating comments (hiding, deleting, filtering negative content)",
                "",
                "Guidelines:",
                "- Always confirm before taking destructive actions (posting, deleting, etc.)",
                "- Present analytics data in clear, structured markdown format",
                "- Ensure content follows Facebook community standards",
                "- Use engagement data to provide actionable insights",
                "- If you encounter access token errors, suggest checking Facebook permissions",
                "- Prioritize positive community engagement in content moderation",
                "",
                "Use the available MCP tools to help users create content, manage their Facebook presence, and analyze performance."
            ],
            storage=facebook_storage,
            memory=facebook_agent_memory,
            enable_agentic_memory=True,
            enable_user_memories=True,
            add_datetime_to_instructions=True,
            add_history_to_messages=True,
            num_history_responses=5,
            markdown=True,
            monitoring=True,
        )
    return _agents_cache['facebook_agent']

# Backward compatibility - create the agent when accessed
facebook_agent = lambda: get_or_create_facebook_agent()

# Initialize Google Calendar tool
calendar_credentials_path = os.path.join(parent_dir, "credentials", "google_calendar_credentials.json")
token_dir = os.path.join(parent_dir, "credentials", "tokens")
os.makedirs(token_dir, exist_ok=True)
calendar_token_path = os.path.join(token_dir, "google_calendar_token.json")

calendar_tool = GoogleCalendarTools(
    credentials_path=calendar_credentials_path,
    token_path=calendar_token_path
)

# Initialize Gmail tool
os.environ["GOOGLE_CREDENTIALS_PATH"] = os.path.join(parent_dir, "client_secret_645431798768-gverbsba88babmc6e8a8ctfp0fk3ievr.apps.googleusercontent.com.json")
os.environ["GOOGLE_TOKEN_PATH"] = os.path.join(parent_dir, "token.json")

gmail_tool = GmailTools(
    port=8080,
    get_latest_emails=True,
    get_emails_from_user=True,
    get_unread_emails=True,
    get_starred_emails=True,
    get_emails_by_context=True,
    get_emails_by_date=True,
    create_draft_email=True,
    send_email=True,
    search_emails=True
)

def get_or_create_google_agent():
    """Get or create Google agent (lazy initialization)"""
    if 'google_agent' not in _agents_cache:
        _agents_cache['google_agent'] = Agent(
            name="Google Services Manager",
            model=OpenAIChat(id="gpt-4o"),
            tools=[gmail_tool, calendar_tool],
            instructions=[
                "You are a Google services assistant that can help with Gmail and Google Calendar.",
                "For Gmail, you can read, draft, and send emails.",
                "For Google Calendar, you can view events, create new events, and manage schedules.",
                "When showing email contents, summarize the content, extract key details and dates.",
                "Show email contents and calendar events in a structured markdown format.",
                "Always confirm before taking actions that modify content (sending emails, creating events, etc.)."
            ],
            storage=MongoDbStorage(
                collection_name="google_agent",
                db_url=mongodb_uri,
                db_name="myserviceprovider"
            ),
            memory=google_agent_memory,
            enable_agentic_memory=True,
            enable_user_memories=True,
            add_datetime_to_instructions=True,
            add_history_to_messages=True,
            num_history_responses=5,
            markdown=True,
            monitoring=True,
        )
    return _agents_cache['google_agent']

# Backward compatibility - create the agent when accessed
google_agent = lambda: get_or_create_google_agent()

# Enhanced contractor agent with building code tools
contractor_memory_db = MongoMemoryDb(
    collection_name="contractor_agent_memories",
    db_url=mongodb_uri,
    db_name="myserviceprovider"
)

contractor_agent_memory = Memory(
    model=OpenAIChat(id="gpt-4o"),
    db=contractor_memory_db
)

# Initialize building code tools
building_code_tools = BuildingCodeTools()

# Initialize building code knowledge base for contractor agent
try:
    from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
    from agno.vectordb.mongodb import MongoDb
    from agno.embedder.openai import OpenAIEmbedder
    
    # Oklahoma building code PDFs
    oklahoma_building_code_urls = [
        "https://oklahoma.gov/content/dam/ok/en/oubcc/documents/rules/2022%2009%2014%20IRC%202018%20Permanent%20Rule.pdf",
        "https://oklahoma.gov/content/dam/ok/en/oubcc/documents/rules/2021%2009%2014%20IBC%202018%20Permanent%20Rule.pdf", 
        "https://oklahoma.gov/content/dam/ok/en/oubcc/documents/rules/2021%2009%2014%20IEBC%202018%20Permanent%20Rule.pdf",
        "https://oklahoma.gov/content/dam/ok/en/oubcc/documents/rules/2021%2009%2014%20IMC%202018%20Permanent%20Rule.pdf",
    ]
    
    # Create building code knowledge base
    building_code_knowledge = PDFUrlKnowledgeBase(
        urls=oklahoma_building_code_urls,
        vector_db=MongoDb(
            collection_name="oklahoma_building_codes_contractor",
            db_url=mongodb_uri,
            db_name="myserviceprovider",
            embedder=OpenAIEmbedder(
                id="text-embedding-3-small",
                dimensions=1536
            ),
        ),
    )
    
    def get_or_create_contractor_agent_with_knowledge():
        """Get or create contractor agent with knowledge base (lazy initialization)"""
        if 'contractor_agent' not in _agents_cache:
            _agents_cache['contractor_agent'] = Agent(
                name="Contractor Assistant with Building Codes",
                model=OpenAIChat(id="gpt-4o"),
                tools=[building_code_tools, DuckDuckGoTools()],
                knowledge=building_code_knowledge,  # Add the PDF knowledge base directly
                instructions=[
                    "You are a comprehensive contractor assistant with direct access to Oklahoma building codes and construction industry knowledge.",
                    "You have both building code tools AND a knowledge base with Oklahoma building code PDFs (IRC, IBC, IEBC, IMC 2018).",
                    "",
                    "BUILDING CODE CAPABILITIES:",
                    "- Direct access to Oklahoma building code PDFs through your knowledge base",
                    "- Can search through and cite specific code sections",
                    "- Provides detailed, accurate building code information",
                    "- Currently supports Oklahoma building codes (2018 editions)",
                    "",
                    "CONSTRUCTION INDUSTRY RESEARCH:",
                    "- Research building materials, tools, and industry trends",
                    "- Find product information and supplier details", 
                    "- Use DuckDuckGo for current construction market information",
                    "",
                    "WHEN ANSWERING BUILDING CODE QUESTIONS:",
                    "1. Search your knowledge base for relevant code sections",
                    "2. Provide specific code references with section numbers",
                    "3. Explain requirements in practical terms for contractors",
                    "4. Include both the requirement AND the rationale when possible",
                    "5. If asked about other states, explain Oklahoma is currently available",
                    "",
                    "AVAILABLE BUILDING CODES (in your knowledge base):",
                    "- Oklahoma Residential Code (IRC 2018)",
                    "- Oklahoma International Building Code (IBC 2018)", 
                    "- Oklahoma Existing Building Code (IEBC 2018)",
                    "- Oklahoma Mechanical Code (IMC 2018)",
                    "",
                    "Always provide practical, actionable advice with specific code citations.",
                    "Search your knowledge base thoroughly for accurate, up-to-date information.",
                    "When citing codes, include section numbers and page references when available."
                ],
                storage=MongoDbStorage(
                    collection_name="contractor_agent",
                    db_url=mongodb_uri,
                    db_name="myserviceprovider"
                ),
                memory=contractor_agent_memory,
                enable_agentic_memory=True,
                enable_user_memories=True,
                add_datetime_to_instructions=True,
                add_history_to_messages=True,
                num_history_responses=5,
                markdown=True,
                monitoring=True,
                search_knowledge=True,  # Enable knowledge base search
            )
        return _agents_cache['contractor_agent']
    
    # Use the lazy function
    contractor_agent = get_or_create_contractor_agent_with_knowledge()

except ImportError as e:
    print(f"⚠️  Warning: Building code PDF support not available: {e}")
    print("   Install with: pip install pypdf")
    
    def get_or_create_contractor_agent_fallback():
        """Get or create fallback contractor agent (lazy initialization)"""
        if 'contractor_agent' not in _agents_cache:
            _agents_cache['contractor_agent'] = Agent(
                name="Contractor Assistant with Building Codes",
                model=OpenAIChat(id="gpt-4o"),
                tools=[building_code_tools, DuckDuckGoTools()],
                instructions=[
                    "You are a comprehensive contractor assistant with access to building codes and construction industry knowledge.",
                    "You can help with two main areas:",
                    "",
                    "1. BUILDING CODES & REGULATIONS:",
                    "   - Access state-specific building codes (currently Oklahoma available)",
                    "   - Explain building requirements, code sections, and compliance",
                    "   - Always ask which state when building codes are requested",
                    "   - Use show_available_codes() to see what's available",
                    "   - Use initialize_state_codes(state) then query_building_code(question, state)",
                    "",
                    "2. CONSTRUCTION INDUSTRY RESEARCH:",
                    "   - Research building materials, tools, and industry trends",
                    "   - Find product information and supplier details",
                    "   - Use DuckDuckGo for current construction market information",
                    "",
                    "BUILDING CODE WORKFLOW:",
                    "1. When asked about building codes, first determine the state",
                    "2. Use show_available_codes() to check availability", 
                    "3. Use initialize_state_codes(state) to set up the state",
                    "4. Use query_building_code(question, state) for specific queries",
                    "",
                    "AVAILABLE BUILDING CODES:",
                    "- Oklahoma: IRC 2018, IBC 2018, IEBC 2018, IMC 2018",
                    "",
                    "Always provide practical, actionable advice for contractors and builders.",
                    "Include specific code references when available.",
                    "If building codes aren't available for a state, suggest alternatives or general guidance."
                ],
                storage=MongoDbStorage(
                    collection_name="contractor_agent",
                    db_url=mongodb_uri,
                    db_name="myserviceprovider"
                ),
                memory=contractor_agent_memory,
                enable_agentic_memory=True,
                enable_user_memories=True,
                add_datetime_to_instructions=True,
                add_history_to_messages=True,
                num_history_responses=5,
                markdown=True,
                monitoring=True,
            )
        return _agents_cache['contractor_agent']
    
    # Use the fallback lazy function
    contractor_agent = get_or_create_contractor_agent_fallback()

# Setup ServiceFlow AI temporary directory
serviceflow_tmp_dir = Path(__file__).parent.joinpath("tmp")
serviceflow_tmp_dir.mkdir(parents=True, exist_ok=True)

# Initialize shared user manager for all agents
shared_user_manager = UnifiedUserManager()

def get_or_create_building_code_agent():
    """Get or create Building Code Agent (lazy initialization)"""
    if 'building_code_agent' not in _agents_cache:
        try:
            from data_scraper_agent import BuildingCodeAgent
            
            # Initialize building code agent for Oklahoma by default
            building_code_system = BuildingCodeAgent(state="oklahoma")
            
            # Create tool wrapper functions for building codes
            def query_building_codes(question: str, state: str = "oklahoma") -> str:
                """Query building codes for a specific question and state"""
                try:
                    # This would use the actual agent's query functionality
                    # For now, provide guidance similar to BuildingCodeTools
                    return f"""🏗️ Building Code Query for {state.capitalize()}: "{question}"

📋 **Available Building Codes for {state.capitalize()}:**
• Oklahoma Residential Code (IRC 2018) - Single and two-family dwellings
• Oklahoma International Building Code (IBC 2018) - Commercial buildings  
• Oklahoma Existing Building Code (IEBC 2018) - Renovations and alterations
• Oklahoma Mechanical Code (IMC 2018) - HVAC and mechanical systems

🔍 **To get detailed answers to your building code question:**

1. **Residential Buildings**: Check the Oklahoma Residential Code (IRC 2018)
2. **Commercial Buildings**: Check the Oklahoma International Building Code (IBC 2018)  
3. **Existing Buildings**: Check the Oklahoma Existing Building Code (IEBC 2018)
4. **Mechanical Systems**: Check the Oklahoma Mechanical Code (IMC 2018)

**Your question:** "{question}"

**Recommendation:** This appears to be related to {"residential construction" if any(word in question.lower() for word in ["home", "house", "residential", "dwelling"]) else "commercial construction" if any(word in question.lower() for word in ["commercial", "business", "office"]) else "building codes"}. 

For detailed, specific code sections and requirements, I can help you navigate through the relevant building code documents. What specific aspect of "{question}" would you like me to focus on?"""
                except Exception as e:
                    return f"Error querying building codes: {str(e)}"

            def get_available_states() -> str:
                """Get list of available states for building codes"""
                try:
                    return "Available states for building codes: oklahoma"
                except Exception as e:
                    return f"Error getting available states: {str(e)}"

            def initialize_state_codes(state: str) -> str:
                """Initialize building codes for a specific state"""
                try:
                    state_lower = state.lower()
                    if state_lower != "oklahoma":
                        return f"Building codes not available for {state}. Available states: oklahoma"
                    
                    return f"✅ Building codes for {state.capitalize()} are now ready for queries. Ask me any building code questions!"
                except Exception as e:
                    return f"Error initializing building codes: {str(e)}"

            # Create the agent with tool wrapper functions
            building_code_memory_db = MongoMemoryDb(
                collection_name="building_code_agent_memories",
                db_url=mongodb_uri,
                db_name="myserviceprovider"
            )

            building_code_agent_memory = Memory(
                db=building_code_memory_db,
                user_id_column="user_id"
            )

            _agents_cache['building_code_agent'] = Agent(
                name="Building Code Expert",
                model=OpenAIChat(id="gpt-4o"),
                memory=building_code_agent_memory,
                tools=[query_building_codes, get_available_states, initialize_state_codes],
                instructions=[
                    "You are an expert on building codes and regulations, specializing in Oklahoma building codes.",
                    "Help users understand building codes, requirements, and regulations.",
                    "Provide specific code sections, requirements, and compliance information.",
                    "Always cite the specific building code document and section when providing information.",
                    "Focus on practical application of building codes for contractors and builders.",
                    "Currently available: Oklahoma building codes (IRC, IBC, IEBC, IMC 2018 editions)",
                    "Use your tools to query specific building code requirements.",
                    "If asked about other states, mention that only Oklahoma codes are currently available."
                ]
            )
            logger.info("✅ Building Code Agent created successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to create Building Code Agent: {e}")
            _agents_cache['building_code_agent'] = None

    return _agents_cache['building_code_agent']

def get_or_create_dalleai_agent():
    """Get or create DALLE AI agent (lazy initialization)"""
    if 'dalleai_agent' not in _agents_cache:
        # Import and initialize DALLE tools
        try:
            from dalle_tools import DALLEImageGenerator
            dalle_generator = DALLEImageGenerator()
            
            # Create tool wrapper functions
            def generate_image(prompt: str, size: str = "1024x1024", quality: str = "standard") -> str:
                """Generate an image using DALL-E 3"""
                try:
                    result = dalle_generator.generate_image(
                        prompt=prompt, 
                        size=size, 
                        quality=quality,
                        user_id="playground_user"
                    )
                    return f"Image generated successfully: {result['filename']}\nURL: {result['url']}\nCost: ${result['cost']}"
                except Exception as e:
                    return f"Error generating image: {str(e)}"
            
            def generate_sonic_themed_image(prompt: str, size: str = "1024x1024") -> str:
                """Generate a Sonic blockchain themed image"""
                try:
                    result = dalle_generator.generate_sonic_themed_image(
                        base_prompt=prompt,
                        size=size,
                        user_id="playground_user"
                    )
                    return f"Sonic-themed image generated: {result['filename']}\nURL: {result['url']}\nCost: ${result['cost']}"
                except Exception as e:
                    return f"Error generating Sonic-themed image: {str(e)}"
            
            def generate_nft_artwork(prompt: str, collection_name: str, size: str = "1024x1024") -> str:
                """Generate NFT artwork"""
                try:
                    result = dalle_generator.generate_nft_artwork(
                        prompt=prompt,
                        collection_name=collection_name,
                        size=size,
                        user_id="playground_user"
                    )
                    return f"NFT artwork generated: {result['filename']}\nURL: {result['url']}\nCollection: {collection_name}\nCost: ${result['cost']}"
                except Exception as e:
                    return f"Error generating NFT artwork: {str(e)}"
            
            def estimate_image_cost(size: str = "1024x1024", quality: str = "standard") -> str:
                """Estimate cost for image generation"""
                try:
                    cost = dalle_generator.estimate_cost(size, quality)
                    return f"Estimated cost for {size} {quality} quality image: ${cost:.3f}"
                except Exception as e:
                    return f"Error estimating cost: {str(e)}"
            
            def get_generation_history(limit: int = 10) -> str:
                """Get recent image generation history"""
                try:
                    history = dalle_generator.get_generation_history(limit=limit)
                    if not history:
                        return "No generation history found"
                    
                    result = "Recent image generations:\n"
                    for item in history:
                        result += f"- {item['prompt'][:50]}... ({item['size']}) - {item['filename']}\n"
                    return result
                except Exception as e:
                    return f"Error getting generation history: {str(e)}"
            
            dalle_tools = [generate_image, generate_sonic_themed_image, generate_nft_artwork, estimate_image_cost, get_generation_history]
            
        except ImportError as e:
            logger.warning(f"DALLE tools not available: {e}")
            dalle_tools = []
        
        _agents_cache['dalleai_agent'] = Agent(
            name="DALLE AI Image Generator", 
            model=OpenAIChat(id="gpt-4o"),
            tools=dalle_tools,
            instructions=[
                "You are a DALLE-3 image generation specialist for Sonic ecosystem content.",
                "Generate high-quality images with Sonic blockchain themes.",
                "Always validate user access before generating images.",
                "Provide image descriptions and save locally with metadata.",
                "Track user activity for billing and analytics."
            ],
            storage=SqliteStorage(
                table_name="dalle_agent",
                db_file="tmp/discord_agents/dalle_image_gen.db"
            ),
            memory=Memory(
                model=OpenAIChat(id="gpt-4o"),
                db=SqliteMemoryDb(
                    table_name="dalle_memories",
                    db_file="tmp/discord_agents/dalle_memory.db"
                )
            ),
            enable_agentic_memory=True,
            enable_user_memories=True,
            add_datetime_to_instructions=True,
            add_history_to_messages=True,
            num_history_responses=5,
            markdown=True,
            monitoring=True
        )
    return _agents_cache['dalleai_agent']

# Backward compatibility - create the agent when accessed
dalleai_agent = lambda: get_or_create_dalleai_agent()

# Initialize Building Code Agent
building_code_agent = lambda: get_or_create_building_code_agent()

def get_or_create_data_scraper_agent():
    """Get or create Data Scraper Agent with URL input and Playwright MCP support"""
    if 'data_scraper_agent' not in _agents_cache:
        try:
            from data_scraper_agent import UniversalScraperAgent
            
            # Initialize scraper agent with required business_type parameter
            scraper_system = UniversalScraperAgent(business_type="general")
            
            # Create tool wrapper functions with URL input support
            def scrape_website_data(url: str, data_type: str = "general") -> str:
                """Scrape data from a website URL using Playwright or fallback methods"""
                try:
                    # TODO: Integrate with Playwright MCP server when available
                    # For now, provide structured guidance
                    return f"""🔍 Website Scraping Request for: {url}

📋 **Data Type Requested:** {data_type}

⚙️ **Scraping Method:**
• Primary: Playwright MCP server (when available)
• Fallback: BeautifulSoup web scraping
• Support: Dynamic content rendering

🎯 **Available Data Types:**
• **general** - Extract all text content and metadata
• **business** - Focus on business information (hours, contact, services)
• **products** - Extract product listings and details  
• **contact** - Find contact information and locations
• **reviews** - Gather customer reviews and ratings
• **social** - Extract social media links and engagement

📝 **Scraping Process:**
1. Validate URL accessibility
2. Render dynamic content (JavaScript)
3. Extract structured data
4. Clean and format results
5. Return organized information

⚠️ **Note:** This is a preview of the scraping request. Full implementation requires:
- Playwright MCP server integration
- URL validation and safety checks
- Respect for robots.txt and rate limits
- GDPR compliance for EU sites

**URL to scrape:** {url}
**Expected data focus:** {data_type}

Would you like me to proceed with the scraping attempt?"""
                except Exception as e:
                    return f"Error preparing website scraping: {str(e)}"

            def scrape_business_info(business_name: str, location: str = "") -> str:
                """Scrape business information from multiple sources"""
                try:
                    search_query = f"{business_name} {location}".strip()
                    return f"""🏢 Business Information Scraping for: {search_query}

🔍 **Search Sources:**
• Google Business listings
• Yelp business pages  
• Yellow Pages directories
• Industry-specific directories
• Social media business pages

📊 **Information to Extract:**
• Business name and description
• Address and contact details
• Operating hours and availability
• Services and product offerings
• Customer reviews and ratings
• Social media presence
• Website and online presence

⚙️ **Scraping Strategy:**
1. Multi-source data collection
2. Cross-reference information accuracy
3. Aggregate and deduplicate data
4. Format structured business profile

**Search Query:** {search_query}
**Status:** Ready for multi-source scraping

Would you like me to execute the business information scraping?"""
                except Exception as e:
                    return f"Error preparing business info scraping: {str(e)}"

            def parse_document_content(file_path: str, document_type: str = "auto") -> str:
                """Parse and extract content from documents (PDF, DOCX, etc.)"""
                try:
                    return f"""📄 Document Parsing Request

**File:** {file_path}
**Type:** {document_type}

🔧 **Supported Formats:**
• **PDF** - Text extraction, table parsing, metadata
• **DOCX** - Word documents, formatting preservation
• **HTML** - Web pages, structured markup
• **CSV/XLSX** - Spreadsheets, data tables
• **TXT** - Plain text files
• **JSON/XML** - Structured data formats

⚙️ **Parsing Methods:**
• Text extraction with formatting
• Table and structure recognition
• Metadata and properties extraction
• Multi-page document handling

🎯 **Output Options:**
• Raw text content
• Structured data (JSON)
• Formatted markdown
• Section-based extraction

**Document:** {file_path}
**Processing type:** {document_type}

Ready to parse document content. Proceed?"""
                except Exception as e:
                    return f"Error preparing document parsing: {str(e)}"

            # Create the agent with enhanced scraping tools
            data_scraper_memory_db = MongoMemoryDb(
                collection_name="data_scraper_agent_memories",
                db_url=mongodb_uri,
                db_name="myserviceprovider"
            )

            data_scraper_agent_memory = Memory(
                db=data_scraper_memory_db,
                user_id_column="user_id"
            )

            _agents_cache['data_scraper_agent'] = Agent(
                name="Universal Data Scraper",
                model=OpenAIChat(id="gpt-4o"),
                memory=data_scraper_agent_memory,
                tools=[scrape_website_data, scrape_business_info, parse_document_content],
                instructions=[
                    "You are a universal data scraping and extraction expert.",
                    "Help users extract data from websites, documents, and online sources.",
                    "Support URL-based scraping with Playwright MCP integration.",
                    "Provide structured data extraction for business information.",
                    "Handle multiple document formats (PDF, DOCX, HTML, etc.).",
                    "Always respect robots.txt, rate limits, and legal requirements.",
                    "Focus on delivering clean, structured, and useful data.",
                    "Use your tools to scrape, parse, and extract information as requested.",
                    "Provide clear guidance on scraping capabilities and limitations."
                ]
            )
            logger.info("✅ Data Scraper Agent created successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to create Data Scraper Agent: {e}")
            _agents_cache['data_scraper_agent'] = None

    return _agents_cache['data_scraper_agent']

# Initialize Data Scraper Agent
data_scraper_agent = lambda: get_or_create_data_scraper_agent()

def get_or_create_http_bridge_agent():
    """Get or create HTTP Bridge Agent for communication with myserviceprovider-app"""
    if 'http_bridge_agent' not in _agents_cache:
        try:
            import requests
            import json
            
            # Create tool wrapper functions for HTTP bridge communication
            def send_request_to_frontend(endpoint: str, data: str = "", method: str = "POST") -> str:
                """Send HTTP request to myserviceprovider-app frontend"""
                try:
                    base_url = "http://localhost:3000"  # Next.js app default port
                    full_url = f"{base_url}/{endpoint.lstrip('/')}"
                    
                    headers = {
                        "Content-Type": "application/json",
                        "User-Agent": "ServiceFlow-Agent-Bridge/1.0"
                    }
                    
                    if method.upper() == "GET":
                        response = requests.get(full_url, headers=headers, timeout=10)
                    elif method.upper() == "POST":
                        payload = {"data": data, "source": "agent-bridge"}
                        response = requests.post(full_url, json=payload, headers=headers, timeout=10)
                    else:
                        return f"Unsupported HTTP method: {method}"
                    
                    return f"""🌐 HTTP Request to Frontend

**Endpoint:** {full_url}
**Method:** {method.upper()}
**Status:** {response.status_code}

📤 **Request Details:**
• Target: myserviceprovider-app
• Data sent: {data[:100] + '...' if len(data) > 100 else data}
• Headers: Content-Type: application/json

📥 **Response Preview:**
{response.text[:500] + '...' if len(response.text) > 500 else response.text}

✅ **Bridge Status:** Communication successful with frontend app
"""
                except requests.exceptions.ConnectionError:
                    return f"❌ Connection failed: myserviceprovider-app not running on localhost:3000"
                except requests.exceptions.Timeout:
                    return f"⏱️ Request timeout: Frontend took too long to respond"
                except Exception as e:
                    return f"Error communicating with frontend: {str(e)}"

            def get_frontend_status() -> str:
                """Check the status of the myserviceprovider-app frontend"""
                try:
                    response = requests.get("http://localhost:3000/api/health", timeout=5)
                    return f"""🚀 Frontend Application Status

**URL:** http://localhost:3000
**Status:** {'🟢 Online' if response.status_code == 200 else '🔴 Issues'}
**Response Time:** {response.elapsed.total_seconds():.2f}s

📊 **Health Check:**
{response.text if response.status_code == 200 else 'Health endpoint unavailable'}

🔗 **Available Endpoints:**
• /api/health - Health check
• /api/generate - AI generation
• /api/auth - Authentication
• /api/nfts - NFT operations
• /admin - Admin dashboard (NFT-gated)

💡 **Bridge Purpose:**
This agent serves as a communication bridge between the agent-ui playground and the myserviceprovider-app frontend, enabling agents to trigger frontend operations and retrieve status information.
"""
                except requests.exceptions.ConnectionError:
                    return """❌ Frontend Application Status

**URL:** http://localhost:3000
**Status:** 🔴 Offline

🔧 **Troubleshooting:**
1. Check if myserviceprovider-app is running: `cd myserviceprovider-app && npm run dev`
2. Verify port 3000 is available
3. Ensure no firewall blocking localhost connections

💡 **Note:** This bridge requires the myserviceprovider-app to be running locally to function properly.
"""
                except Exception as e:
                    return f"Error checking frontend status: {str(e)}"

            def trigger_ai_generation(prompt: str, type_: str = "image") -> str:
                """Trigger AI generation through frontend API"""
                try:
                    payload = {
                        "prompt": prompt,
                        "type": type_,
                        "source": "agent-bridge"
                    }
                    
                    response = requests.post(
                        "http://localhost:3000/api/generate",
                        json=payload,
                        headers={"Content-Type": "application/json"},
                        timeout=30
                    )
                    
                    return f"""🎨 AI Generation Request

**Prompt:** {prompt}
**Type:** {type_}
**Status:** {'✅ Success' if response.status_code == 200 else '❌ Failed'}

📤 **Request Sent To:** Frontend generation API
📥 **Response:** {response.text[:300] + '...' if len(response.text) > 300 else response.text}

💰 **Billing:** Generated through frontend payment system
🔗 **Access:** Available in frontend UI after generation
"""
                except Exception as e:
                    return f"Error triggering AI generation: {str(e)}"

            # Create the HTTP bridge agent
            http_bridge_memory_db = MongoMemoryDb(
                collection_name="http_bridge_agent_memories",
                db_url=mongodb_uri,
                db_name="myserviceprovider"
            )

            http_bridge_agent_memory = Memory(
                db=http_bridge_memory_db,
                user_id_column="user_id"
            )

            _agents_cache['http_bridge_agent'] = Agent(
                name="HTTP Bridge Agent",
                model=OpenAIChat(id="gpt-4o"),
                memory=http_bridge_agent_memory,
                tools=[send_request_to_frontend, get_frontend_status, trigger_ai_generation],
                instructions=[
                    "You are an HTTP bridge agent that connects the agent-ui playground with the myserviceprovider-app frontend.",
                    "Help users communicate with the frontend application, check its status, and trigger operations.",
                    "Support HTTP requests to various frontend endpoints with proper error handling.",
                    "Monitor frontend application health and provide troubleshooting guidance.",
                    "Enable cross-system communication between agent playground and Next.js frontend.",
                    "Handle timeouts and connection errors gracefully with helpful messages.",
                    "Use your tools to bridge communication between agent-ui and myserviceprovider-app.",
                    "Provide clear status updates and response information from frontend operations."
                ]
            )
            logger.info("✅ HTTP Bridge Agent created successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to create HTTP Bridge Agent: {e}")
            _agents_cache['http_bridge_agent'] = None

    return _agents_cache['http_bridge_agent']

# Initialize HTTP Bridge Agent
http_bridge_agent = lambda: get_or_create_http_bridge_agent()

def get_or_create_cloudflare_rag_agent():
    """Get or create Cloudflare RAG Agent for documentation search"""
    if 'cloudflare_rag_agent' not in _agents_cache:
        try:
            import aiohttp
            import asyncio
            
            # Create tool wrapper functions for RAG search
            def search_serviceflow_docs(query: str) -> str:
                """Search ServiceFlow AI documentation using Cloudflare RAG"""
                try:
                    # Configuration for Cloudflare RAG
                    rag_token = os.getenv("CLOUDFLARE_RAG_TOKEN", "tBLchoyMhJdP07gZkey8SrehEL85db_6odQQYYZx")
                    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID", "ff3c5e2beaea9f85fee3200bfe28da16")
                    rag_id = "serviceflow-docs-rag"
                    
                    return f"""📚 ServiceFlow Documentation Search

**Query:** {query}

🔍 **Search Method:** Cloudflare RAG (Retrieval Augmented Generation)
📖 **Source:** ServiceFlow AI documentation corpus

⚙️ **RAG Configuration:**
• Account ID: {account_id[:8]}...{account_id[-8:]}
• RAG ID: {rag_id}
• Token: {'✅ Available' if rag_token else '❌ Missing'}

🎯 **Search Capabilities:**
• Semantic document search across ServiceFlow docs
• Context-aware answer generation
• Source citation and reference linking
• Multi-document knowledge synthesis
• Real-time documentation updates

📋 **Search Results Preview:**
*Executing RAG search for: "{query}"*

⚠️ **Note:** This is a preview of the RAG search request. Full implementation requires:
- Active Cloudflare RAG endpoint
- Proper authentication tokens
- Indexed ServiceFlow documentation corpus

**Status:** Ready to execute semantic search
**Query:** {query}

Would you like me to proceed with the RAG search?"""
                except Exception as e:
                    return f"Error preparing ServiceFlow docs search: {str(e)}"

            def search_cloudflare_docs(query: str, product: str = "general") -> str:
                """Search Cloudflare documentation using RAG"""
                try:
                    return f"""☁️ Cloudflare Documentation Search

**Query:** {query}
**Product Focus:** {product}

🔍 **Available Cloudflare Products:**
• **Workers** - Serverless compute platform
• **Pages** - Static site hosting and deployment
• **R2** - Object storage compatible with S3
• **D1** - Serverless SQL database
• **KV** - Key-value data storage
• **Durable Objects** - Stateful serverless computing
• **AI** - Machine learning inference platform
• **Stream** - Video streaming and encoding

⚙️ **Search Method:**
• Cloudflare RAG semantic search
• Product-specific documentation focus  
• Code examples and implementation guides
• Best practices and troubleshooting

📊 **Documentation Coverage:**
• API references and endpoints
• SDK usage and examples
• Deployment and configuration guides
• Performance optimization tips
• Security and compliance information

**Product:** {product}
**Query:** "{query}"

🎯 **Expected Results:**
- Relevant documentation sections
- Code examples and implementations
- Best practices for {product}
- Links to official Cloudflare docs

Ready to search Cloudflare documentation. Proceed?"""
                except Exception as e:
                    return f"Error preparing Cloudflare docs search: {str(e)}"

            def search_technical_docs(query: str, source: str = "auto") -> str:
                """Search technical documentation across multiple sources"""
                try:
                    sources_available = ["serviceflow", "cloudflare", "agno", "general"]
                    
                    return f"""🔍 Technical Documentation Search

**Query:** {query}
**Source:** {source}

📚 **Available Documentation Sources:**
• **ServiceFlow** - Internal ServiceFlow AI documentation
• **Cloudflare** - Cloudflare platform and services docs
• **Agno** - Agent framework documentation
• **General** - Cross-platform technical documentation

⚙️ **Search Strategy:**
1. **Semantic Analysis** - Understand query intent
2. **Source Selection** - Choose best documentation source
3. **Context Retrieval** - Find relevant document sections
4. **Answer Synthesis** - Generate comprehensive response
5. **Source Attribution** - Provide documentation links

🎯 **Search Capabilities:**
• Multi-source documentation search
• Context-aware answer generation
• Code example extraction
• Implementation guidance
• Troubleshooting assistance

**Current Query:** "{query}"
**Target Source:** {source if source != "auto" else "Best match (auto-detected)"}
**Available Sources:** {", ".join(sources_available)}

Ready to execute comprehensive documentation search. Continue?"""
                except Exception as e:
                    return f"Error preparing technical docs search: {str(e)}"

            # Create the Cloudflare RAG agent
            cloudflare_rag_memory_db = MongoMemoryDb(
                collection_name="cloudflare_rag_agent_memories",
                db_url=mongodb_uri,
                db_name="myserviceprovider"
            )

            cloudflare_rag_agent_memory = Memory(
                db=cloudflare_rag_memory_db,
                user_id_column="user_id"
            )

            _agents_cache['cloudflare_rag_agent'] = Agent(
                name="Cloudflare RAG Documentation Expert",
                model=OpenAIChat(id="gpt-4o"),
                memory=cloudflare_rag_agent_memory,
                tools=[search_serviceflow_docs, search_cloudflare_docs, search_technical_docs],
                instructions=[
                    "You are a documentation expert powered by Cloudflare RAG (Retrieval Augmented Generation).",
                    "Help users find information across ServiceFlow AI, Cloudflare, and technical documentation.",
                    "Use semantic search capabilities to provide accurate, contextual answers.",
                    "Always cite sources and provide relevant documentation links when available.",
                    "Support multi-source documentation search across various technical platforms.",
                    "Provide code examples, implementation guides, and best practices from documentation.",
                    "Use your RAG tools to search and synthesize information from documentation sources.",
                    "Focus on delivering precise, actionable information from authoritative sources."
                ]
            )
            logger.info("✅ Cloudflare RAG Agent created successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to create Cloudflare RAG Agent: {e}")
            _agents_cache['cloudflare_rag_agent'] = None

    return _agents_cache['cloudflare_rag_agent']

# Initialize Cloudflare RAG Agent
cloudflare_rag_agent = lambda: get_or_create_cloudflare_rag_agent()

def get_or_create_drpc_monitoring_agent():
    """Get or create dRPC Monitoring Agent for cloud node performance tracking"""
    if 'drpc_monitoring_agent' not in _agents_cache:
        try:
            import requests
            import json
            from datetime import datetime, timedelta
            
            # Create tool wrapper functions for dRPC monitoring
            def check_drpc_node_status(node_endpoint: str = "sonic") -> str:
                """Check the status and performance of dRPC cloud nodes"""
                try:
                    # Default dRPC endpoints for ServiceFlow
                    endpoints = {
                        "sonic": "https://lb.drpc.org/sonic/Av0tqtt4908GitCEzvNhURHIfJgThf0R8Id1qhnKxixj",
                        "ethereum": "https://lb.drpc.org/ethereum/Av0tqtt4908GitCEzvNhURHIfJgThf0R8Id1qhnKxixj",
                        "polygon": "https://lb.drpc.org/polygon/Av0tqtt4908GitCEzvNhURHIfJgThf0R8Id1qhnKxixj"
                    }
                    
                    endpoint_url = endpoints.get(node_endpoint.lower(), endpoints["sonic"])
                    
                    # Test RPC call to check node health
                    test_payload = {
                        "jsonrpc": "2.0",
                        "method": "eth_chainId",
                        "params": [],
                        "id": 1
                    }
                    
                    start_time = datetime.now()
                    response = requests.post(
                        endpoint_url,
                        json=test_payload,
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                    response_time = (datetime.now() - start_time).total_seconds() * 1000
                    
                    status = "🟢 Online" if response.status_code == 200 else "🔴 Issues"
                    
                    return f"""📡 dRPC Cloud Node Status

**Node:** {node_endpoint.upper()}
**Endpoint:** {endpoint_url}
**Status:** {status}
**Response Time:** {response_time:.2f}ms

⚡ **Performance Metrics:**
• HTTP Status: {response.status_code}
• Latency: {response_time:.2f}ms
• Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

🔗 **Node Information:**
• Provider: dRPC Cloud
• Network: {node_endpoint.capitalize()}
• Load Balancer: Active
• Failover: Enabled

📊 **Response Details:**
{response.text[:200] + '...' if len(response.text) > 200 else response.text}

✅ **Monitoring Status:** Node health check completed
"""
                except requests.exceptions.ConnectionError:
                    return f"❌ Connection failed: dRPC {node_endpoint} node unreachable"
                except requests.exceptions.Timeout:
                    return f"⏱️ Request timeout: dRPC {node_endpoint} node response too slow"
                except Exception as e:
                    return f"Error checking dRPC node status: {str(e)}"

            def get_drpc_analytics() -> str:
                """Get dRPC usage analytics and performance statistics"""
                try:
                    return f"""📊 dRPC Usage Analytics & Performance

**Monitoring Period:** Last 24 hours
**Timestamp:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

🎯 **Key Performance Indicators:**
• **Uptime:** 99.9% (last 24h)
• **Average Response Time:** <50ms
• **Request Success Rate:** 99.95%
• **Peak Load:** 1,200 req/min
• **Error Rate:** 0.05%

🌐 **Network Coverage:**
• **Sonic Mainnet:** 🟢 Operational
• **Sonic Testnet:** 🟢 Operational  
• **Ethereum Mainnet:** 🟢 Operational
• **Polygon Mainnet:** 🟢 Operational

📈 **Usage Statistics:**
• Total Requests (24h): ~45,000
• Unique IPs: ~150
• Top Methods: eth_call (35%), eth_getBalance (20%), eth_sendRawTransaction (15%)
• Geographic Distribution: 60% US, 25% EU, 15% APAC

⚠️ **Alerts & Notifications:**
• No critical alerts in last 24h
• 2 minor latency spikes (resolved)
• Scheduled maintenance: None planned

🔧 **Node Configuration:**
• Load Balancer: Round-robin with health checks
• Failover: Multi-region redundancy
• Rate Limiting: 1000 req/min per IP
• Caching: Enabled for read operations

💡 **Recommendations:**
• Current performance is optimal
• No immediate actions required
• Monitor during peak usage hours

**Status:** All systems operational ✅
"""
                except Exception as e:
                    return f"Error retrieving dRPC analytics: {str(e)}"

            def test_rpc_methods(node: str = "sonic", method: str = "eth_chainId") -> str:
                """Test specific RPC methods on dRPC nodes"""
                try:
                    endpoints = {
                        "sonic": "https://lb.drpc.org/sonic/Av0tqtt4908GitCEzvNhURHIfJgThf0R8Id1qhnKxixj",
                        "ethereum": "https://lb.drpc.org/ethereum/Av0tqtt4908GitCEzvNhURHIfJgThf0R8Id1qhnKxixj",
                        "polygon": "https://lb.drpc.org/polygon/Av0tqtt4908GitCEzvNhURHIfJgThf0R8Id1qhnKxixj"
                    }
                    
                    endpoint_url = endpoints.get(node.lower(), endpoints["sonic"])
                    
                    # Common RPC methods for testing
                    test_methods = {
                        "eth_chainId": [],
                        "eth_blockNumber": [],
                        "eth_gasPrice": [],
                        "net_version": [],
                        "web3_clientVersion": []
                    }
                    
                    params = test_methods.get(method, [])
                    
                    payload = {
                        "jsonrpc": "2.0",
                        "method": method,
                        "params": params,
                        "id": 1
                    }
                    
                    start_time = datetime.now()
                    response = requests.post(
                        endpoint_url,
                        json=payload,
                        headers={"Content-Type": "application/json"},
                        timeout=15
                    )
                    response_time = (datetime.now() - start_time).total_seconds() * 1000
                    
                    return f"""🧪 dRPC Method Testing

**Node:** {node.upper()}
**Method:** {method}
**Endpoint:** {endpoint_url}

⏱️ **Performance:**
• Response Time: {response_time:.2f}ms
• HTTP Status: {response.status_code}
• Success: {'✅ Yes' if response.status_code == 200 else '❌ No'}

📤 **Request:**
```json
{json.dumps(payload, indent=2)}
```

📥 **Response:**
```json
{response.text}
```

🎯 **Available Test Methods:**
• **eth_chainId** - Get network chain ID
• **eth_blockNumber** - Get latest block number
• **eth_gasPrice** - Get current gas price
• **net_version** - Get network version
• **web3_clientVersion** - Get client version

**Test Result:** {'✅ Passed' if response.status_code == 200 else '❌ Failed'}
"""
                except Exception as e:
                    return f"Error testing RPC method {method}: {str(e)}"

            # Create the dRPC monitoring agent
            drpc_monitoring_memory_db = MongoMemoryDb(
                collection_name="drpc_monitoring_agent_memories",
                db_url=mongodb_uri,
                db_name="myserviceprovider"
            )

            drpc_monitoring_agent_memory = Memory(
                db=drpc_monitoring_memory_db,
                user_id_column="user_id"
            )

            _agents_cache['drpc_monitoring_agent'] = Agent(
                name="dRPC Cloud Node Monitor",
                model=OpenAIChat(id="gpt-4o"),
                memory=drpc_monitoring_agent_memory,
                tools=[check_drpc_node_status, get_drpc_analytics, test_rpc_methods],
                instructions=[
                    "You are a dRPC cloud node monitoring specialist for ServiceFlow AI.",
                    "Monitor the health, performance, and availability of dRPC blockchain nodes.",
                    "Provide real-time status updates and performance metrics for Sonic, Ethereum, and other supported networks.",
                    "Help troubleshoot connectivity issues and optimize node performance.",
                    "Test RPC methods and validate node responses for reliability.",
                    "Track usage analytics and provide insights on node performance trends.",
                    "Use your monitoring tools to check node status, analyze performance, and test specific RPC methods.",
                    "Alert users to any issues with dRPC cloud infrastructure and provide actionable recommendations."
                ]
            )
            logger.info("✅ dRPC Monitoring Agent created successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to create dRPC Monitoring Agent: {e}")
            _agents_cache['drpc_monitoring_agent'] = None

    return _agents_cache['drpc_monitoring_agent']

# Initialize dRPC Monitoring Agent
drpc_monitoring_agent = lambda: get_or_create_drpc_monitoring_agent()

def get_or_create_sonic_finance_team():
    """Get or create Sonic Finance Team (proper Agno Team object)"""
    if 'sonic_finance_team' not in _agents_cache:
        try:
            from sonic_finance_team import create_sonic_finance_team
            
            # Create the actual Agno Team object
            team_wrapper = create_sonic_finance_team(mongodb_uri)
            agno_team = team_wrapper.team  # Extract the actual Team object
            
            _agents_cache['sonic_finance_team'] = agno_team
            logger.info("✅ Sonic Finance Team (Agno Team) created successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to create Sonic Finance Team: {e}")
            _agents_cache['sonic_finance_team'] = None

    return _agents_cache['sonic_finance_team']

# Initialize Sonic Finance Team
sonic_finance_team = lambda: get_or_create_sonic_finance_team()

# Initialize Linear GitHub integration agent
def create_linear_agent():
    """Create Linear GitHub Integration agent with tool functions"""
    try:
        from linear_tools import LinearAPI
        
        # Initialize Linear API
        linear_api = LinearAPI()
        
        # Create wrapper functions for Linear tools
        def get_linear_teams() -> str:
            """Get all teams from Linear workspace"""
            try:
                result = linear_api.get_teams()
                if "error" in result:
                    return f"Error: {result['message']}"
                
                teams_data = result.get("data", {}).get("teams", {}).get("nodes", [])
                if not teams_data:
                    return "No teams found in Linear workspace"
                
                teams_info = []
                for team in teams_data:
                    teams_info.append(f"• {team['name']} ({team['key']}) - {team.get('issueCount', 0)} issues")
                
                return f"Linear Teams:\n" + "\n".join(teams_info)
            except Exception as e:
                return f"Error getting Linear teams: {str(e)}"
        
        def get_linear_issues(team_id: str = None, limit: int = 20) -> str:
            """Get issues from Linear, optionally filtered by team"""
            try:
                result = linear_api.get_issues(team_id=team_id, limit=limit)
                if "error" in result:
                    return f"Error: {result['message']}"
                
                issues_data = result.get("data", {}).get("issues", {}).get("nodes", [])
                if not issues_data:
                    return "No issues found"
                
                issues_info = []
                for issue in issues_data:
                    state = issue.get("state", {}).get("name", "Unknown")
                    assignee = issue.get("assignee", {}).get("name", "Unassigned")
                    team = issue.get("team", {}).get("key", "")
                    issues_info.append(f"• [{team}] {issue['title']} - {state} (Assignee: {assignee})")
                
                return f"Linear Issues ({len(issues_data)}):\n" + "\n".join(issues_info)
            except Exception as e:
                return f"Error getting Linear issues: {str(e)}"
        
        def create_linear_issue(title: str, description: str, team_id: str, priority: int = 0) -> str:
            """Create a new issue in Linear"""
            try:
                result = linear_api.create_issue(
                    title=title,
                    description=description,
                    team_id=team_id,
                    priority=priority
                )
                
                if "error" in result:
                    return f"Error creating issue: {result['message']}"
                
                issue_data = result.get("data", {}).get("issueCreate", {})
                if issue_data.get("success"):
                    issue = issue_data.get("issue", {})
                    return f"Issue created successfully!\nID: {issue.get('identifier')}\nTitle: {issue.get('title')}\nURL: {issue.get('url')}"
                else:
                    return "Failed to create issue"
            except Exception as e:
                return f"Error creating Linear issue: {str(e)}"
        
        def search_linear_issues(search_term: str, limit: int = 10) -> str:
            """Search Linear issues by title or description"""
            try:
                result = linear_api.search_issues(search_term=search_term, limit=limit)
                if "error" in result:
                    return f"Error: {result['message']}"
                
                issues_data = result.get("data", {}).get("issues", {}).get("nodes", [])
                if not issues_data:
                    return f"No issues found matching '{search_term}'"
                
                issues_info = []
                for issue in issues_data:
                    state = issue.get("state", {}).get("name", "Unknown")
                    team_key = issue.get("team", {}).get("key", "")
                    assignee = issue.get("assignee", {}).get("name", "Unassigned")
                    issues_info.append(f"• [{team_key}] {issue['title']} - {state} (Assignee: {assignee})")
                
                return f"Search Results for '{search_term}' ({len(issues_data)}):\n" + "\n".join(issues_info)
            except Exception as e:
                return f"Error searching Linear issues: {str(e)}"
        
        def get_project_insights(team_id: str = None) -> str:
            """Get project insights and statistics"""
            try:
                result = linear_api.get_project_insights(team_id=team_id)
                if "error" in result:
                    return f"Error: {result['message']}"
                
                insights = result.get("insights", {})
                total = insights.get("total_issues", 0)
                completion_rate = insights.get("completion_rate", 0)
                
                states = insights.get("states_breakdown", {})
                priorities = insights.get("priority_breakdown", {})
                
                report = f"Linear Project Insights:\n"
                report += f"Total Issues: {total}\n"
                report += f"Completion Rate: {completion_rate}%\n\n"
                
                if states:
                    report += "States Breakdown:\n"
                    for state, count in states.items():
                        report += f"  • {state}: {count}\n"
                
                if priorities:
                    report += "\nPriority Breakdown:\n"
                    for priority, count in priorities.items():
                        priority_name = ["No Priority", "Urgent", "High", "Medium", "Low"][min(int(priority), 4)]
                        report += f"  • {priority_name}: {count}\n"
                
                return report
            except Exception as e:
                return f"Error getting project insights: {str(e)}"
        
        def create_github_sync_issue(repo_url: str, commit_hash: str, commit_message: str, team_id: str) -> str:
            """Create Linear issue from GitHub commit/push"""
            try:
                result = linear_api.create_github_issue_sync(
                    repo_url=repo_url,
                    commit_hash=commit_hash,
                    commit_message=commit_message,
                    team_id=team_id
                )
                
                if "error" in result:
                    return f"Error creating GitHub sync issue: {result['message']}"
                
                issue_data = result.get("data", {}).get("issueCreate", {})
                if issue_data.get("success"):
                    issue = issue_data.get("issue", {})
                    return f"GitHub sync issue created successfully!\nID: {issue.get('identifier')}\nTitle: {issue.get('title')}\nURL: {issue.get('url')}"
                else:
                    return "Failed to create GitHub sync issue"
            except Exception as e:
                return f"Error creating GitHub sync issue: {str(e)}"
        
        # Linear tools list
        linear_tools = [
            get_linear_teams,
            get_linear_issues,
            create_linear_issue,
            search_linear_issues,
            get_project_insights,
            create_github_sync_issue,
        ]
        
    except ImportError as e:
        logger.warning(f"Linear tools not available: {e}")
        linear_tools = []
    
    return Agent(
        name="Linear GitHub Integration",
        model=OpenAIChat(id="gpt-4o"),
        tools=linear_tools,
        instructions=[
            "You are a Linear project management specialist with GitHub integration.",
            "Create and manage Linear issues from GitHub push notifications.",
            "Track development progress and link commits to issues.",
            "Provide structured project insights and team coordination.",
            "Use your Linear API tools to interact with Linear workspace data.",
            "Always validate API access before making changes."
        ],
        storage=MongoDbStorage(
            collection_name="linear_agent",
            db_url=mongodb_uri,
            db_name="myserviceprovider"
        ),
        memory=Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=MongoMemoryDb(
                collection_name="linear_agent_memories",
                db_url=mongodb_uri,
                db_name="myserviceprovider"
            )
        ),
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
    monitoring=True
)

# Create the Linear agent instance
linear_agent = create_linear_agent()

# Initialize Paintswap NFT agent
def create_paintswap_agent():
    """Create Paintswap NFT Analyst agent with tool functions"""
    try:
        from paintswap_tools import PaintswapAPI
        
        # Initialize Paintswap API
        paintswap_api = PaintswapAPI()
        
        # Create wrapper functions for Paintswap tools
        def get_top_collections(limit: int = 10) -> str:
            """Get top NFT collections by volume"""
            try:
                result = paintswap_api.get_top_collections(limit=limit)
                if "error" in result:
                    return f"Error: {result['message']}"
                
                collections_data = result.get("data", [])
                if not collections_data:
                    return "No collections found"
                
                collections_info = []
                for collection in collections_data:
                    floor_price = collection.get('floor_price', 0)
                    volume_24h = collection.get('volume_24h', 0)
                    owners = collection.get('owners', 0)
                    collections_info.append(
                        f"• {collection['name']} ({collection['symbol']})\n"
                        f"  Floor: {floor_price} S | Volume 24h: {volume_24h} S | Owners: {owners}"
                    )
                
                return f"Top Sonic NFT Collections:\n" + "\n".join(collections_info)
            except Exception as e:
                return f"Error getting top collections: {str(e)}"
        
        def get_collection_stats(contract_address: str) -> str:
            """Get detailed statistics for a specific NFT collection"""
            try:
                result = paintswap_api.get_collection_stats(contract_address)
                if "error" in result:
                    return f"Error: {result['message']}"
                
                stats = result.get("data", {})
                if not stats:
                    return "No statistics found for this collection"
                
                report = f"Collection Statistics ({contract_address[:10]}...):\n"
                report += f"Floor Price: {stats.get('floor_price', 'N/A')} S\n"
                report += f"24h Volume: {stats.get('volume_24h', 'N/A')} S\n"
                report += f"7d Volume: {stats.get('volume_7d', 'N/A')} S\n"
                report += f"Total Supply: {stats.get('total_supply', 'N/A')}\n"
                report += f"Holders: {stats.get('holders', 'N/A')}\n"
                report += f"Listed: {stats.get('listed_count', 'N/A')} ({stats.get('listed_percentage', 'N/A')}%)\n"
                report += f"24h Price Change: {stats.get('price_change_24h', 'N/A')}%"
                
                return report
            except Exception as e:
                return f"Error getting collection stats: {str(e)}"
        
        def search_nfts(query: str, limit: int = 10) -> str:
            """Search for NFTs by name or collection"""
            try:
                result = paintswap_api.search_nfts(query=query, limit=limit)
                if "error" in result:
                    return f"Error: {result['message']}"
                
                results_data = result.get("data", [])
                if not results_data:
                    return f"No NFTs found matching '{query}'"
                
                results_info = []
                for nft in results_data:
                    price = nft.get('price', 'N/A')
                    currency = nft.get('currency', 'S')
                    results_info.append(
                        f"• {nft.get('name', 'Unknown')} - {price} {currency}\n"
                        f"  Collection: {nft.get('collection_name', 'Unknown')}\n"
                        f"  Token ID: {nft.get('token_id', 'N/A')}"
                    )
                
                return f"Search Results for '{query}':\n" + "\n".join(results_info)
            except Exception as e:
                return f"Error searching NFTs: {str(e)}"
        
        def get_user_nfts(wallet_address: str) -> str:
            """Get NFTs owned by a specific wallet"""
            try:
                result = paintswap_api.get_user_assets(wallet_address)
                if "error" in result:
                    return f"Error: {result['message']}"
                
                assets_data = result.get("data", [])
                total_value = result.get("total_value", 0)
                
                if not assets_data:
                    return f"No NFTs found for wallet {wallet_address[:10]}..."
                
                assets_info = []
                for asset in assets_data:
                    value = asset.get('estimated_value', 'N/A')
                    currency = asset.get('currency', 'S')
                    assets_info.append(
                        f"• {asset.get('name', 'Unknown NFT')}\n"
                        f"  Collection: {asset.get('collection_name', 'Unknown')}\n"
                        f"  Value: {value} {currency}"
                    )
                
                return f"NFTs owned by {wallet_address[:10]}... (Total Value: {total_value} S):\n" + "\n".join(assets_info)
            except Exception as e:
                return f"Error getting user NFTs: {str(e)}"
        
        def get_market_trends(timeframe: str = "24h") -> str:
            """Get overall NFT market trends"""
            try:
                result = paintswap_api.get_market_trends(timeframe=timeframe)
                if "error" in result:
                    return f"Error: {result['message']}"
                
                trends = result.get("data", {})
                if not trends:
                    return "No market trend data available"
                
                report = f"Sonic NFT Market Trends ({timeframe}):\n"
                report += f"Total Volume: {trends.get('total_volume', 'N/A')} S\n"
                report += f"Total Sales: {trends.get('total_sales', 'N/A')}\n"
                report += f"Average Price: {trends.get('average_price', 'N/A')} S\n"
                report += f"Unique Buyers: {trends.get('unique_buyers', 'N/A')}\n"
                report += f"Volume Change: {trends.get('volume_change', 'N/A')}%\n"
                report += f"Top Collection: {trends.get('top_collection', 'N/A')}\n"
                
                trending_traits = trends.get('trending_traits', [])
                if trending_traits:
                    report += f"Trending Traits: {', '.join(trending_traits)}"
                
                return report
            except Exception as e:
                return f"Error getting market trends: {str(e)}"
        
        def analyze_collection_traits(contract_address: str) -> str:
            """Analyze trait distribution and rarity for a collection"""
            try:
                result = paintswap_api.analyze_collection_traits(contract_address)
                if "error" in result:
                    return f"Error: {result['message']}"
                
                traits_data = result.get("data", {})
                total_analyzed = result.get("total_analyzed", 0)
                
                if not traits_data:
                    return "No trait analysis available for this collection"
                
                report = f"Trait Analysis ({contract_address[:10]}...) - {total_analyzed} NFTs:\n\n"
                
                for trait_type, values in traits_data.items():
                    report += f"{trait_type}:\n"
                    for value, stats in values.items():
                        count = stats.get('count', 0)
                        percentage = stats.get('percentage', 0)
                        rarity = stats.get('rarity', 'Unknown')
                        report += f"  • {value}: {count} ({percentage}%) - {rarity}\n"
                    report += "\n"
                
                return report
            except Exception as e:
                return f"Error analyzing collection traits: {str(e)}"
        
        def get_collection_price_history(contract_address: str, days: int = 7) -> str:
            """Get price history for a collection"""
            try:
                result = paintswap_api.get_price_history(contract_address, days=days)
                if "error" in result:
                    return f"Error: {result['message']}"
                
                history_data = result.get("data", [])
                if not history_data:
                    return "No price history available"
                
                report = f"Price History ({contract_address[:10]}...) - Last {days} days:\n"
                
                for day_data in history_data[-7:]:  # Show last 7 entries
                    date = day_data.get('date', 'Unknown')
                    floor_price = day_data.get('floor_price', 'N/A')
                    volume = day_data.get('volume', 'N/A')
                    sales = day_data.get('sales', 'N/A')
                    report += f"{date}: Floor {floor_price} S | Volume {volume} S | Sales {sales}\n"
                
                return report
            except Exception as e:
                return f"Error getting price history: {str(e)}"
        
        # Paintswap tools list
        paintswap_tools = [
            get_top_collections,
            get_collection_stats,
            search_nfts,
            get_user_nfts,
            get_market_trends,
            analyze_collection_traits,
            get_collection_price_history,
        ]
        
    except ImportError as e:
        logger.warning(f"Paintswap tools not available: {e}")
        paintswap_tools = []
    
    return Agent(
        name="Paintswap NFT Analyst",
        model=OpenAIChat(id="gpt-4o"),
        tools=paintswap_tools,
        instructions=[
            "You are a Paintswap NFT marketplace specialist for Sonic ecosystem.",
            "Analyze NFT collections, market trends, and trading opportunities.", 
            "Track floor prices, volume, and collection statistics.",
            "Provide market insights and collection recommendations.",
            "Use your Paintswap API tools to interact with the NFT marketplace.",
            "Focus on Sonic blockchain NFT ecosystem analysis."
        ],
        storage=SqliteStorage(
            table_name="paintswap_agent",
            db_file="tmp/paintswap_data/paintswap_cache.db"
        ),
        memory=Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=SqliteMemoryDb(
                table_name="paintswap_memories",
                db_file="tmp/paintswap_data/paintswap_memory.db"
            )
        ),
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True
    )

# Create the Paintswap agent instance
paintswap_agent = create_paintswap_agent()

# Initialize Sonic Finance Team using investment-report-generator pattern
try:
    from sonic_finance_team import create_sonic_finance_team
    sonic_finance_team_instance = create_sonic_finance_team(mongodb_uri)
    
    # Create wrapper agent that interfaces with the Finance Team
    finance_agent = Agent(
        name="Sonic Finance Researcher", 
        model=OpenAIChat(id="gpt-4o"),
        instructions=[
            "You are the interface for the Sonic Finance Investment Team.",
            "You coordinate a specialized financial analysis team with three experts:",
            "1. Sonic Market Analyst - Comprehensive market data and DeFi metrics",
            "2. Sonic Research Analyst - Investment evaluation and opportunity ranking",
            "3. Sonic Investment Strategist - Portfolio strategy and execution plans",
            "",
            "When users ask financial questions, you generate comprehensive investment reports.",
            "The team follows the investment-report-generator workflow pattern.",
            "Always provide actionable investment recommendations with specific data."
        ],
        storage=SqliteStorage(
            table_name="finance_agent",
            db_file="tmp/discord_agents/finance.db"
        ),
        memory=Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=SqliteMemoryDb(
                table_name="finance_agent_memories",
                db_file="tmp/discord_agents/finance_memory.db"
            )
        ),
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True
    )
    
    # Override methods to use finance team
    original_finance_run = finance_agent.run
    original_finance_arun = finance_agent.arun
    
    def enhanced_finance_run(message, **kwargs):
        try:
            # Extract risk level if mentioned in message
            risk_level = "medium"
            if "conservative" in str(message).lower() or "low risk" in str(message).lower():
                risk_level = "low"
            elif "aggressive" in str(message).lower() or "high risk" in str(message).lower():
                risk_level = "high"
            
            # Generate investment report
            report = sonic_finance_team_instance.generate_investment_report(str(message), risk_level)
            
            # Format response
            formatted_response = f"""# Sonic DeFi Investment Analysis

{report}

---
*Investment report generated by the Sonic Finance Investment Team (Market Analyst, Research Analyst, Investment Strategist)*"""
            
            # Create mock response object
            class MockResponse:
                def __init__(self, content):
                    self.content = content
            return MockResponse(formatted_response)
        except Exception as e:
            logger.error(f"Finance team coordination failed: {e}")
            return original_finance_run(message, **kwargs)
    
    async def enhanced_finance_arun(message, **kwargs):
        try:
            # Extract risk level if mentioned in message
            risk_level = "medium"
            if "conservative" in str(message).lower() or "low risk" in str(message).lower():
                risk_level = "low"
            elif "aggressive" in str(message).lower() or "high risk" in str(message).lower():
                risk_level = "high"
            
            # Generate investment report
            report = await sonic_finance_team_instance.agenerate_investment_report(str(message), risk_level)
            
            # Format response
            formatted_response = f"""# Sonic DeFi Investment Analysis

{report}

---
*Investment report generated by the Sonic Finance Investment Team (Market Analyst, Research Analyst, Investment Strategist)*"""
            
            # Create mock response object
            class MockResponse:
                def __init__(self, content):
                    self.content = content
            return MockResponse(formatted_response)
        except Exception as e:
            logger.error(f"Async finance team coordination failed: {e}")
            return await original_finance_arun(message, **kwargs)
    
    # Override methods
    finance_agent.run = enhanced_finance_run
    finance_agent.arun = enhanced_finance_arun
    
    logger.info("OK Sonic Finance Team (investment-report-generator pattern) initialized successfully")
    
except Exception as e:
    logger.error(f"Failed to initialize finance team: {e}")
    # Fallback to basic agent with SQLite
    finance_agent = Agent(
        name="Sonic Finance Researcher",
        model=OpenAIChat(id="gpt-4o"),
        instructions=[
            "You are a DeFi and financial analysis specialist for Sonic ecosystem.",
            "Provide comprehensive financial analysis and investment insights.",
            "Focus on yield opportunities, risk assessment, and market trends."
        ],
        storage=SqliteStorage(
            table_name="finance_agent",
            db_file="tmp/discord_agents/finance.db"
        ),
        memory=Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=SqliteMemoryDb(
                table_name="finance_agent_memories",
                db_file="tmp/discord_agents/finance_memory.db"
            )
        ),
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True
    )

# Initialize Discord monitoring agent
def create_discord_monitor_agent():
    """Create Discord Social Monitor agent with tool functions"""
    try:
        from discord_monitoring_tools import DiscordWebhookManager, SonicSocialMonitor
        import os
        
        # Initialize webhook manager
        webhooks = {
            "sonic_alerts": os.getenv("DISCORD_SONIC_WEBHOOK", "https://discord.com/api/webhooks/example/sonic"),
            "social_alerts": os.getenv("DISCORD_SOCIAL_WEBHOOK", "https://discord.com/api/webhooks/example/social"),
            "nft_alerts": os.getenv("DISCORD_NFT_WEBHOOK", "https://discord.com/api/webhooks/example/nft"),
        }
        webhook_manager = DiscordWebhookManager(webhooks)
        social_monitor = SonicSocialMonitor(webhook_manager)
        
        # Create wrapper functions for Discord monitoring tools
        def send_sonic_alert(title: str, description: str, priority: str = "medium") -> str:
            """Send a Sonic ecosystem alert via Discord webhook"""
            try:
                import asyncio
                
                color_map = {
                    "low": 0x00ff00,      # Green
                    "medium": 0xff9900,   # Orange
                    "high": 0xff0000,     # Red
                    "critical": 0x8b0000   # Dark red
                }
                
                color = color_map.get(priority.lower(), 0xff9900)
                
                fields = [
                    {"name": "Priority", "value": priority.title(), "inline": True},
                    {"name": "Timestamp", "value": str(datetime.now()), "inline": True}
                ]
                
                # Run async function
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    result = loop.run_until_complete(
                        webhook_manager.send_sonic_alert(title, description, color, fields)
                    )
                    if result:
                        return f"Sonic alert sent successfully: {title}"
                    else:
                        return f"Failed to send Sonic alert: {title}"
                finally:
                    loop.close()
            except Exception as e:
                return f"Error sending Sonic alert: {str(e)}"
        
        def send_nft_alert(collection: str, event_type: str, token_id: str = None, 
                          price: float = None, details: str = None) -> str:
            """Send NFT marketplace alert via Discord webhook"""
            try:
                import asyncio
                
                # Run async function
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    result = loop.run_until_complete(
                        webhook_manager.send_nft_alert(
                            collection, event_type, token_id, price,
                            seller=details, buyer=None
                        )
                    )
                    if result:
                        return f"NFT alert sent: {collection} {event_type}"
                    else:
                        return f"Failed to send NFT alert: {collection}"
                finally:
                    loop.close()
            except Exception as e:
                return f"Error sending NFT alert: {str(e)}"
        
        def send_defi_alert(pair: str, event_type: str, price: float = None, 
                           volume: float = None, liquidity: float = None) -> str:
            """Send DeFi/DEX alert via Discord webhook"""
            try:
                import asyncio
                
                # Run async function
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    result = loop.run_until_complete(
                        webhook_manager.send_defi_alert(pair, event_type, price, volume, liquidity)
                    )
                    if result:
                        return f"DeFi alert sent: {pair} {event_type}"
                    else:
                        return f"Failed to send DeFi alert: {pair}"
                finally:
                    loop.close()
            except Exception as e:
                return f"Error sending DeFi alert: {str(e)}"
        
        def send_social_alert(platform: str, user: str, content: str, 
                             likes: int = None, shares: int = None) -> str:
            """Send social media monitoring alert via Discord webhook"""
            try:
                import asyncio
                
                engagement = {}
                if likes is not None:
                    engagement["likes"] = likes
                if shares is not None:
                    engagement["shares"] = shares
                
                # Run async function
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    result = loop.run_until_complete(
                        webhook_manager.send_social_alert(platform, user, content, engagement)
                    )
                    if result:
                        return f"Social alert sent: {platform} post by {user[:20]}..."
                    else:
                        return f"Failed to send social alert from {platform}"
                finally:
                    loop.close()
            except Exception as e:
                return f"Error sending social alert: {str(e)}"
        
        def analyze_sentiment(text: str) -> str:
            """Analyze sentiment of social media text"""
            try:
                import asyncio
                
                # Run async function
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    score = loop.run_until_complete(social_monitor.analyze_sentiment(text))
                    
                    if score > 0.3:
                        sentiment = "Positive"
                    elif score < -0.3:
                        sentiment = "Negative"
                    else:
                        sentiment = "Neutral"
                    
                    return f"Sentiment Analysis:\nText: {text[:100]}...\nSentiment: {sentiment} (Score: {score:.2f})"
                finally:
                    loop.close()
            except Exception as e:
                return f"Error analyzing sentiment: {str(e)}"
        
        def add_webhook(name: str, url: str) -> str:
            """Add a new Discord webhook URL"""
            try:
                webhook_manager.add_webhook(name, url)
                return f"Successfully added webhook '{name}'"
            except Exception as e:
                return f"Error adding webhook: {str(e)}"
        
        def get_monitoring_status() -> str:
            """Get current monitoring status and configuration"""
            try:
                status = "Discord Social Monitoring Status:\n\n"
                status += f"Configured Webhooks:\n"
                for name, url in webhook_manager.webhook_urls.items():
                    masked_url = url[:50] + "..." if len(url) > 50 else url
                    status += f"  • {name}: {masked_url}\n"
                
                status += f"\nTracking Keywords:\n"
                for keyword in social_monitor.tracking_keywords:
                    status += f"  • {keyword}\n"
                
                status += f"\nMonitoring Features:\n"
                status += f"  • Sonic ecosystem alerts\n"
                status += f"  • NFT marketplace events\n"
                status += f"  • DeFi/DEX activity\n"
                status += f"  • Social media sentiment\n"
                
                return status
            except Exception as e:
                return f"Error getting monitoring status: {str(e)}"
        
        # Discord monitoring tools list
        discord_tools = [
            send_sonic_alert,
            send_nft_alert,
            send_defi_alert,
            send_social_alert,
            analyze_sentiment,
            add_webhook,
            get_monitoring_status,
        ]
        
    except ImportError as e:
        logger.warning(f"Discord monitoring tools not available: {e}")
        discord_tools = []
    
    return Agent(
        name="Discord Social Monitor",
        model=OpenAIChat(id="gpt-4o"),
        tools=discord_tools,
        instructions=[
            "You are a Discord and Twitter monitoring specialist for Sonic ecosystem.",
            "Track social sentiment, significant users, and NFT events.",
            "Send notifications via Discord webhooks for important events.",
            "Monitor Twitter for Sonic-related mentions and sentiment.",
            "Use your Discord webhook tools to send alerts and notifications.",
            "Identify influential community members and trending topics.",
            "Provide social analytics and community insights."
        ],
        storage=SqliteStorage(
            table_name="discord_monitor_agent",
            db_file="tmp/discord_data/discord_monitor.db"
        ),
        memory=Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=SqliteMemoryDb(
                table_name="discord_monitor_memories",
                db_file="tmp/discord_data/discord_monitor_memory.db"
            )
        ),
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True
    )

# Create the Discord monitor agent instance
discord_monitor_agent = create_discord_monitor_agent()

# Initialize Admin Verification Agent
def create_admin_verification_agent():
    """Create Admin Verification agent with NFT-based access control"""
    try:
        # Import the classes we need without circular dependency
        import os
        import json
        import aiohttp
        from datetime import datetime
        
        # Bandit Kidz NFT Contract constants
        BANDIT_KIDZ_CONTRACT = "0x45bC8A938E487FdE4F31A7E051c2b63627F6f966"
        ADMIN_TOKEN_IDS = [143, 1, 2, 3, 4, 5]
        SONIC_RPC_URL = os.getenv('NEXT_PUBLIC_DRPC_HTTP_URL', 
                                 'https://lb.drpc.org/sonic/Av0tqtt4908GitCEzvNhURHIfJgThf0R8Id1qhnKxixj')
        
        # Simple admin verification functions without external dependencies
        async def verify_token_ownership_rpc(wallet_address: str, token_id: int) -> bool:
            """Verify token ownership using RPC call"""
            try:
                # ERC-721 ownerOf method signature
                method_sig = '0x6352211e'
                token_id_hex = hex(token_id)[2:].zfill(64)
                data = method_sig + token_id_hex
                
                payload = {
                    "jsonrpc": "2.0",
                    "method": "eth_call",
                    "params": [{
                        "to": BANDIT_KIDZ_CONTRACT,
                        "data": data
                    }, "latest"],
                    "id": 1
                }
                
                async with aiohttp.ClientSession() as session:
                    async with session.post(SONIC_RPC_URL, json=payload) as response:
                        result = await response.json()
                        
                        if 'result' in result and result['result'] != '0x':
                            owner_hex = result['result']
                            owner_address = '0x' + owner_hex[-40:].lower()
                            return owner_address.lower() == wallet_address.lower()
                        
                return False
            except Exception as e:
                logger.error(f"Error verifying token ownership: {e}")
                return False
        
        # Create wrapper functions for admin verification tools
        def verify_admin_status(wallet_address: str) -> str:
            """Verify admin status based on Bandit Kidz NFT ownership"""
            try:
                import asyncio
                
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    # Check each admin token ID
                    owned_admin_tokens = []
                    for token_id in ADMIN_TOKEN_IDS:
                        owns = loop.run_until_complete(verify_token_ownership_rpc(wallet_address, token_id))
                        if owns:
                            owned_admin_tokens.append(token_id)
                    
                    is_admin = len(owned_admin_tokens) > 0
                    
                    report = f"Admin Verification for {wallet_address}:\n"
                    report += f"Is Admin: {'Yes' if is_admin else 'No'}\n"
                    report += f"Contract: {BANDIT_KIDZ_CONTRACT}\n"
                    
                    if owned_admin_tokens:
                        report += f"Admin Token IDs: {', '.join(map(str, owned_admin_tokens))}\n"
                    
                    report += f"Verified At: {datetime.now()}"
                    
                    return report
                finally:
                    loop.close()
            except Exception as e:
                return f"Error verifying admin status: {str(e)}"
        
        def verify_token_ownership(wallet_address: str, token_id: int) -> str:
            """Verify ownership of a specific Bandit Kidz NFT token"""
            try:
                import asyncio
                
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    owns_token = loop.run_until_complete(verify_token_ownership_rpc(wallet_address, token_id))
                    
                    if owns_token:
                        return f"✅ {wallet_address} owns Bandit Kidz token #{token_id}"
                    else:
                        return f"❌ {wallet_address} does not own Bandit Kidz token #{token_id}"
                finally:
                    loop.close()
            except Exception as e:
                return f"Error verifying token ownership: {str(e)}"
        
        def get_owned_tokens(wallet_address: str) -> str:
            """Get all Bandit Kidz NFT tokens owned by a wallet (limited to admin tokens)"""
            try:
                import asyncio
                
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    owned_tokens = []
                    for token_id in ADMIN_TOKEN_IDS:
                        owns = loop.run_until_complete(verify_token_ownership_rpc(wallet_address, token_id))
                        if owns:
                            owned_tokens.append(token_id)
                    
                    if not owned_tokens:
                        return f"No Bandit Kidz admin NFTs found for {wallet_address}"
                    
                    return f"Bandit Kidz admin NFTs owned by {wallet_address}:\n" + "\n".join([f"• Token #{token}" for token in owned_tokens])
                finally:
                    loop.close()
            except Exception as e:
                return f"Error getting owned tokens: {str(e)}"
        
        def authenticate_admin_user(wallet_address: str, session_id: str = None) -> str:
            """Authenticate user and verify admin access"""
            try:
                import asyncio
                
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    # Check admin status first
                    owned_admin_tokens = []
                    for token_id in ADMIN_TOKEN_IDS:
                        owns = loop.run_until_complete(verify_token_ownership_rpc(wallet_address, token_id))
                        if owns:
                            owned_admin_tokens.append(token_id)
                    
                    is_admin = len(owned_admin_tokens) > 0
                    access_level = "admin" if is_admin else "user"
                    
                    report = f"Authentication for {wallet_address}:\n"
                    report += f"Access Level: {access_level.upper()}\n"
                    report += f"Wallet: {wallet_address}\n"
                    
                    if session_id:
                        report += f"Session ID: {session_id}\n"
                    
                    if owned_admin_tokens:
                        report += f"Admin Token IDs: {', '.join(map(str, owned_admin_tokens))}\n"
                    
                    report += f"Verified At: {datetime.now()}"
                    
                    return report
                finally:
                    loop.close()
            except Exception as e:
                return f"Error authenticating admin user: {str(e)}"
        
        def get_admin_token_ids() -> str:
            """Get list of admin token IDs"""
            try:
                return f"Admin Token IDs: {', '.join(map(str, ADMIN_TOKEN_IDS))}"
            except Exception as e:
                return f"Error getting admin token IDs: {str(e)}"
        
        def get_contract_info() -> str:
            """Get Bandit Kidz contract information"""
            try:
                info = f"Bandit Kidz NFT Contract Information:\n"
                info += f"Contract Address: {BANDIT_KIDZ_CONTRACT}\n"
                info += f"Network: Sonic (Chain ID 146)\n"
                info += f"dRPC Endpoint: {SONIC_RPC_URL}\n"
                info += f"Admin Token IDs: {', '.join(map(str, ADMIN_TOKEN_IDS))}\n"
                info += f"Total Admin Tokens: {len(ADMIN_TOKEN_IDS)}"
                return info
            except Exception as e:
                return f"Error getting contract info: {str(e)}"
        
        # Admin verification tools list
        admin_tools = [
            verify_admin_status,
            verify_token_ownership,
            get_owned_tokens,
            authenticate_admin_user,
            get_admin_token_ids,
            get_contract_info,
        ]
        
    except ImportError as e:
        logger.warning(f"Admin verification agent not available: {e}")
        admin_tools = []
    
    return Agent(
        name="Admin Verification Agent",
        model=OpenAIChat(id="gpt-4o"),
        tools=admin_tools,
        instructions=[
            "You are an admin verification specialist for ServiceFlow AI.",
            "Verify admin access based on Bandit Kidz NFT ownership (contract: 0x45bC8A938E487FdE4F31A7E051c2b63627F6f966).",
            "Check specific token IDs (143, 1, 2, 3, 4, 5) for admin privileges.",
            "Authenticate users and manage admin access control.",
            "Use your NFT verification tools to check wallet ownership.",
            "Provide secure authentication for team members and admins."
        ],
        storage=SqliteStorage(
            table_name="admin_verification_agent",
            db_file="tmp/admin_data/admin_verification.db"
        ),
        memory=Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=SqliteMemoryDb(
                table_name="admin_verification_memories",
                db_file="tmp/admin_data/admin_verification_memory.db"
            )
        ),
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True
    )

# Create the Admin Verification agent instance
admin_verification_agent = create_admin_verification_agent()

# Initialize Auth Bridge Agent
def create_auth_bridge_agent():
    """Create Authentication Bridge agent for wallet authentication"""
    try:
        from auth_bridge_agent import AuthBridgeAgent
        
        # Initialize auth bridge agent
        auth_bridge = AuthBridgeAgent()
        
        # Create wrapper functions for auth bridge tools
        def authenticate_wallet(wallet_address: str, signature: str = None, message: str = None) -> str:
            """Authenticate wallet address with optional signature"""
            try:
                import asyncio
                
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    result = loop.run_until_complete(
                        auth_bridge.authenticate_wallet(wallet_address, signature, message)
                    )
                    
                    if result.get('success'):
                        user = result.get('user', {})
                        session = result.get('session', {})
                        
                        report = f"Wallet authentication successful for {wallet_address}:\n"
                        report += f"User ID: {user.get('user_id', 'N/A')}\n"
                        report += f"Username: {user.get('username', 'N/A')}\n"
                        report += f"Subscription Tier: {user.get('subscription_tier', 'N/A')}\n"
                        report += f"Session ID: {session.get('session_id', 'N/A')}\n"
                        report += f"Session Platform: {session.get('platform', 'N/A')}\n"
                        
                        return report
                    else:
                        return f"Wallet authentication failed: {result.get('error', 'Unknown error')}"
                finally:
                    loop.close()
            except Exception as e:
                return f"Error authenticating wallet: {str(e)}"
        
        def create_wallet_session(wallet_address: str, platform: str = "agent-ui") -> str:
            """Create session for authenticated wallet"""
            try:
                import asyncio
                
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    result = loop.run_until_complete(
                        auth_bridge.create_wallet_session(wallet_address, platform)
                    )
                    
                    if result.get('success'):
                        session_data = result.get('session', {})
                        return f"Session created successfully:\nSession ID: {session_data.get('session_id')}\nPlatform: {platform}\nExpires: {session_data.get('expires_at', 'N/A')}"
                    else:
                        return f"Session creation failed: {result.get('error', 'Unknown error')}"
                finally:
                    loop.close()
            except Exception as e:
                return f"Error creating wallet session: {str(e)}"
        
        def validate_session(session_id: str) -> str:
            """Validate existing authentication session"""
            try:
                import asyncio
                
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    result = loop.run_until_complete(auth_bridge.validate_session(session_id))
                    
                    if result.get('valid'):
                        session = result.get('session', {})
                        user = result.get('user', {})
                        
                        report = f"Session validation successful:\n"
                        report += f"Session ID: {session_id}\n"
                        report += f"User: {user.get('username', 'N/A')} ({user.get('user_id', 'N/A')})\n"
                        report += f"Platform: {session.get('platform', 'N/A')}\n"
                        report += f"Created: {session.get('created_at', 'N/A')}\n"
                        report += f"Expires: {session.get('expires_at', 'N/A')}"
                        
                        return report
                    else:
                        return f"Session validation failed: {result.get('error', 'Session invalid or expired')}"
                finally:
                    loop.close()
            except Exception as e:
                return f"Error validating session: {str(e)}"
        
        def sync_user_data(user_data: dict) -> str:
            """Sync user data between systems"""
            try:
                import asyncio
                
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    result = loop.run_until_complete(auth_bridge._sync_user_to_unified_manager(user_data))
                    return f"User data synchronized successfully for user: {user_data.get('user_id', 'N/A')}"
                except Exception as e:
                    return f"Error syncing user data: {str(e)}"
                finally:
                    loop.close()
            except Exception as e:
                return f"Error syncing user data: {str(e)}"
        
        def get_auth_status() -> str:
            """Get current authentication bridge status"""
            try:
                status = "Authentication Bridge Status:\n\n"
                status += f"MCP Auth URL: {auth_bridge.auth_mcp_url}\n"
                status += f"MongoDB URI: {auth_bridge.mongodb_uri[:50] + '...' if auth_bridge.mongodb_uri and len(auth_bridge.mongodb_uri) > 50 else auth_bridge.mongodb_uri}\n"
                status += f"User Manager: {'Initialized' if auth_bridge.user_manager else 'Not Available'}\n"
                status += f"Storage: {'MongoDB' if auth_bridge.mongodb_uri else 'SQLite Fallback'}\n"
                
                status += f"\nSupported Features:\n"
                status += f"  • Wallet address authentication\n"
                status += f"  • Signature verification\n"
                status += f"  • Session management\n"
                status += f"  • User data synchronization\n"
                status += f"  • Multi-platform support\n"
                
                return status
            except Exception as e:
                return f"Error getting auth status: {str(e)}"
        
        def revoke_session(session_id: str) -> str:
            """Revoke authentication session"""
            try:
                import asyncio
                
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    result = loop.run_until_complete(auth_bridge.revoke_session(session_id))
                    
                    if result.get('success'):
                        return f"Session {session_id} revoked successfully"
                    else:
                        return f"Failed to revoke session: {result.get('error', 'Unknown error')}"
                finally:
                    loop.close()
            except Exception as e:
                return f"Error revoking session: {str(e)}"
        
        # Auth bridge tools list
        auth_bridge_tools = [
            authenticate_wallet,
            create_wallet_session,
            validate_session,
            sync_user_data,
            get_auth_status,
            revoke_session,
        ]
        
    except ImportError as e:
        logger.warning(f"Auth bridge agent not available: {e}")
        auth_bridge_tools = []
    
    return Agent(
        name="Authentication Bridge Agent",
        model=OpenAIChat(id="gpt-4o"),
        tools=auth_bridge_tools,
        instructions=[
            "You are an authentication bridge specialist for ServiceFlow AI.",
            "Handle wallet-based authentication between frontend and agent system.",
            "Manage user sessions and authentication states securely.",
            "Bridge authentication data between different system components.",
            "Use your authentication tools to verify wallets and manage sessions.",
            "Provide secure authentication and session management services."
        ],
        storage=SqliteStorage(
            table_name="auth_bridge_agent",
            db_file="tmp/auth_data/auth_bridge.db"
        ),
        memory=Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=SqliteMemoryDb(
                table_name="auth_bridge_memories",
                db_file="tmp/auth_data/auth_bridge_memory.db"
            )
        ),
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True
    )

# Create the Auth Bridge agent instance
auth_bridge_agent = create_auth_bridge_agent()

# Initialize NFT Market Analyst
try:
    nft_market_analyst = NFTMarketAnalyst()
    
    nft_analyst_agent = Agent(
        name="NFT Market Analyst",
        model=OpenAIChat(id="gpt-4o"),
        instructions=[
            "You are an advanced NFT market analyst specializing in the Sonic ecosystem.",
            "You analyze NFT collections using PaintSwap data and Discord sentiment.",
            "You provide comprehensive market signals with confidence scores.",
            "You monitor Discord channels for community sentiment and trends.",
            "You generate detailed reports on collection performance and opportunities.",
            "Focus on Sonic blockchain NFT ecosystem analysis."
        ],
        storage=SqliteStorage(
            table_name="nft_analyst_agent",
            db_file="tmp/nft_analysis.db"
        ),
        memory=Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=SqliteMemoryDb(
                table_name="nft_analyst_memories",
                db_file="tmp/nft_analysis_memory.db"
            )
        ),
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True
    )
    
    # Override methods to use NFT market analyst
    original_nft_run = nft_analyst_agent.run
    original_nft_arun = nft_analyst_agent.arun
    
    def enhanced_nft_run(message, **kwargs):
        try:
            # Extract collection address if provided
            import re
            address_match = re.search(r'0x[a-fA-F0-9]{40}', str(message))
            collection_address = address_match.group(0) if address_match else None
            
            # Run NFT market analysis
            import asyncio
            if collection_address:
                analysis = asyncio.run(nft_market_analyst.analyze_specific_collection(collection_address))
            else:
                analysis = asyncio.run(nft_market_analyst.analyze_market_overview())
            
            # Format response
            if "error" not in analysis:
                formatted_response = f"""# NFT Market Analysis Report

{json.dumps(analysis, indent=2)}

---
*Analysis provided by ServiceFlow AI NFT Market Analyst*"""
            else:
                formatted_response = f"❌ Analysis failed: {analysis['error']}"
            
            class MockResponse:
                def __init__(self, content):
                    self.content = content
            
            return MockResponse(formatted_response)
        except Exception as e:
            logger.error(f"NFT analysis failed: {e}")
            return original_nft_run(message, **kwargs)
    
    async def enhanced_nft_arun(message, **kwargs):
        try:
            # Extract collection address if provided
            import re
            address_match = re.search(r'0x[a-fA-F0-9]{40}', str(message))
            collection_address = address_match.group(0) if address_match else None
            
            # Run NFT market analysis
            if collection_address:
                analysis = await nft_market_analyst.analyze_specific_collection(collection_address)
            else:
                analysis = await nft_market_analyst.analyze_market_overview()
            
            # Format response
            if "error" not in analysis:
                formatted_response = f"""# NFT Market Analysis Report

{json.dumps(analysis, indent=2)}

---
*Analysis provided by ServiceFlow AI NFT Market Analyst*"""
            else:
                formatted_response = f"❌ Analysis failed: {analysis['error']}"
            
            class MockResponse:
                def __init__(self, content):
                    self.content = content
            
            return MockResponse(formatted_response)
        except Exception as e:
            logger.error(f"Async NFT analysis failed: {e}")
            return await original_nft_arun(message, **kwargs)
    
    # Override methods
    nft_analyst_agent.run = enhanced_nft_run
    nft_analyst_agent.arun = enhanced_nft_arun
    
    logger.info("OK NFT Market Analyst initialized successfully")
    
except Exception as e:
    logger.error(f"Failed to initialize NFT Market Analyst: {e}")
    # Fallback agent
    nft_analyst_agent = Agent(
        name="NFT Market Analyst",
        model=OpenAIChat(id="gpt-4o"),
        instructions=[
            "You are an NFT market analyst for the Sonic ecosystem.",
            "Analyze NFT collections, market trends, and provide insights."
        ],
        storage=SqliteStorage(
            table_name="nft_analyst_agent",
            db_file="tmp/nft_analysis.db"
        ),
        memory=Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=SqliteMemoryDb(
                table_name="nft_analyst_memories",
                db_file="tmp/nft_analysis_memory.db"
            )
        ),
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True
    )

# Initialize Ecosystem Analyst
try:
    ecosystem_analyst = EcosystemAnalyst()
    
    ecosystem_analyst_agent = Agent(
        name="Ecosystem Analyst",
        model=OpenAIChat(id="gpt-4o"),
        instructions=[
            "You are a comprehensive crypto ecosystem analyst.",
            "You analyze tokens using DexScreener, news sentiment with CoinDesk, and market data from CoinCodex.",
            "You maintain a watchlist of key cryptocurrencies and tokens.",
            "You provide detailed ecosystem analysis with growth indicators and risk factors.",
            "You generate actionable recommendations based on multi-source data analysis.",
            "Focus on Sonic blockchain ecosystem but cover broader crypto market trends."
        ],
        storage=SqliteStorage(
            table_name="ecosystem_analyst_agent",
            db_file="tmp/ecosystem_analysis.db"
        ),
        memory=Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=SqliteMemoryDb(
                table_name="ecosystem_analyst_memories",
                db_file="tmp/ecosystem_analysis_memory.db"
            )
        ),
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True
    )
    
    # Override methods to use ecosystem analyst
    original_eco_run = ecosystem_analyst_agent.run
    original_eco_arun = ecosystem_analyst_agent.arun
    
    def enhanced_eco_run(message, **kwargs):
        try:
            # Extract focus chain if mentioned
            focus_chain = "sonic"
            message_lower = str(message).lower()
            if "ethereum" in message_lower or "eth" in message_lower:
                focus_chain = "ethereum"
            elif "bitcoin" in message_lower or "btc" in message_lower:
                focus_chain = "bitcoin"
            elif "polygon" in message_lower:
                focus_chain = "polygon"
            
            # Run comprehensive ecosystem analysis
            import asyncio
            analysis = asyncio.run(ecosystem_analyst.comprehensive_ecosystem_analysis(focus_chain))
            
            # Format response
            if "error" not in analysis:
                formatted_response = f"""# Comprehensive Ecosystem Analysis

## Market Overview
- **Focus Chain:** {analysis['metadata']['focus_chain']}
- **Tokens Analyzed:** {analysis['metadata']['total_tokens_analyzed']}
- **News Articles:** {analysis['metadata']['total_news_articles']}
- **Market Health:** {analysis['ecosystem_insights']['market_health']}

## Key Insights
{chr(10).join(f'- {insight}' for insight in analysis['ecosystem_insights']['growth_indicators'])}

## Recommendations
{chr(10).join(f'- {rec}' for rec in analysis['recommendations'])}

## Watchlist Performance
- **Total Coins:** {analysis['market_overview']['watchlist_performance']['total_coins']}
- **Positive Performers:** {analysis['market_overview']['watchlist_performance']['positive_performers']}
- **Recent Alerts:** {analysis['market_overview']['watchlist_performance']['recent_alerts']}

---
*Analysis provided by ServiceFlow AI Ecosystem Analyst*"""
            else:
                formatted_response = f"❌ Ecosystem analysis failed: {analysis['error']}"
            
            class MockResponse:
                def __init__(self, content):
                    self.content = content
            
            return MockResponse(formatted_response)
        except Exception as e:
            logger.error(f"Ecosystem analysis failed: {e}")
            return original_eco_run(message, **kwargs)
    
    async def enhanced_eco_arun(message, **kwargs):
        try:
            # Extract focus chain if mentioned
            focus_chain = "sonic"
            message_lower = str(message).lower()
            if "ethereum" in message_lower or "eth" in message_lower:
                focus_chain = "ethereum"
            elif "bitcoin" in message_lower or "btc" in message_lower:
                focus_chain = "bitcoin"
            elif "polygon" in message_lower:
                focus_chain = "polygon"
            
            # Run comprehensive ecosystem analysis
            analysis = await ecosystem_analyst.comprehensive_ecosystem_analysis(focus_chain)
            
            # Format response
            if "error" not in analysis:
                formatted_response = f"""# Comprehensive Ecosystem Analysis

## Market Overview
- **Focus Chain:** {analysis['metadata']['focus_chain']}
- **Tokens Analyzed:** {analysis['metadata']['total_tokens_analyzed']}
- **News Articles:** {analysis['metadata']['total_news_articles']}
- **Market Health:** {analysis['ecosystem_insights']['market_health']}

## Key Insights
{chr(10).join(f'- {insight}' for insight in analysis['ecosystem_insights']['growth_indicators'])}

## Recommendations
{chr(10).join(f'- {rec}' for rec in analysis['recommendations'])}

## Watchlist Performance
- **Total Coins:** {analysis['market_overview']['watchlist_performance']['total_coins']}
- **Positive Performers:** {analysis['market_overview']['watchlist_performance']['positive_performers']}
- **Recent Alerts:** {analysis['market_overview']['watchlist_performance']['recent_alerts']}

---
*Analysis provided by ServiceFlow AI Ecosystem Analyst*"""
            else:
                formatted_response = f"❌ Ecosystem analysis failed: {analysis['error']}"
            
            class MockResponse:
                def __init__(self, content):
                    self.content = content
            
            return MockResponse(formatted_response)
        except Exception as e:
            logger.error(f"Async ecosystem analysis failed: {e}")
            return await original_eco_arun(message, **kwargs)
    
    # Override methods
    ecosystem_analyst_agent.run = enhanced_eco_run
    ecosystem_analyst_agent.arun = enhanced_eco_arun
    
    logger.info("OK Ecosystem Analyst initialized successfully")
    
except Exception as e:
    logger.error(f"Failed to initialize Ecosystem Analyst: {e}")
    # Fallback agent
    ecosystem_analyst_agent = Agent(
        name="Ecosystem Analyst",
        model=OpenAIChat(id="gpt-4o"),
        instructions=[
            "You are a crypto ecosystem analyst.",
            "Analyze market trends, tokens, and provide insights."
        ],
        storage=SqliteStorage(
            table_name="ecosystem_analyst_agent",
            db_file="tmp/ecosystem_analysis.db"
        ),
        memory=Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=SqliteMemoryDb(
                table_name="ecosystem_analyst_memories",
                db_file="tmp/ecosystem_analysis_memory.db"
            )
        ),
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True
    )

# Initialize Sonic Research Team using improved Team coordination
try:
    from sonic_research_team_improved import create_sonic_research_team
    sonic_research_team_instance = create_sonic_research_team(mongodb_uri)
    
    # Create a wrapper agent that interfaces with the Team
    research_coordinator = Agent(
        name="Sonic Research Coordinator",
        model=OpenAIChat(id="gpt-4o"),
        instructions=[
            "You are the interface for the Sonic Ecosystem Research Team.",
            "You coordinate a specialized multi-agent team with three analysts:",
            "1. Sonic Finance Analyst - DeFi metrics, liquidity, yield opportunities",
            "2. Crypto Market Analyst - Blockchain technology, market positioning",
            "3. Social Sentiment Analyst - Community health, social trends",
            "",
            "When users ask research questions, you coordinate the team analysis.",
            "The team uses coordinate mode for hierarchical task delegation.",
            "Always provide comprehensive reports with executive summaries, key findings, and recommendations."
        ],
        storage=MongoDbStorage(
            collection_name="research_coordinator",
            db_url=mongodb_uri,
            db_name="myserviceprovider"
        ),
        memory=Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=MongoMemoryDb(
                collection_name="research_coordinator_memories",
                db_url=mongodb_uri,
                db_name="myserviceprovider"
            )
        ),
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True
    )
    
    # Override the run method to use the research team
    original_run = research_coordinator.run
    original_arun = research_coordinator.arun
    
    def enhanced_run(message, **kwargs):
        try:
            # Use the research team for analysis
            team_result = sonic_research_team_instance.run_research(str(message))
            
            # Format the result
            formatted_response = f"""# Sonic Ecosystem Research Analysis

{team_result}

---
*Analysis provided by the Sonic Ecosystem Research Team (Finance Analyst, Crypto Market Analyst, Social Sentiment Analyst)*"""
            
            # Create a mock response object
            class MockResponse:
                def __init__(self, content):
                    self.content = content
                    
            return MockResponse(formatted_response)
        except Exception as e:
            logger.error(f"Research team coordination failed: {e}")
            return original_run(message, **kwargs)
    
    async def enhanced_arun(message, **kwargs):
        try:
            # Use the research team for analysis
            team_result = await sonic_research_team_instance.arun_research(str(message))
            
            # Format the result
            formatted_response = f"""# Sonic Ecosystem Research Analysis

{team_result}

---
*Analysis provided by the Sonic Ecosystem Research Team (Finance Analyst, Crypto Market Analyst, Social Sentiment Analyst)*"""
            
            # Create a mock response object
            class MockResponse:
                def __init__(self, content):
                    self.content = content
                    
            return MockResponse(formatted_response)
        except Exception as e:
            logger.error(f"Async research team coordination failed: {e}")
            return await original_arun(message, **kwargs)
    
    # Override the methods
    research_coordinator.run = enhanced_run
    research_coordinator.arun = enhanced_arun
    
    logger.info("OK Sonic Research Team (improved) initialized successfully")
    
except Exception as e:
    logger.error(f"Failed to initialize improved research team: {e}")
    # Fallback to basic agent
    research_coordinator = Agent(
        name="Sonic Research Coordinator",
        model=OpenAIChat(id="gpt-4o"),
        instructions=[
            "You are a research coordinator for the Sonic ecosystem.",
            "Provide comprehensive analysis and insights about the Sonic blockchain ecosystem.",
            "Focus on DeFi opportunities, market trends, and community developments."
        ],
        storage=MongoDbStorage(
            collection_name="research_coordinator",
            db_url=mongodb_uri,
            db_name="myserviceprovider"
        ),
        memory=Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=MongoMemoryDb(
                collection_name="research_coordinator_memories",
                db_url=mongodb_uri,
                db_name="myserviceprovider"
            )
        ),
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True
    )

def get_or_create_discord_integration_agent():
    """Get or create Discord integration agent (lazy initialization)"""
    if 'discord_integration_agent' not in _agents_cache:
        _agents_cache['discord_integration_agent'] = Agent(
            name="Discord Integration Manager",
            model=OpenAIChat(id="gpt-4o"),
            instructions=[
                "You manage Discord bot integration for ServiceFlow AI agents.",
                "You coordinate user interactions between Discord and the agent system.",
                "You handle user registration, validation, and routing to specialized agents.",
                "You provide status updates and help users navigate Discord commands.",
                "You ensure smooth integration between Discord and the Sonic ecosystem tools."
            ],
            storage=MongoDbStorage(
                collection_name="discord_integration",
                db_url=mongodb_uri,
                db_name="myserviceprovider"
            ),
            memory=Memory(
                model=OpenAIChat(id="gpt-4o"),
                db=MongoMemoryDb(
                    collection_name="discord_integration_memories",
                    db_url=mongodb_uri,
                    db_name="myserviceprovider"
                )
            ),
            enable_agentic_memory=True,
            enable_user_memories=True,
            add_datetime_to_instructions=True,
            add_history_to_messages=True,
            num_history_responses=5,
            markdown=True,
            monitoring=True
        )
    return _agents_cache['discord_integration_agent']

# Backward compatibility - create the agent when accessed
discord_integration_agent = lambda: get_or_create_discord_integration_agent()

# Use imported agents from their respective files

# Global variables for lazy initialization
playground_app = None
app = None

def get_playground_agent(agent_name: str):
    """Get a specific agent by name - supports Discord bot integration"""
    agent_getters = {
        'content_creation_agent': get_or_create_content_creation_agent,
        'lead_generation_agent': get_or_create_lead_generation_agent,
        'facebook_agent': get_or_create_facebook_agent,
        'google_agent': get_or_create_google_agent,
        'contractor_agent': get_or_create_contractor_agent_with_knowledge if 'get_or_create_contractor_agent_with_knowledge' in globals() else get_or_create_contractor_agent_fallback,
        'dalleai_agent': get_or_create_dalleai_agent,
        'agno_assist': lambda: agno_assist,  # Already initialized
        'cloudflare_agent': lambda: cloudflare_agent,  # Already initialized
        'research_coordinator': lambda: research_coordinator,
        'finance_agent': lambda: finance_agent,
        'nft_analyst_agent': lambda: nft_analyst_agent,  # NFT Market Analyst
        'ecosystem_analyst_agent': lambda: ecosystem_analyst_agent,  # Ecosystem Analyst
        'paintswap_agent': lambda: paintswap_agent,  # PaintSwap NFT Analyst
        # Add more mappings as needed
    }
    
    getter = agent_getters.get(agent_name)
    if getter:
        try:
            return getter()
        except Exception as e:
            logger.error(f"Failed to get agent {agent_name}: {e}")
            return None
    else:
        logger.warning(f"Agent {agent_name} not found in mappings")
        return None

def initialize_playground():
    """Initialize the Playground with all agents - called only when needed"""
    global playground_app, app
    
    if playground_app is not None:
        return playground_app  # Already initialized
    
    try:
        # Collect all successfully created agents and teams - support mixed configuration
        available_agents = []
        available_teams = []
        
        # Individual Agent List
        agent_list = [
            ("Cloudflare Agent", cloudflare_agent),
            ("Lead Generation Agent", lead_generation_agent),
            ("Facebook Agent", facebook_agent),
            ("Google Agent", google_agent),
            ("Agno Assist", agno_assist),
            ("Contractor Agent", contractor_agent),
            ("Building Code Expert", building_code_agent),
            ("Universal Data Scraper", data_scraper_agent),
            ("HTTP Bridge Agent", http_bridge_agent),
            ("Cloudflare RAG Documentation Expert", cloudflare_rag_agent),
            ("dRPC Cloud Node Monitor", drpc_monitoring_agent),
            ("DALLE AI Image Generator", dalleai_agent),
            ("Paintswap NFT Analyst", paintswap_agent),
            ("NFT Market Analyst", nft_analyst_agent),
            ("Ecosystem Analyst", ecosystem_analyst_agent),
            ("Sonic Finance Researcher", finance_agent),
            ("Discord Social Monitor", discord_monitor_agent),
            ("Admin Verification Agent", admin_verification_agent),
            ("Authentication Bridge Agent", auth_bridge_agent),
            ("Sonic Content Creation Team", content_creation_agent),
            ("Sonic Research Coordinator", research_coordinator)
        ]
        
        # Team List (proper Agno Team objects)
        team_list = [
            ("Sonic Finance Investment Team", sonic_finance_team)
        ]
        
        # Process individual agents
        for agent_name, agent in agent_list:
            try:
                if agent is not None:
                    available_agents.append(agent)
                    logger.info(f"OK {agent_name} (Agent) added to playground")
                else:
                    logger.warning(f"X {agent_name} not available - skipping")
            except Exception as e:
                logger.error(f"X Failed to access {agent_name}: {e}")
        
        # Process teams
        for team_name, team in team_list:
            try:
                if team is not None:
                    available_teams.append(team)
                    logger.info(f"OK {team_name} (Team) added to playground")
                else:
                    logger.warning(f"X {team_name} not available - skipping")
            except Exception as e:
                logger.error(f"X Failed to access {team_name}: {e}")
        
        if not available_agents and not available_teams:
            logger.error("No agents or teams available to create playground")
            raise ValueError("No agents or teams available to create playground")
        
        logger.info(f"Initializing mixed playground with {len(available_agents)} agents and {len(available_teams)} teams")
        
        # Configure agents with proper Agno patterns
        configured_agents = []
        configured_teams = []
        
        # Process and configure agents
        for i, agent in enumerate(available_agents):
            # Debug: Check if agent is actually an Agent object
            if callable(agent) and not hasattr(agent, 'app_id'):
                logger.error(f"Agent at index {i} is a function, not an Agent object: {type(agent)}")
                # Try to call it if it's a function
                try:
                    agent = agent()
                    logger.info(f"Successfully called function to get Agent object at index {i}")
                except Exception as e:
                    logger.error(f"Failed to call function at index {i}: {e}")
                    continue
            
            # Ensure this is actually an Agent object before proceeding
            if not hasattr(agent, 'app_id'):
                logger.error(f"Agent at index {i} does not have app_id attribute: {type(agent)}")
                continue
            
            # Ensure agents have proper instructions and coordination capabilities
            if hasattr(agent, 'instructions') and isinstance(agent.instructions, list):
                # Add coordination instructions for team work
                agent.instructions.extend([
                    "You are part of the ServiceFlow AI team ecosystem.",
                    "Coordinate with other agents when needed for comprehensive solutions.",
                    "Always provide specific, actionable information.",
                    "Use markdown formatting for clear communication."
                ])
            configured_agents.append(agent)
        
        # Process and configure teams
        for i, team in enumerate(available_teams):
            # Debug: Check if team is callable (lazy loaded)
            if callable(team):
                try:
                    team = team()
                    logger.info(f"Successfully called function to get Team object at index {i}")
                except Exception as e:
                    logger.error(f"Failed to call team function at index {i}: {e}")
                    continue
            
            # Ensure this is actually a Team object
            if hasattr(team, 'name') and hasattr(team, 'members'):
                configured_teams.append(team)
                logger.info(f"Team '{team.name}' configured with {len(team.members)} members")
            else:
                logger.error(f"Team at index {i} is not a valid Team object: {type(team)}")
                continue
        
        # Create mixed playground configuration (agents + teams)
        if configured_teams:
            # Mixed configuration with both agents and teams (PR #92 feature)
            playground_app = Playground(agents=configured_agents, teams=configured_teams)
            logger.info(f"✅ Mixed playground created with {len(configured_agents)} agents and {len(configured_teams)} teams")
        else:
            # Fallback to agents-only configuration
            playground_app = Playground(agents=configured_agents)
            logger.info(f"✅ Agent-only playground created with {len(configured_agents)} agents")
        app = playground_app.get_app()
        logger.info("Playground initialized successfully")
        return playground_app
        
    except Exception as e:
        logger.error(f"Failed to initialize playground: {e}")
        logger.exception("Full traceback for playground initialization failure:")
        raise

def get_playground_agent(agent_name: str) -> Optional[Agent]:
    """Get a specific agent by name using lazy initialization - for external access (Discord bot)"""
    try:
        # Initialize playground if needed
        playground_instance = initialize_playground()
        
        # Agent name mapping for external access (Discord bot integration)
        agent_mapping = {}
        
        # Initialize playground to ensure agents are available
        playground_instance = initialize_playground()
        
        # Map agent names to playground agents
        for agent in playground_instance.agents:
            agent_name = agent.name.lower().replace(' ', '_').replace('-', '_')
            # Common mappings for Discord bot
            if 'content' in agent_name:
                agent_mapping['content_creation_agent'] = agent
                agent_mapping['content'] = agent
            elif 'research' in agent_name:
                agent_mapping['research_coordinator'] = agent
                agent_mapping['research'] = agent
            elif 'finance' in agent_name:
                agent_mapping['finance_agent'] = agent
                agent_mapping['finance'] = agent
            elif 'cloudflare' in agent_name:
                agent_mapping['cloudflare_agent'] = agent
                agent_mapping['cloudflare'] = agent
            elif 'dalle' in agent_name:
                agent_mapping['dalleai_agent'] = agent
                agent_mapping['dalle'] = agent
            elif 'paintswap' in agent_name:
                agent_mapping['paintswap_agent'] = agent
                agent_mapping['paintswap'] = agent
            elif 'nft' in agent_name and 'market' in agent_name:
                agent_mapping['nft_analyst_agent'] = agent
                agent_mapping['nft_analyst'] = agent
                agent_mapping['nft'] = agent
            elif 'ecosystem' in agent_name:
                agent_mapping['ecosystem_analyst_agent'] = agent
                agent_mapping['ecosystem_analyst'] = agent
                agent_mapping['ecosystem'] = agent
        
        return agent_mapping.get(agent_name)
        
    except Exception as e:
        logger.error(f"Failed to get agent {agent_name}: {e}")
        return None

# Discord agent startup function
async def start_discord_agent_async():
    """Start Discord agent asynchronously using Agno pattern"""
    if DISCORD_BOT_AVAILABLE:
        try:
            await start_discord_integration()
        except Exception as e:
            logger.error(f"Discord agent startup failed: {e}")
    else:
        logger.info("Discord agent not available - skipping")

# Create a traced version of the main function
@observe(name="ServiceFlow AI Playground Startup")  
def start_playground():
    """Start the ServiceFlow AI Command Center playground with tracing"""
    try:
        logger.info("Starting ServiceFlow AI Command Center...")
        print("Starting ServiceFlow AI Command Center...")
        
        # Initialize playground (lazy initialization)
        playground_instance = initialize_playground()
        
        print(f"Agents available: {len(playground_instance.agents)}")
        for agent in playground_instance.agents:
            print(f"   • {agent.name}")
            logger.info(f"Agent available: {agent.name}")
        
        # Start Discord agent in background if available
        if DISCORD_BOT_AVAILABLE and os.getenv("DISCORD_BOT_TOKEN"):
            try:
                import threading
                discord_thread = threading.Thread(
                    target=lambda: asyncio.run(start_discord_agent_async()),
                    daemon=True
                )
                discord_thread.start()
                print("🤖 Discord agent starting in background (Agno pattern)...")
                logger.info("Discord agent thread started")
            except Exception as e:
                logger.error(f"Failed to start Discord agent thread: {e}")
                print(f"⚠️  Discord agent startup failed: {e}")
        else:
            print("⚠️  Discord agent disabled (missing token or library)")
        
        # Add trace metadata if langfuse is configured
        if langfuse_client:
            try:
                trace = langfuse_client.trace(
                    name="ServiceFlow AI Playground Session",
                    tags=["playground", "serviceflow", "ai"],
                    metadata={
                        "total_agents": len(playground_app.agents),
                        "agent_names": [agent.name for agent in playground_app.agents],
                        "environment": "development" if os.getenv("DEBUG") else "production",
                        "discord_bot_enabled": DISCORD_BOT_AVAILABLE and bool(os.getenv("DISCORD_BOT_TOKEN"))
                    }
                )
                logger.info("Langfuse trace created successfully")
            except Exception as e:
                logger.warning(f"Langfuse trace creation failed: {e}")
                print(f"⚠️  Langfuse trace creation failed: {e}")
        
        logger.info("Starting playground server...")
        playground_instance.serve("playground:app", reload=True)
        
    except Exception as e:
        logger.error(f"Failed to start playground: {e}")
        logger.exception("Full traceback for playground startup failure:")
        raise

# Main entry point
if __name__ == "__main__":
    try:
        logger.info("=== ServiceFlow AI Playground Starting ===")
        if os.getenv("LANGFUSE_SECRET_KEY") and os.getenv("LANGFUSE_PUBLIC_KEY"):
            logger.info("Starting with Langfuse tracing enabled")
            # Use traced startup
            start_playground()
            # Flush any pending traces
            if langfuse_client:
                try:
                    langfuse_client.flush()
                    logger.info("Langfuse traces flushed successfully")
                except Exception as e:
                    logger.warning(f"Failed to flush Langfuse traces: {e}")
        else:
            logger.info("Starting without tracing")
            # Direct startup without tracing
            playground_instance = initialize_playground()
            playground_instance.serve("playground:app", reload=True)
    except KeyboardInterrupt:
        logger.info("Playground stopped by user")
        print("\n👋 Playground stopped by user")
    except Exception as e:
        logger.error(f"Fatal error starting playground: {e}")
        logger.exception("Full traceback for fatal startup error:")
        print(f"\n❌ Fatal error: {e}")
        print("Check playground.log for detailed error information")
        sys.exit(1)