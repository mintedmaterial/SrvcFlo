# Prompts

We prompt Agents using `description` and `instructions` and a number of other settings. These settings are used to build the **system** message that is sent to the language model.

Understanding how these prompts are created will help you build better Agents.

The 2 key parameters are:

1. **Description**: A description that guides the overall behaviour of the agent.
2. **Instructions**: A list of precise, task-specific instructions on how to achieve its goal.

<Note>
  Description and instructions only provide a formatting benefit, we do not alter or abstract any information and you can always set the `system_message` to provide your own system prompt.
</Note>

## System message

The system message is created using `description`, `instructions` and a number of other settings. The `description` is added to the start of the system message and `instructions` are added as a list after `Instructions`. For example:

```python instructions.py
from agno.agent import Agent

agent = Agent(
    description="You are a famous short story writer asked to write for a magazine",
    instructions=["You are a pilot on a plane flying from Hawaii to Japan."],
    markdown=True,
    debug_mode=True,
)
agent.print_response("Tell me a 2 sentence horror story.", stream=True)
```

Will translate to (set `debug_mode=True` to view the logs):

```js
DEBUG    ============== system ==============
DEBUG    You are a famous short story writer asked to write for a magazine

         ## Instructions
         - You are a pilot on a plane flying from Hawaii to Japan.
         - Use markdown to format your answers.
DEBUG    ============== user ==============
DEBUG    Tell me a 2 sentence horror story.
DEBUG    ============== assistant ==============
DEBUG    As the autopilot disengaged inexplicably mid-flight over the Pacific, the pilot glanced at the copilot's seat
         only to find it empty despite his every recall of a full crew boarding. Hands trembling, he looked into the
         cockpit's rearview mirror and found his own reflection grinning back with blood-red eyes, whispering,
         "There's no escape, not at 30,000 feet."
DEBUG    **************** METRICS START ****************
DEBUG    * Time to first token:         0.4518s
DEBUG    * Time to generate response:   1.2594s
DEBUG    * Tokens per second:           63.5243 tokens/s
DEBUG    * Input tokens:                59
DEBUG    * Output tokens:               80
DEBUG    * Total tokens:                139
DEBUG    * Prompt tokens details:       {'cached_tokens': 0}
DEBUG    * Completion tokens details:   {'reasoning_tokens': 0}
DEBUG    **************** METRICS END ******************
```

## Set the system message directly

You can manually set the system message using the `system_message` parameter.

```python
from agno.agent import Agent

agent = Agent(system_message="Share a 2 sentence story about")
agent.print_response("Love in the year 12000.")
```

<Tip>
  Some models via some model providers, like `llama-3.2-11b-vision-preview` on Groq, require no system message with other messages. To remove the system message, set `create_default_system_message=False` and `system_message=None`. Additionally, if `markdown=True` is set, it will add a system message, so either remove it or explicitly disable the system message.
</Tip>

## User message

The input `message` sent to the `Agent.run()` or `Agent.print_response()` functions is used as the user message.

## Default system message

The Agent creates a default system message that can be customized using the following parameters:

| Parameter                       | Type        | Default  | Description                                                                                                                                                             |
| ------------------------------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`                   | `str`       | `None`   | A description of the Agent that is added to the start of the system message.                                                                                            |
| `goal`                          | `str`       | `None`   | Describe the task the agent should achieve.                                                                                                                             |
| `instructions`                  | `List[str]` | `None`   | List of instructions added to the system prompt in `<instructions>` tags. Default instructions are also created depending on values for `markdown`, `output_model` etc. |
| `additional_context`            | `str`       | `None`   | Additional context added to the end of the system message.                                                                                                              |
| `expected_output`               | `str`       | `None`   | Provide the expected output from the Agent. This is added to the end of the system message.                                                                             |
| `markdown`                      | `bool`      | `False`  | Add an instruction to format the output using markdown.                                                                                                                 |
| `add_datetime_to_instructions`  | `bool`      | `False`  | If True, add the current datetime to the prompt to give the agent a sense of time. This allows for relative times like "tomorrow" to be used in the prompt              |
| `system_message`                | `str`       | `None`   | System prompt: provide the system prompt as a string                                                                                                                    |
| `system_message_role`           | `str`       | `system` | Role for the system message.                                                                                                                                            |
| `create_default_system_message` | `bool`      | `True`   | If True, build a default system prompt using agent settings and use that.                                                                                               |

<Tip>
  Disable the default system message by setting `create_default_system_message=False`.
</Tip>

## Default user message

The Agent creates a default user message, which is either the input message or a message with the `context` if `enable_rag=True`. The default user message can be customized using:

| Parameter                     | Type                      | Default  | Description                                                                                                                  |
| ----------------------------- | ------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `context`                     | `str`                     | `None`   | Additional context added to the end of the user message.                                                                     |
| `add_context`                 | `bool`                    | `False`  | If True, add the context to the user prompt.                                                                                 |
| `resolve_context`             | `bool`                    | `True`   | If True, resolve the context (i.e. call any functions in the context) before adding it to the user prompt.                   |
| `add_references`              | `bool`                    | `False`  | Enable RAG by adding references from the knowledge base to the prompt.                                                       |
| `retriever`                   | `Callable`                | `None`   | Function to get references to add to the user\_message. This function, if provided, is called when `add_references` is True. |
| `references_format`           | `Literal["json", "yaml"]` | `"json"` | Format of the references.                                                                                                    |
| `add_history_to_messages`     | `bool`                    | `False`  | If true, adds the chat history to the messages sent to the Model.                                                            |
| `num_history_responses`       | `int`                     | `3`      | Number of historical responses to add to the messages.                                                                       |
| `user_message`                | `Union[List, Dict, str]`  | `None`   | Provide the user prompt as a string. Note: this will ignore the message sent to the run function.                            |
| `user_message_role`           | `str`                     | `user`   | Role for the user message.                                                                                                   |
| `create_default_user_message` | `bool`                    | `True`   | If True, build a default user prompt using references and chat history.                                                      |

<Tip>
  Disable the default user message by setting `create_default_user_message=False`.
</Tip>


# Knowledge

**Knowledge** is domain-specific information that the Agent can **search** at runtime to make better decisions (dynamic few-shot learning) and provide accurate responses (agentic RAG). Knowledge is stored in a vector db and this **searching on demand** pattern is called Agentic RAG.

<Accordion title="Dynamic Few-Shot Learning: Text2Sql Agent" icon="database">
  Example: If we're building a Text2Sql Agent, we'll need to give the table schemas, column names, data types, example queries, common "gotchas" to help it generate the best-possible SQL query.

  We're obviously not going to put this all in the system prompt, instead we store this information in a vector database and let the Agent query it at runtime.

  Using this information, the Agent can then generate the best-possible SQL query. This is called dynamic few-shot learning.
</Accordion>

**Agno Agents use Agentic RAG** by default, meaning when we provide `knowledge` to an Agent, it will search this knowledge base, at runtime, for the specific information it needs to achieve its task.

The pseudo steps for adding knowledge to an Agent are:

```python
from agno.agent import Agent, AgentKnowledge

# Create a knowledge base for the Agent
knowledge_base = AgentKnowledge(vector_db=...)

# Add information to the knowledge base
knowledge_base.load_text("The sky is blue")

# Add the knowledge base to the Agent and
# give it a tool to search the knowledge base as needed
agent = Agent(knowledge=knowledge_base, search_knowledge=True)
```

We can give our agent access to the knowledge base in the following ways:

* We can set `search_knowledge=True` to add a `search_knowledge_base()` tool to the Agent. `search_knowledge` is `True` **by default** if you add `knowledge` to an Agent.
* We can set `add_references=True` to automatically add references from the knowledge base to the Agent's prompt. This is the traditional 2023 RAG approach.

<Tip>
  If you need complete control over the knowledge base search, you can pass your own `retriever` function with the following signature:

  ```python
  def retriever(agent: Agent, query: str, num_documents: Optional[int], **kwargs) -> Optional[list[dict]]:
    ...
  ```

  This function is called during `search_knowledge_base()` and is used by the Agent to retrieve references from the knowledge base.
</Tip>

## Vector Databases

While any type of storage can act as a knowledge base, vector databases offer the best solution for retrieving relevant results from dense information quickly. Here's how vector databases are used with Agents:

<Steps>
  <Step title="Chunk the information">
    Break down the knowledge into smaller chunks to ensure our search query
    returns only relevant results.
  </Step>

  <Step title="Load the knowledge base">
    Convert the chunks into embedding vectors and store them in a vector
    database.
  </Step>

  <Step title="Search the knowledge base">
    When the user sends a message, we convert the input message into an
    embedding and "search" for nearest neighbors in the vector database.
  </Step>
</Steps>

<Note>
  Knowledge filters are currently supported on the following knowledge base types: <b>PDF</b>, <b>PDF\_URL</b>, <b>Text</b>, <b>JSON</b>, and <b>DOCX</b>.
  For more details, see the [Knowledge Filters documentation](/filters/introduction).
</Note>

## Example: RAG Agent with a PDF Knowledge Base

Let's build a **RAG Agent** that answers questions from a PDF.

### Step 1: Run PgVector

Let's use `PgVector` as our vector db as it can also provide storage for our Agents.

Install [docker desktop](https://docs.docker.com/desktop/install/mac-install/) and run **PgVector** on port **5532** using:

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

### Step 2: Traditional RAG

Retrieval Augmented Generation (RAG) means **"stuffing the prompt with relevant information"** to improve the model's response. This is a 2 step process:

1. Retrieve relevant information from the knowledge base.
2. Augment the prompt to provide context to the model.

Let's build a **traditional RAG** Agent that answers questions from a PDF of recipes.

<Steps>
  <Step title="Install libraries">
    Install the required libraries using pip

    <CodeGroup>
      ```bash Mac
      pip install -U pgvector pypdf "psycopg[binary]" sqlalchemy
      ```

      ```bash Windows
      pip install -U pgvector pypdf "psycopg[binary]" sqlalchemy
      ```
    </CodeGroup>
  </Step>

  <Step title="Create a Traditional RAG Agent">
    Create a file `traditional_rag.py` with the following contents

    ```python traditional_rag.py
    from agno.agent import Agent
    from agno.models.openai import OpenAIChat
    from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
    from agno.vectordb.pgvector import PgVector, SearchType

    db_url = "postgresql+psycopg://ai:ai@localhost:5532/ai"
    knowledge_base = PDFUrlKnowledgeBase(
        # Read PDF from this URL
        urls=["https://agno-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"],
        # Store embeddings in the `ai.recipes` table
        vector_db=PgVector(table_name="recipes", db_url=db_url, search_type=SearchType.hybrid),
    )
    # Load the knowledge base: Comment after first run
    knowledge_base.load(upsert=True)

    agent = Agent(
        model=OpenAIChat(id="gpt-4o"),
        knowledge=knowledge_base,
        # Enable RAG by adding references from AgentKnowledge to the user prompt.
        add_references=True,
        # Set as False because Agents default to `search_knowledge=True`
        search_knowledge=False,
        markdown=True,
        # debug_mode=True,
    )
    agent.print_response("How do I make chicken and galangal in coconut milk soup")
    ```
  </Step>

  <Step title="Run the agent">
    Run the agent (it takes a few seconds to load the knowledge base).

    <CodeGroup>
      ```bash Mac
      python traditional_rag.py
      ```

      ```bash Windows
      python traditional_rag.py
      ```
    </CodeGroup>

    <br />
  </Step>
</Steps>

<Accordion title="How to use local PDFs" icon="file-pdf" iconType="duotone">
  If you want to use local PDFs, use a `PDFKnowledgeBase` instead

  ```python agent.py
  from agno.knowledge.pdf import PDFKnowledgeBase

  ...
  knowledge_base = PDFKnowledgeBase(
      path="data/pdfs",
      vector_db=PgVector(
          table_name="pdf_documents",
          db_url=db_url,
      ),
  )
  ...
  ```
</Accordion>

### Step 3: Agentic RAG

With traditional RAG above, `add_references=True` always adds information from the knowledge base to the prompt, regardless of whether it is relevant to the question or helpful.

With Agentic RAG, we let the Agent decide **if** it needs to access the knowledge base and what search parameters it needs to query the knowledge base.

Set `search_knowledge=True` and `read_chat_history=True`, giving the Agent tools to search its knowledge and chat history on demand.

<Steps>
  <Step title="Create an Agentic RAG Agent">
    Create a file `agentic_rag.py` with the following contents

    ```python agentic_rag.py
    from agno.agent import Agent
    from agno.models.openai import OpenAIChat
    from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
    from agno.vectordb.pgvector import PgVector, SearchType

    db_url = "postgresql+psycopg://ai:ai@localhost:5532/ai"
    knowledge_base = PDFUrlKnowledgeBase(
        urls=["https://agno-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"],
        vector_db=PgVector(table_name="recipes", db_url=db_url, search_type=SearchType.hybrid),
    )
    # Load the knowledge base: Comment out after first run
    knowledge_base.load(upsert=True)

    agent = Agent(
        model=OpenAIChat(id="gpt-4o"),
        knowledge=knowledge_base,
        # Add a tool to search the knowledge base which enables agentic RAG.
        search_knowledge=True,
        # Add a tool to read chat history.
        read_chat_history=True,
        show_tool_calls=True,
        markdown=True,
        # debug_mode=True,
    )
    agent.print_response("How do I make chicken and galangal in coconut milk soup", stream=True)
    agent.print_response("What was my last question?", markdown=True)
    ```
  </Step>

  <Step title="Run the agent">
    Run the agent

    <CodeGroup>
      ```bash Mac
      python agentic_rag.py
      ```

      ```bash Windows
      python agentic_rag.py
      ```
    </CodeGroup>

    <Note>
      Notice how it searches the knowledge base and chat history when needed
    </Note>
  </Step>
</Steps>

## Attributes

| Parameter                  | Type                                  | Default | Description                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `knowledge`                | `AgentKnowledge`                      | `None`  | Provides the knowledge base used by the agent.                                                                                                                                                              |
| `search_knowledge`         | `bool`                                | `True`  | Adds a tool that allows the Model to search the knowledge base (aka Agentic RAG). Enabled by default when `knowledge` is provided.                                                                          |
| `add_references`           | `bool`                                | `False` | Enable RAG by adding references from AgentKnowledge to the user prompt.                                                                                                                                     |
| `retriever`                | `Callable[..., Optional[list[dict]]]` | `None`  | Function to get context to add to the user message. This function is called when add\_references is True.                                                                                                   |
| `context_format`           | `Literal['json', 'yaml']`             | `json`  | Specifies the format for RAG, either "json" or "yaml".                                                                                                                                                      |
| `add_context_instructions` | `bool`                                | `False` | If True, add instructions for using the context to the system prompt (if knowledge is also provided). For example: add an instruction to prefer information from the knowledge base over its training data. |

## Developer Resources

* View [Cookbook](https://github.com/agno-agi/agno/tree/main/cookbook/agent_concepts/knowledge)


# Knowledge

**Knowledge** is domain-specific information that the Agent can **search** at runtime to make better decisions (dynamic few-shot learning) and provide accurate responses (agentic RAG). Knowledge is stored in a vector db and this **searching on demand** pattern is called Agentic RAG.

<Accordion title="Dynamic Few-Shot Learning: Text2Sql Agent" icon="database">
  Example: If we're building a Text2Sql Agent, we'll need to give the table schemas, column names, data types, example queries, common "gotchas" to help it generate the best-possible SQL query.

  We're obviously not going to put this all in the system prompt, instead we store this information in a vector database and let the Agent query it at runtime.

  Using this information, the Agent can then generate the best-possible SQL query. This is called dynamic few-shot learning.
</Accordion>

**Agno Agents use Agentic RAG** by default, meaning when we provide `knowledge` to an Agent, it will search this knowledge base, at runtime, for the specific information it needs to achieve its task.

The pseudo steps for adding knowledge to an Agent are:

```python
from agno.agent import Agent, AgentKnowledge

# Create a knowledge base for the Agent
knowledge_base = AgentKnowledge(vector_db=...)

# Add information to the knowledge base
knowledge_base.load_text("The sky is blue")

# Add the knowledge base to the Agent and
# give it a tool to search the knowledge base as needed
agent = Agent(knowledge=knowledge_base, search_knowledge=True)
```

We can give our agent access to the knowledge base in the following ways:

* We can set `search_knowledge=True` to add a `search_knowledge_base()` tool to the Agent. `search_knowledge` is `True` **by default** if you add `knowledge` to an Agent.
* We can set `add_references=True` to automatically add references from the knowledge base to the Agent's prompt. This is the traditional 2023 RAG approach.

<Tip>
  If you need complete control over the knowledge base search, you can pass your own `retriever` function with the following signature:

  ```python
  def retriever(agent: Agent, query: str, num_documents: Optional[int], **kwargs) -> Optional[list[dict]]:
    ...
  ```

  This function is called during `search_knowledge_base()` and is used by the Agent to retrieve references from the knowledge base.
</Tip>

## Vector Databases

While any type of storage can act as a knowledge base, vector databases offer the best solution for retrieving relevant results from dense information quickly. Here's how vector databases are used with Agents:

<Steps>
  <Step title="Chunk the information">
    Break down the knowledge into smaller chunks to ensure our search query
    returns only relevant results.
  </Step>

  <Step title="Load the knowledge base">
    Convert the chunks into embedding vectors and store them in a vector
    database.
  </Step>

  <Step title="Search the knowledge base">
    When the user sends a message, we convert the input message into an
    embedding and "search" for nearest neighbors in the vector database.
  </Step>
</Steps>

<Note>
  Knowledge filters are currently supported on the following knowledge base types: <b>PDF</b>, <b>PDF\_URL</b>, <b>Text</b>, <b>JSON</b>, and <b>DOCX</b>.
  For more details, see the [Knowledge Filters documentation](/filters/introduction).
</Note>

## Example: RAG Agent with a PDF Knowledge Base

Let's build a **RAG Agent** that answers questions from a PDF.

### Step 1: Run PgVector

Let's use `PgVector` as our vector db as it can also provide storage for our Agents.

Install [docker desktop](https://docs.docker.com/desktop/install/mac-install/) and run **PgVector** on port **5532** using:

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

### Step 2: Traditional RAG

Retrieval Augmented Generation (RAG) means **"stuffing the prompt with relevant information"** to improve the model's response. This is a 2 step process:

1. Retrieve relevant information from the knowledge base.
2. Augment the prompt to provide context to the model.

Let's build a **traditional RAG** Agent that answers questions from a PDF of recipes.

<Steps>
  <Step title="Install libraries">
    Install the required libraries using pip

    <CodeGroup>
      ```bash Mac
      pip install -U pgvector pypdf "psycopg[binary]" sqlalchemy
      ```

      ```bash Windows
      pip install -U pgvector pypdf "psycopg[binary]" sqlalchemy
      ```
    </CodeGroup>
  </Step>

  <Step title="Create a Traditional RAG Agent">
    Create a file `traditional_rag.py` with the following contents

    ```python traditional_rag.py
    from agno.agent import Agent
    from agno.models.openai import OpenAIChat
    from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
    from agno.vectordb.pgvector import PgVector, SearchType

    db_url = "postgresql+psycopg://ai:ai@localhost:5532/ai"
    knowledge_base = PDFUrlKnowledgeBase(
        # Read PDF from this URL
        urls=["https://agno-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"],
        # Store embeddings in the `ai.recipes` table
        vector_db=PgVector(table_name="recipes", db_url=db_url, search_type=SearchType.hybrid),
    )
    # Load the knowledge base: Comment after first run
    knowledge_base.load(upsert=True)

    agent = Agent(
        model=OpenAIChat(id="gpt-4o"),
        knowledge=knowledge_base,
        # Enable RAG by adding references from AgentKnowledge to the user prompt.
        add_references=True,
        # Set as False because Agents default to `search_knowledge=True`
        search_knowledge=False,
        markdown=True,
        # debug_mode=True,
    )
    agent.print_response("How do I make chicken and galangal in coconut milk soup")
    ```
  </Step>

  <Step title="Run the agent">
    Run the agent (it takes a few seconds to load the knowledge base).

    <CodeGroup>
      ```bash Mac
      python traditional_rag.py
      ```

      ```bash Windows
      python traditional_rag.py
      ```
    </CodeGroup>

    <br />
  </Step>
</Steps>

<Accordion title="How to use local PDFs" icon="file-pdf" iconType="duotone">
  If you want to use local PDFs, use a `PDFKnowledgeBase` instead

  ```python agent.py
  from agno.knowledge.pdf import PDFKnowledgeBase

  ...
  knowledge_base = PDFKnowledgeBase(
      path="data/pdfs",
      vector_db=PgVector(
          table_name="pdf_documents",
          db_url=db_url,
      ),
  )
  ...
  ```
</Accordion>

### Step 3: Agentic RAG

With traditional RAG above, `add_references=True` always adds information from the knowledge base to the prompt, regardless of whether it is relevant to the question or helpful.

With Agentic RAG, we let the Agent decide **if** it needs to access the knowledge base and what search parameters it needs to query the knowledge base.

Set `search_knowledge=True` and `read_chat_history=True`, giving the Agent tools to search its knowledge and chat history on demand.

<Steps>
  <Step title="Create an Agentic RAG Agent">
    Create a file `agentic_rag.py` with the following contents

    ```python agentic_rag.py
    from agno.agent import Agent
    from agno.models.openai import OpenAIChat
    from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
    from agno.vectordb.pgvector import PgVector, SearchType

    db_url = "postgresql+psycopg://ai:ai@localhost:5532/ai"
    knowledge_base = PDFUrlKnowledgeBase(
        urls=["https://agno-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"],
        vector_db=PgVector(table_name="recipes", db_url=db_url, search_type=SearchType.hybrid),
    )
    # Load the knowledge base: Comment out after first run
    knowledge_base.load(upsert=True)

    agent = Agent(
        model=OpenAIChat(id="gpt-4o"),
        knowledge=knowledge_base,
        # Add a tool to search the knowledge base which enables agentic RAG.
        search_knowledge=True,
        # Add a tool to read chat history.
        read_chat_history=True,
        show_tool_calls=True,
        markdown=True,
        # debug_mode=True,
    )
    agent.print_response("How do I make chicken and galangal in coconut milk soup", stream=True)
    agent.print_response("What was my last question?", markdown=True)
    ```
  </Step>

  <Step title="Run the agent">
    Run the agent

    <CodeGroup>
      ```bash Mac
      python agentic_rag.py
      ```

      ```bash Windows
      python agentic_rag.py
      ```
    </CodeGroup>

    <Note>
      Notice how it searches the knowledge base and chat history when needed
    </Note>
  </Step>
</Steps>

## Attributes

| Parameter                  | Type                                  | Default | Description                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `knowledge`                | `AgentKnowledge`                      | `None`  | Provides the knowledge base used by the agent.                                                                                                                                                              |
| `search_knowledge`         | `bool`                                | `True`  | Adds a tool that allows the Model to search the knowledge base (aka Agentic RAG). Enabled by default when `knowledge` is provided.                                                                          |
| `add_references`           | `bool`                                | `False` | Enable RAG by adding references from AgentKnowledge to the user prompt.                                                                                                                                     |
| `retriever`                | `Callable[..., Optional[list[dict]]]` | `None`  | Function to get context to add to the user message. This function is called when add\_references is True.                                                                                                   |
| `context_format`           | `Literal['json', 'yaml']`             | `json`  | Specifies the format for RAG, either "json" or "yaml".                                                                                                                                                      |
| `add_context_instructions` | `bool`                                | `False` | If True, add instructions for using the context to the system prompt (if knowledge is also provided). For example: add an instruction to prefer information from the knowledge base over its training data. |

## Developer Resources

* View [Cookbook](https://github.com/agno-agi/agno/tree/main/cookbook/agent_concepts/knowledge)


# Agent Context

Agent Context is another amazing feature of Agno. `context` is a dictionary that contains a set of functions (or dependencies) that are resolved before the agent runs.

<Note>
  Context is a way to inject dependencies into the description and instructions of the agent.

  You can use context to inject memories, dynamic few-shot examples, "retrieved" documents, etc.
</Note>

```python agent_context.py
import json
from textwrap import dedent

import httpx
from agno.agent import Agent
from agno.models.openai import OpenAIChat


def get_top_hackernews_stories(num_stories: int = 5) -> str:
    """Fetch and return the top stories from HackerNews.

    Args:
        num_stories: Number of top stories to retrieve (default: 5)
    Returns:
        JSON string containing story details (title, url, score, etc.)
    """
    # Get top stories
    stories = [
        {
            k: v
            for k, v in httpx.get(
                f"https://hacker-news.firebaseio.com/v0/item/{id}.json"
            )
            .json()
            .items()
            if k != "kids"  # Exclude discussion threads
        }
        for id in httpx.get(
            "https://hacker-news.firebaseio.com/v0/topstories.json"
        ).json()[:num_stories]
    ]
    return json.dumps(stories, indent=4)


# Create a Context-Aware Agent that can access real-time HackerNews data
agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    # Each function in the context is evaluated when the agent is run,
    # think of it as dependency injection for Agents
    context={"top_hackernews_stories": get_top_hackernews_stories},
    # Alternatively, you can manually add the context to the instructions
    instructions=dedent("""\
        You are an insightful tech trend observer! 📰

        Here are the top stories on HackerNews:
        {top_hackernews_stories}\
    """),
    # add_state_in_messages will make the `top_hackernews_stories` variable
    # available in the instructions
    add_state_in_messages=True,
    markdown=True,
)

# Example usage
agent.print_response(
    "Summarize the top stories on HackerNews and identify any interesting trends.",
    stream=True,
)
```

## Adding the entire context to the user message

Set `add_context=True` to add the entire context to the user message. This way you don't have to manually add the context to the instructions.

```python agent_context_instructions.py
import json
from textwrap import dedent

import httpx
from agno.agent import Agent
from agno.models.openai import OpenAIChat


def get_top_hackernews_stories(num_stories: int = 5) -> str:
    """Fetch and return the top stories from HackerNews.

    Args:
        num_stories: Number of top stories to retrieve (default: 5)
    Returns:
        JSON string containing story details (title, url, score, etc.)
    """
    # Get top stories
    stories = [
        {
            k: v
            for k, v in httpx.get(
                f"https://hacker-news.firebaseio.com/v0/item/{id}.json"
            )
            .json()
            .items()
            if k != "kids"  # Exclude discussion threads
        }
        for id in httpx.get(
            "https://hacker-news.firebaseio.com/v0/topstories.json"
        ).json()[:num_stories]
    ]
    return json.dumps(stories, indent=4)


# Create a Context-Aware Agent that can access real-time HackerNews data
agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    # Each function in the context is resolved when the agent is run,
    # think of it as dependency injection for Agents
    context={"top_hackernews_stories": get_top_hackernews_stories},
    # We can add the entire context dictionary to the instructions
    add_context=True,
    markdown=True,
)

# Example usage
agent.print_response(
    "Summarize the top stories on HackerNews and identify any interesting trends.",
    stream=True,
)
```
