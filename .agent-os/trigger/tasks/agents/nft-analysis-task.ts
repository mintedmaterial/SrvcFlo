import { task, metadata, logger } from "@trigger.dev/sdk";
import { z } from "zod";
import { analysisQueue } from "../../lib/queues";
import { executeKnownAgent } from "../../lib/agno-bridge";
import { MCPTools } from "../../lib/mcp-client";

/**
 * NFT Market Analysis Task Wrapper
 * Wraps the nft_market_analyst_agent.py for comprehensive NFT analysis
 */

// Input validation schema
const NFTAnalysisInput = z.object({
  collections: z.array(z.string()).min(1).max(10), // Contract addresses
  analysisType: z.enum(["floor_price", "volume", "trends", "comprehensive"]),
  timeframe: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
  includeMetadata: z.boolean().default(true),
  compareToMarket: z.boolean().default(false),
});

// Output schema
const NFTAnalysisOutput = z.object({
  collections: z.array(z.object({
    contractAddress: z.string(),
    name: z.string(),
    floorPrice: z.number().optional(),
    volume24h: z.number().optional(),
    owners: z.number().optional(),
    supply: z.number().optional(),
    marketCap: z.number().optional(),
    priceChange: z.object({
      "1h": z.number().optional(),
      "24h": z.number().optional(),
      "7d": z.number().optional(),
    }).optional(),
    traits: z.array(z.object({
      name: z.string(),
      rarity: z.number(),
      floorPrice: z.number().optional(),
    })).optional(),
  })),
  marketOverview: z.object({
    totalVolume: z.number(),
    averageFloorPrice: z.number(),
    topGainer: z.string().optional(),
    topLoser: z.string().optional(),
  }),
  insights: z.array(z.string()),
  recommendations: z.array(z.string()).optional(),
});

export const nftAnalysisTask = task({
  id: "nft-market-analysis",
  queue: analysisQueue,
  machine: {
    preset: "medium-1x", // 1 vCPU, 2 GB RAM for data processing
  },
  retry: {
    maxAttempts: 2,
    factor: 1.5,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 15000,
  },
  run: async (payload: z.infer<typeof NFTAnalysisInput>) => {
    // Validate input
    const input = NFTAnalysisInput.parse(payload);

    logger.info("🖼️ Starting NFT market analysis", {
      collections: input.collections,
      analysisType: input.analysisType,
      timeframe: input.timeframe,
    });

    // Initialize metadata
    metadata
      .set("status", "initializing")
      .set("progress", 0)
      .set("collectionsCount", input.collections.length)
      .set("analysisType", input.analysisType);

    try {
      const collectionResults = [];
      let totalVolume = 0;
      let floorPrices: number[] = [];

      // Step 1: Process each collection (80% of progress)
      const progressPerCollection = 80 / input.collections.length;

      for (let i = 0; i < input.collections.length; i++) {
        const contractAddress = input.collections[i];
        const collectionProgress = i * progressPerCollection;

        metadata
          .set("status", `analyzing-collection-${i + 1}`)
          .set("progress", collectionProgress)
          .set("currentCollection", contractAddress);

        logger.info(`📊 Analyzing collection ${i + 1}/${input.collections.length}`, {
          contractAddress,
        });

        // Get collection stats from Paintswap MCP
        const collectionStats = await MCPTools.paintswap.getCollectionStats(contractAddress);

        if (!collectionStats.success) {
          logger.warn(`⚠️ Failed to get stats for ${contractAddress}`, {
            error: collectionStats.error,
          });
          continue;
        }

        // Get floor price
        const floorPriceResult = await MCPTools.paintswap.getFloorPrice(contractAddress);
        const floorPrice = floorPriceResult.success ? floorPriceResult.data?.floorPrice : null;

        if (floorPrice) {
          floorPrices.push(floorPrice);
        }

        // Process collection data
        const collectionData = {
          contractAddress,
          name: collectionStats.data?.name || `Collection ${contractAddress.substring(0, 6)}...`,
          floorPrice: floorPrice || undefined,
          volume24h: collectionStats.data?.volume24h || undefined,
          owners: collectionStats.data?.owners || undefined,
          supply: collectionStats.data?.supply || undefined,
          marketCap: floorPrice && collectionStats.data?.supply
            ? floorPrice * collectionStats.data.supply
            : undefined,
          priceChange: collectionStats.data?.priceChange || undefined,
          traits: collectionStats.data?.traits || undefined,
        };

        collectionResults.push(collectionData);

        if (collectionStats.data?.volume24h) {
          totalVolume += collectionStats.data.volume24h;
        }

        // Stream results in real-time
        await metadata.stream("collection-analysis", {
          index: i,
          collection: collectionData,
          progress: collectionProgress + progressPerCollection,
        });
      }

      metadata.set("progress", 80);

      // Step 2: Execute NFT analyst agent for deeper insights (15% progress)
      metadata.set("status", "generating-insights").set("progress", 85);

      const agentPayload = {
        collections: collectionResults,
        analysis_type: input.analysisType,
        timeframe: input.timeframe,
        include_metadata: input.includeMetadata,
      };

      const agentResult = await executeKnownAgent(
        "nftMarketAnalyst",
        agentPayload,
        { timeout: 120000 } // 2 minutes timeout
      );

      let insights: string[] = [];
      let recommendations: string[] = [];

      if (agentResult.success) {
        try {
          const agentOutput = typeof agentResult.output === "string"
            ? JSON.parse(agentResult.output)
            : agentResult.output;

          insights = agentOutput.insights || [];
          recommendations = agentOutput.recommendations || [];
        } catch (error) {
          logger.warn("⚠️ Failed to parse agent output", { error });
          insights = ["Analysis completed with basic metrics"];
        }
      } else {
        logger.warn("⚠️ Agent analysis failed", { error: agentResult.error });
        insights = ["Basic analysis completed without AI insights"];
      }

      metadata.set("progress", 95);

      // Step 3: Generate market overview (5% progress)
      metadata.set("status", "generating-overview").set("progress", 98);

      const averageFloorPrice = floorPrices.length > 0
        ? floorPrices.reduce((a, b) => a + b, 0) / floorPrices.length
        : 0;

      // Find top gainer and loser
      const collectionsWithChange = collectionResults.filter(c => c.priceChange?.["24h"]);
      const topGainer = collectionsWithChange.length > 0
        ? collectionsWithChange.reduce((max, collection) =>
            (collection.priceChange?.["24h"] || 0) > (max.priceChange?.["24h"] || 0) ? collection : max
          ).name
        : undefined;

      const topLoser = collectionsWithChange.length > 0
        ? collectionsWithChange.reduce((min, collection) =>
            (collection.priceChange?.["24h"] || 0) < (min.priceChange?.["24h"] || 0) ? collection : min
          ).name
        : undefined;

      const marketOverview = {
        totalVolume,
        averageFloorPrice,
        topGainer,
        topLoser,
      };

      metadata.set("status", "completed").set("progress", 100);

      const result = {
        collections: collectionResults,
        marketOverview,
        insights,
        recommendations,
      };

      logger.info("✅ NFT analysis completed successfully", {
        collectionsAnalyzed: collectionResults.length,
        totalVolume,
        averageFloorPrice,
        insightsGenerated: insights.length,
      });

      return NFTAnalysisOutput.parse(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      metadata.set("status", "failed").set("error", errorMessage);

      logger.error("❌ NFT analysis failed", {
        error: errorMessage,
        collections: input.collections,
      });

      throw new Error(`NFT analysis failed: ${errorMessage}`);
    }
  },
});