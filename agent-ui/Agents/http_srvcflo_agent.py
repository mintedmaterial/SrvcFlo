#!/usr/bin/env python3
"""
HTTP Wrapper for SrvcFlo Team Agent
Preserves existing Agno functionality while adding HTTP API access
Run this from: C:\\Users\\PC\\ServiceApp\\myserviceprovider-app\\Agents\\
Using venv: C:\\Users\\PC\\ServiceApp\\myserviceprovider-app\\.venv
"""

import os
import sys
import json
import asyncio
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Ensure we're using the correct virtual environment
current_dir = Path(__file__).parent
project_root = current_dir.parent
venv_path = project_root / '.venv' / 'Scripts' / 'python.exe'

print(f"Python Using: {sys.executable}")
print(f"Project root: {project_root}")
print(f"Expected venv: {venv_path}")

# Import the existing Agno agent
try:
    from srvcflo_team_agent import srvcflo_team_lead, serviceflow_ai_team
    print("Successfully imported SrvcFlo team agents")
except ImportError as e:
    print(f"❌ Failed to import SrvcFlo agents: {e}")
    sys.exit(1)

# Load environment variables
dotenv_path = project_root / '.env'
load_dotenv(dotenv_path=dotenv_path)
print(f"Loading .env from: {dotenv_path}")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Authentication middleware
def verify_api_key():
    """Verify the API key from the request headers"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    
    api_key = auth_header.replace('Bearer ', '')
    expected_key = os.getenv('SRVCFLO_AGENT_TOKEN', 'default-token')
    
    return api_key == expected_key

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'SrvcFlo Team Agent HTTP Wrapper',
        'timestamp': datetime.now().isoformat(),
        'agno_agents': {
            'team_lead': srvcflo_team_lead.name,
            'team_members': len(serviceflow_ai_team.members)
        }
    })

@app.route('/srvcflo-agent', methods=['POST'])
def chat_with_srvcflo():
    """
    Main chat endpoint for SrvcFlo Team Lead Agent
    Routes requests intelligently to appropriate team members
    """
    # Verify authentication
    if not verify_api_key():
        return jsonify({
            'success': False,
            'error': 'Invalid or missing API key'
        }), 401
    
    try:
        # Parse request data
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        message = data.get('message', '')
        user_id = data.get('user_id', 'anonymous')
        context = data.get('context', {})
        
        if not message:
            return jsonify({
                'success': False,
                'error': 'Message is required'
            }), 400
        
        # Determine routing based on message content
        use_team = should_use_team_routing(message)
        
        if use_team:
            # Use the team for complex requests that need routing
            response = serviceflow_ai_team.run(
                message=message,
                user_id=user_id
            )
            agent_used = "ServiceFlow AI Team (Routed)"
        else:
            # Use the team lead directly for general requests
            response = srvcflo_team_lead.run(
                message=message,
                user_id=user_id
            )
            agent_used = "SrvcFlo Team Lead"
        
        # Format the response
        return jsonify({
            'success': True,
            'response': response.content if hasattr(response, 'content') else str(response),
            'agent_used': agent_used,
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'context': {
                'routing_decision': 'team' if use_team else 'lead',
                'message_length': len(message),
                **context
            }
        })
        
    except Exception as e:
        print(f"Error in SrvcFlo chat endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/agno-assist', methods=['POST'])
def chat_with_agno_assist():
    """
    Endpoint for Agno Assist agent
    For code generation and technical assistance
    """
    # Verify authentication
    if not verify_api_key():
        return jsonify({
            'success': False,
            'error': 'Invalid or missing API key'
        }), 401
    
    try:
        # Import agno_assist here to avoid circular imports
        from agno_assist import agno_assist
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        message = data.get('message', '')
        user_id = data.get('user_id', 'anonymous')
        
        if not message:
            return jsonify({
                'success': False,
                'error': 'Message is required'
            }), 400
        
        # Call the Agno Assist agent
        response = agno_assist.run(
            message=message,
            user_id=user_id
        )
        
        return jsonify({
            'success': True,
            'response': response.content if hasattr(response, 'content') else str(response),
            'agent_used': "Agno Assist",
            'user_id': user_id,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error in Agno Assist endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

def should_use_team_routing(message):
    """
    Determine if the message should be routed to the team or handled by team lead
    """
    # Keywords that indicate specific expertise needed
    research_keywords = ['research', 'statistics', 'data', 'market', 'trends']
    content_keywords = ['blog', 'write', 'content', 'article', 'copy']
    social_keywords = ['social', 'twitter', 'facebook', 'instagram', 'linkedin']
    tech_keywords = ['deploy', 'technical', 'error', 'api', 'integration']
    strategy_keywords = ['strategy', 'business', 'growth', 'competitive']
    
    message_lower = message.lower()
    
    # Check if message contains specific expertise keywords
    for keywords in [research_keywords, content_keywords, social_keywords, tech_keywords, strategy_keywords]:
        if any(keyword in message_lower for keyword in keywords):
            return True
    
    # For general questions, use team lead directly
    return False

@app.route('/chat/route', methods=['POST'])
def route_chat_request():
    """
    Generic routing endpoint that determines the best agent for the request
    """
    if not verify_api_key():
        return jsonify({
            'success': False,
            'error': 'Invalid or missing API key'
        }), 401
    
    try:
        data = request.get_json()
        message = data.get('message', '')
        intent = data.get('intent', '')
        
        # Determine which endpoint to route to based on content
        if any(keyword in message.lower() for keyword in ['code', 'agno', 'framework', 'generate', 'script']):
            # Route to Agno Assist
            return chat_with_agno_assist()
        else:
            # Route to SrvcFlo team
            return chat_with_srvcflo()
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Routing error: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("Starting SrvcFlo Team Agent HTTP Server...")
    print(f"Team Lead: {srvcflo_team_lead.name}")
    print(f"Team Members: {len(serviceflow_ai_team.members)}")
    print("Authentication: API Key required")
    print("CORS: Enabled for all origins")
    print("Endpoints:")
    print("   GET  /health - Health check")
    print("   POST /srvcflo-agent - Main SrvcFlo chat")
    print("   POST /agno-assist - Agno framework assistance")
    print("   POST /chat/route - Automatic routing")
    
    # Run the Flask app
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('SRVCFLO_PORT', 8000)),
        debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    )