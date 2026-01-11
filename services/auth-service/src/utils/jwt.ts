import jwt from 'jsonwebtoken';
import { User, UserRole } from '@/models/User';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export class JWTUtil {
  private static readonly secret = process.env.JWT_SECRET || 'default-secret-change-me';
  private static readonly issuer = process.env.JWT_ISSUER || 'doa-market-auth';
  private static readonly accessExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
  private static readonly refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

  static generateAccessToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: this.accessExpiry as any,
      issuer: this.issuer,
    });
  }

  static generateRefreshToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: this.refreshExpiry as any,
      issuer: this.issuer,
    });
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.secret, {
        issuer: this.issuer,
      }) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  static getTokenExpiration(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([mhd])$/);

    if (!match) {
      throw new Error('Invalid expiry format');
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 15 * 60 * 1000); // default 15 minutes
    }
  }
}
