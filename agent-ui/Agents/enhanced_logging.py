"""
Enhanced logging and error handling system for ServiceFlow AI agents
Provides comprehensive monitoring, debugging, and performance tracking capabilities
"""

import logging
import os
import json
import time
import traceback
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Union
from functools import wraps
import asyncio

# Create logs directory
LOGS_DIR = Path(__file__).parent / "tmp" / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)

class ServiceFlowLogger:
    """Enhanced logger for ServiceFlow AI agents with database integration"""
    
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.logger = logging.getLogger(f"serviceflow.{agent_name}")
        
        # Setup file handler
        log_file = LOGS_DIR / f"{agent_name}.log"
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        
        # Setup console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        # Add handlers to logger
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
        self.logger.setLevel(logging.DEBUG)
        
        # Setup database logging
        self._setup_db_logging()
    
    def _setup_db_logging(self):
        """Setup SQLite database for structured logging"""
        db_path = Path(__file__).parent / "tmp" / "agent_logs.db"
        self.conn = sqlite3.connect(str(db_path), check_same_thread=False)
        
        # Create logs table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS agent_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_name TEXT NOT NULL,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                error_type TEXT,
                stack_trace TEXT,
                metadata TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create performance table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS agent_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_name TEXT NOT NULL,
                operation TEXT NOT NULL,
                duration_ms INTEGER NOT NULL,
                success BOOLEAN NOT NULL,
                error_message TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        self.conn.commit()
    
    def log_to_db(self, level: str, message: str, error_type: str = None, 
                  stack_trace: str = None, metadata: Dict = None):
        """Log structured data to database"""
        try:
            self.conn.execute("""
                INSERT INTO agent_logs (agent_name, level, message, error_type, stack_trace, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                self.agent_name, 
                level, 
                message, 
                error_type, 
                stack_trace,
                json.dumps(metadata) if metadata else None
            ))
            self.conn.commit()
        except Exception as e:
            self.logger.error(f"Failed to log to database: {e}")
    
    def log_performance(self, operation: str, duration_ms: int, success: bool, error_message: str = None):
        """Log performance metrics"""
        try:
            self.conn.execute("""
                INSERT INTO agent_performance (agent_name, operation, duration_ms, success, error_message)
                VALUES (?, ?, ?, ?, ?)
            """, (self.agent_name, operation, duration_ms, success, error_message))
            self.conn.commit()
        except Exception as e:
            self.logger.error(f"Failed to log performance: {e}")
    
    def info(self, message: str, **kwargs):
        """Log info message"""
        self.logger.info(message)
        self.log_to_db("INFO", message, metadata=kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning message"""
        self.logger.warning(message)
        self.log_to_db("WARNING", message, metadata=kwargs)
    
    def error(self, message: str, error: Exception = None, **kwargs):
        """Log error message with optional exception"""
        self.logger.error(message)
        error_type = type(error).__name__ if error else None
        stack_trace = traceback.format_exc() if error else None
        self.log_to_db("ERROR", message, error_type, stack_trace, kwargs)
    
    def debug(self, message: str, **kwargs):
        """Log debug message"""
        self.logger.debug(message)
        self.log_to_db("DEBUG", message, metadata=kwargs)

def performance_monitor(operation_name: str = None):
    """Decorator to monitor function performance"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get agent name from self if available
            agent_name = "unknown"
            if args and hasattr(args[0], '__class__'):
                agent_name = args[0].__class__.__name__
            
            logger = ServiceFlowLogger(agent_name)
            op_name = operation_name or func.__name__
            
            start_time = time.time()
            success = True
            error_message = None
            
            try:
                result = func(*args, **kwargs)
                logger.info(f"Operation {op_name} completed successfully")
                return result
            except Exception as e:
                success = False
                error_message = str(e)
                logger.error(f"Operation {op_name} failed", error=e)
                raise
            finally:
                duration_ms = int((time.time() - start_time) * 1000)
                logger.log_performance(op_name, duration_ms, success, error_message)
        
        return wrapper
    return decorator

async def async_performance_monitor(operation_name: str = None):
    """Decorator to monitor async function performance"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get agent name from self if available
            agent_name = "unknown"
            if args and hasattr(args[0], '__class__'):
                agent_name = args[0].__class__.__name__
            
            logger = ServiceFlowLogger(agent_name)
            op_name = operation_name or func.__name__
            
            start_time = time.time()
            success = True
            error_message = None
            
            try:
                result = await func(*args, **kwargs)
                logger.info(f"Async operation {op_name} completed successfully")
                return result
            except Exception as e:
                success = False
                error_message = str(e)
                logger.error(f"Async operation {op_name} failed", error=e)
                raise
            finally:
                duration_ms = int((time.time() - start_time) * 1000)
                logger.log_performance(op_name, duration_ms, success, error_message)
        
        return wrapper
    return decorator

class AgentHealthChecker:
    """Health monitoring for ServiceFlow AI agents"""
    
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.logger = ServiceFlowLogger(agent_name)
        self.db_path = Path(__file__).parent / "tmp" / "agent_health.db"
        self._setup_health_db()
    
    def _setup_health_db(self):
        """Setup health monitoring database"""
        conn = sqlite3.connect(str(self.db_path))
        conn.execute("""
            CREATE TABLE IF NOT EXISTS agent_health (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_name TEXT NOT NULL,
                status TEXT NOT NULL,
                cpu_usage REAL,
                memory_usage REAL,
                database_connected BOOLEAN,
                api_responsive BOOLEAN,
                last_activity DATETIME,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()
    
    def check_database_connectivity(self) -> bool:
        """Check if agent databases are accessible"""
        try:
            # Check SQLite tmp databases
            tmp_dir = Path(__file__).parent / "tmp"
            if tmp_dir.exists():
                # Try to connect to a test database
                test_db = tmp_dir / "health_test.db"
                conn = sqlite3.connect(str(test_db))
                conn.execute("SELECT 1")
                conn.close()
                return True
            return False
        except Exception as e:
            self.logger.error("Database connectivity check failed", error=e)
            return False
    
    def check_api_status(self) -> bool:
        """Check if external APIs are responsive"""
        # This would check OpenAI, social media APIs, etc.
        # For now, return True as placeholder
        return True
    
    def record_health_status(self, status: str = "healthy"):
        """Record current agent health status"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            conn.execute("""
                INSERT INTO agent_health (
                    agent_name, status, database_connected, api_responsive, last_activity
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                self.agent_name,
                status,
                self.check_database_connectivity(),
                self.check_api_status(),
                datetime.now(timezone.utc)
            ))
            conn.commit()
            conn.close()
        except Exception as e:
            self.logger.error("Failed to record health status", error=e)

# Global logger instance
def get_logger(agent_name: str) -> ServiceFlowLogger:
    """Get or create a logger for an agent"""
    return ServiceFlowLogger(agent_name)

# Health checker instance
def get_health_checker(agent_name: str) -> AgentHealthChecker:
    """Get or create a health checker for an agent"""
    return AgentHealthChecker(agent_name)