# Fixed Size Chunking

Fixed size chunking is a method of splitting documents into smaller chunks of a specified size, with optional overlap between chunks. This is useful when you want to process large documents in smaller, manageable pieces.

## Usage

```python
from agno.agent import Agent
from agno.document.chunking.fixed import FixedSizeChunking
from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
from agno.vectordb.pgvector import PgVector

db_url = "postgresql+psycopg://ai:ai@localhost:5532/ai"

knowledge_base = PDFUrlKnowledgeBase(
    urls=["https://agno-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"],
    vector_db=PgVector(table_name="recipes_fixed_size_chunking", db_url=db_url),
    chunking_strategy=FixedSizeChunking(),
)
knowledge_base.load(recreate=False)  # Comment out after first run

agent = Agent(
    knowledge_base=knowledge_base,
    search_knowledge=True,
)

agent.print_response("How to make Thai curry?", markdown=True)
```

## Fixed Size Chunking Params

<Snippet file="chunking-fixed-size.mdx" />


# Fixed Size Chunking

Fixed size chunking is a method of splitting documents into smaller chunks of a specified size, with optional overlap between chunks. This is useful when you want to process large documents in smaller, manageable pieces.

## Usage

```python
from agno.agent import Agent
from agno.document.chunking.fixed import FixedSizeChunking
from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
from agno.vectordb.pgvector import PgVector

db_url = "postgresql+psycopg://ai:ai@localhost:5532/ai"

knowledge_base = PDFUrlKnowledgeBase(
    urls=["https://agno-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"],
    vector_db=PgVector(table_name="recipes_fixed_size_chunking", db_url=db_url),
    chunking_strategy=FixedSizeChunking(),
)
knowledge_base.load(recreate=False)  # Comment out after first run

agent = Agent(
    knowledge_base=knowledge_base,
    search_knowledge=True,
)

agent.print_response("How to make Thai curry?", markdown=True)
```

## Fixed Size Chunking Params

<Snippet file="chunking-fixed-size.mdx" />


# Semantic Chunking

Semantic chunking is a method of splitting documents into smaller chunks by analyzing semantic similarity between text segments using embeddings. It uses the chonkie library to identify natural breakpoints where the semantic meaning changes significantly, based on a configurable similarity threshold. This helps preserve context and meaning better than fixed-size chunking by ensuring semantically related content stays together in the same chunk, while splitting occurs at meaningful topic transitions.

```python
from agno.agent import Agent
from agno.document.chunking.semantic import SemanticChunking
from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
from agno.vectordb.pgvector import PgVector

db_url = "postgresql+psycopg://ai:ai@localhost:5532/ai"

knowledge_base = PDFUrlKnowledgeBase(
    urls=["https://agno-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"],
    vector_db=PgVector(table_name="recipes_semantic_chunking", db_url=db_url),
    chunking_strategy=SemanticChunking(),
)
knowledge_base.load(recreate=False)  # Comment out after first run

agent = Agent(
    knowledge_base=knowledge_base,
    search_knowledge=True,
)

agent.print_response("How to make Thai curry?", markdown=True)

```

## Semantic Chunking Params

<Snippet file="chunking-semantic.mdx" />


# Recursive Chunking

Recursive chunking is a method of splitting documents into smaller chunks by recursively applying a chunking strategy. This is useful when you want to process large documents in smaller, manageable pieces.

```python
from agno.agent import Agent
from agno.document.chunking.recursive import RecursiveChunking
from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
from agno.vectordb.pgvector import PgVector

db_url = "postgresql+psycopg://ai:ai@localhost:5532/ai"

knowledge_base = PDFUrlKnowledgeBase(
    urls=["https://agno-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"],
    vector_db=PgVector(table_name="recipes_recursive_chunking", db_url=db_url),
    chunking_strategy=RecursiveChunking(),
)
knowledge_base.load(recreate=False)  # Comment out after first run

agent = Agent(
    knowledge_base=knowledge_base,
    search_knowledge=True,
)

agent.print_response("How to make Thai curry?", markdown=True)

```

## Recursive Chunking Params

<Snippet file="chunking-recursive.mdx" />


# Document Chunking

Document chunking is a method of splitting documents into smaller chunks based on document structure like paragraphs and sections. It analyzes natural document boundaries rather than splitting at fixed character counts. This is useful when you want to process large documents while preserving semantic meaning and context.

## Usage

```python
from agno.agent import Agent
from agno.document.chunking.document import DocumentChunking
from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
from agno.vectordb.pgvector import PgVector

db_url = "postgresql+psycopg://ai:ai@localhost:5532/ai"

knowledge_base = PDFUrlKnowledgeBase(
    urls=["https://agno-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"],
    vector_db=PgVector(table_name="recipes_document_chunking", db_url=db_url),
    chunking_strategy=DocumentChunking(),
)
knowledge_base.load(recreate=False)  # Comment out after first run

agent = Agent(
    knowledge_base=knowledge_base,
    search_knowledge=True,
)

agent.print_response("How to make Thai curry?", markdown=True)

```

## Document Chunking Params

<Snippet file="chunking-document.mdx" />
