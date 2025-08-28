# ServiceApp Code Style Conventions (Updated January 2025)

## General Principles

### Consistency First
- Follow existing patterns within each component
- Maintain consistency between agent-ui and main app where applicable
- Use established conventions for new features
- Document deviations from standard patterns

### Readability & Maintainability
- Write self-documenting code with clear naming
- Keep functions small and focused
- Use TypeScript for type safety
- Implement comprehensive error handling

## Frontend Code Conventions

### Agent-UI Specific (Next.js 15 + React 19)
```typescript
// File naming: kebab-case for files, PascalCase for components
// agent-builder-config.tsx
export const AgentBuilderConfig: React.FC<AgentBuilderConfigProps> = ({
  agentType,
  onConfigChange,
}) => {
  // Use React 19 features like automatic batching
  const [config, setConfig] = useState<AgentConfig>(defaultConfig);
  
  // Prefer const assertions for better type inference
  const toolCategories = ['content', 'social', 'development'] as const;
  
  return (
    <div className="grid gap-4 p-6">
      {/* Use semantic HTML with proper accessibility */}
      <section aria-labelledby="agent-config-title">
        <h2 id="agent-config-title" className="text-xl font-semibold">
          Agent Configuration
        </h2>
      </section>
    </div>
  );
};
```

### Main App Conventions (Next.js 14)
```typescript
// API route conventions
// app/api/generate/image/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input with Zod schemas
    const validatedData = imageGenerationSchema.parse(body);
    
    // Use proper error handling
    const result = await generateImage(validatedData);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Image generation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Generation failed' },
      { status: 500 }
    );
  }
}
```

### Component Architecture
```typescript
// Use composition over inheritance
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Extend props properly
interface SpecificComponentProps extends BaseComponentProps {
  title: string;
  onAction: (data: ActionData) => void;
}

// Use proper prop destructuring
export const SpecificComponent: React.FC<SpecificComponentProps> = ({
  title,
  onAction,
  className,
  children,
  ...props
}) => {
  // Component logic
};
```

### State Management Patterns
```typescript
// Zustand store structure
interface AppState {
  // State shape
  user: User | null;
  agents: Agent[];
  currentChat: ChatSession | null;
  
  // Actions
  actions: {
    setUser: (user: User) => void;
    addAgent: (agent: Agent) => void;
    updateAgent: (id: string, updates: Partial<Agent>) => void;
  };
}

// TanStack Query patterns
export const useAgentData = (agentId: string) => {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => fetchAgent(agentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

## Backend Code Conventions (Python Agents)

### Agno Framework Patterns
```python
from agno import Agent, Tool
from typing import Optional, Dict, Any
import asyncio
import logging

class ContentGenerationAgent(Agent):
    """
    Agent for content creation and management.
    
    Handles blog posts, social media content, and marketing materials.
    """
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(name="content_generator", config=config)
        self.logger = logging.getLogger(__name__)
        
    async def generate_content(
        self,
        content_type: str,
        prompt: str,
        **kwargs
    ) -> Optional[str]:
        """
        Generate content based on type and prompt.
        
        Args:
            content_type: Type of content (blog, social, email)
            prompt: Content generation prompt
            **kwargs: Additional parameters
            
        Returns:
            Generated content or None if generation fails
        """
        try:
            # Use proper async patterns
            result = await self._generate_with_fallback(prompt, **kwargs)
            return result
        except Exception as e:
            self.logger.error(f"Content generation failed: {e}")
            return None
    
    async def _generate_with_fallback(self, prompt: str, **kwargs) -> str:
        """Internal method with provider fallback logic."""
        providers = ['openai', 'gemini', 'groq']
        
        for provider in providers:
            try:
                return await self._generate_with_provider(provider, prompt, **kwargs)
            except Exception as e:
                self.logger.warning(f"Provider {provider} failed: {e}")
                continue
        
        raise Exception("All providers failed")
```

### Database Patterns
```python
# MongoDB patterns
from pymongo import MongoClient
from typing import Optional, List, Dict, Any

class AgentDataManager:
    """Manages agent data persistence."""
    
    def __init__(self, connection_string: str):
        self.client = MongoClient(connection_string)
        self.db = self.client.serviceflow
        
    async def save_agent_session(
        self,
        agent_id: str,
        session_data: Dict[str, Any]
    ) -> Optional[str]:
        """
        Save agent session data.
        
        Args:
            agent_id: Unique agent identifier
            session_data: Session data to persist
            
        Returns:
            Session ID if successful, None otherwise
        """
        try:
            result = self.db.agent_sessions.insert_one({
                'agent_id': agent_id,
                'session_data': session_data,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            })
            return str(result.inserted_id)
        except Exception as e:
            logging.error(f"Failed to save session: {e}")
            return None
```

### Error Handling Patterns
```python
import logging
from typing import Union, Optional
from dataclasses import dataclass

@dataclass
class AgentResponse:
    """Standardized agent response format."""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    error_code: Optional[str] = None

class AgentError(Exception):
    """Base exception for agent operations."""
    def __init__(self, message: str, error_code: str = None):
        super().__init__(message)
        self.error_code = error_code

async def safe_agent_operation(operation_func) -> AgentResponse:
    """Wrapper for safe agent operations with standardized error handling."""
    try:
        result = await operation_func()
        return AgentResponse(success=True, data=result)
    except AgentError as e:
        logging.error(f"Agent error: {e}")
        return AgentResponse(
            success=False,
            error=str(e),
            error_code=e.error_code
        )
    except Exception as e:
        logging.exception("Unexpected error in agent operation")
        return AgentResponse(
            success=False,
            error="Internal server error",
            error_code="INTERNAL_ERROR"
        )
```

## Smart Contract Conventions (Solidity)

### Contract Structure
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SonicPaymentProcessor
 * @dev Handles payments and revenue distribution for ServiceFlow AI
 */
contract SonicPaymentProcessor is ReentrancyGuard, Ownable {
    // Events
    event PaymentProcessed(
        address indexed user,
        uint256 amount,
        string serviceType
    );
    
    event RevenueDistributed(
        uint256 devShare,
        uint256 leaderboardShare,
        uint256 stakingShare
    );
    
    // State variables
    mapping(address => uint256) public userBalances;
    mapping(string => uint256) public servicePrices;
    
    // Revenue distribution percentages (basis points)
    uint256 public constant DEV_SHARE = 5000; // 50%
    uint256 public constant LEADERBOARD_SHARE = 1500; // 15%
    uint256 public constant STAKING_SHARE = 2500; // 25%
    uint256 public constant TREASURY_SHARE = 1000; // 10%
    
    /**
     * @dev Process payment for AI generation services
     * @param serviceType Type of service (image, video, etc.)
     */
    function processPayment(string memory serviceType) 
        external 
        payable 
        nonReentrant 
    {
        require(msg.value > 0, "Payment amount must be greater than 0");
        require(servicePrices[serviceType] > 0, "Invalid service type");
        require(msg.value >= servicePrices[serviceType], "Insufficient payment");
        
        // Process payment logic
        _distributeRevenue(msg.value);
        
        emit PaymentProcessed(msg.sender, msg.value, serviceType);
    }
    
    /**
     * @dev Internal function to distribute revenue
     * @param amount Total payment amount
     */
    function _distributeRevenue(uint256 amount) internal {
        uint256 devAmount = (amount * DEV_SHARE) / 10000;
        uint256 leaderboardAmount = (amount * LEADERBOARD_SHARE) / 10000;
        uint256 stakingAmount = (amount * STAKING_SHARE) / 10000;
        
        // Distribution logic
        emit RevenueDistributed(devAmount, leaderboardAmount, stakingAmount);
    }
}
```

## File Organization & Naming

### Directory Structure
```
component/
├── components/          # React components
│   ├── ui/             # Base UI components
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── types/              # TypeScript type definitions
├── utils/              # Helper functions
└── constants/          # Application constants
```

### File Naming Conventions
- **React Components**: PascalCase (`UserDashboard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAgentData.ts`)
- **Utilities**: camelCase (`formatCurrency.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)
- **Types**: PascalCase with descriptive names (`UserProfile.ts`)

### Import Organization
```typescript
// External library imports
import React, { useState, useEffect } from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Internal imports (absolute paths)
import { Button } from '@/components/ui/button';
import { useAgentData } from '@/hooks/useAgentData';
import { AgentConfig } from '@/types/agent';

// Relative imports
import './ComponentName.css';
```

## API Design Conventions

### REST API Structure
```typescript
// Route naming: RESTful conventions
// GET    /api/agents           - List all agents
// GET    /api/agents/:id       - Get specific agent
// POST   /api/agents           - Create new agent
// PUT    /api/agents/:id       - Update agent
// DELETE /api/agents/:id       - Delete agent

// Response format consistency
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}
```

### WebSocket Conventions
```typescript
// Event naming: VERB_NOUN pattern
const SOCKET_EVENTS = {
  AGENT_MESSAGE_SENT: 'agent:message:sent',
  AGENT_MESSAGE_RECEIVED: 'agent:message:received',
  AGENT_STATUS_UPDATED: 'agent:status:updated',
  USER_CONNECTED: 'user:connected',
  USER_DISCONNECTED: 'user:disconnected',
} as const;
```

## Testing Conventions

### Frontend Testing
```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentBuilderConfig } from './AgentBuilderConfig';

describe('AgentBuilderConfig', () => {
  it('should render agent configuration form', () => {
    render(<AgentBuilderConfig agentType="content" onConfigChange={jest.fn()} />);
    
    expect(screen.getByRole('heading', { name: /agent configuration/i }))
      .toBeInTheDocument();
  });
  
  it('should call onConfigChange when form is updated', async () => {
    const mockOnConfigChange = jest.fn();
    render(<AgentBuilderConfig agentType="content" onConfigChange={mockOnConfigChange} />);
    
    const input = screen.getByLabelText(/agent name/i);
    fireEvent.change(input, { target: { value: 'Test Agent' } });
    
    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test Agent' })
    );
  });
});
```

### Backend Testing
```python
import pytest
from unittest.mock import AsyncMock, patch
from agents.content_agent import ContentGenerationAgent

class TestContentGenerationAgent:
    @pytest.fixture
    def agent(self):
        config = {"provider": "openai", "model": "gpt-4"}
        return ContentGenerationAgent(config)
    
    @pytest.mark.asyncio
    async def test_generate_content_success(self, agent):
        """Test successful content generation."""
        with patch.object(agent, '_generate_with_provider', 
                         return_value="Generated content"):
            result = await agent.generate_content("blog", "Test prompt")
            assert result == "Generated content"
    
    @pytest.mark.asyncio
    async def test_generate_content_fallback(self, agent):
        """Test provider fallback on failure."""
        with patch.object(agent, '_generate_with_provider', 
                         side_effect=[Exception("Provider 1 failed"), 
                                    "Fallback content"]):
            result = await agent.generate_content("blog", "Test prompt")
            assert result == "Fallback content"
```

## Performance & Optimization

### Frontend Performance
```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo<ExpensiveComponentProps>(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});

// Lazy load components
const LazyAgentBuilder = lazy(() => import('./AgentBuilder'));

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <LazyAgentBuilder />
</Suspense>
```

### Backend Performance
```python
# Use async/await for I/O operations
async def process_multiple_requests(requests: List[Request]) -> List[Response]:
    """Process multiple requests concurrently."""
    tasks = [process_single_request(req) for req in requests]
    return await asyncio.gather(*tasks, return_exceptions=True)

# Cache expensive operations
from functools import lru_cache

@lru_cache(maxsize=128)
def get_agent_configuration(agent_type: str) -> Dict[str, Any]:
    """Get cached agent configuration."""
    return load_agent_config(agent_type)
```

## Security Best Practices

### Input Validation
```typescript
// Use Zod for runtime validation
import { z } from 'zod';

const agentConfigSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['content', 'social', 'development']),
  tools: z.array(z.string()),
  settings: z.record(z.any()).optional(),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;
```

### Environment Variables
```typescript
// Use proper environment variable validation
const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  MONGODB_URI: z.string().url(),
  SONIC_RPC_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```