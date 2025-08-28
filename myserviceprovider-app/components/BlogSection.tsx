import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, User, Eye, Share2, ArrowRight } from "lucide-react"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  category: string
  tags: string[]
  created_at: string
  views: number
  featured_image_prompt?: string
}

export function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchBlogPosts()
  }, [selectedCategory])

  const fetchBlogPosts = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      
      const response = await fetch(`/api/blog?${params}`)
      const data = await response.json()
      
      if (data.success) {
        // Show only the latest 3 posts
        setPosts(data.posts.slice(0, 3))
      }
    } catch (error) {
      console.error('Failed to fetch blog posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { id: 'all', name: 'All Posts' },
    { id: 'automation', name: 'AI Automation' },
    { id: 'case-studies', name: 'Success Stories' },
    { id: 'tips', name: 'Business Tips' },
    { id: 'industry-insights', name: 'Industry Insights' }
  ]

  if (loading) {
    return (
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">Loading Latest Insights...</h2>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Latest from SrvcFlo AI</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Insights, case studies, and strategies to transform your service business with AI automation
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="mb-2"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-2xl font-semibold mb-4">No posts yet!</h3>
            <p className="text-gray-600 mb-6">
              SrvcFlo is working on some amazing content. Check back soon!
            </p>
            <Button onClick={() => window.location.href = '#waitlist'}>
              Join Waitlist for Updates
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-12">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Want More AI Business Insights?</h3>
              <p className="text-lg mb-6 opacity-90">
                Join our waitlist to get exclusive content and early access to ServiceFlow AI
              </p>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => window.location.href = '#waitlist'}
              >
                Join Waitlist Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

interface BlogPostCardProps {
  post: BlogPost
}

function BlogPostCard({ post }: BlogPostCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card className="hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
      <CardHeader className="flex-grow p-8">
        <div className="flex items-center justify-between mb-6">
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800">
            {post.category}
          </Badge>
          <div className="flex items-center text-sm text-gray-500">
            <Eye className="h-4 w-4 mr-1" />
            {post.views} views
          </div>
        </div>
        
        <CardTitle className="text-2xl lg:text-3xl font-bold leading-tight hover:text-blue-600 transition-colors mb-4">
          <Link href={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </CardTitle>
        
        <CardDescription className="text-lg text-gray-600 leading-relaxed mb-6">
          {post.excerpt}
        </CardDescription>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags?.slice(0, 4).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-sm px-3 py-1">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center space-x-6 text-sm text-gray-500 mb-6">
          <div className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            <span className="font-medium">{post.author}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            <span>{formatDate(post.created_at)}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 p-8">
        <Link href={`/blog/${post.slug}`}>
          <Button size="lg" className="w-full group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">
            Read Full Article
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}