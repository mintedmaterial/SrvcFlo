"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Database,
  Server,
  Zap,
  Wifi,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  DollarSign,
  Bell,
  BellOff,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import type { SystemHealthMetrics } from '@/types/monitoring';

interface SystemHealthProps {
  healthMetrics: SystemHealthMetrics;
  onAcknowledgeAlert: (alertId: string) => void;
  onRefreshHealth: () => void;
  className?: string;
}

const healthColors = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  critical: 'bg-red-500'
};

const healthIcons = {
  healthy: CheckCircle2,
  degraded: AlertTriangle,
  critical: XCircle
};

const alertLevelColors = {
  info: 'border-blue-500 text-blue-400',
  warning: 'border-yellow-500 text-yellow-400',
  error: 'border-orange-500 text-orange-400',
  critical: 'border-red-500 text-red-400'
};

const alertLevelIcons = {
  info: Bell,
  warning: AlertTriangle,
  error: XCircle,
  critical: AlertTriangle
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatCurrency = (amount: number) => {
  return `$${amount.toFixed(4)}`;
};

const getUptimeDisplay = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))}m`;
  return `${Math.floor(diff / (1000 * 60))}m`;
};

export default function SystemHealth({
  healthMetrics,
  onAcknowledgeAlert,
  onRefreshHealth,
  className = ""
}: SystemHealthProps) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const alertStats = useMemo(() => {
    const alerts = healthMetrics.alerts;
    const unacknowledged = alerts.filter(a => !a.acknowledged).length;
    const critical = alerts.filter(a => a.level === 'critical' && !a.acknowledged).length;
    const error = alerts.filter(a => a.level === 'error' && !a.acknowledged).length;
    const warning = alerts.filter(a => a.level === 'warning' && !a.acknowledged).length;

    return { unacknowledged, critical, error, warning, total: alerts.length };
  }, [healthMetrics.alerts]);

  const filteredAlerts = useMemo(() => {
    return healthMetrics.alerts.filter(alert =>
      showAcknowledged || !alert.acknowledged
    ).sort((a, b) => {
      // Sort by level (critical > error > warning > info), then by timestamp
      const levelOrder = { critical: 0, error: 1, warning: 2, info: 3 };
      const aLevel = levelOrder[a.level];
      const bLevel = levelOrder[b.level];

      if (aLevel !== bLevel) return aLevel - bLevel;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [healthMetrics.alerts, showAcknowledged]);

  const OverallHealthIcon = healthIcons[healthMetrics.overall];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">System Health</h2>
          <p className="text-gray-400">Real-time infrastructure monitoring and alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${healthColors[healthMetrics.overall]} animate-pulse`} />
            <span className="text-white font-medium capitalize">{healthMetrics.overall}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onRefreshHealth}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${healthColors[healthMetrics.overall]} bg-opacity-20`}>
                <OverallHealthIcon className={`w-8 h-8 text-white`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white capitalize">{healthMetrics.overall}</h3>
                <p className="text-gray-400">System is {healthMetrics.overall === 'healthy' ? 'operating normally' : healthMetrics.overall === 'degraded' ? 'experiencing minor issues' : 'experiencing critical issues'}</p>
                <p className="text-sm text-gray-500">Last updated: {healthMetrics.timestamp.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Uptime</p>
              <p className="text-xl font-bold text-white">{getUptimeDisplay(healthMetrics.timestamp)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Database */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => setSelectedComponent(selectedComponent === 'database' ? null : 'database')}
        >
          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  <CardTitle className="text-white">Database</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={`${healthColors[healthMetrics.components.database.status]} text-white border-0`}
                >
                  {healthMetrics.components.database.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Response Time</p>
                  <p className="text-white font-semibold">{healthMetrics.components.database.responseTime}ms</p>
                </div>
                <div>
                  <p className="text-gray-400">Connections</p>
                  <p className="text-white font-semibold">
                    {healthMetrics.components.database.connectionPool.active}/{healthMetrics.components.database.connectionPool.total}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Pool Usage</span>
                  <span className="text-white">
                    {Math.round((healthMetrics.components.database.connectionPool.active / healthMetrics.components.database.connectionPool.total) * 100)}%
                  </span>
                </div>
                <Progress
                  value={(healthMetrics.components.database.connectionPool.active / healthMetrics.components.database.connectionPool.total) * 100}
                  className="h-1"
                />
              </div>
              {healthMetrics.components.database.lastBackup && (
                <p className="text-xs text-gray-500">
                  Last backup: {healthMetrics.components.database.lastBackup.toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Blockchain */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => setSelectedComponent(selectedComponent === 'blockchain' ? null : 'blockchain')}
        >
          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-purple-400" />
                  <CardTitle className="text-white">Blockchain</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={`${healthColors[healthMetrics.components.blockchain.status]} text-white border-0`}
                >
                  {healthMetrics.components.blockchain.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Network</p>
                  <p className="text-white font-semibold capitalize">{healthMetrics.components.blockchain.network}</p>
                </div>
                <div>
                  <p className="text-gray-400">Block Height</p>
                  <p className="text-white font-semibold">{healthMetrics.components.blockchain.blockHeight.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Gas Price</p>
                  <p className="text-white font-semibold">{healthMetrics.components.blockchain.gasPrice} gwei</p>
                </div>
                <div>
                  <p className="text-gray-400">Dev Balance</p>
                  <p className="text-white font-semibold">{formatCurrency(healthMetrics.components.blockchain.walletBalances.dev)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Agents */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => setSelectedComponent(selectedComponent === 'agents' ? null : 'agents')}
        >
          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-green-400" />
                  <CardTitle className="text-white">Agents</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={`${healthColors[healthMetrics.components.agents.status]} text-white border-0`}
                >
                  {healthMetrics.components.agents.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Active</p>
                  <p className="text-white font-semibold">
                    {healthMetrics.components.agents.activeAgents}/{healthMetrics.components.agents.totalAgents}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Response Time</p>
                  <p className="text-white font-semibold">{healthMetrics.components.agents.averageResponseTime}ms</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Error Rate</span>
                  <span className="text-white">{(healthMetrics.components.agents.errorRate * 100).toFixed(2)}%</span>
                </div>
                <Progress value={healthMetrics.components.agents.errorRate * 100} className="h-1" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trigger.dev */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => setSelectedComponent(selectedComponent === 'triggerDev' ? null : 'triggerDev')}
        >
          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <CardTitle className="text-white">Trigger.dev</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={`${healthColors[healthMetrics.components.triggerDev.status]} text-white border-0`}
                >
                  {healthMetrics.components.triggerDev.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Active Tasks</p>
                  <p className="text-white font-semibold">{healthMetrics.components.triggerDev.activeTasks}</p>
                </div>
                <div>
                  <p className="text-gray-400">Queued Jobs</p>
                  <p className="text-white font-semibold">{healthMetrics.components.triggerDev.queuedJobs}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Failed Jobs</p>
                  <p className="text-white font-semibold">{healthMetrics.components.triggerDev.failedJobs}</p>
                </div>
                <div>
                  <p className="text-gray-400">Last Success</p>
                  <p className="text-white font-semibold text-xs">
                    {healthMetrics.components.triggerDev.lastSuccessfulRun ?
                      getUptimeDisplay(healthMetrics.components.triggerDev.lastSuccessfulRun) : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* MCP Servers */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => setSelectedComponent(selectedComponent === 'mcpServers' ? null : 'mcpServers')}
        >
          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-orange-400" />
                  <CardTitle className="text-white">MCP Servers</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={`${healthColors[healthMetrics.components.mcpServers.status]} text-white border-0`}
                >
                  {healthMetrics.components.mcpServers.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {healthMetrics.components.mcpServers.servers.slice(0, 3).map((server, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{server.name}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      server.status === 'connected' ? 'bg-green-500' :
                      server.status === 'disconnected' ? 'bg-gray-500' : 'bg-red-500'
                    }`} />
                    <span className="text-white text-xs">{server.responseTime}ms</span>
                  </div>
                </div>
              ))}
              {healthMetrics.components.mcpServers.servers.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{healthMetrics.components.mcpServers.servers.length - 3} more servers
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alerts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">System Alerts</h3>
            <p className="text-gray-400">Active system notifications and warnings</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-white">{alertStats.critical} Critical</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-white">{alertStats.error} Error</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-white">{alertStats.warning} Warning</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAcknowledged(!showAcknowledged)}
            >
              {showAcknowledged ? <BellOff className="w-4 h-4 mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
              {showAcknowledged ? 'Hide Acknowledged' : 'Show All'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => {
              const AlertIcon = alertLevelIcons[alert.level];

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 border-l-4 rounded-r-lg ${alertLevelColors[alert.level]} ${
                    alert.acknowledged ? 'bg-gray-800/50' : 'bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertIcon className="w-5 h-5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-medium">{alert.component}</h4>
                          <Badge variant="outline" className="text-xs">
                            {alert.level}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge variant="outline" className="bg-gray-600 text-white border-0 text-xs">
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm mt-1">{alert.message}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {alert.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAcknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                  <p className="text-gray-400 text-lg">No active alerts</p>
                  <p className="text-gray-500 text-sm">
                    {showAcknowledged ? 'All alerts have been acknowledged' : 'System is operating normally'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Detailed Component View */}
      <AnimatePresence>
        {selectedComponent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white capitalize">{selectedComponent} Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedComponent(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedComponent === 'database' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <h4 className="text-white font-medium mb-2">Connection Pool</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Active:</span>
                            <span className="text-white">{healthMetrics.components.database.connectionPool.active}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Idle:</span>
                            <span className="text-white">{healthMetrics.components.database.connectionPool.idle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total:</span>
                            <span className="text-white">{healthMetrics.components.database.connectionPool.total}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <h4 className="text-white font-medium mb-2">Performance</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Response Time:</span>
                            <span className="text-white">{healthMetrics.components.database.responseTime}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className="text-white capitalize">{healthMetrics.components.database.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <h4 className="text-white font-medium mb-2">Backup</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Last Backup:</span>
                            <span className="text-white text-xs">
                              {healthMetrics.components.database.lastBackup?.toLocaleString() || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent === 'blockchain' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="text-white font-medium">Network Status</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Network:</span>
                            <span className="text-white capitalize">{healthMetrics.components.blockchain.network}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Block Height:</span>
                            <span className="text-white">{healthMetrics.components.blockchain.blockHeight.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Gas Price:</span>
                            <span className="text-white">{healthMetrics.components.blockchain.gasPrice} gwei</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-white font-medium">Wallet Balances</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Dev Wallet:</span>
                            <span className="text-white">{formatCurrency(healthMetrics.components.blockchain.walletBalances.dev)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Leaderboard:</span>
                            <span className="text-white">{formatCurrency(healthMetrics.components.blockchain.walletBalances.leaderboard)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">NFT Staking:</span>
                            <span className="text-white">{formatCurrency(healthMetrics.components.blockchain.walletBalances.nftStaking)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent === 'mcpServers' && (
                  <div className="space-y-4">
                    <h4 className="text-white font-medium">MCP Server Status</h4>
                    <div className="space-y-2">
                      {healthMetrics.components.mcpServers.servers.map((server, index) => (
                        <div key={index} className="p-3 bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-white font-medium">{server.name}</h5>
                              <p className="text-gray-400 text-sm">Last ping: {server.lastPing.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant="outline"
                                className={`${
                                  server.status === 'connected' ? 'bg-green-500' :
                                  server.status === 'disconnected' ? 'bg-gray-500' : 'bg-red-500'
                                } text-white border-0 mb-1`}
                              >
                                {server.status}
                              </Badge>
                              <p className="text-gray-400 text-sm">{server.responseTime}ms</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}