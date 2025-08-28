Using MCP in Agno Playground
You can also run MCP servers in the Agno Playground, which provides a web interface for interacting with your agents. Here’s an example of a GitHub agent running in the Playground:

github_playground.py

Copy

Ask AI
import asyncio
from os import getenv
from textwrap import dedent

import nest_asyncio
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.playground import Playground
from agno.storage.agent.sqlite import SqliteAgentStorage
from agno.tools.mcp import MCPTools

# Allow nested event loops
nest_asyncio.apply()

agent_storage_file: str = "tmp/agents.db"


async def run_server() -> None:
    """Run the GitHub agent server."""
    github_token = getenv("GITHUB_TOKEN") or getenv("GITHUB_ACCESS_TOKEN")
    if not github_token:
        raise ValueError("GITHUB_TOKEN environment variable is required")

    # Create a client session to connect to the MCP server
    async with MCPTools("npx -y @modelcontextprotocol/server-github") as mcp_tools:
        agent = Agent(
            name="MCP GitHub Agent",
            tools=[mcp_tools],
            instructions=dedent("""\
                You are a GitHub assistant. Help users explore repositories and their activity.

                - Use headings to organize your responses
                - Be concise and focus on relevant information\
            """),
            model=OpenAIChat(id="gpt-4o"),
            storage=SqliteAgentStorage(
                table_name="basic_agent",
                db_file=agent_storage_file,
                auto_upgrade_schema=True,
            ),
            add_history_to_messages=True,
            num_history_responses=3,
            add_datetime_to_instructions=True,
            markdown=True,
        )

        playground = Playground(agents=[agent])
        app = playground.get_app()

        # Serve the app while keeping the MCPTools context manager alive
        playground.serve(app)


if __name__ == "__main__":
    asyncio.run(run_server())
​
Best Practices
Error Handling: Always include proper error handling for MCP server connections and operations.

Resource Cleanup: Use MCPTools or MultiMCPTools as an async context manager to ensure proper cleanup of resources:


Copy

Ask AI
async with MCPTools(command) as mcp_tools:
    # Your agent code here
Clear Instructions: Provide clear and specific instructions to your agent:

Copy

Ask AI
instructions = """
You are a filesystem assistant. Help users explore files and directories.
- Navigate the filesystem to answer questions
- Use the list_allowed_directories tool to find accessible directories
- Provide clear context about files you examine
- Be concise and focus on relevant information
"""