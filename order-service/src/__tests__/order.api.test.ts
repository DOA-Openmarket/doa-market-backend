import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Mock uuid first
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// Mock Order model completely to prevent init issues
jest.mock('../models/order.model', () => {
  const mockModel = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findAndCountAll: jest.fn(),
  };
  return { default: mockModel, __esModule: true };
});

// Mock database config
jest.mock('../config/database', () => ({
  sequelize: {
    define: jest.fn(),
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
  },
}));

// Mock event bus
jest.mock('../index', () => ({
  eventBus: {
    publish: jest.fn().mockResolvedValue(true),
  },
}));

import orderRoutes from '../routes/order.routes';
import Order from '../models/order.model';
import { eventBus } from '../index';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/orders', orderRoutes);

describe('Order API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/orders', () => {
    it('should return list of orders', async () => {
      const mockOrders = [
        {
          id: '1',
          userId: 'user-1',
          totalAmount: 50000,
          status: 'pending',
        },
      ];

      (Order.findAll as jest.Mock).mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/v1/orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/orders', () => {
    it('should create a new order', async () => {
      const newOrder = {
        userId: 'user-1',
        items: [{ productId: 'prod-1', quantity: 2, sellerId: 'seller-1' }],
        totalAmount: 50000,
        shippingAddress: {
          name: 'Test User',
          phone: '010-1234-5678',
          address: 'Test Address',
        },
      };

      const createdOrder = {
        id: 'order-1',
        userId: newOrder.userId,
        totalAmount: newOrder.totalAmount,
        orderNumber: 'ORD-1234567890',
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Order.create as jest.Mock).mockResolvedValue(createdOrder);

      const response = await request(app)
        .post('/api/v1/orders')
        .send(newOrder)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(eventBus.publish).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should return order by id', async () => {
      const mockOrder = {
        id: '1',
        userId: 'user-1',
        totalAmount: 50000,
        status: 'pending',
      };

      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const response = await request(app)
        .get('/api/v1/orders/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockOrder);
    });
  });

  describe('PATCH /api/v1/orders/:id/status', () => {
    it('should update order status', async () => {
      const existingOrder = {
        id: '1',
        userId: 'user-1',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };

      (Order.findByPk as jest.Mock).mockResolvedValue(existingOrder);

      const response = await request(app)
        .patch('/api/v1/orders/1/status')
        .send({ status: 'confirmed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(existingOrder.save).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/orders/:orderId/cancel', () => {
    it('should cancel order', async () => {
      const existingOrder = {
        id: '1',
        userId: 'user-1',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };

      (Order.findByPk as jest.Mock).mockResolvedValue(existingOrder);

      const response = await request(app)
        .post('/api/v1/orders/1/cancel')
        .send({ userId: 'user-1', reason: 'User request' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(existingOrder.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });
  });
});

