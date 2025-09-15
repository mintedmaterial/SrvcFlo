"""
ServiceFlow AI Teams Package

This package contains multi-agent team implementations:

- sonic_content_team: Content creation and social media management team
- sonic_finance_team: Financial analysis and investment research team  
- sonic_research_team: Research coordination and analysis team
- sonic_research_team_improved: Enhanced research team with better coordination
- srvcflo_team_agent: ServiceFlow AI specialized team agent
"""

try:
    from .sonic_content_team import *
    from .sonic_finance_team import *
    from .sonic_research_team import *
    from .sonic_research_team_improved import *
    from .srvcflo_team_agent import *
except ImportError as e:
    print(f"Warning: Could not import some teams: {e}")

__all__ = [
    "sonic_content_team",
    "sonic_finance_team", 
    "sonic_research_team",
    "sonic_research_team_improved",
    "srvcflo_team_agent"
]