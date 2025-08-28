# What are Teams?

> Build autonomous multi-agent systems with Agno Teams.

A Team is a collection of Agents (or other sub-teams) that work together to accomplish tasks. Teams can either **"coordinate"**, **"collaborate"** or **"route"** to solve a task.

A `Team` has a list of `members` that can be instances of `Agent` or `Team`.

```python
from agno.team import Team
from agno.agent import Agent

team = Team(members=[
    Agent(name="Agent 1", role="You answer questions in English"),
    Agent(name="Agent 2", role="You answer questions in Chinese"),
    Team(name="Team 1", role="You answer questions in French"),
])
```

The team will transfer tasks to the members depending on the `mode` of the team.

<Note>
  It is recommended to specify the `name` and the `role` fields of the team member, for better identification by the team leader.
</Note>

## Modes

### Route Mode

In [**Route Mode**](/teams/route), the team leader routes the user's request to the most appropriate team member based on the content of the request. The member's response is returned directly to the user and the team leader doesn't interpret/transform the response.

<Note>
  In `async` execution, if more than once member is transferred to at once by the team leader, these members are executed concurrently.
</Note>

### Coordinate Mode

In [**Coordinate Mode**](/teams/coordinate), the team leader delegates tasks to team members and synthesizes their outputs into a cohesive response. The team leader can send to multiple members at once, or one after the other depending on the request and what the model decides is most appropriate.

<Note>
  In `async` execution, if more than once member is transferred to at once by the team leader, these members are executed concurrently.
</Note>

### Collaborate Mode

In [**Collaborate Mode**](/teams/collaborate), all team members are given the same task and the team leader synthesizes their outputs into a cohesive response.

<Note>
  In `async` execution, all the members are executed concurrently.
</Note>

## Team Memory and History

Teams can maintain memory of previous interactions, enabling contextual awareness:

```python
from agno.team import Team

team_with_memory = Team(
    name="Team with Memory",
    members=[agent1, agent2],
    add_history_to_messages=True,
    num_history_runs=5,
)

# The team will remember previous interactions
team_with_memory.print_response("What are the key challenges in quantum computing?")
team_with_memory.print_response("Elaborate on the second challenge you mentioned")
```

The team can also manage user memories:

```python
from agno.team import Team
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory

# Create a memory instance with persistent storage
memory_db = SqliteMemoryDb(table_name="memory", db_file="memory.db")
memory = Memory(db=memory_db)

team_with_memory = Team(
    name="Team with Memory",
    members=[agent1, agent2],
    memory=memory,
    enable_agentic_memory=True,
)

team_with_memory.print_response("Hi! My name is John Doe.")
team_with_memory.print_response("What is my name?")
```

## Team Knowledge

Teams can use a knowledge base to store and retrieve information:

```python
from pathlib import Path

from agno.agent import Agent
from agno.embedder.openai import OpenAIEmbedder
from agno.knowledge.url import UrlKnowledge
from agno.models.openai import OpenAIChat
from agno.team import Team
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.vectordb.lancedb import LanceDb, SearchType

# Setup paths
cwd = Path(__file__).parent
tmp_dir = cwd.joinpath("tmp")
tmp_dir.mkdir(parents=True, exist_ok=True)

# Initialize knowledge base
agno_docs_knowledge = UrlKnowledge(
    urls=["https://docs.agno.com/llms-full.txt"],
    vector_db=LanceDb(
        uri=str(tmp_dir.joinpath("lancedb")),
        table_name="agno_docs",
        search_type=SearchType.hybrid,
        embedder=OpenAIEmbedder(id="text-embedding-3-small"),
    ),
)

web_agent = Agent(
    name="Web Search Agent",
    role="Handle web search requests",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],
    instructions=["Always include sources"],
)

team_with_knowledge = Team(
    name="Team with Knowledge",
    members=[web_agent],
    model=OpenAIChat(id="gpt-4o"),
    knowledge=agno_docs_knowledge,
    show_members_responses=True,
    markdown=True,
)

if __name__ == "__main__":
    # Set to False after the knowledge base is loaded
    load_knowledge = True
    if load_knowledge:
        agno_docs_knowledge.load()

    team_with_knowledge.print_response("Tell me about the Agno framework", stream=True)
```

The team can also manage user memories:

```python
from agno.team import Team
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory

# Create a memory instance with persistent storage
memory_db = SqliteMemoryDb(table_name="memory", db_file="memory.db")
memory = Memory(db=memory_db)

team_with_memory = Team(
    name="Team with Memory",
    members=[agent1, agent2],
    memory=memory,
    enable_user_memories=True,
)

team_with_memory.print_response("Hi! My name is John Doe.")
team_with_memory.print_response("What is my name?")
```

## Session Summaries

To enable session summaries, set `enable_session_summaries=True` on the `Team`.

```python
from agno.team import Team
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory

team_with_session_summaries = Team(
    name="Team with Memory",
    members=[agent1, agent2],
    enable_session_summaries=True,
)

team_with_session_summaries.print_response("Hi! My name is John Doe and I live in New York City.")

session_summary = team_with_session_summaries.get_session_summary()
print("Session Summary: ", session_summary.summary)
```

## Examples

### Multi-Language Team

Let's walk through a simple example where we use different models to answer questions in different languages. The team consists of three specialized agents and the team leader routes the user's question to the appropriate language agent.

```python multilanguage_team.py
from agno.agent import Agent
from agno.models.deepseek import DeepSeek
from agno.models.mistral.mistral import MistralChat
from agno.models.openai import OpenAIChat
from agno.team.team import Team

english_agent = Agent(
    name="English Agent",
    role="You only answer in English",
    model=OpenAIChat(id="gpt-4o"),
)
chinese_agent = Agent(
    name="Chinese Agent",
    role="You only answer in Chinese",
    model=DeepSeek(id="deepseek-chat"),
)
french_agent = Agent(
    name="French Agent",
    role="You can only answer in French",
    model=MistralChat(id="mistral-large-latest"),
)

multi_language_team = Team(
    name="Multi Language Team",
    mode="route",
    model=OpenAIChat("gpt-4o"),
    members=[english_agent, chinese_agent, french_agent],
    show_tool_calls=True,
    markdown=True,
    description="You are a language router that directs questions to the appropriate language agent.",
    instructions=[
        "Identify the language of the user's question and direct it to the appropriate language agent.",
        "If the user asks in a language whose agent is not a team member, respond in English with:",
        "'I can only answer in the following languages: English, Chinese, French. Please ask your question in one of these languages.'",
        "Always check the language of the user's input before routing to an agent.",
        "For unsupported languages like Italian, respond in English with the above message.",
    ],
    show_members_responses=True,
)


if __name__ == "__main__":
    # Ask "How are you?" in all supported languages
    multi_language_team.print_response("Comment allez-vous?", stream=True)  # French
    multi_language_team.print_response("How are you?", stream=True)  # English
    multi_language_team.print_response("你好吗？", stream=True)  # Chinese
    multi_language_team.print_response("Come stai?", stream=True)  # Italian
```

### Content Team

Let's walk through another example where we use two specialized agents to write a blog post. The team leader coordinates the agents to write a blog post.

```python content_team.py
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.team import Team
from agno.tools.duckduckgo import DuckDuckGoTools

# Create individual specialized agents
researcher = Agent(
    name="Researcher",
    role="Expert at finding information",
    tools=[DuckDuckGoTools()],
    model=OpenAIChat("gpt-4o"),
)

writer = Agent(
    name="Writer",
    role="Expert at writing clear, engaging content",
    model=OpenAIChat("gpt-4o"),
)

# Create a team with these agents
content_team = Team(
    name="Content Team",
    mode="coordinate",
    members=[researcher, writer],
    instructions="You are a team of researchers and writers that work together to create high-quality content.",
    model=OpenAIChat("gpt-4o"),
    markdown=True,
)

# Run the team with a task
content_team.print_response("Create a short article about quantum computing")
```

### Research Team

Here's an example of a research team that combines multiple specialized agents:

<Steps>
  <Step title="Create HackerNews Team">
    Create a file `hackernews_team.py`

    ```python hackernews_team.py
    from typing import List

    from agno.agent import Agent
    from agno.models.openai import OpenAIChat
    from agno.team import Team
    from agno.tools.duckduckgo import DuckDuckGoTools
    from agno.tools.hackernews import HackerNewsTools
    from agno.tools.newspaper4k import Newspaper4kTools
    from pydantic import BaseModel

    class Article(BaseModel):
        title: str
        summary: str
        reference_links: List[str]


    hn_researcher = Agent(
        name="HackerNews Researcher",
        model=OpenAIChat("gpt-4o"),
        role="Gets top stories from hackernews.",
        tools=[HackerNewsTools()],
    )

    web_searcher = Agent(
        name="Web Searcher",
        model=OpenAIChat("gpt-4o"),
        role="Searches the web for information on a topic",
        tools=[DuckDuckGoTools()],
        add_datetime_to_instructions=True,
    )

    article_reader = Agent(
        name="Article Reader",
        role="Reads articles from URLs.",
        tools=[Newspaper4kTools()],
    )

    hackernews_team = Team(
        name="HackerNews Team",
        mode="coordinate",
        model=OpenAIChat("gpt-4o"),
        members=[hn_researcher, web_searcher, article_reader],
        instructions=[
            "First, search hackernews for what the user is asking about.",
            "Then, ask the article reader to read the links for the stories to get more information.",
            "Important: you must provide the article reader with the links to read.",
            "Then, ask the web searcher to search for each story to get more information.",
            "Finally, provide a thoughtful and engaging summary.",
        ],
        response_model=Article,
        show_tool_calls=True,
        markdown=True,
        debug_mode=True,
        show_members_responses=True,
    )

    # Run the team
    report = hackernews_team.run(
        "What are the top stories on hackernews?"
    ).content

    print(f"Title: {report.title}")
    print(f"Summary: {report.summary}")
    print(f"Reference Links: {report.reference_links}")
    ```
  </Step>

  <Step title="Run the team">
    Install libraries

    ```shell
    pip install openai duckduckgo-search newspaper4k lxml_html_clean agno
    ```

    Run the team

    ```shell
    python hackernews_team.py
    ```
  </Step>
</Steps>

## Developer Resources

* View [Usecases](/examples/teams/)
* View [Examples](/examples/concepts/storage/team_storage)
* View [Cookbook](https://github.com/agno-agi/agno/tree/main/cookbook/examples/teams)


# Running your Team

> Learn how to run a team and get the response.

The `Team.run()` function runs the team and generates a response, either as a `TeamRunResponse` object or a stream of `TeamRunResponseEvent` objects.

Many of our examples use `team.print_response()` which is a helper utility to print the response in the terminal. It uses `team.run()` under the hood.

Here's how to run your team. The response is captured in the `response` and `response_stream` variables.

```python
from agno.team import Team
from agno.models.openai import OpenAIChat

agent_1 = Agent(name="News Agent", role="Get the latest news")

agent_2 = Agent(name="Weather Agent", role="Get the weather for the next 7 days")

team = Team(name="News and Weather Team", mode="coordinate", members=[agent_1, agent_2])

response = team.run("What is the weather in Tokyo?")

# Synchronous execution
result = team.run("What is the weather in Tokyo?")

# Asynchronous execution
result = await team.arun("What is the weather in Tokyo?")

# Streaming responses
for chunk in team.run("What is the weather in Tokyo?", stream=True):
    print(chunk.content, end="", flush=True)

# Asynchronous streaming
async for chunk in await team.arun("What is the weather in Tokyo?", stream=True):
    print(chunk.content, end="", flush=True)
```

## Streaming Intermediate Steps

Throughout the execution of a team, multiple events take place, and we provide these events in real-time for enhanced team transparency.

You can enable streaming of intermediate steps by setting `stream_intermediate_steps=True`.

```python
# Stream with intermediate steps
response_stream = team.run(
    "What is the weather in Tokyo?",
    stream=True,
    stream_intermediate_steps=True
)
```

### Handling Events

You can process events as they arrive by iterating over the response stream:

```python
response_stream = team.run("Your prompt", stream=True, stream_intermediate_steps=True)

for event in response_stream:
    if event.event == "TeamRunResponseContent":
        print(f"Content: {event.content}")
    elif event.event == "TeamToolCallStarted":
        print(f"Tool call started: {event.tool}")
    elif event.event == "ToolCallStarted":
        print(f"Member tool call started: {event.tool}")
    elif event.event == "ToolCallCompleted":
        print(f"Member tool call completed: {event.tool}")
    elif event.event == "TeamReasoningStep":
        print(f"Reasoning step: {event.content}")
    ...
```

<Note>
  Team member events are yielded during team execution when a team member is being executed.  You can disable this by setting `stream_member_events=False`.
</Note>

### Storing Events

You can store all the events that happened during a run on the `RunResponse` object.

```python
from agno.team import Team
from agno.models.openai import OpenAIChat
from agno.utils.pprint import pprint_run_response

team = Team(model=OpenAIChat(id="gpt-4o-mini"), members=[], store_events=True)

response = team.run("Tell me a 5 second short story about a lion", stream=True, stream_intermediate_steps=True)
pprint_run_response(response)

for event in agent.run_response.events:
    print(event.event)
```

By default the `TeamRunResponseContentEvent` and `RunResponseContentEvent` events are not stored. You can modify which events are skipped by setting the `events_to_skip` parameter.

For example:

```python
team = Team(model=OpenAIChat(id="gpt-4o-mini"), members=[], store_events=True, events_to_skip=[TeamRunEvent.run_started.value])
```

### Event Types

The following events are sent by the `Team.run()` and `Team.arun()` functions depending on team's configuration:

#### Core Events

| Event Type               | Description                                             |
| ------------------------ | ------------------------------------------------------- |
| `TeamRunStarted`         | Indicates the start of a run                            |
| `TeamRunResponseContent` | Contains the model's response text as individual chunks |
| `TeamRunCompleted`       | Signals successful completion of the run                |
| `TeamRunError`           | Indicates an error occurred during the run              |
| `TeamRunCancelled`       | Signals that the run was cancelled                      |

#### Tool Events

| Event Type              | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `TeamToolCallStarted`   | Indicates the start of a tool call                             |
| `TeamToolCallCompleted` | Signals completion of a tool call, including tool call results |

#### Reasoning Events

| Event Type               | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `TeamReasoningStarted`   | Indicates the start of the agent's reasoning process |
| `TeamReasoningStep`      | Contains a single step in the reasoning process      |
| `TeamReasoningCompleted` | Signals completion of the reasoning process          |

#### Memory Events

| Event Type                  | Description                                     |
| --------------------------- | ----------------------------------------------- |
| `TeamMemoryUpdateStarted`   | Indicates that the agent is updating its memory |
| `TeamMemoryUpdateCompleted` | Signals completion of a memory update           |

See detailed documentation in the [TeamRunResponse](/reference/teams/team-response) documentation.


# Team State

> Learn about the shared state of Agent Teams.

There are multiple ways to share state between team members.

## Shared Team State

Team Session State enables sophisticated state management across teams of agents, with both shared and private state capabilities.

Teams often need to coordinate on shared information (like a shopping list) while maintaining their own private metrics or configuration. Agno provides an elegant three-tier state system for this.

Agno's Team state management provides three distinct levels:

* Team's team\_session\_state - Shared state accessible by all team members.
* Team's session\_state - Private state only accessible by the team leader
* Agent's session\_state - Private state for each agent members

<Check>
  Team state propagates through nested team structures as well
</Check>

### How to use Team Session State

You can set the `team_session_state` parameter on `Team` to share state between team members.
This state is available to all team members and is synchronized between them.

For example:

```python
team = Team(
    members=[agent1, agent2, agent3],
    team_session_state={"shopping_list": []},
)
```

Members can access the shared state using the `team_session_state` attribute in tools.

For example:

```python
def add_item(agent: Agent, item: str) -> str:
    """Add an item to the shopping list and return confirmation.

    Args:
        item (str): The item to add to the shopping list.
    """
    # Add the item if it's not already in the list
    if item.lower() not in [
        i.lower() for i in agent.team_session_state["shopping_list"]
    ]:
        agent.team_session_state["shopping_list"].append(item)
        return f"Added '{item}' to the shopping list"
    else:
        return f"'{item}' is already in the shopping list"
```

### Example

Here's a simple example of a team managing a shared shopping list:

```python team_session_state.py
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.team import Team


# Define tools that work with shared team state
def add_item(agent: Agent, item: str) -> str:
    """Add an item to the shopping list."""
    if item.lower() not in [
        i.lower() for i in agent.team_session_state["shopping_list"]
    ]:
        agent.team_session_state["shopping_list"].append(item)
        return f"Added '{item}' to the shopping list"
    else:
        return f"'{item}' is already in the shopping list"


def remove_item(agent: Agent, item: str) -> str:
    """Remove an item from the shopping list."""
    for i, list_item in enumerate(agent.team_session_state["shopping_list"]):
        if list_item.lower() == item.lower():
            agent.team_session_state["shopping_list"].pop(i)
            return f"Removed '{list_item}' from the shopping list"
    
    return f"'{item}' was not found in the shopping list"


# Create an agent that manages the shopping list
shopping_agent = Agent(
    name="Shopping List Agent",
    role="Manage the shopping list",
    model=OpenAIChat(id="gpt-4o-mini"),
    tools=[add_item, remove_item],
)


# Define team-level tools
def list_items(team: Team) -> str:
    """List all items in the shopping list."""
    # Access shared state (not private state)
    shopping_list = team.team_session_state["shopping_list"]
    
    if not shopping_list:
        return "The shopping list is empty."
    
    items_text = "\n".join([f"- {item}" for item in shopping_list])
    return f"Current shopping list:\n{items_text}"


def add_chore(team: Team, chore: str) -> str:
    """Add a completed chore to the team's private log."""
    # Access team's private state
    if "chores" not in team.session_state:
        team.session_state["chores"] = []
    
    team.session_state["chores"].append(chore)
    return f"Logged chore: {chore}"


# Create a team with both shared and private state
shopping_team = Team(
    name="Shopping Team",
    mode="coordinate",
    model=OpenAIChat(id="gpt-4o-mini"),
    members=[shopping_agent],
    # Shared state - accessible by all members
    team_session_state={"shopping_list": []},
    # Team's private state - only accessible by team
    session_state={"chores": []},
    tools=[list_items, add_chore],
    instructions=[
        "You manage a shopping list.",
        "Forward add/remove requests to the Shopping List Agent.",
        "Use list_items to show the current list.",
        "Log completed tasks using add_chore.",
    ],
    show_tool_calls=True,
)

# Example usage
shopping_team.print_response("Add milk, eggs, and bread", stream=True)
print(f"Shared state: {shopping_team.team_session_state}")

shopping_team.print_response("What's on my list?", stream=True)

shopping_team.print_response("I got the eggs", stream=True)
print(f"Shared state: {shopping_team.team_session_state}")
print(f"Team private state: {shopping_team.session_state}")
```

<Tip>
  Notice how shared tools use `agent.team_session_state`, which allows state to propagate and persist across the entire team — even for subteams within the team. This ensures consistent shared state for all members.

  In contrast, tools specific to a team use `team.session_state`, allowing for private, team-specific state. For example, a team leader's tools would maintain their own session state using team.session\_state.
</Tip>

See a full example [here](/examples/teams/shared_state/team_shared_state).

## Agentic Context

The Team Leader maintains a shared context that is updated agentically (i.e. by the team leader) and is sent to team members if needed.

Agentic Context is critical for effective information sharing and collaboration between agents and the quality of the team's responses depends on how well the team leader manages this shared agentic context.
This could require higher quality models for the team leader to ensure the quality of the team's responses.

<Note>
  The tasks and responses of team members are automatically added to the team context, but Agentic Context needs to be enabled by the developer.
</Note>

### Enable Agentic Context

To enable the Team leader to maintain Agentic Context, set `enable_agentic_context=True`.

This will allow the team leader to maintain and update the team context during the run.

```python
team = Team(
    members=[agent1, agent2, agent3],
    enable_agentic_context=True,  # Enable Team Leader to maintain Agentic Context
)
```

### Team Member Interactions

Agent Teams can share interactions between members, allowing agents to learn from each other's outputs:

```python
team = Team(
    members=[agent1, agent2, agent3],
    share_member_interactions=True,  # Share interactions
)
```


# Route

In **Route Mode**, the Team Leader directs user queries to the most appropriate team member based on the content of the request.

The Team Leader acts as a smart router, analyzing the query and selecting the best-suited agent to handle it. The member's response is then returned directly to the user.

## How Route Mode Works

In "route" mode:

1. The team receives a user query
2. A Team Leader analyzes the query to determine which team member has the right expertise
3. The query is forwarded to the selected team member
4. The response from the team member is returned directly to the user

This mode is particularly useful when you have specialized agents with distinct expertise areas and want to automatically direct queries to the right specialist.

<Steps>
  <Step title="Create Multi Language Team">
    Create a file `multi_language_team.py`

    ```python multi_language_team.py
    from agno.agent import Agent
    from agno.models.anthropic import Claude
    from agno.models.deepseek import DeepSeek
    from agno.models.mistral.mistral import MistralChat
    from agno.models.openai import OpenAIChat
    from agno.team.team import Team

    english_agent = Agent(
        name="English Agent",
        role="You can only answer in English",
        model=OpenAIChat(id="gpt-4.5-preview"),
        instructions=[
            "You must only respond in English",
        ],
    )

    japanese_agent = Agent(
        name="Japanese Agent",
        role="You can only answer in Japanese",
        model=DeepSeek(id="deepseek-chat"),
        instructions=[
            "You must only respond in Japanese",
        ],
    )
    chinese_agent = Agent(
        name="Chinese Agent",
        role="You can only answer in Chinese",
        model=DeepSeek(id="deepseek-chat"),
        instructions=[
            "You must only respond in Chinese",
        ],
    )
    spanish_agent = Agent(
        name="Spanish Agent",
        role="You can only answer in Spanish",
        model=OpenAIChat(id="gpt-4.5-preview"),
        instructions=[
            "You must only respond in Spanish",
        ],
    )

    french_agent = Agent(
        name="French Agent",
        role="You can only answer in French",
        model=MistralChat(id="mistral-large-latest"),
        instructions=[
            "You must only respond in French",
        ],
    )

    german_agent = Agent(
        name="German Agent",
        role="You can only answer in German",
        model=Claude("claude-3-5-sonnet-20241022"),
        instructions=[
            "You must only respond in German",
        ],
    )
    multi_language_team = Team(
        name="Multi Language Team",
        mode="route",
        model=OpenAIChat("gpt-4.5-preview"),
        members=[
            english_agent,
            spanish_agent,
            japanese_agent,
            french_agent,
            german_agent,
            chinese_agent,
        ],
        show_tool_calls=True,
        markdown=True,
        instructions=[
            "You are a language router that directs questions to the appropriate language agent.",
            "If the user asks in a language whose agent is not a team member, respond in English with:",
            "'I can only answer in the following languages: English, Spanish, Japanese, French and German. Please ask your question in one of these languages.'",
            "Always check the language of the user's input before routing to an agent.",
            "For unsupported languages like Italian, respond in English with the above message.",
        ],
        show_members_responses=True,
    )


    # Ask "How are you?" in all supported languages
    multi_language_team.print_response(
        "How are you?", stream=True  # English
    )

    multi_language_team.print_response(
        "你好吗？", stream=True  # Chinese
    )

    multi_language_team.print_response(
        "お元気ですか?", stream=True  # Japanese
    )

    multi_language_team.print_response(
        "Comment allez-vous?",
        stream=True,  # French
    )
    ```
  </Step>

  <Step title="Run the team">
    Install libraries

    ```shell
    pip install openai mistral agno
    ```

    Run the team

    ```shell
    python multi_language_team.py
    ```
  </Step>
</Steps>

## Structured Output with Route Mode

One powerful feature of route mode is its ability to maintain structured output from member agents.
When using a Pydantic model for the response, the response from the selected team member will be automatically parsed into the specified structure.

### Defining Structured Output Models

```python
from pydantic import BaseModel
from typing import List, Optional
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.team import Team


class StockAnalysis(BaseModel):
    symbol: str
    company_name: str
    analysis: str

class CompanyAnalysis(BaseModel):
    company_name: str
    analysis: str

stock_searcher = Agent(
    name="Stock Searcher",
    model=OpenAIChat("gpt-4o"),
    response_model=StockAnalysis,
    role="Searches for information on stocks and provides price analysis.",
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
    role="Searches for information about companies and recent news.",
    response_model=CompanyAnalysis,
    tools=[
        YFinanceTools(
            stock_price=False,
            company_info=True,
            company_news=True,
        )
    ],
)

team = Team(
    name="Stock Research Team",
    mode="route",
    model=OpenAIChat("gpt-4o"),
    members=[stock_searcher, company_info_agent],
    markdown=True,
)

# This should route to the stock_searcher
response = team.run("What is the current stock price of NVDA?")
assert isinstance(response.content, StockAnalysis)
```


# Coordinate

In **Coordinate Mode**, the Team Leader delegates tasks to team members and synthesizes their outputs into a cohesive response.

## How Coordinate Mode Works

In "coordinate" mode:

1. The team receives a user query
2. A Team Leader analyzes the query and decides how to break it down into subtasks
3. The Team Leader delegates specific tasks to appropriate team members
4. Team members complete their assigned tasks and return their results
5. The Team Leader synthesizes all outputs into a final, cohesive response

This mode is ideal for complex tasks that require multiple specialized skills, coordination, and synthesis of different outputs.

<Steps>
  <Step title="Create a coordinate mode team">
    Create a file `content_team.py`

    ```python content_team.py

    searcher = Agent(
        name="Searcher",
        role="Searches the top URLs for a topic",
        instructions=[
            "Given a topic, first generate a list of 3 search terms related to that topic.",
            "For each search term, search the web and analyze the results.Return the 10 most relevant URLs to the topic.",
            "You are writing for the New York Times, so the quality of the sources is important.",
        ],
        tools=[DuckDuckGoTools()],
        add_datetime_to_instructions=True,
    )
    writer = Agent(
        name="Writer",
        role="Writes a high-quality article",
        description=(
            "You are a senior writer for the New York Times. Given a topic and a list of URLs, "
            "your goal is to write a high-quality NYT-worthy article on the topic."
        ),
        instructions=[
            "First read all urls using `read_article`."
            "Then write a high-quality NYT-worthy article on the topic."
            "The article should be well-structured, informative, engaging and catchy.",
            "Ensure the length is at least as long as a NYT cover story -- at a minimum, 15 paragraphs.",
            "Ensure you provide a nuanced and balanced opinion, quoting facts where possible.",
            "Focus on clarity, coherence, and overall quality.",
            "Never make up facts or plagiarize. Always provide proper attribution.",
            "Remember: you are writing for the New York Times, so the quality of the article is important.",
        ],
        tools=[Newspaper4kTools()],
        add_datetime_to_instructions=True,
    )

    editor = Team(
        name="Editor",
        mode="coordinate",
        model=OpenAIChat("gpt-4o"),
        members=[searcher, writer],
        description="You are a senior NYT editor. Given a topic, your goal is to write a NYT worthy article.",
        instructions=[
            "First ask the search journalist to search for the most relevant URLs for that topic.",
            "Then ask the writer to get an engaging draft of the article.",
            "Edit, proofread, and refine the article to ensure it meets the high standards of the New York Times.",
            "The article should be extremely articulate and well written. "
            "Focus on clarity, coherence, and overall quality.",
            "Remember: you are the final gatekeeper before the article is published, so make sure the article is perfect.",
        ],
        add_datetime_to_instructions=True,
        add_member_tools_to_system_message=False,  # This can be tried to make the agent more consistently get the transfer tool call correct
        enable_agentic_context=True,  # Allow the agent to maintain a shared context and send that to members.
        share_member_interactions=True,  # Share all member responses with subsequent member requests.
        show_members_responses=True,
        markdown=True,
    )
    editor.print_response("Write an article about latest developments in AI.")
    ```
  </Step>

  <Step title="Run the team">
    Install libraries

    ```shell
    pip install openai duckduckgo-search newspaper4k lxml_html_clean
    ```

    Run the team

    ```shell
    python content_team.py
    ```
  </Step>
</Steps>

## Defining Success Criteria

You can guide the coordinator by specifying success criteria for the team:

```python
strategy_team = Team(
    members=[market_analyst, competitive_analyst, strategic_planner],
    mode="coordinate",
    name="Strategy Team",
    description="A team that develops strategic recommendations",
    success_criteria="Produce actionable strategic recommendations supported by market and competitive analysis",
)

response = strategy_team.run(
    "Develop a market entry strategy for our new AI-powered healthcare product"
)
```


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
