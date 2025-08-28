# Model Context Protocol (MCP)

> Learn how to use MCP with Agno to enable your agents to interact with external systems through a standardized interface.

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io) enables Agents to interact with external systems through a standardized interface.
You can connect your Agents to any MCP server, using Agno's MCP integration.

## Usage

<Steps>
  <Step title="Find the MCP server you want to use">
    You can use any working MCP server. To see some examples, you can check [this GitHub repository](https://github.com/modelcontextprotocol/servers), by the maintainers of the MCP themselves.
  </Step>

  <Step title="Initialize the MCP integration">
    Intialize the `MCPTools` class as a context manager. The recommended way to define the MCP server, is to use the `command` or `url` parameters. With `command`, you can pass the command used to run the MCP server you want. With `url`, you can pass the URL of the running MCP server you want to use.

    For example, to use the "[mcp-server-git](https://github.com/modelcontextprotocol/servers/tree/main/src/git)" server, you can do the following:

    ```python
    from agno.tools.mcp import MCPTools

    async with MCPTools(command=f"uvx mcp-server-git") as mcp_tools:
        ...
    ```
  </Step>

  <Step title="Provide the MCPTools to the Agent">
    When initializing the Agent, pass the `MCPTools` class in the `tools` parameter.

    The agent will now be ready to use the MCP server:

    ```python
    from agno.agent import Agent
    from agno.models.openai import OpenAIChat
    from agno.tools.mcp import MCPTools

    async with MCPTools(command=f"uvx mcp-server-git") as mcp_tools:
        # Setup and run the agent
        agent = Agent(model=OpenAIChat(id="gpt-4o"), tools=[mcp_tools])
        await agent.aprint_response("What is the license for this project?", stream=True)
    ```
  </Step>
</Steps>

### Basic example: Filesystem Agent

Here's a filesystem agent that uses the [Filesystem MCP server](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) to explore and analyze files:

```python filesystem_agent.py
import asyncio
from pathlib import Path
from textwrap import dedent

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.mcp import MCPTools
from mcp import StdioServerParameters


async def run_agent(message: str) -> None:
    """Run the filesystem agent with the given message."""

    file_path = str(Path(__file__).parent.parent.parent.parent)

    # MCP server to access the filesystem (via `npx`)
    async with MCPTools(f"npx -y @modelcontextprotocol/server-filesystem {file_path}") as mcp_tools:
        agent = Agent(
            model=OpenAIChat(id="gpt-4o"),
            tools=[mcp_tools],
            instructions=dedent("""\
                You are a filesystem assistant. Help users explore files and directories.

                - Navigate the filesystem to answer questions
                - Use the list_allowed_directories tool to find directories that you can access
                - Provide clear context about files you examine
                - Use headings to organize your responses
                - Be concise and focus on relevant information\
            """),
            markdown=True,
            show_tool_calls=True,
        )

        # Run the agent
        await agent.aprint_response(message, stream=True)


# Example usage
if __name__ == "__main__":
    # Basic example - exploring project license
    asyncio.run(run_agent("What is the license for this project?"))
```

## Using MCP in Agno Playground

You can also run MCP servers in the Agno Playground, which provides a web interface for interacting with your agents. Here's an example of a GitHub agent running in the Playground:

```python github_playground.py
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
```

## Best Practices

1. **Error Handling**: Always include proper error handling for MCP server connections and operations.

2. **Resource Cleanup**: Use `MCPTools` or `MultiMCPTools` as an async context manager to ensure proper cleanup of resources:

```python
async with MCPTools(command) as mcp_tools:
    # Your agent code here
```

3. **Clear Instructions**: Provide clear and specific instructions to your agent:

```python
instructions = """
You are a filesystem assistant. Help users explore files and directories.
- Navigate the filesystem to answer questions
- Use the list_allowed_directories tool to find accessible directories
- Provide clear context about files you examine
- Be concise and focus on relevant information
"""
```

## More Information

* Find examples of Agents that use MCP [here](https://docs.agno.com/examples/concepts/tools/mcp/airbnb).
* Find a collection of MCP servers [here](https://github.com/modelcontextprotocol/servers).
* Read the [MCP documentation](https://modelcontextprotocol.io/introduction) to learn more about the Model Context Protocol.
* Checkout the Agno [Cookbook](https://github.com/agno-agi/agno/tree/main/cookbook/tools/mcp) for more examples of Agents that use MCP.


# Stdio Transport

Transports in the Model Context Protocol (MCP) define how messages are sent and received. The Agno integration supports the three existing types:
[stdio](https://modelcontextprotocol.io/docs/concepts/transports#standard-input%2Foutput-stdio),
[SSE](https://modelcontextprotocol.io/docs/concepts/transports#server-sent-events-sse) and
[Streamable HTTP](https://modelcontextprotocol.io/specification/draft/basic/transports#streamable-http).

The stdio (standard input/output) transport is the default one in Agno's integration. It works best for local integrations.

To use it, simply initialize the `MCPTools` class with its `command` argument.
The command you want to pass is the one used to run the MCP server the agent will have access to.

For example `uvx mcp-server-git`, which runs a [git MCP server](https://github.com/modelcontextprotocol/servers/tree/main/src/git):

```python
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.mcp import MCPTools

async with MCPTools(command=f"uvx mcp-server-git") as mcp_tools:
    agent = Agent(model=OpenAIChat(id="gpt-4o"), tools=[mcp_tools])
    await agent.aprint_response("What is the license for this project?", stream=True)
```

You can also use multiple MCP servers at once, with the `MultiMCPTools` class. For example:

```python
import asyncio
import os

from agno.agent import Agent
from agno.tools.mcp import MultiMCPTools


async def run_agent(message: str) -> None:
    """Run the Airbnb and Google Maps agent with the given message."""

    env = {
        **os.environ,
        "GOOGLE_MAPS_API_KEY": os.getenv("GOOGLE_MAPS_API_KEY"),
    }

    async with MultiMCPTools(
        [
            "npx -y @openbnb/mcp-server-airbnb --ignore-robots-txt",
            "npx -y @modelcontextprotocol/server-google-maps",
        ],
        env=env,
    ) as mcp_tools:
        agent = Agent(
            tools=[mcp_tools],
            markdown=True,
            show_tool_calls=True,
        )

        await agent.aprint_response(message, stream=True)


# Example usage
if __name__ == "__main__":
    # Pull request example
    asyncio.run(
        run_agent(
            "What listings are available in Cape Town for 2 people for 3 nights from 1 to 4 August 2025?"
        )
    )
```


# SSE Transport

Agno's MCP integration supports the [SSE transport](https://modelcontextprotocol.io/docs/concepts/transports#server-sent-events-sse). This transport enables server-to-client streaming, and can prove more useful than [stdio](https://modelcontextprotocol.io/docs/concepts/transports#standard-input%2Foutput-stdio) when working with restricted networks.

To use it, initialize the `MCPTools` passing the URL of the MCP server and setting the transport to `sse`:

```python
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.mcp import MCPTools

server_url = "http://localhost:8000/sse"

async with MCPTools(url=server_url, transport="sse") as mcp_tools:
    agent = Agent(model=OpenAIChat(id="gpt-4o"), tools=[mcp_tools])
    await agent.aprint_response("What is the license for this project?", stream=True)
```

You can also use the `server_params` argument to define the MCP connection. This way you can specify the headers to send to the MCP server with every request, and the timeout values:

```python
from agno.tools.mcp import MCPTools, SSEClientParams

server_params = SSEClientParams(
    url=...,
    headers=...,
    timeout=...,
    sse_read_timeout=...,
)

async with MCPTools(server_params=server_params) as mcp_tools:
    ...
```

## Complete example

Let's set up a simple local server and connect to it using the SSE transport:

<Steps>
  <Step title="Setup the server">
    ```python sse_server.py
    from mcp.server.fastmcp import FastMCP

    mcp = FastMCP("calendar_assistant")


    @mcp.tool()
    def get_events(day: str) -> str:
        return f"There are no events scheduled for {day}."


    @mcp.tool()
    def get_birthdays_this_week() -> str:
        return "It is your mom's birthday tomorrow"


    if __name__ == "__main__":
        mcp.run(transport="sse")
    ```
  </Step>

  <Step title="Setup the client">
    ```python sse_client.py
    import asyncio

    from agno.agent import Agent
    from agno.models.openai import OpenAIChat
    from agno.tools.mcp import MCPTools, MultiMCPTools

    # This is the URL of the MCP server we want to use.
    server_url = "http://localhost:8000/sse"


    async def run_agent(message: str) -> None:
        async with MCPTools(transport="sse", url=server_url) as mcp_tools:
            agent = Agent(
                model=OpenAIChat(id="gpt-4o"),
                tools=[mcp_tools],
                markdown=True,
            )
            await agent.aprint_response(message=message, stream=True, markdown=True)


    # Using MultiMCPTools, we can connect to multiple MCP servers at once, even if they use different transports.
    # In this example we connect to both our example server (SSE transport), and a different server (stdio transport).
    async def run_agent_with_multimcp(message: str) -> None:
        async with MultiMCPTools(
            commands=["npx -y @openbnb/mcp-server-airbnb --ignore-robots-txt"],
            urls=[server_url],
        ) as mcp_tools:
            agent = Agent(
                model=OpenAIChat(id="gpt-4o"),
                tools=[mcp_tools],
                markdown=True,
            )
            await agent.aprint_response(message=message, stream=True, markdown=True)


    if __name__ == "__main__":
        asyncio.run(run_agent("Do I have any birthdays this week?"))
        asyncio.run(
            run_agent_with_multimcp(
                "Can you check when is my mom's birthday, and if there are any AirBnb listings in SF for two people for that day?"
            )
        )
    ```
  </Step>

  <Step title="Run the server">
    ```bash
    python sse_server.py
    ```
  </Step>

  <Step title="Run the client">
    ```bash
    python sse_client.py
    ```
  </Step>
</Steps>


# Streamable HTTP Transport

The new [Streamable HTTP transport](https://modelcontextprotocol.io/specification/draft/basic/transports#streamable-http) replaces the HTTP+SSE transport from protocol version 2024-11-05.

This transport enables the MCP server to handle multiple client connections, and can also use SSE for server-to-client streaming.

To use it, initialize the `MCPTools` passing the URL of the MCP server and setting the transport to `streamable-http`:

```python
from agno.agent import Agent
    from agno.models.openai import OpenAIChat
    from agno.tools.mcp import MCPTools

    server_url = "http://localhost:8000/mcp"

    async with MCPTools(url=server_url, transport="streamable-http") as mcp_tools:
        agent = Agent(model=OpenAIChat(id="gpt-4o"), tools=[mcp_tools])
        await agent.aprint_response("What is the license for this project?", stream=True)
```

You can also use the `server_params` argument to define the MCP connection. This way you can specify the headers to send to the MCP server with every request, and the timeout values:

```python
from agno.tools.mcp import MCPTools, StreamableHTTPClientParams

server_params = StreamableHTTPClientParams(
    url=...,
    headers=...,
    timeout=...,
    sse_read_timeout=...,
    terminate_on_close=...,

)

async with MCPTools(server_params=server_params) as mcp_tools:
    ...
```

## Complete example

Let's set up a simple local server and connect to it using the Streamable HTTP transport:

<Steps>
  <Step title="Setup the server">
    ```python streamable_http_server.py
    from mcp.server.fastmcp import FastMCP

    mcp = FastMCP("calendar_assistant")


    @mcp.tool()
    def get_events(day: str) -> str:
        return f"There are no events scheduled for {day}."


    @mcp.tool()
    def get_birthdays_this_week() -> str:
        return "It is your mom's birthday tomorrow"


    if __name__ == "__main__":
        mcp.run(transport="streamable-http")
    ```
  </Step>

  <Step title="Setup the client">
    ```python streamable_http_client.py
    import asyncio

    from agno.agent import Agent
    from agno.models.openai import OpenAIChat
    from agno.tools.mcp import MCPTools, MultiMCPTools

    # This is the URL of the MCP server we want to use.
    server_url = "http://localhost:8000/mcp"


    async def run_agent(message: str) -> None:
        async with MCPTools(transport="streamable-http", url=server_url) as mcp_tools:
            agent = Agent(
                model=OpenAIChat(id="gpt-4o"),
                tools=[mcp_tools],
                markdown=True,
            )
            await agent.aprint_response(message=message, stream=True, markdown=True)


    # Using MultiMCPTools, we can connect to multiple MCP servers at once, even if they use different transports.
    # In this example we connect to both our example server (Streamable HTTP transport), and a different server (stdio transport).
    async def run_agent_with_multimcp(message: str) -> None:
        async with MultiMCPTools(
            commands=["npx -y @openbnb/mcp-server-airbnb --ignore-robots-txt"],
            urls=[server_url],
            urls_transports=["streamable-http"],
        ) as mcp_tools:
            agent = Agent(
                model=OpenAIChat(id="gpt-4o"),
                tools=[mcp_tools],
                markdown=True,
            )
            await agent.aprint_response(message=message, stream=True, markdown=True)


    if __name__ == "__main__":
        asyncio.run(run_agent("Do I have any birthdays this week?"))
        asyncio.run(
            run_agent_with_multimcp(
                "Can you check when is my mom's birthday, and if there are any AirBnb listings in SF for two people for that day?"
            )
        )
    ```
  </Step>

  <Step title="Run the server">
    ```bash
    python streamable_http_server.py
    ```
  </Step>

  <Step title="Run the client">
    ```bash
    python sse_client.py
    ```
  </Step>
</Steps>


# Advanced MCP Usage

Agno's MCP integration also supports handling connections to multiple servers, specifying server parameters and using your own MCP servers:

## Connecting to Multiple MCP Servers

You can use multiple MCP servers in a single agent by using the `MultiMCPTools` class.

```python multiple_mcp_servers.py
import asyncio
import os

from agno.agent import Agent
from agno.tools.mcp import MultiMCPTools


async def run_agent(message: str) -> None:
    """Run the Airbnb and Google Maps agent with the given message."""

    env = {
        **os.environ,
        "GOOGLE_MAPS_API_KEY": os.getenv("GOOGLE_MAPS_API_KEY"),
    }

    async with MultiMCPTools(
        [
            "npx -y @openbnb/mcp-server-airbnb --ignore-robots-txt",
            "npx -y @modelcontextprotocol/server-google-maps",
        ],
        env=env,
    ) as mcp_tools:
        agent = Agent(
            tools=[mcp_tools],
            markdown=True,
            show_tool_calls=True,
        )

        await agent.aprint_response(message, stream=True)


# Example usage
if __name__ == "__main__":
    # Pull request example
    asyncio.run(
        run_agent(
            "What listings are available in Cape Town for 2 people for 3 nights from 1 to 4 August 2025?"
        )
    )
```

### Understanding Server Parameters

The recommended way to configure `MCPTools` or `MultiMCPTools` is to use the `command` or `url` parameters.

Alternatively, you can use the `server_params` parameter with `MCPTools` to configure the connection to the MCP server in more detail.

When using the **stdio** transport, the `server_params` parameter should be an instance of `StdioServerParameters`. It contains the following keys:

* `command`: The command to run the MCP server.
  * Use `npx` for mcp servers that can be installed via npm (or `node` if running on Windows).
  * Use `uvx` for mcp servers that can be installed via uvx.
* `args`: The arguments to pass to the MCP server.
* `env`: Optional environment variables to pass to the MCP server. Remember to include all current environment variables in the `env` dictionary. If `env` is not provided, the current environment variables will be used.
  e.g.

```python
{
    **os.environ,
    "GOOGLE_MAPS_API_KEY": os.getenv("GOOGLE_MAPS_API_KEY"),
}
```

When using the **SSE** transport, the `server_params` parameter should be an instance of `SSEClientParams`. It contains the following fields:

* `url`: The URL of the MCP server.
* `headers`: Headers to pass to the MCP server (optional).
* `timeout`: Timeout for the connection to the MCP server (optional).
* `sse_read_timeout`: Timeout for the SSE connection itself (optional).

When using the **Streamable HTTP** transport, the `server_params` parameter should be an instance of `StreamableHTTPClientParams`. It contains the following fields:

* `url`: The URL of the MCP server.
* `headers`: Headers to pass to the MCP server (optional).
* `timeout`: Timeout for the connection to the MCP server (optional).
* `sse_read_timeout`: how long (in seconds) the client will wait for a new event before disconnecting. All other HTTP operations are controlled by `timeout` (optional).
* `terminate_on_close`: Whether to terminate the connection when the client is closed (optional).

## More Flexibility

You can also create the MCP server yourself and pass it to the `MCPTools` constructor.

```python filesystem_agent.py
import asyncio
from pathlib import Path
from textwrap import dedent

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.mcp import MCPTools
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


async def create_filesystem_agent(session):
    """Create and configure a filesystem agent with MCP tools."""
    # Initialize the MCP toolkit
    mcp_tools = MCPTools(session=session)
    await mcp_tools.initialize()

    # Create an agent with the MCP toolkit
    return Agent(
        model=OpenAIChat(id="gpt-4o"),
        tools=[mcp_tools],
        instructions=dedent("""\
            You are a filesystem assistant. Help users explore files and directories.

            - Navigate the filesystem to answer questions
            - Use the list_allowed_directories tool to find directories that you can access
            - Provide clear context about files you examine
            - Use headings to organize your responses
            - Be concise and focus on relevant information\
        """),
        markdown=True,
        show_tool_calls=True,
    )


async def run_agent(message: str) -> None:
    """Run the filesystem agent with the given message."""

    # Initialize the MCP server
    server_params = StdioServerParameters(
        command="npx",
        args=[
            "-y",
            "@modelcontextprotocol/server-filesystem",
            str(Path(__file__).parent.parent.parent.parent),  # Set this to the root of the project you want to explore
        ],
    )

    # Create a client session to connect to the MCP server
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            agent = await create_filesystem_agent(session)

            # Run the agent
            await agent.aprint_response(message, stream=True)


# Example usage
if __name__ == "__main__":
    # Basic example - exploring project license
    asyncio.run(run_agent("What is the license for this project?"))
```


Stripe Example 

# Stripe MCP agent

Using the [Stripe MCP server](https://github.com/stripe/agent-toolkit/tree/main/modelcontextprotocol) to create an Agent that can interact with the Stripe API:

```python
"""💵 Stripe MCP Agent - Manage Your Stripe Operations

This example demonstrates how to create an Agno agent that interacts with the Stripe API via the Model Context Protocol (MCP). This agent can create and manage Stripe objects like customers, products, prices, and payment links using natural language commands.


Setup:
2. Install Python dependencies: `pip install agno mcp-sdk`
3. Set Environment Variable: export STRIPE_SECRET_KEY=***.

Stripe MCP Docs: https://github.com/stripe/agent-toolkit
"""

import asyncio
import os
from textwrap import dedent

from agno.agent import Agent
from agno.tools.mcp import MCPTools
from agno.utils.log import log_error, log_exception, log_info


async def run_agent(message: str) -> None:
    """
    Sets up the Stripe MCP server and initialize the Agno agent
    """
    # Verify Stripe API Key is available
    stripe_api_key = os.getenv("STRIPE_SECRET_KEY")
    if not stripe_api_key:
        log_error("STRIPE_SECRET_KEY environment variable not set.")
        return

    enabled_tools = "paymentLinks.create,products.create,prices.create,customers.create,customers.read"

    # handle different Operating Systems
    npx_command = "npx.cmd" if os.name == "nt" else "npx"

    try:
        # Initialize MCP toolkit with Stripe server
        async with MCPTools(
            command=f"{npx_command} -y @stripe/mcp --tools={enabled_tools} --api-key={stripe_api_key}"
        ) as mcp_toolkit:
            agent = Agent(
                name="StripeAgent",
                instructions=dedent("""\
                    You are an AI assistant specialized in managing Stripe operations.
                    You interact with the Stripe API using the available tools.

                    - Understand user requests to create or list Stripe objects (customers, products, prices, payment links).
                    - Clearly state the results of your actions, including IDs of created objects or lists retrieved.
                    - Ask for clarification if a request is ambiguous.
                    - Use markdown formatting, especially for links or code snippets.
                    - Execute the necessary steps sequentially if a request involves multiple actions (e.g., create product, then price, then link).
                """),
                tools=[mcp_toolkit],
                markdown=True,
                show_tool_calls=True,
            )

            # Run the agent with the provided task
            log_info(f"Running agent with assignment: '{message}'")
            await agent.aprint_response(message, stream=True)

    except FileNotFoundError:
        error_msg = f"Error: '{npx_command}' command not found. Please ensure Node.js and npm/npx are installed and in your system's PATH."
        log_error(error_msg)
    except Exception as e:
        log_exception(f"An unexpected error occurred during agent execution: {e}")


if __name__ == "__main__":
    task = "Create a new Stripe product named 'iPhone'. Then create a price of $999.99 USD for it. Finally, create a payment link for that price."
    asyncio.run(run_agent(task))


# Example prompts:
"""
Customer Management:
- "Create a customer. Name: ACME Corp, Email: billing@acme.example.com"
- "List my customers."
- "Find customer by email 'jane.doe@example.com'" # Note: Requires 'customers.retrieve' or search capability

Product and Price Management:
- "Create a new product called 'Basic Plan'."
- "Create a recurring monthly price of $10 USD for product 'Basic Plan'."
- "Create a product 'Ebook Download' and a one-time price of $19.95 USD."
- "List all products." # Note: Requires 'products.list' capability
- "List all prices." # Note: Requires 'prices.list' capability

Payment Links:
- "Create a payment link for the $10 USD monthly 'Basic Plan' price."
- "Generate a payment link for the '$19.95 Ebook Download'."

Combined Tasks:
- "Create a product 'Pro Service', add a price $150 USD (one-time), and give me the payment link."
- "Register a new customer 'support@example.com' named 'Support Team'."
"""


```
