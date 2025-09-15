#!/usr/bin/env python3
"""
Test Discord integration independently
"""

import os
import sys
import asyncio
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add Agents directory to path  
agents_dir = Path(__file__).parent / 'Agents'
sys.path.insert(0, str(agents_dir))

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_discord_integration():
    """Test Discord integration"""
    print("Testing Discord Integration")
    print("=" * 40)
    
    # Check environment variables
    discord_token = os.getenv("DISCORD_BOT_TOKEN")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if not discord_token:
        print("X DISCORD_BOT_TOKEN not set")
        return False
    else:
        print(f"OK DISCORD_BOT_TOKEN: ...{discord_token[-10:]}")
    
    if not openai_key:
        print("X OPENAI_API_KEY not set") 
        return False
    else:
        print("OK OPENAI_API_KEY configured")
    
    # Test imports
    try:
        from discord_agent_integration import ServiceFlowDiscordAgent, create_discord_agent
        print("OK Discord agent imports successful")
    except ImportError as e:
        print(f"X Discord agent import failed: {e}")
        return False
    
    # Test agent creation
    try:
        discord_agent = ServiceFlowDiscordAgent(agent_type="general")
        print("OK ServiceFlowDiscordAgent created")
    except Exception as e:
        print(f"X ServiceFlowDiscordAgent creation failed: {e}")
        return False
    
    # Test Discord client creation
    try:
        discord_client = create_discord_agent("general")
        print("OK Discord client created")
    except Exception as e:
        print(f"X Discord client creation failed: {e}")
        return False
    
    # Test registration command
    try:
        test_response = await discord_agent._handle_registration(
            "0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8",
            "test_user_123",
            "TestUser"
        )
        print("OK Registration test completed")
        print("Response:", test_response[:100] + "...")
    except Exception as e:
        print(f"X Registration test failed: {e}")
        return False
    
    print("\n" + "=" * 40)
    print("Discord integration test completed successfully!")
    print("\nTo start Discord bot manually:")
    print("python C:/Users/PC/ServiceApp/agent-ui/Agents/discord_agent_integration.py")
    
    return True

if __name__ == "__main__":
    try:
        result = asyncio.run(test_discord_integration())
        if not result:
            print("\nSome tests failed. Check the errors above.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"\nTest failed with error: {e}")
        sys.exit(1)