# OpenRouter Integration Setup

## Environment Variables

Add these to your `.env.local` file:

\`\`\`env
# OpenRouter API Key (get from https://openrouter.ai/keys)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Your site URL for OpenRouter credits/referrals
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
\`\`\`

## Getting Started with OpenRouter

1. **Sign up at [OpenRouter.ai](https://openrouter.ai)**
2. **Get your API key** from the [Keys page](https://openrouter.ai/keys)
3. **Add credits** to your account (many models are very affordable)
4. **Set your environment variables** as shown above

## Model Selection Guide

### For Production (Recommended)
- **GPT-4o**: Best balance of quality and cost
- **Claude 3.5 Sonnet**: Excellent reasoning for complex estimates
- **GPT-4 Turbo**: High quality, good for detailed responses

### For Development/Testing
- **GPT-3.5 Turbo**: Very cost-effective, good quality
- **Claude 3 Haiku**: Fast and cheap, good for simple queries
- **Llama 3.1 70B**: Open source, good performance

### For Specialized Tasks
- **Claude 3 Opus**: Best reasoning for complex calculations
- **Grok Beta**: Good for creative responses
- **Mixtral 8x7B**: Good balance of cost and performance

## Cost Comparison (Approximate)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| GPT-3.5 Turbo | $0.50 | $1.50 |
| GPT-4o | $5.00 | $15.00 |
| Claude 3 Haiku | $0.25 | $1.25 |
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Llama 3.1 70B | $0.88 | $0.88 |

## Switching Models

To change models, update the `defaultModel` in `lib/ai-config.ts`:

\`\`\`typescript
// For cost-effective development
export const defaultModel = createOpenRouterModel("gpt-3.5-turbo")

// For production quality
export const defaultModel = createOpenRouterModel("gpt-4o")

// For maximum reasoning
export const defaultModel = createOpenRouterModel("claude-3-opus")
