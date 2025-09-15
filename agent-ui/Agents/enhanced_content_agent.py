"""
Enhanced Content Agent for ServiceFlow AI
Provides robust content creation, social media management, and automated posting
with comprehensive error handling, monitoring, and rate limiting
"""

import os
import sys
import time
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
from pathlib import Path

# Import enhanced modules
from enhanced_logging import ServiceFlowLogger, performance_monitor, get_health_checker
from config_manager import ConfigManager

# Import Agno framework
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.python import PythonTools
from agno.storage.sqlite import SqliteStorage
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.sqlite import SqliteMemoryDb

class EnhancedContentAgent:
    """
    ServiceFlow AI Enhanced Content Agent
    Provides intelligent content creation with monitoring and error recovery
    """
    
    def __init__(self, agent_name: str = "enhanced_content_agent"):
        self.agent_name = agent_name
        self.logger = ServiceFlowLogger(agent_name)
        self.config = ConfigManager(agent_name)
        self.health_checker = get_health_checker(agent_name)
        
        # Setup directories
        self.tmp_dir = Path(__file__).parent / "tmp"
        self.content_dir = self.tmp_dir / "content_data"
        self.content_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize rate limiting
        self.rate_limiter = RateLimiter(agent_name)
        
        # Setup agent
        self._setup_agent()
        
        # Load configuration
        self._load_configuration()
        
        self.logger.info("Enhanced Content Agent initialized successfully")
    
    def _setup_agent(self):
        """Initialize the Agno agent with enhanced capabilities"""
        try:
            # Setup storage
            storage = SqliteStorage(
                table_name="enhanced_content_storage",
                db_file=str(self.tmp_dir / "enhanced_content.db")
            )
            
            # Setup memory
            memory = Memory(
                db=SqliteMemoryDb(
                    table_name="enhanced_content_memory",
                    db_file=str(self.tmp_dir / "enhanced_content_memory.db")
                )
            )
            
            # Create agent
            self.agent = Agent(
                name="ServiceFlow Enhanced Content Agent",
                agent_id=self.agent_name,
                model=OpenAIChat(id="gpt-4o-mini"),
                tools=[
                    DuckDuckGoTools(),
                    PythonTools(),
                    # Add more tools as needed
                ],
                storage=storage,
                memory=memory,
                description="""Elite content creation agent for ServiceFlow AI with advanced monitoring capabilities.
                Specializes in social media content, blog posts, and automated posting with error recovery.""",
                instructions=self._get_agent_instructions(),
                show_tool_calls=True,
                markdown=True
            )
            
        except Exception as e:
            self.logger.error("Failed to setup agent", error=e)
            raise
    
    def _get_agent_instructions(self) -> str:
        """Get comprehensive agent instructions"""
        return """
        You are ServiceFlow AI's Enhanced Content Agent with advanced capabilities:
        
        🎯 PRIMARY OBJECTIVES:
        1. Create engaging, viral-worthy content for service businesses
        2. Optimize content for maximum engagement and conversion
        3. Maintain consistent brand voice across all platforms
        4. Monitor performance and adapt strategies
        
        📝 CONTENT TYPES:
        - Social media posts (Twitter/X, Facebook, LinkedIn)
        - Blog posts and articles
        - Email newsletters
        - Video scripts and captions
        - Marketing copy and ads
        
        🔧 CAPABILITIES:
        - Real-time trend analysis
        - Audience sentiment monitoring  
        - A/B testing content variations
        - Performance analytics and optimization
        - Automated posting with rate limiting
        
        ⚡ OPERATIONAL GUIDELINES:
        1. Always check rate limits before posting
        2. Log all activities for performance tracking
        3. Use error recovery mechanisms for failed operations
        4. Maintain data consistency across storage systems
        5. Respect platform-specific content guidelines
        
        📊 PERFORMANCE FOCUS:
        - Track engagement metrics
        - Monitor conversion rates
        - Analyze optimal posting times
        - Identify high-performing content types
        - Generate actionable insights
        
        Remember: Quality over quantity, engagement over reach, value over volume.
        """
    
    def _load_configuration(self):
        """Load agent configuration from environment and database"""
        try:
            # Load environment mappings
            env_mappings = {
                "openai_api_key": "OPENAI_API_KEY",
                "twitter_api_key": "TWITTER_API_KEY", 
                "twitter_api_secret": "TWITTER_API_SECRET",
                "facebook_access_token": "FACEBOOK_ACCESS_TOKEN",
                "posting_interval_minutes": "POSTING_INTERVAL_MINUTES",
                "max_posts_per_hour": "MAX_POSTS_PER_HOUR"
            }
            
            self.config.load_from_env(env_mappings)
            
            # Set default configurations
            defaults = {
                "posting_enabled": True,
                "max_retry_attempts": 3,
                "retry_delay_seconds": 30,
                "content_cache_size": 100,
                "performance_monitoring": True
            }
            
            for key, value in defaults.items():
                if self.config.get_config(key) is None:
                    self.config.set_config(key, value)
            
            self.logger.info("Configuration loaded successfully")
            
        except Exception as e:
            self.logger.error("Failed to load configuration", error=e)
    
    @performance_monitor("content_creation")
    def create_content(self, content_type: str, topic: str, platform: str = "general", 
                      style: str = "professional") -> Dict[str, Any]:
        """
        Create optimized content for specific platforms and audiences
        """
        try:
            self.rate_limiter.check_limit("content_creation")
            
            # Prepare context
            context = {
                "content_type": content_type,
                "topic": topic,
                "platform": platform,
                "style": style,
                "timestamp": datetime.now().isoformat()
            }
            
            # Create prompt
            prompt = self._build_content_prompt(content_type, topic, platform, style)
            
            # Generate content
            response = self.agent.run(prompt)
            
            if response and response.content:
                content_data = {
                    "content": response.content,
                    "context": context,
                    "generated_at": datetime.now().isoformat(),
                    "agent_id": self.agent_name,
                    "success": True
                }
                
                # Store content
                self._store_content(content_data)
                
                self.logger.info(f"Content created successfully", 
                               content_type=content_type, platform=platform)
                
                return content_data
            else:
                raise Exception("No content generated from agent")
                
        except Exception as e:
            self.logger.error(f"Content creation failed", error=e,
                            content_type=content_type, topic=topic)
            
            # Return error response
            return {
                "content": None,
                "error": str(e),
                "success": False,
                "timestamp": datetime.now().isoformat()
            }
    
    def _build_content_prompt(self, content_type: str, topic: str, 
                             platform: str, style: str) -> str:
        """Build optimized prompt for content generation"""
        platform_specs = {
            "twitter": "280 characters max, engaging, hashtag-friendly",
            "facebook": "1-2 paragraphs, conversational, shareable",
            "linkedin": "Professional tone, business-focused, thought leadership",
            "blog": "Long-form, SEO-optimized, valuable insights",
            "email": "Subject line + body, CTA-focused, personal"
        }
        
        spec = platform_specs.get(platform, "General purpose, adaptable format")
        
        return f"""
        Create {content_type} content about "{topic}" for {platform}.
        
        Platform Requirements: {spec}
        Style: {style}
        
        Focus on:
        - Service business automation benefits
        - Practical value for SMB owners
        - Clear call-to-action
        - Engaging and shareable format
        
        Include relevant hashtags and optimize for engagement.
        """
    
    def _store_content(self, content_data: Dict[str, Any]):
        """Store generated content with metadata"""
        try:
            # Store in JSON file for discovery
            filename = f"content_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            file_path = self.content_dir / filename
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(content_data, f, indent=2, ensure_ascii=False)
            
            # Store in agent storage
            self.agent.storage.upsert(
                row_id=f"content_{int(time.time())}",
                data=content_data
            )
            
        except Exception as e:
            self.logger.error("Failed to store content", error=e)
    
    @performance_monitor("content_posting")
    def post_content(self, content: str, platform: str, schedule_time: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Post content to specified platform with error handling
        """
        try:
            # Check rate limits
            self.rate_limiter.check_limit(f"posting_{platform}")
            
            # Check if posting is enabled
            if not self.config.get_config("posting_enabled", True):
                raise Exception("Posting is disabled in configuration")
            
            # Validate content
            if not self._validate_content(content, platform):
                raise Exception("Content validation failed")
            
            # Post content (implementation depends on platform)
            result = self._execute_post(content, platform, schedule_time)
            
            # Log success
            self.logger.info(f"Content posted successfully to {platform}")
            
            return {
                "success": True,
                "platform": platform,
                "post_id": result.get("id"),
                "url": result.get("url"),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Failed to post content to {platform}", error=e)
            
            # Implement retry logic
            return self._retry_post(content, platform, schedule_time, str(e))
    
    def _validate_content(self, content: str, platform: str) -> bool:
        """Validate content meets platform requirements"""
        validations = {
            "twitter": len(content) <= 280,
            "facebook": len(content) <= 63206,
            "linkedin": len(content) <= 3000
        }
        
        return validations.get(platform, True)
    
    def _execute_post(self, content: str, platform: str, schedule_time: Optional[datetime]) -> Dict[str, Any]:
        """Execute the actual posting (platform-specific implementation)"""
        # This is a stub - implement actual posting logic for each platform
        post_id = f"{platform}_{int(time.time())}"
        
        # Simulate posting
        time.sleep(0.5)  # Simulate API call
        
        return {
            "id": post_id,
            "url": f"https://{platform}.com/post/{post_id}",
            "status": "published"
        }
    
    def _retry_post(self, content: str, platform: str, schedule_time: Optional[datetime], error: str) -> Dict[str, Any]:
        """Implement retry logic for failed posts"""
        max_retries = self.config.get_config("max_retry_attempts", 3)
        retry_delay = self.config.get_config("retry_delay_seconds", 30)
        
        for attempt in range(max_retries):
            try:
                self.logger.info(f"Retrying post to {platform}, attempt {attempt + 1}")
                time.sleep(retry_delay)
                
                result = self._execute_post(content, platform, schedule_time)
                
                self.logger.info(f"Post retry succeeded on attempt {attempt + 1}")
                return {
                    "success": True,
                    "platform": platform,
                    "post_id": result.get("id"),
                    "retries": attempt + 1
                }
                
            except Exception as retry_error:
                self.logger.warning(f"Retry attempt {attempt + 1} failed", error=retry_error)
        
        # All retries failed
        return {
            "success": False,
            "platform": platform,
            "error": error,
            "retries": max_retries,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get agent performance metrics"""
        try:
            # This would query the performance database
            return {
                "content_created_today": 0,  # Placeholder
                "posts_published": 0,
                "engagement_rate": 0.0,
                "error_rate": 0.0,
                "avg_response_time_ms": 0,
                "last_updated": datetime.now().isoformat()
            }
        except Exception as e:
            self.logger.error("Failed to get performance metrics", error=e)
            return {}
    
    def health_check(self) -> Dict[str, Any]:
        """Perform comprehensive health check"""
        try:
            health_status = {
                "agent_name": self.agent_name,
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "database_connected": self.health_checker.check_database_connectivity(),
                "api_responsive": self.health_checker.check_api_status(),
                "configuration_loaded": bool(self.config.get_config("posting_enabled") is not None),
                "rate_limits_ok": self.rate_limiter.check_all_limits(),
                "memory_usage": "normal",  # Placeholder
                "last_activity": datetime.now().isoformat()
            }
            
            # Record health status
            status = "healthy" if all([
                health_status["database_connected"],
                health_status["api_responsive"],
                health_status["configuration_loaded"]
            ]) else "degraded"
            
            self.health_checker.record_health_status(status)
            health_status["status"] = status
            
            return health_status
            
        except Exception as e:
            self.logger.error("Health check failed", error=e)
            return {
                "agent_name": self.agent_name,
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

class RateLimiter:
    """Rate limiting system for API calls and operations"""
    
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.limits = {}
        self.calls = {}
    
    def set_limit(self, operation: str, max_calls: int, time_window_seconds: int):
        """Set rate limit for an operation"""
        self.limits[operation] = {
            "max_calls": max_calls,
            "time_window": time_window_seconds
        }
        self.calls[operation] = []
    
    def check_limit(self, operation: str) -> bool:
        """Check if operation is within rate limits"""
        if operation not in self.limits:
            return True
        
        current_time = time.time()
        limit = self.limits[operation]
        call_history = self.calls[operation]
        
        # Remove old calls outside the time window
        cutoff_time = current_time - limit["time_window"]
        self.calls[operation] = [call_time for call_time in call_history if call_time > cutoff_time]
        
        # Check if we can make another call
        if len(self.calls[operation]) >= limit["max_calls"]:
            raise Exception(f"Rate limit exceeded for {operation}")
        
        # Record this call
        self.calls[operation].append(current_time)
        return True
    
    def check_all_limits(self) -> bool:
        """Check if all rate limits are healthy"""
        try:
            for operation in self.limits:
                # Don't actually increment, just check
                current_time = time.time()
                limit = self.limits[operation]
                call_history = self.calls.get(operation, [])
                
                cutoff_time = current_time - limit["time_window"]
                recent_calls = [call_time for call_time in call_history if call_time > cutoff_time]
                
                if len(recent_calls) >= limit["max_calls"]:
                    return False
            
            return True
        except Exception:
            return False

# Global instance
_enhanced_content_agent = None

def get_enhanced_content_agent(agent_name: str = "enhanced_content_agent") -> EnhancedContentAgent:
    """Get or create enhanced content agent instance"""
    global _enhanced_content_agent
    if _enhanced_content_agent is None:
        _enhanced_content_agent = EnhancedContentAgent(agent_name)
    return _enhanced_content_agent

if __name__ == "__main__":
    # Test the enhanced content agent
    agent = get_enhanced_content_agent()
    
    # Health check
    health = agent.health_check()
    print(f"Health Status: {health}")
    
    # Create test content
    content_result = agent.create_content(
        content_type="social_post",
        topic="AI automation for service businesses",
        platform="twitter",
        style="engaging"
    )
    
    print(f"Content Creation Result: {content_result}")