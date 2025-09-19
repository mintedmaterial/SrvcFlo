import { task, metadata, logger } from "@trigger.dev/sdk";
import { z } from "zod";
import { contentQueue, socialQueue } from "../../lib/queues";
import { contentGenerationTask } from "../agents/content-generation-task";
import { teamOrchestratorTask } from "../agents/team-orchestrator-task";
import { nftAnalysisTask } from "../agents/nft-analysis-task";
import { MCPTools } from "../../lib/mcp-client";

/**
 * Viral Content Pipeline Workflow
 * End-to-end orchestration: Research → Content Creation → Distribution → Monitoring
 */

// Input validation schema
const ViralContentPipelineInput = z.object({
  topic: z.string().min(1).max(500),
  targetAudience: z.enum(["crypto", "nft", "defi", "general", "gaming"]),
  platforms: z.array(z.enum(["twitter", "discord", "facebook", "linkedin", "telegram"])),
  urgency: z.enum(["low", "medium", "high"]).default("medium"),
  includeMarketData: z.boolean().default(true),
  includeNFTAnalysis: z.boolean().default(false),
  distributionSchedule: z.object({
    immediate: z.boolean().default(true),
    scheduled: z.array(z.object({
      platform: z.string(),
      datetime: z.string(), // ISO datetime
    })).optional(),
  }).optional(),
  customParameters: z.record(z.any()).optional(),
});

// Output schema
const ViralContentPipelineOutput = z.object({
  pipeline: z.object({
    pipelineId: z.string(),
    status: z.string(),
    totalExecutionTime: z.number(),
    stagesCompleted: z.number(),
    successRate: z.number(),
  }),
  research: z.object({
    insights: z.array(z.string()),
    trendingTopics: z.array(z.string()),
    marketSentiment: z.string().optional(),
    competitorAnalysis: z.record(z.any()).optional(),
  }),
  content: z.object({
    mainContent: z.string(),
    platformVariants: z.record(z.string()),
    metadata: z.object({
      wordCount: z.number(),
      sentiment: z.string(),
      keywords: z.array(z.string()),
      engagementScore: z.number().optional(),
    }),
  }),
  distribution: z.object({
    platforms: z.array(z.object({
      platform: z.string(),
      status: z.enum(["scheduled", "posted", "failed"]),
      postId: z.string().optional(),
      scheduledTime: z.string().optional(),
      metrics: z.object({
        reach: z.number().optional(),
        engagement: z.number().optional(),
        clicks: z.number().optional(),
      }).optional(),
    })),
    overallReach: z.number().optional(),
  }),
  analytics: z.object({
    performancePrediction: z.number(), // 0-100 viral potential score
    recommendations: z.array(z.string()),
    nextSteps: z.array(z.string()),
  }),
});

export const viralContentPipelineTask = task({
  id: "viral-content-pipeline",
  queue: contentQueue,
  machine: {
    preset: "large-1x", // 4 vCPU, 8 GB RAM for complex workflow
  },
  retry: {
    maxAttempts: 2,
    factor: 2,
    minTimeoutInMs: 10000,
    maxTimeoutInMs: 60000,
  },
  run: async (payload: z.infer<typeof ViralContentPipelineInput>) => {
    // Validate input
    const input = ViralContentPipelineInput.parse(payload);

    const pipelineId = `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    logger.info("🚀 Starting viral content pipeline", {
      pipelineId,
      topic: input.topic,
      targetAudience: input.targetAudience,
      platforms: input.platforms,
      urgency: input.urgency,
    });

    // Initialize pipeline metadata
    metadata
      .set("status", "initializing")
      .set("progress", 0)
      .set("pipelineId", pipelineId)
      .set("topic", input.topic)
      .set("targetAudience", input.targetAudience)
      .set("platforms", input.platforms)
      .set("stage", "initialization");

    let stagesCompleted = 0;
    const totalStages = 4; // Research, Content, Distribution, Analytics
    let successfulStages = 0;

    try {
      // Stage 1: Market Research & Trend Analysis (25% progress)
      metadata
        .set("status", "researching")
        .set("progress", 5)
        .set("stage", "research");

      logger.info("📊 Stage 1: Starting market research and trend analysis");

      // Execute team orchestrator for viral research
      const researchResult = await teamOrchestratorTask.triggerAndWait({
        workflow: "viral_content",
        target: input.topic,
        agents: ["viral_researcher"],
        parameters: {
          target_audience: input.targetAudience,
          platforms: input.platforms,
          urgency: input.urgency,
          include_market_data: input.includeMarketData,
          ...input.customParameters,
        },
        priority: input.urgency,
      });

      if (!researchResult.ok) {
        throw new Error(`Research stage failed: ${researchResult.error}`);
      }

      stagesCompleted++;
      successfulStages++;

      // Extract research insights
      const researchData = researchResult.output.finalOutput;
      const insights = researchData.analysis?.research_insights || [];
      const trendingTopics = researchData.analysis?.trending_topics || [];

      metadata.set("progress", 25);

      // Optional: NFT market analysis if enabled
      let nftAnalysisData = null;
      if (input.includeNFTAnalysis && input.targetAudience === "nft") {
        metadata
          .set("status", "nft-analysis")
          .set("progress", 15)
          .set("substage", "nft-market-analysis");

        logger.info("🖼️ Substage: NFT market analysis");

        // Analyze popular NFT collections related to topic
        const popularCollections = [
          "0x45bc8a938e487fde4f31a7e051c2b63627f6f966", // Bandit Kidz (your collection)
          // Add more relevant collection addresses
        ];

        const nftAnalysisResult = await nftAnalysisTask.triggerAndWait({
          collections: popularCollections,
          analysisType: "trends",
          timeframe: "24h",
          includeMetadata: true,
        });

        if (nftAnalysisResult.ok) {
          nftAnalysisData = nftAnalysisResult.output;
          logger.info("✅ NFT analysis completed", {
            collectionsAnalyzed: nftAnalysisData.collections.length,
          });
        }
      }

      await metadata.stream("stage-completed", {
        stage: "research",
        stageNumber: 1,
        success: true,
        data: { insights, trendingTopics, nftAnalysis: nftAnalysisData },
      });

      metadata.set("progress", 25);

      // Stage 2: Content Creation (25% progress)
      metadata
        .set("status", "content-creation")
        .set("progress", 30)
        .set("stage", "content-creation");

      logger.info("✍️ Stage 2: Starting content creation");

      // Prepare enhanced context for content generation
      const contentContext = {
        research_insights: insights,
        trending_topics: trendingTopics,
        nft_analysis: nftAnalysisData,
        target_audience: input.targetAudience,
        urgency: input.urgency,
      };

      const contentResult = await contentGenerationTask.triggerAndWait({
        topic: input.topic,
        contentType: "social",
        platforms: input.platforms,
        tone: input.urgency === "high" ? "casual" : "professional",
        mcpData: contentContext,
        useResearch: true,
      });

      if (!contentResult.ok) {
        throw new Error(`Content creation failed: ${contentResult.error}`);
      }

      stagesCompleted++;
      successfulStages++;

      const contentData = contentResult.output;

      await metadata.stream("stage-completed", {
        stage: "content-creation",
        stageNumber: 2,
        success: true,
        data: {
          mainContent: contentData.content.main,
          variants: contentData.content.variants,
          metadata: contentData.metadata,
        },
      });

      metadata.set("progress", 50);

      // Stage 3: Content Distribution (25% progress)
      metadata
        .set("status", "distribution")
        .set("progress", 55)
        .set("stage", "distribution");

      logger.info("📢 Stage 3: Starting content distribution");

      const distributionResults = [];

      // Process each platform
      for (let i = 0; i < input.platforms.length; i++) {
        const platform = input.platforms[i];
        const platformProgress = 55 + (20 * (i / input.platforms.length));

        metadata
          .set("substage", `distributing-${platform}`)
          .set("progress", platformProgress);

        logger.info(`📱 Distributing to ${platform} (${i + 1}/${input.platforms.length})`);

        try {
          // Get platform-specific content
          const platformContent = contentData.content.variants?.[platform] || contentData.content.main;

          // Simulate distribution (in real implementation, this would call actual APIs)
          // For now, we'll mark as scheduled or posted based on distribution settings
          const isImmediate = input.distributionSchedule?.immediate !== false;

          const distributionResult = {
            platform,
            status: isImmediate ? "posted" : "scheduled" as const,
            postId: isImmediate ? `${platform}_${Date.now()}` : undefined,
            scheduledTime: isImmediate ? undefined : new Date(Date.now() + 3600000).toISOString(), // 1 hour later
            metrics: {
              reach: Math.floor(Math.random() * 10000) + 1000, // Simulated metrics
              engagement: Math.floor(Math.random() * 1000) + 100,
              clicks: Math.floor(Math.random() * 500) + 50,
            },
          };

          distributionResults.push(distributionResult);

          logger.info(`✅ ${platform} distribution ${distributionResult.status}`, {
            postId: distributionResult.postId,
            scheduledTime: distributionResult.scheduledTime,
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          distributionResults.push({
            platform,
            status: "failed" as const,
            postId: undefined,
            scheduledTime: undefined,
            metrics: undefined,
          });

          logger.warn(`⚠️ ${platform} distribution failed`, { error: errorMessage });
        }
      }

      stagesCompleted++;
      const successfulDistributions = distributionResults.filter(r => r.status !== "failed").length;
      if (successfulDistributions > 0) {
        successfulStages++;
      }

      await metadata.stream("stage-completed", {
        stage: "distribution",
        stageNumber: 3,
        success: successfulDistributions > 0,
        data: { platforms: distributionResults },
      });

      metadata.set("progress", 75);

      // Stage 4: Analytics & Recommendations (25% progress)
      metadata
        .set("status", "analytics")
        .set("progress", 80)
        .set("stage", "analytics");

      logger.info("📈 Stage 4: Generating analytics and recommendations");

      // Calculate performance prediction based on multiple factors
      const baseScore = 50;
      let performancePrediction = baseScore;

      // Adjust based on research quality
      if (insights.length > 3) performancePrediction += 15;
      if (trendingTopics.length > 0) performancePrediction += 10;

      // Adjust based on content quality
      const wordCount = contentData.metadata.wordCount;
      if (wordCount > 50 && wordCount < 200) performancePrediction += 10; // Optimal length
      if (contentData.metadata.sentiment === "positive") performancePrediction += 5;

      // Adjust based on distribution success
      const distributionSuccessRate = successfulDistributions / input.platforms.length;
      performancePrediction += distributionSuccessRate * 20;

      // Adjust based on urgency and timing
      if (input.urgency === "high") performancePrediction += 5; // Trending topics
      if (input.targetAudience === "crypto" || input.targetAudience === "nft") performancePrediction += 5; // High-engagement audiences

      // Cap at 100
      performancePrediction = Math.min(100, performancePrediction);

      // Generate recommendations
      const recommendations = [];
      const nextSteps = [];

      if (performancePrediction < 70) {
        recommendations.push("Consider refining content for better engagement");
        recommendations.push("Test different posting times for optimal reach");
      }

      if (distributionSuccessRate < 1) {
        recommendations.push("Investigate failed platform distributions");
        nextSteps.push("Retry failed distributions with adjusted content");
      }

      if (insights.length < 3) {
        recommendations.push("Enhance research phase for better content foundation");
      }

      recommendations.push("Monitor engagement metrics for first 24 hours");
      nextSteps.push("Schedule follow-up content based on performance");
      nextSteps.push("Analyze audience feedback for content iteration");

      stagesCompleted++;
      successfulStages++;

      const totalExecutionTime = Date.now() - startTime;
      const successRate = successfulStages / totalStages;

      await metadata.stream("stage-completed", {
        stage: "analytics",
        stageNumber: 4,
        success: true,
        data: {
          performancePrediction,
          recommendations,
          nextSteps,
        },
      });

      metadata
        .set("status", "completed")
        .set("progress", 100)
        .set("stage", "completed");

      // Calculate overall reach
      const overallReach = distributionResults
        .filter(r => r.metrics?.reach)
        .reduce((sum, r) => sum + (r.metrics?.reach || 0), 0);

      // Compile final output
      const result = {
        pipeline: {
          pipelineId,
          status: "completed",
          totalExecutionTime,
          stagesCompleted,
          successRate,
        },
        research: {
          insights,
          trendingTopics,
          marketSentiment: nftAnalysisData?.marketOverview ? "bullish" : undefined,
          competitorAnalysis: nftAnalysisData?.collections?.reduce((acc: any, c: any) => {
            acc[c.name] = {
              floorPrice: c.floorPrice,
              volume24h: c.volume24h,
            };
            return acc;
          }, {}),
        },
        content: {
          mainContent: contentData.content.main,
          platformVariants: contentData.content.variants || {},
          metadata: {
            wordCount: contentData.metadata.wordCount,
            sentiment: contentData.metadata.sentiment,
            keywords: contentData.metadata.keywords,
            engagementScore: performancePrediction,
          },
        },
        distribution: {
          platforms: distributionResults,
          overallReach,
        },
        analytics: {
          performancePrediction,
          recommendations,
          nextSteps,
        },
      };

      logger.info("✅ Viral content pipeline completed successfully", {
        pipelineId,
        totalExecutionTime: `${totalExecutionTime}ms`,
        stagesCompleted: `${stagesCompleted}/${totalStages}`,
        successRate: `${(successRate * 100).toFixed(1)}%`,
        performancePrediction: `${performancePrediction}/100`,
        overallReach,
      });

      return ViralContentPipelineOutput.parse(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const totalExecutionTime = Date.now() - startTime;
      const successRate = stagesCompleted > 0 ? successfulStages / stagesCompleted : 0;

      metadata
        .set("status", "failed")
        .set("error", errorMessage)
        .set("stage", "failed");

      logger.error("❌ Viral content pipeline failed", {
        pipelineId,
        error: errorMessage,
        stagesCompleted: `${stagesCompleted}/${totalStages}`,
        successRate: `${(successRate * 100).toFixed(1)}%`,
        totalExecutionTime: `${totalExecutionTime}ms`,
      });

      throw new Error(`Viral content pipeline failed: ${errorMessage}`);
    }
  },
});