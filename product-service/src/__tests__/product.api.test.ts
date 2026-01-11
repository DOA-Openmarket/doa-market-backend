import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Mock Product model completely to prevent init issues
jest.mock('../models/product.model', () => {
  const mockModel = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findAndCountAll: jest.fn(),
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

// Mock event bus
jest.mock('../index', () => ({
  eventBus: {
    publish: jest.fn().mockResolvedValue(true),
  },
}));

import productRoutes from '../routes/product.routes';
import Product from '../models/product.model';
import { eventBus } from '../index';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/products', productRoutes);

describe('Product API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/products', () => {
    it('should return list of products', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Test Product 1',
          price: 10000,
          description: 'Test Description 1',
          status: 'active',
        },
        {
          id: '2',
          name: 'Test Product 2',
          price: 20000,
          description: 'Test Description 2',
          status: 'active',
        },
      ];

      (Product.findAll as jest.Mock).mockResolvedValue(mockProducts);

      const response = await request(app)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should return product by id', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        price: 10000,
        description: 'Test Description',
        status: 'active',
      };

      (Product.findByPk as jest.Mock).mockResolvedValue(mockProduct);

      const response = await request(app)
        .get('/api/v1/products/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProduct);
    });

    it('should return 404 if product not found', async () => {
      (Product.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/products/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /api/v1/products', () => {
    it('should create a new product', async () => {
      const newProduct = {
        name: 'New Product',
        price: 15000,
        description: 'New Description',
        categoryId: 'cat-1',
        sellerId: 'seller-1',
        stockQuantity: 100,
        status: 'active',
      };

      const createdProduct = {
        id: '1',
        ...newProduct,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Product.create as jest.Mock).mockResolvedValue(createdProduct);

      const response = await request(app)
        .post('/api/v1/products')
        .send(newProduct)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newProduct.name);
      expect(eventBus.publish).toHaveBeenCalled();
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    it('should update product', async () => {
      const existingProduct = {
        id: '1',
        name: 'Old Name',
        price: 10000,
        update: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: '1',
          name: 'Old Name',
          price: 10000,
        }),
      };

      (Product.findByPk as jest.Mock).mockResolvedValue(existingProduct);

      const updateData = {
        name: 'Updated Name',
        price: 15000,
      };

      const response = await request(app)
        .put('/api/v1/products/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(existingProduct.update).toHaveBeenCalledWith(updateData);
    });

    it('should return 404 if product not found', async () => {
      (Product.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/products/999')
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('should delete product', async () => {
      const existingProduct = {
        id: '1',
        name: 'Test Product',
        destroy: jest.fn().mockResolvedValue(true),
      };

      (Product.findByPk as jest.Mock).mockResolvedValue(existingProduct);

      const response = await request(app)
        .delete('/api/v1/products/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(existingProduct.destroy).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should return 404 if product not found', async () => {
      (Product.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/products/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

