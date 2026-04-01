import { Request, Response, NextFunction } from 'express';
import kakaoOAuthService from '../services/kakao-oauth.service';
import { AppError } from '../utils/app-error';
import { z } from 'zod';

const kakaoCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State is required'),
});

export class KakaoOAuthController {
  /**
   * Get Kakao OAuth authorization URL
   * GET /api/v1/auth/kakao
   */
  async getAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const state = req.query.state as string | undefined;
      const authUrl = kakaoOAuthService.getAuthorizationUrl(state);

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
   * Handle Kakao OAuth callback
   * GET /api/v1/auth/kakao/callback
   */
  async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state, error, error_description } = req.query;

      // Check for OAuth errors
      if (error) {
        throw new AppError(`Kakao OAuth error: ${error_description || error}`, 400);
      }

      // Validate parameters
      const validatedData = kakaoCallbackSchema.parse({ code, state });

      // Login with Kakao
      const result = await kakaoOAuthService.loginWithKakao(validatedData.code, validatedData.state);

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
   * Login with Kakao (for mobile app direct usage)
   * POST /api/v1/auth/kakao/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = kakaoCallbackSchema.parse(req.body);

      // Login with Kakao
      const result = await kakaoOAuthService.loginWithKakao(validatedData.code, validatedData.state);

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

export default new KakaoOAuthController();
