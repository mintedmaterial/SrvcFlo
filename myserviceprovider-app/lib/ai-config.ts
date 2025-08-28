import { groq } from "@ai-sdk/groq"

// Groq model configurations
export const groqModels = {
  // High-performance models
  "llama-3.3-70b": "llama-3.3-70b-versatile",
  "llama-3.1-8b": "llama-3.1-8b-instant",
  "mixtral-8x7b": "mixtral-8x7b-32768",
  "gemma2-9b": "gemma2-9b-it",

  // Latest models
  "llama-4-scout": "meta-llama/llama-4-scout-17b-16e-instruct",
}

export function createGroqModel(modelName: keyof typeof groqModels) {
  return groq(groqModels[modelName])
}

// Default model configuration - using fast Llama 3.3 70B
export const defaultModel = createGroqModel("llama-3.3-70b")

// Fast and efficient model for quick responses
export const fastModel = createGroqModel("llama-3.1-8b")

// High-reasoning model for complex estimates
export const premiumModel = createGroqModel("mixtral-8x7b")
