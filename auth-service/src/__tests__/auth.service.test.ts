import { AuthService } from '../services/auth.service';
import User from '../models/user.model';
import RefreshToken from '../models/refresh-token.model';
import { AppError } from '../utils/app-error';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock models
jest.mock('../models/user.model');
jest.mock('../models/refresh-token.model');

describe('AuthService', () => {
  let authService: AuthService;
  let bcrypt: any;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
    bcrypt = require('bcryptjs');
    // Reset bcrypt mocks to default behavior
    bcrypt.compare.mockResolvedValue(true);
  });

  describe('register', () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should register a new user successfully', async () => {
      // Mock User.findOne to return null (user doesn't exist)
      (User.findOne as jest.Mock).mockResolvedValue(null);

      // Mock User.create
      const mockUser = {
        id: 'user-id',
        email: registerData.email,
        name: registerData.name,
        role: 'user',
        toJSON: jest.fn().mockReturnValue({
          id: 'user-id',
          email: registerData.email,
          name: registerData.name,
          role: 'user',
        }),
      };
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      // Mock RefreshToken.create
      (RefreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.register(registerData);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: registerData.email } });
      expect(User.create).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error if email already exists', async () => {
      // Mock User.findOne to return existing user
      (User.findOne as jest.Mock).mockResolvedValue({ id: 'existing-user' });

      await expect(authService.register(registerData)).rejects.toThrow(AppError);
      await expect(authService.register(registerData)).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-id',
        email: loginData.email,
        status: 'active',
        password: '$2a$10$hashedpassword',
        getDataValue: jest.fn((key: string) => {
          if (key === 'password') return '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'; // bcrypt hash of 'password123'
          return (mockUser as any)[key];
        }),
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: 'user-id',
          email: loginData.email,
        }),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (RefreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.login(loginData);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: loginData.email } });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow(AppError);
      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is invalid', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const mockUser = {
        id: 'user-id',
        status: 'active',
        email: loginData.email,
        password: '$2a$10$differenthash',
        getDataValue: jest.fn((key: string) => {
          if (key === 'password') return '$2a$10$differenthash';
          if (key === 'id') return 'user-id';
          return (mockUser as any)[key];
        }),
        comparePassword: jest.fn().mockResolvedValue(false),
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: 'user-id',
          email: loginData.email,
        }),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.login(loginData)).rejects.toThrow(AppError);
      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if account is suspended', async () => {
      const mockUser = {
        id: 'user-id',
        status: 'suspended',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.login(loginData)).rejects.toThrow(AppError);
      await expect(authService.login(loginData)).rejects.toThrow('Account suspended');
    });
  });
});

