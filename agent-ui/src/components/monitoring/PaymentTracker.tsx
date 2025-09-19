"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  Wallet,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  PieChart,
  Award,
  Coins,
  Copy,
  Eye,
  Calendar,
  Hash
} from 'lucide-react';
import type { PaymentDistribution } from '@/types/monitoring';

interface PaymentTrackerProps {
  payments: PaymentDistribution[];
  onViewTransaction: (txHash: string) => void;
  onRetryPayment: (paymentId: string) => void;
  className?: string;
}

const statusColors = {
  pending: 'bg-yellow-500',
  processing: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500'
};

const typeColors = {
  'image-generation': 'bg-purple-500',
  'video-generation': 'bg-red-500',
  'voting-reward': 'bg-blue-500',
  'nft-staking': 'bg-green-500'
};

const formatCurrency = (amount: number, currency: string) => {
  return `${amount.toFixed(4)} ${currency}`;
};

const formatAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

const getDistributionStatus = (distributions: PaymentDistribution['distributions']) => {
  const entries = Object.entries(distributions);
  const completed = entries.filter(([_, dist]) => dist.status === 'completed').length;
  const failed = entries.filter(([_, dist]) => dist.status === 'failed').length;
  const pending = entries.filter(([_, dist]) => dist.status === 'pending').length;

  return { completed, failed, pending, total: entries.length };
};

export default function PaymentTracker({
  payments,
  onViewTransaction,
  onRetryPayment,
  className = ""
}: PaymentTrackerProps) {
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');
  const [filterType, setFilterType] = useState<'all' | 'image-generation' | 'video-generation' | 'voting-reward' | 'nft-staking'>('all');

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const statusMatch = filterStatus === 'all' || payment.status === filterStatus;
      const typeMatch = filterType === 'all' || payment.type === filterType;
      return statusMatch && typeMatch;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [payments, filterStatus, filterType]);

  const paymentStats = useMemo(() => {
    const total = payments.length;
    const totalVolume = payments.reduce((sum, p) => sum + p.amount, 0);
    const completedVolume = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const distributionStats = payments.reduce((acc, payment) => {
      acc.leaderboard += payment.distributions.leaderboardWallet.amount;
      acc.dev += payment.distributions.devWallet.amount;
      acc.nftStaking += payment.distributions.nftStakingRewards.amount;
      acc.platform += payment.distributions.platformFee.amount;
      return acc;
    }, { leaderboard: 0, dev: 0, nftStaking: 0, platform: 0 });

    const statusCounts = payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      totalVolume,
      completedVolume,
      distributionStats,
      statusCounts
    };
  }, [payments]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Payment Distribution Tracker</h2>
          <p className="text-gray-400">Real-time payment processing and distribution monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm"
          >
            <option value="all">All Types</option>
            <option value="image-generation">Image Generation</option>
            <option value="video-generation">Video Generation</option>
            <option value="voting-reward">Voting Rewards</option>
            <option value="nft-staking">NFT Staking</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-sm">Total Volume</span>
            </div>
            <p className="text-xl font-bold text-white">
              ${paymentStats.totalVolume.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-sm">Completed</span>
            </div>
            <p className="text-xl font-bold text-white">
              ${paymentStats.completedVolume.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400 text-sm">Dev Wallet</span>
            </div>
            <p className="text-xl font-bold text-white">
              ${paymentStats.distributionStats.dev.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">50%</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-400 text-sm">Leaderboard</span>
            </div>
            <p className="text-xl font-bold text-white">
              ${paymentStats.distributionStats.leaderboard.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">15%</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-sm">NFT Staking</span>
            </div>
            <p className="text-xl font-bold text-white">
              ${paymentStats.distributionStats.nftStaking.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">25%</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <PieChart className="w-4 h-4 text-orange-400" />
              <span className="text-gray-400 text-sm">Platform Fee</span>
            </div>
            <p className="text-xl font-bold text-white">
              ${paymentStats.distributionStats.platform.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">10%</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment List */}
      <div className="space-y-3">
        {filteredPayments.map((payment) => {
          const distributionStatus = getDistributionStatus(payment.distributions);
          const completionPercentage = (distributionStatus.completed / distributionStatus.total) * 100;

          return (
            <motion.div
              key={payment.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="cursor-pointer"
              onClick={() => setSelectedPayment(selectedPayment === payment.id ? null : payment.id)}
            >
              <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${statusColors[payment.status]} ${payment.status === 'processing' ? 'animate-pulse' : ''}`} />
                        <DollarSign className="w-5 h-5 text-gray-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`${typeColors[payment.type]} text-white border-0 text-xs`}>
                            {payment.type.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {payment.status}
                          </Badge>
                          <span className="text-white font-bold">
                            {formatCurrency(payment.amount, payment.currency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {payment.id.substring(0, 8)}...
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {payment.timestamp.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {distributionStatus.completed}/{distributionStatus.total} completed
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                          <span>Distribution Progress</span>
                        </div>
                        <Progress value={completionPercentage} className="w-24 h-1" />
                        <p className="text-xs text-gray-400 mt-1">{completionPercentage.toFixed(0)}%</p>
                      </div>

                      {payment.blockchainTx && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewTransaction(payment.blockchainTx!.hash);
                          }}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}

                      {payment.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetryPayment(payment.id);
                          }}
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {filteredPayments.length === 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <DollarSign className="w-12 h-12 text-gray-600" />
                <p className="text-gray-400 text-lg">No payments found</p>
                <p className="text-gray-500 text-sm">
                  {filterStatus !== 'all' || filterType !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Payment distributions will appear here'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Payment View */}
      <AnimatePresence>
        {selectedPayment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {(() => {
              const payment = payments.find(p => p.id === selectedPayment);
              if (!payment) return null;

              return (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">Payment Distribution Details</CardTitle>
                        <CardDescription>Complete breakdown of payment {payment.id}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPayment(null)}
                      >
                        ✕
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="distributions">Distributions</TabsTrigger>
                        <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="text-white font-medium">Payment Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">ID:</span>
                                <span className="text-white font-mono text-xs">{payment.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Type:</span>
                                <span className="text-white capitalize">{payment.type.replace('-', ' ')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Status:</span>
                                <Badge variant="outline">{payment.status}</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Amount:</span>
                                <span className="text-white font-bold">
                                  {formatCurrency(payment.amount, payment.currency)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Timestamp:</span>
                                <span className="text-white">{payment.timestamp.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-white font-medium">Distribution Summary</h4>
                            <div className="space-y-2">
                              {[
                                { name: 'Dev Wallet', key: 'devWallet', percentage: 50, color: 'bg-blue-500' },
                                { name: 'NFT Staking', key: 'nftStakingRewards', percentage: 25, color: 'bg-purple-500' },
                                { name: 'Leaderboard', key: 'leaderboardWallet', percentage: 15, color: 'bg-yellow-500' },
                                { name: 'Platform Fee', key: 'platformFee', percentage: 10, color: 'bg-orange-500' }
                              ].map((dist) => {
                                const distData = payment.distributions[dist.key as keyof typeof payment.distributions];
                                return (
                                  <div key={dist.key} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${dist.color}`} />
                                      <span className="text-gray-400 text-sm">{dist.name}</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-white text-sm font-semibold">
                                        {formatCurrency(distData.amount, payment.currency)}
                                      </p>
                                      <p className="text-gray-500 text-xs">{dist.percentage}%</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="distributions" className="space-y-4">
                        <div className="space-y-4">
                          {[
                            { name: 'Dev Wallet (50%)', key: 'devWallet', icon: Wallet, color: 'text-blue-400' },
                            { name: 'NFT Staking Rewards (25%)', key: 'nftStakingRewards', icon: Coins, color: 'text-purple-400' },
                            { name: 'Leaderboard Wallet (15%)', key: 'leaderboardWallet', icon: Award, color: 'text-yellow-400' },
                            { name: 'Platform Fee (10%)', key: 'platformFee', icon: PieChart, color: 'text-orange-400' }
                          ].map((dist) => {
                            const distData = payment.distributions[dist.key as keyof typeof payment.distributions];
                            const Icon = dist.icon;

                            return (
                              <Card key={dist.key} className="bg-gray-800 border-gray-700">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Icon className={`w-5 h-5 ${dist.color}`} />
                                      <h5 className="text-white font-medium">{dist.name}</h5>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={
                                        distData.status === 'completed' ? 'bg-green-500 text-white border-0' :
                                        distData.status === 'failed' ? 'bg-red-500 text-white border-0' :
                                        'border-yellow-500 text-yellow-400'
                                      }
                                    >
                                      {distData.status}
                                    </Badge>
                                  </div>

                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Amount:</span>
                                      <span className="text-white font-semibold">
                                        {formatCurrency(distData.amount, payment.currency)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-400">Address:</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-white font-mono text-xs">
                                          {formatAddress(distData.address)}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => copyToClipboard(distData.address)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    {distData.txHash && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Transaction:</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-white font-mono text-xs">
                                            {formatAddress(distData.txHash)}
                                          </span>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onViewTransaction(distData.txHash!)}
                                            className="h-6 w-6 p-0"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="blockchain" className="space-y-4">
                        {payment.blockchainTx ? (
                          <div className="space-y-4">
                            <Card className="bg-gray-800 border-gray-700">
                              <CardHeader>
                                <CardTitle className="text-white text-lg">Blockchain Transaction</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Transaction Hash:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-white font-mono text-xs">
                                        {formatAddress(payment.blockchainTx.hash)}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onViewTransaction(payment.blockchainTx!.hash)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Block Number:</span>
                                    <span className="text-white">{payment.blockchainTx.blockNumber.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Gas Used:</span>
                                    <span className="text-white">{payment.blockchainTx.gasUsed.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Gas Price:</span>
                                    <span className="text-white">{payment.blockchainTx.gasPrice.toLocaleString()} gwei</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="flex flex-col items-center gap-3">
                              {payment.status === 'processing' ? (
                                <>
                                  <Clock className="w-8 h-8 text-blue-400 animate-pulse" />
                                  <p className="text-gray-400">Transaction being processed...</p>
                                </>
                              ) : payment.status === 'pending' ? (
                                <>
                                  <Clock className="w-8 h-8 text-yellow-400" />
                                  <p className="text-gray-400">Waiting for blockchain confirmation...</p>
                                </>
                              ) : payment.status === 'failed' ? (
                                <>
                                  <XCircle className="w-8 h-8 text-red-400" />
                                  <p className="text-gray-400">Transaction failed</p>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-8 h-8 text-gray-600" />
                                  <p className="text-gray-400">No blockchain transaction data</p>
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