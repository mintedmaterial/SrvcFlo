'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Palette,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Star,
  RefreshCw,
  ExternalLink,
  Zap,
  Crown,
  Activity
} from 'lucide-react';

interface NFTCollection {
  id: string;
  name: string;
  description: string;
  floorPrice: number;
  volume24h: number;
  volume7d: number;
  totalSupply: number;
  holders: number;
  listedCount: number;
  change24h: number;
  trending: boolean;
  verified: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image: string;
  marketplace: 'paintswap' | 'other';
}

interface NFTItem {
  id: string;
  name: string;
  collection: string;
  price: number;
  rarity: number;
  image: string;
  traits: Record<string, string>;
  lastSale?: number;
  listed: boolean;
}

// Mock NFT collections data
const mockCollections: NFTCollection[] = [
  {
    id: 'bandit-kidz',
    name: 'Bandit Kidz',
    description: 'Original Sonic NFT collection with staking rewards',
    floorPrice: 45.5,
    volume24h: 1250,
    volume7d: 8500,
    totalSupply: 5000,
    holders: 2100,
    listedCount: 150,
    change24h: 12.3,
    trending: true,
    verified: true,
    rarity: 'legendary',
    image: 'https://media-paint.paintswap.finance/0x8500d84b203775fc8b418148223872b35c43b050-146-1734986837_thumb.png',
    marketplace: 'paintswap'
  },
  {
    id: 'sonic-punks',
    name: 'Sonic Punks',
    description: 'Pixel art collection on Sonic blockchain',
    floorPrice: 12.8,
    volume24h: 680,
    volume7d: 4200,
    totalSupply: 10000,
    holders: 3500,
    listedCount: 280,
    change24h: -2.1,
    trending: false,
    verified: true,
    rarity: 'epic',
    image: 'https://media-paint.paintswap.finance/0xc83f364827b9f0d7b27a9c48b2419e4a14e72f78-146-1735942291_thumb.png',
    marketplace: 'paintswap'
  },
  {
    id: 'crystal-gems',
    name: 'Crystal Gems',
    description: 'Mystical gems with utility in Sonic games',
    floorPrice: 8.2,
    volume24h: 340,
    volume7d: 2100,
    totalSupply: 7500,
    holders: 1800,
    listedCount: 420,
    change24h: 5.7,
    trending: true,
    verified: false,
    rarity: 'rare',
    image: 'https://media-paint.paintswap.finance/0x5d5bde4b25e43b32d6571bc630f0a6b11216b490-146-1754139071_thumb.png',
    marketplace: 'paintswap'
  },
  {
    id: 'sonic-spirits',
    name: 'Sonic Spirits',
    description: 'Ethereal beings with special powers',
    floorPrice: 6.5,
    volume24h: 180,
    volume7d: 1200,
    totalSupply: 3333,
    holders: 1200,
    listedCount: 95,
    change24h: -0.8,
    trending: false,
    verified: true,
    rarity: 'rare',
    image: 'https://media-paint.paintswap.finance/0xf20bd8b3a20a6d9884121d7a6e37a95a810183e2-146-1737630183_thumb.png',
    marketplace: 'paintswap'
  }
];

// Mock trending NFTs
const mockTrendingNFTs: NFTItem[] = [
  {
    id: 'bandit-001',
    name: 'Bandit Kidz #1337',
    collection: 'Bandit Kidz',
    price: 125.5,
    rarity: 98.5,
    image: 'https://media-paint.paintswap.finance/0x8500d84b203775fc8b418148223872b35c43b050-146-1734986837_thumb.png',
    traits: { 'Background': 'Legendary', 'Eyes': 'Laser', 'Hat': 'Crown' },
    lastSale: 98.2,
    listed: true
  },
  {
    id: 'punk-420',
    name: 'Sonic Punk #420',
    collection: 'Sonic Punks',
    price: 45.8,
    rarity: 89.2,
    image: 'https://media-paint.paintswap.finance/0xc83f364827b9f0d7b27a9c48b2419e4a14e72f78-146-1735942291_thumb.png',
    traits: { 'Type': 'Alien', 'Accessory': 'Pipe', 'Background': 'Purple' },
    lastSale: 38.5,
    listed: true
  }
];

export default function NFTMonitor() {
  const [collections, setCollections] = useState<NFTCollection[]>(mockCollections);
  const [selectedCollection, setSelectedCollection] = useState<NFTCollection | null>(collections[0]);
  const [trendingNFTs, setTrendingNFTs] = useState<NFTItem[]>(mockTrendingNFTs);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('collections');

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call to Paintswap
    setTimeout(() => {
      setCollections(prev => prev.map(collection => ({
        ...collection,
        floorPrice: collection.floorPrice * (1 + (Math.random() - 0.5) * 0.1),
        volume24h: collection.volume24h * (1 + (Math.random() - 0.5) * 0.2),
        change24h: collection.change24h + (Math.random() - 0.5) * 5
      })));
      setIsRefreshing(false);
    }, 1500);
  };

  const formatCurrency = (value: number) => {
    return `${value.toFixed(2)} S`;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-400 border-yellow-400';
      case 'epic': return 'text-purple-400 border-purple-400';
      case 'rare': return 'text-blue-400 border-blue-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">NFT Marketplace Monitor</h2>
          <p className="text-slate-400 mt-2">Paintswap marketplace analysis and trending collections</p>
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
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Paintswap
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md bg-slate-800/50">
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="collections" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Collections List */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Collections
                  </CardTitle>
                  <CardDescription>
                    {collections.length} collections tracked
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2 p-4">
                      {collections.map((collection) => (
                        <motion.button
                          key={collection.id}
                          onClick={() => setSelectedCollection(collection)}
                          whileHover={{ scale: 1.02 }}
                          className={`w-full text-left p-4 rounded-lg transition-all ${
                            selectedCollection?.id === collection.id
                              ? 'bg-purple-600/20 border border-purple-500/30'
                              : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <img
                                src={collection.image}
                                alt={collection.name}
                                className="w-12 h-12 rounded-lg object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" fill="%23475569"/><text x="24" y="28" text-anchor="middle" fill="white" font-size="20">${collection.name.charAt(0)}</text></svg>`;
                                }}
                              />
                              {collection.verified && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Crown className="h-2.5 w-2.5 text-white" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-white truncate">{collection.name}</h3>
                                {collection.trending && (
                                  <Zap className="h-4 w-4 text-orange-400 flex-shrink-0" />
                                )}
                              </div>

                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-white">
                                  Floor: {formatCurrency(collection.floorPrice)}
                                </span>
                                <div className="flex items-center gap-1">
                                  {collection.change24h >= 0 ? (
                                    <TrendingUp className="h-3 w-3 text-green-400" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 text-red-400" />
                                  )}
                                  <span className={`text-xs ${
                                    collection.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    {collection.change24h >= 0 ? '+' : ''}{collection.change24h.toFixed(1)}%
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2 mb-2">
                                <Badge variant="outline" className={`text-xs ${getRarityBadgeColor(collection.rarity)}`}>
                                  {collection.rarity}
                                </Badge>
                                <Badge variant="outline" className="text-xs text-slate-400 border-slate-500">
                                  {collection.marketplace}
                                </Badge>
                              </div>

                              <div className="text-xs text-slate-400">
                                Vol: {formatCurrency(collection.volume24h)} • {collection.holders} holders
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Collection Details */}
            <div className="lg:col-span-2 space-y-6">
              {selectedCollection && (
                <>
                  {/* Collection Overview */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={selectedCollection.image}
                              alt={selectedCollection.name}
                              className="w-16 h-16 rounded-xl object-cover"
                            />
                            <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${getRarityColor(selectedCollection.rarity)} opacity-20`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-2xl">{selectedCollection.name}</CardTitle>
                              {selectedCollection.verified && (
                                <Crown className="h-5 w-5 text-blue-400" />
                              )}
                              {selectedCollection.trending && (
                                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Trending
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="mt-1">
                              {selectedCollection.description}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">
                            {formatCurrency(selectedCollection.floorPrice)}
                          </div>
                          <div className="flex items-center gap-1">
                            {selectedCollection.change24h >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-400" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-400" />
                            )}
                            <span className={`text-sm ${
                              selectedCollection.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {selectedCollection.change24h >= 0 ? '+' : ''}{selectedCollection.change24h.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-700/30 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Activity className="h-4 w-4" />
                            24h Volume
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {formatCurrency(selectedCollection.volume24h)}
                          </div>
                        </div>

                        <div className="bg-slate-700/30 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Users className="h-4 w-4" />
                            Holders
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {selectedCollection.holders.toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-slate-700/30 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Palette className="h-4 w-4" />
                            Total Supply
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {selectedCollection.totalSupply.toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-slate-700/30 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Eye className="h-4 w-4" />
                            Listed
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {selectedCollection.listedCount}
                          </div>
                          <div className="text-xs text-slate-400">
                            {((selectedCollection.listedCount / selectedCollection.totalSupply) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest sales and listings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-slate-400">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Recent activity data would be displayed here</p>
                        <p className="text-sm mt-2">Integration with Paintswap API coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingNFTs.map((nft) => (
              <motion.div
                key={nft.id}
                whileHover={{ scale: 1.02 }}
                className="group"
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/30 transition-colors">
                  <CardHeader className="p-0">
                    <div className="relative">
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                        <span className="text-xs text-white font-medium">
                          Rarity: {nft.rarity}%
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white mb-1">{nft.name}</h3>
                    <p className="text-sm text-slate-400 mb-3">{nft.collection}</p>

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs text-slate-400">Current Price</div>
                        <div className="text-lg font-bold text-white">
                          {formatCurrency(nft.price)}
                        </div>
                      </div>
                      {nft.lastSale && (
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Last Sale</div>
                          <div className="text-sm text-slate-300">
                            {formatCurrency(nft.lastSale)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-slate-400">Traits:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(nft.traits).slice(0, 3).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {value}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500"
                      size="sm"
                    >
                      View on Paintswap
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Market Overview</CardTitle>
                <CardDescription>Sonic NFT ecosystem statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-300">Total Collections</span>
                    <span className="font-semibold text-white">{collections.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-300">Total Volume (24h)</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(collections.reduce((sum, col) => sum + col.volume24h, 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-300">Average Floor Price</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(collections.reduce((sum, col) => sum + col.floorPrice, 0) / collections.length)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Collections with highest 24h change</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {collections
                    .sort((a, b) => b.change24h - a.change24h)
                    .slice(0, 5)
                    .map((collection) => (
                      <div key={collection.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <img
                            src={collection.image}
                            alt={collection.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <span className="text-white font-medium">{collection.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {collection.change24h >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-400" />
                          )}
                          <span className={`font-semibold ${
                            collection.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {collection.change24h >= 0 ? '+' : ''}{collection.change24h.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}