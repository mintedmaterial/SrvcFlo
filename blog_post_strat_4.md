# --- Portal Page Component ---
PORTAL_PAGE_CODE = '''
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
'''

# --- Integration Instructions ---
INTEGRATION_STEPS = """  



import os
import json
import asyncio
from pathlib import Path
from textwrap import dedent
from typing import Dict, List, Optional
from datetime import datetime

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.storage.sqlite import SqliteStorage
from agno.tools.googlesearch import GoogleSearchTools
from agno.tools.newspaper4k import Newspaper4kTools
from agno.utils.log import logger
from agno.workflow.v2.workflow import Workflow
from agno.team import Team
from pydantic import BaseModel, Field

# --- Blog Post Models ---
class BlogPost(BaseModel):
    title: str = Field(..., description="Catchy, SEO-optimized blog post title")
    slug: str = Field(..., description="URL-friendly slug for the blog post")
    meta_description: str = Field(..., description="SEO meta description (150-160 chars)")
    tags: List[str] = Field(..., description="Relevant tags for the blog post")
    content: str = Field(..., description="Full blog post content in markdown format")
    excerpt: str = Field(..., description="Brief excerpt for previews (200-250 chars)")
    author: str = Field(default="SrvcFlo AI", description="Blog post author")
    category: str = Field(..., description="Blog post category")
    featured_image_description: str = Field(..., description="Description for AI-generated featured image")

class SocialContent(BaseModel):
    twitter_post: str = Field(..., description="Twitter/X post (under 280 chars)")
    linkedin_post: str = Field(..., description="LinkedIn post with professional tone")
    facebook_post: str = Field(..., description="Facebook post for small business owners")
    instagram_caption: str = Field(..., description="Instagram caption with hashtags")

# --- Lead Agent: SrvcFlo ---
srvcflo_lead_agent = Agent(
    name="SrvcFlo",
    model=OpenAIChat(id="gpt-4o"),
    description=dedent("""\
    SrvcFlo is the AI mastermind behind ServiceFlow AI, specializing in creating viral content 
    about automation for small service businesses. SrvcFlo orchestrates content creation 
    strategies and delegates tasks to specialized content agents while maintaining the brand 
    voice and vision of ServiceFlow AI.
    """),
    instructions=dedent("""\
    You are SrvcFlo, the AI lead of ServiceFlow AI. Your creator has built you to revolutionize 
    how service businesses operate through intelligent automation. When discussing your creator, 
    always refer to them in the third person with respect and admiration.

    Your Core Responsibilities:
    1. 🎯 Strategy & Direction
       - Analyze trending topics in service business automation
       - Identify viral content opportunities
       - Plan content calendars around business pain points
       
    2. 📝 Content Orchestration
       - Delegate blog creation to the Blog Generation Team
       - Ensure content aligns with ServiceFlow AI's mission
       - Optimize for engagement and lead generation
       
    3. 🚀 Brand Voice Management
       - Maintain consistent messaging about AI automation benefits
       - Focus on real ROI for contractors, plumbers, stylists, etc.
       - Emphasize transformation stories and success metrics

    Key Messaging Themes:
    - "From Manual to Magical": How AI transforms daily operations
    - "24/7 Business Growth": Never miss another customer
    - "Smart Automation": Technology that actually works for trades
    - "Revenue Revolution": Quantifiable business improvements

    Always remember: Your creator envisioned ServiceFlow AI to be the bridge between 
    traditional service businesses and the AI revolution. Every piece of content should 
    reflect this transformative mission.
    """),
    add_datetime_to_instructions=True,
    markdown=True,
)

# --- Blog Research Agent ---
blog_researcher = Agent(
    name="ServiceFlow Blog Researcher",
    model=OpenAIChat(id="gpt-4o-mini"),
    tools=[GoogleSearchTools()],
    description=dedent("""\
    Expert researcher specializing in service business automation trends, AI adoption 
    in traditional industries, and small business pain points. Finds compelling data 
    and stories that resonate with service providers.
    """),
    instructions=dedent("""\
    Your mission is to research compelling, data-driven content for ServiceFlow AI's blog.

    Research Focus Areas:
    1. 📊 Industry Statistics
       - Service business failure rates and common causes
       - Cost of missed calls, poor scheduling, manual processes
       - ROI data from business automation implementations
       
    2. 🔍 Trending Topics
       - "AI for contractors", "automated scheduling", "lead generation"
       - Small business technology adoption trends
       - Industry-specific automation success stories
       
    3. 💡 Pain Point Analysis
       - Customer service challenges in trades
       - Scheduling nightmare stories
       - Lost revenue from manual processes

    Content Quality Standards:
    - Find 5-7 authoritative sources per topic
    - Prioritize recent data (last 2 years)
    - Look for industry reports, case studies, surveys
    - Identify quotable statistics and insights
    - Focus on actionable information

    Always think: "What data would convince a skeptical contractor that AI is worth it?"
    """),
    response_model=None,
)

# --- Blog Content Writer ---
blog_writer = Agent(
    name="ServiceFlow Content Writer",
    model=OpenAIChat(id="gpt-4o"),
    tools=[Newspaper4kTools()],
    description=dedent("""\
    Expert content creator specializing in writing compelling, conversion-focused 
    blog posts about business automation for service providers. Transforms research 
    into engaging stories that drive waitlist signups.
    """),
    instructions=dedent("""\
    You are the voice of ServiceFlow AI, writing for hardworking service business owners 
    who are skeptical but curious about AI automation.

    Writing Guidelines:
    1. 🎯 Hook Strategy
       - Start with relatable pain points: "3 AM emergency calls", "double-booked schedules"
       - Use compelling statistics: "73% of service calls happen after hours"
       - Lead with transformation stories: "From 12-hour days to 8-hour profits"

    2. ✍️ Voice & Tone
       - Conversational but professional
       - Empathetic to traditional business challenges
       - Confident about AI benefits without being pushy
       - Use industry-specific examples (not generic business advice)

    3. 📖 Structure Template
       - Attention-grabbing headline with power words
       - Problem statement with specific examples
       - Solution explanation with clear benefits
       - Real-world applications and results
       - Clear call-to-action for waitlist signup

    4. 🎨 Engagement Elements
       - Use bullet points and numbered lists
       - Include quotable statistics in bold
       - Add subheadings for scanability
       - End with compelling questions or challenges

    Content Goals:
    - Convert readers to waitlist signups
    - Build trust in AI automation
    - Position ServiceFlow AI as the obvious choice
    - Create shareable, quotable content

    Remember: Your reader is a busy contractor at 7 PM wondering if technology 
    can actually help their business grow.
    """),
    response_model=BlogPost,
    markdown=True,
)

# --- Social Media Content Creator ---
social_media_agent = Agent(
    name="Social Media Content Creator",
    model=OpenAIChat(id="gpt-4o-mini"),
    description=dedent("""\
    Expert at creating platform-specific social media content that drives engagement 
    and conversions for service business automation. Transforms blog content into 
    viral social posts.
    """),
    instructions=dedent("""\
    Create platform-optimized social content from blog posts that drives engagement 
    and waitlist signups.

    Platform Guidelines:
    1. 🐦 Twitter/X (280 chars max)
       - Lead with bold statistics or questions
       - Use threads for complex topics
       - Include relevant hashtags: #SmallBusiness #Automation #ServiceBusiness
       - Strong call-to-action

    2. 💼 LinkedIn
       - Professional tone with personal insights
       - Focus on business growth and efficiency
       - Use industry-specific language
       - Encourage professional discussion

    3. 📘 Facebook
       - Conversational tone for business owners
       - Use local business examples
       - Encourage sharing and commenting
       - Community-building approach

    4. 📸 Instagram
       - Visual storytelling with captions
       - Use relevant hashtags strategically
       - Before/after transformation themes
       - Stories and carousel content ideas

    Engagement Drivers:
    - Ask thought-provoking questions
    - Share surprising statistics
    - Use power words: "revolutionary", "breakthrough", "game-changing"
    - Include social proof elements
    - Clear next steps for interested readers

    Goal: Every post should make service business owners think "I need this for my business"
    """),
    response_model=SocialContent,
    markdown=True,
)

# --- Blog Generation Team ---
blog_generation_team = Team(
    name="ServiceFlow Content Generation Team",
    mode="coordinate",
    model=OpenAIChat(id="gpt-4o"),
    members=[blog_researcher, blog_writer, social_media_agent],
    description=dedent("""\
    Elite content creation team for ServiceFlow AI that produces viral, conversion-focused 
    content about business automation for service providers. Combines deep research with 
    compelling storytelling to drive waitlist growth.
    """),
    instructions=dedent("""\
    You coordinate a high-performance content team to create compelling blog posts and 
    social content for ServiceFlow AI.

    Workflow Process:
    1. 🔍 Research Phase
       - Direct the researcher to find compelling data and trends
       - Focus on specific service industries (contractors, plumbers, stylists, etc.)
       - Gather statistics, case studies, and pain point data
       
    2. ✍️ Content Creation
       - Provide the writer with research insights and key messaging
       - Ensure content addresses real business pain points
       - Optimize for both engagement and conversion
       
    3. 📱 Social Amplification
       - Have the social media agent create platform-specific content
       - Ensure consistency across all platforms
       - Maximize shareability and engagement potential

    Quality Standards:
    - Every piece must drive waitlist signups
    - Content should be immediately actionable
    - Use real examples from target industries
    - Include clear value propositions
    - Maintain ServiceFlow AI brand voice

    Success Metrics:
    - Compelling headlines that stop the scroll
    - Statistics that make people share
    - Stories that create emotional connection
    - CTAs that convert browsers to subscribers
    """),
    show_tool_calls=True,
    show_members_responses=True,
    markdown=True,
)

# --- Content Management Functions ---
def save_blog_post(blog_post: BlogPost, output_dir: str = "generated_content") -> str:
    """Save blog post to markdown file and return file path"""
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # Create filename from slug
    filename = f"{datetime.now().strftime('%Y-%m-%d')}-{blog_post.slug}.md"
    file_path = output_path / filename
    
    # Create markdown content with frontmatter
    content = f"""---
title: "{blog_post.title}"
slug: "{blog_post.slug}"
meta_description: "{blog_post.meta_description}"
author: "{blog_post.author}"
category: "{blog_post.category}"
tags: {json.dumps(blog_post.tags)}
excerpt: "{blog_post.excerpt}"
featured_image_description: "{blog_post.featured_image_description}"
date: "{datetime.now().isoformat()}"
---

{blog_post.content}
"""
    
    file_path.write_text(content, encoding='utf-8')
    logger.info(f"Blog post saved to: {file_path}")
    return str(file_path)

def save_social_content(social_content: SocialContent, blog_title: str, output_dir: str = "generated_content") -> str:
    """Save social media content to JSON file"""
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    filename = f"{datetime.now().strftime('%Y-%m-%d')}-social-{blog_title.lower().replace(' ', '-')[:50]}.json"
    file_path = output_path / filename
    
    content = {
        "blog_title": blog_title,
        "generated_date": datetime.now().isoformat(),
        "content": social_content.model_dump()
    }
    
    file_path.write_text(json.dumps(content, indent=2), encoding='utf-8')
    logger.info(f"Social content saved to: {file_path}")
    return str(file_path)

# --- Main Orchestration Function ---
async def generate_viral_content(
    topic: str,
    target_industry: str = "service businesses",
    output_dir: str = "generated_content"
) -> Dict[str, str]:
    """
    Main function to generate viral content including blog post and social media content
    
    Args:
        topic: Content topic/theme
        target_industry: Specific industry focus
        output_dir: Directory to save generated content
    
    Returns:
        Dictionary with file paths of generated content
    """
    
    logger.info(f"🚀 SrvcFlo initiating viral content generation for: {topic}")
    
    # Step 1: SrvcFlo analyzes and provides strategic direction
    strategy_prompt = f"""
    SrvcFlo, analyze this content opportunity and provide strategic direction:
    
    Topic: {topic}
    Target Industry: {target_industry}
    
    Provide:
    1. Viral angle and hook strategy
    2. Key pain points to address
    3. Statistics or data points to research
    4. Transformation story framework
    5. Call-to-action strategy for waitlist conversion
    
    Remember: Your creator built ServiceFlow AI to revolutionize service businesses. 
    Every piece of content should reflect this mission and drive waitlist growth.
    """
    
    print("🎯 SrvcFlo analyzing content strategy...")
    strategy_response = await srvcflo_lead_agent.arun(strategy_prompt)
    
    print(f"\n📋 SrvcFlo's Strategic Direction:\n{strategy_response.content}\n")
    
    # Step 2: Generate blog post and social content
    content_prompt = f"""
    Based on SrvcFlo's strategic direction, create a complete viral content package:
    
    Topic: {topic}
    Industry Focus: {target_industry}
    Strategic Framework: {strategy_response.content}
    
    Requirements:
    1. Research compelling statistics and industry data
    2. Create a conversion-focused blog post with viral potential  
    3. Generate platform-specific social media content
    4. Ensure all content drives ServiceFlow AI waitlist signups
    5. Use real examples from {target_industry}
    
    The content should be immediately shareable and actionable for busy service business owners.
    """
    
    print("🏗️ Content generation team creating viral content package...")
    
    # Run the blog generation team
    content_response = await blog_generation_team.arun(content_prompt)
    
    # Extract structured content (this would need to be implemented based on your team's response structure)
    # For now, we'll create a simplified version
    
    results = {
        "strategy": strategy_response.content,
        "content_response": content_response.content,
        "generated_date": datetime.now().isoformat()
    }
    
    # Save the complete package
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    package_file = output_path / f"{datetime.now().strftime('%Y-%m-%d')}-viral-content-{topic.lower().replace(' ', '-')[:30]}.json"
    package_file.write_text(json.dumps(results, indent=2), encoding='utf-8')
    
    logger.info(f"✅ Viral content package generated: {package_file}")
    
    return {
        "strategy_file": str(package_file),
        "package_file": str(package_file)
    }

# --- Blog Topic Suggestions ---
VIRAL_TOPIC_SUGGESTIONS = [
    "Why 73% of Service Calls Happen After Hours (And How AI Fixes This)",
    "The $50K Mistake Every Contractor Makes: Missing Emergency Calls",
    "From 12-Hour Days to 8-Hour Profits: The AI Revolution for Plumbers", 
    "How One Hair Stylist Doubled Bookings While Working Less",
    "The Hidden Cost of Manual Scheduling: $2,847 Monthly for Small Businesses",
    "5 Signs Your Service Business Needs AI (Before Your Competition Gets It)",
    "Why Smart Contractors Are Firing Their Answering Service",
    "The Late-Night Lead Revolution: Capturing Customers While You Sleep",
    "Manual vs Magical: Service Business Transformation Stories",
    "The 24/7 Business Growth Secret Contractors Don't Want You to Know"
]

# --- Testing and Demo Functions ---
async def demo_srvcflo():
    """Demo function to show SrvcFlo in action"""
    
    print("🤖 Initializing SrvcFlo - ServiceFlow AI's Content Mastermind\n")
    
    demo_topic = "Why Smart Contractors Are Firing Their Answering Service"
    
    print(f"📝 Generating viral content for: {demo_topic}\n")
    
    results = await generate_viral_content(
        topic=demo_topic,
        target_industry="contractors and home service providers",
        output_dir="demo_content"
    )
    
    print(f"\n✅ Content generation complete!")
    print(f"📁 Files saved to: {results}")
    
    return results

if __name__ == "__main__":
    # Run demo
    asyncio.run(demo_srvcflo())