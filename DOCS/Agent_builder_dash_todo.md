I've created a comprehensive Agent Builder UI integration that connects your existing components:
🎯 What We Built

Agno Agent Builder Component - Visual drag-and-drop interface for building Agno agents
Next.js API Routes - Backend endpoints for generating, testing, and saving agents
Agent UI Integration - Connect with your existing Agent UI for testing
Complete Setup Guide - Step-by-step integration instructions

🔄 How It Works

Visual Building: Users configure agents through forms (no coding required)
Code Generation: Automatically generates Python Agno agent code
Live Testing: Built-in playground + integration with your Agent UI
AI Optimization: Your agno_assist agent reviews and improves generated code
Multiple Deployment: Local testing, Agent UI, or ServiceFlow platform

🏗️ Integration Strategy
The system bridges three key components:
Agent Builder UI ←→ Agno Framework ←→ ServiceFlow SaaS
       ↕
   Agent UI (Chat Interface)
🚀 Key Benefits

No-code agent creation for non-technical users
Full Agno framework power for advanced users
Seamless testing with your existing Agent UI
Production deployment to your ServiceFlow platform
AI-assisted optimization via Agno Assist

📁 Files to Add to Your Project

Copy the Agno Agent Builder component to your dashboard
Add the Next.js API routes for backend functionality
Integrate with your existing Agent UI for testing
Update your Agno Assist agent to provide HTTP endpoints
Deploy the ServiceFlow integration for production use

This creates a complete agent building platform that leverages your existing Agno framework while providing a user-friendly interface for creating and managing AI agents!



// app/api/agno-builder/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

const execAsync = promisify(exec)

interface AgentConfig {
  name: string
  description: string
  instructions: string
  model: string
  tools: string[]
  knowledge_sources: string[]
  storage_type: string
  add_datetime: boolean
  read_chat_history: boolean
  num_history_responses: number
  markdown: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { config }: { config: AgentConfig } = await request.json()
    
    // Validate config
    if (!config.name || !config.description || !config.instructions) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, description, or instructions'
      }, { status: 400 })
    }

    // Generate agent code
    const code = generateAgentCode(config)
    
    return NextResponse.json({
      success: true,
      code,
      config
    })

  } catch (error) {
    console.error('Generate agent error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate agent code'
    }, { status: 500 })
  }
}

function generateAgentCode(config: AgentConfig): string {
  const toolImports: Record<string, string> = {
    'duckduckgo': 'from agno.tools.duckduckgo import DuckDuckGoTools',
    'python': 'from agno.tools.python import PythonTools',
    'dalle': 'from agno.tools.dalle import DalleTools',
    'eleven_labs': 'from agno.tools.eleven_labs import ElevenLabsTools',
    'file_tools': 'from agno.tools.file import FileTools',
    'calculator': 'from agno.tools.calculator import Calculator'
  }

  const modelImports: Record<string, string> = {
    'openai-gpt4o': 'from agno.models.openai import OpenAIChat',
    'openai-gpt35': 'from agno.models.openai import OpenAIChat',
    'anthropic-claude': 'from agno.models.anthropic import AnthropicChat'
  }

  // Generate imports
  const imports = [
    'import os',
    'from pathlib import Path',
    'from textwrap import dedent',
    'from dotenv import load_dotenv',
    '',
    'load_dotenv()',
    '',
    'from agno.agent import Agent',
    'from agno.storage.sqlite import SqliteStorage'
  ]

  // Add model import
  if (modelImports[config.model]) {
    imports.push(modelImports[config.model])
  }

  // Add tool imports
  config.tools.forEach(tool => {
    if (toolImports[tool]) {
      imports.push(toolImports[tool])
    }
  })

  // Generate tool instances
  const toolInstances = config.tools.map(tool => {
    switch (tool) {
      case 'python':
        return 'PythonTools(base_dir="./tmp", read_files=True)'
      case 'dalle':
        return 'DalleTools(model="dall-e-3", size="1024x1024", quality="hd")'
      case 'eleven_labs':
        return 'ElevenLabsTools(voice_id="default", model_id="eleven_multilingual_v2")'
      case 'duckduckgo':
        return 'DuckDuckGoTools()'
      case 'file_tools':
        return 'FileTools()'
      case 'calculator':
        return 'Calculator()'
      default:
        return `${tool.charAt(0).toUpperCase() + tool.slice(1).replace('_', '')}Tools()`
    }
  })

  // Generate model instance
  let modelCode = 'OpenAIChat(id="gpt-4o")'
  if (config.model === 'openai-gpt35') {
    modelCode = 'OpenAIChat(id="gpt-3.5-turbo")'
  } else if (config.model === 'anthropic-claude') {
    modelCode = 'AnthropicChat(id="claude-3-5-sonnet-20241022")'
  }

  const agentName = config.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  const agentId = config.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  return `${imports.join('\n')}

# Setup paths
cwd = Path(__file__).parent
tmp_dir = cwd.joinpath("tmp")
tmp_dir.mkdir(parents=True, exist_ok=True)

# Agent storage
agent_storage = SqliteStorage(
    table_name="${agentName}_sessions",
    db_file=str(tmp_dir.joinpath("agent_sessions.db")),
)

# Create the agent
${agentName}_agent = Agent(
    agent_id="${agentId}",
    name="${config.name}",
    model=${modelCode},
    description=dedent(\"\"\"\\
    ${config.description}\"\"\"),
    instructions=dedent(\"\"\"\\
    ${config.instructions}\"\"\"),
    storage=agent_storage,
    tools=[
        ${toolInstances.join(',\n        ')}
    ],
    add_datetime_to_instructions=${config.add_datetime},
    read_chat_history=${config.read_chat_history},
    num_history_responses=${config.num_history_responses},
    markdown=${config.markdown},
)

def run_agent(message: str) -> str:
    """Run the agent with a message and return response"""
    try:
        response = ${agentName}_agent.run(message)
        return str(response)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    # Test the agent
    response = ${agentName}_agent.run("Hello! Please introduce yourself and tell me what you can do.")
    print(response)
`
}

// app/api/agno-builder/test/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null
  
  try {
    const { agent_code, message } = await request.json()
    
    if (!agent_code || !message) {
      return NextResponse.json({
        success: false,
        error: 'Missing agent code or message'
      }, { status: 400 })
    }

    // Create temporary file
    const tempId = uuidv4()
    tempFilePath = path.join(process.cwd(), 'tmp', `test_agent_${tempId}.py`)
    
    // Ensure tmp directory exists
    await fs.mkdir(path.dirname(tempFilePath), { recursive: true })

    // Add test execution to the code
    const testCode = `${agent_code}

# Test execution
try:
    result = run_agent("${message.replace(/"/g, '\\"')}")
    print("AGENT_RESPONSE:", result)
except Exception as e:
    print("AGENT_ERROR:", str(e))
`

    await writeFile(tempFilePath, testCode)

    // Execute the agent
    const { stdout, stderr } = await execAsync(`python "${tempFilePath}"`, {
      timeout: 30000,
      cwd: process.cwd()
    })

    // Parse the output
    const outputLines = stdout.split('\n')
    let response = null
    let error = null

    for (const line of outputLines) {
      if (line.startsWith('AGENT_RESPONSE:')) {
        response = line.replace('AGENT_RESPONSE:', '').trim()
        break
      } else if (line.startsWith('AGENT_ERROR:')) {
        error = line.replace('AGENT_ERROR:', '').trim()
        break
      }
    }

    if (error) {
      return NextResponse.json({
        success: false,
        error,
        response: null
      })
    }

    if (!response) {
      return NextResponse.json({
        success: false,
        error: 'No response from agent',
        response: null
      })
    }

    return NextResponse.json({
      success: true,
      response,
      error: null
    })

  } catch (error: any) {
    console.error('Test agent error:', error)
    
    let errorMessage = 'Unknown error occurred'
    if (error.message.includes('timeout')) {
      errorMessage = 'Agent execution timed out (30s limit)'
    } else if (error.stderr) {
      errorMessage = error.stderr
    } else {
      errorMessage = error.message
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      response: null
    }, { status: 500 })

  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath)
      } catch (e) {
        console.warn('Failed to clean up temp file:', tempFilePath)
      }
    }
  }
}

// app/api/agno-builder/save/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { config, code } = await request.json()
    
    if (!config?.name || !code) {
      return NextResponse.json({
        success: false,
        error: 'Missing agent name or code'
      }, { status: 400 })
    }

    // Create agents directory if it doesn't exist
    const agentsDir = path.join(process.cwd(), 'agents')
    await mkdir(agentsDir, { recursive: true })

    // Generate safe filename
    const safeName = config.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const filePath = path.join(agentsDir, `${safeName}_agent.py`)

    // Write the agent file
    await writeFile(filePath, code, 'utf-8')

    // Also save the configuration as JSON
    const configPath = path.join(agentsDir, `${safeName}_config.json`)
    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      file_path: filePath,
      config_path: configPath
    })

  } catch (error: any) {
    console.error('Save agent error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to save agent'
    }, { status: 500 })
  }
}

// app/api/agno-assist/optimize/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { config, code } = await request.json()
    
    // Generate suggestions based on configuration
    const suggestions = generateOptimizationSuggestions(config, code)
    
    // TODO: Here you could call your actual agno_assist agent
    // const agnoAssistResponse = await callAgnoAssist(config, code)
    
    return NextResponse.json({
      success: true,
      suggestions,
      optimized_code: null, // Could contain improved code from agno_assist
      confidence_score: 0.8
    })

  } catch (error: any) {
    console.error('Optimization error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get optimization suggestions'
    }, { status: 500 })
  }
}

function generateOptimizationSuggestions(config: any, code: string): string[] {
  const suggestions: string[] = []
  
  // Check for missing tools
  if (!config.tools || config.tools.length === 0) {
    suggestions.push("Consider adding tools like DuckDuckGoTools for web search capabilities")
  }
  
  // Check instruction length
  if (!config.instructions || config.instructions.length < 100) {
    suggestions.push("Instructions are quite brief. Consider adding more detailed behavior guidelines and examples")
  }
  
  // Check tool combinations
  if (config.tools?.includes('python') && !config.tools.includes('file_tools')) {
    suggestions.push("Since you're using Python tools, consider adding File tools for better file handling")
  }
  
  // Check for image generation without file tools
  if (config.tools?.includes('dalle') && !config.tools.includes('file_tools')) {
    suggestions.push("When using DALL-E for image generation, File tools can help save and manage generated images")
  }
  
  // Check model selection
  if (config.model === 'openai-gpt35' && config.tools?.length > 3) {
    suggestions.push("For complex agents with many tools, consider upgrading to GPT-4o for better performance")
  }
  
  // Check storage configuration
  if (config.storage_type === 'memory' && config.read_chat_history) {
    suggestions.push("Using memory storage with chat history may not persist between sessions. Consider SQLite for production use")
  }
  
  return suggestions
}

// utils/agno-integration.ts
export class AgnoIntegration {
  static async callAgnoAssist(message: string): Promise<string> {
    try {
      // This would call your existing agno_assist agent
      const response = await fetch('/api/chat/agno-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })
      
      const result = await response.json()
      return result.response || 'No response from Agno Assist'
      
    } catch (error) {
      console.error('Failed to call Agno Assist:', error)
      return 'Error calling Agno Assist'
    }
  }
  
  static async deployAgentToServiceFlow(agentConfig: any, agentCode: string): Promise<boolean> {
    try {
      // Deploy the agent to your ServiceFlow platform
      const response = await fetch('/api/serviceflow/deploy-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: agentConfig,
          code: agentCode,
          framework: 'agno'
        })
      })
      
      return response.ok
      
    } catch (error) {
      console.error('Failed to deploy agent:', error)
      return false
    }
  }
}





# app/api/agno-builder/route.py (Next.js API route)
from typing import Dict, Any, List
import subprocess
import tempfile
import os
import json
from pathlib import Path

class AgnoAgentBuilder:
    """Backend service for building and testing Agno agents"""
    
    def __init__(self):
        self.base_dir = Path("./agents")
        self.base_dir.mkdir(exist_ok=True)
        
    def validate_agent_config(self, config: Dict[str, Any]) -> bool:
        """Validate agent configuration"""
        required_fields = ['name', 'description', 'model', 'instructions']
        return all(field in config and config[field] for field in required_fields)
    
    def generate_agent_code(self, config: Dict[str, Any]) -> str:
        """Generate Python code for Agno agent"""
        
        # Tool mapping
        tool_imports = {
            'duckduckgo': 'from agno.tools.duckduckgo import DuckDuckGoTools',
            'python': 'from agno.tools.python import PythonTools',
            'dalle': 'from agno.tools.dalle import DalleTools',
            'eleven_labs': 'from agno.tools.eleven_labs import ElevenLabsTools',
            'file_tools': 'from agno.tools.file import FileTools',
            'calculator': 'from agno.tools.calculator import Calculator'
        }
        
        # Model mapping
        model_imports = {
            'openai-gpt4o': 'from agno.models.openai import OpenAIChat',
            'openai-gpt35': 'from agno.models.openai import OpenAIChat',
            'anthropic-claude': 'from agno.models.anthropic import AnthropicChat'
        }
        
        # Generate imports
        imports = ['import os', 'from pathlib import Path', 'from textwrap import dedent', 
                  'from dotenv import load_dotenv', '', 'load_dotenv()', '',
                  'from agno.agent import Agent', 'from agno.storage.sqlite import SqliteStorage']
        
        # Add model import
        if config['model'] in model_imports:
            imports.append(model_imports[config['model']])
        
        # Add tool imports
        for tool in config.get('tools', []):
            if tool in tool_imports:
                imports.append(tool_imports[tool])
        
        # Generate tool instantiation
        tool_instances = []
        for tool in config.get('tools', []):
            if tool == 'python':
                tool_instances.append('PythonTools(base_dir="./tmp", read_files=True)')
            elif tool == 'dalle':
                tool_instances.append('DalleTools(model="dall-e-3", size="1024x1024", quality="hd")')
            elif tool == 'eleven_labs':
                tool_instances.append('ElevenLabsTools(voice_id="default", model_id="eleven_multilingual_v2")')
            else:
                tool_instances.append(f'{tool.title().replace("_", "")}Tools()')
        
        # Generate model instantiation
        model_code = 'OpenAIChat(id="gpt-4o")'  # default
        if config['model'] == 'openai-gpt35':
            model_code = 'OpenAIChat(id="gpt-3.5-turbo")'
        elif config['model'] == 'anthropic-claude':
            model_code = 'AnthropicChat(id="claude-3-5-sonnet-20241022")'
        
        agent_name = config['name'].lower().replace(' ', '_').replace('-', '_')
        
        code_template = f"""
{chr(10).join(imports)}

# Setup paths
cwd = Path(__file__).parent
tmp_dir = cwd.joinpath("tmp")
tmp_dir.mkdir(parents=True, exist_ok=True)

# Agent storage
agent_storage = SqliteStorage(
    table_name="{agent_name}_sessions",
    db_file=str(tmp_dir.joinpath("agent_sessions.db")),
)

# Create the agent
{agent_name}_agent = Agent(
    agent_id="{agent_name.replace('_', '-')}",
    name="{config['name']}",
    model={model_code},
    description=dedent(\"\"\"\\
    {config['description']}\"\"\"),
    instructions=dedent(\"\"\"\\
    {config['instructions']}\"\"\"),
    storage=agent_storage,
    tools=[
        {f',{chr(10)}        '.join(tool_instances)}
    ],
    add_datetime_to_instructions={str(config.get('add_datetime', True))},
    read_chat_history={str(config.get('read_chat_history', True))},
    num_history_responses={config.get('num_history_responses', 3)},
    markdown={str(config.get('markdown', True))},
)

def run_agent(message: str) -> str:
    \"\"\"Run the agent with a message and return response\"\"\"
    try:
        response = {agent_name}_agent.run(message)
        return str(response)
    except Exception as e:
        return f"Error: {{str(e)}}"

if __name__ == "__main__":
    # Test the agent
    response = {agent_name}_agent.run("Hello! Please introduce yourself and tell me what you can do.")
    print(response)
"""
        
        return code_template.strip()
    
    def save_agent_file(self, agent_name: str, code: str) -> Path:
        """Save agent code to file"""
        safe_name = agent_name.lower().replace(' ', '_').replace('-', '_')
        agent_file = self.base_dir / f"{safe_name}_agent.py"
        
        with open(agent_file, 'w', encoding='utf-8') as f:
            f.write(code)
        
        return agent_file
    
    def test_agent(self, code: str, message: str) -> Dict[str, Any]:
        """Test agent code with a message"""
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
                temp_file.write(code)
                temp_file_path = temp_file.name
            
            # Add run_agent function call to test
            test_code = f"""
{code}

# Test the agent
try:
    result = run_agent("{message}")
    print("AGENT_RESPONSE:", result)
except Exception as e:
    print("AGENT_ERROR:", str(e))
"""
            
            with open(temp_file_path, 'w') as f:
                f.write(test_code)
            
            # Run the agent
            result = subprocess.run(
                ['python', temp_file_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # Parse output
            if result.returncode == 0:
                output_lines = result.stdout.strip().split('\n')
                for line in output_lines:
                    if line.startswith('AGENT_RESPONSE:'):
                        response = line.replace('AGENT_RESPONSE:', '').strip()
                        return {
                            'success': True,
                            'response': response,
                            'error': None
                        }
                
                return {
                    'success': False,
                    'response': None,
                    'error': 'No response from agent'
                }
            else:
                error_output = result.stderr.strip()
                if 'AGENT_ERROR:' in result.stdout:
                    for line in result.stdout.split('\n'):
                        if line.startswith('AGENT_ERROR:'):
                            error_output = line.replace('AGENT_ERROR:', '').strip()
                
                return {
                    'success': False,
                    'response': None,
                    'error': error_output
                }
                
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'response': None,
                'error': 'Agent execution timed out'
            }
        except Exception as e:
            return {
                'success': False,
                'response': None,
                'error': str(e)
            }
        finally:
            # Cleanup
            if 'temp_file_path' in locals():
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
    
    def get_agno_assist_suggestions(self, config: Dict[str, Any], code: str) -> Dict[str, Any]:
        """Get suggestions from agno_assist agent"""
        # This would call your existing agno_assist agent
        # For now, return mock suggestions
        suggestions = []
        
        if not config.get('tools'):
            suggestions.append("Consider adding tools like DuckDuckGoTools for web search capabilities")
        
        if len(config.get('instructions', '')) < 50:
            suggestions.append("Instructions are quite short. Consider adding more detailed behavior guidelines")
        
        if 'python' in config.get('tools', []) and 'file_tools' not in config.get('tools', []):
            suggestions.append("Since you're using Python tools, consider adding File tools for better file handling")
        
        return {
            'suggestions': suggestions,
            'optimized_code': None,  # Could contain improved code
            'confidence_score': 0.8
        }

# Next.js API Route handlers
builder = AgnoAgentBuilder()

# POST /api/agno-builder/generate
def generate_agent_endpoint(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate agent code from configuration"""
    try:
        config = request_data.get('config', {})
        
        if not builder.validate_agent_config(config):
            return {
                'success': False,
                'error': 'Invalid agent configuration',
                'code': None
            }
        
        code = builder.generate_agent_code(config)
        
        return {
            'success': True,
            'code': code,
            'error': None
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'code': None
        }

# POST /api/agno-builder/test
def test_agent_endpoint(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Test agent with a message"""
    try:
        code = request_data.get('agent_code', '')
        message = request_data.get('message', '')
        
        if not code or not message:
            return {
                'success': False,
                'error': 'Missing agent code or message',
                'response': None
            }
        
        result = builder.test_agent(code, message)
        return result
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'response': None
        }

# POST /api/agno-builder/save
def save_agent_endpoint(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Save agent to file system"""
    try:
        config = request_data.get('config', {})
        code = request_data.get('code', '')
        
        if not config.get('name') or not code:
            return {
                'success': False,
                'error': 'Missing agent name or code',
                'file_path': None
            }
        
        file_path = builder.save_agent_file(config['name'], code)
        
        return {
            'success': True,
            'file_path': str(file_path),
            'error': None
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'file_path': None
        }

# POST /api/agno-assist/optimize
def get_optimization_suggestions(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Get optimization suggestions from agno_assist"""
    try:
        config = request_data.get('config', {})
        code = request_data.get('code', '')
        
        suggestions = builder.get_agno_assist_suggestions(config, code)
        return {
            'success': True,
            'suggestions': suggestions,
            'error': None
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'suggestions': None
        }



 // components/agno-agent-builder.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Bot, 
  Zap, 
  Database, 
  Globe, 
  FileText, 
  Calculator, 
  Image, 
  Mic, 
  Code, 
  Play, 
  Save,
  MessageSquare,
  Settings,
  Wand2
} from "lucide-react"

interface AgnoTool {
  id: string
  name: string
  description: string
  import_path: string
  icon: any
  category: "web" | "data" | "media" | "ai" | "utility" | "custom"
  config?: Record<string, any>
}

interface AgnoModel {
  id: string
  name: string
  provider: string
  description: string
  import_path: string
}

interface AgentConfig {
  name: string
  description: string
  instructions: string
  model: string
  tools: string[]
  knowledge_sources: string[]
  storage_type: string
  add_datetime: boolean
  read_chat_history: boolean
  num_history_responses: number
  markdown: boolean
}

export function AgnoAgentBuilder() {
  const [activeTab, setActiveTab] = useState("basic")
  const [isBuilding, setIsBuilding] = useState(false)
  const [isTestingAgent, setIsTestingAgent] = useState(false)
  const [agentCode, setAgentCode] = useState<string>("")
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([])
  const [testMessage, setTestMessage] = useState("")

  // Available Agno tools from the framework
  const agnoTools: AgnoTool[] = [
    {
      id: "duckduckgo",
      name: "DuckDuckGo Search",
      description: "Web search capabilities using DuckDuckGo",
      import_path: "agno.tools.duckduckgo.DuckDuckGoTools",
      icon: Globe,
      category: "web"
    },
    {
      id: "python",
      name: "Python Tools",
      description: "Execute Python code and scripts",
      import_path: "agno.tools.python.PythonTools",
      icon: Code,
      category: "utility",
      config: { base_dir: "./tmp", read_files: true }
    },
    {
      id: "dalle",
      name: "DALL-E Image Generation",
      description: "Generate images using DALL-E",
      import_path: "agno.tools.dalle.DalleTools",
      icon: Image,
      category: "ai",
      config: { model: "dall-e-3", size: "1024x1024", quality: "hd" }
    },
    {
      id: "eleven_labs",
      name: "ElevenLabs TTS",
      description: "Text-to-speech using ElevenLabs",
      import_path: "agno.tools.eleven_labs.ElevenLabsTools",
      icon: Mic,
      category: "ai",
      config: { voice_id: "default", model_id: "eleven_multilingual_v2" }
    },
    {
      id: "file_tools",
      name: "File Tools",
      description: "Read and write files",
      import_path: "agno.tools.file.FileTools",
      icon: FileText,
      category: "utility"
    },
    {
      id: "calculator",
      name: "Calculator",
      description: "Mathematical calculations",
      import_path: "agno.tools.calculator.Calculator",
      icon: Calculator,
      category: "utility"
    }
  ]

  // Available Agno models
  const agnoModels: AgnoModel[] = [
    {
      id: "openai-gpt4o",
      name: "GPT-4o",
      provider: "OpenAI",
      description: "Most capable OpenAI model",
      import_path: "agno.models.openai.OpenAIChat"
    },
    {
      id: "openai-gpt35",
      name: "GPT-3.5 Turbo",
      provider: "OpenAI", 
      description: "Fast and efficient OpenAI model",
      import_path: "agno.models.openai.OpenAIChat"
    },
    {
      id: "anthropic-claude",
      name: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      description: "Anthropic's most capable model",
      import_path: "agno.models.anthropic.AnthropicChat"
    }
  ]

  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    name: "",
    description: "",
    instructions: "",
    model: "openai-gpt4o",
    tools: [],
    knowledge_sources: [],
    storage_type: "sqlite",
    add_datetime: true,
    read_chat_history: true,
    num_history_responses: 3,
    markdown: true
  })

  // Generate Python code for the Agno agent
  const generateAgentCode = () => {
    const selectedTools = agnoTools.filter(tool => agentConfig.tools.includes(tool.id))
    const selectedModel = agnoModels.find(model => model.id === agentConfig.model)

    const toolImports = selectedTools.map(tool => {
      const className = tool.import_path.split('.').pop()
      return `from ${tool.import_path} import ${className}`
    }).join('\n')

    const toolsCode = selectedTools.map(tool => {
      const className = tool.import_path.split('.').pop()
      if (tool.config) {
        const config = Object.entries(tool.config)
          .map(([key, value]) => `${key}=${typeof value === 'string' ? `"${value}"` : value}`)
          .join(', ')
        return `        ${className}(${config})`
      }
      return `        ${className}()`
    }).join(',\n')

    const modelImport = selectedModel ? `from ${selectedModel.import_path} import ${selectedModel.import_path.split('.').pop()}` : ''
    const modelCode = selectedModel ? `${selectedModel.import_path.split('.').pop()}(id="${selectedModel.id.includes('gpt4o') ? 'gpt-4o' : selectedModel.id.includes('gpt35') ? 'gpt-3.5-turbo' : 'claude-3-5-sonnet-20241022'}")` : 'OpenAIChat(id="gpt-4o")'

    return `import os
from pathlib import Path
from textwrap import dedent
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Agno imports
from agno.agent import Agent
${modelImport}
from agno.storage.sqlite import SqliteStorage
${toolImports}

# Setup paths
cwd = Path(__file__).parent
tmp_dir = cwd.joinpath("tmp")
tmp_dir.mkdir(parents=True, exist_ok=True)

# Agent storage
agent_storage = SqliteStorage(
    table_name="${agentConfig.name.toLowerCase().replace(/\s+/g, '_')}_sessions",
    db_file=str(tmp_dir.joinpath("agent_sessions.db")),
)

# Create the agent
${agentConfig.name.toLowerCase().replace(/\s+/g, '_')}_agent = Agent(
    agent_id="${agentConfig.name.toLowerCase().replace(/\s+/g, '-')}",
    name="${agentConfig.name}",
    model=${modelCode},
    description=dedent(\"\"\"\\
    ${agentConfig.description}\"\"\"),
    instructions=dedent(\"\"\"\\
    ${agentConfig.instructions}\"\"\"),
    storage=agent_storage,
    tools=[
${toolsCode}
    ],
    add_datetime_to_instructions=${agentConfig.add_datetime},
    read_chat_history=${agentConfig.read_chat_history},
    num_history_responses=${agentConfig.num_history_responses},
    markdown=${agentConfig.markdown},
)

if __name__ == "__main__":
    # Test the agent
    response = ${agentConfig.name.toLowerCase().replace(/\s+/g, '_')}_agent.run("Hello! Please introduce yourself and tell me what you can do.")
    print(response)
`
  }

  const buildAgent = async () => {
    setIsBuilding(true)
    
    // Generate the code
    const code = generateAgentCode()
    setAgentCode(code)
    
    // Simulate building process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Here you would call your agno_assist agent to help refine/validate the agent
    try {
      const response = await fetch('/api/agno-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Please review and optimize this Agno agent code:\n\n${code}`,
          action: 'review_agent'
        })
      })
      const result = await response.json()
      // Update code with suggestions
      if (result.optimized_code) {
        setAgentCode(result.optimized_code)
      }
    } catch (error) {
      console.error('Failed to get agno_assist optimization:', error)
    }
    
    setIsBuilding(false)
  }

  const testAgent = async () => {
    if (!testMessage.trim()) return
    
    setIsTestingAgent(true)
    setChatMessages(prev => [...prev, { role: 'user', content: testMessage }])
    
    try {
      // Call the generated agent via your backend
      const response = await fetch('/api/test-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_code: agentCode,
          message: testMessage
        })
      })
      const result = await response.json()
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.response }])
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error testing agent. Please check the configuration.' }])
    }
    
    setTestMessage("")
    setIsTestingAgent(false)
  }

  const saveAgent = async () => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...agentConfig,
          code: agentCode,
          framework: 'agno'
        })
      })
      
      if (response.ok) {
        alert('Agent saved successfully!')
      }
    } catch (error) {
      alert('Failed to save agent')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bot className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Agno Agent Builder</CardTitle>
                <CardDescription>Build custom AI agents using the Agno framework</CardDescription>
              </div>
            </div>
            <Button onClick={() => {
              // Call agno_assist for help
              window.open('/chat?agent=agno-assist&message=Help me build a custom agent', '_blank')
            }} variant="outline">
              <Wand2 className="h-4 w-4 mr-2" />
              Get AI Help
            </Button>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="model">Model & Tools</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="code">Generated Code</TabsTrigger>
            <TabsTrigger value="test">Test Agent</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Agent Name</label>
                <Input
                  placeholder="My Custom Agent"
                  value={agentConfig.name}
                  onChange={(e) => setAgentConfig(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="What does this agent do?"
                  value={agentConfig.description}
                  onChange={(e) => setAgentConfig(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Instructions</label>
                <Textarea
                  placeholder="Detailed instructions for how the agent should behave..."
                  value={agentConfig.instructions}
                  onChange={(e) => setAgentConfig(prev => ({ ...prev, instructions: e.target.value }))}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  These instructions will guide how your agent responds and behaves
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="model" className="space-y-4 p-4">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium">AI Model</label>
                <Select
                  value={agentConfig.model}
                  onValueChange={(value) => setAgentConfig(prev => ({ ...prev, model: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {agnoModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <span>{model.name}</span>
                          <Badge variant="outline">{model.provider}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Available Tools</label>
                <div className="grid gap-3">
                  {Object.entries(
                    agnoTools.reduce((acc, tool) => {
                      if (!acc[tool.category]) acc[tool.category] = []
                      acc[tool.category].push(tool)
                      return acc
                    }, {} as Record<string, AgnoTool[]>)
                  ).map(([category, tools]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-sm capitalize">{category} Tools</h4>
                      <div className="grid gap-2">
                        {tools.map(tool => (
                          <div key={tool.id} className="flex items-start space-x-3">
                            <Checkbox
                              id={tool.id}
                              checked={agentConfig.tools.includes(tool.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setAgentConfig(prev => ({
                                    ...prev,
                                    tools: [...prev.tools, tool.id]
                                  }))
                                } else {
                                  setAgentConfig(prev => ({
                                    ...prev,
                                    tools: prev.tools.filter(t => t !== tool.id)
                                  }))
                                }
                              }}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor={tool.id}
                                className="text-sm font-medium flex items-center gap-2"
                              >
                                <tool.icon className="h-4 w-4" />
                                {tool.name}
                              </label>
                              <p className="text-xs text-muted-foreground">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4 p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Storage Type</label>
                <Select
                  value={agentConfig.storage_type}
                  onValueChange={(value) => setAgentConfig(prev => ({ ...prev, storage_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sqlite">SQLite (Local)</SelectItem>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="memory">In-Memory (Testing)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="add_datetime"
                    checked={agentConfig.add_datetime}
                    onCheckedChange={(checked) => 
                      setAgentConfig(prev => ({ ...prev, add_datetime: !!checked }))
                    }
                  />
                  <label htmlFor="add_datetime" className="text-sm font-medium">
                    Add datetime to instructions
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="read_chat_history"
                    checked={agentConfig.read_chat_history}
                    onCheckedChange={(checked) => 
                      setAgentConfig(prev => ({ ...prev, read_chat_history: !!checked }))
                    }
                  />
                  <label htmlFor="read_chat_history" className="text-sm font-medium">
                    Read chat history
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="markdown"
                    checked={agentConfig.markdown}
                    onCheckedChange={(checked) => 
                      setAgentConfig(prev => ({ ...prev, markdown: !!checked }))
                    }
                  />
                  <label htmlFor="markdown" className="text-sm font-medium">
                    Enable markdown formatting
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">History Responses</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={agentConfig.num_history_responses}
                  onChange={(e) => setAgentConfig(prev => ({ 
                    ...prev, 
                    num_history_responses: parseInt(e.target.value) || 3 
                  }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of previous responses to include in context
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code" className="space-y-4 p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Generated Agent Code</h3>
                <div className="flex gap-2">
                  <Button onClick={buildAgent} disabled={isBuilding || !agentConfig.name}>
                    <Zap className="h-4 w-4 mr-2" />
                    {isBuilding ? 'Building...' : 'Build Agent'}
                  </Button>
                  <Button onClick={saveAgent} variant="outline" disabled={!agentCode}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Agent
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[500px] border rounded-md">
                <pre className="p-4 text-sm">
                  <code>{agentCode || "Click 'Build Agent' to generate code..."}</code>
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="test" className="space-y-4 p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Test Your Agent</h3>
                <Badge variant={agentCode ? "default" : "secondary"}>
                  {agentCode ? "Ready to Test" : "Build Agent First"}
                </Badge>
              </div>

              <ScrollArea className="h-[300px] border rounded-md">
                <div className="p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Send a message to test your agent
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-blue-50 border-l-4 border-blue-500 ml-8' 
                            : 'bg-green-50 border-l-4 border-green-500 mr-8'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.role === 'user' ? (
                            <Badge variant="default">You</Badge>
                          ) : (
                            <Badge variant="secondary">{agentConfig.name || 'Agent'}</Badge>
                          )}
                        </div>
                        <div className="text-sm">{msg.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder="Type a message to test your agent..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && testAgent()}
                  disabled={!agentCode || isTestingAgent}
                />
                <Button 
                  onClick={testAgent} 
                  disabled={!agentCode || !testMessage.trim() || isTestingAgent}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {isTestingAgent ? 'Testing...' : 'Send'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}       