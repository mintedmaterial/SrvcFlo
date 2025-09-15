"""
MongoDB Storage implementation for ServiceFlow AI team agents
"""
import os
from pathlib import Path
from agno.storage.mongodb import MongoDbStorage
from agno.storage.sqlite import SqliteStorage
import logging

logger = logging.getLogger(__name__)

def get_mongodb_storage_for_team(db_url: str, collection_name: str, db_name: str = "myserviceprovider"):
    """
    Create MongoDB storage for team agents with SQLite fallback
    
    Args:
        db_url: MongoDB connection string
        collection_name: Collection name for the agent
        db_name: Database name (default: myserviceprovider)
    
    Returns:
        MongoDbStorage or SqliteStorage instance
    """
    try:
        # Try MongoDB first
        return MongoDbStorage(
            collection_name=collection_name,
            db_url=db_url,
            db_name=db_name
        )
    except Exception as e:
        logger.warning(f"MongoDB storage failed for {collection_name}, using SQLite fallback: {e}")
        
        # Fallback to SQLite
        # Create a temporary directory for SQLite files if it doesn't exist
        current_dir = Path(__file__).parent
        tmp_dir = current_dir.parent / "tmp"
        tmp_dir.mkdir(exist_ok=True)
        
        return SqliteStorage(
            table_name=collection_name,
            db_file=str(tmp_dir / "agents.db")
        )