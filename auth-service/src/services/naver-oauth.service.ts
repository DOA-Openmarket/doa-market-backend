import axios from 'axios';
import User from '../models/user.model';
import RefreshToken from '../models/refresh-token.model';
import { generateAccessToken, generateRefreshToken, getTokenExpirationDate, TokenPayload } from '../utils/jwt';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import crypto from 'crypto';

interface NaverTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface NaverUserInfo {
  resultcode: string;
  message: string;
  response: {
    id: string;
    email: string;
    name: string;
    mobile?: string;
    mobile_e164?: string;
  };
}

export class NaverOAuthService {
  private clientId: string;
  private clientSecret: string;
  private callbackUrl: string;

  constructor() {
    this.clientId = process.env.NAVER_CLIENT_ID || '';
    this.clientSecret = process.env.NAVER_CLIENT_SECRET || '';
    this.callbackUrl = process.env.NAVER_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/naver/callback';

    if (!this.clientId || !this.clientSecret) {
      logger.warn('Naver OAuth credentials not configured');
    }
  }

  /**
   * Generate Naver OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const stateValue = state || this.generateState();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      state: stateValue,
    });

    return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateState(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string, state: string): Promise<NaverTokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        state: state,
      });

      const response = await axios.post<NaverTokenResponse>(
        'https://nid.naver.com/oauth2.0/token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (!response.data.access_token) {
        throw new AppError('Failed to get access token from Naver', 500);
      }

      return response.data;
    } catch (error: any) {
      logger.error('Failed to get Naver access token', {
        error: error.message,
        response: error.response?.data,
        code: code.substring(0, 10) + '...' // Log partial code for debugging
      });

      // Provide more specific error messages
      if (error.response?.data?.error === 'invalid_grant') {
        throw new AppError('인증 코드가 만료되었거나 이미 사용되었습니다. 다시 로그인해 주세요.', 400);
      } else if (error.response?.data?.error === 'invalid_client') {
        throw new AppError('네이버 로그인 설정에 문제가 있습니다.', 500);
      } else if (error.response?.status === 401) {
        throw new AppError('네이버 인증에 실패했습니다. 다시 시도해 주세요.', 401);
      }

      throw new AppError('네이버 로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.', 500);
    }
  }

  /**
   * Get user information from Naver
   */
  async getUserInfo(accessToken: string): Promise<NaverUserInfo> {
    try {
      const response = await axios.get<NaverUserInfo>('https://openapi.naver.com/v1/nid/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.resultcode !== '00') {
        logger.error('Failed to get Naver user info', {
          resultcode: response.data.resultcode,
          message: response.data.message
        });
        throw new AppError('네이버에서 사용자 정보를 가져올 수 없습니다.', 500);
      }

      return response.data;
    } catch (error: any) {
      logger.error('Failed to get Naver user info', {
        error: error.message,
        response: error.response?.data
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('네이버 사용자 정보 조회 중 오류가 발생했습니다.', 500);
    }
  }

  /**
   * Login or register user with Naver OAuth
   */
  async loginWithNaver(code: string, state: string): Promise<{ user: any; accessToken: string; refreshToken: string }> {
    // Get access token from Naver
    const naverToken = await this.getAccessToken(code, state);

    // Get user info from Naver
    const naverUserInfo = await this.getUserInfo(naverToken.access_token);

    const { email, name, mobile } = naverUserInfo.response;

    if (!email) {
      throw new AppError('Email is required from Naver', 400);
    }

    // Find or create user
    let user = await User.findOne({ where: { email } });

    if (user) {
      // User exists, update last login
      user.lastLoginAt = new Date();
      await user.save();
      logger.info(`Existing user logged in with Naver: ${user.id}`);
    } else {
      // Create new user
      const bcrypt = require('bcryptjs');
      // Generate random password for OAuth users (they won't use it)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        phone: mobile,
        role: 'user',
        status: 'active',
        emailVerified: true, // Naver email is already verified
      });

      logger.info(`New user registered with Naver: ${user.id}`);
    }

    // Get user data
    const userData = user.toJSON();
    const userId = userData.id || user.id || user.getDataValue('id');

    // Generate JWT tokens
    const payload: TokenPayload = {
      userId,
      email: userData.email,
      role: userData.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token
    await RefreshToken.create({
      userId,
      token: refreshToken,
      expiresAt: getTokenExpirationDate(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
    });

    return {
      user: userData,
      accessToken,
      refreshToken,
    };
  }
}

export default new NaverOAuthService();
