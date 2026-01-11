import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import searchRoutes from '../routes/search.routes';
import { searchProducts, autocomplete } from '../config/opensearch.config';

// Mock OpenSearch
jest.mock('../config/opensearch.config', () => ({
  searchProducts: jest.fn(),
  autocomplete: jest.fn(),
}));

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/search', searchRoutes);

describe('Search API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/search/products', () => {
    it('should search products', async () => {
      const mockResults = {
        products: [
          { id: '1', name: 'Test Product', price: 10000 },
        ],
        total: 1,
      };

      (searchProducts as jest.Mock).mockResolvedValue(mockResults);

      const response = await request(app)
        .get('/api/v1/search/products?q=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should return 400 for invalid pagination', async () => {
      const response = await request(app)
        .get('/api/v1/search/products?q=test&page=0&size=20')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/search/autocomplete', () => {
    it('should return autocomplete suggestions', async () => {
      const mockSuggestions = ['test product', 'test item'];

      (autocomplete as jest.Mock).mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .get('/api/v1/search/autocomplete?q=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSuggestions);
    });

    it('should return 400 if query parameter is missing', async () => {
      const response = await request(app)
        .get('/api/v1/search/autocomplete')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

