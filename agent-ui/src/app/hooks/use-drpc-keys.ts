'use client';

import { useState, useEffect, useCallback } from 'react';
import { DRPCClient, createDRPCClient } from '../services/drpc-client';
import { KeyUsageInfo, ApiResponse } from '../types/drpc';

interface UseDRPCKeysOptions {
  apiKey?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseDRPCKeysReturn {
  keys: KeyUsageInfo[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
  totalKeys: number;
  activeKeys: number;
  totalCUUsed: number;
  totalCULimit: number;
}

export const useDRPCKeys = (options: UseDRPCKeysOptions = {}): UseDRPCKeysReturn => {
  const {
    apiKey,
    autoRefresh = true,
    refreshInterval = 120000, // 2 minutes
  } = options;

  const [keys, setKeys] = useState<KeyUsageInfo[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Fetch keys function
  const fetchKeys = useCallback(async (): Promise<void> => {
    if (!client) {
      setError('dRPC client not initialized');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<KeyUsageInfo[]> = await client.getKeyUsageInfo();
      
      if (response.success && response.data) {
        setKeys(response.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(response.error || 'Failed to fetch API keys');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('dRPC keys fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Initial fetch
  useEffect(() => {
    if (client) {
      fetchKeys();
    }
  }, [client, fetchKeys]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !client) return;

    const interval = setInterval(() => {
      fetchKeys();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchKeys, client]);

  // Calculate derived stats
  const totalKeys = keys?.length || 0;
  const activeKeys = keys?.filter(key => key.isActive).length || 0;
  const totalCUUsed = keys?.reduce((sum, key) => sum + key.cu_spent_today, 0) || 0;
  const totalCULimit = keys?.reduce((sum, key) => sum + (key.key.cu_day_limit || 0), 0) || 0;

  return {
    keys,
    loading,
    error,
    refetch: fetchKeys,
    lastUpdated,
    totalKeys,
    activeKeys,
    totalCUUsed,
    totalCULimit,
  };
};