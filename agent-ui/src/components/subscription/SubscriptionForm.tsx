'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Check, CreditCard, Wallet, Crown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const subscriptionFormSchema = z.object({
  tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'UNLIMITED']),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  company: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
  agreeToPrivacy: z.boolean().refine(val => val === true, 'You must agree to the privacy policy'),
  marketingEmails: z.boolean().default(false),
});

type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>;

interface SubscriptionFormProps {
  onClose: () => void;
  onSuccess: () => void;
  isBanditKidzHolder: boolean;
}

interface TierConfig {
  name: string;
  price: number;
  prompts: number;
  features: string[];
  description: string;
}

const TIER_CONFIGS: Record<string, TierConfig> = {
  BASIC: {
    name: 'Basic',
    price: 10,
    prompts: 50,
    features: ['Basic AI Agents', 'Image Generation', 'Text Generation', 'Email Support'],
    description: 'Perfect for casual users getting started'
  },
  STANDARD: {
    name: 'Standard',
    price: 100,
    prompts: 500,
    features: ['All AI Agents', 'Image & Video Generation', 'Priority Queue', 'Live Chat Support'],
    description: 'Great for regular users and small teams'
  },
  PREMIUM: {
    name: 'Premium',
    price: 200,
    prompts: 2000,
    features: ['All Features', 'API Access', 'Custom Models', 'Priority Support', 'Analytics'],
    description: 'Advanced features for power users'
  },
  UNLIMITED: {
    name: 'Unlimited',
    price: 300,
    prompts: -1,
    features: ['Everything', 'Unlimited Prompts', 'Team Sharing', 'White Label', 'Dedicated Support'],
    description: 'No limits for teams and enterprises'
  }
};

export default function SubscriptionForm({ onClose, onSuccess, isBanditKidzHolder }: SubscriptionFormProps) {
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      marketingEmails: false,
      agreeToTerms: false,
      agreeToPrivacy: false,
    }
  });

  const watchedTier = watch('tier');

  const calculatePrice = (basePriceUSD: number): { usd: number; sonic: number; discount: number } => {
    const discount = isBanditKidzHolder ? 0.5 : 0;
    const discountedUSD = basePriceUSD * (1 - discount);
    const sonicPrice = discountedUSD / 0.75; // Assuming 1 SONIC = $0.75

    return {
      usd: discountedUSD,
      sonic: sonicPrice,
      discount: discount * 100
    };
  };

  const onSubmit = async (data: SubscriptionFormData) => {
    setIsProcessing(true);

    try {
      setProcessingStep('Preparing transaction...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProcessingStep('Approving SONIC tokens...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      setProcessingStep('Minting subscription NFT...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      setProcessingStep('Finalizing subscription...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Here you would call the actual smart contract
      console.log('Subscription data:', data);

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Subscription failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 1: Tier Selection
  const renderTierSelection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Choose Your Subscription Tier</h3>
        {isBanditKidzHolder && (
          <Alert className="mb-4 bg-yellow-500/10 border-yellow-500/20">
            <Crown className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-300">
              🎉 As a Bandit Kidz NFT holder, you get 50% off all subscription plans!
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(TIER_CONFIGS).map(([tier, config]) => {
          const pricing = calculatePrice(config.price);
          const isSelected = selectedTier === tier;

          return (
            <Card
              key={tier}
              className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500 bg-blue-500/5' : 'hover:shadow-lg'}`}
              onClick={() => {
                setSelectedTier(tier);
                setValue('tier', tier as any);
              }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <CardDescription className="text-sm">{config.description}</CardDescription>
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-blue-500" />}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    {isBanditKidzHolder && pricing.discount > 0 && (
                      <span className="text-lg line-through text-slate-500">${config.price}</span>
                    )}
                    <span className="text-2xl font-bold">${pricing.usd}</span>
                    <span className="text-sm text-slate-500">USD</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    ≈ {pricing.sonic.toFixed(2)} SONIC tokens
                  </div>
                  {pricing.discount > 0 && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                      {pricing.discount}% OFF
                    </Badge>
                  )}
                </div>

                <div>
                  <div className="text-lg font-semibold">
                    {config.prompts === -1 ? 'Unlimited' : config.prompts.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500">prompts per month</div>
                </div>

                <ul className="space-y-1 text-sm">
                  {config.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button
        onClick={() => setStep(2)}
        disabled={!selectedTier}
        className="w-full"
      >
        Continue with {selectedTier ? TIER_CONFIGS[selectedTier].name : 'Selected Plan'}
      </Button>
    </div>
  );

  // Step 2: User Information
  const renderUserForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Your Information</h3>
        <p className="text-slate-400 text-sm mb-6">
          We need this information to create your subscription NFT and provide support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            {...register('firstName')}
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            {...register('lastName')}
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
        <p className="text-slate-500 text-sm mt-1">
          We'll use this for subscription notifications and support.
        </p>
      </div>

      <div>
        <Label htmlFor="company">Company (Optional)</Label>
        <Input
          id="company"
          {...register('company')}
        />
      </div>

      {/* Agreement Checkboxes */}
      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="agreeToTerms"
            {...register('agreeToTerms')}
            className={errors.agreeToTerms ? 'border-red-500' : ''}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="agreeToTerms" className="text-sm">
              I agree to the{' '}
              <a href="/terms" className="text-blue-400 hover:underline" target="_blank">
                Terms of Service
              </a>{' '}
              *
            </Label>
            {errors.agreeToTerms && (
              <p className="text-red-500 text-xs">{errors.agreeToTerms.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="agreeToPrivacy"
            {...register('agreeToPrivacy')}
            className={errors.agreeToPrivacy ? 'border-red-500' : ''}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="agreeToPrivacy" className="text-sm">
              I agree to the{' '}
              <a href="/privacy" className="text-blue-400 hover:underline" target="_blank">
                Privacy Policy
              </a>{' '}
              *
            </Label>
            {errors.agreeToPrivacy && (
              <p className="text-red-500 text-xs">{errors.agreeToPrivacy.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="marketingEmails"
            {...register('marketingEmails')}
          />
          <Label htmlFor="marketingEmails" className="text-sm">
            Send me updates about new features and promotions
          </Label>
        </div>
      </div>

      {/* Order Summary */}
      {watchedTier && (
        <Card className="bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>{TIER_CONFIGS[watchedTier].name} Subscription</span>
              <span>${TIER_CONFIGS[watchedTier].price}</span>
            </div>
            {isBanditKidzHolder && (
              <div className="flex justify-between text-green-400">
                <span>Bandit Kidz Discount (50%)</span>
                <span>-${TIER_CONFIGS[watchedTier].price / 2}</span>
              </div>
            )}
            <hr className="border-slate-600" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <div className="text-right">
                <div>${calculatePrice(TIER_CONFIGS[watchedTier].price).usd}</div>
                <div className="text-sm text-slate-400">
                  ≈ {calculatePrice(TIER_CONFIGS[watchedTier].price).sonic.toFixed(2)} SONIC
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(1)}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing ? 'Processing...' : 'Subscribe Now'}
        </Button>
      </div>
    </form>
  );

  // Processing Modal
  const renderProcessing = () => (
    <div className="text-center space-y-6">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Processing Your Subscription</h3>
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
            {step === 1 ? 'Choose Your Plan' : 'Complete Your Subscription'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Select the subscription tier that best fits your needs'
              : 'Enter your details to complete the subscription process'
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
                {renderUserForm()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}