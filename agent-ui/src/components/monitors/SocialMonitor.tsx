'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageCircle,
  Heart,
  Repeat2,
  ExternalLink,
  TrendingUp,
  Users,
  Hash,
  Clock,
  Activity,
  RefreshCw,
  Twitter,
  MessageSquare
} from 'lucide-react';

interface SocialPost {
  id: string;
  platform: 'discord' | 'twitter' | 'telegram';
  content: string;
  author: {
    name: string;
    username: string;
    avatar?: string;
    verified?: boolean;
  };
  timestamp: Date;
  engagement: {
    likes: number;
    retweets?: number;
    replies: number;
  };
  sentiment: 'positive' | 'negative' | 'neutral';
  trending: boolean;
  hashtags: string[];
  mentions: string[];
  url?: string;
  channel?: string;
}

interface TrendingTopic {
  topic: string;
  posts: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  change24h: number;
}

// Mock social media data
const mockPosts: SocialPost[] = [
  {
    id: '1',
    platform: 'discord',
    content: 'Just minted my first NFT on Paintswap! The gas fees are so much lower on Sonic compared to other chains. Loving this ecosystem! 🎨✨',
    author: {
      name: 'CryptoEnthusiast',
      username: 'crypto_fan_92',
      avatar: 'https://via.placeholder.com/40x40'
    },
    timestamp: new Date('2024-01-15T14:30:00Z'),
    engagement: {
      likes: 24,
      replies: 8
    },
    sentiment: 'positive',
    trending: true,
    hashtags: ['paintswap', 'sonic', 'nft'],
    mentions: [],
    channel: 'general'
  },
  {
    id: '2',
    platform: 'twitter',
    content: 'Sonic network handling 2M+ transactions with minimal fees is impressive. This kind of scalability is exactly what DeFi needs. $SONIC 🚀',
    author: {
      name: 'DeFi Researcher',
      username: 'defi_research',
      verified: true,
      avatar: 'https://via.placeholder.com/40x40'
    },
    timestamp: new Date('2024-01-15T12:15:00Z'),
    engagement: {
      likes: 156,
      retweets: 43,
      replies: 29
    },
    sentiment: 'positive',
    trending: true,
    hashtags: ['sonic', 'defi', 'scaling'],
    mentions: ['@SonicLabs'],
    url: 'https://twitter.com/defi_research/status/123456789'
  },
  {
    id: '3',
    platform: 'discord',
    content: 'When is the next community AMA? Would love to hear more about the upcoming partnerships and roadmap updates.',
    author: {
      name: 'SonicBuilder',
      username: 'sonic_builder',
      avatar: 'https://via.placeholder.com/40x40'
    },
    timestamp: new Date('2024-01-15T11:45:00Z'),
    engagement: {
      likes: 12,
      replies: 15
    },
    sentiment: 'neutral',
    trending: false,
    hashtags: ['ama', 'community'],
    mentions: [],
    channel: 'announcements'
  },
  {
    id: '4',
    platform: 'twitter',
    content: 'The Sonic ecosystem is really starting to take off! SonicSwap volumes are up 200% this week and new projects keep building. The future looks bright! ⚡',
    author: {
      name: 'BlockchainAnalyst',
      username: 'chain_analyst',
      avatar: 'https://via.placeholder.com/40x40'
    },
    timestamp: new Date('2024-01-15T09:20:00Z'),
    engagement: {
      likes: 89,
      retweets: 24,
      replies: 16
    },
    sentiment: 'positive',
    trending: false,
    hashtags: ['sonic', 'sonicswap', 'ecosystem'],
    mentions: [],
    url: 'https://twitter.com/chain_analyst/status/123456790'
  },
  {
    id: '5',
    platform: 'discord',
    content: 'Just deployed my first smart contract on Sonic testnet. The developer experience is really smooth and the documentation is comprehensive! 👨‍💻',
    author: {
      name: 'DevMaster',
      username: 'dev_master',
      avatar: 'https://via.placeholder.com/40x40'
    },
    timestamp: new Date('2024-01-15T08:30:00Z'),
    engagement: {
      likes: 18,
      replies: 6
    },
    sentiment: 'positive',
    trending: false,
    hashtags: ['development', 'testnet'],
    mentions: [],
    channel: 'developers'
  }
];

const mockTrendingTopics: TrendingTopic[] = [
  { topic: 'paintswap', posts: 156, sentiment: 'positive', change24h: 45 },
  { topic: 'sonic network', posts: 89, sentiment: 'positive', change24h: 23 },
  { topic: 'sonicswap', posts: 67, sentiment: 'positive', change24h: 12 },
  { topic: 'nft marketplace', posts: 34, sentiment: 'neutral', change24h: -5 },
  { topic: 'defi yields', posts: 28, sentiment: 'positive', change24h: 8 }
];

export default function SocialMonitor() {
  const [posts, setPosts] = useState<SocialPost[]>(mockPosts);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>(mockTrendingTopics);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const platforms = ['all', 'discord', 'twitter', 'telegram'];

  const filteredPosts = selectedPlatform === 'all'
    ? posts
    : posts.filter(post => post.platform === selectedPlatform);

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call to social media monitoring services
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes === 1) return '1 minute ago';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'discord': return <MessageSquare className="h-4 w-4" />;
      case 'telegram': return <MessageCircle className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'twitter': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'discord': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'telegram': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Social Sentiment Monitor
            </CardTitle>
            <CardDescription>Real-time social media monitoring and sentiment analysis</CardDescription>
          </div>
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="bg-slate-700/50 border-slate-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Platform Filter */}
        <div className="flex gap-2 pt-4">
          {platforms.map((platform) => (
            <Button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              variant={selectedPlatform === platform ? "default" : "outline"}
              size="sm"
              className={`text-xs capitalize ${
                selectedPlatform === platform
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
              }`}
            >
              {platform}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Trending Topics */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Topics
              </h3>
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <motion.div
                    key={topic.topic}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-700/30 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">#{topic.topic}</span>
                      <Badge variant="outline" className={`text-xs ${getSentimentColor(topic.sentiment)}`}>
                        {topic.sentiment}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{topic.posts} posts</span>
                      <div className="flex items-center gap-1">
                        {topic.change24h >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-400" />
                        ) : (
                          <TrendingUp className="h-3 w-3 text-red-400 rotate-180" />
                        )}
                        <span className={`text-xs ${
                          topic.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {topic.change24h >= 0 ? '+' : ''}{topic.change24h}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Social Posts */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Posts ({filteredPosts.length})
            </h3>
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-colors"
                  >
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={post.author.avatar} />
                          <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white text-sm">{post.author.name}</span>
                            {post.author.verified && (
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>@{post.author.username}</span>
                            {post.channel && (
                              <>
                                <span>•</span>
                                <span>#{post.channel}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPlatformColor(post.platform)}>
                          {getPlatformIcon(post.platform)}
                          <span className="ml-1 capitalize">{post.platform}</span>
                        </Badge>
                        {post.trending && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Hot
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-slate-200 text-sm mb-3 leading-relaxed">
                      {post.content}
                    </p>

                    {/* Hashtags and Mentions */}
                    {(post.hashtags.length > 0 || post.mentions.length > 0) && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.hashtags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-400"
                          >
                            #{tag}
                          </Badge>
                        ))}
                        {post.mentions.map((mention) => (
                          <Badge
                            key={mention}
                            variant="outline"
                            className="text-xs bg-green-500/10 border-green-500/30 text-green-400"
                          >
                            {mention}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Post Footer */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          <span>{post.engagement.likes}</span>
                        </div>
                        {post.engagement.retweets && (
                          <div className="flex items-center gap-1">
                            <Repeat2 className="h-3 w-3" />
                            <span>{post.engagement.retweets}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{post.engagement.replies}</span>
                        </div>
                        <Badge variant="outline" className={`text-xs ${getSentimentColor(post.sentiment)}`}>
                          {post.sentiment}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(post.timestamp)}</span>
                        </div>
                        {post.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1 text-blue-400 hover:text-blue-300"
                            onClick={() => window.open(post.url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}