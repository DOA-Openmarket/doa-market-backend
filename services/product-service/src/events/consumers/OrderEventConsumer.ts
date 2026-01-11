import { productRepository } from '@repositories/ProductRepository';
import { eventPublisher } from '@events/publishers/EventPublisher';
import { logger } from '@utils/logger';

/**
 * Consumes order-related events to update product stock
 * Typically triggered by SQS messages from EventBridge
 */

export class OrderEventConsumer {
  /**
   * Handle order.created event
   * Decrease product stock when order is created
   */
  async handleOrderCreated(event: any): Promise<void> {
    try {
      const { orderId, items } = event.detail.data;

      logger.info('Processing order.created event:', { orderId });

      for (const item of items) {
        const { productId, variantId, quantity } = item;

        // Get current product
        const product = await productRepository.findById(productId);
        if (!product) {
          logger.warn('Product not found for stock update:', { productId, orderId });
          continue;
        }

        const oldStock = product.stockQuantity;
        const newStock = oldStock - quantity;

        // Update stock (decrease)
        await productRepository.updateStock(productId, -quantity);

        // Publish stock updated event
        await eventPublisher.publishProductStockUpdated({
          productId,
          variantId,
          oldStock,
          newStock,
          reason: `Order created: ${orderId}`,
        });

        // Check if out of stock
        if (newStock <= 0) {
          await productRepository.update(productId, { status: 'out_of_stock' });
          logger.warn('Product out of stock:', { productId });
        }

        logger.info('Product stock decreased:', {
          productId,
          orderId,
          quantity,
          oldStock,
          newStock,
        });
      }
    } catch (error) {
      logger.error('Error handling order.created event:', { event, error });
      throw error;
    }
  }

  /**
   * Handle order.cancelled event
   * Restore product stock when order is cancelled
   */
  async handleOrderCancelled(event: any): Promise<void> {
    try {
      const { orderId, items } = event.detail.data;

      logger.info('Processing order.cancelled event:', { orderId });

      for (const item of items) {
        const { productId, variantId, quantity } = item;

        // Get current product
        const product = await productRepository.findById(productId);
        if (!product) {
          logger.warn('Product not found for stock restoration:', { productId, orderId });
          continue;
        }

        const oldStock = product.stockQuantity;
        const newStock = oldStock + quantity;

        // Update stock (increase)
        await productRepository.updateStock(productId, quantity);

        // Publish stock updated event
        await eventPublisher.publishProductStockUpdated({
          productId,
          variantId,
          oldStock,
          newStock,
          reason: `Order cancelled: ${orderId}`,
        });

        // Restore to active if was out of stock
        if (product.status === 'out_of_stock' && newStock > 0) {
          await productRepository.update(productId, { status: 'active' });
          logger.info('Product status restored to active:', { productId });
        }

        logger.info('Product stock restored:', {
          productId,
          orderId,
          quantity,
          oldStock,
          newStock,
        });
      }
    } catch (error) {
      logger.error('Error handling order.cancelled event:', { event, error });
      throw error;
    }
  }

  /**
   * Handle order.completed event
   * Update product sales count
   */
  async handleOrderCompleted(event: any): Promise<void> {
    try {
      const { orderId, items } = event.detail.data;

      logger.info('Processing order.completed event:', { orderId });

      for (const item of items) {
        const { productId, quantity } = item;

        await productRepository.incrementSalesCount(productId, quantity);

        logger.info('Product sales count updated:', {
          productId,
          orderId,
          quantity,
        });
      }
    } catch (error) {
      logger.error('Error handling order.completed event:', { event, error });
      throw error;
    }
  }
}

export const orderEventConsumer = new OrderEventConsumer();
