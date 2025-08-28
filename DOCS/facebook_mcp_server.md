facebook-mcp-server
Public
HagaiHen/facebook-mcp-server
Go to file
t
Name		
HagaiHen
HagaiHen
Merge pull request #5 from HagaiHen/codex/add-efficient-tools-for-con…
f6f502a
 · 
yesterday
.gitignore
initial commit
2 months ago
LICENSE
Create LICENSE
2 months ago
README.md
feat: add comment hiding tools
yesterday
config.py
fix: correct dotenv package and add missing newlines
2 weeks ago
facebook_api.py
feat: add comment hiding tools
yesterday
manager.py
feat: add comment hiding tools
yesterday
requirements.txt
fix: correct dotenv package and add missing newlines
2 weeks ago
server.py
feat: add comment hiding tools
yesterday
Repository files navigation
README
MIT license
Facebook MCP Server
This project is a MCP server for automating and managing interactions on a Facebook Page using the Facebook Graph API. It exposes tools to create posts, moderate comments, fetch post insights, and filter negative feedback — ready to plug into Claude, or other LLM-based agents.


🤖 What Is This?
This MCP provides a suite of AI-callable tools that connect directly to a Facebook Page, abstracting common API operations as LLM-friendly functions.

✅ Benefits
Empowers social media managers to automate moderation and analytics.
Seamlessly integrates with Claude Desktop or any Agent client.
Enables fine-grained control over Facebook content from natural language.
📦 Features
Tool	Description
post_to_facebook	Create a new Facebook post with a message.
reply_to_comment	Reply to a specific comment on a post.
get_page_posts	Retrieve recent posts from the Page.
get_post_comments	Fetch comments on a given post.
delete_post	Delete a specific post by ID.
delete_comment	Delete a specific comment by ID.
hide_comment	Hide a comment from public view.
unhide_comment	Unhide a previously hidden comment.
delete_comment_from_post	Alias for deleting a comment from a specific post.
filter_negative_comments	Filter out comments with negative sentiment keywords.
get_number_of_comments	Count the number of comments on a post.
get_number_of_likes	Count the number of likes on a post.
get_post_impressions	Get total impressions on a post.
get_post_impressions_unique	Get number of unique users who saw the post.
get_post_impressions_paid	Get number of paid impressions on the post.
get_post_impressions_organic	Get number of organic impressions on the post.
get_post_engaged_users	Get number of users who engaged with the post.
get_post_clicks	Get number of clicks on the post.
get_post_reactions_like_total	Get total number of 'Like' reactions.
get_post_top_commenters	Get the top commenters on a post.
post_image_to_facebook	Post an image with a caption to the Facebook page.
send_dm_to_user	Send a direct message to a user.
update_post	Updates an existing post's message.
schedule_post	Schedule a post for future publication.
get_page_fan_count	Retrieve the total number of Page fans.
get_post_share_count	Get the number of shares on a post.
get_post_reactions_breakdown	Get all reaction counts for a post in one call.
bulk_delete_comments	Delete multiple comments by ID.
bulk_hide_comments	Hide multiple comments by ID.
🚀 Setup & Installation
1. Clone the Repository
git clone https://github.com/your-org/facebook-mcp-server.git
cd facebook-mcp-server
2. 🛠️ Installation
Install dependencies using uv, a fast Python package manager: If uv is not already installed, run:

curl -Ls https://astral.sh/uv/install.sh | bash
Once uv is installed, install the project dependencies:

uv pip install -r requirements.txt
3. Set Up Environment
Create a .env file in the root directory and add your Facebook Page credentials. You can obtain these from https://developers.facebook.com/tools/explorer

FACEBOOK_ACCESS_TOKEN=your_facebook_page_access_token
FACEBOOK_PAGE_ID=your_page_id


To set up the FacebookMCP in our client framework and or Claude:

 Edit Config.
In the config file that opens, add the following entry:
"FacebookMCP": {
  "command": "uv",
  "args": [
    "run",
    "--with",
    "mcp[cli]",
    "--with",
    "requests",
    "mcp",
    "run",
    "/path/to/facebook-mcp-server/server.py"
  ]
}
✅ You’re Ready to Go!
That’s it — your Facebook MCP server is now fully configured and ready to power Claude Desktop. You can now post, moderate, and measure engagement all through natural language prompts!



config.py

import os
from dotenv import load_dotenv

load_dotenv()

# Facebook Graph API setup
GRAPH_API_VERSION = "v22.0"
PAGE_ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")
PAGE_ID = os.getenv("FACEBOOK_PAGE_ID")
GRAPH_API_BASE_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"



facebook_api.py

import requests
from typing import Any
from config import GRAPH_API_BASE_URL, PAGE_ID, PAGE_ACCESS_TOKEN


class FacebookAPI:
    # Generic Graph API request method
    def _request(self, method: str, endpoint: str, params: dict[str, Any], json: dict[str, Any] = None) -> dict[str, Any]:
        url = f"{GRAPH_API_BASE_URL}/{endpoint}"
        params["access_token"] = PAGE_ACCESS_TOKEN
        response = requests.request(method, url, params=params, json=json)
        return response.json()

    def post_message(self, message: str) -> dict[str, Any]:
        return self._request("POST", f"{PAGE_ID}/feed", {"message": message})

    def reply_to_comment(self, comment_id: str, message: str) -> dict[str, Any]:
        return self._request("POST", f"{comment_id}/comments", {"message": message})

    def get_posts(self) -> dict[str, Any]:
        return self._request("GET", f"{PAGE_ID}/posts", {"fields": "id,message,created_time"})

    def get_comments(self, post_id: str) -> dict[str, Any]:
        return self._request("GET", f"{post_id}/comments", {"fields": "id,message,from,created_time"})

    def delete_post(self, post_id: str) -> dict[str, Any]:
        return self._request("DELETE", f"{post_id}", {})

    def delete_comment(self, comment_id: str) -> dict[str, Any]:
        return self._request("DELETE", f"{comment_id}", {})

    def hide_comment(self, comment_id: str) -> dict[str, Any]:
        """Hide a comment from the Page."""
        return self._request("POST", f"{comment_id}", {"is_hidden": True})

    def unhide_comment(self, comment_id: str) -> dict[str, Any]:
        """Unhide a previously hidden comment."""
        return self._request("POST", f"{comment_id}", {"is_hidden": False})

    def get_insights(self, post_id: str, metric: str, period: str = "lifetime") -> dict[str, Any]:
        return self._request("GET", f"{post_id}/insights", {"metric": metric, "period": period})

    def get_bulk_insights(self, post_id: str, metrics: list[str], period: str = "lifetime") -> dict[str, Any]:
        metric_str = ",".join(metrics)
        return self.get_insights(post_id, metric_str, period)

    def post_image_to_facebook(self, image_url: str, caption: str) -> dict[str, Any]:
        params = {
            "url": image_url,
            "caption": caption
        }
        return self._request("POST", f"{PAGE_ID}/photos", params)
    
    def send_dm_to_user(self, user_id: str, message: str) -> dict[str, Any]:
        payload = {
            "recipient": {"id": user_id},
            "message": {"text": message},
            "messaging_type": "RESPONSE"
        }
        return self._request("POST", "me/messages", {}, json=payload)
    
    def update_post(self, post_id: str, new_message: str) -> dict[str, Any]:
        return self._request("POST", f"{post_id}", {"message": new_message})

    def schedule_post(self, message: str, publish_time: int) -> dict[str, Any]:
        params = {
            "message": message,
            "published": False,
            "scheduled_publish_time": publish_time,
        }
        return self._request("POST", f"{PAGE_ID}/feed", params)

    def get_page_fan_count(self) -> int:
        data = self._request("GET", f"{PAGE_ID}", {"fields": "fan_count"})
        return data.get("fan_count", 0)

    def get_post_share_count(self, post_id: str) -> int:
        data = self._request("GET", f"{post_id}", {"fields": "shares"})
        return data.get("shares", {}).get("count", 0)



manager.py

from typing import Any
from facebook_api import FacebookAPI


class Manager:
    def __init__(self):
        self.api = FacebookAPI()

    def post_to_facebook(self, message: str) -> dict[str, Any]:
        return self.api.post_message(message)

    def reply_to_comment(self, post_id: str, comment_id: str, message: str) -> dict[str, Any]:
        return self.api.reply_to_comment(comment_id, message)

    def get_page_posts(self) -> dict[str, Any]:
        return self.api.get_posts()

    def get_post_comments(self, post_id: str) -> dict[str, Any]:
        return self.api.get_comments(post_id)

    def delete_post(self, post_id: str) -> dict[str, Any]:
        return self.api.delete_post(post_id)

    def delete_comment(self, comment_id: str) -> dict[str, Any]:
        return self.api.delete_comment(comment_id)

    def hide_comment(self, comment_id: str) -> dict[str, Any]:
        return self.api.hide_comment(comment_id)

    def unhide_comment(self, comment_id: str) -> dict[str, Any]:
        return self.api.unhide_comment(comment_id)

    def delete_comment_from_post(self, post_id: str, comment_id: str) -> dict[str, Any]:
        return self.api.delete_comment(comment_id)

    def filter_negative_comments(self, comments: dict[str, Any]) -> list[dict[str, Any]]:
        keywords = ["bad", "terrible", "awful", "hate", "dislike", "problem", "issue"]
        return [c for c in comments.get("data", []) if any(k in c.get("message", "").lower() for k in keywords)]

    def get_number_of_comments(self, post_id: str) -> int:
        return len(self.api.get_comments(post_id).get("data", []))

    def get_number_of_likes(self, post_id: str) -> int:
        return self.api._request("GET", post_id, {"fields": "likes.summary(true)"}).get("likes", {}).get("summary", {}).get("total_count", 0)

    def get_post_insights(self, post_id: str) -> dict[str, Any]:
        metrics = [
            "post_impressions", "post_impressions_unique", "post_impressions_paid",
            "post_impressions_organic", "post_engaged_users", "post_clicks",
            "post_reactions_like_total", "post_reactions_love_total", "post_reactions_wow_total",
            "post_reactions_haha_total", "post_reactions_sorry_total", "post_reactions_anger_total",
        ]
        return self.api.get_bulk_insights(post_id, metrics)
    
    def get_post_impressions(self, post_id: str) -> dict[str, Any]:
        return self.api.get_insights(post_id, "post_impressions")

    def get_post_impressions_unique(self, post_id: str) -> dict[str, Any]:
        return self.api.get_insights(post_id, "post_impressions_unique")

    def get_post_impressions_paid(self, post_id: str) -> dict[str, Any]:
        return self.api.get_insights(post_id, "post_impressions_paid")

    def get_post_impressions_organic(self, post_id: str) -> dict[str, Any]:
        return self.api.get_insights(post_id, "post_impressions_organic")

    def get_post_engaged_users(self, post_id: str) -> dict[str, Any]:
        return self.api.get_insights(post_id, "post_engaged_users")

    def get_post_clicks(self, post_id: str) -> dict[str, Any]:
        return self.api.get_insights(post_id, "post_clicks")

    def get_post_reactions_like_total(self, post_id: str) -> dict[str, Any]:
        return self.api.get_insights(post_id, "post_reactions_like_total")

    def get_post_reactions_love_total(self, post_id: str) -> dict[str, Any]:
        return self.api.get_insights(post_id, "post_reactions_love_total")

    def get_post_reactions_wow_total(self, post_id: str) -> dict[str, Any]:
        return self.api.get_insights(post_id, "post_reactions_wow_total")

    def get_post_reactions_haha_total(self, post_id: str) -> dict[str, Any]:
        return self.api.get_insights(post_id, "post_reactions_haha_total")

    def get_post_reactions_sorry_total(self, post_id: str) -> dict[str, Any]:
        return self.api.get_insights(post_id, "post_reactions_sorry_total")

    def get_post_reactions_anger_total(self, post_id: str) -> dict[str, Any]:
        return self.api.get_insights(post_id, "post_reactions_anger_total")

    def get_post_top_commenters(self, post_id: str) -> list[dict[str, Any]]:
        comments = self.get_post_comments(post_id).get("data", [])
        counter = {}
        for comment in comments:
            user_id = comment.get("from", {}).get("id")
            if user_id:
                counter[user_id] = counter.get(user_id, 0) + 1
        return sorted([{"user_id": k, "count": v} for k, v in counter.items()], key=lambda x: x["count"], reverse=True)

    def post_image_to_facebook(self, image_url: str, caption: str) -> dict[str, Any]:
        return self.api.post_image_to_facebook(image_url, caption)

    def send_dm_to_user(self, user_id: str, message: str) -> dict[str, Any]:
        return self.api.send_dm_to_user(user_id, message)
    
    def update_post(self, post_id: str, new_message: str) -> dict[str, Any]:
        return self.api.update_post(post_id, new_message)

    def schedule_post(self, message: str, publish_time: int) -> dict[str, Any]:
        return self.api.schedule_post(message, publish_time)

    def get_page_fan_count(self) -> int:
        return self.api.get_page_fan_count()

    def get_post_share_count(self, post_id: str) -> int:
        return self.api.get_post_share_count(post_id)

    def get_post_reactions_breakdown(self, post_id: str) -> dict[str, Any]:
        """Return counts for all reaction types on a post."""
        metrics = [
            "post_reactions_like_total",
            "post_reactions_love_total",
            "post_reactions_wow_total",
            "post_reactions_haha_total",
            "post_reactions_sorry_total",
            "post_reactions_anger_total",
        ]
        raw = self.api.get_bulk_insights(post_id, metrics)
        results: dict[str, Any] = {}
        for item in raw.get("data", []):
            name = item.get("name")
            value = item.get("values", [{}])[0].get("value")
            results[name] = value
        return results

    def bulk_delete_comments(self, comment_ids: list[str]) -> list[dict[str, Any]]:
        """Delete multiple comments and return their results."""
        results = []
        for cid in comment_ids:
            res = self.api.delete_comment(cid)
            results.append({"comment_id": cid, "result": res})
        return results

    def bulk_hide_comments(self, comment_ids: list[str]) -> list[dict[str, Any]]:
        """Hide multiple comments and return their results."""
        results = []
        for cid in comment_ids:
            res = self.api.hide_comment(cid)
            results.append({"comment_id": cid, "result": res})
        return results



requirements.txt

mcp
python-dotenv
requests


server.py

from mcp.server.fastmcp import FastMCP
from manager import Manager
from typing import Any

mcp = FastMCP("FacebookMCP")
manager = Manager()

@mcp.tool()
def post_to_facebook(message: str) -> dict[str, Any]:
    """Create a new Facebook Page post with a text message.
    Input: message (str)
    Output: dict with post ID and creation status
    """
    return manager.post_to_facebook(message)

@mcp.tool()
def reply_to_comment(post_id: str, comment_id: str, message: str) -> dict[str, Any]:
    """Reply to a specific comment on a Facebook post.
    Input: post_id (str), comment_id (str), message (str)
    Output: dict with reply creation status
    """
    return manager.reply_to_comment(post_id, comment_id, message)

@mcp.tool()
def get_page_posts() -> dict[str, Any]:
    """Fetch the most recent posts on the Page.
    Input: None
    Output: dict with list of post objects and metadata
    """
    return manager.get_page_posts()

@mcp.tool()
def get_post_comments(post_id: str) -> dict[str, Any]:
    """Retrieve all comments for a given post.
    Input: post_id (str)
    Output: dict with comment objects
    """
    return manager.get_post_comments(post_id)

@mcp.tool()
def delete_post(post_id: str) -> dict[str, Any]:
    """Delete a specific post from the Facebook Page.
    Input: post_id (str)
    Output: dict with deletion result
    """
    return manager.delete_post(post_id)

@mcp.tool()
def delete_comment(comment_id: str) -> dict[str, Any]:
    """Delete a specific comment from the Page.
    Input: comment_id (str)
    Output: dict with deletion result
    """
    return manager.delete_comment(comment_id)


@mcp.tool()
def hide_comment(comment_id: str) -> dict[str, Any]:
    """Hide a comment from public view."""
    return manager.hide_comment(comment_id)


@mcp.tool()
def unhide_comment(comment_id: str) -> dict[str, Any]:
    """Unhide a previously hidden comment."""
    return manager.unhide_comment(comment_id)

@mcp.tool()
def delete_comment_from_post(post_id: str, comment_id: str) -> dict[str, Any]:
    """Alias to delete a comment on a post.
    Input: post_id (str), comment_id (str)
    Output: dict with deletion result
    """
    return manager.delete_comment_from_post(post_id, comment_id)

@mcp.tool()
def filter_negative_comments(comments: dict[str, Any]) -> list[dict[str, Any]]:
    """Filter comments for basic negative sentiment.
    Input: comments (dict)
    Output: list of flagged negative comments
    """
    return manager.filter_negative_comments(comments)

@mcp.tool()
def get_number_of_comments(post_id: str) -> int:
    """Count the number of comments on a given post.
    Input: post_id (str)
    Output: integer count of comments
    """
    return manager.get_number_of_comments(post_id)

@mcp.tool()
def get_number_of_likes(post_id: str) -> int:
    """Return the number of likes on a post.
    Input: post_id (str)
    Output: integer count of likes
    """
    return manager.get_number_of_likes(post_id)

@mcp.tool()
def get_post_insights(post_id: str) -> dict[str, Any]:
    """Fetch all insights metrics (impressions, reactions, clicks, etc).
    Input: post_id (str)
    Output: dict with multiple metrics and their values
    """
    return manager.get_post_insights(post_id)

@mcp.tool()
def get_post_impressions(post_id: str) -> dict[str, Any]:
    """Fetch total impressions of a post.
    Input: post_id (str)
    Output: dict with total impression count
    """
    return manager.get_post_impressions(post_id)

@mcp.tool()
def get_post_impressions_unique(post_id: str) -> dict[str, Any]:
    """Fetch unique impressions of a post.
    Input: post_id (str)
    Output: dict with unique impression count
    """
    return manager.get_post_impressions_unique(post_id)

@mcp.tool()
def get_post_impressions_paid(post_id: str) -> dict[str, Any]:
    """Fetch paid impressions of a post.
    Input: post_id (str)
    Output: dict with paid impression count
    """
    return manager.get_post_impressions_paid(post_id)

@mcp.tool()
def get_post_impressions_organic(post_id: str) -> dict[str, Any]:
    """Fetch organic impressions of a post.
    Input: post_id (str)
    Output: dict with organic impression count
    """
    return manager.get_post_impressions_organic(post_id)

@mcp.tool()
def get_post_engaged_users(post_id: str) -> dict[str, Any]:
    """Fetch number of engaged users.
    Input: post_id (str)
    Output: dict with engagement count
    """
    return manager.get_post_engaged_users(post_id)

@mcp.tool()
def get_post_clicks(post_id: str) -> dict[str, Any]:
    """Fetch number of post clicks.
    Input: post_id (str)
    Output: dict with click count
    """
    return manager.get_post_clicks(post_id)

@mcp.tool()
def get_post_reactions_like_total(post_id: str) -> dict[str, Any]:
    """Fetch number of 'Like' reactions.
    Input: post_id (str)
    Output: dict with like count
    """
    return manager.get_post_reactions_like_total(post_id)

@mcp.tool()
def get_post_reactions_love_total(post_id: str) -> dict[str, Any]:
    """Fetch number of 'Love' reactions.
    Input: post_id (str)
    Output: dict with love count
    """
    return manager.get_post_reactions_love_total(post_id)

@mcp.tool()
def get_post_reactions_wow_total(post_id: str) -> dict[str, Any]:
    """Fetch number of 'Wow' reactions.
    Input: post_id (str)
    Output: dict with wow count
    """
    return manager.get_post_reactions_wow_total(post_id)

@mcp.tool()
def get_post_reactions_haha_total(post_id: str) -> dict[str, Any]:
    """Fetch number of 'Haha' reactions.
    Input: post_id (str)
    Output: dict with haha count
    """
    return manager.get_post_reactions_haha_total(post_id)

@mcp.tool()
def get_post_reactions_sorry_total(post_id: str) -> dict[str, Any]:
    """Fetch number of 'Sorry' reactions.
    Input: post_id (str)
    Output: dict with sorry count
    """
    return manager.get_post_reactions_sorry_total(post_id)

@mcp.tool()
def get_post_reactions_anger_total(post_id: str) -> dict[str, Any]:
    """Fetch number of 'Anger' reactions.
    Input: post_id (str)
    Output: dict with anger count
    """
    return manager.get_post_reactions_anger_total(post_id)

@mcp.tool()
def get_post_top_commenters(post_id: str) -> list[dict[str, Any]]:
    """Get the top commenters on a post.
    Input: post_id (str)
    Output: list of user IDs with comment counts
    """
    return manager.get_post_top_commenters(post_id)

@mcp.tool()
def post_image_to_facebook(image_url: str, caption: str) -> dict[str, Any]:
    """Post an image with a caption to the Facebook page.
    Input: image_url (str), caption (str)
    Output: dict of post result
    """
    return manager.post_image_to_facebook(image_url, caption)

@mcp.tool()
def send_dm_to_user(user_id: str, message: str) -> dict[str, Any]:
    """Send a direct message to a user.
    Input: user_id (str), message (str)
    Output: dict of result from Messenger API
    """
    return manager.send_dm_to_user(user_id, message)

@mcp.tool()
def update_post(post_id: str, new_message: str) -> dict[str, Any]:
    """Updates an existing post's message.
    Input: post_id (str), new_message (str)
    Output: dict of update result
    """
    return manager.update_post(post_id, new_message)
@mcp.tool()
def schedule_post(message: str, publish_time: int) -> dict[str, Any]:
    """Schedule a new post for future publishing.
    Input: message (str), publish_time (Unix timestamp)
    Output: dict with scheduled post info
    """
    return manager.schedule_post(message, publish_time)

@mcp.tool()
def get_page_fan_count() -> int:
    """Get the Page's total fan/like count.
    Input: None
    Output: integer fan count
    """
    return manager.get_page_fan_count()

@mcp.tool()
def get_post_share_count(post_id: str) -> int:
    """Get the number of shares for a post.
    Input: post_id (str)
    Output: integer share count
    """
    return manager.get_post_share_count(post_id)


@mcp.tool()
def get_post_reactions_breakdown(post_id: str) -> dict[str, Any]:
    """Get counts for all reaction types on a post."""
    return manager.get_post_reactions_breakdown(post_id)


@mcp.tool()
def bulk_delete_comments(comment_ids: list[str]) -> list[dict[str, Any]]:
    """Delete multiple comments by ID."""
    return manager.bulk_delete_comments(comment_ids)


@mcp.tool()
def bulk_hide_comments(comment_ids: list[str]) -> list[dict[str, Any]]:
    """Hide multiple comments by ID."""
    return manager.bulk_hide_comments(comment_ids)
