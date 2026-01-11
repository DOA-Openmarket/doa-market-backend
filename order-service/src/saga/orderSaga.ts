import { EventBus, EventType, PaymentCompletedEvent, PaymentFailedEvent, InventoryReservedEvent, InventoryReleasedEvent } from '../events';
import Order from '../models/order.model';
import { logger } from '../utils/logger';

export enum SagaState {
  STARTED = 'started',
  INVENTORY_RESERVED = 'inventory_reserved',
  PAYMENT_COMPLETED = 'payment_completed',
  COMPLETED = 'completed',
  FAILED = 'failed',
  COMPENSATING = 'compensating',
  COMPENSATED = 'compensated',
}

export interface SagaStep {
  name: string;
  execute: () => Promise<void>;
  compensate: () => Promise<void>;
}

export class OrderSaga {
  private orderId: string;
  private state: SagaState;
  private eventBus: EventBus;
  private completedSteps: string[] = [];

  constructor(orderId: string, eventBus: EventBus) {
    this.orderId = orderId;
    this.state = SagaState.STARTED;
    this.eventBus = eventBus;
  }

  async start(): Promise<void> {
    logger.info(`[OrderSaga] Starting saga for order: ${this.orderId}`);

    try {
      // Step 1: Order is already created
      this.completedSteps.push('order_created');

      // Step 2: Wait for inventory reservation
      await this.waitForInventoryReservation();

      // Step 3: Wait for payment completion
      await this.waitForPaymentCompletion();

      // Step 4: Finalize order
      await this.finalizeOrder();

      this.state = SagaState.COMPLETED;
      logger.info(`[OrderSaga] Saga completed for order: ${this.orderId}`);
    } catch (error) {
      logger.error(`[OrderSaga] Saga failed for order: ${this.orderId}`, error);
      await this.compensate();
    }
  }

  private async waitForInventoryReservation(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Inventory reservation timeout'));
      }, 30000); // 30 seconds timeout

      const handleInventoryReserved = async (event: InventoryReservedEvent) => {
        if (event.data.orderId === this.orderId) {
          clearTimeout(timeout);
          this.state = SagaState.INVENTORY_RESERVED;
          this.completedSteps.push('inventory_reserved');
          logger.info(`[OrderSaga] Inventory reserved for order: ${this.orderId}`);
          resolve();
        }
      };

      const handleInventoryReleased = async (event: InventoryReleasedEvent) => {
        if (event.data.orderId === this.orderId) {
          clearTimeout(timeout);
          logger.error(`[OrderSaga] Inventory reservation failed for order: ${this.orderId}`);
          reject(new Error(`Inventory reservation failed: ${event.data.reason}`));
        }
      };

      this.eventBus.subscribe(EventType.INVENTORY_RESERVED, handleInventoryReserved);
      this.eventBus.subscribe(EventType.INVENTORY_RELEASED, handleInventoryReleased);
    });
  }

  private async waitForPaymentCompletion(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Payment completion timeout'));
      }, 60000); // 60 seconds timeout

      const handlePaymentCompleted = async (event: PaymentCompletedEvent) => {
        if (event.data.orderId === this.orderId) {
          clearTimeout(timeout);
          this.state = SagaState.PAYMENT_COMPLETED;
          this.completedSteps.push('payment_completed');
          logger.info(`[OrderSaga] Payment completed for order: ${this.orderId}`);
          resolve();
        }
      };

      const handlePaymentFailed = async (event: PaymentFailedEvent) => {
        if (event.data.orderId === this.orderId) {
          clearTimeout(timeout);
          logger.error(`[OrderSaga] Payment failed for order: ${this.orderId}`);
          reject(new Error(`Payment failed: ${event.data.reason}`));
        }
      };

      this.eventBus.subscribe(EventType.PAYMENT_COMPLETED, handlePaymentCompleted);
      this.eventBus.subscribe(EventType.PAYMENT_FAILED, handlePaymentFailed);
    });
  }

  private async finalizeOrder(): Promise<void> {
    const order = await Order.findByPk(this.orderId);
    if (order) {
      order.status = 'confirmed';
      order.paymentStatus = 'completed';
      await order.save();

      // Publish ORDER_CONFIRMED event
      await this.eventBus.publish(EventType.ORDER_CONFIRMED, {
        orderId: this.orderId,
        userId: order.userId,
        paymentId: 'payment-id', // Should be tracked in saga
      });

      logger.info(`[OrderSaga] Order finalized: ${this.orderId}`);
    }
  }

  private async compensate(): Promise<void> {
    logger.info(`[OrderSaga] Starting compensation for order: ${this.orderId}`);
    this.state = SagaState.COMPENSATING;

    try {
      // Compensate in reverse order
      if (this.completedSteps.includes('payment_completed')) {
        await this.compensatePayment();
      }

      if (this.completedSteps.includes('inventory_reserved')) {
        await this.compensateInventory();
      }

      if (this.completedSteps.includes('order_created')) {
        await this.compensateOrder();
      }

      this.state = SagaState.COMPENSATED;
      logger.info(`[OrderSaga] Compensation completed for order: ${this.orderId}`);
    } catch (error) {
      logger.error(`[OrderSaga] Compensation failed for order: ${this.orderId}`, error);
      this.state = SagaState.FAILED;
    }
  }

  private async compensatePayment(): Promise<void> {
    logger.info(`[OrderSaga] Compensating payment for order: ${this.orderId}`);
    // In real implementation, trigger payment refund via event or API call
    // For now, just log
  }

  private async compensateInventory(): Promise<void> {
    logger.info(`[OrderSaga] Compensating inventory for order: ${this.orderId}`);
    // Inventory service should handle INVENTORY_RELEASED event to restore stock
  }

  private async compensateOrder(): Promise<void> {
    logger.info(`[OrderSaga] Compensating order: ${this.orderId}`);
    const order = await Order.findByPk(this.orderId);
    if (order) {
      order.status = 'cancelled';
      await order.save();

      await this.eventBus.publish(EventType.ORDER_CANCELLED, {
        orderId: this.orderId,
        userId: order.userId,
        reason: 'Saga compensation - payment or inventory failed',
      });
    }
  }

  getState(): SagaState {
    return this.state;
  }
}
