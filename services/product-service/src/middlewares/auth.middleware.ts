import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, AuthUser } from '@/types';
import { UnauthorizedError, ForbiddenError } from '@utils/errors';
import { logger } from '@utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const checkSellerOwnership = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Admin can access all
    if (req.user.role === 'admin') {
      return next();
    }

    // Seller can only access their own products
    if (req.user.role === 'seller') {
      const sellerId = req.params.sellerId || req.body.sellerId || req.query.sellerId;

      if (!sellerId) {
        throw new ForbiddenError('Seller ID required');
      }

      if (sellerId !== req.user.sellerId) {
        throw new ForbiddenError('You can only access your own products');
      }

      return next();
    }

    throw new ForbiddenError('Insufficient permissions');
  } catch (error) {
    next(error);
  }
};
