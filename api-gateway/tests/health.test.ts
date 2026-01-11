import request from 'supertest';
import express from 'express';

describe('Health Check', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.get('/api/v1/health', (req, res) => {
      res.json({
        success: true,
        data: {
          service: 'api-gateway',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        },
      });
    });
  });

  it('should return 200 and healthy status', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.service).toBe('api-gateway');
    expect(response.body.data.status).toBe('healthy');
  });

  it('should include timestamp and uptime', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.body.data.timestamp).toBeDefined();
    expect(response.body.data.uptime).toBeGreaterThanOrEqual(0);
  });
});
