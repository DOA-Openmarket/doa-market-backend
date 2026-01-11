import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import inventoryRoutes from './routes/inventory.routes';
import { sequelize } from './config/database';
import { logger } from './utils/logger';
import { createEventBus, EventType, OrderCreatedEvent, PaymentCompletedEvent } from './events';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3010;

// Initialize Event Bus
export const eventBus = createEventBus('inventory-service');

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  const eventBusStatus = eventBus.getStatus();
  res.json({
    status: 'ok',
    service: 'inventory-service',
    timestamp: new Date().toISOString(),
    eventBus: eventBusStatus,
  });
});

app.use('/api/v1/inventory', inventoryRoutes);

// Event Handlers
const handleOrderCreated = async (event: OrderCreatedEvent) => {
  try {
    logger.info(`Received ORDER_CREATED event for order: ${event.data.orderId}`);

    // Reserve inventory for order items
    for (const item of event.data.items) {
      logger.info(`Reserving ${item.quantity} units of product ${item.productId}`);
      // In real app, reduce stock quantity in database
      // For now, just log
    }

    // Publish INVENTORY_RESERVED event
    await eventBus.publish(EventType.INVENTORY_RESERVED, {
      orderId: event.data.orderId,
      items: event.data.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });

    logger.info(`INVENTORY_RESERVED event published for order: ${event.data.orderId}`);
  } catch (error) {
    logger.error('Error handling ORDER_CREATED event:', error);

    // Publish INVENTORY_RELEASED event if reservation fails
    await eventBus.publish(EventType.INVENTORY_RELEASED, {
      orderId: event.data.orderId,
      items: event.data.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      reason: 'Inventory reservation failed',
    });
  }
};

const handlePaymentCompleted = async (event: PaymentCompletedEvent) => {
  try {
    logger.info(`Received PAYMENT_COMPLETED event for order: ${event.data.orderId}`);

    // Confirm inventory deduction (payment succeeded)
    logger.info(`Confirming inventory deduction for order: ${event.data.orderId}`);
    // In real app, mark inventory as sold in database
  } catch (error) {
    logger.error('Error handling PAYMENT_COMPLETED event:', error);
  }
};

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    logger.info('Database synchronized');

    // Connect to Event Bus
    await eventBus.connect();
    logger.info('Event Bus connected');

    // Subscribe to events
    await eventBus.subscribe(EventType.ORDER_CREATED, handleOrderCreated);
    await eventBus.subscribe(EventType.PAYMENT_COMPLETED, handlePaymentCompleted);
    logger.info('Subscribed to ORDER_CREATED and PAYMENT_COMPLETED events');

    app.listen(PORT, () => logger.info(`Inventory Service on port ${PORT}`));
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

