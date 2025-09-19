import { schemaTask, logger, idempotencyKeys, runs, tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import { executeKnownAgent, AGNO_AGENTS } from "../../lib/agno-bridge";
import { callMCPTool, MCPTools } from "../../lib/mcp-client";
import { contentQueue, socialMediaQueue, analyticsQueue, paymentQueue } from "../../lib/queues";

/**
 * Viral Content Pipeline Workflow
 * Orchestrates multi-agent content creation, distribution, and monetization
 */

// ============ SCHEMA DEFINITIONS ============

const ViralContentWorkflowInput = z.object({
  topic: z.string().min(1).max(500),
  contentType: z.enum(["article", "video_script", "social_post", "infographic"]),
  targetPlatforms: z.array(z.enum(["facebook", "twitter", "google", "discord", "linkedin"])),
  monetizationConfig: z.object({
    enableVoting: z.boolean().default(true),
    pricePerContent: z.number().default(1), // $1 USDC default
    distributionSplit: z.object({
      leaderboard: z.number().default(0.15), // 15%
      devWallet: z.number().default(0.50),    // 50%
      nftStaking: z.number().default(0.25),   // 25%
      reserve: z.number().default(0.10),      // 10% reserve
    }).optional(),
  }).optional(),
  aiParameters: z.object({
    temperature: z.number().min(0).max(2).default(0.8),
    maxTokens: z.number().default(2000),
    tone: z.enum(["professional", "casual", "humorous", "educational", "viral"]).default("viral"),
    includeHashtags: z.boolean().default(true),
    includeCallToAction: z.boolean().default(true),
  }).optional(),
  schedulingOptions: z.object({
    immediate: z.boolean().default(true),
    scheduledTime: z.string().optional(), // ISO 8601 format
    timezone: z.string().default("UTC"),
  }).optional(),
});

const ContentGenerationOutput = z.object({
  contentId: z.string(),
  mainContent: z.string(),
  variants: z.record(z.string(), z.string()),
  metadata: z.object({
    wordCount: z.number(),
    estimatedEngagement: z.number(),
    viralityScore: z.number().min(0).max(100),
    suggestedHashtags: z.array(z.string()),
    keywords: z.array(z.string()),
  }),
  generationTime: z.number(),
});

const SocialDistributionResult = z.object({
  platform: z.string(),
  postId: z.string().optional(),
  url: z.string().optional(),
  status: z.enum(["posted", "scheduled", "failed", "pending_approval"]),
  metrics: z.object({
    initialReach: z.number().optional(),
    estimatedImpressions: z.number().optional(),
  }).optional(),
  error: z.string().optional(),
});

const PerformanceMetrics = z.object({
  contentId: z.string(),
  totalReach: z.number(),
  engagementRate: z.number(),
  votes: z.object({
    upvotes: z.number(),
    downvotes: z.number(),
    qualityScore: z.number(),
  }),
  revenue: z.object({
    generated: z.number(),
    distributed: z.boolean(),
    breakdown: z.record(z.string(), z.number()),
  }),
  platformMetrics: z.array(z.object({
    platform: z.string(),
    views: z.number(),
    likes: z.number(),
    shares: z.number(),
    comments: z.number(),
  })),
});

// ============ SUBTASKS ============

/**
 * Phase 1: Content Generation using enhanced_content_agent
 */
const generateViralContent = schemaTask({
  id: "viral-content.generate",
  schema: z.object({
    topic: z.string(),
    contentType: z.string(),
    aiParameters: z.any().optional(),
    targetPlatforms: z.array(z.string()),
  }),
  queue: contentQueue,
  machine: "medium-1x", // 1 vCPU, 2GB RAM for AI generation
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 30000,
  },
  run: async ({ payload, ctx }) => {
    logger.info("Starting viral content generation", {
      topic: payload.topic,
      contentType: payload.contentType,
    });

    // Call enhanced_content_agent
    const agentPayload = {
      topic: payload.topic,
      content_type: payload.contentType,
      ai_params: payload.aiParameters || {},
      platforms: payload.targetPlatforms,
      viral_optimization: true,
      include_variants: true,
    };

    const result = await executeKnownAgent("enhancedContentAgent", agentPayload, {
      timeout: 180000, // 3 minutes
    });

    if (!result.success) {
      throw new Error(`Content generation failed: ${result.error}`);
    }

    // Process and structure the output
    const output = result.output;
    const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info("Content generated successfully", {
      contentId,
      viralityScore: output.metadata?.viralityScore,
    });

    return ContentGenerationOutput.parse({
      contentId,
      mainContent: output.content?.main || output.content,
      variants: output.content?.variants || {},
      metadata: {
        wordCount: output.metadata?.wordCount || 0,
        estimatedEngagement: output.metadata?.estimatedEngagement || 0,
        viralityScore: output.metadata?.viralityScore || 0,
        suggestedHashtags: output.metadata?.hashtags || [],
        keywords: output.metadata?.keywords || [],
      },
      generationTime: result.executionTime,
    });
  },
});

/**
 * Phase 2A: Facebook Distribution
 */
const distributeFacebook = schemaTask({
  id: "viral-content.distribute.facebook",
  schema: z.object({
    contentId: z.string(),
    content: z.string(),
    hashtags: z.array(z.string()).optional(),
    scheduledTime: z.string().optional(),
  }),
  queue: socialMediaQueue,
  machine: "small-2x",
  retry: {
    maxAttempts: 2,
    factor: 1.5,
    minTimeoutInMs: 3000,
    maxTimeoutInMs: 15000,
  },
  run: async ({ payload }) => {
    logger.info("Distributing to Facebook", { contentId: payload.contentId });

    const fbPayload = {
      content: payload.content,
      hashtags: payload.hashtags || [],
      scheduled_time: payload.scheduledTime,
      post_type: "viral_content",
    };

    const result = await executeKnownAgent("facebookAgent", fbPayload, {
      timeout: 60000,
    });

    if (!result.success) {
      return SocialDistributionResult.parse({
        platform: "facebook",
        status: "failed",
        error: result.error,
      });
    }

    return SocialDistributionResult.parse({
      platform: "facebook",
      postId: result.output?.postId,
      url: result.output?.url,
      status: "posted",
      metrics: {
        initialReach: result.output?.initialReach,
        estimatedImpressions: result.output?.estimatedImpressions,
      },
    });
  },
});

/**
 * Phase 2B: Google Distribution (YouTube/Blog)
 */
const distributeGoogle = schemaTask({
  id: "viral-content.distribute.google",
  schema: z.object({
    contentId: z.string(),
    content: z.string(),
    contentType: z.string(),
    keywords: z.array(z.string()).optional(),
    scheduledTime: z.string().optional(),
  }),
  queue: socialMediaQueue,
  machine: "small-2x",
  retry: {
    maxAttempts: 2,
    factor: 1.5,
    minTimeoutInMs: 3000,
    maxTimeoutInMs: 15000,
  },
  run: async ({ payload }) => {
    logger.info("Distributing to Google platforms", {
      contentId: payload.contentId,
      contentType: payload.contentType,
    });

    const googlePayload = {
      content: payload.content,
      content_type: payload.contentType,
      keywords: payload.keywords || [],
      scheduled_time: payload.scheduledTime,
      optimize_seo: true,
    };

    const result = await executeKnownAgent("googleAgent", googlePayload, {
      timeout: 90000,
    });

    if (!result.success) {
      return SocialDistributionResult.parse({
        platform: "google",
        status: "failed",
        error: result.error,
      });
    }

    return SocialDistributionResult.parse({
      platform: "google",
      postId: result.output?.videoId || result.output?.postId,
      url: result.output?.url,
      status: result.output?.status || "posted",
      metrics: {
        initialReach: result.output?.initialViews,
        estimatedImpressions: result.output?.estimatedImpressions,
      },
    });
  },
});

/**
 * Phase 3: Performance Tracking & Analytics
 */
const trackPerformance = schemaTask({
  id: "viral-content.track-performance",
  schema: z.object({
    contentId: z.string(),
    distributionResults: z.array(SocialDistributionResult),
    trackingDuration: z.number().default(3600000), // 1 hour default
  }),
  queue: analyticsQueue,
  machine: "small-1x",
  retry: {
    maxAttempts: 5,
    factor: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 60000,
  },
  run: async ({ payload, ctx }) => {
    logger.info("Starting performance tracking", {
      contentId: payload.contentId,
      platforms: payload.distributionResults.map(r => r.platform),
    });

    // Aggregate metrics from all platforms
    const platformMetrics = [];
    let totalReach = 0;
    let totalEngagement = 0;

    for (const distribution of payload.distributionResults) {
      if (distribution.status === "posted" && distribution.postId) {
        // Fetch real-time metrics from each platform
        const metricsPayload = {
          platform: distribution.platform,
          post_id: distribution.postId,
          content_id: payload.contentId,
        };

        const metricsResult = await executeKnownAgent("analyticsAgent", metricsPayload, {
          timeout: 30000,
        });

        if (metricsResult.success && metricsResult.output) {
          const metrics = metricsResult.output;
          platformMetrics.push({
            platform: distribution.platform,
            views: metrics.views || 0,
            likes: metrics.likes || 0,
            shares: metrics.shares || 0,
            comments: metrics.comments || 0,
          });

          totalReach += metrics.views || 0;
          totalEngagement += (metrics.likes || 0) + (metrics.shares || 0) + (metrics.comments || 0);
        }
      }
    }

    const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

    // Initialize voting data (would integrate with blockchain/database)
    const votes = {
      upvotes: 0,
      downvotes: 0,
      qualityScore: 0,
    };

    logger.info("Performance metrics collected", {
      contentId: payload.contentId,
      totalReach,
      engagementRate: `${engagementRate.toFixed(2)}%`,
    });

    return PerformanceMetrics.parse({
      contentId: payload.contentId,
      totalReach,
      engagementRate,
      votes,
      revenue: {
        generated: 0,
        distributed: false,
        breakdown: {},
      },
      platformMetrics,
    });
  },
});

/**
 * Phase 4: Voting System Integration
 */
const processVoting = schemaTask({
  id: "viral-content.process-voting",
  schema: z.object({
    contentId: z.string(),
    performanceMetrics: PerformanceMetrics,
    votingPeriod: z.number().default(86400000), // 24 hours default
  }),
  queue: analyticsQueue,
  machine: "small-1x",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 10000,
  },
  run: async ({ payload }) => {
    logger.info("Processing voting for content", {
      contentId: payload.contentId,
      currentEngagement: payload.performanceMetrics.engagementRate,
    });

    // Integrate with Supabase for vote tracking
    const votingData = await callMCPTool("supabase", "upsert", {
      table: "content_voting",
      data: {
        content_id: payload.contentId,
        engagement_rate: payload.performanceMetrics.engagementRate,
        total_reach: payload.performanceMetrics.totalReach,
        voting_start: new Date().toISOString(),
        voting_end: new Date(Date.now() + payload.votingPeriod).toISOString(),
        status: "active",
      },
    });

    if (!votingData.success) {
      logger.error("Failed to initialize voting", { error: votingData.error });
      throw new Error(`Voting initialization failed: ${votingData.error}`);
    }

    // Calculate initial quality score based on performance
    const qualityScore = Math.min(100,
      (payload.performanceMetrics.engagementRate * 10) +
      (Math.log10(payload.performanceMetrics.totalReach + 1) * 5)
    );

    logger.info("Voting initialized", {
      contentId: payload.contentId,
      qualityScore: qualityScore.toFixed(2),
      votingEndTime: new Date(Date.now() + payload.votingPeriod).toISOString(),
    });

    return {
      contentId: payload.contentId,
      votingId: votingData.data?.id,
      qualityScore,
      votingStatus: "active",
      votingEndTime: new Date(Date.now() + payload.votingPeriod).toISOString(),
    };
  },
});

/**
 * Phase 5: Payment Distribution
 */
const distributePayments = schemaTask({
  id: "viral-content.distribute-payments",
  schema: z.object({
    contentId: z.string(),
    performanceMetrics: PerformanceMetrics,
    votingResults: z.object({
      qualityScore: z.number(),
      upvotes: z.number().optional(),
      downvotes: z.number().optional(),
    }),
    paymentConfig: z.object({
      totalAmount: z.number(),
      distributionSplit: z.object({
        leaderboard: z.number(),
        devWallet: z.number(),
        nftStaking: z.number(),
        reserve: z.number(),
      }),
    }),
  }),
  queue: paymentQueue,
  machine: "medium-1x", // Higher resources for blockchain operations
  retry: {
    maxAttempts: 5,
    factor: 2,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
  },
  run: async ({ payload }) => {
    logger.info("Starting payment distribution", {
      contentId: payload.contentId,
      totalAmount: payload.paymentConfig.totalAmount,
      qualityScore: payload.votingResults.qualityScore,
    });

    // Calculate payment breakdown based on performance and voting
    const qualityMultiplier = payload.votingResults.qualityScore / 100;
    const adjustedAmount = payload.paymentConfig.totalAmount * qualityMultiplier;

    const breakdown = {
      leaderboard: adjustedAmount * payload.paymentConfig.distributionSplit.leaderboard,
      devWallet: adjustedAmount * payload.paymentConfig.distributionSplit.devWallet,
      nftStaking: adjustedAmount * payload.paymentConfig.distributionSplit.nftStaking,
      reserve: adjustedAmount * payload.paymentConfig.distributionSplit.reserve,
    };

    // Execute blockchain payment distribution via Thirdweb/smart contracts
    const paymentPayload = {
      content_id: payload.contentId,
      total_amount: adjustedAmount,
      breakdown,
      quality_score: payload.votingResults.qualityScore,
      performance_metrics: {
        reach: payload.performanceMetrics.totalReach,
        engagement: payload.performanceMetrics.engagementRate,
      },
    };

    const paymentResult = await executeKnownAgent("paymentAgent", paymentPayload, {
      timeout: 120000, // 2 minutes for blockchain operations
    });

    if (!paymentResult.success) {
      logger.error("Payment distribution failed", {
        contentId: payload.contentId,
        error: paymentResult.error,
      });
      throw new Error(`Payment distribution failed: ${paymentResult.error}`);
    }

    // Update database with payment status
    await callMCPTool("supabase", "update", {
      table: "content_payments",
      data: {
        content_id: payload.contentId,
        payment_status: "distributed",
        transaction_hash: paymentResult.output?.transactionHash,
        amount_distributed: adjustedAmount,
        breakdown: JSON.stringify(breakdown),
        distributed_at: new Date().toISOString(),
      },
      match: { content_id: payload.contentId },
    });

    logger.info("Payment distribution completed", {
      contentId: payload.contentId,
      transactionHash: paymentResult.output?.transactionHash,
      amountDistributed: adjustedAmount,
    });

    return {
      contentId: payload.contentId,
      paymentStatus: "distributed",
      transactionHash: paymentResult.output?.transactionHash,
      amountDistributed: adjustedAmount,
      breakdown,
      distributedAt: new Date().toISOString(),
    };
  },
});

// ============ MAIN WORKFLOW ORCHESTRATOR ============

export const viralContentWorkflow = schemaTask({
  id: "viral-content.workflow",
  schema: ViralContentWorkflowInput,
  queue: contentQueue,
  machine: "small-2x", // Orchestrator uses moderate resources
  retry: {
    maxAttempts: 2,
    factor: 2,
    minTimeoutInMs: 10000,
    maxTimeoutInMs: 60000,
  },
  run: async ({ payload, ctx }) => {
    logger.info("Starting Viral Content Pipeline", {
      topic: payload.topic,
      platforms: payload.targetPlatforms,
      monetizationEnabled: payload.monetizationConfig?.enableVoting || false,
    });

    // Track workflow progress
    const workflowId = `workflow_${ctx.run.id}`;
    const results = {
      workflowId,
      startTime: new Date().toISOString(),
      phases: {} as Record<string, any>,
    };

    try {
      // ========== PHASE 1: Content Generation ==========
      logger.info("Phase 1: Generating viral content");

      const contentIdempotencyKey = await idempotencyKeys.create(
        `content-gen-${payload.topic}-${Date.now()}`
      );

      const contentResult = await generateViralContent.triggerAndWait(
        {
          topic: payload.topic,
          contentType: payload.contentType,
          aiParameters: payload.aiParameters,
          targetPlatforms: payload.targetPlatforms,
        },
        {
          idempotencyKey: contentIdempotencyKey,
          tags: [`workflow:${workflowId}`, "phase:generation"],
        }
      );

      if (!contentResult.ok) {
        throw new Error(`Content generation failed: ${contentResult.error}`);
      }

      results.phases.generation = contentResult.output;
      const generatedContent = contentResult.output;

      logger.info("Content generated successfully", {
        contentId: generatedContent.contentId,
        viralityScore: generatedContent.metadata.viralityScore,
      });

      // ========== PHASE 2: Parallel Social Media Distribution ==========
      logger.info("Phase 2: Distributing to social media platforms");

      const distributionTasks = [];

      // Facebook distribution
      if (payload.targetPlatforms.includes("facebook")) {
        const fbIdempotencyKey = await idempotencyKeys.create(
          `fb-dist-${generatedContent.contentId}`
        );

        distributionTasks.push(
          distributeFacebook.trigger(
            {
              contentId: generatedContent.contentId,
              content: generatedContent.variants.facebook || generatedContent.mainContent,
              hashtags: generatedContent.metadata.suggestedHashtags,
              scheduledTime: payload.schedulingOptions?.scheduledTime,
            },
            {
              idempotencyKey: fbIdempotencyKey,
              tags: [`workflow:${workflowId}`, "phase:distribution", "platform:facebook"],
            }
          )
        );
      }

      // Google distribution
      if (payload.targetPlatforms.includes("google")) {
        const googleIdempotencyKey = await idempotencyKeys.create(
          `google-dist-${generatedContent.contentId}`
        );

        distributionTasks.push(
          distributeGoogle.trigger(
            {
              contentId: generatedContent.contentId,
              content: generatedContent.variants.google || generatedContent.mainContent,
              contentType: payload.contentType,
              keywords: generatedContent.metadata.keywords,
              scheduledTime: payload.schedulingOptions?.scheduledTime,
            },
            {
              idempotencyKey: googleIdempotencyKey,
              tags: [`workflow:${workflowId}`, "phase:distribution", "platform:google"],
            }
          )
        );
      }

      // Wait for all distribution tasks to complete
      const distributionHandles = await Promise.all(distributionTasks);
      const distributionResults = [];

      for (const handle of distributionHandles) {
        const result = await runs.retrieve(handle.id);
        if (result.status === "COMPLETED" && result.output) {
          distributionResults.push(result.output);
        } else {
          logger.warn("Distribution task did not complete successfully", {
            runId: handle.id,
            status: result.status,
          });
        }
      }

      results.phases.distribution = distributionResults;

      logger.info("Distribution completed", {
        successfulPlatforms: distributionResults.filter(r => r.status === "posted").length,
        totalPlatforms: distributionTasks.length,
      });

      // ========== PHASE 3: Performance Tracking ==========
      logger.info("Phase 3: Tracking performance metrics");

      // Wait 5 minutes before initial tracking to allow for initial engagement
      await new Promise(resolve => setTimeout(resolve, 300000));

      const trackingIdempotencyKey = await idempotencyKeys.create(
        `tracking-${generatedContent.contentId}`
      );

      const performanceResult = await trackPerformance.triggerAndWait(
        {
          contentId: generatedContent.contentId,
          distributionResults,
          trackingDuration: 3600000, // Track for 1 hour
        },
        {
          idempotencyKey: trackingIdempotencyKey,
          tags: [`workflow:${workflowId}`, "phase:tracking"],
        }
      );

      if (!performanceResult.ok) {
        logger.error("Performance tracking failed", { error: performanceResult.error });
        // Continue workflow even if tracking fails
      } else {
        results.phases.performance = performanceResult.output;
      }

      // ========== PHASE 4: Voting System ==========
      if (payload.monetizationConfig?.enableVoting && performanceResult.ok) {
        logger.info("Phase 4: Processing content voting");

        const votingIdempotencyKey = await idempotencyKeys.create(
          `voting-${generatedContent.contentId}`
        );

        const votingResult = await processVoting.triggerAndWait(
          {
            contentId: generatedContent.contentId,
            performanceMetrics: performanceResult.output,
            votingPeriod: 86400000, // 24 hours
          },
          {
            idempotencyKey: votingIdempotencyKey,
            tags: [`workflow:${workflowId}`, "phase:voting"],
          }
        );

        if (votingResult.ok) {
          results.phases.voting = votingResult.output;

          // ========== PHASE 5: Payment Distribution ==========
          logger.info("Phase 5: Distributing payments");

          const paymentIdempotencyKey = await idempotencyKeys.create(
            `payment-${generatedContent.contentId}`
          );

          const paymentResult = await distributePayments.triggerAndWait(
            {
              contentId: generatedContent.contentId,
              performanceMetrics: performanceResult.output,
              votingResults: {
                qualityScore: votingResult.output.qualityScore,
                upvotes: 0, // Would be fetched from voting system
                downvotes: 0,
              },
              paymentConfig: {
                totalAmount: payload.monetizationConfig.pricePerContent,
                distributionSplit: payload.monetizationConfig.distributionSplit || {
                  leaderboard: 0.15,
                  devWallet: 0.50,
                  nftStaking: 0.25,
                  reserve: 0.10,
                },
              },
            },
            {
              idempotencyKey: paymentIdempotencyKey,
              tags: [`workflow:${workflowId}`, "phase:payment"],
              delay: "24h", // Delay payment until after voting period
            }
          );

          if (paymentResult.ok) {
            results.phases.payment = paymentResult.output;
          } else {
            logger.error("Payment distribution failed", { error: paymentResult.error });
          }
        }
      }

      // ========== WORKFLOW COMPLETION ==========
      results.endTime = new Date().toISOString();
      results.status = "completed";

      logger.info("Viral Content Pipeline completed successfully", {
        workflowId,
        contentId: generatedContent.contentId,
        duration: `${Date.now() - new Date(results.startTime).getTime()}ms`,
        phasesCompleted: Object.keys(results.phases).length,
      });

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error("Viral Content Pipeline failed", {
        workflowId,
        error: errorMessage,
        completedPhases: Object.keys(results.phases),
      });

      results.status = "failed";
      results.error = errorMessage;
      results.endTime = new Date().toISOString();

      throw error;
    }
  },
});

// ============ MONITORING & ANALYTICS HOOKS ============

/**
 * Real-time workflow monitoring task
 */
export const monitorViralContent = schemaTask({
  id: "viral-content.monitor",
  schema: z.object({
    workflowId: z.string(),
    contentId: z.string(),
    checkInterval: z.number().default(300000), // 5 minutes
    maxChecks: z.number().default(12), // 1 hour total
  }),
  queue: analyticsQueue,
  machine: "micro",
  run: async ({ payload }) => {
    logger.info("Starting workflow monitoring", {
      workflowId: payload.workflowId,
      contentId: payload.contentId,
    });

    const metrics = [];

    for (let i = 0; i < payload.maxChecks; i++) {
      // Fetch current metrics
      const currentMetrics = await callMCPTool("supabase", "select", {
        table: "content_metrics",
        match: { content_id: payload.contentId },
      });

      if (currentMetrics.success && currentMetrics.data) {
        metrics.push({
          timestamp: new Date().toISOString(),
          data: currentMetrics.data,
        });

        logger.info(`Monitoring check ${i + 1}/${payload.maxChecks}`, {
          contentId: payload.contentId,
          currentReach: currentMetrics.data.total_reach,
        });
      }

      // Wait for next check interval
      if (i < payload.maxChecks - 1) {
        await new Promise(resolve => setTimeout(resolve, payload.checkInterval));
      }
    }

    return {
      workflowId: payload.workflowId,
      contentId: payload.contentId,
      monitoringComplete: true,
      metricsCollected: metrics.length,
      finalMetrics: metrics[metrics.length - 1],
    };
  },
});

// ============ EXPORT WORKFLOW HANDLERS ============

export default {
  viralContentWorkflow,
  generateViralContent,
  distributeFacebook,
  distributeGoogle,
  trackPerformance,
  processVoting,
  distributePayments,
  monitorViralContent,
};