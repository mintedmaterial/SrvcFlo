'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Crown, Building } from 'lucide-react';

interface CreditPackage {
  id: number;
  name: string;
  credits: number;
  priceUSDC: number;
  priceS: number;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  tier: 'starter' | 'creator' | 'professional' | 'enterprise';
}

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 0,
    name: 'Starter',
    credits: 750,
    priceUSDC: 5,
    priceS: 5,
    features: [
      '750 credits for generations',
      'Basic AI models',
      '37 image generations (200 credits each)',
      '1 video generation (500 credits)',
      'Community support'
    ],
    icon: <Sparkles className="h-6 w-6" />,
    tier: 'starter'
  },
  {
    id: 1,
    name: 'Creator',
    credits: 8000,
    priceUSDC: 50,
    priceS: 50,
    features: [
      '8,000 credits for generations',
      'All AI models access',
      '40 image generations',
      '16 video generations',
      'Collection influence',
      'Priority support'
    ],
    popular: true,
    icon: <Zap className="h-6 w-6" />,
    tier: 'creator'
  },
  {
    id: 2,
    name: 'Professional',
    credits: 50000,
    priceUSDC: 200,
    priceS: 200,
    features: [
      '50,000 credits for generations',
      'Premium AI models',
      '250 image generations',
      '100 video generations',
      'Advanced features',
      'Custom integrations',
      'Dedicated support'
    ],
    icon: <Crown className="h-6 w-6" />,
    tier: 'professional'
  },
  {
    id: 3,
    name: 'Enterprise',
    credits: 500000,
    priceUSDC: 1500,
    priceS: 1500,
    features: [
      '500,000 credits for generations',
      'All premium models',
      '2,500 image generations',
      '1,000 video generations',
      'Custom fine-tuned models',
      'White-label solutions',
      '24/7 priority support',
      'SLA guarantees'
    ],
    icon: <Building className="h-6 w-6" />,
    tier: 'enterprise'
  }
];

interface CreditPackageCardProps {
  userAddress?: string;
  onPurchase: (packageId: number, paymentType: 'usdc' | 's_tokens') => Promise<void>;
  loading?: boolean;
  userCredits?: { [packageId: number]: number };
}

export function CreditPackageCard({ userAddress, onPurchase, loading, userCredits }: CreditPackageCardProps) {
  const [processingPackage, setProcessingPackage] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<'usdc' | 's_tokens'>('s_tokens');

  const handlePurchase = async (packageId: number) => {
    if (!userAddress) return;
    
    setProcessingPackage(packageId);
    try {
      await onPurchase(packageId, paymentType);
    } finally {
      setProcessingPackage(null);
    }
  };

  const getGradientClass = (tier: string) => {
    switch (tier) {
      case 'starter':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/50';
      case 'creator':
        return 'from-purple-500/20 to-pink-500/20 border-purple-500/50';
      case 'professional':
        return 'from-orange-500/20 to-red-500/20 border-orange-500/50';
      case 'enterprise':
        return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
      default:
        return 'from-gray-500/20 to-gray-600/20 border-gray-500/50';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {CREDIT_PACKAGES.map((pkg) => (
        <Card 
          key={pkg.id} 
          className={`relative bg-gradient-to-br ${getGradientClass(pkg.tier)} backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl ${
            pkg.popular ? 'ring-2 ring-purple-500/50 shadow-purple-500/25' : ''
          }`}
        >
          {pkg.popular && (
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
              Most Popular
            </Badge>
          )}
          
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2 text-white">
              {pkg.icon}
            </div>
            <CardTitle className="text-white">{pkg.name}</CardTitle>
            <CardDescription className="text-gray-200">
              {pkg.credits.toLocaleString()} Credits
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="flex justify-center items-baseline space-x-2">
                <span className="text-3xl font-bold text-white">
                  ${pkg.priceUSDC}
                </span>
                <span className="text-gray-300">USDC</span>
              </div>
              <div className="text-gray-300 text-sm">
                or {pkg.priceS} S tokens
              </div>
            </div>

            {userCredits && userCredits[pkg.id] > 0 && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-2 text-center">
                <span className="text-green-300 text-sm">
                  Current: {userCredits[pkg.id].toLocaleString()} credits
                </span>
              </div>
            )}

            <ul className="space-y-2 text-sm text-gray-200">
              {pkg.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <div className="flex w-full bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={() => setPaymentType('s_tokens')}
                className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
                  paymentType === 's_tokens'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                S Tokens
              </button>
              <button
                onClick={() => setPaymentType('usdc')}
                className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
                  paymentType === 'usdc'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                USDC
              </button>
            </div>

            <Button
              onClick={() => handlePurchase(pkg.id)}
              disabled={!userAddress || loading || processingPackage === pkg.id}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            >
              {processingPackage === pkg.id ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                `Purchase with ${paymentType === 's_tokens' ? 'S Tokens' : 'USDC'}`
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}