"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  BarChart3,
  Zap,
  DollarSign,
  Heart,
  RefreshCw,
  Settings,
  Bell,
  TrendingUp,
  Users,
  Server,
  Wifi,
  WifiOff,
  AlertTriangle
} from 'lucide-react';

// Import monitoring components
import WorkflowMonitor from '@/components/monitoring/WorkflowMonitor';
import AgentMetrics from '@/components/monitoring/AgentMetrics';
import ContentPipeline from '@/components/monitoring/ContentPipeline';
import PaymentTracker from '@/components/monitoring/PaymentTracker';
import SystemHealth from '@/components/monitoring/SystemHealth';

// Import real-time monitoring hook
import { useRealtimeMonitoring } from '@/hooks/useRealtimeMonitoring';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Use real-time monitoring hook
  const {
    dashboardState,
    isConnected,
    isLoading,
    connectionStatus,
    lastUpdate,
    reconnect,
    refresh
  } = useRealtimeMonitoring({
    enableMockData: true, // Enable mock data for development
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
  });

  // Action handlers
  const handleTaskAction = (taskId: string, action: 'start' | 'pause' | 'restart') => {
    console.log(`Task action: ${action} on ${taskId}`);
    // In real implementation, this would trigger API calls
  };

  const handleAgentAction = (agentId: string, action: 'restart' | 'stop' | 'start') => {
    console.log(`Agent action: ${action} on ${agentId}`);
  };

  const handleContentAction = (itemId: string, action: 'cancel' | 'retry' | 'priority') => {
    console.log(`Content action: ${action} on ${itemId}`);
  };

  const handleViewOutput = (itemId: string) => {
    console.log(`View output for ${itemId}`);
  };

  const handleViewTransaction = (txHash: string) => {
    console.log(`View transaction ${txHash}`);
    window.open(`https://explorer.sonic.foundation/tx/${txHash}`, '_blank');
  };

  const handleRetryPayment = (paymentId: string) => {
    console.log(`Retry payment ${paymentId}`);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    if (dashboardState) {
      const updatedState = { ...dashboardState };
      const alert = updatedState.systemHealth.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
      }
      setDashboardState(updatedState);
    }
  };

  const handleRefreshHealth = () => {
    refresh();
  };

  if (isLoading || !dashboardState) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-lg text-gray-400">Loading ServiceFlow AI Dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const overallStats = {
    totalAgents: dashboardState.agents.length,
    activeAgents: dashboardState.agents.filter(a => a.status === 'online').length,
    totalContent: dashboardState.contentPipeline.length,
    processingContent: dashboardState.contentPipeline.filter(c => c.status === 'processing').length,
    totalPayments: dashboardState.payments.length,
    completedPayments: dashboardState.payments.filter(p => p.status === 'completed').length,
    systemHealth: dashboardState.systemHealth.overall,
    unacknowledgedAlerts: dashboardState.systemHealth.alerts.filter(a => !a.acknowledged).length
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">ServiceFlow AI Dashboard</h1>
            <p className="text-gray-400">Real-time monitoring and analytics for your AI platform</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' :
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
              } ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`} />
              <span className="text-sm text-gray-400 capitalize">
                {connectionStatus}
              </span>
              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
            {connectionStatus === 'error' && (
              <Button variant="outline" size="sm" onClick={reconnect}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reconnect
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Server className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400 text-sm">Agents</span>
              </div>
              <p className="text-xl font-bold text-white">
                {overallStats.activeAgents}/{overallStats.totalAgents}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span className="text-gray-400 text-sm">Content</span>
              </div>
              <p className="text-xl font-bold text-white">
                {overallStats.processingContent}/{overallStats.totalContent}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-gray-400 text-sm">Payments</span>
              </div>
              <p className="text-xl font-bold text-white">
                {overallStats.completedPayments}/{overallStats.totalPayments}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-gray-400 text-sm">Health</span>
              </div>
              <p className="text-xl font-bold text-white capitalize">{overallStats.systemHealth}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400 text-sm">Tasks</span>
              </div>
              <p className="text-xl font-bold text-white">
                {dashboardState.workflows.filter(w => w.status === 'running').length}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-4 h-4 text-orange-400" />
                <span className="text-gray-400 text-sm">Alerts</span>
              </div>
              <p className="text-xl font-bold text-white">{overallStats.unacknowledgedAlerts}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-gray-400 text-sm">Uptime</span>
              </div>
              <p className="text-xl font-bold text-white">99.7%</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span className="text-gray-400 text-sm">Requests</span>
              </div>
              <p className="text-xl font-bold text-white">24.3K</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gray-900">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <SystemHealth
                  healthMetrics={dashboardState.systemHealth}
                  onAcknowledgeAlert={handleAcknowledgeAlert}
                  onRefreshHealth={handleRefreshHealth}
                />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <AgentMetrics
                  agents={dashboardState.agents}
                  onAgentAction={handleAgentAction}
                />
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="workflows">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <WorkflowMonitor
                tasks={dashboardState.workflows}
                onTaskAction={handleTaskAction}
                onRefresh={refresh}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="agents">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <AgentMetrics
                agents={dashboardState.agents}
                onAgentAction={handleAgentAction}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="content">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ContentPipeline
                pipeline={dashboardState.contentPipeline}
                onItemAction={handleContentAction}
                onViewOutput={handleViewOutput}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="payments">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <PaymentTracker
                payments={dashboardState.payments}
                onViewTransaction={handleViewTransaction}
                onRetryPayment={handleRetryPayment}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="health">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <SystemHealth
                healthMetrics={dashboardState.systemHealth}
                onAcknowledgeAlert={handleAcknowledgeAlert}
                onRefreshHealth={handleRefreshHealth}
              />
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Last updated: {lastUpdate ? lastUpdate.toLocaleString() : 'Never'}</p>
          <p className="mt-1">ServiceFlow AI Platform - Real-time Monitoring Dashboard</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="text-xs">Real-time Updates</span>
            </div>
            {connectionStatus === 'error' && (
              <div className="flex items-center gap-1 text-red-400">
                <AlertTriangle className="w-3 h-3" />
                <span className="text-xs">Connection Issue</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}