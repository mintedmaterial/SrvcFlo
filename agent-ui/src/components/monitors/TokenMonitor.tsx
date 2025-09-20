'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Users,
  Eye,
  Star,
  AlertTriangle,
  BarChart3,
  Plus,
  RefreshCw
} from 'lucide-react';

interface TokenData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  holders: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  riskScore: number;
  trending: boolean;
  logo?: string;
  analysis?: string;
}

// Mock data for Sonic ecosystem tokens
const mockTokens: TokenData[] = [
  {
    id: 'sonic',
    name: 'Sonic',
    symbol: 'S',
    price: 0.75,
    change24h: 12.5,
    volume24h: 2500000,
    marketCap: 18750000,
    liquidity: 5600000,
    holders: 15420,
    sentiment: 'bullish',
    riskScore: 25,
    trending: true,
    analysis: 'Strong ecosystem growth with increasing TVL and user adoption.'
  },
  {
    id: 'sonicswap',
    name: 'SonicSwap',
    symbol: 'SWAP',
    price: 0.45,
    change24h: -2.3,
    volume24h: 850000,
    marketCap: 4500000,
    liquidity: 1200000,
    holders: 3200,
    sentiment: 'neutral',
    riskScore: 35,
    trending: false,
    analysis: 'Primary DEX showing steady trading volume with potential for growth.'
  },
  {
    id: 'paintswap',
    name: 'PaintSwap',
    symbol: 'BRUSH',
    price: 0.028,
    change24h: 8.7,
    volume24h: 125000,
    marketCap: 280000,
    liquidity: 85000,
    holders: 890,
    sentiment: 'bullish',
    riskScore: 45,
    trending: true,
    analysis: 'NFT marketplace token benefiting from increased NFT activity.'
  },
  {
    id: 'equalizer',
    name: 'Equalizer',
    symbol: 'EQUAL',
    price: 0.12,
    change24h: -0.8,
    volume24h: 320000,
    marketCap: 1200000,
    liquidity: 450000,
    holders: 1850,
    sentiment: 'neutral',
    riskScore: 40,
    trending: false,
    analysis: 'Stable DEX protocol with consistent yield farming opportunities.'
  }
];

export default function TokenMonitor() {
  const [tokens, setTokens] = useState<TokenData[]>(mockTokens);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(tokens[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set(['sonic', 'paintswap']));

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      // Update prices with random changes
      setTokens(prev => prev.map(token => ({
        ...token,
        price: token.price * (1 + (Math.random() - 0.5) * 0.02),
        change24h: token.change24h + (Math.random() - 0.5) * 2
      })));
      setIsRefreshing(false);
    }, 1000);
  };

  const toggleWatchlist = (tokenId: string) => {
    setWatchlist(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        newSet.add(tokenId);
      }
      return newSet;
    });
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400 border-green-400';
      case 'bearish': return 'text-red-400 border-red-400';
      default: return 'text-yellow-400 border-yellow-400';
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'text-green-400';
    if (score <= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Sonic Ecosystem Tokens</h2>
          <p className="text-slate-400 mt-2">Real-time token analysis and market intelligence</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            variant="outline"
            className="bg-slate-800/50 border-slate-600 text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-cyan-500">
            <Plus className="h-4 w-4 mr-2" />
            Add Token
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token List */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tracked Tokens
              </CardTitle>
              <CardDescription>
                {tokens.length} tokens • {watchlist.size} in watchlist
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 p-4">
                  {tokens.map((token) => (
                    <motion.button
                      key={token.id}
                      onClick={() => setSelectedToken(token)}
                      whileHover={{ scale: 1.02 }}
                      className={`w-full text-left p-4 rounded-lg transition-all ${
                        selectedToken?.id === token.id
                          ? 'bg-blue-600/20 border border-blue-500/30'
                          : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {token.symbol.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-white">{token.name}</div>
                            <div className="text-xs text-slate-400">{token.symbol}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {token.trending && (
                            <TrendingUp className="h-4 w-4 text-orange-400" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatchlist(token.id);
                            }}
                            className={`p-1 rounded transition-colors ${
                              watchlist.has(token.id)
                                ? 'text-yellow-400 hover:text-yellow-300'
                                : 'text-slate-500 hover:text-yellow-400'
                            }`}
                          >
                            <Star className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold text-white">
                            ${token.price.toFixed(4)}
                          </div>
                          <div className="flex items-center gap-1">
                            {token.change24h >= 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-400" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-400" />
                            )}
                            <span className={`text-xs ${
                              token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-slate-400">24h Volume</div>
                          <div className="text-sm text-slate-200">
                            {formatCurrency(token.volume24h)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Badge variant="outline" className={`text-xs ${getSentimentColor(token.sentiment)}`}>
                          {token.sentiment}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getRiskColor(token.riskScore)}`}>
                          Risk: {token.riskScore}
                        </Badge>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Detailed View */}
        <div className="lg:col-span-2 space-y-6">
          {selectedToken && (
            <>
              {/* Token Overview */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                        {selectedToken.symbol.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{selectedToken.name}</CardTitle>
                        <CardDescription>${selectedToken.symbol}</CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">
                        ${selectedToken.price.toFixed(4)}
                      </div>
                      <div className="flex items-center gap-1">
                        {selectedToken.change24h >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-400" />
                        )}
                        <span className={`text-lg ${
                          selectedToken.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {selectedToken.change24h >= 0 ? '+' : ''}{selectedToken.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <DollarSign className="h-4 w-4" />
                        Market Cap
                      </div>
                      <div className="text-xl font-semibold text-white">
                        {formatCurrency(selectedToken.marketCap)}
                      </div>
                    </div>

                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Activity className="h-4 w-4" />
                        24h Volume
                      </div>
                      <div className="text-xl font-semibold text-white">
                        {formatCurrency(selectedToken.volume24h)}
                      </div>
                    </div>

                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Users className="h-4 w-4" />
                        Holders
                      </div>
                      <div className="text-xl font-semibold text-white">
                        {selectedToken.holders.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Eye className="h-4 w-4" />
                        Liquidity
                      </div>
                      <div className="text-xl font-semibold text-white">
                        {formatCurrency(selectedToken.liquidity)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Analysis */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Risk Analysis
                  </CardTitle>
                  <CardDescription>
                    AI-powered risk assessment and market sentiment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Risk Score</span>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={selectedToken.riskScore}
                        className="w-32"
                      />
                      <span className={`font-semibold ${getRiskColor(selectedToken.riskScore)}`}>
                        {selectedToken.riskScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Market Sentiment</span>
                    <Badge variant="outline" className={getSentimentColor(selectedToken.sentiment)}>
                      {selectedToken.sentiment.toUpperCase()}
                    </Badge>
                  </div>

                  {selectedToken.analysis && (
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <h4 className="font-medium text-white mb-2">AI Analysis</h4>
                      <p className="text-sm text-slate-300">{selectedToken.analysis}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}