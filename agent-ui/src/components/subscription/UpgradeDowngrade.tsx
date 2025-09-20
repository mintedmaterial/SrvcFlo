'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowUp,
  ArrowDown,
  Star,
  Zap,
  Crown,
  Gift,
  Infinity,
  Check,
  TrendingUp,
  TrendingDown,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';
import { useSubscription } from '@/hooks/useSubscription';

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

interface UpgradeDowngradeProps {
  currentSubscription: Subscription;
  onClose: () => void;
  onSuccess: () => void;
}

const tierConfigs = {
  BANDIT_KIDZ: {
    name: 'Bandit Kidz Free',
    price: 0,
    prompts: 100,
    icon: <Crown className="h-5 w-5" />,
    color: 'from-yellow-500 to-orange-500',
    features: ['Basic AI Agents', 'Image Generation', 'Text Generation', 'Community Support'],
    order: 0
  },
  BASIC: {
    name: 'Basic',
    price: 10,
    prompts: 50,
    icon: <Star className="h-5 w-5" />,
    color: 'from-blue-500 to-cyan-500',
    features: ['Basic AI Agents', 'Image Generation', 'Text Generation', 'Email Support'],
    order: 1
  },
  STANDARD: {
    name: 'Standard',
    price: 100,
    prompts: 500,
    icon: <Zap className="h-5 w-5" />,
    color: 'from-purple-500 to-pink-500',
    features: ['All AI Agents', 'Image & Video Generation', 'Priority Queue', 'Live Chat Support'],
    order: 2
  },
  PREMIUM: {
    name: 'Premium',
    price: 200,
    prompts: 2000,
    icon: <Gift className="h-5 w-5" />,
    color: 'from-green-500 to-emerald-500',
    features: ['All Features', 'API Access', 'Custom Models', 'Priority Support', 'Analytics'],
    order: 3
  },
  UNLIMITED: {
    name: 'Unlimited',
    price: 300,
    prompts: -1,
    icon: <Infinity className="h-5 w-5" />,
    color: 'from-slate-700 to-slate-900',
    features: ['Everything', 'Unlimited Prompts', 'Team Sharing', 'White Label', 'Dedicated Support'],
    order: 4
  }
};

type TierKey = keyof typeof tierConfigs;

export default function UpgradeDowngrade({ currentSubscription, onClose, onSuccess }: UpgradeDowngradeProps) {
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [step, setStep] = useState(1);
  const { upgradeSubscription } = useSubscription();

  const currentConfig = tierConfigs[currentSubscription.tier];
  const currentOrder = currentConfig.order;

  // Filter available tiers (can't downgrade to BANDIT_KIDZ unless user is holder)
  const availableTiers = Object.entries(tierConfigs).filter(([tier, config]) => {
    if (tier === currentSubscription.tier) return false;
    if (tier === 'BANDIT_KIDZ' && !currentSubscription.isBanditKidzHolder) return false;
    return true;
  }) as [TierKey, typeof tierConfigs[TierKey]][];

  const calculatePriceDifference = (newTier: TierKey) => {
    const currentPrice = currentConfig.price;
    const newPrice = tierConfigs[newTier].price;
    const discount = currentSubscription.isBanditKidzHolder ? 0.5 : 0;

    if (newTier === 'BANDIT_KIDZ') {
      return { difference: -currentPrice, isUpgrade: false, sonicAmount: 0 };
    }

    const priceDiff = newPrice - currentPrice;
    const discountedDiff = priceDiff * (1 - discount);
    const isUpgrade = tierConfigs[newTier].order > currentOrder;

    return {
      difference: discountedDiff,
      isUpgrade,
      sonicAmount: discountedDiff > 0 ? discountedDiff / 0.75 : 0
    };
  };

  const handleUpgrade = async () => {
    if (!selectedTier) return;

    setIsProcessing(true);

    try {
      setProcessingStep('Preparing transaction...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { difference } = calculatePriceDifference(selectedTier);

      if (difference > 0) {
        setProcessingStep('Approving SONIC token payment...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setProcessingStep('Processing subscription change...');
      const success = await upgradeSubscription(currentSubscription.tokenId, selectedTier);

      if (success) {
        setProcessingStep('Subscription updated successfully!');
        await new Promise(resolve => setTimeout(resolve, 1000));
        onSuccess();
        onClose();
      } else {
        throw new Error('Upgrade failed');
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      setProcessingStep('Upgrade failed. Please try again.');
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  const renderTierSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <TrendingUp className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2">Change Your Plan</h3>
        <p className="text-slate-400">
          Upgrade or downgrade your subscription to better fit your needs
        </p>
      </div>

      {/* Current Plan Display */}
      <Card className="bg-slate-800/50 border-slate-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            Current Plan
            <Badge variant="outline">{currentConfig.name}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${currentConfig.color} text-white`}>
              {currentConfig.icon}
            </div>
            <div>
              <p className="font-medium">${currentConfig.price}/month</p>
              <p className="text-sm text-slate-400">
                {currentConfig.prompts === -1 ? 'Unlimited' : currentConfig.prompts} prompts
              </p>
            </div>
          </div>
          {currentSubscription.promptsLimit !== -1 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Usage</span>
                <span>{currentSubscription.promptsUsed} / {currentSubscription.promptsLimit}</span>
              </div>
              <Progress
                value={(currentSubscription.promptsUsed / currentSubscription.promptsLimit) * 100}
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="space-y-4">
        <h4 className="font-medium text-lg">Available Plans</h4>
        <div className="space-y-3">
          {availableTiers.map(([tier, config]) => {
            const pricing = calculatePriceDifference(tier);
            const isSelected = selectedTier === tier;
            const isUpgrade = config.order > currentOrder;

            return (
              <Card
                key={tier}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-blue-500 bg-blue-500/5'
                    : 'hover:shadow-lg hover:bg-slate-800/30'
                }`}
                onClick={() => setSelectedTier(tier)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${config.color} text-white`}>
                        {config.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{config.name}</h5>
                          {isUpgrade ? (
                            <ArrowUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                        <p className="text-sm text-slate-400">
                          {config.prompts === -1 ? 'Unlimited' : config.prompts} prompts/month
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {tier === 'BANDIT_KIDZ' ? (
                          <span className="text-lg font-bold text-green-500">FREE</span>
                        ) : (
                          <>
                            {currentSubscription.isBanditKidzHolder && (
                              <span className="text-sm line-through text-slate-500">
                                ${config.price}
                              </span>
                            )}
                            <span className="text-lg font-bold">
                              ${config.price * (currentSubscription.isBanditKidzHolder ? 0.5 : 1)}
                            </span>
                          </>
                        )}
                        {isSelected && <Check className="h-5 w-5 text-blue-500" />}
                      </div>

                      {/* Price difference */}
                      {pricing.difference !== 0 && (
                        <div className={`text-sm ${pricing.difference > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {pricing.difference > 0 ? '+' : ''}${pricing.difference.toFixed(2)}
                          {pricing.difference > 0 && (
                            <div className="text-xs">≈ {pricing.sonicAmount.toFixed(2)} SONIC</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features comparison */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-slate-600"
                    >
                      <h6 className="text-sm font-medium mb-2">Plan Features:</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {config.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={() => setStep(2)}
          disabled={!selectedTier}
          className="flex-1"
        >
          Continue with {selectedTier ? tierConfigs[selectedTier].name : 'Selected Plan'}
        </Button>
      </div>
    </div>
  );

  const renderConfirmation = () => {
    if (!selectedTier) return null;

    const selectedConfig = tierConfigs[selectedTier];
    const pricing = calculatePriceDifference(selectedTier);
    const isUpgrade = pricing.isUpgrade;

    return (
      <div className="space-y-6">
        <div className="text-center">
          {isUpgrade ? (
            <TrendingUp className="h-16 w-16 text-green-500 mx-auto mb-4" />
          ) : (
            <TrendingDown className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          )}
          <h3 className="text-2xl font-semibold mb-2">
            Confirm {isUpgrade ? 'Upgrade' : 'Downgrade'}
          </h3>
          <p className="text-slate-400">
            Review your plan change and confirm the transaction
          </p>
        </div>

        {/* Change Summary */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle>Plan Change Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${currentConfig.color} text-white`}>
                  {currentConfig.icon}
                </div>
                <div>
                  <p className="font-medium">{currentConfig.name}</p>
                  <p className="text-sm text-slate-400">Current Plan</p>
                </div>
              </div>
              <ArrowDown className="h-6 w-6 text-slate-400" />
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${selectedConfig.color} text-white`}>
                  {selectedConfig.icon}
                </div>
                <div>
                  <p className="font-medium">{selectedConfig.name}</p>
                  <p className="text-sm text-slate-400">New Plan</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Prompts per month</span>
                <span>
                  {currentConfig.prompts === -1 ? 'Unlimited' : currentConfig.prompts} →{' '}
                  {selectedConfig.prompts === -1 ? 'Unlimited' : selectedConfig.prompts}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Price change</span>
                <span className={pricing.difference > 0 ? 'text-red-400' : 'text-green-400'}>
                  {pricing.difference > 0 ? '+' : ''}${pricing.difference.toFixed(2)}
                </span>
              </div>
              {pricing.sonicAmount > 0 && (
                <div className="flex justify-between text-sm text-slate-400">
                  <span>SONIC tokens required</span>
                  <span>{pricing.sonicAmount.toFixed(2)} SONIC</span>
                </div>
              )}
            </div>

            {!isUpgrade && (
              <Alert className="bg-yellow-500/10 border-yellow-500/20">
                <AlertDescription className="text-yellow-300">
                  Note: Downgrading will not provide a refund for the current billing period.
                  The change will take effect immediately.
                </AlertDescription>
              </Alert>
            )}

            {pricing.difference > 0 && (
              <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                  The price difference will be charged immediately using SONIC tokens.
                  Your subscription period remains the same.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
            Back
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? 'Processing...' : `Confirm ${isUpgrade ? 'Upgrade' : 'Downgrade'}`}
          </Button>
        </div>
      </div>
    );
  };

  const renderProcessing = () => (
    <div className="text-center space-y-6">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Processing Plan Change</h3>
        <p className="text-slate-400">{processingStep}</p>
      </div>
      <div className="bg-slate-800/50 rounded-lg p-4">
        <p className="text-sm text-slate-300 mb-2">Please don't close this window</p>
        <p className="text-xs text-slate-500">
          This process may take a few minutes as we interact with the Sonic blockchain.
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === 1 ? 'Change Your Plan' : 'Confirm Plan Change'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Select a new subscription tier that better fits your needs'
              : 'Review and confirm your subscription change'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
                1
              </div>
              <div className={`w-16 h-1 ${step > 1 ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
                2
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderProcessing()}
              </motion.div>
            ) : step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {renderTierSelection()}
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {renderConfirmation()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}