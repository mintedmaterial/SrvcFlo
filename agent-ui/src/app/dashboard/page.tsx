"use client"

import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Bot, Activity, BarChart3, Zap, MessageSquare, Settings } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Agent Dashboard</h1>
          <p className="text-muted-foreground">Overview of your AI agents and system status</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link href="/agents">
          <Card className="bg-sonic-gray border-sonic-gray cursor-pointer hover:border-sonic-gold transition-colors">
            <CardContent className="flex items-center p-6">
              <MessageSquare className="h-8 w-8 text-sonic-gold mr-4" />
              <div>
                <p className="text-white font-semibold">Chat with Agents</p>
                <p className="text-sm text-muted-foreground">Access agent playground</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/market">
          <Card className="bg-sonic-gray border-sonic-gray cursor-pointer hover:border-sonic-gold transition-colors">
            <CardContent className="flex items-center p-6">
              <BarChart3 className="h-8 w-8 text-sonic-gold mr-4" />
              <div>
                <p className="text-white font-semibold">Market Data</p>
                <p className="text-sm text-muted-foreground">View trading pairs</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/settings">
          <Card className="bg-sonic-gray border-sonic-gray cursor-pointer hover:border-sonic-gold transition-colors">
            <CardContent className="flex items-center p-6">
              <Settings className="h-8 w-8 text-sonic-gold mr-4" />
              <div>
                <p className="text-white font-semibold">Settings</p>
                <p className="text-sm text-muted-foreground">Configure your account</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-sonic-gray border-sonic-gray" data-testid="sonic-card">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white text-lg flex items-center">
                <Bot className="mr-2 h-5 w-5 text-sonic-gold" />
                Active Agents
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                className="border-sonic-gold text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark"
                disabled
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-1">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-sonic-gold" />
              <span className="ml-2 text-white">Loading agent status...</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sonic-gray border-sonic-gray" data-testid="sonic-card">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white text-lg flex items-center">
                <Activity className="mr-2 h-5 w-5 text-sonic-gold" />
                System Performance
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                className="border-sonic-gold text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark"
                disabled
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-1">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-sonic-gold" />
              <span className="ml-2 text-white">Loading performance data...</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sonic-gray border-sonic-gray" data-testid="sonic-card">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white text-lg flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-sonic-gold" />
                Market Overview
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                className="border-sonic-gold text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark"
                disabled
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-1">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-sonic-gold" />
              <span className="ml-2 text-white">Loading market data...</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sonic-gray border-sonic-gray" data-testid="sonic-card">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white text-lg flex items-center">
                <Zap className="mr-2 h-5 w-5 text-sonic-gold" />
                Recent Activity
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                className="border-sonic-gold text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark"
                disabled
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-1">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-sonic-gold" />
              <span className="ml-2 text-white">Loading activity feed...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}