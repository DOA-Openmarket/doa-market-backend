import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bannerRoutes from '../routes/banner.routes';
import Banner from '../models/banner.model';

// Mock database
jest.mock('../models/banner.model');
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
app.use('/api/v1/banners', bannerRoutes);

describe('Banner API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/banners', () => {
    it('should return list of active banners', async () => {
      const mockBanners = [
        {
          id: '1',
          title: 'Test Banner 1',
          imageUrl: 'https://example.com/banner1.jpg',
          ownerType: 'ADVERTISER',
          isActive: true,
        },
        {
          id: '2',
          title: 'Test Banner 2',
          imageUrl: 'https://example.com/banner2.jpg',
          ownerType: 'PARTNER',
          isActive: true,
        },
      ];

      (Banner.findAll as jest.Mock).mockResolvedValue(mockBanners);

      const response = await request(app)
        .get('/api/v1/banners')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(Banner.findAll).toHaveBeenCalledWith({
        where: { isActive: true },
        order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']],
      });
    });

    it('should filter by ownerType', async () => {
      const mockBanners = [
        {
          id: '1',
          title: 'Test Banner',
          imageUrl: 'https://example.com/banner.jpg',
          ownerType: 'ADVERTISER',
          isActive: true,
        },
      ];

      (Banner.findAll as jest.Mock).mockResolvedValue(mockBanners);

      const response = await request(app)
        .get('/api/v1/banners?ownerType=ADVERTISER')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Banner.findAll).toHaveBeenCalledWith({
        where: { isActive: true, ownerType: 'ADVERTISER' },
        order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']],
      });
    });
  });

  describe('GET /api/v1/banners/:id', () => {
    it('should return banner by id', async () => {
      const mockBanner = {
        id: '1',
        title: 'Test Banner',
        imageUrl: 'https://example.com/banner.jpg',
        ownerType: 'ADVERTISER',
        isActive: true,
      };

      (Banner.findByPk as jest.Mock).mockResolvedValue(mockBanner);

      const response = await request(app)
        .get('/api/v1/banners/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockBanner);
    });

    it('should return 404 if banner not found', async () => {
      (Banner.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/banners/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('찾을 수 없습니다');
    });
  });

  describe('POST /api/v1/banners', () => {
    it('should create a new banner', async () => {
      const newBanner = {
        title: 'New Banner',
        imageUrl: 'https://example.com/new-banner.jpg',
        ownerType: 'ADVERTISER',
        isActive: true,
      };

      const createdBanner = {
        id: '1',
        ...newBanner,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Banner.create as jest.Mock).mockResolvedValue(createdBanner);

      const response = await request(app)
        .post('/api/v1/banners')
        .send(newBanner)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newBanner.title);
      expect(Banner.create).toHaveBeenCalledWith(newBanner);
    });
  });

  describe('PUT /api/v1/banners/:id', () => {
    it('should update banner', async () => {
      const existingBanner = {
        id: '1',
        title: 'Old Title',
        imageUrl: 'https://example.com/banner.jpg',
        ownerType: 'ADVERTISER',
        isActive: true,
        update: jest.fn().mockResolvedValue(true),
      };

      (Banner.findByPk as jest.Mock).mockResolvedValue(existingBanner);

      const updateData = {
        title: 'Updated Title',
      };

      const response = await request(app)
        .put('/api/v1/banners/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(existingBanner.update).toHaveBeenCalledWith(updateData);
    });

    it('should return 404 if banner not found', async () => {
      (Banner.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/banners/999')
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/banners/:id', () => {
    it('should delete banner', async () => {
      const existingBanner = {
        id: '1',
        title: 'Test Banner',
        destroy: jest.fn().mockResolvedValue(true),
      };

      (Banner.findByPk as jest.Mock).mockResolvedValue(existingBanner);

      const response = await request(app)
        .delete('/api/v1/banners/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(existingBanner.destroy).toHaveBeenCalled();
    });

    it('should return 404 if banner not found', async () => {
      (Banner.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/banners/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

