import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth.routes';
import authService from '../services/auth.service';
import { errorHandler } from '../middleware/error-handler';

// Mock auth service
jest.mock('../services/auth.service');

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use(errorHandler);

describe('Auth Controller', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const mockResponse = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      (authService.register as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      // 에러 응답 확인 (success 또는 error 필드)
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      // 에러 응답 확인 (success 또는 error 필드)
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user successfully', async () => {
      const mockResponse = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      (authService.login as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
    });
  });
});

