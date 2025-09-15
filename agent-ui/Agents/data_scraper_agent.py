#!/usr/bin/env python3
"""
Universal Data Scraper Agent with Building Code PDF Support

Requirements:
    pip install pypdf  # Required for PDF URL processing

Features:
    - Web scraping for business products (hair salon, contractor)
    - Building code PDF processing by state
    - State-based building code queries
    - Oklahoma building codes (IRC, IBC, IEBC, IMC 2018)

Usage:
    python data_scraper_agent.py                    # Run all scrapers
    python data_scraper_agent.py building_codes     # Building code demo
    python building_code_agent.py                   # Interactive building codes
"""

import asyncio
import os
from typing import List, Dict, Optional
from pathlib import Path
from dotenv import load_dotenv
from agno.agent import Agent
from agno.knowledge.website import WebsiteKnowledgeBase
from agno.vectordb.mongodb import MongoDb
from agno.embedder.openai import OpenAIEmbedder
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.mongodb import MongoMemoryDb
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.document.chunking.fixed import FixedSizeChunking
from agno.tools.spider import SpiderTools
from agno.tools.website import WebsiteTools
from agno.models.openai import OpenAIChat
from agno.storage.sqlite import SqliteStorage
from agno.storage.mongodb import MongoDbStorage
from pymongo import MongoClient
import httpx
import urllib.request
import urllib.parse
import time
import sys
import os

# Add project root to sys.path to allow imports from storage module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agno.storage.sqlite import SqliteStorage

# Try to import PDF URL knowledge base
try:
    from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
    PDF_SUPPORT = True
except ImportError:
    print("⚠️  Warning: pypdf not installed. PDF URL support disabled.")
    print("   Install with: pip install pypdf")
    PDF_SUPPORT = False
    PDFUrlKnowledgeBase = None

# Load environment variables from .env file
load_dotenv()

__all__ = ['UniversalScraperAgent', 'BuildingCodeAgent', 'BuildingCodeManager']

# MongoDB connection details - get from environment variable with fallback
MONGO_DB_CONN_STRING = os.getenv("MONGODB_URL", "") or os.getenv("MONGODB_URI", "")
USE_MONGODB = bool(MONGO_DB_CONN_STRING)

if not USE_MONGODB:
    print("⚠️  Warning: MongoDB connection not available. Using SQLite fallback.")
    print("   Set MONGODB_URL or MONGODB_URI environment variable for MongoDB support.")

def create_vector_db(collection_name: str, db_name: str = "myserviceprovider", tmp_dir: Path = None):
    """Create vector database with MongoDB using the same pattern as other agents"""
    if USE_MONGODB:
        try:
            print(f"🔗 Creating vector DB connection for {collection_name}...")
            return MongoDb(
                collection_name=collection_name,
                db_url=MONGO_DB_CONN_STRING,  # Use connection string as-is (like playground.py)
                db_name=db_name,
                embedder=OpenAIEmbedder(
                    id="text-embedding-3-small",
                    dimensions=1536
                ),
            )
        except Exception as e:
            print(f"⚠️  MongoDB vector DB connection failed: {e}")
            print(f"   Collection: {collection_name}")
            print(f"   DB: {db_name}")
            raise e
    else:
        raise ValueError("MongoDB connection required for vector database. Set MONGODB_URL or MONGODB_URI environment variable.")

def create_memory_db(collection_name: str, db_name: str = "myserviceprovider", tmp_dir: Path = None):
    """Create memory database with MongoDB fallback to SQLite using same pattern as other agents"""
    if USE_MONGODB:
        try:
            print(f"🔗 Creating memory DB connection for {collection_name}...")
            return MongoMemoryDb(
                collection_name=collection_name,
                db_url=MONGO_DB_CONN_STRING,  # Use connection string as-is (like playground.py)
                db_name=db_name
            )
        except Exception as e:
            print(f"⚠️  MongoDB memory connection failed: {e}")
            print(f"   Collection: {collection_name}")
            print("   Falling back to SQLite...")
    
    # SQLite fallback
    if tmp_dir is None:
        tmp_dir = Path(__file__).parent.joinpath("tmp")
    
    tmp_dir.mkdir(parents=True, exist_ok=True)
    db_file = tmp_dir / f"{collection_name}_memory.db"
    
    return SqliteMemoryDb(
        table_name=collection_name,
        db_file=str(db_file)
    )

class BuildingCodeAgent:
    def __init__(self, state: str = "oklahoma"):
        if not PDF_SUPPORT:
            raise ImportError("PDF support not available. Please install pypdf: pip install pypdf")
        
        self.state = state.lower()
        self.tmp_dir = Path(__file__).parent.joinpath("tmp")
        self.tmp_dir.mkdir(parents=True, exist_ok=True)
        
        # Create storage directory for building code PDFs
        self.storage_dir = Path(__file__).parent.parent.joinpath("storage", "building_codes", self.state)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        self.knowledge_base = self._initialize_pdf_knowledge()
        self.memory = self._initialize_memory()
        self.agent = self._initialize_agent()

    def download_building_code_pdfs(self, load_only_enabled: bool = True) -> List[str]:
        """Download building code PDFs to local storage and return file paths"""
        building_code_info = self.get_building_code_info(self.state)
        downloaded_files = []
        
        if not building_code_info:
            print(f"❌ No building codes available for {self.state}")
            return downloaded_files
        
        # Sort by priority to download in correct order
        sorted_codes = sorted(building_code_info.items(), key=lambda x: x[1].get("priority", 999))
        
        for code_type, info in sorted_codes:
            # Skip if load_pdf is False and we're only loading enabled PDFs
            if load_only_enabled and not info.get("load_pdf", False):
                print(f"⏭️  Skipping {info['description']} (load_pdf=False)")
                continue
                
            try:
                url = info["url"]
                filename = info["filename"]
                description = info["description"]
                
                file_path = self.storage_dir / filename
                
                # Skip download if file already exists
                if file_path.exists():
                    print(f"✓ PDF already exists: {filename}")
                    downloaded_files.append(str(file_path))
                    continue
                
                print(f"📥 Downloading: {description}")
                print(f"    File: {filename}")
                urllib.request.urlretrieve(url, file_path)
                downloaded_files.append(str(file_path))
                print(f"✓ Downloaded: {filename}")
                
                # Add delay between downloads to be respectful
                time.sleep(2)
                
            except Exception as e:
                print(f"❌ Failed to download {description}: {e}")
                continue
        
        return downloaded_files

    def _initialize_pdf_knowledge(self) -> PDFUrlKnowledgeBase:
        """Initialize PDF knowledge base with building codes for the specified state"""
        if not PDF_SUPPORT:
            raise ImportError("PDF support not available. Please install pypdf: pip install pypdf")
        
        # Get enabled PDFs only (load_pdf=True)
        building_code_info = self.get_building_code_info(self.state)
        enabled_files = []
        
        # Check for existing local files that are enabled
        for code_type, info in building_code_info.items():
            if info.get("load_pdf", False):
                filename = info["filename"]
                file_path = self.storage_dir / filename
                
                if file_path.exists():
                    print(f"✓ Using local PDF: {filename}")
                    enabled_files.append(str(file_path))
                else:
                    print(f"📄 Local PDF not found: {filename}")
        
        # If no enabled local files, download only the enabled ones
        if not enabled_files:
            print(f"🔄 Downloading enabled building codes for {self.state}...")
            downloaded_files = self.download_building_code_pdfs(load_only_enabled=True)
            if not downloaded_files:
                print("⚠️  No PDFs are enabled for loading. Set load_pdf=True in building code info.")
                # Fallback to use all available local files if none are enabled
                local_files = list(self.storage_dir.glob("*.pdf"))
                if local_files:
                    print(f"📚 Using {len(local_files)} available local PDFs as fallback")
                    enabled_files = [str(f) for f in local_files[:1]]  # Limit to 1 PDF to prevent overload
                else:
                    raise ValueError(f"No building code PDFs available for state: {self.state}")
            else:
                enabled_files = downloaded_files
        
        print(f"📚 Initializing knowledge base with {len(enabled_files)} PDF(s)")
        for file_path in enabled_files:
            print(f"   • {Path(file_path).name}")
        
        # Temporarily use LanceDB instead of MongoDB until SSL issues are resolved
        try:
            print("🔧 Using LanceDB for vector storage to avoid MongoDB SSL issues...")
            from agno.vectordb.lancedb import LanceDb, SearchType
            
            return PDFUrlKnowledgeBase(
                urls=enabled_files,  # Only enabled local file paths
                vector_db=LanceDb(
                    uri=str(self.tmp_dir.joinpath("lancedb")),
                    table_name=f"{self.state}_building_codes_enabled",
                    search_type=SearchType.hybrid,
                    embedder=OpenAIEmbedder(id="text-embedding-3-small"),
                ),
            )
        except ImportError:
            print("⚠️  LanceDB not available, attempting MongoDB with enhanced error handling...")
            try:
                return PDFUrlKnowledgeBase(
                    urls=enabled_files,  # Only enabled local file paths
                    vector_db=create_vector_db(
                        collection_name=f"{self.state}_building_codes_enabled",
                        tmp_dir=self.tmp_dir
                    ),
                )
            except Exception as e:
                print(f"❌ Vector database initialization failed: {e}")
                print("   Knowledge base will be created without vector search capabilities")
                raise e

    def _initialize_memory(self) -> Memory:
        """Initialize memory for the building code agent"""
        memory_db = create_memory_db(
            collection_name=f"{self.state}_building_code_memories",
            tmp_dir=self.tmp_dir
        )
        return Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=memory_db
        )

    def _initialize_agent(self) -> Agent:
        # Create storage using the same pattern as other agents
        storage = None
        if USE_MONGODB:
            try:
                from pathlib import Path
                tmp_dir = Path(__file__).parent.parent / "tmp"
                tmp_dir.mkdir(exist_ok=True)
                storage = SqliteStorage(
                    table_name=f"building_code_{self.state}_agent",
                    db_file=str(tmp_dir / "agents.db")
                )
                print(f"✅ MongoDB storage created for building code agent")
            except Exception as e:
                print(f"⚠️  MongoDB storage failed, using memory only: {e}")
        
        return Agent(
            name=f"{self.state.capitalize()} Building Code Expert",
            model=OpenAIChat(id="gpt-4o"),
            knowledge=self.knowledge_base,
            memory=self.memory,
            storage=storage,  # Add storage like other agents
            instructions=[
                f"You are an expert on {self.state.capitalize()} building codes and regulations.",
                "Help users understand building codes, requirements, and regulations.",
                "Provide specific code sections, requirements, and compliance information.",
                "Always cite the specific building code document and section when providing information.",
                "If asked about building codes for other states, ask the user to specify which state they need information for.",
                "Focus on practical application of building codes for contractor and builders.",
                "Include relevant code sections, page numbers, and document references.",
            ],
            enable_agentic_memory=True,
            enable_user_memories=True,
            add_datetime_to_instructions=True,
            add_history_to_messages=True,
            num_history_responses=5,
            markdown=True,
            search_knowledge=True,
        )

    def get_building_code_pdfs(self, state: str) -> List[str]:
        """Get building code PDF URLs for the specified state"""
        building_codes = {
            "oklahoma": [
                # Oklahoma Residential Code (IRC 2018)
                "https://oklahoma.gov/content/dam/ok/en/oubcc/documents/rules/2022%2009%2014%20IRC%202018%20Permanent%20Rule.pdf",
                # Oklahoma International Building Code (IBC 2018)
                "https://oklahoma.gov/content/dam/ok/en/oubcc/documents/rules/2021%2009%2014%20IBC%202018%20Permanent%20Rule.pdf",
                # Oklahoma Existing Building Code (IEBC 2018)
                "https://oklahoma.gov/content/dam/ok/en/oubcc/documents/rules/2021%2009%2014%20IEBC%202018%20Permanent%20Rule.pdf",
                # Oklahoma Mechanical Code (IMC 2018)
                "https://oklahoma.gov/content/dam/ok/en/oubcc/documents/rules/2021%2009%2014%20IMC%202018%20Permanent%20Rule.pdf",
            ]
        }
        return building_codes.get(state, [])
    
    def get_building_code_info(self, state: str) -> Dict[str, Dict[str, str]]:
        """Get building code information with descriptions and filenames"""
        building_code_info = {
            "oklahoma": {
                "IRC_2018": {
                    "url": "https://oklahoma.gov/content/dam/ok/en/oubcc/documents/rules/2022%2009%2014%20IRC%202018%20Permanent%20Rule.pdf",
                    "filename": "Oklahoma_IRC_2018_Residential_Code.pdf",
                    "description": "Oklahoma Residential Code (IRC 2018)",
                    "load_pdf": True,  # Set to False after first successful load
                    "priority": 1  # Load order priority (1 = highest)
                },
                "IBC_2018": {
                    "url": "https://oklahoma.gov/content/dam/ok/en/oubcc/documents/rules/2021%2009%2014%20IBC%202018%20Permanent%20Rule.pdf", 
                    "filename": "Oklahoma_IBC_2018_International_Building_Code.pdf",
                    "description": "Oklahoma International Building Code (IBC 2018)",
                    "load_pdf": False,  # Start with only IRC loaded to prevent overload
                    "priority": 2
                },
                "IEBC_2018": {
                    "url": "https://oklahoma.gov/content/dam/ok/en/oubcc/documents/rules/2021%2009%2014%20IEBC%202018%20Permanent%20Rule.pdf",
                    "filename": "Oklahoma_IEBC_2018_Existing_Building_Code.pdf", 
                    "description": "Oklahoma Existing Building Code (IEBC 2018)",
                    "load_pdf": False,  # Load later to prevent API limits
                    "priority": 3
                },
                "IMC_2018": {
                    "url": "https://oklahoma.gov/content/dam/ok/en/oubcc/documents/rules/2021%2009%2014%20IMC%202018%20Permanent%20Rule.pdf",
                    "filename": "Oklahoma_IMC_2018_Mechanical_Code.pdf",
                    "description": "Oklahoma Mechanical Code (IMC 2018)",
                    "load_pdf": False,  # Load later to prevent API limits  
                    "priority": 4
                }
            }
        }
        return building_code_info.get(state, {})

    def get_available_states(self) -> List[str]:
        """Get list of available states for building codes"""
        return ["oklahoma"]

    def get_code_types_for_state(self, state: str) -> Dict[str, str]:
        """Get available building code types for a state"""
        code_types = {
            "oklahoma": {
                "residential": "Oklahoma Residential Code (IRC 2018)",
                "commercial": "Oklahoma International Building Code (IBC 2018)",
                "existing": "Oklahoma Existing Building Code (IEBC 2018)",
                "mechanical": "Oklahoma Mechanical Code (IMC 2018)",
            }
        }
        return code_types.get(state, {})
    
    def enable_pdf_loading(self, code_type: str) -> bool:
        """Enable loading for a specific building code PDF - requires manual code update"""
        building_code_info = self.get_building_code_info(self.state)
        if code_type in building_code_info:
            print(f"To enable {code_type} loading:")
            print(f"1. Edit data_scraper_agent.py")
            print(f"2. Find the {code_type} entry in get_building_code_info()")
            print(f"3. Change 'load_pdf': False to 'load_pdf': True")
            print(f"4. Restart the agent")
            return True
        return False
    
    def list_pdf_status(self) -> Dict[str, Dict[str, any]]:
        """List all PDFs and their loading status"""
        building_code_info = self.get_building_code_info(self.state)
        status_info = {}
        
        print(f"\n📊 Building Code PDF Status for {self.state.upper()}:")
        print("=" * 60)
        
        for code_type, info in building_code_info.items():
            file_path = self.storage_dir / info["filename"]
            file_size_mb = file_path.stat().st_size / (1024*1024) if file_path.exists() else 0
            
            status_info[code_type] = {
                "description": info["description"],
                "filename": info["filename"],
                "load_enabled": info.get("load_pdf", False),
                "file_exists": file_path.exists(),
                "priority": info.get("priority", 999),
                "file_size_mb": round(file_size_mb, 2)
            }
            
            status = "✅ ENABLED" if info.get("load_pdf", False) else "⏸️  DISABLED"
            exists = "✓" if file_path.exists() else "✗"
            
            print(f"{status} | {exists} File | Priority {info.get('priority', '?')} | {info['description']}")
            print(f"          📁 {info['filename']} ({file_size_mb:.1f} MB)")
            print()
        
        return status_info

    async def load_knowledge_base(self, recreate: bool = False):
        """Load the PDF knowledge base"""
        print(f"Loading {self.state.capitalize()} building codes...")
        try:
            await self.knowledge_base.aload(recreate=recreate)
            print("✅ Building code knowledge base loaded successfully")
        except Exception as e:
            print(f"❌ Error loading knowledge base: {e}")
            print("   This may be due to MongoDB connection issues or PDF download problems.")
            print("   The agent will still be available but with limited functionality.")
            # Don't re-raise the exception to allow the agent to continue with limited functionality

    async def query_building_code(self, question: str):
        """Query the building code knowledge base"""
        try:
            await self.agent.aprint_response(question, stream=True)
        except Exception as e:
            print(f"Error querying building codes: {e}")
            import traceback
            traceback.print_exc()

class UniversalScraperAgent:
    def __init__(self, business_type: str):
        self.business_type = business_type
        self.tmp_dir = Path(__file__).parent.joinpath("tmp")
        self.tmp_dir.mkdir(parents=True, exist_ok=True)
        self.knowledge_base = self._initialize_knowledge()
        self.memory = self._initialize_memory()
        self.agent = self._initialize_agent()

    def _initialize_knowledge(self) -> WebsiteKnowledgeBase:
        urls = self.get_urls_based_on_business(self.business_type)
        return WebsiteKnowledgeBase(
            urls=urls,
            max_depth=15,
            max_links=50,
            vector_db=create_vector_db(
                collection_name=f"{self.business_type}_products",
                tmp_dir=self.tmp_dir
            ),
            # Use FixedSizeChunking instead of SemanticChunking
            chunking_strategy=FixedSizeChunking(
                chunk_size=500,
                overlap=50  # This parameter is supported in FixedSizeChunking
            ),
        )

    def _initialize_memory(self) -> Memory:
        """Initialize memory for the scraper agent"""
        memory_db = create_memory_db(
            collection_name=f"{self.business_type}_scraper_memories",
            tmp_dir=self.tmp_dir
        )
        return Memory(
            model=OpenAIChat(id="gpt-4o"),
            db=memory_db
        )

    def _initialize_agent(self) -> Agent:
        return Agent(
            name=f"{self.business_type.capitalize()} Product Scraper",
            model=OpenAIChat(id="gpt-4o"),
            knowledge=self.knowledge_base,
            memory=self.memory,
            tools=[SpiderTools(), WebsiteTools(knowledge_base=self.knowledge_base)],
            instructions=[
                f"Scrape product data for a {self.business_type}.",
                "Include product names, SKUs, prices, descriptions.",
                "Store important product information in memory for future reference.",
                "Always include sources and be thorough in data collection."
            ],
            enable_agentic_memory=True,
            enable_user_memories=True,
            add_datetime_to_instructions=True,
            add_history_to_messages=True,
            num_history_responses=5,
            markdown=True,
        )

    def get_urls_based_on_business(self, business_type: str) -> List[str]:
        business_urls = {
            "contractor": [
                "https://www.doitbest.com/category/building-materials/lumber-plywood/?member=lambert-lumber",
                "https://www.doitbest.com/category/building-materials/flooring-materials/?member=lambert-lumber",
                "https://www.doitbest.com/category/building-materials/wall-materials/?member=lambert-lumber",
                "https://www.doitbest.com/category/building-materials/roofing-materials/?member=lambert-lumber",
                "https://www.doitbest.com/category/building-materials/molding-millwork/?member=lambert-lumber",
                "https://www.doitbest.com/category/building-materials/kitchen-bath-cabinets/?member=lambert-lumber",
                "https://www.doitbest.com/category/building-materials/gutters-downspouts/?member=lambert-lumber",
                "https://www.doitbest.com/category/building-materials/deck-materials/?member=lambert-lumber",
                "https://www.doitbest.com/category/building-materials/tile-installation-supplies/?member=lambert-lumber"
            ],
            "hair_salon": [
                "https://stores.sallybeauty.com/tx/paris/beauty-supply-paris-tx-1979.html",
                "https://www.sallybeauty.com/hair-color/",
                "https://www.sallybeauty.com/tools-and-brushes/",
                "https://www.sallybeauty.com/salon-supplies/"
            ]
        }
        return business_urls.get(business_type, [])

    async def scrape_site(self):
        print(f"Starting scraping for {self.business_type}")
        try:
            await self.knowledge_base.aload()
            print("✅ Knowledge base loaded successfully")
            
            await self.agent.aprint_response(
                "Scrape product data and compile a comprehensive summary with pricing, availability, and product details.", 
                stream=True
            )
        except Exception as e:
            print(f"❌ Error during scraping: {e}")
            print("   This may be due to connection issues or rate limiting.")
            print("   The scraper will continue with limited functionality.")

class BuildingCodeManager:
    """Manager class to handle building code queries with state selection"""
    
    def __init__(self):
        self.current_agent: Optional[BuildingCodeAgent] = None
        self.available_states = ["oklahoma"]
    
    def get_available_states(self) -> List[str]:
        """Get list of available states"""
        return self.available_states
    
    async def initialize_state(self, state: str) -> bool:
        """Initialize building code agent for specific state"""
        if not PDF_SUPPORT:
            print("❌ PDF support not available. Please install pypdf: pip install pypdf")
            return False
        
        if state.lower() not in self.available_states:
            print(f"❌ Building codes not available for {state}")
            print(f"Available states: {', '.join(self.available_states)}")
            return False
        
        try:
            print(f"🔄 Initializing building codes for {state.capitalize()}...")
            self.current_agent = BuildingCodeAgent(state=state.lower())
            await self.current_agent.load_knowledge_base()
            print(f"✅ Building codes for {state.capitalize()} are ready!")
            return True
        except Exception as e:
            print(f"❌ Error initializing building codes for {state}: {e}")
            print("   The agent was created but knowledge base loading failed.")
            print("   You can still use the agent with limited functionality.")
            return True  # Return True because agent was created, even if knowledge base failed
    
    async def query_building_code(self, question: str, state: Optional[str] = None):
        """Query building codes - ask for state if not provided"""
        if state and state.lower() not in self.available_states:
            print(f"Building codes not available for {state}")
            print(f"Available states: {', '.join(self.available_states)}")
            return
        
        if not self.current_agent or (state and self.current_agent.state != state.lower()):
            if not state:
                print("Please specify which state you need building codes for.")
                print(f"Available states: {', '.join(self.available_states)}")
                return
            
            success = await self.initialize_state(state)
            if not success:
                return
        
        await self.current_agent.query_building_code(question)
    
    def get_code_types(self, state: str) -> Dict[str, str]:
        """Get available building code types for a state"""
        if state.lower() not in self.available_states:
            return {}
        
        temp_agent = BuildingCodeAgent(state=state.lower())
        return temp_agent.get_code_types_for_state(state.lower())
    
    def show_available_codes(self):
        """Show all available building codes by state"""
        print("📋 Available Building Codes by State:")
        print("=" * 50)
        
        for state in self.available_states:
            print(f"\n🏛️ {state.upper()}:")
            code_types = self.get_code_types(state)
            for code_type, description in code_types.items():
                print(f"  • {description}")
        
        print(f"\nTo query building codes, specify the state (e.g., 'oklahoma')")
        print(f"Available states: {', '.join(self.available_states)}")

async def demo_building_codes():
    """Demo function for building code queries"""
    print("=== Building Code Agent Demo ===")
    manager = BuildingCodeManager()
    
    # Show available codes
    manager.show_available_codes()
    
    print("\n" + "="*60 + "\n")
    
    # Initialize Oklahoma building codes
    await manager.initialize_state("oklahoma")
    
    # Demo queries
    demo_questions = [
        "What are the minimum ceiling height requirements for residential buildings?",
        "What are the fire safety requirements for commercial buildings?", 
        "What are the electrical code requirements for new construction?",
        "What are the plumbing code requirements for bathroom installations?"
    ]
    
    for i, question in enumerate(demo_questions, 1):
        print(f"\n🏗️ Question {i}/4: {question}")
        print("-" * 60)
        await manager.query_building_code(question)
        print("\n")

# Run the agent for different business types
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "building_codes":
        # Run building code demo with rate limiting
        asyncio.run(demo_building_codes())
    elif len(sys.argv) > 1 and sys.argv[1] == "load_pdfs":
        # Manual PDF loading - similar to agno_assist.py approach
        print("=== Building Code PDF Loading ===")
        
        # Create agent instance
        agent = BuildingCodeAgent(state="oklahoma")
        
        # Show current PDF status
        agent.list_pdf_status()
        
        print("\n🔄 Loading Process:")
        print("1. Only PDFs with 'load_pdf': True will be processed")
        print("2. Currently only IRC_2018 is enabled to prevent API overload")
        print("3. To enable more PDFs, edit the building code info manually")
        print("4. This prevents hitting OpenAI token limits")
        
        # Load knowledge base (will only load enabled PDFs)
        print(f"\n📚 Loading knowledge base for {agent.state}...")
        asyncio.run(agent.load_knowledge_base())
        
        print("✅ Knowledge base loaded with rate limiting!")
        print("💡 To enable more PDFs:")
        print("   - Edit get_building_code_info() in data_scraper_agent.py")
        print("   - Change 'load_pdf': False to True for desired PDFs") 
        print("   - Restart the agent")
        
    elif len(sys.argv) > 1 and sys.argv[1] == "status":
        # Show PDF status only
        print("=== Building Code PDF Status ===")
        agent = BuildingCodeAgent(state="oklahoma")
        agent.list_pdf_status()
        
    else:
        # Run original scraping functionality
        print("=== Hair Salon Scraping ===")
        hair_salon_agent = UniversalScraperAgent(business_type="hair_salon")
        asyncio.run(hair_salon_agent.scrape_site())
        
        print("\n" + "="*50 + "\n")
        
        print("=== Contractor Scraping ===")
        contractor_agent = UniversalScraperAgent(business_type="contractor")
        asyncio.run(contractor_agent.scrape_site())
        
        print("\n💡 Available commands:")
        print("   python data_scraper_agent.py building_codes  # Run demo")
        print("   python data_scraper_agent.py load_pdfs       # Load PDFs with rate limiting")
        print("   python data_scraper_agent.py status          # Show PDF status")
        
        print("\n" + "="*50 + "\n")
        
        print("=== Building Code Demo ===")
        print("To run building code demo, use: python data_scraper_agent.py building_codes")
        asyncio.run(demo_building_codes())

