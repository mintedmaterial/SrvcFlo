# Python Style Guide agents-ui/Agents


## Structure Rules

-Use 4 spaces for indentation (Python standard)
-Place imports at the top, grouped by type
-Use descriptive variable names for agents and tools
-Keep agent configuration readable with proper line breaks


## Import Organization


## Standard library imports first


from pathlib import Path
from textwrap import dedent

## Import Organization Extended

import asyncio
from pathlib import Path
from textwrap import dedent
from typing import Iterator, List, Dict, Any

## Third-party imports

from pydantic import BaseModel, Field

## Agno Framework Imports 

from agno.agent import Agent
from agno.team import Team
from agno.workflow import Workflow
from agno.models.openai import OpenAIChat
from agno.models.anthropic import Claude
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.reasoning import ReasoningTools
from agno.storage.sqlite import SqliteStorage
from agno.playground import Playground


## Agent Configuration Formatting

-Place each parameter on its own line
-Align parameters vertically
-Group related parameters together
-Use descriptive names for agents


## Example Agent Structure

## Basic Agent Setup


web_agent = Agent(
    name="Web Research Agent",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],
    instructions=[
        "Always include sources",
        "Use tables to display data"
    ],
    storage=SqliteStorage(
        table_name="web_agent",
        db_file="tmp/agents.db"
    ),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

## Agent Execution

-response = agent.run("What's happening in AI?")
-print(response.content)


## Best Practices 

-Always use agent.run() to capture responses
-Include error handling and type hints
-Add comprehensive comments explaining functionality
-Use environment variables for API keys
-Store agent data in databases for persistence



## Example Playground Configuration

## Playground Setup with Multiple Agents


playground_storage = "tmp/agents.db"

## Define agents for playground


web_agent = Agent(
    name="Web Research Agent",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],
    instructions=[
        "Always include sources",
        "Use tables to display data"
    ],
    storage=SqliteStorage(
        table_name="web_agent",
        db_file=playground_storage
    ),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

research_agent = Agent(
    name="Research Agent", 
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools(search=True, news=True)],
    instructions=["Always use tables to display data"],
    storage=SqliteStorage(
        table_name="research_agent",
        db_file=playground_storage
    ),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

## Create playground

playground = Playground(
    agents=[web_agent, research_agent],
    name="Research Playground",
    description="Multi-agent research platform",
    app_id="research-playground"
)

## Get FastAPI app

app = playground.get_app()

## Serve playground

if __name__ == "__main__":
    playground.serve("playground:app", reload=True)


## Advanced Agent Configuration

## Advanced Agent with Memory and Knowledge


advanced_agent = Agent(
    name="Advanced Research Agent",
    agent_id="advanced_research_agent",
    model=OpenAIChat(id="gpt-4o"),
    description=dedent("""
        Advanced AI agent specialized in comprehensive research
        and analysis with memory capabilities.
    """),
    instructions=dedent("""
        1. Analyze requests thoroughly before proceeding
        2. Use multiple sources for comprehensive research
        3. Provide structured, well-formatted responses
        4. Remember user preferences and context
        5. Include citations and references
    """),
    tools=[
        DuckDuckGoTools(search=True, news=True),
        ReasoningTools(add_instructions=True),
    ],
    storage=SqliteStorage(
        table_name="advanced_agent_sessions",
        db_file="tmp/advanced_agents.db",
        auto_upgrade_schema=True,
    ),
    add_history_to_messages=True,
    num_history_responses=10,
    add_datetime_to_instructions=True,
    markdown=True,
    show_tool_calls=True,
)


## Team Configuration

## Multi-Agent Team Setup

web_search_agent = Agent(
    name="Web Search Agent",
    role="Handle web search requests and general research",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],
    instructions="Always include sources",
    add_datetime_to_instructions=True,
)

news_analysis_agent = Agent(
    name="News Analysis Agent", 
    role="Handle news requests and current events analysis",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools(search=True, news=True)],
    instructions=[
        "Use tables to display news information",
        "Clearly state source and publication date",
        "Focus on current and relevant insights",
    ],
    add_datetime_to_instructions=True,
)

## Coordinated Team


research_team = Team(
    name="Research Team",
    mode="coordinate",
    model=Claude(id="claude-sonnet-4-20250514"),
    members=[web_search_agent, news_analysis_agent],
    tools=[ReasoningTools(add_instructions=True)],
    instructions=[
        "Collaborate to provide comprehensive research",
        "Consider both current events and background info",
        "Use tables and charts for clear presentation",
        "Present findings in structured format",
        "Only output final consolidated analysis",
    ],
    markdown=True,
    show_members_responses=True,
    enable_agentic_context=True,
    add_datetime_to_instructions=True,
    success_criteria=dedent("""
        Complete research analysis with data, visualizations,
        trend assessment, and actionable insights supported
        by current information and reliable sources.
    """),
)


## Workflow Configuration

## Advanced Workflow with Multiple Steps


class ResearchWorkflow(Workflow):
    """
    Multi-stage research workflow that orchestrates
    data gathering, analysis, and report generation.
    """
    
    # Define workflow agents
    searcher: Agent = Agent(
        name="Research Searcher",
        model=OpenAIChat(id="gpt-4o"),
        tools=[DuckDuckGoTools()],
        description="Expert at finding high-quality information",
        instructions=dedent("""
            1. Search for authoritative sources
            2. Extract key facts and statistics
            3. Cover multiple perspectives
            4. Organize findings clearly
            5. Include references and sources
        """),
    )
    
    analyst: Agent = Agent(
        name="Research Analyst",
        model=OpenAIChat(id="gpt-4o"),
        description="Synthesizes research into actionable insights",
        instructions=dedent("""
            1. Identify key themes and trends
            2. Highlight important findings
            3. Suggest areas for further investigation
            4. Present analysis in structured format
            5. Extract only actual reference links provided
        """),
    )
    
    writer: Agent = Agent(
        name="Report Writer",
        model=OpenAIChat(id="gpt-4o"),
        description="Creates polished, professional reports",
        instructions=dedent("""
            1. Write engaging introduction with context
            2. Organize findings into logical sections
            3. Use bullet points and tables for clarity
            4. Conclude with summary and recommendations
            5. Include references section if links provided
        """),
    )
    
    def run(self, topic: str) -> Iterator[RunResponse]:
        """
        Execute the complete research workflow.
        
        Args:
            topic: Research topic or question
            
        Yields:
            RunResponse: Streaming response from workflow
        """
        logger.info(f"Starting research workflow for: {topic}")
        
        # Step 1: Research phase
        research_content = self.searcher.run(topic)
        logger.info("Research phase completed")
        
        # Step 2: Analysis phase  
        analysis = self.analyst.run(research_content.content)
        logger.info("Analysis phase completed")
        
        # Step 3: Report writing phase
        logger.info("Report writing started")
        report = self.writer.run(analysis.content, stream=True)
        yield from report



## Async Workflow Pattern for Background Processing

async def run_background_workflow(query: str) -> str:
    """
    Run workflow as background task with polling.
    
    Args:
        query: Research query
        
    Returns:
        str: Final workflow result
    """
    workflow = ResearchWorkflow()
    
    # Start background execution
    bg_response = await workflow.arun(
        message=query,
        background=True
    )
    
    logger.info(f"Background workflow started: {bg_response.run_id}")
    
    # Poll for completion
    poll_count = 0
    while True:
        poll_count += 1
        result = workflow.get_run(bg_response.run_id)
        
        if result and result.has_completed():
            logger.info(f"Workflow completed after {poll_count} polls")
            return result.content
            
        if poll_count > 100:  # Timeout after 100 polls
            logger.error("Workflow timeout")
            break
            
        await asyncio.sleep(5)  # Poll every 5 seconds
    
    return "Workflow failed or timed out"


## Error Handling and Best Practices

### Comprehensive Error Handling

def safe_agent_execution(agent: Agent, message: str) -> str:
    """
    Execute agent with comprehensive error handling.
    
    Args:
        agent: Agno agent instance
        message: Input message
        
    Returns:
        str: Agent response or error message
    """
    try:
        response = agent.run(message)
        
        if response and response.content:
            return response.content
        else:
            logger.warning("Agent returned empty response")
            return "No response generated"
            
    except Exception as e:
        logger.error(f"Agent execution failed: {str(e)}")
        return f"Error: {str(e)}"



## Environment Configuration


def setup_environment():
    """Configure environment variables and API keys."""
    required_keys = [
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY", 
    ]
    
    missing_keys = [
        key for key in required_keys 
        if not os.getenv(key)
    ]
    
    if missing_keys:
        raise ValueError(
            f"Missing required environment variables: {missing_keys}"
        )




## Best Practices Summary

Best Practices Summary
-Always use descriptive names for agents, teams, and workflows
-Include comprehensive instructions with numbered steps
-Use proper error handling and logging throughout
-Store agent sessions in databases for persistence
-Add datetime and history to agent instructions
-Use streaming responses for better user experience
-Implement proper async patterns for background tasks
-Include type hints and docstrings for maintainability
-Group related configuration parameters together
-Use environment variables for API keys and sensitive data