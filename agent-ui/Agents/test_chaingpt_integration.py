#!/usr/bin/env python3
"""
Test ChainGPT Integration
Verify that the ChainGPT API key is properly configured and accessible
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

def test_chaingpt_api_key():
    """Test if ChainGPT API key is configured"""
    api_key = os.getenv("CHAINGPT_API_KEY")
    
    if not api_key:
        print("ERROR: CHAINGPT_API_KEY not found in environment variables")
        return False
    
    if api_key.strip() == "":
        print("ERROR: CHAINGPT_API_KEY is empty")
        return False
    
    # Don't print the actual key for security
    print(f"SUCCESS: CHAINGPT_API_KEY found (length: {len(api_key)} characters)")
    return True

def test_chaingpt_tool_import():
    """Test importing the ChainGPT audit tool"""
    try:
        sys.path.append(os.path.dirname(__file__))
        from Tools.chaingpt_audit_tool import audit_contract_with_chaingpt
        print("SUCCESS: ChainGPT audit tool imported successfully")
        return True
    except ImportError as e:
        print(f"ERROR: Failed to import ChainGPT audit tool: {e}")
        return False

def test_chaingpt_tool_function():
    """Test the ChainGPT audit tool with a simple contract"""
    try:
        from Tools.chaingpt_audit_tool import audit_contract_with_chaingpt
        
        # Simple test contract
        test_contract = """
        pragma solidity ^0.8.0;

        contract SimpleTest {
            uint256 public value;
            
            function setValue(uint256 _value) public {
                value = _value;
            }
        }
        """
        
        print("\nTesting ChainGPT audit tool with simple contract...")
        result = audit_contract_with_chaingpt(test_contract, "SimpleTest")
        
        if "error" in result:
            print(f"ERROR: ChainGPT audit tool error: {result['error']}")
            return False
        else:
            print("SUCCESS: ChainGPT audit tool executed successfully")
            print(f"Response preview: {str(result)[:100]}...")
            return True
            
    except Exception as e:
        print(f"ERROR: ChainGPT audit tool test failed: {e}")
        return False

def main():
    """Run all ChainGPT integration tests"""
    print("ChainGPT Integration Test")
    print("=" * 40)
    
    tests = [
        ("API Key Configuration", test_chaingpt_api_key),
        ("Tool Import", test_chaingpt_tool_import),
        ("Tool Function Test", test_chaingpt_tool_function),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        print(f"\nRunning: {test_name}")
        print("-" * 30)
        
        try:
            if test_func():
                passed += 1
                print(f"PASSED: {test_name}")
            else:
                failed += 1
                print(f"FAILED: {test_name}")
        except Exception as e:
            failed += 1
            print(f"ERROR: {test_name} - {e}")
    
    # Summary
    print("\n" + "=" * 40)
    print("Test Results")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("\nAll ChainGPT integration tests passed!")
        print("ChainGPT audit tool is ready for smart contract analysis.")
        return True
    else:
        print(f"\n{failed} test(s) failed. Check configuration.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)