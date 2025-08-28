import { UserProvider } from '@auth0/nextjs-auth0/client';

export const auth0Config = {
  domain: process.env.AUTH0_DOMAIN || 'dev-serviceflow.us.auth0.com',
  clientId: process.env.AUTH0_CLIENT_ID || 'your-client-id',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || 'your-client-secret',
  baseURL: process.env.AUTH0_BASE_URL || 'http://localhost:3000',
  secret: process.env.AUTH0_SECRET || 'your-secret-key',
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-serviceflow.us.auth0.com',
  routes: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    callback: '/api/auth/callback',
    postLogoutRedirect: '/',
  },
  session: {
    rollingDuration: 60 * 60 * 24, // 24 hours
    absoluteDuration: 60 * 60 * 24 * 7, // 7 days
  },
};

export const auth0Scope = 'openid profile email wallet:connect wallet:sign';

// Custom claims for Web3 integration
export interface Web3Claims {
  walletAddress?: string;
  chainId?: number;
  signature?: string;
  message?: string;
  connectedAt?: string;
  lastActivity?: string;
}

export interface ExtendedUser {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  nickname?: string;
  web3?: Web3Claims;
  floaiBalance?: number;
  sTokenBalance?: number;
  creditBalances?: { [packageId: number]: number };
  totalGenerations?: number;
  agentCount?: number;
}