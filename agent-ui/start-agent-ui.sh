#!/bin/bash

echo "🚀 Starting ServiceFlow Agent-UI System on Railway..."

# Set environment variables
export PORT=${PORT:-3000}
export AGENT_API_PORT=${AGENT_API_PORT:-8080}
export NODE_ENV=${NODE_ENV:-production}
export DEPLOYMENT_ENV=${DEPLOYMENT_ENV:-railway}

echo "Configuration:"
echo "  - Frontend Port: $PORT"
echo "  - Agent API Port: $AGENT_API_PORT"
echo "  - Environment: $NODE_ENV"
echo "  - Deployment: $DEPLOYMENT_ENV"

# Check if we have essential files
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

if [ ! -d "src" ]; then
    echo "❌ src directory not found"
    exit 1
fi

if [ ! -d "Agents" ]; then
    echo "❌ Agents directory not found"
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm ci --production=false

# Build the Next.js application
echo "🏗️ Building Next.js application..."
npm run build

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --no-cache-dir -r Agents/requirements_from_working_env.txt || pip install --no-cache-dir agno flask flask-cors python-dotenv requests

# Create necessary directories
mkdir -p Agents/tmp
mkdir -p Agents/storage
mkdir -p storage

# Function to handle graceful shutdown
cleanup() {
    echo "🛑 Shutting down services..."

    # Kill all background processes
    jobs -p | xargs -r kill 2>/dev/null || true

    echo "✅ Cleanup completed"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start essential agents in background
echo "🤖 Starting core agents..."

# Start HTTP agent for API endpoints
cd Agents
if [ -f "http_srvcflo_agent.py" ]; then
    echo "Starting HTTP API agent on port $AGENT_API_PORT..."
    PORT=$AGENT_API_PORT python http_srvcflo_agent.py &
    HTTP_AGENT_PID=$!
    echo "HTTP Agent PID: $HTTP_AGENT_PID"
fi

# Return to root directory
cd ..

# Start the Next.js application
echo "🎨 Starting Next.js application on port $PORT..."
npm start -- -p $PORT &
NEXTJS_PID=$!

echo "✅ ServiceFlow Agent-UI System started!"
echo "  - Frontend: http://localhost:$PORT"
echo "  - API: http://localhost:$AGENT_API_PORT"

# Wait for the main Next.js process
wait $NEXTJS_PID