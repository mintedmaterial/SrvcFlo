#!/usr/bin/env python3
"""
Tracing utilities for ServiceFlow AI agents using Langfuse

This module provides helper functions and decorators for adding comprehensive 
tracing to individual agents and their methods.
"""

import os
import functools
from typing import Any, Callable, Dict, Optional
from langfuse.decorators import observe, langfuse_context

def trace_agent_method(
    name: Optional[str] = None,
    capture_input: bool = True,
    capture_output: bool = True,
    as_type: Optional[str] = None
):
    """
    Decorator to add Langfuse tracing to agent methods
    
    Args:
        name: Custom name for the observation (defaults to method name)
        capture_input: Whether to capture method inputs
        capture_output: Whether to capture method outputs  
        as_type: Type of observation ("generation", "span", etc.)
    """
    def decorator(func: Callable) -> Callable:
        @observe(
            name=name or f"{func.__qualname__}",
            capture_input=capture_input,
            capture_output=capture_output,
            as_type=as_type
        )
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Add method metadata
            langfuse_context.update_current_observation(
                metadata={
                    "method": func.__name__,
                    "module": func.__module__,
                    "agent_class": args[0].__class__.__name__ if args else None,
                }
            )
            return func(*args, **kwargs)
        return wrapper
    return decorator

def trace_agent_response(
    agent_name: str,
    model_name: Optional[str] = None,
    capture_tokens: bool = True
):
    """
    Decorator specifically for agent response methods
    
    Args:
        agent_name: Name of the agent
        model_name: Name of the model being used
        capture_tokens: Whether to capture token usage
    """
    def decorator(func: Callable) -> Callable:
        @observe(
            name=f"{agent_name} Response",
            as_type="generation"
        )
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Extract query from args/kwargs
            query = None
            if args and len(args) > 1:
                query = args[1]  # Usually second argument after self
            elif 'query' in kwargs:
                query = kwargs['query']
            elif 'message' in kwargs:
                query = kwargs['message']
            
            # Update observation with agent details
            langfuse_context.update_current_observation(
                input=query,
                metadata={
                    "agent_name": agent_name,
                    "model": model_name,
                    "method": func.__name__,
                }
            )
            
            result = func(*args, **kwargs)
            
            # Capture output
            if hasattr(result, 'content'):
                output = result.content
            elif isinstance(result, str):
                output = result
            else:
                output = str(result)
                
            langfuse_context.update_current_observation(
                output=output
            )
            
            return result
        return wrapper
    return decorator

def create_agent_trace_context(
    agent_name: str,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    tags: Optional[list] = None
):
    """
    Create a trace context for an agent session
    
    Args:
        agent_name: Name of the agent
        user_id: Optional user identifier
        session_id: Optional session identifier  
        tags: Optional list of tags for the trace
    """
    langfuse_context.update_current_trace(
        name=f"{agent_name} Session",
        user_id=user_id,
        session_id=session_id,
        tags=tags or [agent_name.lower().replace(' ', '_')],
        metadata={
            "agent": agent_name,
            "environment": os.getenv("ENV", "development")
        }
    )

def add_agent_score(
    name: str,
    value: float,
    comment: Optional[str] = None,
    score_trace: bool = False
):
    """
    Add a score to the current observation or trace
    
    Args:
        name: Score identifier
        value: Score value (typically 0-1)
        comment: Optional comment about the score
        score_trace: Whether to score the entire trace vs current observation
    """
    if score_trace:
        langfuse_context.score_current_trace(
            name=name,
            value=value,
            comment=comment
        )
    else:
        langfuse_context.score_current_observation(
            name=name,
            value=value,
            comment=comment
        )

def flush_traces():
    """Flush any pending traces - useful for short-lived environments"""
    try:
        langfuse_context.flush()
    except Exception as e:
        print(f"Warning: Failed to flush traces: {e}")

# Pre-configured decorators for common agent operations
trace_scraping = lambda: trace_agent_method(as_type="span", name="Web Scraping Operation")
trace_content_generation = lambda: trace_agent_method(as_type="generation", name="Content Generation")
trace_api_call = lambda: trace_agent_method(as_type="span", name="API Call")
trace_database_operation = lambda: trace_agent_method(as_type="span", name="Database Operation")

# Example usage patterns:
"""
# For individual agent methods:
@trace_agent_method(name="Lead Generation Query", as_type="generation")
async def generate_leads(self, query: str):
    # Your method implementation
    pass

# For agent response methods:
@trace_agent_response("Content Creation Agent", model_name="gpt-4o")
async def create_post(self, topic: str):
    # Your method implementation  
    pass

# For creating trace contexts:
def start_agent_session(self, user_id: str):
    create_agent_trace_context(
        agent_name=self.name,
        user_id=user_id,
        session_id=f"session_{user_id}_{timestamp}",
        tags=["automation", "serviceflow"]
    )
"""