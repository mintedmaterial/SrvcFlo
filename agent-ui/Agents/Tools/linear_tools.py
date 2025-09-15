#!/usr/bin/env python3
"""
Linear API Integration for ServiceFlow AI
Provides Linear project management and GitHub integration
"""

import os
import requests
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import json
from datetime import datetime

@dataclass
class LinearIssue:
    id: str
    title: str
    description: str
    state: str
    priority: int
    assignee_id: Optional[str] = None
    team_id: Optional[str] = None
    labels: List[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class LinearAPI:
    """Linear API integration for project management and GitHub sync"""
    
    def __init__(self, api_token: Optional[str] = None):
        self.api_token = api_token or os.getenv("LINEAR_API_TOKEN")
        self.base_url = "https://api.linear.app/graphql"
        self.headers = {
            "Authorization": f"Bearer {self.api_token}" if self.api_token else "",
            "Content-Type": "application/json"
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def _make_request(self, query: str, variables: Optional[Dict] = None) -> Dict[str, Any]:
        """Make GraphQL request to Linear API"""
        if not self.api_token:
            return {
                "error": "LINEAR_API_TOKEN not configured",
                "message": "Please set LINEAR_API_TOKEN environment variable"
            }
        
        payload = {
            "query": query,
            "variables": variables or {}
        }
        
        try:
            response = self.session.post(self.base_url, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {
                "error": "API request failed",
                "message": str(e)
            }
    
    def get_teams(self) -> Dict[str, Any]:
        """Get all teams from Linear workspace"""
        query = """
        query {
            teams {
                nodes {
                    id
                    name
                    key
                    description
                    private
                    issueCount
                }
            }
        }
        """
        return self._make_request(query)
    
    def get_issues(self, team_id: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
        """Get issues from Linear, optionally filtered by team"""
        variables = {"first": limit}
        if team_id:
            variables["filter"] = {"team": {"id": {"eq": team_id}}}
        
        query = """
        query GetIssues($first: Int, $filter: IssueFilter) {
            issues(first: $first, filter: $filter) {
                nodes {
                    id
                    title
                    description
                    priority
                    state {
                        name
                        type
                    }
                    assignee {
                        id
                        name
                        email
                    }
                    team {
                        id
                        name
                        key
                    }
                    labels {
                        nodes {
                            name
                            color
                        }
                    }
                    createdAt
                    updatedAt
                }
            }
        }
        """
        return self._make_request(query, variables)
    
    def create_issue(self, title: str, description: str, team_id: str, 
                    priority: int = 0, assignee_id: Optional[str] = None, 
                    labels: Optional[List[str]] = None) -> Dict[str, Any]:
        """Create a new issue in Linear"""
        variables = {
            "input": {
                "title": title,
                "description": description,
                "teamId": team_id,
                "priority": priority
            }
        }
        
        if assignee_id:
            variables["input"]["assigneeId"] = assignee_id
        
        if labels:
            # Note: In real implementation, you'd need to get label IDs
            # For now, we'll just include the label names in description
            variables["input"]["description"] += f"\n\nLabels: {', '.join(labels)}"
        
        query = """
        mutation CreateIssue($input: IssueCreateInput!) {
            issueCreate(input: $input) {
                success
                issue {
                    id
                    title
                    identifier
                    url
                }
            }
        }
        """
        return self._make_request(query, variables)
    
    def update_issue(self, issue_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing issue"""
        variables = {
            "id": issue_id,
            "input": updates
        }
        
        query = """
        mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
            issueUpdate(id: $id, input: $input) {
                success
                issue {
                    id
                    title
                    state {
                        name
                    }
                }
            }
        }
        """
        return self._make_request(query, variables)
    
    def get_user_info(self) -> Dict[str, Any]:
        """Get current user information"""
        query = """
        query {
            viewer {
                id
                name
                email
                admin
                organization {
                    id
                    name
                }
            }
        }
        """
        return self._make_request(query)
    
    def search_issues(self, search_term: str, limit: int = 20) -> Dict[str, Any]:
        """Search issues by title/description"""
        variables = {
            "first": limit,
            "filter": {
                "or": [
                    {"title": {"containsIgnoreCase": search_term}},
                    {"description": {"containsIgnoreCase": search_term}}
                ]
            }
        }
        
        query = """
        query SearchIssues($first: Int, $filter: IssueFilter) {
            issues(first: $first, filter: $filter) {
                nodes {
                    id
                    title
                    identifier
                    state {
                        name
                    }
                    team {
                        name
                        key
                    }
                    assignee {
                        name
                    }
                    url
                }
            }
        }
        """
        return self._make_request(query, variables)
    
    def create_github_issue_sync(self, repo_url: str, commit_hash: str, 
                                commit_message: str, team_id: str) -> Dict[str, Any]:
        """Create Linear issue from GitHub commit/push"""
        title = f"GitHub: {commit_message[:100]}"
        description = f"""
**GitHub Integration**

**Repository:** {repo_url}
**Commit:** {commit_hash}
**Message:** {commit_message}

**Timestamp:** {datetime.utcnow().isoformat()}Z

This issue was automatically created from a GitHub push event.
        """.strip()
        
        return self.create_issue(
            title=title,
            description=description,
            team_id=team_id,
            priority=1,
            labels=["github", "auto-created"]
        )
    
    def get_project_insights(self, team_id: Optional[str] = None) -> Dict[str, Any]:
        """Get project insights and statistics"""
        if not self.api_token:
            return {
                "error": "API not configured",
                "message": "Linear API integration not available without token"
            }
        
        # Get issues data
        issues_result = self.get_issues(team_id=team_id, limit=100)
        
        if "error" in issues_result:
            return issues_result
        
        try:
            issues = issues_result.get("data", {}).get("issues", {}).get("nodes", [])
            
            # Calculate insights
            total_issues = len(issues)
            states = {}
            priorities = {}
            assignees = {}
            
            for issue in issues:
                state = issue.get("state", {}).get("name", "Unknown")
                priority = issue.get("priority", 0)
                assignee = issue.get("assignee", {}).get("name", "Unassigned")
                
                states[state] = states.get(state, 0) + 1
                priorities[priority] = priorities.get(priority, 0) + 1
                assignees[assignee] = assignees.get(assignee, 0) + 1
            
            return {
                "success": True,
                "insights": {
                    "total_issues": total_issues,
                    "states_breakdown": states,
                    "priority_breakdown": priorities,
                    "assignee_breakdown": assignees,
                    "completion_rate": round(
                        (states.get("Done", 0) + states.get("Completed", 0)) / max(total_issues, 1) * 100, 2
                    )
                }
            }
        except Exception as e:
            return {
                "error": "Failed to analyze project data",
                "message": str(e)
            }

def test_linear_connection():
    """Test Linear API connection"""
    linear = LinearAPI()
    if not linear.api_token:
        print("⚠️  LINEAR_API_TOKEN not configured")
        return False
    
    try:
        result = linear.get_user_info()
        if "error" in result:
            print(f"❌ Linear API connection failed: {result.get('message')}")
            return False
        
        user_data = result.get("data", {}).get("viewer", {})
        print(f"✅ Linear API connected successfully")
        print(f"   User: {user_data.get('name')} ({user_data.get('email')})")
        print(f"   Organization: {user_data.get('organization', {}).get('name')}")
        return True
    except Exception as e:
        print(f"❌ Linear API test failed: {e}")
        return False

if __name__ == "__main__":
    test_linear_connection()