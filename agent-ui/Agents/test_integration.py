#!/usr/bin/env python3
"""
Integration Test Script for Agent-UI Enhanced Features

This script tests the integration of all new agents and tools added to the 
agent-ui system, including user management, DALLE image generation, Linear 
integration, Paintswap tools, finance research, Discord monitoring, and 
multi-agent research teams.
"""

import asyncio
import os
import sys
import json
from pathlib import Path
from datetime import datetime

# Add Agents directory to path
agents_dir = Path(__file__).parent / 'Agents'
sys.path.insert(0, str(agents_dir))

# Import test modules
try:
    from unified_user_manager import UnifiedUserManager, UserValidationError
    from dalle_tools import DALLEImageGenerator
    from linear_tools import LinearAPI
    from paintswap_tools import PaintswapAPI
    from finance_research_tools import FinanceResearchTools, DexScreenerAPI
    from discord_monitoring_tools import DiscordWebhookNotifier
    from sonic_research_team import SonicResearchTeam, start_sonic_research
    print("All modules imported successfully")
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)


class IntegrationTester:
    """Comprehensive integration tester for agent-ui enhancements"""
    
    def __init__(self):
        self.results = {}
        self.start_time = datetime.now()
        
    async def test_user_management(self):
        """Test unified user management system"""
        print("\n🔐 Testing User Management System...")
        
        try:
            user_manager = UnifiedUserManager()
            
            # Test user registration
            test_user = await user_manager.register_or_login_user(
                wallet_address="0x1234567890abcdef1234567890abcdef12345678",
                telegram_id="123456789",
                username="test_sonic_user",
                platform="backend"
            )
            
            print(f"User registered: {test_user.user_id}")
            
            # Test user validation
            is_valid, profile, errors = await user_manager.validate_user_for_agent_access(test_user.user_id)
            print(f"User validation: {is_valid}, errors: {len(errors)}")
            
            # Test activity tracking
            await user_manager.track_user_activity(test_user.user_id, "backend", "test_access")
            print("Activity tracking successful")
            
            self.results['user_management'] = True
            
        except Exception as e:
            print(f"❌ User management test failed: {e}")
            self.results['user_management'] = False
    
    async def test_dalle_tools(self):
        """Test DALLE image generation tools"""
        print("\n🎨 Testing DALLE Image Generation...")
        
        try:
            dalle_generator = DALLEImageGenerator()
            
            # Test without actual API call (dry run)
            print("DALLE tools initialized")
            print("Skipping actual image generation to avoid API costs")
            
            self.results['dalle_tools'] = True
            
        except Exception as e:
            print(f"❌ DALLE tools test failed: {e}")
            self.results['dalle_tools'] = False
    
    async def test_linear_tools(self):
        """Test Linear integration tools"""
        print("\n📋 Testing Linear Integration...")
        
        try:
            linear_api = LinearAPI()
            
            # Test initialization without API calls
            print("Linear tools initialized")
            print("Skipping actual Linear API calls (requires auth)")
            
            self.results['linear_tools'] = True
            
        except Exception as e:
            print(f"❌ Linear tools test failed: {e}")
            self.results['linear_tools'] = False
    
    async def test_paintswap_tools(self):
        """Test Paintswap NFT tools"""
        print("\n🖼️  Testing Paintswap NFT Tools...")
        
        try:
            paintswap_api = PaintswapAPI()
            
            # Test getting collections (should work without auth)
            collections = paintswap_api.get_tracked_collections()
            print(f"Tracked collections: {len(collections)}")
            
            # Test market statistics (may require network connection)
            print("Paintswap tools initialized successfully")
            
            self.results['paintswap_tools'] = True
            
        except Exception as e:
            print(f"❌ Paintswap tools test failed: {e}")
            self.results['paintswap_tools'] = False
    
    async def test_finance_tools(self):
        """Test finance research tools"""
        print("\n💰 Testing Finance Research Tools...")
        
        try:
            finance_tools = FinanceResearchTools()
            
            # Test DexScreener API initialization
            api = DexScreenerAPI()
            print("DexScreener API initialized")
            
            # Test rate limiting
            print(f"Rate limiter configured: {api.rate_limiter.calls_per_minute} calls/minute")
            
            print("Skipping actual API calls to avoid rate limits")
            
            self.results['finance_tools'] = True
            
        except Exception as e:
            print(f"❌ Finance tools test failed: {e}")
            self.results['finance_tools'] = False
    
    async def test_discord_monitoring(self):
        """Test Discord monitoring tools"""
        print("\n💬 Testing Discord Monitoring...")
        
        try:
            discord_notifier = DiscordWebhookNotifier()
            
            print("Discord monitoring tools initialized")
            print("Skipping webhook tests (requires Discord webhook URL)")
            
            self.results['discord_monitoring'] = True
            
        except Exception as e:
            print(f"❌ Discord monitoring test failed: {e}")
            self.results['discord_monitoring'] = False
    
    async def test_research_team(self):
        """Test multi-agent research team"""
        print("\n🧠 Testing Sonic Research Team...")
        
        try:
            research_team = SonicResearchTeam()
            
            # Test session creation (without actual research)
            session = await research_team.create_research_session(
                user_id="test_user_123",
                topic="Test research topic",
                priority="low"
            )
            
            print(f"Research session created: {session.session_id}")
            print(f"Participants: {session.participants}")
            
            # Test session management
            summary = await research_team.get_session_summary(session.session_id)
            print(f"Session summary generated: {summary['session_info']['status']}")
            
            # Clean up
            await research_team.close_session(session.session_id)
            print("Session closed successfully")
            
            self.results['research_team'] = True
            
        except Exception as e:
            print(f"❌ Research team test failed: {e}")
            self.results['research_team'] = False
    
    async def test_integration_connections(self):
        """Test cross-system integrations"""
        print("\n🔗 Testing Integration Connections...")
        
        try:
            # Test user manager with research team
            user_manager = UnifiedUserManager()
            research_team = SonicResearchTeam(user_manager)
            
            print("User manager integrated with research team")
            
            # Test that all systems can coexist
            dalle_generator = DALLEImageGenerator()
            finance_tools = FinanceResearchTools() 
            
            print("All tools can be initialized together")
            
            self.results['integration_connections'] = True
            
        except Exception as e:
            print(f"❌ Integration connections test failed: {e}")
            self.results['integration_connections'] = False
    
    async def run_all_tests(self):
        """Run all integration tests"""
        print("🚀 Starting Agent-UI Integration Tests...")
        print(f"📅 Test started at: {self.start_time}")
        
        test_methods = [
            self.test_user_management,
            self.test_dalle_tools,
            self.test_linear_tools,
            self.test_paintswap_tools,
            self.test_finance_tools,
            self.test_discord_monitoring,
            self.test_research_team,
            self.test_integration_connections
        ]
        
        for test_method in test_methods:
            try:
                await test_method()
            except Exception as e:
                print(f"❌ Test {test_method.__name__} crashed: {e}")
                self.results[test_method.__name__] = False
        
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        end_time = datetime.now()
        duration = end_time - self.start_time
        
        print("\n" + "="*60)
        print("📊 INTEGRATION TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for result in self.results.values() if result)
        total = len(self.results)
        
        print(f"Tests Passed: {passed}/{total}")
        print(f"Duration: {duration.total_seconds():.2f} seconds")
        print(f"Completed: {end_time}")
        
        print("\nDetailed Results:")
        for test_name, result in self.results.items():
            status = "PASS" if result else "FAIL"
            print(f"  {status} {test_name}")
        
        if passed == total:
            print("\nAll tests passed! Agent-UI integration is ready.")
            return True
        else:
            print(f"\n{total - passed} tests failed. Review errors above.")
            return False


async def main():
    """Main test execution"""
    tester = IntegrationTester()
    success = await tester.run_all_tests()
    
    if success:
        print("\nIntegration testing completed successfully!")
        sys.exit(0)
    else:
        print("\nIntegration testing completed with failures!")
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nTests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nFatal error during testing: {e}")
        sys.exit(1)