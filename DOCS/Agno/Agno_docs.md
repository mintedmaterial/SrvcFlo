# What is Agno?

> Agno is a python framework for building multi-agent systems with shared memory, knowledge and reasoning.

Engineers and researchers use Agno to build:

* **Level 1:** Agents with tools and instructions ([example](/introduction/agents#level-1%3A-agents-with-tools-and-instructions)).
* **Level 2:** Agents with knowledge and storage ([example](/introduction/agents#level-2%3A-agents-with-knowledge-and-storage)).
* **Level 3:** Agents with memory and reasoning ([example](/introduction/agents#level-3%3A-agents-with-memory-and-reasoning)).
* **Level 4:** Agent Teams that can reason and collaborate ([example](/introduction/multi-agent-systems#level-4%3A-agent-teams-that-can-reason-and-collaborate)).
* **Level 5:** Agentic Workflows with state and determinism ([example](/introduction/multi-agent-systems#level-5%3A-agentic-workflows-with-state-and-determinism)).

**Example:** Level 1 Reasoning Agent that uses the YFinance API to answer questions:

```python Reasoning Finance Agent
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.tools.reasoning import ReasoningTools
from agno.tools.yfinance import YFinanceTools

reasoning_agent = Agent(
    model=Claude(id="claude-sonnet-4-20250514"),
    tools=[
        ReasoningTools(add_instructions=True),
        YFinanceTools(stock_price=True, analyst_recommendations=True, company_info=True, company_news=True),
    ],
    instructions="Use tables to display data.",
    markdown=True,
)
```

<Accordion title="Watch the reasoning finance agent in action">
  <video autoPlay muted controls className="w-full aspect-video" style={{ borderRadius: "8px" }} src="https://mintlify.s3.us-west-1.amazonaws.com/agno/videos/reasoning_finance_agent.mp4" />
</Accordion>

# Getting Started

If you're new to Agno, learn how to build your [first Agent](/introduction/agents), chat with it on the [playground](/introduction/playground) and [monitor](/introduction/monitoring) it on [app.agno.com](https://app.agno.com).

<CardGroup cols={3}>
  <Card title="Your first Agents" icon="user-astronaut" iconType="duotone" href="/introduction/agents">
    Learn how to build Agents with Agno
  </Card>

  <Card title="Agent Playground" icon="comment-dots" iconType="duotone" href="introduction/playground">
    Chat with your Agents using a beautiful Agent UI
  </Card>

  <Card title="Agent Monitoring" icon="rocket-launch" iconType="duotone" href="introduction/monitoring">
    Monitor your Agents on [agno.com](https://app.agno.com)
  </Card>
</CardGroup>

After that, dive deeper into the [concepts below](/introduction#dive-deeper) or explore the [examples gallery](/examples) to build real-world applications with Agno.

# Why Agno?

Agno will help you build best-in-class, highly-performant agentic systems, saving you hours of research and boilerplate. Here are some key features that set Agno apart:

* **Model Agnostic**: Agno provides a unified interface to 23+ model providers, no lock-in.
* **Highly performant**: Agents instantiate in **\~3μs** and use **\~6.5Kib** memory on average.
* **Reasoning is a first class citizen**: Reasoning improves reliability and is a must-have for complex autonomous agents. Agno supports 3 approaches to reasoning: Reasoning Models, `ReasoningTools` or our custom `chain-of-thought` approach.
* **Natively Multi-Modal**: Agno Agents are natively multi-modal, they accept text, image, audio and video as input and generate text, image, audio and video as output.
* **Advanced Multi-Agent Architecture**: Agno provides an industry leading multi-agent architecture (**Agent Teams**) with reasoning, memory, and shared context.
* **Built-in Agentic Search**: Agents can search for information at runtime using 20+ vector databases. Agno provides state-of-the-art Agentic RAG, **fully async and highly performant.**
* **Built-in Memory & Session Storage**: Agents come with built-in `Storage` & `Memory` drivers that give your Agents long-term memory and session storage.
* **Structured Outputs**: Agno Agents can return fully-typed responses using model provided structured outputs or `json_mode`.
* **Pre-built FastAPI Routes**: After building your Agents, serve them using pre-built FastAPI routes. 0 to production in minutes.
* **Monitoring**: Monitor agent sessions and performance in real-time on [agno.com](https://app.agno.com).

# Dive deeper

Agno is a battle-tested framework with a state of the art reasoning and multi-agent architecture, read the following guides to learn more:

<CardGroup cols={3}>
  <Card title="Agents" icon="user-astronaut" iconType="duotone" href="/agents">
    Learn how to build lightning fast Agents.
  </Card>

  <Card title="Teams" icon="microchip" iconType="duotone" href="/teams">
    Build autonomous multi-agent teams.
  </Card>

  <Card title="Models" icon="cube" iconType="duotone" href="/models">
    Use any model, any provider, no lock-in.
  </Card>

  <Card title="Tools" icon="screwdriver-wrench" iconType="duotone" href="/tools">
    100s of tools to extend your Agents.
  </Card>

  <Card title="Reasoning" icon="brain-circuit" iconType="duotone" href="/reasoning">
    Make Agents "think" and "analyze".
  </Card>

  <Card title="Knowledge" icon="server" iconType="duotone" href="/knowledge">
    Give Agents domain-specific knowledge.
  </Card>

  <Card title="Vector Databases" icon="spider-web" iconType="duotone" href="/vectordb">
    Store and search your knowledge base.
  </Card>

  <Card title="Storage" icon="database" iconType="duotone" href="/storage">
    Persist Agent session and state in a database.
  </Card>

  <Card title="Memory" icon="lightbulb" iconType="duotone" href="/agents/memory">
    Remember user details and session summaries.
  </Card>

  <Card title="Embeddings" icon="network-wired" iconType="duotone" href="/embedder">
    Generate embeddings for your knowledge base.
  </Card>

  <Card title="Workflows" icon="diagram-project" iconType="duotone" href="/workflows">
    Deterministic, stateful, multi-agent workflows.
  </Card>

  <Card title="Evals" icon="shield" iconType="duotone" href="/evals">
    Evaluate, monitor and improve your Agents.
  </Card>
</CardGroup>



# What are Agents?

> **Agents are AI programs that operate autonomously.**

Traditional software follows a pre-programmed sequence of steps. Agents dynamically determine their course of action using a machine learning **model**, its core components are:

* **Model:** controls the flow of execution. It decides whether to reason, act or respond.
* **Tools:** enable an Agent to take actions and interact with external systems.
* **Instructions:** are how we program the Agent, teaching it how to use tools and respond.

Agents also have **memory**, **knowledge**, **storage** and the ability to **reason**:

* **Reasoning:** enables Agents to "think" before responding and "analyze" the results of their actions (i.e. tool calls), this improves reliability and quality of responses.
* **Knowledge:** is domain-specific information that the Agent can **search at runtime** to make better decisions and provide accurate responses (RAG). Knowledge is stored in a vector database and this **search at runtime** pattern is known as Agentic RAG/Agentic Search.
* **Storage:** is used by Agents to save session history and state in a database. Model APIs are stateless and storage enables us to continue conversations from where they left off. This makes Agents stateful, enabling multi-turn, long-term conversations.
* **Memory:** gives Agents the ability to store and recall information from previous interactions, allowing them to learn user preferences and personalize their responses.

<Check>Let's build a few Agents to see how they work.</Check>

## Level 1: Agents with tools and instructions

The simplest Agent has a model, a tool and instructions. Let's build an Agent that can fetch data using the `yfinance` library, along with instructions to display the results in a table.

```python level_1_agent.py
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.tools.yfinance import YFinanceTools

agent = Agent(
    model=Claude(id="claude-sonnet-4-20250514"),
    tools=[YFinanceTools(stock_price=True)],
    instructions="Use tables to display data. Don't include any other text.",
    markdown=True,
)
agent.print_response("What is the stock price of Apple?", stream=True)
```

Create a virtual environment, install dependencies, export your API key and run the Agent.

<Steps>
  <Step title="Setup your virtual environment">
    <CodeGroup>
      ```bash Mac
      uv venv --python 3.12
      source .venv/bin/activate
      ```

      ```bash Windows
      uv venv --python 3.12
      .venv/Scripts/activate
      ```
    </CodeGroup>
  </Step>

  <Step title="Install dependencies">
    <CodeGroup>
      ```bash Mac
      uv pip install -U agno anthropic yfinance
      ```

      ```bash Windows
      uv pip install -U agno anthropic yfinance
      ```
    </CodeGroup>
  </Step>

  <Step title="Export your Anthropic key">
    <CodeGroup>
      ```bash Mac
      export ANTHROPIC_API_KEY=sk-***
      ```

      ```bash Windows
      setx ANTHROPIC_API_KEY sk-***
      ```
    </CodeGroup>
  </Step>

  <Step title="Run the agent">
    ```shell
    python agent_with_tools.py
    ```
  </Step>
</Steps>

<Note>
  Set `debug_mode=True` or `export AGNO_DEBUG=true` to see the system prompt and user messages.
</Note>

## Level 2: Agents with knowledge and storage

**Knowledge:** While models have a large amount of training data, we almost always need to give them domain-specific information to make better decisions and provide accurate responses (RAG). We store this information in a vector database and let the Agent **search** it at runtime.

**Storage:** Model APIs are stateless and `Storage` drivers save chat history and state to a database. When the Agent runs, it reads the chat history and state from the database and add it to the messages list, resuming the conversation and making the Agent stateful.

In this example, we'll use:

* `UrlKnowledge` to load Agno documentation to LanceDB, using OpenAI for embeddings.
* `SqliteStorage` to save the Agent's session history and state in a database.

```python level_2_agent.py
from agno.agent import Agent
from agno.embedder.openai import OpenAIEmbedder
from agno.knowledge.url import UrlKnowledge
from agno.models.anthropic import Claude
from agno.storage.sqlite import SqliteStorage
from agno.vectordb.lancedb import LanceDb, SearchType

# Load Agno documentation in a knowledge base
# You can also use `https://docs.agno.com/llms-full.txt` for the full documentation
knowledge = UrlKnowledge(
    urls=["https://docs.agno.com/introduction.md"],
    vector_db=LanceDb(
        uri="tmp/lancedb",
        table_name="agno_docs",
        search_type=SearchType.hybrid,
        # Use OpenAI for embeddings
        embedder=OpenAIEmbedder(id="text-embedding-3-small", dimensions=1536),
    ),
)

# Store agent sessions in a SQLite database
storage = SqliteStorage(table_name="agent_sessions", db_file="tmp/agent.db")

agent = Agent(
    name="Agno Assist",
    model=Claude(id="claude-sonnet-4-20250514"),
    instructions=[
        "Search your knowledge before answering the question.",
        "Only include the output in your response. No other text.",
    ],
    knowledge=knowledge,
    storage=storage,
    add_datetime_to_instructions=True,
    # Add the chat history to the messages
    add_history_to_messages=True,
    # Number of history runs
    num_history_runs=3,
    markdown=True,
)

if __name__ == "__main__":
    # Load the knowledge base, comment out after first run
    # Set recreate to True to recreate the knowledge base if needed
    agent.knowledge.load(recreate=False)
    agent.print_response("What is Agno?", stream=True)
```

Install dependencies, export your `OPENAI_API_KEY` and run the Agent

<Steps>
  <Step title="Install new dependencies">
    <CodeGroup>
      ```bash Mac
      uv pip install -U lancedb tantivy openai sqlalchemy
      ```

      ```bash Windows
      uv pip install -U lancedb tantivy openai sqlalchemy
      ```
    </CodeGroup>
  </Step>

  <Step title="Run the agent">
    ```shell
    python level_2_agent.py
    ```
  </Step>
</Steps>

## Level 3: Agents with memory and reasoning

* **Reasoning:** enables Agents to **"think" & "analyze"**, improving reliability and quality. `ReasoningTools` is one of the best approaches to improve an Agent's response quality.
* **Memory:** enables Agents to classify, store and recall user preferences, personalizing their responses. Memory helps the Agent build personas and learn from previous interactions.

```python level_3_agent.py
from agno.agent import Agent
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory
from agno.models.anthropic import Claude
from agno.tools.reasoning import ReasoningTools
from agno.tools.yfinance import YFinanceTools

memory = Memory(
    # Use any model for creating and managing memories
    model=Claude(id="claude-sonnet-4-20250514"),
    # Store memories in a SQLite database
    db=SqliteMemoryDb(table_name="user_memories", db_file="tmp/agent.db"),
    # We disable deletion by default, enable it if needed
    delete_memories=True,
    clear_memories=True,
)

agent = Agent(
    model=Claude(id="claude-sonnet-4-20250514"),
    tools=[
        ReasoningTools(add_instructions=True),
        YFinanceTools(stock_price=True, analyst_recommendations=True, company_info=True, company_news=True),
    ],
    # User ID for storing memories, `default` if not provided
    user_id="ava",
    instructions=[
        "Use tables to display data.",
        "Include sources in your response.",
        "Only include the report in your response. No other text.",
    ],
    memory=memory,
    # Let the Agent manage its memories
    enable_agentic_memory=True,
    markdown=True,
)

if __name__ == "__main__":
    # This will create a memory that "ava's" favorite stocks are NVIDIA and TSLA
    agent.print_response(
        "My favorite stocks are NVIDIA and TSLA",
        stream=True,
        show_full_reasoning=True,
        stream_intermediate_steps=True,
    )
    # This will use the memory to answer the question
    agent.print_response(
        "Can you compare my favorite stocks?",
        stream=True,
        show_full_reasoning=True,
        stream_intermediate_steps=True,
    )
```

Run the Agent

```shell
python level_3_agent.py
```

<Tip>You can use the `Memory` and `Reasoning` separately, you don't need to use them together.</Tip>


# Multi Agent Systems

> Teams of Agents working together towards a common goal.

## Level 4: Agent Teams that can reason and collaborate

Agents are the atomic unit of work, and work best when they have a narrow scope and a small number of tools. When the number of tools grows beyond what the model can handle or you need to handle multiple concepts, use a team of agents to spread the load.

Agno provides an industry leading multi-agent architecture that allows you to build Agent Teams that can reason, collaborate and coordinate. In this example, we'll build a team of 2 agents to analyze the semiconductor market performance, reasoning step by step.

```python level_4_team.py
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.models.openai import OpenAIChat
from agno.team.team import Team
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.reasoning import ReasoningTools
from agno.tools.yfinance import YFinanceTools

web_agent = Agent(
    name="Web Search Agent",
    role="Handle web search requests and general research",
    model=OpenAIChat(id="gpt-4.1"),
    tools=[DuckDuckGoTools()],
    instructions="Always include sources",
    add_datetime_to_instructions=True,
)

finance_agent = Agent(
    name="Finance Agent",
    role="Handle financial data requests and market analysis",
    model=OpenAIChat(id="gpt-4.1"),
    tools=[YFinanceTools(stock_price=True, stock_fundamentals=True,analyst_recommendations=True, company_info=True)],
    instructions=[
        "Use tables to display stock prices, fundamentals (P/E, Market Cap), and recommendations.",
        "Clearly state the company name and ticker symbol.",
        "Focus on delivering actionable financial insights.",
    ],
    add_datetime_to_instructions=True,
)

reasoning_finance_team = Team(
    name="Reasoning Finance Team",
    mode="coordinate",
    model=Claude(id="claude-sonnet-4-20250514"),
    members=[web_agent, finance_agent],
    tools=[ReasoningTools(add_instructions=True)],
    instructions=[
        "Collaborate to provide comprehensive financial and investment insights",
        "Consider both fundamental analysis and market sentiment",
        "Use tables and charts to display data clearly and professionally",
        "Present findings in a structured, easy-to-follow format",
        "Only output the final consolidated analysis, not individual agent responses",
    ],
    markdown=True,
    show_members_responses=True,
    enable_agentic_context=True,
    add_datetime_to_instructions=True,
    success_criteria="The team has provided a complete financial analysis with data, visualizations, risk assessment, and actionable investment recommendations supported by quantitative analysis and market research.",
)

if __name__ == "__main__":
    reasoning_finance_team.print_response("""Compare the tech sector giants (AAPL, GOOGL, MSFT) performance:
        1. Get financial data for all three companies
        2. Analyze recent news affecting the tech sector
        3. Calculate comparative metrics and correlations
        4. Recommend portfolio allocation weights""",
        stream=True,
        show_full_reasoning=True,
        stream_intermediate_steps=True,
    )
```

Install dependencies and run the Agent team

<Steps>
  <Step title="Install dependencies">
    <CodeGroup>
      ```bash Mac
      uv pip install -U agno anthropic openai duckduckgo-search yfinance
      ```

      ```bash Windows
      uv pip install -U agno anthropic openai duckduckgo-search yfinance
      ```
    </CodeGroup>
  </Step>

  <Step title="Export your API keys">
    <CodeGroup>
      ```bash Mac
      export ANTHROPIC_API_KEY=sk-***
      export OPENAI_API_KEY=sk-***
      ```

      ```bash Windows
      setx ANTHROPIC_API_KEY sk-***
      setx OPENAI_API_KEY sk-***
      ```
    </CodeGroup>
  </Step>

  <Step title="Run the agent team">
    ```shell
    python level_4_team.py
    ```
  </Step>
</Steps>

## Level 5: Agentic Workflows with state and determinism

Workflows are deterministic, stateful, multi-agent programs built for production applications. We write the workflow in pure python, giving us extreme control over the execution flow.

Having built 100s of agentic systems, **no framework or step based approach will give you the flexibility and reliability of pure-python**. Want loops - use while/for, want conditionals - use if/else, want exceptional handling - use try/except.

<Check>
  Because the workflow logic is a python function, AI code editors can vibe code workflows for you.

  Add `https://docs.agno.com` as a document source and vibe away.
</Check>

Here's a simple workflow that caches previous outputs, you control every step: what gets cached, what gets streamed, what gets logged and what gets returned.

```python level_5_workflow.py
from typing import Iterator
from agno.agent import Agent, RunResponse
from agno.models.openai import OpenAIChat
from agno.utils.log import logger
from agno.utils.pprint import pprint_run_response
from agno.workflow import Workflow


class CacheWorkflow(Workflow):
    # Add agents or teams as attributes on the workflow
    agent = Agent(model=OpenAIChat(id="gpt-4o-mini"))

    # Write the logic in the `run()` method
    def run(self, message: str) -> Iterator[RunResponse]:
        logger.info(f"Checking cache for '{message}'")
        # Check if the output is already cached
        if self.session_state.get(message):
            logger.info(f"Cache hit for '{message}'")
            yield RunResponse(
                run_id=self.run_id, content=self.session_state.get(message)
            )
            return

        logger.info(f"Cache miss for '{message}'")
        # Run the agent and yield the response
        yield from self.agent.run(message, stream=True)

        # Cache the output after response is yielded
        self.session_state[message] = self.agent.run_response.content


if __name__ == "__main__":
    workflow = CacheWorkflow()
    # Run workflow (this is takes ~1s)
    response: Iterator[RunResponse] = workflow.run(message="Tell me a joke.")
    # Print the response
    pprint_run_response(response, markdown=True, show_time=True)
    # Run workflow again (this is immediate because of caching)
    response: Iterator[RunResponse] = workflow.run(message="Tell me a joke.")
    # Print the response
    pprint_run_response(response, markdown=True, show_time=True)
```

Run the workflow

```shell
python level_5_workflow.py
```

## Next

* Checkout the [Agent Playground](/introduction/playground) to interact with your Agents, Teams and Workflows.
* Learn how to [Monitor](/introduction/monitoring) your Agents, Teams and Workflows.
* Get help from the [Community](/introduction/community).


# Playground

> **Agno provides an intuitive interface for testing and interacting with your AI agents.**

<Frame caption="Agno Platform - Playground">
  <img height="200" src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/playground.png" style={{ borderRadius: '8px' }} />
</Frame>

The Playground gives a robust interface to test your agentic systems with extensive features.

* **Streaming Support**: Real-time response streaming and intermediate states back to the user.

* **Session History**: Visualize conversation history right in the playground.

* **User Memory**: Visualize user details and preferences across conversations.

* **Configuration**: Comprehensive configuration interface allowing you to see agent parameters, model settings, tool configurations.

* **Reasoning Support**: Built-in support for detailed reasoning traces displayed in the playground interface.

* **Human in Loop Support**: Enable manual intervention in agent workflows with specialized human oversight and approval.

* **Multimodal Support**: Support for processing and generating text, images, audio, and other media types.

* **Multi-Agent Systems**: Support for multi-agent teams and workflows.

## Interact with your agents Locally

<Steps>
  <Step title="Create a file with sample code">
    ```python playground.py
    from agno.agent import Agent
    from agno.models.openai import OpenAIChat
    from agno.playground import Playground
    from agno.storage.sqlite import SqliteStorage
    from agno.tools.duckduckgo import DuckDuckGoTools
    from agno.tools.yfinance import YFinanceTools

    agent_storage: str = "tmp/agents.db"

    web_agent = Agent(
        name="Web Agent",
        model=OpenAIChat(id="gpt-4o"),
        tools=[DuckDuckGoTools()],
        instructions=["Always include sources"],
        # Store the agent sessions in a sqlite database
        storage=SqliteStorage(table_name="web_agent", db_file=agent_storage),
        # Adds the current date and time to the instructions
        add_datetime_to_instructions=True,
        # Adds the history of the conversation to the messages
        add_history_to_messages=True,
        # Number of history responses to add to the messages
        num_history_responses=5,
        # Adds markdown formatting to the messages
        markdown=True,
    )

    finance_agent = Agent(
        name="Finance Agent",
        model=OpenAIChat(id="gpt-4o"),
        tools=[YFinanceTools(stock_price=True, analyst_recommendations=True, company_info=True, company_news=True)],
        instructions=["Always use tables to display data"],
        storage=SqliteStorage(table_name="finance_agent", db_file=agent_storage),
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        markdown=True,
    )

    playground_app = Playground(agents=[web_agent, finance_agent])
    app = playground_app.get_app()

    if __name__ == "__main__":
        playground_app.serve("playground:app", reload=True)
    ```

    Remember to export your `OPENAI_API_KEY` before running the playground application.

    <Tip>Make sure the `serve()` points to the file that contains your `Playground` app.</Tip>
  </Step>

  <Step title="Authenticate with Agno">
    Authenticate with [agno.com](https://app.agno.com) so your local application can let agno know which port you are running the playground on.

    Check out [Authentication guide](how-to/authentication) for instructions on how to Authenticate with Agno.

    <Note>
      No data is sent to agno.com, all agent data is stored locally in your sqlite database.
    </Note>
  </Step>

  <Step title="Run the Playground Server">
    Install dependencies and run your playground server:

    ```shell
    pip install openai duckduckgo-search yfinance sqlalchemy 'fastapi[standard]' agno

    python playground.py
    ```
  </Step>

  <Step title="View the Playground">
    * Open the link provided or navigate to `http://app.agno.com/playground` (login required).
    * Add/Select the `localhost:7777` endpoint and start chatting with your agents!

    <video autoPlay muted controls className="w-full aspect-video" src="https://mintlify.s3.us-west-1.amazonaws.com/agno/videos/playground.mp4" />
  </Step>
</Steps>

<Accordion title="Looking for a self-hosted alternative?">
  Looking for a self-hosted alternative? Check out our [Open Source Agent UI](https://github.com/agno-agi/agent-ui) - A modern Agent interface built with Next.js and TypeScript that works exactly like the Agent Playground.

  <img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/agent-ui.png" style={{ borderRadius: '10px', width: '100%', maxWidth: '800px' }} alt="agent-ui" />

  ### Get Started with Agent UI

  ```bash
  # Create a new Agent UI project
  npx create-agent-ui@latest

  # Or clone and run manually
  git clone https://github.com/agno-agi/agent-ui.git
  cd agent-ui && pnpm install && pnpm dev
  ```

  The UI will connect to `localhost:7777` by default, matching the Playground setup above. Visit [GitHub](https://github.com/agno-agi/agent-ui) for more details.
</Accordion>

<Info>Facing connection issues? Check out our [troubleshooting guide](/faq/playground-connection)</Info>


# Monitoring & Debugging

> Monitor your Agents, Teams and Workflows in real-time.

# Monitoring

You can track your Agent in real-time on [app.agno.com](https://app.agno.com).

## Authenticate

Authenticate with [agno.com](https://app.agno.com) to start monitoring your sessions.
Check out [Authentication guide](how-to/authentication) for instructions on how to Authenticate with Agno.

## Enable Monitoring

Enable monitoring for a single agent or globally for all agents by setting `AGNO_MONITOR=true`.

### For a Specific Agent

```python
agent = Agent(markdown=True, monitoring=True)
```

### Globally for all Agents

```bash
export AGNO_MONITOR=true
```

## Monitor Your Agents

Run your agent and view the sessions on the [sessions page](https://app.agno.com/sessions).

<Steps>
  <Step title="Create a file with sample code">
    ```python monitoring.py
    from agno.agent import Agent

    agent = Agent(markdown=True, monitoring=True)
    agent.print_response("Share a 2 sentence horror story")
    ```
  </Step>

  <Step title="Run your Agent">
    ```shell
    python monitoring.py
    ```
  </Step>

  <Step title="View your sessions">
    View your sessions at [app.agno.com/sessions](https://app.agno.com/sessions)

    <img height="200" src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/monitoring.png" style={{ borderRadius: "8px" }} />
  </Step>
</Steps>

<Info>Facing issues? Check out our [troubleshooting guide](/faq/cli-auth)</Info>

## Debug Logs

Want to see the system prompt, user messages and tool calls?

Agno includes a built-in debugger that will print debug logs in the terminal. Set `debug_mode=True` on any agent or set `AGNO_DEBUG=true` in your environment.

```python debug_logs.py
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.tools.yfinance import YFinanceTools

agent = Agent(
    model=Claude(id="claude-sonnet-4-20250514"),
    tools=[YFinanceTools(stock_price=True)],
    instructions="Use tables to display data. Don't include any other text.",
    markdown=True,
    debug_mode=True,
)
agent.print_response("What is the stock price of Apple?", stream=True)
```

Run the agent to view debug logs in the terminal:

```shell
python debug_logs.py
```

<video autoPlay muted controls className="w-full aspect-video" style={{ borderRadius: '8px' }} src="https://mintlify.s3.us-west-1.amazonaws.com/agno/videos/debug_logs.mp4" />


# What are Agents?

> Learn about Agno Agents and how they work.

**Agents** are AI programs that operate autonomously. Traditional software follows a pre-programmed sequence of steps. Agents dynamically determine their course of action using a machine learning **model**.

The core of an Agent is the **model**, **tools** and **instructions**:

* **Model:** controls the flow of execution. It decides whether to reason, act or respond.
* **Tools:** enable an Agent to take actions and interact with external systems.
* **Instructions:** are how we program the Agent, teaching it how to use tools and respond.

Agents also have **memory**, **knowledge**, **storage** and the ability to **reason**:

* **Reasoning:** enables Agents to "think" before responding and "analyze" the results of their actions (i.e. tool calls), this improves reliability and quality of responses.
* **Knowledge:** is domain-specific information that the Agent can **search at runtime** to make better decisions and provide accurate responses (RAG). Knowledge is stored in a vector database and this **search at runtime** pattern is known as Agentic RAG/Agentic Search.
* **Storage:** is used by Agents to save session history and state in a database. Model APIs are stateless and storage enables us to continue conversations from where they left off. This makes Agents stateful, enabling multi-turn, long-term conversations.
* **Memory:** gives Agents the ability to store and recall information from previous interactions, allowing them to learn user preferences and personalize their responses.

<img height="200" src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/agent.png" style={{ borderRadius: "8px" }} />

<Check>
  If this is your first time building agents, [follow these examples](/introduction/agents#basic-agent) before diving into advanced concepts.
</Check>

## Example: Research Agent

Let's build a research agent using Exa to showcase how to guide the Agent to produce the report in a specific format. In advanced cases, we should use [Structured Outputs](/agents/structured-output) instead.

<Note>
  The description and instructions are converted to the system message and the
  input is passed as the user message. Set `debug_mode=True` to view logs behind
  the scenes.
</Note>

<Steps>
  <Step title="Create Research Agent">
    Create a file `research_agent.py`

    ```python research_agent.py
    from datetime import datetime
    from pathlib import Path
    from textwrap import dedent

    from agno.agent import Agent
    from agno.models.openai import OpenAIChat
    from agno.tools.exa import ExaTools

    today = datetime.now().strftime("%Y-%m-%d")

    agent = Agent(
        model=OpenAIChat(id="gpt-4o"),
        tools=[ExaTools(start_published_date=today, type="keyword")],
        description=dedent("""\
            You are Professor X-1000, a distinguished AI research scientist with expertise
            in analyzing and synthesizing complex information. Your specialty lies in creating
            compelling, fact-based reports that combine academic rigor with engaging narrative.

            Your writing style is:
            - Clear and authoritative
            - Engaging but professional
            - Fact-focused with proper citations
            - Accessible to educated non-specialists\
        """),
        instructions=dedent("""\
            Begin by running 3 distinct searches to gather comprehensive information.
            Analyze and cross-reference sources for accuracy and relevance.
            Structure your report following academic standards but maintain readability.
            Include only verifiable facts with proper citations.
            Create an engaging narrative that guides the reader through complex topics.
            End with actionable takeaways and future implications.\
        """),
        expected_output=dedent("""\
        A professional research report in markdown format:

        # {Compelling Title That Captures the Topic's Essence}

        ## Executive Summary
        {Brief overview of key findings and significance}

        ## Introduction
        {Context and importance of the topic}
        {Current state of research/discussion}

        ## Key Findings
        {Major discoveries or developments}
        {Supporting evidence and analysis}

        ## Implications
        {Impact on field/society}
        {Future directions}

        ## Key Takeaways
        - {Bullet point 1}
        - {Bullet point 2}
        - {Bullet point 3}

        ## References
        - [Source 1](link) - Key finding/quote
        - [Source 2](link) - Key finding/quote
        - [Source 3](link) - Key finding/quote

        ---
        Report generated by Professor X-1000
        Advanced Research Systems Division
        Date: {current_date}\
        """),
        markdown=True,
        show_tool_calls=True,
        add_datetime_to_instructions=True,
    )

    # Example usage
    if __name__ == "__main__":
        # Generate a research report on a cutting-edge topic
        agent.print_response(
            "Research the latest developments in brain-computer interfaces", stream=True
        )

    # More example prompts to try:
    """
    Try these research topics:
    1. "Analyze the current state of solid-state batteries"
    2. "Research recent breakthroughs in CRISPR gene editing"
    3. "Investigate the development of autonomous vehicles"
    4. "Explore advances in quantum machine learning"
    5. "Study the impact of artificial intelligence on healthcare"
    """
    ```
  </Step>

  <Step title="Run the agent">
    Install libraries

    ```shell
    pip install openai exa-py agno
    ```

    Run the agent

    ```shell
    python research_agent.py
    ```
  </Step>
</Steps>
