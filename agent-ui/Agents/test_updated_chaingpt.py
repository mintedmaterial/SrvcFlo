#!/usr/bin/env python3
"""
Test the updated ChainGPT audit tool
"""

import sys
import os
from pathlib import Path

# Add the Tools directory to the path
sys.path.append(str(Path(__file__).parent / "Tools"))

def test_chaingpt_audit_tool():
    """Test the updated ChainGPT audit tool"""
    try:
        from chaingpt_audit_tool import audit_contract_with_chaingpt
        
        # Simple test contract
        test_contract = """
pragma solidity ^0.8.0;

contract SimpleTest {
    uint256 public value;
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    function setValue(uint256 _value) public {
        require(msg.sender == owner, "Only owner can set value");
        value = _value;
    }
}
"""
        
        print("Testing ChainGPT Smart Contract Auditor...")
        print("Contract code length:", len(test_contract))
        print("Starting audit request...")
        
        # Call the audit function
        result = audit_contract_with_chaingpt(test_contract, "SimpleTest")
        
        print("\n=== AUDIT RESULT ===")
        print(f"Status: {result.get('status')}")
        
        if result.get('status') == 'success':
            print(f"Auditor: {result.get('auditor')}")
            print(f"Contract: {result.get('contract_name')}")
            print("\n--- Audit Report ---")
            print(result.get('audit_result', 'No audit result found'))
            print("\n--- Raw Response Preview ---")
            print(result.get('raw_response', 'No raw response'))
            return True
        else:
            print(f"Error: {result.get('error')}")
            print(f"Response: {result.get('response_text', 'No response')}")
            return False
            
    except Exception as e:
        print(f"Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_connection():
    """Test basic API connection"""
    try:
        import os
        import requests
        from dotenv import load_dotenv
        from pathlib import Path
        
        # Load environment
        env_path = Path(__file__).parent.parent / '.env'
        load_dotenv(env_path)
        
        api_key = os.getenv('CHAINGPT_API_KEY')
        if not api_key:
            print("ERROR: API key not found")
            return False
            
        print(f"API Key loaded: {api_key[:8]}...{api_key[-4:]}")
        
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        # Test basic connectivity
        print("Testing basic API connectivity...")
        response = requests.get('https://api.chaingpt.org', timeout=10)
        print(f"Base API status: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"Connection test failed: {e}")
        return False

if __name__ == "__main__":
    print("ChainGPT Integration Test Suite")
    print("=" * 50)
    
    # Test 1: API Connection
    print("\n1. Testing API Connection...")
    conn_success = test_api_connection()
    
    if conn_success:
        # Test 2: Audit Tool
        print("\n2. Testing ChainGPT Audit Tool...")
        audit_success = test_chaingpt_audit_tool()
        
        if audit_success:
            print("\n✅ All tests passed! ChainGPT integration is working.")
        else:
            print("\n❌ Audit tool test failed.")
    else:
        print("\n❌ API connection test failed.")
