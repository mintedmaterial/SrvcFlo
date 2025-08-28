// Rate limiter for OpenAI image generation API
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: Date;
  errorMessage?: string;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  skipDevWallets: boolean;
}

// Default configuration: 10 requests per hour for regular users
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
  skipDevWallets: true,
};

/**
 * Check if user has exceeded rate limit
 */
export async function checkRateLimit(
  userAddress: string, 
  isDevWallet: boolean = false,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  try {
    // Skip rate limiting for dev wallets if configured
    if (isDevWallet && config.skipDevWallets) {
      return {
        allowed: true,
        remainingRequests: config.maxRequests,
        resetTime: new Date(Date.now() + config.windowMs),
      };
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('serviceflow');
    const rateLimitCollection = db.collection('rate_limits');
    
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);
    const key = `openai_image_${userAddress.toLowerCase()}`;
    
    // Clean up old entries for this user
    await rateLimitCollection.deleteMany({
      key,
      timestamp: { $lt: windowStart }
    });
    
    // Count current requests in window
    const requestCount = await rateLimitCollection.countDocuments({
      key,
      timestamp: { $gte: windowStart }
    });
    
    const remainingRequests = Math.max(0, config.maxRequests - requestCount);
    const resetTime = new Date(Date.now() + config.windowMs);
    
    if (requestCount >= config.maxRequests) {
      await client.close();
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime,
        errorMessage: `Rate limit exceeded. Maximum ${config.maxRequests} requests per hour. Resets at ${resetTime.toISOString()}`
      };
    }
    
    // Record this request
    await rateLimitCollection.insertOne({
      key,
      userAddress: userAddress.toLowerCase(),
      timestamp: now,
      type: 'openai_image_generation'
    });
    
    await client.close();
    
    return {
      allowed: true,
      remainingRequests: remainingRequests - 1, // Subtract 1 for current request
      resetTime,
    };
    
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Allow request on error to avoid blocking legitimate users
    return {
      allowed: true,
      remainingRequests: config.maxRequests,
      resetTime: new Date(Date.now() + config.windowMs),
    };
  }
}

/**
 * Get rate limit status for a user without recording a request
 */
export async function getRateLimitStatus(
  userAddress: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('serviceflow');
    const rateLimitCollection = db.collection('rate_limits');
    
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);
    const key = `openai_image_${userAddress.toLowerCase()}`;
    
    // Count current requests in window
    const requestCount = await rateLimitCollection.countDocuments({
      key,
      timestamp: { $gte: windowStart }
    });
    
    const remainingRequests = Math.max(0, config.maxRequests - requestCount);
    const resetTime = new Date(Date.now() + config.windowMs);
    
    await client.close();
    
    return {
      allowed: requestCount < config.maxRequests,
      remainingRequests,
      resetTime,
    };
    
  } catch (error) {
    console.error('Rate limit status check error:', error);
    return {
      allowed: true,
      remainingRequests: config.maxRequests,
      resetTime: new Date(Date.now() + config.windowMs),
    };
  }
}

/**
 * Reset rate limit for a user (admin function)
 */
export async function resetRateLimit(userAddress: string): Promise<boolean> {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('serviceflow');
    const rateLimitCollection = db.collection('rate_limits');
    
    const key = `openai_image_${userAddress.toLowerCase()}`;
    
    const result = await rateLimitCollection.deleteMany({ key });
    
    await client.close();
    
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Rate limit reset error:', error);
    return false;
  }
}

/**
 * Clean up old rate limit entries (should be run periodically)
 */
export async function cleanupRateLimits(): Promise<number> {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('serviceflow');
    const rateLimitCollection = db.collection('rate_limits');
    
    const cutoff = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours ago
    
    const result = await rateLimitCollection.deleteMany({
      timestamp: { $lt: cutoff }
    });
    
    await client.close();
    
    return result.deletedCount || 0;
  } catch (error) {
    console.error('Rate limit cleanup error:', error);
    return 0;
  }
}