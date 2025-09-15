"use client";

import { Web3AuthProvider, type Web3AuthContextConfig } from "@web3auth/modal/react";
import { IWeb3AuthState, WEB3AUTH_NETWORK } from "@web3auth/modal";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || ""; // get from https://dashboard.web3auth.io

const queryClient = new QueryClient();
 
const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    ssr: true,
    chainConfig: {
      chainNamespace: "eip155",
      chainId: "0x92", // Sonic mainnet (146 in hex)
      rpcTarget: "https://rpc.soniclabs.com",
      displayName: "Sonic Mainnet",
      blockExplorerUrl: "https://sonicscan.org",
      ticker: "S",
      tickerName: "Sonic",
      logo: "https://cryptologos.cc/logos/sonic-sonic-logo.png",
    },
  }
};

export default function Web3AuthProviderWrapper({ 
  children, 
  web3authInitialState 
}: { 
  children: React.ReactNode, 
  web3authInitialState: IWeb3AuthState | undefined 
}) {
  return (
    <Web3AuthProvider config={web3AuthContextConfig} initialState={web3authInitialState}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}