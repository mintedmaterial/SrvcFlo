// API Key management for ServiceFlow AI platform

import { randomBytes } from "crypto"

export interface APIKey {
  _id?: string
  businessId: string
  keyId: string
  keySecret: string
  keyName: string
  status: "active" | "suspended" | "revoked"
  permissions: string[]
  rateLimit: {
    requestsPerMinute: number
    requestsPerDay: number
  }
  usage: {
    totalRequests: number
    lastUsed?: Date
  }
  createdBy: string // Master Admin ID
  createdAt: Date
  expiresAt?: Date
}

export function generateAPIKey(): { keyId: string; keySecret: string } {
  const keyId = `sfai_${randomBytes(16).toString("hex")}`
  const keySecret = randomBytes(32).toString("hex")

  return { keyId, keySecret }
}

export function getAPIKeyPermissions(packageType: string): string[] {
  const basePermissions = ["use_chatbot", "access_analytics", "manage_customers", "view_conversations"]

  const packagePermissions = {
    basic: [...basePermissions],
    upgraded: [...basePermissions, "use_phone_agent", "social_media_posting"],
    premier: [...basePermissions, "use_phone_agent", "social_media_posting", "video_generation", "custom_workflows"],
  }

  return packagePermissions[packageType as keyof typeof packagePermissions] || basePermissions
}

export function getRateLimit(packageType: string) {
  const rateLimits = {
    basic: { requestsPerMinute: 60, requestsPerDay: 5000 },
    upgraded: { requestsPerMinute: 120, requestsPerDay: 15000 },
    premier: { requestsPerMinute: 300, requestsPerDay: 50000 },
  }

  return rateLimits[packageType as keyof typeof rateLimits] || rateLimits.basic
}
