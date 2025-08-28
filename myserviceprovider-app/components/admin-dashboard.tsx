"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Calendar, BarChart3, DollarSign, Phone, Mail, CheckCircle, AlertCircle, Bot } from "lucide-react"
// import { ModelSelector } from "./model-selector"
import { AIGeneration } from "@/components/ai-generation"
import { useDevAuth } from "@/hooks/useDevAuth"

export function AdminDashboard() {
  const auth = useDevAuth()
  const [currentModel, setCurrentModel] = useState("llama-3.3-70b")

  // Mock data for demo
  const leads = [
    {
      id: 1,
      name: "John Smith",
      email: "john@example.com",
      phone: "(555) 123-4567",
      project: "Kitchen Remodel",
      status: "new",
      value: "$15,000",
      date: "2025-01-04",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "(555) 987-6543",
      project: "Deck Construction",
      status: "quoted",
      value: "$8,500",
      date: "2025-01-03",
    },
    {
      id: 3,
      name: "Mike Wilson",
      email: "mike@example.com",
      phone: "(555) 456-7890",
      project: "Trim Carpentry",
      status: "scheduled",
      value: "$3,200",
      date: "2025-01-02",
    },
  ]

  const projects = [
    {
      id: 1,
      client: "Johnson Family",
      type: "Complete Remodel",
      status: "in-progress",
      progress: 65,
      startDate: "2024-12-15",
      endDate: "2025-02-15",
      value: "$45,000",
    },
    {
      id: 2,
      client: "Davis Home",
      type: "Deck Installation",
      status: "scheduled",
      progress: 0,
      startDate: "2025-01-15",
      endDate: "2025-01-22",
      value: "$12,000",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800"
      case "quoted":
        return "bg-yellow-100 text-yellow-800"
      case "scheduled":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Show limited dashboard for non-admin users
  const showLimitedDashboard = !auth.user?.isAdmin

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-blue-900">
                {showLimitedDashboard ? 'Dashboard' : 'Admin Dashboard'}
              </CardTitle>
              <CardDescription className="text-blue-700">
                Welcome back, {auth.user.email}
                {auth.user.isAdmin && ` • Signed in as ${auth.user.isMasterAdmin ? 'Master Admin' : 'Admin'}`}
              </CardDescription>
            </div>
            {auth.user.isAdmin && (
              <Badge variant="secondary" className={auth.user.isMasterAdmin ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                {auth.user.isMasterAdmin ? 'Master Admin' : 'Admin Access'}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">3 starting this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$127K</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Interactions</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">234</div>
            <p className="text-xs text-muted-foreground">+45 today</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue={showLimitedDashboard ? "generation" : "leads"} className="space-y-6">
        <TabsList>
          {auth.user?.isAdmin && <TabsTrigger value="leads">Lead Management</TabsTrigger>}
          {auth.user?.isAdmin && <TabsTrigger value="projects">Active Projects</TabsTrigger>}
          <TabsTrigger value="generation">AI Generation</TabsTrigger>
          <TabsTrigger value="blog">Blog Management</TabsTrigger>
          {auth.user?.isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
          {auth.user?.isAdmin && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
        </TabsList>

        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Manage customer inquiries and project requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-semibold">{lead.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{lead.email}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{lead.phone}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{lead.project}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                      <span className="font-semibold text-green-600">{lead.value}</span>
                      <Button size="sm">Contact</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>Monitor ongoing construction and remodeling projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{project.client}</h4>
                        <p className="text-sm text-gray-600">{project.type}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                        <p className="text-sm font-semibold text-green-600 mt-1">{project.value}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Start: {project.startDate}</span>
                        <span>End: {project.endDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generation">
          <AIGeneration />
        </TabsContent>

        <TabsContent value="blog">
          <Card>
            <CardHeader>
              <CardTitle>Blog Management</CardTitle>
              <CardDescription>Create and manage blog posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <span className="text-2xl mb-4 block">📝</span>
                <p className="text-gray-600">Blog management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Model Configuration</CardTitle>
                <CardDescription>Manage the AI assistant settings and model selection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">AI model configuration coming soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure business rules and pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Using Groq Llama 3.3 70B</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">Ultra-fast AI responses with high-quality reasoning</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Current Configuration:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Oklahoma market pricing enabled</li>
                    <li>• Maintenance packages active</li>
                    <li>• Image generation available</li>
                    <li>• Lead scoring enabled</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Revenue analytics coming soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Conversations</span>
                    <span className="font-semibold">234</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Estimates Generated</span>
                    <span className="font-semibold">89</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Leads Converted</span>
                    <span className="font-semibold">23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Cost (This Month)</span>
                    <span className="font-semibold text-green-600">$0.00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
