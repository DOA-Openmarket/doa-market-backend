import 'reflect-metadata';
import express from 'express';
import { AppDataSource } from '@config/database';
import inquiryRoutes from '@routes/inquiry.routes';
import { errorHandler } from '@middlewares/error-handler';
import logger from '@utils/logger';

const app = express();
const PORT = process.env.PORT || 3017;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'inquiry-service' });
});

// Routes
app.use('/api/v1/inquiries', inquiryRoutes);

// Error handler
app.use(errorHandler);

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    logger.info('Database connected successfully');

    app.listen(PORT, () => {
      logger.info(`Inquiry service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Database connection failed:', error);
    process.exit(1);
  });

export default app;

