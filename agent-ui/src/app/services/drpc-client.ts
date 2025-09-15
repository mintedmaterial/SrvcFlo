/**
 * dRPC Cloud Node API Client
 * Provides access to Statistics API and Keys API with proper error handling and rate limiting
 */

import {
  MetricsResponseJSON,
  TKey,
  TimeRange,
  DRPCClientOptions,
  ApiResponse,
  UsageStats,
  KeyUsageInfo,
  NetworkStats
} from '../types/drpc';

export class DRPCClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(options: DRPCClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://drpc.org/api';
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
  }

  /**
   * Generic fetch method with retry logic and error handling
   */
  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
          success: true,
          data,
          status: response.status,
        };
      } catch (error) {
        console.warn(`dRPC API attempt ${attempt}/${this.retries} failed:`, error);
        
        if (attempt === this.retries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 0,
          };
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
    };
  }

  /**
   * Get statistics data for specified time range
   */
  async getMetrics(range: TimeRange = 'day'): Promise<ApiResponse<MetricsResponseJSON>> {
    return this.fetchWithRetry<MetricsResponseJSON>(`/metrics/json?range=${range}`);
  }

  /**
   * Get Prometheus metrics (always returns last day)
   */
  async getPrometheusMetrics(): Promise<ApiResponse<string>> {
    try {
      const url = `${this.baseUrl}/metrics/prom`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      return {
        success: true,
        data: text,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get list of API keys
   */
  async getKeys(): Promise<ApiResponse<TKey[]>> {
    return this.fetchWithRetry<TKey[]>('/team/keys/list');
  }

  /**
   * Get processed usage statistics with additional insights
   */
  async getUsageStats(range: TimeRange = 'day'): Promise<ApiResponse<UsageStats>> {
    const metricsResponse = await this.getMetrics(range);
    
    if (!metricsResponse.success || !metricsResponse.data) {
      return {
        success: false,
        error: metricsResponse.error || 'Failed to fetch metrics',
      };
    }

    const { balance, data } = metricsResponse.data;
    
    // Process network breakdown
    const networkMap = new Map<string, NetworkStats>();
    
    data.forEach(item => {
      if (!networkMap.has(item.network)) {
        networkMap.set(item.network, {
          network: item.network,
          totalRequests: 0,
          totalCU: 0,
          providers: new Set<string>(),
          methods: new Set<string>(),
        } as NetworkStats & { providers: Set<string>, methods: Set<string> });
      }
      
      const stats = networkMap.get(item.network)!;
      stats.totalRequests += item.request_count;
      stats.totalCU += item.cu;
      (stats.providers as Set<string>).add(item.provider_id);
      (stats.methods as Set<string>).add(item.method);
    });

    // Convert Sets to arrays
    const networkBreakdown: NetworkStats[] = Array.from(networkMap.values()).map(stats => ({
      network: stats.network,
      totalRequests: stats.totalRequests,
      totalCU: stats.totalCU,
      providers: Array.from(stats.providers as Set<string>),
      methods: Array.from(stats.methods as Set<string>),
    }));

    const totalRequests = data.reduce((sum, item) => sum + item.request_count, 0);
    const totalCU = data.reduce((sum, item) => sum + item.cu, 0);

    return {
      success: true,
      data: {
        balance,
        totalRequests,
        totalCU,
        networkBreakdown,
        timeRange: range,
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  /**
   * Get enhanced key usage information with additional insights
   */
  async getKeyUsageInfo(): Promise<ApiResponse<KeyUsageInfo[]>> {
    const keysResponse = await this.getKeys();
    
    if (!keysResponse.success || !keysResponse.data) {
      return {
        success: false,
        error: keysResponse.error || 'Failed to fetch keys',
      };
    }

    const enhancedKeys: KeyUsageInfo[] = keysResponse.data.map(key => {
      const dailyLimit = key.key.cu_day_limit || 0;
      const used = key.cu_spent_today;
      const usagePercentage = dailyLimit > 0 ? (used / dailyLimit) * 100 : 0;
      const remainingCU = Math.max(0, dailyLimit - used);
      const isActive = key.key.status !== false;

      return {
        ...key,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        remainingCU,
        isActive,
      };
    });

    return {
      success: true,
      data: enhancedKeys,
    };
  }

  /**
   * Health check to verify API connectivity
   */
  async healthCheck(): Promise<ApiResponse<boolean>> {
    try {
      const response = await this.getMetrics('hour');
      return {
        success: response.success,
        data: response.success,
        error: response.error,
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }
}

// Default client instance
export const createDRPCClient = (apiKey: string, options?: Partial<DRPCClientOptions>) => {
  return new DRPCClient({
    apiKey,
    ...options,
  });
};

// Environment-based default client
export const getDefaultDRPCClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_DRPC_API_TOKEN;
  
  if (!apiKey) {
    throw new Error('DRPC API token not found. Set NEXT_PUBLIC_DRPC_API_TOKEN environment variable.');
  }
  
  return createDRPCClient(apiKey);
};