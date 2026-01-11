import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import shippingRoutes from '../routes/shipping.routes';
import Shipping from '../models/shipping.model';
import { Op } from 'sequelize';

// Mock database
jest.mock('../models/shipping.model');
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
app.use('/api/v1/shipping', shippingRoutes);

describe('Shipping API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/shipping/partner', () => {
    it('should return partner shipping list', async () => {
      const mockShippings = [
        {
          id: '1',
          orderId: 'order-1',
          sellerId: 'seller-1',
          status: 'pending',
        },
        {
          id: '2',
          orderId: 'order-2',
          sellerId: 'seller-1',
          status: 'shipped',
        },
      ];

      (Shipping.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockShippings,
      });

      const response = await request(app)
        .get('/api/v1/shipping/partner?sellerId=seller-1&page=1&limit=20')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('should filter by status', async () => {
      const mockShippings = [
        {
          id: '1',
          orderId: 'order-1',
          sellerId: 'seller-1',
          status: 'pending',
        },
      ];

      (Shipping.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 1,
        rows: mockShippings,
      });

      const response = await request(app)
        .get('/api/v1/shipping/partner?sellerId=seller-1&status=pending')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/shipping/partner/counts', () => {
    it('should return shipping counts by status', async () => {
      const mockShippings = [
        { status: 'pending' },
        { status: 'shipped' },
        { status: 'shipped' },
        { status: 'delivered' },
      ];

      (Shipping.findAll as jest.Mock).mockResolvedValue(mockShippings);

      const response = await request(app)
        .get('/api/v1/shipping/partner/counts?sellerId=seller-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.counts.pending).toBe(1);
      expect(response.body.data.counts.shipped).toBe(2);
      expect(response.body.data.counts.delivered).toBe(1);
    });
  });

  describe('PATCH /api/v1/shipping/partner/:orderId/start', () => {
    it('should start shipping', async () => {
      const mockShipping = {
        id: '1',
        orderId: 'order-1',
        status: 'pending',
        update: jest.fn().mockResolvedValue(true),
      };

      (Shipping.findOne as jest.Mock).mockResolvedValue(mockShipping);

      const response = await request(app)
        .patch('/api/v1/shipping/partner/order-1/start')
        .send({
          trackingNumber: 'TRACK123',
          carrier: 'CJ대한통운',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockShipping.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'shipped',
          trackingNumber: 'TRACK123',
          carrier: 'CJ대한통운',
        })
      );
    });

    it('should return 404 if shipping not found', async () => {
      (Shipping.findOne as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/v1/shipping/partner/order-999/start')
        .send({
          trackingNumber: 'TRACK123',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/shipping/partner/:orderId/tracking', () => {
    it('should update tracking number', async () => {
      const mockShipping = {
        id: '1',
        orderId: 'order-1',
        trackingNumber: 'OLD123',
        update: jest.fn().mockResolvedValue(true),
      };

      (Shipping.findOne as jest.Mock).mockResolvedValue(mockShipping);

      const response = await request(app)
        .patch('/api/v1/shipping/partner/order-1/tracking')
        .send({
          trackingNumber: 'NEW123',
          carrier: '로젠택배',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockShipping.update).toHaveBeenCalledWith({
        trackingNumber: 'NEW123',
        carrier: '로젠택배',
      });
    });
  });
});

