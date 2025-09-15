#!/usr/bin/env python3
"""
Admin Verification Agent for ServiceFlow AI
Verifies admin access based on Bandit Kidz NFT ownership with specific token IDs
"""

import os
import sys
import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import aiohttp
from dataclasses import dataclass

# Add agent-ui to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from unified_user_manager import UnifiedUserManager
from auth_bridge_agent import AuthBridgeAgent

logger = logging.getLogger(__name__)

@dataclass
class AdminVerification:
    wallet_address: str
    is_admin: bool
    is_holder: bool
    admin_token_id: Optional[int] = None
    owned_tokens: List[int] = None
    verified_at: datetime = None

class AdminVerificationAgent:
    """Agent for verifying admin access via Bandit Kidz NFT ownership"""
    
    # Bandit Kidz NFT Contract
    BANDIT_KIDZ_CONTRACT = "0x45bC8A938E487FdE4F31A7E051c2b63627F6f966"
    
    # Admin token IDs for team member verification
    ADMIN_TOKEN_IDS = [
        143,  # Your token ID
        1, 2, 3, 4, 5,  # Additional admin token IDs
    ]
    
    def __init__(self):
        self.user_manager = UnifiedUserManager()
        self.auth_bridge = AuthBridgeAgent()
        
        # dRPC endpoint for Sonic network
        self.sonic_rpc_url = os.getenv('NEXT_PUBLIC_DRPC_HTTP_URL', 
                                      'https://lb.drpc.org/sonic/Av0tqtt4908GitCEzvNhURHIfJgThf0R8Id1qhnKxixj')
        
        # ERC-721 contract methods
        self.erc721_methods = {
            'ownerOf': '0x6352211e',  # ownerOf(uint256)
            'balanceOf': '0x70a08231',  # balanceOf(address)
            'tokenOfOwnerByIndex': '0x2f745c59'  # tokenOfOwnerByIndex(address,uint256)
        }
    
    async def verify_admin_status(self, wallet_address: str) -> AdminVerification:
        """
        Verify if wallet address holds admin token IDs
        """
        try:
            wallet_address = wallet_address.lower()
            logger.info(f"Verifying admin status for {wallet_address}")
            
            # Check each admin token ID
            for token_id in self.ADMIN_TOKEN_IDS:
                try:
                    owner = await self._get_token_owner(token_id)
                    if owner and owner.lower() == wallet_address:
                        logger.info(f"Admin verification successful: {wallet_address} owns token {token_id}")
                        return AdminVerification(
                            wallet_address=wallet_address,
                            is_admin=True,
                            is_holder=True,
                            admin_token_id=token_id,
                            verified_at=datetime.now()
                        )
                except Exception as e:
                    logger.warning(f"Error checking token {token_id}: {e}")
                    continue
            
            # Not an admin, but check if they hold any Bandit Kidz NFTs
            balance = await self._get_balance(wallet_address)
            is_holder = balance > 0
            
            owned_tokens = []
            if is_holder:
                owned_tokens = await self._get_owned_tokens(wallet_address, balance)
            
            return AdminVerification(
                wallet_address=wallet_address,
                is_admin=False,
                is_holder=is_holder,
                owned_tokens=owned_tokens or [],
                verified_at=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Admin verification failed for {wallet_address}: {e}")
            return AdminVerification(
                wallet_address=wallet_address,
                is_admin=False,
                is_holder=False,
                verified_at=datetime.now()
            )
    
    async def verify_specific_token_ownership(self, wallet_address: str, token_id: int) -> bool:
        """
        Verify ownership of a specific token ID
        """
        try:
            owner = await self._get_token_owner(token_id)
            return owner and owner.lower() == wallet_address.lower()
        except Exception as e:
            logger.error(f"Error verifying token {token_id} ownership: {e}")
            return False
    
    async def get_owned_tokens(self, wallet_address: str) -> List[int]:
        """
        Get all token IDs owned by a wallet address
        """
        try:
            balance = await self._get_balance(wallet_address)
            if balance == 0:
                return []
            
            return await self._get_owned_tokens(wallet_address, balance)
        except Exception as e:
            logger.error(f"Error getting owned tokens for {wallet_address}: {e}")
            return []
    
    async def authenticate_admin_user(self, wallet_address: str, session_id: str = None) -> Dict[str, Any]:
        """
        Authenticate user and verify admin status, updating user manager
        """
        try:
            # Verify admin status
            verification = await self.verify_admin_status(wallet_address)
            
            # Get or create user in system
            user = self.user_manager.get_user_by_wallet(wallet_address)
            
            if not user:
                # Create new user with admin status
                try:
                    result = self.user_manager.register_user(
                        user_id=f"admin_{wallet_address[-8:]}",
                        wallet_address=wallet_address,
                        username=f"Admin_{wallet_address[-4:]}",
                        email=f"{wallet_address}@admin.local",
                        discord_id=""
                    )
                    user = self.user_manager.get_user_by_wallet(wallet_address)
                except ValueError as e:
                    # User might already exist
                    user = self.user_manager.get_user_by_wallet(wallet_address)
            
            # Update user subscription tier based on admin status
            if user and verification.is_admin:
                self.user_manager.update_user(
                    user.user_id,
                    subscription_tier="enterprise"  # Give admin users enterprise access
                )
            
            # Create session if not provided
            if not session_id and user:
                session_id = self.user_manager.create_session(
                    user.user_id,
                    platform="agent-ui-admin"
                )
            
            return {
                "success": True,
                "verification": {
                    "wallet_address": verification.wallet_address,
                    "is_admin": verification.is_admin,
                    "is_holder": verification.is_holder,
                    "admin_token_id": verification.admin_token_id,
                    "owned_tokens": verification.owned_tokens,
                    "verified_at": verification.verified_at.isoformat() if verification.verified_at else None
                },
                "user": {
                    "user_id": user.user_id if user else None,
                    "username": user.username if user else None,
                    "subscription_tier": user.subscription_tier if user else None,
                    "credits": user.credits if user else None
                },
                "session_id": session_id,
                "access_level": "admin" if verification.is_admin else "holder" if verification.is_holder else "none"
            }
            
        except Exception as e:
            logger.error(f"Admin authentication failed for {wallet_address}: {e}")
            return {
                "success": False,
                "error": str(e),
                "access_level": "none"
            }
    
    async def _get_token_owner(self, token_id: int) -> Optional[str]:
        """Get the owner of a specific token ID"""
        try:
            # Encode function call for ownerOf(uint256)
            function_signature = self.erc721_methods['ownerOf']
            token_id_hex = f"{token_id:064x}"  # Pad to 32 bytes
            data = f"{function_signature}{token_id_hex}"
            
            result = await self._call_contract(data)
            if result and len(result) >= 66:  # 0x + 64 hex chars
                # Extract address from result (last 20 bytes)
                address_hex = result[-40:]  # Last 40 hex chars = 20 bytes
                return f"0x{address_hex}"
            
            return None
        except Exception as e:
            logger.error(f"Error getting owner of token {token_id}: {e}")
            return None
    
    async def _get_balance(self, wallet_address: str) -> int:
        """Get the NFT balance of a wallet address"""
        try:
            # Encode function call for balanceOf(address)
            function_signature = self.erc721_methods['balanceOf']
            address_hex = wallet_address[2:].zfill(64)  # Remove 0x and pad to 32 bytes
            data = f"{function_signature}{address_hex}"
            
            result = await self._call_contract(data)
            if result:
                return int(result, 16)
            
            return 0
        except Exception as e:
            logger.error(f"Error getting balance for {wallet_address}: {e}")
            return 0
    
    async def _get_owned_tokens(self, wallet_address: str, balance: int) -> List[int]:
        """Get list of token IDs owned by a wallet address"""
        tokens = []
        try:
            for i in range(balance):
                try:
                    # Encode function call for tokenOfOwnerByIndex(address,uint256)
                    function_signature = self.erc721_methods['tokenOfOwnerByIndex']
                    address_hex = wallet_address[2:].zfill(64)  # Remove 0x and pad
                    index_hex = f"{i:064x}"  # Pad index to 32 bytes
                    data = f"{function_signature}{address_hex}{index_hex}"
                    
                    result = await self._call_contract(data)
                    if result:
                        token_id = int(result, 16)
                        tokens.append(token_id)
                except Exception as e:
                    logger.warning(f"Error getting token at index {i}: {e}")
                    continue
            
            return tokens
        except Exception as e:
            logger.error(f"Error getting owned tokens for {wallet_address}: {e}")
            return tokens
    
    async def _call_contract(self, data: str) -> Optional[str]:
        """Make a contract call via RPC"""
        try:
            payload = {
                "jsonrpc": "2.0",
                "method": "eth_call",
                "params": [
                    {
                        "to": self.BANDIT_KIDZ_CONTRACT,
                        "data": f"0x{data}"
                    },
                    "latest"
                ],
                "id": 1
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.sonic_rpc_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result.get('result')
                    else:
                        logger.error(f"RPC call failed: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Contract call error: {e}")
            return None
    
    @classmethod
    def is_admin_token_id(cls, token_id: int) -> bool:
        """Check if token ID is in admin list"""
        return token_id in cls.ADMIN_TOKEN_IDS
    
    @classmethod
    def get_admin_token_ids(cls) -> List[int]:
        """Get all admin token IDs"""
        return cls.ADMIN_TOKEN_IDS.copy()
    
    @classmethod
    def add_admin_token_id(cls, token_id: int) -> None:
        """Add new admin token ID"""
        if token_id not in cls.ADMIN_TOKEN_IDS:
            cls.ADMIN_TOKEN_IDS.append(token_id)
            logger.info(f"Added admin token ID: {token_id}")

# Example usage and testing
if __name__ == "__main__":
    async def test_admin_verification():
        """Test the admin verification system"""
        agent = AdminVerificationAgent()
        
        # Test with your wallet address (replace with actual address)
        test_wallet = "0x0f4CBe532E34E4Dfcb648Adf145010b38ed5E8e8"  # Your dev wallet
        
        print(f"Testing admin verification for {test_wallet}")
        
        # Verify admin status
        verification = await agent.verify_admin_status(test_wallet)
        print(f"Verification result: {verification}")
        
        # Authenticate admin user
        auth_result = await agent.authenticate_admin_user(test_wallet)
        print(f"Authentication result: {json.dumps(auth_result, indent=2, default=str)}")
        
        # Test specific token ownership (your token ID 143)
        owns_143 = await agent.verify_specific_token_ownership(test_wallet, 143)
        print(f"Owns token 143: {owns_143}")
    
    # Run test
    asyncio.run(test_admin_verification())