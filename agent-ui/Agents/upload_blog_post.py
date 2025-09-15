#!/usr/bin/env python3
"""
Blog Post Upload Script
Uploads generated blog posts from content agent to the website API
"""

import json
import requests
import os
import sys
from pathlib import Path
from datetime import datetime

def upload_blog_post(json_file_path, api_endpoint="http://127.0.0.1:8080/api/blog"):
    """
    Upload a blog post from JSON file to the blog API
    
    Args:
        json_file_path (str): Path to the blog post JSON file
        api_endpoint (str): Blog API endpoint URL
    
    Returns:
        dict: API response
    """
    try:
        # Read the blog post JSON file
        with open(json_file_path, 'r', encoding='utf-8') as f:
            blog_data = json.load(f)
        
        # Prepare the data for API
        api_data = {
            'title': blog_data.get('title', 'Untitled'),
            'content': blog_data.get('content', ''),
            'category': blog_data.get('category', 'AI Automation'),
            'tags': blog_data.get('tags', ['AI', 'Automation']),
            'excerpt': blog_data.get('excerpt') or blog_data.get('meta_description', '')
        }
        
        # Make the API request
        response = requests.post(
            api_endpoint,
            json=api_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"✅ Blog post uploaded successfully: {result.get('slug')}")
                return result
            else:
                print(f"❌ API error: {result.get('error')}")
                return result
        else:
            print(f"❌ HTTP error {response.status_code}: {response.text}")
            return {'success': False, 'error': f'HTTP {response.status_code}'}
            
    except FileNotFoundError:
        error_msg = f"❌ Blog post file not found: {json_file_path}"
        print(error_msg)
        return {'success': False, 'error': error_msg}
    except json.JSONDecodeError as e:
        error_msg = f"❌ Invalid JSON in blog post file: {e}"
        print(error_msg)
        return {'success': False, 'error': error_msg}
    except requests.RequestException as e:
        error_msg = f"❌ Network error: {e}"
        print(error_msg)
        return {'success': False, 'error': error_msg}
    except Exception as e:
        error_msg = f"❌ Unexpected error: {e}"
        print(error_msg)
        return {'success': False, 'error': error_msg}

def upload_all_blog_posts(tmp_dir="./tmp", api_endpoint="http://127.0.0.1:8080/api/blog"):
    """
    Upload all blog post JSON files from the tmp directory
    
    Args:
        tmp_dir (str): Directory containing blog post JSON files
        api_endpoint (str): Blog API endpoint URL
    
    Returns:
        list: Results of all upload attempts
    """
    tmp_path = Path(tmp_dir)
    if not tmp_path.exists():
        print(f"❌ Temp directory not found: {tmp_dir}")
        return []
    
    # Find all blog post JSON files
    blog_files = list(tmp_path.glob("blog_post_*.json"))
    
    if not blog_files:
        print(f"📝 No blog post files found in {tmp_dir}")
        return []
    
    print(f"🔍 Found {len(blog_files)} blog post file(s)")
    
    results = []
    for blog_file in blog_files:
        print(f"\n📤 Uploading: {blog_file.name}")
        result = upload_blog_post(str(blog_file), api_endpoint)
        results.append({
            'file': blog_file.name,
            'result': result
        })
    
    return results

def main():
    """Main function for command line usage"""
    if len(sys.argv) > 1:
        # Upload specific file
        json_file = sys.argv[1]
        api_endpoint = sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:8080/api/blog"
        upload_blog_post(json_file, api_endpoint)
    else:
        # Upload all files from tmp directory
        current_dir = Path(__file__).parent
        tmp_dir = current_dir / "tmp"
        api_endpoint = "http://127.0.0.1:8080/api/blog"
        
        # Check if dev server is running, fallback to production
        try:
            test_response = requests.get("http://127.0.0.1:8080/test", timeout=5)
            if test_response.status_code == 200:
                print("🚀 Using local dev server")
                api_endpoint = "http://127.0.0.1:8080/api/blog"
            else:
                raise Exception("Dev server not responding")
        except:
            print("🌐 Using production server")
            api_endpoint = "https://srvcflo.com/api/blog"
        
        results = upload_all_blog_posts(str(tmp_dir), api_endpoint)
        
        # Summary
        successful = sum(1 for r in results if r['result'].get('success'))
        total = len(results)
        
        print(f"\n📊 Upload Summary: {successful}/{total} successful")
        
        if successful < total:
            print("\n❌ Failed uploads:")
            for r in results:
                if not r['result'].get('success'):
                    print(f"  - {r['file']}: {r['result'].get('error')}")

if __name__ == "__main__":
    main()