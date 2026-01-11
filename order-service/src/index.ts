import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import orderRoutes from './routes/order.routes';
import partnerCancellationRoutes from './routes/partner-cancellation.routes';
import partnerReturnRoutes from './routes/partner-return.routes';
import { sequelize } from './config/database';
import { logger } from './utils/logger';
import { swaggerSpec } from './config/swagger';
import { createEventBus } from './events';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Initialize Event Bus
export const eventBus = createEventBus('order-service');

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  const eventBusStatus = eventBus.getStatus();
  res.json({
    status: 'ok',
    service: 'order-service',
    timestamp: new Date().toISOString(),
    eventBus: eventBusStatus,
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Order Service API Docs',
}));

app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/partner/cancellations', partnerCancellationRoutes);
app.use('/api/v1/partner/returns', partnerReturnRoutes);

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    logger.info('Database synchronized');

    // Connect to Event Bus
    await eventBus.connect();
    logger.info('Event Bus connected');

    app.listen(PORT, () => logger.info(`Order Service on ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await eventBus.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await eventBus.disconnect();
  process.exit(0);
});

startServer();
export default app;

