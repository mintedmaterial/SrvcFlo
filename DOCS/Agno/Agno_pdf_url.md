# PDF URL Knowledge Base

> Learn how to use remote PDFs in your knowledge base.

The **PDFUrlKnowledgeBase** reads **PDFs from urls**, converts them into vector embeddings and loads them to a vector database.

## Usage

<Note>
  We are using a local PgVector database for this example. [Make sure it's running](https://docs.agno.com/vectordb/pgvector)
</Note>

```shell
pip install pypdf
```

```python knowledge_base.py
from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
from agno.vectordb.pgvector import PgVector

knowledge_base = PDFUrlKnowledgeBase(
    urls=["pdf_url"],
    # Table name: ai.pdf_documents
    vector_db=PgVector(
        table_name="pdf_documents",
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

#### PDFUrlKnowledgeBase also supports async loading.

```shell
pip install qdrant-client
```

We are using a local Qdrant database for this example. [Make sure it's running](https://docs.agno.com/vectordb/qdrant)

```python async_knowledge_base.py
import asyncio

from agno.agent import Agent
from agno.knowledge.pdf_url import PDFUrlKnowledgeBase, PDFUrlReader
from agno.vectordb.qdrant import Qdrant

COLLECTION_NAME = "pdf-url-reader"

vector_db = Qdrant(collection=COLLECTION_NAME, url="http://localhost:6333")

# Create a knowledge base with the PDFs from the data/pdfs directory
knowledge_base = PDFUrlKnowledgeBase(
    urls=["https://agno-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"],
    vector_db=vector_db,
    reader=PDFUrlReader(chunk=True),
)

# Create an agent with the knowledge base
agent = Agent(
    knowledge=knowledge_base,
    search_knowledge=True,
)

if __name__ == "__main__":
    # Comment out after first run
    asyncio.run(knowledge_base.aload(recreate=False))

    # Create and use the agent
    asyncio.run(agent.aprint_response("How to make Thai curry?", markdown=True))
```

## Params

| Parameter | Type           | Default | Description                                                                         |
| --------- | -------------- | ------- | ----------------------------------------------------------------------------------- |
| `urls`    | `List[str]`    | -       | URLs for `PDF` files.                                                               |
| `reader`  | `PDFUrlReader` | -       | A `PDFUrlReader` that converts the `PDFs` into `Documents` for the vector database. |

`PDFUrlKnowledgeBase` is a subclass of the [AgentKnowledge](/reference/knowledge/base) class and has access to the same params.

## Developer Resources

* View [Sync loading Cookbook](https://github.com/agno-agi/agno/blob/main/cookbook/agent_concepts/knowledge/pdf_url_kb.py)
* View [Async loading Cookbook](https://github.com/agno-agi/agno/blob/main/cookbook/agent_concepts/knowledge/pdf_url_kb_async.py)
 