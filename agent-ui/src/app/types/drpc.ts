/**
 * dRPC Cloud Node API TypeScript Interfaces
 * Based on documentation from: C:\Users\PC\ServiceApp\DOCS\dRPC_cloud_node\Web API's\Overview.md
 */

export interface MetricsResponseJSON {
  balance: number;
  data: GroupedDataItem[];
}

export interface GroupedDataItem {
  client_key: string;
  request_count: number;
  cu: number;
  network: string;
  connection: string;
  provider_id: string;
  method: string;
}

export interface TKey {
  cu_spent_today: number;
  key: Required<DataKey>;
  public_keys: Required<JwtsPublicKey>[];
}

export interface DataKey {
  api_key?: string;
  cors_origins?: string[];
  /** @example 100 */
  cu_day_limit?: number;
  fallback_enabled?: boolean;
  fallback_providers?: string[];
  ip_whitelist?: string[];
  jwt_enabled?: boolean;
  key_id?: string;
  methods_blacklist?: string[];
  mev_enabled?: boolean;
  mev_fallback?: boolean;
  mev_providers?: string[];
  /** @example "test" */
  name?: string;
  owner_id?: string;
  providers?: string[];
  rate_limit?: number;
  status?: boolean;
  /** @example "2022-09-16T12:15:30.331Z" */
  updated_at?: string;
}

export interface JwtsPublicKey {
  id: string;
  public_key: string;
  created_at: string;
  algorithm?: string;
}

export type TimeRange = 'hour' | 'day' | 'week' | 'month';

export interface DRPCConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface DRPCClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface NetworkStats {
  network: string;
  totalRequests: number;
  totalCU: number;
  providers: string[];
  methods: string[];
}

export interface UsageStats {
  balance: number;
  totalRequests: number;
  totalCU: number;
  networkBreakdown: NetworkStats[];
  timeRange: TimeRange;
  lastUpdated: string;
}

export interface KeyUsageInfo extends TKey {
  usagePercentage: number;
  remainingCU: number;
  isActive: boolean;
}