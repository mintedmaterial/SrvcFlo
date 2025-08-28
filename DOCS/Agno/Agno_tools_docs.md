# Structured Output

Teams can generate structured data using Pydantic models, just like individual agents. This feature is perfect for coordinated data extraction, analysis, and report generation where multiple agents work together to produce a structured result.

## Example

Let's create a Stock Research Team that produces a structured `StockReport`.

```python stock_team.py
from typing import List
from pydantic import BaseModel, Field
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.team.team import Team
from agno.tools.yfinance import YFinanceTools

class StockAnalysis(BaseModel):
    symbol: str
    company_name: str
    analysis: str

class CompanyAnalysis(BaseModel):
    company_name: str
    analysis: str

class StockReport(BaseModel):
    symbol: str = Field(..., description="Stock ticker symbol")
    company_name: str = Field(..., description="Full company name")
    current_price: str = Field(..., description="Current stock price")
    analysis: str = Field(..., description="Comprehensive analysis combining multiple perspectives")
    recommendation: str = Field(..., description="Investment recommendation: Buy, Hold, or Sell")

# Create specialized agents
stock_searcher = Agent(
    name="Stock Searcher",
    model=OpenAIChat("gpt-4o"),
    response_model=StockAnalysis,
    role="Searches for current stock information and price data.",
    tools=[
        YFinanceTools(
            stock_price=True,
            analyst_recommendations=True,
        )
    ],
)

company_info_agent = Agent(
    name="Company Info Searcher", 
    model=OpenAIChat("gpt-4o"),
    role="Researches company fundamentals and recent news.",
    response_model=CompanyAnalysis,
    tools=[
        YFinanceTools(
            stock_price=False,
            company_info=True,
            company_news=True,
        )
    ],
)

# Create team with structured output
stock_research_team = Team(
    name="Stock Research Team",
    mode="coordinate",
    model=OpenAIChat("gpt-4o"),
    members=[stock_searcher, company_info_agent],
    response_model=StockReport,
    markdown=True,
    show_members_responses=True,
)

stock_research_team.print_response("Give me a comprehensive stock report for NVDA")
```

The team will coordinate between its members and produce a structured `StockReport` object:

```python
StockReport(
│   symbol='NVDA',
│   company_name='NVIDIA Corporation',
│   current_price='$875.42',
│   analysis='NVIDIA continues to dominate the AI chip market with strong demand for its H100 and upcoming H200 GPUs. The company has shown exceptional growth in data center revenue, driven by enterprise AI adoption and cloud provider expansion. Recent partnerships with major tech companies strengthen its market position, though competition from AMD and Intel is intensifying.',
│   recommendation='Buy'
)
```

## Using a Parser Model

You can use an additional model to parse and structure the output from your primary model. This approach is particularly effective when the primary model is optimized for reasoning tasks, as such models may not consistently produce detailed structured responses.

```python
team = Team(
    name="Stock Research Team",
    mode="coordinate",
    model=Claude(id="claude-sonnet-4-20250514"),
    members=[stock_searcher, company_info_agent],
    response_model=StockReport,
    parser_model=OpenAIChat(id="gpt-4o"),
)
```

You can also provide a custom `parser_model_prompt` to your Parser Model.

## Streaming Structured Output

Teams support streaming with structured output, where the `content` event contains the complete structured result as a single event.

```python streaming_team.py
from typing import List
from pydantic import BaseModel, Field
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.team.team import Team
from agno.tools.yfinance import YFinanceTools

class MarketAnalysis(BaseModel):
    sector: str = Field(..., description="Market sector being analyzed")
    key_trends: List[str] = Field(..., description="Major trends affecting the sector")
    top_performers: List[str] = Field(..., description="Best performing stocks in the sector")
    market_outlook: str = Field(..., description="Overall market outlook and predictions")
    risk_factors: List[str] = Field(..., description="Key risks to consider")

# Create research agents
trend_analyst = Agent(
    name="Trend Analyst",
    model=OpenAIChat("gpt-4o"),
    role="Analyzes market trends and sector performance.",
    tools=[YFinanceTools(stock_price=True, analyst_recommendations=True)]
)

risk_assessor = Agent(
    name="Risk Assessor", 
    model=OpenAIChat("gpt-4o"),
    role="Identifies and evaluates market risks and opportunities.",
    tools=[YFinanceTools(company_news=True, company_info=True)]
)

# Create streaming team
market_research_team = Team(
    name="Market Research Team",
    mode="coordinate", 
    model=OpenAIChat("gpt-4o"),
    members=[trend_analyst, risk_assessor],
    response_model=MarketAnalysis,
    markdown=True,
    show_members_responses=True,
)

# Stream the team response
market_research_team.print_response(
    "Analyze the technology sector for Q1 2024", 
    stream=True, 
    stream_intermediate_steps=True
)
```

<Note>
  When streaming with teams and structured output, you'll see intermediate steps from individual team members, but the final structured result is delivered as a single complete chunk rather than being streamed progressively.
</Note>

## Developer Resources

* View [Streaming Team Output](https://github.com/agno-agi/agno/blob/main/cookbook/teams/structured_output_streaming.py)


# Writing your own tools

> Learn how to write your own tools and how to use the `@tool` decorator to modify the behavior of a tool.

In most production cases, you will need to write your own tools. Which is why we're focused on provide the best tool-use experience in Agno.

The rule is simple:

* Any python function can be used as a tool by an Agent.
* Use the `@tool` decorator to modify what happens before and after this tool is called.

## Any python function can be used as a tool

For example, here's how to use a `get_top_hackernews_stories` function as a tool:

```python hn_agent.py
import json
import httpx

from agno.agent import Agent

def get_top_hackernews_stories(num_stories: int = 10) -> str:
    """
    Use this function to get top stories from Hacker News.

    Args:
        num_stories (int): Number of stories to return. Defaults to 10.

    Returns:
        str: JSON string of top stories.
    """

    # Fetch top story IDs
    response = httpx.get('https://hacker-news.firebaseio.com/v0/topstories.json')
    story_ids = response.json()

    # Fetch story details
    stories = []
    for story_id in story_ids[:num_stories]:
        story_response = httpx.get(f'https://hacker-news.firebaseio.com/v0/item/{story_id}.json')
        story = story_response.json()
        if "text" in story:
            story.pop("text", None)
        stories.append(story)
    return json.dumps(stories)

agent = Agent(tools=[get_top_hackernews_stories], show_tool_calls=True, markdown=True)
agent.print_response("Summarize the top 5 stories on hackernews?", stream=True)
```

## Magic of the @tool decorator

To modify the behavior of a tool, use the `@tool` decorator. Some notable features:

* `requires_confirmation=True`: Requires user confirmation before execution.
* `requires_user_input=True`: Requires user input before execution. Use `user_input_fields` to specify which fields require user input.
* `external_execution=True`: The tool will be executed outside of the agent's control.
* `show_result=True`: Show the output of the tool call in the Agent's response. Without this flag, the result of the tool call is sent to the model for further processing.
* `stop_after_tool_call=True`: Stop the agent run after the tool call.
* `tool_hooks`: Run custom logic before and after this tool call.
* `cache_results=True`: Cache the tool result to avoid repeating the same call. Use `cache_dir` and `cache_ttl` to configure the cache.

Here's an example that uses many possible parameters on the `@tool` decorator.

```python advanced_tool.py
import httpx
from agno.agent import Agent
from agno.tools import tool
from typing import Any, Callable, Dict

def logger_hook(function_name: str, function_call: Callable, arguments: Dict[str, Any]):
    """Hook function that wraps the tool execution"""
    print(f"About to call {function_name} with arguments: {arguments}")
    result = function_call(**arguments)
    print(f"Function call completed with result: {result}")
    return result

@tool(
    name="fetch_hackernews_stories",                # Custom name for the tool (otherwise the function name is used)
    description="Get top stories from Hacker News",  # Custom description (otherwise the function docstring is used)
    show_result=True,                               # Show result after function call
    stop_after_tool_call=True,                      # Return the result immediately after the tool call and stop the agent
    tool_hooks=[logger_hook],                       # Hook to run before and after execution
    requires_confirmation=True,                     # Requires user confirmation before execution
    cache_results=True,                             # Enable caching of results
    cache_dir="/tmp/agno_cache",                    # Custom cache directory
    cache_ttl=3600                                  # Cache TTL in seconds (1 hour)
)
def get_top_hackernews_stories(num_stories: int = 5) -> str:
    """
    Fetch the top stories from Hacker News.

    Args:
        num_stories: Number of stories to fetch (default: 5)

    Returns:
        str: The top stories in text format
    """
    # Fetch top story IDs
    response = httpx.get("https://hacker-news.firebaseio.com/v0/topstories.json")
    story_ids = response.json()

    # Get story details
    stories = []
    for story_id in story_ids[:num_stories]:
        story_response = httpx.get(f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json")
        story = story_response.json()
        stories.append(f"{story.get('title')} - {story.get('url', 'No URL')}")

    return "\n".join(stories)

agent = Agent(tools=[get_top_hackernews_stories])
agent.print_response("Show me the top news from Hacker News")
```

### @tool Parameters Reference

| Parameter               | Type             | Description                                                       |
| ----------------------- | ---------------- | ----------------------------------------------------------------- |
| `name`                  | `str`            | Override for the function name                                    |
| `description`           | `str`            | Override for the function description                             |
| `show_result`           | `bool`           | If True, shows the result after function call                     |
| `stop_after_tool_call`  | `bool`           | If True, the agent will stop after the function call              |
| `tool_hooks`            | `list[Callable]` | List of hooks that wrap the function execution                    |
| `pre_hook`              | `Callable`       | Hook to run before the function is executed                       |
| `post_hook`             | `Callable`       | Hook to run after the function is executed                        |
| `requires_confirmation` | `bool`           | If True, requires user confirmation before execution              |
| `requires_user_input`   | `bool`           | If True, requires user input before execution                     |
| `user_input_fields`     | `list[str]`      | List of fields that require user input                            |
| `external_execution`    | `bool`           | If True, the tool will be executed outside of the agent's control |
| `cache_results`         | `bool`           | If True, enable caching of function results                       |
| `cache_dir`             | `str`            | Directory to store cache files                                    |
| `cache_ttl`             | `int`            | Time-to-live for cached results in seconds (default: 3600)        |


# Exceptions

If after a tool call we need to "retry" the model with a different set of instructions or stop the agent, we can raise one of the following exceptions:

* `RetryAgentRun`: Use this exception when you want to retry the agent run with a different set of instructions.
* `StopAgentRun`: Use this exception when you want to stop the agent run.
* `AgentRunException`: A generic exception that can be used to retry the tool call.

This example shows how to use the `RetryAgentRun` exception to retry the agent with additional instructions.

```python retry_in_tool_call.py
from agno.agent import Agent
from agno.exceptions import RetryAgentRun
from agno.models.openai import OpenAIChat
from agno.utils.log import logger


def add_item(agent: Agent, item: str) -> str:
    """Add an item to the shopping list."""
    agent.session_state["shopping_list"].append(item)
    len_shopping_list = len(agent.session_state["shopping_list"])
    if len_shopping_list < 3:
        raise RetryAgentRun(
            f"Shopping list is: {agent.session_state['shopping_list']}. Minimum 3 items in the shopping list. "
            + f"Add {3 - len_shopping_list} more items.",
        )

    logger.info(f"The shopping list is now: {agent.session_state.get('shopping_list')}")
    return f"The shopping list is now: {agent.session_state.get('shopping_list')}"


agent = Agent(
    model=OpenAIChat(id="gpt-4o-mini"),
    # Initialize the session state with empty shopping list
    session_state={"shopping_list": []},
    tools=[add_item],
    markdown=True,
)
agent.print_response("Add milk", stream=True)
print(f"Final session state: {agent.session_state}")
```

<Tip>
  Make sure to set `AGNO_DEBUG=True` to see the debug logs.
</Tip>


# Hooks

> Learn how to use tool hooks to modify the behavior of a tool.

## Tool Hooks

You can use tool hooks to perform validation, logging, or any other logic before or after a tool is called.

A tool hook is a function that takes a function name, function call, and arguments.  Inside the tool hook, you have to call the function call and return the result.

For example:

```python
def logger_hook(
    function_name: str, function_call: Callable, arguments: Dict[str, Any]
):
    """Log the duration of the function call"""
    start_time = time.time()

    # Call the function
    result = function_call(**arguments)
    
    end_time = time.time()
    duration = end_time - start_time
    
    logger.info(f"Function {function_name} took {duration:.2f} seconds to execute")

    # Return the result
    return result
```

or

```python
def confirmation_hook(
    function_name: str, function_call: Callable, arguments: Dict[str, Any]
):
    """Confirm the function call"""
    if function_name != "get_top_hackernews_stories":
        raise ValueError("This tool is not allowed to be called")
    return function_call(**arguments)
```

You can assign tool hooks on agents and teams.  The tool hooks will be applied to all tools in the agent or team.

For example:

```python
agent = Agent(
    model=OpenAIChat(id="gpt-4o-mini"),
    tools=[DuckDuckGoTools()],
    tool_hooks=[logger_hook],
)
```

You can also assign multiple tool hooks at once. They will be applied in the order they are assigned.

```python
agent = Agent(
    model=OpenAIChat(id="gpt-4o-mini"),
    tools=[DuckDuckGoTools()],
    tool_hooks=[logger_hook, confirmation_hook],  # The logger_hook will run on the outer layer, and the confirmation_hook will run on the inner layer
)
```

You can also assign tool hooks to specific custom tools.

```python
@tool(tool_hooks=[logger_hook, confirmation_hook])
def get_top_hackernews_stories(num_stories: int) -> Iterator[str]:
    """Fetch top stories from Hacker News.

    Args:
        num_stories (int): Number of stories to retrieve
    """
    # Fetch top story IDs
    response = httpx.get("https://hacker-news.firebaseio.com/v0/topstories.json")
    story_ids = response.json()

    # Yield story details
    final_stories = []
    for story_id in story_ids[:num_stories]:
        story_response = httpx.get(
            f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json"
        )
        story = story_response.json()
        if "text" in story:
            story.pop("text", None)
        final_stories.append(story)

    return json.dumps(final_stories)

agent = Agent(
    model=OpenAIChat(id="gpt-4o-mini"),
    tools=[get_top_hackernews_stories],
)
```

## Pre and Post Hooks

Pre and post hooks let's you modify what happens before and after a tool is called. It is an alternative to tool hooks.

Set the `pre_hook` in the `@tool` decorator to run a function before the tool call.

Set the `post_hook` in the `@tool` decorator to run a function after the tool call.

Here's a demo example of using a `pre_hook`, `post_hook` along with Agent Context.

```python pre_and_post_hooks.py
import json
from typing import Iterator

import httpx
from agno.agent import Agent
from agno.tools import FunctionCall, tool


def pre_hook(fc: FunctionCall):
    print(f"Pre-hook: {fc.function.name}")
    print(f"Arguments: {fc.arguments}")
    print(f"Result: {fc.result}")


def post_hook(fc: FunctionCall):
    print(f"Post-hook: {fc.function.name}")
    print(f"Arguments: {fc.arguments}")
    print(f"Result: {fc.result}")


@tool(pre_hook=pre_hook, post_hook=post_hook)
def get_top_hackernews_stories(agent: Agent) -> Iterator[str]:
    num_stories = agent.context.get("num_stories", 5) if agent.context else 5

    # Fetch top story IDs
    response = httpx.get("https://hacker-news.firebaseio.com/v0/topstories.json")
    story_ids = response.json()

    # Yield story details
    for story_id in story_ids[:num_stories]:
        story_response = httpx.get(
            f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json"
        )
        story = story_response.json()
        if "text" in story:
            story.pop("text", None)
        yield json.dumps(story)


agent = Agent(
    context={
        "num_stories": 2,
    },
    tools=[get_top_hackernews_stories],
    markdown=True,
    show_tool_calls=True,
)
agent.print_response("What are the top hackernews stories?", stream=True)
```


# Human in the loop

Human in the loop (HITL) let's you get input from a user before or after executing a tool call.

The example below shows how to use a tool hook to get user confirmation before executing a tool call.

## Example: Human in the loop using tool hooks

This example shows how to:

* Add hooks to tools for user confirmation
* Handle user input during tool execution
* Gracefully cancel operations based on user choice

```python hitl.py
"""🤝 Human-in-the-Loop: Adding User Confirmation to Tool Calls

This example shows how to implement human-in-the-loop functionality in your Agno tools.
It shows how to:
- Add tool hooks to tools for user confirmation
- Handle user input during tool execution
- Gracefully cancel operations based on user choice

Some practical applications:
- Confirming sensitive operations before execution
- Reviewing API calls before they're made
- Validating data transformations
- Approving automated actions in critical systems

Run `pip install openai httpx rich agno` to install dependencies.
"""

import json
from typing import Any, Callable, Dict, Iterator

import httpx
from agno.agent import Agent
from agno.exceptions import StopAgentRun
from agno.models.openai import OpenAIChat
from agno.tools import FunctionCall, tool
from rich.console import Console
from rich.pretty import pprint
from rich.prompt import Prompt

# This is the console instance used by the print_response method
# We can use this to stop and restart the live display and ask for user confirmation
console = Console()


def confirmation_hook(
    function_name: str, function_call: Callable, arguments: Dict[str, Any]
):
    # Get the live display instance from the console
    live = console._live

    # Stop the live display temporarily so we can ask for user confirmation
    live.stop()  # type: ignore

    # Ask for confirmation
    console.print(f"\nAbout to run [bold blue]{fc.function.name}[/]")
    message = (
        Prompt.ask("Do you want to continue?", choices=["y", "n"], default="y")
        .strip()
        .lower()
    )

    # Restart the live display
    live.start()  # type: ignore

    # If the user does not want to continue, raise a StopExecution exception
    if message != "y":
        raise StopAgentRun(
            "Tool call cancelled by user",
            agent_message="Stopping execution as permission was not granted.",
        )
    
    # Call the function
    result = function_call(**arguments)

    # Optionally transform the result

    return result


@tool(tool_hooks=[confirmation_hook])
def get_top_hackernews_stories(num_stories: int) -> Iterator[str]:
    """Fetch top stories from Hacker News.

    Args:
        num_stories (int): Number of stories to retrieve

    Returns:
        str: JSON string containing story details
    """
    # Fetch top story IDs
    response = httpx.get("https://hacker-news.firebaseio.com/v0/topstories.json")
    story_ids = response.json()

    # Yield story details
    final_stories = []
    for story_id in story_ids[:num_stories]:
        story_response = httpx.get(
            f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json"
        )
        story = story_response.json()
        if "text" in story:
            story.pop("text", None)
        final_stories.append(story)

    return json.dumps(final_stories)


# Initialize the agent with a tech-savvy personality and clear instructions
agent = Agent(
    model=OpenAIChat(id="gpt-4o-mini"),
    tools=[get_top_hackernews_stories],
    markdown=True,
)

agent.print_response(
    "Fetch the top 2 hackernews stories?", stream=True, console=console
)
```


Calculater example

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


Sleep Example

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


Shell Example

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


python example

# Python Tools

## Code

```python cookbook/tools/python_tools.py
from agno.agent import Agent
from agno.tools.python import PythonTools

agent = Agent(
    tools=[PythonTools()],
    show_tool_calls=True,
    markdown=True,
)
agent.print_response("Calculate the factorial of 5 using Python")
```

## Usage

<Steps>
  <Snippet file="create-venv-step.mdx" />

  <Step title="Set your API key">
    ```bash
    export OPENAI_API_KEY=xxx
    ```
  </Step>

  <Step title="Install libraries">
    ```bash
    pip install -U openai agno
    ```
  </Step>

  <Step title="Run Agent">
    <CodeGroup>
      ```bash Mac
      python cookbook/tools/python_tools.py
      ```

      ```bash Windows
      python cookbook/tools/python_tools.py
      ```
    </CodeGroup>
  </Step>
</Steps>


File tool example 

# File Tools

## Code

```python cookbook/tools/file_tools.py
from pathlib import Path

from agno.agent import Agent
from agno.tools.file import FileTools

agent = Agent(tools=[FileTools(Path("tmp/file"))], show_tool_calls=True)
agent.print_response(
    "What is the most advanced LLM currently? Save the answer to a file.", markdown=True
)
```

## Usage

<Steps>
  <Snippet file="create-venv-step.mdx" />

  <Step title="Set your API key">
    ```bash
    export OPENAI_API_KEY=xxx
    ```
  </Step>

  <Step title="Install libraries">
    ```bash
    pip install -U openai agno
    ```
  </Step>

  <Step title="Run Agent">
    <CodeGroup>
      ```bash Mac
      python cookbook/tools/file_tools.py
      ```

      ```bash Windows
      python cookbook/tools/file_tools.py
      ```
    </CodeGroup>
  </Step>
</Steps>
