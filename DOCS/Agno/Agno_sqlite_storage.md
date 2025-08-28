# Sqlite Storage

Agno supports using Sqlite as a storage backend for Agents using the `SqliteStorage` class.

## Usage

You need to provide either `db_url`, `db_file` or `db_engine`. The following example uses `db_file`.

```python sqlite_storage_for_agent.py
from agno.storage.sqlite import SqliteStorage

# Create a storage backend using the Sqlite database
storage = SqliteStorage(
    # store sessions in the ai.sessions table
    table_name="agent_sessions",
    # db_file: Sqlite database file
    db_file="tmp/data.db",
)

# Add storage to the Agent
agent = Agent(storage=storage)
```

## Params

<Snippet file="storage-sqlite-params.mdx" />

## Developer Resources

* View [Cookbook](https://github.com/agno-agi/agno/blob/main/cookbook/storage/sqllite_storage/sqlite_storage_for_agent.py)
