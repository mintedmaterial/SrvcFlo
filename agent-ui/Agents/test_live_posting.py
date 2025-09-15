#!/usr/bin/env python3
"""
Test live blog posting to ServiceFlow AI website
"""

import asyncio
import os
from dotenv import load_dotenv
from serviceflow_agents import srvcflo_agent

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

async def test_live_blog_posting():
    """Test posting a blog to the live ServiceFlow AI website"""
    print("Testing Live Blog Posting to ServiceFlow AI...")
    print("=" * 50)
    
    # Use demo API key (you can replace this with a real one)
    demo_api_key = "sfa_demo_creator_123456789abcdef"
    
    posting_prompt = f"""
    Create and publish a test blog post to the ServiceFlow AI website:
    
    Title: "ServiceFlow AI Agent Test - Live Posting Demo"
    Content: Create a short but compelling blog post (500-800 words) about how AI automation 
    is transforming service businesses. Include:
    - Hook about traditional business challenges
    - AI automation benefits  
    - ServiceFlow AI as the solution
    - Clear waitlist CTA
    
    Category: AI Automation
    Tags: ['AI', 'Automation', 'Service Business', 'Demo']
    
    Use the blog posting tool to publish this directly to the live website.
    API Key: {demo_api_key}
    Base URL: https://srvcflo.com
    """
    
    try:
        print("SrvcFlo creating and posting blog...")
        response = await srvcflo_agent.arun(posting_prompt)
        print("\nBlog Posting Result:")
        print("-" * 30)
        print(response.content)
        return True
        
    except Exception as e:
        print(f"Blog posting failed: {e}")
        return False

async def main():
    """Run live posting test"""
    print("ServiceFlow AI Live Posting Test")
    print("=" * 40)
    
    success = await test_live_blog_posting()
    
    print("\n" + "=" * 40)
    if success:
        print("Live posting test completed!")
        print("Check the response above for results.")
    else:
        print("Live posting test failed.")
        print("Blog may have been saved locally instead.")

if __name__ == "__main__":
    asyncio.run(main())