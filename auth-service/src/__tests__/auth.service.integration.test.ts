import authService, { RegisterDto, LoginDto } from '../services/auth.service';
import User from '../models/user.model';
import RefreshToken from '../models/refresh-token.model';
import { AppError } from '../utils/app-error';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock database models
jest.mock('../models/user.model');
jest.mock('../models/refresh-token.model');
jest.mock('../utils/jwt', () => ({
  generateAccessToken: jest.fn(() => 'mock-access-token'),
  generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
  getTokenExpirationDate: jest.fn(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
}));

describe('Auth Service Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: registerData.email,
        name: registerData.name,
        role: 'user',
        toJSON: () => ({
          id: 'user-id',
          email: registerData.email,
          name: registerData.name,
          role: 'user',
        }),
      });
      (RefreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.register(registerData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(registerData.email);
    });

    it('should throw error for duplicate email', async () => {
      const registerData: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      };

      (User.findOne as jest.Mock).mockResolvedValue({
        id: 'existing-user-id',
        email: registerData.email,
      });

      await expect(authService.register(registerData)).rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginData: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id',
        email: loginData.email,
        name: 'Test User',
        role: 'user',
        status: 'active',
        lastLoginAt: null,
        password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        getDataValue: jest.fn((key: string) => {
          if (key === 'password') return '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
          return (mockUser as any)[key];
        }),
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toJSON: () => ({
          id: 'user-id',
          email: loginData.email,
          name: 'Test User',
          role: 'user',
        }),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (RefreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.login(loginData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error for invalid credentials', async () => {
      const loginData: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow(AppError);
    });
  });
});

