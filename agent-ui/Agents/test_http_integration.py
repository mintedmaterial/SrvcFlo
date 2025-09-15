#!/usr/bin/env python3
"""
Test script for HTTP integration with SrvcFlo agents
Run this to verify that the HTTP wrapper works correctly
"""

import requests
import json
import time
from datetime import datetime

# Test configuration
AGENT_BASE_URL = "http://localhost:8000"
TEST_API_KEY = "test-token-123"  # Replace with actual token

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check endpoint...")
    try:
        response = requests.get(f"{AGENT_BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed")
            print(f"   Service: {data.get('service')}")
            print(f"   Team Lead: {data.get('agno_agents', {}).get('team_lead')}")
            print(f"   Team Members: {data.get('agno_agents', {}).get('team_members')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_srvcflo_chat():
    """Test the main SrvcFlo chat endpoint"""
    print("\n💬 Testing SrvcFlo chat endpoint...")
    
    test_messages = [
        "Hello, I'm a contractor looking to automate my business. Can you help?",
        "What are the benefits of AI automation for service businesses?",
        "How much does ServiceFlow AI cost?"
    ]
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n📝 Test {i}: {message}")
        try:
            response = requests.post(
                f"{AGENT_BASE_URL}/srvcflo-agent",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {TEST_API_KEY}"
                },
                json={
                    "message": message,
                    "user_id": f"test_user_{i}",
                    "context": {"test": True}
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    print("✅ Chat response received")
                    print(f"   Agent: {data.get('agent_used')}")
                    print(f"   Response length: {len(data.get('response', ''))}")
                    print(f"   Preview: {data.get('response', '')[:100]}...")
                else:
                    print(f"❌ Chat failed: {data.get('error')}")
            else:
                print(f"❌ HTTP error: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Chat error: {e}")
        
        # Wait between requests
        time.sleep(2)

def test_agno_assist():
    """Test the Agno Assist endpoint"""
    print("\n🔧 Testing Agno Assist endpoint...")
    
    message = "Generate a simple Python script that prints hello world using agno framework"
    print(f"📝 Test message: {message}")
    
    try:
        response = requests.post(
            f"{AGENT_BASE_URL}/agno-assist",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {TEST_API_KEY}"
            },
            json={
                "message": message,
                "user_id": "test_agno_user"
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Agno Assist response received")
                print(f"   Agent: {data.get('agent_used')}")
                print(f"   Response length: {len(data.get('response', ''))}")
                print(f"   Preview: {data.get('response', '')[:200]}...")
            else:
                print(f"❌ Agno Assist failed: {data.get('error')}")
        else:
            print(f"❌ HTTP error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Agno Assist error: {e}")

def main():
    """Run all tests"""
    print("🚀 Starting HTTP Integration Tests")
    print("=" * 50)
    print(f"🎯 Target URL: {AGENT_BASE_URL}")
    print(f"🔑 API Key: {'*' * len(TEST_API_KEY)}")
    print(f"⏰ Timestamp: {datetime.now().isoformat()}")
    print("=" * 50)
    
    # Test health check first
    if not test_health_check():
        print("\n❌ Health check failed. Make sure the HTTP agent is running:")
        print("   1. Navigate to: C:\\Users\\PC\\ServiceApp\\myserviceprovider-app\\Agents")
        print("   2. Run: run_http_agent.bat or run_http_agent.ps1")
        print("   3. Wait for 'Starting HTTP Agent Server...' message")
        return
    
    # Test chat endpoints
    test_srvcflo_chat()
    test_agno_assist()
    
    print("\n" + "=" * 50)
    print("🏁 Integration tests completed!")
    print("\nIf tests passed, your Cloudflare Worker can now communicate with your Agno agents!")
    print("\nNext steps:")
    print("1. Update your .env file with the correct SRVCFLO_AGENT_TOKEN")
    print("2. Deploy your Cloudflare Worker")
    print("3. Test the /api/chat endpoint from your frontend")

if __name__ == "__main__":
    main()