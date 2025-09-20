import { schedules } from "@trigger.dev/sdk/v3";
import {
  sonicFinanceAnalysis,
  sonicResearchAnalysis,
  ecosystemAnalysis,
  nftMarketAnalysis,
  smartContractAudit
} from "./sonic-ecosystem-agents";

// Schedule Sonic Finance Team Agent every 3 hours
export const sonicFinanceSchedule = schedules.task({
  id: "sonic-finance-schedule",
  cron: "0 */3 * * *", // Every 3 hours
  task: sonicFinanceAnalysis,
  payload: {},
});

// Schedule Sonic Research Team Agent every 3 hours (offset by 1 hour)
export const sonicResearchSchedule = schedules.task({
  id: "sonic-research-schedule",
  cron: "0 1,4,7,10,13,16,19,22 * * *", // Every 3 hours starting at 1 AM
  task: sonicResearchAnalysis,
  payload: {},
});

// Schedule Ecosystem Analyst Agent every 3 hours (offset by 2 hours)
export const ecosystemAnalysisSchedule = schedules.task({
  id: "ecosystem-analysis-schedule",
  cron: "0 2,5,8,11,14,17,20,23 * * *", // Every 3 hours starting at 2 AM
  task: ecosystemAnalysis,
  payload: {},
});

// Schedule NFT Market Analyst Agent every 3 hours (offset by 30 minutes)
export const nftMarketSchedule = schedules.task({
  id: "nft-market-schedule",
  cron: "30 */3 * * *", // Every 3 hours at 30 minutes past the hour
  task: nftMarketAnalysis,
  payload: {},
});

// Schedule Smart Contract Auditor every 6 hours (less frequent)
export const smartContractSchedule = schedules.task({
  id: "smart-contract-schedule",
  cron: "0 */6 * * *", // Every 6 hours
  task: smartContractAudit,
  payload: {},
});

// Daily ecosystem summary at 9 AM UTC
export const dailyEcosystemSummary = schedules.task({
  id: "daily-ecosystem-summary",
  cron: "0 9 * * *", // Daily at 9 AM UTC
  task: ecosystemAnalysis,
  payload: {
    summaryMode: true,
    includeWeeklyTrends: true
  },
});

// Weekly comprehensive report on Sundays at 8 AM UTC
export const weeklyComprehensiveReport = schedules.task({
  id: "weekly-comprehensive-report",
  cron: "0 8 * * 0", // Sundays at 8 AM UTC
  task: sonicFinanceAnalysis,
  payload: {
    weeklyMode: true,
    includeAllAgentData: true,
    generatePredictions: true
  },
});

/*
Schedule Overview:
- 00:00 - Sonic Finance Analysis
- 01:00 - Sonic Research Analysis
- 02:00 - Ecosystem Analysis
- 00:30 - NFT Market Analysis

- 03:00 - Sonic Finance Analysis
- 04:00 - Sonic Research Analysis
- 05:00 - Ecosystem Analysis
- 03:30 - NFT Market Analysis

- 06:00 - Sonic Finance Analysis + Smart Contract Audit
- 07:00 - Sonic Research Analysis
- 08:00 - Ecosystem Analysis
- 06:30 - NFT Market Analysis

- 09:00 - Sonic Finance Analysis + Daily Summary
- 10:00 - Sonic Research Analysis
- 11:00 - Ecosystem Analysis
- 09:30 - NFT Market Analysis

- 12:00 - Sonic Finance Analysis + Smart Contract Audit
- 13:00 - Sonic Research Analysis
- 14:00 - Ecosystem Analysis
- 12:30 - NFT Market Analysis

...and so on throughout the day

This ensures:
1. Continuous monitoring with agents running every 3 hours
2. Staggered execution to avoid resource conflicts
3. Smart contract audits every 6 hours for thorough security
4. Daily summaries for comprehensive oversight
5. Weekly reports for trend analysis
*/