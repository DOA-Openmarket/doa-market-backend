import { Repository } from 'typeorm';
import { AppDataSource } from '@/config/database';
import { User, UserRole, UserStatus } from '@/models/User';
import { RefreshToken } from '@/models/RefreshToken';
import { JWTUtil } from '@/utils/jwt';
import logger from '@/utils/logger';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private userRepository: Repository<User>;
  private refreshTokenRepository: Repository<RefreshToken>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
  }

  async register(input: RegisterInput): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    const user = this.userRepository.create({
      email: input.email,
      password: input.password,
      name: input.name,
      phoneNumber: input.phoneNumber,
      role: input.role || UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    });

    await this.userRepository.save(user);
    logger.info(`User registered: ${user.email}`);

    return user;
  }

  async login(input: LoginInput): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.userRepository.findOne({
      where: { email: input.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new Error(`Account is ${user.status}`);
    }

    if (user.isLocked()) {
      throw new Error('Account is temporarily locked due to multiple failed login attempts');
    }

    const isPasswordValid = await user.comparePassword(input.password);

    if (!isPasswordValid) {
      user.incrementFailedAttempts();
      await this.userRepository.save(user);
      throw new Error('Invalid credentials');
    }

    user.resetFailedAttempts();
    user.lastLoginAt = new Date();
    user.lastLoginIp = input.ipAddress || '';
    await this.userRepository.save(user);

    const tokens = await this.generateTokenPair(user, input.ipAddress, input.userAgent);

    logger.info(`User logged in: ${user.email}`);

    return { user, tokens };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const payload = JWTUtil.verifyToken(refreshToken);

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!storedToken || !storedToken.isValid()) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = storedToken.user;

    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('Account is not active');
    }

    const newTokens = await this.generateTokenPair(
      user,
      storedToken.ipAddress,
      storedToken.userAgent
    );

    storedToken.isRevoked = true;
    storedToken.revokedAt = new Date();
    await this.refreshTokenRepository.save(storedToken);

    logger.info(`Access token refreshed for user: ${user.email}`);

    return newTokens;
  }

  async logout(refreshToken: string): Promise<void> {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (storedToken) {
      storedToken.isRevoked = true;
      storedToken.revokedAt = new Date();
      await this.refreshTokenRepository.save(storedToken);
      logger.info(`User logged out`);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ isRevoked: true, revokedAt: new Date() })
      .where('userId = :userId', { userId })
      .andWhere('isRevoked = :isRevoked', { isRevoked: false })
      .execute();

    logger.info(`All tokens revoked for user: ${userId}`);
  }

  async verifyEmail(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    user.emailVerified = true;
    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);

    logger.info(`Email verified for user: ${user.email}`);
  }

  private async generateTokenPair(
    user: User,
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenPair> {
    const accessToken = JWTUtil.generateAccessToken(user);
    const refreshToken = JWTUtil.generateRefreshToken(user);

    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: JWTUtil.getTokenExpiration(process.env.JWT_REFRESH_EXPIRY || '7d'),
      ipAddress,
      userAgent,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken };
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
}
