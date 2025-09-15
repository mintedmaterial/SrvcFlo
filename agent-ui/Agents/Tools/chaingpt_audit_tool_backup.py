#!/usr/bin/env python3
"""
ChainGPT Audit Tool - ServiceFlow AI
Tool for auditing Solidity smart contracts using ChainGPT API
"""

import os
import requests
import json
from typing import Dict, Any, Optional

def audit_contract_with_chaingpt(contract_code: str, contract_name: str = "Contract") -> Dict[str, Any]:
    """Audit a Solidity contract using ChainGPT API
    
    Args:
        contract_code (str): The Solidity contract code to audit
        contract_name (str): Name of the contract being audited
        
    Returns:
        Dict[str, Any]: Audit results from ChainGPT
    """
    try:
        # ChainGPT Smart Contract Auditor API endpoint (from official docs)
        api_url = "https://api.chaingpt.org/chat/stream"
        
        # Get API key from environment
        api_key = os.getenv("CHAINGPT_API_KEY")
        if not api_key:
            return {
                "error": "ChainGPT API key not found. Please set CHAINGPT_API_KEY environment variable",
                "status": "error"
            }
        
        # Headers for the API request
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Prepare the audit prompt
        audit_prompt = f"""
        Please perform a comprehensive security audit of the following Solidity smart contract named '{contract_name}':

        {contract_code}

        Please analyze the contract for:
        1. Security vulnerabilities (reentrancy, overflow/underflow, access control issues, etc.)
        2. Gas optimization opportunities
        3. Code quality and best practices
        4. Potential attack vectors
        5. Compliance with common standards (ERC-20, ERC-721, etc. if applicable)
        6. Logic errors and edge cases
        7. Event emission patterns
        8. Input validation issues

        Please provide:
        - A severity rating (Critical, High, Medium, Low) for each issue found
        - Specific line numbers or function names where issues occur
        - Detailed explanation of each vulnerability
        - Recommended fixes and improvements
        - Overall security score (1-10)
        - Summary of findings

        Format the response as a structured report.
        """
        
        # API request payload (ChainGPT Smart Contract Auditor format)
        payload = {
            "model": "smart_contract_auditor",
            "question": f"Please audit this Solidity smart contract named '{contract_name}':\n\n{contract_code}\n\n{audit_prompt}",
            "chatHistory": "off",
            "sdkUniqueId": f"serviceflow_audit_{contract_name.lower()}"
        }
        
        # Make the API request
        response = requests.post(api_url, headers=headers, json=payload, timeout=60)
        
        if response.status_code == 200:
            # ChainGPT returns streaming response, collect all chunks
            response_text = response.text
            
            # Try to parse as JSON if possible, otherwise use raw text
            try:
                result = response.json()
                # ChainGPT response structure: check for data.bot or similar
                audit_result = result.get("data", {}).get("bot", response_text)
            except:
                # If not JSON, use the raw response text
                audit_result = response_text
            
            return {
                "contract_name": contract_name,
                "audit_result": audit_result,
                "status": "success",
                "auditor": "ChainGPT Smart Contract Auditor",
                "timestamp": "2024-01-01"  # Would be current timestamp in real implementation
            }
        else:
            return {
                "error": f"ChainGPT API request failed with status {response.status_code}",
                "response_text": response.text[:500],  # Limit response text length
                "status": "error",
                "note": "Check ChainGPT API key validity and account credits"
            }
            
    except requests.exceptions.Timeout:
        return {
            "error": "ChainGPT API request timed out",
            "status": "error"
        }
    except requests.exceptions.RequestException as e:
        return {
            "error": f"ChainGPT API request failed: {str(e)}",
            "status": "error"
        }
    except Exception as e:
        return {
            "error": f"Unexpected error during audit: {str(e)}",
            "status": "error"
        }

def audit_contract_file(file_path: str) -> Dict[str, Any]:
    """Audit a Solidity contract file using ChainGPT
    
    Args:
        file_path (str): Path to the contract file
        
    Returns:
        Dict[str, Any]: Audit results
    """
    try:
        from pathlib import Path
        
        contracts_dir = Path("C:/Users/PC/ServiceApp/myserviceprovider-app/Contracts")
        full_path = contracts_dir / file_path
        
        if not full_path.exists():
            # Try to find the file
            matching_files = list(contracts_dir.glob(f"**/*{file_path}*"))
            if matching_files:
                full_path = matching_files[0]
            else:
                return {
                    "error": f"Contract file '{file_path}' not found",
                    "status": "error"
                }
        
        # Read the contract file
        with open(full_path, 'r', encoding='utf-8') as f:
            contract_code = f.read()
        
        # Audit the contract
        return audit_contract_with_chaingpt(contract_code, full_path.name)
        
    except Exception as e:
        return {
            "error": f"Error reading contract file: {str(e)}",
            "status": "error"
        }

# Shell command version for integration
def shell_audit_contract(contract_path: str) -> str:
    """Shell command to audit a contract file
    
    Args:
        contract_path (str): Path to the contract file
        
    Returns:
        str: Formatted audit result
    """
    result = audit_contract_file(contract_path)
    
    if result.get("status") == "success":
        return f"ChainGPT Audit Report for {result['contract_name']}:\n\n{result['audit_result']}"
    else:
        return f"Audit Error: {result.get('error', 'Unknown error occurred')}"