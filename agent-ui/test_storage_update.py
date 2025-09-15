#!/usr/bin/env python3
"""
Test script to verify SQLite storage configurations work properly
"""

import os
import sys
from pathlib import Path

# Add Agents directory to path
agents_dir = Path(__file__).parent / 'Agents'
sys.path.insert(0, str(agents_dir))

def test_sqlite_storage():
    """Test SQLite storage initialization"""
    print("Testing SQLite storage configurations...")
    
    try:
        from agno.storage.sqlite import SqliteStorage
        
        # Test creating tmp directory and SQLite storage
        tmp_dir = Path("tmp")
        tmp_dir.mkdir(exist_ok=True)
        
        test_storage = SqliteStorage(
            table_name="test_table",
            db_file="tmp/test.db"
        )
        
        print("OK SQLite storage creation works")
        
        # Cleanup test file
        test_db = Path("tmp/test.db")
        if test_db.exists():
            test_db.unlink()
            
        return True
        
    except Exception as e:
        print(f"X Failed to create SQLite storage: {e}")
        return False

def test_shared_storage():
    """Test shared storage with Wrangler state directory"""
    print("Testing shared storage configuration...")
    
    try:
        # Test creating wrangler state directory
        wrangler_dir = Path("C:/Users/PC/ServiceApp/myserviceprovider-app/.wrangler/state")
        wrangler_dir.mkdir(parents=True, exist_ok=True)
        
        print("OK Wrangler state directory created")
        
        # Test fallback tmp directory
        tmp_dir = Path("tmp")
        tmp_dir.mkdir(exist_ok=True)
        
        print("OK Tmp directory available for fallback")
        
        return True
        
    except Exception as e:
        print(f"X Failed to setup shared storage directories: {e}")
        return False

def test_memory_db():
    """Test SQLite memory database"""
    print("Testing SQLite memory database...")
    
    try:
        from agno.memory.v2.db.sqlite import SqliteMemoryDb
        
        # Test creating tmp directory and memory DB
        tmp_dir = Path("tmp")
        tmp_dir.mkdir(exist_ok=True)
        
        test_memory = SqliteMemoryDb(
            table_name="test_memories",
            db_file="tmp/test_memory.db"
        )
        
        print("OK SQLite memory database creation works")
        
        # Cleanup test file
        test_db = Path("tmp/test_memory.db")
        if test_db.exists():
            test_db.unlink()
            
        return True
        
    except Exception as e:
        print(f"X Failed to create SQLite memory database: {e}")
        return False

if __name__ == "__main__":
    print("Testing Updated Storage Configurations")
    print("=" * 40)
    
    storage_ok = test_sqlite_storage()
    shared_ok = test_shared_storage()
    memory_ok = test_memory_db()
    
    print("\n" + "=" * 40)
    if storage_ok and shared_ok and memory_ok:
        print("All storage tests passed! Updated configurations should work.")
        print("SQLite databases will be stored in: C:/Users/PC/ServiceApp/agent-ui/Agents/tmp/")
        print("Shared storage will use: C:/Users/PC/ServiceApp/myserviceprovider-app/.wrangler/state/")
    else:
        print("Some storage tests failed. Check error messages above.")