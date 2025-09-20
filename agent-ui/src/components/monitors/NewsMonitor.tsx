'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Newspaper,
  ExternalLink,
  TrendingUp,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  source: string;
  author?: string;
  publishedAt: Date;
  category: 'DeFi' | 'NFT' | 'Gaming' | 'Infrastructure' | 'Partnerships' | 'Updates';
  sentiment: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
  trending: boolean;
  tags: string[];
  image?: string;
}

// Mock news data
const mockNews: NewsArticle[] = [
  {
    id: '1',
    title: 'Sonic Labs Announces Major Partnership with Leading DeFi Protocol',
    summary: 'Partnership aims to bring advanced yield farming capabilities to the Sonic ecosystem',
    content: 'Sonic Labs has announced a strategic partnership that will significantly expand DeFi offerings...',
    url: 'https://sonicforge.com/news/partnership-announcement',
    source: 'Sonic Forge',
    author: 'Sarah Chen',
    publishedAt: new Date('2024-01-15T10:30:00Z'),
    category: 'Partnerships',
    sentiment: 'positive',
    relevanceScore: 95,
    trending: true,
    tags: ['partnership', 'defi', 'yield-farming'],
    image: 'https://via.placeholder.com/400x200'
  },
  {
    id: '2',
    title: 'New NFT Marketplace Features Launch on Paintswap',
    summary: 'Enhanced trading features and lower fees announced for the leading Sonic NFT marketplace',
    content: 'Paintswap has unveiled significant updates including batch trading and reduced marketplace fees...',
    url: 'https://paintswap.finance/blog/new-features',
    source: 'Paintswap Blog',
    publishedAt: new Date('2024-01-14T15:45:00Z'),
    category: 'NFT',
    sentiment: 'positive',
    relevanceScore: 88,
    trending: true,
    tags: ['nft', 'marketplace', 'paintswap'],
    image: 'https://via.placeholder.com/400x200'
  },
  {
    id: '3',
    title: 'Sonic Network Processes Record Transaction Volume',
    summary: 'Network handles 2M+ transactions in 24 hours with minimal fees',
    content: 'The Sonic blockchain network achieved a new milestone processing over 2 million transactions...',
    url: 'https://sonic.network/blog/record-volume',
    source: 'Sonic Network',
    publishedAt: new Date('2024-01-14T09:20:00Z'),
    category: 'Infrastructure',
    sentiment: 'positive',
    relevanceScore: 92,
    trending: false,
    tags: ['network', 'transactions', 'milestone'],
    image: 'https://via.placeholder.com/400x200'
  },
  {
    id: '4',
    title: 'Gaming Integration Brings New Users to Sonic Ecosystem',
    summary: 'Popular blockchain game announces integration with Sonic for faster, cheaper gameplay',
    content: 'A major blockchain gaming platform has integrated with Sonic to provide players with improved performance...',
    url: 'https://cryptogaming.news/sonic-integration',
    source: 'Crypto Gaming News',
    author: 'Mike Rodriguez',
    publishedAt: new Date('2024-01-13T18:15:00Z'),
    category: 'Gaming',
    sentiment: 'positive',
    relevanceScore: 85,
    trending: false,
    tags: ['gaming', 'integration', 'users'],
    image: 'https://via.placeholder.com/400x200'
  },
  {
    id: '5',
    title: 'Market Analysis: Sonic Token Shows Strong Support Levels',
    summary: 'Technical analysis indicates bullish momentum building for SONIC token',
    content: 'Recent price action for the SONIC token suggests strong institutional support...',
    url: 'https://defianalyst.com/sonic-analysis',
    source: 'DeFi Analyst',
    author: 'Alex Thompson',
    publishedAt: new Date('2024-01-13T12:00:00Z'),
    category: 'DeFi',
    sentiment: 'positive',
    relevanceScore: 78,
    trending: false,
    tags: ['analysis', 'price', 'technical'],
    image: 'https://via.placeholder.com/400x200'
  }
];

export default function NewsMonitor() {
  const [articles, setArticles] = useState<NewsArticle[]>(mockNews);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>(mockNews);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const categories = ['all', 'DeFi', 'NFT', 'Gaming', 'Infrastructure', 'Partnerships', 'Updates'];

  // Filter articles based on search and category
  useEffect(() => {
    let filtered = articles;

    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Sort by relevance score and date
    filtered.sort((a, b) => {
      if (a.trending && !b.trending) return -1;
      if (!a.trending && b.trending) return 1;
      if (a.relevanceScore !== b.relevanceScore) return b.relevanceScore - a.relevanceScore;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    setFilteredArticles(filtered);
  }, [articles, searchTerm, selectedCategory]);

  const refreshNews = async () => {
    setIsRefreshing(true);
    // Simulate API call to news sources
    setTimeout(() => {
      // In real implementation, this would fetch from multiple sources
      setIsRefreshing(false);
    }, 2000);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400 border-green-400';
      case 'negative': return 'text-red-400 border-red-400';
      default: return 'text-yellow-400 border-yellow-400';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'DeFi': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'NFT': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Gaming': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Infrastructure': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Partnerships': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'Updates': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Sonic Ecosystem News
            </CardTitle>
            <CardDescription>Latest news and updates from verified sources</CardDescription>
          </div>
          <Button
            onClick={refreshNews}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="bg-slate-700/50 border-slate-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search news articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600 text-slate-200"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className={`text-xs ${
                  selectedCategory === category
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="space-y-4 p-6">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No articles found</p>
                <p className="text-sm mt-2">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              filteredArticles.map((article) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Article Image */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-slate-600 rounded-lg flex items-center justify-center">
                        <Newspaper className="h-8 w-8 text-slate-400" />
                      </div>
                    </div>

                    {/* Article Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getCategoryColor(article.category)}>
                            {article.category}
                          </Badge>
                          {article.trending && (
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Trending
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs ${getSentimentColor(article.sentiment)}`}>
                            {article.sentiment}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-400">
                          {article.relevanceScore}% relevant
                        </div>
                      </div>

                      <h3 className="font-semibold text-white mb-2 line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                        {article.summary}
                      </p>

                      {/* Article Meta */}
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(article.publishedAt)}
                          </span>
                          <span>{article.source}</span>
                          {article.author && <span>by {article.author}</span>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-blue-400 hover:text-blue-300"
                          onClick={() => window.open(article.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Read
                        </Button>
                      </div>

                      {/* Tags */}
                      {article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {article.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs bg-slate-800/50 border-slate-600 text-slate-400"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}