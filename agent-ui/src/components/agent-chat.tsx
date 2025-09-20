'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  TrendingUp,
  MessageSquare,
  Newspaper,
  Activity,
  Send,
  Settings,
  Palette,
  BarChart3
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import monitoring components to avoid SSR issues
const TokenMonitor = dynamic(() => import('@/components/monitors/TokenMonitor'), {
  ssr: false,
  loading: () => <div className="text-center py-8 text-slate-400">Loading Token Monitor...</div>
});
const NFTMonitor = dynamic(() => import('@/components/monitors/NFTMonitor'), {
  ssr: false,
  loading: () => <div className="text-center py-8 text-slate-400">Loading NFT Monitor...</div>
});
const NewsMonitor = dynamic(() => import('@/components/monitors/NewsMonitor'), {
  ssr: false,
  loading: () => <div className="text-center py-8 text-slate-400">Loading News Monitor...</div>
});
const SocialMonitor = dynamic(() => import('@/components/monitors/SocialMonitor'), {
  ssr: false,
  loading: () => <div className="text-center py-8 text-slate-400">Loading Social Monitor...</div>
});
const AgentReports = dynamic(() => import('@/components/monitors/AgentReports'), {
  ssr: false,
  loading: () => <div className="text-center py-8 text-slate-400">Loading Agent Reports...</div>
});

// Agent configurations
const agents = [
  {
    id: 'sonic-finance',
    name: 'Sonic Finance Agent',
    role: 'DeFi Analyst',
    avatar: '🏦',
    color: 'from-blue-500 to-cyan-500',
    status: 'online',
    capabilities: ['Token Analysis', 'Price Predictions', 'Liquidity Monitoring', 'Yield Farming'],
    file: 'teams/sonic_finance_team.py'
  },
  {
    id: 'sonic-research',
    name: 'Sonic Research Agent',
    role: 'Research Analyst',
    avatar: '🔬',
    color: 'from-purple-500 to-pink-500',
    status: 'online',
    capabilities: ['Protocol Analysis', 'Trend Research', 'Risk Assessment', 'Community Sentiment'],
    file: 'teams/sonic_research_team_improved.py'
  },
  {
    id: 'ecosystem-analyst',
    name: 'Ecosystem Analyst',
    role: 'Ecosystem Monitor',
    avatar: '🌐',
    color: 'from-green-500 to-emerald-500',
    status: 'online',
    capabilities: ['Project Discovery', 'TVL Tracking', 'User Growth', 'Ecosystem Health'],
    file: 'ecosystem_analyst_agent.py'
  },
  {
    id: 'nft-analyst',
    name: 'NFT Market Analyst',
    role: 'NFT Specialist',
    avatar: '🎨',
    color: 'from-orange-500 to-red-500',
    status: 'online',
    capabilities: ['Paintswap Analysis', 'Floor Price Tracking', 'Rarity Analysis', 'Volume Trends'],
    file: 'nft_market_analyst_agent.py'
  },
  {
    id: 'smart-contract',
    name: 'Smart Contract Auditor',
    role: 'Security Analyst',
    avatar: '🛡️',
    color: 'from-slate-600 to-slate-800',
    status: 'beta',
    capabilities: ['Contract Auditing', 'Vulnerability Detection', 'Gas Optimization', 'Best Practices'],
    file: 'smart_contract_agent.py'
  }
];

interface Message {
  id: string;
  agent: string;
  content: string;
  timestamp: Date;
  type: 'user' | 'agent';
  attachments?: any[];
}

export default function AgentChat() {
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      agent: 'user',
      content: inputMessage,
      timestamp: new Date(),
      type: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate agent response (replace with actual API call)
    setTimeout(() => {
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        agent: selectedAgent.id,
        content: `Analyzing your query about "${inputMessage}"... Based on current Sonic ecosystem data, here's my analysis...`,
        timestamp: new Date(),
        type: 'agent'
      };
      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ServiceFlow AI
              </h1>
              <Badge variant="outline" className="text-green-400 border-green-400">
                <Activity className="h-3 w-3 mr-1" />
                Live Monitoring
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto bg-slate-800/50 backdrop-blur-sm">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="tokens" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tokens
            </TabsTrigger>
            <TabsTrigger value="nfts" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              NFTs
            </TabsTrigger>
            <TabsTrigger value="news-social" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              News
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Agent Selector */}
              <div className="lg:col-span-1">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg">Available Agents</CardTitle>
                    <CardDescription>Select an agent to chat with</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2 p-4">
                        {agents.map((agent) => (
                          <button
                            key={agent.id}
                            onClick={() => setSelectedAgent(agent)}
                            className={`w-full text-left p-3 rounded-lg transition-all ${
                              selectedAgent.id === agent.id
                                ? 'bg-gradient-to-r ' + agent.color + ' text-white'
                                : 'bg-slate-700/50 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">{agent.avatar}</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{agent.name}</div>
                                <div className="text-xs opacity-80 truncate">{agent.role}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      agent.status === 'online'
                                        ? 'text-green-400 border-green-400'
                                        : 'text-yellow-400 border-yellow-400'
                                    }`}
                                  >
                                    {agent.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Chat Interface */}
              <div className="lg:col-span-3">
                <Card className="bg-slate-800/50 border-slate-700 h-[600px] flex flex-col">
                  <CardHeader className="border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${selectedAgent.color}`}>
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle>{selectedAgent.name}</CardTitle>
                          <CardDescription>{selectedAgent.role}</CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedAgent.capabilities.slice(0, 2).map((cap) => (
                          <Badge key={cap} variant="secondary" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full p-4">
                      <div className="space-y-4">
                        {messages.length === 0 ? (
                          <div className="text-center py-12 text-slate-400">
                            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Start a conversation</p>
                            <p className="text-sm mt-2">
                              Ask {selectedAgent.name} about Sonic ecosystem insights
                            </p>
                          </div>
                        ) : (
                          messages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${
                                message.type === 'user' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-[70%] p-3 rounded-lg ${
                                  message.type === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-200'
                                }`}
                              >
                                {message.type === 'agent' && (
                                  <div className="flex items-center gap-2 mb-2 text-xs opacity-80">
                                    <span>{selectedAgent.avatar}</span>
                                    <span>{selectedAgent.name}</span>
                                  </div>
                                )}
                                <p className="text-sm">{message.content}</p>
                                <div className="text-xs opacity-60 mt-1">
                                  {message.timestamp.toLocaleTimeString()}
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                        {isTyping && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                          >
                            <div className="bg-slate-700 text-slate-200 p-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                                </div>
                                <span className="text-xs">{selectedAgent.name} is typing...</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </CardContent>

                  <div className="p-4 border-t border-slate-700">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={`Ask ${selectedAgent.name} about Sonic ecosystem...`}
                        className="flex-1 bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-400"
                        disabled={isTyping}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!inputMessage.trim() || isTyping}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens">
            <TokenMonitor />
          </TabsContent>

          {/* NFTs Tab */}
          <TabsContent value="nfts">
            <NFTMonitor />
          </TabsContent>

          {/* News & Social Tab */}
          <TabsContent value="news-social">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NewsMonitor />
              <SocialMonitor />
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <AgentReports agents={agents} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}