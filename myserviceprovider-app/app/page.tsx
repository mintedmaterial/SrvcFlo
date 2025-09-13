"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import BackgroundPaths from "@/components/background-path"
import { BlogSection } from "@/components/BlogSection"
import { ChatBot } from "@/components/chat-bot"
// Navigation now handled by layout
import { PriceTicker } from "@/components/price-ticker"
import { Bot, Calendar, Star, Zap, CheckCircle, ArrowRight, Play, TrendingUp, Shield, Users, Clock, ImageIcon, Video, Wallet, Globe, LogIn } from "lucide-react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"

export default function HomePage() {
  // Entry state - start with background paths
  const [showMainApp, setShowMainApp] = useState(false)
  
  const [selectedPackage, setSelectedPackage] = useState("starter")
  const [waitlistCount, setWaitlistCount] = useState(247) // Will be fetched from API
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)
  const { address, isConnected } = useAccount()
  const [waitlistForm, setWaitlistForm] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    businessType: "",
    currentChallenges: "",
    interestedPackage: "starter",
    estimatedRevenue: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Top generations state
  const [topGenerations, setTopGenerations] = useState<any[]>([])
  const [generationsLoading, setGenerationsLoading] = useState(true)
  

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage("")

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(waitlistForm),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitMessage(`Success! You're #${data.position} on our waitlist. We'll be in touch soon!`)
        setWaitlistForm({
          businessName: "",
          ownerName: "",
          email: "",
          phone: "",
          businessType: "",
          currentChallenges: "",
          interestedPackage: "starter",
          estimatedRevenue: ""
        })
        setTimeout(() => setIsWaitlistOpen(false), 3000)
      } else {
        setSubmitMessage(data.error || "Something went wrong. Please try again.")
      }
    } catch (error) {
      setSubmitMessage("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch waitlist count and check auth on component mount
  useEffect(() => {
    // Check authentication status
    checkAuthStatus()
    
    // Fetch waitlist count
    fetch('/api/waitlist')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWaitlistCount(data.count)
        }
      })
      .catch(console.error)
    
    // Fetch top generations
    fetchTopGenerations()
  }, [])
  
  const fetchTopGenerations = async () => {
    try {
      setGenerationsLoading(true)
      const response = await fetch('/api/thread/generations?sort=upvotes&limit=5')
      const data = await response.json()
      
      if (data.success) {
        setTopGenerations(data.generations || [])
      }
    } catch (error) {
      console.error('Error fetching top generations:', error)
    } finally {
      setGenerationsLoading(false)
    }
  }
  

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('/api/auth/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsLoggedIn(true)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const handleLogin = () => {
    // Redirect to admin login for now, can be enhanced later
    window.location.href = '/admin'
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      }
      localStorage.removeItem('auth_token')
      setIsLoggedIn(false)
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const packages = [
    {
      id: "starter",
      name: "Starter Agent",
      price: "Coming Soon",
      description: "Perfect for small businesses",
      features: [
        "Basic AI customer service",
        "Lead capture & qualification",
        "Appointment scheduling",
        "Email & SMS integration",
      ],
      popular: false,
    },
    {
      id: "professional",
      name: "Professional Suite",
      price: "Coming Soon",
      description: "Advanced automation for growing businesses",
      features: [
        "Multi-channel AI agents",
        "Advanced lead scoring",
        "CRM integration",
        "Custom workflows",
        "Analytics dashboard",
        "Priority support",
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise Solution",
      price: "Coming Soon",
      description: "Full-scale AI transformation",
      features: [
        "Unlimited AI agents",
        "Custom AI training",
        "White-label solution",
        "API access",
        "Dedicated account manager",
        "24/7 premium support",
      ],
      popular: false,
    },
  ]

  const businessTypes = [
    {
      name: "Contractors",
      image: "/images/contractor.jpeg",
      description: "Automate project quotes and scheduling",
    },
    {
      name: "Plumbers",
      image: "/images/plumber.jpeg",
      description: "24/7 emergency call handling",
    },
    {
      name: "Roofers",
      image: "/images/roofer.jpg",
      description: "Lead qualification and estimates",
    },
    {
      name: "Hair Stylists",
      image: "/images/hairstylist.webp",
      description: "Appointment booking and reminders",
    },
    {
      name: "Handymen",
      image: "/images/handyman.jpeg",
      description: "Service requests and scheduling",
    },
  ]

  const features = [
    {
      icon: <Bot className="h-8 w-8" />,
      title: "AI-Powered Automation",
      description: "Custom AI agents that understand your business and handle customer interactions 24/7",
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Lead Generation",
      description: "Qualify leads automatically and book appointments while you focus on your work",
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Smart Scheduling",
      description: "Intelligent appointment booking that syncs with your calendar and availability",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Success-Based Pricing",
      description: "Start with fixed pricing, then transition to revenue sharing as you grow",
    },
  ]


  // Show BackgroundPaths component first, then main app after user interaction
  if (!showMainApp) {
    return <BackgroundPaths title="ServiceFlow AI" onEnter={() => setShowMainApp(true)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black pt-16">


      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-orange-500/10 text-orange-400 border-orange-500/20">
            <Zap className="w-4 h-4 mr-1" />
            Live
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
            AI Generation Redefined
          </h1>
          <p className="text-xl text-gray-400 mb-6 max-w-3xl mx-auto">
            ServiceFlow AI is the highest-performing AI generation platform, combining speed, 
            incentives, and world-class infrastructure. Powered by <span className="text-orange-400 font-semibold">Sonic</span>.
          </p>
          
          {/* Real-time Price Ticker */}
          <PriceTicker 
            network="mainnet" 
            className="max-w-4xl mx-auto mb-8"
          />
          
          <div className="flex items-center justify-center gap-2 mb-8">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {waitlistCount} businesses waiting
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Clock className="w-4 h-4 mr-2" />
              Early access launching soon
            </Badge>
          </div>

          {/* Feature Cards Grid - Sonic Style */}
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto mt-16">
            <Card 
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all cursor-pointer group"
              onClick={() => window.location.href = '/generate'}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Generate</h3>
                <p className="text-gray-400 text-sm mb-4">Create AI images and videos with advanced prompting</p>
                <Button variant="ghost" className="text-orange-400 group-hover:text-orange-300">
                  Start Creating <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all cursor-pointer group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Earn</h3>
                <p className="text-gray-400 text-sm mb-4">Get rewards for your creativity and participation</p>
                <Button variant="ghost" className="text-blue-400 group-hover:text-blue-300">
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all cursor-pointer group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Stake</h3>
                <p className="text-gray-400 text-sm mb-4">Stake tokens to secure the network and earn rewards</p>
                <Button variant="ghost" className="text-purple-400 group-hover:text-purple-300">
                  Coming Soon <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all cursor-pointer group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Docs</h3>
                <p className="text-gray-400 text-sm mb-4">Check our ServiceFlow's official documentation</p>
                <Button variant="ghost" className="text-green-400 group-hover:text-green-300">
                  Read Docs <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-16">
            <Dialog open={isWaitlistOpen} onOpenChange={setIsWaitlistOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  Join Waitlist <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Join Our Waitlist</DialogTitle>
                  <DialogDescription>
                    Be among the first to transform your business with AI. We'll notify you when early access is available.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        value={waitlistForm.businessName}
                        onChange={(e) => setWaitlistForm(prev => ({...prev, businessName: e.target.value}))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerName">Your Name *</Label>
                      <Input
                        id="ownerName"
                        value={waitlistForm.ownerName}
                        onChange={(e) => setWaitlistForm(prev => ({...prev, ownerName: e.target.value}))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={waitlistForm.email}
                        onChange={(e) => setWaitlistForm(prev => ({...prev, email: e.target.value}))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={waitlistForm.phone}
                        onChange={(e) => setWaitlistForm(prev => ({...prev, phone: e.target.value}))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Select value={waitlistForm.businessType} onValueChange={(value) => setWaitlistForm(prev => ({...prev, businessType: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="plumber">Plumber</SelectItem>
                        <SelectItem value="roofer">Roofer</SelectItem>
                        <SelectItem value="hairstylist">Hair Stylist</SelectItem>
                        <SelectItem value="handyman">Handyman</SelectItem>
                        <SelectItem value="electrician">Electrician</SelectItem>
                        <SelectItem value="landscaper">Landscaper</SelectItem>
                        <SelectItem value="cleaner">Cleaning Service</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="interestedPackage">Interested Package</Label>
                    <Select value={waitlistForm.interestedPackage} onValueChange={(value) => setWaitlistForm(prev => ({...prev, interestedPackage: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter Agent - $200/month</SelectItem>
                        <SelectItem value="professional">Professional Suite - $600/month</SelectItem>
                        <SelectItem value="enterprise">Enterprise Solution - $1000/month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="currentChallenges">Current Business Challenges (Optional)</Label>
                    <Textarea
                      id="currentChallenges"
                      value={waitlistForm.currentChallenges}
                      onChange={(e) => setWaitlistForm(prev => ({...prev, currentChallenges: e.target.value}))}
                      placeholder="Tell us about your biggest business challenges..."
                      rows={3}
                    />
                  </div>

                  {submitMessage && (
                    <div className={`p-3 rounded-md ${submitMessage.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {submitMessage}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Joining..." : "Join Waitlist"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 bg-transparent"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Learn More
            </Button>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose ServiceFlow AI?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Built specifically for service-based businesses</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Top Community Generations Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Top Community Generations
            </h2>
            <p className="text-xl text-gray-400">
              Discover the most voted AI creations from our community
            </p>
            <Button
              className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={() => window.location.href = '/thread'}
            >
              View All Generations <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="max-w-6xl mx-auto">
            {generationsLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-400">Loading top generations...</div>
              </div>
            ) : topGenerations.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="text-center py-12">
                  <div className="text-gray-400 mb-4">No generations available yet</div>
                  <Button
                    onClick={() => window.location.href = '/generate'}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    Create the First Generation!
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topGenerations.slice(0, 6).map((gen, index) => (
                  <Card key={gen.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all group cursor-pointer" onClick={() => window.location.href = '/thread'}>
                    <CardContent className="p-4">
                      {/* Generation Image/Video */}
                      <div className="aspect-square bg-gray-900/50 rounded-lg overflow-hidden mb-4">
                        {gen.type === 'image' ? (
                          <img 
                            src={gen.result[0]} 
                            alt="Generated content" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <video 
                            src={gen.result[0]} 
                            className="w-full h-full object-cover"
                            muted
                          />
                        )}
                      </div>
                      
                      {/* Generation Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {gen.type === 'image' ? <ImageIcon className="h-3 w-3 mr-1" /> : <Video className="h-3 w-3 mr-1" />}
                            {gen.type}
                          </Badge>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              ↑ {gen.upvotes || 0}
                            </span>
                            <span className="text-purple-400">{gen.leaderboardPoints || 0}pts</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-300 line-clamp-2">
                          {gen.prompt}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {gen.walletAddress ? `${gen.walletAddress.slice(0, 6)}...${gen.walletAddress.slice(-4)}` : 'Anonymous'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Paid: {gen.paymentMethod}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Choose Your AI Package</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Start with fixed pricing, then transition to success-based revenue sharing
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative hover:shadow-xl transition-all ${
                  pkg.popular ? "ring-2 ring-blue-500 scale-105" : ""
                }`}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600">
                    POPULAR
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                  <div className="text-4xl font-bold text-blue-600 mt-4">
                    {pkg.price}
                    <span className="text-lg text-gray-500">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      pkg.popular
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        : ""
                    }`}
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* AI Chat Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-600/10 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-gray-900">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 dark:from-blue-900/50 dark:to-purple-900/50 dark:text-blue-200 text-lg px-6 py-3">
              <Bot className="w-5 h-5 mr-2" />
              AI Demo Experience
            </Badge>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Try ServiceFlow AI Live
            </h2>
            <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Experience our intelligent AI assistant firsthand. Ask questions about automation, pricing, or how ServiceFlow AI can transform your specific business.
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border-2 border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 p-8 shadow-2xl">
              <ChatBot 
                customerData={null}
              />
            </div>
            <div className="mt-8 text-center space-y-4">
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                <Badge variant="secondary" className="text-sm px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900/50">
                  <Zap className="w-4 h-4 mr-2" />
                  Instant Responses
                </Badge>
                <Badge variant="secondary" className="text-sm px-4 py-2 bg-purple-100 text-purple-800 dark:bg-purple-900/50">
                  <Shield className="w-4 h-4 mr-2" />
                  Industry-Specific Knowledge
                </Badge>
                <Badge variant="secondary" className="text-sm px-4 py-2 bg-pink-100 text-pink-800 dark:bg-pink-900/50">
                  <Users className="w-4 h-4 mr-2" />
                  Business-Focused Conversations
                </Badge>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                This AI assistant specializes in service business automation, lead generation strategies, and can route complex inquiries to our expert team. Try asking about your specific industry challenges!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <BlogSection />

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl mb-4 opacity-90">Join {waitlistCount}+ businesses waiting for early access</p>
          <p className="text-lg mb-8 opacity-75">Be notified when we launch and get exclusive early access pricing</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => setIsWaitlistOpen(true)}
            >
              Join Waitlist Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
              onClick={() => window.open('https://srvcflo.com/blog', '_blank')}
            >
              Read Our Blog
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-5 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <video
                  src="/logogif.mp4"
                  alt="ServiceFlow AI"
                  width={32}
                  height={32}
                  className="rounded"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <span className="text-xl font-bold">ServiceFlow AI</span>
              </div>
              <p className="text-gray-400 mb-4">AI-powered generation and automation platform.</p>
              
              {/* Social Media Icons */}
              <div className="text-sm text-gray-400 mb-3">Follow Us:</div>
              <div className="flex space-x-6 mb-6">
                <a 
                  href="https://x.com/ServFloAI" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group hover:scale-110 transition-all duration-200"
                >
                  <div className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 border border-gray-700 hover:border-gray-600">
                    <Image
                      src="/icons/twitter-icon.png"
                      alt="Twitter"
                      width={32}
                      height={32}
                      className="rounded"
                    />
                    <span className="text-gray-300 group-hover:text-white text-sm font-medium">Twitter</span>
                  </div>
                </a>
                <a 
                  href="https://t.me/+VcFSmzTH6783MGZh" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group hover:scale-110 transition-all duration-200"
                >
                  <div className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 border border-gray-700 hover:border-gray-600">
                    <Image
                      src="/icons/telegram-icon.png"
                      alt="Telegram"
                      width={32}
                      height={32}
                      className="rounded"
                    />
                    <span className="text-gray-300 group-hover:text-white text-sm font-medium">Help</span>
                  </div>
                </a>
              </div>
              
              {/* Partner Logos */}
              <div className="text-sm text-gray-400 mb-3">Powered by:</div>
              <div className="flex space-x-4">
                <a 
                  href="https://www.soniclabs.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group hover:scale-110 transition-all duration-200"
                >
                  <div className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg px-3 py-2 border border-gray-700/50 hover:border-gray-600">
                    <Image
                      src="/icons/sonic-icon.png"
                      alt="Sonic Labs"
                      width={36}
                      height={36}
                      className="rounded"
                    />
                    <span className="text-gray-400 group-hover:text-gray-300 text-xs">Sonic</span>
                  </div>
                </a>
                <a 
                  href="https://openocean.finance/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group hover:scale-110 transition-all duration-200"
                >
                  <div className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg px-3 py-2 border border-gray-700/50 hover:border-gray-600">
                    <Image
                      src="/icons/openocean-icon.png"
                      alt="OpenOcean"
                      width={36}
                      height={36}
                      className="rounded bg-white/10 p-1"
                    />
                    <span className="text-gray-400 group-hover:text-gray-300 text-xs">OpenOcean</span>
                  </div>
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="/blog" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="https://x.com/ServFloAI" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="https://t.me/+VcFSmzTH6783MGZh" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    Telegram
                  </a>
                </li>
                <li>
                  <a href="/thread" className="hover:text-white">
                    Generations
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ServiceFlow AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
