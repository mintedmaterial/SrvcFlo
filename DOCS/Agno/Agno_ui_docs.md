# A beautiful UI for your Agents

> A beautiful, open-source interface for interacting with AI agents

<Frame>
  <img height="200" src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/agent-ui.png" style={{ borderRadius: '8px' }} />
</Frame>

Agno provides a beautiful UI for interacting with your agents, completely open source, free to use and build on top of. It's a simple interface that allows you to chat with your agents, view their memory, knowledge, and more.

<Note>
  No data is sent to [agno.com](https://app.agno.com), all agent data is stored locally in your sqlite database.
</Note>

The Open Source Agent UI is built with Next.js and TypeScript. After the success of the [Agent Playground](/introduction/playground), the community asked for a self-hosted alternative and we delivered!

# Get Started with Agent UI

To clone the Agent UI, run the following command in your terminal:

```bash
npx create-agent-ui@latest
```

Enter `y` to create a new project, install dependencies, then run the agent-ui using:

```bash
cd agent-ui && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the Agent UI, but remember to connect to your local agents.

<Frame>
  <img height="200" src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/agent-ui-homepage.png" style={{ borderRadius: '8px' }} />
</Frame>

<br />

<Accordion title="Clone the repository manually" icon="github">
  You can also clone the repository manually

  ```bash
  git clone https://github.com/agno-agi/agent-ui.git
  ```

  And run the agent-ui using

  ```bash
  cd agent-ui && pnpm install && pnpm dev
  ```
</Accordion>

## Connect to Local Agents

The Agent UI needs to connect to a playground server, which you can run locally or on any cloud provider.

Let's start with a local playground server. Create a file `playground.py`

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

playground = Playground(agents=[web_agent, finance_agent])
app = playground.get_app()

if __name__ == "__main__":
    playground.serve("playground:app", reload=True)
```

In another terminal, run the playground server:

<Steps>
  <Step title="Setup your virtual environment">
    <CodeGroup>
      ```bash Mac
      python3 -m venv .venv
      source .venv/bin/activate
      ```

      ```bash Windows
      python3 -m venv aienv
      aienv/scripts/activate
      ```
    </CodeGroup>
  </Step>

  <Step title="Install dependencies">
    <CodeGroup>
      ```bash Mac
      pip install -U openai duckduckgo-search yfinance sqlalchemy 'fastapi[standard]' agno
      ```

      ```bash Windows
      pip install -U openai duckduckgo-search yfinance sqlalchemy 'fastapi[standard]' agno
      ```
    </CodeGroup>
  </Step>

  <Step title="Export your OpenAI key">
    <CodeGroup>
      ```bash Mac
      export OPENAI_API_KEY=sk-***
      ```

      ```bash Windows
      setx OPENAI_API_KEY sk-***
      ```
    </CodeGroup>
  </Step>

  <Step title="Run the Playground">
    ```shell
    python playground.py
    ```
  </Step>
</Steps>

<Tip>Make sure the `serve_playground_app()` points to the file containing your `Playground` app.</Tip>

## View the playground

* Open [http://localhost:3000](http://localhost:3000) to view the Agent UI
* Select the `localhost:7777` endpoint and start chatting with your agents!

<video autoPlay muted controls className="w-full aspect-video" src="https://mintlify.s3.us-west-1.amazonaws.com/agno/videos/agent-ui-demo.mp4" />


# Agentic RAG

This example application shows how to build a sophisticated RAG (Retrieval Augmented Generation) system that leverages search of a knowledge base with LLMs to provide deep insights into the data.

## The agent can:

* Process and understand documents from multiple sources (PDFs, websites, text files)
* Build a searchable knowledge base using vector embeddings
* Maintain conversation context and memory across sessions
* Provide relevant citations and sources for its responses
* Generate summaries and extract key insights
* Answer follow-up questions and clarifications

## The agent uses:

* Vector similarity search for relevant document retrieval
* Conversation memory for contextual responses
* Citation tracking for source attribution
* Dynamic knowledge base updates

<video autoPlay muted controls className="w-full aspect-video" src="https://mintlify.s3.us-west-1.amazonaws.com/agno/videos/agentic_rag.mp4" />

## Example queries to try:

* "What are the key points from this document?"
* "Can you summarize the main arguments and supporting evidence?"
* "What are the important statistics and findings?"
* "How does this relate to \[topic X]?"
* "What are the limitations or gaps in this analysis?"
* "Can you explain \[concept X] in more detail?"
* "What other sources support or contradict these claims?"

## Code

The complete code is available in the [Agno repository](https://github.com/agno-agi/agno).

## Usage

<Steps>
  <Step title="Clone the repository">
    ```bash
    git clone https://github.com/agno-agi/agno.git
    cd agno
    ```
  </Step>

  <Step title="Create virtual environment">
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```
  </Step>

  <Step title="Install dependencies">
    ```bash
    pip install -r cookbook/examples/streamlit_apps/agentic_rag/requirements.txt
    ```
  </Step>

  <Step title="Run PgVector">
    First, install [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/).

    Then run either using the helper script:

    ```bash
    ./cookbook/scripts/run_pgvector.sh
    ```

    Or directly with Docker:

    ```bash
    docker run -d \
      -e POSTGRES_DB=ai \
      -e POSTGRES_USER=ai \
      -e POSTGRES_PASSWORD=ai \
      -e PGDATA=/var/lib/postgresql/data/pgdata \
      -v pgvolume:/var/lib/postgresql/data \
      -p 5532:5432 \
      --name pgvector \
      agnohq/pgvector:16
    ```
  </Step>

  <Step title="Set up API keys">
    ```bash
    # Required
    export OPENAI_API_KEY=***
    # Optional
    export ANTHROPIC_API_KEY=***
    export GOOGLE_API_KEY=***

    ```

    We recommend using gpt-4o for optimal performance.
  </Step>

  <Step title="Launch the app">
    ```bash
    streamlit run cookbook/examples/streamlit_apps/agentic_rag/app.py
    ```

    Open [localhost:8501](http://localhost:8501) to start using the Agentic RAG.
  </Step>
</Steps>

Need help? Join our [Discourse community](https://community.agno.com) for support!


# SQL Agent

This example shows how to build a text-to-SQL system that:

1. Uses Agentic RAG to search for table metadata, sample queries and rules for writing better SQL queries.
2. Uses dynamic few-shot examples and rules to improve query construction.
3. Provides an interactive Streamlit UI for users to query the database.

We'll use the F1 dataset as an example, but you can easily extend it to other datasets.

### Key capabilities

* Natural language to SQL conversion
* Retrieve table metadata, sample queries and rules using Agentic RAG
* Better query construction with the help of dynamic few-shot examples and rules
* Interactive Streamlit UI

<video autoPlay muted controls className="w-full aspect-video" src="https://mintlify.s3.us-west-1.amazonaws.com/agno/videos/sql_agent.mp4" />

### Simple queries to try

* "Who are the top 5 drivers with the most race wins?"
* "Compare Mercedes vs Ferrari performance in constructors championships"
* "Show me the progression of fastest lap times at Monza"
* "Which drivers have won championships with multiple teams?"
* "What tracks have hosted the most races?"
* "Show me Lewis Hamilton's win percentage by season"

### Advanced queries with table joins

* "How many races did the championship winners win each year?"
* "Compare the number of race wins vs championship positions for constructors in 2019"
* "Show me Lewis Hamilton's race wins and championship positions by year"
* "Which drivers have both won races and set fastest laps at Monaco?"
* "Show me Ferrari's race wins and constructor championship positions from 2015-2020"

## Code

The complete code is available in the [Agno repository](https://github.com/agno-agi/agno).

## Usage

<Steps>
  <Step title="Clone the repository">
    ```bash
    git clone https://github.com/agno-agi/agno.git
    cd agno
    ```
  </Step>

  <Step title="Create virtual environment">
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```
  </Step>

  <Step title="Install dependencies">
    ```bash
    pip install -r cookbook/examples/streamlit_apps/sql_agent/requirements.txt
    ```
  </Step>

  <Step title="Run PgVector">
    First, install [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/).

    Then run either using the helper script:

    ```bash
    ./cookbook/scripts/run_pgvector.sh
    ```

    Or directly with Docker:

    ```bash
    docker run -d \
      -e POSTGRES_DB=ai \
      -e POSTGRES_USER=ai \
      -e POSTGRES_PASSWORD=ai \
      -e PGDATA=/var/lib/postgresql/data/pgdata \
      -v pgvolume:/var/lib/postgresql/data \
      -p 5532:5432 \
      --name pgvector \
      agnohq/pgvector:16
    ```
  </Step>

  <Step title="Load F1 data">
    ```bash
    python cookbook/examples/streamlit_apps/sql_agent/load_f1_data.py
    ```
  </Step>

  <Step title="Load knowledge base">
    The knowledge base contains table metadata, rules and sample queries that help the Agent generate better responses.

    ```bash
    python cookbook/examples/streamlit_apps/sql_agent/load_knowledge.py
    ```

    Pro tips for enhancing the knowledge base:

    * Add `table_rules` and `column_rules` to guide the Agent on query formats
    * Add sample queries to `cookbook/examples/apps/sql_agent/knowledge_base/sample_queries.sql`
  </Step>

  <Step title="Set up API keys">
    ```bash
    # Required
    export OPENAI_API_KEY=***

    # Optional
    export ANTHROPIC_API_KEY=***
    export GOOGLE_API_KEY=***
    export GROQ_API_KEY=***
    ```

    We recommend using gpt-4o for optimal performance.
  </Step>

  <Step title="Launch the app">
    ```bash
    streamlit run cookbook/examples/streamlit_apps/sql_agent/app.py
    ```

    Open [localhost:8501](http://localhost:8501) to start using the SQL Agent.
  </Step>
</Steps>

Need help? Join our [Discourse community](https://community.agno.com) for support!


# Multi-User Multi-Session Chat Concurrent

This example shows how to run a multi-user, multi-session chat concurrently. In this example, we have 3 users and 4 sessions:

* User 1 has 2 sessions.
* User 2 has 1 session.
* User 3 has 1 session.

## Code

```python cookbook/agent_concepts/memory/12_multi_user_multi_session_chat_concurrent.py
import asyncio

from agno.agent.agent import Agent
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory
from agno.models.anthropic.claude import Claude
from agno.models.google.gemini import Gemini
from agno.storage.sqlite import SqliteStorage

agent_storage = SqliteStorage(
    table_name="agent_sessions", db_file="tmp/persistent_memory.db"
)
memory_db = SqliteMemoryDb(table_name="memory", db_file="tmp/memory.db")

memory = Memory(model=Claude(id="claude-3-5-sonnet-20241022"), db=memory_db)

# Reset the memory for this example
memory.clear()

user_1_id = "user_1@example.com"
user_2_id = "user_2@example.com"
user_3_id = "user_3@example.com"

user_1_session_1_id = "user_1_session_1"
user_1_session_2_id = "user_1_session_2"
user_2_session_1_id = "user_2_session_1"
user_3_session_1_id = "user_3_session_1"

chat_agent = Agent(
    model=Gemini(id="gemini-2.0-flash-exp"),
    storage=agent_storage,
    memory=memory,
    enable_user_memories=True,
)


async def user_1_conversation():
    """Handle conversation with user 1 across multiple sessions"""
    # User 1 - Session 1
    await chat_agent.arun(
        "My name is Mark Gonzales and I like anime and video games.",
        user_id=user_1_id,
        session_id=user_1_session_1_id,
    )
    await chat_agent.arun(
        "I also enjoy reading manga and playing video games.",
        user_id=user_1_id,
        session_id=user_1_session_1_id,
    )

    # User 1 - Session 2
    await chat_agent.arun(
        "I'm going to the movies tonight.",
        user_id=user_1_id,
        session_id=user_1_session_2_id,
    )

    # Continue the conversation in session 1
    await chat_agent.arun(
        "What do you suggest I do this weekend?",
        user_id=user_1_id,
        session_id=user_1_session_1_id,
    )

    print("User 1 Done")


async def user_2_conversation():
    """Handle conversation with user 2"""
    await chat_agent.arun(
        "Hi my name is John Doe.", user_id=user_2_id, session_id=user_2_session_1_id
    )
    await chat_agent.arun(
        "I'm planning to hike this weekend.",
        user_id=user_2_id,
        session_id=user_2_session_1_id,
    )
    print("User 2 Done")


async def user_3_conversation():
    """Handle conversation with user 3"""
    await chat_agent.arun(
        "Hi my name is Jane Smith.", user_id=user_3_id, session_id=user_3_session_1_id
    )
    await chat_agent.arun(
        "I'm going to the gym tomorrow.",
        user_id=user_3_id,
        session_id=user_3_session_1_id,
    )
    print("User 3 Done")


async def run_concurrent_chat_agent():
    """Run all user conversations concurrently"""
    await asyncio.gather(
        user_1_conversation(), user_2_conversation(), user_3_conversation()
    )


if __name__ == "__main__":
    # Run all conversations concurrently
    asyncio.run(run_concurrent_chat_agent())

    user_1_memories = memory.get_user_memories(user_id=user_1_id)
    print("User 1's memories:")
    for i, m in enumerate(user_1_memories):
        print(f"{i}: {m.memory}")

    user_2_memories = memory.get_user_memories(user_id=user_2_id)
    print("User 2's memories:")
    for i, m in enumerate(user_2_memories):
        print(f"{i}: {m.memory}")

    user_3_memories = memory.get_user_memories(user_id=user_3_id)
    print("User 3's memories:")
    for i, m in enumerate(user_3_memories):
        print(f"{i}: {m.memory}")
```

## Usage

<Steps>
  <Snippet file="create-venv-step.mdx" />

  <Step title="Install libraries">
    ```bash
    pip install -U agno google-generativeai anthropic
    ```
  </Step>

  <Step title="Set your API keys">
    ```bash
    export GOOGLE_API_KEY=xxx
    ```
  </Step>

  <Step title="Run Example">
    <CodeGroup>
      ```bash Mac
      python cookbook/agent_concepts/memory/12_multi_user_multi_session_chat_concurrent.py
      ```

      ```bash Windows
      python cookbook/agent_concepts/memory/12_multi_user_multi_session_chat_concurrent.py
      ```
    </CodeGroup>
  </Step>
</Steps>


# Mongo Agent Storage

Agno supports using MongoDB as a storage backend for Agents using the `MongoDbStorage` class.

## Usage

You need to provide either `db_url` or `client`. The following example uses `db_url`.

```python mongodb_storage_for_agent.py
from agno.storage.mongodb import MongoDbStorage

db_url = "mongodb://ai:ai@localhost:27017/agno"

# Create a storage backend using the Mongo database
storage = MongoDbStorage(
    # store sessions in the agent_sessions collection
    collection_name="agent_sessions",
    db_url=db_url,
)

# Add storage to the Agent
agent = Agent(storage=storage)
```

## Params

<Snippet file="storage-mongodb-params.mdx" />

## Developer Resources

* View [Cookbook](https://github.com/agno-agi/agno/blob/main/cookbook/storage/mongodb_storage/mongodb_storage_for_agent.py)
