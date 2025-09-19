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
  Cpu,
  MemoryStick,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Zap,
  Server,
  Wifi,
  WifiOff
} from 'lucide-react';
import type { AgentPerformanceMetrics } from '@/types/monitoring';

interface AgentMetricsProps {
  agents: AgentPerformanceMetrics[];
  onAgentAction: (agentId: string, action: 'restart' | 'stop' | 'start') => void;
  className?: string;
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  error: 'bg-red-500',
  maintenance: 'bg-yellow-500'
};

const statusIcons = {
  online: Wifi,
  offline: WifiOff,
  error: XCircle,
  maintenance: AlertTriangle
};

const agentTypeColors = {
  content: 'bg-purple-500',
  facebook: 'bg-blue-500',
  google: 'bg-red-500',
  discord: 'bg-indigo-500',
  'auth-bridge': 'bg-green-500',
  'admin-verification': 'bg-orange-500'
};

const getHealthStatus = (metrics: AgentPerformanceMetrics['metrics']) => {
  const errorRate = metrics.errorRate;
  const uptime = metrics.uptime;
  const responseTime = metrics.averageResponseTime;

  if (errorRate > 0.1 || uptime < 0.9 || responseTime > 5000) return 'critical';
  if (errorRate > 0.05 || uptime < 0.95 || responseTime > 2000) return 'warning';
  return 'healthy';
};

const formatUptime = (uptime: number) => {
  const percentage = (uptime * 100).toFixed(2);
  return `${percentage}%`;
};

const formatMemory = (bytes: number) => {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

const formatResponseTime = (ms: number) => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

export default function AgentMetrics({
  agents,
  onAgentAction,
  className = ""
}: AgentMetricsProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'performance'>('name');

  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      switch (sortBy) {
        case 'status':
          const statusOrder = { online: 0, maintenance: 1, error: 2, offline: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'performance':
          const aHealth = getHealthStatus(a.metrics);
          const bHealth = getHealthStatus(b.metrics);
          const healthOrder = { healthy: 0, warning: 1, critical: 2 };
          return healthOrder[aHealth] - healthOrder[bHealth];
        default:
          return a.agentName.localeCompare(b.agentName);
      }
    });
  }, [agents, sortBy]);

  const overallStats = useMemo(() => {
    const total = agents.length;
    const online = agents.filter(a => a.status === 'online').length;
    const avgResponseTime = agents.reduce((sum, a) => sum + a.metrics.averageResponseTime, 0) / total;
    const avgErrorRate = agents.reduce((sum, a) => sum + a.metrics.errorRate, 0) / total;
    const totalRequests = agents.reduce((sum, a) => sum + a.metrics.totalRequests, 0);

    return { total, online, avgResponseTime, avgErrorRate, totalRequests };
  }, [agents]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Agent Performance</h2>
          <p className="text-gray-400">Real-time agent monitoring and metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('name')}
          >
            Name
          </Button>
          <Button
            variant={sortBy === 'status' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('status')}
          >
            Status
          </Button>
          <Button
            variant={sortBy === 'performance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('performance')}
          >
            Performance
          </Button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400 text-sm">Total Agents</span>
            </div>
            <p className="text-2xl font-bold text-white">{overallStats.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wifi className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-sm">Online</span>
            </div>
            <p className="text-2xl font-bold text-white">{overallStats.online}</p>
            <p className="text-xs text-gray-500">
              {((overallStats.online / overallStats.total) * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-400 text-sm">Avg Response</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatResponseTime(overallStats.avgResponseTime)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-gray-400 text-sm">Error Rate</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {(overallStats.avgErrorRate * 100).toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-sm">Total Requests</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {overallStats.totalRequests.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedAgents.map((agent) => {
          const StatusIcon = statusIcons[agent.status];
          const healthStatus = getHealthStatus(agent.metrics);
          const timeSinceActivity = Date.now() - agent.lastActivity.getTime();

          return (
            <motion.div
              key={agent.agentId}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer"
              onClick={() => setSelectedAgent(selectedAgent === agent.agentId ? null : agent.agentId)}
            >
              <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${statusColors[agent.status]} animate-pulse`} />
                      <StatusIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex gap-1">
                      <Badge
                        variant="outline"
                        className={`${agentTypeColors[agent.agentType]} text-white border-0 text-xs`}
                      >
                        {agent.agentType}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`${
                          healthStatus === 'healthy' ? 'bg-green-500' :
                          healthStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        } text-white border-0 text-xs`}
                      >
                        {healthStatus}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-white text-lg">{agent.agentName}</CardTitle>
                  <CardDescription>
                    Last active {timeSinceActivity < 60000 ? 'just now' :
                      `${Math.floor(timeSinceActivity / 60000)}m ago`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs text-gray-400">Response Time</span>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {formatResponseTime(agent.metrics.averageResponseTime)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-gray-400">Success Rate</span>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {((1 - agent.metrics.errorRate) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Resource Usage */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-gray-400">CPU Usage</span>
                      </div>
                      <span className="text-xs text-white">{agent.metrics.cpuUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={agent.metrics.cpuUsage} className="h-1" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <MemoryStick className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-gray-400">Memory</span>
                      </div>
                      <span className="text-xs text-white">{formatMemory(agent.metrics.memoryUsage)}</span>
                    </div>
                    <Progress
                      value={(agent.metrics.memoryUsage / (1024 * 1024 * 1024)) * 100}
                      className="h-1"
                    />
                  </div>

                  {/* Uptime */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-gray-400">Uptime</span>
                    </div>
                    <span className="text-xs text-white font-semibold">
                      {formatUptime(agent.metrics.uptime)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAgentAction(agent.agentId, 'restart');
                      }}
                      className="flex-1 text-xs"
                      disabled={agent.status === 'offline'}
                    >
                      Restart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAgentAction(agent.agentId, agent.status === 'online' ? 'stop' : 'start');
                      }}
                      className="flex-1 text-xs"
                    >
                      {agent.status === 'online' ? 'Stop' : 'Start'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Agent View */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {(() => {
              const agent = agents.find(a => a.agentId === selectedAgent);
              if (!agent) return null;

              return (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">{agent.agentName} - Detailed Metrics</CardTitle>
                        <CardDescription>Comprehensive performance analysis and health checks</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAgent(null)}
                      >
                        ✕
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="metrics" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
                        <TabsTrigger value="health">Health Checks</TabsTrigger>
                        <TabsTrigger value="requests">Request Stats</TabsTrigger>
                      </TabsList>

                      <TabsContent value="metrics" className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Zap className="w-4 h-4 text-blue-400" />
                              <span className="text-gray-400 text-sm">Total Requests</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {agent.metrics.totalRequests.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              <span className="text-gray-400 text-sm">Successful</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {agent.metrics.successfulRequests.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <XCircle className="w-4 h-4 text-red-400" />
                              <span className="text-gray-400 text-sm">Failed</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {agent.metrics.failedRequests.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Activity className="w-4 h-4 text-green-400" />
                              <span className="text-gray-400 text-sm">Uptime</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {formatUptime(agent.metrics.uptime)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="text-white font-medium">Resource Usage</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-400">CPU Usage</span>
                                <span className="text-white">{agent.metrics.cpuUsage.toFixed(1)}%</span>
                              </div>
                              <Progress value={agent.metrics.cpuUsage} />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Memory Usage</span>
                                <span className="text-white">{formatMemory(agent.metrics.memoryUsage)}</span>
                              </div>
                              <Progress value={(agent.metrics.memoryUsage / (1024 * 1024 * 1024)) * 100} />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-white font-medium">Performance</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Average Response Time</span>
                                <span className="text-white">{formatResponseTime(agent.metrics.averageResponseTime)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Error Rate</span>
                                <span className="text-white">{(agent.metrics.errorRate * 100).toFixed(2)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="health" className="space-y-3">
                        {agent.healthChecks.map((check, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  check.status === 'healthy' ? 'bg-green-500' :
                                  check.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                                <span className="text-white font-medium">Health Check</span>
                                <Badge variant="outline">{check.status}</Badge>
                              </div>
                              <span className="text-sm text-gray-400">
                                {check.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">Response Time</p>
                                <p className="text-white">{formatResponseTime(check.responseTime)}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Status</p>
                                <p className="text-white capitalize">{check.status}</p>
                              </div>
                            </div>
                            {check.details && (
                              <p className="text-sm text-gray-300 mt-2">{check.details}</p>
                            )}
                          </motion.div>
                        ))}
                      </TabsContent>

                      <TabsContent value="requests" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-gray-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-400">Success Rate</span>
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {((1 - agent.metrics.errorRate) * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {agent.metrics.successfulRequests} / {agent.metrics.totalRequests}
                            </p>
                          </div>

                          <div className="p-4 bg-gray-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-400">Error Rate</span>
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {(agent.metrics.errorRate * 100).toFixed(2)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {agent.metrics.failedRequests} failed requests
                            </p>
                          </div>

                          <div className="p-4 bg-gray-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-400">Avg Response</span>
                              <Clock className="w-4 h-4 text-yellow-400" />
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {formatResponseTime(agent.metrics.averageResponseTime)}
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}