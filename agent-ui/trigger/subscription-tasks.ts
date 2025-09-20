import { task, wait } from "@trigger.dev/sdk/v3";
import { ethers } from "ethers";

// Types for subscription data
interface SubscriptionData {
  tokenId: string;
  userAddress: string;
  tier: 'BANDIT_KIDZ' | 'BASIC' | 'STANDARD' | 'PREMIUM' | 'UNLIMITED';
  expiresAt: Date;
  promptsUsed: number;
  promptsLimit: number;
  isActive: boolean;
  renewalCount: number;
  isBanditKidzHolder: boolean;
}

interface EmailNotification {
  to: string;
  template: string;
  data: Record<string, any>;
}

// Subscription monitoring task - runs every hour
export const monitorSubscriptions = task({
  id: "monitor-subscriptions",
  run: async (payload: { contractAddress: string; rpcUrl: string }) => {
    console.log("🔍 Starting subscription monitoring task");

    const provider = new ethers.JsonRpcProvider(payload.rpcUrl);
    const contract = new ethers.Contract(
      payload.contractAddress,
      [
        "function getAllActiveSubscriptions() view returns (tuple(uint256 tokenId, address user, uint8 tier, uint256 expiresAt, uint256 promptsUsed, uint256 promptsLimit, bool isActive, bool expired, uint256 renewalCount)[])",
        "function isBanditKidzHolder(address user) view returns (bool)"
      ],
      provider
    );

    try {
      // Get all active subscriptions
      const subscriptions = await contract.getAllActiveSubscriptions();
      console.log(`📊 Found ${subscriptions.length} active subscriptions`);

      let expiringCount = 0;
      let expiredCount = 0;
      let highUsageCount = 0;

      for (const sub of subscriptions) {
        const subscription: SubscriptionData = {
          tokenId: sub.tokenId.toString(),
          userAddress: sub.user,
          tier: ['BANDIT_KIDZ', 'BASIC', 'STANDARD', 'PREMIUM', 'UNLIMITED'][sub.tier],
          expiresAt: new Date(Number(sub.expiresAt) * 1000),
          promptsUsed: Number(sub.promptsUsed),
          promptsLimit: Number(sub.promptsLimit),
          isActive: sub.isActive,
          renewalCount: Number(sub.renewalCount),
          isBanditKidzHolder: await contract.isBanditKidzHolder(sub.user)
        };

        // Check for expiring subscriptions (7 days or less)
        const daysUntilExpiry = (subscription.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

        if (daysUntilExpiry <= 0 && subscription.isActive) {
          // Expired subscription
          expiredCount++;
          await processExpiredSubscription.trigger({ subscription });
        } else if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
          // Expiring soon
          expiringCount++;
          await sendExpirationReminder.trigger({
            subscription,
            daysUntilExpiry: Math.ceil(daysUntilExpiry)
          });
        }

        // Check for high usage (90% or more)
        if (subscription.promptsLimit !== -1) {
          const usagePercent = (subscription.promptsUsed / subscription.promptsLimit) * 100;
          if (usagePercent >= 90) {
            highUsageCount++;
            await sendUsageAlert.trigger({ subscription, usagePercent });
          }
        }

        // Small delay to avoid rate limiting
        await wait.for({ seconds: 0.1 });
      }

      // Generate daily metrics
      await generateDailyMetrics.trigger({
        date: new Date().toISOString().split('T')[0],
        metrics: {
          totalActiveSubscriptions: subscriptions.length,
          expiringSubscriptions: expiringCount,
          expiredSubscriptions: expiredCount,
          highUsageSubscriptions: highUsageCount
        }
      });

      return {
        success: true,
        totalSubscriptions: subscriptions.length,
        expiringCount,
        expiredCount,
        highUsageCount
      };

    } catch (error) {
      console.error("❌ Error monitoring subscriptions:", error);
      throw error;
    }
  },
});

// Send expiration reminder emails
export const sendExpirationReminder = task({
  id: "send-expiration-reminder",
  run: async (payload: { subscription: SubscriptionData; daysUntilExpiry: number }) => {
    const { subscription, daysUntilExpiry } = payload;

    console.log(`📧 Sending expiration reminder for subscription ${subscription.tokenId}`);

    // In a real implementation, this would integrate with an email service
    const emailData: EmailNotification = {
      to: subscription.userAddress, // Would need to resolve to actual email
      template: "subscription-expiring",
      data: {
        tokenId: subscription.tokenId,
        tier: subscription.tier,
        daysUntilExpiry,
        expiresAt: subscription.expiresAt.toISOString(),
        renewalUrl: `https://serviceflow.ai/subscription?action=renew&tokenId=${subscription.tokenId}`
      }
    };

    // TODO: Integrate with actual email service (SendGrid, etc.)
    console.log("📧 Email notification:", emailData);

    return { success: true, emailSent: true };
  },
});

// Handle expired subscriptions
export const processExpiredSubscription = task({
  id: "process-expired-subscription",
  run: async (payload: { subscription: SubscriptionData }) => {
    const { subscription } = payload;

    console.log(`⏰ Processing expired subscription ${subscription.tokenId}`);

    // Send final expiration notice
    const emailData: EmailNotification = {
      to: subscription.userAddress,
      template: "subscription-expired",
      data: {
        tokenId: subscription.tokenId,
        tier: subscription.tier,
        expiredAt: subscription.expiresAt.toISOString(),
        reactivateUrl: `https://serviceflow.ai/subscription?action=reactivate&tokenId=${subscription.tokenId}`
      }
    };

    console.log("📧 Expiration notice:", emailData);

    // Disable premium features (this would update internal access controls)
    await disablePremiumFeatures.trigger({
      userAddress: subscription.userAddress,
      tokenId: subscription.tokenId
    });

    return {
      success: true,
      expired: true,
      userNotified: true
    };
  },
});

// Send usage alerts for high consumption
export const sendUsageAlert = task({
  id: "send-usage-alert",
  run: async (payload: { subscription: SubscriptionData; usagePercent: number }) => {
    const { subscription, usagePercent } = payload;

    console.log(`⚠️ Sending usage alert for subscription ${subscription.tokenId} (${usagePercent.toFixed(1)}%)`);

    const emailData: EmailNotification = {
      to: subscription.userAddress,
      template: "usage-alert",
      data: {
        tokenId: subscription.tokenId,
        tier: subscription.tier,
        usagePercent: usagePercent.toFixed(1),
        promptsUsed: subscription.promptsUsed,
        promptsLimit: subscription.promptsLimit,
        upgradeUrl: `https://serviceflow.ai/subscription?action=upgrade&tokenId=${subscription.tokenId}`
      }
    };

    console.log("📧 Usage alert:", emailData);

    return { success: true, alertSent: true };
  },
});

// Disable premium features for expired subscriptions
export const disablePremiumFeatures = task({
  id: "disable-premium-features",
  run: async (payload: { userAddress: string; tokenId: string }) => {
    const { userAddress, tokenId } = payload;

    console.log(`🔒 Disabling premium features for user ${userAddress}`);

    // In a real implementation, this would:
    // 1. Update user permissions in database
    // 2. Invalidate API keys
    // 3. Remove access to premium AI models
    // 4. Limit features to free tier

    // Mock implementation
    const updatedFeatures = {
      userAddress,
      tokenId,
      accessLevel: 'free',
      disabledFeatures: [
        'premium-ai-models',
        'video-generation',
        'api-access',
        'priority-queue',
        'analytics-dashboard'
      ],
      timestamp: new Date().toISOString()
    };

    console.log("🔒 Features disabled:", updatedFeatures);

    return { success: true, featuresDisabled: true };
  },
});

// Generate daily subscription metrics
export const generateDailyMetrics = task({
  id: "generate-daily-metrics",
  run: async (payload: {
    date: string;
    metrics: {
      totalActiveSubscriptions: number;
      expiringSubscriptions: number;
      expiredSubscriptions: number;
      highUsageSubscriptions: number;
    }
  }) => {
    const { date, metrics } = payload;

    console.log(`📈 Generating daily metrics for ${date}`);

    // Calculate additional metrics
    const enhancedMetrics = {
      ...metrics,
      date,
      retentionRate: metrics.totalActiveSubscriptions > 0
        ? ((metrics.totalActiveSubscriptions - metrics.expiredSubscriptions) / metrics.totalActiveSubscriptions * 100).toFixed(2)
        : '0',
      avgRenewalRate: '85.3', // Would calculate from historical data
      revenueImpact: metrics.expiredSubscriptions * 150, // Estimate based on avg subscription value
      generatedAt: new Date().toISOString()
    };

    // Store metrics (would save to database in real implementation)
    console.log("📊 Daily metrics:", enhancedMetrics);

    // Trigger alerts for significant changes
    if (metrics.expiredSubscriptions > 10) {
      await sendAdminAlert.trigger({
        type: 'high-churn',
        message: `High churn detected: ${metrics.expiredSubscriptions} subscriptions expired today`,
        metrics: enhancedMetrics
      });
    }

    return { success: true, metrics: enhancedMetrics };
  },
});

// Send admin alerts for critical issues
export const sendAdminAlert = task({
  id: "send-admin-alert",
  run: async (payload: {
    type: 'high-churn' | 'payment-failures' | 'system-error';
    message: string;
    metrics?: any;
  }) => {
    const { type, message, metrics } = payload;

    console.log(`🚨 Sending admin alert: ${type}`);

    const alertData = {
      type,
      message,
      timestamp: new Date().toISOString(),
      severity: type === 'system-error' ? 'critical' : 'warning',
      metrics,
      actionRequired: true
    };

    // Would send to admin dashboard/Slack/email in real implementation
    console.log("🚨 Admin alert:", alertData);

    return { success: true, alertSent: true };
  },
});

// Process subscription renewals
export const processSubscriptionRenewal = task({
  id: "process-subscription-renewal",
  run: async (payload: {
    tokenId: string;
    userAddress: string;
    tier: string;
    paymentMethod: 'sonic' | 'credit';
    amount?: number;
  }) => {
    const { tokenId, userAddress, tier, paymentMethod, amount } = payload;

    console.log(`🔄 Processing renewal for subscription ${tokenId}`);

    try {
      // Step 1: Validate payment
      if (paymentMethod === 'sonic' && amount) {
        await validateSonicPayment.trigger({ userAddress, amount, tokenId });
      }

      // Step 2: Extend subscription on blockchain
      await extendSubscriptionOnChain.trigger({ tokenId, userAddress });

      // Step 3: Update internal records
      await updateInternalRecords.trigger({
        tokenId,
        userAddress,
        action: 'renewed',
        timestamp: new Date().toISOString()
      });

      // Step 4: Send confirmation
      await sendRenewalConfirmation.trigger({ tokenId, userAddress, tier });

      // Step 5: Re-enable premium features if they were disabled
      await enablePremiumFeatures.trigger({ userAddress, tokenId, tier });

      return {
        success: true,
        renewed: true,
        newExpirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

    } catch (error) {
      console.error(`❌ Renewal failed for ${tokenId}:`, error);

      // Send failure notification
      await sendRenewalFailureNotification.trigger({
        tokenId,
        userAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  },
});

// Validate SONIC token payment
export const validateSonicPayment = task({
  id: "validate-sonic-payment",
  run: async (payload: { userAddress: string; amount: number; tokenId: string }) => {
    const { userAddress, amount, tokenId } = payload;

    console.log(`💰 Validating SONIC payment of ${amount} from ${userAddress}`);

    // In real implementation, this would check blockchain transactions
    // For now, we'll simulate validation
    const paymentValid = Math.random() > 0.1; // 90% success rate simulation

    if (!paymentValid) {
      throw new Error('Payment validation failed: Insufficient SONIC balance or transaction not found');
    }

    return { success: true, paymentValidated: true, amount };
  },
});

// Extend subscription on blockchain
export const extendSubscriptionOnChain = task({
  id: "extend-subscription-on-chain",
  run: async (payload: { tokenId: string; userAddress: string }) => {
    const { tokenId, userAddress } = payload;

    console.log(`⛓️ Extending subscription ${tokenId} on blockchain`);

    // In real implementation, this would call the smart contract
    // For now, we'll simulate the blockchain interaction
    await wait.for({ seconds: 2 }); // Simulate blockchain confirmation time

    const newExpirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      newExpirationDate: newExpirationDate.toISOString()
    };
  },
});

// Update internal subscription records
export const updateInternalRecords = task({
  id: "update-internal-records",
  run: async (payload: {
    tokenId: string;
    userAddress: string;
    action: 'renewed' | 'upgraded' | 'cancelled';
    timestamp: string;
  }) => {
    const { tokenId, userAddress, action, timestamp } = payload;

    console.log(`💾 Updating internal records for ${tokenId}: ${action}`);

    // In real implementation, this would update the database
    const recordUpdate = {
      tokenId,
      userAddress,
      action,
      timestamp,
      updatedBy: 'system',
      syncedWithBlockchain: true
    };

    console.log("💾 Record updated:", recordUpdate);

    return { success: true, recordsUpdated: true };
  },
});

// Send renewal confirmation
export const sendRenewalConfirmation = task({
  id: "send-renewal-confirmation",
  run: async (payload: { tokenId: string; userAddress: string; tier: string }) => {
    const { tokenId, userAddress, tier } = payload;

    console.log(`✅ Sending renewal confirmation for ${tokenId}`);

    const confirmationData: EmailNotification = {
      to: userAddress,
      template: "renewal-confirmation",
      data: {
        tokenId,
        tier,
        renewedAt: new Date().toISOString(),
        newExpirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        dashboardUrl: "https://serviceflow.ai/dashboard"
      }
    };

    console.log("✅ Confirmation sent:", confirmationData);

    return { success: true, confirmationSent: true };
  },
});

// Enable premium features after renewal
export const enablePremiumFeatures = task({
  id: "enable-premium-features",
  run: async (payload: { userAddress: string; tokenId: string; tier: string }) => {
    const { userAddress, tokenId, tier } = payload;

    console.log(`🔓 Enabling premium features for ${userAddress} (${tier})`);

    const tierFeatures = {
      BASIC: ['basic-ai-models', 'image-generation', 'email-support'],
      STANDARD: ['all-ai-models', 'video-generation', 'priority-queue', 'live-chat'],
      PREMIUM: ['api-access', 'custom-models', 'analytics', 'priority-support'],
      UNLIMITED: ['everything', 'unlimited-usage', 'team-features', 'white-label']
    };

    const enabledFeatures = tierFeatures[tier as keyof typeof tierFeatures] || [];

    const featureUpdate = {
      userAddress,
      tokenId,
      tier,
      enabledFeatures,
      accessLevel: tier.toLowerCase(),
      timestamp: new Date().toISOString()
    };

    console.log("🔓 Features enabled:", featureUpdate);

    return { success: true, featuresEnabled: true, enabledFeatures };
  },
});

// Send renewal failure notification
export const sendRenewalFailureNotification = task({
  id: "send-renewal-failure-notification",
  run: async (payload: { tokenId: string; userAddress: string; error: string }) => {
    const { tokenId, userAddress, error } = payload;

    console.log(`❌ Sending renewal failure notification for ${tokenId}`);

    const failureData: EmailNotification = {
      to: userAddress,
      template: "renewal-failed",
      data: {
        tokenId,
        error,
        failedAt: new Date().toISOString(),
        retryUrl: `https://serviceflow.ai/subscription?action=retry-renewal&tokenId=${tokenId}`,
        supportUrl: "https://serviceflow.ai/support"
      }
    };

    console.log("❌ Failure notification:", failureData);

    return { success: true, notificationSent: true };
  },
});