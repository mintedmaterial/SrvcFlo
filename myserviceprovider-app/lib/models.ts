import type { ObjectId } from "mongodb"

// Multi-tenant business configuration
export interface Business {
  _id?: ObjectId
  businessName: string
  businessType: string // "home_services", "professional", "health_beauty", "retail_food", etc.
  ownerName: string
  email: string
  phone: string
  address: string
  website?: string
  logo?: string

  // Business Details
  hours: {
    [key: string]: { open: string; close: string; closed: boolean }
  }
  services: string[]
  serviceAreas: string[]

  // AI Package Configuration
  packageType: "basic" | "upgraded" | "premier"
  packagePrice: number
  packageStartDate: Date
  packageStatus: "trial" | "active" | "training" | "success_model" | "cancelled"

  // Custom Pricing Logic
  pricingRules: {
    serviceType: string
    formula: string // e.g., "material + labor + markup"
    laborRate?: { min: number; max: number }
    materialRate?: { min: number; max: number }
    markup?: number
  }[]

  // Database Configuration
  customTableNames?: {
    customers?: string
    projects?: string
    conversations?: string
  }

  // AI Agent Configuration
  agentSettings: {
    chatbotEnabled: boolean
    phoneAgentEnabled: boolean
    socialMediaEnabled: boolean
    videoContentEnabled: boolean
    leadScoringEnabled: boolean
    customPrompts?: string[]
  }

  // Success Metrics
  metrics: {
    leadIncrease?: number
    revenueIncrease?: number
    efficiencyGain?: number
    customerSatisfaction?: number
  }

  createdAt: Date
  updatedAt: Date
}

// Customer/Lead data (now business-specific)
export interface Customer {
  _id?: ObjectId
  businessId: ObjectId // Links to specific business
  name: string
  email: string
  phone: string
  address?: string
  projectDescription: string
  status: "new" | "contacted" | "quoted" | "scheduled" | "completed"
  estimatedValue?: number
  createdAt: Date
  updatedAt: Date
  source: "website" | "referral" | "social_media" | "ai_generated"
  notes?: string
  customFields?: { [key: string]: any } // Business-specific fields
}

// Admin/Employee users (now with business association)
export interface AdminUser {
  _id?: ObjectId
  email: string
  password: string // In production, this should be hashed
  role: "super_admin" | "business_owner" | "employee" | "contractor"
  name: string
  phone?: string
  businessId?: ObjectId // Links to specific business (null for super_admin)
  permissions: string[]
  createdAt: Date
  lastLogin?: Date
  isActive: boolean
}

// File uploads for businesses
export interface BusinessFile {
  _id?: ObjectId
  businessId: ObjectId
  fileName: string
  fileType: "document" | "receipt" | "csv" | "image" | "video"
  filePath: string
  fileSize: number
  uploadedBy: ObjectId
  description?: string
  tags?: string[]
  createdAt: Date
}

// AI conversation history (business-specific)
export interface Conversation {
  _id?: ObjectId
  businessId: ObjectId
  customerId?: ObjectId
  customerEmail?: string
  messages: {
    role: "user" | "assistant"
    content: string
    timestamp: Date
  }[]
  estimatesGenerated?: {
    service: string
    amount: number
    breakdown: {
      materials?: number
      labor?: number
      markup?: number
    }
  }[]
  leadScore?: number
  businessContext?: string // Custom business information used in conversation
  createdAt: Date
  updatedAt: Date
}

// SaaS subscription tracking
export interface Subscription {
  _id?: ObjectId
  businessId: ObjectId
  packageType: "basic" | "upgraded" | "premier"
  status: "trial" | "active" | "past_due" | "cancelled"
  currentPeriodStart: Date
  currentPeriodEnd: Date
  monthlyAmount: number

  // Success model transition
  isSuccessModel: boolean
  successModelStartDate?: Date
  verifiedROI?: number
  royaltyPercentage?: number

  // Usage tracking
  usage: {
    chatbotInteractions: number
    phoneCallsHandled: number
    contentGenerated: number
    leadsProcessed: number
  }

  stripeSubscriptionId?: string
  createdAt: Date
  updatedAt: Date
}

// Business analytics and reporting
export interface BusinessAnalytics {
  _id?: ObjectId
  businessId: ObjectId
  period: "daily" | "weekly" | "monthly" | "quarterly"
  startDate: Date
  endDate: Date

  metrics: {
    totalLeads: number
    convertedLeads: number
    revenue: number
    aiInteractions: number
    customerSatisfaction: number
    responseTime: number
  }

  aiUsage: {
    chatbotSessions: number
    phoneCallsHandled: number
    contentPiecesGenerated: number
    estimatesProvided: number
  }

  createdAt: Date
}
