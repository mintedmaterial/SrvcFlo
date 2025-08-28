import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Star, Image, Video, Loader2, Download, CreditCard, Wallet } from "lucide-react";

// Credit packages
const creditPackages = [
  {
    id: 'starter',
    name: "Starter Pack",
    price: 5,
    credits_fiat: 750,
    credits_crypto: 900,
    description: "Perfect for trying out AI generation",
    features: [
      "750 generation credits",
      "Image & video generation",
      "Standard processing speed",
      "Email support"
    ],
    popular: false,
    icon: Image,
  },
  {
    id: 'standard',
    name: "Standard Pack",
    price: 50,
    credits_fiat: 8000,
    credits_crypto: 9600,
    description: "Great for regular content creators",
    features: [
      "8,000 generation credits",
      "Priority processing",
      "High-quality outputs",
      "Multiple aspect ratios",
      "Priority support"
    ],
    popular: true,
    icon: Video,
  },
  {
    id: 'premium',
    name: "Premium Pack",
    price: 500,
    credits_fiat: 100000,
    credits_crypto: 120000,
    description: "For professional content creation",
    features: [
      "100,000 generation credits",
      "Fastest processing",
      "Premium quality outputs",
      "Custom aspect ratios",
      "Dedicated support",
      "API access"
    ],
    popular: false,
    icon: Star,
  }
];

// Generation costs
const generationCosts = {
  image: 60,
  video: 120
};

export default function AIGenerationPage() {
  const [userEmail, setUserEmail] = useState('');
  const [userCredits, setUserCredits] = useState(0);
  const [selectedTab, setSelectedTab] = useState('credits');
  const [generationType, setGenerationType] = useState('image');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [taskId, setTaskId] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  // Load user email from localStorage and fetch credits
  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    setUserEmail(email);
    if (email) {
      fetchUserCredits(email);
    }
  }, []);

  // Poll for task status when generating
  useEffect(() => {
    let interval;
    if (taskId && isGenerating) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/generate/status/${taskId}`);
          const data = await response.json();
          
          if (data.status === 'completed') {
            setGenerationResult(data.result);
            setIsGenerating(false);
            setTaskId('');
            // Refresh credits
            if (userEmail) fetchUserCredits(userEmail);
          } else if (data.status === 'failed') {
            alert(`Generation failed: ${data.error}`);
            setIsGenerating(false);
            setTaskId('');
            // Refresh credits (they should be refunded)
            if (userEmail) fetchUserCredits(userEmail);
          }
        } catch (error) {
          console.error('Error checking task status:', error);
        }
      }, 5000); // Check every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [taskId, isGenerating, userEmail]);

  const fetchUserCredits = async (email) => {
    try {
      const response = await fetch(`/api/credits/balance?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setUserCredits(data.credits || 0);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const handleEmailSave = () => {
    localStorage.setItem('userEmail', userEmail);
    if (userEmail) {
      fetchUserCredits(userEmail);
    }
  };

  const handlePurchaseCredits = async (packageId, useCrypto = false) => {
    if (!userEmail) {
      alert('Please enter and save your email first');
      return;
    }

    if (useCrypto) {
      // TODO: Implement crypto payment flow
      alert('Crypto payments coming soon! For now, use card payment.');
      return;
    }

    try {
      const response = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          userEmail
        }),
      });

      const data = await response.json();
      
      if (data.sessionId) {
        // Redirect to Stripe Checkout
        const stripe = window.Stripe; // Assume Stripe.js is loaded
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: data.sessionId });
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Payment processing failed. Please try again.');
    }
  };

  const handleGenerate = async () => {
    if (!userEmail) {
      alert('Please enter and save your email first');
      return;
    }

    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    const requiredCredits = generationCosts[generationType];
    if (userCredits < requiredCredits) {
      alert(`Insufficient credits. You need ${requiredCredits} credits but only have ${userCredits}.`);
      return;
    }

    setIsGenerating(true);
    setGenerationResult(null);

    try {
      const endpoint = generationType === 'image' ? '/api/generate/image' : '/api/generate/video';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          userEmail,
          model: generationType === 'image' ? model : 'veo3',
          aspectRatio: generationType === 'video' ? aspectRatio : undefined
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTaskId(data.taskId);
        // Credits will be refreshed when task completes
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Error starting generation:', error);
      alert(`Generation failed: ${error.message}`);
      setIsGenerating(false);
      // Refresh credits in case they were deducted
      if (userEmail) fetchUserCredits(userEmail);
    }
  };

  const downloadResult = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ServiceFlow AI Generation Studio
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Create stunning AI-generated images and videos with cutting-edge technology. 
            Purchase credits and start generating professional content in seconds.
          </p>
        </div>

        {/* User Info Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>
              <Button onClick={handleEmailSave} className="mt-6">
                Save Email
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-semibold text-blue-900">Available Credits</p>
                <p className="text-2xl font-bold text-blue-600">{userCredits.toLocaleString()}</p>
              </div>
              <div className="text-right text-sm text-blue-700">
                <p>Image generation: {generationCosts.image} credits</p>
                <p>Video generation: {generationCosts.video} credits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setSelectedTab('credits')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'credits'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Purchase Credits
          </button>
          <button
            onClick={() => setSelectedTab('generate')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'generate'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Generate Content
          </button>
        </div>

        {/* Credits Tab */}
        {selectedTab === 'credits' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Credit Packages</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Choose the perfect credit package for your needs. Get 20% bonus credits when paying with crypto!
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {creditPackages.map((pkg, index) => {
                const IconComponent = pkg.icon;
                return (
                  <Card
                    key={index}
                    className={`relative overflow-hidden ${
                      pkg.popular ? "border-blue-500 shadow-lg scale-105" : "border-gray-200"
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center py-2">
                        <div className="flex items-center justify-center space-x-1">
                          <Star className="h-4 w-4" />
                          <span className="text-sm font-semibold">Most Popular</span>
                        </div>
                      </div>
                    )}

                    <CardHeader className={pkg.popular ? "pt-12" : ""}>
                      <div className="flex items-center space-x-3 mb-2">
                        <IconComponent className="h-6 w-6 text-blue-600" />
                        <CardTitle className="text-xl">{pkg.name}</CardTitle>
                      </div>
                      <CardDescription>{pkg.description}</CardDescription>

                      <div className="flex items-baseline space-x-2 mt-4">
                        <span className="text-4xl font-bold text-gray-900">${pkg.price}</span>
                        <span className="text-gray-600">USD</span>
                      </div>

                      <div className="space-y-2 mt-2">
                        <Badge variant="secondary" className="w-fit">
                          {pkg.credits_fiat.toLocaleString()} credits (Card)
                        </Badge>
                        <Badge variant="outline" className="w-fit text-green-600 border-green-600">
                          {pkg.credits_crypto.toLocaleString()} credits (Crypto +20%)
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <ul className="space-y-3">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start space-x-3">
                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="space-y-2">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => handlePurchaseCredits(pkg.id, false)}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay with Card
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-green-600 text-green-600 hover:bg-green-50"
                          onClick={() => handlePurchaseCredits(pkg.id, true)}
                        >
                          <Wallet className="h-4 w-4 mr-2" />
                          Pay with Crypto (+20%)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Benefits Section */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-blue-900">Why Choose ServiceFlow AI?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Image className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">High Quality</h3>
                    <p className="text-sm text-gray-600">
                      State-of-the-art AI models including GPT-4o and Veo3 for stunning results.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Video className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Fast Processing</h3>
                    <p className="text-sm text-gray-600">
                      Quick turnaround times with priority processing for premium users.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Star className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Best Value</h3>
                    <p className="text-sm text-gray-600">
                      Competitive pricing with bonus credits for crypto payments.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Generation Tab */}
        {selectedTab === 'generate' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Content Generation</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Create amazing images and videos with AI. Simply describe what you want to see!
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Generation Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {generationType === 'image' ? (
                      <Image className="h-5 w-5" />
                    ) : (
                      <Video className="h-5 w-5" />
                    )}
                    <span>
                      {generationType === 'image' ? 'Image' : 'Video'} Generation
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Cost: {generationCosts[generationType]} credits per generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="type">Generation Type</Label>
                    <Select value={generationType} onValueChange={setGenerationType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">
                          <div className="flex items-center space-x-2">
                            <Image className="h-4 w-4" />
                            <span>Image ({generationCosts.image} credits)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="video">
                          <div className="flex items-center space-x-2">
                            <Video className="h-4 w-4" />
                            <span>Video ({generationCosts.video} credits)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {generationType === 'image' && (
                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                          <SelectItem value="dall-e-3">DALL-E 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {generationType === 'video' && (
                    <div>
                      <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select aspect ratio" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                          <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                          <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="prompt">Prompt</Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={`Describe the ${generationType} you want to generate...`}
                      className="min-h-24"
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim() || userCredits < generationCosts[generationType]}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        {generationType === 'image' ? (
                          <Image className="h-4 w-4 mr-2" />
                        ) : (
                          <Video className="h-4 w-4 mr-2" />
                        )}
                        Generate {generationType} ({generationCosts[generationType]} credits)
                      </>
                    )}
                  </Button>

                  {userCredits < generationCosts[generationType] && (
                    <p className="text-sm text-red-600 text-center">
                      Insufficient credits. You need {generationCosts[generationType]} credits but only have {userCredits}.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Generation Result */}
              <Card>
                <CardHeader>
                  <CardTitle>Generated Content</CardTitle>
                  <CardDescription>
                    Your generated content will appear here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                      <p className="text-gray-600">
                        Generating your {generationType}... This may take a few minutes.
                      </p>
                    </div>
                  ) : generationResult ? (
                    <div className="space-y-4">
                      {generationType === 'image' ? (
                        <div className="space-y-2">
                          <img
                            src={generationResult[0]}
                            alt="Generated content"
                            className="w-full rounded-lg shadow-md"
                          />
                          <Button
                            onClick={() => downloadResult(generationResult[0], 'generated-image.png')}
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Image
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <video
                            src={generationResult[0]}
                            controls
                            className="w-full rounded-lg shadow-md"
                          />
                          <Button
                            onClick={() => downloadResult(generationResult[0], 'generated-video.mp4')}
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Video
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-gray-500">
                      {generationType === 'image' ? (
                        <Image className="h-12 w-12" />
                      ) : (
                        <Video className="h-12 w-12" />
                      )}
                      <p>No content generated yet</p>
                      <p className="text-sm">
                        Enter a prompt and click generate to create your {generationType}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}