#!/usr/bin/env python3
"""
Unified User Manager for ServiceFlow AI
Handles user registration, authentication, and management across all agents
"""

import os
import json
import hashlib
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import uuid
# Discord integration moved to separate discord_bot.py to prevent import conflicts

logger = logging.getLogger(__name__)

@dataclass
class User:
    """User data model"""
    user_id: str
    username: str
    email: str
    discord_id: Optional[str] = False
    telegram_id: Optional[str] = None
    wallet_address: Optional[str] = None
    subscription_tier: str = "free"
    created_at: datetime = None
    last_active: datetime = None
    credits: int = 0
    usage_stats: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.last_active is None:
            self.last_active = datetime.now()
        if self.usage_stats is None:
            self.usage_stats = {}

class UnifiedUserManager:
    """Manages users across all ServiceFlow AI agents"""
    
    def __init__(self, storage_path: str = "tmp/users.json"):
        self.storage_path = storage_path
        self.users = {}
        self.sessions = {}
        self._load_users()
    
    def _load_users(self):
        """Load users from storage"""
        try:
            if os.path.exists(self.storage_path):
                with open(self.storage_path, 'r') as f:
                    user_data = json.load(f)
                    for user_id, data in user_data.items():
                        # Convert datetime strings back to datetime objects
                        if 'created_at' in data:
                            data['created_at'] = datetime.fromisoformat(data['created_at'])
                        if 'last_active' in data:
                            data['last_active'] = datetime.fromisoformat(data['last_active'])
                        self.users[user_id] = User(**data)
                logger.info(f"Loaded {len(self.users)} users from storage")
        except Exception as e:
            logger.error(f"Error loading users: {e}")
            self.users = {}
    
    def _save_users(self):
        """Save users to storage"""
        try:
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            user_data = {}
            for user_id, user in self.users.items():
                data = asdict(user)
                # Convert datetime objects to strings for JSON serialization
                data['created_at'] = user.created_at.isoformat()
                data['last_active'] = user.last_active.isoformat()
                user_data[user_id] = data
            
            with open(self.storage_path, 'w') as f:
                json.dump(user_data, f, indent=2)
            logger.info(f"Saved {len(self.users)} users to storage")
        except Exception as e:
            logger.error(f"Error saving users: {e}")
    
    def register_user(self, user_id: str, wallet_address: str, username: str, email: str, discord_id: str, telegram_id: Optional[str] = None, twitter_id: Optional[str] = None):
        """Register a new user"""
        # Check if user already exists
        existing_user = self.get_user_by_email(email)
        if existing_user:
            raise ValueError(f"User with email {email} already exists")
        
        # Create user
        user = User(
            user_id=user_id,
            username=username,
            email=email,
            discord_id=discord_id,
            telegram_id=telegram_id,
            wallet_address=wallet_address,
            credits=100  # Welcome credits
        )
        
        self.users[user_id] = user
        self._save_users()
        
        logger.info(f"Registered user: {user_id} with wallet: {wallet_address}")
        print(f"Registering user with user_id: {user_id}, wallet_address: {wallet_address}")
        return {"success": True, "message": "User registered successfully"}
    
    def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return self.users.get(user_id)
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        for user in self.users.values():
            if user.email == email:
                return user
        return None
    
    def get_user_by_discord(self, discord_id: str) -> Optional[User]:
        """Get user by Discord ID"""
        for user in self.users.values():
            if user.discord_id == discord_id:
                return user
        return None
    
    def get_user_by_telegram(self, telegram_id: str) -> Optional[User]:
        """Get user by Telegram ID"""
        for user in self.users.values():
            if user.telegram_id == telegram_id:
                return user
        return None
    
    def get_user_by_wallet(self, wallet_address: str) -> Optional[User]:
        """Get user by wallet address"""
        for user in self.users.values():
            if user.wallet_address and user.wallet_address.lower() == wallet_address.lower():
                return user
        return None
    
    def update_user(self, user_id: str, **kwargs) -> bool:
        """Update user information"""
        user = self.get_user(user_id)
        if not user:
            return False
        
        # Update allowed fields
        allowed_fields = ['username', 'email', 'discord_id', 'telegram_id', 
                         'wallet_address', 'subscription_tier']
        
        for field, value in kwargs.items():
            if field in allowed_fields:
                setattr(user, field, value)
        
        user.last_active = datetime.now()
        self._save_users()
        
        logger.info(f"Updated user {user_id}")
        return True
    
    def add_credits(self, user_id: str, amount: int) -> bool:
        """Add credits to user account"""
        user = self.get_user(user_id)
        if not user:
            return False
        
        user.credits += amount
        user.last_active = datetime.now()
        self._save_users()
        
        logger.info(f"Added {amount} credits to user {user_id}. New balance: {user.credits}")
        return True
    
    def deduct_credits(self, user_id: str, amount: int) -> bool:
        """Deduct credits from user account"""
        user = self.get_user(user_id)
        if not user or user.credits < amount:
            return False
        
        user.credits -= amount
        user.last_active = datetime.now()
        self._save_users()
        
        logger.info(f"Deducted {amount} credits from user {user_id}. New balance: {user.credits}")
        return True
    
    def check_credits(self, user_id: str, required_amount: int) -> bool:
        """Check if user has enough credits"""
        user = self.get_user(user_id)
        return user and user.credits >= required_amount
    
    def track_usage(self, user_id: str, service: str, details: Dict[str, Any] = None):
        """Track user service usage"""
        user = self.get_user(user_id)
        if not user:
            return False
        
        usage_key = f"{service}_{datetime.now().strftime('%Y-%m-%d')}"
        
        if usage_key not in user.usage_stats:
            user.usage_stats[usage_key] = {
                "service": service,
                "date": datetime.now().strftime('%Y-%m-%d'),
                "count": 0,
                "details": []
            }
        
        user.usage_stats[usage_key]["count"] += 1
        
        if details:
            user.usage_stats[usage_key]["details"].append({
                "timestamp": datetime.now().isoformat(),
                **details
            })
        
        user.last_active = datetime.now()
        self._save_users()
        
        return True
    
    def get_usage_stats(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get user usage statistics for the last N days"""
        user = self.get_user(user_id)
        if not user:
            return {}
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        filtered_stats = {}
        for key, stats in user.usage_stats.items():
            if datetime.fromisoformat(stats["date"]) >= cutoff_date:
                filtered_stats[key] = stats
        
        return filtered_stats
    
    def create_session(self, user_id: str, platform: str = "web") -> str:
        """Create a user session"""
        user = self.get_user(user_id)
        if not user:
            raise ValueError("User not found")
        
        session_id = str(uuid.uuid4())
        session = {
            "session_id": session_id,
            "user_id": user_id,
            "platform": platform,
            "created_at": datetime.now(),
            "last_active": datetime.now()
        }
        
        self.sessions[session_id] = session
        user.last_active = datetime.now()
        self._save_users()
        
        logger.info(f"Created session {session_id} for user {user_id}")
        return session_id
    
    def validate_session(self, session_id: str) -> Optional[str]:
        """Validate session and return user_id"""
        session = self.sessions.get(session_id)
        if not session:
            return None
        
        # Check if session is expired (24 hours)
        if datetime.now() - session["created_at"] > timedelta(hours=24):
            del self.sessions[session_id]
            return None
        
        # Update last active
        session["last_active"] = datetime.now()
        
        # Update user last active
        user = self.get_user(session["user_id"])
        if user:
            user.last_active = datetime.now()
            self._save_users()
        
        return session["user_id"]
    
    def end_session(self, session_id: str) -> bool:
        """End a user session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"Ended session {session_id}")
            return True
        return False
    
    def get_subscription_limits(self, user_id: str) -> Dict[str, int]:
        """Get subscription limits for a user"""
        user = self.get_user(user_id)
        if not user:
            return {}
        
        limits = {
            "free": {
                "daily_requests": 10,
                "monthly_credits": 100,
                "image_generation": 5,
                "video_generation": 1
            },
            "basic": {
                "daily_requests": 100,
                "monthly_credits": 1000,
                "image_generation": 50,
                "video_generation": 10
            },
            "premium": {
                "daily_requests": 1000,
                "monthly_credits": 10000,
                "image_generation": 500,
                "video_generation": 100
            },
            "enterprise": {
                "daily_requests": -1,  # Unlimited
                "monthly_credits": -1,  # Unlimited
                "image_generation": -1,  # Unlimited
                "video_generation": -1  # Unlimited
            }
        }
        
        return limits.get(user.subscription_tier, limits["free"])
    
    def check_rate_limit(self, user_id: str, service: str) -> bool:
        """Check if user has exceeded rate limits"""
        user = self.get_user(user_id)
        if not user:
            return False
        
        limits = self.get_subscription_limits(user_id)
        today = datetime.now().strftime('%Y-%m-%d')
        usage_key = f"{service}_{today}"
        
        current_usage = user.usage_stats.get(usage_key, {}).get("count", 0)
        daily_limit = limits.get("daily_requests", 10)
        
        if daily_limit == -1:  # Unlimited
            return True
        
        return current_usage < daily_limit
    
    def list_users(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """List users with pagination"""
        users_list = list(self.users.values())
        users_subset = users_list[offset:offset + limit]
        
        return [
            {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
                "subscription_tier": user.subscription_tier,
                "credits": user.credits,
                "created_at": user.created_at.isoformat(),
                "last_active": user.last_active.isoformat()
            }
            for user in users_subset
        ]
    
    # Discord integration has been moved to discord_bot.py to prevent import conflicts
    # This allows playground.py to start without requiring Discord dependencies

# Example usage
if __name__ == "__main__":
    # Initialize user manager
    user_manager = UnifiedUserManager()
    
    # Register a test user
    try:
        user_id = user_manager.register_user(
            username="testuser",
            email="test@example.com",
            discord_id="123456789"
        )
        print(f"Registered user: {user_id}")
        
        # Check credits
        print(f"Credits: {user_manager.get_user(user_id).credits}")
        
        # Track usage
        user_manager.track_usage(user_id, "image_generation", {"prompt": "test image"})
        
        # Create session
        session_id = user_manager.create_session(user_id, "discord")
        print(f"Session created: {session_id}")
        
        # Validate session
        validated_user_id = user_manager.validate_session(session_id)
        print(f"Session validated for user: {validated_user_id}")
        
    except ValueError as e:
        print(f"User already exists: {e}")
        
    # List users
    users = user_manager.list_users()
    print(f"Total users: {len(users)}")
    for user in users:
        print(f"- {user['username']} ({user['email']})")