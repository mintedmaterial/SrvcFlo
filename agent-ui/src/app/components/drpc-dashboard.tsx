'use client';

import React from 'react';
import { useDRPCStats } from '../hooks/use-drpc-stats';
import { useDRPCKeys } from '../hooks/use-drpc-keys';
import { TimeRange } from '../types/drpc';
import { 
  Activity, 
  Server, 
  Key, 
  TrendingUp, 
  AlertCircle, 
  RefreshCw,
  Database,
  Network,
  Clock,
  Shield
} from 'lucide-react';

interface DRPCDashboardProps {
  apiKey?: string;
  className?: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
  }).format(amount);
};

export const DRPCDashboard: React.FC<DRPCDashboardProps> = ({ 
  apiKey, 
  className = '' 
}) => {
  const { 
    stats, 
    loading: statsLoading, 
    error: statsError, 
    refetch: refetchStats,
    setTimeRange,
    timeRange,
    lastUpdated: statsLastUpdated 
  } = useDRPCStats({ apiKey });

  const { 
    keys, 
    loading: keysLoading, 
    error: keysError, 
    refetch: refetchKeys,
    totalKeys,
    activeKeys,
    totalCUUsed,
    totalCULimit,
    lastUpdated: keysLastUpdated 
  } = useDRPCKeys({ apiKey });

  const handleRefreshAll = async () => {
    await Promise.all([refetchStats(), refetchKeys()]);
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  const hasError = statsError || keysError;
  const isLoading = statsLoading || keysLoading;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              dRPC Cloud Node Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor your Sonic blockchain infrastructure
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value as TimeRange)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            <option value="hour">Last Hour</option>
            <option value="day">Last Day</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
          
          <button
            onClick={handleRefreshAll}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {hasError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800 dark:text-red-200">
              {statsError || keysError}
            </span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !stats && !keys && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {/* Main Content */}
      {!hasError && (stats || keys) && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Balance */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Account Balance
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats ? formatCurrency(stats.balance) : '--'}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Total Requests */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Requests ({timeRange})
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats ? formatNumber(stats.totalRequests) : '--'}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Compute Units */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Compute Units Used
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats ? formatNumber(stats.totalCU) : '--'}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Server className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Active Keys */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active API Keys
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {activeKeys}/{totalKeys}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <Key className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Network Breakdown */}
          {stats && stats.networkBreakdown.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Network className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Network Usage Breakdown
                  </h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.networkBreakdown.map((network) => (
                    <div key={network.network} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {network.network}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {network.providers.length} providers • {network.methods.length} methods
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatNumber(network.totalRequests)} requests
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatNumber(network.totalCU)} CU
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* API Keys Table */}
          {keys && keys.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    API Keys Usage
                  </h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Key Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage Today
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Daily Limit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {keys.map((key) => (
                      <tr key={key.key.key_id || key.key.api_key}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {key.key.name || 'Unnamed Key'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            key.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          }`}>
                            {key.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatNumber(key.cu_spent_today)} CU
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {key.key.cu_day_limit ? formatNumber(key.key.cu_day_limit) : 'Unlimited'} CU
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  key.usagePercentage > 80 
                                    ? 'bg-red-500' 
                                    : key.usagePercentage > 60 
                                      ? 'bg-yellow-500' 
                                      : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, key.usagePercentage)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {key.usagePercentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>
                  Stats: {statsLastUpdated?.toLocaleString() || 'Never'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Key className="h-4 w-4" />
                <span>
                  Keys: {keysLastUpdated?.toLocaleString() || 'Never'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};