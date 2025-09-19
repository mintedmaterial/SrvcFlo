import { queue } from "@trigger.dev/sdk";

/**
 * Queue configurations for ServiceFlow AI agent orchestration
 * Each queue is optimized for specific operation types and rate limits
 */

// Content generation queue - moderate concurrency for content creation
export const contentQueue = queue({
  name: "content-queue",
  concurrencyLimit: 5, // 5 simultaneous content generation tasks
});

// Social media queue - rate-limited to respect platform APIs
export const socialQueue = queue({
  name: "social-queue",
  concurrencyLimit: 3, // Conservative limit to prevent rate limiting
  // X (Twitter): 300 posts per 3 hours = 1.67 per minute
  // Discord: 50 messages per 10 seconds = 5 per second
});

// Trading and financial operations - sequential processing for safety
export const tradingQueue = queue({
  name: "trading-queue",
  concurrencyLimit: 1, // Critical financial operations run one at a time
});

// Market analysis queue - higher concurrency for data processing
export const analysisQueue = queue({
  name: "analysis-queue",
  concurrencyLimit: 10, // Can handle multiple analysis tasks simultaneously
});

// Payment processing queue - controlled concurrency for blockchain operations
export const paymentQueue = queue({
  name: "payment-queue",
  concurrencyLimit: 3, // Moderate concurrency for payment processing
});

// MCP server operations - shared queue for all MCP interactions
export const mcpQueue = queue({
  name: "mcp-queue",
  concurrencyLimit: 8, // Handle multiple MCP server requests
});

// Scheduled operations queue - for cron jobs and automated tasks
export const scheduledQueue = queue({
  name: "scheduled-queue",
  concurrencyLimit: 5, // Moderate concurrency for scheduled tasks
});

/**
 * Dynamic queue creation for user-specific or tenant-specific operations
 */
export function createUserQueue(userId: string, concurrencyLimit: number = 2) {
  return queue({
    name: `user-${userId}`,
    concurrencyLimit,
  });
}

/**
 * Dynamic queue creation for team-specific operations
 */
export function createTeamQueue(teamId: string, concurrencyLimit: number = 3) {
  return queue({
    name: `team-${teamId}`,
    concurrencyLimit,
  });
}

/**
 * Queue selection helper based on operation type
 */
export function getQueueForOperation(operationType: string) {
  const queueMap = {
    'content-generation': contentQueue,
    'social-media': socialQueue,
    'trading': tradingQueue,
    'analysis': analysisQueue,
    'payment': paymentQueue,
    'mcp': mcpQueue,
    'scheduled': scheduledQueue,
  };

  return queueMap[operationType as keyof typeof queueMap] || contentQueue;
}