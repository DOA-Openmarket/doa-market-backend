import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import userRoutes from '../routes/user.routes';
import userController from '../controllers/user.controller';

// Mock auth middleware
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => next(),
}));

// Mock controller
jest.mock('../controllers/user.controller', () => ({
  getUsers: jest.fn((req, res) => {
    res.json({
      success: true,
      data: [
        { id: '1', name: 'User 1', email: 'user1@test.com' },
        { id: '2', name: 'User 2', email: 'user2@test.com' },
      ],
    });
  }),
  getUser: jest.fn((req, res) => {
    res.json({
      success: true,
      data: { id: req.params.id, name: 'Test User', email: 'test@test.com' },
    });
  }),
  createUser: jest.fn((req, res) => {
    res.status(201).json({
      success: true,
      data: { id: '3', ...req.body },
    });
  }),
  updateUser: jest.fn((req, res) => {
    res.json({
      success: true,
      data: { id: req.params.id, ...req.body },
    });
  }),
  deleteUser: jest.fn((req, res) => {
    res.json({
      success: true,
      message: 'User deleted',
    });
  }),
  getUserStats: jest.fn((req, res) => {
    res.json({
      success: true,
      data: {
        totalUsers: 100,
        activeUsers: 80,
        inactiveUsers: 15,
        deletedUsers: 5,
        byRole: {
          user: 90,
          admin: 10,
        },
      },
    });
  }),
}));

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/users', userRoutes);

describe('User API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/users', () => {
    it('should return list of users', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(userController.getUsers).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return user by id', async () => {
      const response = await request(app)
        .get('/api/v1/users/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('1');
      expect(userController.getUser).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should update user', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '010-1234-5678',
      };

      const response = await request(app)
        .patch('/api/v1/users/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(userController.updateUser).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        email: 'newuser@test.com',
        name: 'New User',
        phone: '010-1234-5678',
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(newUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(newUser.email);
      expect(userController.createUser).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/users/stats', () => {
    it('should return user statistics', async () => {
      const response = await request(app)
        .get('/api/v1/users/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('activeUsers');
      expect(response.body.data).toHaveProperty('byRole');
      expect(userController.getUserStats).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete user', async () => {
      const response = await request(app)
        .delete('/api/v1/users/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(userController.deleteUser).toHaveBeenCalled();
    });
  });
});

