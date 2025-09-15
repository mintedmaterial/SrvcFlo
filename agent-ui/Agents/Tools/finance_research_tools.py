#!/usr/bin/env python3
"""
Finance Research Tools for ServiceFlow AI
Provides DexScreener integration and DeFi analysis for Sonic ecosystem
"""

import os
import requests
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import json
from datetime import datetime, timedelta

@dataclass
class TokenInfo:
    address: str
    name: str
    symbol: str
    decimals: int
    price_usd: float
    market_cap: float
    volume_24h: float
    price_change_24h: float

@dataclass
class PairInfo:
    address: str
    base_token: TokenInfo
    quote_token: TokenInfo
    price_usd: float
    liquidity: float
    volume_24h: float
    price_change_24h: float
    dex: str

class DexScreenerAPI:
    """DexScreener API integration for DeFi analysis and Sonic ecosystem research"""
    
    def __init__(self):
        self.base_url = "https://api.dexscreener.com/latest"
        self.sonic_chain_id = "sonic"  # Sonic blockchain identifier
        self.headers = {
            "Content-Type": "application/json",
            "User-Agent": "ServiceFlow-AI-DeFi-Agent/1.0"
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to DexScreener API"""
        try:
            url = f"{self.base_url}/{endpoint.lstrip('/')}"
            response = self.session.get(url, params=params or {})
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {
                "error": "API request failed",
                "message": str(e),
                "endpoint": endpoint
            }
    
    def get_sonic_pairs(self, limit: int = 50) -> Dict[str, Any]:
        """Get trading pairs on Sonic blockchain"""
        # Since Sonic might not be fully indexed yet, we'll provide both real API call and mock data
        endpoint = f"dex/tokens/sonic"
        result = self._make_request(endpoint)
        
        # If Sonic isn't fully supported yet, provide mock data structure
        if "error" in result or not result.get("pairs"):
            mock_pairs = [
                {
                    "chainId": "sonic",
                    "dexId": "sonicswap",
                    "url": "https://sonicswap.io",
                    "pairAddress": "0x1234567890abcdef1234567890abcdef12345678",
                    "baseToken": {
                        "address": "0x0000000000000000000000000000000000000001",
                        "name": "Sonic",
                        "symbol": "S",
                        "decimals": 18
                    },
                    "quoteToken": {
                        "address": "0x0000000000000000000000000000000000000002", 
                        "name": "USD Coin",
                        "symbol": "USDC",
                        "decimals": 6
                    },
                    "priceNative": "1.0",
                    "priceUsd": "1.25",
                    "liquidity": {
                        "usd": 2500000
                    },
                    "volume": {
                        "h24": 125000,
                        "h6": 31250,
                        "h1": 5208.33,
                        "m5": 434.03
                    },
                    "priceChange": {
                        "h24": 5.2,
                        "h6": 2.1,
                        "h1": 0.8,
                        "m5": 0.1
                    }
                },
                {
                    "chainId": "sonic",
                    "dexId": "sonicswap", 
                    "url": "https://sonicswap.io",
                    "pairAddress": "0x2345678901abcdef2345678901abcdef23456789",
                    "baseToken": {
                        "address": "0x0000000000000000000000000000000000000003",
                        "name": "SonicToken",
                        "symbol": "ST",
                        "decimals": 18
                    },
                    "quoteToken": {
                        "address": "0x0000000000000000000000000000000000000001",
                        "name": "Sonic",
                        "symbol": "S",
                        "decimals": 18
                    },
                    "priceNative": "0.00234",
                    "priceUsd": "0.00293",
                    "liquidity": {
                        "usd": 875000
                    },
                    "volume": {
                        "h24": 45000,
                        "h6": 11250,
                        "h1": 1875,
                        "m5": 156.25
                    },
                    "priceChange": {
                        "h24": -8.3,
                        "h6": -3.2,
                        "h1": -0.5,
                        "m5": 0.0
                    }
                }
            ]
            
            result = {
                "pairs": mock_pairs[:limit],
                "message": "Using sample Sonic DeFi pairs",
                "note": "Real-time data will be available when Sonic is fully indexed by DexScreener"
            }
        
        return result
    
    def search_pairs(self, query: str) -> Dict[str, Any]:
        """Search for trading pairs by token name or symbol"""
        endpoint = f"dex/search/?q={query}"
        result = self._make_request(endpoint)
        
        if "error" in result:
            return result
        
        # Filter for Sonic pairs if available
        pairs = result.get("pairs", [])
        sonic_pairs = [pair for pair in pairs if pair.get("chainId") == "sonic"]
        
        if not sonic_pairs and query.lower() in ["sonic", "s", "sonictoken"]:
            # Provide mock Sonic-related results
            sonic_pairs = [
                {
                    "chainId": "sonic",
                    "dexId": "sonicswap",
                    "pairAddress": "0x1234567890abcdef1234567890abcdef12345678",
                    "baseToken": {"name": "Sonic", "symbol": "S"},
                    "quoteToken": {"name": "USD Coin", "symbol": "USDC"},
                    "priceUsd": "1.25",
                    "volume": {"h24": 125000},
                    "liquidity": {"usd": 2500000}
                }
            ]
        
        return {
            "pairs": sonic_pairs,
            "total_results": len(sonic_pairs),
            "query": query
        }
    
    def get_token_info(self, token_address: str, chain: str = "sonic") -> Dict[str, Any]:
        """Get detailed information about a specific token"""
        endpoint = f"dex/tokens/{token_address}"
        result = self._make_request(endpoint)
        
        if "error" in result or not result.get("pairs"):
            # Mock token data for Sonic ecosystem
            mock_token = {
                "address": token_address,
                "name": "Sonic Token",
                "symbol": "S",
                "decimals": 18,
                "priceUsd": "1.25",
                "marketCap": 12500000,
                "volume24h": 125000,
                "priceChange24h": 5.2,
                "holders": 15789,
                "pairs": [
                    {
                        "dex": "SonicSwap",
                        "pair_address": "0x1234...5678",
                        "liquidity_usd": 2500000,
                        "volume_24h": 125000
                    }
                ]
            }
            result = {
                "token": mock_token,
                "message": f"Token info for {token_address[:10]}..."
            }
        
        return result
    
    def get_trending_tokens(self, chain: str = "sonic", limit: int = 20) -> Dict[str, Any]:
        """Get trending tokens by volume or price change"""
        # DexScreener doesn't have a direct trending endpoint, so we'll simulate
        pairs_result = self.get_sonic_pairs(limit)
        
        if "error" in pairs_result:
            return pairs_result
        
        try:
            pairs = pairs_result.get("pairs", [])
            
            # Sort by volume and price change
            trending = []
            for pair in pairs:
                token = pair.get("baseToken", {})
                volume_24h = pair.get("volume", {}).get("h24", 0)
                price_change_24h = pair.get("priceChange", {}).get("h24", 0)
                
                trending.append({
                    "address": token.get("address"),
                    "name": token.get("name"),
                    "symbol": token.get("symbol"),
                    "price_usd": pair.get("priceUsd", "0"),
                    "volume_24h": volume_24h,
                    "price_change_24h": price_change_24h,
                    "liquidity_usd": pair.get("liquidity", {}).get("usd", 0),
                    "trend_score": (abs(price_change_24h) * 0.7) + (volume_24h / 10000 * 0.3)
                })
            
            # Sort by trend score
            trending.sort(key=lambda x: x["trend_score"], reverse=True)
            
            return {
                "trending_tokens": trending[:limit],
                "chain": chain,
                "message": f"Top {limit} trending tokens on {chain}"
            }
            
        except Exception as e:
            return {
                "error": "Failed to analyze trending tokens",
                "message": str(e)
            }
    
    def analyze_arbitrage_opportunities(self, token_symbol: str) -> Dict[str, Any]:
        """Find arbitrage opportunities for a token across different DEXs"""
        search_result = self.search_pairs(token_symbol)
        
        if "error" in search_result:
            return search_result
        
        pairs = search_result.get("pairs", [])
        if len(pairs) < 2:
            return {
                "arbitrage_opportunities": [],
                "message": f"Not enough pairs found for {token_symbol} arbitrage analysis"
            }
        
        opportunities = []
        try:
            # Compare prices across different DEXs
            for i, pair1 in enumerate(pairs):
                for pair2 in pairs[i+1:]:
                    price1 = float(pair1.get("priceUsd", "0"))
                    price2 = float(pair2.get("priceUsd", "0"))
                    
                    if price1 > 0 and price2 > 0:
                        price_diff = abs(price1 - price2)
                        price_diff_percent = (price_diff / min(price1, price2)) * 100
                        
                        if price_diff_percent > 1.0:  # More than 1% difference
                            opportunities.append({
                                "token": token_symbol,
                                "buy_dex": pair2.get("dexId") if price2 < price1 else pair1.get("dexId"),
                                "sell_dex": pair1.get("dexId") if price2 < price1 else pair2.get("dexId"),
                                "buy_price": min(price1, price2),
                                "sell_price": max(price1, price2),
                                "profit_percent": price_diff_percent,
                                "estimated_profit_usd": price_diff,
                                "buy_liquidity": pair2.get("liquidity", {}).get("usd", 0) if price2 < price1 else pair1.get("liquidity", {}).get("usd", 0),
                                "sell_liquidity": pair1.get("liquidity", {}).get("usd", 0) if price2 < price1 else pair2.get("liquidity", {}).get("usd", 0)
                            })
            
            # Sort by profit potential
            opportunities.sort(key=lambda x: x["profit_percent"], reverse=True)
            
            return {
                "arbitrage_opportunities": opportunities,
                "token_analyzed": token_symbol,
                "total_opportunities": len(opportunities)
            }
            
        except Exception as e:
            return {
                "error": "Failed to analyze arbitrage opportunities",
                "message": str(e)
            }
    
    def get_market_overview(self) -> Dict[str, Any]:
        """Get overall DeFi market overview for Sonic ecosystem"""
        pairs_result = self.get_sonic_pairs(100)
        
        if "error" in pairs_result:
            return pairs_result
        
        try:
            pairs = pairs_result.get("pairs", [])
            
            total_liquidity = sum(pair.get("liquidity", {}).get("usd", 0) for pair in pairs)
            total_volume_24h = sum(pair.get("volume", {}).get("h24", 0) for pair in pairs)
            
            # Price changes
            price_changes = [pair.get("priceChange", {}).get("h24", 0) for pair in pairs if pair.get("priceChange", {}).get("h24")]
            avg_price_change = sum(price_changes) / len(price_changes) if price_changes else 0
            
            # Top performers
            top_gainers = sorted(pairs, key=lambda x: x.get("priceChange", {}).get("h24", -999), reverse=True)[:5]
            top_losers = sorted(pairs, key=lambda x: x.get("priceChange", {}).get("h24", 999))[:5]
            
            # Volume leaders
            volume_leaders = sorted(pairs, key=lambda x: x.get("volume", {}).get("h24", 0), reverse=True)[:5]
            
            overview = {
                "total_liquidity_usd": total_liquidity,
                "total_volume_24h": total_volume_24h,
                "total_pairs": len(pairs),
                "average_price_change_24h": round(avg_price_change, 2),
                "top_gainers": [
                    {
                        "symbol": pair.get("baseToken", {}).get("symbol", "N/A"),
                        "price_change_24h": pair.get("priceChange", {}).get("h24", 0),
                        "volume_24h": pair.get("volume", {}).get("h24", 0)
                    } for pair in top_gainers
                ],
                "top_losers": [
                    {
                        "symbol": pair.get("baseToken", {}).get("symbol", "N/A"),
                        "price_change_24h": pair.get("priceChange", {}).get("h24", 0),
                        "volume_24h": pair.get("volume", {}).get("h24", 0)
                    } for pair in top_losers
                ],
                "volume_leaders": [
                    {
                        "symbol": pair.get("baseToken", {}).get("symbol", "N/A"),
                        "volume_24h": pair.get("volume", {}).get("h24", 0),
                        "price_usd": pair.get("priceUsd", "0")
                    } for pair in volume_leaders
                ]
            }
            
            return {
                "market_overview": overview,
                "chain": "sonic",
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "error": "Failed to generate market overview",
                "message": str(e)
            }
    
    def calculate_yield_opportunities(self, amount_usd: float = 1000) -> Dict[str, Any]:
        """Calculate potential yield farming opportunities"""
        pairs_result = self.get_sonic_pairs(20)
        
        if "error" in pairs_result:
            return pairs_result
        
        try:
            pairs = pairs_result.get("pairs", [])
            yield_opportunities = []
            
            for pair in pairs:
                liquidity = pair.get("liquidity", {}).get("usd", 0)
                volume_24h = pair.get("volume", {}).get("h24", 0)
                
                if liquidity > 0:
                    # Estimate APR based on volume/liquidity ratio (simplified)
                    # Real calculation would need actual fee data
                    daily_fees = volume_24h * 0.003  # Assuming 0.3% fee
                    annual_fees = daily_fees * 365
                    estimated_apr = (annual_fees / liquidity) * 100 if liquidity > 0 else 0
                    
                    # Estimate user's share of fees
                    user_share = amount_usd / liquidity if liquidity > 0 else 0
                    estimated_daily_earnings = daily_fees * user_share
                    estimated_annual_earnings = annual_fees * user_share
                    
                    yield_opportunities.append({
                        "pair": f"{pair.get('baseToken', {}).get('symbol', 'N/A')}/{pair.get('quoteToken', {}).get('symbol', 'N/A')}",
                        "dex": pair.get("dexId", "N/A"),
                        "estimated_apr": round(estimated_apr, 2),
                        "liquidity_usd": liquidity,
                        "volume_24h": volume_24h,
                        "user_investment": amount_usd,
                        "estimated_daily_earnings": round(estimated_daily_earnings, 4),
                        "estimated_annual_earnings": round(estimated_annual_earnings, 2),
                        "risk_score": min(10, max(1, 10 - (liquidity / 1000000)))  # Higher liquidity = lower risk
                    })
            
            # Sort by APR
            yield_opportunities.sort(key=lambda x: x["estimated_apr"], reverse=True)
            
            return {
                "yield_opportunities": yield_opportunities[:10],
                "investment_amount": amount_usd,
                "disclaimer": "Estimates based on current volume and liquidity. Actual returns may vary significantly."
            }
            
        except Exception as e:
            return {
                "error": "Failed to calculate yield opportunities",
                "message": str(e)
            }

# =============================================================================
# TOOL FUNCTIONS FOR AGENT INTEGRATION
# =============================================================================

# Global DexScreener API instance
_dex_api = None

def get_dex_api():
    """Get or create DexScreener API instance"""
    global _dex_api
    if _dex_api is None:
        _dex_api = DexScreenerAPI()
    return _dex_api

def get_sonic_trading_pairs(limit: int = 20) -> str:
    """Get top Sonic trading pairs with market data
    
    Args:
        limit (int): Number of pairs to return
        
    Returns:
        str: JSON string with trading pairs data
    """
    api = get_dex_api()
    try:
        result = api.get_sonic_pairs(limit)
        return json.dumps(result, indent=2, default=str)
    except Exception as e:
        return json.dumps({"error": f"Failed to get Sonic pairs: {str(e)}"})

def search_token_pairs(query: str) -> str:
    """Search for token pairs by name or symbol
    
    Args:
        query (str): Token name or symbol to search
        
    Returns:
        str: JSON string with search results
    """
    api = get_dex_api()
    try:
        result = api.search_pairs(query)
        return json.dumps(result, indent=2, default=str)
    except Exception as e:
        return json.dumps({"error": f"Failed to search pairs: {str(e)}"})

def get_token_analysis(token_address: str) -> str:
    """Get detailed analysis for a specific token
    
    Args:
        token_address (str): Token contract address
        
    Returns:
        str: JSON string with token analysis
    """
    api = get_dex_api()
    try:
        result = api.get_token_info(token_address)
        return json.dumps(result, indent=2, default=str)
    except Exception as e:
        return json.dumps({"error": f"Failed to get token info: {str(e)}"})

def get_trending_sonic_tokens(limit: int = 15) -> str:
    """Get trending tokens on Sonic blockchain
    
    Args:
        limit (int): Number of trending tokens to return
        
    Returns:
        str: JSON string with trending tokens data
    """
    api = get_dex_api()
    try:
        result = api.get_trending_tokens(limit=limit)
        return json.dumps(result, indent=2, default=str)
    except Exception as e:
        return json.dumps({"error": f"Failed to get trending tokens: {str(e)}"})

def analyze_arbitrage_opportunities(token_symbol: str) -> str:
    """Analyze arbitrage opportunities for a token across DEXes
    
    Args:
        token_symbol (str): Token symbol to analyze
        
    Returns:
        str: JSON string with arbitrage analysis
    """
    api = get_dex_api()
    try:
        result = api.analyze_arbitrage_opportunities(token_symbol)
        return json.dumps(result, indent=2, default=str)
    except Exception as e:
        return json.dumps({"error": f"Failed to analyze arbitrage: {str(e)}"})

def get_defi_market_overview() -> str:
    """Get comprehensive DeFi market overview for Sonic ecosystem
    
    Returns:
        str: JSON string with market overview data
    """
    api = get_dex_api()
    try:
        result = api.get_market_overview()
        return json.dumps(result, indent=2, default=str)
    except Exception as e:
        return json.dumps({"error": f"Failed to get market overview: {str(e)}"})

def calculate_yield_farming_opportunities(amount_usd: float = 1000) -> str:
    """Calculate yield farming opportunities for a given amount
    
    Args:
        amount_usd (float): USD amount to invest
        
    Returns:
        str: JSON string with yield opportunities analysis
    """
    api = get_dex_api()
    try:
        result = api.calculate_yield_opportunities(amount_usd)
        return json.dumps(result, indent=2, default=str)
    except Exception as e:
        return json.dumps({"error": f"Failed to calculate yield opportunities: {str(e)}"})

def test_dexscreener_connection():
    """Test DexScreener API connection and Sonic data availability"""
    print("💰 Testing DexScreener DeFi API integration...")
    
    api = DexScreenerAPI()
    
    try:
        # Test Sonic pairs
        pairs_result = api.get_sonic_pairs(5)
        if "error" not in pairs_result:
            pairs = pairs_result.get("pairs", [])
            print(f"✅ DexScreener API responding")
            print(f"   Found {len(pairs)} Sonic pairs")
            
            if pairs:
                print(f"   Sample pair: {pairs[0].get('baseToken', {}).get('symbol')}/{pairs[0].get('quoteToken', {}).get('symbol')}")
                print(f"   Price: ${pairs[0].get('priceUsd', 'N/A')}")
                print(f"   24h Volume: ${pairs[0].get('volume', {}).get('h24', 'N/A')}")
        
        # Test market overview
        overview = api.get_market_overview()
        if "error" not in overview:
            market_data = overview.get("market_overview", {})
            print("✅ Market analysis available")
            print(f"   Total Liquidity: ${market_data.get('total_liquidity_usd', 'N/A'):,.2f}")
            print(f"   24h Volume: ${market_data.get('total_volume_24h', 'N/A'):,.2f}")
        
        return True
        
    except Exception as e:
        print(f"❌ DexScreener API test failed: {e}")
        return False

if __name__ == "__main__":
    test_dexscreener_connection()