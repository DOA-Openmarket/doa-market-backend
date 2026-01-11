import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Mock Payment model completely to prevent init issues
jest.mock('../models/payment.model', () => {
  const mockModel = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
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

import paymentRoutes from '../routes/payment.routes';
import Payment from '../models/payment.model';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/payments', paymentRoutes);

describe('Payment API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/payments', () => {
    it('should return list of payments', async () => {
      const mockPayments = [
        {
          id: '1',
          orderId: 'order-1',
          userId: 'user-1',
          amount: 50000,
          status: 'completed',
        },
      ];

      (Payment.findAll as jest.Mock).mockResolvedValue(mockPayments);

      const response = await request(app)
        .get('/api/v1/payments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/payments', () => {
    it('should create a new payment', async () => {
      const newPayment = {
        orderId: 'order-1',
        userId: 'user-1',
        amount: 50000,
        method: 'card',
      };

      const createdPayment = {
        id: '1',
        ...newPayment,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Payment.create as jest.Mock).mockResolvedValue(createdPayment);

      const response = await request(app)
        .post('/api/v1/payments')
        .send(newPayment)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(newPayment.amount);
    });
  });

  describe('POST /api/v1/payments/prepare', () => {
    it('should prepare payment', async () => {
      const paymentData = {
        orderId: 'order-1',
        userId: 'user-1',
        amount: 50000,
        productName: 'Test Product',
        method: 'card',
      };

      const createdPayment = {
        id: 'payment-1',
        ...paymentData,
        status: 'pending',
      };

      (Payment.create as jest.Mock).mockResolvedValue(createdPayment);

      const response = await request(app)
        .post('/api/v1/payments/prepare')
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentId');
      expect(response.body.data).toHaveProperty('paymentUrl');
    });

    it('should return 400 if required parameters are missing', async () => {
      const response = await request(app)
        .post('/api/v1/payments/prepare')
        .send({ orderId: 'order-1' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/payments/:id', () => {
    it('should return payment by id', async () => {
      const mockPayment = {
        id: '1',
        orderId: 'order-1',
        amount: 50000,
        status: 'completed',
      };

      (Payment.findByPk as jest.Mock).mockResolvedValue(mockPayment);

      const response = await request(app)
        .get('/api/v1/payments/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPayment);
    });

    it('should return 404 if payment not found', async () => {
      (Payment.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/payments/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/payments/:id/complete', () => {
    it('should complete payment', async () => {
      const existingPayment = {
        id: '1',
        orderId: 'order-1',
        status: 'pending',
        update: jest.fn().mockResolvedValue(true),
      };

      (Payment.findByPk as jest.Mock).mockResolvedValue(existingPayment);

      const response = await request(app)
        .post('/api/v1/payments/1/complete')
        .send({
          pgTransactionId: 'txn-123',
          status: 'completed',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(existingPayment.update).toHaveBeenCalled();
    });
  });
});

