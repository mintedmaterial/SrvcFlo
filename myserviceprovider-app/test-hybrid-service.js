// Test-compatible version of hybrid generation service
// Simplified JavaScript implementation for testing

class TestHybridGenerationService {
  constructor() {
    this.isTestMode = true;
    console.log('🎯 Test Hybrid Generation Service initialized');
  }

  async generateContent(request) {
    const { prompt, type, user, creditType, packageId, provider } = request;
    
    console.log(`🧪 Generating ${type} for user: ${user.slice(0, 8)}...`);
    console.log(`📝 Prompt: "${prompt}"`);
    console.log(`💳 Credit Type: ${creditType}`);
    console.log(`🔧 Provider: ${provider || 'cloudflare (default)'}`);
    
    // Provider-specific handling
    if (provider === 'groq-kimi') {
      console.log(`🤖 Using Groq Kimi K2 Instruct model`);
    } else if (provider === 'gemini') {
      console.log(`🔮 Using Gemini ${type === 'video' ? 'Veo 3.0' : 'Pro'}`);
    } else {
      console.log(`☁️ Using Cloudflare Workers AI`);
    }
    
    // Simulate collection detection for NFT credits
    let isInfluenced = false;
    let influencedCollection = '';
    let influence = null;
    
    if (creditType === 'nft') {
      const collectionKeywords = ['derp', 'kidz', 'bandit'];
      const lowerPrompt = prompt.toLowerCase();
      
      for (const keyword of collectionKeywords) {
        if (lowerPrompt.includes(keyword)) {
          isInfluenced = true;
          influencedCollection = keyword;
          influence = this.mockCollectionInfluence(keyword);
          break;
        }
      }
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Calculate credits used
    const baseCredits = type === 'image' ? 100 : 200;
    const bonusCredits = isInfluenced ? 50 : 0;
    const creditsUsed = baseCredits + bonusCredits;
    
    // Generate mock result URL
    const generationId = `test_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const extension = type === 'image' ? 'png' : 'mp4';
    const resultUrl = `https://storage.srvcflo.com/test/${generationId}.${extension}`;
    
    return {
      generationId,
      resultUrl,
      status: 'completed',
      isInfluenced,
      influencedCollection,
      influence,
      creditsUsed
    };
  }
  
  mockCollectionInfluence(keyword) {
    const influences = {
      'derp': {
        collection_address: '0x...derp_collection_address',
        style_prompt: 'cute, derpy character style with big expressive eyes',
        art_style: 'cartoon, kawaii, playful',
        color_palette: 'bright, pastel colors with emphasis on blues and greens',
        mood: 'cheerful and whimsical'
      },
      'kidz': {
        collection_address: '0x...banditkidz_collection_address',
        style_prompt: 'young bandit character style with adventurous spirit',
        art_style: 'animated, action-oriented, dynamic',
        color_palette: 'vibrant colors with red, black, and gold accents',
        mood: 'energetic and mischievous'
      },
      'bandit': {
        collection_address: '0x...banditkidz_collection_address',
        style_prompt: 'bandit-themed character with mask and adventurous gear',
        art_style: 'cartoon adventure style with detailed accessories',
        color_palette: 'dark tones with bright accent colors',
        mood: 'adventurous and bold'
      }
    };
    
    return influences[keyword] || null;
  }
}

function createTestHybridGenerationService() {
  return new TestHybridGenerationService();
}

module.exports = { 
  createTestHybridGenerationService,
  TestHybridGenerationService
};