# User Memories

When we speak about Memory, the commonly agreed upon understanding of Memory is the ability to store insights and facts about the user the Agent is interacting with. In short, build a persona of the user, learn about their preferences and use that to personalize the Agent's response.

## Agentic Memory

Agno Agents natively support Agentic Memory Management and recommends it as the starting point for your memory journey.

With Agentic Memory, The Agent itself creates, updates and deletes memories from user conversations.

Set `enable_agentic_memory=True` to give the Agent a tool to manage memories of the user, this tool passes the task to the `MemoryManager` class.

> You may also set `enable_user_memories=True` which always runs the `MemoryManager` after each user message. [See below for an example.](#create-memories-after-each-run)

```python agentic_memory.py
from agno.agent import Agent
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory
from agno.models.openai import OpenAIChat
from agno.storage.sqlite import SqliteStorage
from rich.pretty import pprint

# UserId for the memories
user_id = "ava"
# Database file for memory and storage
db_file = "tmp/agent.db"

# Initialize memory.v2
memory = Memory(
    # Use any model for creating memories
    model=OpenAIChat(id="gpt-4.1"),
    db=SqliteMemoryDb(table_name="user_memories", db_file=db_file),
)
# Initialize storage
storage = SqliteStorage(table_name="agent_sessions", db_file=db_file)

# Initialize Agent
memory_agent = Agent(
    model=OpenAIChat(id="gpt-4.1"),
    # Store memories in a database
    memory=memory,
    # Give the Agent the ability to update memories
    enable_agentic_memory=True,
    # OR - Run the MemoryManager after each response
    enable_user_memories=True,
    # Store the chat history in the database
    storage=storage,
    # Add the chat history to the messages
    add_history_to_messages=True,
    # Number of history runs
    num_history_runs=3,
    markdown=True,
)

memory.clear()
memory_agent.print_response(
    "My name is Ava and I like to ski.",
    user_id=user_id,
    stream=True,
    stream_intermediate_steps=True,
)
print("Memories about Ava:")
pprint(memory.get_user_memories(user_id=user_id))

memory_agent.print_response(
    "I live in san francisco, where should i move within a 4 hour drive?",
    user_id=user_id,
    stream=True,
    stream_intermediate_steps=True,
)
print("Memories about Ava:")
pprint(memory.get_user_memories(user_id=user_id))
```

* `add_history_to_messages=True` adds the chat history to the messages sent to the Model, the `num_history_runs` determines how many runs to add.
* `read_chat_history=True` adds a tool to the Agent that allows it to read chat history, as it may be larger than what's included in the `num_history_runs`.

## Creating Memories after each run

While `enable_agentic_memory=True` gives the Agent a tool to manage memories of the user, we can also always "trigger" the `MemoryManagement` after each user message.

Set `enable_user_memories=True` which always process memories after each user message.

```python create_memories_after_each_run.py
from agno.agent.agent import Agent
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory
from agno.models.openai import OpenAIChat
from rich.pretty import pprint

memory_db = SqliteMemoryDb(table_name="memory", db_file="tmp/memory.db")
# No need to set the model, it gets set to the model of the agent
memory = Memory(db=memory_db, delete_memories=True, clear_memories=True)

# Reset the memory for this example
memory.clear()

# User ID for the memory
john_doe_id = "john_doe@example.com"
agent = Agent(
    model=OpenAIChat(id="gpt-4o-mini"),
    memory=memory,
    # This will trigger the MemoryManager after each user message
    enable_user_memories=True,
)

# Send a message to the agent that would require the memory to be used
agent.print_response(
    "My name is John Doe and I like to hike in the mountains on weekends.",
    stream=True,
    user_id=john_doe_id,
)

# Send a message to the agent that checks the memory is working
agent.print_response("What are my hobbies?", stream=True, user_id=john_doe_id)

# Print the memories for the user
memories = memory.get_user_memories(user_id=john_doe_id)
print("Memories about John Doe:")
pprint(memories)

# Send a message to the agent that removes all memories for the user
agent.print_response(
    "Remove all existing memories of me.",
    stream=True,
    user_id=john_doe_id,
)
memories = memory.get_user_memories(user_id=john_doe_id)
print("Memories about John Doe:")
pprint(memories)
```

## Memory Management

The `Memory` class in Agno lets you manage all aspects of user memory. Let's start with some examples of using `Memory` outside of Agents. We will:

* Add, update and delete memories
* Store memories in a database
* Create memories from conversations
* Search over memories

```python
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.sqlite import SqliteMemoryDb

# Create a memory instance with persistent storage
memory_db = SqliteMemoryDb(table_name="memory", db_file="memory.db")
memory = Memory(db=memory_db)
```

### Adding a new memory

```python
from agno.memory.v2.memory import Memory
from agno.memory.v2.schema import UserMemory

memory = Memory()

# Create a user memory manually
memory_id = memory.add_user_memory(
    memory=UserMemory(
        memory="The user's name is Jane Doe",
        topics=["personal", "name"]
    ),
    user_id="jane_doe@example.com"
)
```

### Updating a memory

```python
from agno.memory.v2.memory import Memory
from agno.memory.v2.schema import UserMemory

memory = Memory()

# Replace a user memory
memory_id = memory.replace_user_memory(
    # The id of the memory to replace
    memory_id=previous_memory_id,
    # The new memory to replace it with
    memory=UserMemory(
        memory="The user's name is Verna Doe",
        topics=["personal", "name"]
    ),
    user_id="jane_doe@example.com"
)
```

### Deleting a memory

```python
from agno.memory.v2.memory import Memory

memory = Memory()

# Delete a user memory
memory.delete_user_memory(user_id="jane_doe@example.com", memory_id=memory_id)
```

### Creating memories from user information

```python
from agno.memory.v2 import Memory
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.models.google import Gemini

memory_db = SqliteMemoryDb(table_name="memory", db_file="tmp/memory.db")
memory = Memory(model=Gemini(id="gemini-2.0-flash-exp"), db=memory_db)

john_doe_id = "john_doe@example.com"

memory.create_user_memories(
    message="""
    I enjoy hiking in the mountains on weekends,
    reading science fiction novels before bed,
    cooking new recipes from different cultures,
    playing chess with friends,
    and attending live music concerts whenever possible.
    Photography has become a recent passion of mine, especially capturing landscapes and street scenes.
    I also like to meditate in the mornings and practice yoga to stay centered.
    """,
    user_id=john_doe_id,
)


memories = memory.get_user_memories(user_id=john_doe_id)
print("John Doe's memories:")
for i, m in enumerate(memories):
    print(f"{i}: {m.memory} - {m.topics}")
```

### Creating memories from a conversation

```python
from agno.memory.v2 import Memory
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.models.google import Gemini
from agno.models.message import Message

memory_db = SqliteMemoryDb(table_name="memory", db_file="tmp/memory.db")
memory = Memory(model=Gemini(id="gemini-2.0-flash-exp"), db=memory_db)


jane_doe_id = "jane_doe@example.com"
# Send a history of messages and add memories
memory.create_user_memories(
    messages=[
        Message(role="user", content="My name is Jane Doe"),
        Message(role="assistant", content="That is great!"),
        Message(role="user", content="I like to play chess"),
        Message(role="assistant", content="That is great!"),
    ],
    user_id=jane_doe_id,
)

memories = memory.get_user_memories(user_id=jane_doe_id)
print("Jane Doe's memories:")
for i, m in enumerate(memories):
    print(f"{i}: {m.memory} - {m.topics}")
```

## Memory Search

Agno provides several retrieval methods to search and retrieve user memories:

### Basic Retrieval Methods

You can retrieve memories using chronological methods such as `last_n` (most recent) or `first_n` (oldest first):

```python
from agno.memory.v2 import Memory, UserMemory

memory = Memory()

john_doe_id = "john_doe@example.com"

memory.add_user_memory(
    memory=UserMemory(memory="The user enjoys hiking in the mountains on weekends"),
    user_id=john_doe_id,
)
memory.add_user_memory(
    memory=UserMemory(
        memory="The user enjoys reading science fiction novels before bed"
    ),
    user_id=john_doe_id,
)

# Get the most recent memory
memories = memory.search_user_memories(
    user_id=john_doe_id, limit=1, retrieval_method="last_n"
)
print("John Doe's last_n memories:")
for i, m in enumerate(memories):
    print(f"{i}: {m.memory}")

# Get the oldest memory
memories = memory.search_user_memories(
    user_id=john_doe_id, limit=1, retrieval_method="first_n"
)
print("John Doe's first_n memories:")
for i, m in enumerate(memories):
    print(f"{i}: {m.memory}")
```

### Agentic Memory Search

Agentic search allows you to find memories based on meaning rather than exact keyword matches. This is particularly useful for retrieving contextually relevant information:

```python
from agno.memory.v2.memory import Memory, UserMemory
from agno.models.google.gemini import Gemini

# Initialize memory with a model for agentic search
memory = Memory(model=Gemini(id="gemini-2.0-flash-exp"))

john_doe_id = "john_doe@example.com"

memory.add_user_memory(
    memory=UserMemory(memory="The user enjoys hiking in the mountains on weekends"),
    user_id=john_doe_id,
)
memory.add_user_memory(
    memory=UserMemory(
        memory="The user enjoys reading science fiction novels before bed"
    ),
    user_id=john_doe_id,
)

# Search for memories related to the query
memories = memory.search_user_memories(
    user_id=john_doe_id,
    query="What does the user like to do on weekends?",
    retrieval_method="agentic",
)
print("John Doe's found memories:")
for i, m in enumerate(memories):
    print(f"{i}: {m.memory}")
```

With agentic search, the model understands the intent behind your query and returns the most relevant memories, even if they don't contain the exact keywords from your search.

## Developer Resources

* Find full examples in the [Cookbook](https://github.com/agno-agi/agno/tree/main/cookbook/agent_concepts/memory)
* View the class reference for the `Memory` class [here](/reference/memory/memory)


# Hybrid Search- Combining Keyword and Vector Search

> Understanding Hybrid Search and its benefits in combining keyword and vector search for better results.

With Hybrid search, you can get the precision of exact matching with the intelligence of semantic understanding. Combining both approaches will deliver more comprehensive and relevant results in many cases.

## What exactly is Hybrid Search?

**Hybrid search** is a retrieval technique that combines the strengths of both **vector search** (semantic search) and **keyword search** (lexical search) to find the most relevant results for a query.

* Vector search uses embeddings (dense vectors) to capture the semantic meaning of text, enabling the system to find results that are similar in meaning, even if the exact words don’t match.
* Keyword search (BM25, TF-IDF, etc.) matches documents based on the presence and frequency of exact words or phrases in the query.

Hybrid search blends these approaches, typically by scoring and/or ranking results from both methods, to maximize both precision and recall.

## Keyword Search vs Vector Search vs Hybrid Search

| Feature       | Keyword Search                  | Vector Search                             | Hybrid Search                             |
| ------------- | ------------------------------- | ----------------------------------------- | ----------------------------------------- |
| Based On      | Lexical matching (BM25, TF-IDF) | Embedding similarity (cosine, dot)        | Both                                      |
| Strength      | Exact matches, relevance        | Contextual meaning                        | Balanced relevance + meaning              |
| Weakness      | No semantic understanding       | Misses exact keywords                     | Slightly heavier in compute               |
| Example Match | "chicken soup" = *chicken soup* | "chicken soup" = *hot broth with chicken* | Both literal and related concepts         |
| Best Use Case | Legal docs, structured data     | Chatbots, Q\&A, semantic search           | Multimodal, real-world messy user queries |

<Note>
  Why Hybrid Search might be better for your application-

  * **Improved Recall**: Captures more relevant results missed by pure keyword or vector search.
  * **Balanced Precision**: Exact matches get priority while also including semantically relevant results.
  * **Robust to Ambiguity**: Handles spelling variations, synonyms, and fuzzy user intent.
  * **Best of Both Worlds**: Keywords matter when they should, and meaning matters when needed.

  **Perfect for **real-world apps** like recipe search, customer support, legal discovery, etc.**
</Note>

## Vector DBs in Agno that Support Hybrid Search

The following vector databases support hybrid search natively or via configurations:

| Database   | Hybrid Search Support       |
| ---------- | --------------------------- |
| `pgvector` | ✅ Yes                       |
| `milvus`   | ✅ Yes                       |
| `lancedb`  | ✅ Yes                       |
| `qdrantdb` | ✅ Yes                       |
| `weaviate` | ✅ Yes                       |
| `mongodb`  | ✅ Yes (Atlas Vector Search) |

***

## Example: Hybrid Search using `pgvector`

```python
from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
from agno.vectordb.pgvector import PgVector, SearchType

# Database URL
db_url = "postgresql+psycopg://ai:ai@localhost:5532/ai"

# Initialize hybrid vector DB
hybrid_db = PgVector(
    table_name="recipes",
    db_url=db_url,
    search_type=SearchType.hybrid  # Hybrid Search
)

# Load PDF knowledge base using hybrid search
knowledge_base = PDFUrlKnowledgeBase(
    urls=["https://agno-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"],
    vector_db=hybrid_db,
)

# Load the data into the DB (first-time setup)
knowledge_base.load(recreate=True, upsert=True)

# Run a hybrid search query
results = hybrid_db.search("chicken coconut soup", limit=5)
print("Hybrid Search Results:", results)
```

## See More Examples

For hands-on code and advanced usage, check out these hybrid search examples for each supported vector database [here](../examples/concepts/hybrid-search/)
