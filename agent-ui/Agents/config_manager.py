"""
Configuration management system for ServiceFlow AI agents
Provides secure storage and management of API keys, settings, and agent parameters
"""

import os
import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, Optional, Union
from cryptography.fernet import Fernet
import base64
from dotenv import load_dotenv

class ConfigManager:
    """Secure configuration management for ServiceFlow AI agents"""
    
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.config_dir = Path(__file__).parent / "tmp" / "config"
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
        # Load environment variables
        load_dotenv()
        
        # Setup encryption
        self._setup_encryption()
        
        # Setup configuration database
        self._setup_config_db()
    
    def _setup_encryption(self):
        """Setup encryption for sensitive data"""
        key_file = self.config_dir / ".encryption_key"
        
        if key_file.exists():
            with open(key_file, 'rb') as f:
                self.encryption_key = f.read()
        else:
            self.encryption_key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(self.encryption_key)
            # Secure the key file (Windows)
            os.chmod(key_file, 0o600)
        
        self.cipher = Fernet(self.encryption_key)
    
    def _setup_config_db(self):
        """Setup SQLite database for configuration storage"""
        self.db_path = Path(__file__).parent / "tmp" / "agent_config.db"
        conn = sqlite3.connect(str(self.db_path))
        
        # Create configuration table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS agent_configs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_name TEXT NOT NULL,
                config_key TEXT NOT NULL,
                config_value TEXT NOT NULL,
                is_encrypted BOOLEAN DEFAULT FALSE,
                config_type TEXT DEFAULT 'string',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(agent_name, config_key)
            )
        """)
        
        # Create API keys table (always encrypted)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS api_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_name TEXT NOT NULL,
                service_name TEXT NOT NULL,
                api_key_encrypted TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used DATETIME,
                UNIQUE(agent_name, service_name)
            )
        """)
        
        conn.commit()
        conn.close()
    
    def encrypt_value(self, value: str) -> str:
        """Encrypt a sensitive value"""
        encrypted_bytes = self.cipher.encrypt(value.encode())
        return base64.b64encode(encrypted_bytes).decode()
    
    def decrypt_value(self, encrypted_value: str) -> str:
        """Decrypt a sensitive value"""
        encrypted_bytes = base64.b64decode(encrypted_value.encode())
        decrypted_bytes = self.cipher.decrypt(encrypted_bytes)
        return decrypted_bytes.decode()
    
    def set_config(self, key: str, value: Any, encrypt: bool = False, config_type: str = "string"):
        """Set a configuration value"""
        conn = sqlite3.connect(str(self.db_path))
        
        # Convert value to string
        if isinstance(value, (dict, list)):
            value_str = json.dumps(value)
            config_type = "json"
        else:
            value_str = str(value)
        
        # Encrypt if requested
        if encrypt:
            value_str = self.encrypt_value(value_str)
        
        # Insert or update configuration
        conn.execute("""
            INSERT OR REPLACE INTO agent_configs 
            (agent_name, config_key, config_value, is_encrypted, config_type, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (self.agent_name, key, value_str, encrypt, config_type))
        
        conn.commit()
        conn.close()
    
    def get_config(self, key: str, default: Any = None) -> Any:
        """Get a configuration value"""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.execute("""
            SELECT config_value, is_encrypted, config_type 
            FROM agent_configs 
            WHERE agent_name = ? AND config_key = ?
        """, (self.agent_name, key))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return default
        
        value_str, is_encrypted, config_type = result
        
        # Decrypt if necessary
        if is_encrypted:
            value_str = self.decrypt_value(value_str)
        
        # Convert back to appropriate type
        if config_type == "json":
            return json.loads(value_str)
        elif config_type == "boolean":
            return value_str.lower() in ('true', '1', 'yes')
        elif config_type == "integer":
            return int(value_str)
        elif config_type == "float":
            return float(value_str)
        
        return value_str
    
    def set_api_key(self, service_name: str, api_key: str):
        """Store an encrypted API key"""
        encrypted_key = self.encrypt_value(api_key)
        
        conn = sqlite3.connect(str(self.db_path))
        conn.execute("""
            INSERT OR REPLACE INTO api_keys 
            (agent_name, service_name, api_key_encrypted)
            VALUES (?, ?, ?)
        """, (self.agent_name, service_name, encrypted_key))
        
        conn.commit()
        conn.close()
    
    def get_api_key(self, service_name: str) -> Optional[str]:
        """Retrieve and decrypt an API key"""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.execute("""
            SELECT api_key_encrypted FROM api_keys 
            WHERE agent_name = ? AND service_name = ?
        """, (self.agent_name, service_name))
        
        result = cursor.fetchone()
        
        if result:
            # Update last_used timestamp
            conn.execute("""
                UPDATE api_keys SET last_used = CURRENT_TIMESTAMP
                WHERE agent_name = ? AND service_name = ?
            """, (self.agent_name, service_name))
            conn.commit()
        
        conn.close()
        
        if result:
            return self.decrypt_value(result[0])
        
        # Fallback to environment variable
        env_key = f"{service_name.upper()}_API_KEY"
        return os.getenv(env_key)
    
    def load_from_env(self, mappings: Dict[str, str]):
        """Load configuration from environment variables"""
        for config_key, env_key in mappings.items():
            env_value = os.getenv(env_key)
            if env_value:
                # Determine if this should be encrypted (API keys, passwords, tokens)
                should_encrypt = any(sensitive in env_key.lower() 
                                   for sensitive in ['key', 'token', 'password', 'secret'])
                self.set_config(config_key, env_value, encrypt=should_encrypt)
    
    def export_config(self, include_encrypted: bool = False) -> Dict[str, Any]:
        """Export agent configuration (excluding encrypted values by default)"""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.execute("""
            SELECT config_key, config_value, is_encrypted, config_type
            FROM agent_configs WHERE agent_name = ?
        """, (self.agent_name,))
        
        config = {}
        for key, value, is_encrypted, config_type in cursor.fetchall():
            if is_encrypted and not include_encrypted:
                config[key] = "***ENCRYPTED***"
                continue
            
            # Decrypt if encrypted and requested
            if is_encrypted and include_encrypted:
                value = self.decrypt_value(value)
            
            # Convert type
            if config_type == "json":
                config[key] = json.loads(value)
            elif config_type == "boolean":
                config[key] = value.lower() in ('true', '1', 'yes')
            elif config_type == "integer":
                config[key] = int(value)
            elif config_type == "float":
                config[key] = float(value)
            else:
                config[key] = value
        
        conn.close()
        return config
    
    def delete_config(self, key: str):
        """Delete a configuration value"""
        conn = sqlite3.connect(str(self.db_path))
        conn.execute("""
            DELETE FROM agent_configs 
            WHERE agent_name = ? AND config_key = ?
        """, (self.agent_name, key))
        conn.commit()
        conn.close()

class TeamConfigManager:
    """Global configuration manager for ServiceFlow AI team settings"""
    
    def __init__(self):
        self.config_dir = Path(__file__).parent / "tmp" / "team_config"
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self._setup_team_db()
    
    def _setup_team_db(self):
        """Setup team configuration database"""
        self.db_path = Path(__file__).parent / "tmp" / "team_config.db"
        conn = sqlite3.connect(str(self.db_path))
        
        # Create team settings table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS team_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                setting_key TEXT UNIQUE NOT NULL,
                setting_value TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Initialize default settings
        defaults = {
            "max_concurrent_agents": "5",
            "default_model": "gpt-4o-mini",
            "rate_limit_requests_per_minute": "60",
            "enable_performance_monitoring": "true",
            "log_retention_days": "30",
            "testnet_mode": "true"
        }
        
        for key, value in defaults.items():
            conn.execute("""
                INSERT OR IGNORE INTO team_settings (setting_key, setting_value, description)
                VALUES (?, ?, ?)
            """, (key, value, f"Default setting for {key}"))
        
        conn.commit()
        conn.close()
    
    def get_team_setting(self, key: str, default: Any = None) -> str:
        """Get a team-wide setting"""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.execute("""
            SELECT setting_value FROM team_settings WHERE setting_key = ?
        """, (key,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return result[0]
        return str(default) if default is not None else None
    
    def set_team_setting(self, key: str, value: str, description: str = None):
        """Set a team-wide setting"""
        conn = sqlite3.connect(str(self.db_path))
        conn.execute("""
            INSERT OR REPLACE INTO team_settings 
            (setting_key, setting_value, description, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        """, (key, value, description))
        conn.commit()
        conn.close()

# Global instances
def get_config_manager(agent_name: str) -> ConfigManager:
    """Get configuration manager for an agent"""
    return ConfigManager(agent_name)

def get_team_config() -> TeamConfigManager:
    """Get team configuration manager"""
    return TeamConfigManager()