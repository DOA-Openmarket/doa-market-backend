import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { initializeDatabase } from '@config/database';
import shippingRoutes from '@routes/shipping.routes';
import { errorHandler, notFoundHandler } from '@middlewares/error-handler';
import logger from '@utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3011;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || '*' }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'shipping-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.get('/', (req, res) => {
  res.json({ service: 'shipping-service', version: '1.0.0', status: 'running' });
});

app.use('/api/v1/shipping', shippingRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await initializeDatabase();
    logger.info('Database initialized');
    app.listen(PORT, () => {
      logger.info(`shipping-service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received');
  process.exit(0);
});
