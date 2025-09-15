#!/usr/bin/env python3
"""
Test script to verify that MCPTools properly auto-discovers Facebook MCP server tools.
"""

import os
import sys
import asyncio
import nest_asyncio
from pathlib import Path

# Allow nested event loops
nest_asyncio.apply()

# Add parent directory to path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

from dotenv import load_dotenv
from agno.tools.mcp import MCPTools

# Load environment variables from .env file
dotenv_path = os.path.join(parent_dir, '.env')
load_dotenv(dotenv_path=dotenv_path)

async def test_mcp_tools_discovery():
    """Test that MCPTools auto-discovers Facebook MCP server tools"""
    print("Testing MCP Tools Auto-Discovery for Facebook Server")
    print("=" * 60)
    
    # Get current directory for server path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    server_path = os.path.join(current_dir, "facebook_mcp", "server.py")
    
    print(f"Server path: {server_path}")
    print(f"Server exists: {os.path.exists(server_path)}")
    
    # Environment variables
    facebook_access_token = os.getenv("FACEBOOK_ACCESS_TOKEN")
    facebook_page_id = os.getenv("FACEBOOK_PAGE_ID")
    
    print(f"Facebook token available: {facebook_access_token is not None}")
    print(f"Facebook page ID available: {facebook_page_id is not None}")
    
    # Create MCPTools instance
    print("\nInitializing MCPTools...")
    try:
        async with MCPTools(
            command=f"uv run --with mcp[cli] --with requests mcp run {server_path}",
            env={
                "FACEBOOK_ACCESS_TOKEN": facebook_access_token,
                "FACEBOOK_PAGE_ID": facebook_page_id,
                **os.environ
            }
        ) as mcp_tools:
            print("MCP Tools initialized successfully!")
            
            # Give server time to start
            await asyncio.sleep(3)
            
            # Get available tools
            print("\nDiscovering available tools...")
            tools = mcp_tools.get_tools()
            
            print(f"Total tools discovered: {len(tools)}")
            
            # Expected Facebook MCP tools
            expected_tools = [
                "post_to_facebook",
                "post_image_to_facebook", 
                "schedule_post",
                "update_post",
                "get_page_posts",
                "delete_post",
                "get_post_comments",
                "reply_to_comment",
                "hide_comment",
                "unhide_comment",
                "bulk_hide_comments",
                "bulk_delete_comments",
                "get_page_fan_count",
                "get_post_insights",
                "get_post_impressions",
                "get_post_engaged_users",
                "get_post_reactions_breakdown",
                "get_post_top_commenters",
                "send_dm_to_user",
                "filter_negative_comments",
                "get_number_of_comments",
                "get_number_of_likes",
                "get_post_share_count"
            ]
            
            print("\nChecking for expected Facebook tools:")
            found_tools = []
            missing_tools = []
            
            for tool in expected_tools:
                if tool in tools:
                    found_tools.append(tool)
                    print(f"  ✓ {tool}")
                else:
                    missing_tools.append(tool)
                    print(f"  ✗ {tool}")
            
            print(f"\nSummary:")
            print(f"  Found: {len(found_tools)}/{len(expected_tools)} tools")
            print(f"  Missing: {len(missing_tools)} tools")
            
            if missing_tools:
                print(f"  Missing tools: {', '.join(missing_tools)}")
            
            # Test tool descriptions
            print("\nTool descriptions:")
            for tool_name in found_tools[:5]:  # Show first 5 tools
                tool_info = tools.get(tool_name)
                if tool_info and hasattr(tool_info, 'description'):
                    print(f"  {tool_name}: {tool_info.description}")
                else:
                    print(f"  {tool_name}: No description available")
            
            return len(found_tools) > 0
            
    except Exception as e:
        print(f"Error initializing MCP Tools: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_mcp_tools_discovery())
    
    print("\n" + "=" * 60)
    if success:
        print("SUCCESS: MCP Tools can discover Facebook server tools!")
        print("The Facebook agent will have access to these tools automatically.")
    else:
        print("FAILED: MCP Tools could not discover Facebook server tools.")
        print("Check the server configuration and environment variables.")
    
    print("\nNext steps:")
    print("1. Run the playground: python playground.py")
    print("2. The Facebook agent will auto-discover and use these MCP tools")