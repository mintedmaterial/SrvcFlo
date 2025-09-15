import os
import sys
import json
import time
import asyncio
import nest_asyncio
from pathlib import Path
from typing import Dict, List, Any, Optional, Union

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.mcp import MCPTools
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.mongodb import MongoMemoryDb

# Allow nested event loops
nest_asyncio.apply()

# Add parent directory to path to allow imports from storage module
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)
from agno.storage.mongodb import MongoDbStorage
from agno.storage.sqlite import SqliteStorage

class FacebookAgent:
    """
    A dedicated Facebook agent that uses the MCP server and integrates with the frontend login.
    This agent provides methods to interact with Facebook Pages through the Facebook Graph API.
    
    ## MCP Server Setup
    
    The Facebook MCP server should be run using UV package manager for proper dependency management:
    
    ```bash
    cd Agents/facebook_mcp
    uv run --with mcp[cli] --with requests mcp run server.py
    ```
    
    ## Available MCP Tools
    
    The Facebook MCP server provides the following tools for content creation and management:
    
    ### Content Creation:
    - `post_to_facebook(message)` - Create text posts
    - `post_image_to_facebook(image_url, caption)` - Post images with captions
    - `schedule_post(message, publish_time)` - Schedule posts for future publishing
    - `update_post(post_id, new_message)` - Update existing posts
    
    ### Content Management:
    - `get_page_posts()` - Retrieve recent posts
    - `delete_post(post_id)` - Delete posts
    - `get_post_comments(post_id)` - Get comments on posts
    - `reply_to_comment(post_id, comment_id, message)` - Reply to comments
    - `hide_comment(comment_id)` - Hide inappropriate comments
    - `unhide_comment(comment_id)` - Restore hidden comments
    - `bulk_hide_comments(comment_ids)` - Hide multiple comments
    - `bulk_delete_comments(comment_ids)` - Delete multiple comments
    
    ### Analytics & Insights:
    - `get_page_fan_count()` - Get total page followers
    - `get_post_insights(post_id)` - Get comprehensive post analytics
    - `get_post_impressions(post_id)` - Get post reach data
    - `get_post_engaged_users(post_id)` - Get engagement metrics
    - `get_post_reactions_breakdown(post_id)` - Get reaction counts
    - `get_post_top_commenters(post_id)` - Identify most active commenters
    
    ### Communication:
    - `send_dm_to_user(user_id, message)` - Send direct messages
    - `filter_negative_comments(comments)` - Filter negative sentiment
    
    ## Environment Variables Required
    
    Ensure these are set in your .env file:
    - `FACEBOOK_ACCESS_TOKEN` - Your Facebook Page access token
    - `FACEBOOK_PAGE_ID` - Your Facebook Page ID
    - `FACEBOOK_APP_ID` - Your Facebook App ID (optional)
    - `FACEBOOK_APP_SECRET` - Your Facebook App Secret (optional)
    """
    
    def __init__(self, mongodb_uri: str = None, model_id: str = "gpt-4o"):
        """
        Initialize the Facebook agent with MongoDB storage.
        
        Args:
            mongodb_uri (str, optional): MongoDB connection string. If not provided, it will be read from environment variables.
            model_id (str, optional): OpenAI model ID to use. Defaults to "gpt-4o".
        """
        # Get MongoDB connection string from environment variables if not provided
        if not mongodb_uri:
            mongodb_uri = os.getenv("MONGODB_URL", "")
            if not mongodb_uri:
                raise ValueError("MONGODB_URL environment variable is not set. Please set it to your MongoDB Atlas connection string.")
        
        # Create MongoDB storage for the Facebook agent
        try:
            self.storage = MongoDbStorage(
                collection_name="facebook_agent",
                db_url=mongodb_uri,
                db_name="myserviceprovider"
            )
        except Exception as e:
            logger.warning(f"MongoDB storage failed, using SQLite fallback: {e}")
            from pathlib import Path
            tmp_dir = Path(__file__).parent.parent / "tmp"
            tmp_dir.mkdir(exist_ok=True)
            self.storage = SqliteStorage(
                table_name="facebook_agent",
                db_file=str(tmp_dir / "agents.db")
            )
        
        # Initialize MongoDB memory for user memories with a unique collection name for Facebook agent
        self.memory_db = MongoMemoryDb(
            collection_name="facebook_agent_memories",
            db_url=mongodb_uri,
            db_name="myserviceprovider"
        )
        
        # Create a memory instance with MongoDB storage
        self.agent_memory = Memory(
            model=OpenAIChat(id=model_id),
            db=self.memory_db
        )
        
        self.model_id = model_id
        self.mcp_tools = None
        self.agent = None
        
        # Path to the token storage file
        self.token_storage_path = Path(parent_dir) / "Agents" / "facebook_mcp" / "token_storage.json"
    
    async def initialize(self):
        """Initialize the agent with MCPTools"""
        try:
            # Create the Facebook agent with MCP tools
            # Use MCPTools to run the Facebook MCP server with UV for proper dependency management
            # Pass all environment variables to ensure access tokens are available
            server_path = os.path.join(parent_dir, "Agents", "facebook_mcp", "server.py")
            self.mcp_tools = MCPTools(
                command=f"uv run --with mcp[cli] --with requests mcp run {server_path}",
                env={**os.environ}
            )
            
            # Start the MCP server
            await self.mcp_tools.__aenter__()
            
            # Create the agent with the MCP tools
            self.agent = Agent(
                name="Facebook Page Manager",
                model=OpenAIChat(id=self.model_id),
                tools=[self.mcp_tools],
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
            print(f"Error initializing Facebook agent: {str(e)}")
            await self.shutdown()
            raise
    
    async def shutdown(self):
        """Shutdown the agent and MCP server"""
        if self.mcp_tools:
            try:
                await self.mcp_tools.__aexit__(None, None, None)
                self.mcp_tools = None
            except Exception as e:
                print(f"Error closing MCP tools: {str(e)}")
    
    def check_token_validity(self) -> Dict[str, Any]:
        """
        Check if the Facebook access token is valid and not expired.
        
        Returns:
            dict: Token validity status with keys:
                - valid (bool): Whether the token is valid
                - message (str): Status message
                - expires_at (int, optional): Expiration timestamp if available
        """
        if not self.token_storage_path.exists():
            return {
                "valid": False,
                "message": "No Facebook access token found. Please log in with Facebook first."
            }
        
        try:
            with open(self.token_storage_path, "r") as f:
                token_data = json.load(f)
                
            # Check if token exists
            if not token_data.get("access_token"):
                return {
                    "valid": False,
                    "message": "Invalid token data. Please log in with Facebook again."
                }
            
            # Check if token is expired
            expires_at = token_data.get("expires_at")
            if expires_at and int(expires_at) < int(time.time()):
                return {
                    "valid": False,
                    "message": "Facebook access token has expired. Please log in again.",
                    "expires_at": expires_at
                }
            
            return {
                "valid": True,
                "message": "Facebook access token is valid.",
                "expires_at": expires_at
            }
        except (json.JSONDecodeError, IOError) as e:
            return {
                "valid": False,
                "message": f"Error reading token data: {str(e)}"
            }
    
    async def verify_token_before_operation(self) -> Dict[str, Any]:
        """
        Verify the token before performing any Facebook operation.
        If the token is invalid, it will suggest the user to log in again.
        
        Returns:
            dict: Token verification result
        """
        token_status = self.check_token_validity()
        
        if not token_status["valid"]:
            # If token is invalid, test the connection to Facebook API
            test_result = await self.test_facebook_connection()
            
            if not test_result["success"]:
                return {
                    "success": False,
                    "message": f"Facebook token is invalid or expired. {token_status['message']} Please log in with Facebook again."
                }
        
        return {
            "success": True,
            "message": "Facebook token is valid."
        }
    
    async def test_facebook_connection(self) -> Dict[str, Any]:
        """
        Test the connection to Facebook API by getting the page fan count.
        
        Returns:
            dict: Connection test result
        """
        try:
            # Use the agent to call the MCP tool
            response = await self.agent.arun("Get the total number of fans for our Facebook page.")
            
            # Check if the response contains an error
            if "error" in response.lower() or "invalid" in response.lower() or "expired" in response.lower():
                return {
                    "success": False,
                    "message": "Failed to connect to Facebook API. Please check your access token and permissions."
                }
            
            return {
                "success": True,
                "message": "Successfully connected to Facebook API."
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error testing Facebook connection: {str(e)}"
            }
    
    async def post_to_facebook(self, message: str) -> Dict[str, Any]:
        """
        Create a new Facebook Page post with a text message.
        
        Args:
            message (str): The message content
            
        Returns:
            dict: Post creation result
        """
        # Verify token before operation
        token_verification = await self.verify_token_before_operation()
        if not token_verification["success"]:
            return token_verification
        
        # Use the agent to call the MCP tool
        response = await self.agent.arun(f"Post the following message to our Facebook page: {message}")
        
        return {
            "success": "error" not in response.lower(),
            "message": response
        }
    
    async def post_image_to_facebook(self, image_url: str, caption: str) -> Dict[str, Any]:
        """
        Post an image with a caption to the Facebook page.
        
        Args:
            image_url (str): URL of the image
            caption (str): Caption for the image
            
        Returns:
            dict: Post result
        """
        # Verify token before operation
        token_verification = await self.verify_token_before_operation()
        if not token_verification["success"]:
            return token_verification
        
        # Use the agent to call the MCP tool
        response = await self.agent.arun(
            f"Post this image to our Facebook page: {image_url} with the caption: {caption}"
        )
        
        return {
            "success": "error" not in response.lower(),
            "message": response
        }
    
    async def get_page_posts(self) -> Dict[str, Any]:
        """
        Fetch the most recent posts on the Page.
        
        Returns:
            dict: List of post objects and metadata
        """
        # Verify token before operation
        token_verification = await self.verify_token_before_operation()
        if not token_verification["success"]:
            return token_verification
        
        # Use the agent to call the MCP tool
        response = await self.agent.arun("Get the most recent posts from our Facebook page.")
        
        return {
            "success": "error" not in response.lower(),
            "message": response
        }
    
    async def get_post_comments(self, post_id: str) -> Dict[str, Any]:
        """
        Retrieve all comments for a given post.
        
        Args:
            post_id (str): ID of the post
            
        Returns:
            dict: Comment objects
        """
        # Verify token before operation
        token_verification = await self.verify_token_before_operation()
        if not token_verification["success"]:
            return token_verification
        
        # Use the agent to call the MCP tool
        response = await self.agent.arun(f"Get all comments for the Facebook post with ID: {post_id}")
        
        return {
            "success": "error" not in response.lower(),
            "message": response
        }
    
    async def reply_to_comment(self, post_id: str, comment_id: str, message: str) -> Dict[str, Any]:
        """
        Reply to a specific comment on a Facebook post.
        
        Args:
            post_id (str): ID of the post
            comment_id (str): ID of the comment to reply to
            message (str): Reply message
            
        Returns:
            dict: Reply creation result
        """
        # Verify token before operation
        token_verification = await self.verify_token_before_operation()
        if not token_verification["success"]:
            return token_verification
        
        # Use the agent to call the MCP tool
        response = await self.agent.arun(
            f"Reply to the comment with ID {comment_id} on post {post_id} with this message: {message}"
        )
        
        return {
            "success": "error" not in response.lower(),
            "message": response
        }
    
    async def get_post_insights(self, post_id: str) -> Dict[str, Any]:
        """
        Fetch all insights metrics for a post.
        
        Args:
            post_id (str): ID of the post
            
        Returns:
            dict: Multiple metrics and their values
        """
        # Verify token before operation
        token_verification = await self.verify_token_before_operation()
        if not token_verification["success"]:
            return token_verification
        
        # Use the agent to call the MCP tool
        response = await self.agent.arun(f"Get all insights and metrics for the Facebook post with ID: {post_id}")
        
        return {
            "success": "error" not in response.lower(),
            "message": response
        }
    
    async def schedule_post(self, message: str, publish_time: int) -> Dict[str, Any]:
        """
        Schedule a new post for future publishing.
        
        Args:
            message (str): Post message
            publish_time (int): Unix timestamp
            
        Returns:
            dict: Scheduled post info
        """
        # Verify token before operation
        token_verification = await self.verify_token_before_operation()
        if not token_verification["success"]:
            return token_verification
        
        # Use the agent to call the MCP tool
        response = await self.agent.arun(
            f"Schedule a Facebook post with this message: {message} to be published at timestamp {publish_time}"
        )
        
        return {
            "success": "error" not in response.lower(),
            "message": response
        }
    
    async def delete_post(self, post_id: str) -> Dict[str, Any]:
        """
        Delete a specific post from the Facebook Page.
        
        Args:
            post_id (str): ID of the post to delete
            
        Returns:
            dict: Deletion result
        """
        # Verify token before operation
        token_verification = await self.verify_token_before_operation()
        if not token_verification["success"]:
            return token_verification
        
        # Use the agent to call the MCP tool
        response = await self.agent.arun(f"Delete the Facebook post with ID: {post_id}")
        
        return {
            "success": "error" not in response.lower(),
            "message": response
        }
    
    async def hide_comment(self, comment_id: str) -> Dict[str, Any]:
        """
        Hide a comment from public view.
        
        Args:
            comment_id (str): ID of the comment to hide
            
        Returns:
            dict: Operation result
        """
        # Verify token before operation
        token_verification = await self.verify_token_before_operation()
        if not token_verification["success"]:
            return token_verification
        
        # Use the agent to call the MCP tool
        response = await self.agent.arun(f"Hide the Facebook comment with ID: {comment_id}")
        
        return {
            "success": "error" not in response.lower(),
            "message": response
        }
    
    async def unhide_comment(self, comment_id: str) -> Dict[str, Any]:
        """
        Unhide a previously hidden comment.
        
        Args:
            comment_id (str): ID of the comment to unhide
            
        Returns:
            dict: Operation result
        """
        # Verify token before operation
        token_verification = await self.verify_token_before_operation()
        if not token_verification["success"]:
            return token_verification
        
        # Use the agent to call the MCP tool
        response = await self.agent.arun(f"Unhide the Facebook comment with ID: {comment_id}")
        
        return {
            "success": "error" not in response.lower(),
            "message": response
        }
    
    async def get_page_fan_count(self) -> Dict[str, Any]:
        """
        Get the Page's total fan/like count.
        
        Returns:
            dict: Fan count result
        """
        # Verify token before operation
        token_verification = await self.verify_token_before_operation()
        if not token_verification["success"]:
            return token_verification
        
        # Use the agent to call the MCP tool
        response = await self.agent.arun("Get the total number of fans for our Facebook page.")
        
        return {
            "success": "error" not in response.lower(),
            "message": response
        }
    
    async def filter_negative_comments(self, post_id: str) -> Dict[str, Any]:
        """
        Filter comments on a post for basic negative sentiment.
        
        Args:
            post_id (str): ID of the post
            
        Returns:
            dict: Flagged negative comments
        """
        # Verify token before operation
        token_verification = await self.verify_token_before_operation()
        if not token_verification["success"]:
            return token_verification
        
        # Use the agent to call the MCP tool
        response = await self.agent.arun(
            f"Get all comments for the Facebook post with ID: {post_id} and filter out the negative ones."
        )
        
        return {
            "success": "error" not in response.lower(),
            "message": response
        }
    
    async def process_user_query(self, query: str) -> str:
        """
        Process a user query using the Facebook agent.
        
        Args:
            query (str): User query
            
        Returns:
            str: Agent response
        """
        # Verify token before operation
        token_verification = await self.verify_token_before_operation()
        if not token_verification["success"]:
            return token_verification["message"]
        
        # Use the agent to process the query
        response = await self.agent.arun(query)
        
        return response
    
    async def aprint_response(self, query: str, markdown: bool = True) -> None:
        """
        Print the agent's response to a query.
        
        Args:
            query (str): User query
            markdown (bool, optional): Whether to format the response as markdown. Defaults to True.
        """
        await self.agent.aprint_response(query, markdown=markdown)