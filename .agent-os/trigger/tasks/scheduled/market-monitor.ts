import { schedules } from "@trigger.dev/sdk/v3";
import { z } from "zod";

// Market monitoring configuration
const MONITORING_CONFIG = {
  paintswapUrl: "https://api.paintswap.finance/v2",
  sonicRpcUrl: process.env.SONIC_RPC_URL || "https://rpc.soniclabs.com",
  coincodexApiKey: process.env.COINCODEX_API_KEY,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  reportChannels: {
    discord: true,
    database: true,
    dashboard: true,
  },
};

// Schedule market monitoring to run 3 times per day (8am, 4pm, midnight UTC)
export const marketMonitorSchedule = schedules.task({
  id: "market-monitor-schedule",
  cron: "0 0,8,16 * * *", // Run at 00:00, 08:00, and 16:00 UTC
  machine: {
    preset: "small-2x",
  },
  run: async ({ scheduledAt }, { ctx, metadata }) => {
    console.log(`Starting market monitoring at ${scheduledAt}`);
    metadata.set("scheduledAt", scheduledAt.toISOString());

    try {
      // Step 1: Fetch Sonic ecosystem data
      const sonicData = await fetchSonicEcosystemData();

      // Step 2: Analyze NFT market on Paintswap
      const nftMarketData = await analyzePaintswapMarket();

      // Step 3: Get token prices and market metrics
      const tokenMetrics = await fetchTokenMetrics();

      // Step 4: Monitor Discord sentiment
      const sentiment = await analyzeDiscordSentiment();

      // Step 5: Calculate ecosystem health score
      const healthScore = calculateEcosystemHealth({
        sonicData,
        nftMarketData,
        tokenMetrics,
        sentiment,
      });

      // Step 6: Generate comprehensive report
      const report = generateMarketReport({
        timestamp: scheduledAt,
        sonicData,
        nftMarketData,
        tokenMetrics,
        sentiment,
        healthScore,
      });

      // Step 7: Distribute report to channels
      await distributeReport(report);

      // Step 8: Store metrics for historical analysis
      await storeMetrics(report);

      return {
        success: true,
        reportId: report.id,
        healthScore,
        alertsGenerated: report.alerts.length,
        nextRun: getNextRunTime(scheduledAt),
      };
    } catch (error) {
      console.error("Market monitoring failed:", error);
      metadata.set("error", (error as Error).message);

      // Send emergency alert on failure
      await sendEmergencyAlert(error as Error, scheduledAt);
      throw error;
    }
  },
});

// Fetch Sonic blockchain ecosystem data
async function fetchSonicEcosystemData() {
  const data = {
    tvl: 0,
    volume24h: 0,
    transactions24h: 0,
    activeWallets: 0,
    gasPrice: 0,
    blockHeight: 0,
  };

  try {
    // Fetch from Sonic RPC
    const response = await fetch(MONITORING_CONFIG.sonicRpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
    });

    const result = await response.json();
    data.blockHeight = parseInt(result.result, 16);

    // Fetch gas price
    const gasResponse = await fetch(MONITORING_CONFIG.sonicRpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_gasPrice",
        params: [],
        id: 1,
      }),
    });

    const gasResult = await gasResponse.json();
    data.gasPrice = parseInt(gasResult.result, 16) / 1e9; // Convert to Gwei

    // Additional metrics would be fetched from ecosystem APIs
    // This is simplified for the example
    data.tvl = 15000000; // $15M TVL
    data.volume24h = 2500000; // $2.5M volume
    data.transactions24h = 45000;
    data.activeWallets = 12000;

  } catch (error) {
    console.error("Failed to fetch Sonic data:", error);
  }

  return data;
}

// Analyze Paintswap NFT marketplace
async function analyzePaintswapMarket() {
  const marketData = {
    collections: [],
    volume24h: 0,
    sales24h: 0,
    averagePrice: 0,
    topCollections: [],
    newListings: 0,
  };

  try {
    // Fetch Paintswap collections
    const response = await fetch(`${MONITORING_CONFIG.paintswapUrl}/collections`, {
      headers: {
        "Accept": "application/json",
      },
    });

    const collections = await response.json();

    // Process collections data
    marketData.collections = collections.slice(0, 10); // Top 10 collections
    marketData.volume24h = collections.reduce((sum: number, c: any) => sum + (c.volume24h || 0), 0);
    marketData.sales24h = collections.reduce((sum: number, c: any) => sum + (c.sales24h || 0), 0);

    if (marketData.sales24h > 0) {
      marketData.averagePrice = marketData.volume24h / marketData.sales24h;
    }

    // Get new listings count
    const listingsResponse = await fetch(`${MONITORING_CONFIG.paintswapUrl}/listings?timeframe=24h`);
    const listings = await listingsResponse.json();
    marketData.newListings = listings.length;

    marketData.topCollections = collections
      .sort((a: any, b: any) => (b.volume24h || 0) - (a.volume24h || 0))
      .slice(0, 5)
      .map((c: any) => ({
        name: c.name,
        volume: c.volume24h,
        sales: c.sales24h,
        floorPrice: c.floorPrice,
      }));

  } catch (error) {
    console.error("Failed to fetch Paintswap data:", error);
  }

  return marketData;
}

// Fetch token metrics from various sources
async function fetchTokenMetrics() {
  const metrics = {
    sonicPrice: 0,
    sonicMarketCap: 0,
    sonicVolume24h: 0,
    priceChange24h: 0,
    circulatingSupply: 0,
    correlatedTokens: [],
  };

  try {
    // Fetch from CoinCodex API if available
    if (MONITORING_CONFIG.coincodexApiKey) {
      const response = await fetch("https://api.coincodex.com/api/v1/coins/sonic", {
        headers: {
          "X-API-Key": MONITORING_CONFIG.coincodexApiKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        metrics.sonicPrice = data.price_usd;
        metrics.sonicMarketCap = data.market_cap_usd;
        metrics.sonicVolume24h = data.volume_24h;
        metrics.priceChange24h = data.price_change_24h;
        metrics.circulatingSupply = data.circulating_supply;
      }
    }

    // Fallback to hardcoded values for demo
    if (metrics.sonicPrice === 0) {
      metrics.sonicPrice = 0.75;
      metrics.sonicMarketCap = 750000000;
      metrics.sonicVolume24h = 25000000;
      metrics.priceChange24h = 3.5;
      metrics.circulatingSupply = 1000000000;
    }

    // Get correlated tokens
    metrics.correlatedTokens = [
      { symbol: "FTM", correlation: 0.85 },
      { symbol: "AVAX", correlation: 0.72 },
      { symbol: "MATIC", correlation: 0.68 },
    ];

  } catch (error) {
    console.error("Failed to fetch token metrics:", error);
  }

  return metrics;
}

// Analyze Discord sentiment (simplified)
async function analyzeDiscordSentiment() {
  return {
    overallSentiment: "bullish",
    sentimentScore: 0.72, // 0-1 scale
    activeUsers: 450,
    messagesAnalyzed: 1200,
    topTopics: [
      { topic: "staking", mentions: 145, sentiment: "positive" },
      { topic: "nft-launch", mentions: 98, sentiment: "excited" },
      { topic: "price-action", mentions: 76, sentiment: "bullish" },
    ],
    alerts: [],
  };
}

// Calculate overall ecosystem health score
function calculateEcosystemHealth(data: any) {
  let score = 0;
  let factors = [];

  // TVL factor (0-25 points)
  if (data.sonicData.tvl > 10000000) score += 25;
  else if (data.sonicData.tvl > 5000000) score += 15;
  else score += 5;

  // Volume factor (0-25 points)
  if (data.sonicData.volume24h > 5000000) score += 25;
  else if (data.sonicData.volume24h > 1000000) score += 15;
  else score += 5;

  // NFT market factor (0-25 points)
  if (data.nftMarketData.volume24h > 100000) score += 25;
  else if (data.nftMarketData.volume24h > 50000) score += 15;
  else score += 5;

  // Sentiment factor (0-25 points)
  score += Math.floor(data.sentiment.sentimentScore * 25);

  // Determine health status
  let status = "critical";
  if (score >= 80) status = "excellent";
  else if (score >= 60) status = "good";
  else if (score >= 40) status = "moderate";
  else if (score >= 20) status = "poor";

  return {
    score,
    status,
    maxScore: 100,
    factors: {
      tvl: data.sonicData.tvl,
      volume: data.sonicData.volume24h,
      nftActivity: data.nftMarketData.volume24h,
      sentiment: data.sentiment.sentimentScore,
    },
  };
}

// Generate comprehensive market report
function generateMarketReport(data: any) {
  const report = {
    id: `report-${Date.now()}`,
    timestamp: data.timestamp,
    summary: {
      healthScore: data.healthScore,
      sonicPrice: data.tokenMetrics.sonicPrice,
      priceChange24h: data.tokenMetrics.priceChange24h,
      tvl: data.sonicData.tvl,
      volume24h: data.sonicData.volume24h,
      nftVolume24h: data.nftMarketData.volume24h,
      sentiment: data.sentiment.overallSentiment,
    },
    details: {
      blockchain: data.sonicData,
      nftMarket: data.nftMarketData,
      tokens: data.tokenMetrics,
      sentiment: data.sentiment,
    },
    alerts: generateAlerts(data),
    recommendations: generateRecommendations(data),
  };

  return report;
}

// Generate alerts based on metrics
function generateAlerts(data: any): any[] {
  const alerts = [];

  // Price alerts
  if (Math.abs(data.tokenMetrics.priceChange24h) > 10) {
    alerts.push({
      type: "price",
      severity: "high",
      message: `Sonic price ${data.tokenMetrics.priceChange24h > 0 ? "surged" : "dropped"} ${Math.abs(data.tokenMetrics.priceChange24h)}% in 24h`,
    });
  }

  // Volume alerts
  if (data.sonicData.volume24h > 10000000) {
    alerts.push({
      type: "volume",
      severity: "medium",
      message: `High trading volume detected: $${(data.sonicData.volume24h / 1000000).toFixed(1)}M in 24h`,
    });
  }

  // NFT market alerts
  if (data.nftMarketData.newListings > 100) {
    alerts.push({
      type: "nft",
      severity: "low",
      message: `${data.nftMarketData.newListings} new NFT listings in the past 24h`,
    });
  }

  return alerts;
}

// Generate recommendations based on analysis
function generateRecommendations(data: any): string[] {
  const recommendations = [];

  if (data.healthScore.score > 70) {
    recommendations.push("Ecosystem health is strong - consider increasing marketing efforts");
  }

  if (data.sentiment.sentimentScore > 0.7) {
    recommendations.push("Community sentiment is positive - good time for announcements");
  }

  if (data.nftMarketData.volume24h > 75000) {
    recommendations.push("NFT market is active - promote NFT-related features");
  }

  if (data.tokenMetrics.priceChange24h > 5) {
    recommendations.push("Price momentum is positive - highlight ecosystem growth");
  }

  return recommendations;
}

// Distribute report to configured channels
async function distributeReport(report: any) {
  const promises = [];

  // Discord webhook
  if (MONITORING_CONFIG.reportChannels.discord && MONITORING_CONFIG.discordWebhookUrl) {
    promises.push(sendDiscordReport(report));
  }

  // Database storage (via Supabase)
  if (MONITORING_CONFIG.reportChannels.database) {
    promises.push(storeReportInDatabase(report));
  }

  // Dashboard update
  if (MONITORING_CONFIG.reportChannels.dashboard) {
    promises.push(updateDashboard(report));
  }

  await Promise.all(promises);
}

// Send report to Discord
async function sendDiscordReport(report: any) {
  if (!MONITORING_CONFIG.discordWebhookUrl) return;

  const embed = {
    title: "🔍 Sonic Ecosystem Report",
    color: report.summary.healthScore.score > 60 ? 0x00ff00 : 0xff0000,
    timestamp: report.timestamp,
    fields: [
      {
        name: "Health Score",
        value: `${report.summary.healthScore.score}/100 (${report.summary.healthScore.status})`,
        inline: true,
      },
      {
        name: "Sonic Price",
        value: `$${report.summary.sonicPrice.toFixed(3)} (${report.summary.priceChange24h > 0 ? "+" : ""}${report.summary.priceChange24h.toFixed(1)}%)`,
        inline: true,
      },
      {
        name: "24h Volume",
        value: `$${(report.summary.volume24h / 1000000).toFixed(1)}M`,
        inline: true,
      },
      {
        name: "NFT Volume",
        value: `$${(report.summary.nftVolume24h / 1000).toFixed(1)}K`,
        inline: true,
      },
      {
        name: "Sentiment",
        value: report.summary.sentiment,
        inline: true,
      },
      {
        name: "TVL",
        value: `$${(report.summary.tvl / 1000000).toFixed(1)}M`,
        inline: true,
      },
    ],
    footer: {
      text: "ServiceFlow AI Market Monitor",
    },
  };

  // Add alerts if any
  if (report.alerts.length > 0) {
    embed.fields.push({
      name: "⚠️ Alerts",
      value: report.alerts.map((a: any) => `• ${a.message}`).join("\n"),
      inline: false,
    });
  }

  // Add recommendations
  if (report.recommendations.length > 0) {
    embed.fields.push({
      name: "💡 Recommendations",
      value: report.recommendations.join("\n• "),
      inline: false,
    });
  }

  try {
    await fetch(MONITORING_CONFIG.discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Market Monitor",
        embeds: [embed],
      }),
    });
  } catch (error) {
    console.error("Failed to send Discord report:", error);
  }
}

// Store report in database
async function storeReportInDatabase(report: any) {
  // This would integrate with Supabase MCP
  console.log("Storing report in database:", report.id);
}

// Update dashboard with latest report
async function updateDashboard(report: any) {
  // This would update the real-time dashboard
  console.log("Updating dashboard with report:", report.id);
}

// Store metrics for historical analysis
async function storeMetrics(report: any) {
  // Store in time-series database for trend analysis
  console.log("Storing metrics for analysis:", report.id);
}

// Send emergency alert on monitoring failure
async function sendEmergencyAlert(error: Error, scheduledAt: Date) {
  console.error("EMERGENCY: Market monitoring failed at", scheduledAt, error);

  if (MONITORING_CONFIG.discordWebhookUrl) {
    try {
      await fetch(MONITORING_CONFIG.discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `🚨 **EMERGENCY ALERT** 🚨\nMarket monitoring failed at ${scheduledAt.toISOString()}\nError: ${error.message}`,
          username: "Emergency Alert",
        }),
      });
    } catch (webhookError) {
      console.error("Failed to send emergency alert:", webhookError);
    }
  }
}

// Get next scheduled run time
function getNextRunTime(currentTime: Date): Date {
  const next = new Date(currentTime);
  next.setHours(next.getHours() + 8); // Next run in 8 hours
  return next;
}