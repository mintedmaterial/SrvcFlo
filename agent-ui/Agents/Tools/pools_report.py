# Optional DeFAI import with fallback
try:
    from DeFAI.Config import constants
    DEFAI_AVAILABLE = True
except ImportError:
    print("Warning: DeFAI module not available, using fallback configuration")
    DEFAI_AVAILABLE = False
    # Fallback constants using dRPC
    class constants:
        SONIC_RPC = "https://sonic.drpc.org/"
        DEFAULT_GAS_LIMIT = 300000

import json
import httpx
import sqlite3
import os
import time
import requests
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, Callable, List, Optional, Iterator
from agno.agent import Agent, RunResponse
from agno.tools import tool
from agno.workflow import Workflow
from pathlib import Path

from dotenv import load_dotenv

# yaml_knowledge import removed - not used in this module
load_dotenv()

# Setup paths
cwd = Path(__file__).parent.parent
tmp_dir = cwd.joinpath("tmp")
tmp_dir.mkdir(parents=True, exist_ok=True)

# Setup database
db_path = str(tmp_dir.joinpath("financial_data.db"))

# API endpoints
SONIC_PAIRS_URL = "https://v0-frontend-server-setup.vercel.app/api/dex-pairs"
EQUALIZER_POOLS_URL = "https://v0-frontend-server-setup.vercel.app/api/equalizer-pools"
BEETS_POOLS_URL = "https://v0-frontend-server-setup.vercel.app/api/beets-pools"
SHADOW_POOLS_URL = "https://v0-frontend-server-setup.vercel.app/api/shadow-pools"
METRO_POOLS_URL = "https://v0-frontend-server-setup.vercel.app/api/metro-pools"
NEWS_URL = "https://v0-frontend-server-setup.vercel.app/api/news"

# Paintswap constants
PAINTSWAP_API_URL = "https://api.paintswap.finance/v2"
SONIC_CHAIN_ID = 146  # Sonic chain ID
COLLECTIONS = {
    # Add known collections here based on provided examples
    "sonic_lidz": "0xsomeaddress",  # Placeholder; replace with actual if known
    "bandit_kidz": "",# Add more as needed
    "": "",# Add more as needed
    "": "",# Add more as needed
    "": "",# Add more as needed
    "": "",# Add more as needed
    "": "",# Add more as needed
    "": "",# Add more as needed
    "": "",# Add more as needed
    "": "",# Add more as needed
    "": "",# Add more as needed
    "": "",# Add more as needed
    "": "",# Add more as needed
    "": "",# Add more as needed
    "": "",# Add more as needed
    "": "",# Add more as needed
    "": "",# Add more as needed
    "": "",# Add more as needed
}

def init_db_extended():
    """Extended database initialization including pool tables"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Existing tables...
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sonic_pairs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS equalizer_pools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS beets_pools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS shadow_pools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS metro_pools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    conn.commit()
    conn.close()

def store_data(table_name: str, data: Dict):
    """Store data in the database"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute(f'''
    CREATE TABLE IF NOT EXISTS {table_name} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute(f"INSERT INTO {table_name} (data) VALUES (?)", (json.dumps(data),))
    conn.commit()
    conn.close()

def get_latest_data(table_name: str) -> Dict:
    """Get the latest data from the database"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute(f"SELECT data FROM {table_name} ORDER BY timestamp DESC LIMIT 1")
    result = cursor.fetchone()
    
    conn.close()
    
    if result:
        return json.loads(result[0])
    else:
        return {"error": f"No data found in {table_name}", "data": []}

def api_request_hook(function_name: str, function_call: Callable, arguments: Dict[str, Any]):
    """Pre-hook function that logs API requests before execution"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Calling {function_name}")
    try:
        result = function_call(**arguments)
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Completed {function_name}")
        return result
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Error in {function_name}: {str(e)}")
        raise

def init_db():
    """Initialize the basic database tables"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create basic tables
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sonic_pairs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS equalizer_pools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS beets_pools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS shadow_pools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS metro_pools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    conn.commit()
    conn.close()

# Initialize the database
try:
    # Initialize database
    init_db()
except Exception as e:
    print(f"Warning: Error initializing database: {e}")
    
# Initialize extended tables
init_db_extended()

# Data fetch tools
@tool(
    name="fetch_sonic_pairs",
    description="Fetches trading pairs data from Sonic DEX",
    show_result=False,
    cache_results=True,
    cache_ttl=300,  # 5 minutes cache
    tool_hooks=[api_request_hook]
)
def fetch_sonic_pairs() -> Dict:
    """
    Fetch trading pairs data from Sonic DEX API.
    
    Returns:
        Dict: JSON data containing trading pairs information
    """
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Making API call to {SONIC_PAIRS_URL}")
    try:
        response = httpx.get(SONIC_PAIRS_URL, timeout=10)
        response.raise_for_status()  # Raise an exception for 4XX/5XX responses
        data = response.json()
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] API call successful, received {len(data.get('data', []))} items")
        
        # Store data in database
        store_data("sonic_pairs", data)
        
        return data
    except httpx.HTTPStatusError as e:
        error_msg = f"HTTP error: {e.response.status_code}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}
    except httpx.RequestError as e:
        error_msg = f"Request error: {str(e)}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}

@tool(
    name="fetch_equalizer_pools",
    description="Fetches liquidity pool data from Equalizer",
    show_result=False,
    cache_results=True,
    cache_ttl=300,
    tool_hooks=[api_request_hook]
)
def fetch_equalizer_pools() -> Dict:
    """
    Fetch liquidity pool data from Equalizer API.
    
    Returns:
        Dict: JSON data containing Equalizer pools information
    """
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Making API call to {EQUALIZER_POOLS_URL}")
    try:
        response = httpx.get(EQUALIZER_POOLS_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] API call successful, received {len(data.get('data', []))} items")
        
        # Store data in database
        store_data("equalizer_pools", data)
        
        return data
    except httpx.HTTPStatusError as e:
        error_msg = f"HTTP error: {e.response.status_code}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}
    except httpx.RequestError as e:
        error_msg = f"Request error: {str(e)}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}

@tool(
    name="fetch_beets_pools",
    description="Fetches liquidity pool data from Beets",
    show_result=False,
    cache_results=True,
    cache_ttl=300,
    tool_hooks=[api_request_hook]
)
def fetch_beets_pools() -> Dict:
    """
    Fetch liquidity pool data from Beets API.
    
    Returns:
        Dict: JSON data containing Beets pools information
    """
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Making API call to {BEETS_POOLS_URL}")
    try:
        response = httpx.get(BEETS_POOLS_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] API call successful, received {len(data.get('data', []))} items")
        
        # Store data in database
        store_data("beets_pools", data)
        
        return data
    except httpx.HTTPStatusError as e:
        error_msg = f"HTTP error: {e.response.status_code}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}
    except httpx.RequestError as e:
        error_msg = f"Request error: {str(e)}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}

@tool(
    name="fetch_shadow_pools",
    description="Fetches liquidity pool data from Shadow",
    show_result=False,
    cache_results=True,
    cache_ttl=300,
    tool_hooks=[api_request_hook]
)
def fetch_shadow_pools() -> Dict:
    """
    Fetch liquidity pool data from Shadow API.
    
    Returns:
        Dict: JSON data containing Shadow pools information
    """
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Making API call to {SHADOW_POOLS_URL}")
    try:
        response = httpx.get(SHADOW_POOLS_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] API call successful, received {len(data.get('data', []))} items")
        
        # Store data in database
        store_data("shadow_pools", data)
        
        return data
    except httpx.HTTPStatusError as e:
        error_msg = f"HTTP error: {e.response.status_code}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}
    except httpx.RequestError as e:
        error_msg = f"Request error: {str(e)}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}

@tool(
    name="fetch_metro_pools",
    description="Fetches liquidity pool data from Metro",
    show_result=False,
    cache_results=True,
    cache_ttl=300,
    tool_hooks=[api_request_hook]
)
def fetch_metro_pools() -> Dict:
    """
    Fetch liquidity pool data from Metro API.
    
    Returns:
        Dict: JSON data containing Metro pools information
    """
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Making API call to {METRO_POOLS_URL}")
    try:
        response = httpx.get(METRO_POOLS_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] API call successful, received {len(data.get('data', []))} items")
        
        # Store data in database
        store_data("metro_pools", data)
        
        return data
    except httpx.HTTPStatusError as e:
        error_msg = f"HTTP error: {e.response.status_code}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}
    except httpx.RequestError as e:
        error_msg = f"Request error: {str(e)}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}

@tool(
    name="fetch_news",
    description="Fetches news and social sentiment data related to Sonic ecosystem",
    show_result=False,
    cache_results=True,
    cache_ttl=300,
    tool_hooks=[api_request_hook]
)
def fetch_news() -> Dict:
    """
    Fetch news and social sentiment data related to Sonic ecosystem.
    
    Returns:
        Dict: JSON data containing news and sentiment information
    """
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Making API call to {NEWS_URL}")
    try:
        response = httpx.get(NEWS_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] API call successful, received {len(data.get('data', []))} items")
        
        # Store data in database
        store_data("news", data)
        
        return data
    except httpx.HTTPStatusError as e:
        error_msg = f"HTTP error: {e.response.status_code}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}
    except httpx.RequestError as e:
        error_msg = f"Request error: {str(e)}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}")
        return {"error": error_msg, "data": []}

# Database fetch tools
@tool(
    name="get_sonic_pairs",
    description="Gets the latest trading pairs data from the database",
    show_result=False
)
def get_sonic_pairs() -> Dict:
    """
    Get the latest trading pairs data from the database.
    
    Returns:
        Dict: JSON data containing trading pairs information
    """
    return get_latest_data("sonic_pairs")

@tool(
    name="get_equalizer_pools",
    description="Gets the latest Equalizer pools data from the database",
    show_result=False
)
def get_equalizer_pools() -> Dict:
    """
    Get the latest Equalizer pools data from the database.
    
    Returns:
        Dict: JSON data containing Equalizer pools information
    """
    return get_latest_data("equalizer_pools")

@tool(
    name="get_beets_pools",
    description="Gets the latest Beets pools data from the database",
    show_result=False
)
def get_beets_pools() -> Dict:
    """
    Get the latest Beets pools data from the database.
    
    Returns:
        Dict: JSON data containing Beets pools information
    """
    return get_latest_data("beets_pools")

@tool(
    name="get_shadow_pools",
    description="Gets the latest Shadow pools data from the database",
    show_result=False
)
def get_shadow_pools() -> Dict:
    """
    Get the latest Shadow pools data from the database.
    
    Returns:
        Dict: JSON data containing Shadow pools information
    """
    return get_latest_data("shadow_pools")

@tool(
    name="get_metro_pools",
    description="Gets the latest Metro pools data from the database",
    show_result=False
)
def get_metro_pools() -> Dict:
    """
    Get the latest Metro pools data from the database.
    
    Returns:
        Dict: JSON data containing Metro pools information
    """
    return get_latest_data("metro_pools")

@tool(
    name="get_news",
    description="Gets the latest news data from the database",
    show_result=False
)
def get_news() -> Dict:
    """
    Get the latest news data from the database.
    
    Returns:
        Dict: JSON data containing news information
    """
    return get_latest_data("news")

# Paintswap NFT Tools (replacing Codex NFT tools)
@tool(
    name="get_listed_nfts",
    description="Gets listed NFTs on Paintswap marketplace",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_listed_nfts(limit: int = 10, collection: Optional[str] = None) -> Dict:
    """
    Get listed NFTs on the marketplace.
    
    Args:
        limit: Maximum number of listings to return
        collection: Collection address or name to filter by
        
    Returns:
        Dict with the API response
    """
    params = {"limit": limit}
    
    if collection:
        if collection in COLLECTIONS:
            params["collection"] = COLLECTIONS[collection]
        elif collection.startswith("0x"):
            params["collection"] = collection
        else:
            params["search"] = collection
    
    try:
        response = httpx.get(f"{PAINTSWAP_API_URL}/sales/", params=params)
        response.raise_for_status()
        data = response.json()
        store_data("listed_nfts", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": []}

@tool(
    name="search_listings",
    description="Search for listings on Paintswap by term",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def search_listings(search_term: str, limit: int = 10) -> Dict:
    """
    Search for listings by collection name or other search terms.
    
    Args:
        search_term: Term to search for
        limit: Maximum number of listings to return
        
    Returns:
        Dict with the API response
    """
    if search_term in COLLECTIONS:
        params = {"collection": COLLECTIONS[search_term], "limit": limit}
    else:
        params = {"search": search_term, "limit": limit}
    
    try:
        response = httpx.get(f"{PAINTSWAP_API_URL}/sales/", params=params)
        response.raise_for_status()
        data = response.json()
        store_data("search_listings", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": []}

@tool(
    name="get_marketplace_stats",
    description="Gets stats for the Paintswap marketplace",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_marketplace_stats(chain_id: int = SONIC_CHAIN_ID) -> Dict:
    """
    Get stats for the marketplace.
    
    Args:
        chain_id: Chain ID to get stats for
        
    Returns:
        Dict with the API response
    """
    params = {"chainId": chain_id}
    
    try:
        response = httpx.get(f"{PAINTSWAP_API_URL}/sales/stats", params=params)
        response.raise_for_status()
        data = response.json()
        store_data("marketplace_stats", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": {}}

@tool(
    name="get_collection_metadata",
    description="Gets metadata for a Paintswap collection",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_collection_metadata(collection: str) -> Dict:
    """
    Get metadata for a collection.
    
    Args:
        collection: Collection address or name
        
    Returns:
        Dict with the API response
    """
    if collection in COLLECTIONS:
        collection = COLLECTIONS[collection]
    
    try:
        response = httpx.get(f"{PAINTSWAP_API_URL}/metadata/{collection}")
        response.raise_for_status()
        data = response.json()
        store_data(f"collection_metadata_{collection}", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": {}}

@tool(
    name="get_marketplace_day_data",
    description="Gets Paintswap marketplace stats per day",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_marketplace_day_data() -> Dict:
    """
    Get marketplace stats per day.
    
    Returns:
        Dict with the API response
    """
    try:
        response = httpx.get(f"{PAINTSWAP_API_URL}/marketplaceDayDatas")
        response.raise_for_status()
        data = response.json()
        store_data("marketplace_day_data", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": []}

@tool(
    name="get_brush_day_data",
    description="Gets Brush token day data on Paintswap",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_brush_day_data() -> Dict:
    """
    Get Brush token day data.
    
    Returns:
        Dict with the API response
    """
    try:
        response = httpx.get(f"{PAINTSWAP_API_URL}/brushDayDatas")
        response.raise_for_status()
        data = response.json()
        store_data("brush_day_data", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": []}

@tool(
    name="get_brush_circulating_supply",
    description="Gets Brush token circulating supply on Paintswap",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_brush_circulating_supply() -> Dict:
    """
    Get the Brush token circulating supply.
    
    Returns:
        Dict with the API response
    """
    try:
        response = httpx.get(f"{PAINTSWAP_API_URL}/stats/circulatingSupply")
        response.raise_for_status()
        data = response.json()
        store_data("brush_circulating_supply", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": {}}

@tool(
    name="get_brush_burned_supply",
    description="Gets Brush token burned supply on Paintswap",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_brush_burned_supply() -> Dict:
    """
    Get the Brush token burned supply.
    
    Returns:
        Dict with the API response
    """
    try:
        response = httpx.get(f"{PAINTSWAP_API_URL}/stats/burnedSupply")
        response.raise_for_status()
        data = response.json()
        store_data("brush_burned_supply", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": {}}

@tool(
    name="get_paintswap_stats",
    description="Gets various statistics about Paintswap",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_paintswap_stats() -> Dict:
    """
    Get various statistics about Paintswap.
    
    Returns:
        Dict with the API response
    """
    try:
        response = httpx.get(f"{PAINTSWAP_API_URL}/stats")
        response.raise_for_status()
        data = response.json()
        store_data("paintswap_stats", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": {}}

@tool(
    name="get_all_swaps",
    description="Gets all P2P swaps on Paintswap",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_all_swaps(limit: int = 10) -> Dict:
    """
    Get all P2P swaps.
    
    Args:
        limit: Maximum number of swaps to return
        
    Returns:
        Dict with the API response
    """
    params = {"chainId": FANTOM_CHAIN_ID, "limit": limit}
    
    try:
        response = httpx.get(f"{PAINTSWAP_API_URL}/p2p", params=params)
        response.raise_for_status()
        data = response.json()
        store_data("all_swaps", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": []}

@tool(
    name="get_p2p_swap_stats",
    description="Gets stats about P2P swaps on Paintswap",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_p2p_swap_stats() -> Dict:
    """
    Get stats about P2P swaps.
    
    Returns:
        Dict with the API response
    """
    params = {"chainid": FANTOM_CHAIN_ID}
    
    try:
        response = httpx.get(f"{PAINTSWAP_API_URL}/p2p/info", params=params)
        response.raise_for_status()
        data = response.json()
        store_data("p2p_swap_stats", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": {}}

@tool(
    name="get_launchpad_projects",
    description="Gets launchpad projects on Paintswap",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_launchpad_projects() -> Dict:
    """
    Get launchpad projects.
    
    Returns:
        Dict with the API response
    """
    try:
        response = httpx.get(f"{PAINTSWAP_API_URL}/launchpad/projects")
        response.raise_for_status()
        data = response.json()
        store_data("launchpad_projects", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": []}

@tool(
    name="get_launchpad_core_data",
    description="Gets NFT paintswap launchpad core data",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_launchpad_core_data() -> Dict:
    """
    Get NFT paintswap launchpad core data.
    
    Returns:
        Dict with the API response
    """
    params = {"chainId": FANTOM_CHAIN_ID}
    
    try:
        response = httpx.get(f"{PAINTSWAP_API_URL}/launchpad/coreData/", params=params)
        response.raise_for_status()
        data = response.json()
        store_data("launchpad_core_data", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": {}}

@tool(
    name="get_bids",
    description="Gets Paintswap bids",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_bids(limit: int = 10) -> Dict:
    """
    Get Paintswap bids.
    
    Args:
        limit: Maximum number of bids to return
        
    Returns:
        Dict with the API response
    """
    params = {"limit": limit}
    
    try:
        response = httpx.get(f"{PAINTSWAP_API_URL}/bids", params=params)
        response.raise_for_status()
        data = response.json()
        store_data("bids", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": []}

@tool(
    name="get_purchases",
    description="Gets Paintswap purchases",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_purchases(limit: int = 10) -> Dict:
    """
    Get Paintswap purchases.
    
    Args:
        limit: Maximum number of purchases to return
        
    Returns:
        Dict with the API response
    """
    params = {"limit": limit}
    
    try:
        response = httpx.get(f"{PAINTSWAP_API_URL}/purchases/", params=params)
        response.raise_for_status()
        data = response.json()
        store_data("purchases", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": []}

@tool(
    name="get_collections_by_volume",
    description="Gets NFT collections sorted by trading volume on Paintswap",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_collections_by_volume(limit: int = 5) -> Dict:
    """
    Get NFT collections sorted by trading volume.
    
    Args:
        limit: Maximum number of collections to return
        
    Returns:
        Dict with the API response
    """
    try:
        url = f"{PAINTSWAP_API_URL}/collections?sort=volume&order=desc&limit={limit}"
        response = httpx.get(url)
        response.raise_for_status()
        collections_data = response.json()
        collections = collections_data.get("collections", [])
        processed_collections = []
        for collection in collections:
            processed = {
                "address": collection.get("tokenAddress", ""),
                "name": collection.get("name", "Unknown"),
                "volume": collection.get("volume", 0),
                "sales_count": collection.get("swapCount", 0),
                "floor_price": collection.get("floorPrice", 0),
                "items_count": collection.get("totalSupply", 0)
            }
            processed_collections.append(processed)
        data = {"collections": processed_collections}
        store_data("collections_by_volume", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": []}

@tool(
    name="get_top_nft_sales",
    description="Gets top NFT sales by price on Paintswap",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_top_nft_sales(limit: int = 5, time_period: str = "24h") -> Dict:
    """
    Get top NFT sales by price.
    
    Args:
        limit: Maximum number of sales to return
        time_period: Time period to consider (24h, 7d, 30d, all)
        
    Returns:
        Dict with the API response
    """
    try:
        sales_result = get_listed_nfts(limit=100)
        sales_data = sales_result.get("sales", [])
        processed_sales = []
        for sale in sales_data:
            if not isinstance(sale, dict):
                continue
            collection = sale.get("collection", {})
            if not collection:
                continue
            price = 0
            try:
                price = float(sale.get("price", 0))
            except (ValueError, TypeError):
                price = 0
            if price <= 0:
                continue
            processed_sale = {
                "collection": {
                    "name": collection.get("name", "Unknown"),
                    "address": collection.get("address", "")
                },
                "tokenId": sale.get("tokenId", ""),
                "price": str(price),
                "buyer": sale.get("buyer", ""),
                "seller": sale.get("seller", ""),
                "timestamp": sale.get("timestamp", "")
            }
            processed_sales.append(processed_sale)
        if not processed_sales:
            return {"sales": []}
        processed_sales.sort(key=lambda x: float(x["price"]), reverse=True)
        sales = processed_sales[:limit]
        data = {"sales": sales}
        store_data("top_nft_sales", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": []}

@tool(
    name="get_collection_floor_price",
    description="Gets the floor price for a Paintswap collection",
    show_result=False,
    cache_results=True,
    cache_ttl=300
)
def get_collection_floor_price(collection_address: str) -> Dict:
    """
    Get the floor price for a collection.
    
    Args:
        collection_address: The address of the collection or a known collection name
        
    Returns:
        Dict with the API response
    """
    try:
        if collection_address in COLLECTIONS:
            collection_address = COLLECTIONS[collection_address]
        collection_metadata = get_collection_metadata(collection_address)
        floor_price = 0
        collection_name = "Unknown"
        if isinstance(collection_metadata, dict):
            collection_name = collection_metadata.get("name", collection_name)
            floor_price = collection_metadata.get("floorPrice", 0)
        data = {
            "collection": {
                "name": collection_name,
                "address": collection_address
            },
            "floor_price": floor_price
        }
        store_data(f"collection_floor_price_{collection_address}", data)
        return data
    except Exception as e:
        return {"error": str(e), "data": {}}

@tool(
    name="generate_nft_market_report",
    description="Generates a comprehensive report on the NFT market using Paintswap data",
    show_result=True
)
def generate_nft_market_report() -> str:
    """
    Generate a comprehensive report on the NFT market.
    
    Returns:
        str: Formatted report
    """
    try:
        stats = get_marketplace_stats()
        collections = get_collections_by_volume(limit=5)
        sales = get_top_nft_sales(limit=5)
        listings = get_listed_nfts(limit=5)
        purchases_data = get_purchases(limit=5)
        brush_supply = get_brush_circulating_supply()
        brush_burned = get_brush_burned_supply()
        brush_day_data = get_brush_day_data()
        
        report = f"## NFT Market Report (Paintswap)\n\n"
        report += "### Marketplace Stats\n"
        report += json.dumps(stats, indent=2) + "\n\n"
        
        report += "### Top Collections by Volume\n"
        report += json.dumps(collections, indent=2) + "\n\n"
        
        report += "### Top Sales\n"
        report += json.dumps(sales, indent=2) + "\n\n"
        
        report += "### Recent Listings\n"
        report += json.dumps(listings.get("sales", [])[:5], indent=2) + "\n\n"
        
        report += "### Recent Purchases\n"
        report += json.dumps(purchases_data.get("purchases", [])[:5], indent=2) + "\n\n"
        
        report += "### Brush Data\n"
        report += f"Circulating Supply: {json.dumps(brush_supply, indent=2)}\n"
        report += f"Burned Supply: {json.dumps(brush_burned, indent=2)}\n"
        report += f"Day Data: {json.dumps(brush_day_data, indent=2)}\n"
        
        return report
    except Exception as e:
        return f"Error generating report: {str(e)}"

# ===== Create Agent Function =====
def create_sonic_agent():
    """Create an agent with all the Sonic ecosystem tools."""
    tools = [
        fetch_sonic_pairs,
        fetch_equalizer_pools,
        fetch_beets_pools,
        fetch_shadow_pools,
        fetch_metro_pools,
        fetch_news,
        get_listed_nfts,
        search_listings,
        get_marketplace_stats,
        get_collection_metadata,
        get_marketplace_day_data,
        get_brush_day_data,
        get_brush_circulating_supply,
        get_brush_burned_supply,
        get_paintswap_stats,
        get_all_swaps,
        get_p2p_swap_stats,
        get_launchpad_projects,
        get_launchpad_core_data,
        get_bids,
        get_purchases,
        get_collections_by_volume,
        get_top_nft_sales,
        get_collection_floor_price,
        generate_nft_market_report,
        # Add existing analysis tools if defined (e.g., analyze_trading_pairs, etc.)
        # Assuming they are defined elsewhere in the original code
        # analyze_trading_pairs,
        # analyze_liquidity_pools,
        # analyze_news,
        # generate_ecosystem_report,
        # compile_ecosystem_report,
    ]
    
    agent = Agent(
        tools=tools,
        show_tool_calls=True,
        markdown=True
    )
    
    return agent

# ===== Main Execution =====
if __name__ == "__main__":
    # Create standalone agent
    agent = create_sonic_agent()
    
    # Example prompt
    prompt = """Generate a comprehensive report on the Sonic ecosystem.
    Include analysis of trading pairs, liquidity pools, and current market sentiment."""
    
    # Run agent with the prompt
    agent.print_response(prompt, stream=True)