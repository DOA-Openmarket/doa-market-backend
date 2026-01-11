import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import settlementRoutes from '../routes/settlement.routes';
import Settlement from '../models/settlement.model';
import { Op } from 'sequelize';

// Mock database
jest.mock('../models/settlement.model');
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
app.use('/api/v1/settlements', settlementRoutes);

describe('Settlement API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/settlements', () => {
    it('should return settlement list with pagination', async () => {
      const mockSettlements = [
        {
          id: '1',
          sellerId: 'seller-1',
          totalAmount: 100000,
          feeAmount: 5000,
          netAmount: 95000,
          status: 'pending',
        },
      ];

      (Settlement.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 1,
        rows: mockSettlements,
      });

      const response = await request(app)
        .get('/api/v1/settlements?page=1&limit=20')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.total).toBe(1);
      expect(response.body.page).toBe(1);
    });

    it('should filter by status', async () => {
      const mockSettlements = [
        {
          id: '1',
          sellerId: 'seller-1',
          status: 'paid',
        },
      ];

      (Settlement.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 1,
        rows: mockSettlements,
      });

      const response = await request(app)
        .get('/api/v1/settlements?status=paid')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Settlement.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'paid' },
        })
      );
    });
  });

  describe('GET /api/v1/settlements/:id', () => {
    it('should return settlement by id', async () => {
      const mockSettlement = {
        id: '1',
        sellerId: 'seller-1',
        totalAmount: 100000,
        feeAmount: 5000,
        netAmount: 95000,
        status: 'pending',
      };

      (Settlement.findByPk as jest.Mock).mockResolvedValue(mockSettlement);

      const response = await request(app)
        .get('/api/v1/settlements/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSettlement);
    });

    it('should return 404 if settlement not found', async () => {
      (Settlement.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/settlements/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/settlements/stats', () => {
    it('should return settlement statistics', async () => {
      const mockSettlements = [
        { totalAmount: 100000, feeAmount: 5000, netAmount: 95000, status: 'pending' },
        { totalAmount: 200000, feeAmount: 10000, netAmount: 190000, status: 'paid' },
      ];

      (Settlement.findAll as jest.Mock).mockResolvedValue(mockSettlements);

      const response = await request(app)
        .get('/api/v1/settlements/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSettlements).toBe(2);
      expect(response.body.data.totalAmount).toBe(300000);
    });
  });

  describe('POST /api/v1/settlements/process', () => {
    it('should process settlements', async () => {
      const mockSettlements = [
        {
          id: '1',
          totalAmount: 100000,
          feeAmount: 0,
          netAmount: 0,
          status: 'pending',
          update: jest.fn().mockResolvedValue(true),
        },
        {
          id: '2',
          totalAmount: 200000,
          feeAmount: 0,
          netAmount: 0,
          status: 'pending',
          update: jest.fn().mockResolvedValue(true),
        },
      ];

      (Settlement.findAll as jest.Mock).mockResolvedValue(mockSettlements);

      const response = await request(app)
        .post('/api/v1/settlements/process')
        .send({
          settlementIds: ['1', '2'],
          commissionRate: 5,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockSettlements[0].update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'calculated',
        })
      );
    });
  });

  describe('GET /api/v1/settlements/partner/:sellerId', () => {
    it('should return partner settlements', async () => {
      const mockSettlements = [
        {
          id: '1',
          sellerId: 'seller-1',
          status: 'pending',
        },
      ];

      (Settlement.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 1,
        rows: mockSettlements,
      });

      const response = await request(app)
        .get('/api/v1/settlements/partner/seller-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });
});

