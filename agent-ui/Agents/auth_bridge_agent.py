#!/usr/bin/env python3
"""
Authentication Bridge Agent for ServiceFlow AI
Bridges wallet authentication between frontend and agent system
"""

import os
import sys
import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import requests
from pathlib import Path

# Add agent-ui to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from unified_user_manager import UnifiedUserManager, User
from agno.storage.mongodb import MongoDbStorage
from agno.storage.sqlite import SqliteStorage
from agno.agent import Agent
from agno.models.openai import OpenAIChat

logger = logging.getLogger(__name__)

class AuthBridgeAgent:
    """Bridges wallet authentication between frontend and agent system"""
    
    def __init__(self, auth_mcp_url: str = "http://localhost:3001", mongodb_uri: str = None):
        self.auth_mcp_url = auth_mcp_url
        self.mongodb_uri = mongodb_uri or os.getenv('MONGODB_URI')
        self.user_manager = UnifiedUserManager()
        
        # Initialize storage
        if self.mongodb_uri:
            try:
                self.storage = MongoDbStorage(
                    collection_name="auth_bridge",
                    db_url=self.mongodb_uri,
                    db_name="serviceflow_auth"
                )
            except Exception as e:
                logger.warning(f"MongoDB storage failed, using SQLite fallback: {e}")
                from pathlib import Path
                tmp_dir = Path(__file__).parent.parent / "tmp"
                tmp_dir.mkdir(exist_ok=True)
                self.storage = SqliteStorage(
                    table_name="auth_bridge",
                    db_file=str(tmp_dir / "agents.db")
                )
    
    async def authenticate_wallet(self, wallet_address: str, signature: str = None, message: str = None) -> Dict[str, Any]:
        """
        Authenticate user with wallet address using MCP server
        """
        try:
            # Call MCP auth server for wallet authentication
            response = await self._call_mcp_tool("auth_wallet_login", {
                "wallet_address": wallet_address,
                "signature": signature,
                "message": message
            })
            
            if response.get('success'):
                user_data = response.get('user', {})
                
                # Sync with unified user manager
                await self._sync_user_to_unified_manager(user_data)
                
                # Create agent-ui session
                session_id = self.user_manager.create_session(
                    user_id=user_data['user_id'],
                    platform="agent-ui"
                )
                
                return {
                    "success": True,
                    "user": user_data,
                    "session_id": session_id,
                    "is_new_user": user_data.get('is_new_user', False)
                }
            else:
                return {"success": False, "error": "Wallet authentication failed"}
                
        except Exception as e:
            logger.error(f"Wallet authentication error: {e}")
            return {"success": False, "error": str(e)}
    
    async def authenticate_email(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate user with email/password using MCP server
        """
        try:
            response = await self._call_mcp_tool("auth_login", {
                "identifier": email,
                "password": password
            })
            
            if response.get('success'):
                user_data = response.get('user', {})
                
                # Sync with unified user manager
                await self._sync_user_to_unified_manager(user_data)
                
                # Create agent-ui session
                session_id = self.user_manager.create_session(
                    user_id=user_data['user_id'],
                    platform="agent-ui"
                )
                
                return {
                    "success": True,
                    "user": user_data,
                    "session_id": session_id
                }
            else:
                return {"success": False, "error": "Email authentication failed"}
                
        except Exception as e:
            logger.error(f"Email authentication error: {e}")
            return {"success": False, "error": str(e)}
    
    async def create_user(self, email: str, wallet_address: str = None, password: str = None, auth_method: str = "wallet") -> Dict[str, Any]:
        """
        Create new user using MCP server
        """
        try:
            response = await self._call_mcp_tool("auth_create_user", {
                "email": email,
                "wallet_address": wallet_address,
                "password": password,
                "auth_method": auth_method
            })
            
            if response.get('success'):
                # Get user data after creation
                user_response = await self._call_mcp_tool("auth_get_user", {
                    "identifier": email
                })
                
                if user_response.get('success'):
                    user_data = user_response.get('user', {})
                    await self._sync_user_to_unified_manager(user_data)
                    
                    return {
                        "success": True,
                        "user": user_data,
                        "message": "User created successfully"
                    }
            
            return {"success": False, "error": "User creation failed"}
            
        except Exception as e:
            logger.error(f"User creation error: {e}")
            return {"success": False, "error": str(e)}
    
    async def validate_session(self, session_id: str) -> Dict[str, Any]:
        """
        Validate session using both MCP server and unified user manager
        """
        try:
            # First check local session
            local_user_id = self.user_manager.validate_session(session_id)
            if not local_user_id:
                return {"success": False, "error": "Invalid session"}
            
            # Also validate with MCP server if available
            try:
                response = await self._call_mcp_tool("auth_validate_session", {
                    "session_id": session_id
                })
                
                if response.get('success'):
                    return {
                        "success": True,
                        "user_id": local_user_id,
                        "session": response.get('session', {})
                    }
            except:
                # If MCP is unavailable, rely on local validation
                pass
            
            return {
                "success": True,
                "user_id": local_user_id
            }
            
        except Exception as e:
            logger.error(f"Session validation error: {e}")
            return {"success": False, "error": str(e)}
    
    async def logout(self, session_id: str) -> Dict[str, Any]:
        """
        End user session
        """
        try:
            # End local session
            local_result = self.user_manager.end_session(session_id)
            
            # End MCP session if available
            try:
                await self._call_mcp_tool("auth_end_session", {
                    "session_id": session_id
                })
            except:
                # If MCP is unavailable, rely on local logout
                pass
            
            return {
                "success": True,
                "message": "Logged out successfully"
            }
            
        except Exception as e:
            logger.error(f"Logout error: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_user_info(self, identifier: str) -> Dict[str, Any]:
        """
        Get user information by various identifiers
        """
        try:
            # Try local first
            local_user = self.user_manager.get_user_by_wallet(identifier) or \
                        self.user_manager.get_user_by_email(identifier) or \
                        self.user_manager.get_user(identifier)
            
            if local_user:
                return {
                    "success": True,
                    "user": {
                        "user_id": local_user.user_id,
                        "email": local_user.email,
                        "wallet_address": local_user.wallet_address,
                        "nickname": local_user.username,
                        "subscription_tier": local_user.subscription_tier,
                        "credits": local_user.credits
                    }
                }
            
            # Try MCP server
            response = await self._call_mcp_tool("auth_get_user", {
                "identifier": identifier
            })
            
            return response
            
        except Exception as e:
            logger.error(f"Get user info error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _sync_user_to_unified_manager(self, user_data: Dict[str, Any]) -> None:
        """
        Sync user data from MCP server to unified user manager
        """
        try:
            user_id = user_data.get('user_id')
            email = user_data.get('email')
            wallet_address = user_data.get('wallet_address')
            nickname = user_data.get('nickname')
            
            # Check if user exists in unified manager
            existing_user = self.user_manager.get_user_by_email(email) or \
                           (wallet_address and self.user_manager.get_user_by_wallet(wallet_address))
            
            if not existing_user:
                # Create user in unified manager
                try:
                    self.user_manager.register_user(
                        user_id=user_id,
                        wallet_address=wallet_address or "",
                        username=nickname or email.split('@')[0],
                        email=email,
                        discord_id="",  # Will be updated later if available
                    )
                except ValueError:
                    # User might already exist, just update
                    pass
            
            # Update user information
            if existing_user:
                self.user_manager.update_user(
                    existing_user.user_id,
                    wallet_address=wallet_address,
                    username=nickname
                )
        
        except Exception as e:
            logger.error(f"User sync error: {e}")
    
    async def _call_mcp_tool(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call MCP server tool
        """
        try:
            response = requests.post(
                f"{self.auth_mcp_url}/mcp/call",
                json={
                    "tool": tool_name,
                    "arguments": args
                },
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"MCP call failed: {response.status_code}")
                
        except requests.RequestException as e:
            # If MCP server is unavailable, handle gracefully
            logger.warning(f"MCP server unavailable: {e}")
            raise Exception("Authentication service temporarily unavailable")

# Agent implementation for integration with other agents
class AuthBridgeAgentService(Agent):
    """
    Authentication Bridge Agent Service
    Provides authentication services to other agents
    """
    
    def __init__(self, **kwargs):
        super().__init__(
            name="AuthBridgeAgent",
            role="Authentication and user management bridge between frontend and agents",
            instructions=[
                "Handle user authentication requests from frontend",
                "Validate user sessions and permissions",
                "Bridge wallet authentication to agent system",
                "Manage user state across applications",
                "Provide user information to other agents"
            ],
            **kwargs
        )
        
        self.auth_bridge = AuthBridgeAgent()
    
    async def authenticate_user(self, wallet_address: str = None, email: str = None, password: str = None) -> Dict[str, Any]:
        """Agent method to authenticate users"""
        if wallet_address:
            return await self.auth_bridge.authenticate_wallet(wallet_address)
        elif email and password:
            return await self.auth_bridge.authenticate_email(email, password)
        else:
            return {"success": False, "error": "Invalid authentication parameters"}
    
    async def get_user_session(self, session_id: str) -> Dict[str, Any]:
        """Agent method to validate and get user session"""
        return await self.auth_bridge.validate_session(session_id)

# Example usage and testing
if __name__ == "__main__":
    async def test_auth_bridge():
        """Test the authentication bridge"""
        bridge = AuthBridgeAgent()
        
        # Test wallet authentication
        result = await bridge.authenticate_wallet("0x1234567890123456789012345678901234567890")
        print("Wallet auth result:", json.dumps(result, indent=2))
        
        if result.get('success'):
            session_id = result.get('session_id')
            
            # Test session validation
            validation = await bridge.validate_session(session_id)
            print("Session validation:", json.dumps(validation, indent=2))
            
            # Test logout
            logout_result = await bridge.logout(session_id)
            print("Logout result:", json.dumps(logout_result, indent=2))
    
    asyncio.run(test_auth_bridge())