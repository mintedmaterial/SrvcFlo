# Website Knowledge Base

> Learn how to use websites in your knowledge base.

The **WebsiteKnowledgeBase** reads websites, converts them into vector embeddings and loads them to a `vector_db`.

## Usage

<Note>
  We are using a local PgVector database for this example. [Make sure it's running](https://docs.agno.com/vectordb/pgvector)
</Note>

```shell
pip install bs4
```

```python knowledge_base.py
from agno.knowledge.website import WebsiteKnowledgeBase
from agno.vectordb.pgvector import PgVector

knowledge_base = WebsiteKnowledgeBase(
    urls=["https://docs.agno.com/introduction"],
    # Number of links to follow from the seed URLs
    max_links=10,
    # Table name: ai.website_documents
    vector_db=PgVector(
        table_name="website_documents",
        db_url="postgresql+psycopg://ai:ai@localhost:5532/ai",
    ),
)
```

Then use the `knowledge_base` with an `Agent`:

```python agent.py
from agno.agent import Agent
from knowledge_base import knowledge_base

agent = Agent(
    knowledge=knowledge_base,
    search_knowledge=True,
)
agent.knowledge.load(recreate=False)

agent.print_response("Ask me about something from the knowledge base")
```

#### WebsiteKnowledgeBase also supports async loading.

```shell
pip install qdrant-client
```

We are using a local Qdrant database for this example. [Make sure it's running](https://docs.agno.com/vectordb/qdrant)

```python async_knowledge_base.py
import asyncio

import asyncio

from agno.agent import Agent
from agno.knowledge.website import WebsiteKnowledgeBase
from agno.vectordb.qdrant import Qdrant

COLLECTION_NAME = "website-content"

vector_db = Qdrant(collection=COLLECTION_NAME, url="http://localhost:6333")


# Create a knowledge base with the seed URLs
knowledge_base = WebsiteKnowledgeBase(
    urls=["https://docs.agno.com/introduction"],
    # Number of links to follow from the seed URLs
    max_links=5,
    # Table name: ai.website_documents
    vector_db=vector_db,
)

# Create an agent with the knowledge base
agent = Agent(knowledge=knowledge_base, search_knowledge=True, debug_mode=True)

if __name__ == "__main__":
    # Comment out after first run
    asyncio.run(knowledge_base.aload(recreate=False))

    # Create and use the agent
    asyncio.run(agent.aprint_response("How does agno work?", markdown=True))
```

## Params

| Parameter   | Type                      | Default | Description                                                                                       |
| ----------- | ------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `urls`      | `List[str]`               | `[]`    | URLs to read                                                                                      |
| `reader`    | `Optional[WebsiteReader]` | `None`  | A `WebsiteReader` that reads the urls and converts them into `Documents` for the vector database. |
| `max_depth` | `int`                     | `3`     | Maximum depth to crawl.                                                                           |
| `max_links` | `int`                     | `10`    | Number of links to crawl.                                                                         |

`WebsiteKnowledgeBase` is a subclass of the [AgentKnowledge](/reference/knowledge/base) class and has access to the same params.

## Developer Resources

* View [Sync loading Cookbook](https://github.com/agno-agi/agno/blob/main/cookbook/agent_concepts/knowledge/website_kb.py)
* View [Async loading Cookbook](https://github.com/agno-agi/agno/blob/main/cookbook/agent_concepts/knowledge/website_kb_async.py)


# Website Knowledge Base

> Learn how to use websites in your knowledge base.

The **WebsiteKnowledgeBase** reads websites, converts them into vector embeddings and loads them to a `vector_db`.

## Usage

<Note>
  We are using a local PgVector database for this example. [Make sure it's running](https://docs.agno.com/vectordb/pgvector)
</Note>

```shell
pip install bs4
```

```python knowledge_base.py
from agno.knowledge.website import WebsiteKnowledgeBase
from agno.vectordb.pgvector import PgVector

knowledge_base = WebsiteKnowledgeBase(
    urls=["https://docs.agno.com/introduction"],
    # Number of links to follow from the seed URLs
    max_links=10,
    # Table name: ai.website_documents
    vector_db=PgVector(
        table_name="website_documents",
        db_url="postgresql+psycopg://ai:ai@localhost:5532/ai",
    ),
)
```

Then use the `knowledge_base` with an `Agent`:

```python agent.py
from agno.agent import Agent
from knowledge_base import knowledge_base

agent = Agent(
    knowledge=knowledge_base,
    search_knowledge=True,
)
agent.knowledge.load(recreate=False)

agent.print_response("Ask me about something from the knowledge base")
```

#### WebsiteKnowledgeBase also supports async loading.

```shell
pip install qdrant-client
```

We are using a local Qdrant database for this example. [Make sure it's running](https://docs.agno.com/vectordb/qdrant)

```python async_knowledge_base.py
import asyncio

import asyncio

from agno.agent import Agent
from agno.knowledge.website import WebsiteKnowledgeBase
from agno.vectordb.qdrant import Qdrant

COLLECTION_NAME = "website-content"

vector_db = Qdrant(collection=COLLECTION_NAME, url="http://localhost:6333")


# Create a knowledge base with the seed URLs
knowledge_base = WebsiteKnowledgeBase(
    urls=["https://docs.agno.com/introduction"],
    # Number of links to follow from the seed URLs
    max_links=5,
    # Table name: ai.website_documents
    vector_db=vector_db,
)

# Create an agent with the knowledge base
agent = Agent(knowledge=knowledge_base, search_knowledge=True, debug_mode=True)

if __name__ == "__main__":
    # Comment out after first run
    asyncio.run(knowledge_base.aload(recreate=False))

    # Create and use the agent
    asyncio.run(agent.aprint_response("How does agno work?", markdown=True))
```

## Params

| Parameter   | Type                      | Default | Description                                                                                       |
| ----------- | ------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `urls`      | `List[str]`               | `[]`    | URLs to read                                                                                      |
| `reader`    | `Optional[WebsiteReader]` | `None`  | A `WebsiteReader` that reads the urls and converts them into `Documents` for the vector database. |
| `max_depth` | `int`                     | `3`     | Maximum depth to crawl.                                                                           |
| `max_links` | `int`                     | `10`    | Number of links to crawl.                                                                         |

`WebsiteKnowledgeBase` is a subclass of the [AgentKnowledge](/reference/knowledge/base) class and has access to the same params.

## Developer Resources

* View [Sync loading Cookbook](https://github.com/agno-agi/agno/blob/main/cookbook/agent_concepts/knowledge/website_kb.py)
* View [Async loading Cookbook](https://github.com/agno-agi/agno/blob/main/cookbook/agent_concepts/knowledge/website_kb_async.py)


# Wikipedia KnowledgeBase

> Learn how to use Wikipedia topics in your knowledge base.

The **WikipediaKnowledgeBase** reads wikipedia topics, converts them into vector embeddings and loads them to a vector database.

## Usage

<Note>
  We are using a local PgVector database for this example. [Make sure it's running](http://localhost:3333/vectordb/pgvector)
</Note>

```shell
pip install wikipedia
```

```python knowledge_base.py
from agno.knowledge.wikipedia import WikipediaKnowledgeBase
from agno.vectordb.pgvector import PgVector

knowledge_base = WikipediaKnowledgeBase(
    topics=["Manchester United", "Real Madrid"],
    # Table name: ai.wikipedia_documents
    vector_db=PgVector(
        table_name="wikipedia_documents",
        db_url="postgresql+psycopg://ai:ai@localhost:5532/ai",
    ),
)
```

Then use the `knowledge_base` with an Agent:

```python agent.py
from agno.agent import Agent
from knowledge_base import knowledge_base

agent = Agent(
    knowledge=knowledge_base,
    search_knowledge=True,
)
agent.knowledge.load(recreate=False)

agent.print_response("Ask me about something from the knowledge base")
```

## Params

| Parameter | Type        | Default | Description    |
| --------- | ----------- | ------- | -------------- |
| `topics`  | `List[str]` | \[]     | Topics to read |

`WikipediaKnowledgeBase` is a subclass of the [AgentKnowledge](/reference/knowledge/base) class and has access to the same params.

## Developer Resources

* View [Sync loading Cookbook](https://github.com/agno-agi/agno/blob/main/cookbook/agent_concepts/knowledge/wikipedia_kb.py)
* View [Async loading Cookbook](https://github.com/agno-agi/agno/blob/main/cookbook/agent_concepts/knowledge/wikipedia_kb_async.py)


# Youtube KnowledgeBase

> Learn how to use YouTube video transcripts in your knowledge base.

The **YouTubeKnowledgeBase** iterates over a list of YouTube URLs, extracts the video transcripts, converts them into vector embeddings and loads them to a vector database.

## Usage

<Note>
  We are using a local PgVector database for this example. [Make sure it's running](http://localhost:3333/vectordb/pgvector)
</Note>

```shell
pip install bs4
```

```python knowledge_base.py
from agno.knowledge.youtube import YouTubeKnowledgeBase
from agno.vectordb.pgvector import PgVector

knowledge_base = YouTubeKnowledgeBase(
    urls=["https://www.youtube.com/watch?v=CDC3GOuJyZ0"],
    # Table name: ai.website_documents
    vector_db=PgVector(
        table_name="youtube_documents",
        db_url="postgresql+psycopg://ai:ai@localhost:5532/ai",
    ),
)
```

Then use the `knowledge_base` with an `Agent`:

```python agent.py
from agno.agent import Agent
from knowledge_base import knowledge_base

agent = Agent(
    knowledge=knowledge_base,
    search_knowledge=True,
)
agent.knowledge.load(recreate=False)

agent.print_response("Ask me about something from the knowledge base")
```

#### YouTubeKnowledgeBase also supports async loading.

```shell
pip install qdrant-client
```

We are using a local Qdrant database for this example. [Make sure it's running](https://docs.agno.com/vectordb/qdrant)

```python async_knowledge_base.py
import asyncio

from agno.agent import Agent
from agno.knowledge.youtube import YouTubeKnowledgeBase, YouTubeReader
from agno.vectordb.qdrant import Qdrant

COLLECTION_NAME = "youtube-reader"

vector_db = Qdrant(collection=COLLECTION_NAME, url="http://localhost:6333")

knowledge_base = YouTubeKnowledgeBase(
    urls=[
        "https://www.youtube.com/watch?v=CDC3GOuJyZ0",
        "https://www.youtube.com/watch?v=JbF_8g1EXj4",
    ],
    vector_db=vector_db,
    reader=YouTubeReader(chunk=True),
)

agent = Agent(
    knowledge=knowledge_base,
    search_knowledge=True,
)

if __name__ == "__main__":
    # Comment out after first run
    asyncio.run(knowledge_base.aload(recreate=False))

    # Create and use the agent
    asyncio.run(
        agent.aprint_response(
            "What is the major focus of the knowledge provided in both the videos, explain briefly.",
            markdown=True,
        )
    )
```

## Params

| Parameter | Type                      | Default | Description                                                                                                                    |
| --------- | ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `urls`    | `List[str]`               | `[]`    | URLs of the videos to read                                                                                                     |
| `reader`  | `Optional[YouTubeReader]` | `None`  | A `YouTubeReader` that reads transcripts of the videos at the urls and converts them into `Documents` for the vector database. |

`YouTubeKnowledgeBase` is a subclass of the [AgentKnowledge](/reference/knowledge/base) class and has access to the same params.

## Developer Resources

* View [Sync loading Cookbook](https://github.com/agno-agi/agno/blob/main/cookbook/agent_concepts/knowledge/youtube_kb.py)
* View [Async loading Cookbook](https://github.com/agno-agi/agno/blob/main/cookbook/agent_concepts/knowledge/youtube_kb_async.py)
Ai