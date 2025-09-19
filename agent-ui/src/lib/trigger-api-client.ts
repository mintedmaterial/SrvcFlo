import { TriggerApi } from "@trigger.dev/sdk/api";

interface TriggerDevConfig {
  apiKey: string;
  apiUrl?: string;
  projectId: string;
}

class TriggerDevApiClient {
  private client: TriggerApi;
  private config: TriggerDevConfig;

  constructor(config: TriggerDevConfig) {
    this.config = config;
    this.client = new TriggerApi({
      baseURL: config.apiUrl || "https://api.trigger.dev",
      apiKey: config.apiKey,
    });
  }

  async getProjectRuns(options?: {
    status?: string[];
    taskIdentifier?: string;
    limit?: number;
    after?: string;
  }) {
    try {
      const response = await this.client.runs.list(this.config.projectId, {
        status: options?.status,
        taskIdentifier: options?.taskIdentifier,
        limit: options?.limit || 50,
        after: options?.after,
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch project runs:', error);
      throw error;
    }
  }

  async getRunDetails(runId: string) {
    try {
      const response = await this.client.runs.retrieve(runId);
      return response;
    } catch (error) {
      console.error(`Failed to fetch run details for ${runId}:`, error);
      throw error;
    }
  }

  async getProjectTasks() {
    try {
      const response = await this.client.tasks.list(this.config.projectId);
      return response;
    } catch (error) {
      console.error('Failed to fetch project tasks:', error);
      throw error;
    }
  }

  async triggerTask(taskId: string, payload: any, options?: {
    idempotencyKey?: string;
    delay?: number;
    ttl?: number;
  }) {
    try {
      const response = await this.client.tasks.trigger(taskId, {
        payload,
        options: {
          idempotencyKey: options?.idempotencyKey,
          delay: options?.delay,
          ttl: options?.ttl,
        },
      });
      return response;
    } catch (error) {
      console.error(`Failed to trigger task ${taskId}:`, error);
      throw error;
    }
  }

  async cancelRun(runId: string) {
    try {
      const response = await this.client.runs.cancel(runId);
      return response;
    } catch (error) {
      console.error(`Failed to cancel run ${runId}:`, error);
      throw error;
    }
  }

  async replayRun(runId: string) {
    try {
      const response = await this.client.runs.replay(runId);
      return response;
    } catch (error) {
      console.error(`Failed to replay run ${runId}:`, error);
      throw error;
    }
  }

  async getProjectMetrics(timeframe: '1h' | '24h' | '7d' | '30d' = '24h') {
    try {
      // Note: This might need to be implemented based on Trigger.dev's actual metrics API
      // For now, we'll calculate from runs data
      const runs = await this.getProjectRuns({ limit: 1000 });

      const now = new Date();
      const timeframeMs = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      }[timeframe];

      const cutoff = new Date(now.getTime() - timeframeMs);
      const recentRuns = runs.data.filter(run =>
        new Date(run.createdAt) > cutoff
      );

      const totalRuns = recentRuns.length;
      const successfulRuns = recentRuns.filter(run => run.status === 'COMPLETED').length;
      const failedRuns = recentRuns.filter(run => run.status === 'FAILED').length;
      const runningRuns = recentRuns.filter(run => run.status === 'EXECUTING').length;

      return {
        totalRuns,
        successfulRuns,
        failedRuns,
        runningRuns,
        successRate: totalRuns > 0 ? successfulRuns / totalRuns : 0,
        averageDuration: this.calculateAverageDuration(recentRuns),
        timeframe,
      };
    } catch (error) {
      console.error('Failed to get project metrics:', error);
      throw error;
    }
  }

  private calculateAverageDuration(runs: any[]): number {
    const completedRuns = runs.filter(run =>
      run.status === 'COMPLETED' && run.startedAt && run.completedAt
    );

    if (completedRuns.length === 0) return 0;

    const totalDuration = completedRuns.reduce((sum, run) => {
      const duration = new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime();
      return sum + duration;
    }, 0);

    return totalDuration / completedRuns.length;
  }

  // WebSocket connection for real-time updates
  createRealtimeConnection(onMessage: (data: any) => void, onError?: (error: any) => void) {
    const wsUrl = `${this.config.apiUrl?.replace('https', 'wss') || 'wss://api.trigger.dev'}/projects/${this.config.projectId}/stream`;

    const ws = new WebSocket(wsUrl, [], {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    ws.onopen = () => {
      console.log('Trigger.dev WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Trigger.dev WebSocket error:', error);
      if (onError) onError(error);
    };

    ws.onclose = () => {
      console.log('Trigger.dev WebSocket disconnected');
    };

    return ws;
  }
}

// Singleton instance
let triggerDevClient: TriggerDevApiClient | null = null;

export function getTriggerDevClient(): TriggerDevApiClient {
  if (!triggerDevClient) {
    const apiKey = process.env.NEXT_PUBLIC_TRIGGER_DEV_API_KEY || process.env.TRIGGER_DEV_API_KEY;
    const projectId = process.env.NEXT_PUBLIC_TRIGGER_DEV_PROJECT_ID || 'serviceflow-ai';

    if (!apiKey) {
      throw new Error('Trigger.dev API key not found. Set TRIGGER_DEV_API_KEY environment variable.');
    }

    triggerDevClient = new TriggerDevApiClient({
      apiKey,
      projectId,
      apiUrl: process.env.NEXT_PUBLIC_TRIGGER_DEV_API_URL,
    });
  }

  return triggerDevClient;
}

export default TriggerDevApiClient;