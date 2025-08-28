// app/activity/page.tsx
"use client";

import { ContractActivity } from "@/components/contract-activity";
import { ClientOnlyWrapper } from "@/components/client-only-wrapper";
import { Loader2 } from "lucide-react";

const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-400" />
      <p className="text-gray-400">Loading contract activity...</p>
    </div>
  </div>
);

export default function ActivityPage() {
  return (
    <ClientOnlyWrapper fallback={<LoadingFallback />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Contract Activity
            </h1>
            <p className="text-gray-400 mt-2">
              Track all smart contract interactions and events on Sonic blockchain
            </p>
          </div>
          
          <ContractActivity />
        </div>
      </div>
    </ClientOnlyWrapper>
  );
}