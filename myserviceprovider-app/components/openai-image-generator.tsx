'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOpenAIImageStream } from '@/hooks/useOpenAIImageStream';
import { useAccount } from 'wagmi';

const AVAILABLE_COLLECTIONS = [
  'bandit-kidz',
  'beardies', 
  'bonkers-nft',
  'derps',
  'goggles-exe',
  'lazy-bear',
  'metronix',
  'pop-skullys',
  'razors',
  'rtards',
  'whale'
];

const PROGRESS_STEPS = {
  'idle': 0,
  'initializing': 10,
  'checking_limits': 20,
  'rate_limit_ok': 25,
  'checking_credits': 30,
  'credits_deducted': 40,
  'dev_access': 40,
  'loading_collection': 50,
  'collection_loaded': 60,
  'collection_warning': 60,
  'generating': 80,
  'saving': 90,
  'completed': 100,
  'error': 0
};

export function OpenAIImageGenerator() {
  const { address } = useAccount();
  const { status, isLoading, generateImage, reset } = useOpenAIImageStream();
  
  const [prompt, setPrompt] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [imageSize, setImageSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024');
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid');

  const handleGenerate = async () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    await generateImage({
      prompt: prompt.trim(),
      collection: selectedCollection || undefined,
      userAddress: address,
      size: imageSize,
      quality,
      style,
    });
  };

  const getStatusMessage = () => {
    if (status.message) return status.message;
    
    switch (status.status) {
      case 'idle':
        return 'Ready to generate images with OpenAI';
      case 'error':
        return status.error || 'An error occurred';
      default:
        return 'Processing...';
    }
  };

  const getProgressValue = () => {
    return PROGRESS_STEPS[status.status] || 0;
  };

  const isError = status.status === 'error';
  const isCompleted = status.status === 'completed';
  const canGenerate = !isLoading && address && prompt.trim();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            OpenAI Image Generator
            <Badge variant="secondary">GPT-Image-1</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt *</Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              disabled={isLoading}
              className="min-h-[100px]"
            />
          </div>

          {/* Collection Selection */}
          <div className="space-y-2">
            <Label htmlFor="collection">Collection Inspiration (Optional)</Label>
            <Select
              value={selectedCollection}
              onValueChange={setSelectedCollection}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a collection for inspiration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {AVAILABLE_COLLECTIONS.map((collection) => (
                  <SelectItem key={collection} value={collection}>
                    {collection.charAt(0).toUpperCase() + collection.slice(1).replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generation Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Image Size</Label>
              <Select
                value={imageSize}
                onValueChange={(value: any) => setImageSize(value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                  <SelectItem value="1792x1024">Landscape (1792x1024)</SelectItem>
                  <SelectItem value="1024x1792">Portrait (1024x1792)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quality</Label>
              <Select
                value={quality}
                onValueChange={(value: any) => setQuality(value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="hd">HD (More Credits)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Style</Label>
              <Select
                value={style}
                onValueChange={(value: any) => setStyle(value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vivid">Vivid (High contrast)</SelectItem>
                  <SelectItem value="natural">Natural (More realistic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Generating...' : 'Generate Image (50 Credits)'}
          </Button>
        </CardContent>
      </Card>

      {/* Status Card */}
      {(isLoading || isCompleted || isError) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Progress Bar */}
              {isLoading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{getProgressValue()}%</span>
                  </div>
                  <Progress value={getProgressValue()} className="w-full" />
                </div>
              )}

              {/* Status Message */}
              <Alert variant={isError ? 'destructive' : 'default'}>
                <AlertDescription>{getStatusMessage()}</AlertDescription>
              </Alert>

              {/* Rate Limit Info */}
              {status.remainingRequests !== undefined && (
                <div className="text-sm text-gray-600">
                  Remaining requests: {status.remainingRequests}
                  {status.resetTime && (
                    <span className="ml-2">
                      (Resets at {new Date(status.resetTime).toLocaleTimeString()})
                    </span>
                  )}
                </div>
              )}

              {/* Collection Info */}
              {status.collection && (
                <div className="text-sm text-blue-600">
                  Using {status.collection} collection inspiration
                  {status.collectionDescription && (
                    <div className="text-gray-600 mt-1">{status.collectionDescription}</div>
                  )}
                </div>
              )}

              {/* Credits Used */}
              {status.creditsUsed !== undefined && (
                <div className="text-sm text-green-600">
                  Credits used: {status.creditsUsed}
                  {status.creditsUsed === 0 && <span className="ml-1">(Free dev access)</span>}
                </div>
              )}

              {/* Reset Button */}
              {(isCompleted || isError) && (
                <Button variant="outline" onClick={reset} className="w-full">
                  Generate Another Image
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Image */}
      {isCompleted && status.imageUrl && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Generated Image</h3>
              <div className="relative">
                <img
                  src={status.imageUrl}
                  alt={status.prompt || prompt}
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
              <div className="text-sm text-gray-600">
                <div><strong>Prompt:</strong> {status.prompt || prompt}</div>
                {status.generationId && (
                  <div><strong>Generation ID:</strong> {status.generationId}</div>
                )}
                <div><strong>Model:</strong> {status.model} by {status.provider}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Warning */}
      {!address && (
        <Alert>
          <AlertDescription>
            Please connect your wallet to use the OpenAI image generator.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}