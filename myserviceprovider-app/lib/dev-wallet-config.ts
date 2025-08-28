// Development wallet configuration
// These wallets get free premium generations without payment

export const DEV_WALLETS = [
  // Add your dev/team wallet addresses here (lowercase)
  // Main app/dev wallet from environment
  process.env.NEXT_PUBLIC_DEV_WALLET_ADDRESS?.toLowerCase() || "",
  // Backup dev wallets - add manually here
  // "0x1234567890abcdef1234567890abcdef12345678".toLowerCase(),
].filter(addr => addr && addr !== "");

// Development mode - if true, shows which wallet is connected for easy identification
export const DEV_MODE = process.env.NODE_ENV === 'development';

export function isDevWallet(address: string | undefined): boolean {
  if (!address) return false;
  return DEV_WALLETS.includes(address.toLowerCase());
}

export function getDevWalletInfo(address: string | undefined) {
  if (!address) return null;
  
  const isDevAddr = isDevWallet(address);
  return {
    isDev: isDevAddr,
    hasFreePremium: isDevAddr,
    reason: isDevAddr ? 'Development wallet - free premium access' : null
  };
}