/**
 * Logs an interaction between the user and the agent
 * @param {Object} interaction - The interaction to log
 */
export function logInteraction(interaction: {
  userMessage: string
  dataFetched: any
  llmResponse: string
}): void {
  try {
    const timestamp = new Date().toISOString()

    const logEntry = {
      timestamp,
      userMessage: interaction.userMessage,
      dataFetchedSummary: summarizeData(interaction.dataFetched),
      llmResponse: interaction.llmResponse,
    }

    // In a browser environment, we can't write to the filesystem
    // Instead, log to console or send to a logging endpoint
    console.log("Interaction log:", logEntry)

    // In a production app, you might want to send logs to a server endpoint
  } catch (error) {
    console.error("Error logging interaction:", error)
    // Don't throw - logging should never break the main flow
  }
}

/**
 * Creates a summary of fetched data for logging
 * @param {Object} data - The fetched data
 * @returns {Object} A summary of the data
 */
function summarizeData(data: any): any {
  if (!data) return null

  const summary: any = {
    timestamp: data.timestamp,
    sources: data.sources,
    dataTypes: [],
  }

  if (data.error) {
    summary.error = data.error
    return summary
  }

  if (data.data) {
    // Add data types that were fetched
    if (data.data.protocols) {
      summary.dataTypes.push("protocols")
      summary.protocolCount = Object.keys(data.data.protocols).length
    }

    if (data.data.trendingProtocols) {
      summary.dataTypes.push("trendingProtocols")
    }

    if (data.data.chains) {
      summary.dataTypes.push("chains")
      summary.chainCount = Object.keys(data.data.chains).length
    }

    if (data.data.allChains) {
      summary.dataTypes.push("allChains")
    }

    if (data.data.yieldPools) {
      summary.dataTypes.push("yieldPools")
    }

    if (data.data.tokenPrices) {
      summary.dataTypes.push("tokenPrices")
    }

    if (data.data.stablecoins) {
      summary.dataTypes.push("stablecoins")
    }

    if (data.data.dexVolumes) {
      summary.dataTypes.push("dexVolumes")
    }
  }

  return summary
}
