"use client"

import { SonicLogo } from "./sonic-logo"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="border-b border-sonic-gray py-4">
      <div className="container mx-auto flex justify-between items-center">
        <SonicLogo />

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6">
            <a href="/" className="text-sm font-medium text-muted-foreground hover:text-sonic-gold transition-colors">
              Agent Dashboard
            </a>
            <a
              href="/market"
              className="text-sm font-medium text-muted-foreground hover:text-sonic-gold transition-colors"
            >
              Market
            </a>
            <a
              href="/news-feed"
              className="text-sm font-medium text-muted-foreground hover:text-sonic-gold transition-colors"
            >
              News Feed
            </a>
            <a
              href="/social"
              className="text-sm font-medium text-muted-foreground hover:text-sonic-gold transition-colors"
            >
              Social
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-sonic-gold transition-colors">
              Portfolio
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-sonic-gold transition-colors">
              Settings
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-sonic-gold text-sonic-gold hover:bg-sonic-gold hover:text-sonic-dark"
            >
              Connect
            </Button>
            <Button className="bg-sonic-gold text-sonic-dark hover:bg-opacity-90">Get Started</Button>
          </div>
        </div>
      </div>
    </header>
  )
}