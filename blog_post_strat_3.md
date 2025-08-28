# --- Playground Integration ---
def create_serviceflow_playground():
    """Create playground with all ServiceFlow AI agents"""
    
    # Import existing agents from your current playground
    from playground import (
        lead_generation_agent,
        content_creation_agent, 
        facebook_agent,
        google_agent,
        agno_assist,
        scraper_agent
    )
    
    # Create enhanced playground with SrvcFlo and content team
    serviceflow_playground = Playground(
        agents=[
            srvcflo_agent,              # The AI lead
            serviceflow_content_team,    # Viral content creation team
            viral_researcher,           # Individual research specialist
            viral_content_writer,       # Individual content creator
            social_media_specialist,    # Individual social specialist
            blog_publisher,             # Publishing specialist
            lead_generation_agent,      # Your existing agents
            content_creation_agent,
            facebook_agent,
            google_agent, 
            agno_assist,
            scraper_agent
        ],
        name="ServiceFlow AI Command Center",
        description=dedent("""\
        ServiceFlow AI's complete agent ecosystem for viral content creation, lead generation, 
        and business automation. Led by SrvcFlo, the AI mastermind orchestrating explosive 
        growth through strategic content and intelligent automation.
        """),
        app_id="serviceflow-command-center"
    )
    
    return serviceflow_playground

# --- Viral Topic Suggestions ---
VIRAL_TOPICS = [
    "The $50K Mistake Every Contractor Makes: Missing Emergency Calls",
    "Why Smart Plumbers Are Firing Their Answering Service", 
    "How One Hair Stylist Doubled Bookings While Working 20% Less",
    "From 3 AM Panic Calls to Automated Profits: A Contractor's Journey",
    "The Hidden Revenue Leak Killing 73% of Service Businesses",
    "Why Your Competitors Will Steal Your Customers (And How to Stop Them)",
    "Manual Scheduling is Costing You $2,847 Monthly - Here's the Fix",
    "The 24/7 Lead Capture Secret Your Competition Doesn't Know",
    "How AI Turned a Struggling HVAC Business into the Town's #1 Choice",
    "5 Signs Your Service Business Needs AI (Before It's Too Late)"
]

# --- Demo and Testing ---
async def demo_srvcflo_content_creation():
    """Demo SrvcFlo's viral content creation capabilities"""
    
    print("🤖 ServiceFlow AI Content Creation Demo")
    print("="*60)
    print("Featuring SrvcFlo and the Viral Content Team\n")
    
    # Select a viral topic
    demo_topic = "The $50K Mistake Every Contractor Makes: Missing Emergency Calls"
    demo_industry = "contractors and home service providers"
    
    print(f"🎯 Generating viral content package...")
    print(f"Topic: {demo_topic}")
    print(f"Industry: {demo_industry}\n")
    
    # Generate content
    content_package = await generate_viral_content_package(demo_topic, demo_industry)
    
    print("\n🎉 Content creation complete!")
    print("Ready to drive massive waitlist growth for ServiceFlow AI!")
    
    return content_package

if __name__ == "__main__":
    # Run demo
    asyncio.run(demo_srvcflo_content_creation())
    
    # Optionally start playground
    # playground = create_serviceflow_playground()
    # playground.serve("serviceflow_agents:playground.get_app()", reload=True)



import os
import secrets
import hashlib
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from typing import Dict, Optional
import json
import sqlite3
from pathlib import Path

# --- Database Setup ---
class WaitlistDB:
    def __init__(self, db_path: str = "waitlist.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the waitlist database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create waitlist table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS waitlist_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                business_name TEXT NOT NULL,
                owner_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                business_type TEXT NOT NULL,
                current_challenges TEXT,
                interested_package TEXT,
                estimated_revenue TEXT,
                position INTEGER,
                api_key TEXT UNIQUE,
                api_key_hash TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                email_sent BOOLEAN DEFAULT FALSE,
                status TEXT DEFAULT 'active'
            )
        """)
        
        # Create API usage tracking table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS api_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_key_hash TEXT,
                endpoint TEXT,
                request_count INTEGER DEFAULT 0,
                last_used TIMESTAMP,
                date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (api_key_hash) REFERENCES waitlist_entries (api_key_hash)
            )
        """)
        
        conn.commit()
        conn.close()
    
    def add_waitlist_entry(self, waitlist_data: dict) -> dict:
        """Add new waitlist entry and generate API key"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Get current position (count + 1)
            cursor.execute("SELECT COUNT(*) FROM waitlist_entries")
            position = cursor.fetchone()[0] + 1
            
            # Generate API key
            api_key = f"sfa_{secrets.token_urlsafe(32)}"
            api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
            
            # Insert waitlist entry
            cursor.execute("""
                INSERT INTO waitlist_entries 
                (business_name, owner_name, email, phone, business_type, 
                 current_challenges, interested_package, estimated_revenue, 
                 position, api_key, api_key_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                waitlist_data['businessName'],
                waitlist_data['ownerName'], 
                waitlist_data['email'],
                waitlist_data.get('phone', ''),
                waitlist_data['businessType'],
                waitlist_data.get('currentChallenges', ''),
                waitlist_data.get('interestedPackage', 'starter'),
                waitlist_data.get('estimatedRevenue', ''),
                position,
                api_key,
                api_key_hash
            ))
            
            conn.commit()
            
            return {
                'success': True,
                'position': position,
                'api_key': api_key,
                'email': waitlist_data['email'],
                'business_name': waitlist_data['businessName']
            }
            
        except sqlite3.IntegrityError:
            return {
                'success': False,
                'error': 'Email already registered'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            conn.close()
    
    def get_waitlist_count(self) -> int:
        """Get total waitlist count"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM waitlist_entries WHERE status = 'active'")
        count = cursor.fetchone()[0]
        conn.close()
        return count
    
    def validate_api_key(self, api_key: str) -> Optional[dict]:
        """Validate API key and return user info"""
        api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT business_name, owner_name, email, business_type, position 
            FROM waitlist_entries 
            WHERE api_key_hash = ? AND status = 'active'
        """, (api_key_hash,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                'business_name': result[0],
                'owner_name': result[1], 
                'email': result[2],
                'business_type': result[3],
                'position': result[4]
            }
        return None
    
    def log_api_usage(self, api_key: str, endpoint: str):
        """Log API usage for analytics"""
        api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Update or insert usage record
        cursor.execute("""
            INSERT OR REPLACE INTO api_usage (api_key_hash, endpoint, request_count, last_used)
            VALUES (?, ?, 
                    COALESCE((SELECT request_count FROM api_usage WHERE api_key_hash = ? AND endpoint = ?), 0) + 1,
                    CURRENT_TIMESTAMP)
        """, (api_key_hash, endpoint, api_key_hash, endpoint))
        
        conn.commit()
        conn.close()

# --- Email Service ---
class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.email = os.getenv('SERVICEFLOW_EMAIL')
        self.password = os.getenv('SERVICEFLOW_EMAIL_PASSWORD')
    
    def send_welcome_email(self, user_data: dict) -> bool:
        """Send welcome email with API key"""
        try:
            msg = MimeMultipart('alternative')
            msg['Subject'] = "🎉 Welcome to ServiceFlow AI - Your API Access Inside!"
            msg['From'] = f"ServiceFlow AI <{self.email}>"
            msg['To'] = user_data['email']
            
            # HTML email content
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f8fafc; padding: 30px; }}
                    .api-key {{ background: #1f2937; color: #10b981; padding: 15px; border-radius: 8px; font-family: monospace; word-break: break-all; margin: 20px 0; }}
                    .cta-button {{ display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }}
                    .footer {{ background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px; }}
                    .highlight {{ color: #3b82f6; font-weight: bold; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚀 Welcome to ServiceFlow AI!</h1>
                        <p>You're #<span class="highlight">{user_data['position']}</span> on our waitlist</p>
                    </div>
                    
                    <div class="content">
                        <h2>Hey {user_data['business_name']} team! 👋</h2>
                        
                        <p>Exciting news! While we're putting the finishing touches on ServiceFlow AI, we wanted to give you exclusive early access to our <strong>AI Blog Generator</strong> - the same system we use to create viral content about business automation.</p>
                        
                        <h3>🔑 Your Exclusive API Key:</h3>
                        <div class="api-key">{user_data['api_key']}</div>
                        
                        <p><strong>What you can do right now:</strong></p>
                        <ul>
                            <li>✅ Generate viral blog posts about service business automation</li>
                            <li>✅ Create social media content for your business</li>
                            <li>✅ Access our AI-powered content portal</li>
                            <li>✅ See ServiceFlow AI agents in action</li>
                        </ul>
                        
                        <a href="https://serviceflowai.app/portal?key={user_data['api_key']}" class="cta-button">
                            🎯 Access Your Portal Now
                        </a>
                        
                        <h3>🎨 Why This Matters for Your Business:</h3>
                        <p>Content marketing drives 3x more leads than paid advertising. With our AI blog generator, you can:</p>
                        <ul>
                            <li>Create expert content that positions you as the go-to {user_data.get('business_type', 'service provider')} in your area</li>
                            <li>Generate social media posts that attract ideal customers</li>
                            <li>Build trust with potential clients through valuable insights</li>
                            <li>Save hours of content creation time</li>
                        </ul>
                        
                        <p><strong>Next Steps:</strong></p>
                        <ol>
                            <li>Click the portal link above</li>
                            <li>Try generating your first blog post</li>
                            <li>Share your content and watch engagement grow</li>
                            <li>Give us feedback to improve the platform</li>
                        </ol>
                        
                        <p>Questions? Just reply to this email - our team (and SrvcFlo, our AI lead) are here to help!</p>
                        
                        <p>Excited to see what you create! 🎉</p>
                        
                        <p>Best,<br>
                        The ServiceFlow AI Team<br>
                        <em>P.S. Keep an eye out for more exclusive features coming your way!</em></p>
                    </div>
                    
                    <div class="footer">
                        <p>© 2024 ServiceFlow AI | Transforming Service Businesses with AI</p>
                        <p>You're receiving this because you joined our waitlist. We respect your privacy and will never spam you.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Text version for email clients that don't support HTML
            text_content = f"""
            Welcome to ServiceFlow AI!
            
            Hey {user_data['business_name']} team!
            
            You're #{user_data['position']} on our waitlist, and we have something special for you.
            
            Your Exclusive API Key: {user_data['api_key']}
            
            Access your portal: https://serviceflowai.app/portal?key={user_data['api_key']}
            
            What you can do right now:
            - Generate viral blog posts about service business automation
            - Create social media content for your business  
            - Access our AI-powered content portal
            - See ServiceFlow AI agents in action
            
            Questions? Just reply to this email!
            
            Best,
            The ServiceFlow AI Team
            """
            
            # Attach both versions
            part1 = MimeText(text_content, 'plain')
            part2 = MimeText(html_content, 'html')
            
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.email, self.password)
            server.send_message(msg)
            server.quit()
            
            return True
            
        except Exception as e:
            print(f"Email sending failed: {e}")
            return False

# --- Cloudflare Workers API Handler ---
WORKERS_API_CODE = """
// Cloudflare Workers API for waitlist and blog content
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Waitlist API endpoints
      if (path === '/api/waitlist' && request.method === 'POST') {
        return await handleWaitlistSignup(request, env);
      }
      
      if (path === '/api/waitlist' && request.method === 'GET') {
        return await getWaitlistCount(env);
      }

      // Blog content API endpoints
      if (path === '/api/blog/generate' && request.method === 'POST') {
        return await generateBlogContent(request, env);
      }
      
      if (path === '/api/blog/posts' && request.method === 'GET') {
        return await getBlogPosts(env);
      }

      // Portal access validation
      if (path === '/api/portal/validate' && request.method === 'POST') {
        return await validatePortalAccess(request, env);
      }

      return new Response('Not Found', { status: 404 });

    } catch (error) {
      console.error('API Error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function handleWaitlistSignup(request, env) {
  const formData = await request.json();
  
  // Validate required fields
  if (!formData.businessName || !formData.ownerName || !formData.email || !formData.businessType) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Missing required fields' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    // Generate API key
    const apiKey = `sfa_${crypto.randomUUID().replace(/-/g, '')}`;
    
    // Get current position
    const countResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM waitlist_entries"
    ).first();
    const position = (countResult?.count || 0) + 1;

    // Insert into database
    await env.DB.prepare(`
      INSERT INTO waitlist_entries 
      (business_name, owner_name, email, phone, business_type, current_challenges, 
       interested_package, estimated_revenue, position, api_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      formData.businessName,
      formData.ownerName,
      formData.email,
      formData.phone || '',
      formData.businessType,
      formData.currentChallenges || '',
      formData.interestedPackage || 'starter',
      formData.estimatedRevenue || '',
      position,
      apiKey
    ).run();

    // Send welcome email (integrate with email service)
    await sendWelcomeEmail({
      email: formData.email,
      business_name: formData.businessName,
      position: position,
      api_key: apiKey,
      business_type: formData.businessType
    }, env);

    return new Response(JSON.stringify({
      success: true,
      position: position,
      message: 'Welcome to ServiceFlow AI! Check your email for API access.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email already registered'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    throw error;
  }
}

async function getWaitlistCount(env) {
  const result = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM waitlist_entries WHERE status = 'active'"
  ).first();
  
  return new Response(JSON.stringify({
    success: true,
    count: result?.count || 0
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function validatePortalAccess(request, env) {
  const { apiKey } = await request.json();
  
  if (!apiKey || !apiKey.startsWith('sfa_')) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid API key format'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const user = await env.DB.prepare(
    "SELECT business_name, owner_name, email, business_type, position FROM waitlist_entries WHERE api_key = ? AND status = 'active'"
  ).bind(apiKey).first();

  if (!user) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid API key'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Log API usage
  await env.DB.prepare(`
    INSERT INTO api_usage (api_key, endpoint, request_count, last_used) 
    VALUES (?, ?, 1, datetime('now'))
    ON CONFLICT(api_key, endpoint) DO UPDATE SET 
    request_count = request_count + 1, 
    last_used = datetime('now')
  `).bind(apiKey, '/api/portal/validate').run();

  return new Response(JSON.stringify({
    success: true,
    user: {
      business_name: user.business_name,
      owner_name: user.owner_name,
      business_type: user.business_type,
      position: user.position
    }
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function generateBlogContent(request, env) {
  const { apiKey, topic, industry } = await request.json();
  
  // Validate API key
  const user = await env.DB.prepare(
    "SELECT business_name, business_type FROM waitlist_entries WHERE api_key = ? AND status = 'active'"
  ).bind(apiKey).first();

  if (!user) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid API key'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Log API usage
  await env.DB.prepare(`
    INSERT INTO api_usage (api_key, endpoint, request_count, last_used) 
    VALUES (?, ?, 1, datetime('now'))
    ON CONFLICT(api_key, endpoint) DO UPDATE SET 
    request_count = request_count + 1, 
    last_used = datetime('now')
  `).bind(apiKey, '/api/blog/generate').run();

  // Here you would integrate with your Agno agents
  // For now, return a mock response
  const mockBlogPost = {
    title: `${topic} - Transform Your ${industry} Business with AI`,
    content: `# ${topic}\\n\\nGenerated content for ${user.business_name}...`,
    excerpt: `Discover how ${topic.toLowerCase()} can revolutionize your ${industry} business`,
    tags: ['AI', 'Automation', industry],
    social_content: {
      twitter: `${topic} is changing everything for ${industry}! 🚀 #ServiceFlowAI`,
      linkedin: `New insights on ${topic} for ${industry} professionals...`,
      facebook: `Hey ${industry} business owners! Check out this game-changing insight...`,
      instagram: `Transform your ${industry} business with AI! 💪 #automation #${industry}`
    }
  };

  return new Response(JSON.stringify({
    success: true,
    blog_post: mockBlogPost
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function sendWelcomeEmail(userData, env) {
  // Integrate with your email service here
  // This could call an external API or use Cloudflare's email routing
  console.log('Sending welcome email to:', userData.email);
  return true;
}
"""

