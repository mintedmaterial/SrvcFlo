/**
 * MongoDB Authentication MCP Server
 * Provides Auth0-compatible user management functions with wallet integration
 */

import { MongoClient, Db, Collection } from 'mongodb';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

interface User {
  _id?: string;
  user_id: string;
  email: string;
  password?: string;
  wallet_address?: string;
  nickname?: string;
  email_verified: boolean;
  created_at: Date;
  last_login?: Date;
  auth_method: 'wallet' | 'email' | 'social';
  subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise';
  credits: number;
  nft_holdings?: string[]; // NFT contract addresses
  bandit_kidz_holder?: boolean;
}

interface AuthSession {
  session_id: string;
  user_id: string;
  wallet_address?: string;
  created_at: Date;
  expires_at: Date;
  platform: string;
  is_active: boolean;
}

class MongoAuthServer {
  private client: MongoClient;
  private db: Db;
  private users: Collection<User>;
  private sessions: Collection<AuthSession>;

  constructor(connectionString: string, dbName: string = 'serviceflow_auth') {
    this.client = new MongoClient(connectionString);
    this.db = this.client.db(dbName);
    this.users = this.db.collection<User>('users');
    this.sessions = this.db.collection<AuthSession>('sessions');
  }

  async connect(): Promise<void> {
    await this.client.connect();
    console.log('Connected to MongoDB Auth Server');
    
    // Create indexes
    await this.users.createIndex({ email: 1 }, { unique: true });
    await this.users.createIndex({ wallet_address: 1 }, { unique: true, sparse: true });
    await this.users.createIndex({ user_id: 1 }, { unique: true });
    await this.sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  /**
   * Auth0-compatible login function
   */
  async login(identifierValue: string, password: string): Promise<{
    user_id: string;
    nickname: string;
    email: string;
    wallet_address?: string;
  }> {
    try {
      // Find user by email or wallet address
      const user = await this.users.findOne({
        $or: [
          { email: identifierValue },
          { wallet_address: identifierValue.toLowerCase() }
        ]
      });

      if (!user) {
        throw new Error('User not found');
      }

      // For wallet auth, skip password verification
      if (user.auth_method === 'wallet' && identifierValue.startsWith('0x')) {
        // Update last login
        await this.users.updateOne(
          { _id: user._id },
          { $set: { last_login: new Date() } }
        );

        return {
          user_id: user.user_id,
          nickname: user.nickname || user.email.split('@')[0],
          email: user.email,
          wallet_address: user.wallet_address
        };
      }

      // For email/password auth
      if (!user.password || !password) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await this.users.updateOne(
        { _id: user._id },
        { $set: { last_login: new Date() } }
      );

      return {
        user_id: user.user_id,
        nickname: user.nickname || user.email.split('@')[0],
        email: user.email,
        wallet_address: user.wallet_address
      };
    } catch (error) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auth0-compatible create user function
   */
  async create(userData: {
    email: string;
    password?: string;
    wallet_address?: string;
    nickname?: string;
    auth_method?: 'wallet' | 'email' | 'social';
  }): Promise<void> {
    try {
      // Check if user already exists
      const existingUser = await this.users.findOne({
        $or: [
          { email: userData.email },
          ...(userData.wallet_address ? [{ wallet_address: userData.wallet_address.toLowerCase() }] : [])
        ]
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      const user: User = {
        user_id: `serviceflow_${uuidv4()}`,
        email: userData.email,
        nickname: userData.nickname || userData.email.split('@')[0],
        email_verified: userData.auth_method === 'wallet' ? true : false,
        created_at: new Date(),
        auth_method: userData.auth_method || (userData.wallet_address ? 'wallet' : 'email'),
        subscription_tier: 'free',
        credits: 100, // Welcome credits
        wallet_address: userData.wallet_address?.toLowerCase(),
      };

      // Hash password if provided
      if (userData.password) {
        user.password = await bcrypt.hash(userData.password, 10);
      }

      await this.users.insertOne(user);
    } catch (error) {
      throw new Error(`User creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auth0-compatible verify email function
   */
  async verify(email: string): Promise<boolean> {
    try {
      const result = await this.users.updateOne(
        { email, email_verified: false },
        { $set: { email_verified: true } }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      throw new Error(`Email verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auth0-compatible change password function
   */
  async changePassword(identifierValue: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const result = await this.users.updateOne(
        { email: identifierValue },
        { $set: { password: hashedPassword } }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      throw new Error(`Password change failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auth0-compatible get user function
   */
  async getUser(identifierValue: string): Promise<{
    user_id: string;
    nickname: string;
    email: string;
    wallet_address?: string;
  } | null> {
    try {
      const user = await this.users.findOne({
        $or: [
          { email: identifierValue },
          { user_id: identifierValue },
          { wallet_address: identifierValue.toLowerCase() }
        ]
      });

      if (!user) return null;

      return {
        user_id: user.user_id,
        nickname: user.nickname || user.email.split('@')[0],
        email: user.email,
        wallet_address: user.wallet_address
      };
    } catch (error) {
      throw new Error(`Get user failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auth0-compatible remove user function
   */
  async remove(id: string): Promise<void> {
    try {
      await this.users.deleteOne({ 
        $or: [
          { _id: id },
          { user_id: id }
        ]
      });
    } catch (error) {
      throw new Error(`User removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Wallet-specific authentication
   */
  async authenticateWallet(walletAddress: string, signature?: string, message?: string): Promise<{
    user_id: string;
    nickname: string;
    email: string;
    wallet_address: string;
    is_new_user: boolean;
  }> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Check if user exists
      let user = await this.users.findOne({ wallet_address: normalizedAddress });
      let isNewUser = false;

      if (!user) {
        // Create new user for wallet
        const userId = `wallet_${uuidv4()}`;
        const email = `${normalizedAddress}@wallet.local`;
        
        user = {
          user_id: userId,
          email,
          nickname: `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`,
          wallet_address: normalizedAddress,
          email_verified: true,
          created_at: new Date(),
          auth_method: 'wallet',
          subscription_tier: 'free',
          credits: 100
        };

        await this.users.insertOne(user);
        isNewUser = true;
      }

      // Update last login
      await this.users.updateOne(
        { wallet_address: normalizedAddress },
        { $set: { last_login: new Date() } }
      );

      return {
        user_id: user.user_id,
        nickname: user.nickname || `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`,
        email: user.email,
        wallet_address: normalizedAddress,
        is_new_user: isNewUser
      };
    } catch (error) {
      throw new Error(`Wallet authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create authentication session
   */
  async createSession(userId: string, platform: string = 'web', walletAddress?: string): Promise<string> {
    try {
      const sessionId = uuidv4();
      const session: AuthSession = {
        session_id: sessionId,
        user_id: userId,
        wallet_address: walletAddress?.toLowerCase(),
        created_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        platform,
        is_active: true
      };

      await this.sessions.insertOne(session);
      return sessionId;
    } catch (error) {
      throw new Error(`Session creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<{
    user_id: string;
    wallet_address?: string;
    is_valid: boolean;
  } | null> {
    try {
      const session = await this.sessions.findOne({
        session_id: sessionId,
        is_active: true,
        expires_at: { $gt: new Date() }
      });

      if (!session) return null;

      return {
        user_id: session.user_id,
        wallet_address: session.wallet_address,
        is_valid: true
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * End session
   */
  async endSession(sessionId: string): Promise<boolean> {
    try {
      const result = await this.sessions.updateOne(
        { session_id: sessionId },
        { $set: { is_active: false } }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      return false;
    }
  }
}

export { MongoAuthServer, User, AuthSession };