// Wallet identification utility for dev setup
// Run this when connected to identify your wallet address for dev config

import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'
import { isDevWallet, DEV_WALLETS } from './dev-wallet-config'

export function useWalletIdentifier() {
  const { address, isConnected } = useAccount()

  const showWalletInfo = () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }

    const isDev = isDevWallet(address)
    
    // Show wallet info with copy functionality
    console.log('='.repeat(60))
    console.log('🔍 WALLET IDENTIFICATION')
    console.log('='.repeat(60))
    console.log('Connected Address:', address)
    console.log('Lowercase Address:', address.toLowerCase())
    console.log('Is Dev Wallet:', isDev ? '✅ YES' : '❌ NO')
    console.log('Current Dev Wallets:', DEV_WALLETS)
    console.log('='.repeat(60))
    
    if (!isDev) {
      console.log('📝 TO ADD THIS WALLET AS DEV:')
      console.log('1. Copy this address:', address.toLowerCase())
      console.log('2. Add to lib/dev-wallet-config.ts in DEV_WALLETS array')
      console.log('3. Replace "0xYourConnectedWallet" with your address')
      console.log('='.repeat(60))
    }

    toast.success(`Wallet info logged to console. Address: ${address.slice(0, 8)}...${address.slice(-6)}`)
    
    return {
      address,
      isDevWallet: isDev,
      formattedAddress: address.toLowerCase()
    }
  }

  return {
    address,
    isConnected,
    isDevWallet: isDevWallet(address),
    showWalletInfo
  }
}

// Standalone function for easy testing
export function logConnectedWallet(address?: string) {
  if (!address) {
    console.log('❌ No wallet address provided')
    return
  }

  console.log('\n' + '='.repeat(60))
  console.log('🔍 WALLET IDENTIFICATION')
  console.log('='.repeat(60))
  console.log('Address:', address)
  console.log('Lowercase:', address.toLowerCase())
  console.log('Is Dev Wallet:', isDevWallet(address) ? '✅ YES' : '❌ NO')
  console.log('\n📝 TO ADD AS DEV WALLET:')
  console.log(`"${address.toLowerCase()}",`)
  console.log('='.repeat(60) + '\n')
}

// Quick dev setup helper
export function generateDevWalletConfig(walletAddress: string) {
  const config = `// Development wallet configuration
// These wallets get free premium generations without payment

export const DEV_WALLETS = [
  // Add your dev/team wallet addresses here (lowercase)
  "${walletAddress.toLowerCase()}", // Your main dev wallet
  // Add more team wallets as needed
];

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
}`

  console.log('\n' + '='.repeat(60))
  console.log('📄 UPDATED DEV WALLET CONFIG')
  console.log('='.repeat(60))
  console.log(config)
  console.log('='.repeat(60))
  console.log('Copy this content to lib/dev-wallet-config.ts')
  console.log('='.repeat(60) + '\n')
  
  return config
}