/**
 * MCP Server for Authentication Services
 * Provides tools for user authentication, session management, and wallet integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { MongoAuthServer } from './auth-server.js';

const AUTH_TOOLS = [
  {
    name: 'auth_login',
    description: 'Login user with email/password or wallet address',
    inputSchema: {
      type: 'object',
      properties: {
        identifier: { type: 'string', description: 'Email or wallet address' },
        password: { type: 'string', description: 'Password (optional for wallet auth)' },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'auth_create_user',
    description: 'Create a new user account',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'User email' },
        password: { type: 'string', description: 'Password (optional for wallet users)' },
        wallet_address: { type: 'string', description: 'Wallet address (optional)' },
        nickname: { type: 'string', description: 'Display name (optional)' },
        auth_method: { type: 'string', enum: ['wallet', 'email', 'social'], description: 'Authentication method' },
      },
      required: ['email'],
    },
  },
  {
    name: 'auth_wallet_login',
    description: 'Authenticate user with wallet address',
    inputSchema: {
      type: 'object',
      properties: {
        wallet_address: { type: 'string', description: 'Wallet address' },
        signature: { type: 'string', description: 'Optional signature for verification' },
        message: { type: 'string', description: 'Optional message that was signed' },
      },
      required: ['wallet_address'],
    },
  },
  {
    name: 'auth_get_user',
    description: 'Get user information by email, user_id, or wallet address',
    inputSchema: {
      type: 'object',
      properties: {
        identifier: { type: 'string', description: 'Email, user_id, or wallet address' },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'auth_verify_email',
    description: 'Verify user email address',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Email to verify' },
      },
      required: ['email'],
    },
  },
  {
    name: 'auth_change_password',
    description: 'Change user password',
    inputSchema: {
      type: 'object',
      properties: {
        identifier: { type: 'string', description: 'Email or user_id' },
        new_password: { type: 'string', description: 'New password' },
      },
      required: ['identifier', 'new_password'],
    },
  },
  {
    name: 'auth_create_session',
    description: 'Create authentication session',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'User ID' },
        platform: { type: 'string', description: 'Platform (web, mobile, agent-ui)' },
        wallet_address: { type: 'string', description: 'Optional wallet address' },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'auth_validate_session',
    description: 'Validate authentication session',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Session ID to validate' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'auth_end_session',
    description: 'End authentication session',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Session ID to end' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'auth_remove_user',
    description: 'Remove user account',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'User ID or MongoDB _id' },
      },
      required: ['id'],
    },
  },
] as const;

class AuthMCPServer {
  private server: Server;
  private authServer: MongoAuthServer;

  constructor() {
    this.server = new Server(
      {
        name: 'serviceflow-auth-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.authServer = new MongoAuthServer(
      process.env.MONGODB_URI || 'mongodb://localhost:27017',
      'serviceflow_auth'
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: AUTH_TOOLS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'auth_login':
            return await this.handleLogin(args);
          case 'auth_create_user':
            return await this.handleCreateUser(args);
          case 'auth_wallet_login':
            return await this.handleWalletLogin(args);
          case 'auth_get_user':
            return await this.handleGetUser(args);
          case 'auth_verify_email':
            return await this.handleVerifyEmail(args);
          case 'auth_change_password':
            return await this.handleChangePassword(args);
          case 'auth_create_session':
            return await this.handleCreateSession(args);
          case 'auth_validate_session':
            return await this.handleValidateSession(args);
          case 'auth_end_session':
            return await this.handleEndSession(args);
          case 'auth_remove_user':
            return await this.handleRemoveUser(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private async handleLogin(args: any) {
    const { identifier, password } = args;
    const result = await this.authServer.login(identifier, password || '');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            user: result,
          }, null, 2),
        },
      ],
    };
  }

  private async handleCreateUser(args: any) {
    const { email, password, wallet_address, nickname, auth_method } = args;
    await this.authServer.create({
      email,
      password,
      wallet_address,
      nickname,
      auth_method,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'User created successfully',
          }, null, 2),
        },
      ],
    };
  }

  private async handleWalletLogin(args: any) {
    const { wallet_address, signature, message } = args;
    const result = await this.authServer.authenticateWallet(wallet_address, signature, message);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            user: result,
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetUser(args: any) {
    const { identifier } = args;
    const result = await this.authServer.getUser(identifier);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            user: result,
          }, null, 2),
        },
      ],
    };
  }

  private async handleVerifyEmail(args: any) {
    const { email } = args;
    const result = await this.authServer.verify(email);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            verified: result,
          }, null, 2),
        },
      ],
    };
  }

  private async handleChangePassword(args: any) {
    const { identifier, new_password } = args;
    const result = await this.authServer.changePassword(identifier, new_password);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            changed: result,
          }, null, 2),
        },
      ],
    };
  }

  private async handleCreateSession(args: any) {
    const { user_id, platform, wallet_address } = args;
    const result = await this.authServer.createSession(user_id, platform || 'web', wallet_address);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            session_id: result,
          }, null, 2),
        },
      ],
    };
  }

  private async handleValidateSession(args: any) {
    const { session_id } = args;
    const result = await this.authServer.validateSession(session_id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            session: result,
          }, null, 2),
        },
      ],
    };
  }

  private async handleEndSession(args: any) {
    const { session_id } = args;
    const result = await this.authServer.endSession(session_id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            ended: result,
          }, null, 2),
        },
      ],
    };
  }

  private async handleRemoveUser(args: any) {
    const { id } = args;
    await this.authServer.remove(id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'User removed successfully',
          }, null, 2),
        },
      ],
    };
  }

  async start(): Promise<void> {
    await this.authServer.connect();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('ServiceFlow Auth MCP server running on stdio');
  }
}

async function main(): Promise<void> {
  const server = new AuthMCPServer();
  await server.start();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Server failed:', error);
    process.exit(1);
  });
}

export { AuthMCPServer };