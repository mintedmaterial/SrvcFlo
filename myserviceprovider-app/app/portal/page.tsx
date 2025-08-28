"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bot, Sparkles, TrendingUp, Share2, Copy, Eye, Download } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function PortalPage() {
  const searchParams = useSearchParams()
  const [apiKey, setApiKey] = useState(searchParams?.get('key') || '')
  const [user, setUser] = useState(null)
  const [isValidated, setIsValidated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [blogTopic, setBlogTopic] = useState('')
  const [targetIndustry, setTargetIndustry] = useState('')
  const [generatedContent, setGeneratedContent] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (apiKey) {
      validateApiKey()
    }
  }, [apiKey])

  const validateApiKey = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/portal/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setUser(data.user)
        setIsValidated(true)
        setTargetIndustry(data.user.business_type)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to validate API key')
    } finally {
      setLoading(false)
    }
  }

  const generateContent = async () => {
    if (!blogTopic.trim()) {
      setError('Please enter a blog topic')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          apiKey, 
          topic: blogTopic,
          industry: targetIndustry 
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setGeneratedContent(data.blog_post)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to generate content')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  if (!isValidated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Bot className="h-8 w-8 text-blue-600" />
              <Badge variant="secondary">Early Access Portal</Badge>
            </div>
            <CardTitle className="text-2xl">ServiceFlow AI Portal</CardTitle>
            <CardDescription>
              Enter your API key to access exclusive content generation tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sfa_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={validateApiKey} 
              disabled={loading || !apiKey}
              className="w-full"
            >
              {loading ? "Validating..." : "Access Portal"}
            </Button>
            
            <div className="text-center pt-4 text-sm text-gray-600">
              Don't have an API key? 
              <a href="/" className="text-blue-600 hover:underline ml-1">
                Join our waitlist
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ServiceFlow AI Portal</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.business_name}!</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Position #{user?.position} • Early Access
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Content Generator */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  <CardTitle>AI Content Generator</CardTitle>
                </div>
                <CardDescription>
                  Generate viral blog posts and social content powered by SrvcFlo AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Blog Topic</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., Why Smart Contractors Use AI"
                      value={blogTopic}
                      onChange={(e) => setBlogTopic(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Target Industry</Label>
                    <Select value={targetIndustry} onValueChange={setTargetIndustry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contractors">Contractors</SelectItem>
                        <SelectItem value="plumbers">Plumbers</SelectItem>
                        <SelectItem value="electricians">Electricians</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="landscapers">Landscapers</SelectItem>
                        <SelectItem value="hairstylists">Hair Stylists</SelectItem>
                        <SelectItem value="handymen">Handymen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={generateContent}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? "SrvcFlo is working..." : "Generate Content"}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Content */}
            {generatedContent && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                    <span>Generated Content</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="blog" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="blog">Blog Post</TabsTrigger>
                      <TabsTrigger value="social">Social Media</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="blog" className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{generatedContent.title}</h3>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedContent.content)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{generatedContent.excerpt}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {generatedContent.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                        <Textarea 
                          value={generatedContent.content} 
                          readOnly 
                          className="min-h-[300px] font-mono text-sm"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="social" className="space-y-4">
                      <div className="grid gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">Twitter/X</h4>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedContent.social_content.twitter)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm">{generatedContent.social_content.twitter}</p>
                        </div>
                        
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">LinkedIn</h4>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedContent.social_content.linkedin)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm">{generatedContent.social_content.linkedin}</p>
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">Facebook</h4>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedContent.social_content.facebook)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm">{generatedContent.social_content.facebook}</p>
                        </div>
                        
                        <div className="bg-pink-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">Instagram</h4>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedContent.social_content.instagram)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm">{generatedContent.social_content.instagram}</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Waitlist Position</span>
                  <Badge variant="outline">#{user?.position}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Business Type</span>
                  <Badge>{user?.business_type}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Access Level</span>
                  <Badge variant="secondary">Early Access</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Topics</CardTitle>
                <CardDescription>Popular content ideas for {user?.business_type}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    "Why AI is Perfect for Service Businesses",
                    "5 Signs You Need Automated Scheduling", 
                    "How to Never Miss Another Lead",
                    "The $50K Mistake Manual Businesses Make",
                    "24/7 Customer Service Without Hiring"
                  ].map((topic, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto p-3"
                      onClick={() => setBlogTopic(topic)}
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coming Soon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Bot className="h-4 w-4" />
                  <span>Custom AI Agents</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Share2 className="h-4 w-4" />
                  <span>Direct Social Publishing</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>Analytics Dashboard</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}