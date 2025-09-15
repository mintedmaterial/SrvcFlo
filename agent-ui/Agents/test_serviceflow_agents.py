#!/usr/bin/env python3
"""
Test script for ServiceFlow AI agents
Run this to test the complete workflow before deploying
"""

import asyncio
import os
from dotenv import load_dotenv
from serviceflow_agents import (
    srvcflo_agent,
    serviceflow_content_team,
    viral_researcher,
    viral_content_writer,
    social_media_specialist,
    generate_viral_content_package,
    VIRAL_TOPICS
)

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

async def test_viral_research():
    """Test the viral research specialist"""
    print("🔍 Testing Viral Research Specialist...")
    
    research_prompt = """
    Research current trends in AI automation for small service businesses.
    Focus on finding:
    1. Latest statistics about automation adoption
    2. Success stories with specific ROI numbers
    3. Current pain points contractors face
    4. HackerNews discussions about business automation tools
    
    Use all available search tools (Google, DuckDuckGo, HackerNews) to find compelling data.
    """
    
    try:
        response = await viral_researcher.arun(research_prompt)
        print("✅ Research completed!")
        print(f"Response length: {len(response.content)} characters")
        return response.content
    except Exception as e:
        print(f"❌ Research failed: {e}")
        return None

async def test_blog_creation():
    """Test blog post creation"""
    print("\n📝 Testing Blog Creation...")
    
    blog_prompt = """
    Create a viral blog post with this title:
    "Why Smart Contractors Are Firing Their Answering Service"
    
    Target audience: Contractors and home service providers
    Include:
    - Attention-grabbing hook
    - Specific statistics and pain points
    - Clear solution positioning for AI automation
    - Strong CTA for ServiceFlow AI waitlist
    """
    
    try:
        response = await viral_content_writer.arun(blog_prompt)
        print("✅ Blog post created!")
        if hasattr(response, 'parsed_response') and response.parsed_response:
            blog_post = response.parsed_response
            print(f"Title: {blog_post.title}")
            print(f"Content length: {len(blog_post.content)} characters")
            print(f"Tags: {blog_post.tags}")
            return blog_post
        else:
            print("⚠️ Blog post created but not in expected format")
            return response.content
    except Exception as e:
        print(f"❌ Blog creation failed: {e}")
        return None

async def test_social_media_content():
    """Test social media content creation"""
    print("\n📱 Testing Social Media Content...")
    
    social_prompt = """
    Create platform-specific social media content for this blog post:
    "Why Smart Contractors Are Firing Their Answering Service"
    
    Create engaging posts for:
    - Twitter/X (with thread format)
    - LinkedIn (professional tone)
    - Facebook (community-focused)
    - Instagram (visual-friendly with hashtags)
    - TikTok (video concept)
    
    All content should drive traffic to ServiceFlow AI and encourage waitlist signups.
    """
    
    try:
        response = await social_media_specialist.arun(social_prompt)
        print("✅ Social media content created!")
        if hasattr(response, 'parsed_response') and response.parsed_response:
            social_content = response.parsed_response
            print(f"Twitter thread: {len(social_content.twitter_thread)} tweets")
            print(f"LinkedIn post: {len(social_content.linkedin_post)} characters")
            return social_content
        else:
            print("⚠️ Social content created but not in expected format")
            return response.content
    except Exception as e:
        print(f"❌ Social media creation failed: {e}")
        return None

async def test_srvcflo_strategy():
    """Test SrvcFlo's strategic thinking"""
    print("\n🚀 Testing SrvcFlo Strategic Direction...")
    
    strategy_prompt = """
    Analyze this viral content opportunity and provide strategic direction:
    
    Topic: "The $50K Mistake Every Contractor Makes: Missing Emergency Calls"
    Target Industry: contractors and home service providers
    
    Provide your strategic framework including:
    1. Viral angle and hook strategy
    2. Key pain points to address
    3. Statistics and data to research
    4. Transformation story framework
    5. Platform-specific optimization
    6. Waitlist conversion strategy
    
    Remember: My creator built ServiceFlow AI to revolutionize service businesses. 
    Every piece of content should advance that mission and drive waitlist growth.
    """
    
    try:
        response = await srvcflo_agent.arun(strategy_prompt)
        print("✅ SrvcFlo strategy completed!")
        print(f"Strategic direction length: {len(response.content)} characters")
        return response.content
    except Exception as e:
        print(f"❌ SrvcFlo strategy failed: {e}")
        return None

async def test_complete_workflow():
    """Test the complete viral content generation workflow"""
    print("\n🎯 Testing Complete Viral Content Workflow...")
    
    # Select a viral topic
    test_topic = "The $50K Mistake Every Contractor Makes: Missing Emergency Calls"
    test_industry = "contractors and home service providers"
    
    try:
        content_package = await generate_viral_content_package(test_topic, test_industry)
        print("✅ Complete workflow successful!")
        print(f"Strategy: {len(content_package.get('strategy', ''))} characters")
        print(f"Content: {len(content_package.get('content', ''))} characters")
        return content_package
    except Exception as e:
        print(f"❌ Complete workflow failed: {e}")
        return None

async def test_blog_posting():
    """Test blog posting to live site"""
    print("\n📤 Testing Blog Posting...")
    
    # Set API key for testing (use demo key)
    api_key = os.getenv('SERVICEFLOW_API_KEY', 'sfa_demo_creator_123456789abcdef')
    
    posting_prompt = f"""
    Create and publish a short test blog post to the ServiceFlow AI website:
    
    Title: "ServiceFlow AI Agent Test - {asyncio.get_event_loop().time()}"
    Content: A brief test post about AI automation for service businesses
    Category: AI Automation
    Tags: ['AI', 'Test', 'Automation']
    
    Use the blog posting tool to publish this directly to the live website.
    API Key: {api_key}
    """
    
    try:
        response = await srvcflo_agent.arun(posting_prompt)
        print("✅ Blog posting test completed!")
        print(response.content)
        return response.content
    except Exception as e:
        print(f"❌ Blog posting test failed: {e}")
        return None

async def main():
    """Run all tests"""
    print("🧪 ServiceFlow AI Agents Test Suite")
    print("=" * 60)
    
    # Test individual components
    research_result = await test_viral_research()
    blog_result = await test_blog_creation()
    social_result = await test_social_media_content()
    strategy_result = await test_srvcflo_strategy()
    
    # Test complete workflow
    workflow_result = await test_complete_workflow()
    
    # Test blog posting (optional - only if you want to test live posting)
    # posting_result = await test_blog_posting()
    
    print("\n" + "=" * 60)
    print("🎉 Test Suite Complete!")
    print("\nResults Summary:")
    print(f"✅ Research: {'PASSED' if research_result else 'FAILED'}")
    print(f"✅ Blog Creation: {'PASSED' if blog_result else 'FAILED'}")
    print(f"✅ Social Content: {'PASSED' if social_result else 'FAILED'}")
    print(f"✅ SrvcFlo Strategy: {'PASSED' if strategy_result else 'FAILED'}")
    print(f"✅ Complete Workflow: {'PASSED' if workflow_result else 'FAILED'}")
    
    if all([research_result, blog_result, social_result, strategy_result, workflow_result]):
        print("\n🚀 All tests passed! Agents are ready for production.")
        print("\nNext steps:")
        print("1. Run the playground: python playground.py")
        print("2. Test via playground interface")
        print("3. Deploy to Cloudflare Workers")
    else:
        print("\n⚠️ Some tests failed. Check the errors above.")

if __name__ == "__main__":
    asyncio.run(main())