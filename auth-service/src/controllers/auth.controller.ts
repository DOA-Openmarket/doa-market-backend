import { Request, Response, NextFunction } from 'express';
import authService, { RegisterDto, LoginDto } from '../services/auth.service';
import { AppError } from '../utils/app-error';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  role: z.enum(['user', 'seller']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const sendVerificationSchema = z.object({
  email: z.string().email('Invalid email'),
});

const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email'),
  code: z.string().length(6, 'Code must be 6 digits'),
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body) as RegisterDto;

      // Register user
      const result = await authService.register(validatedData);

      res.status(201).json({
        success: true,
        data: result,
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

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body) as LoginDto;

      // Login user
      const result = await authService.login(validatedData);

      res.json({
        success: true,
        data: result,
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

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const validatedData = refreshSchema.parse(req.body);

      // Refresh token
      const result = await authService.refresh(validatedData.refreshToken);

      res.json({
        success: true,
        data: result,
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

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const refreshToken = req.body.refreshToken;

      await authService.logout(userId, refreshToken);

      res.json({
        success: true,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;

      const user = await authService.getMe(userId);

      res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async sendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const validatedData = sendVerificationSchema.parse(req.body);

      // Send verification code
      await authService.sendVerificationCode(validatedData.email);

      res.json({
        success: true,
        message: 'Verification code sent to email',
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

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const validatedData = verifyEmailSchema.parse(req.body);

      // Verify code
      await authService.verifyEmailCode(validatedData.email, validatedData.code);

      res.json({
        success: true,
        message: 'Email verified successfully',
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
}

export default new AuthController();

