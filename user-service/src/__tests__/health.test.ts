import request from 'supertest';
import express from 'express';

describe('User Service Health Check', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        service: 'user-service',
        timestamp: new Date().toISOString(),
      });
    });
  });

  it('should return 200 and healthy status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('user-service');
  });

  it('should include timestamp', async () => {
    const response = await request(app).get('/health');

    expect(response.body.timestamp).toBeDefined();
  });
});

