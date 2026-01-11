import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fileRoutes from '../routes/file.routes';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/attachments', fileRoutes);

describe('File API Endpoints', () => {
  describe('POST /api/v1/attachments/upload/:type/:id', () => {
    it('should upload files', async () => {
      const response = await request(app)
        .post('/api/v1/attachments/upload/product/product-1')
        .attach('files', Buffer.from('test file content'), 'test.txt')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toBeDefined();
      expect(response.body.data.files.length).toBeGreaterThan(0);
      expect(response.body.data.files[0]).toHaveProperty('url');
      expect(response.body.data.files[0]).toHaveProperty('name');
    });

    it('should return 400 if no files uploaded', async () => {
      const response = await request(app)
        .post('/api/v1/attachments/upload/product/product-1')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('파일이 업로드되지 않았습니다');
    });
  });

  describe('POST /api/v1/attachments/delete/:type', () => {
    it('should delete files', async () => {
      const response = await request(app)
        .post('/api/v1/attachments/delete/product')
        .send({
          ids: ['file-1', 'file-2'],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('삭제되었습니다');
    });

    it('should return 400 if no ids provided', async () => {
      const response = await request(app)
        .post('/api/v1/attachments/delete/product')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('파일 ID가 필요합니다');
    });
  });

  describe('GET /api/v1/attachments/download-url/:key', () => {
    it('should return download URL', async () => {
      const response = await request(app)
        .get('/api/v1/attachments/download-url/file-key-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('url');
      expect(response.body.data).toHaveProperty('expiresAt');
      expect(response.body.data.url).toContain('file-key-123');
    });
  });
});

