import request from 'supertest';
import app from '../src/server';

describe('API Gateway Endpoints', () => {
  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.service).toBe('api-gateway');
      expect(response.body.data.status).toBe('healthy');
    });
  });

  describe('GET /', () => {
    it('should return gateway info', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.service).toBe('DOA Market API Gateway');
      expect(response.body.status).toBe('running');
    });
  });
});

