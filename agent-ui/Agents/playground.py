#!/usr/bin/env python3
"""
ServiceFlow AI Agent-UI Playground Launcher
Launches the playground from the root directory
"""

import os
import sys
from pathlib import Path

# Add the Agents directory to the Python path
agents_dir = Path(__file__).parent / "Agents"
sys.path.insert(0, str(agents_dir))

# Change to the Agents directory
os.chdir(str(agents_dir))

# Import and run the main playground
if __name__ == "__main__":
    try:
        from playground import *
        
        # The playground module will handle the main execution
        print("🚀 Starting ServiceFlow AI Agent-UI Playground...")
        
    except ImportError as e:
        print(f"❌ Failed to import playground: {e}")
        print("Make sure all dependencies are installed in the Agents directory")
        print("Run: cd Agents && uv install")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Failed to start playground: {e}")
        sys.exit(1)