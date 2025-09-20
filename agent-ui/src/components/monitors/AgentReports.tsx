'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Bot,
  FileText,
  Calendar,
  RefreshCw,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  status: string;
  capabilities: string[];
  file: string;
}

interface AgentReport {
  id: string;
  agentId: string;
  title: string;
  summary: string;
  content: string;
  type: 'analysis' | 'research' | 'alert' | 'recommendation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  generatedAt: Date;
  nextRun: Date;
  tags: string[];
  metrics: {
    dataPoints: number;
    accuracy: number;
    timeToGenerate: number;
  };
  insights: string[];
  recommendations: string[];
}

interface AgentMetrics {
  agentId: string;
  reportsGenerated: number;
  averageAccuracy: number;
  uptime: number;
  lastRun: Date;
  nextScheduled: Date;
  performance: {
    successRate: number;
    avgResponseTime: number;
    errorsLast24h: number;
  };
}

// Mock agent reports data
const mockReports: AgentReport[] = [
  {
    id: 'rpt-001',
    agentId: 'sonic-finance',
    title: 'Sonic DeFi Market Analysis - January 2024',
    summary: 'Comprehensive analysis of DeFi protocols on Sonic network showing 45% TVL growth and emerging yield farming opportunities.',
    content: 'The Sonic DeFi ecosystem has experienced significant growth this month...',
    type: 'analysis',
    priority: 'high',
    confidence: 92,
    generatedAt: new Date('2024-01-15T09:00:00Z'),
    nextRun: new Date('2024-01-15T21:00:00Z'),
    tags: ['defi', 'tvl', 'yield-farming', 'protocols'],
    metrics: {
      dataPoints: 1250,
      accuracy: 94.5,
      timeToGenerate: 180
    },
    insights: [
      'SonicSwap leads in trading volume with $2.5M daily average',
      'New liquidity farming pools showing 150%+ APY',
      'Cross-chain bridge activity increased 200% this week'
    ],
    recommendations: [
      'Monitor emerging yield farming protocols for risk assessment',
      'Consider increasing allocation to SONIC-USDC LP',
      'Watch for potential arbitrage opportunities across DEXes'
    ]
  },
  {
    id: 'rpt-002',
    agentId: 'nft-analyst',
    title: 'Paintswap NFT Market Weekly Report',
    summary: 'NFT trading volume up 67% with Bandit Kidz leading floor price growth. New collections showing strong initial demand.',
    content: 'This week saw exceptional activity in the Sonic NFT marketplace...',
    type: 'analysis',
    priority: 'medium',
    confidence: 88,
    generatedAt: new Date('2024-01-14T16:30:00Z'),
    nextRun: new Date('2024-01-15T16:30:00Z'),
    tags: ['nft', 'paintswap', 'collections', 'volume'],
    metrics: {
      dataPoints: 890,
      accuracy: 91.2,
      timeToGenerate: 145
    },
    insights: [
      'Bandit Kidz floor price increased 28% to 45.5 SONIC',
      'New minting activity up 180% week-over-week',
      'Gaming NFTs showing strongest utility adoption'
    ],
    recommendations: [
      'Track new gaming NFT integrations for growth potential',
      'Monitor whale wallet activity for market signals',
      'Consider featured collection partnerships'
    ]
  },
  {
    id: 'rpt-003',
    agentId: 'ecosystem-analyst',
    title: 'Sonic Ecosystem Health Report',
    summary: 'Network processing 2M+ daily transactions with 99.9% uptime. Developer activity increasing with 15 new projects this month.',
    content: 'The Sonic blockchain ecosystem continues to show strong fundamentals...',
    type: 'research',
    priority: 'high',
    confidence: 95,
    generatedAt: new Date('2024-01-14T12:00:00Z'),
    nextRun: new Date('2024-01-15T12:00:00Z'),
    tags: ['ecosystem', 'development', 'network', 'growth'],
    metrics: {
      dataPoints: 2100,
      accuracy: 96.8,
      timeToGenerate: 210
    },
    insights: [
      'Network utilization at 65% capacity with room for growth',
      'Active developer addresses increased 40% this quarter',
      'Average transaction fee remains under $0.01'
    ],
    recommendations: [
      'Increase marketing to attract more developers',
      'Consider grant program for promising projects',
      'Enhance developer documentation and tools'
    ]
  },
  {
    id: 'rpt-004',
    agentId: 'smart-contract',
    title: 'Security Alert: Contract Audit Results',
    summary: 'Routine audit of 5 new smart contracts revealed 2 medium-risk vulnerabilities that require immediate attention.',
    content: 'Our automated security analysis has identified potential issues...',
    type: 'alert',
    priority: 'critical',
    confidence: 98,
    generatedAt: new Date('2024-01-15T08:15:00Z'),
    nextRun: new Date('2024-01-15T20:15:00Z'),
    tags: ['security', 'audit', 'vulnerabilities', 'smart-contracts'],
    metrics: {
      dataPoints: 450,
      accuracy: 97.5,
      timeToGenerate: 320
    },
    insights: [
      'Reentrancy vulnerability found in 0x742d35Cc6635C0532925a3b8D140C1d23cC09B8E',
      'Unchecked external calls in yield farming contract',
      'Access control issues in NFT minting function'
    ],
    recommendations: [
      'Immediate patch required for reentrancy vulnerability',
      'Implement proper access controls on admin functions',
      'Add comprehensive input validation'
    ]
  }
];

// Mock agent metrics
const mockMetrics: AgentMetrics[] = [
  {
    agentId: 'sonic-finance',
    reportsGenerated: 24,
    averageAccuracy: 94.2,
    uptime: 99.5,
    lastRun: new Date('2024-01-15T09:00:00Z'),
    nextScheduled: new Date('2024-01-15T21:00:00Z'),
    performance: {
      successRate: 97.8,
      avgResponseTime: 180,
      errorsLast24h: 1
    }
  },
  {
    agentId: 'nft-analyst',
    reportsGenerated: 18,
    averageAccuracy: 91.8,
    uptime: 98.2,
    lastRun: new Date('2024-01-14T16:30:00Z'),
    nextScheduled: new Date('2024-01-15T16:30:00Z'),
    performance: {
      successRate: 95.6,
      avgResponseTime: 145,
      errorsLast24h: 2
    }
  },
  {
    agentId: 'ecosystem-analyst',
    reportsGenerated: 31,
    averageAccuracy: 96.1,
    uptime: 99.8,
    lastRun: new Date('2024-01-14T12:00:00Z'),
    nextScheduled: new Date('2024-01-15T12:00:00Z'),
    performance: {
      successRate: 99.1,
      avgResponseTime: 210,
      errorsLast24h: 0
    }
  },
  {
    agentId: 'smart-contract',
    reportsGenerated: 12,
    averageAccuracy: 97.3,
    uptime: 96.5,
    lastRun: new Date('2024-01-15T08:15:00Z'),
    nextScheduled: new Date('2024-01-15T20:15:00Z'),
    performance: {
      successRate: 94.2,
      avgResponseTime: 320,
      errorsLast24h: 3
    }
  }
];

interface AgentReportsProps {
  agents: Agent[];
}

export default function AgentReports({ agents }: AgentReportsProps) {
  const [reports, setReports] = useState<AgentReport[]>(mockReports);
  const [metrics, setMetrics] = useState<AgentMetrics[]>(mockMetrics);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');

  const filteredReports = selectedAgent === 'all'
    ? reports
    : reports.filter(report => report.agentId === selectedAgent);

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call to get latest reports
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 border-red-400 bg-red-500/10';
      case 'high': return 'text-orange-400 border-orange-400 bg-orange-500/10';
      case 'medium': return 'text-yellow-400 border-yellow-400 bg-yellow-500/10';
      default: return 'text-green-400 border-green-400 bg-green-500/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <BarChart3 className="h-4 w-4" />;
      case 'research': return <Brain className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'recommendation': return <Zap className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getAgentInfo = (agentId: string) => {
    return agents.find(agent => agent.id === agentId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Agent Reports Dashboard</h2>
          <p className="text-slate-400 mt-2">AI-generated insights and analysis from your agent network</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            variant="outline"
            className="bg-slate-800/50 border-slate-600 text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-green-500 to-emerald-500">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md bg-slate-800/50">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          {/* Agent Filter */}
          <div className="flex gap-2">
            <Button
              onClick={() => setSelectedAgent('all')}
              variant={selectedAgent === 'all' ? "default" : "outline"}
              size="sm"
              className={selectedAgent === 'all' ? 'bg-blue-600' : 'bg-slate-700/50 border-slate-600'}
            >
              All Agents
            </Button>
            {agents.map((agent) => (
              <Button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                variant={selectedAgent === agent.id ? "default" : "outline"}
                size="sm"
                className={selectedAgent === agent.id ? 'bg-blue-600' : 'bg-slate-700/50 border-slate-600'}
              >
                {agent.avatar} {agent.name.split(' ')[0]}
              </Button>
            ))}
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredReports.map((report) => {
              const agent = getAgentInfo(report.agentId);
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/30 transition-colors h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${agent?.color || 'from-slate-600 to-slate-800'}`}>
                            {getTypeIcon(report.type)}
                          </div>
                          <div>
                            <CardTitle className="text-lg line-clamp-2">{report.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              {agent?.avatar} {agent?.name}
                              <Badge variant="outline" className={getPriorityColor(report.priority)}>
                                {report.priority}
                              </Badge>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">
                            {report.confidence}% confidence
                          </div>
                          <div className="text-xs text-slate-400">
                            {formatTimeAgo(report.generatedAt)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-300 line-clamp-3">
                        {report.summary}
                      </p>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-slate-700/30 p-3 rounded-lg">
                          <div className="text-sm font-medium text-white">{report.metrics.dataPoints}</div>
                          <div className="text-xs text-slate-400">Data Points</div>
                        </div>
                        <div className="bg-slate-700/30 p-3 rounded-lg">
                          <div className="text-sm font-medium text-white">{report.metrics.accuracy}%</div>
                          <div className="text-xs text-slate-400">Accuracy</div>
                        </div>
                        <div className="bg-slate-700/30 p-3 rounded-lg">
                          <div className="text-sm font-medium text-white">{report.metrics.timeToGenerate}s</div>
                          <div className="text-xs text-slate-400">Gen Time</div>
                        </div>
                      </div>

                      {/* Key Insights */}
                      {report.insights.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-white mb-2">Key Insights</h4>
                          <ul className="space-y-1 text-xs text-slate-300">
                            {report.insights.slice(0, 2).map((insight, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-1">{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {report.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          View Full Report
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {metrics.map((metric) => {
              const agent = getAgentInfo(metric.agentId);
              return (
                <Card key={metric.agentId} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${agent?.color || 'from-slate-600 to-slate-800'}`}>
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      {agent?.avatar} {agent?.name}
                      <Badge variant="outline" className={
                        metric.performance.errorsLast24h === 0 ? 'text-green-400 border-green-400' : 'text-yellow-400 border-yellow-400'
                      }>
                        {metric.uptime}% uptime
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-700/30 p-3 rounded-lg">
                        <div className="text-lg font-semibold text-white">{metric.reportsGenerated}</div>
                        <div className="text-sm text-slate-400">Reports Generated</div>
                      </div>
                      <div className="bg-slate-700/30 p-3 rounded-lg">
                        <div className="text-lg font-semibold text-white">{metric.averageAccuracy}%</div>
                        <div className="text-sm text-slate-400">Avg Accuracy</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">Success Rate</span>
                          <span className="text-white">{metric.performance.successRate}%</span>
                        </div>
                        <Progress value={metric.performance.successRate} className="h-2" />
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Avg Response Time</span>
                        <span className="text-white">{metric.performance.avgResponseTime}s</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Errors (24h)</span>
                        <span className={metric.performance.errorsLast24h === 0 ? 'text-green-400' : 'text-red-400'}>
                          {metric.performance.errorsLast24h}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Next Run</span>
                        <span className="text-white">{formatTimeAgo(metric.nextScheduled)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Agent Schedule
              </CardTitle>
              <CardDescription>Automated report generation schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.map((agent) => {
                  const agentMetric = metrics.find(m => m.agentId === agent.id);
                  return (
                    <div key={agent.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${agent.color}`}>
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{agent.name}</div>
                          <div className="text-sm text-slate-400">Every 3 hours</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white">
                          Next: {agentMetric ? formatTimeAgo(agentMetric.nextScheduled) : 'Unknown'}
                        </div>
                        <div className="text-xs text-slate-400">
                          Last: {agentMetric ? formatTimeAgo(agentMetric.lastRun) : 'Never'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}