"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Building2, DollarSign, Bot, FileText, Settings, Crown, Zap } from "lucide-react"
import { AgnoAgentManager } from "./agno-agent-manager"
import { MasterFileApproval } from "./master-file-approval"

export function MasterAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  // Mock data - in production, fetch from API
  const stats = {
    totalBusinesses: 47,
    activeSubscriptions: 42,
    monthlyRevenue: 28400,
    totalAgents: 89,
    pendingFiles: 12,
    activeAgents: 76,
  }

  const recentActivity = [
    { id: 1, type: "business", message: "New business registered: Tech Solutions Inc", time: "2 hours ago" },
    { id: 2, type: "agent", message: "Agent deployed for Beauty Salon Pro", time: "4 hours ago" },
    { id: 3, type: "file", message: "5 files pending approval from Remodeling Co", time: "6 hours ago" },
    { id: 4, type: "subscription", message: "Premier package upgrade: Legal Associates", time: "1 day ago" },
  ]

  const topPerformingBusinesses = [
    { name: "Southeast Remodeling", revenue: 1000, growth: "+23%", agents: 3 },
    { name: "Bella's Beauty Salon", revenue: 600, growth: "+18%", agents: 2 },
    { name: "Tech Solutions Inc", revenue: 1000, growth: "+31%", agents: 4 },
    { name: "Legal Associates", revenue: 1000, growth: "+15%", agents: 3 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Crown className="h-8 w-8 text-yellow-600" />
            <span>Master Admin Dashboard</span>
          </h1>
          <p className="text-gray-600 mt-1">ServiceFlow AI Platform Management</p>
        </div>
        <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">
          <Crown className="h-4 w-4 mr-1" />
          Master Admin
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalBusinesses}</p>
                <p className="text-xs text-gray-600">Total Businesses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                <p className="text-xs text-gray-600">Active Subscriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Monthly Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalAgents}</p>
                <p className="text-xs text-gray-600">Total Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingFiles}</p>
                <p className="text-xs text-gray-600">Pending Files</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeAgents}</p>
                <p className="text-xs text-gray-600">Active Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="agents">Agno Agents</TabsTrigger>
          <TabsTrigger value="files">File Approval</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform activities and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {activity.type === "business" && <Building2 className="h-4 w-4 text-blue-600" />}
                        {activity.type === "agent" && <Bot className="h-4 w-4 text-purple-600" />}
                        {activity.type === "file" && <FileText className="h-4 w-4 text-orange-600" />}
                        {activity.type === "subscription" && <DollarSign className="h-4 w-4 text-green-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Businesses */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Businesses</CardTitle>
                <CardDescription>Businesses with highest growth and engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformingBusinesses.map((business, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{business.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>${business.revenue}/mo</span>
                          <span>•</span>
                          <span>{business.agents} agents</span>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">{business.growth}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2 bg-transparent"
                  onClick={() => setActiveTab("businesses")}
                >
                  <Building2 className="h-6 w-6" />
                  <span>Manage Businesses</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2 bg-transparent"
                  onClick={() => setActiveTab("agents")}
                >
                  <Bot className="h-6 w-6" />
                  <span>Configure Agents</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2 bg-transparent"
                  onClick={() => setActiveTab("files")}
                >
                  <FileText className="h-6 w-6" />
                  <span>Review Files</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2 bg-transparent"
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="h-6 w-6" />
                  <span>Platform Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="businesses">
          <Card>
            <CardHeader>
              <CardTitle>Business Management</CardTitle>
              <CardDescription>Manage all businesses on the ServiceFlow AI platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Business Management</h3>
                <p>Business management interface will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <AgnoAgentManager />
        </TabsContent>

        <TabsContent value="files">
          <MasterFileApproval />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure global platform settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Platform Settings</h3>
                <p>Global settings interface will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
