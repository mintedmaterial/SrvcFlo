/**
 * ServiceFlow AI Pricing Client
 * Easy-to-use frontend utility for consuming pricing APIs
 */

export class PricingClient {
  constructor(baseUrl = '/api/price', network = 'testnet') {
    this.baseUrl = baseUrl;
    this.network = network;
    this.cache = new Map();
    this.cacheTTL = 30000; // 30 seconds
  }

  /**
   * Get current token price with user-friendly formatting
   * @param {string} token - Token symbol (S, wS, USDC)
   * @param {number} amount - Amount of tokens
   * @returns {Promise<Object>} Price data with display formatting
   */
  async getTokenPrice(token = 'wS', amount = 1) {
    const cacheKey = `quote_${this.network}_${token}_${amount}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/quote?network=${this.network}&token=${token}&amount=${amount}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Pricing API Error:', error);
      throw new Error(`Failed to fetch ${token} price: ${error.message}`);
    }
  }

  /**
   * Calculate tokens needed for target USD amount
   * @param {string} token - Token symbol (S, wS, USDC)
   * @param {number} targetUSD - Target USD amount
   * @returns {Promise<Object>} Calculation with display formatting
   */
  async calculateTokensForUSD(token = 'wS', targetUSD = 1) {
    try {
      const response = await fetch(
        `${this.baseUrl}/calculate?network=${this.network}&token=${token}&targetUSD=${targetUSD}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message);
      }

      return data;
    } catch (error) {
      console.error('Pricing Calculation Error:', error);
      throw new Error(`Failed to calculate ${token} amount: ${error.message}`);
    }
  }

  /**
   * Get pricing for both image and video generation services
   * @param {number} imagePrice - Image generation price in USD (default: 1)
   * @param {number} videoPrice - Video generation price in USD (default: 2)
   * @returns {Promise<Object>} Complete pricing structure for both services
   */
  async getServicePricing(imagePrice = 1, videoPrice = 2) {
    try {
      const response = await fetch(
        `${this.baseUrl}/swap-amount?network=${this.network}&imagePrice=${imagePrice}&videoPrice=${videoPrice}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message);
      }

      return data;
    } catch (error) {
      console.error('Service Pricing Error:', error);
      throw new Error(`Failed to fetch service pricing: ${error.message}`);
    }
  }

  /**
   * Get formatted pricing for display in UI components
   * @param {string} service - Service type ('image' or 'video')
   * @returns {Promise<Array>} Array of payment options with formatting
   */
  async getPaymentOptions(service = 'image') {
    const pricing = await this.getServicePricing();
    const serviceData = pricing.pricing[service];
    
    if (!serviceData) {
      throw new Error(`Service '${service}' not found`);
    }

    return serviceData.options.map(option => ({
      id: `${service}_${option.token}`,
      token: option.token,
      tokenName: option.tokenName,
      displayName: option.tokenName,
      amount: option.amount,
      amountFormatted: option.amountFormatted,
      amountDecimals: option.amountDecimals,
      pricePerToken: option.pricePerToken,
      summary: option.summary,
      usdValue: serviceData.targetFormatted,
      recommended: option.token === 'wS' // Recommend wrapped tokens for better UX
    }));
  }

  /**
   * Switch network (mainnet/testnet)
   * @param {string} network - Network to switch to
   */
  setNetwork(network) {
    this.network = network;
    this.cache.clear(); // Clear cache when switching networks
  }

  /**
   * Get current network display name
   * @returns {string} Human-readable network name
   */
  getNetworkDisplay() {
    return this.network === 'mainnet' ? 'Sonic Mainnet' : 'Sonic Testnet';
  }

  /**
   * Clear pricing cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance for easy use
export const pricingClient = new PricingClient();

// React hook for easy integration
export function usePricing(network = 'testnet') {
  const client = new PricingClient('/api/price', network);
  
  return {
    getTokenPrice: client.getTokenPrice.bind(client),
    calculateTokensForUSD: client.calculateTokensForUSD.bind(client),
    getServicePricing: client.getServicePricing.bind(client),
    getPaymentOptions: client.getPaymentOptions.bind(client),
    setNetwork: client.setNetwork.bind(client),
    getNetworkDisplay: client.getNetworkDisplay.bind(client),
    clearCache: client.clearCache.bind(client)
  };
}