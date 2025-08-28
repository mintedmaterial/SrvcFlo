# MongoDB Memory Storage

## Code

```python cookbook/agent_concepts/memory/mongodb_memory.py
"""
This example shows how to use the Memory class with MongoDB storage.
"""

import asyncio
import os

from agno.agent.agent import Agent
from agno.memory.v2.db.mongodb import MongoMemoryDb
from agno.memory.v2.memory import Memory
from agno.models.openai.chat import OpenAIChat

# Get MongoDB connection string from environment
# Format: mongodb://username:password@localhost:27017/
mongo_url = "mongodb://localhost:27017/"
database_name = "agno_memory"

# Create MongoDB memory database
memory_db = MongoMemoryDb(
    connection_string=mongo_url,
    database_name=database_name,
    collection_name="memories"  # Collection name to use in the database
)

# Create memory instance with MongoDB backend
memory = Memory(db=memory_db)

# This will create the collection if it doesn't exist
memory.clear()

# Create agent with memory
agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    memory=memory,
    enable_user_memories=True,
)

async def run_example():
    # Use the agent with MongoDB-backed memory
    await agent.aprint_response(
        "My name is Jane Smith and I enjoy painting and photography.",
        user_id="jane@example.com",
    )
    
    await agent.aprint_response(
        "What are my creative interests?",
        user_id="jane@example.com",
    )
    
    # Display the memories stored in MongoDB
    memories = memory.get_user_memories(user_id="jane@example.com")
    print("Memories stored in MongoDB:")
    for i, m in enumerate(memories):
        print(f"{i}: {m.memory}")

if __name__ == "__main__":
    asyncio.run(run_example())
```

## Usage

<Steps>
  <Snippet file="create-venv-step.mdx" />

  <Step title="Set environment variables">
    ```bash
    export OPENAI_API_KEY=xxx
    ```
  </Step>

  <Step title="Install libraries">
    ```bash
    pip install -U agno openai pymongo
    ```
  </Step>

  <Step title="Run Example">
    <CodeGroup>
      ```bash Mac/Linux
      python cookbook/agent_concepts/memory/mongodb_memory.py
      ```

      ```bash Windows
      python cookbook/agent_concepts/memory/mongodb_memory.py
      ```
    </CodeGroup>
  </Step>
</Steps>


# MongoDB Memory Storage

## Code

```python cookbook/agent_concepts/memory/mongodb_memory.py
"""
This example shows how to use the Memory class with MongoDB storage.
"""

import asyncio
import os

from agno.agent.agent import Agent
from agno.memory.v2.db.mongodb import MongoMemoryDb
from agno.memory.v2.memory import Memory
from agno.models.openai.chat import OpenAIChat

# Get MongoDB connection string from environment
# Format: mongodb://username:password@localhost:27017/
mongo_url = "mongodb://localhost:27017/"
database_name = "agno_memory"

# Create MongoDB memory database
memory_db = MongoMemoryDb(
    connection_string=mongo_url,
    database_name=database_name,
    collection_name="memories"  # Collection name to use in the database
)

# Create memory instance with MongoDB backend
memory = Memory(db=memory_db)

# This will create the collection if it doesn't exist
memory.clear()

# Create agent with memory
agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    memory=memory,
    enable_user_memories=True,
)

async def run_example():
    # Use the agent with MongoDB-backed memory
    await agent.aprint_response(
        "My name is Jane Smith and I enjoy painting and photography.",
        user_id="jane@example.com",
    )
    
    await agent.aprint_response(
        "What are my creative interests?",
        user_id="jane@example.com",
    )
    
    # Display the memories stored in MongoDB
    memories = memory.get_user_memories(user_id="jane@example.com")
    print("Memories stored in MongoDB:")
    for i, m in enumerate(memories):
        print(f"{i}: {m.memory}")

if __name__ == "__main__":
    asyncio.run(run_example())
```

## Usage

<Steps>
  <Snippet file="create-venv-step.mdx" />

  <Step title="Set environment variables">
    ```bash
    export OPENAI_API_KEY=xxx
    ```
  </Step>

  <Step title="Install libraries">
    ```bash
    pip install -U agno openai pymongo
    ```
  </Step>

  <Step title="Run Example">
    <CodeGroup>
      ```bash Mac/Linux
      python cookbook/agent_concepts/memory/mongodb_memory.py
      ```

      ```bash Windows
      python cookbook/agent_concepts/memory/mongodb_memory.py
      ```
    </CodeGroup>
  </Step>
</Steps>
