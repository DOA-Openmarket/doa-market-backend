import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';
import { EventType, DomainEvent, BaseEvent } from './types';
import { v4 as uuidv4 } from 'uuid';

export interface EventBusConfig {
  url: string;
  exchange: string;
  serviceName: string;
}

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void>;

export class EventBus {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private config: EventBusConfig;
  private handlers: Map<EventType, EventHandler[]> = new Map();
  private isConnected = false;

  constructor(config: EventBusConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      console.log(`[EventBus] Connecting to RabbitMQ at ${this.config.url}...`);
      this.connection = await amqp.connect(this.config.url);
      this.channel = await this.connection.createChannel();

      // Assert exchange (topic type for flexible routing)
      await this.channel.assertExchange(this.config.exchange, 'topic', {
        durable: true,
      });

      this.isConnected = true;
      console.log(`[EventBus] Connected to RabbitMQ exchange: ${this.config.exchange}`);

      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('[EventBus] Connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        console.log('[EventBus] Connection closed');
        this.isConnected = false;
        // Attempt reconnection
        setTimeout(() => this.connect(), 5000);
      });
    } catch (error) {
      console.error('[EventBus] Failed to connect:', error);
      // Retry connection
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publish<T extends DomainEvent>(eventType: EventType, data: T['data']): Promise<void> {
    if (!this.channel || !this.isConnected) {
      throw new Error('EventBus is not connected');
    }

    const event: BaseEvent & { data: T['data'] } = {
      eventId: uuidv4(),
      eventType,
      timestamp: new Date().toISOString(),
      version: '1.0',
      data,
    };

    try {
      const message = Buffer.from(JSON.stringify(event));
      const routingKey = eventType; // Use event type as routing key

      this.channel.publish(this.config.exchange, routingKey, message, {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
      });

      console.log(`[EventBus] Published event: ${eventType}`, {
        eventId: event.eventId,
      });
    } catch (error) {
      console.error(`[EventBus] Failed to publish event: ${eventType}`, error);
      throw error;
    }
  }

  async subscribe<T extends DomainEvent>(
    eventType: EventType,
    handler: EventHandler<T>
  ): Promise<void> {
    if (!this.channel || !this.isConnected) {
      throw new Error('EventBus is not connected');
    }

    // Store handler
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as EventHandler);

    // Create queue for this service and event type
    const queueName = `${this.config.serviceName}.${eventType}`;
    const queue = await this.channel.assertQueue(queueName, {
      durable: true,
    });

    // Bind queue to exchange with routing key = event type
    await this.channel.bindQueue(queue.queue, this.config.exchange, eventType);

    // Consume messages
    await this.channel.consume(
      queue.queue,
      async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        try {
          const event = JSON.parse(msg.content.toString()) as T;
          console.log(`[EventBus] Received event: ${eventType}`, {
            eventId: event.eventId,
          });

          // Execute all handlers for this event type
          const eventHandlers = this.handlers.get(eventType) || [];
          await Promise.all(eventHandlers.map((h) => h(event)));

          // Acknowledge message
          this.channel!.ack(msg);
        } catch (error) {
          console.error(`[EventBus] Error processing event: ${eventType}`, error);
          // Reject and requeue on error
          this.channel!.nack(msg, false, true);
        }
      },
      { noAck: false }
    );

    console.log(`[EventBus] Subscribed to event: ${eventType} on queue: ${queueName}`);
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      console.log('[EventBus] Disconnected from RabbitMQ');
    } catch (error) {
      console.error('[EventBus] Error disconnecting:', error);
    }
  }

  getStatus(): { connected: boolean; exchange: string; serviceName: string } {
    return {
      connected: this.isConnected,
      exchange: this.config.exchange,
      serviceName: this.config.serviceName,
    };
  }
}

// Factory function to create EventBus instance
export function createEventBus(serviceName: string): EventBus {
  const config: EventBusConfig = {
    url: process.env.RABBITMQ_URL || 'amqp://rabbitmq:rabbitmq123@localhost:5672/doa-market',
    exchange: 'doa-market-events',
    serviceName,
  };

  return new EventBus(config);
}
