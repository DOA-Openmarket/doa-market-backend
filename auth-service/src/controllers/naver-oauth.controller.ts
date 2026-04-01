import { Request, Response, NextFunction } from 'express';
import naverOAuthService from '../services/naver-oauth.service';
import { AppError } from '../utils/app-error';
import { z } from 'zod';

const naverCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State is required'),
});

export class NaverOAuthController {
  /**
   * Get Naver OAuth authorization URL
   * GET /api/v1/auth/naver
   */
  async getAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const state = req.query.state as string | undefined;
      const authUrl = naverOAuthService.getAuthorizationUrl(state);

      res.json({
        success: true,
        data: {
          authUrl,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Naver OAuth callback
   * GET /api/v1/auth/naver/callback
   */
  async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state, error, error_description } = req.query;

      // Check for OAuth errors
      if (error) {
        throw new AppError(`Naver OAuth error: ${error_description || error}`, 400);
      }

      // Validate parameters
      const validatedData = naverCallbackSchema.parse({ code, state });

      // Login with Naver
      const result = await naverOAuthService.loginWithNaver(validatedData.code, validatedData.state);

      // Return JSON response for mobile app
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

  /**
   * Login with Naver (for mobile app direct usage)
   * POST /api/v1/auth/naver/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = naverCallbackSchema.parse(req.body);

      // Login with Naver
      const result = await naverOAuthService.loginWithNaver(validatedData.code, validatedData.state);

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
}

export default new NaverOAuthController();
