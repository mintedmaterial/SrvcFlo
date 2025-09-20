'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionForm from '@/components/subscription/SubscriptionForm';
import SubscriptionManager from '@/components/subscription/SubscriptionManager';
import RenewalModal from '@/components/subscription/RenewalModal';
import UpgradeDowngrade from '@/components/subscription/UpgradeDowngrade';
import CancellationFlow from '@/components/subscription/CancellationFlow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Star, Zap, Infinity, Gift } from 'lucide-react';

export default function SubscriptionPage() {
  const { address, isConnected } = useWallet();
  const { subscription, isLoading, isBanditKidzHolder, checkSubscription, refreshSubscription } = useSubscription();

  const [showForm, setShowForm] = useState(false);
  const [showRenewal, setShowRenewal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      checkSubscription(address);
    }
  }, [isConnected, address, checkSubscription]);

  // Subscription tier configurations for display
  const tierConfigs = {
    BANDIT_KIDZ: {
      name: 'Bandit Kidz Free',
      description: 'Exclusive free tier for Bandit Kidz NFT holders',
      price: 'Free',
      prompts: 100,
      features: ['Basic AI Agents', 'Image Generation', 'Text Generation', 'Community Support'],
      icon: <Crown className="h-6 w-6" />,
      color: 'from-yellow-500 to-orange-500',
      badge: 'Exclusive'
    },
    BASIC: {
      name: 'Basic',
      description: 'Perfect for casual users getting started',
      price: '$10',
      prompts: 50,
      features: ['Basic AI Agents', 'Image Generation', 'Text Generation', 'Email Support'],
      icon: <Star className="h-6 w-6" />,
      color: 'from-blue-500 to-cyan-500',
      badge: 'Popular'
    },
    STANDARD: {
      name: 'Standard',
      description: 'Great for regular users and small teams',
      price: '$100',
      prompts: 500,
      features: ['All AI Agents', 'Image & Video Generation', 'Priority Queue', 'Live Chat Support'],
      icon: <Zap className="h-6 w-6" />,
      color: 'from-purple-500 to-pink-500',
      badge: 'Value'
    },
    PREMIUM: {
      name: 'Premium',
      description: 'Advanced features for power users',
      price: '$200',
      prompts: 2000,
      features: ['All Features', 'API Access', 'Custom Models', 'Priority Support', 'Analytics'],
      icon: <Gift className="h-6 w-6" />,
      color: 'from-green-500 to-emerald-500',
      badge: 'Pro'
    },
    UNLIMITED: {
      name: 'Unlimited',
      description: 'No limits for teams and enterprises',
      price: '$300',
      prompts: 'Unlimited',
      features: ['Everything', 'Unlimited Prompts', 'Team Sharing', 'White Label', 'Dedicated Support'],
      icon: <Infinity className="h-6 w-6" />,
      color: 'from-slate-800 to-slate-900',
      badge: 'Enterprise'
    }
  };

  const handleAccessRequest = async () => {
    try {
      // This would call the smart contract's requestAccess function
      setAccessRequested(true);
      // In a real implementation, this would trigger a blockchain transaction
      console.log('Access requested for:', address);
    } catch (error) {
      console.error('Failed to request access:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to access ServiceFlow AI subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => {/* Connect wallet logic */}}>
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p className="text-white text-lg">Loading subscription status...</p>
        </div>
      </div>
    );
  }

  // User has active subscription - show management interface
  if (subscription && subscription.isActive && !subscription.expired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-white mb-2">Your Subscription</h1>
            <p className="text-slate-300">Manage your ServiceFlow AI subscription</p>
          </motion.div>

          {/* Subscription Status */}
          <SubscriptionManager
            subscription={subscription}
            onRenew={() => setShowRenewal(true)}
            onUpgrade={() => setShowUpgrade(true)}
            onCancel={() => setShowCancellation(true)}
          />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-16 text-lg"
              onClick={() => setShowRenewal(true)}
            >
              Renew Subscription
            </Button>
            <Button
              variant="outline"
              className="h-16 text-lg"
              onClick={() => setShowUpgrade(true)}
            >
              Upgrade Plan
            </Button>
            <Button
              variant="destructive"
              className="h-16 text-lg"
              onClick={() => setShowCancellation(true)}
            >
              Cancel Subscription
            </Button>
          </div>
        </div>

        {/* Modals */}
        {showRenewal && (
          <RenewalModal
            subscription={subscription}
            onClose={() => setShowRenewal(false)}
            onSuccess={refreshSubscription}
          />
        )}

        {showUpgrade && (
          <UpgradeDowngrade
            currentSubscription={subscription}
            onClose={() => setShowUpgrade(false)}
            onSuccess={refreshSubscription}
          />
        )}

        {showCancellation && (
          <CancellationFlow
            subscription={subscription}
            onClose={() => setShowCancellation(false)}
            onSuccess={refreshSubscription}
          />
        )}
      </div>
    );
  }

  // No subscription - show access flow
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome to ServiceFlow AI
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Choose your subscription plan to access our powerful AI agents
          </p>

          {/* Bandit Kidz Status */}
          {isBanditKidzHolder ? (
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4 mb-8">
              <div className="flex items-center justify-center gap-2 text-yellow-400">
                <Crown className="h-6 w-6" />
                <span className="text-lg font-semibold">Bandit Kidz NFT Holder Detected!</span>
              </div>
              <p className="text-yellow-300 mt-2">
                You're eligible for our exclusive free tier with 100 monthly prompts and 50% off all paid plans!
              </p>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-8">
              <p className="text-slate-300">
                Don't have a Bandit Kidz NFT? Request access below to get started with our subscription plans.
              </p>
              {!accessRequested ? (
                <Button
                  className="mt-4"
                  onClick={handleAccessRequest}
                  variant="outline"
                >
                  Request Access
                </Button>
              ) : (
                <div className="mt-4 text-green-400">
                  ✓ Access requested! We'll review your application soon.
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Subscription Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {Object.entries(tierConfigs).map(([tier, config], index) => {
            const discountedPrice = isBanditKidzHolder && tier !== 'BANDIT_KIDZ'
              ? `$${parseInt(config.price.replace('$', '')) / 2}`
              : config.price;

            const isAvailable = isBanditKidzHolder || accessRequested || tier === 'BANDIT_KIDZ';
            const isFree = tier === 'BANDIT_KIDZ' && isBanditKidzHolder;

            return (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative h-full ${isAvailable ? 'hover:shadow-xl transition-shadow cursor-pointer' : 'opacity-60'}`}>
                  {config.badge && (
                    <Badge className="absolute -top-2 -right-2 z-10">
                      {config.badge}
                    </Badge>
                  )}

                  <CardHeader className="text-center">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center text-white mx-auto mb-4`}>
                      {config.icon}
                    </div>
                    <CardTitle className="text-xl">{config.name}</CardTitle>
                    <CardDescription className="text-sm">{config.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {isBanditKidzHolder && config.price !== 'Free' ? (
                          <div>
                            <span className="text-lg line-through text-slate-500">{config.price}</span>
                            <div className="text-green-500">{discountedPrice}</div>
                          </div>
                        ) : (
                          config.price
                        )}
                      </div>
                      <div className="text-sm text-slate-500">per month</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-semibold">
                        {config.prompts === 'Unlimited' ? '∞' : config.prompts}
                      </div>
                      <div className="text-sm text-slate-500">prompts/month</div>
                    </div>

                    <ul className="space-y-2 text-sm">
                      {config.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      disabled={!isAvailable}
                      onClick={() => {
                        if (isFree) {
                          // Handle free subscription mint
                          console.log('Minting free subscription for Bandit Kidz holder');
                        } else {
                          setShowForm(true);
                        }
                      }}
                    >
                      {isFree ? 'Activate Free Tier' : 'Select Plan'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-slate-400 space-y-2"
        >
          <p>All subscriptions are powered by Sonic blockchain and paid in SONIC tokens</p>
          <p>NFT subscription packages are transferable and can be renewed anytime</p>
          <p>Cancel anytime with no hidden fees</p>
        </motion.div>
      </div>

      {/* Subscription Form Modal */}
      {showForm && (
        <SubscriptionForm
          onClose={() => setShowForm(false)}
          onSuccess={refreshSubscription}
          isBanditKidzHolder={isBanditKidzHolder}
        />
      )}
    </div>
  );
}