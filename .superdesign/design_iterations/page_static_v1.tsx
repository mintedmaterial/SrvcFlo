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
import { Bot, Calendar, Star, Zap, CheckCircle, ArrowRight, Play, TrendingUp, Shield, Users, Clock } from "lucide-react"

export default function HomePage() {
  const [selectedPackage, setSelectedPackage] = useState("starter")
  const [waitlistCount, setWaitlistCount] = useState(247) // Will be fetched from API
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)
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

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage("")

    try {
      // Use the current domain for the API call
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

  // Fetch waitlist count on component mount
  useEffect(() => {
    fetch('/api/waitlist')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWaitlistCount(data.count)
        }
      })
      .catch(console.error)
  }, [])

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

  const testimonials = [
    {
      name: "Mike Johnson",
      business: "Johnson Roofing",
      image: "/roofer.jpg",
      quote:
        "ServiceFlow AI doubled our lead conversion rate in just 3 months. The AI handles initial calls perfectly.",
      rating: 5,
    },
    {
      name: "Sarah Martinez",
      business: "Elite Hair Studio",
      image: "/hairstylist.webp",
      quote: "Booking appointments is now completely automated. My clients love the instant responses.",
      rating: 5,
    },
    {
      name: "Tom Wilson",
      business: "Wilson Plumbing",
      image: "/plumber.jpeg",
      quote: "Emergency calls are handled 24/7 now. I never miss a potential customer again.",
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image
              src="/serviceflow-logo.jpeg"
              alt="ServiceFlow AI"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ServiceFlow AI
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="#features"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              Pricing
            </a>
            <a
              href="#testimonials"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              Reviews
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Zap className="w-4 h-4 mr-1" />
            AI-Powered Business Automation - Early Access
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Transform Your Business with AI Agents
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-3xl mx-auto">
            Automate customer service, lead generation, and business operations with custom AI agents tailored to your
            industry. Join our waitlist to be among the first to access our revolutionary platform.
          </p>
          
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

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Dialog open={isWaitlistOpen} onOpenChange={setIsWaitlistOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
                        <SelectItem value="starter">Starter Agent</SelectItem>
                        <SelectItem value="professional">Professional Suite</SelectItem>
                        <SelectItem value="enterprise">Enterprise Solution</SelectItem>
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
            
            <Button size="lg" variant="outline" className="border-2 bg-transparent">
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
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

      {/* Business Types Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Perfect for Your Industry</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Specialized AI solutions for service professionals
            </p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {businessTypes.map((business, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all hover:scale-105">
                <CardHeader className="pb-2">
                  <div className="relative w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
                    <Image
                      src={business.image || "/placeholder.svg"}
                      alt={business.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardTitle className="text-lg">{business.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{business.description}</p>
                </CardContent>
              </Card>
            ))}
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
                    onClick={() => setIsWaitlistOpen(true)}
                  >
                    Join Waitlist
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Real results from real businesses</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                      <Image
                        src={testimonial.image || "/placeholder.svg"}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                      <CardDescription>{testimonial.business}</CardDescription>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 italic">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

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
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image
                  src="/serviceflow-logo.jpeg"
                  alt="ServiceFlow AI"
                  width={32}
                  height={32}
                  className="rounded"
                />
                <span className="text-xl font-bold">ServiceFlow AI</span>
              </div>
              <p className="text-gray-400">AI-powered business automation for service professionals.</p>
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
                  <a href="#" className="hover:text-white">
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
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ServiceFlow AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}