#!/usr/bin/env python3
"""
Smart Contract Analysis Agent for ServiceFlow AI
Specializes in analyzing Solidity contracts and blockchain functionality
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Any

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.storage.mongodb import MongoDbStorage
from agno.storage.sqlite import SqliteStorage
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.mongodb import MongoMemoryDb
from agno.memory.v2.db.sqlite import SqliteMemoryDb

# Add parent directory to path for storage imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

# Import ChainGPT audit tool
from Tools.chaingpt_audit_tool import audit_contract_file, audit_contract_with_chaingpt

def read_contract_file(file_path: str) -> str:
    """Read a Solidity contract file
    
    Args:
        file_path (str): Path to the contract file
        
    Returns:
        str: Contract content or error message
    """
    try:
        contracts_dir = Path("C:/Users/PC/ServiceApp/myserviceprovider-app/Contracts")
        full_path = contracts_dir / file_path
        
        if not full_path.exists():
            # Try to find the file in the contracts directory
            matching_files = list(contracts_dir.glob(f"**/*{file_path}*"))
            if matching_files:
                full_path = matching_files[0]
            else:
                return f"Contract file '{file_path}' not found in {contracts_dir}"
        
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        return f"Contract: {full_path.name}\n\n{content}"
        
    except Exception as e:
        return f"Error reading contract file: {str(e)}"

def list_contract_files() -> str:
    """List all available contract files
    
    Returns:
        str: List of contract files with descriptions
    """
    try:
        contracts_dir = Path("C:/Users/PC/ServiceApp/myserviceprovider-app/Contracts")
        
        if not contracts_dir.exists():
            return f"Contracts directory not found: {contracts_dir}"
        
        contract_files = []
        for file_path in contracts_dir.glob("**/*.sol"):
            relative_path = file_path.relative_to(contracts_dir)
            
            # Try to read first few lines to get description
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()[:10]  # Read first 10 lines
                    description = ""
                    for line in lines:
                        if line.strip().startswith("//") or line.strip().startswith("*"):
                            description += line.strip().lstrip("//").lstrip("*").strip() + " "
                        elif "contract" in line and "{" in line:
                            break
                    
                    if not description:
                        description = "Solidity smart contract"
                        
                contract_files.append(f"📄 {relative_path}: {description[:100]}...")
                
            except Exception as e:
                contract_files.append(f"📄 {relative_path}: (Unable to read description)")
        
        if not contract_files:
            return "No Solidity contract files found in the contracts directory."
            
        return "📋 Available Smart Contracts:\n\n" + "\n".join(contract_files)
        
    except Exception as e:
        return f"Error listing contract files: {str(e)}"

def analyze_contract_function(contract_content: str, function_name: str) -> str:
    """Analyze a specific function in a contract
    
    Args:
        contract_content (str): The contract source code
        function_name (str): Name of the function to analyze
        
    Returns:
        str: Function analysis
    """
    try:
        lines = contract_content.split('\n')
        function_lines = []
        in_function = False
        brace_count = 0
        
        for line in lines:
            if f"function {function_name}" in line:
                in_function = True
                function_lines.append(line)
                brace_count = line.count('{') - line.count('}')
            elif in_function:
                function_lines.append(line)
                brace_count += line.count('{') - line.count('}')
                if brace_count == 0:
                    break
        
        if not function_lines:
            return f"Function '{function_name}' not found in the contract."
        
        function_code = '\n'.join(function_lines)
        
        analysis = f"🔍 Function Analysis: {function_name}\n\n"
        analysis += f"```solidity\n{function_code}\n```\n\n"
        
        # Basic analysis
        if "payable" in function_code:
            analysis += "💰 This function can receive Ether\n"
        if "public" in function_code:
            analysis += "🌐 This function is publicly accessible\n"
        if "private" in function_code:
            analysis += "🔒 This function is private to this contract\n"
        if "view" in function_code:
            analysis += "👁️ This function only reads state (view function)\n"
        if "pure" in function_code:
            analysis += "⚡ This function is pure (no state access)\n"
        if "modifier" in function_code:
            analysis += "🛡️ This function has access control modifiers\n"
        
        return analysis
        
    except Exception as e:
        return f"Error analyzing function: {str(e)}"

def explain_payment_splits() -> str:
    """Explain the ServiceFlow AI payment split structure
    
    Returns:
        str: Payment split explanation
    """
    return """
💰 **ServiceFlow AI Payment Structure**

**Revenue Distribution (from SonicPaymentTestnet.sol):**
- 🏆 **15%** → Leaderboard rewards wallet
- 💼 **50%** → Developer/App wallet (AI costs & overhead)  
- 🎯 **25%** → BanditKidzStaking.sol (NFT holder rewards)
- 🏦 **10%** → Treasury/Reserve

**Service Pricing:**
- 🖼️ **Image Generation:** $1 USDC or $S token
- 🎬 **Video Generation:** $2 USDC or $S token

**FeeM Token Distribution:**
- 💼 **50%** → Developer wallet
- 🎯 **30%** → NFT holders (BanditKidz staking)
- 🏦 **20%** → Treasury

**Staking Rewards (BanditKidzStaking.sol):**
- NFT holders stake BanditKidz NFTs to earn rewards
- Rewards come from 25% of platform revenue
- Additional FeeM token rewards (30% of transaction fees)
- Staking provides passive income for NFT community
"""

class SmartContractAgent:
    """Smart Contract Analysis Agent for ServiceFlow AI contracts"""
    
    def __init__(self, storage=None, memory=None):
        self.storage = storage
        self.memory = memory
        
        # Create agent with contract analysis tools
        self.agent = Agent(
            name="Smart Contract Analyst",
            model=OpenAIChat(id="gpt-4o"),
            tools=[
                DuckDuckGoTools(),
                read_contract_file,
                list_contract_files,
                analyze_contract_function,
                explain_payment_splits,
                audit_contract_file
            ],
            instructions=[
                "You are a specialized Smart Contract Analysis Agent for ServiceFlow AI blockchain contracts.",
                "You have expert knowledge of Solidity, EVM, and smart contract security.",
                "",
                "🔧 CORE CAPABILITIES:",
                "- Analyze ServiceFlow AI smart contracts (SonicPaymentTestnet.sol, BanditKidzStaking.sol, etc.)",
                "- Explain contract functions, state variables, and interactions",
                "- Detail payment splits and tokenomics (15% leaderboard, 50% dev, 25% staking)",
                "- Provide security analysis and best practice recommendations",
                "- Generate new contract code using OpenZeppelin standards",
                "- Perform professional security audits using ChainGPT AI auditor",
                "",
                "📋 SERVICEFLOW CONTRACTS:",
                "- **SonicPaymentTestnet.sol**: Handles payment processing and revenue distribution",
                "- **BanditKidzStaking.sol**: NFT staking contract for BanditKidz holders",
                "- Revenue splits: 15% leaderboard, 50% dev wallet, 25% NFT staking, 10% treasury",
                "",
                "🔍 ANALYSIS APPROACH:",
                "1. Use list_contract_files() to see available contracts",
                "2. Use read_contract_file() to examine specific contracts",
                "3. Use analyze_contract_function() for detailed function analysis",
                "4. Use explain_payment_splits() for tokenomics questions",
                "5. Use audit_contract_file() for professional ChainGPT security audits",
                "6. Provide security recommendations and best practices",
                "",
                "💡 RESPONSE STYLE:",
                "- Explain complex concepts in accessible terms",
                "- Include code snippets with syntax highlighting",
                "- Provide security considerations for each analysis",
                "- Reference official Solidity documentation when helpful",
                "- Always consider gas optimization opportunities",
                "",
                "🎯 SPECIALIZATION:",
                "- ServiceFlow AI platform contracts and tokenomics",
                "- Sonic blockchain ecosystem integration",
                "- NFT staking mechanisms and reward distribution",
                "- Payment processing and revenue splitting",
                "- ERC standards (ERC-20, ERC-721, ERC-1155)"
            ],
            storage=self.storage,
            memory=self.memory,
            enable_agentic_memory=True,
            enable_user_memories=True,
            add_datetime_to_instructions=True,
            add_history_to_messages=True,
            num_history_responses=5,
            markdown=True,
            monitoring=True
        )
    
    def run(self, message: str, user_id: str = None):
        """Run the smart contract analysis agent"""
        return self.agent.run(message, user_id=user_id)
    
    async def arun(self, message: str, user_id: str = None):
        """Run the smart contract analysis agent asynchronously"""
        return await self.agent.arun(message, user_id=user_id)

def create_smart_contract_agent(mongodb_uri: str = None, db_name: str = "myserviceprovider") -> SmartContractAgent:
    """Factory function to create a smart contract agent with storage"""
    
    # Try MongoDB storage first, fallback to SQLite
    storage = None
    memory = None
    
    if mongodb_uri:
        try:
            storage = MongoDbStorage(
                collection_name="smart_contract_agent",
                db_url=mongodb_uri,
                db_name=db_name
            )
            
            memory_db = MongoMemoryDb(
                collection_name="smart_contract_agent_memories",
                db_url=mongodb_uri,
                db_name=db_name
            )
            
            memory = Memory(
                model=OpenAIChat(id="gpt-4o"),
                db=memory_db
            )
            
        except Exception as e:
            print(f"Warning: MongoDB storage failed for smart contract agent, using SQLite: {e}")
    
    # Fallback to SQLite
    if not storage:
        tmp_dir = Path(__file__).parent.parent / "tmp"
        tmp_dir.mkdir(parents=True, exist_ok=True)
        
        storage = SqliteStorage(
            table_name="smart_contract_agent",
            db_file=str(tmp_dir / "agents.db")
        )
        
        memory_db = SqliteMemoryDb(
            table_name="smart_contract_agent_memories",
            db_file=str(tmp_dir / "agents.db")
        )
        
        memory = Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=memory_db
        )
    
    return SmartContractAgent(storage=storage, memory=memory)

# Export for playground integration
__all__ = ['SmartContractAgent', 'create_smart_contract_agent', 'read_contract_file', 'list_contract_files', 'analyze_contract_function', 'explain_payment_splits']

if __name__ == "__main__":
    # Test the smart contract agent
    mongodb_uri = os.getenv("MONGODB_URL", "")
    agent = create_smart_contract_agent(mongodb_uri)
    
    print("🔗 Smart Contract Analysis Agent Ready!")
    print("Available commands:")
    print("- 'list contracts' - Show available contract files")
    print("- 'read SonicPaymentTestnet.sol' - Read a specific contract")
    print("- 'explain payment splits' - Show revenue distribution")
    print("- 'analyze function withdraw' - Analyze a specific function")
    
    # Interactive mode
    while True:
        try:
            user_input = input("\n💬 Enter your question (or 'quit' to exit): ")
            if user_input.lower() in ['quit', 'exit', 'q']:
                break
                
            response = agent.run(user_input)
            print(f"\n🤖 {response.content if hasattr(response, 'content') else str(response)}")
            
        except KeyboardInterrupt:
            print("\n👋 Smart Contract Agent terminated.")
            break
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")