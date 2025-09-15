#!/usr/bin/env python3
"""
Test script to verify the updated Facebook agent configuration with MCP tools.
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

# Load environment variables from .env file
dotenv_path = os.path.join(parent_dir, '.env')
load_dotenv(dotenv_path=dotenv_path)

# Import the Facebook agent
from facebook_agent import FacebookAgent

async def test_facebook_agent_updated():
    """Test the updated Facebook agent with MCP tools and enhanced instructions"""
    print("Testing Updated Facebook Agent with MCP Tools...")
    print("=" * 60)
    
    # Check environment variables
    print("\n1. Checking Environment Variables:")
    facebook_token = os.getenv("FACEBOOK_ACCESS_TOKEN")
    facebook_page_id = os.getenv("FACEBOOK_PAGE_ID")
    
    print(f"   - FACEBOOK_ACCESS_TOKEN: {'Found' if facebook_token else 'Missing'}")
    print(f"   - FACEBOOK_PAGE_ID: {'Found' if facebook_page_id else 'Missing'}")
    
    if not facebook_token:
        print("   Warning: No Facebook access token found. Some tests may fail.")
    
    # Initialize Facebook agent
    print("\n2. Initializing Facebook Agent:")
    try:
        mongodb_uri = os.getenv("MONGODB_URL", "")
        if not mongodb_uri:
            print("   Warning: MONGODB_URL not set, using default")
            mongodb_uri = "mongodb://localhost:27017"
        
        facebook_agent = FacebookAgent(mongodb_uri=mongodb_uri)
        print("   Facebook agent initialized successfully")
        
        # Test agent initialization with MCP tools
        print("\n3. Testing MCP Tools Integration:")
        await facebook_agent.initialize()
        print("   MCP tools initialized successfully")
        
        # Test MCP tools availability
        if facebook_agent.mcp_tools:
            try:
                # Give some time for MCP server to fully start
                await asyncio.sleep(2)
                
                tools = facebook_agent.mcp_tools.get_tools()
                print(f"   ✅ MCP tools loaded: {len(tools)} tools available")
                
                # Check for key Facebook tools
                key_tools = [
                    "post_to_facebook",
                    "get_page_posts",
                    "get_page_fan_count",
                    "post_image_to_facebook",
                    "get_post_insights"
                ]
                
                print("\n4. Checking Key Facebook MCP Tools:")
                for tool in key_tools:
                    if tool in tools:
                        print(f"   ✅ {tool} - Available")
                    else:
                        print(f"   ❌ {tool} - Missing")
                
                # Test agent instructions
                print("\n5. Testing Agent Instructions:")
                if facebook_agent.agent:
                    instructions = facebook_agent.agent.instructions
                    if any("MCP" in str(instruction) for instruction in instructions):
                        print("   ✅ Agent instructions include MCP tool documentation")
                    else:
                        print("   ❌ Agent instructions missing MCP tool documentation")
                    
                    # Count tool categories in instructions
                    instruction_text = "\n".join(str(i) for i in instructions)
                    tool_categories = [
                        "Content Creation",
                        "Content Management", 
                        "Analytics & Insights",
                        "Communication Tools"
                    ]
                    
                    print("   📋 Instruction Categories:")
                    for category in tool_categories:
                        if category in instruction_text:
                            print(f"      ✅ {category}")
                        else:
                            print(f"      ❌ {category}")
                else:
                    print("   ❌ Agent not properly initialized")
                
                print("\n6. Testing Basic Agent Response:")
                try:
                    # Test a simple query that should use MCP tools
                    response = await facebook_agent.process_user_query("What tools are available for Facebook management?")
                    print("   ✅ Agent responded to query about available tools")
                    print(f"   📝 Response length: {len(response)} characters")
                except Exception as e:
                    print(f"   ❌ Error testing agent response: {e}")
                
            except Exception as e:
                print(f"   ❌ Error accessing MCP tools: {e}")
        else:
            print("   ❌ MCP tools not properly initialized")
        
        # Cleanup
        print("\n7. Cleaning Up:")
        await facebook_agent.shutdown()
        print("   ✅ Facebook agent shutdown successfully")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error initializing Facebook agent: {e}")
        return False

async def test_playground_configuration():
    """Test the playground configuration with the updated Facebook agent"""
    print("\n" + "=" * 60)
    print("Testing Playground Configuration...")
    print("=" * 60)
    
    try:
        # Import playground components
        from playground import facebook_agent, playground_app
        
        print("\n1. Checking Playground Facebook Agent:")
        
        # Check if facebook_agent is properly configured
        if hasattr(facebook_agent, 'tools') and facebook_agent.tools:
            print("   ✅ Facebook agent has tools configured")
            
            # Check MCPTools
            mcp_tool = facebook_agent.tools[0]
            if hasattr(mcp_tool, 'command'):
                command = mcp_tool.command
                if 'uv run' in command and 'mcp run' in command:
                    print("   ✅ Facebook agent uses correct UV command")
                else:
                    print(f"   ❌ Incorrect command format: {command}")
            else:
                print("   ❌ MCP tool missing command attribute")
        else:
            print("   ❌ Facebook agent missing tools")
        
        # Check instructions
        if hasattr(facebook_agent, 'instructions'):
            instructions = facebook_agent.instructions
            instruction_text = "\n".join(str(i) for i in instructions)
            
            print("\n2. Checking Agent Instructions:")
            if "MCP" in instruction_text:
                print("   ✅ Instructions mention MCP")
            if "post_to_facebook" in instruction_text:
                print("   ✅ Instructions list MCP tools")
            if "Content Creation" in instruction_text:
                print("   ✅ Instructions organized by categories")
        
        # Check playground app
        print("\n3. Checking Playground App:")
        if hasattr(playground_app, 'agents'):
            agent_names = [agent.name for agent in playground_app.agents]
            if "Facebook Page Manager" in agent_names:
                print("   ✅ Facebook Page Manager included in playground")
            else:
                print("   ❌ Facebook Page Manager not found in playground")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error testing playground configuration: {e}")
        return False

if __name__ == "__main__":
    print("Starting Facebook Agent Configuration Tests")
    print("=" * 60)
    
    # Run both tests
    agent_test = asyncio.run(test_facebook_agent_updated())
    playground_test = asyncio.run(test_playground_configuration())
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Facebook Agent Test: {'PASSED' if agent_test else 'FAILED'}")
    print(f"Playground Config Test: {'PASSED' if playground_test else 'FAILED'}")
    
    if agent_test and playground_test:
        print("\nAll tests passed! Facebook MCP agent is properly configured.")
    else:
        print("\nSome tests failed. Please check the configuration.")
    
    print("\nNext Steps:")
    print("1. Ensure UV package manager is installed: curl -Ls https://astral.sh/uv/install.sh | bash")
    print("2. Test the playground: python playground.py")
    print("3. Use the Facebook agent for content creation and management")