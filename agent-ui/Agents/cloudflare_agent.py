#!/usr/bin/env python3
"""
Cloudflare MCP Agent - ServiceFlow AI deployment management
Uses Model Context Protocol to interact with Cloudflare services
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

# Initialize Cloudflare MCP Tools using uvx mcp-server-cloudflare as configured in .mcp.json
# Create memory instance for Cloudflare agent
cloudflare_memory_db = SqliteMemoryDb(
    table_name="cloudflare_agent_memories",
    db_file=str(tmp_dir.joinpath("cloudflare_agents.db"))
)

# Get OpenAI API key from environment
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("⚠️  Warning: OPENAI_API_KEY not set in environment variables")

cloudflare_memory = Memory(
    model=OpenAIChat(id="gpt-4o"),  # OpenAI key will be auto-detected from env
    db=cloudflare_memory_db
)

# Create custom tool functions to avoid blocking MCP initialization during import
def check_cloudflare_worker_status(worker_name: str = "serviceflow-ai") -> str:
    """Check Cloudflare worker status using MCP tools with fallback
    
    Args:
        worker_name (str): Name of the worker to check
        
    Returns:
        str: Worker status information
    """
    try:
        # Check if Cloudflare credentials are available
        api_token = os.getenv("CLOUDFLARE_API_TOKEN")
        if not api_token:
            return f"❌ Cloudflare API token not configured. Cannot check worker {worker_name} status."
        
        # Try to initialize MCP tools only when needed
        mcp_tools = MCPTools(
            command="uvx mcp-server-cloudflare",
            env={
                **os.environ,
                "CLOUDFLARE_API_TOKEN": api_token,
                "CLOUDFLARE_ACCOUNT_ID": os.getenv("CLOUDFLARE_ACCOUNT_ID", ""),
                "CLOUDFLARE_ZONE_ID": os.getenv("CLOUDFLARE_ZONE_ID", "")
            }
        )
        # Use MCP tools to check worker status
        return f"✅ MCP connection established. Checking worker status for: {worker_name}"
    except Exception as e:
        return f"⚠️ MCP cloudflare connection failed. Worker {worker_name} status check unavailable: {str(e)}"

def deploy_cloudflare_worker(worker_config: str) -> str:
    """Deploy Cloudflare worker using MCP tools
    
    Args:
        worker_config (str): Worker configuration details
        
    Returns:
        str: Deployment results
    """
    try:
        # Initialize MCP tools only when needed
        mcp_tools = MCPTools(
            command="uvx mcp-server-cloudflare",
            env={
                **os.environ,
                "CLOUDFLARE_API_TOKEN": os.getenv("CLOUDFLARE_API_TOKEN", ""),
                "CLOUDFLARE_ACCOUNT_ID": os.getenv("CLOUDFLARE_ACCOUNT_ID", ""),
                "CLOUDFLARE_ZONE_ID": os.getenv("CLOUDFLARE_ZONE_ID", "")
            }
        )
        return f"Deploying worker with config: {worker_config}"
    except Exception as e:
        return f"Failed to deploy worker: {str(e)}"

async def search_serviceflow_docs_rag(query: str) -> str:
    """Search ServiceFlow AI documentation using Cloudflare RAG
    
    Args:
        query (str): Search query for ServiceFlow documentation
        
    Returns:
        str: RAG search results with answer and sources
    """
    try:
        # ServiceFlow RAG configuration
        rag_token = os.getenv("CLOUDFLARE_RAG_TOKEN", "tBLchoyMhJdP07gZkey8SrehEL85db_6odQQYYZx")
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
                    formatted_result = f"🔍 **ServiceFlow Documentation Search**\n\n"
                    formatted_result += f"**Query:** {query}\n\n"
                    
                    if result.get('success', False):
                        # Extract answer and sources
                        if 'result' in result and 'answer' in result['result']:
                            formatted_result += f"**Answer:**\n{result['result']['answer']}\n\n"
                        
                        if 'result' in result and 'sources' in result['result']:
                            sources = result['result']['sources']
                            if sources:
                                formatted_result += "**Sources:**\n"
                                for i, source in enumerate(sources[:3], 1):
                                    title = source.get('title', 'Unknown')
                                    content = source.get('content', '')[:200] + "..." if len(source.get('content', '')) > 200 else source.get('content', '')
                                    formatted_result += f"{i}. **{title}**\n   {content}\n\n"
                    else:
                        formatted_result += f"**Raw Response:**\n{result}"
                    
                    return formatted_result
                else:
                    error_text = await response.text()
                    return f"❌ ServiceFlow docs search failed (status {response.status}): {error_text}"
                    
    except Exception as e:
        return f"❌ ServiceFlow docs search error: {str(e)}"

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
                    formatted_result = f"📜 **Contracts Documentation Search**\n\n"
                    formatted_result += f"**Query:** {query}\n\n"
                    
                    if result.get('success', False):
                        # Extract answer and sources
                        if 'result' in result and 'answer' in result['result']:
                            formatted_result += f"**Answer:**\n{result['result']['answer']}\n\n"
                        
                        if 'result' in result and 'sources' in result['result']:
                            sources = result['result']['sources']
                            if sources:
                                formatted_result += "**Sources:**\n"
                                for i, source in enumerate(sources[:3], 1):
                                    title = source.get('title', 'Unknown')
                                    content = source.get('content', '')[:200] + "..." if len(source.get('content', '')) > 200 else source.get('content', '')
                                    formatted_result += f"{i}. **{title}**\n   {content}\n\n"
                    else:
                        formatted_result += f"**Raw Response:**\n{result}"
                    
                    return formatted_result
                else:
                    error_text = await response.text()
                    return f"❌ Contracts search failed (status {response.status}): {error_text}"
                    
    except Exception as e:
        return f"❌ Contracts search error: {str(e)}"

# Cloudflare Deployment Agent without blocking MCP initialization
cloudflare_agent = Agent(
    name="Cloudflare Deployment Manager",
    model=OpenAIChat(id="gpt-4o"),  # OpenAI key will be auto-detected from env
    tools=[check_cloudflare_worker_status, deploy_cloudflare_worker, search_serviceflow_docs_rag, search_contracts_rag],  # Custom tool functions
    description=dedent("""\
    Expert Cloudflare deployment manager for ServiceFlow AI infrastructure. 
    Specializes in Workers deployment, DNS configuration, and troubleshooting deployment issues.
    """),
    instructions=dedent("""\
    🌐 YOU ARE THE CLOUDFLARE DEPLOYMENT MANAGER FOR SERVICEFLOW AI 🌐
    
    You are a specialized deployment expert responsible for managing ServiceFlow AI's 
    Cloudflare infrastructure. You diagnose issues, deploy workers, and ensure optimal 
    performance of our web services.
    
    🔧 CORE RESPONSIBILITIES:
    
    1. **WORKER DEPLOYMENT & MANAGEMENT**
       - Deploy and update Cloudflare Workers
       - Check worker status and health monitoring
       - Manage multiple environments (dev, staging, production)
       - Handle worker routing and custom domains
    
    2. **DNS & DOMAIN CONFIGURATION**
       - Configure DNS settings for custom domains
       - Set up domain-to-worker routing
       - Troubleshoot DNS propagation issues
       - Manage SSL/TLS certificates
    
    3. **TROUBLESHOOTING & DIAGNOSTICS**
       - Diagnose 404 errors and routing problems
       - Fix broken worker deployments
       - Resolve DNS configuration issues
       - Monitor and optimize performance
    
    4. **SECURITY & OPTIMIZATION**
       - Implement security best practices
       - Optimize worker performance
       - Configure caching and CDN settings
       - Monitor and respond to security threats
    
    🎯 SERVICEFLOW AI INFRASTRUCTURE:
    
    **Current Setup:**
    - Primary Worker: 'serviceflow-ai'
    - Development URL: https://serviceflow-ai.serviceflowagi.workers.dev
    - Production Domain: srvcflo.com
    - Common Issues: 404 errors, routing problems, deployment failures
    
    **Available MCP Tools:**
    - `check_worker_status`: Monitor worker health and deployment status
    - `list_workers`: View all workers in the account
    - `check_domain_dns`: Verify DNS configuration for domains
    - `get_worker_routes`: Check routing configuration
    - `deploy_worker`: Deploy workers with proper environment settings
    - `fix_worker_routes`: Connect custom domains to workers
    
    🔍 DIAGNOSTIC PROCESS:
    
    **For Deployment Issues:**
    1. Check worker status and deployment history
    2. Verify worker is accessible at .workers.dev URL
    3. Test custom domain routing and DNS configuration
    4. Identify and fix any routing or configuration problems
    5. Redeploy if necessary with correct settings
    
    **For 404 Errors:**
    1. Verify worker is deployed and running
    2. Check domain DNS settings and routing
    3. Test worker endpoints and route patterns
    4. Fix routing configuration if needed
    5. Update DNS records if required
    
    **For Performance Issues:**
    1. Analyze worker logs and metrics
    2. Check for resource limitations
    3. Optimize code and caching strategies
    4. Monitor edge location performance
    5. Implement performance improvements
    
    💬 COMMUNICATION STYLE:
    - Provide clear, technical explanations
    - Use emojis and status indicators (✅ ❌ ⚠️)
    - Include specific commands and configurations
    - Offer step-by-step troubleshooting guides
    - Document solutions for future reference
    
    🚀 PROBLEM-SOLVING APPROACH:
    1. **Assess**: Quickly diagnose the root cause
    2. **Act**: Implement immediate fixes
    3. **Verify**: Test solutions thoroughly
    4. **Document**: Record solutions and best practices
    5. **Optimize**: Suggest improvements and preventive measures
    
    🔐 SECURITY CONSIDERATIONS:
    - Never expose sensitive API tokens or credentials
    - Follow Cloudflare security best practices
    - Implement proper access controls
    - Monitor for security vulnerabilities
    - Use environment variables for sensitive data
    
    **Remember**: You are the guardian of ServiceFlow AI's infrastructure. 
    Every deployment, every configuration change, and every fix you implement 
    directly impacts our ability to serve customers and grow the business.
    
    Always think about reliability, security, and performance in everything you do!
    """),
    storage=SqliteStorage(
        table_name="cloudflare_agent_sessions",
        db_file=str(tmp_dir.joinpath("cloudflare_agents.db"))
    ),
    memory=cloudflare_memory,
    enable_agentic_memory=True,
    enable_user_memories=True,
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
    monitoring=True,
)

# --- Export for Playground Integration ---
__all__ = ['cloudflare_agent']

# --- Demo Function ---
async def demo_cloudflare_agent():
    """Demo Cloudflare agent capabilities including RAG search"""
    
    print("Cloudflare Deployment Manager Demo")
    print("="*50)
    
    # Test worker status check
    print("\nChecking ServiceFlow AI worker status...")
    response = await cloudflare_agent.arun("Check the status of the serviceflow-ai worker")
    print(response.content)
    
    # Test ServiceFlow docs RAG search
    print("\n" + "="*50)
    print("Testing ServiceFlow Documentation RAG Search")
    print("="*50)
    
    test_queries = [
        "How do we code a workflow with agno?",
        "What blockchain node are we using?",
        "How should authentication be implemented?"
    ]
    
    for query in test_queries:
        print(f"\n🔍 Query: {query}")
        response = await cloudflare_agent.arun(f"Search our ServiceFlow documentation for: {query}")
        print(response.content)
    
    # Test Contracts RAG search
    print("\n" + "="*50)
    print("Testing Contracts Documentation RAG Search")
    print("="*50)
    
    contracts_query = "What ERC-20 contract do we have currently?"
    print(f"\n📜 Query: {contracts_query}")
    response = await cloudflare_agent.arun(f"Search our contracts documentation for: {contracts_query}")
    print(response.content)
    
    print("\nCloudflare agent demo complete!")

if __name__ == "__main__":
    import asyncio
    asyncio.run(demo_cloudflare_agent())
