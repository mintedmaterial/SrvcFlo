import { task, metadata, logger } from "@trigger.dev/sdk";
import { z } from "zod";
import { contentQueue } from "../../lib/queues";
import { executeKnownAgent } from "../../lib/agno-bridge";
import { MCPTools } from "../../lib/mcp-client";

/**
 * Team Orchestrator Task Wrapper
 * Wraps the srvcflo_team_agent.py for coordinating multiple specialized agents
 */

// Input validation schema
const TeamOrchestrationInput = z.object({
  workflow: z.enum(["viral_content", "market_research", "ecosystem_analysis", "custom"]),
  target: z.string().min(1), // Topic, market, or custom target
  agents: z.array(z.enum([
    "viral_researcher",
    "content_writer",
    "social_specialist",
    "market_analyst",
    "sentiment_analyzer"
  ])).optional(),
  parameters: z.record(z.any()).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  includeDistribution: z.boolean().default(false),
});

// Output schema
const TeamOrchestrationOutput = z.object({
  workflow: z.string(),
  results: z.record(z.any()),
  coordination: z.object({
    agentsUsed: z.array(z.string()),
    executionOrder: z.array(z.string()),
    totalExecutionTime: z.number(),
    successRate: z.number(),
  }),
  finalOutput: z.object({
    content: z.string().optional(),
    analysis: z.record(z.any()).optional(),
    recommendations: z.array(z.string()).optional(),
  }),
  metadata: z.object({
    workflowType: z.string(),
    timestamp: z.string(),
    quality_score: z.number().optional(),
  }),
});

export const teamOrchestratorTask = task({
  id: "team-orchestrator",
  queue: contentQueue,
  machine: {
    preset: "medium-2x", // 2 vCPU, 4 GB RAM for coordination
  },
  retry: {
    maxAttempts: 2,
    factor: 2,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: z.infer<typeof TeamOrchestrationInput>) => {
    // Validate input
    const input = TeamOrchestrationInput.parse(payload);

    logger.info("👥 Starting team orchestration", {
      workflow: input.workflow,
      target: input.target,
      agents: input.agents,
      priority: input.priority,
    });

    // Initialize metadata
    metadata
      .set("status", "initializing")
      .set("progress", 0)
      .set("workflow", input.workflow)
      .set("target", input.target)
      .set("priority", input.priority);

    const startTime = Date.now();
    const results: Record<string, any> = {};
    const executionOrder: string[] = [];
    let successfulExecutions = 0;
    let totalExecutions = 0;

    try {
      // Step 1: Determine agent execution plan based on workflow (10% progress)
      metadata.set("status", "planning").set("progress", 5);

      let agentPlan: string[] = [];
      let workflowParams = input.parameters || {};

      switch (input.workflow) {
        case "viral_content":
          agentPlan = ["viral_researcher", "content_writer", "social_specialist"];
          workflowParams.content_type = workflowParams.content_type || "social";
          break;

        case "market_research":
          agentPlan = ["market_analyst", "sentiment_analyzer"];
          workflowParams.include_sentiment = true;
          break;

        case "ecosystem_analysis":
          agentPlan = ["market_analyst", "sentiment_analyzer", "viral_researcher"];
          workflowParams.comprehensive = true;
          break;

        case "custom":
          agentPlan = input.agents || ["viral_researcher"];
          break;
      }

      // Override with user-specified agents if provided
      if (input.agents && input.agents.length > 0) {
        agentPlan = input.agents;
      }

      metadata.set("agentPlan", agentPlan).set("progress", 10);

      logger.info("📋 Execution plan created", {
        workflow: input.workflow,
        agentPlan,
        totalAgents: agentPlan.length,
      });

      // Step 2: Gather initial context data (15% progress)
      metadata.set("status", "gathering-context").set("progress", 15);

      let contextData: Record<string, any> = {};

      // Get trending topics if relevant
      if (agentPlan.includes("viral_researcher") || agentPlan.includes("social_specialist")) {
        const trends = await MCPTools.discord.getTrendingTopics();
        if (trends.success) {
          contextData.trendingTopics = trends.data;
        }
      }

      // Get market data if relevant
      if (agentPlan.includes("market_analyst")) {
        const marketData = await MCPTools.coincodex.getMarketData(["S", "BTC", "ETH"]);
        if (marketData.success) {
          contextData.marketData = marketData.data;
        }
      }

      metadata.set("progress", 20);

      // Step 3: Execute agents in sequence (60% progress)
      const progressPerAgent = 60 / agentPlan.length;

      for (let i = 0; i < agentPlan.length; i++) {
        const agentType = agentPlan[i];
        const currentProgress = 20 + (i * progressPerAgent);

        metadata
          .set("status", `executing-${agentType}`)
          .set("progress", currentProgress)
          .set("currentAgent", agentType);

        executionOrder.push(agentType);
        totalExecutions++;

        logger.info(`🤖 Executing agent ${i + 1}/${agentPlan.length}: ${agentType}`, {
          target: input.target,
          contextKeys: Object.keys(contextData),
        });

        try {
          // Prepare agent-specific payload
          const agentPayload = {
            target: input.target,
            agent_type: agentType,
            workflow: input.workflow,
            context_data: contextData,
            previous_results: results,
            parameters: workflowParams,
          };

          // Execute the SrvcFlo team agent with specific agent type
          const agentResult = await executeKnownAgent(
            "srvcfloTeamAgent",
            agentPayload,
            {
              timeout: 240000, // 4 minutes per agent
              args: ["--agent", agentType, "--workflow", input.workflow]
            }
          );

          if (agentResult.success) {
            successfulExecutions++;

            // Parse result
            let agentOutput = agentResult.output;
            if (typeof agentOutput === "string") {
              try {
                agentOutput = JSON.parse(agentOutput);
              } catch {
                agentOutput = { output: agentOutput };
              }
            }

            results[agentType] = {
              success: true,
              output: agentOutput,
              executionTime: agentResult.executionTime,
              timestamp: new Date().toISOString(),
            };

            // Update context with new data for next agents
            if (agentOutput.context_updates) {
              contextData = { ...contextData, ...agentOutput.context_updates };
            }

            logger.info(`✅ Agent ${agentType} completed successfully`, {
              executionTime: agentResult.executionTime,
              outputKeys: Object.keys(agentOutput),
            });

          } else {
            results[agentType] = {
              success: false,
              error: agentResult.error,
              executionTime: agentResult.executionTime,
              timestamp: new Date().toISOString(),
            };

            logger.warn(`⚠️ Agent ${agentType} failed`, {
              error: agentResult.error,
            });
          }

          // Stream progress update
          await metadata.stream("agent-completed", {
            agent: agentType,
            index: i,
            success: agentResult.success,
            progress: currentProgress + progressPerAgent,
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          results[agentType] = {
            success: false,
            error: errorMessage,
            executionTime: 0,
            timestamp: new Date().toISOString(),
          };

          logger.error(`❌ Agent ${agentType} execution failed`, {
            error: errorMessage,
          });
        }
      }

      metadata.set("progress", 80);

      // Step 4: Synthesize final output (15% progress)
      metadata.set("status", "synthesizing").set("progress", 85);

      const finalOutput: any = {
        content: "",
        analysis: {},
        recommendations: [],
      };

      // Aggregate results based on workflow type
      if (input.workflow === "viral_content") {
        // Combine research + content + social optimization
        const research = results.viral_researcher?.output;
        const content = results.content_writer?.output;
        const social = results.social_specialist?.output;

        finalOutput.content = content?.content || content?.output || "";
        finalOutput.analysis = {
          research_insights: research?.insights || [],
          social_optimization: social?.optimization || {},
        };
        finalOutput.recommendations = [
          ...(research?.recommendations || []),
          ...(social?.recommendations || []),
        ];

      } else if (input.workflow === "market_research") {
        // Combine market analysis + sentiment
        const marketAnalysis = results.market_analyst?.output;
        const sentiment = results.sentiment_analyzer?.output;

        finalOutput.analysis = {
          market_metrics: marketAnalysis?.metrics || {},
          sentiment_analysis: sentiment?.sentiment || {},
          correlations: marketAnalysis?.correlations || [],
        };
        finalOutput.recommendations = [
          ...(marketAnalysis?.recommendations || []),
          ...(sentiment?.recommendations || []),
        ];

      } else {
        // Generic aggregation for custom workflows
        finalOutput.analysis = results;
        finalOutput.recommendations = Object.values(results)
          .flatMap(r => r.output?.recommendations || []);
      }

      metadata.set("progress", 95);

      // Step 5: Calculate coordination metrics (5% progress)
      metadata.set("status", "finalizing").set("progress", 98);

      const totalExecutionTime = Date.now() - startTime;
      const successRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;

      const coordination = {
        agentsUsed: agentPlan,
        executionOrder,
        totalExecutionTime,
        successRate,
      };

      metadata.set("status", "completed").set("progress", 100);

      const result = {
        workflow: input.workflow,
        results,
        coordination,
        finalOutput,
        metadata: {
          workflowType: input.workflow,
          timestamp: new Date().toISOString(),
          quality_score: successRate * 100,
        },
      };

      logger.info("✅ Team orchestration completed", {
        workflow: input.workflow,
        agentsExecuted: agentPlan.length,
        successRate: (successRate * 100).toFixed(1) + "%",
        totalExecutionTime: `${totalExecutionTime}ms`,
      });

      return TeamOrchestrationOutput.parse(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      metadata.set("status", "failed").set("error", errorMessage);

      logger.error("❌ Team orchestration failed", {
        error: errorMessage,
        workflow: input.workflow,
        executedAgents: executionOrder,
      });

      throw new Error(`Team orchestration failed: ${errorMessage}`);
    }
  },
});