#!/usr/bin/env python3
"""
Agno Assist Agent - ServiceFlow AI
Simple agent for assistance using our local documentation
"""

import os
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.storage.sqlite import SqliteStorage
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.file import FileTools

# Simple Agno Assist Agent
agno_assist = Agent(
    name="Agno Assistant",
    model=OpenAIChat(id="gpt-4o"),
    tools=[
        DuckDuckGoTools(),
        FileTools()
    ],
    instructions=[
        "You are Agno Assistant for ServiceFlow AI development",
        "You help with Agno framework questions and ServiceFlow development",
        "You have access to file tools to read local documentation",
        "Use DuckDuckGo to search for current Agno information",
        "Reference the ServiceFlow DOCS folder when available",
        "Provide helpful coding assistance and best practices"
    ],
    storage=SqliteStorage(
        table_name="agno_assist",
        db_file="tmp/agno_assist.db"
    ),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)