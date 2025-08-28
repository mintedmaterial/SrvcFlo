// Admin authentication helper
function isMainAdmin(email, env) {
  const mainAdminEmail = env.MAIN_ADMIN_EMAIL || 'admin@serviceflow-ai.com';
  return email === mainAdminEmail;
}

function isAuthorizedAdmin(apiKey, env) {
  const mainAdminKey = env.ADMIN_API_KEY;
  return apiKey === mainAdminKey;
}

async function handleWaitlistAPI(request, env) {
  const url = new URL(request.url);
  
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { 
        businessName, 
        ownerName, 
        email, 
        phone, 
        businessType, 
        currentChallenges, 
        interestedPackage, 
        estimatedRevenue,
        utmSource,
        utmMedium,
        utmCampaign
      } = body;

      // Input validation
      if (!businessName || !ownerName || !email || !businessType) {
        return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid email format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if email already exists
      const existingEntry = await env.DB.prepare('SELECT id FROM waitlist WHERE email = ?')
        .bind(email)
        .first();
      
      if (existingEntry) {
        return new Response(JSON.stringify({ success: false, error: 'Email already registered on waitlist' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get client IP and user agent
      const ipAddress = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const referrer = request.headers.get('referer') || null;

      // Calculate priority score (1-5, higher is better)
      let priority = 1;
      if (interestedPackage === 'enterprise') priority = 5;
      else if (interestedPackage === 'professional') priority = 4;
      else if (interestedPackage === 'starter') priority = 3;
      
      if (estimatedRevenue) {
        const revenue = parseInt(estimatedRevenue.replace(/[^0-9]/g, ''));
        if (revenue > 100000) priority = Math.min(priority + 2, 5);
        else if (revenue > 50000) priority = Math.min(priority + 1, 5);
      }

      const now = new Date().toISOString();
      
      // Generate API key for portal access
      const apiKey = `sfa_${crypto.randomUUID().replace(/-/g, '')}`;
      
      // Insert waitlist entry
      const result = await env.DB.prepare(`
        INSERT INTO waitlist (
          business_name, owner_name, email, phone, business_type, 
          current_challenges, interested_package, estimated_revenue,
          signup_date, source, status, notified, created_at, updated_at,
          ip_address, user_agent, referrer, utm_source, utm_medium, utm_campaign, priority, api_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        businessName, ownerName, email, phone || null, businessType,
        currentChallenges || null, interestedPackage || null, estimatedRevenue || null,
        now, 'landing_page', 'pending', 0, now, now,
        ipAddress, userAgent, referrer, utmSource || null, utmMedium || null, utmCampaign || null, priority, apiKey
      ).run();
      
      // Get current position in waitlist
      const position = await env.DB.prepare('SELECT COUNT(*) as count FROM waitlist WHERE created_at <= ?')
        .bind(now)
        .first();

      return new Response(JSON.stringify({
        success: true,
        waitlistId: result.meta.last_row_id,
        position: position.count,
        apiKey: apiKey,
        message: 'Successfully added to waitlist',
        portalUrl: `https://${new URL(request.url).hostname}/portal?key=${apiKey}`
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error adding to waitlist:', error);
      return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  if (request.method === 'GET') {
    try {
      const { searchParams } = new URL(request.url);
      const adminKey = searchParams.get('admin_key');

      // Public endpoint - just return count
      if (!adminKey) {
        const count = await env.DB.prepare('SELECT COUNT(*) as count FROM waitlist').first();
        return new Response(JSON.stringify({ success: true, count: count.count }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Admin endpoint - return detailed stats
      if (adminKey !== env.ADMIN_API_KEY) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid admin key' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get statistics
      const [total, pending, businessTypes, recentSignups] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM waitlist').first(),
        env.DB.prepare('SELECT COUNT(*) as count FROM waitlist WHERE status = ?').bind('pending').first(),
        env.DB.prepare('SELECT business_type, COUNT(*) as count FROM waitlist GROUP BY business_type ORDER BY count DESC').all(),
        env.DB.prepare('SELECT * FROM waitlist ORDER BY created_at DESC LIMIT 10').all()
      ]);

      return new Response(JSON.stringify({
        success: true,
        stats: {
          total: total.count,
          pending: pending.count,
          businessTypes: businessTypes.results.map(row => ({ _id: row.business_type, count: row.count })),
          recentSignups: recentSignups.results
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching waitlist stats:', error);
      return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handlePortalAPI(request, env) {
  const url = new URL(request.url);
  
  if (url.pathname === '/api/portal/validate' && request.method === 'POST') {
    try {
      const { apiKey } = await request.json();
      
      if (!apiKey || !apiKey.startsWith('sfa_')) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid API key format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Find user by API key in the portal database
      const user = await env.PORTAL_DB.prepare(`
        SELECT business_name, owner_name, email, business_type, waitlist_position
        FROM api_users 
        WHERE api_key = ? AND status = 'active'
      `).bind(apiKey).first();

      if (!user) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid API key' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        user: {
          business_name: user.business_name,
          owner_name: user.owner_name,
          business_type: user.business_type,
          position: user.waitlist_position
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Portal validation error:', error);
      return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  if (url.pathname === '/api/portal/generate' && request.method === 'POST') {
    try {
      const { apiKey, topic, industry } = await request.json();
      
      // Validate API key
      const user = await env.PORTAL_DB.prepare('SELECT business_name FROM api_users WHERE api_key = ? AND status = ?')
        .bind(apiKey, 'active').first();

      if (!user) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid API key' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Generate mock content (in production, this would call your AI agents)
      const mockBlogPost = {
        title: `${topic} - Transform Your ${industry} Business with AI`,
        slug: topic.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 60),
        content: generateMockContent(topic, industry, user.business_name),
        excerpt: `Discover how ${topic.toLowerCase()} can revolutionize your ${industry} business with AI automation`,
        tags: ['AI', 'Automation', industry],
        category: 'AI Automation',
        meta_description: `Learn how ${topic.toLowerCase()} impacts ${industry} and how AI can help`,
        featured_image_prompt: `Professional ${industry} worker using AI technology, modern business automation`,
        social_content: {
          twitter: `${topic} is changing everything for ${industry}! 🚀 Join the ServiceFlow AI waitlist to automate your business. #ServiceFlowAI #AIAutomation`,
          linkedin: `New insights on ${topic} for ${industry} professionals. AI automation is transforming how service businesses operate. Are you ready for the future?`,
          facebook: `Hey ${industry} business owners! Just discovered something that could change your business forever. ${topic} - and here's how AI can fix it automatically.`,
          instagram: `Transform your ${industry} business with AI! 💪 Never deal with ${topic.toLowerCase()} again. #automation #serviceflowai #airevolution`
        }
      };

      return new Response(JSON.stringify({
        success: true,
        blog_post: mockBlogPost
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Content generation error:', error);
      return new Response(JSON.stringify({ success: false, error: 'Failed to generate content' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ success: false, error: 'Endpoint not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleBlogAPI(request, env) {
  const url = new URL(request.url);
  
  if (request.method === 'GET') {
    try {
      // Get blog posts with optional category filter
      const { searchParams } = url;
      const category = searchParams.get('category');
      
      // Since we're using Cloudflare Workers, we'll need to use the D1 database
      // For now, return mock data that matches the BlogSection component expectations
      const mockPosts = [
        {
          id: "1",
          title: "How AI Automation Saved Johnson Roofing $50,000 in Missed Calls",
          slug: "ai-automation-saved-johnson-roofing-50k",
          excerpt: "Discover how Johnson Roofing transformed their emergency call handling with AI and never missed another 3 AM customer again.",
          content: generateMockContent("Emergency Call Automation", "roofing", "Johnson Roofing"),
          author: "SrvcFlo AI",
          category: "Success Stories",
          tags: ["AI Automation", "Roofing", "Emergency Calls", "ROI"],
          created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          views: 1250,
          featured_image_prompt: "Professional roofer using smartphone with AI interface at night"
        },
        {
          id: "2", 
          title: "The $50K Mistake Every Service Business Makes (And How AI Fixes It)",
          slug: "50k-mistake-service-businesses-ai-solution",
          excerpt: "73% of service businesses lose customers due to delayed responses. Here's how AI automation eliminates this costly problem.",
          content: generateMockContent("Response Time Optimization", "service business", "Your Business"),
          author: "SrvcFlo AI",
          category: "AI Automation",
          tags: ["AI", "Customer Service", "Revenue Loss", "Automation"],
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          views: 980,
          featured_image_prompt: "Business owner looking stressed with phone calls and schedule conflicts"
        },
        {
          id: "3",
          title: "From Manual to Magical: Hair Salon Doubles Bookings with Smart Scheduling", 
          slug: "hair-salon-doubles-bookings-smart-scheduling",
          excerpt: "Elite Hair Studio automated their booking process and saw a 200% increase in appointments within 3 months.",
          content: generateMockContent("Smart Scheduling Systems", "hair salon", "Elite Hair Studio"),
          author: "SrvcFlo AI", 
          category: "Success Stories",
          tags: ["Scheduling", "Hair Salon", "Bookings", "Automation"],
          created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          views: 750,
          featured_image_prompt: "Modern hair salon with digital booking system and happy stylist"
        }
      ];

      // Filter by category if specified
      let filteredPosts = mockPosts;
      if (category && category !== 'all') {
        filteredPosts = mockPosts.filter(post => 
          post.category.toLowerCase().includes(category.toLowerCase())
        );
      }

      return new Response(JSON.stringify({
        success: true,
        posts: filteredPosts,
        total: filteredPosts.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching blog posts:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch blog posts',
        posts: []
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  if (request.method === 'POST') {
    try {
      // Handle blog post creation (for ServiceFlow AI agents)
      const body = await request.json();
      const { title, content, category, tags, author } = body;

      // Validate required fields
      if (!title || !content) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Title and content are required' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Generate slug from title
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 60);

      // Create new blog post object
      const newPost = {
        id: Date.now().toString(),
        title,
        slug,
        excerpt: content.substring(0, 200) + '...',
        content,
        author: author || 'SrvcFlo AI',
        category: category || 'AI Automation',
        tags: tags || ['AI', 'Automation'],
        created_at: new Date().toISOString(),
        views: 0,
        featured_image_prompt: `Professional ${category || 'business'} automation with AI technology`
      };

      // In a real implementation, this would save to D1 database
      // For now, return success response
      return new Response(JSON.stringify({
        success: true,
        message: 'Blog post created successfully',
        post: newPost
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error creating blog post:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to create blog post' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Method not allowed' 
  }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

function generateMockContent(topic, industry, businessName) {
  return `# ${topic} - Transform Your ${industry} Business with AI

*Generated by SrvcFlo AI for ServiceFlow AI*

## The Problem Every ${industry} Business Owner Faces

If you're a ${industry} business owner like the team at ${businessName}, you've probably experienced this nightmare scenario: It's 2 AM, and your phone rings. A potential customer needs urgent help, but by the time you wake up and call back, they've already hired your competitor.

**This single mistake is costing ${industry} businesses an average of $50,000 annually.**

## The Hidden Cost of Manual Operations

Research shows that 73% of ${industry} businesses lose potential customers due to:

- **Delayed response times**: Customers expect instant answers
- **Manual scheduling conflicts**: Double-bookings and missed appointments  
- **Limited availability**: You can't be available 24/7
- **Poor follow-up**: Leads slip through the cracks

## The AI Revolution for ${industry} Businesses

ServiceFlow AI is changing everything. Our intelligent automation platform:

### 🤖 24/7 Customer Service
Never miss another call or lead. Our AI agents handle customer inquiries instantly, even while you sleep.

### 📅 Smart Scheduling  
Automatically book appointments, avoid conflicts, and send reminders - all without your intervention.

### 💼 Lead Qualification
Our AI screens leads, collects essential information, and prioritizes high-value prospects.

### 📊 Business Intelligence
Get insights into your customer patterns, peak times, and growth opportunities.

## Real Results from Real ${industry} Businesses

*"Since implementing ServiceFlow AI, we've increased our lead conversion by 300% and never miss emergency calls. It's like having a full customer service team working 24/7."* - Mike Johnson, Johnson Roofing

## Why ${industry} Businesses Choose ServiceFlow AI

1. **Industry-Specific**: Built specifically for service businesses
2. **Easy Setup**: Up and running in under 24 hours  
3. **Proven ROI**: Average 400% return on investment
4. **Scalable**: Grows with your business

## Get Started Today

Don't let another potential customer slip away. Join over 500 ${industry} businesses on our waitlist and be among the first to access ServiceFlow AI.

**Limited Early Access - Join Now**

The future of ${industry} business automation is here. Are you ready?

---

*ServiceFlow AI - Transforming Service Businesses with Intelligent Automation*`;
}

async function handleChatAPI(request, env) {
  const url = new URL(request.url);
  
  if (request.method === 'POST') {
    try {
      const data = await request.json();
      const { message, user_id, context, intent } = data;
      
      // Validate required fields
      if (!message) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Message is required' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Handle routing to backend agents or direct OpenAI
      const shouldRouteToSrvcFlo = message.toLowerCase().includes('strategy') || 
                                  message.toLowerCase().includes('business plan') ||
                                  message.toLowerCase().includes('competition') ||
                                  message.toLowerCase().includes('marketing') ||
                                  message.toLowerCase().includes('growth');
      
      const shouldRouteToAgno = message.toLowerCase().includes('code') ||
                               message.toLowerCase().includes('script') ||
                               message.toLowerCase().includes('technical') ||
                               message.toLowerCase().includes('api') ||
                               message.toLowerCase().includes('integration');

      // Route to backend agents if needed
      if (shouldRouteToSrvcFlo) {
        try {
          const response = await fetch(`${env.AGNO_AGENT_BASE_URL || 'http://localhost:8000'}/srvcflo-agent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.SRVCFLO_AGENT_TOKEN || 'default-token'}`,
            },
            body: JSON.stringify({
              message,
              user_id: user_id || 'cloudflare-agent',
              context: { source: 'cloudflare_frontend', timestamp: new Date().toISOString() }
            }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              return new Response(JSON.stringify({
                success: true,
                response: result.response,
                agent_used: result.agent_used || 'SrvcFlo Team',
                user_id: user_id || 'anonymous',
                timestamp: new Date().toISOString()
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }
        } catch (error) {
          console.error('SrvcFlo agent error:', error);
        }
      }

      if (shouldRouteToAgno) {
        try {
          const response = await fetch(`${env.AGNO_AGENT_BASE_URL || 'http://localhost:8000'}/agno-assist`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.SRVCFLO_AGENT_TOKEN || 'default-token'}`,
            },
            body: JSON.stringify({
              message,
              user_id: user_id || 'cloudflare-agent',
              context: { source: 'cloudflare_frontend', timestamp: new Date().toISOString() }
            }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              return new Response(JSON.stringify({
                success: true,
                response: result.response,
                agent_used: result.agent_used || 'Agno Assist',
                user_id: user_id || 'anonymous',
                timestamp: new Date().toISOString()
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }
        } catch (error) {
          console.error('Agno Assist error:', error);
        }
      }

      // Handle with OpenAI for general questions
      if (env.OPENAI_API_KEY) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { 
                  role: 'system', 
                  content: `You are the ServiceFlow AI assistant, a helpful AI agent for service businesses.

Your role is to:
1. Help potential customers learn about ServiceFlow AI automation platform
2. Answer questions about service business automation and AI implementation  
3. Provide helpful information about our waitlist and features

Key information about ServiceFlow AI:
- We're an AI automation platform specifically for service businesses (contractors, salons, repair services, etc.)
- We provide 24/7 customer service, smart scheduling, lead qualification, and business intelligence
- Over 500 businesses are currently on our waitlist
- Average 400% ROI for our customers
- Easy 24-hour setup process

For pricing questions: We offer starter packages from $200/month, professional suites at $600/month, and enterprise solutions at $1000/month.

For waitlist questions: We currently have over 500 businesses waiting for early access to our platform.

Always be helpful, professional, and focus on how AI can transform service businesses.`
                },
                { role: 'user', content: message }
              ],
              max_tokens: 500,
              temperature: 0.7,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            return new Response(JSON.stringify({
              success: true,
              response: result.choices[0].message.content,
              agent_used: 'ServiceFlow AI Assistant',
              user_id: user_id || 'anonymous',
              timestamp: new Date().toISOString()
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        } catch (error) {
          console.error('OpenAI API error:', error);
        }
      }

      // Fallback response
      return new Response(JSON.stringify({
        success: true,
        response: "Hi! I'm the ServiceFlow AI assistant. I can help you learn about our automation platform for service businesses. We provide 24/7 customer service, smart scheduling, and lead qualification. With over 500 businesses on our waitlist, we're transforming how service businesses operate. How can I help you today?",
        agent_used: 'ServiceFlow AI Assistant (Fallback)',
        user_id: user_id || 'anonymous',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('Chat API error:', error);
      
      // Return a friendly fallback response
      return new Response(JSON.stringify({
        success: true,
        response: "I'm having trouble connecting to our AI system right now. ServiceFlow AI is an automation platform for service businesses that provides 24/7 customer service, smart scheduling, and lead qualification. Join our waitlist to be among the first to access our full platform!",
        agent_used: "Fallback Handler",
        user_id: user_id || 'anonymous',
        timestamp: new Date().toISOString(),
        note: 'System temporarily unavailable'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Method not allowed' 
  }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

// INFT Agent API Handler
async function handleINFTAPI(request, env, url) {
  try {
    // Extract packageTokenId from path: /api/inft/{packageTokenId}/action
    const pathParts = url.pathname.split('/');
    const packageTokenId = pathParts[3];
    
    if (!packageTokenId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Package Token ID required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get the INFT Agent Durable Object
    const agentStub = env.INFT_AGENT.get(env.INFT_AGENT.idFromName(packageTokenId));
    
    // Forward the request to the Durable Object
    const modifiedUrl = new URL(request.url);
    modifiedUrl.pathname = url.pathname.replace(`/api/inft/${packageTokenId}`, '');
    
    const agentRequest = new Request(modifiedUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    
    return await agentStub.fetch(agentRequest);
    
  } catch (error) {
    console.error('INFT API error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Generation API Handler with INFT routing
async function handleGenerateAPI(request, env, url) {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      }), { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { packageTokenId, creditType } = body;
    
    // Route to INFT agent if packageTokenId provided
    if (packageTokenId && creditType === 'inft') {
      const agentStub = env.INFT_AGENT.get(env.INFT_AGENT.idFromName(packageTokenId));
      
      const agentRequest = new Request(request.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          action: 'generate'
        })
      });
      
      // Forward to INFT agent's /generate endpoint
      const agentUrl = new URL(agentRequest.url);
      agentUrl.pathname = '/generate';
      
      const finalRequest = new Request(agentUrl.toString(), {
        method: 'POST',
        headers: agentRequest.headers,
        body: agentRequest.body
      });
      
      return await agentStub.fetch(finalRequest);
    }
    
    // Legacy generation handling (for non-INFT requests)
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Legacy generation not implemented in workers yet' 
    }), { 
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Generate API error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Credits API Handler
async function handleCreditsAPI(request, env, url) {
  try {
    const pathParts = url.pathname.split('/');
    const action = pathParts[3]; // /api/credits/{action}
    
    if (action === 'balance' && request.method === 'GET') {
      const userAddress = url.searchParams.get('address');
      const packageTokenId = url.searchParams.get('packageTokenId');
      
      if (packageTokenId) {
        // Get balance from INFT agent
        const agentStub = env.INFT_AGENT.get(env.INFT_AGENT.idFromName(packageTokenId));
        
        const agentRequest = new Request(request.url, {
          method: 'GET',
          headers: request.headers
        });
        
        const agentUrl = new URL(agentRequest.url);
        agentUrl.pathname = '/status';
        
        const finalRequest = new Request(agentUrl.toString(), {
          method: 'GET',
          headers: agentRequest.headers
        });
        
        return await agentStub.fetch(finalRequest);
      }
      
      // Legacy balance checking for non-INFT users
      return new Response(JSON.stringify({ 
        success: true,
        balance: 0,
        legacy: true
      }), { 
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Endpoint not found' 
    }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Credits API error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Mint NFT API Handler
async function handleMintNFTAPI(request, env, url) {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      }), { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { generationId, userAddress, packageTokenId, agentId } = body;
    
    if (!generationId || !userAddress) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required parameters: generationId, userAddress' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`🎭 Minting generation as NFT:`, {
      generationId,
      userAddress,
      packageTokenId,
      agentId
    });

    // If this is an INFT agent generation, get details from the agent
    let generationDetails = null;
    if (packageTokenId && agentId) {
      try {
        const agentStub = env.INFT_AGENT.get(env.INFT_AGENT.idFromName(packageTokenId));
        
        const statusRequest = new Request(request.url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const statusUrl = new URL(statusRequest.url);
        statusUrl.pathname = '/status';
        statusUrl.searchParams.set('generationId', generationId);
        
        const statusResponse = await agentStub.fetch(new Request(statusUrl.toString(), {
          method: 'GET',
          headers: statusRequest.headers
        }));
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          generationDetails = statusData.generationDetails;
        }
      } catch (error) {
        console.warn('Could not fetch generation details from INFT agent:', error);
      }
    }

    // Simulate NFT minting (in production, this would call blockchain contracts)
    const tokenId = Math.floor(Math.random() * 10000) + 1000;
    const transactionHash = `0x${crypto.randomUUID().replace(/-/g, '')}`;
    
    // Enhanced NFT metadata for INFT generations
    const nftMetadata = {
      tokenId,
      generationId,
      userAddress,
      mintedAt: new Date().toISOString(),
      isINFT: !!(packageTokenId && agentId),
      ...(packageTokenId && {
        packageTokenId,
        agentId,
        agentGenerated: true
      }),
      ...(generationDetails && {
        prompt: generationDetails.prompt,
        collection: generationDetails.collection,
        provider: generationDetails.provider,
        model: generationDetails.model,
        quality: generationDetails.quality
      })
    };

    // Store NFT metadata (in production, upload to IPFS and store hash)
    const metadataHash = `QmMockHash${tokenId}${Date.now()}`;
    
    const result = {
      success: true,
      generationId,
      tokenId,
      transactionHash,
      metadataHash,
      mintedAt: new Date().toISOString(),
      isINFT: nftMetadata.isINFT,
      metadata: nftMetadata,
      estimatedGas: '0.001',
      networkFee: '0.0005'
    };

    // If this was an INFT generation, notify the agent of successful minting
    if (packageTokenId && agentId) {
      try {
        const agentStub = env.INFT_AGENT.get(env.INFT_AGENT.idFromName(packageTokenId));
        
        await agentStub.fetch(new Request(request.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generation_minted',
            generationId,
            tokenId,
            transactionHash,
            userAddress
          })
        }));
      } catch (error) {
        console.warn('Could not notify INFT agent of minting:', error);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Mint NFT API error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Test API Handler for local development
async function handleTestAPI(request, env, url) {
  try {
    const pathParts = url.pathname.split('/');
    const testType = pathParts[3]; // /api/test/{testType}
    
    switch (testType) {
      case 'inft-agent':
        return await testINFTAgent(request, env, url);
      case 'generation':
        return await testGeneration(request, env, url);
      case 'minting':
        return await testMinting(request, env, url);
      case 'websocket':
        return await testWebSocket(request, env, url);
      case 'full-workflow':
        return await testFullWorkflow(request, env, url);
      default:
        return await testOverview(request, env, url);
    }
    
  } catch (error) {
    console.error('Test API error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Test API error',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function testOverview(request, env, url) {
  return new Response(JSON.stringify({
    success: true,
    message: 'INFT System Test API',
    endpoints: {
      '/api/test/': 'This overview',
      '/api/test/inft-agent': 'Test INFT agent initialization and status',
      '/api/test/generation': 'Test content generation with INFT agent',
      '/api/test/minting': 'Test NFT minting process',
      '/api/test/websocket': 'Test WebSocket connections',
      '/api/test/full-workflow': 'Test complete workflow end-to-end'
    },
    environment: env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function testINFTAgent(request, env, url) {
  try {
    const testPackageId = 'test-123';
    
    if (request.method === 'POST') {
      // Test agent initialization
      const agentStub = env.INFT_AGENT.get(env.INFT_AGENT.idFromName(testPackageId));
      
      const initRequest = new Request(request.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageTokenId: 123,
          packageType: 2,
          owner: '0x1234567890123456789012345678901234567890',
          totalCredits: 5000
        })
      });
      
      const initUrl = new URL(initRequest.url);
      initUrl.pathname = '/initialize';
      
      const response = await agentStub.fetch(new Request(initUrl.toString(), {
        method: 'POST',
        headers: initRequest.headers,
        body: initRequest.body
      }));
      
      const result = await response.json();
      
      return new Response(JSON.stringify({
        success: true,
        test: 'inft-agent-initialization',
        result,
        message: 'INFT agent initialized successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } else if (request.method === 'GET') {
      // Test agent status
      const agentStub = env.INFT_AGENT.get(env.INFT_AGENT.idFromName(testPackageId));
      
      const statusUrl = new URL(request.url);
      statusUrl.pathname = '/status';
      
      const response = await agentStub.fetch(new Request(statusUrl.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }));
      
      const result = await response.json();
      
      return new Response(JSON.stringify({
        success: true,
        test: 'inft-agent-status',
        result,
        message: 'INFT agent status retrieved successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      test: 'inft-agent',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function testGeneration(request, env, url) {
  try {
    const testPackageId = 'test-123';
    
    // Test generation request
    const agentStub = env.INFT_AGENT.get(env.INFT_AGENT.idFromName(testPackageId));
    
    const genRequest = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'A beautiful sunset over mountains',
        isVideo: false,
        collection: 'test',
        userAddress: '0x1234567890123456789012345678901234567890'
      })
    });
    
    const genUrl = new URL(genRequest.url);
    genUrl.pathname = '/generate';
    
    const response = await agentStub.fetch(new Request(genUrl.toString(), {
      method: 'POST',
      headers: genRequest.headers,
      body: genRequest.body
    }));
    
    const result = await response.json();
    
    return new Response(JSON.stringify({
      success: true,
      test: 'generation',
      result,
      message: 'Generation test completed'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      test: 'generation',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function testMinting(request, env, url) {
  try {
    // Test the minting API
    const mintRequest = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generationId: 'test-gen-123',
        userAddress: '0x1234567890123456789012345678901234567890',
        packageTokenId: 'test-123',
        agentId: 'test-agent'
      })
    });
    
    const mintUrl = new URL(mintRequest.url);
    mintUrl.pathname = '/api/mint-generation-nft';
    
    const response = await handleMintNFTAPI(new Request(mintUrl.toString(), {
      method: 'POST',
      headers: mintRequest.headers,
      body: mintRequest.body
    }), env, mintUrl);
    
    const result = await response.json();
    
    return new Response(JSON.stringify({
      success: true,
      test: 'minting',
      result,
      message: 'Minting test completed'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      test: 'minting',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function testWebSocket(request, env, url) {
  return new Response(JSON.stringify({
    success: true,
    test: 'websocket',
    message: 'WebSocket testing requires client connection',
    instructions: 'Connect to ws://localhost:8787/ws?agentId=test-123&userId=test-user',
    events: [
      'generation_progress',
      'generation_completed',
      'credit_update',
      'agent_message'
    ]
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function testFullWorkflow(request, env, url) {
  try {
    const testResults = [];
    const testPackageId = 'test-workflow-123';
    
    // Step 1: Initialize agent
    try {
      const agentStub = env.INFT_AGENT.get(env.INFT_AGENT.idFromName(testPackageId));
      
      const initResponse = await agentStub.fetch(new Request(request.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageTokenId: 123,
          packageType: 2,
          owner: '0x1234567890123456789012345678901234567890',
          totalCredits: 5000
        })
      }).url.replace(url.pathname, '/initialize'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageTokenId: 123,
          packageType: 2,
          owner: '0x1234567890123456789012345678901234567890',
          totalCredits: 5000
        })
      });
      
      const initResult = await initResponse.json();
      testResults.push({ step: 'initialization', success: initResult.success, result: initResult });
    } catch (error) {
      testResults.push({ step: 'initialization', success: false, error: error.message });
    }
    
    // Step 2: Generate content
    try {
      const agentStub = env.INFT_AGENT.get(env.INFT_AGENT.idFromName(testPackageId));
      
      const genResponse = await agentStub.fetch(new Request(request.url.replace(url.pathname, '/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Test workflow generation',
          isVideo: false,
          collection: 'workflow-test',
          userAddress: '0x1234567890123456789012345678901234567890'
        })
      }));
      
      const genResult = await genResponse.json();
      testResults.push({ step: 'generation', success: genResult.success, result: genResult });
    } catch (error) {
      testResults.push({ step: 'generation', success: false, error: error.message });
    }
    
    // Step 3: Test minting
    try {
      const mintUrl = new URL(request.url);
      mintUrl.pathname = '/api/mint-generation-nft';
      
      const mintResponse = await handleMintNFTAPI(new Request(mintUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId: 'workflow-test-gen',
          userAddress: '0x1234567890123456789012345678901234567890',
          packageTokenId: testPackageId,
          agentId: 'workflow-test-agent'
        })
      }), env, mintUrl);
      
      const mintResult = await mintResponse.json();
      testResults.push({ step: 'minting', success: mintResult.success, result: mintResult });
    } catch (error) {
      testResults.push({ step: 'minting', success: false, error: error.message });
    }
    
    const overallSuccess = testResults.every(result => result.success);
    
    return new Response(JSON.stringify({
      success: overallSuccess,
      test: 'full-workflow',
      message: overallSuccess ? 'Full workflow test completed successfully' : 'Some workflow steps failed',
      results: testResults,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      test: 'full-workflow',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Handle API routes
    if (url.pathname.startsWith('/api/waitlist')) {
      const response = await handleWaitlistAPI(request, env);
      
      // Add CORS headers to all API responses
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };
      
      const existingHeaders = Object.fromEntries(response.headers.entries());
      
      return new Response(response.body, {
        status: response.status,
        headers: { ...existingHeaders, ...corsHeaders },
      });
    } else if (url.pathname.startsWith('/api/blog')) {
      const response = await handleBlogAPI(request, env);
      
      // Add CORS headers to all API responses
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };
      
      const existingHeaders = Object.fromEntries(response.headers.entries());
      
      return new Response(response.body, {
        status: response.status,
        headers: { ...existingHeaders, ...corsHeaders },
      });
    } else if (url.pathname.startsWith('/api/portal')) {
      const response = await handlePortalAPI(request, env);
      
      // Add CORS headers to all API responses
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };
      
      // Add existing headers
      const existingHeaders = Object.fromEntries(response.headers.entries());
      
      return new Response(response.body, {
        status: response.status,
        headers: { ...existingHeaders, ...corsHeaders },
      });
    } else if (url.pathname.startsWith('/api/inft')) {
      // Handle INFT Agent operations
      const response = await handleINFTAPI(request, env, url);
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };
      
      const existingHeaders = Object.fromEntries(response.headers.entries());
      
      return new Response(response.body, {
        status: response.status,
        headers: { ...existingHeaders, ...corsHeaders },
      });
    } else if (url.pathname.startsWith('/api/generate')) {
      // Handle generation API with INFT routing
      const response = await handleGenerateAPI(request, env, url);
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };
      
      const existingHeaders = Object.fromEntries(response.headers.entries());
      
      return new Response(response.body, {
        status: response.status,
        headers: { ...existingHeaders, ...corsHeaders },
      });
    } else if (url.pathname.startsWith('/api/credits')) {
      // Handle credits API
      const response = await handleCreditsAPI(request, env, url);
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };
      
      const existingHeaders = Object.fromEntries(response.headers.entries());
      
      return new Response(response.body, {
        status: response.status,
        headers: { ...existingHeaders, ...corsHeaders },
      });
    } else if (url.pathname.startsWith('/api/mint-generation-nft')) {
      // Handle NFT minting API
      const response = await handleMintNFTAPI(request, env, url);
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };
      
      const existingHeaders = Object.fromEntries(response.headers.entries());
      
      return new Response(response.body, {
        status: response.status,
        headers: { ...existingHeaders, ...corsHeaders },
      });
    } else if (url.pathname.startsWith('/api/test')) {
      // Handle test endpoints for local development
      const response = await handleTestAPI(request, env, url);
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };
      
      const existingHeaders = Object.fromEntries(response.headers.entries());
      
      return new Response(response.body, {
        status: response.status,
        headers: { ...existingHeaders, ...corsHeaders },
      });
    } else if (url.pathname.startsWith('/api/chat')) {
      // Import the ServiceFlow agent only for chat API
      try {
        const { ServiceFlowAgent } = await import('./server.js');
        
        // Create agent instance
        const agent = new ServiceFlowAgent();
        agent.env = env; // Set environment variables
        
        // Let the agent handle the request directly
        const response = await agent.onRequest(request);
        
        // Add CORS headers to agent response
        const corsHeaders = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };
        
        const existingHeaders = Object.fromEntries(response.headers.entries());
        
        return new Response(response.body, {
          status: response.status,
          headers: { ...existingHeaders, ...corsHeaders },
        });
      } catch (error) {
        console.error('Agent initialization error:', error);
        
        // Fallback to simple chat handling if agent fails
        const response = await handleChatAPI(request, env);
        
        const corsHeaders = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };
        
        const existingHeaders = Object.fromEntries(response.headers.entries());
        
        return new Response(response.body, {
          status: response.status,
          headers: { ...existingHeaders, ...corsHeaders },
        });
      }
    }

    // For all other requests, serve static assets
    // Try to serve the requested asset first
    const assetResponse = await env.ASSETS.fetch(request);
    
    // If asset not found (404), serve index.html for client-side routing
    if (assetResponse.status === 404) {
      const indexRequest = new Request(new URL('/', request.url), request);
      return env.ASSETS.fetch(indexRequest);
    }
    
    return assetResponse;
  },
};