import { config } from 'dotenv';
config();

import app from './app';
import { initializeDatabase, closeDatabase } from '@config/database';
import { initializeOpenSearch } from '@config/opensearch';
import { redisClient } from '@config/redis';
import { logger } from '@utils/logger';

const PORT = process.env.PORT || 3003;
const SERVICE_NAME = process.env.SERVICE_NAME || 'product-service';

let server: any;

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // Initialize OpenSearch
    await initializeOpenSearch();
    logger.info('OpenSearch initialized successfully');

    // Test Redis connection
    await redisClient.ping();
    logger.info('Redis connected successfully');

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info(`${SERVICE_NAME} is running on port ${PORT}`, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV,
        pid: process.pid,
      });
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          logger.error(`Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    // Close database connection
    await closeDatabase();

    // Close Redis connection
    await redisClient.quit();
    logger.info('Redis connection closed');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection:', { reason, promise });
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();
