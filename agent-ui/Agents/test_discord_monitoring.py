#!/usr/bin/env python3
"""
Test Discord Monitoring Tools Integration
Tests the Discord monitoring tools and agent integration
"""

import os
import sys
import json
from datetime import datetime
from typing import Dict, Any

# Add current directory to path for imports
sys.path.append(os.path.dirname(__file__))

def test_discord_tools_import():
    """Test importing Discord monitoring tools"""
    try:
        from Tools.discord_monitoring_tools import (
            process_discord_message,
            get_discord_channel_info,
            format_discord_response
        )
        print("✅ Discord monitoring tools imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Failed to import Discord monitoring tools: {e}")
        return False

def test_process_discord_message():
    """Test processing Discord messages"""
    try:
        from Tools.discord_monitoring_tools import process_discord_message
        
        # Test message processing
        test_message = "What's the current state of the Sonic ecosystem?"
        test_channel_id = "1316237076303319114"  # srvcflo-general
        
        print(f"\n🧪 Testing message processing...")
        print(f"Message: {test_message}")
        print(f"Channel ID: {test_channel_id}")
        
        result = process_discord_message(test_message, test_channel_id)
        
        # Parse the JSON result
        parsed_result = json.loads(result)
        
        if "error" in parsed_result:
            print(f"⚠️  Processing returned error: {parsed_result['error']}")
            return False
        else:
            print(f"✅ Message processed successfully")
            print(f"Channel: {parsed_result.get('channel_info', {}).get('name', 'unknown')}")
            return True
            
    except Exception as e:
        print(f"❌ Discord message processing test failed: {e}")
        return False

def test_get_channel_info():
    """Test getting Discord channel information"""
    try:
        from Tools.discord_monitoring_tools import get_discord_channel_info
        
        test_channel_id = "1333603176762576966"  # nft-screen
        
        print(f"\n🧪 Testing channel info retrieval...")
        print(f"Channel ID: {test_channel_id}")
        
        result = get_discord_channel_info(test_channel_id)
        parsed_result = json.loads(result)
        
        if "error" in parsed_result:
            print(f"⚠️  Channel info returned error: {parsed_result['error']}")
            return False
        else:
            print(f"✅ Channel info retrieved successfully")
            print(f"Channel: {parsed_result.get('name', 'unknown')}")
            print(f"Purpose: {parsed_result.get('purpose', 'unknown')}")
            return True
            
    except Exception as e:
        print(f"❌ Channel info test failed: {e}")
        return False

def test_format_response():
    """Test Discord response formatting"""
    try:
        from Tools.discord_monitoring_tools import format_discord_response
        
        test_content = "The Sonic ecosystem is thriving with new DeFi protocols and NFT marketplaces launching regularly."
        test_channel_type = "user_interaction"
        
        print(f"\n🧪 Testing response formatting...")
        print(f"Content: {test_content[:50]}...")
        print(f"Channel Type: {test_channel_type}")
        
        result = format_discord_response(test_content, test_channel_type)
        
        if result and isinstance(result, str):
            print(f"✅ Response formatted successfully")
            print(f"Formatted: {result[:100]}...")
            return True
        else:
            print(f"❌ Response formatting failed")
            return False
            
    except Exception as e:
        print(f"❌ Response formatting test failed: {e}")
        return False

def test_agno_discord_tools():
    """Test Agno's official Discord tools"""
    try:
        from agno.tools.discord import DiscordTools
        
        print(f"\n🧪 Testing Agno Discord tools...")
        
        # Create DiscordTools instance
        discord_tools = DiscordTools()
        
        print(f"✅ Agno DiscordTools imported and instantiated successfully")
        print(f"Tools available: {type(discord_tools).__name__}")
        return True
        
    except ImportError as e:
        print(f"❌ Failed to import Agno Discord tools: {e}")
        return False
    except Exception as e:
        print(f"❌ Agno Discord tools test failed: {e}")
        return False

def test_agno_x_tools():
    """Test Agno's official X/Twitter tools"""
    try:
        from agno.tools.x import XTools
        
        print(f"\n🧪 Testing Agno X/Twitter tools...")
        
        # Create XTools instance
        x_tools = XTools()
        
        print(f"✅ Agno XTools imported and instantiated successfully")
        print(f"Tools available: {type(x_tools).__name__}")
        return True
        
    except ImportError as e:
        print(f"❌ Failed to import Agno X tools: {e}")
        return False
    except Exception as e:
        print(f"❌ Agno X tools test failed: {e}")
        return False

def test_team_lead_agent_tools():
    """Test that team lead agents have Discord and X tools"""
    try:
        print(f"\n🧪 Testing team lead agent tool integration...")
        
        # Test SrvcFlo team agent
        from teams.srvcflo_team_agent import srvcflo_team_lead
        
        tools = srvcflo_team_lead.tools if hasattr(srvcflo_team_lead, 'tools') else []
        tool_names = [type(tool).__name__ for tool in tools]
        
        print(f"SrvcFlo Team Lead tools: {tool_names}")
        
        has_discord = any('Discord' in name for name in tool_names)
        has_x = any('X' in name for name in tool_names)
        
        if has_discord and has_x:
            print(f"✅ SrvcFlo team lead has both Discord and X tools")
            return True
        else:
            print(f"⚠️  SrvcFlo team lead missing tools - Discord: {has_discord}, X: {has_x}")
            return False
            
    except ImportError as e:
        print(f"❌ Failed to import team lead agent: {e}")
        return False
    except Exception as e:
        print(f"❌ Team lead agent test failed: {e}")
        return False

def main():
    """Run all Discord monitoring integration tests"""
    print("🤖 ServiceFlow AI - Discord Monitoring Tools Test")
    print("=" * 60)
    
    tests = [
        ("Discord Tools Import", test_discord_tools_import),
        ("Discord Message Processing", test_process_discord_message),
        ("Discord Channel Info", test_get_channel_info),
        ("Discord Response Formatting", test_format_response),
        ("Agno Discord Tools", test_agno_discord_tools),
        ("Agno X/Twitter Tools", test_agno_x_tools),
        ("Team Lead Agent Tools", test_team_lead_agent_tools),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        print("-" * 40)
        
        try:
            if test_func():
                passed += 1
                print(f"✅ {test_name}: PASSED")
            else:
                failed += 1
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            failed += 1
            print(f"💥 {test_name}: ERROR - {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 All Discord monitoring tests passed!")
        print("Discord tools are ready for agent integration.")
        return True
    else:
        print(f"\n⚠️  {failed} test(s) failed. Review errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)