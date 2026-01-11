import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { initializeDatabase } from '@config/database';
import sellerRoutes from '@routes/seller.routes';
import { errorHandler, notFoundHandler } from '@middlewares/error-handler';
import logger from '@utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || '*' }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: process.env.SERVICE_NAME || 'seller-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: process.env.SERVICE_NAME || 'seller-service',
    version: '1.0.0',
    status: 'running',
  });
});

// Routes
app.use('/api/v1/sellers', sellerRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized');

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`${process.env.SERVICE_NAME || 'seller-service'} running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
