#!/usr/bin/env python3
"""
NFT Market Analyst Agent - ServiceFlow AI
Analyzes NFT markets with Discord pipeline data and PaintSwap integration
"""

import os
import json
import sqlite3
import discord
from discord.ext import tasks
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import asyncio
import logging
import requests
from dataclasses import dataclass, asdict
import aiohttp
from Tools.paintswap_tools import PaintswapAPI
from enhanced_logging import ServiceFlowLogger
from config_manager import ConfigManager

@dataclass
class NFTMarketSignal:
    """NFT market signal from Discord analysis"""
    collection_name: str
    contract_address: str
    signal_type: str  # "bullish", "bearish", "neutral"
    confidence: float
    source: str  # "discord", "paintswap", "technical"
    timestamp: datetime
    price_target: Optional[float] = None
    reasoning: str = ""
    volume_change: Optional[float] = None
    floor_change: Optional[float] = None

@dataclass
class DiscordNFTMention:
    """NFT mention from Discord channels"""
    guild_name: str
    channel_name: str
    author: str
    message: str
    timestamp: datetime
    nft_collections: List[str]
    sentiment: str  # "positive", "negative", "neutral"
    engagement_score: int  # reactions + replies

class NFTDiscordMonitor:
    """Monitor Discord channels for NFT discussions and sentiment"""
    
    def __init__(self, config_manager: ConfigManager):
        self.config = config_manager
        self.logger = ServiceFlowLogger("nft_discord_monitor")
        self.token = self.config.get("DISCORD_BOT_TOKEN")
        
        # Initialize Discord client
        intents = discord.Intents.default()
        intents.message_content = True
        intents.guilds = True
        self.client = discord.Client(intents=intents)
        
        # NFT-related keywords and collections to monitor
        self.nft_keywords = [
            "floor", "sweep", "mint", "reveal", "whitelist", "allowlist",
            "secondary", "marketplace", "collection", "rarity", "traits",
            "sonic", "paintswap", "nft", "opensea", "blur", "x2y2"
        ]
        
        # Database for storing Discord data
        self.db_path = "tmp/discord_nft_data.db"
        self.init_database()
        
        # Setup Discord event handlers
        self.setup_handlers()
    
    def init_database(self):
        """Initialize SQLite database for Discord NFT data"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS nft_mentions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    guild_name TEXT,
                    channel_name TEXT,
                    author TEXT,
                    message TEXT,
                    timestamp DATETIME,
                    nft_collections TEXT,
                    sentiment TEXT,
                    engagement_score INTEGER,
                    processed BOOLEAN DEFAULT FALSE
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS market_signals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    collection_name TEXT,
                    contract_address TEXT,
                    signal_type TEXT,
                    confidence REAL,
                    source TEXT,
                    timestamp DATETIME,
                    price_target REAL,
                    reasoning TEXT,
                    volume_change REAL,
                    floor_change REAL
                )
            """)
    
    def setup_handlers(self):
        """Setup Discord event handlers"""
        
        @self.client.event
        async def on_ready():
            self.logger.info(f"NFT Discord Monitor connected as {self.client.user}")
            
        @self.client.event
        async def on_message(message):
            if message.author.bot:
                return
                
            await self.process_nft_message(message)
    
    async def process_nft_message(self, message):
        """Process Discord message for NFT-related content"""
        content = message.content.lower()
        
        # Check if message contains NFT keywords
        nft_keywords_found = [kw for kw in self.nft_keywords if kw in content]
        
        if not nft_keywords_found:
            return
        
        # Extract potential NFT collections mentioned
        collections = self.extract_collections(content)
        
        # Analyze sentiment
        sentiment = self.analyze_sentiment(content)
        
        # Calculate engagement score
        engagement = len(message.reactions) + (message.reference.message_id is not None)
        
        # Store in database
        mention = DiscordNFTMention(
            guild_name=message.guild.name if message.guild else "DM",
            channel_name=message.channel.name,
            author=str(message.author),
            message=message.content,
            timestamp=message.created_at,
            nft_collections=collections,
            sentiment=sentiment,
            engagement_score=engagement
        )
        
        self.store_mention(mention)
        self.logger.info(f"NFT mention detected: {collections} - {sentiment}")
    
    def extract_collections(self, content: str) -> List[str]:
        """Extract NFT collection names from message content"""
        collections = []
        
        # Known Sonic NFT collections (extend this list)
        known_collections = [
            "sonic punks", "sonic apes", "bandit kidz", "sonic bears",
            "sonic cats", "sonic degens", "sonic warriors"
        ]
        
        for collection in known_collections:
            if collection in content:
                collections.append(collection)
        
        return collections
    
    def analyze_sentiment(self, content: str) -> str:
        """Analyze sentiment of NFT-related message"""
        positive_words = [
            "moon", "pump", "bullish", "buy", "accumulate", "hodl",
            "diamond", "gem", "undervalued", "cheap", "sale"
        ]
        
        negative_words = [
            "dump", "sell", "bearish", "overpriced", "exit", "rug",
            "scam", "avoid", "crash", "down", "falling"
        ]
        
        content_lower = content.lower()
        
        pos_count = sum(1 for word in positive_words if word in content_lower)
        neg_count = sum(1 for word in negative_words if word in content_lower)
        
        if pos_count > neg_count:
            return "positive"
        elif neg_count > pos_count:
            return "negative"
        else:
            return "neutral"
    
    def store_mention(self, mention: DiscordNFTMention):
        """Store NFT mention in database"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO nft_mentions 
                (guild_name, channel_name, author, message, timestamp, 
                 nft_collections, sentiment, engagement_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                mention.guild_name, mention.channel_name, mention.author,
                mention.message, mention.timestamp, 
                json.dumps(mention.nft_collections), mention.sentiment,
                mention.engagement_score
            ))
    
    async def start_monitoring(self):
        """Start Discord monitoring"""
        if self.token:
            await self.client.start(self.token)
        else:
            self.logger.warning("No Discord token provided - monitoring disabled")

class NFTMarketAnalyst:
    """Advanced NFT Market Analyst with Discord and PaintSwap integration"""
    
    def __init__(self, config_path: str = "config.json"):
        self.config = ConfigManager(config_path)
        self.logger = ServiceFlowLogger("nft_market_analyst")
        
        # Initialize components
        self.paintswap = PaintswapAPI(self.config.get("PAINTSWAP_API_KEY"))
        self.discord_monitor = NFTDiscordMonitor(self.config)
        
        # Database for analysis results
        self.db_path = "tmp/nft_analysis.db"
        self.init_database()
        
        # Analysis configuration
        self.analysis_config = {
            "min_volume_threshold": 100.0,  # Minimum 24h volume in S tokens
            "min_confidence_threshold": 0.7,  # Minimum confidence for signals
            "discord_weight": 0.3,  # Weight of Discord sentiment
            "technical_weight": 0.4,  # Weight of technical analysis
            "volume_weight": 0.3,  # Weight of volume analysis
        }
    
    def init_database(self):
        """Initialize analysis database"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS analysis_results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    collection_address TEXT,
                    collection_name TEXT,
                    analysis_timestamp DATETIME,
                    overall_signal TEXT,
                    confidence_score REAL,
                    discord_sentiment REAL,
                    technical_score REAL,
                    volume_score REAL,
                    price_prediction REAL,
                    key_insights TEXT,
                    recommended_action TEXT
                )
            """)
    
    async def analyze_nft_market(self, collection_address: Optional[str] = None) -> Dict[str, Any]:
        """Comprehensive NFT market analysis"""
        self.logger.info("Starting comprehensive NFT market analysis")
        
        if collection_address:
            return await self.analyze_specific_collection(collection_address)
        else:
            return await self.analyze_market_overview()
    
    async def analyze_specific_collection(self, contract_address: str) -> Dict[str, Any]:
        """Analyze a specific NFT collection"""
        try:
            # Get collection data from PaintSwap
            collection_stats = self.paintswap.get_collection_stats(contract_address)
            if "error" in collection_stats:
                return {"error": "Failed to fetch collection data"}
            
            stats = collection_stats["data"]
            
            # Get price history
            price_history = self.paintswap.get_price_history(contract_address, days=30)
            
            # Analyze Discord sentiment
            discord_sentiment = self.get_discord_sentiment(contract_address)
            
            # Technical analysis
            technical_analysis = self.perform_technical_analysis(stats, price_history["data"])
            
            # Volume analysis
            volume_analysis = self.analyze_volume_trends(stats)
            
            # Generate overall signal
            overall_signal = self.generate_market_signal(
                discord_sentiment, technical_analysis, volume_analysis, stats
            )
            
            # Store analysis
            analysis_result = {
                "collection_address": contract_address,
                "collection_name": stats.get("name", "Unknown"),
                "timestamp": datetime.now().isoformat(),
                "overall_signal": overall_signal["signal"],
                "confidence": overall_signal["confidence"],
                "discord_sentiment": discord_sentiment,
                "technical_analysis": technical_analysis,
                "volume_analysis": volume_analysis,
                "current_stats": stats,
                "price_prediction": overall_signal.get("price_target"),
                "insights": overall_signal.get("insights", []),
                "recommended_action": overall_signal.get("action", "HOLD")
            }
            
            self.store_analysis_result(analysis_result)
            self.logger.info(f"Analysis completed for {stats.get('name', 'Unknown')}")
            
            return analysis_result
            
        except Exception as e:
            self.logger.error(f"Analysis failed: {e}")
            return {"error": f"Analysis failed: {str(e)}"}
    
    async def analyze_market_overview(self) -> Dict[str, Any]:
        """Analyze overall NFT market trends"""
        try:
            # Get top collections
            top_collections = self.paintswap.get_top_collections(limit=20)
            if "error" in top_collections:
                return {"error": "Failed to fetch market data"}
            
            # Get market trends
            market_trends = self.paintswap.get_market_trends()
            
            # Analyze each top collection
            collection_analyses = []
            for collection in top_collections["data"][:5]:  # Analyze top 5
                analysis = await self.analyze_specific_collection(
                    collection["contract_address"]
                )
                if "error" not in analysis:
                    collection_analyses.append(analysis)
            
            # Generate market summary
            market_summary = self.generate_market_summary(
                market_trends["data"], collection_analyses
            )
            
            return {
                "market_overview": market_trends["data"],
                "top_collections_analysis": collection_analyses,
                "market_summary": market_summary,
                "timestamp": datetime.now().isoformat(),
                "total_collections_analyzed": len(collection_analyses)
            }
            
        except Exception as e:
            self.logger.error(f"Market overview analysis failed: {e}")
            return {"error": f"Market analysis failed: {str(e)}"}
    
    def get_discord_sentiment(self, collection_address: str) -> float:
        """Get Discord sentiment score for collection"""
        try:
            with sqlite3.connect(self.discord_monitor.db_path) as conn:
                cursor = conn.execute("""
                    SELECT sentiment, engagement_score 
                    FROM nft_mentions 
                    WHERE nft_collections LIKE ? 
                    AND timestamp > datetime('now', '-7 days')
                """, (f'%{collection_address}%',))
                
                mentions = cursor.fetchall()
                
                if not mentions:
                    return 0.0
                
                # Calculate weighted sentiment
                total_weight = 0
                weighted_sentiment = 0
                
                for sentiment, engagement in mentions:
                    weight = 1 + engagement  # Base weight + engagement
                    
                    if sentiment == "positive":
                        sentiment_score = 1.0
                    elif sentiment == "negative":
                        sentiment_score = -1.0
                    else:
                        sentiment_score = 0.0
                    
                    weighted_sentiment += sentiment_score * weight
                    total_weight += weight
                
                return weighted_sentiment / total_weight if total_weight > 0 else 0.0
                
        except Exception as e:
            self.logger.warning(f"Discord sentiment analysis failed: {e}")
            return 0.0
    
    def perform_technical_analysis(self, stats: Dict, price_history: List[Dict]) -> Dict[str, Any]:
        """Perform technical analysis on collection"""
        try:
            if not price_history or len(price_history) < 7:
                return {"score": 0.0, "indicators": [], "trend": "insufficient_data"}
            
            # Calculate moving averages
            prices = [float(day["floor_price"]) for day in price_history]
            
            # 7-day moving average
            ma_7 = sum(prices[-7:]) / 7 if len(prices) >= 7 else prices[-1]
            
            # 14-day moving average
            ma_14 = sum(prices[-14:]) / 14 if len(prices) >= 14 else ma_7
            
            # Current price trend
            current_price = prices[-1]
            price_change_7d = ((current_price - prices[-7]) / prices[-7]) * 100 if len(prices) >= 7 else 0
            
            # Volume trend
            volumes = [float(day["volume"]) for day in price_history]
            avg_volume = sum(volumes) / len(volumes)
            recent_volume = sum(volumes[-3:]) / 3  # Last 3 days average
            volume_trend = ((recent_volume - avg_volume) / avg_volume) * 100
            
            # Generate technical score
            technical_score = 0.0
            indicators = []
            
            # Price momentum
            if price_change_7d > 10:
                technical_score += 0.3
                indicators.append("Strong uptrend")
            elif price_change_7d > 0:
                technical_score += 0.1
                indicators.append("Uptrend")
            elif price_change_7d < -10:
                technical_score -= 0.3
                indicators.append("Strong downtrend")
            else:
                technical_score -= 0.1
                indicators.append("Downtrend")
            
            # Moving average crossover
            if current_price > ma_7 > ma_14:
                technical_score += 0.2
                indicators.append("MA bullish crossover")
            elif current_price < ma_7 < ma_14:
                technical_score -= 0.2
                indicators.append("MA bearish crossover")
            
            # Volume analysis
            if volume_trend > 20:
                technical_score += 0.2
                indicators.append("Volume surge")
            elif volume_trend < -20:
                technical_score -= 0.1
                indicators.append("Volume decline")
            
            # Determine overall trend
            if technical_score > 0.3:
                trend = "bullish"
            elif technical_score < -0.3:
                trend = "bearish"
            else:
                trend = "neutral"
            
            return {
                "score": max(-1.0, min(1.0, technical_score)),  # Normalize to -1 to 1
                "indicators": indicators,
                "trend": trend,
                "price_change_7d": price_change_7d,
                "volume_trend": volume_trend,
                "ma_7": ma_7,
                "ma_14": ma_14
            }
            
        except Exception as e:
            self.logger.warning(f"Technical analysis failed: {e}")
            return {"score": 0.0, "indicators": ["Analysis failed"], "trend": "unknown"}
    
    def analyze_volume_trends(self, stats: Dict) -> Dict[str, Any]:
        """Analyze volume trends and patterns"""
        try:
            volume_24h = float(stats.get("volume_24h", 0))
            volume_7d = float(stats.get("volume_7d", 0))
            volume_change = float(stats.get("volume_change_24h", 0))
            
            # Volume score based on relative changes and absolute values
            volume_score = 0.0
            insights = []
            
            # Volume change analysis
            if volume_change > 50:
                volume_score += 0.4
                insights.append("Exceptional volume surge")
            elif volume_change > 20:
                volume_score += 0.2
                insights.append("High volume increase")
            elif volume_change < -30:
                volume_score -= 0.3
                insights.append("Volume declining significantly")
            elif volume_change < -10:
                volume_score -= 0.1
                insights.append("Volume decrease")
            
            # Absolute volume analysis
            avg_daily_volume = volume_7d / 7 if volume_7d > 0 else volume_24h
            
            if volume_24h > avg_daily_volume * 2:
                volume_score += 0.3
                insights.append("Volume above average")
            elif volume_24h < avg_daily_volume * 0.5:
                volume_score -= 0.2
                insights.append("Volume below average")
            
            return {
                "score": max(-1.0, min(1.0, volume_score)),
                "volume_24h": volume_24h,
                "volume_change": volume_change,
                "insights": insights,
                "trend": "increasing" if volume_change > 0 else "decreasing"
            }
            
        except Exception as e:
            self.logger.warning(f"Volume analysis failed: {e}")
            return {"score": 0.0, "insights": ["Volume analysis unavailable"], "trend": "unknown"}
    
    def generate_market_signal(self, discord_sentiment: float, technical_analysis: Dict, 
                             volume_analysis: Dict, stats: Dict) -> Dict[str, Any]:
        """Generate overall market signal based on all factors"""
        try:
            # Weight the different factors
            discord_weight = self.analysis_config["discord_weight"]
            technical_weight = self.analysis_config["technical_weight"]
            volume_weight = self.analysis_config["volume_weight"]
            
            # Calculate composite score
            composite_score = (
                discord_sentiment * discord_weight +
                technical_analysis["score"] * technical_weight +
                volume_analysis["score"] * volume_weight
            )
            
            # Determine signal type
            if composite_score > 0.4:
                signal = "STRONG_BUY"
            elif composite_score > 0.1:
                signal = "BUY"
            elif composite_score > -0.1:
                signal = "HOLD"
            elif composite_score > -0.4:
                signal = "SELL"
            else:
                signal = "STRONG_SELL"
            
            # Calculate confidence (based on agreement between indicators)
            confidence_factors = []
            if abs(discord_sentiment) > 0.3:
                confidence_factors.append(abs(discord_sentiment))
            if abs(technical_analysis["score"]) > 0.3:
                confidence_factors.append(abs(technical_analysis["score"]))
            if abs(volume_analysis["score"]) > 0.3:
                confidence_factors.append(abs(volume_analysis["score"]))
            
            confidence = sum(confidence_factors) / 3 if confidence_factors else 0.5
            confidence = max(0.0, min(1.0, confidence))
            
            # Generate insights
            insights = []
            insights.extend(technical_analysis.get("indicators", []))
            insights.extend(volume_analysis.get("insights", []))
            
            if discord_sentiment > 0.3:
                insights.append("Positive community sentiment")
            elif discord_sentiment < -0.3:
                insights.append("Negative community sentiment")
            
            # Price target estimation (very basic)
            current_price = float(stats.get("floor_price", 0))
            price_target = None
            
            if signal in ["STRONG_BUY", "BUY"] and current_price > 0:
                multiplier = 1.1 if signal == "BUY" else 1.2
                price_target = current_price * multiplier
            elif signal in ["SELL", "STRONG_SELL"] and current_price > 0:
                multiplier = 0.9 if signal == "SELL" else 0.8
                price_target = current_price * multiplier
            
            return {
                "signal": signal,
                "confidence": confidence,
                "composite_score": composite_score,
                "price_target": price_target,
                "insights": insights,
                "action": signal.replace("_", " "),
                "discord_contribution": discord_sentiment * discord_weight,
                "technical_contribution": technical_analysis["score"] * technical_weight,
                "volume_contribution": volume_analysis["score"] * volume_weight
            }
            
        except Exception as e:
            self.logger.warning(f"Signal generation failed: {e}")
            return {
                "signal": "HOLD",
                "confidence": 0.0,
                "insights": ["Signal generation failed"],
                "action": "HOLD"
            }
    
    def generate_market_summary(self, market_trends: Dict, collection_analyses: List[Dict]) -> Dict[str, Any]:
        """Generate overall market summary"""
        try:
            if not collection_analyses:
                return {"error": "No collection analyses available"}
            
            # Aggregate signals
            signals = [analysis["overall_signal"] for analysis in collection_analyses]
            signal_counts = {}
            for signal in signals:
                signal_counts[signal] = signal_counts.get(signal, 0) + 1
            
            # Most common signal
            dominant_signal = max(signal_counts, key=signal_counts.get)
            
            # Average confidence
            avg_confidence = sum(analysis["confidence"] for analysis in collection_analyses) / len(collection_analyses)
            
            # Market sentiment
            if dominant_signal in ["STRONG_BUY", "BUY"]:
                market_sentiment = "bullish"
            elif dominant_signal in ["STRONG_SELL", "SELL"]:
                market_sentiment = "bearish"
            else:
                market_sentiment = "neutral"
            
            # Key insights
            all_insights = []
            for analysis in collection_analyses:
                all_insights.extend(analysis.get("insights", []))
            
            # Count insight frequency
            insight_counts = {}
            for insight in all_insights:
                insight_counts[insight] = insight_counts.get(insight, 0) + 1
            
            # Top insights
            top_insights = sorted(insight_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            
            return {
                "dominant_signal": dominant_signal,
                "market_sentiment": market_sentiment,
                "average_confidence": round(avg_confidence, 3),
                "signal_distribution": signal_counts,
                "total_volume_24h": market_trends.get("total_volume", 0),
                "total_sales_24h": market_trends.get("total_sales", 0),
                "top_insights": [insight[0] for insight in top_insights],
                "collections_analyzed": len(collection_analyses),
                "summary": f"Market shows {market_sentiment} sentiment with {dominant_signal} as dominant signal across {len(collection_analyses)} collections"
            }
            
        except Exception as e:
            self.logger.warning(f"Market summary generation failed: {e}")
            return {"error": f"Summary generation failed: {str(e)}"}
    
    def store_analysis_result(self, result: Dict[str, Any]):
        """Store analysis result in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO analysis_results
                    (collection_address, collection_name, analysis_timestamp,
                     overall_signal, confidence_score, discord_sentiment,
                     technical_score, volume_score, price_prediction,
                     key_insights, recommended_action)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    result["collection_address"],
                    result["collection_name"],
                    result["timestamp"],
                    result["overall_signal"],
                    result["confidence"],
                    result["discord_sentiment"],
                    result.get("technical_analysis", {}).get("score", 0),
                    result.get("volume_analysis", {}).get("score", 0),
                    result.get("price_prediction"),
                    json.dumps(result.get("insights", [])),
                    result["recommended_action"]
                ))
        except Exception as e:
            self.logger.warning(f"Failed to store analysis result: {e}")
    
    async def start_continuous_monitoring(self):
        """Start continuous monitoring and analysis"""
        self.logger.info("Starting continuous NFT market monitoring")
        
        # Start Discord monitoring in background
        discord_task = asyncio.create_task(self.discord_monitor.start_monitoring())
        
        # Periodic analysis task
        while True:
            try:
                # Run market overview analysis every hour
                self.logger.info("Running scheduled market analysis")
                market_analysis = await self.analyze_market_overview()
                
                if "error" not in market_analysis:
                    self.logger.info("Market analysis completed successfully")
                else:
                    self.logger.warning(f"Market analysis failed: {market_analysis['error']}")
                
                # Wait 1 hour before next analysis
                await asyncio.sleep(3600)
                
            except Exception as e:
                self.logger.error(f"Monitoring error: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error
    
    def get_recent_analyses(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent analysis results"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT * FROM analysis_results
                    ORDER BY analysis_timestamp DESC
                    LIMIT ?
                """, (limit,))
                
                columns = [desc[0] for desc in cursor.description]
                results = []
                
                for row in cursor.fetchall():
                    result = dict(zip(columns, row))
                    # Parse JSON fields
                    result["key_insights"] = json.loads(result["key_insights"])
                    results.append(result)
                
                return results
                
        except Exception as e:
            self.logger.warning(f"Failed to retrieve analyses: {e}")
            return []

# Test function
async def test_nft_analyst():
    """Test NFT Market Analyst"""
    print("🎯 Testing NFT Market Analyst...")
    
    analyst = NFTMarketAnalyst()
    
    try:
        # Test market overview
        print("\n📊 Running market overview analysis...")
        market_analysis = await analyst.analyze_market_overview()
        
        if "error" not in market_analysis:
            print("✅ Market analysis successful")
            print(f"   Collections analyzed: {market_analysis.get('total_collections_analyzed', 0)}")
            
            if "market_summary" in market_analysis:
                summary = market_analysis["market_summary"]
                print(f"   Market sentiment: {summary.get('market_sentiment', 'unknown')}")
                print(f"   Dominant signal: {summary.get('dominant_signal', 'unknown')}")
        else:
            print(f"⚠️  Market analysis failed: {market_analysis['error']}")
        
        return True
        
    except Exception as e:
        print(f"❌ NFT Analyst test failed: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_nft_analyst())