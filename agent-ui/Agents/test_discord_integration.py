#!/usr/bin/env python3
"""
Test Discord Bot Integration with Playground
Tests the Discord bot -> Playground agent routing system
"""

import asyncio
import json
import requests
from typing import Dict, Any

# Test data
TEST_DISCORD_MESSAGES = [
    {
        "channel_id": "1316237076303319114",  # srvcflo-general
        "message": "What's the current state of the Sonic ecosystem?",
        "expected_agent": "Ecosystem Analyst"
    },
    {
        "channel_id": "1333603176762576966",  # nft-screen  
        "message": "Show me the top NFT collections on PaintSwap",
        "expected_agent": "NFT Market Analyst"
    },
    {
        "channel_id": "1401444863400087602",  # contracts
        "message": "Can you audit this smart contract for security issues?",
        "expected_agent": "Smart Contract Agent"
    },
    {
        "channel_id": "1415207839642685470",  # blog
        "message": "Generate a blog post about DeFi opportunities on Sonic",
        "expected_agent": "Content Creation Agent"
    }
]

# Channel configuration (matching discord_channel_agent.py)
DISCORD_CHANNELS = {
    "1316271075675340800": {
        "name": "boardroom-og-only",
        "type": "team_only",
        "access": "restricted",
        "purpose": "Team-only discussions and strategic planning"
    },
    "1316237076303319114": {
        "name": "srvcflo-general", 
        "type": "user_interaction",
        "access": "public",
        "purpose": "General user interaction with ServiceFlow agents"
    },
    "1316243913752973322": {
        "name": "dao-holder-discussion",
        "type": "dao_holders",
        "access": "dao_members",
        "purpose": "DAO holder discussions and governance"
    },
    "1316248879922024479": {
        "name": "vote-generation-leaderboard",
        "type": "generation_voting", 
        "access": "public",
        "purpose": "AI generation voting and leaderboard updates"
    },
    "1333603176762576966": {
        "name": "nft-screen",
        "type": "nft_data",
        "access": "public", 
        "purpose": "NFT transaction monitoring from PaintSwap"
    },
    "1333615004305330348": {
        "name": "twitter-feed",
        "type": "social_data",
        "access": "public",
        "purpose": "Twitter/X feed from Sonic Labs and community leaders"
    },
    "1401440320088178778": {
        "name": "dao-holder-voting",
        "type": "dao_voting",
        "access": "dao_members",
        "purpose": "Main project DAO holder voting"
    },
    "1401441215601447092": {
        "name": "generate-how-to",
        "type": "documentation",
        "access": "public",
        "purpose": "Documentation and tutorials publication"
    },
    "1401444863400087602": {
        "name": "contracts",
        "type": "contract_docs",
        "access": "approved_members",
        "purpose": "Contract documentation and ChainGPT audits"
    },
    "1415207839642685470": {
        "name": "blog",
        "type": "content_publishing",
        "access": "public", 
        "purpose": "Agent-generated blogs, analysis, and trading strategies"
    }
}

def get_agent_for_channel(channel_info: Dict) -> str:
    """Determine which agent to use based on channel type (matching Discord bot logic)"""
    channel_type = channel_info.get('type', 'general')
    
    # Map channel types to agents
    agent_mapping = {
        'team_only': 'Discord Community Manager',
        'user_interaction': 'Discord Community Manager', 
        'dao_holders': 'Discord Community Manager',
        'generation_voting': 'Discord Community Manager',
        'nft_data': 'NFT Market Analyst',
        'social_data': 'Content Creation Agent',
        'dao_voting': 'Discord Community Manager',
        'documentation': 'Discord Community Manager',
        'contract_docs': 'Smart Contract Agent',
        'content_publishing': 'Content Creation Agent'
    }
    
    return agent_mapping.get(channel_type, 'Discord Community Manager')

def test_playground_connection(playground_url: str = "http://localhost:7777") -> bool:
    """Test if playground server is running"""
    try:
        response = requests.get(f"{playground_url}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def test_agent_routing(playground_url: str = "http://localhost:7777") -> Dict[str, Any]:
    """Test Discord message routing to playground agents"""
    results = {
        "playground_connected": False,
        "tests_passed": 0,
        "tests_failed": 0,
        "test_results": []
    }
    
    # Test playground connection
    print("🔍 Testing playground connection...")
    results["playground_connected"] = test_playground_connection(playground_url)
    
    if not results["playground_connected"]:
        print(f"❌ Playground server not reachable at {playground_url}")
        print("   💡 Make sure to run: uv run playground.py")
        return results
    
    print(f"✅ Playground server connected at {playground_url}")
    
    # Test each message routing
    print(f"\n🧪 Testing {len(TEST_DISCORD_MESSAGES)} Discord message routings...")
    
    for i, test_case in enumerate(TEST_DISCORD_MESSAGES, 1):
        channel_id = test_case["channel_id"]
        message = test_case["message"]
        expected_agent = test_case["expected_agent"]
        
        # Get channel info
        channel_info = DISCORD_CHANNELS.get(channel_id, {})
        channel_name = channel_info.get("name", "unknown")
        
        # Determine agent (using same logic as Discord bot)
        agent_name = get_agent_for_channel(channel_info)
        
        print(f"\n📋 Test {i}: {channel_name}")
        print(f"   Message: {message[:50]}...")
        print(f"   Expected Agent: {expected_agent}")
        print(f"   Selected Agent: {agent_name}")
        
        # Prepare request payload
        payload = {
            "agent_name": agent_name,
            "message": message,
            "channel_context": {
                "channel_id": channel_id,
                "channel_name": channel_name,
                "channel_info": channel_info
            }
        }
        
        try:
            # Call playground chat endpoint
            response = requests.post(
                f"{playground_url}/chat",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get("success"):
                    agent_response = result.get("response", "")
                    print(f"   ✅ Success: {agent_response[:100]}...")
                    results["tests_passed"] += 1
                    
                    results["test_results"].append({
                        "test_name": f"{channel_name} routing",
                        "status": "passed",
                        "agent_used": agent_name,
                        "response_preview": agent_response[:200]
                    })
                else:
                    error_msg = result.get("error", "Unknown error")
                    print(f"   ❌ Agent Error: {error_msg}")
                    results["tests_failed"] += 1
                    
                    results["test_results"].append({
                        "test_name": f"{channel_name} routing",
                        "status": "failed",
                        "error": error_msg
                    })
            else:
                print(f"   ❌ HTTP Error: {response.status_code}")
                results["tests_failed"] += 1
                
                results["test_results"].append({
                    "test_name": f"{channel_name} routing",
                    "status": "failed",
                    "error": f"HTTP {response.status_code}"
                })
                
        except Exception as e:
            print(f"   ❌ Request Error: {e}")
            results["tests_failed"] += 1
            
            results["test_results"].append({
                "test_name": f"{channel_name} routing",
                "status": "failed",
                "error": str(e)
            })
    
    return results

def main():
    """Run Discord integration tests"""
    print("🤖 ServiceFlow AI - Discord Integration Test")
    print("=" * 50)
    
    # Run tests
    results = test_agent_routing()
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary")
    print(f"✅ Tests Passed: {results['tests_passed']}")
    print(f"❌ Tests Failed: {results['tests_failed']}")
    print(f"🔗 Playground Connected: {results['playground_connected']}")
    
    if results["test_results"]:
        print("\n📋 Detailed Results:")
        for result in results["test_results"]:
            status_emoji = "✅" if result["status"] == "passed" else "❌"
            print(f"   {status_emoji} {result['test_name']}: {result['status']}")
            
            if result["status"] == "failed":
                print(f"      Error: {result.get('error', 'Unknown')}")
            elif "response_preview" in result:
                print(f"      Response: {result['response_preview']}...")
    
    # Overall result
    if results["tests_passed"] > 0 and results["tests_failed"] == 0:
        print(f"\n🎉 All tests passed! Discord bot integration is working correctly.")
        return True
    elif results["tests_passed"] > 0:
        print(f"\n⚠️  Partial success: {results['tests_passed']}/{results['tests_passed'] + results['tests_failed']} tests passed")
        return False
    else:
        print(f"\n💥 All tests failed. Check playground server and agent configurations.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)