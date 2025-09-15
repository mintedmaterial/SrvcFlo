import os
import sys
import asyncio
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
import datetime
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.gmail import GmailTools
from agno.tools.googlecalendar import GoogleCalendarTools
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.mongodb import MongoMemoryDb
from dotenv import load_dotenv

# Try to import nest_asyncio for nested event loops, but continue if not available
try:
    import nest_asyncio
    nest_asyncio.apply()
except ImportError:
    print("Warning: nest_asyncio package not found. Nested asyncio operations may not work properly.")
    print("To install: pip install nest_asyncio")

# Add parent directory to path to allow imports from storage module
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)
from agno.storage.mongodb import MongoDbStorage
from agno.storage.sqlite import SqliteStorage

# Load environment variables from .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

try:
    from tzlocal import get_localzone_name
except (ModuleNotFoundError, ImportError):
    raise ImportError("`tzlocal not found` install using `pip install tzlocal`")

__all__ = ['GoogleAgent']

class GoogleAgent:
    """
    A dedicated Google agent that integrates Gmail and Google Calendar tools.
    This agent provides methods to interact with Gmail and Google Calendar services.
    """
    
    def __init__(self, mongodb_uri: str = None, model_id: str = "gpt-4o"):
        """
        Initialize the Google agent with MongoDB storage.
        
        Args:
            mongodb_uri (str, optional): MongoDB connection string. If not provided, it will be read from environment variables.
            model_id (str, optional): OpenAI model ID to use. Defaults to "gpt-4o".
        """
        # Get MongoDB connection string from environment variables if not provided
        if not mongodb_uri:
            mongodb_uri = os.getenv("MONGODB_URL", "")
            if not mongodb_uri:
                raise ValueError("MONGODB_URL environment variable is not set. Please set it to your MongoDB Atlas connection string.")
        
        # Create MongoDB storage for the Google agent
        try:
            self.storage = MongoDbStorage(
                collection_name="google_agent",
                db_url=mongodb_uri,
                db_name="myserviceprovider"
            )
        except Exception as e:
            logger.warning(f"MongoDB storage failed, using SQLite fallback: {e}")
            from pathlib import Path
            tmp_dir = Path(__file__).parent.parent / "tmp"
            tmp_dir.mkdir(exist_ok=True)
            self.storage = SqliteStorage(
                table_name="google_agent",
                db_file=str(tmp_dir / "agents.db")
            )
        
        # Initialize MongoDB memory for user memories with a unique collection name for Google agent
        self.memory_db = MongoMemoryDb(
            collection_name="google_agent_memories",
            db_url=mongodb_uri,
            db_name="myserviceprovider"
        )
        
        # Create a memory instance with MongoDB storage
        self.agent_memory = Memory(
            model=OpenAIChat(id=model_id),
            db=self.memory_db
        )
        
        self.model_id = model_id
        self.agent = None
        
        # Path to the Google Calendar credentials and token
        self.calendar_credentials_path = os.path.join(parent_dir, "credentials", "google_calendar_credentials.json")
        self.token_dir = os.path.join(parent_dir, "credentials", "tokens")
        os.makedirs(self.token_dir, exist_ok=True)
        self.calendar_token_path = os.path.join(self.token_dir, "google_calendar_token.json")
        
        # Set environment variables for Gmail credentials
        gmail_creds_file = "client_secret_645431798768-gverbsba88babmc6e8a8ctfp0fk3ievr.apps.googleusercontent.com.json"
        os.environ["GOOGLE_CREDENTIALS_PATH"] = os.path.join(parent_dir, gmail_creds_file)
        os.environ["GOOGLE_TOKEN_PATH"] = os.path.join(parent_dir, "token.json")
    
    async def initialize(self):
        """Initialize the agent with Gmail and Google Calendar tools"""
        try:
            # Initialize the Google Calendar tool with explicit parameters
            calendar_tool = GoogleCalendarTools(
                credentials_path=self.calendar_credentials_path,
                token_path=self.calendar_token_path
            )
            
            # Initialize the Gmail tool with just the port and toolkit function flags
            gmail_tool = GmailTools(
                port=8080,
                get_unread_emails=True,
                get_latest_emails=True,
                get_emails_from_user=True,
                get_starred_emails=True,
                get_emails_by_context=True,
                get_emails_by_date=True,
                create_draft_email=True,
                send_email=True,
                search_emails=True
            )
            
            # Create the agent with both tools
            self.agent = Agent(
                name="Google Services Manager",
                model=OpenAIChat(id=self.model_id),
                tools=[gmail_tool, calendar_tool],
                instructions=[
                    "You are a Google services assistant that can help with Gmail and Google Calendar.",
                    "For Gmail, you can read, draft, and send emails.",
                    "For Google Calendar, you can view events, create new events, and manage schedules.",
                    "When showing email contents, summarize the content, extract key details and dates.",
                    "Show email contents and calendar events in a structured markdown format.",
                    f"Today is {datetime.datetime.now()} and the user's timezone is {get_localzone_name()}.",
                    "Always confirm before taking actions that modify content (sending emails, creating events, etc.)."
                ],
                storage=self.storage,
                memory=self.agent_memory,
                enable_agentic_memory=True,
                enable_user_memories=True,
                add_datetime_to_instructions=True,
                add_history_to_messages=True,
                num_history_responses=5,
                markdown=True,
            )

            
        except Exception as e:
            print(f"Error initializing Google agent: {str(e)}")
            raise
        
    
    async def shutdown(self):
        """Shutdown the agent"""
        pass  # No special shutdown needed for this agent
    
    async def check_gmail(self, query: str) -> Dict[str, Any]:
        """
        Perform Gmail operations based on the user query.
        
        Args:
            query (str): User query related to Gmail
            
        Returns:
            dict: Operation result
        """
        try:
            # Use the agent to process the query
            response = await self.agent.arun(f"Gmail: {query}")
            
            return {
                "success": "error" not in response.lower(),
                "message": response
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error processing Gmail query: {str(e)}"
            }
    
    async def check_calendar(self, query: str) -> Dict[str, Any]:
        """
        Perform Google Calendar operations based on the user query.
        
        Args:
            query (str): User query related to Google Calendar
            
        Returns:
            dict: Operation result
        """
        try:
            # Use the agent to process the query
            response = await self.agent.arun(f"Calendar: {query}")
            
            return {
                "success": "error" not in response.lower(),
                "message": response
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error processing Calendar query: {str(e)}"
            }
    
    async def send_email(self, to: str, subject: str, body: str, attachments: List[str] = None) -> Dict[str, Any]:
        """
        Send an email using Gmail.
        
        Args:
            to (str): Recipient email address
            subject (str): Email subject
            body (str): Email body
            attachments (List[str], optional): List of attachment file paths
            
        Returns:
            dict: Email sending result
        """
        try:
            # Construct the query
            query = f"Send an email to {to} with subject '{subject}' and body '{body}'"
            
            # Add attachments if provided
            if attachments and len(attachments) > 0:
                attachment_str = ", ".join(attachments)
                query += f" and attach the following files: {attachment_str}"
            
            # Use the agent to process the query
            response = await self.agent.arun(query)
            
            return {
                "success": "error" not in response.lower(),
                "message": response
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error sending email: {str(e)}"
            }
    
    async def create_event(self, title: str, start_time: str, end_time: str, description: str = "", location: str = "") -> Dict[str, Any]:
        """
        Create a new event in Google Calendar.
        
        Args:
            title (str): Event title
            start_time (str): Event start time (in a format like "2025-07-12 15:00")
            end_time (str): Event end time (in a format like "2025-07-12 16:00")
            description (str, optional): Event description
            location (str, optional): Event location
            
        Returns:
            dict: Event creation result
        """
        try:
            # Construct the query
            query = f"Create a calendar event titled '{title}' from {start_time} to {end_time}"
            
            # Add description if provided
            if description:
                query += f" with description '{description}'"
            
            # Add location if provided
            if location:
                query += f" at location '{location}'"
            
            # Use the agent to process the query
            response = await self.agent.arun(query)
            
            return {
                "success": "error" not in response.lower(),
                "message": response
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error creating calendar event: {str(e)}"
            }
    
    async def get_events(self, date: str = "today") -> Dict[str, Any]:
        """
        Get events from Google Calendar for a specific date.
        
        Args:
            date (str, optional): Date to get events for. Defaults to "today".
            
        Returns:
            dict: Calendar events result
        """
        try:
            # Construct the query
            query = f"Get all calendar events for {date}"
            
            # Use the agent to process the query
            response = await self.agent.arun(query)
            
            return {
                "success": "error" not in response.lower(),
                "message": response
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error getting calendar events: {str(e)}"
            }
    
    async def process_user_query(self, query: str) -> str:
        """
        Process a user query using the Google agent.
        
        Args:
            query (str): User query
            
        Returns:
            str: Agent response
        """
        try:
            # Use the agent to process the query
            response = await self.agent.arun(query)
            
            return response
        except Exception as e:
            return f"Error processing query: {str(e)}"
    
    async def aprint_response(self, query: str, markdown: bool = True) -> None:
        """
        Print the agent's response to a query.
        
        Args:
            query (str): User query
            markdown (bool, optional): Whether to format the response as markdown. Defaults to True.
        """
        await self.agent.aprint_response(query, markdown=markdown)