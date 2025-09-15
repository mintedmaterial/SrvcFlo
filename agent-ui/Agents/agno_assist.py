import os
import sys
from pathlib import Path
from textwrap import dedent
from agno.agent import Agent
from agno.knowledge.document import DocumentKnowledgeBase
from agno.embedder.openai import OpenAIEmbedder
from agno.knowledge.url import UrlKnowledge
from agno.knowledge.file import FileKnowledge
from agno.models.openai import OpenAIChat
from agno.storage.sqlite import SqliteStorage

__all__ = ['agno_assist']
from agno.tools.dalle import DalleTools
from agno.tools.eleven_labs import ElevenLabsTools
from agno.tools.python import PythonTools
from agno.tools.file import FileTools
from agno.tools.shell import ShellTools
from agno.tools.e2b import E2BTools
from agno.vectordb.lancedb import LanceDb, SearchType
from dotenv import load_dotenv

# Load environment variables from .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

# Setup paths
cwd = Path(__file__).parent
tmp_dir = cwd.joinpath("tmp")
tmp_dir.mkdir(parents=True, exist_ok=True)

# Workspace roots (portable)
root_dir = Path(__file__).resolve().parents[2]
docs_dir = root_dir / "DOCS"
contracts_dir = root_dir / "myserviceprovider-app" / "Contracts"

# Shared embedder + vector DB
embedder = OpenAIEmbedder(id="text-embedding-3-small")
vector_db = LanceDb(
    uri=str(tmp_dir.joinpath("lancedb")),
    table_name="agno_assist_knowledge",
    search_type=SearchType.hybrid,
    embedder=embedder,
)

# Initialize knowledge sources
agent_knowledge = UrlKnowledge(
    urls=["https://docs.agno.com/llms-full.txt",
    "https://drpc.org/docs/sonic-api#SonicAPIMethods",
    "https://orderly.network/docs/sdks/react/overview",
    "https://docs.silo.finance/docs/developers/dev-tutorials/operations",
    ""],
    vector_db=vector_db,
)

knowledge_base = DocumentKnowledgeBase(
    paths=[
        str(docs_dir / "**" / "*.md"),
        str(docs_dir / "**" / "*.txt"),
        str(docs_dir / "**" / "*.pdf"),
        str(contracts_dir / "**" / "*.sol"),
        str(contracts_dir / "**" / "*.md"),
        str(contracts_dir / "**" / "*.json"),
    ],
    vector_db=vector_db,
)

# File knowledge base for local file operations
file_knowledge = FileKnowledge(
    path=str(contracts_dir),
    vector_db=vector_db,
)

agent_storage = SqliteStorage(
    table_name="agno_assist_sessions",
    db_file=str(tmp_dir.joinpath("agent_sessions.db")),
)

agno_assist = Agent(
    agent_id="agno-assist",
    name="SrvcFlo Assist",
    model=OpenAIChat(id="gpt-4o"),
    description=dedent("""
    You are SrvcFlo Assist, an AI Agent specializing in SrvcFlo AI: An AI-assisted agent launchpad and SaaS operating system built with Cloudflare Workers and the lightweight Agno Python framework for building multimodal agentic systems. We also use dRPC for a private cloud node and smart wallets.
    Your goal is to guide users through setting up and using AI agents within the SrvcFlo AI ecosystem. Help write tools for file operations, shell commands, and advanced code execution environments. You can use the following tools: E2B. You can also help write advanced Python scripts for trading strategies based on user input that can automate trading decisions and risk management. You may also assist with integrating our MCP servers to run in private sandboxes for secure execution. You will also help with monitoring and managing these environments for users and provide real-time analytics and reporting. Help write smart liquidity management algorithms and optimize trade execution strategies using Sonic Labs ecosystem providers 'Decentralized Finance' such as Silo Finance, Metropolis exchange, and Equalizer, perpetual protocols, and more provided by Orderly SDK."""),
    instructions=dedent("""
    Your mission is to provide comprehensive support for SrvcFlo AI users. Follow these steps to ensure the best possible response:1. **Analyze the request**
    - Analyze the request to determine if it requires a knowledge search, creating an Agent or tool/script, or both.
    - If you need to search the knowledge base, identify 1-3 key search terms related to Agno concepts, E2B tools, dRPC integrations, smart wallets, Sonic Labs DeFi protocols (e.g., Silo Finance, Metropolis exchange, Equalizer, Orderly SDK), or other relevant topics.
    - If you need to create an Agent, tool, script, or integration, search the knowledge base for relevant concepts, examples, and best practices (e.g., file operations, shell commands, trading strategies, MCP sandboxes, liquidity algorithms).
    - When the user asks for an Agent, they mean an Agno Agent; for tools or scripts, tailor to E2B, MCP, or DeFi integrations as needed.
    - All concepts are related to Agno and SrvcFlo ecosystem, so you can search the knowledge base for relevant information, including dRPC for private nodes and smart wallets for secure transactions.

After Analysis, always start the iterative search process. No need to wait for approval from the user.

2. **Iterative Search Process**:
    - Use the `search_knowledge_base` tool to search for related concepts, code examples, implementation details, and best practices (e.g., E2B for code execution, dRPC setup, Orderly SDK for perpetuals, Silo Finance integrations).
    - Continue searching until you have found all the information you need or you have exhausted all the search terms.

After the iterative search process, determine if you need to create an Agent, tool, script, or integration.
If you do, ask the user if they want you to create it and run/test it.

3. **Code Creation and Execution**
    - Create complete, working code examples that users can run. For example:
    ```python
    from agno.agent import Agent
    from agno.tools.duckduckgo import DuckDuckGoTools

    agent = Agent(tools=[DuckDuckGoTools()])

    # Perform a web search and capture the response
    response = agent.run("What's happening in France?")
    ```
    - You must remember to use agent.run() and NOT agent.print_response()
    - This way you can capture the response and return it to the user
    - Use the `save_to_file_and_run` tool to save it to a file and run.
    - Make sure to return the `response` variable that tells you the result
    - For advanced code execution, integrate E2B for sandboxed environments; for DeFi scripts, include dRPC endpoints for private node access and smart wallet handling.
    - Remember to:
        * Build the complete agent/tool/script implementation and test with `response = agent.run()` or equivalent execution
        * Include all necessary imports and setup (e.g., from e2b for code exec, orderly-sdk for perpetuals)
        * Add comprehensive comments explaining the implementation, including security for sandboxes and risk management in trading scripts
        * Test with example queries or scenarios (e.g., simulate trades with Sonic Labs providers like Silo Finance or Equalizer)
        * Ensure all dependencies are listed (e.g., pip install e2b, orderly-sdk)
        * Include error handling, best practices (e.g., rate limiting with dRPC, gas optimization for smart wallets)
        * Add type hints and documentation
        * For MCP integrations: Configure private sandboxes for secure execution, monitoring, and real-time analytics/reporting
        * For trading/liquidity: Optimize algorithms for automation, risk management, and execution on Metropolis exchange or perpetual protocols via Orderly SDK

4. **Explain important concepts using audio**
    - When explaining complex concepts or important features (e.g., dRPC node setup, E2B sandboxes, DeFi integrations with Silo Finance or Orderly SDK), ask the user if they'd like to hear an audio explanation
    - Use the ElevenLabs text_to_speech tool to create clear, professional audio content
    - The voice is pre-selected, so you don't need to specify the voice.
    - Keep audio explanations concise (60-90 seconds)
    - Make your explanation really engaging with:
        * Brief concept overview and avoid jargon
        * Talk about the concept in a way that is easy to understand
        * Use practical examples and real-world scenarios (e.g., how smart wallets secure trades on Equalizer)
        * Include common pitfalls to avoid (e.g., overexposure in liquidity management)

5. **Explain concepts with images**
    - You have access to the extremely powerful DALL-E 3 model.
    - Use the `create_image` tool to create extremely vivid images of your explanation (e.g., diagrams of MCP sandbox architecture or Sonic Labs DeFi flow).
    - Don't display the image in your response, it will be shown to the user separately.
    - The image will be shown to the user automatically below your response.
    - You DO NOT need to display or include the image in your response, if needed, refer to it as 'the image shown below'.

Key topics to cover:
- Agent levels and capabilities
- Knowledge base and memory management
- Tool integration (including E2B for advanced code exec, file ops, shell commands)
- Model support and configuration
- Best practices and common patterns
- dRPC for private cloud nodes and smart wallets for secure Web3 interactions
- Trading strategies: Automation, risk management, liquidity algorithms
- MCP server integrations: Private sandboxes, monitoring, real-time analytics/reporting
- Sonic Labs DeFi ecosystem: Silo Finance (lending), Metropolis exchange (DEX), Equalizer (liquidity), perpetual protocols, Orderly SDK for advanced trading"""),


    add_datetime_to_instructions=True,
    knowledge=[agent_knowledge, file_knowledge],
    search_knowledge=True,
    storage=agent_storage,
    tools=[
        PythonTools(),
        FileTools(tmp_dir.joinpath("ServiceApp")),
        ShellTools(),  # fixed
        E2BTools(
            api_key=os.getenv("E2B_API_KEY"),
            run_code=True,
            upload_file=True,
            download_result=True,
            internet_access=True,
            timeout=600,
            command_execution=True,
            filesystem=True,
        ),
        ElevenLabsTools(
            voice_id="pqHfZKP75CvOlQylNhV4",
            model_id="eleven_multilingual_v2",
            target_directory=str(tmp_dir.joinpath("audio").resolve()),
        ),
        DalleTools(model="dall-e-3", size="1792x1024", quality="hd", style="vivid"),
    ],
    read_chat_history=True,
    add_history_to_messages=True,
    num_history_responses=3,
    markdown=True,
)

if __name__ == "__main__":
    load_knowledge = True
    if load_knowledge:
        for k in (agent_knowledge, file_knowledge):
            k.load()
    agno_assist.print_response("Please create a Python script for a trading strategy that targets momentum swings on volatile Layer " \
    "1 assets like Sonic Labs. Use the Orderly SDK for perpetual protocols on 5-minute and 15-minute timeframes, incorporating " \
    "automation for trading decisions and risk management. Optimize liquidity management and trade execution using Sonic Labs DeFi " \
    "ecosystem providers such as Silo Finance for lending, Metropolis exchange for DEX trades, Equalizer for liquidity provision, "
    "and perpetual protocols via Orderly SDK. Integrate E2B for advanced code execution in secure sandboxes, MCP servers for real-time " \
    "monitoring and analytics, dRPC for private cloud node access, and smart wallets for secure transactions. Include tools for file " \
    "operations, shell commands, error handling, type hints, comprehensive comments, and dependency lists.", stream=True)