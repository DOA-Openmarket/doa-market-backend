import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import statsRoutes from '../routes/stats.routes';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/stats', statsRoutes);

describe('Stats API Endpoints', () => {
  describe('GET /api/v1/stats/sales', () => {
    it('should return sales data', async () => {
      const response = await request(app)
        .get('/api/v1/stats/sales?type=overview&startDate=2024-01-01&endDate=2024-12-31')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('type');
      expect(response.body.data).toHaveProperty('overview');
    });
  });

  describe('GET /api/v1/stats/sales/stats', () => {
    it('should return sales statistics', async () => {
      const response = await request(app)
        .get('/api/v1/stats/sales/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('totalOrders');
    });
  });

  describe('GET /api/v1/stats/products/views', () => {
    it('should return product views', async () => {
      const response = await request(app)
        .get('/api/v1/stats/products/views')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

