import { python } from "@trigger.dev/sdk";
import { logger } from "@trigger.dev/sdk";

/**
 * Bridge interface for executing Agno framework agents from Trigger.dev
 * Provides standardized interface for running Python-based agents
 */

export interface AgnoAgentConfig {
  scriptPath: string;
  agentName: string;
  description: string;
  defaultArgs?: string[];
  timeout?: number;
  retryAttempts?: number;
}

export interface AgnoExecutionResult {
  success: boolean;
  output: any;
  logs: string[];
  executionTime: number;
  error?: string;
}

/**
 * Execute an Agno framework agent script
 */
export async function executeAgnoAgent(
  config: AgnoAgentConfig,
  payload: Record<string, any>,
  options: {
    timeout?: number;
    args?: string[];
    workingDir?: string;
  } = {}
): Promise<AgnoExecutionResult> {
  const startTime = Date.now();

  try {
    logger.info(`🤖 Executing Agno agent: ${config.agentName}`, {
      scriptPath: config.scriptPath,
      payload: JSON.stringify(payload, null, 2),
    });

    // Prepare arguments for the Python script
    const args = [
      ...(config.defaultArgs || []),
      ...(options.args || []),
      "--payload", JSON.stringify(payload),
    ];

    // Execute the Python script
    const result = await python.runScript(config.scriptPath, args, {
      timeout: options.timeout || config.timeout || 300000, // 5 minutes default
      cwd: options.workingDir,
    });

    const executionTime = Date.now() - startTime;

    logger.info(`✅ Agno agent completed: ${config.agentName}`, {
      executionTime: `${executionTime}ms`,
      outputLength: result.output?.length || 0,
    });

    // Parse the output if it's JSON
    let parsedOutput = result.output;
    try {
      parsedOutput = JSON.parse(result.output);
    } catch {
      // Keep as string if not valid JSON
    }

    return {
      success: true,
      output: parsedOutput,
      logs: result.logs || [],
      executionTime,
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(`❌ Agno agent failed: ${config.agentName}`, {
      error: errorMessage,
      executionTime: `${executionTime}ms`,
    });

    return {
      success: false,
      output: null,
      logs: [],
      executionTime,
      error: errorMessage,
    };
  }
}

/**
 * Enhanced execution with retry logic
 */
export async function executeAgnoAgentWithRetry(
  config: AgnoAgentConfig,
  payload: Record<string, any>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
  } = {}
): Promise<AgnoExecutionResult> {
  const maxRetries = options.maxRetries || config.retryAttempts || 3;
  const retryDelay = options.retryDelay || 1000;

  let lastError: string = "";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`🔄 Attempt ${attempt}/${maxRetries} for ${config.agentName}`);

      const result = await executeAgnoAgent(config, payload, options);

      if (result.success) {
        if (attempt > 1) {
          logger.info(`✅ Succeeded on attempt ${attempt} for ${config.agentName}`);
        }
        return result;
      }

      lastError = result.error || "Unknown error";

      if (attempt < maxRetries) {
        logger.warn(`⚠️ Attempt ${attempt} failed, retrying in ${retryDelay}ms`, {
          agent: config.agentName,
          error: lastError,
        });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);

      if (attempt < maxRetries) {
        logger.warn(`⚠️ Attempt ${attempt} failed with exception, retrying`, {
          agent: config.agentName,
          error: lastError,
        });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  return {
    success: false,
    output: null,
    logs: [],
    executionTime: 0,
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
  };
}

/**
 * Predefined Agno agent configurations for ServiceFlow AI
 */
export const AGNO_AGENTS = {
  enhancedContentAgent: {
    scriptPath: "./agent-ui/Agents/enhanced_content_agent.py",
    agentName: "Enhanced Content Agent",
    description: "Content creation and social media automation",
    defaultArgs: ["--mode", "production"],
    timeout: 300000, // 5 minutes
    retryAttempts: 3,
  },

  nftMarketAnalyst: {
    scriptPath: "./agent-ui/Agents/nft_market_analyst_agent.py",
    agentName: "NFT Market Analyst",
    description: "NFT market analysis and trend detection",
    defaultArgs: ["--analysis-mode", "comprehensive"],
    timeout: 180000, // 3 minutes
    retryAttempts: 2,
  },

  ecosystemAnalyst: {
    scriptPath: "./agent-ui/Agents/ecosystem_analyst_agent.py",
    agentName: "Ecosystem Analyst",
    description: "DeFi and ecosystem monitoring",
    defaultArgs: ["--include-sentiment", "true"],
    timeout: 240000, // 4 minutes
    retryAttempts: 3,
  },

  srvcfloTeamAgent: {
    scriptPath: "./agent-ui/Agents/teams/srvcflo_team_agent.py",
    agentName: "SrvcFlo Team Agent",
    description: "Team coordination and workflow management",
    defaultArgs: ["--team-mode", "orchestrator"],
    timeout: 600000, // 10 minutes
    retryAttempts: 2,
  },

  discordAgent: {
    scriptPath: "./agent-ui/Agents/discord_agent_integration.py",
    agentName: "Discord Agent",
    description: "Discord bot and community management",
    defaultArgs: ["--auto-respond", "true"],
    timeout: 120000, // 2 minutes
    retryAttempts: 3,
  },
} as const;

/**
 * Helper function to execute a predefined agent
 */
export function executeKnownAgent(
  agentKey: keyof typeof AGNO_AGENTS,
  payload: Record<string, any>,
  options?: { timeout?: number; args?: string[] }
) {
  return executeAgnoAgentWithRetry(AGNO_AGENTS[agentKey], payload, options);
}