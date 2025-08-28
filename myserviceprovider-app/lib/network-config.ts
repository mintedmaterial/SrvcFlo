import { type Address, defineChain } from "viem"

export type NetworkKey = "testnet" | "mainnet"

// Sonic Mainnet (id 146)
export const SONIC_MAINNET = defineChain({
  id: 146,
  name: "Sonic",
  nativeCurrency: { name: "Sonic", symbol: "S", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.soniclabs.com"] } },
  blockExplorers: { default: { name: "SonicScan", url: "https://sonicscan.org" } },
  contracts: {
    multicall3: {
      // typical Multicall3 deployment, replace if different on mainnet
      address: "0xcA11bde05977b3631167028862bE2a173976CA11" as Address,
    },
  },
})

// Sonic Blaze Testnet (id 57054)
export const SONIC_BLAZE_TESTNET = defineChain({
  id: 57054,
  name: "Sonic Blaze Testnet",
  nativeCurrency: { name: "Sonic", symbol: "S", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.blaze.soniclabs.com"] } },
  blockExplorers: { default: { name: "SonicScan", url: "https://testnet.sonicscan.org" } },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11" as Address,
    },
  },
})

// Per-network onchain addresses.
export const ADDRESS_BOOK: Record<
  NetworkKey,
  {
    USDC?: Address
    WS_TOKEN?: Address
    S_TOKEN?: Address
    SONIC_SFC?: Address
    MULTICALL3?: Address
    PAYMENT?: Address
    CREDITS_ERC1155?: Address
    STAKING_CONTRACT?: Address
    CREDIT_TOKEN_ID?: bigint
    explorerBase: string
  }
> = {
  testnet: {
    USDC: "0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6" as Address, // Blaze USDC
    WS_TOKEN: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38" as Address, // wS token (same on both networks)
    S_TOKEN: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38" as Address, // wS token (wrapped Sonic)
    MULTICALL3: "0xcA11bde05977b3631167028862bE2a173976CA11" as Address, // Standard Multicall3
    PAYMENT: "0x0000000000000000000000000000000000000000" as Address, // TODO: Deploy to testnet
    CREDITS_ERC1155: "0x0000000000000000000000000000000000000000" as Address, // TODO: Deploy to testnet
    STAKING_CONTRACT: "0x0000000000000000000000000000000000000000" as Address, // TODO: Deploy to testnet
    CREDIT_TOKEN_ID: 1n, // default credits token id
    explorerBase: "https://testnet.sonicscan.org",
  },
  mainnet: {
    USDC: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894" as Address, // Sonic Mainnet USDC
    WS_TOKEN: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38" as Address, // Wrapped Sonic (wS)
    S_TOKEN: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38" as Address, // Wrapped Sonic (wS) - same address
    SONIC_SFC: "0xFC00FACE00000000000000000000000000000000" as Address, // Sonic SFC contract
    MULTICALL3: "0xcA11bde05977b3631167028862bE2a173976CA11" as Address, // Multicall3
    PAYMENT: "0x09575A8046048816317C41f9Cf37267E8486bb9b" as Address, // DEPLOYED V2: SonicMainnetPaymentV2 (Dual Credit System)
    CREDITS_ERC1155: "0x6B57563377181967C468002Cb11566c561f8DAc6" as Address, // DEPLOYED V2: SrvcfloCreditsNFTMainnet
    STAKING_CONTRACT: "0x103ce561d5137f137c9A86670812287B1B258499" as Address, // DEPLOYED V2: SrvcfloMultiCollectionStaking
    CREDIT_TOKEN_ID: 1n,
    explorerBase: "https://sonicscan.org",
  },
}

// Chain ID constants
export const SONIC_TESTNET_CHAIN_ID = 57054
export const SONIC_MAINNET_CHAIN_ID = 146

export function getChainConfig(network: NetworkKey) {
  return network === "testnet" ? SONIC_BLAZE_TESTNET : SONIC_MAINNET
}

export function getAddressesForNetwork(network: NetworkKey) {
  return ADDRESS_BOOK[network]
}

// Network utility functions for ai-generation.tsx compatibility
export function getNetworkConfig(chainId: number) {
  if (chainId === SONIC_TESTNET_CHAIN_ID) {
    return { ...SONIC_BLAZE_TESTNET, addresses: ADDRESS_BOOK.testnet }
  }
  if (chainId === SONIC_MAINNET_CHAIN_ID) {
    return { ...SONIC_MAINNET, addresses: ADDRESS_BOOK.mainnet }
  }
  return null
}

export function getSafeNetworkConfig(chainId: number) {
  const config = getNetworkConfig(chainId)
  return config || { 
    ...SONIC_BLAZE_TESTNET, 
    addresses: ADDRESS_BOOK.testnet,
    name: "Unknown Network"
  }
}

export function isSonicNetwork(chainId: number): boolean {
  return chainId === SONIC_TESTNET_CHAIN_ID || chainId === SONIC_MAINNET_CHAIN_ID
}

export function isTestnet(chainId: number): boolean {
  return chainId === SONIC_TESTNET_CHAIN_ID
}

export function isMainnet(chainId: number): boolean {
  return chainId === SONIC_MAINNET_CHAIN_ID
}

export function getNetworkDisplayName(chainId: number): string {
  if (chainId === SONIC_TESTNET_CHAIN_ID) return "Sonic Blaze Testnet"
  if (chainId === SONIC_MAINNET_CHAIN_ID) return "Sonic Mainnet"
  return "Unknown Network"
}

export function validateNetworkConfig(config: any): boolean {
  return config && config.addresses && config.addresses.USDC && config.addresses.WS_TOKEN
}

export function isMainnetContractsDeployed(): boolean {
  return ADDRESS_BOOK.mainnet.PAYMENT !== "0x0000000000000000000000000000000000000000"
}

// Contract ABIs
export const ERC20_ABI = [
  {
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
  {
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "remaining", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
  {
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "success", type: "bool" }],
    type: "function",
    stateMutability: "nonpayable",
  },
] as const

export function getPaymentContractABI() {
  return [
    {
      inputs: [{ name: "packageId", type: "uint256" }],
      name: "purchaseCreditsWithUSDC",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ name: "packageId", type: "uint256" }],
      name: "purchaseCreditsWithWS",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ name: "user", type: "address" }],
      name: "getUserCredits",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ] as const
}

export const NFT_CONTRACT_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenURI", type: "string" },
    ],
    name: "safeMint",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const