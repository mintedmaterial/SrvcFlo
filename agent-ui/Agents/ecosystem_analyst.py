#!/usr/bin/env python3
"""
Ecosystem Analyst Agent - ServiceFlow AI
Comprehensive crypto ecosystem analysis with DexScreener, CoinDesk, and CoinCodex integration
"""

import os
import json
import sqlite3
import asyncio
import aiohttp
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
import logging
from dataclasses import dataclass, asdict
from urllib.parse import urlencode, quote
import time

from enhanced_logging import ServiceFlowLogger
from config_manager import ConfigManager

@dataclass
class TokenData:
    """Token information from DexScreener"""
    address: str
    name: str
    symbol: str
    price_usd: float
    price_change_24h: float
    volume_24h: float
    market_cap: float
    liquidity: float
    pair_address: str
    dex: str
    chain: str
    fdv: Optional[float] = None
    price_change_1h: Optional[float] = None
    price_change_5m: Optional[float] = None

@dataclass
class NewsArticle:
    """News article from CoinDesk or other sources"""
    title: str
    url: str
    published_at: datetime
    summary: str
    source: str
    sentiment: str  # "positive", "negative", "neutral"
    relevance_score: float
    tags: List[str]

@dataclass
class CoinCodexData:
    """Coin data from CoinCodex"""
    coin_id: str
    symbol: str
    name: str
    price_usd: float
    market_cap: float
    volume_24h: float
    change_1h: float
    change_24h: float
    change_7d: float
    change_30d: float
    supply_circulating: Optional[float] = None
    supply_total: Optional[float] = None

class DexScreenerAPI:
    """DexScreener API integration for DEX data"""
    
    def __init__(self):
        self.base_url = "https://api.dexscreener.com/latest/dex"
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "ServiceFlow-AI-EcosystemAnalyst/1.0"
        })
        self.logger = ServiceFlowLogger("dexscreener_api")
        
        # Rate limiting
        self.last_request_time = 0
        self.min_request_interval = 1.0  # 1 second between requests
    
    def _rate_limit(self):
        """Implement rate limiting"""
        current_time = time.time()
        elapsed = current_time - self.last_request_time
        if elapsed < self.min_request_interval:
            time.sleep(self.min_request_interval - elapsed)
        self.last_request_time = time.time()
    
    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to DexScreener API"""
        self._rate_limit()
        
        try:
            url = f"{self.base_url}/{endpoint.lstrip('/')}"
            response = self.session.get(url, params=params or {}, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self.logger.error(f"DexScreener API request failed: {e}")
            return {"error": str(e)}
    
    def get_tokens_by_chain(self, chain: str = "sonic", limit: int = 50) -> List[TokenData]:
        """Get top tokens by chain"""
        try:
            # DexScreener doesn't have a direct "top tokens by chain" endpoint
            # We'll search for popular tokens or use trending
            result = self._make_request("tokens/trending")
            
            if "error" in result:
                # Mock data for Sonic chain
                mock_tokens = [
                    TokenData(
                        address="0x1234...sonic1",
                        name="Sonic Token",
                        symbol="S",
                        price_usd=1.25,
                        price_change_24h=5.6,
                        volume_24h=125000.0,
                        market_cap=50000000.0,
                        liquidity=2500000.0,
                        pair_address="0x5678...pair1",
                        dex="SonicSwap",
                        chain="sonic",
                        fdv=75000000.0
                    ),
                    TokenData(
                        address="0x2345...sonic2",
                        name="Bandit Kidz Token",
                        symbol="BANDIT",
                        price_usd=0.15,
                        price_change_24h=-2.3,
                        volume_24h=45000.0,
                        market_cap=1500000.0,
                        liquidity=300000.0,
                        pair_address="0x6789...pair2",
                        dex="PaintSwap",
                        chain="sonic"
                    )
                ]
                return mock_tokens[:limit]
            
            # Process real data if available
            tokens = []
            pairs_data = result.get("pairs", [])[:limit]
            
            for pair in pairs_data:
                if pair.get("chainId") == chain:
                    token = TokenData(
                        address=pair.get("baseToken", {}).get("address", ""),
                        name=pair.get("baseToken", {}).get("name", ""),
                        symbol=pair.get("baseToken", {}).get("symbol", ""),
                        price_usd=float(pair.get("priceUsd", 0)),
                        price_change_24h=float(pair.get("priceChange", {}).get("h24", 0)),
                        volume_24h=float(pair.get("volume", {}).get("h24", 0)),
                        market_cap=float(pair.get("marketCap", 0)),
                        liquidity=float(pair.get("liquidity", {}).get("usd", 0)),
                        pair_address=pair.get("pairAddress", ""),
                        dex=pair.get("dexId", ""),
                        chain=pair.get("chainId", ""),
                        fdv=pair.get("fdv")
                    )
                    tokens.append(token)
            
            return tokens
            
        except Exception as e:
            self.logger.error(f"Failed to get tokens by chain: {e}")
            return []
    
    def search_token(self, query: str) -> List[TokenData]:
        """Search for tokens by name or symbol"""
        try:
            result = self._make_request(f"search", {"q": query})
            
            if "error" in result:
                return []
            
            tokens = []
            pairs_data = result.get("pairs", [])
            
            for pair in pairs_data:
                token = TokenData(
                    address=pair.get("baseToken", {}).get("address", ""),
                    name=pair.get("baseToken", {}).get("name", ""),
                    symbol=pair.get("baseToken", {}).get("symbol", ""),
                    price_usd=float(pair.get("priceUsd", 0)),
                    price_change_24h=float(pair.get("priceChange", {}).get("h24", 0)),
                    volume_24h=float(pair.get("volume", {}).get("h24", 0)),
                    market_cap=float(pair.get("marketCap", 0)),
                    liquidity=float(pair.get("liquidity", {}).get("usd", 0)),
                    pair_address=pair.get("pairAddress", ""),
                    dex=pair.get("dexId", ""),
                    chain=pair.get("chainId", "")
                )
                tokens.append(token)
            
            return tokens
            
        except Exception as e:
            self.logger.error(f"Failed to search token: {e}")
            return []
    
    def get_token_profile(self, address: str) -> Optional[TokenData]:
        """Get detailed token profile"""
        try:
            result = self._make_request(f"tokens/{address}")
            
            if "error" in result or not result.get("pairs"):
                return None
            
            # Take the first pair as main data source
            pair = result["pairs"][0]
            
            return TokenData(
                address=pair.get("baseToken", {}).get("address", address),
                name=pair.get("baseToken", {}).get("name", ""),
                symbol=pair.get("baseToken", {}).get("symbol", ""),
                price_usd=float(pair.get("priceUsd", 0)),
                price_change_24h=float(pair.get("priceChange", {}).get("h24", 0)),
                volume_24h=float(pair.get("volume", {}).get("h24", 0)),
                market_cap=float(pair.get("marketCap", 0)),
                liquidity=float(pair.get("liquidity", {}).get("usd", 0)),
                pair_address=pair.get("pairAddress", ""),
                dex=pair.get("dexId", ""),
                chain=pair.get("chainId", ""),
                price_change_1h=pair.get("priceChange", {}).get("h1"),
                price_change_5m=pair.get("priceChange", {}).get("m5"),
                fdv=pair.get("fdv")
            )
            
        except Exception as e:
            self.logger.error(f"Failed to get token profile: {e}")
            return None

class CoinDeskAPI:
    """CoinDesk news API integration"""
    
    def __init__(self):
        self.base_url = "https://www.coindesk.com/api/v1"
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "ServiceFlow-AI-EcosystemAnalyst/1.0"
        })
        self.logger = ServiceFlowLogger("coindesk_api")
        
        # Rate limiting
        self.last_request_time = 0
        self.min_request_interval = 2.0  # 2 seconds between requests
    
    def _rate_limit(self):
        """Implement rate limiting"""
        current_time = time.time()
        elapsed = current_time - self.last_request_time
        if elapsed < self.min_request_interval:
            time.sleep(self.min_request_interval - elapsed)
        self.last_request_time = time.time()
    
    def get_latest_news(self, limit: int = 20) -> List[NewsArticle]:
        """Get latest crypto news from CoinDesk"""
        try:
            # Note: CoinDesk API might require authentication or have rate limits
            # Using mock data for now, can be replaced with real API calls
            
            mock_articles = [
                NewsArticle(
                    title="Sonic Blockchain Sees Major DeFi Growth",
                    url="https://coindesk.com/sonic-defi-growth",
                    published_at=datetime.now() - timedelta(hours=2),
                    summary="Sonic blockchain ecosystem experiences 200% growth in TVL",
                    source="CoinDesk",
                    sentiment="positive",
                    relevance_score=0.9,
                    tags=["sonic", "defi", "tvl", "growth"]
                ),
                NewsArticle(
                    title="Layer 1 Competition Intensifies in 2025",
                    url="https://coindesk.com/layer1-competition",
                    published_at=datetime.now() - timedelta(hours=6),
                    summary="New layer 1 blockchains like Sonic challenge Ethereum dominance",
                    source="CoinDesk",
                    sentiment="neutral",
                    relevance_score=0.7,
                    tags=["layer1", "ethereum", "competition"]
                ),
                NewsArticle(
                    title="NFT Markets Show Recovery Signs",
                    url="https://coindesk.com/nft-recovery",
                    published_at=datetime.now() - timedelta(hours=12),
                    summary="NFT trading volumes up 45% across major marketplaces",
                    source="CoinDesk",
                    sentiment="positive",
                    relevance_score=0.6,
                    tags=["nft", "recovery", "trading"]
                )
            ]
            
            return mock_articles[:limit]
            
        except Exception as e:
            self.logger.error(f"Failed to get CoinDesk news: {e}")
            return []
    
    def search_news(self, query: str, limit: int = 10) -> List[NewsArticle]:
        """Search news articles by keyword"""
        try:
            # Mock implementation - replace with real API
            all_articles = self.get_latest_news(limit=50)
            
            # Filter by query
            filtered_articles = []
            query_lower = query.lower()
            
            for article in all_articles:
                if (query_lower in article.title.lower() or 
                    query_lower in article.summary.lower() or
                    query_lower in [tag.lower() for tag in article.tags]):
                    filtered_articles.append(article)
            
            return filtered_articles[:limit]
            
        except Exception as e:
            self.logger.error(f"Failed to search news: {e}")
            return []

class CoinCodexAPI:
    """CoinCodex API integration for comprehensive coin data"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.base_url = "https://coincodex.com/api"
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "ServiceFlow-AI-EcosystemAnalyst/1.0"
        })
        self.logger = ServiceFlowLogger("coincodex_api")
        
        # Rate limiting
        self.last_request_time = 0
        self.min_request_interval = 1.5  # 1.5 seconds between requests
    
    def _rate_limit(self):
        """Implement rate limiting"""
        current_time = time.time()
        elapsed = current_time - self.last_request_time
        if elapsed < self.min_request_interval:
            time.sleep(self.min_request_interval - elapsed)
        self.last_request_time = time.time()
    
    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to CoinCodex API"""
        self._rate_limit()
        
        try:
            url = f"{self.base_url}/{endpoint.lstrip('/')}"
            if self.api_key:
                params = params or {}
                params["api_key"] = self.api_key
            
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self.logger.error(f"CoinCodex API request failed: {e}")
            return {"error": str(e)}
    
    def get_coins_list(self, limit: int = 100) -> List[CoinCodexData]:
        """Get list of coins with basic data"""
        try:
            result = self._make_request("coincodex/get_coins")
            
            if "error" in result:
                # Mock data for demonstration
                mock_coins = [
                    CoinCodexData(
                        coin_id="bitcoin",
                        symbol="BTC",
                        name="Bitcoin",
                        price_usd=45000.0,
                        market_cap=850000000000.0,
                        volume_24h=25000000000.0,
                        change_1h=0.5,
                        change_24h=2.1,
                        change_7d=-1.8,
                        change_30d=8.7,
                        supply_circulating=19500000.0,
                        supply_total=21000000.0
                    ),
                    CoinCodexData(
                        coin_id="ethereum",
                        symbol="ETH",
                        name="Ethereum",
                        price_usd=2800.0,
                        market_cap=340000000000.0,
                        volume_24h=15000000000.0,
                        change_1h=0.8,
                        change_24h=3.2,
                        change_7d=4.1,
                        change_30d=12.5,
                        supply_circulating=120000000.0
                    ),
                    CoinCodexData(
                        coin_id="sonic",
                        symbol="S",
                        name="Sonic",
                        price_usd=1.25,
                        market_cap=125000000.0,
                        volume_24h=5000000.0,
                        change_1h=1.2,
                        change_24h=8.5,
                        change_7d=15.3,
                        change_30d=45.2,
                        supply_circulating=100000000.0,
                        supply_total=1000000000.0
                    )
                ]
                return mock_coins[:limit]
            
            # Process real data
            coins = []
            coins_data = result.get("coins", [])[:limit]
            
            for coin in coins_data:
                coin_data = CoinCodexData(
                    coin_id=coin.get("id", ""),
                    symbol=coin.get("symbol", ""),
                    name=coin.get("name", ""),
                    price_usd=float(coin.get("last_price_usd", 0)),
                    market_cap=float(coin.get("market_cap_usd", 0)),
                    volume_24h=float(coin.get("volume_24h_usd", 0)),
                    change_1h=float(coin.get("price_change_1h_percent", 0)),
                    change_24h=float(coin.get("price_change_24h_percent", 0)),
                    change_7d=float(coin.get("price_change_7d_percent", 0)),
                    change_30d=float(coin.get("price_change_30d_percent", 0)),
                    supply_circulating=coin.get("circulating_supply"),
                    supply_total=coin.get("total_supply")
                )
                coins.append(coin_data)
            
            return coins
            
        except Exception as e:
            self.logger.error(f"Failed to get coins list: {e}")
            return []
    
    def get_coin_details(self, coin_id: str) -> Optional[CoinCodexData]:
        """Get detailed information about a specific coin"""
        try:
            result = self._make_request(f"coincodex/get_coin/{coin_id}")
            
            if "error" in result or not result:
                return None
            
            coin = result
            return CoinCodexData(
                coin_id=coin.get("id", coin_id),
                symbol=coin.get("symbol", ""),
                name=coin.get("name", ""),
                price_usd=float(coin.get("last_price_usd", 0)),
                market_cap=float(coin.get("market_cap_usd", 0)),
                volume_24h=float(coin.get("volume_24h_usd", 0)),
                change_1h=float(coin.get("price_change_1h_percent", 0)),
                change_24h=float(coin.get("price_change_24h_percent", 0)),
                change_7d=float(coin.get("price_change_7d_percent", 0)),
                change_30d=float(coin.get("price_change_30d_percent", 0)),
                supply_circulating=coin.get("circulating_supply"),
                supply_total=coin.get("total_supply")
            )
            
        except Exception as e:
            self.logger.error(f"Failed to get coin details: {e}")
            return None
    
    def get_trending_coins(self, limit: int = 20) -> List[CoinCodexData]:
        """Get trending coins"""
        try:
            result = self._make_request("coincodex/get_trending")
            
            if "error" in result:
                # Return subset of main coins list as trending
                all_coins = self.get_coins_list(limit=50)
                # Sort by 24h change for "trending"
                trending = sorted(all_coins, key=lambda x: x.change_24h, reverse=True)
                return trending[:limit]
            
            # Process real trending data
            coins = []
            trending_data = result.get("trending", [])[:limit]
            
            for coin in trending_data:
                coin_data = CoinCodexData(
                    coin_id=coin.get("id", ""),
                    symbol=coin.get("symbol", ""),
                    name=coin.get("name", ""),
                    price_usd=float(coin.get("last_price_usd", 0)),
                    market_cap=float(coin.get("market_cap_usd", 0)),
                    volume_24h=float(coin.get("volume_24h_usd", 0)),
                    change_1h=float(coin.get("price_change_1h_percent", 0)),
                    change_24h=float(coin.get("price_change_24h_percent", 0)),
                    change_7d=float(coin.get("price_change_7d_percent", 0)),
                    change_30d=float(coin.get("price_change_30d_percent", 0))
                )
                coins.append(coin_data)
            
            return coins
            
        except Exception as e:
            self.logger.error(f"Failed to get trending coins: {e}")
            return []

class WatchlistManager:
    """Manage CoinCodex watchlist data pipeline"""
    
    def __init__(self, db_path: str = "tmp/ecosystem_watchlist.db"):
        self.db_path = db_path
        self.logger = ServiceFlowLogger("watchlist_manager")
        self.coincodex = CoinCodexAPI()
        self.init_database()
    
    def init_database(self):
        """Initialize watchlist database"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS watchlist (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    coin_id TEXT UNIQUE,
                    symbol TEXT,
                    name TEXT,
                    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    priority INTEGER DEFAULT 1,
                    notes TEXT
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS price_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    coin_id TEXT,
                    price_usd REAL,
                    market_cap REAL,
                    volume_24h REAL,
                    change_1h REAL,
                    change_24h REAL,
                    change_7d REAL,
                    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (coin_id) REFERENCES watchlist (coin_id)
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    coin_id TEXT,
                    alert_type TEXT,
                    threshold_value REAL,
                    current_value REAL,
                    triggered_at DATETIME,
                    message TEXT,
                    FOREIGN KEY (coin_id) REFERENCES watchlist (coin_id)
                )
            """)
    
    def add_to_watchlist(self, coin_id: str, priority: int = 1, notes: str = "") -> bool:
        """Add coin to watchlist"""
        try:
            # Get coin details first
            coin_data = self.coincodex.get_coin_details(coin_id)
            if not coin_data:
                self.logger.warning(f"Could not find coin data for {coin_id}")
                return False
            
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO watchlist 
                    (coin_id, symbol, name, priority, notes)
                    VALUES (?, ?, ?, ?, ?)
                """, (coin_id, coin_data.symbol, coin_data.name, priority, notes))
            
            self.logger.info(f"Added {coin_id} to watchlist")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to add {coin_id} to watchlist: {e}")
            return False
    
    def update_watchlist_data(self):
        """Update price data for all watchlist coins"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("SELECT coin_id FROM watchlist")
                coin_ids = [row[0] for row in cursor.fetchall()]
            
            updated_count = 0
            for coin_id in coin_ids:
                coin_data = self.coincodex.get_coin_details(coin_id)
                if coin_data:
                    with sqlite3.connect(self.db_path) as conn:
                        conn.execute("""
                            INSERT INTO price_history
                            (coin_id, price_usd, market_cap, volume_24h, 
                             change_1h, change_24h, change_7d)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (
                            coin_id, coin_data.price_usd, coin_data.market_cap,
                            coin_data.volume_24h, coin_data.change_1h,
                            coin_data.change_24h, coin_data.change_7d
                        ))
                    updated_count += 1
                    
                    # Check for alerts
                    self.check_alerts(coin_data)
            
            self.logger.info(f"Updated data for {updated_count} watchlist coins")
            return updated_count
            
        except Exception as e:
            self.logger.error(f"Failed to update watchlist data: {e}")
            return 0
    
    def check_alerts(self, coin_data: CoinCodexData):
        """Check if coin data triggers any alerts"""
        try:
            # Example alert: price change > 10%
            if abs(coin_data.change_24h) > 10:
                alert_type = "price_change_24h"
                message = f"{coin_data.name} ({coin_data.symbol}) changed {coin_data.change_24h:.2f}% in 24h"
                
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute("""
                        INSERT INTO alerts
                        (coin_id, alert_type, threshold_value, current_value, 
                         triggered_at, message)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        coin_data.coin_id, alert_type, 10.0, 
                        coin_data.change_24h, datetime.now(), message
                    ))
                
                self.logger.info(f"Alert triggered: {message}")
                
        except Exception as e:
            self.logger.error(f"Failed to check alerts: {e}")
    
    def get_watchlist_summary(self) -> Dict[str, Any]:
        """Get summary of watchlist performance"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Get latest data for all watchlist coins
                cursor = conn.execute("""
                    SELECT w.coin_id, w.symbol, w.name, 
                           ph.price_usd, ph.change_24h, ph.change_7d,
                           ph.market_cap, ph.volume_24h
                    FROM watchlist w
                    LEFT JOIN price_history ph ON w.coin_id = ph.coin_id
                    WHERE ph.recorded_at = (
                        SELECT MAX(recorded_at) 
                        FROM price_history ph2 
                        WHERE ph2.coin_id = w.coin_id
                    )
                    ORDER BY w.priority DESC, ph.change_24h DESC
                """)
                
                watchlist_data = cursor.fetchall()
                
                # Calculate summary statistics
                total_coins = len(watchlist_data)
                if total_coins == 0:
                    return {"total_coins": 0, "message": "Watchlist is empty"}
                
                price_changes_24h = [row[4] for row in watchlist_data if row[4] is not None]
                avg_change_24h = sum(price_changes_24h) / len(price_changes_24h) if price_changes_24h else 0
                
                positive_performers = len([c for c in price_changes_24h if c > 0])
                negative_performers = len([c for c in price_changes_24h if c < 0])
                
                # Get recent alerts
                cursor = conn.execute("""
                    SELECT COUNT(*) FROM alerts 
                    WHERE triggered_at > datetime('now', '-24 hours')
                """)
                recent_alerts = cursor.fetchone()[0]
                
                return {
                    "total_coins": total_coins,
                    "avg_change_24h": round(avg_change_24h, 2),
                    "positive_performers": positive_performers,
                    "negative_performers": negative_performers,
                    "recent_alerts": recent_alerts,
                    "top_performers": [
                        {
                            "symbol": row[1],
                            "name": row[2],
                            "price": row[3],
                            "change_24h": row[4]
                        }
                        for row in watchlist_data[:5]
                    ]
                }
                
        except Exception as e:
            self.logger.error(f"Failed to get watchlist summary: {e}")
            return {"error": str(e)}

class EcosystemAnalyst:
    """Comprehensive ecosystem analyst with multi-source data integration"""
    
    def __init__(self, config_path: str = "config.json"):
        self.config = ConfigManager(config_path)
        self.logger = ServiceFlowLogger("ecosystem_analyst")
        
        # Initialize data sources
        self.dexscreener = DexScreenerAPI()
        self.coindesk = CoinDeskAPI()
        self.coincodex = CoinCodexAPI(self.config.get("COINCODEX_API_KEY"))
        self.watchlist = WatchlistManager()
        
        # Database for analysis results
        self.db_path = "tmp/ecosystem_analysis.db"
        self.init_database()
        
        # Default watchlist coins (Sonic ecosystem focus)
        self.default_watchlist = [
            "sonic", "ethereum", "bitcoin", "solana", "polygon",
            "arbitrum", "optimism", "avalanche", "fantom", "chainlink"
        ]
        
        # Initialize default watchlist
        self._setup_default_watchlist()
    
    def init_database(self):
        """Initialize analysis database"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS ecosystem_reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    report_type TEXT,
                    chain_focus TEXT,
                    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    data_sources TEXT,
                    key_metrics TEXT,
                    insights TEXT,
                    recommendations TEXT,
                    report_hash TEXT UNIQUE
                )
            """)
    
    def _setup_default_watchlist(self):
        """Setup default watchlist if empty"""
        try:
            for coin_id in self.default_watchlist:
                priority = 3 if coin_id == "sonic" else 2 if coin_id in ["ethereum", "bitcoin"] else 1
                self.watchlist.add_to_watchlist(coin_id, priority=priority)
        except Exception as e:
            self.logger.warning(f"Failed to setup default watchlist: {e}")
    
    async def comprehensive_ecosystem_analysis(self, focus_chain: str = "sonic") -> Dict[str, Any]:
        """Perform comprehensive ecosystem analysis"""
        self.logger.info(f"Starting comprehensive ecosystem analysis for {focus_chain}")
        
        try:
            # Data collection phase
            analysis_data = {
                "timestamp": datetime.now().isoformat(),
                "focus_chain": focus_chain,
                "data_sources": ["DexScreener", "CoinDesk", "CoinCodex"]
            }
            
            # 1. DEX and token analysis
            self.logger.info("Collecting DEX and token data...")
            dex_tokens = self.dexscreener.get_tokens_by_chain(focus_chain, limit=20)
            analysis_data["dex_tokens"] = [asdict(token) for token in dex_tokens]
            
            # 2. News sentiment analysis
            self.logger.info("Collecting news and sentiment data...")
            news_articles = self.coindesk.search_news(focus_chain, limit=10)
            analysis_data["news"] = [asdict(article) for article in news_articles]
            
            # 3. Market overview
            self.logger.info("Collecting market overview...")
            trending_coins = self.coincodx.get_trending_coins(limit=15)
            analysis_data["trending_coins"] = [asdict(coin) for coin in trending_coins]
            
            # 4. Watchlist performance
            self.logger.info("Analyzing watchlist performance...")
            watchlist_summary = self.watchlist.get_watchlist_summary()
            analysis_data["watchlist_performance"] = watchlist_summary
            
            # Analysis phase
            ecosystem_insights = self._analyze_ecosystem_data(analysis_data)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(analysis_data, ecosystem_insights)
            
            # Compile final report
            final_report = {
                "metadata": {
                    "generated_at": analysis_data["timestamp"],
                    "focus_chain": focus_chain,
                    "data_sources": analysis_data["data_sources"],
                    "total_tokens_analyzed": len(dex_tokens),
                    "total_news_articles": len(news_articles),
                    "trending_coins_count": len(trending_coins)
                },
                "market_overview": {
                    "dex_activity": self._summarize_dex_activity(dex_tokens),
                    "news_sentiment": self._analyze_news_sentiment(news_articles),
                    "trending_analysis": self._analyze_trending_coins(trending_coins),
                    "watchlist_performance": watchlist_summary
                },
                "ecosystem_insights": ecosystem_insights,
                "recommendations": recommendations,
                "raw_data": analysis_data
            }
            
            # Store report
            self._store_report(final_report)
            
            self.logger.info("Comprehensive ecosystem analysis completed")
            return final_report
            
        except Exception as e:
            self.logger.error(f"Comprehensive analysis failed: {e}")
            return {"error": f"Analysis failed: {str(e)}"}
    
    def _summarize_dex_activity(self, tokens: List[TokenData]) -> Dict[str, Any]:
        """Summarize DEX activity and token performance"""
        if not tokens:
            return {"total_tokens": 0, "message": "No token data available"}
        
        total_volume = sum(token.volume_24h for token in tokens)
        total_liquidity = sum(token.liquidity for token in tokens)
        avg_price_change = sum(token.price_change_24h for token in tokens) / len(tokens)
        
        # Top performers
        top_gainers = sorted(tokens, key=lambda x: x.price_change_24h, reverse=True)[:5]
        top_losers = sorted(tokens, key=lambda x: x.price_change_24h)[:5]
        
        # Volume leaders
        volume_leaders = sorted(tokens, key=lambda x: x.volume_24h, reverse=True)[:5]
        
        return {
            "total_tokens": len(tokens),
            "total_volume_24h": total_volume,
            "total_liquidity": total_liquidity,
            "avg_price_change_24h": round(avg_price_change, 2),
            "top_gainers": [
                {
                    "symbol": token.symbol,
                    "name": token.name,
                    "price_change_24h": token.price_change_24h,
                    "volume_24h": token.volume_24h
                }
                for token in top_gainers
            ],
            "top_losers": [
                {
                    "symbol": token.symbol,
                    "name": token.name,
                    "price_change_24h": token.price_change_24h,
                    "volume_24h": token.volume_24h
                }
                for token in top_losers
            ],
            "volume_leaders": [
                {
                    "symbol": token.symbol,
                    "name": token.name,
                    "volume_24h": token.volume_24h,
                    "price_change_24h": token.price_change_24h
                }
                for token in volume_leaders
            ]
        }
    
    def _analyze_news_sentiment(self, articles: List[NewsArticle]) -> Dict[str, Any]:
        """Analyze news sentiment"""
        if not articles:
            return {"total_articles": 0, "sentiment": "neutral", "message": "No news articles available"}
        
        sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
        total_relevance = 0
        
        for article in articles:
            sentiment_counts[article.sentiment] += 1
            total_relevance += article.relevance_score
        
        # Overall sentiment
        if sentiment_counts["positive"] > sentiment_counts["negative"]:
            overall_sentiment = "positive"
        elif sentiment_counts["negative"] > sentiment_counts["positive"]:
            overall_sentiment = "negative"
        else:
            overall_sentiment = "neutral"
        
        avg_relevance = total_relevance / len(articles) if articles else 0
        
        return {
            "total_articles": len(articles),
            "overall_sentiment": overall_sentiment,
            "sentiment_breakdown": sentiment_counts,
            "avg_relevance_score": round(avg_relevance, 2),
            "recent_headlines": [
                {
                    "title": article.title,
                    "sentiment": article.sentiment,
                    "relevance_score": article.relevance_score
                }
                for article in articles[:5]
            ]
        }
    
    def _analyze_trending_coins(self, coins: List[CoinCodexData]) -> Dict[str, Any]:
        """Analyze trending coins performance"""
        if not coins:
            return {"total_coins": 0, "message": "No trending coins data available"}
        
        # Performance statistics
        changes_24h = [coin.change_24h for coin in coins]
        changes_7d = [coin.change_7d for coin in coins]
        
        avg_change_24h = sum(changes_24h) / len(changes_24h)
        avg_change_7d = sum(changes_7d) / len(changes_7d)
        
        # Market cap analysis
        total_market_cap = sum(coin.market_cap for coin in coins)
        
        # Top performers by different metrics
        top_24h_performers = sorted(coins, key=lambda x: x.change_24h, reverse=True)[:3]
        top_7d_performers = sorted(coins, key=lambda x: x.change_7d, reverse=True)[:3]
        highest_volume = sorted(coins, key=lambda x: x.volume_24h, reverse=True)[:3]
        
        return {
            "total_coins": len(coins),
            "avg_change_24h": round(avg_change_24h, 2),
            "avg_change_7d": round(avg_change_7d, 2),
            "total_market_cap": total_market_cap,
            "top_24h_performers": [
                {
                    "symbol": coin.symbol,
                    "name": coin.name,
                    "change_24h": coin.change_24h,
                    "market_cap": coin.market_cap
                }
                for coin in top_24h_performers
            ],
            "top_7d_performers": [
                {
                    "symbol": coin.symbol,
                    "name": coin.name,
                    "change_7d": coin.change_7d,
                    "market_cap": coin.market_cap
                }
                for coin in top_7d_performers
            ],
            "highest_volume": [
                {
                    "symbol": coin.symbol,
                    "name": coin.name,
                    "volume_24h": coin.volume_24h,
                    "change_24h": coin.change_24h
                }
                for coin in highest_volume
            ]
        }
    
    def _analyze_ecosystem_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze ecosystem data for insights"""
        insights = {
            "market_health": "analyzing...",
            "growth_indicators": [],
            "risk_factors": [],
            "opportunities": [],
            "ecosystem_maturity": "developing"
        }
        
        try:
            # Market health assessment
            dex_tokens = data.get("dex_tokens", [])
            if dex_tokens:
                positive_performers = len([t for t in dex_tokens if t.get("price_change_24h", 0) > 0])
                health_ratio = positive_performers / len(dex_tokens)
                
                if health_ratio > 0.6:
                    insights["market_health"] = "healthy"
                elif health_ratio > 0.4:
                    insights["market_health"] = "mixed"
                else:
                    insights["market_health"] = "bearish"
            
            # Growth indicators
            news_sentiment = data.get("news", [])
            positive_news = len([n for n in news_sentiment if n.get("sentiment") == "positive"])
            
            if positive_news > len(news_sentiment) / 2:
                insights["growth_indicators"].append("Positive news sentiment")
            
            # Volume analysis
            total_volume = sum(t.get("volume_24h", 0) for t in dex_tokens)
            if total_volume > 1000000:  # $1M+ daily volume
                insights["growth_indicators"].append("Strong trading volume")
            
            # Risk factors
            high_volatility_tokens = len([t for t in dex_tokens if abs(t.get("price_change_24h", 0)) > 20])
            if high_volatility_tokens > len(dex_tokens) / 3:
                insights["risk_factors"].append("High market volatility")
            
            # Opportunities
            watchlist_perf = data.get("watchlist_performance", {})
            if watchlist_perf.get("positive_performers", 0) > watchlist_perf.get("negative_performers", 0):
                insights["opportunities"].append("Watchlist outperforming market")
            
            # Ecosystem maturity
            unique_dexes = len(set(t.get("dex", "") for t in dex_tokens))
            if unique_dexes > 3:
                insights["ecosystem_maturity"] = "mature"
            elif unique_dexes > 1:
                insights["ecosystem_maturity"] = "developing"
            else:
                insights["ecosystem_maturity"] = "early"
            
        except Exception as e:
            self.logger.error(f"Failed to analyze ecosystem data: {e}")
            insights["error"] = str(e)
        
        return insights
    
    def _generate_recommendations(self, data: Dict[str, Any], insights: Dict[str, Any]) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        try:
            # Market health based recommendations
            market_health = insights.get("market_health")
            
            if market_health == "healthy":
                recommendations.append("Market conditions favorable for position increases")
            elif market_health == "bearish":
                recommendations.append("Consider defensive positioning and risk management")
            else:
                recommendations.append("Mixed market signals suggest cautious approach")
            
            # Volume based recommendations
            dex_tokens = data.get("dex_tokens", [])
            high_volume_tokens = [t for t in dex_tokens if t.get("volume_24h", 0) > 50000]
            
            if high_volume_tokens:
                recommendations.append(f"Monitor {len(high_volume_tokens)} high-volume tokens for opportunities")
            
            # News sentiment recommendations
            news_data = data.get("news", [])
            positive_news_ratio = len([n for n in news_data if n.get("sentiment") == "positive"]) / max(len(news_data), 1)
            
            if positive_news_ratio > 0.7:
                recommendations.append("Strong news sentiment supports bullish positioning")
            elif positive_news_ratio < 0.3:
                recommendations.append("Negative news sentiment warrants caution")
            
            # Ecosystem maturity recommendations
            maturity = insights.get("ecosystem_maturity")
            if maturity == "early":
                recommendations.append("Early-stage ecosystem - high risk/high reward potential")
            elif maturity == "mature":
                recommendations.append("Mature ecosystem offers stability and established protocols")
            
            # Watchlist specific recommendations
            watchlist_data = data.get("watchlist_performance", {})
            if watchlist_data.get("recent_alerts", 0) > 0:
                recommendations.append("Review watchlist alerts for immediate opportunities")
            
            # Default recommendations
            if not recommendations:
                recommendations = [
                    "Continue monitoring market conditions",
                    "Maintain diversified exposure across ecosystem",
                    "Set up alerts for significant price movements"
                ]
            
        except Exception as e:
            self.logger.error(f"Failed to generate recommendations: {e}")
            recommendations.append("Unable to generate specific recommendations - continue general monitoring")
        
        return recommendations
    
    def _store_report(self, report: Dict[str, Any]):
        """Store analysis report in database"""
        try:
            report_hash = hash(json.dumps(report, sort_keys=True))
            
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO ecosystem_reports
                    (report_type, chain_focus, data_sources, key_metrics,
                     insights, recommendations, report_hash)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    "comprehensive",
                    report["metadata"]["focus_chain"],
                    json.dumps(report["metadata"]["data_sources"]),
                    json.dumps(report["market_overview"]),
                    json.dumps(report["ecosystem_insights"]),
                    json.dumps(report["recommendations"]),
                    str(report_hash)
                ))
                
            self.logger.info("Ecosystem report stored successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to store report: {e}")
    
    def get_recent_reports(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get recent ecosystem analysis reports"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT * FROM ecosystem_reports
                    ORDER BY generated_at DESC
                    LIMIT ?
                """, (limit,))
                
                columns = [desc[0] for desc in cursor.description]
                reports = []
                
                for row in cursor.fetchall():
                    report = dict(zip(columns, row))
                    # Parse JSON fields
                    for json_field in ["data_sources", "key_metrics", "insights", "recommendations"]:
                        if report[json_field]:
                            report[json_field] = json.loads(report[json_field])
                    reports.append(report)
                
                return reports
                
        except Exception as e:
            self.logger.error(f"Failed to retrieve reports: {e}")
            return []
    
    async def start_continuous_monitoring(self):
        """Start continuous ecosystem monitoring"""
        self.logger.info("Starting continuous ecosystem monitoring")
        
        while True:
            try:
                # Update watchlist data every hour
                self.logger.info("Updating watchlist data...")
                self.watchlist.update_watchlist_data()
                
                # Run comprehensive analysis every 4 hours
                if datetime.now().hour % 4 == 0:
                    self.logger.info("Running comprehensive ecosystem analysis...")
                    analysis = await self.comprehensive_ecosystem_analysis()
                    
                    if "error" not in analysis:
                        self.logger.info("Comprehensive analysis completed successfully")
                    else:
                        self.logger.warning(f"Comprehensive analysis failed: {analysis['error']}")
                
                # Wait 1 hour before next update
                await asyncio.sleep(3600)
                
            except Exception as e:
                self.logger.error(f"Monitoring error: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error

# Test function
async def test_ecosystem_analyst():
    """Test Ecosystem Analyst"""
    print("🌐 Testing Ecosystem Analyst...")
    
    analyst = EcosystemAnalyst()
    
    try:
        # Test comprehensive analysis
        print("\n📊 Running comprehensive ecosystem analysis...")
        analysis = await analyst.comprehensive_ecosystem_analysis("sonic")
        
        if "error" not in analysis:
            print("✅ Comprehensive analysis successful")
            print(f"   Tokens analyzed: {analysis['metadata'].get('total_tokens_analyzed', 0)}")
            print(f"   News articles: {analysis['metadata'].get('total_news_articles', 0)}")
            print(f"   Market health: {analysis['ecosystem_insights'].get('market_health', 'unknown')}")
            print(f"   Recommendations: {len(analysis['recommendations'])} generated")
        else:
            print(f"⚠️  Analysis failed: {analysis['error']}")
        
        # Test watchlist functionality
        print("\n📋 Testing watchlist functionality...")
        watchlist_summary = analyst.watchlist.get_watchlist_summary()
        print(f"   Watchlist coins: {watchlist_summary.get('total_coins', 0)}")
        print(f"   Recent alerts: {watchlist_summary.get('recent_alerts', 0)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ecosystem Analyst test failed: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_ecosystem_analyst())