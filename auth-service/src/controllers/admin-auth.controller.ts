import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import User from '../models/user.model';
import RefreshToken from '../models/refresh-token.model';
import { generateAccessToken, generateRefreshToken, getTokenExpirationDate, TokenPayload } from '../utils/jwt';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

// Validation schemas
const adminSignInSchema = z.object({
  adminId: z.string().min(1, 'Admin ID is required'),
  adminPw: z.string().min(1, 'Password is required'),
});

export class AdminAuthController {
  async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const validatedData = adminSignInSchema.parse(req.body);

      // Find admin user (adminId is stored as email)
      const user = await User.findOne({
        where: { email: validatedData.adminId }
      });

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if user is an admin
      if (user.role !== 'admin') {
        throw new AppError('Not an admin account', 403);
      }

      // Check status
      if (user.status === 'suspended') {
        throw new AppError('Account suspended', 403);
      }
      if (user.status === 'deleted') {
        throw new AppError('Account deleted', 403);
      }

      // Verify password
      const storedPassword = user.getDataValue('password');
      if (!storedPassword) {
        logger.error('Password not found for admin', { adminId: validatedData.adminId, userId: user.id });
        throw new AppError('Invalid credentials', 401);
      }

      const bcrypt = require('bcryptjs');
      const isPasswordValid = await bcrypt.compare(validatedData.adminPw, storedPassword);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Get user data
      const userData = user.toJSON();
      const finalUserId = userData.id || user.id || user.getDataValue('id');
      logger.info(`Admin logged in: ${finalUserId}`);

      // Generate tokens
      const payload: TokenPayload = {
        userId: finalUserId,
        email: userData.email,
        role: userData.role,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Save refresh token
      await RefreshToken.create({
        userId: finalUserId,
        token: refreshToken,
        expiresAt: getTokenExpirationDate(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
      });

      res.json({
        success: true,
        data: {
          admin: userData,
          accessToken,
          refreshToken,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(error.errors[0].message, 400));
      } else {
        next(error);
      }
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      // Check if user is an admin
      if (userRole !== 'admin') {
        throw new AppError('Not an admin account', 403);
      }

      // Get user
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const userData = user.toJSON();

      res.json({
        success: true,
        data: {
          admin: userData,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminAuthController();
