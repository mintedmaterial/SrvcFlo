"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Heart, Eye, User, Calendar } from "lucide-react"

const mockThreads = [
  {
    id: 1,
    prompt: "A futuristic cityscape with flying cars at sunset",
    imageUrl: "https://via.placeholder.com/400x400?text=Future+City",
    author: "0x1234...5678",
    upvotes: 23,
    views: 456,
    createdAt: "2 hours ago",
    model: "FLUX-1 Schnell"
  },
  {
    id: 2,
    prompt: "Abstract geometric patterns in neon colors",
    imageUrl: "https://via.placeholder.com/400x400?text=Abstract+Art",
    author: "0xabcd...efgh",
    upvotes: 18,
    views: 321,
    createdAt: "4 hours ago",
    model: "Stable Diffusion XL"
  },
  {
    id: 3,
    prompt: "Mystical forest with glowing mushrooms and fireflies",
    imageUrl: "https://via.placeholder.com/400x400?text=Mystical+Forest",
    author: "0x9876...4321",
    upvotes: 42,
    views: 789,
    createdAt: "6 hours ago",
    model: "DALL-E 3"
  },
  {
    id: 4,
    prompt: "Cyberpunk samurai warrior in neon-lit streets",
    imageUrl: "https://via.placeholder.com/400x400?text=Cyber+Samurai",
    author: "0xfedc...ba98",
    upvotes: 67,
    views: 1234,
    createdAt: "8 hours ago",
    model: "Midjourney"
  }
]

export default function ThreadPage() {
  return (
    <div className="min-h-screen bg-black pt-20 pb-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Community Gallery
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Discover amazing AI-generated images created by our community. 
            Vote for your favorites and explore the endless possibilities of AI creativity.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex justify-center mb-8">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="flex items-center space-x-6 p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">1,234</div>
                <div className="text-xs text-gray-500">Total Images</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">456</div>
                <div className="text-xs text-gray-500">Artists</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">12.3K</div>
                <div className="text-xs text-gray-500">Total Votes</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Thread Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockThreads.map((thread) => (
            <Card key={thread.id} className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-all duration-300 group">
              <CardContent className="p-0">
                {/* Image */}
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={thread.imageUrl}
                    alt={thread.prompt}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Model Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-black/70 text-white border-none text-xs">
                      {thread.model}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Prompt */}
                  <h3 className="text-white font-medium mb-3 line-clamp-2 text-sm">
                    {thread.prompt}
                  </h3>

                  {/* Author & Time */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{thread.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{thread.createdAt}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-400 p-1 h-auto"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        <span className="text-xs">{thread.upvotes}</span>
                      </Button>
                      <div className="flex items-center space-x-1 text-gray-500 text-xs">
                        <Eye className="h-3 w-3" />
                        <span>{thread.views}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-purple-400 p-1 h-auto">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3">
            Load More Images
          </Button>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 mb-8">
          <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Create Your Own Masterpiece
              </h2>
              <p className="text-gray-300 mb-6">
                Join our community of AI artists. Generate stunning images and share them with the world.
              </p>
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                onClick={() => window.location.href = '/generate'}
              >
                Start Creating
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}