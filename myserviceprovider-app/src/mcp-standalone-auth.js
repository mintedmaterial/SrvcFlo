// Enhanced MCP Standalone with Authentication and Human in the Loop
// ServiceFlow AI Worker with Cloudflare Zero Trust Authentication

// Authentication helper functions
async function verifyCloudflareAccess(request, env) {
  const accessJwt = request.headers.get('cf-access-jwt-assertion');
  const userEmail = request.headers.get('cf-access-authenticated-user-email');
  
  if (!accessJwt || !userEmail) {
    return null;
  }

  // Get user from database
  try {
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND status = "active"'
    ).bind(userEmail).first();
    
    return user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin: user.role === 'admin'
    } : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

async function verifySessionToken(token, env) {
  if (!token) return null;
  
  try {
    const session = await env.DB.prepare(`
      SELECT s.*, u.email, u.name, u.role, u.status 
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now') AND u.status = 'active'
    `).bind(token).first();
    
    if (session) {
      // Update last accessed
      await env.DB.prepare(
        'UPDATE user_sessions SET last_accessed = datetime("now") WHERE id = ?'
      ).bind(session.id).run();
      
      return {
        id: session.user_id,
        email: session.email,
        name: session.name,
        role: session.role,
        isAdmin: session.role === 'admin'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

async function getUserPermissions(userId, env) {
  try {
    const permissions = await env.DB.prepare(`
      SELECT permission 
      FROM user_permissions 
      WHERE user_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).bind(userId).all();
    
    return permissions.results.map(p => p.permission);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }
}

async function logAgentAccess(userId, agentType, action, query, env, requiresApproval = false) {
  try {
    const result = await env.DB.prepare(`
      INSERT INTO agent_access_logs (user_id, agent_type, action, query, requires_approval)
      VALUES (?, ?, ?, ?, ?)
    `).bind(userId, agentType, action, query, requiresApproval).run();
    
    return result.meta.last_row_id;
  } catch (error) {
    console.error('Error logging agent access:', error);
    return null;
  }
}

// Human in the Loop functionality
async function requiresApproval(agentType, action, user) {
  // Define actions that require approval
  const sensitiveActions = {
    'google': ['send_email', 'create_event', 'delete_event'],
    'srvcflo': ['business_strategy', 'competitive_analysis'],
    'x': ['post_tweet', 'send_dm'],
    'agno': ['deploy_code', 'system_changes']
  };
  
  const sensitive = sensitiveActions[agentType] || [];
  return sensitive.some(s => action.toLowerCase().includes(s));
}

async function createApprovalRequest(userId, agentType, actionType, requestDetails, env) {
  try {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    const result = await env.DB.prepare(`
      INSERT INTO approval_requests (user_id, agent_type, action_type, request_details, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      userId, 
      agentType, 
      actionType, 
      JSON.stringify(requestDetails), 
      expiresAt.toISOString()
    ).run();
    
    return result.meta.last_row_id;
  } catch (error) {
    console.error('Error creating approval request:', error);
    return null;
  }
}

async function checkApprovalStatus(requestId, env) {
  try {
    const request = await env.DB.prepare(
      'SELECT * FROM approval_requests WHERE id = ?'
    ).bind(requestId).first();
    
    if (!request) return null;
    
    // Check if expired
    if (new Date(request.expires_at) < new Date()) {
      await env.DB.prepare(
        'UPDATE approval_requests SET status = "expired" WHERE id = ?'
      ).bind(requestId).run();
      return { status: 'expired' };
    }
    
    return request;
  } catch (error) {
    console.error('Error checking approval status:', error);
    return null;
  }
}

// Enhanced backend agent calling with auth context
async function callServiceFlowAgent(message, userId, userRole, context = {}, requiresHumanApproval = false) {
  try {
    // Check if action requires approval
    if (requiresHumanApproval && userRole !== 'admin') {
      const requestId = await createApprovalRequest(
        userId, 
        'srvcflo', 
        'sensitive_action', 
        { message, context },
        // env would need to be passed in
      );
      
      if (requestId) {
        return {
          type: 'approval_required',
          requestId: requestId,
          message: 'This action requires admin approval. Please check your approval queue.',
          action: message
        };
      }
    }

    const response = await fetch('http://localhost:8000/srvcflo-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SRVCFLO_AGENT_TOKEN || 'default-token'}`
      },
      body: JSON.stringify({
        message: message,
        user_id: userId,
        context: {
          ...context,
          user_role: userRole,
          requires_approval: requiresHumanApproval
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        type: 'success',
        response: data.response,
        agent_used: data.agent_used
      };
    } else {
      throw new Error(data.error || 'Agent request failed');
    }
  } catch (error) {
    console.error('ServiceFlow Agent call error:', error);
    return {
      type: 'error',
      error: error.message,
      fallback: await handleGeneralAssistance(message, context)
    };
  }
}

// General ServiceFlow AI assistance using Cloudflare AI
async function handleGeneralAssistance(message, context = '', env) {
  try {
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content: `You are the ServiceFlow AI assistant. Help visitors learn about ServiceFlow AI.

Key information:
- AI automation platform for service businesses (contractors, salons, repair services, etc.)
- Provides 24/7 customer service, smart scheduling, lead qualification, business intelligence
- Over 500 businesses on waitlist
- Average 400% ROI for customers
- Pricing: Starter ($200/month), Professional ($600/month), Enterprise ($1000/month)

Keep responses focused on helping potential customers understand ServiceFlow AI.
${context ? `\nContext: ${context}` : ''}`
        },
        {
          role: 'user',
          content: message
        }
      ]
    });

    return response.response || "Hi! I'm the ServiceFlow AI assistant. I help service businesses learn about AI automation. How can I help you today?";
  } catch (error) {
    console.error('Cloudflare AI error:', error);
    return "Hi! I'm the ServiceFlow AI assistant. I help service businesses learn about AI automation. We provide 24/7 customer service, smart scheduling, and lead qualification. How can I help you today?";
  }
}

// Route protection middleware
function requireAuth(requiredRole = 'user') {
  return async function(request, env, user) {
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (requiredRole === 'admin' && user.role !== 'admin') {
      return new Response(JSON.stringify({
        error: 'Admin access required',
        message: 'You need admin privileges to access this resource'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return null; // Continue processing
  };
}

// Permission check middleware
async function requirePermission(permission) {
  return async function(request, env, user) {
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Authentication required'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const permissions = await getUserPermissions(user.id, env);
    if (!permissions.includes(permission)) {
      return new Response(JSON.stringify({
        error: 'Insufficient permissions',
        message: `This action requires the '${permission}' permission`
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    return null; // Continue processing
  };
}

// Enhanced main request handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, cf-access-jwt-assertion',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Get user authentication context
      let user = null;
      
      // Try Cloudflare Access first
      user = await verifyCloudflareAccess(request, env);
      
      // Fallback to session token
      if (!user) {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          user = await verifySessionToken(token, env);
        }
      }

      // Route handling with authentication
      switch (true) {
        // Public routes (no authentication required)
        case path === '/' && method === 'GET':
          return handleHomePage(request, env);

        case path === '/api/waitlist' && method === 'POST':
          return handleWaitlistSignup(request, env);

        case path === '/api/chat' && method === 'POST':
          return handlePublicChat(request, env);

        case path.startsWith('/blog') && method === 'GET':
          return handleBlogRequest(request, env);

        // Admin routes (require admin authentication)
        case path.startsWith('/dashboard') && method === 'GET':
        case path.startsWith('/api/admin'):
        case path.startsWith('/mcp'):
        case path.startsWith('/agent-builder'):
          const adminCheck = await requireAuth('admin')(request, env, user);
          if (adminCheck) return adminCheck;
          
          return handleAdminRoute(request, env, user);

        // Agent routes (require user authentication and permissions)
        case path.startsWith('/api/agents/'):
          const userCheck = await requireAuth('user')(request, env, user);
          if (userCheck) return userCheck;
          
          return handleAgentRoute(request, env, user);

        // Premium routes (require premium permissions)
        case path.startsWith('/portal'):
        case path.startsWith('/api/premium'):
          const premiumCheck = await requirePermission('premium_features')(request, env, user);
          if (premiumCheck) return premiumCheck;
          
          return handlePremiumRoute(request, env, user);

        // Authentication routes
        case path === '/api/auth/login' && method === 'POST':
          return handleLogin(request, env);

        case path === '/api/auth/logout' && method === 'POST':
          return handleLogout(request, env, user);

        case path === '/api/auth/user' && method === 'GET':
          return handleUserInfo(request, env, user);

        // Human in the Loop approval routes
        case path === '/api/approvals' && method === 'GET':
          const approvalListCheck = await requireAuth('admin')(request, env, user);
          if (approvalListCheck) return approvalListCheck;
          
          return handleApprovalsList(request, env, user);

        case path.startsWith('/api/approvals/') && method === 'POST':
          const approvalCheck = await requireAuth('admin')(request, env, user);
          if (approvalCheck) return approvalCheck;
          
          return handleApprovalAction(request, env, user);

        default:
          return new Response('Not Found', { 
            status: 404,
            headers: corsHeaders
          });
      }

    } catch (error) {
      console.error('Request handling error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};

// Route handlers
async function handleHomePage(request, env) {
  return new Response(JSON.stringify({
    message: 'Welcome to ServiceFlow AI',
    status: 'active',
    features: ['24/7 Customer Service', 'Smart Scheduling', 'Lead Qualification', 'Business Intelligence']
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleWaitlistSignup(request, env) {
  const data = await request.json();
  const { email, business_name, business_type } = data;

  try {
    // Insert into waitlist
    await env.DB.prepare(`
      INSERT INTO waitlist (email, business_name, business_type, status, created_at)
      VALUES (?, ?, ?, 'pending', datetime('now'))
    `).bind(email, business_name, business_type).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully added to waitlist'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to add to waitlist',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePublicChat(request, env) {
  const data = await request.json();
  const { message } = data;

  const response = await handleGeneralAssistance(message, '', env);
  
  return new Response(JSON.stringify({
    response: response,
    type: 'public_chat'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleAdminRoute(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Log admin access
  await logAgentAccess(user.id, 'admin', `admin_route_${path}`, path, env);

  if (path.startsWith('/api/admin/agents')) {
    return handleAgentManagement(request, env, user);
  }

  if (path.startsWith('/mcp')) {
    return handleMCPRequest(request, env, user);
  }

  return new Response(JSON.stringify({
    message: 'Admin dashboard access granted',
    user: user.name,
    permissions: await getUserPermissions(user.id, env)
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleAgentRoute(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;
  const agentType = path.split('/')[3]; // /api/agents/{type}

  // Check if user has permission for this agent type
  const permissions = await getUserPermissions(user.id, env);
  const requiredPermission = `${agentType}_agent`;
  
  if (!permissions.includes(requiredPermission)) {
    return new Response(JSON.stringify({
      error: 'Agent access denied',
      message: `You need the '${requiredPermission}' permission to use this agent`
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await request.json();
  const { message, context = {} } = data;

  // Log agent access
  await logAgentAccess(user.id, agentType, 'chat', message, env);

  // Check if requires approval
  const needsApproval = await requiresApproval(agentType, message, user);
  
  const response = await callServiceFlowAgent(
    message, 
    user.id, 
    user.role, 
    context, 
    needsApproval
  );

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleApprovalsList(request, env, user) {
  try {
    const pendingApprovals = await env.DB.prepare(`
      SELECT ar.*, u.name as user_name, u.email as user_email
      FROM approval_requests ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.status = 'pending' AND ar.expires_at > datetime('now')
      ORDER BY ar.created_at DESC
    `).all();

    return new Response(JSON.stringify({
      approvals: pendingApprovals.results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch approvals',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleApprovalAction(request, env, user) {
  const url = new URL(request.url);
  const requestId = url.pathname.split('/')[3];
  const data = await request.json();
  const { action, reason } = data; // 'approved' or 'rejected'

  try {
    await env.DB.prepare(`
      UPDATE approval_requests 
      SET status = ?, admin_id = ?, reason = ?, resolved_at = datetime('now')
      WHERE id = ?
    `).bind(action, user.id, reason, requestId).run();

    return new Response(JSON.stringify({
      success: true,
      message: `Request ${action} successfully`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to process approval',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Additional route handlers would be implemented here...