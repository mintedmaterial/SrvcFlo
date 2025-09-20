'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Crown,
  Star,
  Zap,
  Infinity,
  Gift,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowUp,
  Settings
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Subscription {
  tokenId: string;
  tier: 'BANDIT_KIDZ' | 'BASIC' | 'STANDARD' | 'PREMIUM' | 'UNLIMITED';
  expiresAt: string;
  promptsUsed: number;
  promptsLimit: number;
  isActive: boolean;
  expired: boolean;
  renewalCount: number;
  isBanditKidzHolder: boolean;
}

interface SubscriptionManagerProps {
  subscription: Subscription;
  onRenew: () => void;
  onUpgrade: () => void;
  onCancel: () => void;
}

const tierConfigs = {
  BANDIT_KIDZ: {
    name: 'Bandit Kidz Free',
    icon: <Crown className="h-5 w-5" />,
    color: 'from-yellow-500 to-orange-500',
    badge: 'Exclusive',
    features: ['Basic AI Agents', 'Image Generation', 'Text Generation', 'Community Support']
  },
  BASIC: {
    name: 'Basic',
    icon: <Star className="h-5 w-5" />,
    color: 'from-blue-500 to-cyan-500',
    badge: 'Starter',
    features: ['Basic AI Agents', 'Image Generation', 'Text Generation', 'Email Support']
  },
  STANDARD: {
    name: 'Standard',
    icon: <Zap className="h-5 w-5" />,
    color: 'from-purple-500 to-pink-500',
    badge: 'Popular',
    features: ['All AI Agents', 'Image & Video Generation', 'Priority Queue', 'Live Chat Support']
  },
  PREMIUM: {
    name: 'Premium',
    icon: <Gift className="h-5 w-5" />,
    color: 'from-green-500 to-emerald-500',
    badge: 'Pro',
    features: ['All Features', 'API Access', 'Custom Models', 'Priority Support', 'Analytics']
  },
  UNLIMITED: {
    name: 'Unlimited',
    icon: <Infinity className="h-5 w-5" />,
    color: 'from-slate-700 to-slate-900',
    badge: 'Enterprise',
    features: ['Everything', 'Unlimited Prompts', 'Team Sharing', 'White Label', 'Dedicated Support']
  }
};

export default function SubscriptionManager({ subscription, onRenew, onUpgrade, onCancel }: SubscriptionManagerProps) {
  const [showUsageDetails, setShowUsageDetails] = useState(false);

  const config = tierConfigs[subscription.tier];
  const expiresAt = new Date(subscription.expiresAt);
  const isExpiringSoon = expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days
  const promptsRemaining = subscription.promptsLimit === -1 ? -1 : subscription.promptsLimit - subscription.promptsUsed;
  const usagePercentage = subscription.promptsLimit === -1 ? 0 : (subscription.promptsUsed / subscription.promptsLimit) * 100;

  const getStatusBadge = () => {
    if (subscription.expired) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
    }
    if (isExpiringSoon) {
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400"><AlertTriangle className="h-3 w-3 mr-1" />Expires Soon</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-500/20 text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
  };

  const getUsageStatus = () => {
    if (subscription.promptsLimit === -1) return 'unlimited';
    if (usagePercentage >= 90) return 'critical';
    if (usagePercentage >= 75) return 'warning';
    return 'normal';
  };

  const getUsageColor = () => {
    const status = getUsageStatus();
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'unlimited': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Subscription Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.color}`}></div>

          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${config.color} text-white`}>
                  {config.icon}
                </div>
                <div>
                  <CardTitle className="text-xl">{config.name}</CardTitle>
                  <CardDescription>NFT Token ID: #{subscription.tokenId}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{config.badge}</Badge>
                {getStatusBadge()}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Expiration Info */}
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="font-medium">
                    {subscription.expired ? 'Expired' : 'Expires'}
                  </p>
                  <p className="text-sm text-slate-400">
                    {format(expiresAt, 'PPP')} ({formatDistanceToNow(expiresAt, { addSuffix: true })})
                  </p>
                </div>
              </div>
              {isExpiringSoon && !subscription.expired && (
                <Button onClick={onRenew} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renew Now
                </Button>
              )}
            </div>

            {/* Usage Statistics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Usage This Month</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUsageDetails(!showUsageDetails)}
                >
                  {showUsageDetails ? 'Hide' : 'Show'} Details
                </Button>
              </div>

              {subscription.promptsLimit === -1 ? (
                <div className="text-center p-6 bg-slate-800/30 rounded-lg">
                  <Infinity className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                  <p className="font-medium">Unlimited Prompts</p>
                  <p className="text-sm text-slate-400">No usage limits on this plan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Prompts Used</span>
                    <span>{subscription.promptsUsed.toLocaleString()} / {subscription.promptsLimit.toLocaleString()}</span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{promptsRemaining.toLocaleString()} remaining</span>
                    <span>{usagePercentage.toFixed(1)}% used</span>
                  </div>
                </div>
              )}

              {showUsageDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-4 border-t border-slate-700"
                >
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-800/30 p-3 rounded-lg">
                      <p className="text-slate-400">This Week</p>
                      <p className="font-medium">{Math.floor(subscription.promptsUsed * 0.25).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800/30 p-3 rounded-lg">
                      <p className="text-slate-400">Daily Average</p>
                      <p className="font-medium">{Math.floor(subscription.promptsUsed / 30).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Usage Alerts */}
                  {usagePercentage >= 90 && subscription.promptsLimit !== -1 && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Usage Alert</span>
                      </div>
                      <p className="text-sm text-red-300 mt-1">
                        You've used {usagePercentage.toFixed(1)}% of your monthly prompts. Consider upgrading to avoid interruptions.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Features List */}
            <div>
              <h4 className="font-medium mb-3">Included Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {config.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{subscription.renewalCount}</p>
                <p className="text-xs text-slate-400">Renewals</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {subscription.isBanditKidzHolder ? '50%' : '0%'}
                </p>
                <p className="text-xs text-slate-400">Discount</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {Math.floor((Date.now() - new Date(subscription.expiresAt).getTime() + 30 * 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000))}
                </p>
                <p className="text-xs text-slate-400">Days Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Renewal Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onRenew}>
          <CardContent className="p-6 text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-3 text-blue-400" />
            <h3 className="font-medium mb-2">Renew Subscription</h3>
            <p className="text-sm text-slate-400 mb-4">
              Extend your subscription for another month
            </p>
            <Button variant="outline" className="w-full">
              Renew Now
            </Button>
          </CardContent>
        </Card>

        {/* Upgrade Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onUpgrade}>
          <CardContent className="p-6 text-center">
            <ArrowUp className="h-8 w-8 mx-auto mb-3 text-green-400" />
            <h3 className="font-medium mb-2">Upgrade Plan</h3>
            <p className="text-sm text-slate-400 mb-4">
              Get more prompts and features
            </p>
            <Button variant="outline" className="w-full">
              Upgrade
            </Button>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onCancel}>
          <CardContent className="p-6 text-center">
            <Settings className="h-8 w-8 mx-auto mb-3 text-slate-400" />
            <h3 className="font-medium mb-2">Manage</h3>
            <p className="text-sm text-slate-400 mb-4">
              Update settings or cancel subscription
            </p>
            <Button variant="outline" className="w-full">
              Manage
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Special Offers or Alerts */}
      {subscription.tier === 'BASIC' && usagePercentage > 80 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-8 w-8 text-purple-400" />
                <div className="flex-1">
                  <h3 className="font-medium text-purple-300">Ready to Upgrade?</h3>
                  <p className="text-sm text-purple-200 mt-1">
                    You're using {usagePercentage.toFixed(1)}% of your prompts. Upgrade to Standard for 10x more prompts and video generation!
                  </p>
                </div>
                <Button onClick={onUpgrade} className="bg-purple-500 hover:bg-purple-600">
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {subscription.isBanditKidzHolder && (
        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-yellow-400" />
              <div>
                <p className="font-medium text-yellow-300">Bandit Kidz NFT Holder Perks</p>
                <p className="text-sm text-yellow-200">
                  You enjoy 50% off all subscriptions and exclusive access to new features!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}