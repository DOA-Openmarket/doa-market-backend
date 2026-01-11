import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import axios from 'axios';
import User from '../models/user.model';
import RefreshToken from '../models/refresh-token.model';
import { generateAccessToken, generateRefreshToken, getTokenExpirationDate, TokenPayload } from '../utils/jwt';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

const SELLER_SERVICE_URL = process.env.SELLER_SERVICE_URL || 'http://localhost:3007';

// Validation schemas
const sellerSignUpSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  businessNumber: z.string().min(10, 'Business number is required'),
});

const sellerSignInSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export class SellerAuthController {
  async signUp(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const validatedData = sellerSignUpSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: validatedData.email } });
      if (existingUser) {
        throw new AppError('Email already registered', 409);
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(validatedData.password, salt);

      // Create user with seller role
      const user = await User.create({
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        phone: validatedData.phone,
        role: 'seller',
        status: 'active',
        emailVerified: false,
      });

      // Get user ID
      let userId = user.id || user.getDataValue('id') || (user as any).dataValues?.id;

      if (!userId) {
        await user.reload();
        userId = user.id || user.getDataValue('id') || (user as any).dataValues?.id;
      }

      if (!userId) {
        logger.error('User ID is null after creation', { user: user.toJSON() });
        throw new AppError('Failed to create seller user', 500);
      }

      // Create seller record via seller-service
      try {
        await axios.post(`${SELLER_SERVICE_URL}/api/v1/sellers`, {
          userId: userId,
          storeName: validatedData.storeName,
          businessNumber: validatedData.businessNumber,
          status: 'pending', // Pending verification
        });
      } catch (error: any) {
        // Rollback user creation if seller creation fails
        await user.destroy();

        if (error.response?.status === 409) {
          throw new AppError('Business number already registered', 409);
        }

        logger.error('Failed to create seller record', { error: error.message, userId });
        throw new AppError('Failed to create seller account', 500);
      }

      logger.info(`Seller registered: ${userId}`);

      // Get user data
      const userData = user.toJSON();

      // Generate tokens
      const payload: TokenPayload = {
        userId: userId,
        email: userData.email,
        role: userData.role,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Save refresh token
      await RefreshToken.create({
        userId: userId,
        token: refreshToken,
        expiresAt: getTokenExpirationDate(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
      });

      res.status(201).json({
        success: true,
        data: {
          user: userData,
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

  async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const validatedData = sellerSignInSchema.parse(req.body);

      // Find user
      const user = await User.findOne({
        where: { email: validatedData.email }
      });

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if user is a seller
      if (user.role !== 'seller') {
        throw new AppError('Not a seller account', 403);
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
        logger.error('Password not found for seller', { email: validatedData.email, userId: user.id });
        throw new AppError('Invalid credentials', 401);
      }

      const bcrypt = require('bcryptjs');
      const isPasswordValid = await bcrypt.compare(validatedData.password, storedPassword);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Get user data
      const userData = user.toJSON();
      const finalUserId = userData.id || user.id || user.getDataValue('id');
      logger.info(`Seller logged in: ${finalUserId}`);

      // Get seller details from seller-service
      let sellerData = null;
      try {
        const sellerResponse = await axios.get(`${SELLER_SERVICE_URL}/api/v1/sellers?userId=${finalUserId}`);
        if (sellerResponse.data?.data && Array.isArray(sellerResponse.data.data)) {
          sellerData = sellerResponse.data.data[0];
        }
      } catch (error: any) {
        logger.warn('Failed to fetch seller details', { error: error.message, userId: finalUserId });
        // Continue without seller details
      }

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
          user: {
            ...userData,
            seller: sellerData,
          },
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

      // Check if user is a seller
      if (userRole !== 'seller') {
        throw new AppError('Not a seller account', 403);
      }

      // Get user
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get seller details
      let sellerData = null;
      try {
        const sellerResponse = await axios.get(`${SELLER_SERVICE_URL}/api/v1/sellers?userId=${userId}`);
        if (sellerResponse.data?.data && Array.isArray(sellerResponse.data.data)) {
          sellerData = sellerResponse.data.data[0];
        }
      } catch (error: any) {
        logger.warn('Failed to fetch seller details', { error: error.message, userId });
      }

      const userData = user.toJSON();

      res.json({
        success: true,
        data: {
          ...userData,
          seller: sellerData,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SellerAuthController();
