import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import sellerRoutes from '../routes/seller.routes';
import sellerService from '../services/seller.service';

// Mock service
jest.mock('../services/seller.service');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/sellers', sellerRoutes);

describe('Seller API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/sellers', () => {
    it('should return list of sellers', async () => {
      const mockSellers = [
        {
          id: '1',
          userId: 'user-1',
          storeName: 'Test Store 1',
          businessNumber: '123-45-67890',
          status: 'verified',
        },
      ];

      (sellerService.findAll as jest.Mock).mockResolvedValue(mockSellers);

      const response = await request(app)
        .get('/api/v1/sellers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/sellers/:id', () => {
    it('should return seller by id', async () => {
      const mockSeller = {
        id: '1',
        userId: 'user-1',
        storeName: 'Test Store',
        businessNumber: '123-45-67890',
        status: 'verified',
      };

      (sellerService.findById as jest.Mock).mockResolvedValue(mockSeller);

      const response = await request(app)
        .get('/api/v1/sellers/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSeller);
    });
  });

  describe('POST /api/v1/sellers', () => {
    it('should create a new seller', async () => {
      const newSeller = {
        userId: 'user-1',
        storeName: 'New Store',
        businessNumber: '123-45-67890',
        status: 'pending',
      };

      const createdSeller = {
        id: '1',
        ...newSeller,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (sellerService.create as jest.Mock).mockResolvedValue(createdSeller);

      const response = await request(app)
        .post('/api/v1/sellers')
        .send(newSeller)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.storeName).toBe(newSeller.storeName);
    });
  });

  describe('PATCH /api/v1/sellers/:id/verify', () => {
    it('should verify seller', async () => {
      const verifiedSeller = {
        id: '1',
        status: 'verified',
      };

      (sellerService.verify as jest.Mock).mockResolvedValue(verifiedSeller);

      const response = await request(app)
        .patch('/api/v1/sellers/1/verify')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(sellerService.verify).toHaveBeenCalledWith('1');
    });
  });
});

