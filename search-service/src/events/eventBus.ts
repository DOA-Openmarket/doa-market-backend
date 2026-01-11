import amqp, { Channel, Connection } from 'amqplib';
import { logger } from '../utils/logger';

export enum EventType {
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
}

export interface ProductCreatedEvent {
  eventType: EventType.PRODUCT_CREATED;
  data: {
    id: string;
    name: string;
    description: string;
    price: number;
    categoryId: string;
    sellerId: string;
    stock: number;
    imageUrl?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ProductUpdatedEvent {
  eventType: EventType.PRODUCT_UPDATED;
  data: {
    id: string;
    updates: Partial<ProductCreatedEvent['data']>;
  };
}

export interface ProductDeletedEvent {
  eventType: EventType.PRODUCT_DELETED;
  data: {
    id: string;
  };
}

export type DomainEvent = ProductCreatedEvent | ProductUpdatedEvent | ProductDeletedEvent;

export class EventBus {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly rabbitmqUrl: string;
  private readonly exchange = 'doa-market-events';

  constructor(rabbitmqUrl: string) {
    this.rabbitmqUrl = rabbitmqUrl;
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchange, 'topic', {
        durable: true,
      });

      logger.info('Connected to RabbitMQ');

      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed. Reconnecting...');
        setTimeout(() => this.connect(), 5000);
      });
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async subscribe<T extends DomainEvent>(
    eventType: EventType,
    handler: (event: T) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    const queue = `search-service.${eventType}`;

    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, this.exchange, eventType);

    this.channel.consume(
      queue,
      async (msg) => {
        if (msg) {
          try {
            const event = JSON.parse(msg.content.toString()) as T;
            await handler(event);
            this.channel!.ack(msg);
          } catch (error) {
            logger.error(`Error processing event ${eventType}:`, error);
            this.channel!.nack(msg, false, false);
          }
        }
      },
      { noAck: false }
    );

    logger.info(`Subscribed to ${eventType}`);
  }

  async disconnect(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      logger.info('Disconnected from RabbitMQ');
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }
}
