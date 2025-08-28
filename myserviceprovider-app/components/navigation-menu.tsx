"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ImageIcon, MessageSquare, Coins, Menu, X, Activity } from "lucide-react"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export default function NavigationMenu() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    {
      name: "Generation",
      path: "/generate",
      icon: ImageIcon,
      description: "Create AI images and videos"
    },
    {
      name: "Thread",
      path: "/thread",
      icon: MessageSquare,
      description: "View community generations"
    },
    {
      name: "NFT Staking",
      path: "/staking",
      icon: Coins,
      description: "Stake NFTs and earn rewards"
    },
    {
      name: "Activity",
      path: "/activity",
      icon: Activity,
      description: "View contract activity"
    }
  ]

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* Desktop Navigation */}
      <Card className="hidden md:block bg-gray-800/50 border-gray-700 mb-8">
        <div className="flex items-center justify-between p-4">
          <div className="flex space-x-4">
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => router.push(item.path)}
                variant={isActive(item.path) ? "default" : "ghost"}
                className={`flex items-center space-x-2 px-6 py-3 ${
                  isActive(item.path)
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <ConnectButton />
          </div>
        </div>
      </Card>

      {/* Mobile Navigation */}
      <div className="md:hidden mb-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-semibold text-white">ServiceFlow AI</h2>
            <div className="flex items-center gap-2">
              <ConnectButton />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-300 hover:text-white"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          {isMobileMenuOpen && (
            <div className="border-t border-gray-700 p-4 space-y-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path)
                    setIsMobileMenuOpen(false)
                  }}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left justify-start ${
                    isActive(item.path)
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}