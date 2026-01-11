import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, requireRole, AuthRequest } from '../src/middleware/auth.middleware';

describe('Auth Middleware', () => {
  const JWT_SECRET = 'test-secret';
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    process.env.JWT_ACCESS_SECRET = JWT_SECRET;
  });

  describe('authMiddleware', () => {
    it('should reject request without authorization header', () => {
      authMiddleware(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', () => {
      req.headers = { authorization: 'InvalidFormat token123' };

      authMiddleware(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      req.headers = { authorization: 'Bearer invalid-token' };

      authMiddleware(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Unauthorized',
        })
      );
    });

    it('should accept request with valid token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'customer',
      };
      const token = jwt.sign(payload, JWT_SECRET);
      req.headers = { authorization: `Bearer ${token}` };

      authMiddleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(expect.objectContaining(payload));
    });

    it('should set user headers for proxying', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'customer',
      };
      const token = jwt.sign(payload, JWT_SECRET);
      req.headers = { authorization: `Bearer ${token}` };

      authMiddleware(req as AuthRequest, res as Response, next);

      expect(req.headers['x-user-id']).toBe(payload.userId);
      expect(req.headers['x-user-email']).toBe(payload.email);
      expect(req.headers['x-user-role']).toBe(payload.role);
    });

    it('should reject expired token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'customer',
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1s' });
      req.headers = { authorization: `Bearer ${token}` };

      authMiddleware(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Token expired',
      });
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'customer',
      };
    });

    it('should allow access with correct role', () => {
      const middleware = requireRole('customer', 'admin');

      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access with incorrect role', () => {
      const middleware = requireRole('admin', 'seller');

      middleware(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Access denied. Required roles: admin, seller',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access without user', () => {
      req.user = undefined;
      const middleware = requireRole('admin');

      middleware(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
