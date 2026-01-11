import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { v4 as uuidv4 } from 'uuid';
import { EventType, BaseEvent } from '@/types';
import { logger } from '@utils/logger';

const eventBridgeClient = new EventBridgeClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

const EVENT_BUS_NAME = process.env.EVENTBRIDGE_BUS_NAME || 'doa-market-event-bus';
const SERVICE_NAME = process.env.SERVICE_NAME || 'product-service';

export class EventPublisher {
  private async publishEvent(eventType: EventType, data: any, userId?: string): Promise<void> {
    try {
      const event: BaseEvent = {
        eventId: uuidv4(),
        eventType,
        eventVersion: 'v1',
        timestamp: new Date().toISOString(),
        source: SERVICE_NAME,
        correlationId: uuidv4(),
        userId,
        metadata: {
          traceId: uuidv4(),
          environment: process.env.NODE_ENV || 'development',
        },
        data,
      };

      const command = new PutEventsCommand({
        Entries: [
          {
            EventBusName: EVENT_BUS_NAME,
            Source: SERVICE_NAME,
            DetailType: eventType,
            Detail: JSON.stringify(event),
          },
        ],
      });

      const response = await eventBridgeClient.send(command);

      if (response.FailedEntryCount && response.FailedEntryCount > 0) {
        logger.error('Failed to publish event:', {
          eventType,
          failedEntries: response.Entries,
        });
        throw new Error('Failed to publish event to EventBridge');
      }

      logger.info('Event published successfully:', {
        eventId: event.eventId,
        eventType,
        correlationId: event.correlationId,
      });
    } catch (error) {
      logger.error('Error publishing event:', {
        eventType,
        data,
        error,
      });
      throw error;
    }
  }

  async publishProductCreated(data: {
    productId: string;
    sellerId: string;
    categoryId: string;
    name: string;
    price: number;
    userId: string;
  }): Promise<void> {
    await this.publishEvent(EventType.PRODUCT_CREATED, data, data.userId);
  }

  async publishProductUpdated(data: {
    productId: string;
    sellerId: string;
    changes: any;
    userId: string;
  }): Promise<void> {
    await this.publishEvent(EventType.PRODUCT_UPDATED, data, data.userId);
  }

  async publishProductDeleted(data: {
    productId: string;
    sellerId: string;
    userId: string;
  }): Promise<void> {
    await this.publishEvent(EventType.PRODUCT_DELETED, data, data.userId);
  }

  async publishProductStatusChanged(data: {
    productId: string;
    sellerId: string;
    oldStatus: string;
    newStatus: string;
    userId: string;
  }): Promise<void> {
    await this.publishEvent(EventType.PRODUCT_STATUS_CHANGED, data, data.userId);
  }

  async publishProductStockUpdated(data: {
    productId: string;
    variantId?: string;
    oldStock: number;
    newStock: number;
    reason: string;
    userId?: string;
  }): Promise<void> {
    await this.publishEvent(EventType.PRODUCT_STOCK_UPDATED, data, data.userId);
  }
}

export const eventPublisher = new EventPublisher();
