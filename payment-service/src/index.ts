import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import paymentRoutes from './routes/payment.routes';
import { sequelize } from './config/database';
import { logger } from './utils/logger';
import { swaggerSpec } from './config/swagger';
import { createEventBus, EventType, OrderCreatedEvent } from './events';
import Payment from './models/payment.model';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Initialize Event Bus
export const eventBus = createEventBus('payment-service');

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:8080', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());

app.get('/health', (req, res) => {
  const eventBusStatus = eventBus.getStatus();
  res.json({
    status: 'ok',
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    eventBus: eventBusStatus,
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1/payments', paymentRoutes);

// Event Handlers
const handleOrderCreated = async (event: OrderCreatedEvent) => {
  try {
    logger.info(`Received ORDER_CREATED event for order: ${event.data.orderId}`);

    // Create payment request
    const payment = await Payment.create({
      orderId: event.data.orderId,
      userId: event.data.userId,
      amount: event.data.totalAmount,
      status: 'pending',
      method: 'card', // Default
    });

    logger.info(`Payment record created: ${payment.id} for order: ${event.data.orderId}`);

    // Simulate payment processing (in real app, call PG API)
    setTimeout(async () => {
      try {
        // Simulate successful payment
        payment.status = 'completed';
        payment.transactionId = `TXN-${Date.now()}`;
        await payment.save();

        // Publish PAYMENT_COMPLETED event
        await eventBus.publish(EventType.PAYMENT_COMPLETED, {
          paymentId: payment.id,
          orderId: payment.orderId,
          userId: payment.userId,
          amount: parseFloat(payment.amount.toString()),
          transactionId: payment.transactionId!,
        });

        logger.info(`PAYMENT_COMPLETED event published for payment: ${payment.id}`);
      } catch (error) {
        logger.error('Error completing payment:', error);

        // Publish PAYMENT_FAILED event
        await eventBus.publish(EventType.PAYMENT_FAILED, {
          orderId: payment.orderId,
          userId: payment.userId,
          amount: parseFloat(payment.amount.toString()),
          reason: 'Payment processing failed',
        });
      }
    }, 2000); // 2 second delay

  } catch (error) {
    logger.error('Error handling ORDER_CREATED event:', error);
  }
};

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    logger.info('Database synchronized');

    // Connect to Event Bus
    await eventBus.connect();
    logger.info('Event Bus connected');

    // Wait a bit for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Subscribe to events
    await eventBus.subscribe(EventType.ORDER_CREATED, handleOrderCreated);
    logger.info('Subscribed to ORDER_CREATED event');

    app.listen(PORT, () => logger.info(`Payment Service on port ${PORT}`));
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

