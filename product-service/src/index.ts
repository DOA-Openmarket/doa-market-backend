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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Initialize event bus
export const eventBus = createEventBus('product-service');

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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Product Service API Docs',
}));

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    await eventBus.connect();
    logger.info('Event bus connected');

    app.listen(PORT, () => logger.info(`Product Service on ${PORT}`));

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

