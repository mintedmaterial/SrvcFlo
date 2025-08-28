"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  Users,
  MessageCircle,
  Calendar,
  DollarSign,
  Bot,
  Phone,
  Mail,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { BusinessFileUpload } from "./business-file-upload"

interface BusinessAdminProps {
  businessData: any
}

export function BusinessAdminDashboard({ businessData }: BusinessAdminProps) {
  const [businessMetrics, setBusinessMetrics] = useState({
    totalLeads: 45,
    convertedLeads: 12,
    aiInteractions: 1250,
    revenue: 89000,
    responseTime: 2.3,
    satisfaction: 92,
  })

  const [recentActivity, setRecentActivity] = useState([
    {
      type: "lead",
      message: "New lead from AI chat: Kitchen remodel inquiry",
      time: "2 hours ago",
      value: "$18,000",
    },
    {
      type: "conversation",
      message: "AI handled 15 customer inquiries",
      time: "4 hours ago",
      value: "15 chats",
    },
    {
      type: "booking",
      message: "Appointment scheduled via AI agent",
      time: "6 hours ago",
      value: "Jan 15",
    },
  ])

  return (
    <div className="space-y-6">
      {/* Business Admin Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-blue-900">{businessData?.businessName} - Admin Dashboard</CardTitle>
              <CardDescription className="text-blue-700">Your AI-powered business management center</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-800">Business Admin</Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {businessData?.packageType} Package
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Business Metrics */}
      <div className="grid md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessMetrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground">+12% this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessMetrics.convertedLeads}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((businessMetrics.convertedLeads / businessMetrics.totalLeads) * 100)}% rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Chats</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessMetrics.aiInteractions}</div>
            <p className="text-xs text-muted-foreground">+89 today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(businessMetrics.revenue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">+18% this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessMetrics.responseTime}s</div>
            <p className="text-xs text-muted-foreground">AI average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessMetrics.satisfaction}%</div>
            <p className="text-xs text-muted-foreground">Customer rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Business Admin Tabs - Limited Access */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="conversations">AI Conversations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="files">File Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest AI interactions and business activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {activity.type === "lead" && <Users className="h-4 w-4 text-green-600" />}
                        {activity.type === "conversation" && <MessageCircle className="h-4 w-4 text-blue-600" />}
                        {activity.type === "booking" && <Calendar className="h-4 w-4 text-purple-600" />}
                        <div>
                          <p className="text-sm font-medium">{activity.message}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{activity.value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Agent Status</CardTitle>
                <CardDescription>Your AI agents and their performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">Website Chatbot</h4>
                        <p className="text-sm text-gray-600">Handling customer inquiries</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>

                  {businessData?.packageType !== "basic" && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">Phone AI Agent</h4>
                          <p className="text-sm text-gray-600">Answering incoming calls</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                    </div>
                  )}

                  <div className="p-3 bg-gray-50 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Performance Summary</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Uptime:</span>
                        <span className="font-medium ml-2">99.8%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Accuracy:</span>
                        <span className="font-medium ml-2">94.2%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customer Management</CardTitle>
              <CardDescription>View and manage your customer leads and interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Customer Management</h3>
                <p className="text-gray-600 mb-6">View leads, manage customer data, and track interactions</p>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  View Customer List
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle>AI Conversations</CardTitle>
              <CardDescription>Monitor AI chat interactions and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Conversation Analytics</h3>
                <p className="text-gray-600 mb-6">
                  Review AI conversations, response quality, and customer satisfaction
                </p>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  View Conversations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Business Analytics</CardTitle>
              <CardDescription>Track your business performance and AI ROI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Performance Analytics</h3>
                <p className="text-gray-600 mb-6">Detailed analytics on leads, conversions, and AI performance</p>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  View Full Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>Limited settings available to business admins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Limited Access</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Core business configuration is managed by ServiceFlow AI. Contact support for changes.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Available Settings:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• View business information</li>
                    <li>• Export customer data</li>
                    <li>• Download conversation logs</li>
                    <li>• Update contact preferences</li>
                    <li>• Request AI agent modifications</li>
                  </ul>
                </div>

                <div className="flex space-x-4">
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button variant="outline">Request Changes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="files">
          <BusinessFileUpload
            businessId={businessData?.id || "current"}
            businessName={businessData?.businessName || "Your Business"}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
