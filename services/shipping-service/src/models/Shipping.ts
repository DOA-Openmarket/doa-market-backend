import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ShippingStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
}

export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  SAME_DAY = 'same_day',
  PICKUP = 'pickup',
}

@Entity('shippings')
@Index(['orderId'], { unique: true })
@Index(['trackingNumber'])
@Index(['status'])
export class Shipping {
  @PrimaryColumn('uuid')
  shippingId: string;

  @Column({ name: 'order_id', type: 'uuid', unique: true })
  orderId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'tracking_number', type: 'varchar', length: 100, unique: true })
  trackingNumber: string;

  @Column({ name: 'carrier', type: 'varchar', length: 50 })
  carrier: string;

  @Column({ name: 'shipping_method', type: 'enum', enum: ShippingMethod })
  shippingMethod: ShippingMethod;

  @Column({ type: 'enum', enum: ShippingStatus, default: ShippingStatus.PENDING })
  status: ShippingStatus;

  @Column({ name: 'recipient_name', type: 'varchar', length: 100 })
  recipientName: string;

  @Column({ name: 'recipient_phone', type: 'varchar', length: 20 })
  recipientPhone: string;

  @Column({ name: 'address', type: 'text' })
  address: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20 })
  postalCode: string;

  @Column({ name: 'city', type: 'varchar', length: 100 })
  city: string;

  @Column({ name: 'country', type: 'varchar', length: 100, default: 'KR' })
  country: string;

  @Column({ name: 'shipping_cost', type: 'decimal', precision: 10, scale: 2 })
  shippingCost: number;

  @Column({ name: 'estimated_delivery', type: 'timestamp', nullable: true })
  estimatedDelivery: Date | null;

  @Column({ name: 'actual_delivery', type: 'timestamp', nullable: true })
  actualDelivery: Date | null;

  @Column({ name: 'shipped_at', type: 'timestamp', nullable: true })
  shippedAt: Date | null;

  @Column({ name: 'delivery_notes', type: 'text', nullable: true })
  deliveryNotes: string | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true, default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
