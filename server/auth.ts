import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { loginSchema, registerSchema, type User } from '@shared/schema';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// JWT Secret - in production, this should be from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateAccessToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  static verifyAccessToken(token: string): { userId: number; email: string; role: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string };
    } catch {
      return null;
    }
  }

  // Hybrid authentication - supports both sessions and bearer tokens
  static async authenticateRequest(req: Request): Promise<User | null> {
    // Try bearer token first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = this.verifyAccessToken(token);
      if (decoded) {
        const user = await storage.getUserByEmail(decoded.email);
        return user || null;
      }
    }

    // Try session authentication
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
      const session = await storage.getSession(sessionId);
      if (session && session.expiresAt > new Date()) {
        const user = await storage.getUserById(session.userId);
        return user || null;
      }
    }

    return null;
  }

  static async login(email: string, password: string): Promise<{ user: User; token: string; sessionId: string } | null> {
    const user = await storage.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      return null;
    }

    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    // Update last login
    await storage.updateUser(user.id, { lastLoginAt: new Date() });

    // Create session
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY);
    
    await storage.createSession({
      id: sessionId,
      userId: user.id,
      expiresAt
    });

    // Generate access token
    const token = this.generateAccessToken(user);

    return { user, token, sessionId };
  }

  static async linkedInLogin(linkedInProfile: any): Promise<{ user: User; token: string; sessionId: string } | null> {
    const { id, firstName, lastName, emailAddress, pictureUrl } = linkedInProfile;
    
    // Check if LinkedIn user already exists by LinkedIn ID
    let user = await storage.getUserByLinkedInId(id);
    
    if (!user) {
      // Check if user exists by email (existing account linking LinkedIn)
      user = await storage.getUserByEmail(emailAddress);
      
      if (user) {
        // Link LinkedIn profile to existing user account
        await storage.updateUser(user.id, {
          linkedinId: id,
          linkedinProfile: linkedInProfile,
          profileImageUrl: pictureUrl,
          lastLoginAt: new Date()
        });
      } else {
        // Create new user from LinkedIn profile
        user = await storage.createUser({
          email: emailAddress,
          linkedinId: id,
          linkedinProfile: linkedInProfile,
          firstName: firstName,
          lastName: lastName,
          profileImageUrl: pictureUrl,
          role: 'rep',
          isActive: true
        });
      }
    } else {
      // Update existing user's LinkedIn profile
      await storage.updateUser(user.id, {
        linkedinProfile: linkedInProfile,
        profileImageUrl: pictureUrl,
        lastLoginAt: new Date()
      });
    }

    // Create session
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY);
    
    await storage.createSession({
      id: sessionId,
      userId: user.id,
      expiresAt
    });

    // Generate access token
    const token = this.generateAccessToken(user);

    return { user, token, sessionId };
  }

  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<{ user: User; token: string; sessionId: string } | null> {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(data.email);
    if (existingUser) {
      return null;
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const user = await storage.createUser({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || 'rep',
      isActive: true
    });

    // Create session
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY);
    
    await storage.createSession({
      id: sessionId,
      userId: user.id,
      expiresAt
    });

    // Generate access token
    const token = this.generateAccessToken(user);

    return { user, token, sessionId };
  }

  static async logout(sessionId: string): Promise<boolean> {
    return storage.deleteSession(sessionId);
  }

  static async validateSession(sessionId: string): Promise<User | null> {
    const session = await storage.getSession(sessionId);
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await storage.deleteSession(sessionId);
      }
      return null;
    }

    const user = await storage.getUserByEmail(''); // Get user by ID would be better
    return user || null;
  }
}

// Middleware for authentication - supports both tokens and sessions
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await AuthService.authenticateRequest(req);
    
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware for role-based access control
export const requireRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Middleware for admin only access
export const requireAdmin = requireRole('admin');