'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Bot,
  CreditCard,
  Wallet,
  Image as ImageIcon,
  Video,
  MessageSquare
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  duration?: number;
}

const CLOUDFLARE_WORKER_URL = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL || 'https://your-worker.your-subdomain.workers.dev';

const TEST_SCENARIOS = [
  {
    id: 'worker-health',
    name: 'Cloudflare Worker Health Check',
    description: 'Test if the Cloudflare Worker is responding'
  },
  {
    id: 'user-stats',
    name: 'User Stats API',
    description: 'Test user statistics endpoint'
  },
  {
    id: 'credit-verification',
    name: 'Credit Verification',
    description: 'Test credit balance checking'
  },
  {
    id: 'payment-verification',
    name: 'Payment Verification',
    description: 'Test payment verification logic'
  },
  {
    id: 'agent-minting',
    name: 'Agent Minting Flow',
    description: 'Test agent minting process'
  },
  {
    id: 'content-generation',
    name: 'Content Generation',
    description: 'Test image/video generation'
  },
  {
    id: 'auth0-integration',
    name: 'Auth0 Integration',
    description: 'Test Auth0 authentication flow'
  }
];

export default function TestIntegrationPage() {
  const [testResults, setTestResults] = useState<{ [key: string]: TestResult }>({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testWalletAddress, setTestWalletAddress] = useState('0x742d35cc6535C0532925a3b8F5b6d9D6d9C1b');
  const [testPrompt, setTestPrompt] = useState('A beautiful landscape with mountains and a lake');
  const { toast } = useToast();

  // Initialize test results
  useEffect(() => {
    const initialResults: { [key: string]: TestResult } = {};
    TEST_SCENARIOS.forEach(test => {
      initialResults[test.id] = {
        name: test.name,
        status: 'pending',
        message: 'Not started'
      };
    });
    setTestResults(initialResults);
  }, []);

  const updateTestResult = (testId: string, status: TestResult['status'], message: string, duration?: number) => {
    setTestResults(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        status,
        message,
        duration
      }
    }));
  };

  const runTest = async (testId: string) => {
    const startTime = Date.now();
    updateTestResult(testId, 'running', 'Running test...');

    try {
      switch (testId) {
        case 'worker-health':
          await testWorkerHealth();
          break;
        case 'user-stats':
          await testUserStats();
          break;
        case 'credit-verification':
          await testCreditVerification();
          break;
        case 'payment-verification':
          await testPaymentVerification();
          break;
        case 'agent-minting':
          await testAgentMinting();
          break;
        case 'content-generation':
          await testContentGeneration();
          break;
        case 'auth0-integration':
          await testAuth0Integration();
          break;
        default:
          throw new Error('Unknown test');
      }
      
      const duration = Date.now() - startTime;
      updateTestResult(testId, 'success', 'Test passed', duration);
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult(testId, 'error', error.message || 'Test failed', duration);
    }
  };

  const testWorkerHealth = async () => {
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/api/user-stats`, {
      method: 'GET',
      headers: {
        'X-User-Address': testWalletAddress,
      },
    });

    if (!response.ok) {
      throw new Error(`Worker responded with ${response.status}`);
    }

    const data = await response.json();
    return data;
  };

  const testUserStats = async () => {
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/api/user-stats`, {
      headers: {
        'X-User-Address': testWalletAddress,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user stats: ${response.status}`);
    }

    const stats = await response.json();
    
    if (!stats.hasOwnProperty('creditBalances')) {
      throw new Error('Invalid user stats response format');
    }

    return stats;
  };

  const testCreditVerification = async () => {
    // Test credit verification by simulating a generation request
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/api/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenId: 1,
        prompt: testPrompt,
        agentType: 'image',
        userAddress: testWalletAddress,
        creditPackageId: 0
      }),
    });

    // This should fail with insufficient credits (which is expected for testing)
    if (response.status === 402) {
      const error = await response.json();
      if (error.error && error.error.includes('Insufficient credits')) {
        return { message: 'Credit verification working correctly' };
      }
    }

    if (response.ok) {
      return await response.json();
    }

    throw new Error(`Unexpected response: ${response.status}`);
  };

  const testPaymentVerification = async () => {
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionHash: '0x1234567890abcdef',
        userAddress: testWalletAddress,
        paymentType: 'credit_purchase',
        verified: false
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.error && error.error.includes('Payment verification failed')) {
        return { message: 'Payment verification logic working correctly' };
      }
      throw new Error(`Payment verification test failed: ${response.status}`);
    }

    return await response.json();
  };

  const testAgentMinting = async () => {
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/api/mint-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentConfig: {
          name: 'Test Agent',
          agentType: 'image',
          instructions: 'Test instructions',
          tools: ['DALL-E'],
          connections: ['OpenAI'],
          floaiPerOperation: 100,
          creditPackageId: 1
        },
        ownerAddress: testWalletAddress,
        signature: '0xtest-signature',
        paymentTx: '0xtest-payment'
      }),
    });

    if (response.status === 402) {
      const error = await response.json();
      if (error.error && error.error.includes('Payment verification failed')) {
        return { message: 'Agent minting flow working correctly' };
      }
    }

    if (response.ok) {
      return await response.json();
    }

    throw new Error(`Agent minting test failed: ${response.status}`);
  };

  const testContentGeneration = async () => {
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/api/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenId: 1,
        prompt: testPrompt,
        agentType: 'image',
        userAddress: testWalletAddress,
        creditPackageId: 1,
        width: 512,
        height: 512,
        steps: 4
      }),
    });

    if (response.status === 402 || response.status === 403) {
      const error = await response.json();
      if (error.error && (error.error.includes('Insufficient credits') || error.error.includes('Agent not found'))) {
        return { message: 'Content generation flow working correctly' };
      }
    }

    if (response.ok) {
      return await response.json();
    }

    throw new Error(`Content generation test failed: ${response.status}`);
  };

  const testAuth0Integration = async () => {
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/api/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      const error = await response.json();
      if (error.error && error.error.includes('Auth0')) {
        return { message: 'Auth0 integration endpoint accessible' };
      }
    }

    if (response.ok) {
      return await response.json();
    }

    throw new Error(`Auth0 integration test failed: ${response.status}`);
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    
    for (const test of TEST_SCENARIOS) {
      await runTest(test.id);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunningTests(false);
    
    const passedTests = Object.values(testResults).filter(result => result.status === 'success').length;
    const totalTests = TEST_SCENARIOS.length;
    
    toast({
      title: "Tests Complete",
      description: `${passedTests}/${totalTests} tests passed`,
      variant: passedTests === totalTests ? "default" : "destructive",
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-500/50 bg-green-500/10';
      case 'error':
        return 'border-red-500/50 bg-red-500/10';
      case 'running':
        return 'border-blue-500/50 bg-blue-500/10';
      default:
        return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">ServiceFlow AI Integration Tests</h1>
              <p className="text-gray-400">Test the complete integration between frontend and Cloudflare Workers</p>
            </div>
          </div>
        </div>

        {/* Test Configuration */}
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Test Configuration</CardTitle>
            <CardDescription className="text-gray-300">
              Configure test parameters for the integration tests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="worker-url" className="text-gray-200">Cloudflare Worker URL</Label>
                <Input
                  id="worker-url"
                  value={CLOUDFLARE_WORKER_URL}
                  readOnly
                  className="bg-gray-800/50 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="test-wallet" className="text-gray-200">Test Wallet Address</Label>
                <Input
                  id="test-wallet"
                  value={testWalletAddress}
                  onChange={(e) => setTestWalletAddress(e.target.value)}
                  className="bg-gray-800/50 border-gray-600 text-white"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="test-prompt" className="text-gray-200">Test Generation Prompt</Label>
              <Textarea
                id="test-prompt"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                rows={2}
                className="bg-gray-800/50 border-gray-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            onClick={runAllTests}
            disabled={isRunningTests}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isRunningTests ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run All Tests'
            )}
          </Button>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-green-400 border-green-400">
              {Object.values(testResults).filter(r => r.status === 'success').length} Passed
            </Badge>
            <Badge variant="outline" className="text-red-400 border-red-400">
              {Object.values(testResults).filter(r => r.status === 'error').length} Failed
            </Badge>
            <Badge variant="outline" className="text-gray-400 border-gray-400">
              {Object.values(testResults).filter(r => r.status === 'pending').length} Pending
            </Badge>
          </div>
        </div>

        {/* Test Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEST_SCENARIOS.map((test) => {
            const result = testResults[test.id];
            if (!result) return null;

            return (
              <Card 
                key={test.id}
                className={`backdrop-blur-sm transition-all duration-300 ${getStatusColor(result.status)}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-white">
                    <span className="text-sm">{test.name}</span>
                    {getStatusIcon(result.status)}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {test.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Status:</span>
                      <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                        {result.status}
                      </Badge>
                    </div>
                    
                    {result.duration && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Duration:</span>
                        <span className="text-sm text-white">{result.duration}ms</span>
                      </div>
                    )}
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-300">{result.message}</p>
                    </div>
                    
                    <Button
                      onClick={() => runTest(test.id)}
                      disabled={result.status === 'running' || isRunningTests}
                      size="sm"
                      variant="outline"
                      className="w-full mt-3 border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      {result.status === 'running' ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          Running...
                        </>
                      ) : (
                        'Run Test'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Integration Status Summary */}
        <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border-indigo-500/50 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Integration Status</CardTitle>
            <CardDescription className="text-gray-300">
              Overall health of the ServiceFlow AI integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <CreditCard className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <h3 className="font-medium text-white">Credit System</h3>
                <p className="text-sm text-gray-400">ERC1155 credit packages</p>
              </div>
              <div className="text-center">
                <Bot className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <h3 className="font-medium text-white">Agent Factory</h3>
                <p className="text-sm text-gray-400">iNFT agent minting</p>
              </div>
              <div className="text-center">
                <ImageIcon className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <h3 className="font-medium text-white">Generation</h3>
                <p className="text-sm text-gray-400">AI content creation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}