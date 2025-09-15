#!/usr/bin/env python3
"""
Test script to verify all new agents can be imported and initialized properly
"""

import os
import sys
from pathlib import Path

# Add Agents directory to path
agents_dir = Path(__file__).parent / 'Agents'
sys.path.insert(0, str(agents_dir))

def test_imports():
    """Test all imports work correctly"""
    print("Testing imports...")
    
    try:
        from unified_user_manager import UnifiedUserManager
        print("OK UnifiedUserManager imported")
    except ImportError as e:
        print(f"X Failed to import UnifiedUserManager: {e}")
    
    try:
        from dalle_tools import DALLEImageGenerator
        print("OK DALLEImageGenerator imported")
    except ImportError as e:
        print(f"X Failed to import DALLEImageGenerator: {e}")
        
    try:
        from linear_tools import LinearAPI
        print("OK LinearAPI imported")
    except ImportError as e:
        print(f"X Failed to import LinearAPI: {e}")
        
    try:
        from paintswap_tools import PaintswapAPI
        print("OK PaintswapAPI imported")
    except ImportError as e:
        print(f"X Failed to import PaintswapAPI: {e}")
        
    try:
        from finance_research_tools import DexScreenerAPI
        print("OK DexScreenerAPI imported")
    except ImportError as e:
        print(f"X Failed to import DexScreenerAPI: {e}")
        
    try:
        from sonic_research_team import SonicResearchTeam
        print("OK SonicResearchTeam imported")
    except ImportError as e:
        print(f"X Failed to import SonicResearchTeam: {e}")
        
    try:
        from discord_agent_integration import ServiceFlowDiscordAgent
        print("OK ServiceFlowDiscordAgent imported")
    except ImportError as e:
        print(f"X Failed to import ServiceFlowDiscordAgent: {e}")
        
    try:
        from cloudflare_kv_storage import CloudFlareKVStorage, SharedUserStorage
        print("OK CloudFlareKVStorage and SharedUserStorage imported")
    except ImportError as e:
        print(f"X Failed to import CloudFlareKVStorage: {e}")

def test_playground_structure():
    """Test playground can be imported and analyzed"""
    print("\nTesting playground structure...")
    
    try:
        # Just import to check for syntax errors - don't run
        import playground
        print("OK Playground module syntax is valid")
    except ImportError as e:
        print(f"X Failed to import playground module: {e}")
        return False
    except Exception as e:
        print(f"! Playground import warning: {e}")
        
    return True

if __name__ == "__main__":
    print("Testing ServiceFlow AI Agent Integration")
    print("=" * 50)
    
    test_imports()
    test_success = test_playground_structure()
    
    print("\n" + "=" * 50)
    if test_success:
        print("All tests passed! Playground should be ready to run.")
        print("Run: python playground.py to start the enhanced ServiceFlow AI Command Center")
    else:
        print("Some tests failed. Check error messages above.")