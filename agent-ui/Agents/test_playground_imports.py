#!/usr/bin/env python3
"""
Test script to verify all playground imports work correctly
"""

import sys
import traceback

def test_imports():
    """Test all critical imports for the playground"""
    print("🧪 Testing playground imports...")
    
    failed_imports = []
    successful_imports = []
    
    # List of imports to test
    imports_to_test = [
        ("agno.agent", "Agent"),
        ("agno.models.openai", "OpenAIChat"),
        ("agno.playground", "Playground"),
        ("agno.tools.duckduckgo", "DuckDuckGoTools"),
        ("agno.storage.mongodb", "MongoDbStorage"),
        ("linear_tools", "LinearAPI"),
        ("paintswap_tools", "PaintswapAPI"),
        ("finance_research_tools", "DexScreenerAPI"),
        ("discord_monitoring_tools", "DiscordWebhookManager"),
        ("sonic_research_team", "SonicResearchTeam"),
        ("unified_user_manager", "UnifiedUserManager"),
        ("dalle_tools", "DALLEImageGenerator"),
        ("storage.mongodb_storage_for_team", "get_mongodb_storage_for_team")
    ]
    
    for module_name, class_name in imports_to_test:
        try:
            module = __import__(module_name, fromlist=[class_name])
            getattr(module, class_name)
            successful_imports.append(f"{module_name}.{class_name}")
            print(f"✅ {module_name}.{class_name}")
        except ImportError as e:
            failed_imports.append(f"{module_name}.{class_name}: {e}")
            print(f"❌ {module_name}.{class_name}: {e}")
        except AttributeError as e:
            failed_imports.append(f"{module_name}.{class_name}: {e}")
            print(f"⚠️  {module_name}.{class_name}: {e}")
        except Exception as e:
            failed_imports.append(f"{module_name}.{class_name}: {e}")
            print(f"💥 {module_name}.{class_name}: {e}")
    
    print(f"\n📊 Import Results:")
    print(f"   ✅ Successful: {len(successful_imports)}")
    print(f"   ❌ Failed: {len(failed_imports)}")
    
    if failed_imports:
        print(f"\n❌ Failed imports:")
        for failure in failed_imports:
            print(f"   • {failure}")
        return False
    else:
        print(f"\n🎉 All imports successful! Playground should start correctly.")
        return True

def test_environment_setup():
    """Test environment variable setup"""
    print(f"\n🌍 Testing environment setup...")
    
    import os
    required_vars = [
        "OPENAI_API_KEY",
        "MONGODB_URI",
        "LANGFUSE_SECRET_KEY",
        "LANGFUSE_PUBLIC_KEY"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
        else:
            print(f"✅ {var} configured")
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    else:
        print(f"✅ All required environment variables configured")
        return True

def test_agent_creation():
    """Test basic agent creation"""
    print(f"\n🤖 Testing agent creation...")
    
    try:
        from agno.agent import Agent
        from agno.models.openai import OpenAIChat
        from agno.tools.duckduckgo import DuckDuckGoTools
        
        # Create a simple test agent
        test_agent = Agent(
            name="Test Agent",
            model=OpenAIChat(id="gpt-4o"),
            tools=[DuckDuckGoTools()],
            instructions=["You are a test agent."]
        )
        
        print(f"✅ Successfully created test agent: {test_agent.name}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create test agent: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 ServiceFlow AI Playground - Import Test Suite")
    print("=" * 50)
    
    # Run all tests
    import_success = test_imports()
    env_success = test_environment_setup()
    agent_success = test_agent_creation()
    
    print("\n" + "=" * 50)
    print("📋 Final Test Results:")
    print(f"   Imports: {'✅ PASS' if import_success else '❌ FAIL'}")
    print(f"   Environment: {'✅ PASS' if env_success else '❌ FAIL'}")
    print(f"   Agent Creation: {'✅ PASS' if agent_success else '❌ FAIL'}")
    
    overall_success = import_success and env_success and agent_success
    print(f"\n🏁 Overall Result: {'🎉 ALL TESTS PASSED' if overall_success else '💥 SOME TESTS FAILED'}")
    
    if overall_success:
        print("\n✨ The playground should now start successfully!")
        print("   Run: uv run playground.py")
    else:
        print("\n🔧 Please fix the failing tests before running the playground.")
    
    sys.exit(0 if overall_success else 1)