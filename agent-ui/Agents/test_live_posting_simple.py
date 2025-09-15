#!/usr/bin/env python3
"""
Simple test for live blog posting without complex dependencies
"""

import asyncio
import os
import requests
import json
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.storage.sqlite import SqliteStorage
from agno.tools.python import PythonTools

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

# Setup paths
cwd = Path(__file__).parent
tmp_dir = cwd.joinpath("tmp")
tmp_dir.mkdir(parents=True, exist_ok=True)

# Simple blog posting tool
def create_blog_posting_tool(api_key: str, base_url: str = "https://srvcflo.com"):
    """Create a tool for posting blogs to ServiceFlow AI website"""
    
    def post_blog(agent, title: str, content: str, category: str = "AI Automation", 
                  tags: list = None, excerpt: str = "") -> str:
        """Post a blog to ServiceFlow AI website"""
        
        blog_post = {
            'title': title,
            'content': content,
            'category': category,
            'tags': tags or ['AI', 'Automation', 'Service Business'],
            'excerpt': excerpt or content[:200] + "...",
            'meta_description': excerpt[:155] if excerpt else content[:155] + "..."
        }
        
        # Try to post to live site
        try:
            response = requests.post(
                f"{base_url}/api/blog",
                json={
                    'apiKey': api_key,
                    'blogPost': blog_post
                },
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 201:
                data = response.json()
                return f"Blog post '{title}' published successfully to {base_url}! URL: {data.get('url', 'N/A')}"
            else:
                error_msg = response.json().get('error', 'Unknown error')
                raise Exception(f"API returned {response.status_code}: {error_msg}")
                
        except Exception as e:
            # Fallback: Save locally
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"blog_post_{timestamp}.json"
            
            with open(tmp_dir / filename, 'w') as f:
                json.dump(blog_post, f, indent=2)
            
            return f"Could not post to live site ({str(e)}). Blog saved locally as {filename}."
    
    return post_blog

# Simple SrvcFlo agent for posting
srvcflo_posting_agent = Agent(
    name="SrvcFlo Blog Publisher",
    model=OpenAIChat(id="gpt-4o-mini"),
    description="AI lead of ServiceFlow AI specialized in blog publishing",
    instructions="""
    You are SrvcFlo, the AI lead of ServiceFlow AI. Create viral blog content 
    about service business automation and publish it to the website.
    
    Focus on:
    - Emergency call automation for contractors
    - Scheduling solutions for service businesses  
    - Lead capture and conversion
    - ROI and business transformation stories
    
    Always drive towards ServiceFlow AI waitlist signups.
    """,
    storage=SqliteStorage(
        table_name="srvcflo_posting_test",
        db_file=str(tmp_dir.joinpath("posting_test.db"))
    ),
    tools=[PythonTools(base_dir=tmp_dir)],
    markdown=True,
)

# Add blog posting tool
demo_api_key = "sfa_demo_creator_123456789abcdef"
blog_posting_tool = create_blog_posting_tool(demo_api_key)
srvcflo_posting_agent.tools.append(blog_posting_tool)

async def test_live_posting():
    """Test live blog posting"""
    print("Testing Live Blog Posting...")
    print("=" * 40)
    
    posting_prompt = f"""
    Create and publish a test blog post to ServiceFlow AI:
    
    Title: "ServiceFlow AI Agent Test - Live Demo"
    
    Create a compelling 600-word blog post about:
    - How contractors are missing revenue from 3 AM emergency calls
    - The cost of manual scheduling and customer service
    - How AI automation with ServiceFlow AI solves these problems
    - Strong CTA for waitlist signup
    
    Use the post_blog tool to publish this content with:
    - Category: "AI Automation"
    - Tags: ["AI", "Automation", "Service Business", "Demo"]
    - Excerpt: First 150 characters of the content
    
    API Key: {demo_api_key}
    """
    
    try:
        print("Creating and posting blog...")
        response = await srvcflo_posting_agent.arun(posting_prompt)
        print("\nResult:")
        print(response.content)
        return True
        
    except Exception as e:
        print(f"Failed: {e}")
        return False

async def main():
    """Run test"""
    success = await test_live_posting()
    
    print("\n" + "=" * 40)
    if success:
        print("Live posting test completed!")
    else:
        print("Test failed - check errors above.")

if __name__ == "__main__":
    asyncio.run(main())