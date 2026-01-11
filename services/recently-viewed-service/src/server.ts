import 'reflect-metadata';
import express from 'express';
import { AppDataSource } from '@config/database';
import recentlyViewedRoutes from '@routes/recently-viewed.routes';
import { errorHandler } from '@middlewares/error-handler';
import logger from '@utils/logger';

const app = express();
const PORT = process.env.PORT || 3018;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'recently-viewed-service' });
});

// Routes
app.use('/api/v1/recently-viewed', recentlyViewedRoutes);

// Error handler
app.use(errorHandler);

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    logger.info('Database connected successfully');

    app.listen(PORT, () => {
      logger.info(`Recently viewed service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Database connection failed:', error);
    process.exit(1);
  });

export default app;

