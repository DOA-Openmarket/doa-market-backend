import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Mock Guide model completely to prevent init issues
jest.mock('../models/guide.model', () => {
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

import guideRoutes from '../routes/guide.routes';
import Guide from '../models/guide.model';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/admin/guides', guideRoutes);

describe('Guide API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/admin/guides', () => {
    it('should return list of guides', async () => {
      const mockGuides = [
        {
          id: '1',
          title: 'Test Guide 1',
          content: 'Content 1',
          type: 'CUSTOMER',
          isActive: true,
          displayOrder: 1,
        },
        {
          id: '2',
          title: 'Test Guide 2',
          content: 'Content 2',
          type: 'SELLER',
          isActive: true,
          displayOrder: 2,
        },
      ];

      (Guide.findAll as jest.Mock).mockResolvedValue(mockGuides);

      const response = await request(app)
        .get('/api/v1/admin/guides')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter guides by type', async () => {
      const mockGuides = [
        {
          id: '1',
          title: 'Customer Guide',
          type: 'CUSTOMER',
          isActive: true,
        },
      ];

      (Guide.findAll as jest.Mock).mockResolvedValue(mockGuides);

      const response = await request(app)
        .get('/api/v1/admin/guides?type=CUSTOMER')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/admin/guides/:id', () => {
    it('should return guide by id', async () => {
      const mockGuide = {
        id: '1',
        title: 'Test Guide',
        content: 'Test Content',
        type: 'CUSTOMER',
        isActive: true,
      };

      (Guide.findByPk as jest.Mock).mockResolvedValue(mockGuide);

      const response = await request(app)
        .get('/api/v1/admin/guides/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('1');
    });

    it('should return 404 if guide not found', async () => {
      (Guide.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/admin/guides/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admin/guides', () => {
    it('should create a new guide', async () => {
      const newGuide = {
        title: 'New Guide',
        content: 'New Content',
        type: 'CUSTOMER',
      };

      const createdGuide = {
        id: '1',
        ...newGuide,
        isActive: true,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Guide.create as jest.Mock).mockResolvedValue(createdGuide);

      const response = await request(app)
        .post('/api/v1/admin/guides')
        .send(newGuide)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newGuide.title);
      expect(Guide.create).toHaveBeenCalledWith(newGuide);
    });
  });

  describe('PUT /api/v1/admin/guides/:id', () => {
    it('should update a guide', async () => {
      const mockGuide = {
        id: '1',
        title: 'Old Title',
        content: 'Old Content',
        update: jest.fn().mockResolvedValue(true),
      };

      (Guide.findByPk as jest.Mock).mockResolvedValue(mockGuide);

      const updateData = {
        title: 'Updated Title',
        content: 'Updated Content',
      };

      const response = await request(app)
        .put('/api/v1/admin/guides/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockGuide.update).toHaveBeenCalledWith(updateData);
    });

    it('should return 404 if guide not found', async () => {
      (Guide.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/admin/guides/999')
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/admin/guides/:id', () => {
    it('should delete a guide', async () => {
      const mockGuide = {
        id: '1',
        destroy: jest.fn().mockResolvedValue(true),
      };

      (Guide.findByPk as jest.Mock).mockResolvedValue(mockGuide);

      const response = await request(app)
        .delete('/api/v1/admin/guides/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockGuide.destroy).toHaveBeenCalled();
    });

    it('should return 404 if guide not found', async () => {
      (Guide.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/admin/guides/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/admin/guides/:guideId/attachments', () => {
    it('should return guide attachments', async () => {
      const response = await request(app)
        .get('/api/v1/admin/guides/1/attachments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });
});
