# playground.py - ServiceFlow AI Command Center
import os
import sys
import asyncio
import logging
from pathlib import Path
from dotenv import load_dotenv
import nest_asyncio
from agno.agent import Agent
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
from langfuse import observe, Langfuse

# Allow nested event loops for MCP
nest_asyncio.apply()

# Try to import OpenInference for advanced tracing
try:
    from openinference.instrumentation.agno import AgnoInstrumentor
    from opentelemetry import trace as trace_api
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import SimpleSpanProcessor
    OPENINFERENCE_AVAILABLE = True
except ImportError:
    print("Warning: OpenInference not available. Install with: pip install openinference-instrumentation-agno")
    OPENINFERENCE_AVAILABLE = False

# Import tools and helpers from agent modules (not pre-built agents)
from data_scraper_agent import BuildingCodeManager
from srvcflo_team_agent import (
    viral_researcher, viral_content_writer, social_media_specialist,
    tech_implementation_agent, business_strategy_agent
)

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
        "FACEBOOK_PAGE_ID": "Facebook integration",
        "CLOUDFLARE_API_TOKEN": "Cloudflare integration"
    }
    
    missing_required = []
    for var, purpose in required_vars.items():
        value = os.getenv(var)
        if var == "MONGODB_URI" and not value:
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

# Load environment variables from .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
logger.info(f"Loading environment variables from: {dotenv_path}")
load_dotenv(dotenv_path=dotenv_path)

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
else:
    print("Warning: Langfuse tracing disabled - set LANGFUSE_SECRET_KEY and LANGFUSE_PUBLIC_KEY environment variables to enable")

# Get MongoDB connection string from environment variables
mongodb_uri = os.getenv("MONGODB_URI", "") or os.getenv("MONGODB_URL", "")
if not mongodb_uri:
    logger.error("MONGODB_URI or MONGODB_URL environment variable is not set.")
    raise ValueError("MONGODB_URI or MONGODB_URL environment variable is not set.")

logger.info("MongoDB URI configured successfully")

# Setup temporary directory
tmp_dir = Path(__file__).parent.joinpath("tmp")
tmp_dir.mkdir(parents=True, exist_ok=True)

# =============================================================================
# HELPER FUNCTIONS FOR AGENT CREATION
# =============================================================================

def create_mongodb_storage(collection_name: str):
    """Create MongoDB storage for agents"""
    try:
        return MongoDbStorage(
            collection_name=collection_name,
            db_url=mongodb_uri,
            db_name="myserviceprovider"
        )
    except Exception as e:
        logger.warning(f"MongoDB storage failed for {collection_name}, using SQLite fallback: {e}")
        return SqliteStorage(
            table_name=collection_name,
            db_file=str(tmp_dir / "agents.db")
        )

def create_mongodb_memory(collection_name: str):
    """Create MongoDB memory for agents"""
    try:
        return Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=MongoMemoryDb(
                collection_name=collection_name,
                db_url=mongodb_uri,
                db_name="myserviceprovider"
            )
        )
    except Exception as e:
        logger.warning(f"MongoDB memory failed for {collection_name}, using SQLite fallback: {e}")
        return Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=SqliteMemoryDb(
                table_name=collection_name,
                db_file=str(tmp_dir / "agents.db")
            )
        )

# =============================================================================
# BUILDING CODE TOOLS
# =============================================================================

class BuildingCodeTools(Toolkit):
    def __init__(self, **kwargs):
        super().__init__(name="building_codes", **kwargs)
        self.building_code_manager = BuildingCodeManager()
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
            return f"Building codes for {state.capitalize()} are ready for queries!"
        except Exception as e:
            return f"Error initializing state codes: {str(e)}"

    def query_building_code(self, question: str, state: str = "oklahoma") -> str:
        """Query building codes for a specific question"""
        try:
            if state.lower() not in self.building_code_manager.get_available_states():
                return f"Building codes not available for {state}. Available states: {', '.join(self.building_code_manager.get_available_states())}"
            
            code_types = self.building_code_manager.get_code_types(state.lower())
            guidance = f"Building Code Query for {state.capitalize()}: \"{question}\"\n\n"
            guidance += "Available Building Codes:\n"
            for code_type, description in code_types.items():
                guidance += f"• {description}\n"
            
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
            result = "Available Building Codes by State:\n\n"
            for state in self.building_code_manager.get_available_states():
                result += f"{state.upper()}:\n"
                code_types = self.building_code_manager.get_code_types(state)
                for code_type, description in code_types.items():
                    result += f"  • {description}\n"
                result += "\n"
            return result
        except Exception as e:
            return f"Error showing available codes: {str(e)}"

# =============================================================================
# INDIVIDUAL AGENTS
# =============================================================================

# Lead Generation Agent
lead_generation_agent = Agent(
    name="Lead Generation Agent",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],
    instructions=[
        "Scrape social media for leads based on provider-defined keywords.",
        "Always include sources and contact information when available",
        "Focus on small business owners and service providers",
        "Provide actionable lead information with contact details"
    ],
    storage=create_mongodb_storage("lead_generation_agent"),
    memory=create_mongodb_memory("lead_gen_agent_memories"),
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
    monitoring=True,
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
    ), DuckDuckGoTools()] if all([
        os.getenv("X_BEARER_TOKEN"),
        os.getenv("X_CONSUMER_KEY"), 
        os.getenv("X_CONSUMER_SECRET"),
        os.getenv("X_ACCESS_TOKEN"),
        os.getenv("X_ACCESS_TOKEN_SECRET")
    ]) else [DuckDuckGoTools()],
    instructions=[
        "Generate social media posts for ServiceFlow AI to promote small business automation.",
        "Create posts about automation benefits, how-to guides, and recommended tools.",
        "Use DuckDuckGoTools to find recent articles and insights on automation to inform content.",
        "Engage with automation-related tweets using context-aware replies when X tools are available.",
        "Keep posts concise (under 280 characters), engaging, with emojis and hashtags (#Automation, #SmallBusiness, #ServiceFlowAI).",
        "Focus on value-driven content that helps small businesses understand automation benefits."
    ],
    storage=create_mongodb_storage("content_creation_agent"),
    memory=create_mongodb_memory("content_creation_agent_memories"),
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
    monitoring=True,
)

# Facebook and Cloudflare agents will be created dynamically in the async function
# This ensures proper MCP context manager handling

# Google Services Agent
google_agent = Agent(
    name="Google Services Manager",
    model=OpenAIChat(id="gpt-4o"),
    tools=[
        GmailTools(
            port=8080,
            get_latest_emails=True,
            get_unread_emails=True,
            get_starred_emails=True,
            get_emails_by_context=True,
            get_emails_by_date=True,
            create_draft_email=True,
            send_email=True,
            search_emails=True
        ),
        GoogleCalendarTools(
            credentials_path=os.path.join(parent_dir, "credentials", "google_calendar_credentials.json"),
            token_path=os.path.join(parent_dir, "credentials", "tokens", "google_calendar_token.json")
        )
    ],
    instructions=[
        "You are a Google services assistant that can help with Gmail and Google Calendar.",
        "For Gmail, you can read, draft, and send emails with comprehensive search capabilities.",
        "For Google Calendar, you can view events, create new events, and manage schedules.",
        "When showing email contents, summarize the content and extract key details and dates.",
        "Show email contents and calendar events in a structured markdown format.",
        "Always confirm before taking actions that modify content (sending emails, creating events, etc.)",
        "Prioritize user privacy and data security in all operations"
    ],
    storage=create_mongodb_storage("google_agent"),
    memory=create_mongodb_memory("google_agent_memories"),
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
    monitoring=True,
)

# Contractor Agent with Building Codes
contractor_agent = Agent(
    name="Contractor Assistant",
    model=OpenAIChat(id="gpt-4o"),
    tools=[BuildingCodeTools(), DuckDuckGoTools()],
    instructions=[
        "You are a comprehensive contractor assistant with access to building codes and construction industry knowledge.",
        "You can help with building codes & regulations and construction industry research.",
        "For building codes: Access state-specific building codes (currently Oklahoma available).",
        "Explain building requirements, code sections, and compliance information.",
        "Use show_available_codes() to see what's available, then initialize_state_codes(state) and query_building_code(question, state).",
        "For construction research: Use DuckDuckGo to find current information about building materials, tools, and industry trends.",
        "Always provide practical, actionable advice for contractors and builders.",
        "Include specific code references when available.",
        "If building codes aren't available for a state, suggest alternatives or general guidance."
    ],
    storage=create_mongodb_storage("contractor_agent"),
    memory=create_mongodb_memory("contractor_agent_memories"),
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
    monitoring=True,
)

# Cloudflare agent will be created dynamically in the async function

# =============================================================================
# SRVCFLO TEAM LEAD - ROUTER AGENT
# =============================================================================

def create_srvcflo_team_lead(
    lead_gen_agent,
    content_agent, 
    facebook_agent,
    google_agent,
    contractor_agent,
    cloudflare_agent
):
    """Create the SrvcFlo Team Lead with access to all other agents"""
    
    # Create a custom tool that can route to other agents
    class AgentRouter(Toolkit):
        def __init__(self, **kwargs):
            super().__init__(name="agent_router", **kwargs)
            self.agents = {
                "lead_generation": lead_gen_agent,
                "content_creation": content_agent,
                "facebook": facebook_agent,
                "google": google_agent,
                "contractor": contractor_agent,
                "cloudflare": cloudflare_agent
            }
            self.register(self.route_to_agent)
            self.register(self.list_available_agents)

        def route_to_agent(self, agent_name: str, task: str) -> str:
            """Route a task to a specific agent"""
            if agent_name not in self.agents:
                return f"Agent '{agent_name}' not found. Available agents: {', '.join(self.agents.keys())}"
            
            # Note: In a real implementation, you'd call the agent here
            # For now, we'll return guidance on what the agent would do
            agent_descriptions = {
                "lead_generation": "find and research potential business leads",
                "content_creation": "create social media content and marketing materials", 
                "facebook": "manage Facebook page posts, comments, and analytics",
                "google": "handle Gmail and Google Calendar tasks",
                "contractor": "provide building code information and construction guidance",
                "cloudflare": "manage deployments and infrastructure on Cloudflare"
            }
            
            return f"Routing task to {agent_name} agent: '{task}'\nThis agent specializes in: {agent_descriptions.get(agent_name, 'general assistance')}"

        def list_available_agents(self) -> str:
            """List all available agents and their capabilities"""
            result = "Available ServiceFlow AI Agents:\n\n"
            agent_info = {
                "lead_generation": "Lead Generation Agent - Find and research potential business leads",
                "content_creation": "Content Creation Agent - Create social media content and marketing materials",
                "facebook": "Facebook Page Manager - Manage Facebook posts, comments, and analytics", 
                "google": "Google Services Manager - Handle Gmail and Google Calendar tasks",
                "contractor": "Contractor Assistant - Provide building codes and construction guidance",
                "cloudflare": "Cloudflare Deployment Manager - Manage deployments and infrastructure"
            }
            
            for agent_id, description in agent_info.items():
                result += f"• **{agent_id}**: {description}\n"
            
            result += "\nUse route_to_agent(agent_name, task) to delegate tasks to specific agents."
            return result

    return Agent(
        name="SrvcFlo - AI Team Lead",
        model=OpenAIChat(id="gpt-4o"),
        tools=[
            AgentRouter(),
            DuckDuckGoTools(),
            ThinkingTools(),
            PythonTools()
        ],
        instructions=[
            "You are SrvcFlo, the AI Team Lead for ServiceFlow AI - a comprehensive business automation platform.",
            "You coordinate and route tasks to specialized agents in the ServiceFlow ecosystem.",
            "",
            "**Your Role:**",
            "- Analyze user requests and determine which specialized agent(s) can best help",
            "- Route complex tasks to the appropriate agents using the agent_router tool",
            "- Provide strategic guidance on business automation and AI implementation",
            "- Coordinate multi-agent workflows when tasks require multiple specialists",
            "",
            "**Available Specialist Agents:**",
            "- Lead Generation Agent: Finding and researching business leads",
            "- Content Creation Agent: Social media content and marketing materials", 
            "- Facebook Page Manager: Facebook page management and analytics",
            "- Google Services Manager: Gmail and Google Calendar integration",
            "- Contractor Assistant: Building codes and construction guidance",
            "- Cloudflare Deployment Manager: Infrastructure and deployment management",
            "",
            "**Workflow:**",
            "1. Understand the user's request and goals",
            "2. Identify which specialist agent(s) can best accomplish the task", 
            "3. Use route_to_agent() to delegate or provide guidance on agent selection",
            "4. Synthesize results from multiple agents when needed",
            "5. Provide strategic recommendations for business automation",
            "",
            "Always think strategically about how different agents can work together to solve complex business challenges.",
            "Use list_available_agents() to show users what specialists are available.",
            "Focus on delivering comprehensive solutions that leverage the full ServiceFlow AI ecosystem."
        ],
        storage=create_mongodb_storage("srvcflo_team_lead"),
        memory=create_mongodb_memory("srvcflo_team_lead_memories"),
        enable_agentic_memory=True,
        enable_user_memories=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
        monitoring=True,
    )

# Old sync playground setup removed - now using async MCP pattern below

# =============================================================================
# ASYNC PLAYGROUND SETUP (Required for MCP)
# =============================================================================

async def create_playground_with_mcp():
    """Create playground with MCP tools following Agno documentation pattern"""
    logger.info("Creating playground with MCP tools...")
    
    # Create agents list
    agents = []
    
    # Facebook Agent with MCP (if configured)
    if os.getenv("FACEBOOK_ACCESS_TOKEN"):
        try:
            facebook_mcp_server_path = os.path.join(os.path.dirname(__file__), "facebook_mcp", "server.py")
            facebook_command = f"uv run --with mcp[cli] --with requests mcp run {facebook_mcp_server_path}"
            
            async with MCPTools(
                command=facebook_command,
                env={
                    "FACEBOOK_ACCESS_TOKEN": os.getenv("FACEBOOK_ACCESS_TOKEN"),
                    "FACEBOOK_PAGE_ID": os.getenv("FACEBOOK_PAGE_ID"),
                    "FACEBOOK_APP_ID": os.getenv("FACEBOOK_APP_ID"),
                    "FACEBOOK_APP_SECRET": os.getenv("FACEBOOK_APP_SECRET"),
                    **os.environ
                }
            ) as facebook_mcp_tools:
                facebook_agent = Agent(
                    name="Facebook Page Manager",
                    model=OpenAIChat(id="gpt-4o"),
                    tools=[facebook_mcp_tools],
                    instructions=[
                        "You are a Facebook Page management assistant with access to Facebook Graph API tools via MCP.",
                        "Your capabilities include creating and managing Facebook posts, managing comments and replies,",
                        "analyzing post performance and engagement metrics, and moderating content.",
                        "Always confirm before taking destructive actions (posting, deleting, etc.)",
                        "Present analytics data in clear, structured markdown format",
                        "Ensure content follows Facebook community standards",
                        "Use engagement data to provide actionable insights"
                    ],
                    storage=create_mongodb_storage("facebook_agent"),
                    memory=create_mongodb_memory("facebook_agent_memories"),
                    enable_agentic_memory=True,
                    enable_user_memories=True,
                    add_datetime_to_instructions=True,
                    add_history_to_messages=True,
                    num_history_responses=5,
                    markdown=True,
                    monitoring=True,
                )
                agents.append(facebook_agent)
                logger.info("✓ Facebook Agent with MCP created")
        except Exception as e:
            logger.warning(f"Failed to create Facebook MCP agent: {e}")
    
    # Cloudflare Agent with MCP (if configured)  
    if os.getenv("CLOUDFLARE_API_TOKEN"):
        try:
            cloudflare_mcp_server_path = os.path.join(os.path.dirname(__file__), "cloudflare_mcp", "server.py")
            cloudflare_command = f"uv run --with mcp[cli] mcp run {cloudflare_mcp_server_path}"
            
            async with MCPTools(
                command=cloudflare_command,
                env={
                    "CLOUDFLARE_API_TOKEN": os.getenv("CLOUDFLARE_API_TOKEN"),
                    "CLOUDFLARE_ZONE_ID": os.getenv("CLOUDFLARE_ZONE_ID"),
                    "CLOUDFLARE_ACCOUNT_ID": os.getenv("CLOUDFLARE_ACCOUNT_ID"),
                    **os.environ
                }
            ) as cloudflare_mcp_tools:
                cloudflare_agent = Agent(
                    name="Cloudflare Deployment Manager",
                    model=OpenAIChat(id="gpt-4o"),
                    tools=[cloudflare_mcp_tools],
                    instructions=[
                        "You are a Cloudflare deployment and infrastructure management assistant.",
                        "Help users deploy applications, manage DNS settings, configure security features, and optimize performance.",
                        "You can manage Workers, Pages, DNS records, and security settings through Cloudflare's API.",
                        "Always confirm before making changes to production environments.",
                        "Provide clear explanations of deployment steps and potential impacts.",
                        "Focus on security, performance, and reliability best practices."
                    ],
                    storage=create_mongodb_storage("cloudflare_agent"),
                    memory=create_mongodb_memory("cloudflare_agent_memories"),
                    enable_agentic_memory=True,
                    enable_user_memories=True,
                    add_datetime_to_instructions=True,
                    add_history_to_messages=True,
                    num_history_responses=5,
                    markdown=True,
                    monitoring=True,
                )
                agents.append(cloudflare_agent)
                logger.info("✓ Cloudflare Agent with MCP created")
        except Exception as e:
            logger.warning(f"Failed to create Cloudflare MCP agent: {e}")
    
    # Add non-MCP agents
    agents.extend([
        lead_generation_agent,
        content_creation_agent,
        google_agent,
        contractor_agent
    ])
    
    # Create SrvcFlo Team Lead with access to all created agents
    srvcflo_team_lead = create_srvcflo_team_lead(
        lead_gen_agent=lead_generation_agent,
        content_agent=content_creation_agent,
        facebook_agent=agents[0] if len([a for a in agents if "Facebook" in a.name]) > 0 else None,
        google_agent=google_agent,
        contractor_agent=contractor_agent,
        cloudflare_agent=agents[1] if len([a for a in agents if "Cloudflare" in a.name]) > 0 else None
    )
    
    # Add SrvcFlo as the first agent (lead router)
    all_agents = [srvcflo_team_lead] + agents
    
    # Create and return playground
    playground = Playground(
        agents=all_agents,
        name="ServiceFlow AI Command Center",
        description="Complete AI ecosystem featuring SrvcFlo - the AI mastermind for viral content creation and business automation, plus specialized agents for lead generation, Facebook management, Google services, contractor assistance with building codes, and Cloudflare deployment management.",
        app_id="serviceflow-command-center"
    )
    
    logger.info(f"✓ Playground created with {len(all_agents)} agents")
    for agent in all_agents:
        logger.info(f"  • {agent.name}")
    
    return playground

async def run_playground_server():
    """Run the playground server with MCP support"""
    try:
        logger.info("=== ServiceFlow AI Playground Starting ===")
        
        # Create playground with MCP
        playground = await create_playground_with_mcp()
        app = playground.get_app()
        
        # Add trace metadata if langfuse is configured
        if langfuse_client:
            try:
                trace = langfuse_client.trace(
                    name="ServiceFlow AI Playground Session",
                    tags=["playground", "serviceflow", "ai", "mcp"],
                    metadata={
                        "total_agents": len(playground.agents),
                        "agent_names": [agent.name for agent in playground.agents],
                        "environment": "development" if os.getenv("DEBUG") else "production"
                    }
                )
                logger.info("Langfuse trace created successfully")
            except Exception as e:
                logger.warning(f"Langfuse trace creation failed: {e}")
        
        logger.info("Starting playground server...")
        print("🚀 Starting ServiceFlow AI Command Center...")
        print(f"📊 Agents available: {len(playground.agents)}")
        for agent in playground.agents:
            print(f"   • {agent.name}")
        
        # Serve the playground while keeping MCP context managers alive
        playground.serve("playground_new:app", reload=True)
        
    except Exception as e:
        logger.error(f"Failed to start playground: {e}")
        logger.exception("Full traceback for playground startup failure:")
        raise

# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    try:
        asyncio.run(run_playground_server())
    except KeyboardInterrupt:
        logger.info("Playground stopped by user")
        print("\n👋 Playground stopped by user")
    except Exception as e:
        logger.error(f"Fatal error starting playground: {e}")
        logger.exception("Full traceback for fatal startup error:")
        print(f"\n❌ Fatal error: {e}")
        print("Check playground.log for detailed error information")
        sys.exit(1)