// Authentication and permission levels for ServiceFlow AI platform

export const AUTH_LEVELS = {
  MASTER_ADMIN: "master_admin",
  BUSINESS_ADMIN: "business_admin",
  BUSINESS_USER: "business_user",
  END_USER: "end_user",
} as const

export const MASTER_PERMISSIONS = [
  // Platform Management
  "manage_platform",
  "create_businesses",
  "edit_business_configs",
  "delete_businesses",
  "manage_api_keys",

  // AI & Agent Management
  "build_ai_workflows",
  "configure_agents",
  "manage_ai_models",
  "edit_agent_prompts",
  "deploy_agent_updates",

  // Data & Database
  "access_all_data",
  "manage_databases",
  "data_scraping",
  "bulk_operations",

  // Billing & Subscriptions
  "manage_billing",
  "view_all_revenue",
  "manage_subscriptions",
  "generate_api_keys",

  // System Administration
  "system_settings",
  "view_platform_analytics",
  "manage_templates",
  "white_label_config",
]

export const BUSINESS_ADMIN_PERMISSIONS = [
  // Own Business Only
  "view_own_business",
  "manage_own_customers",
  "view_own_analytics",
  "use_ai_agents",

  // Limited Management
  "manage_business_users",
  "view_conversations",
  "export_own_data",
  "basic_customization",

  // File Management (with approval required)
  "upload_business_files",
  "upload_receipts",
  "upload_csv_data",
  "view_pending_uploads",
  "request_data_integration",

  // No Access To:
  // - AI configuration
  // - Business setup/editing
  // - Other businesses' data
  // - Platform settings
  // - API key generation
  // - Direct database integration
]

export function hasPermission(userRole: string, permission: string): boolean {
  if (userRole === AUTH_LEVELS.MASTER_ADMIN) {
    return MASTER_PERMISSIONS.includes(permission)
  }

  if (userRole === AUTH_LEVELS.BUSINESS_ADMIN) {
    return BUSINESS_ADMIN_PERMISSIONS.includes(permission)
  }

  return false
}

export function isMasterAdmin(userRole: string): boolean {
  return userRole === AUTH_LEVELS.MASTER_ADMIN
}

export function isBusinessAdmin(userRole: string): boolean {
  return userRole === AUTH_LEVELS.BUSINESS_ADMIN
}
