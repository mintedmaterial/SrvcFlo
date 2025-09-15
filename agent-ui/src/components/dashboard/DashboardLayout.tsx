"use client"

import Header from "./Header"
import Footer from "./Footer"
import { useEffect, useState } from "react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Add a slight delay for smooth loading animation
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-sonic-gradient relative overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sonic-gold rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-sonic-gold rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header with enhanced animation */}
      <div className={`transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <Header />
      </div>

      {/* Main content with staggered animation */}
      <main className={`flex-1 container mx-auto px-4 py-6 md:px-8 md:py-8 transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        <div className="space-y-6">
          {children}
        </div>
      </main>

      {/* Footer with animation */}
      <div className={`transition-all duration-700 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <Footer />
      </div>
    </div>
  )
}