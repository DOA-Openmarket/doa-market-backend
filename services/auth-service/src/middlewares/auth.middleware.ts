import { Request, Response, NextFunction } from 'express';
import { JWTUtil, JWTPayload } from '@/utils/jwt';
import { UserRole } from '@/models/User';
import logger from '@/utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export class AuthMiddleware {
  static authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({
          success: false,
          message: 'No authorization token provided',
        });
        return;
      }

      const parts = authHeader.split(' ');

      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({
          success: false,
          message: 'Invalid authorization format. Use: Bearer <token>',
        });
        return;
      }

      const token = parts[1];
      const payload = JWTUtil.verifyToken(token);

      if (payload.type !== 'access') {
        res.status(401).json({
          success: false,
          message: 'Invalid token type',
        });
        return;
      }

      req.user = payload;
      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  };

  static authorize = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Insufficient permissions',
        });
        return;
      }

      next();
    };
  };

  static optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        next();
        return;
      }

      const parts = authHeader.split(' ');

      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        try {
          const payload = JWTUtil.verifyToken(token);

          if (payload.type === 'access') {
            req.user = payload;
          }
        } catch (error) {
          // Token is invalid or expired, continue without user
          logger.debug('Optional auth token invalid:', error);
        }
      }

      next();
    } catch (error) {
      logger.error('Optional authentication error:', error);
      next();
    }
  };
}
