import { task } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { ethers } from "ethers";
import { getR2Client } from "@/lib/r2-storage";

// Payment schema with validation
const PaymentSchema = z.object({
  userId: z.string(),
  contentType: z.enum(["image", "video", "text", "audio"]),
  contentId: z.string(),
  amount: z.number().positive(),
  currency: z.enum(["USDC", "S"]),
  walletAddress: z.string(),
  metadata: z.object({
    generatedAt: z.string().datetime(),
    quality: z.enum(["standard", "premium", "ultra"]).optional(),
    dimensions: z.object({
      width: z.number().optional(),
      height: z.number().optional(),
      duration: z.number().optional(),
    }).optional(),
  }),
});

// Payment distribution configuration
const PAYMENT_DISTRIBUTION = {
  leaderboard: 0.15,  // 15% to leaderboard wallet
  devWallet: 0.50,    // 50% to dev/AI costs
  nftStaking: 0.25,   // 25% to NFT staking rewards
  reserve: 0.10,      // 10% reserve fund
};

// Wallet addresses from environment
const WALLETS = {
  leaderboard: process.env.LEADERBOARD_WALLET_ADDRESS!,
  devWallet: process.env.DEV_WALLET_ADDRESS!,
  nftStaking: process.env.NFT_STAKING_WALLET_ADDRESS!,
  reserve: process.env.RESERVE_WALLET_ADDRESS!,
};

// Sonic network RPC configuration
const SONIC_RPC = process.env.SONIC_RPC_URL || "https://rpc.soniclabs.com";
const PAYMENT_CONTRACT_ADDRESS = process.env.PAYMENT_CONTRACT_ADDRESS!;

export const processPayment = task({
  id: "payment-processor",
  machine: {
    preset: "medium-1x",
  },
  retry: {
    maxAttempts: 3,
    minTimeout: "30s",
    maxTimeout: "5m",
    factor: 2,
  },
  run: async (payload: z.infer<typeof PaymentSchema>, { ctx, metadata }) => {
    // Validate payment data
    const validatedPayment = PaymentSchema.parse(payload);
    const { userId, contentType, contentId, amount, currency, walletAddress } = validatedPayment;

    console.log(`Processing payment for ${contentType} content: ${contentId}`);
    metadata.set("contentType", contentType);
    metadata.set("amount", amount);
    metadata.set("currency", currency);

    try {
      // Step 1: Calculate payment distribution
      const distribution = calculateDistribution(amount);

      // Step 2: Initialize blockchain provider
      const provider = new ethers.JsonRpcProvider(SONIC_RPC);
      const wallet = new ethers.Wallet(process.env.PAYMENT_PRIVATE_KEY!, provider);

      // Step 3: Get payment contract instance
      const paymentContract = new ethers.Contract(
        PAYMENT_CONTRACT_ADDRESS,
        PAYMENT_CONTRACT_ABI,
        wallet
      );

      // Step 4: Process blockchain payment
      const txHash = await executePayment(
        paymentContract,
        walletAddress,
        distribution,
        currency
      );

      // Step 5: Store transaction data
      const transactionData = {
        txHash,
        userId,
        contentId,
        contentType,
        amount,
        currency,
        distribution,
        timestamp: new Date().toISOString(),
        status: "completed",
      };

      // Step 6: Upload content to R2 if applicable
      let contentUrl: string | undefined;
      if (contentType === "image" || contentType === "video") {
        contentUrl = await uploadContentToR2(contentId, contentType, userId);
      }

      // Step 7: Record payment in database (via Supabase MCP)
      await recordPaymentTransaction(transactionData);

      return {
        success: true,
        transactionHash: txHash,
        distribution,
        contentUrl,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Payment processing failed:", error);
      metadata.set("error", (error as Error).message);
      throw error;
    }
  },
});

// Helper function to calculate payment distribution
function calculateDistribution(amount: number) {
  return {
    leaderboard: Number((amount * PAYMENT_DISTRIBUTION.leaderboard).toFixed(6)),
    devWallet: Number((amount * PAYMENT_DISTRIBUTION.devWallet).toFixed(6)),
    nftStaking: Number((amount * PAYMENT_DISTRIBUTION.nftStaking).toFixed(6)),
    reserve: Number((amount * PAYMENT_DISTRIBUTION.reserve).toFixed(6)),
    total: amount,
  };
}

// Execute blockchain payment with proper error handling
async function executePayment(
  contract: ethers.Contract,
  userWallet: string,
  distribution: ReturnType<typeof calculateDistribution>,
  currency: "USDC" | "S"
): Promise<string> {
  try {
    // Call smart contract function for payment distribution
    const tx = await contract.processPayment(
      userWallet,
      [
        { wallet: WALLETS.leaderboard, amount: ethers.parseUnits(distribution.leaderboard.toString(), 18) },
        { wallet: WALLETS.devWallet, amount: ethers.parseUnits(distribution.devWallet.toString(), 18) },
        { wallet: WALLETS.nftStaking, amount: ethers.parseUnits(distribution.nftStaking.toString(), 18) },
        { wallet: WALLETS.reserve, amount: ethers.parseUnits(distribution.reserve.toString(), 18) },
      ],
      currency === "USDC" ? 0 : 1 // 0 for USDC, 1 for S token
    );

    // Wait for transaction confirmation
    const receipt = await tx.wait(2); // Wait for 2 confirmations
    return receipt.hash;
  } catch (error) {
    console.error("Blockchain transaction failed:", error);
    throw new Error(`Payment transaction failed: ${(error as Error).message}`);
  }
}

// Upload generated content to R2 storage
async function uploadContentToR2(
  contentId: string,
  contentType: "image" | "video",
  userId: string
): Promise<string> {
  const r2Client = getR2Client();

  // Generate appropriate path based on content type
  const key = r2Client.generateUserPath(
    userId,
    "generated",
    `${contentId}.${contentType === "image" ? "webp" : "mp4"}`
  );

  // For this example, we assume the content is already stored locally
  // In production, this would fetch from a temporary storage
  const contentPath = `/tmp/generated/${contentId}`;

  // Upload to R2 (implementation depends on how content is stored)
  // This is a placeholder - actual implementation would read the file
  const result = await r2Client.uploadFile(key, Buffer.from("placeholder"), {
    contentType: contentType === "image" ? "image/webp" : "video/mp4",
    metadata: {
      contentId,
      userId,
      generatedAt: new Date().toISOString(),
    },
  });

  return result.url;
}

// Record payment transaction in database
async function recordPaymentTransaction(transactionData: any) {
  // This would integrate with Supabase via MCP
  // Placeholder for database recording
  console.log("Recording payment transaction:", transactionData);

  // In production, this would call Supabase MCP tool
  // await supabase.from('payments').insert(transactionData);
}

// Payment contract ABI (simplified)
const PAYMENT_CONTRACT_ABI = [
  {
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "distributions", "type": "tuple[]",
        "components": [
          { "name": "wallet", "type": "address" },
          { "name": "amount", "type": "uint256" }
        ]
      },
      { "name": "tokenType", "type": "uint8" }
    ],
    "name": "processPayment",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];