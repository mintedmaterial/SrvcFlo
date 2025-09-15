#!/usr/bin/env python3
"""
Sonic Content Creation Team - Following content-creator workflow pattern
Multi-agent content creation system for social media and blog posts
"""

import os
import logging
from typing import Dict, List, Optional, Any
from agno.agent import Agent
from agno.team import Team
from agno.models.openai import OpenAIChat
from agno.storage.sqlite import SqliteStorage
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.x import XTools
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Structured output models following content-creator pattern
class BlogAnalysis(BaseModel):
    """Blog post analysis for content creation"""
    core_ideas: List[str] = Field(description="Main ideas from the blog post")
    technical_concepts: List[str] = Field(description="Technical concepts to highlight")
    target_audience: str = Field(description="Target audience for the content")
    key_takeaways: List[str] = Field(description="Key takeaways for social media")

class TwitterThreadPlan(BaseModel):
    """Twitter thread planning structure"""
    hook_tweet: str = Field(description="Attention-grabbing opening tweet")
    supporting_tweets: List[str] = Field(description="Supporting tweets with key points")
    call_to_action: str = Field(description="Final tweet with call to action")
    hashtags: List[str] = Field(description="Relevant hashtags")

class LinkedInPostPlan(BaseModel):
    """LinkedIn post planning structure"""
    professional_hook: str = Field(description="Professional opening statement")
    main_content: str = Field(description="Main post content")
    business_insights: List[str] = Field(description="Business insights to highlight")
    engagement_question: str = Field(description="Question to drive engagement")

class SonicContentTeam:
    """
    Sonic Content Creation Team following content-creator workflow pattern
    Blog Analyzer → Social Media Planner → Content Publisher
    """
    
    def __init__(self, mongodb_uri: str = None):
        # Use SQLite for content team
        self.storage_dir = "tmp/content_data"
        self.team = self._create_content_team()
    
    def _create_blog_analyzer(self) -> Agent:
        """Create Blog Analyzer agent (extracts core ideas)"""
        
        def analyze_blog_content(content: str) -> str:
            """Analyze blog content for key ideas and concepts
            
            Args:
                content (str): Blog post content or URL
                
            Returns:
                str: Structured analysis of blog content
            """
            # This would use web scraping in production
            analysis = {
                "core_ideas": ["AI automation benefits", "Service business efficiency", "Cost reduction strategies"],
                "technical_concepts": ["Machine learning", "Process automation", "API integration"],
                "target_audience": "Small service business owners",
                "key_takeaways": ["30% cost reduction possible", "24/7 availability", "Better customer experience"]
            }
            return f"Blog Analysis: {str(analysis)}"
        
        def extract_viral_elements(content: str) -> str:
            """Extract potentially viral elements from content
            
            Args:
                content (str): Content to analyze for viral potential
                
            Returns:
                str: Viral elements and hooks
            """
            viral_elements = {
                "emotional_hooks": ["Fear of missing out on efficiency", "Success transformation stories"],
                "data_points": ["90% of calls answered vs 60% manual", "$50K saved annually"],
                "controversy": ["Why most service businesses fail", "The automation myth"],
                "relatability": ["Owner working 80 hour weeks", "Missed family dinners due to work"]
            }
            return f"Viral Elements: {str(viral_elements)}"
        
        return Agent(
            name="Sonic Blog Analyzer",
            model=OpenAIChat(id="gpt-4o"),
            tools=[DuckDuckGoTools(), analyze_blog_content, extract_viral_elements],
            instructions=[
                "You are a Blog Analyzer specializing in Sonic ecosystem and service business content.",
                "Your role is to extract core ideas and technical concepts from blog posts and articles.",
                "",
                "PRIMARY FUNCTIONS:",
                "- Analyze blog posts for key ideas and technical concepts",
                "- Identify target audience and messaging angles",
                "- Extract viral elements and emotional hooks",
                "- Find relevant data points and statistics",
                "- Determine optimal content angles for social media",
                "",
                "ANALYSIS FRAMEWORK:",
                "- Core Ideas: Main themes and concepts",
                "- Technical Concepts: Blockchain, DeFi, automation terms",
                "- Audience Insights: Who would find this valuable",
                "- Viral Potential: Emotional triggers and hooks",
                "- Data Points: Statistics and concrete benefits",
                "",
                "OUTPUT REQUIREMENTS:",
                "- Provide structured analysis using analysis tools",
                "- Focus on Sonic ecosystem and service business angles",
                "- Identify multiple content creation opportunities",
                "- Suggest optimal platforms for each message type"
            ],
            storage=SqliteStorage(
                table_name="blog_analyzer",
                db_file=f"{self.storage_dir}/blog_analyzer.db"
            ),
            memory=Memory(
                model=OpenAIChat(id="gpt-4o"),
                db=SqliteMemoryDb(
                    table_name="blog_analyzer_memories",
                    db_file=f"{self.storage_dir}/blog_analyzer_memory.db"
                )
            ),
            markdown=True,
            show_tool_calls=True
        )
    
    def _create_social_media_planner(self) -> Agent:
        """Create Social Media Planner agent (converts to social posts)"""
        
        def create_twitter_thread(analysis: str, topic: str = "Sonic DeFi") -> str:
            """Create Twitter thread from blog analysis
            
            Args:
                analysis (str): Blog analysis results
                topic (str): Main topic focus
                
            Returns:
                str: Twitter thread structure
            """
            thread = {
                "hook_tweet": f"🧵 THREAD: Why {topic} is changing the game for service businesses",
                "supporting_tweets": [
                    f"1/ Traditional service businesses lose 40% of potential revenue to manual processes",
                    f"2/ {topic} automation can reduce operational costs by 30-50% while improving service quality",
                    f"3/ Real case study: Auto repair shop increased bookings by 200% with AI scheduling"
                ],
                "call_to_action": f"Ready to transform your service business with {topic}? Let's connect 👇",
                "hashtags": ["#SonicDeFi", "#ServiceAutomation", "#SmallBusiness", "#AI"]
            }
            return f"Twitter Thread Plan: {str(thread)}"
        
        def create_linkedin_post(analysis: str, professional_angle: str = "business efficiency") -> str:
            """Create LinkedIn post from blog analysis
            
            Args:
                analysis (str): Blog analysis results
                professional_angle (str): Professional focus area
                
            Returns:
                str: LinkedIn post structure
            """
            post = {
                "professional_hook": f"After analyzing 100+ service businesses, here's what I learned about {professional_angle}:",
                "main_content": """
The most successful service businesses have one thing in common: they leverage automation strategically.

🔹 They automate scheduling → 90% fewer missed appointments
🔹 They automate follow-ups → 3x higher customer retention  
🔹 They automate payments → 75% faster cash flow

The Sonic ecosystem makes this accessible to businesses of all sizes.
                """.strip(),
                "business_insights": [
                    "ROI typically achieved within 3-6 months",
                    "Customer satisfaction scores improve by 40%",
                    "Owner stress levels decrease significantly"
                ],
                "engagement_question": "What's the biggest operational challenge in your service business?"
            }
            return f"LinkedIn Post Plan: {str(post)}"
        
        def plan_content_calendar(topics: List[str], duration_weeks: int = 4) -> str:
            """Plan content calendar for multiple topics
            
            Args:
                topics (List[str]): List of topics to cover
                duration_weeks (int): Number of weeks to plan
                
            Returns:
                str: Content calendar structure
            """
            calendar = {
                "week_1": {"focus": "Problem awareness", "platforms": ["Twitter", "LinkedIn"]},
                "week_2": {"focus": "Solution introduction", "platforms": ["Twitter", "Blog"]},
                "week_3": {"focus": "Case studies", "platforms": ["LinkedIn", "Twitter"]},
                "week_4": {"focus": "Call to action", "platforms": ["Twitter", "LinkedIn", "Blog"]}
            }
            return f"Content Calendar ({duration_weeks} weeks): {str(calendar)}"
        
        return Agent(
            name="Sonic Social Media Planner",
            model=OpenAIChat(id="gpt-4o"),
            tools=[create_twitter_thread, create_linkedin_post, plan_content_calendar],
            instructions=[
                "You are a Social Media Planner specializing in Sonic ecosystem and service business content.",
                "You transform blog analysis into engaging social media posts across platforms.",
                "",
                "PLATFORM EXPERTISE:",
                "- Twitter: Thread creation, viral hooks, trending hashtags",
                "- LinkedIn: Professional insights, business case studies, thought leadership",
                "- Blog: Long-form educational content, SEO optimization",
                "",
                "CONTENT TRANSFORMATION PROCESS:",
                "1. Analyze blog content and extract key insights",
                "2. Adapt messaging for each platform's audience",
                "3. Create platform-specific content structures",
                "4. Optimize for engagement and virality",
                "5. Schedule content for maximum reach",
                "",
                "ENGAGEMENT STRATEGIES:",
                "- Use data-driven hooks and statistics",
                "- Include relatable business scenarios",
                "- Add clear calls-to-action",
                "- Incorporate trending hashtags and keywords",
                "- Create conversation starters",
                "",
                "CONTENT PILLARS:",
                "- Problem/Solution narratives",
                "- Success stories and case studies", 
                "- Industry insights and trends",
                "- Technical education simplified",
                "- Community building and engagement",
                "",
                "Always maintain professional tone while making content accessible and engaging."
            ],
            storage=SqliteStorage(
                table_name="social_media_planner",
                db_file=f"{self.storage_dir}/social_planner.db"
            ),
            memory=Memory(
                model=OpenAIChat(id="gpt-4o"),
                db=SqliteMemoryDb(
                    table_name="social_planner_memories",
                    db_file=f"{self.storage_dir}/social_planner_memory.db"
                )
            ),
            markdown=True,
            show_tool_calls=True
        )
    
    def _create_content_publisher(self) -> Agent:
        """Create Content Publisher agent (executes publishing)"""
        
        def format_for_publishing(content: str, platform: str) -> str:
            """Format content for specific platform publishing
            
            Args:
                content (str): Raw content to format
                platform (str): Target platform (twitter, linkedin, blog)
                
            Returns:
                str: Platform-formatted content
            """
            formatting_rules = {
                "twitter": "280 char limit, hashtags at end, thread numbers",
                "linkedin": "Professional tone, bullet points, engagement question",
                "blog": "SEO optimization, headers, call-to-action sections"
            }
            
            rule = formatting_rules.get(platform, "general formatting")
            return f"Formatted for {platform} ({rule}): {content}"
        
        def schedule_content(content_plan: str, optimal_times: bool = True) -> str:
            """Schedule content for optimal publishing times
            
            Args:
                content_plan (str): Content to schedule
                optimal_times (bool): Use optimal posting times
                
            Returns:
                str: Scheduling plan with times
            """
            if optimal_times:
                schedule = {
                    "twitter": ["9 AM EST", "1 PM EST", "7 PM EST"],
                    "linkedin": ["8 AM EST", "12 PM EST", "6 PM EST"],
                    "blog": ["10 AM EST Tuesday/Thursday"]
                }
            else:
                schedule = {"immediate": "Post now", "delayed": "Post in 1 hour"}
            
            return f"Content Schedule: {str(schedule)}"
        
        def track_performance(published_content: str) -> str:
            """Track content performance metrics
            
            Args:
                published_content (str): Content that was published
                
            Returns:
                str: Performance tracking setup
            """
            tracking = {
                "metrics": ["engagement_rate", "reach", "clicks", "conversions"],
                "tools": ["native_analytics", "utm_parameters", "conversion_tracking"],
                "reporting": "Weekly performance summary"
            }
            return f"Performance Tracking: {str(tracking)}"
        
        return Agent(
            name="Sonic Content Publisher",
            model=OpenAIChat(id="gpt-4o"),
            tools=[format_for_publishing, schedule_content, track_performance],
            instructions=[
                "You are a Content Publisher specializing in Sonic ecosystem social media execution.",
                "You handle the final formatting, scheduling, and performance tracking of content.",
                "",
                "PUBLISHING RESPONSIBILITIES:",
                "- Format content for specific platform requirements",
                "- Schedule posts for optimal engagement times",
                "- Set up performance tracking and analytics",
                "- Ensure brand consistency across platforms",
                "- Manage content calendars and posting schedules",
                "",
                "PLATFORM SPECIFICATIONS:",
                "- Twitter: 280 chars, hashtags, thread formatting",
                "- LinkedIn: Professional tone, business focus",
                "- Blog: SEO optimization, long-form structure",
                "",
                "OPTIMAL POSTING TIMES:",
                "- Twitter: 9 AM, 1 PM, 7 PM EST",
                "- LinkedIn: 8 AM, 12 PM, 6 PM EST (weekdays)",
                "- Blog: Tuesday/Thursday 10 AM EST",
                "",
                "PERFORMANCE TRACKING:",
                "- Set up UTM parameters for link tracking",
                "- Monitor engagement rates and reach",
                "- Track conversion metrics where applicable",
                "- Provide weekly performance summaries",
                "",
                "BRAND GUIDELINES:",
                "- Professional yet approachable tone",
                "- Focus on practical business value",
                "- Include clear calls-to-action",
                "- Maintain consistent voice across platforms"
            ],
            storage=SqliteStorage(
                table_name="content_publisher",
                db_file=f"{self.storage_dir}/content_publisher.db"
            ),
            memory=Memory(
                model=OpenAIChat(id="gpt-4o"),
                db=SqliteMemoryDb(
                    table_name="publisher_memories",
                    db_file=f"{self.storage_dir}/publisher_memory.db"
                )
            ),
            markdown=True,
            show_tool_calls=True
        )
    
    def _create_content_team(self) -> Team:
        """Create the coordinated content creation team"""
        
        # Create the three specialized agents
        blog_analyzer = self._create_blog_analyzer()
        social_planner = self._create_social_media_planner()
        content_publisher = self._create_content_publisher()
        
        # Create the coordinating team
        content_team = Team(
            name="Sonic Content Creation Team",
            mode="coordinate",  # Use coordinate mode for sequential workflow
            model=OpenAIChat(id="gpt-4o"),
            members=[blog_analyzer, social_planner, content_publisher],
            instructions=[
                "You are the Content Team Lead coordinating the content-creator workflow for Sonic ecosystem.",
                "Your team follows the content-creator pattern: Blog Analyzer → Social Media Planner → Content Publisher",
                "",
                "TEAM WORKFLOW:",
                "1. Blog Analyzer - Extracts core ideas and technical concepts from source content",
                "2. Social Media Planner - Transforms analysis into platform-specific content plans",
                "3. Content Publisher - Formats, schedules, and tracks content performance",
                "",
                "CONTENT CREATION PROCESS:",
                "1. Analyze source material (blog posts, articles, trends)",
                "2. Extract key insights and viral elements",
                "3. Plan content for Twitter, LinkedIn, and Blog platforms",
                "4. Create platform-optimized content variations",
                "5. Schedule for optimal engagement times",
                "6. Set up performance tracking and analytics",
                "",
                "CONTENT PILLARS:",
                "- Sonic DeFi and blockchain education",
                "- Service business automation benefits",
                "- Success stories and case studies",
                "- Industry trends and insights",
                "- Community building and engagement",
                "",
                "DELIVERABLES:",
                "- Blog content analysis and insights",
                "- Twitter thread sequences",
                "- LinkedIn professional posts",
                "- Content calendar with scheduling",
                "- Performance tracking setup",
                "",
                "QUALITY STANDARDS:",
                "- All content must provide practical business value",
                "- Include specific data points and statistics where possible",
                "- Maintain professional yet approachable tone",
                "- Ensure platform-appropriate formatting",
                "- Include clear calls-to-action"
            ],
            storage=SqliteStorage(
                table_name="content_team",
                db_file=f"{self.storage_dir}/content_team.db"
            ),
            markdown=True,
            show_tool_calls=True
        )
        
        return content_team
    
    def create_content_campaign(self, topic: str, source_content: str = "", platforms: List[str] = None) -> str:
        """Create comprehensive content campaign"""
        try:
            if platforms is None:
                platforms = ["Twitter", "LinkedIn", "Blog"]
            
            logger.info(f"Creating content campaign for: {topic}")
            
            # Format the request for the content team
            campaign_request = f"""Create a comprehensive content campaign for: {topic}

Source Content: {source_content if source_content else "Research and create original content"}
Target Platforms: {', '.join(platforms)}

Please follow the content-creator workflow:
1. Analyze the topic/source for key insights and viral elements
2. Plan platform-specific content (Twitter threads, LinkedIn posts, Blog articles)
3. Create publishing schedule and performance tracking setup

Focus on Sonic ecosystem and service business automation benefits."""
            
            # Execute using the coordinated team
            response = self.team.run(campaign_request)
            
            # Extract content
            content = response.content if hasattr(response, 'content') else str(response)
            
            logger.info("Content campaign created successfully")
            return content
            
        except Exception as e:
            logger.error(f"Content campaign creation failed: {e}")
            return f"Content campaign creation failed: {str(e)}"
    
    async def acreate_content_campaign(self, topic: str, source_content: str = "", platforms: List[str] = None) -> str:
        """Async version of content campaign creation"""
        try:
            if platforms is None:
                platforms = ["Twitter", "LinkedIn", "Blog"]
            
            logger.info(f"Creating async content campaign for: {topic}")
            
            # Format the request for the content team
            campaign_request = f"""Create a comprehensive content campaign for: {topic}

Source Content: {source_content if source_content else "Research and create original content"}
Target Platforms: {', '.join(platforms)}

Please follow the content-creator workflow:
1. Analyze the topic/source for key insights and viral elements  
2. Plan platform-specific content (Twitter threads, LinkedIn posts, Blog articles)
3. Create publishing schedule and performance tracking setup

Focus on Sonic ecosystem and service business automation benefits."""
            
            # Execute using the coordinated team
            response = await self.team.arun(campaign_request)
            
            # Extract content
            content = response.content if hasattr(response, 'content') else str(response)
            
            logger.info("Async content campaign created successfully")
            return content
            
        except Exception as e:
            logger.error(f"Async content campaign creation failed: {e}")
            return f"Content campaign creation failed: {str(e)}"

# Factory function for integration
def create_sonic_content_team(mongodb_uri: str = None) -> SonicContentTeam:
    """Factory function to create content team instance"""
    return SonicContentTeam(mongodb_uri)

if __name__ == "__main__":
    # Test the content team
    team = create_sonic_content_team()
    result = team.create_content_campaign(
        topic="Sonic DeFi yield farming opportunities for service businesses",
        platforms=["Twitter", "LinkedIn"]
    )
    print(result)