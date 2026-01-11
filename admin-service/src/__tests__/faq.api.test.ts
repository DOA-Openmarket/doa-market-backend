import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Mock FAQ model completely to prevent init issues
jest.mock('../models/faq.model', () => {
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

import faqRoutes from '../routes/faq.routes';
import Faq from '../models/faq.model';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/admin/faq', faqRoutes);

describe('FAQ API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/admin/faq', () => {
    it('should return list of FAQs', async () => {
      const mockFaqs = [
        {
          id: '1',
          title: 'Test FAQ 1',
          content: 'Content 1',
          type: 'CUSTOMER',
          isActive: true,
          displayOrder: 1,
        },
        {
          id: '2',
          title: 'Test FAQ 2',
          content: 'Content 2',
          type: 'SELLER',
          isActive: true,
          displayOrder: 2,
        },
      ];

      (Faq.findAll as jest.Mock).mockResolvedValue(mockFaqs);

      const response = await request(app)
        .get('/api/v1/admin/faq')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter FAQs by type', async () => {
      const mockFaqs = [
        {
          id: '1',
          title: 'Customer FAQ',
          type: 'CUSTOMER',
          isActive: true,
        },
      ];

      (Faq.findAll as jest.Mock).mockResolvedValue(mockFaqs);

      const response = await request(app)
        .get('/api/v1/admin/faq?type=CUSTOMER')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/admin/faq/:id', () => {
    it('should return FAQ by id', async () => {
      const mockFaq = {
        id: '1',
        title: 'Test FAQ',
        content: 'Test Content',
        type: 'CUSTOMER',
        isActive: true,
      };

      (Faq.findByPk as jest.Mock).mockResolvedValue(mockFaq);

      const response = await request(app)
        .get('/api/v1/admin/faq/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('1');
    });

    it('should return 404 if FAQ not found', async () => {
      (Faq.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/admin/faq/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admin/faq', () => {
    it('should create a new FAQ', async () => {
      const newFaq = {
        title: 'New FAQ',
        content: 'New Content',
        type: 'CUSTOMER',
      };

      const createdFaq = {
        id: '1',
        ...newFaq,
        isActive: true,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Faq.create as jest.Mock).mockResolvedValue(createdFaq);

      const response = await request(app)
        .post('/api/v1/admin/faq')
        .send(newFaq)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newFaq.title);
      expect(Faq.create).toHaveBeenCalledWith(newFaq);
    });
  });

  describe('PUT /api/v1/admin/faq/:id', () => {
    it('should update a FAQ', async () => {
      const mockFaq = {
        id: '1',
        title: 'Old Title',
        content: 'Old Content',
        update: jest.fn().mockResolvedValue(true),
      };

      (Faq.findByPk as jest.Mock).mockResolvedValue(mockFaq);

      const updateData = {
        title: 'Updated Title',
        content: 'Updated Content',
      };

      const response = await request(app)
        .put('/api/v1/admin/faq/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockFaq.update).toHaveBeenCalledWith(updateData);
    });

    it('should return 404 if FAQ not found', async () => {
      (Faq.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/admin/faq/999')
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/admin/faq/:id', () => {
    it('should delete a FAQ', async () => {
      const mockFaq = {
        id: '1',
        destroy: jest.fn().mockResolvedValue(true),
      };

      (Faq.findByPk as jest.Mock).mockResolvedValue(mockFaq);

      const response = await request(app)
        .delete('/api/v1/admin/faq/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockFaq.destroy).toHaveBeenCalled();
    });

    it('should return 404 if FAQ not found', async () => {
      (Faq.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/admin/faq/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
