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

/**
 * Get product reviews
 * This endpoint proxies to review-service to get reviews for a specific product
 * IMPORTANT: Must be defined BEFORE /:id route to avoid route collision
 */
router.get('/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;
    const page = req.query.page || '1';
    const limit = req.query.limit || '20';

    logger.info(`Fetching reviews for product: ${productId}`);

    // Return empty data for now
    // TODO: Integrate with review-service
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
    // Get sellerId from authenticated user (set by API Gateway)
    const sellerId = req.headers['x-user-id'] as string;

    if (!sellerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - sellerId missing'
      });
    }

    // Create product with sellerId from auth
    const productData = {
      ...req.body,
      sellerId,
    };

    const product = await Product.create(productData);

    // Publish product created event (only if RabbitMQ is enabled)
    const rabbitmqEnabled = process.env.RABBITMQ_ENABLED !== 'false';
    if (rabbitmqEnabled) {
      try {
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
      } catch (eventError) {
        logger.warn('Failed to publish product created event (non-critical):', eventError);
      }
    } else {
      logger.info(`Product created (event publishing disabled): ${product.id}`);
    }

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

    // Publish product updated event (only if RabbitMQ is enabled)
    const rabbitmqEnabled = process.env.RABBITMQ_ENABLED !== 'false';
    if (rabbitmqEnabled) {
      try {
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
      } catch (eventError) {
        logger.warn('Failed to publish product updated event (non-critical):', eventError);
      }
    } else {
      logger.info(`Product updated (event publishing disabled): ${product.id}`);
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

    // Publish product deleted event (only if RabbitMQ is enabled)
    const rabbitmqEnabled = process.env.RABBITMQ_ENABLED !== 'false';
    if (rabbitmqEnabled) {
      try {
        await eventBus.publish(EventType.PRODUCT_DELETED, {
          id: product.id,
        });
        logger.info(`Product deleted and event published: ${product.id}`);
      } catch (eventError) {
        logger.warn('Failed to publish product deleted event (non-critical):', eventError);
      }
    } else {
      logger.info(`Product deleted (event publishing disabled): ${product.id}`);
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    logger.error('Failed to delete product:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

export default router;

