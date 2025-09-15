"""
Minimal canonical content agent for ServiceFlow.

This module provides:
- Safe deferred adapters for optional utilities
- Saving blog JSON for discovery
- A stub X posting helper which stores posts locally for tests
- High-level orchestration to create and upload posts
"""

import importlib
import json
import logging
import os
import time
from datetime import datetime
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

try:
    import requests  # type: ignore
    requests_available = True
except Exception:
    requests_available = False

# staging directory used by the frontend worker to discover posts
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
TMP_DIR = os.path.join(BASE_DIR, 'agent-ui', 'Agents', 'tmp')
os.makedirs(TMP_DIR, exist_ok=True)


def store_data(collection: str, data: dict) -> None:
    """Persist small JSON files for visibility and worker discovery."""
    try:
        path = os.path.join(TMP_DIR, f"{collection}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        with open(path, 'w', encoding='utf-8') as f:
            json.dump({'collection': collection, 'data': data}, f, indent=2, default=str)
    except Exception:
        logger.exception('store_data failed')


class ServiceFlowXTools:
    """Simple, deterministic X post stub used in tests and offline runs."""

    def create_post(self, text: str) -> dict:
        post_id = int(time.time())
        url = f"https://x.com/serviceflow/status/{post_id}"
        res = {'success': True, 'url': url, 'text': text}
        store_data('x_posts', {'post_id': post_id, 'text': text, 'url': url})
        return res

    def reply_to_post(self, parent_id: str, text: str) -> dict:
        try:
            base = int(str(parent_id))
            rid = base + 1
        except Exception:
            rid = int(time.time())
        url = f"https://x.com/serviceflow/status/{rid}"
        res = {'success': True, 'url': url, 'text': text}
        store_data('x_replies', {'in_reply_to': parent_id, 'reply_id': rid, 'text': text})
        return res

    def _ensure_character_limit(self, text: str, limit: int = 280) -> str:
        if len(text) <= limit:
            return text
        return text[:limit-3] + '...'

    def _split_into_thread_parts(self, text: str, part_size: int = 260) -> list:
        if not text:
            return []
        return [text[i:i+part_size] for i in range(0, len(text), part_size)]


def _import_optional(module_name: str):
    try:
        return importlib.import_module(module_name)
    except Exception:
        return None


def get_sonic_finance_snippet(limit_chars: int = 200) -> Optional[str]:
    srt = _import_optional('agent_ui.Agents.sonic_research_team') or _import_optional('sonic_research_team')
    if not srt:
        return None
    try:
        if hasattr(srt, 'get_market_summary'):
            summary = srt.get_market_summary()
        else:
            summary = getattr(srt, 'summarize_latest', lambda: None)()
        if not summary:
            return None
        text = summary if isinstance(summary, str) else json.dumps(summary)
        return text[:limit_chars]
    except Exception:
        logger.exception('get_sonic_finance_snippet failed')
        return None


def get_paintswap_stats(limit_items: int = 3) -> Optional[dict]:
    pt = _import_optional('agent_ui.Agents.paintswap_tools') or _import_optional('paintswap_tools')
    if not pt:
        return None
    try:
        if hasattr(pt, 'get_paintswap_stats'):
            return pt.get_paintswap_stats(limit=limit_items)
        if hasattr(pt, 'fetch_top_collections'):
            return pt.fetch_top_collections(limit_items)
        return None
    except Exception:
        logger.exception('get_paintswap_stats failed')
        return None


def save_blog_json(blog_data: dict, filename: Optional[str] = None) -> Optional[str]:
    try:
        if not filename:
            slug = blog_data.get('title', 'blog').lower().replace(' ', '_')[:40]
            filename = f"blog_{slug}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        path = os.path.join(TMP_DIR, filename)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(blog_data, f, indent=2, ensure_ascii=False)
        return path
    except Exception:
        logger.exception('save_blog_json failed')
        return None


def upload_blog_to_api(blog_data: dict, api_endpoint: str = "https://srvcflo.com/api/blog") -> dict:
    if not requests_available:
        return {'success': False, 'error': 'requests not available'}
    try:
        try:
            r = requests.get('http://127.0.0.1:8080/test', timeout=2)
            if r.status_code == 200:
                api_endpoint = 'http://127.0.0.1:8080/api/blog'
        except Exception:
            pass
        r = requests.post(api_endpoint, json=blog_data, timeout=10)
        if r.status_code == 200:
            return r.json()
        return {'success': False, 'error': f'HTTP {r.status_code}'}
    except Exception as e:
        logger.exception('upload_blog_to_api failed')
        return {'success': False, 'error': str(e)}


def generate_blog_post(topic: str, category: str = "AI Automation") -> dict:
    return {
        'title': topic,
        'content': f"This is a stub post about {topic}.",
        'excerpt': f"Short excerpt about {topic}",
        'category': category,
        'tags': ['AI', 'Automation']
    }


def create_x_announcement(blog_data: dict, slug: Optional[str] = None) -> dict:
    x = ServiceFlowXTools()
    title = blog_data.get('title', 'New Post')
    excerpt = blog_data.get('excerpt', '')[:140]
    url = f"https://srvcflo.com/blog/{slug}" if slug else 'https://srvcflo.com/blog'
    text = f"{title}: {excerpt} Read: {url}"
    text = x._ensure_character_limit(text, limit=260)
    res = x.create_post(text)
    parent = None
    if res.get('url') and '/status/' in res.get('url'):
        parent = res.get('url').split('/status/')[-1]
    thread = thread_blog_on_x(blog_data, parent, x) if parent else None
    return {'announcement': res, 'thread': thread}


def thread_blog_on_x(blog_data: dict, parent_id: str, x_tools: Optional[ServiceFlowXTools] = None, max_parts: int = 6) -> dict:
    if not x_tools:
        x_tools = ServiceFlowXTools()
    content = blog_data.get('content', '')
    parts = x_tools._split_into_thread_parts(content)
    parts = parts[:max_parts]
    results = []
    current = parent_id
    for part in parts:
        text = x_tools._ensure_character_limit(part, limit=280)
        r = x_tools.reply_to_post(current, text)
        results.append(r)
        if r.get('url') and '/status/' in r.get('url'):
            current = r.get('url').split('/status/')[-1]
        time.sleep(0.2)
    return {'parts_posted': len(results), 'results': results}


def post_blog_to_flo_community(blog_data: dict, slug: Optional[str] = None) -> dict:
    try:
        title = blog_data.get('title')
        excerpt = blog_data.get('excerpt', '')[:120]
        url = f"https://srvcflo.com/blog/{slug}" if slug else 'https://srvcflo.com/blog'
        text = f"Community: {title} — {excerpt} Read: {url}"
        x = ServiceFlowXTools()
        res = x.create_post(x._ensure_character_limit(text, limit=260))
        store_data('community_posts', {'title': title, 'url': url, 'post': res})
        return {'success': True, 'result': res}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def create_and_upload_blog_post(topic: str, category: str = "AI Automation", post_to_x: bool = True) -> dict:
    blog = generate_blog_post(topic, category)
    saved = save_blog_json(blog)
    store_data('blogs', {'title': blog.get('title'), 'json': saved, 'timestamp': datetime.now().isoformat()})
    upload = upload_blog_to_api(blog)
    xinfo = None
    if upload.get('success') and post_to_x:
        slug = upload.get('slug')
        xinfo = create_x_announcement(blog, slug)
        try:
            if bool(os.getenv('POST_TO_FLO_COMMUNITY', '0') == '1') or blog.get('post_to_flo_community'):
                post_blog_to_flo_community(blog, slug)
        except Exception:
            pass
    return {'success': upload.get('success', False), 'blog': blog, 'json_path': saved, 'upload': upload, 'x': xinfo}


def trigger_content_creation(data_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
    store_data('content_triggers', {'type': data_type, 'data': data, 'ts': datetime.now().isoformat()})
    return {'status': 'triggered', 'type': data_type}