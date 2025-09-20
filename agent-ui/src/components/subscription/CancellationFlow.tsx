'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextArea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  XCircle,
  AlertTriangle,
  Heart,
  DollarSign,
  Users,
  Bug,
  Settings,
  HelpCircle,
  RefreshCw,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow, format } from 'date-fns';
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

interface CancellationFlowProps {
  subscription: Subscription;
  onClose: () => void;
  onSuccess: () => void;
}

const cancellationSchema = z.object({
  reason: z.enum([
    'too_expensive',
    'not_using_enough',
    'missing_features',
    'found_alternative',
    'technical_issues',
    'temporary_break',
    'other'
  ]),
  feedback: z.string().min(10, 'Please provide at least 10 characters of feedback'),
  retentionOffer: z.enum(['discount', 'pause', 'downgrade', 'none']).optional(),
  confirmCancellation: z.boolean().refine(val => val === true, 'You must confirm the cancellation'),
  keepUpdates: z.boolean().default(false),
});

type CancellationFormData = z.infer<typeof cancellationSchema>;

const reasonOptions = [
  {
    value: 'too_expensive',
    label: 'Too expensive',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-red-400'
  },
  {
    value: 'not_using_enough',
    label: 'Not using it enough',
    icon: <Users className="h-4 w-4" />,
    color: 'text-orange-400'
  },
  {
    value: 'missing_features',
    label: 'Missing features I need',
    icon: <Settings className="h-4 w-4" />,
    color: 'text-blue-400'
  },
  {
    value: 'found_alternative',
    label: 'Found a better alternative',
    icon: <RefreshCw className="h-4 w-4" />,
    color: 'text-purple-400'
  },
  {
    value: 'technical_issues',
    label: 'Technical issues',
    icon: <Bug className="h-4 w-4" />,
    color: 'text-yellow-400'
  },
  {
    value: 'temporary_break',
    label: 'Taking a temporary break',
    icon: <Heart className="h-4 w-4" />,
    color: 'text-green-400'
  },
  {
    value: 'other',
    label: 'Other reason',
    icon: <HelpCircle className="h-4 w-4" />,
    color: 'text-slate-400'
  }
];

export default function CancellationFlow({ subscription, onClose, onSuccess }: CancellationFlowProps) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [showRetentionOffer, setShowRetentionOffer] = useState(false);
  const { cancelSubscription } = useSubscription();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CancellationFormData>({
    resolver: zodResolver(cancellationSchema),
    defaultValues: {
      keepUpdates: false,
      confirmCancellation: false,
    }
  });

  const watchedReason = watch('reason');
  const watchedRetentionOffer = watch('retentionOffer');

  const getRetentionOffer = (reason: string) => {
    switch (reason) {
      case 'too_expensive':
        return {
          type: 'discount',
          title: 'Special Discount Offer',
          description: '50% off your next 3 months',
          action: 'Apply 50% discount and continue'
        };
      case 'not_using_enough':
        return {
          type: 'pause',
          title: 'Pause Your Subscription',
          description: 'Pause for up to 3 months, keep your benefits',
          action: 'Pause subscription'
        };
      case 'missing_features':
        return {
          type: 'downgrade',
          title: 'Try a Lower Tier',
          description: 'Downgrade to Basic plan and save money',
          action: 'Downgrade to Basic'
        };
      case 'temporary_break':
        return {
          type: 'pause',
          title: 'Pause Your Subscription',
          description: 'Take a break and reactivate anytime',
          action: 'Pause subscription'
        };
      default:
        return null;
    }
  };

  const retentionOffer = watchedReason ? getRetentionOffer(watchedReason) : null;

  const onSubmit = async (data: CancellationFormData) => {
    if (data.retentionOffer && data.retentionOffer !== 'none') {
      // Handle retention offer
      handleRetentionOffer(data.retentionOffer);
      return;
    }

    setIsProcessing(true);

    try {
      setProcessingStep('Preparing cancellation...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProcessingStep('Processing cancellation on blockchain...');
      const success = await cancelSubscription(subscription.tokenId, data.feedback);

      if (success) {
        setProcessingStep('Cancellation completed successfully');
        await new Promise(resolve => setTimeout(resolve, 1000));
        onSuccess();
        onClose();
      } else {
        throw new Error('Cancellation failed');
      }
    } catch (error) {
      console.error('Cancellation failed:', error);
      setProcessingStep('Cancellation failed. Please try again.');
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  const handleRetentionOffer = async (offerType: string) => {
    setIsProcessing(true);
    try {
      setProcessingStep(`Processing ${offerType} offer...`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In real implementation, this would call appropriate functions
      console.log(`Applying retention offer: ${offerType}`);

      setProcessingStep('Offer applied successfully!');
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Retention offer failed:', error);
      setProcessingStep('Failed to apply offer. Please try again.');
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2">We're Sorry to See You Go</h3>
        <p className="text-slate-400">
          Help us understand why you're canceling so we can improve our service
        </p>
      </div>

      {/* Current Subscription Info */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Your Current Subscription
            <Badge variant="outline">{subscription.tier.replace('_', ' ')}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Token ID</span>
            <span>#{subscription.tokenId}</span>
          </div>
          <div className="flex justify-between">
            <span>Expires</span>
            <span>{format(new Date(subscription.expiresAt), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span>Time Remaining</span>
            <span>{formatDistanceToNow(new Date(subscription.expiresAt), { addSuffix: true })}</span>
          </div>
          {subscription.promptsLimit !== -1 && (
            <div className="flex justify-between">
              <span>Prompts Used</span>
              <span>{subscription.promptsUsed} / {subscription.promptsLimit}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Reason */}
      <div className="space-y-4">
        <Label className="text-lg font-medium">Why are you canceling?</Label>
        <RadioGroup
          onValueChange={(value) => {
            setValue('reason', value as any);
            setShowRetentionOffer(getRetentionOffer(value) !== null);
          }}
          className="space-y-2"
        >
          {reasonOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label
                htmlFor={option.value}
                className="flex items-center gap-2 cursor-pointer flex-1 p-3 rounded-lg hover:bg-slate-800/50"
              >
                <span className={option.color}>{option.icon}</span>
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {errors.reason && (
          <p className="text-red-500 text-sm">{errors.reason.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Keep Subscription
        </Button>
        <Button
          onClick={() => setStep(2)}
          disabled={!watchedReason}
          className="flex-1"
          variant="destructive"
        >
          Continue Cancellation
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Retention Offer */}
      {retentionOffer && showRetentionOffer && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Wait! We Have an Offer for You
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-lg mb-2">{retentionOffer.title}</h4>
              <p className="text-slate-400">{retentionOffer.description}</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setValue('retentionOffer', retentionOffer.type as any)}
                className="flex-1"
              >
                {retentionOffer.action}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowRetentionOffer(false)}
                className="flex-1"
              >
                No thanks, continue canceling
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback Form */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="feedback" className="text-lg font-medium">
            Tell us more about your decision
          </Label>
          <p className="text-sm text-slate-400 mb-3">
            Your feedback helps us improve ServiceFlow AI for future users
          </p>
        </div>
        <TextArea
          id="feedback"
          {...register('feedback')}
          placeholder="Please share your thoughts on what we could do better..."
          className={`min-h-[120px] ${errors.feedback ? 'border-red-500' : ''}`}
        />
        {errors.feedback && (
          <p className="text-red-500 text-sm">{errors.feedback.message}</p>
        )}
      </div>

      {/* Cancellation Impact */}
      <Alert className="bg-yellow-500/10 border-yellow-500/20">
        <AlertTriangle className="h-4 w-4 text-yellow-400" />
        <AlertDescription className="text-yellow-300">
          <strong>What happens when you cancel:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Your subscription remains active until {format(new Date(subscription.expiresAt), 'MMM dd, yyyy')}</li>
            <li>• After expiration, you'll lose access to all premium features</li>
            <li>• Your usage history and settings will be preserved for 30 days</li>
            <li>• You can reactivate anytime before the data retention period ends</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Confirmation Options */}
      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="confirmCancellation"
            {...register('confirmCancellation')}
            className={errors.confirmCancellation ? 'border-red-500' : ''}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="confirmCancellation" className="text-sm font-medium">
              I understand the cancellation terms and want to proceed *
            </Label>
            {errors.confirmCancellation && (
              <p className="text-red-500 text-xs">{errors.confirmCancellation.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="keepUpdates"
            {...register('keepUpdates')}
          />
          <Label htmlFor="keepUpdates" className="text-sm">
            Keep me updated about new features and improvements (optional)
          </Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setStep(1)}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isProcessing}
          variant="destructive"
          className="flex-1"
        >
          {isProcessing ? 'Processing...' : 'Cancel Subscription'}
        </Button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center space-y-6">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Processing Request</h3>
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
            {step === 1 ? 'Cancel Subscription' : 'Confirm Cancellation'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'We value your feedback and want to understand your decision'
              : 'Please provide additional details to complete the cancellation'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-red-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
                1
              </div>
              <div className={`w-16 h-1 ${step > 1 ? 'bg-red-500' : 'bg-slate-600'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-red-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
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
                {renderStep1()}
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {renderStep2()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}