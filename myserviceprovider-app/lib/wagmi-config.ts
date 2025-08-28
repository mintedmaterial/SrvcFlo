import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors'

// Define Sonic Blaze Testnet chain
export const sonicTestnet = defineChain({
  id: 57054,
  name: 'Sonic Blaze Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.blaze.soniclabs.com'],
    },
    public: {
      http: ['https://rpc.blaze.soniclabs.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'SonicScan Testnet',
      url: 'https://testnet.sonicscan.org',
      apiUrl: 'https://api-testnet.sonicscan.org/api',
    },
  },
  testnet: true,
})

// Define Sonic Mainnet chain
export const sonicMainnet = defineChain({
  id: 146,
  name: 'Sonic',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.soniclabs.com'],
    },
    public: {
      http: ['https://rpc.soniclabs.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'SonicScan',
      url: 'https://sonicscan.org',
      apiUrl: 'https://api.sonicscan.org/api',
    },
  },
  testnet: false,
})

export const config = createConfig({
  chains: [sonicTestnet, sonicMainnet],
  connectors: [
    injected({
      target: {
        id: 'injected',
        name: 'Browser Wallet',
        provider: typeof window !== 'undefined' ? window.ethereum : undefined,
      },
    }),
    metaMask({
      dappMetadata: {
        name: 'ServiceFlow AI',
        url: 'https://serviceflowai.com',
      },
    }),
    coinbaseWallet({
      appName: 'ServiceFlow AI',
      appLogoUrl: 'https://serviceflowai.com/logo.png',
    }),
  ],
  transports: {
    [sonicTestnet.id]: http('https://rpc.blaze.soniclabs.com', {
      batch: true,
      timeout: 30000,
      retryCount: 3,
    }),
    [sonicMainnet.id]: http('https://rpc.soniclabs.com', {
      batch: true,
      timeout: 30000,
      retryCount: 3,
    }),
  },
  ssr: false, // Changed to false to fix client-side hydration issues
  multiInjectedProviderDiscovery: true,
})