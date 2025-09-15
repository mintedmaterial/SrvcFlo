"""
E2B Tools for ServiceFlow AI
Code execution environment tools
"""

import os
import asyncio
from typing import Dict, Any

def execute_python_code(code: str) -> Dict[str, Any]:
    """Execute Python code in a safe environment
    
    Args:
        code (str): Python code to execute
        
    Returns:
        Dict[str, Any]: Execution result
    """
    try:
        # This would integrate with E2B service when API key is available
        # For now, return a placeholder response
        return {
            "result": "E2B execution environment not configured. Please set E2B_API_KEY environment variable.",
            "status": "info",
            "code": code
        }
    except Exception as e:
        return {
            "error": str(e),
            "status": "error"
        }

# Configure multiple MCP servers for trading and data access
async def setup_trading_agent():
    # Initialize multiple MCP servers
    mcp_tools = MultiMCPTools([
        # Financial data MCP server (example)
        "npx -y @financial/mcp-server-yahoo-finance",
        # Database MCP server for storing strategies
        "npx -y @modelcontextprotocol/server-sqlite",
        # GitHub MCP for version control of strategies
        "npx -y @modelcontextprotocol/server-github",
    ], env={
        **os.environ,
        "GITHUB_TOKEN": os.getenv("GITHUB_TOKEN"),
        "YAHOO_FINANCE_API_KEY": os.getenv("YAHOO_FINANCE_API_KEY"),
    })
    
    # Connect to MCP servers
    await mcp_tools.connect()
    
    return mcp_tools

# Create the trading strategy agent
async def create_trading_agent():
    mcp_tools = await setup_trading_agent()
    
    agent = Agent(
        name="Trading Strategy Execution Platform",
        agent_id="trading-platform",
        model=OpenAIChat(id="gpt-4o"),
        tools=[e2b_tools, mcp_tools],
        markdown=True,
        show_tool_calls=True,
        instructions=[
            "You are an expert trading strategy developer and execution platform.",
            "Your capabilities include:",
            "1. Writing, testing, and executing Python trading strategies in a secure sandbox",
            "2. Accessing financial data through MCP servers",
            "3. Managing strategy repositories and version control",
            "4. Running backtests and live trading simulations",
            "5. Storing and retrieving trading data and results",
            "6. Providing comprehensive strategy analysis and reporting",
            "",
            "Security Guidelines:",
            "- Always execute trading code in the E2B sandbox first",
            "- Validate all financial data before processing",
            "- Never execute real trades without explicit user confirmation",
            "- Log all strategy executions and results",
            "",
            "Code Standards:",
            "- Use proper error handling and logging",
            "- Include risk management in all strategies",
            "- Document strategy parameters and assumptions",
            "- Provide clear performance metrics and visualizations",
        ],
    )
    
    return agent, mcp_tools

# Example usage functions
async def run_trading_examples():
    agent, mcp_tools = await create_trading_agent()
    
    try:
        # Example 1: Create a simple moving average strategy
        await agent.aprint_response("""
        Create a Python trading strategy that implements a simple moving average crossover:
        - Use 20-day and 50-day moving averages
        - Generate buy signals when short MA crosses above long MA
        - Generate sell signals when short MA crosses below long MA
        - Include proper risk management (stop loss at 2%)
        - Backtest on AAPL data for the last year
        - Visualize the results with matplotlib
        """)
        
        # Example 2: Portfolio optimization strategy
        await agent.aprint_response("""
        Develop a portfolio optimization script using Modern Portfolio Theory:
        - Select 5 tech stocks (AAPL, MSFT, GOOGL, AMZN, TSLA)
        - Calculate optimal weights for maximum Sharpe ratio
        - Include correlation analysis and risk metrics
        - Generate efficient frontier visualization
        - Save results to database via MCP
        """)
        
        # Example 3: Real-time market monitoring
        await agent.aprint_response("""
        Create a real-time market monitoring system that:
        - Connects to financial data feeds via MCP
        - Monitors multiple stocks for unusual volume or price movements
        - Implements basic technical indicators (RSI, MACD, Bollinger Bands)
        - Sends alerts when conditions are met
        - Logs all events to database
        """)
        
        # Example 4: Strategy backtesting framework
        await agent.aprint_response("""
        Build a comprehensive backtesting framework that:
        - Loads historical data from MCP data sources
        - Supports multiple strategy types
        - Calculates key performance metrics (Sharpe, Sortino, Max Drawdown)
        - Generates detailed performance reports
        - Compares strategies side-by-side
        - Exports results in multiple formats
        """)
        
        # Example 5: Risk management system
        await agent.aprint_response("""
        Implement a risk management system for trading strategies:
        - Position sizing based on Kelly Criterion
        - Portfolio-level risk limits
        - Real-time P&L monitoring
        - Automatic stop-loss execution
        - Risk reporting and alerts
        - Integration with existing strategies
        """)
        
    finally:
        # Clean up MCP connections
        await mcp_tools.close()

# Synchronous wrapper for easier usage
def run_trading_platform():
    asyncio.run(run_trading_examples())

if __name__ == "__main__":
    run_trading_platform()