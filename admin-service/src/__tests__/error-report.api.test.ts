import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Mock ErrorReport model completely to prevent init issues
jest.mock('../models/error-report.model', () => {
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

import errorReportRoutes from '../routes/error-report.routes';
import ErrorReport from '../models/error-report.model';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/admin/errorReport', errorReportRoutes);

describe('Error Report API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/admin/errorReport', () => {
    it('should return list of error reports', async () => {
      const mockReports = [
        {
          id: '1',
          reporterId: 'user-1',
          reporterType: 'USER',
          category: 'BUG',
          type: 'PRODUCT',
          title: 'Test Error',
          content: 'Error content',
          status: 'PENDING',
        },
        {
          id: '2',
          reporterId: 'seller-1',
          reporterType: 'SELLER',
          category: 'FEATURE',
          type: 'SYSTEM',
          title: 'Test Feature Request',
          content: 'Feature content',
          status: 'PENDING',
        },
      ];

      (ErrorReport.findAll as jest.Mock).mockResolvedValue(mockReports);

      const response = await request(app)
        .get('/api/v1/admin/errorReport')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter error reports by status', async () => {
      const mockReports = [
        {
          id: '1',
          status: 'RESOLVED',
          title: 'Resolved Error',
        },
      ];

      (ErrorReport.findAll as jest.Mock).mockResolvedValue(mockReports);

      const response = await request(app)
        .get('/api/v1/admin/errorReport?status=RESOLVED')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/admin/errorReport/:id', () => {
    it('should return error report by id', async () => {
      const mockReport = {
        id: '1',
        reporterId: 'user-1',
        reporterType: 'USER',
        category: 'BUG',
        title: 'Test Error',
        status: 'PENDING',
      };

      (ErrorReport.findByPk as jest.Mock).mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/v1/admin/errorReport/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('1');
    });

    it('should return 404 if error report not found', async () => {
      (ErrorReport.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/admin/errorReport/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admin/errorReport', () => {
    it('should create a new error report', async () => {
      const newReport = {
        reporterId: 'user-1',
        reporterType: 'USER',
        category: 'BUG',
        type: 'PRODUCT',
        title: 'New Error',
        content: 'Error description',
      };

      const createdReport = {
        id: '1',
        ...newReport,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (ErrorReport.create as jest.Mock).mockResolvedValue(createdReport);

      const response = await request(app)
        .post('/api/v1/admin/errorReport')
        .send(newReport)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newReport.title);
      expect(ErrorReport.create).toHaveBeenCalledWith(newReport);
    });
  });

  describe('PUT /api/v1/admin/errorReport/:id', () => {
    it('should update an error report', async () => {
      const mockReport = {
        id: '1',
        title: 'Old Title',
        status: 'PENDING',
        update: jest.fn().mockResolvedValue(true),
      };

      (ErrorReport.findByPk as jest.Mock).mockResolvedValue(mockReport);

      const updateData = {
        title: 'Updated Title',
        status: 'IN_PROGRESS',
      };

      const response = await request(app)
        .put('/api/v1/admin/errorReport/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockReport.update).toHaveBeenCalledWith(updateData);
    });

    it('should return 404 if error report not found', async () => {
      (ErrorReport.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/admin/errorReport/999')
        .send({ status: 'RESOLVED' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/admin/errorReport/:id', () => {
    it('should delete an error report', async () => {
      const mockReport = {
        id: '1',
        destroy: jest.fn().mockResolvedValue(true),
      };

      (ErrorReport.findByPk as jest.Mock).mockResolvedValue(mockReport);

      const response = await request(app)
        .delete('/api/v1/admin/errorReport/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockReport.destroy).toHaveBeenCalled();
    });

    it('should return 404 if error report not found', async () => {
      (ErrorReport.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/admin/errorReport/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/admin/errorReport/status/:status', () => {
    it('should return error reports by status', async () => {
      const mockReports = [
        {
          id: '1',
          status: 'RESOLVED',
          title: 'Resolved Error 1',
        },
        {
          id: '2',
          status: 'RESOLVED',
          title: 'Resolved Error 2',
        },
      ];

      (ErrorReport.findAll as jest.Mock).mockResolvedValue(mockReports);

      const response = await request(app)
        .get('/api/v1/admin/errorReport/status/RESOLVED')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/v1/admin/errorReport/category/:category', () => {
    it('should return error reports by category', async () => {
      const mockReports = [
        {
          id: '1',
          category: 'BUG',
          title: 'Bug Report 1',
        },
      ];

      (ErrorReport.findAll as jest.Mock).mockResolvedValue(mockReports);

      const response = await request(app)
        .get('/api/v1/admin/errorReport/category/BUG')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/admin/errorReport/type/:type', () => {
    it('should return error reports by type', async () => {
      const mockReports = [
        {
          id: '1',
          type: 'PRODUCT',
          title: 'Product Error 1',
        },
      ];

      (ErrorReport.findAll as jest.Mock).mockResolvedValue(mockReports);

      const response = await request(app)
        .get('/api/v1/admin/errorReport/type/PRODUCT')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/admin/errorReport/seller/:sellerId/:type', () => {
    it('should return error reports by seller and type', async () => {
      const mockReports = [
        {
          id: '1',
          reporterId: 'seller-123',
          reporterType: 'SELLER',
          type: 'PRODUCT',
          title: 'Seller Product Error',
        },
      ];

      (ErrorReport.findAll as jest.Mock).mockResolvedValue(mockReports);

      const response = await request(app)
        .get('/api/v1/admin/errorReport/seller/seller-123/PRODUCT')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/admin/errorReport/:id/answer', () => {
    it('should add answer to error report', async () => {
      const mockReport = {
        id: '1',
        title: 'Test Error',
        status: 'PENDING',
        update: jest.fn().mockResolvedValue(true),
      };

      (ErrorReport.findByPk as jest.Mock).mockResolvedValue(mockReport);

      const answerData = {
        answer: 'This has been fixed',
        answeredBy: 'admin-1',
      };

      const response = await request(app)
        .post('/api/v1/admin/errorReport/1/answer')
        .send(answerData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          answer: answerData.answer,
          answeredBy: answerData.answeredBy,
          status: 'RESOLVED',
        })
      );
    });

    it('should return 404 if error report not found', async () => {
      (ErrorReport.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/admin/errorReport/999/answer')
        .send({ answer: 'Test answer' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/admin/errorReport/:id/attachments', () => {
    it('should return error report attachments', async () => {
      const response = await request(app)
        .get('/api/v1/admin/errorReport/1/attachments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });
});
