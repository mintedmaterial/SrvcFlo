'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  RefreshCw,
  Crown,
  Zap,
  CheckCircle,
  CreditCard,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow, format, addMonths } from 'date-fns';
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

interface RenewalModalProps {
  subscription: Subscription;
  onClose: () => void;
  onSuccess: () => void;
}

const tierPrices = {
  BANDIT_KIDZ: 0,
  BASIC: 10,
  STANDARD: 100,
  PREMIUM: 200,
  UNLIMITED: 300
};

export default function RenewalModal({ subscription, onClose, onSuccess }: RenewalModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [step, setStep] = useState(1);
  const { renewSubscription } = useSubscription();

  const basePrice = tierPrices[subscription.tier];
  const discount = subscription.isBanditKidzHolder && subscription.tier !== 'BANDIT_KIDZ' ? 0.5 : 0;
  const finalPrice = basePrice * (1 - discount);
  const sonicPrice = finalPrice / 0.75; // Assuming 1 SONIC = $0.75

  const newExpirationDate = addMonths(new Date(subscription.expiresAt), 1);
  const isExpired = subscription.expired;
  const isExpiringSoon = new Date(subscription.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  const handleRenewal = async () => {
    setIsProcessing(true);

    try {
      setProcessingStep('Preparing renewal transaction...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (subscription.tier !== 'BANDIT_KIDZ') {
        setProcessingStep('Approving SONIC token payment...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setProcessingStep('Processing renewal on blockchain...');
      const success = await renewSubscription(subscription.tokenId);

      if (success) {
        setProcessingStep('Renewal completed successfully!');
        await new Promise(resolve => setTimeout(resolve, 1000));
        onSuccess();
        onClose();
      } else {
        throw new Error('Renewal failed');
      }
    } catch (error) {
      console.error('Renewal failed:', error);
      setProcessingStep('Renewal failed. Please try again.');
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-semibold mb-2">Renew Your Subscription</h3>
        <p className="text-slate-400">
          {isExpired
            ? 'Your subscription has expired. Renew now to restore access.'
            : 'Extend your subscription for another month.'
          }
        </p>
      </div>

      {isExpired && (
        <Alert className="bg-red-500/10 border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            Your subscription expired {formatDistanceToNow(new Date(subscription.expiresAt), { addSuffix: true })}.
            Some features may be limited until renewal.
          </AlertDescription>
        </Alert>
      )}

      {isExpiringSoon && !isExpired && (
        <Alert className="bg-yellow-500/10 border-yellow-500/20">
          <Calendar className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-300">
            Your subscription expires {formatDistanceToNow(new Date(subscription.expiresAt), { addSuffix: true })}.
            Renew now to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Subscription Info */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Subscription
            <Badge variant="outline">{subscription.tier.replace('_', ' ')}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Token ID</span>
            <span>#{subscription.tokenId}</span>
          </div>
          <div className="flex justify-between">
            <span>Current Period</span>
            <span>{format(new Date(subscription.expiresAt), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span>Renewals</span>
            <span>{subscription.renewalCount} times</span>
          </div>
          {subscription.promptsLimit !== -1 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage This Period</span>
                <span>{subscription.promptsUsed} / {subscription.promptsLimit}</span>
              </div>
              <Progress
                value={(subscription.promptsUsed / subscription.promptsLimit) * 100}
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Renewal Details */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Renewal Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>New Expiration Date</span>
            <span className="font-medium">{format(newExpirationDate, 'MMM dd, yyyy')}</span>
          </div>

          {subscription.tier === 'BANDIT_KIDZ' ? (
            <div className="text-center p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg">
              <Crown className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
              <p className="font-medium text-yellow-300">Free Renewal</p>
              <p className="text-sm text-yellow-200">Exclusive benefit for Bandit Kidz NFT holders</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Base Price</span>
                <span>${basePrice}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Bandit Kidz Discount ({(discount * 100)}%)</span>
                  <span>-${(basePrice * discount).toFixed(2)}</span>
                </div>
              )}
              <hr className="border-slate-600" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <div className="text-right">
                  <div>${finalPrice}</div>
                  <div className="text-sm text-slate-400">≈ {sonicPrice.toFixed(2)} SONIC</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-800/50 p-3 rounded-lg">
            <p className="text-sm text-slate-300 mb-1">What happens after renewal:</p>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Your prompt usage counter resets to 0</li>
              <li>• All current features remain active</li>
              <li>• Subscription auto-expires after 30 days unless renewed again</li>
              {subscription.tier !== 'BANDIT_KIDZ' && <li>• Payment is processed immediately</li>}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={() => setStep(2)}
          className="flex-1"
          disabled={isProcessing}
        >
          Continue to Renewal
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2">Confirm Renewal</h3>
        <p className="text-slate-400">
          Review the details below and confirm your subscription renewal
        </p>
      </div>

      {/* Final Confirmation */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardHeader>
          <CardTitle>Renewal Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Subscription</span>
            <span className="font-medium">{subscription.tier.replace('_', ' ')} #{subscription.tokenId}</span>
          </div>
          <div className="flex justify-between">
            <span>Renewal Period</span>
            <span className="font-medium">30 days</span>
          </div>
          <div className="flex justify-between">
            <span>New Expiration</span>
            <span className="font-medium">{format(newExpirationDate, 'MMM dd, yyyy')}</span>
          </div>
          <hr className="border-slate-600" />
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Cost</span>
            <span>
              {subscription.tier === 'BANDIT_KIDZ' ? (
                <span className="text-green-400">FREE</span>
              ) : (
                <span>${finalPrice} (≈ {sonicPrice.toFixed(2)} SONIC)</span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {subscription.tier !== 'BANDIT_KIDZ' && (
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            Payment will be processed using SONIC tokens from your connected wallet.
            Make sure you have sufficient balance and network fees.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
          Back
        </Button>
        <Button
          onClick={handleRenewal}
          className="flex-1"
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : `Confirm Renewal`}
        </Button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center space-y-6">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Processing Renewal</h3>
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === 1 ? 'Renew Subscription' : 'Confirm Renewal'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Extend your ServiceFlow AI subscription for another month'
              : 'Review and confirm your subscription renewal'
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

          <motion.div
            key={step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {isProcessing ? renderProcessing() : step === 1 ? renderStep1() : renderStep2()}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}