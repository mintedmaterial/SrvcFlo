import { task, metadata, logger } from "@trigger.dev/sdk";
import { z } from "zod";
import { contentQueue } from "../../lib/queues";
import { executeKnownAgent, AGNO_AGENTS } from "../../lib/agno-bridge";
import { callMCPTool, MCPTools } from "../../lib/mcp-client";

/**
 * Content Generation Task Wrapper
 * Wraps the enhanced_content_agent.py Agno agent for Trigger.dev orchestration
 */

// Input validation schema
const ContentGenerationInput = z.object({
  topic: z.string().min(1).max(500),
  contentType: z.enum(["blog", "social", "video_script", "newsletter"]),
  platforms: z.array(z.enum(["twitter", "discord", "facebook", "linkedin"])).optional(),
  tone: z.enum(["professional", "casual", "humorous", "educational"]).optional(),
  keywords: z.array(z.string()).optional(),
  mcpData: z.record(z.any()).optional(),
  useResearch: z.boolean().default(true),
});

// Output schema
const ContentGenerationOutput = z.object({
  content: z.object({
    main: z.string(),
    variants: z.record(z.string()).optional(),
  }),
  metadata: z.object({
    wordCount: z.number(),
    readingTime: z.number(),
    sentiment: z.string(),
    keywords: z.array(z.string()),
  }),
  suggestions: z.array(z.string()).optional(),
  mcpAnalysis: z.record(z.any()).optional(),
});

export const contentGenerationTask = task({
  id: "content-generation",
  queue: contentQueue,
  machine: {
    preset: "small-2x", // 1 vCPU, 1 GB RAM
  },
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: z.infer<typeof ContentGenerationInput>) => {
    // Validate input
    const input = ContentGenerationInput.parse(payload);

    logger.info("🚀 Starting content generation", {
      topic: input.topic,
      contentType: input.contentType,
      platforms: input.platforms,
    });

    // Update metadata for real-time tracking
    metadata
      .set("status", "initializing")
      .set("progress", 0)
      .set("topic", input.topic)
      .set("contentType", input.contentType);

    try {
      // Step 1: Gather MCP data if research is enabled (25% progress)
      let mcpData = input.mcpData || {};

      if (input.useResearch) {
        metadata.set("status", "researching").set("progress", 10);

        // Get trending topics from Discord if relevant
        if (input.platforms?.includes("discord")) {
          const discordTrends = await MCPTools.discord.getTrendingTopics();
          if (discordTrends.success) {
            mcpData.discordTrends = discordTrends.data;
            logger.info("📊 Discord trends collected", {
              trendCount: discordTrends.data?.trends?.length || 0,
            });
          }
        }

        // Get market sentiment if it's finance-related
        if (input.topic.toLowerCase().includes("market") ||
            input.topic.toLowerCase().includes("crypto") ||
            input.topic.toLowerCase().includes("nft")) {
          metadata.set("status", "analyzing-market").set("progress", 20);

          const sentiment = await MCPTools.coincodex.getMarketData(["S", "BTC", "ETH"]);
          if (sentiment.success) {
            mcpData.marketSentiment = sentiment.data;
            logger.info("📈 Market sentiment analyzed");
          }
        }
      }

      metadata.set("progress", 25);

      // Step 2: Execute enhanced content agent (50% progress)
      metadata.set("status", "generating-content").set("progress", 30);

      const agentPayload = {
        topic: input.topic,
        content_type: input.contentType,
        platforms: input.platforms || [],
        tone: input.tone || "professional",
        keywords: input.keywords || [],
        mcp_data: mcpData,
      };

      logger.info("🤖 Executing enhanced content agent", {
        agentPayload: JSON.stringify(agentPayload, null, 2),
      });

      const agentResult = await executeKnownAgent(
        "enhancedContentAgent",
        agentPayload,
        { timeout: 180000 } // 3 minutes timeout
      );

      if (!agentResult.success) {
        throw new Error(`Agent execution failed: ${agentResult.error}`);
      }

      metadata.set("progress", 75);

      // Step 3: Post-process and enhance content (25% progress)
      metadata.set("status", "post-processing").set("progress", 80);

      // Parse agent output
      let agentOutput = agentResult.output;
      if (typeof agentOutput === "string") {
        try {
          agentOutput = JSON.parse(agentOutput);
        } catch {
          // If not JSON, wrap in content object
          agentOutput = {
            content: { main: agentOutput },
            metadata: {
              wordCount: agentOutput.split(" ").length,
              readingTime: Math.ceil(agentOutput.split(" ").length / 200),
              sentiment: "neutral",
              keywords: input.keywords || [],
            },
          };
        }
      }

      // Add platform-specific variants if needed
      if (input.platforms && input.platforms.length > 1) {
        metadata.set("status", "creating-variants").set("progress", 90);

        const variants: Record<string, string> = {};
        const mainContent = agentOutput.content?.main || agentOutput.content;

        // Twitter variant (280 chars)
        if (input.platforms.includes("twitter")) {
          variants.twitter = mainContent.substring(0, 277) + "...";
        }

        // Discord variant (2000 chars max)
        if (input.platforms.includes("discord")) {
          variants.discord = mainContent.substring(0, 1997) + "...";
        }

        // Add variants to output
        if (!agentOutput.content) {
          agentOutput.content = { main: mainContent };
        }
        agentOutput.content.variants = variants;
      }

      // Add MCP analysis results
      if (Object.keys(mcpData).length > 0) {
        agentOutput.mcpAnalysis = mcpData;
      }

      metadata.set("status", "completed").set("progress", 100);

      logger.info("✅ Content generation completed successfully", {
        wordCount: agentOutput.metadata?.wordCount,
        platforms: input.platforms,
        executionTime: agentResult.executionTime,
      });

      // Validate and return output
      return ContentGenerationOutput.parse(agentOutput);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      metadata.set("status", "failed").set("error", errorMessage);

      logger.error("❌ Content generation failed", {
        error: errorMessage,
        topic: input.topic,
      });

      throw new Error(`Content generation failed: ${errorMessage}`);
    }
  },
});