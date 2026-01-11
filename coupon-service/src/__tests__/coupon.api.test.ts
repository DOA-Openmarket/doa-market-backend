import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Mock Coupon model completely to prevent init issues
jest.mock('../models/coupon.model', () => {
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

import couponRoutes from '../routes/coupon.routes';
import Coupon from '../models/coupon.model';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/coupons', couponRoutes);

describe('Coupon API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/coupons', () => {
    it('should return list of coupons', async () => {
      const mockCoupons = [
        {
          id: '1',
          code: 'COUPON1',
          name: 'Test Coupon 1',
          discountType: 'percentage',
          discountValue: 10,
          status: 'active',
        },
        {
          id: '2',
          code: 'COUPON2',
          name: 'Test Coupon 2',
          discountType: 'fixed',
          discountValue: 5000,
          status: 'active',
        },
      ];

      (Coupon.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockCoupons,
      });

      const response = await request(app)
        .get('/api/v1/coupons')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });
  });

  describe('GET /api/v1/coupons/:id', () => {
    it('should return coupon by id', async () => {
      const mockCoupon = {
        id: '1',
        code: 'COUPON1',
        name: 'Test Coupon',
        discountType: 'percentage',
        discountValue: 10,
        status: 'active',
      };

      (Coupon.findByPk as jest.Mock).mockResolvedValue(mockCoupon);

      const response = await request(app)
        .get('/api/v1/coupons/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('1');
    });

    it('should return 404 if coupon not found', async () => {
      (Coupon.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/coupons/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/coupons', () => {
    it('should create a new coupon', async () => {
      const newCoupon = {
        code: 'NEWCOUPON',
        name: 'New Coupon',
        discountType: 'percentage',
        discountValue: 15,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active',
      };

      const createdCoupon = {
        id: '1',
        ...newCoupon,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Coupon.create as jest.Mock).mockResolvedValue(createdCoupon);

      const response = await request(app)
        .post('/api/v1/coupons')
        .send(newCoupon)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe(newCoupon.code);
      expect(Coupon.create).toHaveBeenCalled();
    });
  });

  describe('PUT /api/v1/coupons/:id', () => {
    it('should update a coupon', async () => {
      const mockCoupon = {
        id: '1',
        code: 'COUPON1',
        name: 'Test Coupon',
        update: jest.fn().mockResolvedValue(true),
      };

      (Coupon.findByPk as jest.Mock).mockResolvedValue(mockCoupon);

      const updateData = {
        name: 'Updated Coupon',
        discountValue: 20,
      };

      const response = await request(app)
        .put('/api/v1/coupons/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockCoupon.update).toHaveBeenCalledWith(updateData);
    });
  });

  describe('DELETE /api/v1/coupons/:id', () => {
    it('should delete a coupon', async () => {
      const mockCoupon = {
        id: '1',
        code: 'COUPON1',
        destroy: jest.fn().mockResolvedValue(true),
      };

      (Coupon.findByPk as jest.Mock).mockResolvedValue(mockCoupon);

      const response = await request(app)
        .delete('/api/v1/coupons/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockCoupon.destroy).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/coupons/seller/:sellerId', () => {
    it('should return coupons by seller', async () => {
      const mockCoupons = [
        {
          id: '1',
          code: 'SELLER-COUPON1',
          issuedBy: 'seller-123',
        },
      ];

      (Coupon.findAll as jest.Mock).mockResolvedValue(mockCoupons);

      const response = await request(app)
        .get('/api/v1/coupons/seller/seller-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/coupons/:code/issue', () => {
    it('should issue a coupon', async () => {
      const mockCoupon = {
        id: '1',
        code: 'COUPON1',
        name: 'Test Coupon',
        discountType: 'percentage',
        discountValue: 10,
        status: 'active',
      };

      (Coupon.findOne as jest.Mock).mockResolvedValue(mockCoupon);

      const response = await request(app)
        .post('/api/v1/coupons/COUPON1/issue')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCoupon);
      expect(response.body.message).toBe('Coupon issued');
    });

    it('should return 404 if coupon not found', async () => {
      (Coupon.findOne as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/coupons/INVALID/issue')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

