// hooks/useContractEvents.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';

interface ContractEvent {
  eventName: string;
  signature: string;
  blockNumber: string;
  transactionHash: string;
  timestamp: string;
  args: Record<string, any>;
  decodedLog?: any;
}

interface ContractTransaction {
  hash: string;
  blockNumber: string;
  timestamp: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  status: 'success' | 'failed';
  decodedFunctionCall?: {
    functionName: string;
    args: Record<string, any>;
  };
}

interface UseContractEventsProps {
  address: string;
  chainId?: number;
  eventSignatures?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useContractEvents({
  address,
  chainId = 57054,
  eventSignatures = [],
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: UseContractEventsProps) {
  const account = useActiveAccount();
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [transactions, setTransactions] = useState<ContractTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/contracts/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          chainId,
          eventSignatures,
          userAddress: account?.address,
          limit: 50
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events);
        setLastRefresh(new Date());
      } else {
        setError(data.error || 'Failed to fetch events');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [address, chainId, eventSignatures, account?.address]);

  const fetchTransactions = useCallback(async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/contracts/transactions?address=${address}&chainId=${chainId}&decode=true&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  }, [address, chainId]);

  // Fetch events and transactions on mount and when dependencies change
  useEffect(() => {
    fetchEvents();
    fetchTransactions();
  }, [fetchEvents, fetchTransactions]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchEvents();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchEvents]);

  const getUserEvents = useCallback((userAddress?: string) => {
    const targetAddress = userAddress || account?.address;
    if (!targetAddress) return [];

    return events.filter(event => {
      const args = event.args || {};
      return Object.values(args).some(value => 
        typeof value === 'string' && 
        value.toLowerCase() === targetAddress.toLowerCase()
      );
    });
  }, [events, account?.address]);

  const getEventsByType = useCallback((eventName: string) => {
    return events.filter(event => event.eventName === eventName);
  }, [events]);

  const getUserTransactions = useCallback((userAddress?: string) => {
    const targetAddress = userAddress || account?.address;
    if (!targetAddress) return [];

    return transactions.filter(tx => 
      tx.from.toLowerCase() === targetAddress.toLowerCase() ||
      tx.to.toLowerCase() === targetAddress.toLowerCase()
    );
  }, [transactions, account?.address]);

  return {
    events,
    transactions,
    loading,
    error,
    lastRefresh,
    refetch: fetchEvents,
    getUserEvents,
    getEventsByType,
    getUserTransactions,
  };
}

// Hook for multiple contracts
export function useMultiContractEvents(contracts: { address: string; name: string }[]) {
  const account = useActiveAccount();
  const [contractsData, setContractsData] = useState<Record<string, {
    events: ContractEvent[];
    transactions: ContractTransaction[];
    loading: boolean;
    error: string | null;
  }>>({});

  const fetchAllData = useCallback(async () => {
    const updates: typeof contractsData = {};
    
    for (const contract of contracts) {
      updates[contract.name] = {
        events: [],
        transactions: [],
        loading: true,
        error: null
      };
    }
    setContractsData(updates);

    // Fetch events for all contracts
    try {
      const eventsResponse = await fetch('/api/contracts/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addresses: contracts.map(c => c.address),
          chainId: 57054,
          userAddress: account?.address
        })
      });

      const eventsData = await eventsResponse.json();
      
      // Fetch transactions for all contracts
      const transactionsResponse = await fetch('/api/contracts/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addresses: contracts.map(c => c.address),
          chainId: 57054
        })
      });

      const transactionsData = await transactionsResponse.json();

      // Update state with results
      const finalUpdates: typeof contractsData = {};
      
      contracts.forEach(contract => {
        const contractEvents = eventsData.success ? 
          (eventsData.results?.find((r: any) => r.address === contract.address)?.events || []) : [];
        const contractTransactions = transactionsData.success ? 
          (transactionsData.results?.find((r: any) => r.address === contract.address)?.transactions || []) : [];
        
        finalUpdates[contract.name] = {
          events: contractEvents,
          transactions: contractTransactions,
          loading: false,
          error: null
        };
      });
      
      setContractsData(finalUpdates);

    } catch (error) {
      // Set error for all contracts
      const errorUpdates: typeof contractsData = {};
      contracts.forEach(contract => {
        errorUpdates[contract.name] = {
          events: [],
          transactions: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      });
      setContractsData(errorUpdates);
    }
  }, [contracts, account?.address]);

  useEffect(() => {
    if (contracts.length > 0) {
      fetchAllData();
    }
  }, [fetchAllData]);

  return {
    contractsData,
    refetchAll: fetchAllData,
    isLoading: Object.values(contractsData).some(data => data.loading),
    hasErrors: Object.values(contractsData).some(data => data.error !== null)
  };
}