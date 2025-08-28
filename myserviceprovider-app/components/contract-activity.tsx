// components/contract-activity.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContractEvents, useMultiContractEvents } from "@/hooks/useContractEvents";
import { useActiveAccount } from "thirdweb/react";
import { 
  Activity, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  Zap, 
  Vote, 
  Coins, 
  Trophy,
  Image,
  Video,
  Star
} from "lucide-react";

const CONTRACT_ADDRESSES = {
  payment: process.env.NEXT_PUBLIC_SONIC_PAYMENT_CONTRACT || "",
  voting: process.env.NEXT_PUBLIC_SONIC_VOTING_CONTRACT || "",
  staking: process.env.NEXT_PUBLIC_SONIC_STAKING_CONTRACT || "",
  nft: process.env.NEXT_PUBLIC_SONIC_BANDIT_KIDZ_NFT || "0x6988c29f8c0051d261f288c2c497a592e2d1061f",
};

const EVENT_ICONS = {
  PaymentReceived: Coins,
  GenerationRequested: Image,
  GenerationCompleted: Video,
  VoteCast: Vote,
  GenerationSubmitted: Trophy,
  Staked: Star,
  Unstaked: Star,
  Transfer: Zap,
} as const;

const EVENT_COLORS = {
  PaymentReceived: "bg-green-500/10 text-green-400 border-green-500/20",
  GenerationRequested: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  GenerationCompleted: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  VoteCast: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  GenerationSubmitted: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Staked: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Unstaked: "bg-red-500/10 text-red-400 border-red-500/20",
  Transfer: "bg-gray-500/10 text-gray-400 border-gray-500/20",
} as const;

function formatEventArgs(args: Record<string, any>) {
  const formatted: Record<string, string> = {};
  
  Object.keys(args).forEach(key => {
    const value = args[key];
    if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
      // Address - show shortened version
      formatted[key] = `${value.slice(0, 6)}...${value.slice(-4)}`;
    } else if (typeof value === 'bigint' || (typeof value === 'string' && /^\d+$/.test(value))) {
      // Number - format appropriately
      const num = BigInt(value);
      if (num > 1000000000000000000n) { // > 1 ether
        formatted[key] = `${(Number(num) / 1e18).toFixed(4)} tokens`;
      } else {
        formatted[key] = num.toString();
      }
    } else if (typeof value === 'string') {
      // String - truncate if too long
      formatted[key] = value.length > 50 ? `${value.slice(0, 50)}...` : value;
    } else {
      formatted[key] = String(value);
    }
  });
  
  return formatted;
}

interface EventCardProps {
  event: any;
  showContract?: boolean;
}

function EventCard({ event, showContract = false }: EventCardProps) {
  const Icon = EVENT_ICONS[event.eventName as keyof typeof EVENT_ICONS] || Activity;
  const colorClass = EVENT_COLORS[event.eventName as keyof typeof EVENT_COLORS] || EVENT_COLORS.Transfer;
  const formattedArgs = formatEventArgs(event.args || {});
  
  return (
    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-sm">{event.eventName}</div>
            {showContract && (
              <div className="text-xs text-gray-400">
                Contract: {event.address?.slice(0, 6)}...{event.address?.slice(-4)}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-gray-400">
            Block #{event.blockNumber}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(parseInt(event.timestamp) * 1000).toLocaleString()}
          </div>
        </div>
      </div>
      
      {Object.keys(formattedArgs).length > 0 && (
        <div className="space-y-1">
          {Object.entries(formattedArgs).map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-gray-400 capitalize">{key}:</span>
              <span className="text-gray-300 font-mono">{value}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/50">
        <Badge variant="outline" className="text-xs">
          {event.eventName}
        </Badge>
        
        <a
          href={`https://testnet.sonicscan.org/tx/${event.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
        >
          View TX <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

export function ContractActivity() {
  const account = useActiveAccount();
  const [selectedContract, setSelectedContract] = useState<string>("all");
  
  const contracts = [
    { address: CONTRACT_ADDRESSES.payment, name: "payment" },
    { address: CONTRACT_ADDRESSES.voting, name: "voting" },
    { address: CONTRACT_ADDRESSES.staking, name: "staking" },
    { address: CONTRACT_ADDRESSES.nft, name: "nft" },
  ].filter(c => c.address);

  const { contractsData, refetchAll, isLoading } = useMultiContractEvents(contracts);
  
  // Combine all events from all contracts
  const allEvents = Object.values(contractsData)
    .flatMap(data => data.events.map(event => ({ ...event, contractName: data })))
    .sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));
  
  const userEvents = allEvents.filter(event => {
    if (!account?.address) return false;
    const args = event.args || {};
    return Object.values(args).some(value => 
      typeof value === 'string' && 
      value.toLowerCase() === account.address!.toLowerCase()
    );
  });

  if (!account) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400">Connect your wallet to view contract activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Contract Activity</h2>
        <Button
          onClick={refetchAll}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="border-gray-600"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="user" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
          <TabsTrigger value="user">My Activity</TabsTrigger>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="contracts">By Contract</TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Your Activity ({userEvents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4" />
                  <p>No activity found for your wallet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {userEvents.slice(0, 20).map((event, index) => (
                    <EventCard key={`${event.transactionHash}-${index}`} event={event} showContract />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                All Contract Events ({allEvents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4" />
                  <p>No events found</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {allEvents.slice(0, 50).map((event, index) => (
                    <EventCard key={`${event.transactionHash}-${index}`} event={event} showContract />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <div className="grid gap-4">
            {contracts.map(contract => {
              const data = contractsData[contract.name];
              if (!data) return null;

              return (
                <Card key={contract.name} className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        {contract.name.charAt(0).toUpperCase() + contract.name.slice(1)} Contract
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {data.events.length} events
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-400 font-mono">
                      {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {data.loading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
                      </div>
                    ) : data.error ? (
                      <div className="text-center py-8 text-red-400">
                        <p>Error: {data.error}</p>
                      </div>
                    ) : data.events.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="h-8 w-8 mx-auto mb-2" />
                        <p>No events found</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {data.events.slice(0, 10).map((event, index) => (
                          <EventCard key={`${event.transactionHash}-${index}`} event={event} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}