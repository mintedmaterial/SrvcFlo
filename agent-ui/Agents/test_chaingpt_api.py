#!/usr/bin/env python3
"""
Simple test script to verify ChainGPT API endpoint and authentication
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

def test_chaingpt_api():
    """Test ChainGPT API with basic request"""
    
    # Get API key
    api_key = os.getenv("CHAINGPT_API_KEY")
    if not api_key:
        print("ERROR: CHAINGPT_API_KEY not found")
        return False
    
    print(f"Using API key: {api_key[:8]}...{api_key[-4:]}")
    
    # Test different endpoints
    endpoints = [
        "https://api.chaingpt.org/v1/chat/completions",
        "https://api.chaingpt.org/chat/completions", 
        "https://api.chaingpt.org/v1/completions",
        "https://api.chaingpt.org/api/v1/chat/completions"
    ]
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Simple test payload
    payload = {
        "model": "gpt-4",
        "messages": [
            {
                "role": "user",
                "content": "Hello, can you perform a simple smart contract audit?"
            }
        ],
        "max_tokens": 100,
        "temperature": 0.1
    }
    
    for endpoint in endpoints:
        print(f"\nTesting endpoint: {endpoint}")
        try:
            response = requests.post(endpoint, headers=headers, json=payload, timeout=30)
            print(f"Status code: {response.status_code}")
            
            if response.status_code == 200:
                print("SUCCESS: API call successful")
                try:
                    result = response.json()
                    print(f"Response structure: {list(result.keys())}")
                    return True
                except:
                    print("Response is not JSON")
                    print(f"Response text: {response.text[:200]}...")
            else:
                print(f"Response: {response.text[:200]}...")
                
        except Exception as e:
            print(f"Error: {e}")
    
    return False

if __name__ == "__main__":
    success = test_chaingpt_api()
    if success:
        print("\n✅ ChainGPT API test successful!")
    else:
        print("\n❌ All ChainGPT API tests failed")
