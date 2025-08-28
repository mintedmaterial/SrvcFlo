// API Routes for Hybrid Credit System
// Integrates with Cloudflare Workers and handles both credit types

import HybridGenerationService, { GenerationRequest } from './hybrid-generation-service';
import PaintSwapIntegration from './paintswap-integration';

interface ApiRequest {
  method: string;
  url: string;
  body?: any;
  headers?: Record<string, string>;
}

interface ApiResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
}

class ApiHandler {
  private generationService: typeof HybridGenerationService;

  constructor() {
    this.generationService = HybridGenerationService;
  }

  async handleRequest(request: ApiRequest): Promise<ApiResponse> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      switch (pathname) {
        case '/api/generate':
          return await this.handleGenerate(request);
        case '/api/user-credits':
          return await this.handleGetUserCredits(request);
        case '/api/purchase-credits':
          return await this.handlePurchaseCredits(request);
        case '/api/save-generation':
          return await this.handleSaveGeneration(request);
        case '/api/mint-generation-nft':
          return await this.handleMintGenerationNFT(request);
        case '/api/collection-stats':
          return await this.handleGetCollectionStats(request);
        default:
          return {
            status: 404,
            body: { error: 'Not found' }
          };
      }
    } catch (error) {
      console.error('API Error:', error);
      return {
        status: 500,
        body: { error: 'Internal server error' }
      };
    }
  }

  // Generate content (images/videos)
  private async handleGenerate(request: ApiRequest): Promise<ApiResponse> {
    if (request.method !== 'POST') {
      return { status: 405, body: { error: 'Method not allowed' } };
    }

    const generationRequest: GenerationRequest = request.body;

    // Validate request
    if (!generationRequest.prompt || !generationRequest.user) {
      return {
        status: 400,
        body: { error: 'Missing required fields' }
      };
    }

    // Check user has sufficient credits
    const userCredits = await this.generationService.getUserCredits(generationRequest.user);
    
    if (generationRequest.creditType === 'standard') {
      const requiredCredits = generationRequest.type === 'image' ? 100 : 200;
      if (userCredits.standardCredits < requiredCredits) {
        return {
          status: 400,
          body: { error: 'Insufficient standard credits' }
        };
      }
    } else if (generationRequest.creditType === 'nft') {
      if (!generationRequest.packageId) {
        return {
          status: 400,
          body: { error: 'Package ID required for NFT credits' }
        };
      }
      
      const nftCredit = userCredits.nftCredits.find(c => c.packageId === generationRequest.packageId);
      if (!nftCredit || nftCredit.balance === 0) {
        return {
          status: 400,
          body: { error: 'Insufficient NFT credits for selected package' }
        };
      }
    }

    // Generate content
    const result = await this.generationService.generateContent(generationRequest);

    return {
      status: 200,
      body: result
    };
  }

  // Get user's credit balances
  private async handleGetUserCredits(request: ApiRequest): Promise<ApiResponse> {
    if (request.method !== 'GET') {
      return { status: 405, body: { error: 'Method not allowed' } };
    }

    const url = new URL(request.url);
    const userAddress = url.searchParams.get('address');

    if (!userAddress) {
      return {
        status: 400,
        body: { error: 'User address required' }
      };
    }

    const credits = await this.generationService.getUserCredits(userAddress);

    return {
      status: 200,
      body: credits
    };
  }

  // Purchase NFT credit packages
  private async handlePurchaseCredits(request: ApiRequest): Promise<ApiResponse> {
    if (request.method !== 'POST') {
      return { status: 405, body: { error: 'Method not allowed' } };
    }

    const { userAddress, packageId, paymentToken } = request.body;

    if (!userAddress || !packageId || !paymentToken) {
      return {
        status: 400,
        body: { error: 'Missing required fields' }
      };
    }

    // This would interact with your smart contract
    // For now, return success
    // In production, call the appropriate contract function based on paymentToken
    
    try {
      // Example contract interaction (pseudo-code)
      // const contract = getContract('SrvcfloCreditsNFT');
      // const tx = await contract.purchaseCreditsWithUSDC(packageId);
      // await tx.wait();

      return {
        status: 200,
        body: { success: true, message: 'Credits purchased successfully' }
      };
    } catch (error) {
      return {
        status: 500,
        body: { error: 'Failed to purchase credits' }
      };
    }
  }

  // Save generation to user's collection
  private async handleSaveGeneration(request: ApiRequest): Promise<ApiResponse> {
    if (request.method !== 'POST') {
      return { status: 405, body: { error: 'Method not allowed' } };
    }

    const { generationId, userAddress } = request.body;

    if (!generationId || !userAddress) {
      return {
        status: 400,
        body: { error: 'Missing required fields' }
      };
    }

    const result = await this.generationService.saveGeneration(generationId, userAddress);

    return {
      status: 200,
      body: { success: true, message: result }
    };
  }

  // Mint generation as NFT (for NFT credit users)
  private async handleMintGenerationNFT(request: ApiRequest): Promise<ApiResponse> {
    if (request.method !== 'POST') {
      return { status: 405, body: { error: 'Method not allowed' } };
    }

    const { generationId, userAddress } = request.body;

    if (!generationId || !userAddress) {
      return {
        status: 400,
        body: { error: 'Missing required fields' }
      };
    }

    // Get generation details
    const generations = await this.generationService.getUserGenerations(userAddress);
    const generation = generations.find(g => g.generationId === generationId);

    if (!generation || !generation.resultUrl) {
      return {
        status: 404,
        body: { error: 'Generation not found or not completed' }
      };
    }

    const result = await this.generationService.mintGenerationNFT(generationId, generation.resultUrl);

    return {
      status: 200,
      body: { success: true, message: result }
    };
  }

  // Get collection statistics
  private async handleGetCollectionStats(request: ApiRequest): Promise<ApiResponse> {
    if (request.method !== 'GET') {
      return { status: 405, body: { error: 'Method not allowed' } };
    }

    const url = new URL(request.url);
    const collectionKey = url.searchParams.get('collection');

    if (!collectionKey) {
      return {
        status: 400,
        body: { error: 'Collection key required' }
      };
    }

    const stats = await PaintSwapIntegration.getCollectionStats(collectionKey);

    if (!stats) {
      return {
        status: 404,
        body: { error: 'Collection not found' }
      };
    }

    return {
      status: 200,
      body: stats
    };
  }
}

// Cloudflare Worker Integration
export default {
  async fetch(request: Request): Promise<Response> {
    const apiHandler = new ApiHandler();
    
    const apiRequest: ApiRequest = {
      method: request.method,
      url: request.url,
      body: request.method !== 'GET' ? await request.json() : undefined,
      headers: Object.fromEntries(request.headers.entries())
    };

    const result = await apiHandler.handleRequest(apiRequest);

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...result.headers
      }
    });
  }
};

export { ApiHandler };