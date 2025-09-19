"use client";

import React from "react";
import {
  GelatoSmartWalletDynamicContextProvider,
  GelatoDynamicWidget,
} from "@gelatonetwork/smartwallet-react-dynamic";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

// Gelato API Configuration
const GELATO_API_KEY = "TsgwMBO13xkB_0duYbpzoK4dMuAdUG4iAIxKSL1yyuo_";
const DYNAMIC_ENVIRONMENT_ID = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || "6a521bed-ec42-40cd-973d-610eedea1bf4";

interface GelatoSmartWalletProviderProps {
  children: React.ReactNode;
}

export default function GelatoSmartWalletProvider({ children }: GelatoSmartWalletProviderProps) {
  return (
    <GelatoSmartWalletDynamicContextProvider
      settings={{
        environmentId: DYNAMIC_ENVIRONMENT_ID,
        walletConnectors: [EthereumWalletConnectors],
        apiKey: GELATO_API_KEY,
        // Sonic network configuration
        evmNetworks: [
          {
            chainId: 146, // Sonic Mainnet
            name: "Sonic Mainnet",
            rpcUrl: process.env.NEXT_PUBLIC_DRPC_HTTP_URL || "https://lb.drpc.org/sonic/Av0tqtt4908GitCEzvNhURHIfJgThf0R8Id1qhnKxixj",
            nativeCurrency: {
              name: "Sonic",
              symbol: "S",
              decimals: 18,
            },
            blockExplorerUrl: "https://sonicscan.org",
          },
          {
            chainId: 57054, // Sonic Testnet
            name: "Sonic Blaze Testnet", 
            rpcUrl: "https://rpc.blaze.soniclabs.com",
            nativeCurrency: {
              name: "Sonic",
              symbol: "S",
              decimals: 18,
            },
            blockExplorerUrl: "https://testnet.sonicscan.org",
          },
        ],
      }}
    >
      <div className="gelato-smart-wallet-container">
        {children}
      </div>
    </GelatoSmartWalletDynamicContextProvider>
  );
}

// Export Gelato widget for use in authentication flows
export { GelatoDynamicWidget };