import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import notificationRoutes from '../routes/notification.routes';
import Notification from '../models/notification.model';

// Mock database
jest.mock('../models/notification.model');
jest.mock('../config/database', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
  },
}));

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/notifications', notificationRoutes);

describe('Notification API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/notifications', () => {
    it('should return list of notifications', async () => {
      const mockNotifications = [
        {
          id: '1',
          userId: 'user-1',
          type: 'order',
          title: '주문 확인',
          content: '주문이 확인되었습니다.',
          status: 'sent',
        },
      ];

      (Notification.findAll as jest.Mock).mockResolvedValue(mockNotifications);

      const response = await request(app)
        .get('/api/v1/notifications')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/notifications', () => {
    it('should create a new notification', async () => {
      const newNotification = {
        userId: 'user-1',
        type: 'order',
        title: '주문 확인',
        content: '주문이 확인되었습니다.',
        status: 'pending',
      };

      const createdNotification = {
        id: '1',
        ...newNotification,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Notification.create as jest.Mock).mockResolvedValue(createdNotification);

      const response = await request(app)
        .post('/api/v1/notifications')
        .send(newNotification)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newNotification.title);
    });
  });

  describe('POST /api/v1/notifications/:id/send', () => {
    it('should send notification', async () => {
      const existingNotification = {
        id: '1',
        userId: 'user-1',
        status: 'pending',
        sentAt: null,
        save: jest.fn().mockResolvedValue(true),
      };

      (Notification.findByPk as jest.Mock).mockResolvedValue(existingNotification);

      const response = await request(app)
        .post('/api/v1/notifications/1/send')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(existingNotification.save).toHaveBeenCalled();
    });
  });
});

