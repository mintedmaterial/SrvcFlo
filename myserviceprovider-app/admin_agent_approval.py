"""
ServiceFlow AI Admin Agent Approval Script
Use this script to review and approve agents from the Agents-pending directory
"""

import os
import json
import shutil
from pathlib import Path

# Directories
PENDING_DIR = Path("./Agents-pending")
APPROVED_DIR = Path("./Agents")
REJECTED_DIR = Path("./Agents-rejected")

def list_pending_agents():
    """List all agents pending approval"""
    if not PENDING_DIR.exists():
        print("No Agents-pending directory found.")
        return []
    
    agents = []
    for file in PENDING_DIR.glob("*_agent.py"):
        config_file = PENDING_DIR / f"{file.stem.replace('_agent', '')}_config.json"
        agents.append({
            'python_file': file,
            'config_file': config_file if config_file.exists() else None,
            'name': file.stem.replace('_agent', '').replace('_', ' ').title()
        })
    
    return agents

def show_agent_details(agent):
    """Show detailed information about an agent"""
    print(f"\n{'='*60}")
    print(f"AGENT: {agent['name']}")
    print(f"{'='*60}")
    
    # Show Python file header
    with open(agent['python_file'], 'r') as f:
        content = f.read()
        if content.startswith('"""'):
            # Extract the docstring
            end_idx = content.find('"""', 3)
            if end_idx != -1:
                header = content[3:end_idx]
                print("METADATA:")
                print(header)
    
    # Show config if available
    if agent['config_file'] and agent['config_file'].exists():
        with open(agent['config_file'], 'r') as f:
            config = json.load(f)
            print(f"\nCONFIGURATION:")
            print(f"Model: {config.get('model', 'Unknown')}")
            print(f"Tools: {', '.join(config.get('tools', []))}")
            print(f"Description: {config.get('description', 'No description')}")
    
    print(f"\nFILE LOCATION: {agent['python_file']}")
    print(f"{'='*60}")

def approve_agent(agent):
    """Approve an agent and move it to the main Agents directory"""
    APPROVED_DIR.mkdir(exist_ok=True)
    
    # Move Python file
    new_python_path = APPROVED_DIR / agent['python_file'].name
    shutil.move(str(agent['python_file']), str(new_python_path))
    
    # Move config file if it exists
    if agent['config_file'] and agent['config_file'].exists():
        new_config_path = APPROVED_DIR / agent['config_file'].name
        shutil.move(str(agent['config_file']), str(new_config_path))
        
        # Update status in config
        with open(new_config_path, 'r') as f:
            config = json.load(f)
        config['metadata']['status'] = 'APPROVED'
        with open(new_config_path, 'w') as f:
            json.dump(config, f, indent=2)
    
    print(f"✅ Agent '{agent['name']}' has been APPROVED and moved to {new_python_path}")

def reject_agent(agent, reason=""):
    """Reject an agent and move it to rejected directory"""
    REJECTED_DIR.mkdir(exist_ok=True)
    
    # Move Python file
    new_python_path = REJECTED_DIR / agent['python_file'].name
    shutil.move(str(agent['python_file']), str(new_python_path))
    
    # Move config file if it exists
    if agent['config_file'] and agent['config_file'].exists():
        new_config_path = REJECTED_DIR / agent['config_file'].name
        shutil.move(str(agent['config_file']), str(new_config_path))
        
        # Update status in config
        with open(new_config_path, 'r') as f:
            config = json.load(f)
        config['metadata']['status'] = 'REJECTED'
        config['metadata']['rejection_reason'] = reason
        with open(new_config_path, 'w') as f:
            json.dump(config, f, indent=2)
    
    print(f"❌ Agent '{agent['name']}' has been REJECTED and moved to {new_python_path}")
    if reason:
        print(f"Reason: {reason}")

def main():
    """Main approval workflow"""
    print("🤖 ServiceFlow AI Agent Approval System")
    print("=" * 40)
    
    pending_agents = list_pending_agents()
    
    if not pending_agents:
        print("No agents pending approval.")
        return
    
    print(f"Found {len(pending_agents)} agents pending approval:\n")
    
    for i, agent in enumerate(pending_agents, 1):
        print(f"{i}. {agent['name']}")
    
    print("\nCommands:")
    print("- Enter number to review agent")
    print("- 'q' to quit")
    print("- 'all' to see all agents at once")
    
    while True:
        try:
            choice = input("\n> ").strip().lower()
            
            if choice == 'q':
                break
            elif choice == 'all':
                for agent in pending_agents:
                    show_agent_details(agent)
            elif choice.isdigit():
                idx = int(choice) - 1
                if 0 <= idx < len(pending_agents):
                    agent = pending_agents[idx]
                    show_agent_details(agent)
                    
                    action = input("\nAction? (a)pprove, (r)eject, (s)kip: ").strip().lower()
                    
                    if action == 'a':
                        approve_agent(agent)
                        pending_agents.pop(idx)
                        if not pending_agents:
                            print("All agents have been processed!")
                            break
                    elif action == 'r':
                        reason = input("Rejection reason (optional): ").strip()
                        reject_agent(agent, reason)
                        pending_agents.pop(idx)
                        if not pending_agents:
                            print("All agents have been processed!")
                            break
                    elif action == 's':
                        print("Skipped.")
                        continue
                else:
                    print("Invalid agent number.")
            else:
                print("Invalid command.")
                
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()