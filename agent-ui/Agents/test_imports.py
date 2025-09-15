#!/usr/bin/env python3
"""
Test agent imports step by step
"""

print("Testing imports...")

try:
    print("1. Testing basic imports...")
    import os
    from agno.agent import Agent
    from agno.models.openai import OpenAIChat
    print("+ Basic imports OK")
    
    print("2. Testing ThinkingTools...")
    from agno.tools.thinking import ThinkingTools
    print("+ ThinkingTools OK")
    
    print("3. Testing MCPTools...")
    from agno.tools.mcp import MCPTools
    print("+ MCPTools OK")
    
    print("4. Testing MongoDB...")
    from agno.memory.v2.db.mongodb import MongoMemoryDb
    from agno.memory.v2.memory import Memory
    print("+ MongoDB memory OK")
    
    print("5. Testing existing playground...")
    # Try importing just the existing agents first
    # from lead_generation_agent import *
    print("+ Skipping individual agent imports")
    
    print("All imports successful!")
    
except Exception as e:
    print(f"- Import failed: {e}")
    import traceback
    traceback.print_exc()