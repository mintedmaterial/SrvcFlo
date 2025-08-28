import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, User, Eye, Share2 } from "lucide-react"
import ReactMarkdown from 'react-markdown'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  author: string
  category: string
  tags: string[]
  created_at: string
  views: number
}

export async function generateStaticParams() {
  // For static generation, we'll pre-generate a few common slugs
  // In production, this would fetch from your actual data source
  return [
    { slug: 'ai-automation-saved-johnson-roofing-50k' },
    { slug: '50k-mistake-service-businesses-ai-solution' },
    { slug: 'hair-salon-doubles-bookings-smart-scheduling' },
  ]
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  
  // Mock data for static generation - in production this would be from your API
  const mockPosts: BlogPost[] = [
    {
      id: "1",
      title: "How AI Automation Saved Johnson Roofing $50,000 in Missed Calls",
      slug: "ai-automation-saved-johnson-roofing-50k",
      excerpt: "Discover how Johnson Roofing transformed their emergency call handling with AI and never missed another 3 AM customer again.",
      content: "# How AI Automation Saved Johnson Roofing $50,000\n\nJohnson Roofing was losing thousands in missed calls until they implemented ServiceFlow AI...",
      author: "SrvcFlo AI",
      category: "Success Stories",
      tags: ["AI Automation", "Roofing", "Emergency Calls", "ROI"],
      created_at: new Date(Date.now() - 86400000).toISOString(),
      views: 1250
    },
    {
      id: "2", 
      title: "The $50K Mistake Every Service Business Makes (And How AI Fixes It)",
      slug: "50k-mistake-service-businesses-ai-solution",
      excerpt: "73% of service businesses lose customers due to delayed responses. Here's how AI automation eliminates this costly problem.",
      content: "# The $50K Mistake Every Service Business Makes\n\nDelayed responses are costing service businesses thousands...",
      author: "SrvcFlo AI",
      category: "AI Automation",
      tags: ["AI", "Customer Service", "Revenue Loss", "Automation"],
      created_at: new Date(Date.now() - 172800000).toISOString(),
      views: 980
    },
    {
      id: "3",
      title: "From Manual to Magical: Hair Salon Doubles Bookings with Smart Scheduling", 
      slug: "hair-salon-doubles-bookings-smart-scheduling",
      excerpt: "Elite Hair Studio automated their booking process and saw a 200% increase in appointments within 3 months.",
      content: "# Hair Salon Doubles Bookings with Smart Scheduling\n\nElite Hair Studio's transformation story...",
      author: "SrvcFlo AI", 
      category: "Success Stories",
      tags: ["Scheduling", "Hair Salon", "Bookings", "Automation"],
      created_at: new Date(Date.now() - 259200000).toISOString(),
      views: 750
    }
  ]
  
  const post = mockPosts.find(p => p.slug === slug)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Blog Post Not Found</h1>
            <p className="text-xl text-gray-600 mb-8">
              The blog post you're looking for doesn't exist.
            </p>
            <a href="/blog">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </a>
          </div>
        </div>
      </div>
    )
  }

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
              href="/blog"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              Blog
            </a>
          </nav>
        </div>
      </header>

      {/* Article Content */}
      <article className="py-12 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <a href="/blog">
              <Button variant="ghost" className="mb-8">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </a>

            {/* Article Header */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mb-8">
              <CardHeader className="p-8 lg:p-12">
                <div className="flex items-center justify-between mb-6">
                  <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800">
                    {post.category}
                  </Badge>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Eye className="h-4 w-4 mr-1" />
                      {post.views} views
                    </div>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <CardTitle className="text-3xl lg:text-5xl font-bold leading-tight mb-6">
                  {post.title}
                </CardTitle>

                <div className="flex items-center space-x-6 text-gray-600 mb-6">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    <span className="font-medium">{post.author}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {post.tags?.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
            </Card>

            {/* Article Content */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-8 lg:p-12">
                <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:hover:text-blue-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700">
                  <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white mt-12">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Business?</h3>
                <p className="text-lg mb-6 opacity-90">
                  Join hundreds of service businesses already using ServiceFlow AI
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="/#waitlist">
                    <Button variant="secondary" size="lg">
                      Join Waitlist
                    </Button>
                  </a>
                  <a href="/blog">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
                    >
                      Read More Articles
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </article>
    </div>
  )
}