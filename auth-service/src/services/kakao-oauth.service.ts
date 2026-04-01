import axios from 'axios';
import User from '../models/user.model';
import RefreshToken from '../models/refresh-token.model';
import { generateAccessToken, generateRefreshToken, getTokenExpirationDate, TokenPayload } from '../utils/jwt';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import crypto from 'crypto';

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
  refresh_token_expires_in: number;
}

interface KakaoUserInfo {
  id: number;
  connected_at: string;
  kakao_account?: {
    profile_nickname_needs_agreement?: boolean;
    profile_image_needs_agreement?: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
    };
    name_needs_agreement?: boolean;
    name?: string;
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    email?: string;
    phone_number_needs_agreement?: boolean;
    phone_number?: string;
  };
}

export class KakaoOAuthService {
  private clientId: string;
  private clientSecret?: string;
  private callbackUrl: string;

  constructor() {
    this.clientId = process.env.KAKAO_CLIENT_ID || '';
    this.clientSecret = process.env.KAKAO_CLIENT_SECRET;
    this.callbackUrl = process.env.KAKAO_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/kakao/callback';

    if (!this.clientId) {
      logger.warn('Kakao OAuth credentials not configured');
    }
  }

  /**
   * Generate Kakao OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const stateValue = state || this.generateState();
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      response_type: 'code',
      state: stateValue,
    });

    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
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
  async getAccessToken(code: string): Promise<KakaoTokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        redirect_uri: this.callbackUrl,
        code: code,
      });

      // Client secret is optional for Kakao
      if (this.clientSecret) {
        params.append('client_secret', this.clientSecret);
      }

      const response = await axios.post<KakaoTokenResponse>(
        'https://kauth.kakao.com/oauth/token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (!response.data.access_token) {
        throw new AppError('Failed to get access token from Kakao', 500);
      }

      return response.data;
    } catch (error: any) {
      logger.error('Failed to get Kakao access token', {
        error: error.message,
        response: error.response?.data,
        code: code.substring(0, 10) + '...' // Log partial code for debugging
      });

      // Provide more specific error messages
      if (error.response?.data?.error === 'invalid_grant') {
        throw new AppError('인증 코드가 만료되었거나 이미 사용되었습니다. 다시 로그인해 주세요.', 400);
      } else if (error.response?.data?.error === 'invalid_client') {
        throw new AppError('카카오 로그인 설정에 문제가 있습니다.', 500);
      } else if (error.response?.status === 401) {
        throw new AppError('카카오 인증에 실패했습니다. 다시 시도해 주세요.', 401);
      }

      throw new AppError('카카오 로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.', 500);
    }
  }

  /**
   * Get user information from Kakao
   */
  async getUserInfo(accessToken: string): Promise<KakaoUserInfo> {
    try {
      const response = await axios.get<KakaoUserInfo>('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.data.id) {
        logger.error('Failed to get Kakao user info', {
          data: response.data
        });
        throw new AppError('카카오에서 사용자 정보를 가져올 수 없습니다.', 500);
      }

      return response.data;
    } catch (error: any) {
      logger.error('Failed to get Kakao user info', {
        error: error.message,
        response: error.response?.data
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('카카오 사용자 정보 조회 중 오류가 발생했습니다.', 500);
    }
  }

  /**
   * Login or register user with Kakao OAuth
   */
  async loginWithKakao(code: string, _state: string): Promise<{ user: any; accessToken: string; refreshToken: string }> {
    // Get access token from Kakao
    const kakaoToken = await this.getAccessToken(code);

    // Get user info from Kakao
    const kakaoUserInfo = await this.getUserInfo(kakaoToken.access_token);

    const email = kakaoUserInfo.kakao_account?.email;
    const name = kakaoUserInfo.kakao_account?.profile?.nickname || kakaoUserInfo.kakao_account?.name;
    const phone = kakaoUserInfo.kakao_account?.phone_number;

    // Email is optional in Kakao, use kakao ID if email is not available
    const userEmail = email || `kakao_${kakaoUserInfo.id}@kakao.oauth`;

    // Find or create user
    let user = await User.findOne({ where: { email: userEmail } });

    if (user) {
      // User exists, update last login
      user.lastLoginAt = new Date();
      await user.save();
      logger.info(`Existing user logged in with Kakao: ${user.id}`);
    } else {
      // Create new user
      const bcrypt = require('bcryptjs');
      // Generate random password for OAuth users (they won't use it)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        email: userEmail,
        password: hashedPassword,
        name: name || `카카오사용자${kakaoUserInfo.id}`,
        phone: phone,
        role: 'user',
        status: 'active',
        emailVerified: kakaoUserInfo.kakao_account?.is_email_verified || false,
      });

      logger.info(`New user registered with Kakao: ${user.id}`);
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

export default new KakaoOAuthService();
