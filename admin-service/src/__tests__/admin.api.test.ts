import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import adminRoutes from '../routes/admin.routes';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/admin', adminRoutes);

describe('Admin API Endpoints', () => {
  describe('GET /api/v1/admin/dashboard', () => {
    it('should return dashboard data', async () => {
      const response = await request(app)
        .get('/api/v1/admin/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('totalOrders');
      expect(response.body.data).toHaveProperty('totalRevenue');
    });
  });

  describe('POST /api/v1/admin/users/:id/suspend', () => {
    it('should suspend user', async () => {
      const response = await request(app)
        .post('/api/v1/admin/users/user-1/suspend')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('suspended');
    });
  });
});

