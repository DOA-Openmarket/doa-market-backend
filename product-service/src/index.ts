import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import { sequelize } from './config/database';
import { logger } from './utils/logger';
import { swaggerSpec } from './config/swagger';
import { createEventBus } from './events/eventBus';
import { createMetricsService } from '@doa-market/common';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Initialize event bus
export const eventBus = createEventBus('product-service');

// Initialize metrics
const metrics = createMetricsService('product-service');

// Apply metrics middleware early (before other middleware)
app.use(metrics.metricsMiddleware());

app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow all localhost origins in development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    // Allow specific origins
    const allowedOrigins = ['http://localhost:8081', 'http://localhost:8080', 'http://localhost:3000', 'http://localhost:5173'];
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'product-service', timestamp: new Date().toISOString() });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', metrics.getContentType());
  res.end(await metrics.getMetrics());
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Product Service API Docs',
}));

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);

const startServer = async () => {
  try {
    // Sync database models (create tables if they don't exist, but don't alter existing ones)
    await sequelize.sync();

    // Only connect to RabbitMQ if enabled
    const rabbitmqEnabled = process.env.RABBITMQ_ENABLED !== 'false';
    if (rabbitmqEnabled) {
      await eventBus.connect();
      logger.info('Event bus connected');
    } else {
      logger.info('RabbitMQ is disabled, running without event bus');
    }

    app.listen(PORT, () => logger.info(`Product Service on ${PORT}`));

    // Update DB connection pool metrics periodically
    setInterval(() => {
      try {
        if (sequelize.connectionManager && sequelize.connectionManager.pool) {
          const pool = sequelize.connectionManager.pool;
          const activeConnections = pool.size - pool.available;
          metrics.updateDbPoolMetrics('postgres', activeConnections);
        }
      } catch (error) {
        // Silently ignore errors in metrics collection
      }
    }, 10000); // Update every 10 seconds

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      if (rabbitmqEnabled) {
        await eventBus.disconnect();
      }
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
export default app;

