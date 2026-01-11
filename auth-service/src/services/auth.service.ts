import User, { UserAttributes } from '../models/user.model';
import RefreshToken from '../models/refresh-token.model';
import VerificationCode from '../models/verification-code.model';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, getTokenExpirationDate, TokenPayload } from '../utils/jwt';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'user' | 'seller';
}

export interface LoginDto {
  email: string;
  password: string;
}

export class AuthService {
  async register(data: RegisterDto): Promise<{ user: Omit<UserAttributes, 'password'>; accessToken: string; refreshToken: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Hash password before creating user
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Create user
    const user = await User.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phone: data.phone,
      role: data.role || 'user',
      status: 'active',
      emailVerified: false,
    });

    // Get user ID - try multiple methods
    let userId = user.id || user.getDataValue('id') || (user as any).dataValues?.id;
    
    if (!userId) {
      // Reload user to ensure all fields are populated
      await user.reload();
      userId = user.id || user.getDataValue('id') || (user as any).dataValues?.id;
    }
    
    if (!userId) {
      logger.error('User ID is null after creation and reload', { user: user.toJSON() });
      throw new AppError('Failed to create user', 500);
    }
    
    logger.info(`User registered: ${userId}`);
    
    // Get user data
    const userData = user.toJSON();
    const finalUserId = userId || userData.id;

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

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginDto): Promise<{ user: Omit<UserAttributes, 'password'>; accessToken: string; refreshToken: string }> {
    // Find user (password is included by default, but we need to ensure it's loaded)
    const user = await User.findOne({ 
      where: { email: data.email }
    });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    
    // Check status
    if (user.status === 'suspended') {
      throw new AppError('Account suspended', 403);
    }
    if (user.status === 'deleted') {
      throw new AppError('Account deleted', 403);
    }

    // Verify password
    // Get password directly from dataValues to ensure it's available
    const storedPassword = user.getDataValue('password');
    if (!storedPassword) {
      logger.error('Password not found for user', { email: data.email, userId: user.id });
      throw new AppError('Invalid credentials', 401);
    }
    
    // Use bcrypt directly to compare passwords
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(data.password, storedPassword);
    if (!isPasswordValid) {
      logger.error('Password comparison failed', { 
        email: data.email,
        passwordLength: data.password?.length,
        storedPasswordLength: storedPassword?.length,
        storedPasswordPrefix: storedPassword?.substring(0, 10)
      });
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Get user data (ensure id is available)
    const userData = user.toJSON();
    const finalUserId = userData.id || user.id || user.getDataValue('id');
    logger.info(`User logged in: ${finalUserId}`);

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

    return {
      user: userData,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    // Verify token
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Check if token exists in database
    const tokenRecord = await RefreshToken.findOne({
      where: { token: refreshToken },
    });

    if (!tokenRecord) {
      throw new AppError('Refresh token not found', 401);
    }

    // Check if token expired
    if (new Date() > tokenRecord.expiresAt) {
      await tokenRecord.destroy();
      throw new AppError('Refresh token expired', 401);
    }

    // Find user
    const user = await User.findByPk(payload.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check user status
    if (user.status !== 'active') {
      throw new AppError('Account not active', 403);
    }

    // Generate new access token
    const newPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(newPayload);

    logger.info(`Access token refreshed for user: ${user.id}`);

    return {
      accessToken: newAccessToken,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Delete specific refresh token
      await RefreshToken.destroy({
        where: { token: refreshToken },
      });
    } else {
      // Delete all refresh tokens for user
      await RefreshToken.destroy({
        where: { userId },
      });
    }

    logger.info(`User logged out: ${userId}`);
  }

  async getMe(userId: string): Promise<Omit<UserAttributes, 'password'>> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user.toJSON();
  }

  async sendVerificationCode(email: string): Promise<void> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete any existing unverified codes for this email
    await VerificationCode.destroy({
      where: {
        email,
        verified: false,
      },
    });

    // Create new verification code
    await VerificationCode.create({
      email,
      code,
      expiresAt,
      verified: false,
    });

    // TODO: Send email via notification service or nodemailer
    // For now, just log the code (in production, this should be removed)
    logger.info(`Verification code for ${email}: ${code}`);

    // In production, send email:
    // await sendEmail({
    //   to: email,
    //   subject: 'Email Verification Code',
    //   text: `Your verification code is: ${code}`,
    // });
  }

  async verifyEmailCode(email: string, code: string): Promise<void> {
    // Find verification code
    const verificationCode = await VerificationCode.findOne({
      where: {
        email,
        code,
        verified: false,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!verificationCode) {
      throw new AppError('Invalid or expired verification code', 400);
    }

    // Mark as verified
    verificationCode.verified = true;
    await verificationCode.save();

    // Update user's emailVerified status
    await User.update(
      { emailVerified: true },
      { where: { email } }
    );

    logger.info(`Email verified: ${email}`);
  }
}

export default new AuthService();

