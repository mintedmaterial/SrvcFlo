'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useSwitchChain } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'react-hot-toast';

// Contract ABIs (simplified)
const SONIC_PAYMENT_ABI = [
  {
    name: 'payWithS',
    type: 'function',
    inputs: [
      { name: 'prompt', type: 'string' },
      { name: 'generationType', type: 'string' }
    ],
    outputs: []
  },
  {
    name: 'payWithUSDC',
    type: 'function', 
    inputs: [
      { name: 'prompt', type: 'string' },
      { name: 'generationType', type: 'string' }
    ],
    outputs: []
  },
  {
    name: 'useCredits',
    type: 'function',
    inputs: [
      { name: 'prompt', type: 'string' },
      { name: 'generationType', type: 'string' }
    ],
    outputs: []
  },
  {
    name: 'getUserStats',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'generations', type: 'uint256' },
      { name: 'credits', type: 'uint256' }
    ]
  }
];

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
];

// Contract addresses
const SONIC_PAYMENT_CONTRACT = process.env.NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT!;
const S_TOKEN_ADDRESS = '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38'; // wS
const USDC_ADDRESS = '0x29219dd400f2Bf60E5a23d13Be72B486D4038894'; // USDC
const SONIC_CHAIN_ID = 146; // Sonic mainnet

interface GenerationResult {
  success: boolean;
  imageData?: string;
  videoUrl?: string;
  error?: string;
}

interface UserStats {
  totalGenerations: number;
  freeGenerationsUsedToday: number;
  freeGenerationsRemaining: number;
  canUseFreeGeneration: boolean;
  credits: number;
}

export default function AIGeneration() {
  // Wagmi hooks
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  // Component state
  const [prompt, setPrompt] = useState('');
  const [generationType, setGenerationType] = useState<'image' | 'video'>('image');
  const [paymentType, setPaymentType] = useState<'free' | 'credits' | 's_tokens' | 'usdc'>('free');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Token balances
  const { data: sBalance } = useReadContract({
    address: S_TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address }
  });

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf', 
    args: [address as `0x${string}`],
    query: { enabled: !!address }
  });

  const { data: contractStats } = useReadContract({
    address: SONIC_PAYMENT_CONTRACT as `0x${string}`,
    abi: SONIC_PAYMENT_ABI,
    functionName: 'getUserStats',
    args: [address as `0x${string}`],
    query: { enabled: !!address }
  });

  // Contract writes using new Wagmi v2 hook
  const { writeContract } = useWriteContract();

  // Load user stats from MCP server
  useEffect(() => {
    if (address) {
      loadUserStats();
    }
  }, [address]);

  const loadUserStats = async () => {
    try {
      const response = await fetch('/api/mcp/user-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address })
      });
      
      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const switchToSonic = async () => {
    if (chainId !== SONIC_CHAIN_ID) {
      try {
        await switchChain({ chainId: SONIC_CHAIN_ID });
      } catch (error) {
        toast.error('Failed to switch to Sonic network');
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (chainId !== SONIC_CHAIN_ID) {
      await switchToSonic();
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      let txHash = '';

      // Handle payment based on type
      if (paymentType === 'free') {
        if (!userStats?.canUseFreeGeneration) {
          toast.error('No free generations remaining today');
          return;
        }
      } else if (paymentType === 'credits') {
        if (!contractStats || contractStats[1] === 0n) {
          toast.error('No credits available');
          return;
        }
        
        const tx = await writeContract({
          address: SONIC_PAYMENT_CONTRACT as `0x${string}`,
          abi: SONIC_PAYMENT_ABI,
          functionName: 'useCredits',
          args: [prompt, generationType]
        });
        txHash = tx;
        
      } else if (paymentType === 's_tokens') {
        // Check balance
        if (!sBalance || sBalance < parseEther('3')) {
          toast.error('Insufficient S token balance (need 3 S)');
          return;
        }

        // Approve spending
        await writeContract({
          address: S_TOKEN_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [SONIC_PAYMENT_CONTRACT as `0x${string}`, parseEther('3')]
        });

        // Pay with S tokens
        const tx = await writeContract({
          address: SONIC_PAYMENT_CONTRACT as `0x${string}`,
          abi: SONIC_PAYMENT_ABI,
          functionName: 'payWithS',
          args: [prompt, generationType]
        });
        txHash = tx;
        
      } else if (paymentType === 'usdc') {
        // Check balance (1 USDC = 1e6 due to 6 decimals)
        if (!usdcBalance || usdcBalance < 1000000n) {
          toast.error('Insufficient USDC balance (need 1 USDC)');
          return;
        }

        // Approve spending
        await writeContract({
          address: USDC_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [SONIC_PAYMENT_CONTRACT as `0x${string}`, 1000000n]
        });

        // Pay with USDC
        const tx = await writeContract({
          address: SONIC_PAYMENT_CONTRACT as `0x${string}`,
          abi: SONIC_PAYMENT_ABI,
          functionName: 'payWithUSDC',
          args: [prompt, generationType]
        });
        txHash = tx;
      }

      // Wait for transaction confirmation if needed
      if (txHash) {
        toast.success('Payment confirmed! Generating...');
      }

      // Call MCP server to generate content
      const generateResponse = await fetch('/api/mcp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: generationType,
          prompt,
          paymentTx: txHash,
          userAddress: address,
          paymentType,
          width: 1024,
          height: 1024,
          steps: 4
        })
      });

      const generateResult = await generateResponse.json();
      
      if (generateResult.success) {
        setResult(generateResult);
        toast.success('Generation completed!');
        
        // Reload user stats
        await loadUserStats();
      } else {
        toast.error(generateResult.error || 'Generation failed');
        setResult({ success: false, error: generateResult.error });
      }

    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Generation failed');
      setResult({ success: false, error: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const getPaymentCost = () => {
    switch (paymentType) {
      case 'free': return 'Free (limited daily)';
      case 'credits': return '1 Credit';
      case 's_tokens': return '3 S Tokens';
      case 'usdc': return '1 USDC';
      default: return '';
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl mb-4">Connect Wallet to Generate AI Content</h2>
        <p className="text-gray-600">Connect your Web3 wallet to start generating images and videos</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">AI Content Generation</h1>

      {/* User Stats */}
      {userStats && (
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Your Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Generations:</span>
              <div className="font-semibold">{userStats.totalGenerations}</div>
            </div>
            <div>
              <span className="text-gray-600">Free Remaining Today:</span>
              <div className="font-semibold">{userStats.freeGenerationsRemaining}/3</div>
            </div>
            <div>
              <span className="text-gray-600">Credits:</span>
              <div className="font-semibold">{contractStats ? contractStats[1].toString() : '0'}</div>
            </div>
            <div>
              <span className="text-gray-600">S Balance:</span>
              <div className="font-semibold">{sBalance ? formatEther(sBalance).slice(0, 6) : '0'} S</div>
            </div>
          </div>
        </div>
      )}

      {/* Network Warning */}
      {chainId !== SONIC_CHAIN_ID && (
        <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">Please switch to Sonic network to continue</p>
          <button 
            onClick={switchToSonic}
            className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Switch to Sonic
          </button>
        </div>
      )}

      {/* Generation Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Generation Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Content Type</label>
          <div className="flex gap-4">
            <button
              onClick={() => setGenerationType('image')}
              className={`px-4 py-2 rounded ${generationType === 'image' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Image
            </button>
            <button
              onClick={() => setGenerationType('video')}
              className={`px-4 py-2 rounded ${generationType === 'video' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Video (Coming Soon)
            </button>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Describe the ${generationType} you want to generate...`}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            maxLength={2048}
          />
          <div className="text-sm text-gray-500 mt-1">{prompt.length}/2048 characters</div>
        </div>

        {/* Payment Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Payment Method</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setPaymentType('free')}
              disabled={!userStats?.canUseFreeGeneration}
              className={`p-3 rounded border text-center ${paymentType === 'free'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
              } ${!userStats?.canUseFreeGeneration ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-medium">Free</div>
              <div className="text-sm text-gray-600">Daily limit</div>
            </button>
            
            <button
              onClick={() => setPaymentType('credits')}
              disabled={!contractStats || contractStats[1] === 0n}
              className={`p-3 rounded border text-center ${paymentType === 'credits'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
              } ${(!contractStats || contractStats[1] === 0n) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-medium">Credits</div>
              <div className="text-sm text-gray-600">1 Credit</div>
            </button>

            <button
              onClick={() => setPaymentType('s_tokens')}
              disabled={!sBalance || sBalance < parseEther('3')}
              className={`p-3 rounded border text-center ${paymentType === 's_tokens'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
              } ${(!sBalance || sBalance < parseEther('3')) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-medium">S Tokens</div>
              <div className="text-sm text-gray-600">3 S</div>
            </button>

            <button
              onClick={() => setPaymentType('usdc')}
              disabled={!usdcBalance || usdcBalance < 1000000n}
              className={`p-3 rounded border text-center ${paymentType === 'usdc'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
              } ${(!usdcBalance || usdcBalance < 1000000n) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-medium">USDC</div>
              <div className="text-sm text-gray-600">1 USDC</div>
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim() || (generationType === 'video' && paymentType === 'free')}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating...
            </div>
          ) : (
            `Generate ${generationType} (${getPaymentCost()})`
          )}
        </button>

        {generationType === 'video' && paymentType === 'free' && (
          <p className="text-sm text-orange-600 mt-2">Video generation requires payment</p>
        )}
      </div>

      {/* Generation Result */}
      {result && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Generation Result</h3>
          
          {result.success ? (
            <div>
              {generationType === 'image' && result.imageData && (
                <div className="text-center">
                  <img 
                    src={`data:image/png;base64,${result.imageData}`}
                    alt="Generated image"
                    className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                  />
                  <div className="mt-4 flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `data:image/png;base64,${result.imageData}`;
                        link.download = `generated-image-${Date.now()}.png`;
                        link.click();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Download Image
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`data:image/png;base64,${result.imageData}`);
                        toast.success('Image data copied to clipboard');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Copy Data URL
                    </button>
                  </div>
                </div>
              )}
              
              {generationType === 'video' && result.videoUrl && (
                <div className="text-center">
                  <video 
                    src={result.videoUrl}
                    controls
                    className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                  />
                  <div className="mt-4">
                    <a
                      href={result.videoUrl}
                      download={`generated-video-${Date.now()}.mp4`}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 inline-block"
                    >
                      Download Video
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-red-600">
              <p className="text-lg">Generation Failed</p>
              <p className="text-sm mt-2">{result.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Model Information */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Available Models</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Image Generation Models</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• FLUX.1 Schnell (Primary) - Fast, high-quality</li>
              <li>• Stable Diffusion XL Lightning - Lightning fast</li>
              <li>• DreamShaper 8 LCM - Photorealistic</li>
              <li>• Stable Diffusion v1.5 Img2Img - Image transformation</li>
              <li>• Stable Diffusion v1.5 Inpainting - Image editing</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Video Generation</h4>
            <p className="text-sm text-gray-600">
              Video generation will be available when Cloudflare AI adds video models. 
              The system will automatically use the best available models with fallback support.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">1. Choose Payment</h4>
            <p className="text-gray-600">
              Select free (daily limit), credits, S tokens, or USDC. 
              Payments are processed on Sonic blockchain.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">2. Smart Generation</h4>
            <p className="text-gray-600">
              Our system tries multiple AI models in sequence until one succeeds, 
              ensuring high success rates.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">3. Community Rewards</h4>
            <p className="text-gray-600">
              25% of payments go to BanditKidz NFT stakers, 
              supporting the community ecosystem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}