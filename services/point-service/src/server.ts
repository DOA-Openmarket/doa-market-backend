import 'reflect-metadata';
import express from 'express';
import { AppDataSource } from '@config/database';
import pointRoutes from '@routes/point.routes';
import { errorHandler } from '@middlewares/error-handler';
import logger from '@utils/logger';

const app = express();
const PORT = process.env.PORT || 3016;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'point-service' });
});

// Routes
app.use('/api/v1/points', pointRoutes);

// Error handler
app.use(errorHandler);

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    logger.info('Database connected successfully');

    app.listen(PORT, () => {
      logger.info(`Point service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Database connection failed:', error);
    process.exit(1);
  });

export default app;

