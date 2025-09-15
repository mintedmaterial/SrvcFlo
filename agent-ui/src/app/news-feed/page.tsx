"use client"

import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingUp, MessageCircle, ExternalLink } from "lucide-react"

export default function NewsFeedPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">News Feed</h1>
          <p className="text-muted-foreground">Latest news and updates from crypto markets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="sonic-card">
          <CardHeader className="pb-2 sonic-card-header">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white text-lg flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-sonic-gold animate-pulse" />
                Crypto News
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                className="sonic-button border-sonic-gold text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark"
                disabled
              >
                <Loader2 className="h-4 w-4 loading-spinner-gold" />
                <span className="ml-1">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="sonic-card-content">
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 loading-spinner-gold" />
              <span className="ml-2 text-white">Loading news feed...</span>
            </div>
          </CardContent>
        </Card>

        <Card className="sonic-card">
          <CardHeader className="pb-2 sonic-card-header">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white text-lg flex items-center">
                <MessageCircle className="mr-2 h-5 w-5 text-sonic-gold" />
                Twitter Updates
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                className="sonic-button border-sonic-gold text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark"
                disabled
              >
                <Loader2 className="h-4 w-4 loading-spinner-gold" />
                <span className="ml-1">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="sonic-card-content">
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 loading-spinner-gold" />
              <span className="ml-2 text-white">Loading Twitter feed...</span>
            </div>
          </CardContent>
        </Card>

        <Card className="sonic-card lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white text-lg flex items-center">
                <ExternalLink className="mr-2 h-5 w-5 text-sonic-gold" />
                Market Analysis
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                className="sonic-button border-sonic-gold text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark"
                disabled
              >
                <Loader2 className="h-4 w-4 loading-spinner-gold" />
                <span className="ml-1">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="sonic-card-content">
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 loading-spinner-gold" />
              <span className="ml-2 text-white">Loading market analysis...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}