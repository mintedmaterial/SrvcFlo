#!/usr/bin/env python3
"""
Test script for RAG functionality in cloudflare_agent
"""

import os
import sys
import asyncio
import aiohttp
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from both agent-ui and myserviceprovider-app directories
agent_ui_dotenv = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
myservice_dotenv = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'myserviceprovider-app', '.env.local')
main_dotenv = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')

# Load all environment files
load_dotenv(dotenv_path=agent_ui_dotenv)
load_dotenv(dotenv_path=myservice_dotenv) 
load_dotenv(dotenv_path=main_dotenv)

async def test_serviceflow_docs_rag():
    """Test ServiceFlow Documentation RAG search"""
    
    print("Testing ServiceFlow Documentation RAG Search")
    print("="*50)
    
    # ServiceFlow RAG configuration
    rag_token = os.getenv("CLOUDFLARE_RAG_TOKEN", "tBLchoyMhJdP07gZkey8SrehEL85db_6odQQYYZx")
    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID", "ff3c5e2beaea9f85fee3200bfe28da16")
    rag_id = "serviceflow-docs-rag"
    
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/autorag/rags/{rag_id}/ai-search"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {rag_token}"
    }
    
    test_queries = [
        "How do we code a workflow with agno?",
        "What blockchain node are we using?",
        "How should authentication be implemented?"
    ]
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        payload = {"query": query}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        print(f"Status: SUCCESS")
                        
                        if result.get('success', False):
                            # Extract answer and sources
                            if 'result' in result and 'answer' in result['result']:
                                answer = result['result']['answer']
                                print(f"Answer: {answer[:200]}...")
                            
                            if 'result' in result and 'sources' in result['result']:
                                sources = result['result']['sources']
                                print(f"Sources found: {len(sources)}")
                        else:
                            print(f"Response: {result}")
                    else:
                        error_text = await response.text()
                        print(f"Status: FAILED ({response.status})")
                        print(f"Error: {error_text}")
                        
        except Exception as e:
            print(f"Status: ERROR - {str(e)}")

async def test_contracts_rag():
    """Test Contracts Documentation RAG search"""
    
    print("\nTesting Contracts Documentation RAG Search")
    print("="*50)
    
    # Contracts RAG configuration
    rag_token = os.getenv("CLOUDFLARE_RAG_TOKEN", "tBLchoyMhJdP07gZkey8SrehEL85db_6odQQYYZx")
    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID", "ff3c5e2beaea9f85fee3200bfe28da16")
    rag_id = "contractsrag"
    
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/autorag/rags/{rag_id}/ai-search"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {rag_token}"
    }
    
    contracts_query = "What ERC-20 contract do we have currently?"
    print(f"\nQuery: {contracts_query}")
    payload = {"query": contracts_query}
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"Status: SUCCESS")
                    
                    if result.get('success', False):
                        # Extract answer and sources
                        if 'result' in result and 'answer' in result['result']:
                            answer = result['result']['answer']
                            print(f"Answer: {answer[:200]}...")
                        
                        if 'result' in result and 'sources' in result['result']:
                            sources = result['result']['sources']
                            print(f"Sources found: {len(sources)}")
                    else:
                        print(f"Response: {result}")
                else:
                    error_text = await response.text()
                    print(f"Status: FAILED ({response.status})")
                    print(f"Error: {error_text}")
                    
    except Exception as e:
        print(f"Status: ERROR - {str(e)}")

async def main():
    """Run all RAG tests"""
    
    print("RAG Functionality Test Suite")
    print("="*50)
    
    # Check environment variables
    rag_token = os.getenv("CLOUDFLARE_RAG_TOKEN")
    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
    
    print(f"RAG Token: {rag_token[:20]}..." if rag_token else "RAG Token: NOT SET")
    print(f"Account ID: {account_id}" if account_id else "Account ID: NOT SET")
    
    if not rag_token or not account_id:
        print("\nERROR: Missing required environment variables!")
        return
    
    # Test both RAG systems
    await test_serviceflow_docs_rag()
    await test_contracts_rag()
    
    print("\nRAG test suite completed!")

if __name__ == "__main__":
    asyncio.run(main())