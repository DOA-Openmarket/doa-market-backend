import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import inventoryRoutes from '../routes/inventory.routes';
import Inventory from '../models/inventory.model';

// Mock database
jest.mock('../models/inventory.model');
jest.mock('../config/database', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
  },
}));

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1/inventory', inventoryRoutes);

describe('Inventory API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/inventory/:productId', () => {
    it('should return inventory by productId', async () => {
      const mockInventory = {
        id: '1',
        productId: 'product-1',
        totalQuantity: 100,
        reservedQuantity: 10,
        availableQuantity: 90,
      };

      (Inventory.findOne as jest.Mock).mockResolvedValue(mockInventory);

      const response = await request(app)
        .get('/api/v1/inventory/product-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.productId).toBe('product-1');
    });
  });

  describe('POST /api/v1/inventory/reserve', () => {
    it('should reserve inventory', async () => {
      const mockInventory = {
        id: '1',
        productId: 'product-1',
        totalQuantity: 100,
        reservedQuantity: 0,
        availableQuantity: 100,
        save: jest.fn().mockResolvedValue(true),
      };

      (Inventory.findOne as jest.Mock).mockResolvedValue(mockInventory);

      const response = await request(app)
        .post('/api/v1/inventory/reserve')
        .send({
          productId: 'product-1',
          quantity: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockInventory.save).toHaveBeenCalled();
    });

    it('should return 400 if insufficient inventory', async () => {
      const mockInventory = {
        id: '1',
        productId: 'product-1',
        totalQuantity: 100,
        reservedQuantity: 0,
        availableQuantity: 5,
        save: jest.fn().mockResolvedValue(true),
      };

      (Inventory.findOne as jest.Mock).mockResolvedValue(mockInventory);

      const response = await request(app)
        .post('/api/v1/inventory/reserve')
        .send({
          productId: 'product-1',
          quantity: 10,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient');
    });
  });
});

