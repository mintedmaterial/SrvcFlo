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
