"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  TrendingUp,
  Zap
} from 'lucide-react';
import type { TriggerDevTask, WorkflowRun } from '@/types/monitoring';

interface WorkflowMonitorProps {
  tasks: TriggerDevTask[];
  onTaskAction: (taskId: string, action: 'start' | 'pause' | 'restart') => void;
  onRefresh: () => void;
  className?: string;
}

const statusColors = {
  idle: 'bg-gray-500',
  running: 'bg-blue-500',
  error: 'bg-red-500',
  disabled: 'bg-gray-400'
};

const statusIcons = {
  idle: Clock,
  running: Activity,
  error: XCircle,
  disabled: Pause
};

const taskTypeColors = {
  'content-generation': 'bg-purple-500',
  'payment-processing': 'bg-green-500',
  'agent-workflow': 'bg-blue-500',
  'system-maintenance': 'bg-orange-500'
};

const runStatusColors = {
  pending: 'bg-yellow-500',
  running: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-500'
};

export default function WorkflowMonitor({
  tasks,
  onTaskAction,
  onRefresh,
  className = ""
}: WorkflowMonitorProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(onRefresh, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, onRefresh]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getTaskMetrics = (task: TriggerDevTask) => {
    const runningTasks = task.recentRuns.filter(run => run.status === 'running').length;
    const avgDuration = task.averageDuration;
    const successRate = task.successRate;

    return { runningTasks, avgDuration, successRate };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Workflow Monitor</h2>
          <p className="text-gray-400">Real-time Trigger.dev task monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'border-green-500' : 'border-gray-500'}
          >
            <Activity className="w-4 h-4 mr-2" />
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Task Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tasks.map((task) => {
          const StatusIcon = statusIcons[task.status];
          const metrics = getTaskMetrics(task);

          return (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer"
              onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
            >
              <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${statusColors[task.status]} animate-pulse`} />
                      <StatusIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <Badge
                      variant="outline"
                      className={`${taskTypeColors[task.type]} text-white border-0`}
                    >
                      {task.type}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-lg">{task.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400">Success Rate</p>
                      <p className="text-white font-semibold">{(metrics.successRate * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Avg Duration</p>
                      <p className="text-white font-semibold">{formatDuration(metrics.avgDuration)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-400">
                      {task.totalRuns} runs, {task.failedRuns} failed
                    </span>
                  </div>

                  {task.status === 'running' && metrics.runningTasks > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Running Tasks</span>
                        <span className="text-white">{metrics.runningTasks}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1">
                        <div
                          className="bg-blue-500 h-1 rounded-full animate-pulse"
                          style={{ width: `${Math.min(metrics.runningTasks * 20, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskAction(task.id, task.status === 'running' ? 'pause' : 'start');
                      }}
                      className="flex-1"
                    >
                      {task.status === 'running' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskAction(task.id, 'restart');
                      }}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Task View */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {(() => {
              const task = tasks.find(t => t.id === selectedTask);
              if (!task) return null;

              return (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">{task.name} - Detailed View</CardTitle>
                        <CardDescription>Task execution history and metrics</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTask(null)}
                      >
                        ✕
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="runs" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="runs">Recent Runs</TabsTrigger>
                        <TabsTrigger value="metrics">Metrics</TabsTrigger>
                        <TabsTrigger value="schedule">Schedule</TabsTrigger>
                      </TabsList>

                      <TabsContent value="runs" className="space-y-3">
                        {task.recentRuns.map((run) => (
                          <motion.div
                            key={run.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${runStatusColors[run.status]}`} />
                                <span className="text-white font-medium">{run.id}</span>
                                <Badge variant="outline">{run.status}</Badge>
                              </div>
                              <span className="text-sm text-gray-400">
                                {run.startedAt.toLocaleTimeString()}
                              </span>
                            </div>

                            {run.status === 'running' && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-400">Progress</span>
                                  <span className="text-white">{run.progress}%</span>
                                </div>
                                <Progress value={run.progress} className="h-1" />
                              </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                              <div>
                                <p className="text-gray-400">Agent Type</p>
                                <p className="text-white">{run.metadata.agentType}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Duration</p>
                                <p className="text-white">
                                  {run.duration ? formatDuration(run.duration) : '-'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Memory</p>
                                <p className="text-white">
                                  {run.metadata.memoryUsage ? `${run.metadata.memoryUsage}MB` : '-'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Retries</p>
                                <p className="text-white">{run.metadata.retryCount}</p>
                              </div>
                            </div>

                            {run.error && (
                              <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded">
                                <div className="flex items-center gap-2 text-red-400">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span className="font-medium">{run.error.code}</span>
                                </div>
                                <p className="text-sm text-red-300 mt-1">{run.error.message}</p>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </TabsContent>

                      <TabsContent value="metrics" className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Zap className="w-4 h-4 text-blue-400" />
                              <span className="text-gray-400 text-sm">Total Runs</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{task.totalRuns}</p>
                          </div>
                          <div className="p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              <span className="text-gray-400 text-sm">Success Rate</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {(task.successRate * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-yellow-400" />
                              <span className="text-gray-400 text-sm">Avg Duration</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {formatDuration(task.averageDuration)}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <XCircle className="w-4 h-4 text-red-400" />
                              <span className="text-gray-400 text-sm">Failed Runs</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{task.failedRuns}</p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="schedule" className="space-y-4">
                        <div className="space-y-3">
                          <div className="p-3 bg-gray-800 rounded-lg">
                            <h4 className="text-white font-medium mb-2">Schedule Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">Last Run</p>
                                <p className="text-white">
                                  {task.lastRun ? task.lastRun.toLocaleString() : 'Never'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Next Run</p>
                                <p className="text-white">
                                  {task.nextRun ? task.nextRun.toLocaleString() : 'Not scheduled'}
                                </p>
                              </div>
                            </div>
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