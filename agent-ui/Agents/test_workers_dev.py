#!/usr/bin/env python3
"""
Test live blog posting to ServiceFlow AI workers.dev URL
"""

import requests
import json

def test_workers_dev_posting():
    """Test posting to the actual workers.dev URL"""
    
    # Get the blog content
    blog_content = '''# ServiceFlow AI Agent Test - Live Demo

## Unlocking Revenue with Emergency Call Automation
As a contractor, you often pride yourself on being available to your clients, even in the wee hours of the morning. But are you truly setting yourself up for success when it comes to emergency calls that come in at 3 AM? Research shows that many service contractors miss out on up to 40% of potential revenue just because their phone isn't answered during these off-hours. Imagine potential customers calling for urgent plumbing issues or heating breakdowns, only to be met with silence or voicemail. This scenario is a prime example of where contractors miss opportunities and ultimately revenue.

## The Hidden Costs of Manual Scheduling
Managing customer service and scheduling manually is not only time-consuming but also laden with costs. Studies show that employees spend about 20% of their time on scheduling-related tasks, which could otherwise be redirected to more critical areas of the business. Disorganization leads to missed appointments, delayed services, and unhappy customers. The inability to efficiently capture leads on the first call, especially during emergencies, significantly undermines your potential profits. Are you really willing to let significant revenue slip through your fingers due to inefficient processes?

## Transforming Your Business with AI Automation
This is where ServiceFlow AI steps in with a solution that can transform your service business. Our AI-driven platform automates the answering of emergency calls at any hour of the day. It captures vital customer information seamlessly and efficiently, ensuring you don't lose out on valuable leads, regardless of the time of day.

In addition to handling these calls, our automated scheduling tools allow you to manage appointments effortlessly. With cutting-edge technology, we not only eliminate the manual task of scheduling but also ensure that your clients are directed to the right services promptly, thus enhancing customer satisfaction.

## The ROI of ServiceFlow AI
Utilizing ServiceFlow AI to automate your processes doesn't just save time; it leads to an exceptional return on investment. Businesses that have implemented AI call optimization and scheduling solutions have reported an increase in appointment bookings by up to 35% and improved customer retention rates by 50%.

This improvement translates into significant revenue spikes – making for a powerful case for transitioning to automated systems. One satisfied customer shared, "After adopting ServiceFlow AI, we've observed a drastic change in our income from emergency calls. We're now able to respond to potential clients around the clock!"

## Join Our Waitlist Today!
Don't let your competitors outpace you. Take control of your service business with AI automation. Join our waitlist today and discover how ServiceFlow AI can help you maximize your revenue while minimizing your workload. Your journey to increased efficiency and growth starts now!'''

    # Blog post data
    blog_post = {
        'title': 'ServiceFlow AI Agent Test - Live Demo',
        'content': blog_content,
        'category': 'AI Automation', 
        'tags': ['AI', 'Automation', 'Service Business', 'Demo'],
        'excerpt': 'Test how AI automation transforms service businesses by capturing emergency calls and automating scheduling.',
        'meta_description': 'Discover how ServiceFlow AI helps contractors capture 40% more revenue through emergency call automation and intelligent scheduling.'
    }
    
    # Test with demo API key
    demo_api_key = "sfa_demo_creator_123456789abcdef"
    workers_url = "https://serviceflow-ai.serviceflowagi.workers.dev"
    
    print("Testing ServiceFlow AI Blog Posting")
    print("=" * 50)
    print(f"URL: {workers_url}/api/blog")
    print(f"API Key: {demo_api_key}")
    print(f"Title: {blog_post['title']}")
    print()
    
    try:
        # Post to workers.dev URL
        response = requests.post(
            f"{workers_url}/api/blog",
            json={
                'apiKey': demo_api_key,
                'blogPost': blog_post
            },
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 201:
            try:
                data = response.json()
                print("SUCCESS: Blog post published!")
                print(f"Blog URL: {data.get('url', 'N/A')}")
                print(f"Blog ID: {data.get('id', 'N/A')}")
                print(f"Response: {data}")
                return True
            except:
                print("SUCCESS: Blog post published (no JSON response)")
                print(f"Response: {response.text}")
                return True
        elif response.status_code == 200:
            print("SUCCESS: Request processed")
            print(f"Response: {response.text}")
            return True
        else:
            print("FAILED: Blog post not published")
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
    success = test_workers_dev_posting()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ Live posting test PASSED!")
        print("ServiceFlow AI blog system is working!")
        print("Next: Agents can now post directly to production")
    else:
        print("❌ Live posting test FAILED")
        print("Check the errors above for troubleshooting")