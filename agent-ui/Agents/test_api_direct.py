#!/usr/bin/env python3
"""
Direct API test for blog posting
"""

import requests
import json

def test_blog_api():
    """Test blog API directly"""
    
    # Test blog post
    blog_post = {
        'title': 'ServiceFlow AI Test Post - Direct API',
        'content': '''# ServiceFlow AI Test Post

This is a test blog post created to verify the ServiceFlow AI blog posting system is working properly.

## Key Features Tested:
- Blog creation via API
- Content formatting
- Live deployment verification

## Results:
If you can see this post, the ServiceFlow AI blog system is functioning correctly!

**Ready to revolutionize your service business?** Join the ServiceFlow AI waitlist today and never miss another customer call.

[Join Waitlist](#waitlist)
''',
        'category': 'AI Automation',
        'tags': ['AI', 'Test', 'Automation'],
        'excerpt': 'Test blog post to verify ServiceFlow AI blog posting system functionality.',
        'meta_description': 'Test blog post to verify ServiceFlow AI blog posting system functionality and live deployment.'
    }
    
    # Test with demo API key
    demo_api_key = "sfa_demo_creator_123456789abcdef"
    
    print("Testing ServiceFlow AI Blog API...")
    print("=" * 50)
    print(f"API Key: {demo_api_key}")
    print(f"Title: {blog_post['title']}")
    print()
    
    try:
        # Post to live site
        response = requests.post(
            "https://srvcflo.com/api/blog",
            json={
                'apiKey': demo_api_key,
                'blogPost': blog_post
            },
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            data = response.json()
            print("SUCCESS: Blog post published!")
            print(f"Blog URL: {data.get('url', 'N/A')}")
            print(f"Blog ID: {data.get('id', 'N/A')}")
            return True
        else:
            print("FAILED: Blog post not published")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Error response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("FAILED: Request timed out")
        return False
    except requests.exceptions.ConnectionError:
        print("FAILED: Connection error")
        return False
    except Exception as e:
        print(f"FAILED: {e}")
        return False

if __name__ == "__main__":
    success = test_blog_api()
    
    print("\n" + "=" * 50)
    if success:
        print("API test PASSED - Blog posting system is working!")
    else:
        print("API test FAILED - Check errors above")