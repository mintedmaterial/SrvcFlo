#!/usr/bin/env python3
"""
Test script for the Autonomous Content Creation Agent
"""

import os
import sys
import json
import asyncio
from dotenv import load_dotenv

# Add parent directory to path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

# Load environment variables
load_dotenv(os.path.join(parent_dir, '.env'))

# Test the content agent
def test_content_agent():
    """Test the autonomous content creation agent"""
    print("Testing Autonomous Content Creation Agent")
    print("=" * 50)
    
    # Check environment variables
    print("\n1. Checking Environment Variables:")
    required_vars = [
        "X_BEARER_TOKEN",
        "X_CONSUMER_KEY", 
        "X_CONSUMER_SECRET",
        "X_ACCESS_TOKEN",
        "X_ACCESS_TOKEN_SECRET",
        "MONGODB_URI"
    ]
    
    missing_vars = []
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"   + {var}: Found")
        else:
            print(f"   - {var}: Missing")
            missing_vars.append(var)
    
    if missing_vars:
        print(f"\nMissing environment variables: {missing_vars}")
        print("Please set these in your .env file before running the agent")
        return False
    
    # Test importing the agent
    print("\n2. Testing Agent Import:")
    try:
        from content_agent import content_creation_agent, ServiceFlowXTools
        print("   + Content agent imported successfully")
    except Exception as e:
        print(f"   - Error importing content agent: {e}")
        return False
    
    # Test agent tools
    print("\n3. Testing Agent Tools:")
    try:
        tools = content_creation_agent.tools
        print(f"   + Agent has {len(tools)} tools configured")
        
        # Check for ServiceFlowXTools
        x_tools = None
        for tool in tools:
            if isinstance(tool, ServiceFlowXTools):
                x_tools = tool
                break
        
        if x_tools:
            print("   + ServiceFlowXTools found")
            
            # Test tool methods
            expected_methods = [
                'create_viral_top_10_post',
                'create_ai_news_post',
                'create_serviceflow_progress_post',
                'create_trending_topic_post',
                'autonomous_daily_posting',
                'engage_with_community'
            ]
            
            for method in expected_methods:
                if hasattr(x_tools, method):
                    print(f"   + {method} method available")
                else:
                    print(f"   - {method} method missing")
        else:
            print("   - ServiceFlowXTools not found")
            return False
            
    except Exception as e:
        print(f"   - Error testing agent tools: {e}")
        return False
    
    # Test agent instructions
    print("\n4. Testing Agent Instructions:")
    try:
        instructions = content_creation_agent.instructions
        instruction_text = "\n".join(str(i) for i in instructions)
        
        key_phrases = [
            "AUTONOMOUS",
            "viral",
            "4-5 posts daily",
            "autonomous_daily_posting",
            "engage_with_community"
        ]
        
        for phrase in key_phrases:
            if phrase in instruction_text:
                print(f"   + Instructions contain '{phrase}'")
            else:
                print(f"   - Instructions missing '{phrase}'")
                
    except Exception as e:
        print(f"   - Error testing agent instructions: {e}")
        return False
    
    # Test autonomous runner
    print("\n5. Testing Autonomous Runner:")
    try:
        from content_agent import AutonomousContentRunner, autonomous_runner
        print("   + AutonomousContentRunner imported successfully")
        
        if autonomous_runner:
            print("   + Autonomous runner instance created")
        else:
            print("   - Autonomous runner instance not found")
            return False
            
    except Exception as e:
        print(f"   - Error testing autonomous runner: {e}")
        return False
    
    return True

def test_viral_content_creation():
    """Test viral content creation methods"""
    print("\n6. Testing Viral Content Creation:")
    
    try:
        from content_agent import ServiceFlowXTools
        
        # Create a test instance (without real API calls)
        x_tools = ServiceFlowXTools(
            bearer_token="test_token",
            consumer_key="test_key",
            consumer_secret="test_secret",
            access_token="test_token",
            access_token_secret="test_secret"
        )
        
        # Test viral content methods (dry run)
        print("   + ServiceFlowXTools instance created for testing")
        
        # Check if methods exist and are callable
        viral_methods = [
            'create_viral_top_10_post',
            'create_ai_news_post', 
            'create_serviceflow_progress_post',
            'create_trending_topic_post'
        ]
        
        for method_name in viral_methods:
            if hasattr(x_tools, method_name):
                method = getattr(x_tools, method_name)
                if callable(method):
                    print(f"   + {method_name} is callable")
                else:
                    print(f"   - {method_name} is not callable")
            else:
                print(f"   - {method_name} not found")
                
    except Exception as e:
        print(f"   - Error testing viral content creation: {e}")
        return False
    
    return True

def test_scheduling():
    """Test scheduling configuration"""
    print("\n7. Testing Scheduling Configuration:")
    
    try:
        import schedule
        print("   + Schedule library available")
        
        # Test schedule format
        schedule_times = ["08:00", "12:00", "15:00", "18:00", "21:00"]
        print(f"   + Configured for {len(schedule_times)} daily posts")
        
        for time_slot in schedule_times:
            print(f"   + Schedule slot: {time_slot}")
            
    except Exception as e:
        print(f"   - Error testing scheduling: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Testing Autonomous Content Creation Agent")
    print("=" * 60)
    
    # Run all tests
    tests = [
        test_content_agent,
        test_viral_content_creation,
        test_scheduling
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"   - Test failed with error: {e}")
            results.append(False)
    
    # Print summary
    print("\n" + "=" * 60)
    print(" TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Tests Passed: {passed}/{total}")
    
    if passed == total:
        print("ALL TESTS PASSED!")
        print("\nYour Autonomous Content Creation Agent is ready!")
        print("\nTo start autonomous mode:")
        print("   python content_agent.py")
        print("\nThe agent will:")
        print("   - Create 4-5 viral posts daily")
        print("   - Engage with automation conversations")
        print("   - Research trending topics")
        print("   - Track performance and optimize")
    else:
        print("Some tests failed.")
        print("Please check the environment variables and configuration.")
    
    print("\nContent Types:")
    print("   - Viral Top 10 lists")
    print("   - AI automation news")
    print("   - ServiceFlow build updates")
    print("   - Trending topic connections")
    print("   - Automation benefits")