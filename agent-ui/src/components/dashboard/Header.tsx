"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/agents", label: "Agents" },
    { href: "/market", label: "Market" },
    { href: "/news-feed", label: "News Feed" },
    { href: "/social", label: "Social" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/settings", label: "Settings" }
  ]

  return (
    <header className="border-b border-sonic-gold/20 bg-sonic-dark/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
              <div className="absolute inset-0 bg-sonic-gold/20 rounded-full blur-sm group-hover:blur-md transition-all" />
              <Image 
                src="/images/quantlogo.png" 
                alt="Sonic AI Quant" 
                width={40} 
                height={40} 
                className="relative object-contain rounded-full"
              />
            </div>
            <span className="font-bold text-xl text-white group-hover:text-sonic-gold transition-colors">
              Sonic AI Quant
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-sm font-medium text-white/80 hover:text-sonic-gold transition-all duration-200 group"
              >
                {item.label}
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-sonic-gold scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant="outline" 
              className="sonic-button border-sonic-gold/50 text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark transition-all duration-300"
            >
              Connect Wallet
            </Button>
            <Button className="sonic-button bg-gradient-to-r from-sonic-gold to-yellow-400 text-sonic-dark hover:from-yellow-400 hover:to-sonic-gold font-medium">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:text-sonic-gold transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`lg:hidden transition-all duration-300 ease-out ${
          mobileMenuOpen 
            ? 'max-h-96 opacity-100 pb-6' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <nav className="flex flex-col gap-4 pt-6 border-t border-sonic-gold/20">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/80 hover:text-sonic-gold transition-colors py-2 animate-[slide-in-from-left_0.3s_ease-out]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-sonic-gold/20">
              <Button 
                variant="outline" 
                className="sonic-button border-sonic-gold/50 text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark"
                onClick={() => setMobileMenuOpen(false)}
              >
                Connect Wallet
              </Button>
              <Button 
                className="sonic-button bg-gradient-to-r from-sonic-gold to-yellow-400 text-sonic-dark hover:from-yellow-400 hover:to-sonic-gold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}