"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Image,
  Video,
  FileText,
  Music,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  DollarSign,
  Star,
  Queue,
  Play,
  Pause,
  RotateCcw,
  Eye,
  ThumbsUp,
  Calendar,
  User
} from 'lucide-react';
import type { ContentGenerationPipeline } from '@/types/monitoring';

interface ContentPipelineProps {
  pipeline: ContentGenerationPipeline[];
  onItemAction: (itemId: string, action: 'cancel' | 'retry' | 'priority') => void;
  onViewOutput: (itemId: string) => void;
  className?: string;
}

const typeIcons = {
  image: Image,
  video: Video,
  text: FileText,
  audio: Music
};

const typeColors = {
  image: 'bg-purple-500',
  video: 'bg-red-500',
  text: 'bg-blue-500',
  audio: 'bg-green-500'
};

const statusColors = {
  queued: 'bg-gray-500',
  processing: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500'
};

const statusIcons = {
  queued: Queue,
  processing: Loader2,
  completed: CheckCircle2,
  failed: XCircle
};

const formatCurrency = (amount: number, currency: string) => {
  return `${amount.toFixed(2)} ${currency}`;
};

const formatTimeRemaining = (estimatedCompletion?: Date) => {
  if (!estimatedCompletion) return 'Unknown';

  const now = new Date();
  const diff = estimatedCompletion.getTime() - now.getTime();

  if (diff <= 0) return 'Overdue';

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
};

const truncatePrompt = (prompt: string, maxLength: number = 100) => {
  if (prompt.length <= maxLength) return prompt;
  return prompt.substring(0, maxLength) + '...';
};

export default function ContentPipeline({
  pipeline,
  onItemAction,
  onViewOutput,
  className = ""
}: ContentPipelineProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'queued' | 'processing' | 'completed' | 'failed'>('all');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'text' | 'audio'>('all');

  const filteredPipeline = useMemo(() => {
    return pipeline.filter(item => {
      const statusMatch = filterStatus === 'all' || item.status === filterStatus;
      const typeMatch = filterType === 'all' || item.type === filterType;
      return statusMatch && typeMatch;
    }).sort((a, b) => {
      // Sort by status priority (processing > queued > completed > failed), then by creation time
      const statusPriority = { processing: 0, queued: 1, completed: 2, failed: 3 };
      const aP = statusPriority[a.status];
      const bP = statusPriority[b.status];

      if (aP !== bP) return aP - bP;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [pipeline, filterStatus, filterType]);

  const pipelineStats = useMemo(() => {
    const total = pipeline.length;
    const queued = pipeline.filter(p => p.status === 'queued').length;
    const processing = pipeline.filter(p => p.status === 'processing').length;
    const completed = pipeline.filter(p => p.status === 'completed').length;
    const failed = pipeline.filter(p => p.status === 'failed').length;

    const totalRevenue = pipeline
      .filter(p => p.cost.paid && p.status === 'completed')
      .reduce((sum, p) => sum + p.cost.amount, 0);

    const avgProcessingTime = pipeline
      .filter(p => p.status === 'completed' && p.completedAt)
      .reduce((sum, p, _, arr) => {
        const duration = p.completedAt!.getTime() - p.createdAt.getTime();
        return sum + (duration / arr.length);
      }, 0);

    return {
      total,
      queued,
      processing,
      completed,
      failed,
      totalRevenue,
      avgProcessingTime
    };
  }, [pipeline]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Content Generation Pipeline</h2>
          <p className="text-gray-400">Real-time content creation monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="text">Text</option>
            <option value="audio">Audio</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Queue className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{pipelineStats.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-400 text-sm">Queued</span>
            </div>
            <p className="text-2xl font-bold text-white">{pipelineStats.queued}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-gray-400 text-sm">Processing</span>
            </div>
            <p className="text-2xl font-bold text-white">{pipelineStats.processing}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-sm">Completed</span>
            </div>
            <p className="text-2xl font-bold text-white">{pipelineStats.completed}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-gray-400 text-sm">Failed</span>
            </div>
            <p className="text-2xl font-bold text-white">{pipelineStats.failed}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-sm">Revenue</span>
            </div>
            <p className="text-lg font-bold text-white">
              ${pipelineStats.totalRevenue.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-sm">Avg Time</span>
            </div>
            <p className="text-lg font-bold text-white">
              {pipelineStats.avgProcessingTime ?
                `${Math.round(pipelineStats.avgProcessingTime / 60000)}m` :
                'N/A'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Items */}
      <div className="space-y-3">
        {filteredPipeline.map((item) => {
          const TypeIcon = typeIcons[item.type];
          const StatusIcon = statusIcons[item.status];

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="cursor-pointer"
              onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
            >
              <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-5 h-5 text-gray-400" />
                        <div className={`w-3 h-3 rounded-full ${statusColors[item.status]} ${item.status === 'processing' ? 'animate-pulse' : ''}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`${typeColors[item.type]} text-white border-0 text-xs`}>
                            {item.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.status}
                          </Badge>
                          {item.cost.paid && (
                            <Badge variant="outline" className="bg-green-500 text-white border-0 text-xs">
                              Paid
                            </Badge>
                          )}
                        </div>
                        <p className="text-white font-medium truncate">
                          {truncatePrompt(item.prompt)}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.userId.substring(0, 8)}...
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.createdAt.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(item.cost.amount, item.cost.currency)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.status === 'processing' && (
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeRemaining(item.estimatedCompletion)}
                          </div>
                          <Progress value={item.progress} className="w-24 h-1" />
                          <p className="text-xs text-gray-400 mt-1">{item.progress}%</p>
                        </div>
                      )}

                      {item.status === 'queued' && item.queuePosition && (
                        <div className="text-right text-xs text-gray-400">
                          <p>Queue #{item.queuePosition}</p>
                        </div>
                      )}

                      {item.status === 'completed' && item.output && (
                        <div className="flex items-center gap-2">
                          <div className="text-right text-xs">
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Star className="w-3 h-3" />
                              <span>{item.output.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <ThumbsUp className="w-3 h-3" />
                              <span>{item.output.votes}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewOutput(item.id);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      )}

                      <div className="flex gap-1">
                        {item.status === 'processing' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemAction(item.id, 'cancel');
                            }}
                          >
                            <Pause className="w-3 h-3" />
                          </Button>
                        )}
                        {item.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemAction(item.id, 'retry');
                            }}
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        )}
                        {(item.status === 'queued' || item.status === 'processing') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemAction(item.id, 'priority');
                            }}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {filteredPipeline.length === 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <Queue className="w-12 h-12 text-gray-600" />
                <p className="text-gray-400 text-lg">No content in pipeline</p>
                <p className="text-gray-500 text-sm">
                  {filterStatus !== 'all' || filterType !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Content generation requests will appear here'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Item View */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {(() => {
              const item = pipeline.find(p => p.id === selectedItem);
              if (!item) return null;

              return (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">Content Generation Details</CardTitle>
                        <CardDescription>Complete information for {item.type} generation request</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedItem(null)}
                      >
                        ✕
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="parameters">Parameters</TabsTrigger>
                        <TabsTrigger value="output">Output</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-white font-medium mb-2">Request Information</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Type:</span>
                                  <span className="text-white capitalize">{item.type}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Status:</span>
                                  <Badge variant="outline">{item.status}</Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">User ID:</span>
                                  <span className="text-white font-mono text-xs">{item.userId}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Created:</span>
                                  <span className="text-white">{item.createdAt.toLocaleString()}</span>
                                </div>
                                {item.completedAt && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Completed:</span>
                                    <span className="text-white">{item.completedAt.toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h4 className="text-white font-medium mb-2">Payment Information</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Amount:</span>
                                  <span className="text-white">
                                    {formatCurrency(item.cost.amount, item.cost.currency)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Status:</span>
                                  <Badge
                                    variant="outline"
                                    className={item.cost.paid ? 'bg-green-500 text-white border-0' : 'border-red-500 text-red-400'}
                                  >
                                    {item.cost.paid ? 'Paid' : 'Unpaid'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {item.status === 'processing' && (
                              <div>
                                <h4 className="text-white font-medium mb-2">Progress</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Completion</span>
                                    <span className="text-white">{item.progress}%</span>
                                  </div>
                                  <Progress value={item.progress} />
                                  {item.estimatedCompletion && (
                                    <p className="text-xs text-gray-400">
                                      ETA: {formatTimeRemaining(item.estimatedCompletion)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-white font-medium mb-2">Prompt</h4>
                          <div className="p-3 bg-gray-800 rounded-lg">
                            <p className="text-gray-300 text-sm">{item.prompt}</p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="parameters" className="space-y-4">
                        <div>
                          <h4 className="text-white font-medium mb-3">Generation Parameters</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(item.parameters).map(([key, value]) => (
                              <div key={key} className="p-3 bg-gray-800 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                  <span className="text-white font-mono text-sm">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="output" className="space-y-4">
                        {item.output ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-3 bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <Star className="w-4 h-4 text-yellow-400" />
                                  <span className="text-gray-400 text-sm">Rating</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{item.output.rating.toFixed(1)}</p>
                              </div>
                              <div className="p-3 bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <ThumbsUp className="w-4 h-4 text-blue-400" />
                                  <span className="text-gray-400 text-sm">Votes</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{item.output.votes}</p>
                              </div>
                              <div className="p-3 bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <Eye className="w-4 h-4 text-green-400" />
                                  <span className="text-gray-400 text-sm">Output</span>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onViewOutput(item.id)}
                                  className="w-full"
                                >
                                  View Content
                                </Button>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-white font-medium mb-2">Output Metadata</h4>
                              <div className="p-3 bg-gray-800 rounded-lg">
                                <pre className="text-gray-300 text-xs overflow-x-auto">
                                  {JSON.stringify(item.output.metadata, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="flex flex-col items-center gap-3">
                              {item.status === 'processing' ? (
                                <>
                                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                                  <p className="text-gray-400">Content is being generated...</p>
                                </>
                              ) : item.status === 'queued' ? (
                                <>
                                  <Clock className="w-8 h-8 text-yellow-400" />
                                  <p className="text-gray-400">Waiting in queue...</p>
                                </>
                              ) : item.status === 'failed' ? (
                                <>
                                  <XCircle className="w-8 h-8 text-red-400" />
                                  <p className="text-gray-400">Generation failed</p>
                                </>
                              ) : (
                                <>
                                  <FileText className="w-8 h-8 text-gray-600" />
                                  <p className="text-gray-400">No output available</p>
                                </>
                              )}
                            </div>
                          </div>
                        )}
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