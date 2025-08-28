import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BlogSection } from "@/components/BlogSection"
import { Bot, Zap, Crown, Star, Clock, Phone, MessageSquare, Camera, BarChart3 } from "lucide-react"

const aiPackages = [
  {
    icon: Bot,
    title: "Basic AI Agent",
    description: "Essential AI automation for small businesses getting started with intelligent customer service.",
    features: [
      "AI Chatbot Integration",
      "Basic Lead Capture",
      "Email Automation",
      "Simple Scheduling",
      "Website Integration",
      "Basic Analytics",
    ],
    capabilities: ["Customer Support Chat", "Appointment Booking", "Lead Qualification", "Basic Estimates"],
    timeline: "2-3 weeks setup",
    popular: false,
  },
  {
    icon: Zap,
    title: "Upgraded AI Agent",
    description: "Advanced AI solutions with multi-channel automation and intelligent business insights.",
    features: [
      "Advanced Chatbot + Phone AI",
      "Social Media Automation",
      "Content Generation",
      "CRM Integration",
      "Advanced Analytics",
      "Custom Workflows",
    ],
    capabilities: [
      "Phone Call Handling",
      "Social Media Posting",
      "Complex Estimations",
      "Customer Journey Mapping",
      "Automated Follow-ups",
    ],
    timeline: "3-4 weeks setup",
    popular: true,
  },
  {
    icon: Crown,
    title: "Premier AI Suite",
    description: "Enterprise-level AI automation with custom agents, video content, and advanced integrations.",
    features: [
      "Custom AI Agent Development",
      "Video Content Generation",
      "Advanced Phone Systems",
      "Multi-Platform Integration",
      "Custom Database Design",
      "Priority Support",
    ],
    capabilities: [
      "Video Marketing Automation",
      "Complex Business Logic",
      "Multi-Location Management",
      "Advanced Reporting",
      "Custom API Integrations",
    ],
    timeline: "4-6 weeks setup",
    popular: false,
  },
]

const businessExamples = [
  {
    type: "Home Services",
    examples: ["Remodeling", "Plumbing", "HVAC", "Landscaping"],
    icon: "🏠",
  },
  {
    type: "Professional Services",
    examples: ["Legal", "Accounting", "Consulting", "Real Estate"],
    icon: "💼",
  },
  {
    type: "Health & Beauty",
    examples: ["Salons", "Spas", "Dental", "Medical"],
    icon: "💅",
  },
  {
    type: "Retail & Food",
    examples: ["Restaurants", "Retail Stores", "Cafes", "Bakeries"],
    icon: "🍕",
  },
]

export function ServiceDetails() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">AI Solutions for Every Business</h2>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          Transform your business with custom AI agents that handle customer service, lead generation, content creation,
          and complex business operations. Explore our latest insights and success stories below.
        </p>
      </div>

      {/* Our Approach */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-purple-900">Our Unique Approach</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold mb-2">Custom AI Training</h3>
              <p className="text-sm text-gray-600">
                We train and optimize AI agents specifically for your business and industry
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold mb-2">Verified Results</h3>
              <p className="text-sm text-gray-600">
                We track and verify your business growth and ROI from AI implementation
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="font-semibold mb-2">Success Partnership</h3>
              <p className="text-sm text-gray-600">
                We partner with you for long-term success and continuous improvement
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Service Packages */}
      <div className="grid lg:grid-cols-3 gap-8">
        {aiPackages.map((pkg, index) => {
          const IconComponent = pkg.icon
          return (
            <Card
              key={index}
              className={`relative overflow-hidden ${
                pkg.popular ? "border-blue-500 shadow-lg scale-105" : "border-gray-200"
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center py-2">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="h-4 w-4" />
                    <span className="text-sm font-semibold">Most Popular</span>
                  </div>
                </div>
              )}

              <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 relative p-6 flex items-center justify-center">
                <IconComponent className="h-16 w-16 text-blue-600" />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-blue-600 text-white">AI Package</Badge>
                </div>
              </div>

              <CardHeader className={pkg.popular ? "pt-12" : ""}>
                <div className="flex items-center space-x-3 mb-2">
                  <IconComponent className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-xl">{pkg.title}</CardTitle>
                </div>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">What's Included:</h4>
                  <div className="space-y-2">
                    {pkg.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">AI Capabilities:</h4>
                  <div className="flex flex-wrap gap-2">
                    {pkg.capabilities.map((capability, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Setup Time</p>
                      <p className="font-semibold text-sm">{pkg.timeline}</p>
                    </div>
                  </div>
                </div>

                <Button
                  className={`w-full ${
                    pkg.popular ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  Learn More About {pkg.title}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Blog Section for Waitlist Members */}
      <BlogSection />

      {/* Business Types Section */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Perfect for Any Business Type</CardTitle>
          <CardDescription>
            Our AI agents adapt to your industry with custom training and business-specific workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            {businessExamples.map((business, index) => (
              <div key={index} className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{business.icon}</div>
                <h3 className="font-semibold mb-2">{business.type}</h3>
                <div className="space-y-1">
                  {business.examples.map((example, idx) => (
                    <p key={idx} className="text-xs text-gray-600">
                      {example}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">AI Agent Capabilities by Package</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Feature</th>
                  <th className="text-center py-3 px-4">Basic</th>
                  <th className="text-center py-3 px-4">Upgraded</th>
                  <th className="text-center py-3 px-4">Premier</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                <tr className="border-b">
                  <td className="py-3 px-4 flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span>AI Chatbot</span>
                  </td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span>Phone AI Agent</span>
                  </td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 flex items-center space-x-2">
                    <Camera className="h-4 w-4 text-purple-600" />
                    <span>Video Content Generation</span>
                  </td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                    <span>Advanced Analytics</span>
                  </td>
                  <td className="text-center py-3 px-4">Basic</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <span>Custom Agent Development</span>
                  </td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">Limited</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Success Stories Preview */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-900">Success Stories</CardTitle>
          <CardDescription>Real businesses seeing real results with ServiceFlow AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🏠</span>
              </div>
              <h3 className="font-semibold mb-2">Southeast Remodeling</h3>
              <p className="text-sm text-gray-600 mb-2">Home Services</p>
              <p className="text-lg font-bold text-green-600">+150% Lead Generation</p>
              <p className="text-xs text-gray-500">6 months with Upgraded Package</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💅</span>
              </div>
              <h3 className="font-semibold mb-2">Bella's Beauty Salon</h3>
              <p className="text-sm text-gray-600 mb-2">Beauty Services</p>
              <p className="text-lg font-bold text-green-600">+200% Bookings</p>
              <p className="text-xs text-gray-500">4 months with Basic Package</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="font-semibold mb-2">Pro Plumbing Co.</h3>
              <p className="text-sm text-gray-600 mb-2">Professional Services</p>
              <p className="text-lg font-bold text-green-600">+300% Efficiency</p>
              <p className="text-xs text-gray-500">8 months with Premier Package</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
