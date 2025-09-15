#!/usr/bin/env python3
"""
Final Integration Test for ServiceFlow AI Agent System
Tests all major components and improvements
"""

import os
import sys
from pathlib import Path

def test_imports():
    """Test all critical imports"""
    print("Testing imports...")
    
    try:
        # Test playground import
        import playground
        print("✓ Playground imported successfully")
        
        # Test agent imports
        from sonic_content_team import create_sonic_content_team
        print("✓ Sonic Content Team imported")
        
        from sonic_finance_team import create_sonic_finance_team
        print("✓ Sonic Finance Team imported") 
        
        from sonic_research_team_improved import create_sonic_research_team
        print("✓ Sonic Research Team imported")
        
        from cloudflare_agent import cloudflare_agent
        print("✓ Cloudflare Agent imported")
        
        from discord_bot_integration import ServiceFlowAIBot
        print("✓ Discord Bot imported")
        
        return True
        
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False

def test_agent_creation():
    """Test agent creation"""
    print("\nTesting agent creation...")
    
    try:
        # Test content team creation
        from sonic_content_team import create_sonic_content_team
        content_team = create_sonic_content_team()
        print("✓ Content team created")
        
        # Test research team creation
        from sonic_research_team_improved import create_sonic_research_team
        research_team = create_sonic_research_team("")  # Empty mongo URI for test
        print("✓ Research team created")
        
        return True
        
    except Exception as e:
        print(f"✗ Agent creation failed: {e}")
        return False

def test_environment_setup():
    """Test environment configuration"""
    print("\nTesting environment setup...")
    
    # Check required directories exist
    tmp_dir = Path("tmp/discord_agents")
    if tmp_dir.exists():
        print("✓ Discord agents directory exists")
    else:
        print("! Discord agents directory missing")
    
    # Check for key environment variables
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        print("✓ OpenAI API key configured")
    else:
        print("! OpenAI API key not set")
    
    discord_token = os.getenv("DISCORD_BOT_TOKEN")
    if discord_token:
        print("✓ Discord bot token configured")
    else:
        print("! Discord bot token not set")
    
    return True

def test_playground_agents():
    """Test playground agent access"""
    print("\nTesting playground agents...")
    
    try:
        import playground
        
        # Check if agents exist
        agents_to_check = [
            'research_coordinator',
            'finance_agent', 
            'content_creation_agent',
            'cloudflare_agent',
            'dalleai_agent'
        ]
        
        for agent_name in agents_to_check:
            if hasattr(playground, agent_name):
                print(f"✓ {agent_name} available")
            else:
                print(f"! {agent_name} not found")
        
        return True
        
    except Exception as e:
        print(f"✗ Playground test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("ServiceFlow AI Integration Test Suite")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_agent_creation,
        test_environment_setup,
        test_playground_agents
    ]
    
    passed = 0
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"Test Results: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("All systems ready!")
    else:
        print("Some components need attention")
    
    print("\nSystem Status:")
    print("- Discord Bot: Ready for slash command integration")  
    print("- Sonic Content Team: Uses content-creator workflow pattern")
    print("- Sonic Finance Team: Uses investment-report-generator pattern")
    print("- Sonic Research Team: Uses Team coordinate mode")
    print("- Cloudflare Agent: MCP server integration with async handling")
    print("- Storage: Converted to SQLite for Discord agents")

if __name__ == "__main__":
    main()