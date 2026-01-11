import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Mock Review model completely to prevent init issues
jest.mock('../models/review.model', () => {
  const mockModel = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
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

import reviewRoutes from '../routes/review.routes';
import Review from '../models/review.model';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/reviews', reviewRoutes);

describe('Review API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/reviews', () => {
    it('should return list of reviews', async () => {
      const mockReviews = [
        {
          id: '1',
          productId: 'product-1',
          userId: 'user-1',
          rating: 5,
          content: 'Great product!',
        },
      ];

      (Review.findAll as jest.Mock).mockResolvedValue(mockReviews);

      const response = await request(app)
        .get('/api/v1/reviews')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/reviews/:id', () => {
    it('should return review by id', async () => {
      const mockReview = {
        id: '1',
        productId: 'product-1',
        userId: 'user-1',
        rating: 5,
        content: 'Great product!',
      };

      (Review.findByPk as jest.Mock).mockResolvedValue(mockReview);

      const response = await request(app)
        .get('/api/v1/reviews/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('1');
    });

    it('should return 404 if review not found', async () => {
      (Review.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/reviews/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/reviews', () => {
    it('should create a new review', async () => {
      const newReview = {
        productId: 'product-1',
        userId: 'user-1',
        rating: 5,
        content: 'Great product!',
      };

      const createdReview = {
        id: '1',
        ...newReview,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Review.create as jest.Mock).mockResolvedValue(createdReview);

      const response = await request(app)
        .post('/api/v1/reviews')
        .send(newReview)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(newReview.rating);
      expect(Review.create).toHaveBeenCalledWith(newReview);
    });
  });

  describe('PUT /api/v1/reviews/:id', () => {
    it('should update a review', async () => {
      const mockReview = {
        id: '1',
        productId: 'product-1',
        userId: 'user-1',
        rating: 5,
        content: 'Great product!',
        update: jest.fn().mockResolvedValue(true),
      };

      (Review.findByPk as jest.Mock).mockResolvedValue(mockReview);

      const updateData = {
        rating: 4,
        content: 'Updated review',
      };

      const response = await request(app)
        .put('/api/v1/reviews/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockReview.update).toHaveBeenCalledWith(updateData);
    });

    it('should return 404 if review not found', async () => {
      (Review.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/reviews/999')
        .send({ rating: 4 })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/reviews/:id', () => {
    it('should delete a review', async () => {
      const mockReview = {
        id: '1',
        destroy: jest.fn().mockResolvedValue(true),
      };

      (Review.findByPk as jest.Mock).mockResolvedValue(mockReview);

      const response = await request(app)
        .delete('/api/v1/reviews/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockReview.destroy).toHaveBeenCalled();
    });

    it('should return 404 if review not found', async () => {
      (Review.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/reviews/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/reviews/products/:productId', () => {
    it('should return reviews for a product', async () => {
      const mockReviews = [
        {
          id: '1',
          productId: 'product-1',
          userId: 'user-1',
          rating: 5,
          content: 'Great product!',
        },
      ];

      (Review.findAll as jest.Mock).mockResolvedValue(mockReviews);

      const response = await request(app)
        .get('/api/v1/reviews/products/product-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/reviews/seller/:sellerId', () => {
    it('should return reviews by seller', async () => {
      const mockReviews = [
        {
          id: '1',
          sellerId: 'seller-123',
          productId: 'product-1',
          rating: 5,
          content: 'Great seller!',
        },
      ];

      (Review.findAll as jest.Mock).mockResolvedValue(mockReviews);

      const response = await request(app)
        .get('/api/v1/reviews/seller/seller-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/reviews/:reviewId/attachments', () => {
    it('should return review attachments', async () => {
      const response = await request(app)
        .get('/api/v1/reviews/1/attachments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });
});

