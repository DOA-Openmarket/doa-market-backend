import { Router } from 'express';
import Product from '../models/product.model';
import { eventBus } from '../index';
import { EventType } from '../events/types';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json({ success: true, data: products });
  } catch (error) {
    logger.error('Failed to fetch products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    logger.error('Failed to fetch product:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
});

router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);

    // Publish product created event
    await eventBus.publish(EventType.PRODUCT_CREATED, {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: parseFloat(product.price.toString()),
      categoryId: product.categoryId,
      sellerId: product.sellerId,
      stock: product.stockQuantity || 0,
      imageUrl: product.thumbnail || '',
      status: product.status || 'active',
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    });

    logger.info(`Product created and event published: ${product.id}`);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    logger.error('Failed to create product:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const oldData = product.toJSON();
    await product.update(req.body);

    // Publish product updated event
    const updates: any = {};
    Object.keys(req.body).forEach(key => {
      if (oldData[key] !== product[key]) {
        updates[key] = product[key];
      }
    });

    if (Object.keys(updates).length > 0) {
      await eventBus.publish(EventType.PRODUCT_UPDATED, {
        id: product.id,
        updates: {
          ...updates,
          price: updates.price ? parseFloat(updates.price.toString()) : undefined,
          updatedAt: product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString(),
        },
      });

      logger.info(`Product updated and event published: ${product.id}`);
    }

    res.json({ success: true, data: product });
  } catch (error) {
    logger.error('Failed to update product:', error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await product.destroy();

    // Publish product deleted event
    await eventBus.publish(EventType.PRODUCT_DELETED, {
      id: product.id,
    });

    logger.info(`Product deleted and event published: ${product.id}`);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    logger.error('Failed to delete product:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

/**
 * Get product reviews
 * This endpoint proxies to user-service to get reviews for a specific product
 */
router.get('/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;
    const page = req.query.page || '1';
    const limit = req.query.limit || '20';

    // Make request to user-service to get reviews
    const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3002';

    // Since reviews are stored by userId in user-service, we need a different approach
    // For now, return mock data or empty array
    // TODO: Implement a proper review aggregation service or add product reviews endpoint to user-service

    logger.info(`Fetching reviews for product: ${productId}`);

    res.json({
      success: true,
      data: [],
      statistics: {
        avgRating: '0.0',
        totalReviews: 0,
        ratingDistribution: [],
      },
      meta: {
        total: 0,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: 0,
      },
      message: 'Product reviews endpoint - implementation pending',
    });
  } catch (error) {
    logger.error('Failed to fetch product reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product reviews' });
  }
});

export default router;

