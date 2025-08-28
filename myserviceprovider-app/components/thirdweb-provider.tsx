"use client";

import { createThirdwebClient } from "thirdweb";
import { ThirdwebProvider } from "thirdweb/react";
import { defineChain } from "thirdweb";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
  secretKey: process.env.THIRDWEB_SECRET_KEY || "",
});

// Properly define Sonic testnet as ThirdWeb chain
export const sonicTestnet = defineChain({
  id: 57054,
  name: "Sonic Blaze Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Sonic",
    symbol: "S",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.blaze.soniclabs.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Sonic Testnet Explorer",
      url: "https://testnet.sonicscan.org",
    },
  },
});

// Properly define Sonic mainnet as ThirdWeb chain
export const sonicMainnet = defineChain({
  id: 146,
  name: "Sonic Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "Sonic",
    symbol: "S",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.soniclabs.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Sonic Explorer",
      url: "https://sonicscan.org",
    },
  },
});

export { client };

export default function ThirdwebProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  );
}