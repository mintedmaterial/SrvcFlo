// Real-time monitoring data interfaces for ServiceFlow AI Agent Dashboard

export interface WorkflowRun {
  id: string;
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  progress: number;
  metadata: {
    agentType: string;
    userId?: string;
    inputSize: number;
    outputSize?: number;
    retryCount: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
  error?: {
    message: string;
    code: string;
    stack?: string;
  };
}

export interface TriggerDevTask {
  id: string;
  name: string;
  type: 'content-generation' | 'payment-processing' | 'agent-workflow' | 'system-maintenance';
  status: 'idle' | 'running' | 'error' | 'disabled';
  lastRun?: Date;
  nextRun?: Date;
  successRate: number;
  averageDuration: number;
  totalRuns: number;
  failedRuns: number;
  recentRuns: WorkflowRun[];
}

export interface AgentPerformanceMetrics {
  agentId: string;
  agentName: string;
  agentType: 'content' | 'facebook' | 'google' | 'discord' | 'auth-bridge' | 'admin-verification';
  status: 'online' | 'offline' | 'error' | 'maintenance';
  lastActivity: Date;
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    errorRate: number;
  };
  healthChecks: {
    timestamp: Date;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    details?: string;
  }[];
}

export interface ContentGenerationPipeline {
  id: string;
  type: 'image' | 'video' | 'text' | 'audio';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  userId: string;
  prompt: string;
  parameters: Record<string, any>;
  progress: number;
  estimatedCompletion?: Date;
  queuePosition?: number;
  cost: {
    amount: number;
    currency: 'USDC' | 'S';
    paid: boolean;
  };
  output?: {
    url: string;
    metadata: Record<string, any>;
    votes: number;
    rating: number;
  };
  createdAt: Date;
  completedAt?: Date;
}

export interface PaymentDistribution {
  id: string;
  type: 'image-generation' | 'video-generation' | 'voting-reward' | 'nft-staking';
  amount: number;
  currency: 'USDC' | 'S';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  distributions: {
    leaderboardWallet: {
      address: string;
      amount: number;
      percentage: 15;
      status: 'pending' | 'completed' | 'failed';
      txHash?: string;
    };
    devWallet: {
      address: string;
      amount: number;
      percentage: 50;
      status: 'pending' | 'completed' | 'failed';
      txHash?: string;
    };
    nftStakingRewards: {
      address: string;
      amount: number;
      percentage: 25;
      status: 'pending' | 'completed' | 'failed';
      txHash?: string;
    };
    platformFee: {
      amount: number;
      percentage: 10;
      status: 'pending' | 'completed' | 'failed';
      txHash?: string;
    };
  };
  timestamp: Date;
  blockchainTx?: {
    hash: string;
    blockNumber: number;
    gasUsed: number;
    gasPrice: number;
  };
}

export interface SystemHealthMetrics {
  timestamp: Date;
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    database: {
      status: 'healthy' | 'degraded' | 'critical';
      responseTime: number;
      connectionPool: {
        active: number;
        idle: number;
        total: number;
      };
      lastBackup?: Date;
    };
    blockchain: {
      status: 'healthy' | 'degraded' | 'critical';
      network: 'sonic-mainnet' | 'sonic-testnet';
      blockHeight: number;
      gasPrice: number;
      walletBalances: {
        dev: number;
        leaderboard: number;
        nftStaking: number;
      };
    };
    agents: {
      status: 'healthy' | 'degraded' | 'critical';
      totalAgents: number;
      activeAgents: number;
      errorRate: number;
      averageResponseTime: number;
    };
    triggerDev: {
      status: 'healthy' | 'degraded' | 'critical';
      activeTasks: number;
      queuedJobs: number;
      failedJobs: number;
      lastSuccessfulRun?: Date;
    };
    mcpServers: {
      status: 'healthy' | 'degraded' | 'critical';
      servers: {
        name: string;
        status: 'connected' | 'disconnected' | 'error';
        lastPing: Date;
        responseTime: number;
      }[];
    };
  };
  alerts: {
    id: string;
    level: 'info' | 'warning' | 'error' | 'critical';
    component: string;
    message: string;
    timestamp: Date;
    acknowledged: boolean;
  }[];
}

export interface RealtimeEvent {
  id: string;
  type: 'workflow-update' | 'agent-status' | 'content-pipeline' | 'payment-update' | 'system-alert';
  timestamp: Date;
  data: WorkflowRun | AgentPerformanceMetrics | ContentGenerationPipeline | PaymentDistribution | SystemHealthMetrics;
}

export interface MonitoringDashboardState {
  workflows: TriggerDevTask[];
  agents: AgentPerformanceMetrics[];
  contentPipeline: ContentGenerationPipeline[];
  payments: PaymentDistribution[];
  systemHealth: SystemHealthMetrics;
  isConnected: boolean;
  lastUpdate: Date;
}

// Event subscription types for real-time updates
export type EventSubscription = {
  subscribe: (callback: (event: RealtimeEvent) => void) => () => void;
  unsubscribe: () => void;
};

export interface WebSocketConnection {
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
  subscribe: (eventType: string, callback: (data: any) => void) => void;
  unsubscribe: (eventType: string) => void;
}