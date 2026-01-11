import jwt, { SignOptions } from 'jsonwebtoken';
import { logger } from './logger';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN } as SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
  } catch (error) {
    logger.error('Access token verification failed:', error);
    throw new Error('Invalid access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    logger.error('Refresh token verification failed:', error);
    throw new Error('Invalid refresh token');
  }
};

export const getTokenExpirationDate = (expiresIn: string): Date => {
  const now = new Date();
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  
  if (!match) {
    throw new Error('Invalid expiresIn format');
  }

  const [, value, unit] = match;
  const num = parseInt(value, 10);

  switch (unit) {
    case 'd':
      return new Date(now.getTime() + num * 24 * 60 * 60 * 1000);
    case 'h':
      return new Date(now.getTime() + num * 60 * 60 * 1000);
    case 'm':
      return new Date(now.getTime() + num * 60 * 1000);
    case 's':
      return new Date(now.getTime() + num * 1000);
    default:
      throw new Error('Invalid time unit');
  }
};

