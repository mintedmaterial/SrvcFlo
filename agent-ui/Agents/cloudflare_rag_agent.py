#!/usr/bin/env python3
"""
Cloudflare RAG Agent - ServiceFlow AI with documentation search capabilities
Uses Model Context Protocol and direct RAG search for comprehensive support
"""

import os
import sys
import asyncio
import aiohttp
from pathlib import Path
from dotenv import load_dotenv
from textwrap import dedent

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.mcp import MCPTools
from agno.storage.sqlite import SqliteStorage
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.sqlite import SqliteMemoryDb

# Load environment variables from both agent-ui and myserviceprovider-app directories
agent_ui_dotenv = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
myservice_dotenv = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'myserviceprovider-app', '.env.local')
main_dotenv = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')

# Load all environment files
load_dotenv(dotenv_path=agent_ui_dotenv)
load_dotenv(dotenv_path=myservice_dotenv) 
load_dotenv(dotenv_path=main_dotenv)

# Setup paths
cwd = Path(__file__).parent
tmp_dir = cwd.joinpath("tmp")
tmp_dir.mkdir(parents=True, exist_ok=True)

# Create memory instance for Cloudflare RAG agent
cloudflare_rag_memory_db = SqliteMemoryDb(
    table_name="cloudflare_rag_agent_memories",
    db_file=str(tmp_dir.joinpath("cloudflare_rag_agents.db"))
)

# Get OpenAI API key from environment
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("Warning: OPENAI_API_KEY not set in environment variables")

cloudflare_rag_memory = Memory(
    model=OpenAIChat(id="gpt-4o"),  # OpenAI key will be auto-detected from env
    db=cloudflare_rag_memory_db
)

# RAG Search Functions
async def search_serviceflow_docs_rag(query: str) -> str:
    """Search ServiceFlow AI documentation using Cloudflare RAG
    
    Args:
        query (str): Search query for ServiceFlow documentation
        
    Returns:
        str: RAG search results with answer and sources
    """
    try:
        # ServiceFlow RAG configuration
        rag_token = os.getenv("CLOUDFLARE_RAG_TOKEN"), 
        account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID", "ff3c5e2beaea9f85fee3200bfe28da16")
        rag_id = "serviceflow-docs-rag"
        
        url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/autorag/rags/{rag_id}/ai-search"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {rag_token}"
        }
        
        payload = {"query": query}
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    
                    # Format the response
                    formatted_result = f"ServiceFlow Documentation Search Results\n\n"
                    formatted_result += f"Query: {query}\n\n"
                    
                    if result.get('success', False):
                        # Extract answer and sources
                        if 'result' in result and 'answer' in result['result']:
                            formatted_result += f"Answer:\n{result['result']['answer']}\n\n"
                        
                        if 'result' in result and 'sources' in result['result']:
                            sources = result['result']['sources']
                            if sources:
                                formatted_result += "Sources:\n"
                                for i, source in enumerate(sources[:3], 1):
                                    title = source.get('title', 'Unknown')
                                    content = source.get('content', '')[:200] + "..." if len(source.get('content', '')) > 200 else source.get('content', '')
                                    formatted_result += f"{i}. {title}\n   {content}\n\n"
                    else:
                        formatted_result += f"Raw Response:\n{result}"
                    
                    return formatted_result
                else:
                    error_text = await response.text()
                    return f"ServiceFlow docs search failed (status {response.status}): {error_text}"
                    
    except Exception as e:
        return f"ServiceFlow docs search error: {str(e)}"

async def search_contracts_rag(query: str) -> str:
    """Search Contracts documentation using Cloudflare RAG
    
    Args:
        query (str): Search query for contract information
        
    Returns:
        str: RAG search results with answer and sources
    """
    try:
        # Contracts RAG configuration
        rag_token = os.getenv("CLOUDFLARE_RAG_TOKEN", "tBLchoyMhJdP07gZkey8SrehEL85db_6odQQYYZx")
        account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID", "ff3c5e2beaea9f85fee3200bfe28da16")
        rag_id = "contractsrag"
        
        url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/autorag/rags/{rag_id}/ai-search"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {rag_token}"
        }
        
        payload = {"query": query}
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    
                    # Format the response
                    formatted_result = f"Contracts Documentation Search Results\n\n"
                    formatted_result += f"Query: {query}\n\n"
                    
                    if result.get('success', False):
                        # Extract answer and sources
                        if 'result' in result and 'answer' in result['result']:
                            formatted_result += f"Answer:\n{result['result']['answer']}\n\n"
                        
                        if 'result' in result and 'sources' in result['result']:
                            sources = result['result']['sources']
                            if sources:
                                formatted_result += "Sources:\n"
                                for i, source in enumerate(sources[:3], 1):
                                    title = source.get('title', 'Unknown')
                                    content = source.get('content', '')[:200] + "..." if len(source.get('content', '')) > 200 else source.get('content', '')
                                    formatted_result += f"{i}. {title}\n   {content}\n\n"
                    else:
                        formatted_result += f"Raw Response:\n{result}"
                    
                    return formatted_result
                else:
                    error_text = await response.text()
                    return f"Contracts search failed (status {response.status}): {error_text}"
                    
    except Exception as e:
        return f"Contracts search error: {str(e)}"

async def run_cloudflare_rag_agent():
    """Run Cloudflare RAG agent with proper MCP integration following Agno patterns"""
    
    print("Cloudflare RAG Agent - ServiceFlow AI")
    print("="*50)
    
    # Check environment variables
    rag_token = os.getenv("CLOUDFLARE_RAG_TOKEN")
    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
    
    print(f"RAG Token: {rag_token[:20]}..." if rag_token else "RAG Token: NOT SET")
    print(f"Account ID: {account_id}" if account_id else "Account ID: NOT SET")
    
    if not rag_token or not account_id:
        print("\nERROR: Missing required environment variables!")
        return
    
    # Path to the cloudflare MCP server
    mcp_server_path = str(Path(__file__).parent.parent.parent / "myserviceprovider-app" / "Agents" / "cloudflare_mcp" / "server.py")
    
    try:
        # Use proper MCP integration following Agno patterns
        async with MCPTools(
            command=f"python {mcp_server_path}",
            env={
                **os.environ,
                "CLOUDFLARE_RAG_TOKEN": rag_token,
                "CLOUDFLARE_ACCOUNT_ID": account_id,
            }
        ) as mcp_tools:
            
            # Create Cloudflare RAG Agent with MCP tools and direct RAG functions
            agent = Agent(
                name="Cloudflare RAG Manager",
                model=OpenAIChat(id="gpt-4o"),
                tools=[mcp_tools, search_serviceflow_docs_rag, search_contracts_rag],
                description=dedent("""\
                Expert Cloudflare deployment manager with comprehensive ServiceFlow documentation search. 
                Specializes in Workers deployment, DNS configuration, troubleshooting, and accessing 
                ServiceFlow documentation through RAG search capabilities.
                """),
                instructions=dedent("""\
                🌐 YOU ARE THE CLOUDFLARE RAG MANAGER FOR SERVICEFLOW AI 🌐
                
                You are a specialized deployment expert with advanced documentation search capabilities. 
                You manage ServiceFlow AI's Cloudflare infrastructure and provide contextual help through 
                comprehensive documentation search.
                
                🔧 CORE RESPONSIBILITIES:
                
                1. **CLOUDFLARE DEPLOYMENT & MANAGEMENT**
                   - Deploy and update Cloudflare Workers
                   - Check worker status and health monitoring  
                   - Manage multiple environments (dev, staging, production)
                   - Handle worker routing and custom domains
                
                2. **DOCUMENTATION SEARCH & ASSISTANCE**
                   - Search ServiceFlow documentation using RAG for contextual help
                   - Search contract documentation for blockchain-related questions
                   - Provide specific examples and implementation guidance
                   - Reference relevant documentation sections in responses
                
                3. **TROUBLESHOOTING & DIAGNOSTICS**
                   - Diagnose deployment issues using documentation context
                   - Fix broken worker deployments with documented solutions
                   - Resolve DNS configuration issues
                   - Monitor and optimize performance
                
                🔍 AVAILABLE SEARCH TOOLS:
                - `search_serviceflow_docs_rag`: Search ServiceFlow documentation for implementation guidance
                - `search_contracts_rag`: Search contract documentation for blockchain/smart contract questions
                
                🚀 PROBLEM-SOLVING APPROACH:
                1. **Search Documentation**: Use RAG search to find relevant context and solutions
                2. **Assess**: Quickly diagnose the root cause using documentation insights
                3. **Act**: Implement fixes based on documented best practices
                4. **Verify**: Test solutions thoroughly
                5. **Document**: Reference the documentation sources used
                
                Always use documentation search when:
                - User asks implementation questions ("How do we...")
                - Troubleshooting deployment issues
                - Need examples or best practices
                - Questions about blockchain/contract functionality
                
                💬 COMMUNICATION STYLE:
                - Provide clear, technical explanations
                - Reference documentation sources when available
                - Include specific commands and configurations
                - Offer step-by-step guides backed by documentation
                """),
                storage=SqliteStorage(
                    table_name="cloudflare_rag_agent_sessions",
                    db_file=str(tmp_dir.joinpath("cloudflare_rag_agents.db"))
                ),
                memory=cloudflare_rag_memory,
                enable_agentic_memory=True,
                enable_user_memories=True,
                add_datetime_to_instructions=True,
                add_history_to_messages=True,
                num_history_responses=5,
                markdown=True,
                monitoring=True,
            )
            
            # Test queries
            test_queries = [
                "How do we code a workflow with agno?",
                "What blockchain node are we using?",
                "What ERC-20 contract do we have currently?",
                "Check the status of the serviceflow-ai worker"
            ]
            
            for i, query in enumerate(test_queries, 1):
                print(f"\n{'='*60}")
                print(f"Test {i}/{len(test_queries)}: {query}")
                print("="*60)
                
                try:
                    response = await agent.arun(query)
                    print(response.content)
                except Exception as e:
                    print(f"Error processing query '{query}': {str(e)}")
                
                # Small delay between queries
                await asyncio.sleep(2)
            
            print(f"\n{'='*60}")
            print("Cloudflare RAG Agent demo complete!")
            
    except Exception as e:
        print(f"Error running Cloudflare RAG agent: {str(e)}")

# --- Export for Playground Integration ---
__all__ = ['run_cloudflare_rag_agent']

if __name__ == "__main__":
    asyncio.run(run_cloudflare_rag_agent())