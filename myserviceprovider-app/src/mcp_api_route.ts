// app/api/mcp/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CloudflareAIMCPServer } from '@/src/mcp-server';

// Initialize MCP server instance
let mcpServer: CloudflareAIMCPServer | null = null;

async function getMCPServer() {
  if (!mcpServer) {
    mcpServer = new CloudflareAIMCPServer();
    await mcpServer.init();
  }
  return mcpServer;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      type, 
      prompt, 
      paymentTx, 
      userAddress, 
      paymentType, 
      width, 
      height, 
      steps,
      duration 
    } = body;

    // Validate required fields
    if (!prompt || !userAddress || !paymentType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get MCP server instance
    const server = await getMCPServer();

    let result;

    if (type === 'image') {
      // Call image generation tool
      result = await server.server.callTool('generate_image', {
        prompt,
        paymentTx,
        userAddress,
        paymentType,
        width: width || 1024,
        height: height || 1024,
        steps: steps || 4
      });
    } else if (type === 'video') {
      // Call video generation tool
      result = await server.server.callTool('generate_video', {
        prompt,
        paymentTx,
        userAddress,
        paymentType,
        duration: duration || 3
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid generation type' },
        { status: 400 }
      );
    }

    // Parse the result from MCP server
    if (result && result.content) {
      const content = result.content[0];
      
      if (content.type === 'text' && content.text.includes('failed')) {
        return NextResponse.json({
          success: false,
          error: content.text
        });
      }

      // Extract image data or video URL from result
      let responseData: any = { success: true };

      for (const item of result.content) {
        if (item.type === 'image') {
          responseData.imageData = item.data;
        } else if (item.type === 'resource' && item.resource?.uri) {
          responseData.videoUrl = item.resource.uri;
        }
      }

      return NextResponse.json(responseData);
    }

    return NextResponse.json({
      success: false,
      error: 'No content returned from generation'
    });

  } catch (error: any) {
    console.error('MCP API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// app/api/mcp/user-stats/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress } = body;

    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address required' },
        { status: 400 }
      );
    }

    // Get MCP server instance
    const server = await getMCPServer();

    // Call user stats tool
    const result = await server.server.callTool('get_user_stats', {
      userAddress
    });

    if (result && result.content && result.content[0]) {
      const statsText = result.content[0].text;
      const stats = JSON.parse(statsText);
      
      return NextResponse.json(stats);
    }

    return NextResponse.json({
      totalGenerations: 0,
      freeGenerationsUsedToday: 0,
      freeGenerationsRemaining: 3,
      canUseFreeGeneration: true
    });

  } catch (error: any) {
    console.error('User stats API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}