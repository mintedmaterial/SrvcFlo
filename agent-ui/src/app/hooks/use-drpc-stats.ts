'use client';

import { useState, useEffect, useCallback } from 'react';
import { DRPCClient, createDRPCClient } from '../services/drpc-client';
import { UsageStats, TimeRange, ApiResponse } from '../types/drpc';

interface UseDRPCStatsOptions {
  apiKey?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialRange?: TimeRange;
}

interface UseDRPCStatsReturn {
  stats: UsageStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setTimeRange: (range: TimeRange) => void;
  timeRange: TimeRange;
  lastUpdated: Date | null;
}

export const useDRPCStats = (options: UseDRPCStatsOptions = {}): UseDRPCStatsReturn => {
  const {
    apiKey,
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute
    initialRange = 'day',
  } = options;

  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(initialRange);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [client, setClient] = useState<DRPCClient | null>(null);

  // Initialize client
  useEffect(() => {
    try {
      const clientApiKey = apiKey || process.env.NEXT_PUBLIC_DRPC_API_TOKEN;
      
      if (!clientApiKey) {
        throw new Error('dRPC API token not provided');
      }
      
      const drpcClient = createDRPCClient(clientApiKey);
      setClient(drpcClient);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize dRPC client');
      setLoading(false);
    }
  }, [apiKey]);

  // Fetch stats function
  const fetchStats = useCallback(async (): Promise<void> => {
    if (!client) {
      setError('dRPC client not initialized');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<UsageStats> = await client.getUsageStats(timeRange);
      
      if (response.success && response.data) {
        setStats(response.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(response.error || 'Failed to fetch usage statistics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('dRPC stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [client, timeRange]);

  // Initial fetch and timeRange change effect
  useEffect(() => {
    if (client) {
      fetchStats();
    }
  }, [client, fetchStats]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !client) return;

    const interval = setInterval(() => {
      fetchStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchStats, client]);

  // Handle time range changes
  const handleSetTimeRange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    setTimeRange: handleSetTimeRange,
    timeRange,
    lastUpdated,
  };
};