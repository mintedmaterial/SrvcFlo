"use client"

import React from 'react'
import { BlogSection } from "@/components/BlogSection"

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <video
              src="/logogif.mp4"
              alt="ServiceFlow AI"
              width={40}
              height={40}
              className="rounded-lg"
              autoPlay
              loop
              muted
              playsInline
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ServiceFlow AI
            </span>
          </div>
          <nav className="flex items-center space-x-6">
            <a
              href="/"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              Home
            </a>
            <a
              href="/#features"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              Features
            </a>
            <a
              href="/#pricing"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              Pricing
            </a>
            <a
              href="/blog"
              className="text-blue-600 font-semibold dark:text-blue-400"
            >
              Blog
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            ServiceFlow AI Blog
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Insights, strategies, and success stories to help you transform your service business with AI automation
          </p>
        </div>
      </section>

      {/* Blog Content */}
      <BlogSection />
    </div>
  )
}