#!/usr/bin/env python3
"""
CoinCodex Watchlist Data Pipeline - ServiceFlow AI
Automated data collection and monitoring pipeline for CoinCodex watchlist
"""

import os
import json
import sqlite3
import asyncio
import schedule
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
from dataclasses import dataclass, asdict
import pandas as pd
import threading

from ecosystem_analyst import CoinCodexAPI, CoinCodexData, WatchlistManager
from enhanced_logging import ServiceFlowLogger
from config_manager import ConfigManager

@dataclass
class PipelineMetrics:
    """Pipeline execution metrics"""
    pipeline_id: str
    started_at: datetime
    completed_at: Optional[datetime]
    coins_processed: int
    errors_encountered: int
    alerts_generated: int
    execution_time_seconds: float
    status: str  # "running", "completed", "failed"

@dataclass
class AlertConfig:
    """Alert configuration for watchlist monitoring"""
    alert_id: str
    coin_id: str
    alert_type: str  # "price_change", "volume_spike", "market_cap_change"
    threshold_value: float
    comparison: str  # "above", "below", "change_percent"
    enabled: bool = True
    created_at: datetime = None

class CoinCodexDataPipeline:
    """Automated data pipeline for CoinCodex watchlist monitoring"""
    
    def __init__(self, config_path: str = "config.json"):
        self.config = ConfigManager(config_path)
        self.logger = ServiceFlowLogger("coincodex_pipeline")
        
        # Initialize components
        self.coincodx_api = CoinCodexAPI(self.config.get("COINCODEX_API_KEY"))
        self.watchlist_manager = WatchlistManager()
        
        # Pipeline configuration
        self.db_path = "tmp/coincodx_pipeline.db"
        self.pipeline_config = {
            "update_interval_minutes": 60,  # Update every hour
            "alert_check_interval_minutes": 15,  # Check alerts every 15 minutes
            "data_retention_days": 30,  # Keep 30 days of historical data
            "max_retries": 3,
            "retry_delay_seconds": 60
        }
        
        # Initialize database
        self.init_database()
        
        # Setup default alert configurations
        self.setup_default_alerts()
        
        # Pipeline state
        self.is_running = False
        self.current_pipeline = None
        self.scheduler_thread = None
    
    def init_database(self):
        """Initialize pipeline database"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            # Pipeline execution logs
            conn.execute("""
                CREATE TABLE IF NOT EXISTS pipeline_executions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pipeline_id TEXT UNIQUE,
                    started_at DATETIME,
                    completed_at DATETIME,
                    coins_processed INTEGER,
                    errors_encountered INTEGER,
                    alerts_generated INTEGER,
                    execution_time_seconds REAL,
                    status TEXT,
                    error_details TEXT
                )
            """)
            
            # Alert configurations
            conn.execute("""
                CREATE TABLE IF NOT EXISTS alert_configs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    alert_id TEXT UNIQUE,
                    coin_id TEXT,
                    alert_type TEXT,
                    threshold_value REAL,
                    comparison TEXT,
                    enabled BOOLEAN DEFAULT TRUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Historical data snapshots
            conn.execute("""
                CREATE TABLE IF NOT EXISTS historical_snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    snapshot_id TEXT,
                    coin_id TEXT,
                    price_usd REAL,
                    market_cap REAL,
                    volume_24h REAL,
                    change_1h REAL,
                    change_24h REAL,
                    change_7d REAL,
                    change_30d REAL,
                    supply_circulating REAL,
                    supply_total REAL,
                    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    pipeline_id TEXT
                )
            """)
            
            # Data quality metrics
            conn.execute("""
                CREATE TABLE IF NOT EXISTS data_quality_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pipeline_id TEXT,
                    coin_id TEXT,
                    data_completeness_score REAL,
                    data_freshness_minutes INTEGER,
                    api_response_time_ms INTEGER,
                    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
    
    def setup_default_alerts(self):
        """Setup default alert configurations for key coins"""
        default_alerts = [
            # Price change alerts
            AlertConfig("btc_price_change_10", "bitcoin", "price_change", 10.0, "change_percent"),
            AlertConfig("eth_price_change_10", "ethereum", "price_change", 10.0, "change_percent"),
            AlertConfig("sonic_price_change_15", "sonic", "price_change", 15.0, "change_percent"),
            
            # Volume spike alerts
            AlertConfig("btc_volume_spike", "bitcoin", "volume_spike", 50.0, "change_percent"),
            AlertConfig("eth_volume_spike", "ethereum", "volume_spike", 50.0, "change_percent"),
            AlertConfig("sonic_volume_spike", "sonic", "volume_spike", 100.0, "change_percent"),
            
            # Market cap alerts
            AlertConfig("sonic_mcap_change", "sonic", "market_cap_change", 20.0, "change_percent"),
        ]
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                for alert in default_alerts:
                    conn.execute("""
                        INSERT OR IGNORE INTO alert_configs
                        (alert_id, coin_id, alert_type, threshold_value, comparison, enabled)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        alert.alert_id, alert.coin_id, alert.alert_type,
                        alert.threshold_value, alert.comparison, alert.enabled
                    ))
            
            self.logger.info(f"Setup {len(default_alerts)} default alert configurations")
            
        except Exception as e:
            self.logger.error(f"Failed to setup default alerts: {e}")
    
    async def run_data_collection_pipeline(self) -> PipelineMetrics:
        """Run the main data collection pipeline"""
        pipeline_id = f"pipeline_{int(time.time())}"
        start_time = datetime.now()
        
        self.logger.info(f"Starting data collection pipeline: {pipeline_id}")
        
        metrics = PipelineMetrics(
            pipeline_id=pipeline_id,
            started_at=start_time,
            completed_at=None,
            coins_processed=0,
            errors_encountered=0,
            alerts_generated=0,
            execution_time_seconds=0,
            status="running"
        )
        
        self.current_pipeline = metrics
        
        try:
            # Step 1: Get watchlist coins
            watchlist_summary = self.watchlist_manager.get_watchlist_summary()
            if "error" in watchlist_summary:
                raise Exception(f"Failed to get watchlist: {watchlist_summary['error']}")
            
            # Step 2: Get coin IDs from watchlist database
            coin_ids = self._get_watchlist_coin_ids()
            self.logger.info(f"Processing {len(coin_ids)} coins from watchlist")
            
            # Step 3: Collect data for each coin
            collected_data = []
            for coin_id in coin_ids:
                try:
                    coin_data = await self._collect_coin_data(coin_id, pipeline_id)
                    if coin_data:
                        collected_data.append(coin_data)
                        metrics.coins_processed += 1
                    
                    # Rate limiting
                    await asyncio.sleep(1)
                    
                except Exception as e:
                    self.logger.error(f"Failed to collect data for {coin_id}: {e}")
                    metrics.errors_encountered += 1
            
            # Step 4: Store historical snapshots
            await self._store_historical_snapshots(collected_data, pipeline_id)
            
            # Step 5: Check alerts
            alerts_generated = await self._check_and_trigger_alerts(collected_data)
            metrics.alerts_generated = alerts_generated
            
            # Step 6: Clean old data
            await self._cleanup_old_data()
            
            # Mark as completed
            end_time = datetime.now()
            metrics.completed_at = end_time
            metrics.execution_time_seconds = (end_time - start_time).total_seconds()
            metrics.status = "completed"
            
            # Store pipeline metrics
            await self._store_pipeline_metrics(metrics)
            
            self.logger.info(f"Pipeline {pipeline_id} completed successfully")
            self.logger.info(f"  Processed: {metrics.coins_processed} coins")
            self.logger.info(f"  Errors: {metrics.errors_encountered}")
            self.logger.info(f"  Alerts: {metrics.alerts_generated}")
            self.logger.info(f"  Duration: {metrics.execution_time_seconds:.2f} seconds")
            
            return metrics
            
        except Exception as e:
            # Mark as failed
            end_time = datetime.now()
            metrics.completed_at = end_time
            metrics.execution_time_seconds = (end_time - start_time).total_seconds()
            metrics.status = "failed"
            
            # Store failed pipeline metrics
            await self._store_pipeline_metrics(metrics, error_details=str(e))
            
            self.logger.error(f"Pipeline {pipeline_id} failed: {e}")
            raise
    
    def _get_watchlist_coin_ids(self) -> List[str]:
        """Get coin IDs from watchlist database"""
        try:
            with sqlite3.connect(self.watchlist_manager.db_path) as conn:
                cursor = conn.execute("SELECT coin_id FROM watchlist WHERE coin_id IS NOT NULL")
                return [row[0] for row in cursor.fetchall()]
        except Exception as e:
            self.logger.error(f"Failed to get watchlist coin IDs: {e}")
            return ["bitcoin", "ethereum", "sonic"]  # Fallback
    
    async def _collect_coin_data(self, coin_id: str, pipeline_id: str) -> Optional[CoinCodexData]:
        """Collect data for a specific coin with quality metrics"""
        start_time = time.time()
        
        try:
            coin_data = self.coincodx_api.get_coin_details(coin_id)
            
            if coin_data:
                # Calculate data quality metrics
                response_time_ms = int((time.time() - start_time) * 1000)
                completeness_score = self._calculate_data_completeness(coin_data)
                
                # Store quality metrics
                await self._store_data_quality_metrics(
                    pipeline_id, coin_id, completeness_score, 0, response_time_ms
                )
                
                return coin_data
            else:
                self.logger.warning(f"No data received for {coin_id}")
                return None
                
        except Exception as e:
            self.logger.error(f"Failed to collect data for {coin_id}: {e}")
            return None
    
    def _calculate_data_completeness(self, coin_data: CoinCodexData) -> float:
        """Calculate data completeness score (0-1)"""
        required_fields = [
            'price_usd', 'market_cap', 'volume_24h', 'change_24h'
        ]
        
        available_fields = 0
        for field in required_fields:
            value = getattr(coin_data, field, None)
            if value is not None and value != 0:
                available_fields += 1
        
        return available_fields / len(required_fields)
    
    async def _store_historical_snapshots(self, coin_data_list: List[CoinCodexData], pipeline_id: str):
        """Store historical data snapshots"""
        try:
            snapshot_id = f"snapshot_{int(time.time())}"
            
            with sqlite3.connect(self.db_path) as conn:
                for coin_data in coin_data_list:
                    conn.execute("""
                        INSERT INTO historical_snapshots
                        (snapshot_id, coin_id, price_usd, market_cap, volume_24h,
                         change_1h, change_24h, change_7d, change_30d,
                         supply_circulating, supply_total, pipeline_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        snapshot_id, coin_data.coin_id, coin_data.price_usd,
                        coin_data.market_cap, coin_data.volume_24h,
                        coin_data.change_1h, coin_data.change_24h,
                        coin_data.change_7d, coin_data.change_30d,
                        coin_data.supply_circulating, coin_data.supply_total,
                        pipeline_id
                    ))
            
            self.logger.info(f"Stored {len(coin_data_list)} historical snapshots")
            
        except Exception as e:
            self.logger.error(f"Failed to store historical snapshots: {e}")
    
    async def _check_and_trigger_alerts(self, coin_data_list: List[CoinCodexData]) -> int:
        """Check coin data against alert configurations"""
        alerts_triggered = 0
        
        try:
            # Get active alert configurations
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT alert_id, coin_id, alert_type, threshold_value, comparison
                    FROM alert_configs WHERE enabled = TRUE
                """)
                alert_configs = cursor.fetchall()
            
            # Check each coin against relevant alerts
            for coin_data in coin_data_list:
                relevant_alerts = [a for a in alert_configs if a[1] == coin_data.coin_id]
                
                for alert in relevant_alerts:
                    alert_id, coin_id, alert_type, threshold, comparison = alert
                    
                    if self._evaluate_alert_condition(coin_data, alert_type, threshold, comparison):
                        await self._trigger_alert(alert_id, coin_data, alert_type, threshold)
                        alerts_triggered += 1
            
            return alerts_triggered
            
        except Exception as e:
            self.logger.error(f"Failed to check alerts: {e}")
            return 0
    
    def _evaluate_alert_condition(self, coin_data: CoinCodexData, alert_type: str, 
                                 threshold: float, comparison: str) -> bool:
        """Evaluate if alert condition is met"""
        try:
            if alert_type == "price_change" and comparison == "change_percent":
                return abs(coin_data.change_24h) >= threshold
            
            elif alert_type == "volume_spike" and comparison == "change_percent":
                # For volume spike, we'd need historical data to compare
                # For now, just check if volume is unusually high (simplified)
                return coin_data.volume_24h > coin_data.market_cap * 0.1  # 10% of market cap
            
            elif alert_type == "market_cap_change" and comparison == "change_percent":
                # Similar to price change for now
                return abs(coin_data.change_24h) >= threshold
            
            return False
            
        except Exception as e:
            self.logger.error(f"Failed to evaluate alert condition: {e}")
            return False
    
    async def _trigger_alert(self, alert_id: str, coin_data: CoinCodexData, 
                           alert_type: str, threshold: float):
        """Trigger alert and store in database"""
        try:
            message = self._generate_alert_message(coin_data, alert_type, threshold)
            
            # Store alert in watchlist manager
            self.watchlist_manager.check_alerts(coin_data)
            
            self.logger.info(f"Alert triggered: {message}")
            
        except Exception as e:
            self.logger.error(f"Failed to trigger alert {alert_id}: {e}")
    
    def _generate_alert_message(self, coin_data: CoinCodexData, alert_type: str, threshold: float) -> str:
        """Generate alert message"""
        if alert_type == "price_change":
            return f"{coin_data.name} ({coin_data.symbol}) price changed {coin_data.change_24h:.2f}% (threshold: {threshold}%)"
        elif alert_type == "volume_spike":
            return f"{coin_data.name} ({coin_data.symbol}) volume spike detected: ${coin_data.volume_24h:,.0f}"
        elif alert_type == "market_cap_change":
            return f"{coin_data.name} ({coin_data.symbol}) market cap change: ${coin_data.market_cap:,.0f}"
        else:
            return f"{coin_data.name} ({coin_data.symbol}) alert: {alert_type}"
    
    async def _store_data_quality_metrics(self, pipeline_id: str, coin_id: str, 
                                        completeness_score: float, freshness_minutes: int, 
                                        response_time_ms: int):
        """Store data quality metrics"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO data_quality_metrics
                    (pipeline_id, coin_id, data_completeness_score, 
                     data_freshness_minutes, api_response_time_ms)
                    VALUES (?, ?, ?, ?, ?)
                """, (pipeline_id, coin_id, completeness_score, freshness_minutes, response_time_ms))
            
        except Exception as e:
            self.logger.error(f"Failed to store data quality metrics: {e}")
    
    async def _cleanup_old_data(self):
        """Clean up old historical data"""
        try:
            retention_days = self.pipeline_config["data_retention_days"]
            cutoff_date = datetime.now() - timedelta(days=retention_days)
            
            with sqlite3.connect(self.db_path) as conn:
                # Clean historical snapshots
                result = conn.execute("""
                    DELETE FROM historical_snapshots 
                    WHERE recorded_at < ?
                """, (cutoff_date,))
                
                snapshots_deleted = result.rowcount
                
                # Clean pipeline executions (keep more recent)
                cutoff_date_executions = datetime.now() - timedelta(days=retention_days * 2)
                result = conn.execute("""
                    DELETE FROM pipeline_executions 
                    WHERE started_at < ?
                """, (cutoff_date_executions,))
                
                executions_deleted = result.rowcount
                
                # Clean data quality metrics
                result = conn.execute("""
                    DELETE FROM data_quality_metrics 
                    WHERE recorded_at < ?
                """, (cutoff_date,))
                
                metrics_deleted = result.rowcount
            
            self.logger.info(f"Cleaned up old data: {snapshots_deleted} snapshots, "
                           f"{executions_deleted} executions, {metrics_deleted} metrics")
            
        except Exception as e:
            self.logger.error(f"Failed to cleanup old data: {e}")
    
    async def _store_pipeline_metrics(self, metrics: PipelineMetrics, error_details: str = None):
        """Store pipeline execution metrics"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO pipeline_executions
                    (pipeline_id, started_at, completed_at, coins_processed,
                     errors_encountered, alerts_generated, execution_time_seconds,
                     status, error_details)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    metrics.pipeline_id, metrics.started_at, metrics.completed_at,
                    metrics.coins_processed, metrics.errors_encountered,
                    metrics.alerts_generated, metrics.execution_time_seconds,
                    metrics.status, error_details
                ))
            
        except Exception as e:
            self.logger.error(f"Failed to store pipeline metrics: {e}")
    
    def start_scheduled_pipeline(self):
        """Start the scheduled data pipeline"""
        if self.is_running:
            self.logger.warning("Pipeline is already running")
            return
        
        self.is_running = True
        self.logger.info("Starting scheduled CoinCodex data pipeline")
        
        # Schedule data collection
        update_interval = self.pipeline_config["update_interval_minutes"]
        schedule.every(update_interval).minutes.do(self._run_pipeline_sync)
        
        # Schedule alert checks (more frequent)
        alert_interval = self.pipeline_config["alert_check_interval_minutes"]
        schedule.every(alert_interval).minutes.do(self._check_alerts_sync)
        
        # Start scheduler in separate thread
        self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.scheduler_thread.start()
        
        # Run initial pipeline
        asyncio.create_task(self.run_data_collection_pipeline())
    
    def stop_scheduled_pipeline(self):
        """Stop the scheduled data pipeline"""
        self.is_running = False
        schedule.clear()
        self.logger.info("Stopped scheduled CoinCodex data pipeline")
    
    def _run_scheduler(self):
        """Run the scheduler loop"""
        while self.is_running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def _run_pipeline_sync(self):
        """Synchronous wrapper for running pipeline"""
        try:
            asyncio.create_task(self.run_data_collection_pipeline())
        except Exception as e:
            self.logger.error(f"Failed to run scheduled pipeline: {e}")
    
    def _check_alerts_sync(self):
        """Synchronous wrapper for checking alerts"""
        try:
            # Update watchlist data (which includes alert checking)
            self.watchlist_manager.update_watchlist_data()
        except Exception as e:
            self.logger.error(f"Failed to run scheduled alert check: {e}")
    
    def get_pipeline_status(self) -> Dict[str, Any]:
        """Get current pipeline status and recent metrics"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Get most recent pipeline execution
                cursor = conn.execute("""
                    SELECT * FROM pipeline_executions 
                    ORDER BY started_at DESC LIMIT 1
                """)
                
                recent_execution = cursor.fetchone()
                
                # Get data quality summary
                cursor = conn.execute("""
                    SELECT 
                        AVG(data_completeness_score) as avg_completeness,
                        AVG(api_response_time_ms) as avg_response_time,
                        COUNT(*) as total_measurements
                    FROM data_quality_metrics 
                    WHERE recorded_at > datetime('now', '-24 hours')
                """)
                
                quality_metrics = cursor.fetchone()
                
                # Get alert summary
                cursor = conn.execute("""
                    SELECT COUNT(*) FROM alert_configs WHERE enabled = TRUE
                """)
                active_alerts = cursor.fetchone()[0]
            
            status = {
                "is_running": self.is_running,
                "current_pipeline": self.current_pipeline.pipeline_id if self.current_pipeline else None,
                "recent_execution": {
                    "pipeline_id": recent_execution[1] if recent_execution else None,
                    "status": recent_execution[8] if recent_execution else None,
                    "coins_processed": recent_execution[3] if recent_execution else 0,
                    "alerts_generated": recent_execution[5] if recent_execution else 0,
                    "execution_time": recent_execution[6] if recent_execution else 0
                } if recent_execution else None,
                "data_quality": {
                    "avg_completeness": round(quality_metrics[0] or 0, 3),
                    "avg_response_time_ms": int(quality_metrics[1] or 0),
                    "total_measurements_24h": quality_metrics[2] or 0
                } if quality_metrics else None,
                "active_alerts": active_alerts,
                "configuration": self.pipeline_config
            }
            
            return status
            
        except Exception as e:
            self.logger.error(f"Failed to get pipeline status: {e}")
            return {"error": str(e)}
    
    def get_historical_data(self, coin_id: str, days: int = 7) -> List[Dict[str, Any]]:
        """Get historical data for a specific coin"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT * FROM historical_snapshots 
                    WHERE coin_id = ? AND recorded_at > ?
                    ORDER BY recorded_at ASC
                """, (coin_id, cutoff_date))
                
                columns = [desc[0] for desc in cursor.description]
                data = []
                
                for row in cursor.fetchall():
                    data.append(dict(zip(columns, row)))
                
                return data
                
        except Exception as e:
            self.logger.error(f"Failed to get historical data for {coin_id}: {e}")
            return []

# Test and demo functions
async def test_coincodx_pipeline():
    """Test the CoinCodex data pipeline"""
    print("🔄 Testing CoinCodex Data Pipeline...")
    
    pipeline = CoinCodexDataPipeline()
    
    try:
        # Test pipeline execution
        print("\n📊 Running data collection pipeline...")
        metrics = await pipeline.run_data_collection_pipeline()
        
        print("✅ Pipeline execution successful")
        print(f"   Pipeline ID: {metrics.pipeline_id}")
        print(f"   Coins processed: {metrics.coins_processed}")
        print(f"   Errors: {metrics.errors_encountered}")
        print(f"   Alerts generated: {metrics.alerts_generated}")
        print(f"   Execution time: {metrics.execution_time_seconds:.2f}s")
        
        # Test pipeline status
        print("\n📈 Getting pipeline status...")
        status = pipeline.get_pipeline_status()
        
        if "error" not in status:
            print("✅ Pipeline status retrieved")
            print(f"   Is running: {status['is_running']}")
            print(f"   Active alerts: {status['active_alerts']}")
        else:
            print(f"⚠️  Status retrieval failed: {status['error']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Pipeline test failed: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_coincodx_pipeline())