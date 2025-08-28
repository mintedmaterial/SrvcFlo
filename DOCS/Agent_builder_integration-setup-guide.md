# Agno Agent Builder Integration Guide

This guide shows how to integrate the **Agent Builder UI** with your **Agno framework** and **ServiceFlow SaaS** platform.

## 🏗️ Architecture Overview

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Agent Builder     │    │   Agno Framework    │    │   ServiceFlow       │
│   Dashboard         │────│   (Python Backend)  │────│   SaaS Platform     │
│   (Next.js UI)      │    │                     │    │   (Cloudflare)      │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       │
                            ┌─────────────────────┐
                            │   Agent UI          │
                            │   (Chat Interface)  │
                            │   (Port 3000)       │
                            └─────────────────────┘
```

## 📂 Directory Structure

```
C:\Users\PC\ServiceApp\
├── agent-ui/                    # Your existing Agent UI
│   ├── README.md
│   ├── package.json
│   └── src/
├── agent-builder/               # New Agent Builder Dashboard
│   ├── components/
│   │   ├── agno-agent-builder.tsx
│   │   └── agent-ui-integration.tsx
│   ├── app/api/
│   │   ├── agno-builder/
│   │   └── agno-assist/
│   └── utils/
├── Agents/                      # Your Agno agents
│   ├── agno_assist.py
│   ├── srvcflo_team_agent.py
│   └── generated/               # Generated agents
└── myserviceprovider-app/       # ServiceFlow platform
```

## 🔧 Setup Instructions

### Step 1: Set Up Agent Builder Dashboard

1. **Copy the Agent Builder components** to your existing dashboard:

```bash
# Navigate to your Agent UI directory
cd C:\Users\PC\ServiceApp\agent-ui

# Create new components directory if needed
mkdir -p src/components/agno

# Copy the components we created
# - agno-agent-builder.tsx
# - agent-ui-integration.tsx
```

2. **Install additional dependencies**:

```bash
npm install uuid @types/uuid
```

3. **Add the API routes** to your Next.js app:

```bash
# Create API structure
mkdir -p app/api/agno-builder/{generate,test,save}
mkdir -p app/api/agno-assist

# Add the route files we created above
```

### Step 2: Integrate with Existing Agno Agents

1. **Update your agno_assist.py** to support HTTP endpoints:

```python
# Add to agno_assist.py
from flask import Flask, request, jsonify
import threading

app = Flask(__name__)

@app.route('/optimize-agent', methods=['POST'])
def optimize_agent():
    data = request.json
    config = data.get('config', {})
    code = data.get('code', '')
    
    # Use agno_assist to review and optimize
    optimization_prompt = f"""
    Please review this Agno agent configuration and code:
    
    Config: {config}
    Code: {code}
    
    Provide optimization suggestions and improvements.
    """
    
    response = agno_assist.run(optimization_prompt)
    
    return jsonify({
        'suggestions': response,
        'optimized_code': None,  # Could include improved code
        'confidence_score': 0.9
    })

def run_flask_server():
    app.run(host='0.0.0.0', port=8000, debug=False)

if __name__ == "__main__":
    # Start Flask server in background thread
    flask_thread = threading.Thread(target=run_flask_server, daemon=True)
    flask_thread.start()
    
    # Continue with normal Agno agent functionality
    agno_assist.print_response("Agno Assist is ready!", stream=True)
```

### Step 3: Add Agent Builder to Dashboard

1. **Update your main dashboard page**:

```typescript
// In your main dashboard component
import { AgnoAgentBuilder } from '@/components/agno/agno-agent-builder'
import { AgentUIIntegration } from '@/components/agno/agent-ui-integration'

// Add new tab for Agent Builder
<TabsTrigger value="agent-builder">Agent Builder</TabsTrigger>

<TabsContent value="agent-builder">
  <AgnoAgentBuilder />
</TabsContent>
```

2. **Update navigation** to include Agent Builder:

```typescript
const navItems = [
  // ... existing items
  {
    name: "Agent Builder",
    href: "/agent-builder",
    icon: Bot,
  },
]
```

### Step 4: Configure Agent UI Connection

1. **Update Agent UI configuration** (agent-ui directory):

```json
// In your Agent UI's playground.ts or similar
{
  "endpoints": [
    {
      "name": "Local Agno Agents",
      "url": "http://localhost:7777",
      "description": "Generated Agno agents"
    },
    {
      "name": "ServiceFlow Agents", 
      "url": "https://srvcflo.com/api/agents",
      "description": "Production agents"
    }
  ]
}
```

2. **Create agent endpoint handler**:

```typescript
// app/api/agents/[agentId]/route.ts in Agent UI
export async function POST(request: Request, { params }: { params: { agentId: string } }) {
  const { message } = await request.json()
  
  // Call the generated Agno agent
  const response = await fetch(`http://localhost:8000/agents/${params.agentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })
  
  const result = await response.json()
  return Response.json(result)
}
```

### Step 5: Deploy to ServiceFlow Platform

1. **Update your Cloudflare Worker** to handle agent endpoints:

```typescript
// In your ServiceFlow worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    
    // Handle agent API routes
    if (url.pathname.startsWith('/api/agents/')) {
      return handleAgentRequest(request, env)
    }
    
    // Handle agent builder routes
    if (url.pathname.startsWith('/api/agno-builder/')) {
      return handleAgentBuilderRequest(request, env)
    }
    
    // Existing routes...
    return env.ASSETS.fetch(request)
  }
}

async function handleAgentRequest(request: Request, env: Env) {
  // Route to deployed Agno agents
  // This could call your Python agents via HTTP
}
```

## 🔄 Workflow

### Building a New Agent

1. **Open Agent Builder Dashboard**
2. **Configure basic info** (name, description, instructions)
3. **Select AI model** (GPT-4o, Claude, etc.)
4. **Choose tools** (Web search, Python, DALL-E, etc.)
5. **Set behavior options** (history, datetime, etc.)
6. **Generate code** - Creates Python Agno agent
7. **Test in playground** - Live chat interface
8. **Get AI optimization** - Agno Assist reviews and suggests improvements
9. **Export options**:
   - Download Python code
   - Export Agent UI config
   - Deploy to ServiceFlow

### Testing Workflow

1. **Built-in playground** - Test immediately in the builder
2. **Agent UI integration** - Full chat interface with streaming
3. **ServiceFlow deployment** - Production testing

### Deployment Options

1. **Local development** - Run agents locally with Agent UI
2. **ServiceFlow platform** - Deploy to your SaaS (srvcflo.com)
3. **Custom endpoints** - Deploy anywhere with HTTP API

## 🔗 Integration Points

### Agent Builder ↔ Agno Framework
- **Code generation**: Converts UI config to Python Agno agents
- **Tool integration**: Maps UI tool selection to Agno tool imports
- **Testing**: Executes generated agents with test messages

### Agent Builder ↔ Agent UI
- **Configuration export**: Creates Agent UI compatible configs
- **Live testing**: Embedded chat interface
- **Endpoint integration**: Direct connection to running agents

### Agent Builder ↔ ServiceFlow
- **Deployment**: Pushes agents to production platform
- **API integration**: Serves agents via Cloudflare Workers
- **Management**: Monitor and manage deployed agents

### Agno Assist Integration
- **Code optimization**: Reviews and improves generated agents
- **Suggestions**: Provides best practices and improvements
- **Learning**: Helps users understand Agno framework concepts

## 🚀 Next Steps

1. **Implement the components** in your existing dashboard
2. **Set up the API routes** for agent management
3. **Configure Agno Assist** for optimization help
4. **Test the full workflow** from building to deployment
5. **Deploy to ServiceFlow** for production use

## 📋 Benefits

✅ **Visual agent building** - No code required for basic agents
✅ **Agno framework integration** - Full power of your existing agents
✅ **Live testing** - Immediate feedback during development
✅ **AI-assisted optimization** - Agno Assist helps improve agents
✅ **Multiple deployment options** - Local, ServiceFlow, or custom
✅ **Agent UI compatibility** - Works with your existing chat interface
✅ **Production ready** - Deploy to your SaaS platform

This integration gives you a complete **low-code/no-code agent building platform** while maintaining all the power and flexibility of the Agno framework!
