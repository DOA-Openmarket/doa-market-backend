export interface BaseEvent {
  eventId: string;
  eventType: string;
  eventVersion: string;
  timestamp: string;
  source: string;
  correlationId: string;
  userId?: string;
  metadata: {
    traceId: string;
    environment: string;
  };
  data: any;
}

export enum EventTypes {
  // Product events
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_STATUS_CHANGED = 'product.status_changed',
  PRODUCT_STOCK_UPDATED = 'product.stock_updated',

  // Order events
  ORDER_CREATED = 'order.created',
  ORDER_CONFIRMED = 'order.confirmed',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_COMPLETED = 'order.completed',
  ORDER_REFUNDED = 'order.refunded',

  // Payment events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Shipping events
  SHIPPING_PREPARED = 'shipping.prepared',
  SHIPPING_DISPATCHED = 'shipping.dispatched',
  SHIPPING_IN_TRANSIT = 'shipping.in_transit',
  SHIPPING_DELIVERED = 'shipping.delivered',

  // Inventory events
  INVENTORY_RESERVED = 'inventory.reserved',
  INVENTORY_RELEASED = 'inventory.released',
  INVENTORY_ADJUSTED = 'inventory.adjusted',

  // User events
  USER_REGISTERED = 'user.registered',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
}
