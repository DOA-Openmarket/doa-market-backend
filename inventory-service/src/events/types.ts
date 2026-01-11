// Event Types for DOA Market Microservices

export enum EventType {
  // Order Events
  ORDER_CREATED = 'order.created',
  ORDER_CONFIRMED = 'order.confirmed',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_COMPLETED = 'order.completed',

  // Payment Events
  PAYMENT_REQUESTED = 'payment.requested',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Inventory Events
  INVENTORY_RESERVED = 'inventory.reserved',
  INVENTORY_RELEASED = 'inventory.released',
  INVENTORY_DEPLETED = 'inventory.depleted',

  // Shipping Events
  SHIPMENT_CREATED = 'shipment.created',
  SHIPMENT_DISPATCHED = 'shipment.dispatched',
  SHIPMENT_DELIVERED = 'shipment.delivered',

  // Notification Events
  NOTIFICATION_SEND = 'notification.send',
}

// Base Event Interface
export interface BaseEvent {
  eventId: string;
  eventType: EventType;
  timestamp: string;
  version: string;
}

// Order Events
export interface OrderCreatedEvent extends BaseEvent {
  eventType: EventType.ORDER_CREATED;
  data: {
    orderId: string;
    userId: string;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
    shippingAddress: {
      name: string;
      phone: string;
      address: string;
      city: string;
      postalCode: string;
    };
  };
}

export interface OrderConfirmedEvent extends BaseEvent {
  eventType: EventType.ORDER_CONFIRMED;
  data: {
    orderId: string;
    userId: string;
    paymentId: string;
  };
}

export interface OrderCancelledEvent extends BaseEvent {
  eventType: EventType.ORDER_CANCELLED;
  data: {
    orderId: string;
    userId: string;
    reason: string;
  };
}

// Payment Events
export interface PaymentRequestedEvent extends BaseEvent {
  eventType: EventType.PAYMENT_REQUESTED;
  data: {
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
  };
}

export interface PaymentCompletedEvent extends BaseEvent {
  eventType: EventType.PAYMENT_COMPLETED;
  data: {
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    transactionId: string;
  };
}

export interface PaymentFailedEvent extends BaseEvent {
  eventType: EventType.PAYMENT_FAILED;
  data: {
    orderId: string;
    userId: string;
    amount: number;
    reason: string;
    errorCode?: string;
  };
}

// Inventory Events
export interface InventoryReservedEvent extends BaseEvent {
  eventType: EventType.INVENTORY_RESERVED;
  data: {
    orderId: string;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
  };
}

export interface InventoryReleasedEvent extends BaseEvent {
  eventType: EventType.INVENTORY_RELEASED;
  data: {
    orderId: string;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
    reason: string;
  };
}

// Shipment Events
export interface ShipmentCreatedEvent extends BaseEvent {
  eventType: EventType.SHIPMENT_CREATED;
  data: {
    shipmentId: string;
    orderId: string;
    trackingNumber: string;
    carrier: string;
  };
}

// Notification Events
export interface NotificationSendEvent extends BaseEvent {
  eventType: EventType.NOTIFICATION_SEND;
  data: {
    userId: string;
    type: 'email' | 'sms' | 'push';
    template: string;
    params: Record<string, any>;
  };
}

// Union type for all events
export type DomainEvent =
  | OrderCreatedEvent
  | OrderConfirmedEvent
  | OrderCancelledEvent
  | PaymentRequestedEvent
  | PaymentCompletedEvent
  | PaymentFailedEvent
  | InventoryReservedEvent
  | InventoryReleasedEvent
  | ShipmentCreatedEvent
  | NotificationSendEvent;
