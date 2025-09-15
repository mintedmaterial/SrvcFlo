#!/usr/bin/env python3
"""
Sonic Research Team - Multi-Agent Collaborative Research System
Coordinates multiple specialized agents for comprehensive Sonic ecosystem analysis
"""

import os
import json
import logging
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass
from agno.agent import Agent
from agno.team import Team
from agno.models.openai import OpenAIChat
from agno.storage.mongodb import MongoDbStorage
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.mongodb import MongoMemoryDb
from agno.tools.duckduckgo import DuckDuckGoTools

logger = logging.getLogger(__name__)

@dataclass
class ResearchSession:
    """Represents a collaborative research session"""
    session_id: str
    topic: str
    start_time: datetime
    participants: List[str]
    findings: Dict[str, Any]
    status: str = "active"
    
class SonicResearchTeam:
    """Coordinates multi-agent research sessions for Sonic ecosystem"""
    
    def __init__(self, mongodb_uri: str):
        self.mongodb_uri = mongodb_uri
        self.agents = {}
        self.active_sessions = {}
        self.research_history = []
        self._initialize_agents()
    
    def _initialize_agents(self):
        """Initialize specialized research agents"""
        
        # Finance Research Agent
        self.agents["finance"] = self._create_finance_agent()
        
        # Crypto Market Agent  
        self.agents["crypto"] = self._create_crypto_agent()
        
        # Social Sentiment Agent
        self.agents["social"] = self._create_social_agent()
        
        # Technical Analysis Agent
        self.agents["technical"] = self._create_technical_agent()
    
    def _create_finance_agent(self) -> Agent:
        """Create finance research specialist"""
        storage = MongoDbStorage(
            collection_name="finance_research_agent",
            db_url=self.mongodb_uri,
            db_name="myserviceprovider"
        )
        
        memory_db = MongoMemoryDb(
            collection_name="finance_research_memories",
            db_url=self.mongodb_uri,
            db_name="myserviceprovider"
        )
        
        return Agent(
            name="Sonic Finance Researcher",
            model=OpenAIChat(id="gpt-4o"),
            tools=[DuckDuckGoTools()],
            instructions=[
                "You are a DeFi and financial analysis specialist for the Sonic ecosystem.",
                "Analyze liquidity pools, yield farming opportunities, and token economics.",
                "Research DEX pairs, trading volumes, and market trends.",
                "Provide detailed financial metrics and risk assessments.",
                "Focus on Sonic blockchain DeFi protocols and opportunities.",
                "Use data to support your analysis and recommendations.",
                "Collaborate with other research team members to provide comprehensive insights."
            ],
            storage=storage,
            memory=Memory(model=OpenAIChat(id="gpt-4o"), db=memory_db),
            enable_agentic_memory=True,
            enable_user_memories=True,
            markdown=True,
            monitoring=True
        )
    
    def _create_crypto_agent(self) -> Agent:
        """Create crypto market specialist"""
        storage = MongoDbStorage(
            collection_name="crypto_research_agent", 
            db_url=self.mongodb_uri,
            db_name="myserviceprovider"
        )
        
        memory_db = MongoMemoryDb(
            collection_name="crypto_research_memories",
            db_url=self.mongodb_uri,
            db_name="myserviceprovider"
        )
        
        return Agent(
            name="Sonic Crypto Analyst",
            model=OpenAIChat(id="gpt-4o"),
            tools=[DuckDuckGoTools()],
            instructions=[
                "You are a cryptocurrency market analyst specializing in Sonic ecosystem tokens.",
                "Analyze price movements, market cap trends, and trading patterns.",
                "Research upcoming launches, partnerships, and ecosystem developments.",
                "Monitor competitor blockchains and comparative advantages.",
                "Provide market outlook and investment thesis for Sonic projects.",
                "Track whale movements and significant wallet activities.",
                "Collaborate with the research team to provide market context."
            ],
            storage=storage,
            memory=Memory(model=OpenAIChat(id="gpt-4o"), db=memory_db),
            enable_agentic_memory=True,
            enable_user_memories=True,
            markdown=True,
            monitoring=True
        )
    
    def _create_social_agent(self) -> Agent:
        """Create social sentiment specialist"""
        storage = MongoDbStorage(
            collection_name="social_research_agent",
            db_url=self.mongodb_uri,
            db_name="myserviceprovider"
        )
        
        memory_db = MongoMemoryDb(
            collection_name="social_research_memories",
            db_url=self.mongodb_uri,
            db_name="myserviceprovider"
        )
        
        return Agent(
            name="Sonic Social Analyst",
            model=OpenAIChat(id="gpt-4o"),
            tools=[DuckDuckGoTools()],
            instructions=[
                "You are a social media and community sentiment analyst for Sonic ecosystem.",
                "Monitor Twitter, Discord, Telegram, and Reddit for Sonic-related discussions.",
                "Analyze community sentiment, engagement levels, and viral trends.",
                "Identify influential community members and key opinion leaders.",
                "Track social momentum and potential narrative shifts.",
                "Assess community growth and engagement quality.",
                "Provide social context to complement technical and financial analysis."
            ],
            storage=storage,
            memory=Memory(model=OpenAIChat(id="gpt-4o"), db=memory_db),
            enable_agentic_memory=True,
            enable_user_memories=True,
            markdown=True,
            monitoring=True
        )
    
    def _create_technical_agent(self) -> Agent:
        """Create technical analysis specialist"""
        storage = MongoDbStorage(
            collection_name="technical_research_agent",
            db_url=self.mongodb_uri,
            db_name="myserviceprovider"
        )
        
        memory_db = MongoMemoryDb(
            collection_name="technical_research_memories",
            db_url=self.mongodb_uri,
            db_name="myserviceprovider"
        )
        
        return Agent(
            name="Sonic Technical Analyst",
            model=OpenAIChat(id="gpt-4o"),
            tools=[DuckDuckGoTools()],
            instructions=[
                "You are a blockchain technical analyst specializing in Sonic infrastructure.",
                "Analyze network performance, transaction throughput, and scalability.",
                "Research technical developments, upgrades, and protocol improvements.",
                "Monitor validator performance and network security metrics.",
                "Assess smart contract activity and developer ecosystem growth.",
                "Evaluate technical partnerships and integration opportunities.",
                "Provide technical context for investment and development decisions."
            ],
            storage=storage,
            memory=Memory(model=OpenAIChat(id="gpt-4o"), db=memory_db),
            enable_agentic_memory=True,
            enable_user_memories=True,
            markdown=True,
            monitoring=True
        )
    
    async def create_research_session(self, topic: str, participants: List[str] = None) -> str:
        """Create a new collaborative research session"""
        if participants is None:
            participants = list(self.agents.keys())
        
        session_id = f"research_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        session = ResearchSession(
            session_id=session_id,
            topic=topic,
            start_time=datetime.now(),
            participants=participants,
            findings={}
        )
        
        self.active_sessions[session_id] = session
        logger.info(f"Created research session {session_id} for topic: {topic}")
        
        return session_id
    
    async def conduct_research(self, session_id: str, specific_questions: List[str] = None) -> Dict[str, Any]:
        """Conduct collaborative research session"""
        if session_id not in self.active_sessions:
            raise ValueError(f"Research session {session_id} not found")
        
        session = self.active_sessions[session_id]
        results = {}
        
        # Base questions if none provided
        if specific_questions is None:
            specific_questions = [
                f"What are the current market conditions for {session.topic}?",
                f"What are the key technical developments in {session.topic}?", 
                f"What is the community sentiment around {session.topic}?",
                f"What are the financial opportunities in {session.topic}?"
            ]
        
        # Assign questions to appropriate agents
        question_assignments = {
            "finance": [q for q in specific_questions if any(keyword in q.lower() 
                       for keyword in ["financial", "defi", "yield", "liquidity", "trading"])],
            "crypto": [q for q in specific_questions if any(keyword in q.lower()
                      for keyword in ["market", "price", "token", "investment", "cap"])],
            "social": [q for q in specific_questions if any(keyword in q.lower()
                      for keyword in ["sentiment", "community", "social", "engagement"])],
            "technical": [q for q in specific_questions if any(keyword in q.lower()
                         for keyword in ["technical", "development", "network", "validator"])]
        }
        
        # If no specific assignments, give all questions to all agents
        if not any(question_assignments.values()):
            for agent_name in session.participants:
                question_assignments[agent_name] = specific_questions
        
        # Conduct research with each agent
        for agent_name in session.participants:
            if agent_name not in self.agents:
                logger.warning(f"Agent {agent_name} not available")
                continue
            
            agent = self.agents[agent_name]
            agent_questions = question_assignments.get(agent_name, [])
            
            if not agent_questions:
                continue
            
            agent_results = []
            for question in agent_questions:
                try:
                    logger.info(f"Agent {agent_name} researching: {question}")
                    response = await agent.arun(question)
                    agent_results.append({
                        "question": question,
                        "response": response.content,
                        "timestamp": datetime.now().isoformat()
                    })
                except Exception as e:
                    logger.error(f"Error with agent {agent_name} on question '{question}': {e}")
                    agent_results.append({
                        "question": question,
                        "error": str(e),
                        "timestamp": datetime.now().isoformat()
                    })
            
            results[agent_name] = agent_results
        
        # Store findings in session
        session.findings.update(results)
        
        return results
    
    async def synthesize_findings(self, session_id: str) -> str:
        """Synthesize findings from all agents into a comprehensive report"""
        if session_id not in self.active_sessions:
            raise ValueError(f"Research session {session_id} not found")
        
        session = self.active_sessions[session_id]
        
        # Create synthesis prompt
        synthesis_prompt = f"""
        Analyze and synthesize the following research findings about {session.topic}:
        
        """
        
        for agent_name, findings in session.findings.items():
            synthesis_prompt += f"\n## {agent_name.title()} Analysis:\n"
            for finding in findings:
                if "response" in finding:
                    synthesis_prompt += f"Q: {finding['question']}\n"
                    synthesis_prompt += f"A: {finding['response']}\n\n"
        
        synthesis_prompt += """
        Please provide a comprehensive synthesis that:
        1. Identifies key themes and patterns across all agent findings
        2. Highlights any contradictions or areas of uncertainty
        3. Provides actionable insights and recommendations
        4. Summarizes the overall outlook for the researched topic
        
        Format as a well-structured research report with clear sections and bullet points.
        """
        
        # Use the crypto agent to synthesize (could be any agent)
        synthesizer = self.agents["crypto"]
        try:
            synthesis_response = await synthesizer.arun(synthesis_prompt)
            synthesized_report = synthesis_response.content
        except Exception as e:
            logger.error(f"Error synthesizing findings: {e}")
            synthesized_report = f"Error synthesizing findings: {str(e)}"
        
        # Store synthesized report
        session.findings["synthesis"] = {
            "report": synthesized_report,
            "timestamp": datetime.now().isoformat()
        }
        
        return synthesized_report
    
    async def complete_session(self, session_id: str) -> Dict[str, Any]:
        """Complete research session and return final report"""
        if session_id not in self.active_sessions:
            raise ValueError(f"Research session {session_id} not found")
        
        session = self.active_sessions[session_id]
        session.status = "completed"
        
        # Move to history
        self.research_history.append(session)
        del self.active_sessions[session_id]
        
        final_report = {
            "session_id": session_id,
            "topic": session.topic,
            "duration": (datetime.now() - session.start_time).total_seconds(),
            "participants": session.participants,
            "findings": session.findings,
            "status": session.status
        }
        
        logger.info(f"Completed research session {session_id}")
        return final_report

# Example usage
async def main():
    """Example usage of Sonic Research Team"""
    
    mongodb_uri = os.getenv("MONGODB_URI") or os.getenv("MONGODB_URL", "")
    if "?" in mongodb_uri:
        mongodb_uri += "&ssl=true&ssl_cert_reqs=CERT_NONE&tlsAllowInvalidCertificates=true"
    else:
        mongodb_uri += "?ssl=true&ssl_cert_reqs=CERT_NONE&tlsAllowInvalidCertificates=true"
    
    # Initialize research team
    research_team = SonicResearchTeam(mongodb_uri)
    
    # Create research session
    session_id = await research_team.create_research_session(
        "Sonic DeFi Ecosystem Q1 2025 Outlook"
    )
    
    # Conduct research
    questions = [
        "What are the major DeFi protocols launching on Sonic in Q1 2025?",
        "How does Sonic's transaction speed compare to other Layer 1 blockchains?",
        "What is the current community sentiment around Sonic's roadmap?",
        "What are the yield farming opportunities on Sonic DEXes?"
    ]
    
    findings = await research_team.conduct_research(session_id, questions)
    print("Research findings:", json.dumps(findings, indent=2, default=str))
    
    # Synthesize findings
    report = await research_team.synthesize_findings(session_id)
    print("\nSynthesized Report:")
    print(report)
    
    # Complete session
    final_report = await research_team.complete_session(session_id)
    print("\nFinal Report:", json.dumps(final_report, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(main())