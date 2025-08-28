"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, MessageCircle, Calendar, Calculator, Phone, Mail } from "lucide-react"
import ChatComponent from "@/src/app"
import { PricingCalculator } from "@/components/pricing-calculator"
import { ServiceDetails } from "@/components/service-details"
import { AdminDashboard } from "@/components/admin-dashboard"
import { AIGeneration } from "@/components/ai-generation"
import { useDevAuth, LoginForm } from "@/hooks/useDevAuth"

interface CustomerData {
  name: string
  email: string
  phone: string
  address: string
  projectDescription: string
}

export default function Dashboard() {
  const auth = useDevAuth()
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [activeTab, setActiveTab] = useState("services")

  useEffect(() => {
    const data = localStorage.getItem("customerData")
    if (data) {
      setCustomerData(JSON.parse(data))
    }
  }, [])

  useEffect(() => {
    // If user is admin, start on admin tab
    if (auth.user?.isAdmin) {
      setActiveTab("admin")
    }
  }, [auth.user])

  // Show login form if not authenticated
  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!auth.isAuthenticated || !auth.user) {
    return <LoginForm onSuccess={() => window.location.reload()} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              

              <Home className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ServiceFlow AI</h1>
                <p className="text-sm text-gray-600">Your Project Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{auth.user.name}</span>
                {auth.user.isMasterAdmin && (
                  <Badge className="ml-2 bg-purple-100 text-purple-800">Master Admin</Badge>
                )}
                {auth.user.isAdmin && !auth.user.isMasterAdmin && (
                  <Badge className="ml-2 bg-blue-100 text-blue-800">Admin</Badge>
                )}
              </div>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Contact
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={auth.logout}
                className="text-red-600 hover:text-red-700"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        {customerData && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-900">Welcome, {customerData.name}!</CardTitle>
              <CardDescription className="text-blue-700">
                We've received your project details and our AI system is ready to help you plan your renovation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Project Type</Badge>
                  <span className="text-sm">Custom Remodeling</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Location</Badge>
                  <span className="text-sm">{customerData.address || "Service Area"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Status</Badge>
                  <span className="text-sm text-green-600">Ready for Estimate</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="chat">AI Assistant</TabsTrigger>
            <TabsTrigger value="generation">AI Generation</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <ServiceDetails />
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>AI Project Assistant</span>
                </CardTitle>
                <CardDescription>
                  Get instant estimates, design suggestions, and project planning help from our AI assistant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChatComponent 
                  apiEndpoint="/api/chat" 
                  userId={customerData?.email || "dashboard-user"}
                  className="border-0"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generation">
            <AIGeneration />
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Schedule Consultation</span>
                </CardTitle>
                <CardDescription>Book a free consultation with our team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Schedule Your Free Consultation</h3>
                  <p className="text-gray-600 mb-6">Meet with our experts to discuss your project in detail</p>
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Book Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <AdminDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
