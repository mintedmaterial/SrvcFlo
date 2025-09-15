#!/usr/bin/env python3
"""
Building Code Agent - Query building codes and regulations by state

Usage:
    python building_code_agent.py                    # Show available codes and run demo
    python building_code_agent.py oklahoma          # Initialize Oklahoma codes
    python building_code_agent.py query "question"  # Interactive query mode
"""

import asyncio
import sys
from data_scraper_agent import BuildingCodeManager

async def interactive_mode():
    """Interactive mode for building code queries"""
    manager = BuildingCodeManager()
    
    print("🏗️ Building Code Interactive Mode")
    print("=" * 50)
    manager.show_available_codes()
    
    current_state = None
    
    print(f"\nType 'help' for commands, 'quit' to exit")
    
    while True:
        try:
            user_input = input(f"\n[{current_state or 'no state'}] Building Code Query: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("Goodbye! 👋")
                break
            
            if user_input.lower() == 'help':
                print("\n📖 Available Commands:")
                print("  help                    - Show this help")
                print("  states                  - Show available states")
                print("  state <state_name>      - Switch to a state (e.g., 'state oklahoma')")
                print("  codes                   - Show available code types for current state")
                print("  <question>              - Ask a building code question")
                print("  quit                    - Exit")
                continue
            
            if user_input.lower() == 'states':
                manager.show_available_codes()
                continue
            
            if user_input.lower().startswith('state '):
                state_name = user_input[6:].strip().lower()
                if state_name in manager.get_available_states():
                    success = await manager.initialize_state(state_name)
                    if success:
                        current_state = state_name
                        print(f"✅ Switched to {state_name.capitalize()} building codes")
                    else:
                        print(f"❌ Failed to initialize {state_name} building codes")
                else:
                    print(f"❌ State '{state_name}' not available")
                    print(f"Available states: {', '.join(manager.get_available_states())}")
                continue
            
            if user_input.lower() == 'codes':
                if current_state:
                    code_types = manager.get_code_types(current_state)
                    print(f"\n📋 {current_state.capitalize()} Building Code Types:")
                    for code_type, description in code_types.items():
                        print(f"  • {description}")
                else:
                    print("❌ No state selected. Use 'state <state_name>' first.")
                continue
            
            # Building code question
            if not current_state:
                print("❌ Please select a state first using 'state <state_name>'")
                print(f"Available states: {', '.join(manager.get_available_states())}")
                continue
            
            print(f"\n🔍 Searching {current_state.capitalize()} building codes...")
            print("-" * 60)
            await manager.query_building_code(user_input)
            
        except KeyboardInterrupt:
            print("\n\nGoodbye! 👋")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

async def main():
    """Main function"""
    if len(sys.argv) == 1:
        # Show available codes and run demo
        print("=== Building Code Agent ===")
        manager = BuildingCodeManager()
        manager.show_available_codes()
        
        print(f"\n🎯 Usage Examples:")
        print(f"  python {sys.argv[0]} interactive    # Interactive mode")
        print(f"  python {sys.argv[0]} oklahoma       # Initialize Oklahoma codes")
        print(f"  python {sys.argv[0]} demo           # Run demo queries")
        
        # Ask if user wants to run demo
        response = input("\nWould you like to run the demo? (y/n): ").strip().lower()
        if response in ['y', 'yes']:
            print("\n" + "="*60)
            await manager.initialize_state("oklahoma")
            
            demo_questions = [
                "What are the minimum ceiling height requirements for residential buildings?",
                "What are the electrical code requirements for new construction?"
            ]
            
            for i, question in enumerate(demo_questions, 1):
                print(f"\n🏗️ Demo Question {i}: {question}")
                print("-" * 60)
                await manager.query_building_code(question)
    
    elif len(sys.argv) == 2:
        command = sys.argv[1].lower()
        
        if command == "interactive":
            await interactive_mode()
        
        elif command == "demo":
            from data_scraper_agent import demo_building_codes
            await demo_building_codes()
        
        elif command in ["oklahoma"]:  # Add more states here as they become available
            manager = BuildingCodeManager()
            success = await manager.initialize_state(command)
            if success:
                print(f"✅ {command.capitalize()} building codes loaded successfully!")
                print("You can now query building codes for this state.")
                
                # Enter interactive mode for this state
                await interactive_mode()
        
        else:
            print(f"❌ Unknown command or state: {command}")
            print(f"Available states: oklahoma")
            print(f"Available commands: interactive, demo")
    
    else:
        print("❌ Invalid arguments")
        print(f"Usage: python {sys.argv[0]} [interactive|demo|state_name]")

if __name__ == "__main__":
    asyncio.run(main())