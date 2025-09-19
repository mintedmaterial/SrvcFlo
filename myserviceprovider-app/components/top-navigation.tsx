"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Bot, 
  ImageIcon, 
  MessageSquare, 
  Coins, 
  Settings,
  Menu,
  X,
  Sparkles,
  Users
} from "lucide-react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"
import { isAuthorizedAdminSync } from '@/lib/auth-config'

const navigationItems = [
  {
    name: "Agents",
    path: "/generate", 
    icon: Bot,
    description: "AI-powered generation agents"
  },
  {
    name: "Thread",
    path: "/thread",
    icon: MessageSquare,
    description: "Community generation thread"
  },
  {
    name: "Staking", 
    path: "/staking",
    icon: Coins,
    description: "Stake NFTs and earn rewards"
  },
  {
    name: "Coming Soon",
    path: "/coming-soon",
    icon: Sparkles,
    description: "Exciting features ahead"
  }
]

export default function TopNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isAdmin = isConnected && address ? isAuthorizedAdminSync(address) : false
  const isActive = (path: string) => pathname === path || pathname.startsWith(path)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative">
              <Bot className="h-8 w-8 text-purple-500" />
              <Sparkles className="h-3 w-3 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">
              ServiceFlow AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* Admin Tab - Only show for authorized users */}
            {isAdmin && (
              <Button
                onClick={() => router.push('/admin')}
                variant={isActive('/admin') ? "default" : "ghost"}
                className={`flex items-center space-x-2 px-4 py-2 text-sm ${
                  isActive('/admin')
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Admin</span>
              </Button>
            )}

            {/* Main Navigation Items */}
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => router.push(item.path)}
                variant={isActive(item.path) ? "default" : "ghost"}
                className={`flex items-center space-x-2 px-4 py-2 text-sm ${
                  isActive(item.path)
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Button>
            ))}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block">
              <ConnectButton />
            </div>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-black/95 backdrop-blur-sm">
            <div className="py-4 space-y-2">
              {/* Mobile Wallet Connection */}
              <div className="px-4 pb-3 border-b border-gray-800">
                <ConnectButton />
              </div>

              {/* Admin Link for Mobile - Only show for authorized users */}
              {isAdmin && (
                <Button
                  onClick={() => {
                    router.push('/admin')
                    setIsMobileMenuOpen(false)
                  }}
                  variant={isActive('/admin') ? "default" : "ghost"}
                  className={`w-full justify-start px-4 py-3 ${
                    isActive('/admin')
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <Users className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Admin</div>
                    <div className="text-xs opacity-70">Team backend agents</div>
                  </div>
                </Button>
              )}

              {/* Mobile Navigation Items */}
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path)
                    setIsMobileMenuOpen(false)
                  }}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className={`w-full justify-start px-4 py-3 ${
                    isActive(item.path)
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}