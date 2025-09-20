import { schedules } from "@trigger.dev/sdk/v3";
import { monitorSubscriptions, generateDailyMetrics } from "./subscription-tasks";

// Schedule subscription monitoring every hour
export const hourlySubscriptionMonitoring = schedules.task({
  id: "hourly-subscription-monitoring",
  cron: "0 * * * *", // Every hour
  task: monitorSubscriptions,
  payload: {
    contractAddress: process.env.SUBSCRIPTION_CONTRACT_ADDRESS || "0x742d35Cc6635C0532925a3b8D140C1d23cC09B8E",
    rpcUrl: process.env.SONIC_RPC_URL || "https://rpc.soniclabs.com"
  }
});

// Schedule daily metrics generation at midnight UTC
export const dailyMetricsGeneration = schedules.task({
  id: "daily-metrics-generation",
  cron: "0 0 * * *", // Daily at midnight
  task: generateDailyMetrics,
  payload: {
    date: new Date().toISOString().split('T')[0],
    metrics: {
      totalActiveSubscriptions: 0,
      expiringSubscriptions: 0,
      expiredSubscriptions: 0,
      highUsageSubscriptions: 0
    }
  }
});

// Schedule weekly subscription health check
export const weeklyHealthCheck = schedules.task({
  id: "weekly-subscription-health-check",
  cron: "0 9 * * 1", // Mondays at 9 AM UTC
  task: monitorSubscriptions,
  payload: {
    contractAddress: process.env.SUBSCRIPTION_CONTRACT_ADDRESS || "0x742d35Cc6635C0532925a3b8D140C1d23cC09B8E",
    rpcUrl: process.env.SONIC_RPC_URL || "https://rpc.soniclabs.com"
  }
});

// Schedule monthly subscription analytics report
export const monthlyAnalyticsReport = schedules.task({
  id: "monthly-analytics-report",
  cron: "0 10 1 * *", // First day of every month at 10 AM UTC
  task: generateDailyMetrics,
  payload: {
    date: new Date().toISOString().split('T')[0],
    metrics: {
      totalActiveSubscriptions: 0,
      expiringSubscriptions: 0,
      expiredSubscriptions: 0,
      highUsageSubscriptions: 0
    }
  }
});