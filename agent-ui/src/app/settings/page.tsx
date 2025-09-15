"use client"

import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Wallet, Key, Bell, Shield, Database } from "lucide-react"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-muted-foreground">Configure your account and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="sonic-card">
          <CardHeader className="pb-2 sonic-card-header">
            <CardTitle className="text-white text-lg flex items-center">
              <Wallet className="mr-2 h-5 w-5 text-sonic-gold" />
              Wallet Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sonic-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Web3 Wallet</p>
                <p className="text-sm text-muted-foreground">Connect your wallet to access DeFi features</p>
              </div>
              <Button className="sonic-button bg-sonic-gold text-sonic-dark hover:bg-opacity-90">
                Connect Wallet
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Network</p>
                <p className="text-sm text-muted-foreground">Choose your preferred blockchain network</p>
              </div>
              <Button variant="outline" className="sonic-button border-sonic-gold text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark">
                Sonic Mainnet
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="sonic-card">
          <CardHeader className="pb-2 sonic-card-header">
            <CardTitle className="text-white text-lg flex items-center">
              <Key className="mr-2 h-5 w-5 text-sonic-gold" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sonic-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Agent API Endpoint</p>
                <p className="text-sm text-muted-foreground">Configure backend agent connection</p>
              </div>
              <Button variant="outline" className="sonic-button border-sonic-gold text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Market Data</p>
                <p className="text-sm text-muted-foreground">API keys for market data feeds</p>
              </div>
              <Button variant="outline" className="sonic-button border-sonic-gold text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark">
                Setup
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="sonic-card">
          <CardHeader className="pb-2 sonic-card-header">
            <CardTitle className="text-white text-lg flex items-center">
              <Bell className="mr-2 h-5 w-5 text-sonic-gold" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sonic-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Price Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified of price changes</p>
              </div>
              <Button variant="outline" className="sonic-button border-sonic-gold text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark">
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Agent Updates</p>
                <p className="text-sm text-muted-foreground">Notifications from your agents</p>
              </div>
              <Button variant="outline" className="sonic-button border-sonic-gold text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="sonic-card">
          <CardHeader className="pb-2 sonic-card-header">
            <CardTitle className="text-white text-lg flex items-center">
              <Shield className="mr-2 h-5 w-5 text-sonic-gold" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sonic-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add extra security to your account</p>
              </div>
              <Button variant="outline" className="sonic-button border-sonic-gold text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark">
                Setup 2FA
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Data Export</p>
                <p className="text-sm text-muted-foreground">Download your data and settings</p>
              </div>
              <Button variant="outline" className="sonic-button border-sonic-gold text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark">
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}