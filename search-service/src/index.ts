import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import searchRoutes from './routes/search.routes';
import { logger } from './utils/logger';
import { createProductsIndex, indexProduct, updateProduct, deleteProduct } from './config/opensearch.config';
import { EventBus, EventType, ProductCreatedEvent, ProductUpdatedEvent, ProductDeletedEvent } from './events/eventBus';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3013;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:rabbitmq123@rabbitmq:5672/doa-market';

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'search-service', timestamp: new Date().toISOString() });
});

app.use('/api/v1/search', searchRoutes);

const startServer = async () => {
  try {
    // Initialize OpenSearch index
    await createProductsIndex();
    logger.info('OpenSearch index initialized');

    // Initialize event bus
    const eventBus = new EventBus(RABBITMQ_URL);
    await eventBus.connect();

    // Subscribe to product events
    await eventBus.subscribe<ProductCreatedEvent>(
      EventType.PRODUCT_CREATED,
      async (event) => {
        try {
          logger.info(`Indexing product: ${event.data.id}`);
          await indexProduct({
            id: event.data.id,
            name: event.data.name,
            description: event.data.description,
            price: event.data.price,
            categoryId: event.data.categoryId,
            sellerId: event.data.sellerId,
            stock: event.data.stock,
            imageUrl: event.data.imageUrl,
            status: event.data.status,
            createdAt: event.data.createdAt,
            updatedAt: event.data.updatedAt,
          });
        } catch (error) {
          logger.error('Failed to index product:', error);
        }
      }
    );

    await eventBus.subscribe<ProductUpdatedEvent>(
      EventType.PRODUCT_UPDATED,
      async (event) => {
        try {
          logger.info(`Updating product index: ${event.data.id}`);
          await updateProduct(event.data.id, event.data.updates);
        } catch (error) {
          logger.error('Failed to update product index:', error);
        }
      }
    );

    await eventBus.subscribe<ProductDeletedEvent>(
      EventType.PRODUCT_DELETED,
      async (event) => {
        try {
          logger.info(`Deleting product from index: ${event.data.id}`);
          await deleteProduct(event.data.id);
        } catch (error) {
          logger.error('Failed to delete product from index:', error);
        }
      }
    );

    app.listen(PORT, () => logger.info(`Search Service on port ${PORT}`));

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await eventBus.disconnect();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

