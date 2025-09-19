"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  Bot, 
  Zap, 
  Video, 
  Music, 
  Code, 
  Globe, 
  Smartphone,
  Brain,
  Rocket,
  Star,
  Clock
} from "lucide-react"

const upcomingFeatures = [
  {
    id: 1,
    title: "Video Generation",
    description: "Create stunning AI-powered videos with text prompts. From short clips to full scenes.",
    icon: Video,
    status: "Development", 
    eta: "Q2 2024",
    priority: "High",
    color: "from-purple-600 to-pink-600"
  },
  {
    id: 2,
    title: "Music & Audio AI",
    description: "Generate custom music, sound effects, and voiceovers for your content.",
    icon: Music,
    status: "Research",
    eta: "Q3 2024", 
    priority: "Medium",
    color: "from-blue-600 to-cyan-600"
  },
  {
    id: 3,
    title: "Code Generation",
    description: "AI-powered coding assistant that generates, reviews, and optimizes your code.",
    icon: Code,
    status: "Beta",
    eta: "Q1 2024",
    priority: "High", 
    color: "from-green-600 to-emerald-600"
  },
  {
    id: 4,
    title: "Multi-Chain Support", 
    description: "Expand beyond Sonic to Ethereum, Polygon, Base, and other major networks.",
    icon: Globe,
    status: "Planning",
    eta: "Q4 2024",
    priority: "Medium",
    color: "from-yellow-600 to-orange-600"
  },
  {
    id: 5,
    title: "Mobile App",
    description: "Native iOS and Android apps with full feature parity and mobile-first UX.",
    icon: Smartphone,
    status: "Design",
    eta: "Q3 2024",
    priority: "High",
    color: "from-indigo-600 to-purple-600"
  },
  {
    id: 6,
    title: "Advanced AI Models",
    description: "Latest GPT-4, Claude, and Gemini integrations with custom fine-tuned models.",
    icon: Brain,
    status: "Testing",
    eta: "Q2 2024",
    priority: "High",
    color: "from-red-600 to-rose-600"
  }
]

const roadmapPhases = [
  {
    phase: "Phase 1: Foundation",
    quarter: "Q1 2024",
    features: ["Image Generation", "Basic NFT Staking", "Sonic Integration"],
    status: "Completed",
    color: "text-green-400"
  },
  {
    phase: "Phase 2: Expansion", 
    quarter: "Q2 2024",
    features: ["Video Generation", "Advanced AI Models", "Mobile Beta"],
    status: "In Progress",
    color: "text-blue-400"
  },
  {
    phase: "Phase 3: Scale",
    quarter: "Q3 2024", 
    features: ["Multi-Chain", "Music AI", "Mobile Launch"],
    status: "Planned",
    color: "text-purple-400"
  },
  {
    phase: "Phase 4: Enterprise",
    quarter: "Q4 2024",
    features: ["API Platform", "White Label", "Enterprise Tools"],
    status: "Future",
    color: "text-gray-400"
  }
]

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-black pt-20 pb-8">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Rocket className="h-16 w-16 text-purple-500" />
              <Sparkles className="h-8 w-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-4">
            The Future is Coming
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            We're building the next generation of AI-powered tools and experiences. 
            Here's what's on the horizon for ServiceFlow AI.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-4 py-2">
              🚀 6 Major Features in Development
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-4 py-2">
              📅 Regular Updates
            </Badge>
          </div>
        </div>

        {/* Upcoming Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Upcoming Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingFeatures.map((feature) => (
              <Card key={feature.id} className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-all duration-300 group">
                <CardContent className="p-6">
                  {/* Feature Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color}`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge 
                      className={`
                        ${feature.priority === 'High' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                          feature.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-gray-500/20 text-gray-400 border-gray-500/30'}
                      `}
                    >
                      {feature.priority}
                    </Badge>
                  </div>

                  {/* Feature Content */}
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Feature Meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-400">{feature.eta}</span>
                    </div>
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                      {feature.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Roadmap Timeline */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Development Roadmap</h2>
          
          <div className="space-y-6">
            {roadmapPhases.map((phase, index) => (
              <Card key={index} className="bg-gray-900/30 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{phase.phase}</h3>
                      <p className="text-gray-400">{phase.quarter}</p>
                    </div>
                    <Badge className={`${phase.color} bg-transparent border-current`}>
                      {phase.status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {phase.features.map((feature, featureIndex) => (
                      <Badge 
                        key={featureIndex}
                        variant="outline"
                        className="text-xs border-gray-600 text-gray-300"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Star className="h-12 w-12 text-purple-400" />
                  <Zap className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">
                Stay in the Loop
              </h2>
              <p className="text-gray-300 mb-6">
                Be the first to know when new features launch. Join our community for exclusive updates and early access.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 whitespace-nowrap">
                  Notify Me
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                No spam, just the good stuff. Unsubscribe anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}