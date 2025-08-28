// INFT Credit System Configuration for ServiceFlow AI  
// AI Image and Video Generation Package System

export interface CreditPackage {
  id: number  // Changed to number to match contract
  label: string
  name: string  // For backwards compatibility
  description: string
  priceS: number  // Price in Native S tokens (dynamic USD pricing)
  priceUSDC: number  // Price in USDC (fixed)
  creditsS: number  // Total credits in package
  creditsUSDC: number  // Same as creditsS (for compatibility)
  aiModel: string  // Available AI models for this tier
  influenceCollections: string[]  // Available collection influences
  systemPrompt: string  // AI agent system prompt
  popular?: boolean
  hasAllModels?: boolean  // True for packages $50+ (50S+)
  hasCollectionInfluence?: boolean  // True for packages $50+ (50S+)
}

export interface ModelCost {
  model: string
  type: 'image' | 'video'
  credits: number
  description: string
  quality: 'free' | 'basic' | 'premium' | 'ultra'
}

// INFT Package Definitions - AI Image/Video Generation Focus
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 1,
    label: "Starter AI Agent",
    name: 'Starter',  
    description: 'Basic AI image generation for individual creators',
    priceS: 5,  // ~$5 USD worth of S tokens (dynamic pricing)
    priceUSDC: 5,  // $5 USDC fixed
    creditsS: 750,  // 3-4 images (750÷200=3.75) or 1-2 videos (750÷500=1.5)
    creditsUSDC: 750,
    aiModel: "Cloudflare AI, Basic Models", 
    influenceCollections: ['basic'],
    systemPrompt: "You are a creative AI assistant focused on generating high-quality images for individual creators and hobbyists.",
    hasAllModels: false,
    hasCollectionInfluence: false
  },
  {
    id: 2,
    label: "Creator AI Agent",
    name: 'Creator',
    description: 'Enhanced AI generation with premium models access',
    priceS: 50,  // ~$50 USD worth of S tokens  
    priceUSDC: 50,  // $50 USDC fixed
    creditsS: 8000,  // 40 images (8000÷200=40) or 16 videos (8000÷500=16)
    creditsUSDC: 8000,
    aiModel: "OpenAI DALL-E-2, Flux Schnell, Stable Diffusion XL, Gemini Pro",
    influenceCollections: ['bandit', 'kidz'],
    systemPrompt: "You are an advanced AI assistant with access to premium models for professional content creation and multi-modal generation.",
    popular: true,
    hasAllModels: true,  // $50+ gets all models
    hasCollectionInfluence: true  // $50+ gets collection influence
  },
  {
    id: 3,
    label: "Professional AI Agent", 
    name: 'Professional',
    description: 'Professional-grade AI with full model access',
    priceS: 200,  // ~$200 USD worth of S tokens
    priceUSDC: 200,  // $200 USDC fixed
    creditsS: 50000,  // 250 images (50000÷200=250) or 100 videos (50000÷500=100)
    creditsUSDC: 50000,
    aiModel: "OpenAI DALL-E-3, Flux Dev, All Premium Models, Video Generation",
    influenceCollections: ['bandit', 'kidz', 'derp', 'sonic'],
    systemPrompt: "You are a professional AI agent with enterprise-grade capabilities for advanced content creation, business marketing, and high-volume generation.",
    hasAllModels: true,
    hasCollectionInfluence: true
  },
  {
    id: 4,
    label: "Enterprise AI Agent",
    name: 'Enterprise',
    description: 'Maximum AI capabilities for enterprise use',
    priceS: 1500,  // ~$1500 USD worth of S tokens
    priceUSDC: 1500,  // $1500 USDC fixed
    creditsS: 500000,  // 2500 images (500000÷200=2500) or 1000 videos (500000÷500=1000) 
    creditsUSDC: 500000,
    aiModel: "OpenAI GPT-5, DALL-E-3, Enterprise Models, Custom Fine-tuning, API Access",
    influenceCollections: ['bandit', 'kidz', 'derp', 'sonic', 'custom'],
    systemPrompt: "You are an enterprise-grade AI agent with unlimited capabilities, custom model access, advanced reasoning, and white-label options for large-scale operations.",
    hasAllModels: true,
    hasCollectionInfluence: true
  },
]

// INFT Model Cost Definitions - Fixed costs per generation type
export const MODEL_COSTS: ModelCost[] = [
  // Image Models - All cost 200 credits (INFT standard)
  {
    model: 'cloudflare-free',
    type: 'image',
    credits: 0,  // Still free for basic users
    description: 'Free (Basic only)',
    quality: 'free'
  },
  {
    model: 'flux-schnell',
    type: 'image', 
    credits: 200,
    description: 'Flux Schnell - Fast generation',
    quality: 'basic'
  },
  {
    model: 'dall-e-2',
    type: 'image',
    credits: 200,
    description: 'OpenAI DALL-E-2',
    quality: 'premium'
  },
  {
    model: 'dall-e-3',
    type: 'image',
    credits: 200,
    description: 'OpenAI DALL-E-3',
    quality: 'ultra'
  },
  {
    model: 'stable-diffusion-xl',
    type: 'image',
    credits: 200,
    description: 'Stable Diffusion XL',
    quality: 'premium'
  },
  {
    model: 'flux-dev',
    type: 'image',
    credits: 200,
    description: 'Flux Dev - High quality',
    quality: 'ultra'
  },
  {
    model: 'gemini-image',
    type: 'image',
    credits: 200,
    description: 'Google Gemini Pro',
    quality: 'premium'
  },
  
  // Video Models - All cost 500 credits (INFT standard)
  {
    model: 'cloudflare-video',
    type: 'video',
    credits: 500,
    description: 'Cloudflare AI Video',
    quality: 'basic'
  },
  {
    model: 'dall-e-video',
    type: 'video',
    credits: 500,
    description: 'OpenAI Video (Future)',
    quality: 'premium'
  },
  {
    model: 'gemini-video',
    type: 'video',
    credits: 500,
    description: 'Google Gemini Video',
    quality: 'ultra'
  },
  {
    model: 'flux-video',
    type: 'video',
    credits: 500,
    description: 'Flux Video Generation',
    quality: 'ultra'
  },
]

// Helper Functions
export function getCreditPackage(id: string | number): CreditPackage | undefined {
  const numId = typeof id === 'string' ? parseInt(id) : id
  return CREDIT_PACKAGES.find(pkg => pkg.id === numId)
}

export function getModelCost(model: string): ModelCost | undefined {
  return MODEL_COSTS.find(cost => cost.model === model)
}

export function calculateCreditsForGeneration(
  model: string, 
  quantity: number = 1
): number {
  const modelCost = getModelCost(model)
  return modelCost ? modelCost.credits * quantity : 0
}

// Payment splitting percentages (same as before)
export const PAYMENT_SPLITS = {
  BANDIT_KIDZ_PERCENT: 25,
  DEV_PERCENT: 50, 
  LEADERBOARD_PERCENT: 15,
  CONTRACT_PERCENT: 10,
} as const

// INFT minting costs (additional fees for creating generated content NFTs)
export const NFT_MINT_COSTS = {
  NATIVE_S_COST: BigInt(1 * 1e18), // 1 Native S for NFT minting
  USDC_COST: BigInt(50 * 1e4),     // 0.5 USDC for NFT minting (6 decimals = 1e6, so 0.5 = 5e5)
  WS_COST: BigInt(1 * 1e18),       // 1 wS for NFT minting
} as const

export default {
  CREDIT_PACKAGES,
  MODEL_COSTS,
  getCreditPackage,
  getModelCost,
  calculateCreditsForGeneration,
  PAYMENT_SPLITS,
  NFT_MINT_COSTS
}